import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import activation from "models/activation.js";
import authorization from "models/authorization.js";
import user from "models/user.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const userTryingToPatch = request.context.user;
  const activationTokenId = request.query.token_id;
  const { password } = request.body;

  if (!password || password.length < 8) {
    return response.status(400).json({
      message: "A senha deve conter no mínimo 8 caracteres.",
      action: "Verifique a senha informada e tente novamente.",
    });
  }

  const validActivationToken =
    await activation.findOneValidById(activationTokenId);

  const userToActivate = await user.findOneById(validActivationToken.user_id);

  await user.update(userToActivate.username, {
    password: password,
  });

  await activation.activateUserByUserId(validActivationToken.user_id);

  await user.addFeatures(validActivationToken.user_id, [
    "read:dashboard",
    "read:trash_events",
  ]);

  const usedActivationToken =
    await activation.markTokenAsUsed(activationTokenId);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:activation_token",
    usedActivationToken,
  );

  return response.status(200).json(secureOutputValues);
}
