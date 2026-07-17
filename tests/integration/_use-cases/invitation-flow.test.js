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

describe("Use case: Invitation Flow (all successful)", () => {
  let adminSessionToken;
  let invitedUserId;
  let activationTokenId;
  let newSessionResponseBody;

  const invitedEmail = "convidado.flow@ecosort.com";
  const newPassword = "NovaSenhaSegura123";

  // eslint-disable-next-line jest/expect-expect
  test("Setup: Create Admin User", async () => {
    const adminUser = await orchestrator.createUser({});
    await orchestrator.addFeaturesToUser(adminUser, ["create:invitation"]);
    const session = await orchestrator.createSession(adminUser.id);

    adminSessionToken = session.token;
  });

  test("Send invitation to a new email", async () => {
    const inviteResponse = await fetch(
      "http://localhost:3000/api/v1/invitations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `session_id=${adminSessionToken}`,
        },
        body: JSON.stringify({
          email: invitedEmail,
        }),
      },
    );

    expect(inviteResponse.status).toBe(201);

    const inviteResponseBody = await inviteResponse.json();
    expect(inviteResponseBody.message).toEqual("Convite enviado com sucesso!");

    invitedUserId = inviteResponseBody.userId;
  });

  test("Receive invitation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@ecosort.com.br>");
    expect(lastEmail.recipients[0]).toBe(`<${invitedEmail}>`);

    activationTokenId = orchestrator.extractUUID(lastEmail.text);
    expect(lastEmail.text).toContain(
      `${webserver.origin}/convite/${activationTokenId}`,
    );

    const activationTokenObject =
      await activation.findOneValidById(activationTokenId);
    expect(activationTokenObject.user_id).toBe(invitedUserId);
    expect(activationTokenObject.used_at).toBe(null);
  });

  test("Activate account and set password", async () => {
    const activationResponse = await fetch(
      `http://localhost:3000/api/v1/activations/${activationTokenId}`,
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

    expect(activationResponse.status).toBe(200);

    const activationResponseBody = await activationResponse.json();

    expect(Date.parse(activationResponseBody.used_at)).not.toBeNaN();

    const activatedUser = await user.findOneById(invitedUserId);
    expect(activatedUser.features).toEqual(
      expect.arrayContaining([
        "read:dashboard",
        "read:trash_events",
        "create:session",
      ]),
    );
  });

  test("Login with new credentials", async () => {
    const createSessionsResponse = await fetch(
      "http://localhost:3000/api/v1/sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: invitedEmail,
          password: newPassword,
        }),
      },
    );

    expect(createSessionsResponse.status).toBe(201);

    newSessionResponseBody = await createSessionsResponse.json();
    expect(newSessionResponseBody.user_id).toBe(invitedUserId);
  });

  test("Get user information", async () => {
    const userResponse = await fetch("http://localhost:3000/api/v1/user", {
      headers: {
        cookie: `session_id=${newSessionResponseBody.token}`,
      },
    });

    expect(userResponse.status).toBe(200);

    const userResponseBody = await userResponse.json();
    expect(userResponseBody.id).toBe(invitedUserId);
  });
});
