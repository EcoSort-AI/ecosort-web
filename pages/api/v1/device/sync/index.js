import { createRouter } from "next-connect";
import crypto from "node:crypto";
import database from "infra/database.js";
import controller from "infra/controller.js";
import deviceTelemetry from "models/deviceTelemetry.js";
import deviceSetting from "models/deviceSetting.js";
import deviceCommand from "models/deviceCommand.js";
import { UnauthorizedError, ForbiddenError } from "infra/errors.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const { device_name, cpu_usage, temperature, ram_usage, disk_free, uptime } =
    request.body;

  if (!device_name || cpu_usage === undefined || temperature === undefined) {
    return response.status(400).json({
      error: "Bad Request",
      message:
        "Dados incompletos. 'device_name', 'cpu_usage' e 'temperature' são obrigatórios.",
    });
  }

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError({
      message: "Autenticação de dispositivo ausente ou inválida.",
      action: "O dispositivo deve enviar um token Bearer válido.",
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

  if (
    deviceCheck.rows.length === 0 ||
    deviceCheck.rows[0].device_name !== device_name
  ) {
    throw new ForbiddenError({
      message: "Token revogado ou não pertence a esta lixeira.",
      action: "Verifique as credenciais configuradas no dispositivo.",
    });
  }

  await deviceTelemetry.create({
    deviceName: device_name,
    cpuUsage: cpu_usage,
    temperature: temperature,
    ramUsage: ram_usage,
    diskFree: disk_free,
    uptime: uptime,
  });

  await deviceSetting.createIfNotExists(device_name);
  const config = await deviceSetting.findOneByName(device_name);

  const pendingCommands = await deviceCommand.getPendingCommands(device_name);

  return response.status(200).json({
    config: config,
    commands: pendingCommands,
  });
}
