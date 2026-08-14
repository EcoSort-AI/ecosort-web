import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import database from "infra/database.js";
import authorization from "models/authorization.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

router.get(controller.canRequest("read:user"), getHandler);

router.patch(controller.canRequest("update:user:others"), patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const { username } = request.query;

  const result = await database.query({
    text: "SELECT features FROM users WHERE username = $1;",
    values: [username],
  });

  if (result.rows.length === 0) {
    return response.status(404).json({ message: "Usuário não encontrado." });
  }

  return response.status(200).json({
    available_features: authorization.availableFeatures,
    user_features: result.rows[0].features || [],
  });
}

async function patchHandler(request, response) {
  const { username } = request.query;
  const { new_features } = request.body;

  if (!Array.isArray(new_features)) {
    return response
      .status(400)
      .json({ message: "O formato de 'new_features' deve ser um array." });
  }

  const sanitizedFeatures = new_features.filter((f) =>
    authorization.availableFeatures.includes(f),
  );

  const result = await database.query({
    text: `
      UPDATE users 
      SET features = $1, updated_at = timezone('utc', now()) 
      WHERE username = $2 
      RETURNING features;
    `,
    values: [sanitizedFeatures, username],
  });

  if (result.rows.length === 0) {
    return response.status(404).json({ message: "Usuário não encontrado." });
  }

  return response.status(200).json({
    message: "Permissões atualizadas com sucesso.",
    user_features: result.rows[0].features,
  });
}
