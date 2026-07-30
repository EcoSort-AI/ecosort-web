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
    const availableVersions = versionsResult.rows.map(r => r.model_version);

    let queryText = `
      SELECT 
        item_class as real, 
        ai_prediction as previsto, 
        COUNT(*)::int as count 
      FROM trash_detections 
      WHERE ai_prediction IS NOT NULL AND item_class IS NOT NULL
    `;
    const values = [];

    if (version && version !== 'all') {
      queryText += ` AND model_version = $1`;
      values.push(version);
    }

    queryText += ` GROUP BY item_class, ai_prediction;`;

    const result = await database.query({ text: queryText, values });
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(200).json({
        availableVersions,
        globalAccuracy: 0,
        totalReviewed: 0,
        accuracyByClass: [],
        confusionMatrix: [],
      });
    }

    let totalReviewed = 0;
    let totalCorrect = 0;
    const classStats = {};

    const confusionMatrix = rows.map((row) => {
      const real = row.real || "desconhecido";
      const previsto = row.previsto || "desconhecido";
      const count = parseInt(row.count, 10);

      totalReviewed += count;

      if (real === previsto) {
        totalCorrect += count;
      }

      if (!classStats[real]) {
        classStats[real] = { total: 0, correct: 0 };
      }
      classStats[real].total += count;
      
      if (real === previsto) {
        classStats[real].correct += count;
      }

      return { real, previsto, count };
    });

    const globalAccuracy =
      totalReviewed > 0
        ? Number(((totalCorrect / totalReviewed) * 100).toFixed(1))
        : 0;

    const accuracyByClass = Object.keys(classStats).map((className) => {
      const stats = classStats[className];
      return {
        category: className,
        accuracy:
          stats.total > 0
            ? Number(((stats.correct / stats.total) * 100).toFixed(1))
            : 0,
      };
    });

    return res.status(200).json({
      availableVersions,
      globalAccuracy,
      totalReviewed,
      accuracyByClass,
      confusionMatrix,
    });
  } catch (error) {
    console.error("Erro ao gerar analytics:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
}