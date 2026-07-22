import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("Retrieving users should not be allowed", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users");
      expect(response.status).toBe(401);
    });
  });

  describe("Authenticated Admin User", () => {
    test("Retrieving users should return correct status and never expose passwords", async () => {
      const adminUser = await orchestrator.createUser({
        email: "admin.list@ecosort.com",
      });
      await orchestrator.addFeaturesToUser(adminUser, ["admin"]);
      const adminSession = await orchestrator.createSession(adminUser.id);

      const invitedUser = await orchestrator.createUser({
        email: "pendente.list@ecosort.com",
        password: "SenhaSecretaQueNaoPodeVazar123",
      });

      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "GET",
        headers: {
          cookie: `session_id=${adminSession.token}`,
        },
      });

      expect(response.status).toBe(200);
      const responseBody = await response.json();

      expect(responseBody.length).toBeGreaterThanOrEqual(2);

      const fetchedAdmin = responseBody.find(
        (u) => u.email === adminUser.email,
      );
      const fetchedInvited = responseBody.find(
        (u) => u.email === invitedUser.email,
      );

      expect(fetchedAdmin).toBeDefined();
      expect(fetchedInvited).toBeDefined();

      expect(fetchedAdmin.status).toBe("active");
      expect(fetchedInvited.status).toBe("pending");

      expect(fetchedAdmin.password).toBeUndefined();
      expect(fetchedInvited.password).toBeUndefined();
    });
  });
});
