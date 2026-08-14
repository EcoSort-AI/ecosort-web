import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import database from "infra/database.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  try {
    const result = await database.query(`
      SELECT DISTINCT device_name 
      FROM device_telemetries
      WHERE device_name IS NOT NULL
      ORDER BY device_name ASC
    `);

    const devices = result.rows.map((row) => row.device_name);

    return response.status(200).json({ devices });
  } catch (error) {
    console.error(error);
    try {
      const resultFallback = await database.query(`
        SELECT DISTINCT device_name 
        FROM device_telemetry
        WHERE device_name IS NOT NULL
        ORDER BY device_name ASC
      `);

      const devices = resultFallback.rows.map((row) => row.device_name);
      return response.status(200).json({ devices });
    } catch (fallbackError) {
      console.error("Erro SQL ao buscar dispositivos:", fallbackError);
      return response
        .status(500)
        .json({ error: "Erro interno ao listar dispositivos." });
    }
  }
}
