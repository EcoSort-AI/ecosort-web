import orchestrator from "tests/orchestrator.js";
import trashEvent from "models/trashEvent.js";
import database from "infra/database.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/trash-events/[id]", () => {
  test("Validating an event saves the user ID and updates status correctly without hitting R2", async () => {
    const user = await orchestrator.createUser({ username: "auditor_teste" });
    await orchestrator.addFeaturesToUser(user, ["review:trash_detection"]);
    const session = await orchestrator.createSession(user.id);

    const eventData = await trashEvent.create({
      bin_id: "smart_bin_validation",
      timestamp: new Date().toISOString(),
      detection: { class_name: "paper", confidence: 0.75 },
      image_path: "dataset/pending/mock_image.jpg",
    });

    const response = await fetch(
      `http://localhost:3000/api/v1/trash-events/${eventData.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({ correctClass: "cardboard" }),
      },
    );

    expect(response.status).toBe(200);

    const dbResult = await database.query({
      text: "SELECT review_status, storage_status, dataset_status, item_class, reviewed_by, reviewed_at, stored_at FROM trash_detections WHERE id = $1",
      values: [eventData.id],
    });

    const updatedEvent = dbResult.rows[0];

    expect(updatedEvent.review_status).toBe("approved");
    expect(updatedEvent.storage_status).toBe("stored");
    expect(updatedEvent.dataset_status).toBe("eligible");
    expect(updatedEvent.item_class).toBe("cardboard");
    expect(updatedEvent.reviewed_by).toBe(user.id);

    expect(updatedEvent.reviewed_at).not.toBeNull();
    expect(updatedEvent.reviewed_at instanceof Date).toBe(true);
    expect(updatedEvent.stored_at).not.toBeNull();
    expect(updatedEvent.stored_at instanceof Date).toBe(true);
  });

  test("Should return 409 Conflict when attempting to review an item that has already been reviewed (Concurrency)", async () => {
    const userA = await orchestrator.createUser({ username: "revisor_a" });
    const userB = await orchestrator.createUser({ username: "revisor_b" });
    await orchestrator.addFeaturesToUser(userA, ["review:trash_detection"]);
    await orchestrator.addFeaturesToUser(userB, ["review:trash_detection"]);
    const sessionB = await orchestrator.createSession(userB.id);

    const event = await trashEvent.create({
      bin_id: "bin-concorrencia",
      timestamp: new Date().toISOString(),
      detection: { class_name: "paper", confidence: 0.88 },
      image_path: "dataset/pending/mock_image_2.jpg",
    });

    await trashEvent.review(event.id, "cardboard", userA.id);

    const response = await fetch(
      `http://localhost:3000/api/v1/trash-events/${event.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: `session_id=${sessionB.token}`,
        },
        body: JSON.stringify({ correctClass: "cardboard" }),
      },
    );

    expect(response.status).toBe(409);

    const responseBody = await response.json();
    expect(responseBody.name).toBe("ConcurrencyError");
  });
});
