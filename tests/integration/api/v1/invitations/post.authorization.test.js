import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/invitations - Authorization", () => {
  test("Should forbid a standard Collaborator from sending invitations", async () => {
    const collaborator = await orchestrator.createUser({
      email: "colaborador.simples@ecosort.com",
    });
    const session = await orchestrator.createSession(collaborator.id);

    const response = await fetch("http://localhost:3000/api/v1/invitations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `session_id=${session.token}`,
      },
      body: JSON.stringify({ email: "novo.hacker@ecosort.com" }),
    });

    expect(response.status).toBe(403);

    const responseBody = await response.json();
    expect(responseBody.name).toBe("ForbiddenError");
  });
});
