import { createRouter } from "next-connect";
import { z } from "zod";
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
} from "infra/errors.js";
import controller from "infra/controller.js";
import trashEvent from "models/trashEvent.js";

const router = createRouter();

router.get(
  controller.injectAnonymousOrUser,
  controller.canRequest("read:trash_events"),
  getHandler,
);

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const { limit, material, days, min_confidence, status, reviewer, page } =
    request.query;

  const parsedPage = page ? parseInt(page, 10) : 1;
  const validPage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;

  const parsedLimit = limit ? parseInt(limit, 10) : 20;
  const validLimit = isNaN(parsedLimit) || parsedLimit < 1 ? 20 : parsedLimit;

  const parsedDays = days && days !== "all" ? parseInt(days, 10) : undefined;
  const parsedConfidence = min_confidence
    ? parseFloat(min_confidence)
    : undefined;
  const parsedMaterial = material !== "all" ? material : undefined;
  const parsedStatus = status !== "all" ? status : undefined;
  const parsedReviewer = reviewer !== "all" ? reviewer : undefined;

  const events = await trashEvent.listEvents({
    page: validPage,
    limit: validLimit,
    material: parsedMaterial,
    days: parsedDays,
    minConfidence: parsedConfidence,
    status: parsedStatus,
    reviewer: parsedReviewer,
  });

  const totalCount = parseInt(await trashEvent.countAll(), 10) || 0;

  return response.status(200).json({
    total: totalCount,
    events: events,
    pagination: {
      page: validPage,
      limit: validLimit,
      total_records: totalCount,
      total_pages: Math.ceil(totalCount / validLimit),
    },
  });
}

async function postHandler(request, response) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError({
      message: "Autenticação de dispositivo ausente ou inválida.",
      action: "O dispositivo deve enviar um token Bearer válido.",
    });
  }

  const deviceToken = authHeader.split(" ")[1];

  const trashEventSchema = z.object({
    bin_id: z.string({
      required_error: "O campo 'bin_id' é obrigatório.",
      invalid_type_error: "O campo 'bin_id' deve ser um texto.",
    }),
    source_event_id: z
      .string({
        invalid_type_error: "O campo 'source_event_id' deve ser um texto.",
      })
      .uuid({ message: "O campo 'source_event_id' deve ser um UUID válido." })
      .optional(),
    timestamp: z.iso.datetime({
      message:
        "O campo 'timestamp' é obrigatório e deve ser uma data válida no formato ISO 8601.",
    }),
    model_version: z.string().optional(),
    detection: z.object(
      {
        class_name: z.enum(
          [
            "plastic",
            "metal",
            "white-glass",
            "brown-glass",
            "green-glass",
            "paper",
            "cardboard",
            "biological",
            "trash",
          ],
          {
            required_error: "O campo 'class_name' é obrigatório.",
            invalid_type_error:
              "Classe de resíduo não reconhecida. Utilize as classes oficiais (ex: 'plastic', 'metal').",
          },
        ),
        confidence: z
          .number({
            required_error: "O campo 'confidence' é obrigatório.",
            invalid_type_error: "O campo 'confidence' deve ser um número.",
          })
          .min(0)
          .max(1, { message: "A confiança deve ser um número entre 0 e 1." }),
      },
      { required_error: "O objeto 'detection' é obrigatório." },
    ),
    image_path: z.string().optional(),
  });

  let validatedBody;
  try {
    validatedBody = trashEventSchema.parse(request.body);
  } catch (error) {
    throw new ValidationError({
      message: error.issues[0].message,
      action: "Ajuste os dados enviados e tente novamente.",
      cause: error,
    });
  }

  const expectedToken = `ecotoken_${validatedBody.bin_id}`;
  if (deviceToken !== expectedToken) {
    throw new ForbiddenError({
      message: "Token revogado ou não pertence a esta lixeira.",
      action: "Verifique as credenciais configuradas no dispositivo.",
    });
  }

  const newEvent = await trashEvent.create(validatedBody);
  return response.status(201).json(newEvent);
}
