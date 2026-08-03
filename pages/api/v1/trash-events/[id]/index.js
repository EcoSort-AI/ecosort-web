import { createRouter } from "next-connect";
import { z } from "zod";
import { ValidationError, NotFoundError } from "infra/errors.js";
import controller from "infra/controller.js";
import database from "infra/database";
import s3Client from "infra/storage";
import { CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import session from "models/session.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const { id } = request.query;

  const sessionToken = request.cookies.session_id;
  let userId = null;

  if (sessionToken) {
    try {
      const sessionObject = await session.findOneValidByToken(sessionToken);
      if (sessionObject) {
        userId = sessionObject.user_id;
      }
    } catch (err) {
      console.error("[Auth Error] Falha ao verificar token:", err);
      throw new ValidationError({
        message: "Sessão inválida ou expirada.",
        action: "Faça login novamente para validar a imagem.",
      });
    }
  }

  if (!userId) {
    throw new ValidationError({
      message: "Usuário não autenticado.",
      action: "Faça login para continuar.",
    });
  }

  const patchSchema = z.object({
    correctClass: z.string({
      required_error: "O campo 'correctClass' é obrigatório.",
      invalid_type_error: "O campo 'correctClass' deve ser um texto.",
    }),
  });

  let validatedBody;
  try {
    validatedBody = patchSchema.parse(request.body);
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

  const { correctClass } = validatedBody;

  const result = await database.query({
    text: "SELECT image_path, status FROM trash_detections WHERE id = $1;",
    values: [id],
  });

  if (result.rows.length === 0) {
    throw new NotFoundError({
      message: "O evento de lixo especificado não foi encontrado.",
      action: "Verifique o ID informado e tente novamente.",
    });
  }

  const trashEvent = result.rows[0];

  if (!trashEvent.image_path) {
    throw new ValidationError({
      message: "Este evento não possui uma imagem associada para ser movida.",
      action: "Certifique-se de que o evento foi registrado com uma imagem.",
    });
  }

  if (trashEvent.status === "validated") {
    throw new ValidationError({
      message: "Esta imagem já foi validada anteriormente.",
      action: "Nenhuma ação adicional é necessária para este evento.",
    });
  }

  const fileName = trashEvent.image_path.split("/").pop();
  const newPath = `dataset/${correctClass}/${fileName}`;

  try {
    await s3Client.send(
      new CopyObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        CopySource: `${process.env.R2_BUCKET_NAME}/${trashEvent.image_path}`,
        Key: newPath,
      }),
    );

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: trashEvent.image_path,
      }),
    );
  } catch (s3Error) {
    console.warn(
      "[S3 Warning] Não foi possível mover o arquivo no bucket:",
      s3Error.message,
    );
  }

  await database.query({
    text: "UPDATE trash_detections SET status = $1, item_class = $2, image_path = $3, reviewed_by = $4 WHERE id = $5;",
    values: ["validated", correctClass, newPath, userId, id],
  });

  return response.status(200).json({
    message: "Imagem validada com sucesso!",
    newPath,
  });
}
