import database from "infra/database.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).json({ message: "Método não permitido" });
  }

  try {
    const result = await database.query({
      text: `
        SELECT item_class, CAST(COUNT(*) AS INTEGER) as count
        FROM trash_detections
        GROUP BY item_class
        ORDER BY count DESC;
      `,
    });

    const total = result.rows.reduce((acc, row) => acc + row.count, 0);

    return response.status(200).json({
      total: total,
      distribution: result.rows,
    });
  } catch (error) {
    console.error("Erro interno na API de métricas:", error);
    return response.status(500).json({ message: "Erro interno no servidor" });
  }
}
