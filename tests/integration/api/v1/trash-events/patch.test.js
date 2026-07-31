import orchestrator from "tests/orchestrator.js";
import trashEvent from "models/trashEvent.js";
import database from "infra/database.js";

// jest.mock("infra/storage", () => ({
//   __esModule: true,
//   default: {
//     send: jest.fn().mockResolvedValue({}),
//   },
// }));

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/trash-events/[id]", () => {
  test("Validating an event saves the user ID and updates status correctly without hitting R2", async () => {
    const user = await orchestrator.createUser({ username: "auditor_teste" });
    const session = await orchestrator.createSession(user.id);

    const eventData = await trashEvent.create({
      bin_id: "smart_bin_validation",
      timestamp: new Date().toISOString(),
      detection: { class_name: "paper", confidence: 0.75 },
      status: "pending",
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
      text: "SELECT status, item_class, reviewed_by FROM trash_detections WHERE id = $1",
      values: [eventData.id],
    });

    const updatedEvent = dbResult.rows[0];

    expect(updatedEvent.status).toBe("validated");
    expect(updatedEvent.item_class).toBe("cardboard");
    expect(updatedEvent.reviewed_by).toBe(user.id);
  });
});
