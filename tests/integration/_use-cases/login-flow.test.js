import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("Use case: Login Flow (Success and Failures)", () => {
  const userEmail = "login.test@ecosort.com";
  const userPassword = "ValidPassword123";

  // eslint-disable-next-line jest/expect-expect
  test("Setup: Create a valid user", async () => {
    await orchestrator.createUser({
      email: userEmail,
      password: userPassword,
    });
  });

  test("Should reject login with non-existent email", async () => {
    const response = await fetch("http://localhost:3000/api/v1/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "fantasma@ecosort.com",
        password: "AnyPassword123",
      }),
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  test("Should reject login with incorrect password", async () => {
    const response = await fetch("http://localhost:3000/api/v1/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail, password: "WrongPassword!" }),
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  test("Should successfully login and return session cookie", async () => {
    const response = await fetch("http://localhost:3000/api/v1/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail, password: userPassword }),
    });

    expect(response.status).toBe(201);

    const responseBody = await response.json();
    expect(responseBody.token).toBeDefined();

    const setCookieHeader = response.headers.get("set-cookie");
    expect(setCookieHeader).toContain("session_id=");
  });
});
