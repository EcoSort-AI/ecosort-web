import authorization from "models/authorization.js";
import user from "models/user.js";
import email from "infra/email.js";
import database from "infra/database.js";
import webserver from "infra/webserver.js";
import { NotFoundError, ForbiddenError } from "infra/errors.js";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes

async function findOneValidById(tokenId) {
  const activationTokenObject = await runSelectQuery(tokenId);

  return activationTokenObject;

  async function runSelectQuery(tokenId) {
    const results = await database.query({
      text: `
        SELECT
          *
       FROM
         user_activation_tokens
       WHERE
         id = $1
         AND expires_at > NOW()
         AND used_at IS NULL
       LIMIT
         1
      ;`,
      values: [tokenId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Solicite um novo convite ao administrador.",
      });
    }

    return results.rows[0];
  }
}

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING
          *
      ;`,
      values: [userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function markTokenAsUsed(activationTokenId) {
  const usedActivationToken = await runUpdateQuery(activationTokenId);
  return usedActivationToken;

  async function runUpdateQuery(activationTokenId) {
    const results = await database.query({
      text: `
       UPDATE
         user_activation_tokens
       SET
         used_at = timezone('utc', now()),
         updated_at = timezone('utc', now())
       WHERE
         id = $1
       RETURNING
         *
      `,
      values: [activationTokenId],
    });

    return results.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const userToActivate = await user.findOneById(userId);

  if (!authorization.can(userToActivate, "read:activation_token")) {
    throw new ForbiddenError({
      message: "Você não pode mais utilizar tokens de ativação.",
      action: "Entre em contato com o suporte.",
    });
  }

  const activatedUser = await user.setFeatures(userId, [
    "create:session",
    "read:session",
    "update:user",
    "read:dashboard",
    "read:trash_events",
  ]);
  return activatedUser;
}

async function sendEmailToUser(userObj, activationToken) {
  const activationLink = `${webserver.origin}/convite/${activationToken.id}`;
  const remetente =
    process.env.EMAIL_FROM || "EcoSort AI <contato@ecosort.com.br>";

  await email.send({
    from: remetente,
    to: userObj.email,
    subject: "Convite para o Painel EcoSort AI",
    text: `Olá!\n\nVocê foi convidado(a) para acessar o painel administrativo da lixeira inteligente EcoSort.\n\nPara ativar sua conta e definir sua senha de acesso, acesse o link abaixo:\n\n${activationLink}\n\nAtenciosamente,\nEquipe EcoSort`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #16a34a;">Bem-vindo(a) ao EcoSort AI</h2>
        <p>Olá!</p>
        <p>Você foi convidado(a) para acessar o painel administrativo da lixeira inteligente <strong>EcoSort</strong>.</p>
        <p>Para ativar sua conta e definir sua senha de acesso, clique no botão abaixo:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationLink}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Aceitar Convite
          </a>
        </div>

        <p style="font-size: 14px; color: #666;">
          Se o botão não funcionar, copie e cole este link no seu navegador:<br>
          <a href="${activationLink}" style="color: #16a34a;">${activationLink}</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #eaeaea; margin-top: 40px;" />
        <p style="font-size: 12px; color: #999; text-align: center;">
          Este é um e-mail automático do sistema EcoSort.
        </p>
      </div>
    `,
  });
}

const activation = {
  findOneValidById,
  create,
  markTokenAsUsed,
  activateUserByUserId,
  sendEmailToUser,
  EXPIRATION_IN_MILLISECONDS,
};

export default activation;
