import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  // Adicionado runPendingMigrations para garantir que as tabelas existem antes de rodar
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/invitations", () => {
  describe("Anonymous user", () => {
    test("Should not be able to send an invitation", async () => {
      const response = await fetch("http://localhost:3000/api/v1/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@test.com" }),
      });

      // Bloqueia usuários não logados com 403 Forbidden
      expect(response.status).toBe(403);
    });
  });

  describe("Authenticated Admin", () => {
    test("Should send invitation successfully", async () => {
      // 1. Cria um usuário básico no banco
      const adminUser = await orchestrator.createUser({});

      // 2. Adiciona a feature de convite a esse usuário recém-criado
      await orchestrator.addFeaturesToUser(adminUser, ["create:invitation"]);

      // 3. Cria uma sessão válida no banco para extrair o token
      const session = await orchestrator.createSession(adminUser.id);

      // 4. Faz a requisição enviando o token no formato de cookie "session_id=..."
      const response = await fetch("http://localhost:3000/api/v1/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({ email: "novo_admin@exemplo.com" }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(201);
      expect(responseBody.message).toEqual("Convite enviado com sucesso!");
      expect(responseBody.userId).toBeDefined();
    });
  });
});
