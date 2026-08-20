import { createRouter } from "next-connect";
import crypto from "node:crypto";
import database from "infra/database.js";
import controller from "infra/controller.js";
import authorization from "models/authorization.js";
import deviceCommand from "models/deviceCommand.js";
import deviceSetting from "models/deviceSetting.js";
import { UnauthorizedError, ForbiddenError } from "infra/errors.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

router.get(getHandler);

router.patch(patchHandler);

router.post(controller.canRequest("create:device_command"), postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const targetDevice = request.query.device || "smart_bin_01";
  const pendingCommands = await deviceCommand.getPendingCommands(targetDevice);
  return response.status(200).json(pendingCommands);
}

async function patchHandler(request, response) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError({
      message: "Autenticação de dispositivo ausente.",
    });
  }
  const deviceToken = authHeader.split(" ")[1];
  const tokenHash = crypto
    .createHash("sha256")
    .update(deviceToken)
    .digest("hex");
  const deviceCheck = await database.query({
    text: "SELECT device_name FROM device_settings WHERE token_hash = $1",
    values: [tokenHash],
  });

  if (deviceCheck.rows.length === 0) {
    throw new ForbiddenError({
      message: "Token de dispositivo revogado ou inválido.",
    });
  }

  const { command_id, status } = request.body;

  if (!command_id || !status) {
    return response.status(400).json({
      error: "Bad Request",
      message: "Os campos 'command_id' e 'status' são obrigatórios.",
    });
  }

  const updatedCommand = await deviceCommand.updateCommandStatus(
    command_id,
    status,
  );

  if (!updatedCommand) {
    return response.status(404).json({ error: "Comando não encontrado." });
  }

  return response.status(200).json(updatedCommand);
}

async function postHandler(request, response) {
  const userTryingToCreate = request.context.user;

  if (!authorization.can(userTryingToCreate, "create:device_command")) {
    throw new ForbiddenError({
      message: "Você não possui permissão para enviar comandos remotos.",
      action: "Contate um administrador do sistema.",
    });
  }

  const { device_name, command } = request.body;

  if (!device_name || !command) {
    return response
      .status(400)
      .json({ error: "Os campos 'device_name' e 'command' são obrigatórios." });
  }

  await deviceSetting.createIfNotExists(device_name);

  const newCommand = await deviceCommand.enqueueCommand(device_name, command);

  return response.status(201).json(newCommand);
}
