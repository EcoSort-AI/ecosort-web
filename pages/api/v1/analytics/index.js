import database from "infra/database.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método não permitido." });
  }

  try {
    const { version } = req.query;

    const versionsResult = await database.query(`
      SELECT DISTINCT model_version 
      FROM trash_detections 
      WHERE model_version IS NOT NULL 
      ORDER BY model_version DESC;
    `);
    const availableVersions = versionsResult.rows.map((r) => r.model_version);

    let queryText = `
      SELECT 
        item_class as real, 
        ai_prediction as previsto, 
        COUNT(*)::int as count 
      FROM trash_detections 
      WHERE ai_prediction IS NOT NULL 
        AND item_class IS NOT NULL
        AND reviewed_at IS NOT NULL
        AND review_status IN ('approved', 'corrected')
    `;
    const values = [];

    if (version && version !== "all") {
      queryText += ` AND model_version = $1`;
      values.push(version);
    }

    queryText += ` GROUP BY item_class, ai_prediction;`;

    const result = await database.query({ text: queryText, values });
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(200).json({
        availableVersions,
        globalAccuracy: null,
        totalReviewed: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        metricsByClass: [],
        confusionMatrix: [],
      });
    }

    let totalReviewed = 0;
    let totalCorrect = 0;
    const classMetrics = {};

    rows.forEach((row) => {
      if (!classMetrics[row.real])
        classMetrics[row.real] = {
          truePositives: 0,
          actualTotal: 0,
          predictedTotal: 0,
        };
      if (!classMetrics[row.previsto])
        classMetrics[row.previsto] = {
          truePositives: 0,
          actualTotal: 0,
          predictedTotal: 0,
        };
    });

    const confusionMatrix = rows.map((row) => {
      const real = row.real;
      const previsto = row.previsto;
      const count = parseInt(row.count, 10);

      totalReviewed += count;

      if (real === previsto) {
        totalCorrect += count;
        classMetrics[real].truePositives += count;
      }

      classMetrics[real].actualTotal += count; // Recall Denominator (FN + TP)
      classMetrics[previsto].predictedTotal += count; // Precision Denominator (FP + TP)

      return { real, previsto, count };
    });

    const totalIncorrect = totalReviewed - totalCorrect;
    const globalAccuracy =
      totalReviewed > 0
        ? Number(((totalCorrect / totalReviewed) * 100).toFixed(1))
        : 0;

    const metricsByClass = Object.keys(classMetrics).map((className) => {
      const stats = classMetrics[className];

      const precision =
        stats.predictedTotal > 0
          ? (stats.truePositives / stats.predictedTotal) * 100
          : 0;
      const recall =
        stats.actualTotal > 0
          ? (stats.truePositives / stats.actualTotal) * 100
          : 0;

      // F1-Score
      const f1Score =
        precision + recall > 0
          ? 2 * ((precision * recall) / (precision + recall))
          : 0;

      return {
        category: className,
        precision: Number(precision.toFixed(1)),
        recall: Number(recall.toFixed(1)),
        f1Score: Number(f1Score.toFixed(1)),
        actualTotal: stats.actualTotal,
        predictedTotal: stats.predictedTotal,
        hasSamples: stats.actualTotal > 0 || stats.predictedTotal > 0,
      };
    });

    return res.status(200).json({
      availableVersions,
      globalAccuracy,
      totalReviewed,
      totalCorrect,
      totalIncorrect,
      metricsByClass,
      confusionMatrix,
    });
  } catch (error) {
    console.error("Erro ao gerar analytics:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
}
