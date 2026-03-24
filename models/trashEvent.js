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

async function listEvents() {
  const results = await database.query(
    "SELECT * FROM trash_detections ORDER BY detected_at DESC LIMIT 10;",
  );
  return results.rows;
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
};

export default trashEvent;
