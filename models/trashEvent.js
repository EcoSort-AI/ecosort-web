import database from "infra/database.js";

async function create(eventData) {
  const newEvent = await runInsertQuery(eventData);
  return newEvent;

  async function runInsertQuery(data) {
    const results = await database.query({
      text: `
        INSERT INTO trash_detections 
          (bin_id, item_class, confidence, detected_at) 
        VALUES 
          ($1, $2, $3, $4) 
        RETURNING *;
      `,
      values: [
        data.bin_id,
        data.detection.class_name,
        data.detection.confidence,
        data.timestamp,
      ],
    });
    return results.rows[0];
  }
}

async function listEvents({ limit = 500, material, days, minConfidence } = {}) {
  const queryValues = [];
  let valueIndex = 1;

  let queryText = "SELECT * FROM trash_detections WHERE 1=1";

  if (material) {
    queryText += ` AND item_class = $${valueIndex}`;
    queryValues.push(material);
    valueIndex++;
  }

  if (days) {
    queryText += ` AND detected_at >= NOW() - $${valueIndex}::interval`;
    queryValues.push(`${days} days`);
    valueIndex++;
  }

  if (minConfidence !== undefined) {
    queryText += ` AND confidence >= $${valueIndex}`;
    queryValues.push(minConfidence);
    valueIndex++;
  }

  queryText += ` ORDER BY detected_at DESC LIMIT $${valueIndex};`;
  queryValues.push(limit);

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
  return results.rows.map(row => row.item_class);
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
  getUniqueClasses
};

export default trashEvent;
