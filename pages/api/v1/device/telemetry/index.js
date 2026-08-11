import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import deviceTelemetry from "models/deviceTelemetry.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const targetDevice = request.query.device || "smart-bin-01";

  const telemetry = await deviceTelemetry.getLatestByDevice(targetDevice);

  if (!telemetry) {
    return response.status(404).json({
      error: "Not found",
      message: "Nenhuma telemetria encontrada para este dispositivo.",
    });
  }

  return response.status(200).json(telemetry);
}

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

  const newTelemetry = await deviceTelemetry.create({
    deviceName: device_name,
    cpuUsage: cpu_usage,
    temperature: temperature,
    ramUsage: ram_usage,
    diskFree: disk_free,
    uptime: uptime,
  });

  return response.status(201).json(newTelemetry);
}
