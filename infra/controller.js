import * as cookie from "cookie";
import session from "models/session.js";
import user from "models/user.js";
import authorization from "models/authorization.js";
import { InternalServerError } from "infra/errors.js";

function onNoMatchHandler(request, response) {
  return response.status(405).json({
    name: "MethodNotAllowedError",
    message: "Método não permitido para esse endpoint.",
    action: "Verifique se o método HTTP enviado é válido para esse endpoint.",
    status_code: 405,
  });
}

function onErrorHandler(error, request, response) {
  if (
    error.name === "ValidationError" ||
    error.name === "NotFoundError" ||
    error.name === "ForbiddenError" ||
    error.name === "ServiceError" ||
    error.name === "ConcurrencyError"
  ) {
    return response.status(error.statusCode || 400).json(error);
  }

  if (error.name === "UnauthorizedError") {
    clearSessionCookie(response);
    return response.status(error.statusCode || 401).json(error);
  }

  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.error(publicErrorObject);

  response.status(publicErrorObject.statusCode || 500).json(publicErrorObject);
}

function setSessionCookie(sessionToken, response) {
  const setCookie = cookie.serialize("session_id", sessionToken, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  });

  response.setHeader("Set-Cookie", setCookie);
}

function clearSessionCookie(response) {
  const setCookie = cookie.serialize("session_id", "invalid", {
    path: "/",
    maxAge: -1,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  });

  response.setHeader("Set-Cookie", setCookie);
}

async function injectAnonymousOrUser(request, response, next) {
  if (request.cookies?.session_id) {
    await injectAuthenticatedUser(request);
    return next();
  }

  injectAnonymousUser(request);
  return next();
}

async function injectAuthenticatedUser(request) {
  const sessionToken = request.cookies.session_id;
  const sessionObject = await session.findOneValidByToken(sessionToken);
  const userObject = await user.findOneById(sessionObject.user_id);

  request.context = {
    ...request.context,
    user: userObject,
  };
}

function injectAnonymousUser(request) {
  const anonymousUserObject = {
    features: [
      "read:activation_token",
      "create:session",
      "read:status",
      "create:user",
      "read:user",
    ],
  };

  request.context = {
    ...request.context,
    user: anonymousUserObject,
  };
}

function canRequest(feature) {
  return function canRequestMiddleware(request, response, next) {
    const userTryingToRequest = request.context?.user;

    if (!userTryingToRequest) {
      return response.status(401).json({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });
    }

    if (authorization.can(userTryingToRequest, feature)) {
      return next();
    }

    return response.status(403).json({
      name: "ForbiddenError",
      message: "Você não possui permissão para executar esta ação.",
      action: `Verifique se o seu usuário possui a feature "${feature}"`,
      status_code: 403,
    });
  };
}

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  setSessionCookie,
  clearSessionCookie,
  injectAnonymousOrUser,
  canRequest,
};

export default controller;
