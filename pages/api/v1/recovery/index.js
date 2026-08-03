import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import activation from "models/activation.js";
import email from "infra/email.js";
import webserver from "infra/webserver.js";
import { NotFoundError } from "infra/errors.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const emailToRecover = request.body.email;

  if (!emailToRecover) {
    return response.status(400).json({ message: "O e-mail é obrigatório." });
  }

  try {
    const userFound = await user.findOneByEmail(emailToRecover);

    const token = await activation.create(userFound.id);
    const recoveryLink = `${webserver.origin}/recuperar-senha/${token.id}`;

    await email.send({
      from: "EcoSort <contato@ecosort.com.br>",
      to: emailToRecover,
      subject: "Recuperação de Senha - EcoSort",
      text: `Você solicitou a recuperação de senha no painel do EcoSort. 

Acesse o link abaixo para criar sua nova senha:
${recoveryLink}

Se você não solicitou essa alteração, ignore este e-mail.

Atenciosamente,
Equipe EcoSort`,
    });
  } catch (error) {
    if (!(error instanceof NotFoundError)) {
      throw error;
    }
  }

  return response.status(200).json({
    message: "Se o e-mail estiver cadastrado, as instruções foram enviadas.",
  });
}
