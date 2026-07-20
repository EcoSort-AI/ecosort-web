import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/activations/[token_id]", () => {
  describe("Validation Errors", () => {
    test("Should block activation if password is too short", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/activations/any-token-id",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: "123" }),
        },
      );

      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.message).toEqual(
        "A senha deve conter no mínimo 8 caracteres.",
      );
    });
  });

  describe("Successful Activation Flow", () => {
    test("Should set new password, activate user and inject admin features", async () => {
      const adminUser = await orchestrator.createUser({});
      await orchestrator.addFeaturesToUser(adminUser, ["create:invitation"]);
      const session = await orchestrator.createSession(adminUser.id);

      await fetch("http://localhost:3000/api/v1/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({ email: "convidado_teste_patch@exemplo.com" }),
      });

      const email = await orchestrator.getLastEmail();
      const token = orchestrator.extractUUID(email.text);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${token}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: "minha_nova_senha_segura" }),
        },
      );

      expect(response.status).toBe(200);

      const retryResponse = await fetch(
        `http://localhost:3000/api/v1/activations/${token}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: "outra_senha_qualquer" }),
        },
      );

      expect(retryResponse.status).toBe(404);
    });
  });
});
