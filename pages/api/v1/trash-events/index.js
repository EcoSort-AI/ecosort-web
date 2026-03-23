import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import trashEvent from "models/trashEvent.js";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const events = await trashEvent.listEvents();
  return response.status(200).json(events);
}

async function postHandler(request, response) {
  const eventData = request.body;
  const newEvent = await trashEvent.create(eventData);
  return response.status(201).json(newEvent);
}
