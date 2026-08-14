import database from "infra/database.js";

async function enqueueCommand(deviceName, command) {
  const result = await database.query({
    text: `
      INSERT INTO device_commands (device_setting_id, command, status)
      VALUES ((SELECT id FROM device_settings WHERE device_name = $1), $2, 'pending')
      RETURNING *;
    `,
    values: [deviceName, command],
  });

  return result.rows[0];
}

async function getPendingCommands(deviceName) {
  const result = await database.query({
    text: `
      SELECT dc.id, dc.command, dc.status, dc.created_at
      FROM device_commands dc
      JOIN device_settings ds ON dc.device_setting_id = ds.id
      WHERE ds.device_name = $1 AND dc.status = 'pending'
      ORDER BY dc.created_at ASC;
    `,
    values: [deviceName],
  });

  return result.rows;
}

async function updateCommandStatus(commandId, status) {
  const result = await database.query({
    text: `
      UPDATE device_commands
      SET 
        status = $1,
        executed_at = timezone('utc', now())
      WHERE id = $2
      RETURNING *;
    `,
    values: [status, commandId],
  });

  return result.rows[0];
}

export default {
  enqueueCommand,
  getPendingCommands,
  updateCommandStatus,
};
