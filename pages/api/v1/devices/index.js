import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import database from "infra/database.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const result = await database.query(`
    SELECT DISTINCT device_name 
    FROM device_settings
    ORDER BY device_name ASC
  `);

  const devices = result.rows.map((row) => row.device_name);

  return response.status(200).json({ devices });
}
