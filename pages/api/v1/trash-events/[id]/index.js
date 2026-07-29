import { createRouter } from "next-connect";
import { z } from "zod";
import { ValidationError, NotFoundError } from "infra/errors.js";
import controller from "infra/controller.js";
import database from "infra/database";
import s3Client from "infra/storage";
import { CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const { id } = request.query;

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

  await database.query({
    text: "UPDATE trash_detections SET status = $1, item_class = $2, image_path = $3 WHERE id = $4;",
    values: ["validated", correctClass, newPath, id],
  });

  return response.status(200).json({
    message: "Imagem validada e movida com sucesso!",
    newPath,
  });
}
