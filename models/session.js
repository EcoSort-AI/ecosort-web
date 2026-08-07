import crypto from "node:crypto";
import database from "infra/database.js";
import { UnauthorizedError } from "infra/errors.js";

const EXPIRATION_IN_MILLISECONDS = 60 * 60 * 24 * 30 * 1000; // 30 days

async function findOneValidByToken(sessionToken) {
  const tokenHash = crypto
    .createHash("sha256")
    .update(sessionToken)
    .digest("hex");
  const sessionFound = await runSelectQuery(tokenHash);

  return sessionFound;

  async function runSelectQuery(hash) {
    const results = await database.query({
      text: `
      SELECT
        *
      FROM
        sessions
      WHERE
        token = $1
      AND expires_at > NOW()
      LIMIT
        1
      ;`,
      values: [hash],
    });

    if (results.rowCount === 0) {
      throw new UnauthorizedError({
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
      });
    }
    return results.rows[0];
  }
}

async function create(userId) {
  const rawToken = crypto.randomBytes(48).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newSession = await runInsertQuery(tokenHash, userId, expiresAt);

  newSession.token = rawToken;
  return newSession;

  async function runInsertQuery(hash, userId, expiresAt) {
    const results = await database.query({
      text: `
      INSERT INTO
        sessions (token, user_id, expires_at)
      VALUES
        ($1, $2, $3)
      RETURNING
        *
      ;`,
      values: [hash, userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function renew(sessionId) {
  const renewedSessionObject = await runUpdateQuery(sessionId);
  return renewedSessionObject;

  async function runUpdateQuery(sessionId) {
    const results = await database.query({
      text: `
      UPDATE
        sessions
      SET
        expires_at = NOW() + interval '30 days',
        updated_at = NOW()
      WHERE
        id = $1
      RETURNING
        *
      ;`,
      values: [sessionId],
    });

    return results.rows[0];
  }
}

async function expireById(sessionId) {
  const expiredSessionObject = await runUpdateQuery(sessionId);
  return expiredSessionObject;

  async function runUpdateQuery(sessionId) {
    const results = await database.query({
      text: `
        UPDATE
          sessions
        SET
          expires_at = expires_at - interval '1 year',
          updated_at = NOW()
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [sessionId],
    });

    return results.rows[0];
  }
}

const session = {
  create,
  findOneValidByToken,
  renew,
  expireById,
  EXPIRATION_IN_MILLISECONDS,
};

export default session;
