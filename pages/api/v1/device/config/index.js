import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authorization from "models/authorization.js";
import deviceSetting from "models/deviceSetting.js";

import { ForbiddenError } from "infra/errors.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

router.get(controller.canRequest("read:dashboard"), getHandler);

router.patch(controller.canRequest("update:device_config"), patchHandler);
router.post(controller.canRequest("create:device_config"), postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const targetDevice = request.query.device || "smart_bin_01";

  const deviceConfig = await deviceSetting.findOneByName(targetDevice);

  if (!deviceConfig) {
    return response.status(404).json({
      error: "Not found",
      message: "Nenhuma configuração encontrada para este dispositivo.",
    });
  }

  return response.status(200).json(deviceConfig);
}

async function patchHandler(request, response) {
  const userTryingToUpdate = request.context.user;

  if (!authorization.can(userTryingToUpdate, "update:device_config")) {
    throw new ForbiddenError({
      message:
        "Você não possui permissão para alterar as configurações do dispositivo.",
      action: "Contate um administrador do sistema.",
    });
  }

  const { device_name, confidence_threshold, classes_status } = request.body;

  if (!device_name) {
    return response
      .status(400)
      .json({ error: "O nome do dispositivo é obrigatório." });
  }

  await deviceSetting.createIfNotExists(device_name);

  const updatedConfig = await deviceSetting.updateByName(device_name, {
    confidenceThreshold: confidence_threshold,
    classesStatus: classes_status,
  });

  if (!updatedConfig) {
    return response.status(404).json({ error: "Dispositivo não encontrado." });
  }

  return response.status(200).json(updatedConfig);
}

async function postHandler(request, response) {
  const userTryingToCreate = request.context.user;

  if (!authorization.can(userTryingToCreate, "create:device_config")) {
    throw new ForbiddenError({
      message: "Você não possui permissão para registrar novos dispositivos.",
      action: "Contate um administrador do sistema.",
    });
  }

  const { device_name } = request.body;

  if (!device_name) {
    return response
      .status(400)
      .json({ error: "O nome do dispositivo é obrigatório." });
  }

  await deviceSetting.createIfNotExists(device_name);

  return response
    .status(201)
    .json({ message: "Dispositivo registrado/verificado com sucesso." });
}
