import database from "infra/database.js";

async function create(eventData) {
  const newEvent = await runInsertQuery(eventData);
  return newEvent;

  async function runInsertQuery(data) {
    const results = await database.query({
      text: `
        INSERT INTO trash_detections 
          (bin_id, item_class, ai_prediction, confidence, detected_at, image_path, status, model_version) 
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *;
      `,
      values: [
        data.bin_id,
        data.detection.class_name,
        data.detection.class_name,
        data.detection.confidence,
        data.timestamp,
        data.image_path || null,
        data.status || "pending",
        data.model_version || "v1.0.0",
      ],
    });
    return results.rows[0];
  }
}

async function listEvents({
  limit,
  material,
  days,
  minConfidence,
  status,
} = {}) {
  const queryValues = [];
  let valueIndex = 1;

  let queryText = `
    SELECT 
      trash_detections.*, 
      users.username as reviewed_by_username 
    FROM trash_detections 
    LEFT JOIN users ON trash_detections.reviewed_by = users.id 
    WHERE 1=1
  `;

  if (material) {
    queryText += ` AND trash_detections.item_class = $${valueIndex}`;
    queryValues.push(material);
    valueIndex++;
  }

  if (days) {
    queryText += ` AND trash_detections.detected_at >= NOW() - $${valueIndex}::interval`;
    queryValues.push(`${days} days`);
    valueIndex++;
  }

  if (minConfidence !== undefined) {
    queryText += ` AND trash_detections.confidence >= $${valueIndex}`;
    queryValues.push(minConfidence);
    valueIndex++;
  }

  if (status) {
    queryText += ` AND trash_detections.status = $${valueIndex}`;
    queryValues.push(status);
    valueIndex++;
  }

  queryText += ` ORDER BY trash_detections.detected_at DESC`;

  if (limit !== undefined && limit !== null) {
    queryText += ` LIMIT $${valueIndex}`;
    queryValues.push(limit);
    valueIndex++;
  }

  queryText += `;`;

  const results = await database.query({
    text: queryText,
    values: queryValues,
  });

  return results.rows;
}

async function getUniqueClasses() {
  const results = await database.query(`
    SELECT DISTINCT item_class 
    FROM trash_detections 
    WHERE item_class IS NOT NULL 
    ORDER BY item_class ASC;
  `);
  return results.rows.map((row) => row.item_class);
}

async function countAll() {
  const results = await database.query(
    "SELECT count(*)::int FROM trash_detections;",
  );
  return results.rows[0].count;
}

const trashEvent = {
  create,
  listEvents,
  countAll,
  getUniqueClasses,
};

export default trashEvent;
