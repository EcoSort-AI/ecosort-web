import database from "infra/database.js";

async function getMetrics() {
  const [
    kpisResult,
    topBinResult,
    topCategoryResult,
    volumeResult,
    categoriesResult,
    binsMetricsResult,
    recentResult,
  ] = await Promise.all([
    database.query(`
      SELECT 
        COUNT(*)::int AS total_detections,
        COALESCE(AVG(confidence), 0)::float AS average_confidence,
        COUNT(*) FILTER (WHERE review_status = 'pending' AND image_path IS NOT NULL)::int AS pending_reviews
      FROM trash_detections;
    `),

    database.query(`
      SELECT bin_id, COUNT(*)::int as count 
      FROM trash_detections 
      GROUP BY bin_id ORDER BY count DESC LIMIT 1;
    `),

    database.query(`
      SELECT item_class, COUNT(*)::int as count 
      FROM trash_detections 
      GROUP BY item_class ORDER BY count DESC LIMIT 1;
    `),

    database.query(`
      SELECT TO_CHAR(detected_at, 'MM/DD') as date, COUNT(*)::int as detections
      FROM trash_detections
      WHERE detected_at >= NOW() - INTERVAL '30 days'
      GROUP BY TO_CHAR(detected_at, 'MM/DD'), DATE(detected_at)
      ORDER BY DATE(detected_at) ASC;
    `),

    database.query(`
      SELECT item_class as category, COUNT(*)::int as count
      FROM trash_detections
      GROUP BY item_class
      ORDER BY count DESC;
    `),

    database.query(`
      SELECT 
        bin_id, 
        COUNT(*)::int as total, 
        COALESCE(AVG(confidence), 0)::float as avg_confidence,
        MODE() WITHIN GROUP (ORDER BY item_class) as top_category
      FROM trash_detections
      GROUP BY bin_id;
    `),

    database.query(`
      SELECT id, bin_id, item_class, confidence, detected_at
      FROM trash_detections
      ORDER BY detected_at DESC
      LIMIT 5;
    `),
  ]);

  const kpis = kpisResult.rows[0];

  return {
    kpis: {
      totalDetections: kpis.total_detections,
      averageConfidence: (kpis.average_confidence * 100).toFixed(1),
      mostActiveBin:
        topBinResult.rows.length > 0 ? topBinResult.rows[0].bin_id : "Nenhuma",
      topCategory:
        topCategoryResult.rows.length > 0
          ? topCategoryResult.rows[0].item_class
          : "Nenhum",
      pendingReviews: kpis.pending_reviews,
    },
    volumeOverTime: volumeResult.rows,
    categories: categoriesResult.rows,
    binMetrics: binsMetricsResult.rows,
    recentDetections: recentResult.rows,
  };
}

const dashboard = {
  getMetrics,
};

export default dashboard;
