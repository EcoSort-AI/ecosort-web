import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import database from "infra/database.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

router.get(controller.canRequest("read:dashboard"), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  try {
    const result = await database.query(`
      SELECT DISTINCT device_name 
      FROM device_telemetry
      WHERE device_name IS NOT NULL
      ORDER BY device_name ASC
    `);

    const devices = result.rows.map((row) => row.device_name);

    return response.status(200).json({ devices });
  } catch (error) {
    console.error("Erro interno ao listar dispositivos:", error);

    return response.status(200).json({ devices: [] });
  }
}
