import database from "infra/database.js";
import bcryptjs from "bcryptjs";

export default async function handler(request, response) {
  if (process.env.NODE_ENV !== "development") {
    return response
      .status(403)
      .json({ error: "Acesso negado. Rota exclusiva para ambiente local." });
  }

  if (request.method !== "GET") {
    return response.status(405).json({ error: "Método não permitido." });
  }

  console.log("Iniciando o seed do banco de dados via API...");

  const email = "admin@ecosort.local";
  const plainTextPassword = "ecosortadmin";

  try {
    const hashedPassword = await bcryptjs.hash(plainTextPassword, 10);

    const results = await database.query({
      text: `
        INSERT INTO users (username, email, password, features)
        VALUES (
          $1, 
          $2, 
          $3, 
          ARRAY['create:session', 'read:session', 'update:user', 'read:dashboard', 'create:invitation', 'read:trash_events']
        )
        ON CONFLICT (email) DO NOTHING
        RETURNING username;
      `,
      values: ["admin_local", email, hashedPassword],
    });

    if (results.rowCount > 0) {
      return response.status(201).json({
        message: "Usuário administrador criado com sucesso!",
        email: email,
        password: plainTextPassword,
      });
    } else {
      return response
        .status(200)
        .json({ message: "O administrador já existia no banco." });
    }
  } catch (error) {
    console.error("Erro no Seed:", error);
    return response
      .status(500)
      .json({ error: "Erro interno ao rodar o seed." });
  }
}
