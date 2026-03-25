import { createRouter } from "next-connect";
import { z } from "zod";
import { ValidationError } from "infra/errors.js";
import controller from "infra/controller.js";
import trashEvent from "models/trashEvent.js";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const events = await trashEvent.listEvents();
  const totalCount = await trashEvent.countAll();

  return response.status(200).json({
    total: totalCount,
    events: events,
  });
}

async function postHandler(request, response) {
  const trashEventSchema = z.object({
    bin_id: z.string({
      required_error: "O campo 'bin_id' é obrigatório.",
      invalid_type_error: "O campo 'bin_id' deve ser um texto.",
    }),
    timestamp: z.iso.datetime({
      message:
        "O campo 'timestamp' é obrigatório e deve ser uma data válida no formato ISO 8601.",
    }),
    detection: z.object(
      {
        class_name: z.string({
          required_error: "O campo 'class_name' é obrigatório.",
        }),
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
  });

  try {
    const validatedBody = trashEventSchema.parse(request.body);
    const newEvent = await trashEvent.create(validatedBody);
    return response.status(201).json(newEvent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError({
        message: error.issues[0].message,
        action: "Ajuste os dados enviados e tente novamente.",
        cause: error,
      });
    }
    throw error;
  }
}
