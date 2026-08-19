import { createRouter } from "next-connect";
import { z } from "zod";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ServiceError,
  UnauthorizedError,
} from "infra/errors.js";
import controller from "infra/controller.js";
import database from "infra/database.js";
import s3Client from "infra/storage.js";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import session from "models/session.js";

const router = createRouter();

router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const { id } = request.query;

  const sessionToken = request.cookies.session_id;
  let userId = null;

  if (sessionToken) {
    try {
      const sessionObject = await session.findOneValidByToken(sessionToken);
      if (sessionObject) userId = sessionObject.user_id;
    } catch (error) {
      throw new ValidationError({
        message: "Sessão inválida ou expirada.",
        action: "Faça login novamente para validar a imagem.",
        cause: error,
      });
    }
  }

  if (!userId) {
    throw new UnauthorizedError({
      message: "Usuário não autenticado.",
      action: "Faça login para continuar.",
    });
  }

  const userResult = await database.query({
    text: "SELECT features FROM users WHERE id = $1",
    values: [userId],
  });
  const userFeatures = userResult.rows[0]?.features || [];

  if (
    !userFeatures.includes("review:trash_detection") &&
    !userFeatures.includes("admin")
  ) {
    throw new ForbiddenError({
      message: "Você não tem permissão para revisar detecções.",
      action: "Solicite a permissão de revisor ao administrador.",
    });
  }

  const patchSchema = z.object({
    correctClass: z.enum(
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
        "invalid_image",
      ],
      {
        required_error: "A classe corrigida é obrigatória.",
        invalid_type_error: "Classe de resíduo inválida.",
      },
    ),
  });

  let validatedBody;
  try {
    validatedBody = patchSchema.parse(request.body);
  } catch (error) {
    throw new ValidationError({
      message: error.issues[0].message,
      action: "Ajuste os dados enviados e tente novamente.",
      cause: error,
    });
  }
  const { correctClass } = validatedBody;

  const result = await database.query({
    text: "SELECT image_path, review_status FROM trash_detections WHERE id = $1;",
    values: [id],
  });

  if (result.rows.length === 0) {
    throw new NotFoundError({
      message: "O evento de lixo especificado não foi encontrado.",
    });
  }

  const trashEvent = result.rows[0];

  if (!trashEvent.image_path) {
    throw new ValidationError({
      message: "Este evento não possui uma imagem associada para ser movida.",
    });
  }

  if (trashEvent.review_status !== "pending") {
    return response.status(409).json({
      name: "ConcurrencyError",
      message: "Esta imagem já foi validada anteriormente.",
    });
  }

  const newPath =
    correctClass === "invalid_image"
      ? `rejected/invalid-image/${id}.jpg`
      : `dataset/${correctClass}/${id}.jpg`;

  try {
    await s3Client.send(
      new CopyObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        CopySource: `${process.env.R2_BUCKET_NAME}/${trashEvent.image_path}`,
        Key: newPath,
      }),
    );

    await s3Client.send(
      new HeadObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: newPath,
      }),
    );
  } catch (s3Error) {
    throw new ServiceError({
      message: "Falha ao copiar a imagem no Cloudflare R2.",
      cause: s3Error,
    });
  }

  const updateResult = await database.query({
    text: `
      UPDATE trash_detections 
      SET 
        review_status = CASE
          WHEN $1 = 'invalid_image' THEN 'invalid'
          WHEN ai_prediction = $1 THEN 'approved'
          ELSE 'corrected'
        END,
        storage_status = 'stored',
        dataset_status = CASE
          WHEN $1 = 'invalid_image' THEN 'excluded'
          ELSE 'eligible'
        END,
        item_class = CASE
          WHEN $1 = 'invalid_image' THEN item_class
          ELSE $1
        END,
        image_path = $2, 
        reviewed_by = $3,
        updated_at = NOW(),
        reviewed_at = NOW(),
        stored_at = NOW()
      WHERE id = $4 AND review_status = 'pending' 
      RETURNING *;
    `,
    values: [correctClass, newPath, userId, id],
  });

  if (updateResult.rowCount === 0) {
    return response.status(409).json({
      name: "ConcurrencyError",
      message: "Este item já foi revisado por outro usuário.",
    });
  }

  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: trashEvent.image_path,
      }),
    );
  } catch (deleteError) {
    console.warn(
      "[S3 Warning] Cópia e banco confirmados, mas falha ao excluir original:",
      deleteError.message,
    );
  }

  return response.status(200).json({
    message: "Imagem validada com sucesso!",
    newPath,
  });
}
