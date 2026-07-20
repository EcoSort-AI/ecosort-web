import { createRouter } from "next-connect";
import crypto from "crypto";
import controller from "infra/controller.js";
import user from "models/user.js";
import activation from "models/activation.js";
import email from "infra/email.js";
import webserver from "infra/webserver.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.use(controller.canRequest("create:invitation"));

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const emailToInvite = request.body.email;

  if (!emailToInvite) {
    return response.status(400).json({ message: "O e-mail é obrigatório." });
  }

  const placeholderPassword = crypto.randomBytes(32).toString("hex");
  const tempUsername = `convidado_${crypto.randomBytes(4).toString("hex")}`;

  const newUser = await user.create({
    username: tempUsername,
    email: emailToInvite,
    password: placeholderPassword,
  });

  const token = await activation.create(newUser.id);

  const inviteLink = `${webserver.origin}/convite/${token.id}`;

  await email.send({
    from: "EcoSort <contato@ecosort.com.br>",
    to: emailToInvite,
    subject: "Convite para acessar o painel EcoSort",
    text: `Você foi convidado para acessar o painel do EcoSort. 

Acesse o link abaixo para criar sua senha definitiva e entrar no sistema:
${inviteLink}

Atenciosamente,
Equipe EcoSort`,
  });

  return response.status(201).json({
    message: "Convite enviado com sucesso!",
    userId: newUser.id,
  });
}
