import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import trashEvent from "models/trashEvent.js";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const count = await trashEvent.countAll();

  return response.status(200).json({
    total: count,
  });
}
