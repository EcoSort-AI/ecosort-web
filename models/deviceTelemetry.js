import database from "infra/database.js";

async function create({
  deviceName,
  cpuUsage,
  temperature,
  ramUsage,
  diskFree,
  uptime,
}) {
  const result = await database.query({
    text: `
      INSERT INTO device_telemetry (device_name, cpu_usage, temperature, ram_usage, disk_free, uptime)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `,
    values: [deviceName, cpuUsage, temperature, ramUsage, diskFree, uptime],
  });

  return result.rows[0];
}

async function getLatestByDevice(deviceName) {
  const result = await database.query({
    text: `
      SELECT cpu_usage, temperature, ram_usage, disk_free, uptime, created_at
      FROM device_telemetry
      WHERE device_name = $1
      ORDER BY created_at DESC
      LIMIT 1;
    `,
    values: [deviceName],
  });

  return result.rows[0];
}

export default {
  create,
  getLatestByDevice,
};
