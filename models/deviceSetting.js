import database from "infra/database.js";

async function findOneByName(deviceName) {
  const result = await database.query({
    text: `
      SELECT id, device_name, confidence_threshold, classes_status, updated_at
      FROM device_settings
      WHERE device_name = $1;
    `,
    values: [deviceName],
  });

  return result.rows[0];
}

async function updateByName(
  deviceName,
  { confidenceThreshold, classesStatus },
) {
  const result = await database.query({
    text: `
      UPDATE device_settings
      SET 
        confidence_threshold = COALESCE($1, confidence_threshold),
        classes_status = COALESCE($2, classes_status),
        updated_at = timezone('utc', now())
      WHERE device_name = $3
      RETURNING id, device_name, confidence_threshold, classes_status, updated_at;
    `,
    values: [confidenceThreshold, classesStatus, deviceName],
  });

  return result.rows[0];
}

async function createIfNotExists(deviceName) {
  const result = await database.query({
    text: `
      INSERT INTO device_settings (device_name, confidence_threshold, classes_status) 
      VALUES ($1, 80, '{"plastico": true, "papel": true, "metal": true, "vidro": true, "organico": true}'::jsonb)
      ON CONFLICT (device_name) DO NOTHING
      RETURNING id, device_name;
    `,
    values: [deviceName],
  });

  return result.rows[0];
}

export default {
  findOneByName,
  updateByName,
  createIfNotExists,
};
