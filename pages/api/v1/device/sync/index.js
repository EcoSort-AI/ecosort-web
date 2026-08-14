import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import deviceTelemetry from "models/deviceTelemetry.js";
import deviceSetting from "models/deviceSetting.js";
import deviceCommand from "models/deviceCommand.js";

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
