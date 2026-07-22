import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import database from "infra/database.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

router.get(async (request, response) => {
  if (!request.context.user.id) {
    return response
      .status(401)
      .json({ error: "Você precisa estar logado para realizar essa ação." });
  }

  const result = await database.query(`
    SELECT 
      id, 
      username, 
      email, 
      features, 
      created_at,
      CASE 
        WHEN 'admin' = ANY(features) 
          OR 'create:user' = ANY(features) 
          OR 'read:dashboard' = ANY(features) THEN 'active'
        ELSE 'pending'
      END as status
    FROM users 
    ORDER BY created_at ASC;
  `);
  return response.status(200).json(result.rows);
});

export default router.handler(controller.errorHandlers);
