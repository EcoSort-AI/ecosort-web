/* eslint-disable no-unused-vars */
import user from "models/user.js";
import activation from "models/activation.js";
import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Password Recovery Flow", () => {
  const userEmail = "recovery.test@ecosort.com";
  const oldPassword = "OldPassword123";
  const newPassword = "NewSecurePassword456!";

  let userId;
  let recoveryTokenId;

  // eslint-disable-next-line jest/expect-expect
  test("Setup: Create a valid user", async () => {
    const createdUser = await orchestrator.createUser({
      email: userEmail,
      password: oldPassword,
    });
    userId = createdUser.id;
  });

  test("Request password recovery", async () => {
    const recoveryResponse = await fetch(
      "http://localhost:3000/api/v1/recovery",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
        }),
      },
    );

    expect(recoveryResponse.status).toBe(200);

    const responseBody = await recoveryResponse.json();
    expect(responseBody.message).toEqual(
      "Se o e-mail estiver cadastrado, as instruções foram enviadas.",
    );
  });

  test("Receive recovery email and extract token", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@ecosort.com.br>");
    expect(lastEmail.recipients[0]).toBe(`<${userEmail}>`);

    recoveryTokenId = orchestrator.extractUUID(lastEmail.text);

    expect(lastEmail.text).toContain(
      `${webserver.origin}/recuperar-senha/${recoveryTokenId}`,
    );

    const tokenObject = await activation.findOneValidById(recoveryTokenId);
    expect(tokenObject.user_id).toBe(userId);
    expect(tokenObject.used_at).toBe(null);
  });

  test("Set new password using recovery token", async () => {
    const patchResponse = await fetch(
      `http://localhost:3000/api/v1/recovery/${recoveryTokenId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: newPassword,
        }),
      },
    );

    expect(patchResponse.status).toBe(200);

    const patchResponseBody = await patchResponse.json();
    expect(patchResponseBody.message).toEqual("Senha atualizada com sucesso.");
  });

  test("Fail to login with old password", async () => {
    const failLoginResponse = await fetch(
      "http://localhost:3000/api/v1/sessions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, password: oldPassword }),
      },
    );

    expect(failLoginResponse.status).toBeGreaterThanOrEqual(400);
  });

  test("Successfully login with new password", async () => {
    const successLoginResponse = await fetch(
      "http://localhost:3000/api/v1/sessions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, password: newPassword }),
      },
    );

    expect(successLoginResponse.status).toBe(201);

    const responseBody = await successLoginResponse.json();
    const setCookieHeader = successLoginResponse.headers.get("set-cookie");
    expect(setCookieHeader).toContain("session_id=");
  });
});
