import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import trashEvent from "models/trashEvent.js";
import database from "infra/database.js";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const count = await trashEvent.countAll();

  const latestResult = await database.query(
    "SELECT id, item_class, detected_at FROM trash_detections ORDER BY detected_at DESC, id DESC LIMIT 1;",
  );

  const latestEvent = latestResult.rows[0] || null;

  return response.status(200).json({
    total: Number(count) || 0,
    latestEvent,
  });
}
