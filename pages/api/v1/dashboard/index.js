import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import dashboard from "models/dashboard.js";

const router = createRouter();

router.get(
  controller.injectAnonymousOrUser,
  controller.canRequest("read:dashboard"),
  getHandler,
);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const { days } = request.query;

  const metrics = await dashboard.getMetrics({ days });

  return response.status(200).json(metrics);
}
