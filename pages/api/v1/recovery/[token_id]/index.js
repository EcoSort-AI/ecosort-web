import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import activation from "models/activation.js";
import user from "models/user.js";

const router = createRouter();

router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const recoveryTokenId = request.query.token_id;
  const { password } = request.body;

  if (!password || password.length < 8) {
    return response.status(400).json({
      message: "A senha deve conter no mínimo 8 caracteres.",
      action: "Verifique a senha informada e tente novamente.",
    });
  }

  const validActivationToken =
    await activation.findOneValidById(recoveryTokenId);
  const userToRecover = await user.findOneById(validActivationToken.user_id);

  await user.update(userToRecover.username, {
    password: password,
  });

  await activation.markTokenAsUsed(recoveryTokenId);

  return response
    .status(200)
    .json({ message: "Senha atualizada com sucesso." });
}
