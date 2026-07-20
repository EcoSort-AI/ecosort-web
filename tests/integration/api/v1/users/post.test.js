import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
});

describe("POST /api/v1/users", () => {
  test("Should block public user registration with Method Not Allowed", async () => {
    const response = await fetch("http://localhost:3000/api/v1/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "hacker123",
        email: "hacker@test.com",
        password: "senhasecreta",
      }),
    });

    expect(response.status).toBe(405);
  });
});
