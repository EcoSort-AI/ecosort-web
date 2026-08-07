import database from "infra/database.js";

const VALID_WASTE_CLASSES = [
  "white-glass",
  "brown-glass",
  "green-glass",
  "cardboard",
  "plastic",
  "metal",
  "paper",
  "biological",
  "trash",
];

function isValidClass(className) {
  return VALID_WASTE_CLASSES.includes(className);
}

async function create(eventData) {
  if (!isValidClass(eventData.detection.class_name)) {
    const error = new Error(
      `Classe inválida: ${eventData.detection.class_name}`,
    );
    error.name = "ValidationError";
    throw error;
  }

  const newEvent = await runInsertQuery(eventData);
  return newEvent;

  async function runInsertQuery(data) {
    const initialReviewStatus = data.image_path ? "pending" : "approved";
    const initialStorageStatus = data.image_path ? "pending" : "ignored";
    const initialDatasetStatus = data.image_path ? "pending" : "ignored";

    const results = await database.query({
      text: `
        INSERT INTO trash_detections 
          (bin_id, item_class, ai_prediction, confidence, detected_at, image_path, review_status, storage_status, dataset_status, model_version, source_event_id) 
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (source_event_id) 
        DO UPDATE SET updated_at = NOW()
        RETURNING *;
      `,
      values: [
        data.bin_id,
        data.detection.class_name,
        data.detection.class_name,
        data.detection.confidence,
        data.timestamp,
        data.image_path || null,
        initialReviewStatus,
        initialStorageStatus,
        initialDatasetStatus,
        data.model_version || "unknown",
        data.source_event_id || null,
      ],
    });
    return results.rows[0];
  }
}

async function review(eventId, validatedClass, reviewerId) {
  if (!isValidClass(validatedClass)) {
    const error = new Error(`Classe validada inválida: ${validatedClass}`);
    error.name = "ValidationError";
    throw error;
  }

  const query = {
    text: `
      UPDATE trash_detections 
      SET 
        review_status = 'approved',
        dataset_status = 'eligible',
        item_class = $1, 
        reviewed_by = $2
      WHERE id = $3 AND review_status = 'pending'
      RETURNING *;
    `,
    values: [validatedClass, reviewerId, eventId],
  };

  const result = await database.query(query);

  if (result.rowCount === 0) {
    const error = new Error(
      "Este item já foi revisado por outro usuário ou não existe.",
    );
    error.name = "ConcurrencyError";
    throw error;
  }

  return result.rows[0];
}

async function listEvents({
  limit = 20,
  page = 1,
  material,
  days,
  minConfidence,
  status,
  reviewer,
  hasImage,
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
    queryText += ` AND trash_detections.review_status = $${valueIndex}`;
    queryValues.push(status);
    valueIndex++;
  }

  if (hasImage) {
    queryText += ` AND trash_detections.image_path IS NOT NULL`;
  }

  if (reviewer && reviewer !== "all") {
    if (reviewer === "system") {
      queryText += ` AND trash_detections.reviewed_by IS NULL`;
    } else {
      queryText += ` AND users.username = $${valueIndex}`;
      queryValues.push(reviewer);
      valueIndex++;
    }
  }

  queryText += ` ORDER BY trash_detections.detected_at DESC`;

  const offset = (page - 1) * limit;

  queryText += ` LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
  queryValues.push(limit, offset);
  valueIndex += 2;

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

async function getUniqueReviewers() {
  const results = await database.query(`
    SELECT DISTINCT u.username 
    FROM trash_detections td
    INNER JOIN users u ON td.reviewed_by = u.id
    WHERE td.reviewed_by IS NOT NULL 
    ORDER BY u.username ASC;
  `);
  return results.rows.map((row) => row.username);
}

async function countAll({
  status,
  material,
  days,
  minConfidence,
  reviewer,
  hasImage,
} = {}) {
  const queryValues = [];
  let valueIndex = 1;

  let queryText = `
    SELECT COUNT(*) 
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
    queryText += ` AND trash_detections.review_status = $${valueIndex}`;
    queryValues.push(status);
    valueIndex++;
  }

  if (hasImage) {
    queryText += ` AND trash_detections.image_path IS NOT NULL`;
  }

  if (reviewer && reviewer !== "all") {
    if (reviewer === "system") {
      queryText += ` AND trash_detections.reviewed_by IS NULL`;
    } else {
      queryText += ` AND users.username = $${valueIndex}`;
      queryValues.push(reviewer);
      valueIndex++;
    }
  }

  const result = await database.query({
    text: queryText,
    values: queryValues,
  });

  return result.rows[0].count;
}

const trashEvent = {
  create,
  review,
  listEvents,
  countAll,
  getUniqueClasses,
  getUniqueReviewers,
  VALID_WASTE_CLASSES,
};

export default trashEvent;
