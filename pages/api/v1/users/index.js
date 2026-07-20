import { createRouter } from "next-connect";
import controller from "infra/controller.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

export default router.handler(controller.errorHandlers);
