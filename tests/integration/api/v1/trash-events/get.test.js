import orchestrator from "tests/orchestrator.js";
import trashEvent from "models/trashEvent.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/trash-events", () => {
  describe("Anonymous user", () => {
    test("Retrieving latest detections", async () => {
      const user = await orchestrator.createUser({});
      await orchestrator.addFeaturesToUser(user, ["read:trash_events"]);
      const session = await orchestrator.createSession(user.id);

      const payload = {
        bin_id: "smart_bin_01",
        timestamp: "2026-03-19T16:00:00.000Z",
        detection: {
          class_name: "plastic",
          confidence: 0.885,
        },
      };
      await trashEvent.create(payload);
      const response = await fetch(
        "http://localhost:3000/api/v1/trash-events",
        {
          headers: {
            cookie: `session_id=${session.token}`,
          },
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(Array.isArray(responseBody.events)).toBe(true);
      expect(responseBody.events.length).toBeGreaterThan(0);
      expect(typeof responseBody.total).toBe("number");
      expect(responseBody.total).toBeGreaterThan(0);
    });

    test("Filtering detections by status (pending)", async () => {
      const user = await orchestrator.createUser({});
      await orchestrator.addFeaturesToUser(user, ["read:trash_events"]);
      const session = await orchestrator.createSession(user.id);

      await trashEvent.create({
        bin_id: "test_bin_pending",
        timestamp: new Date().toISOString(),
        detection: { class_name: "plastic", confidence: 0.9 },
      });

      await trashEvent.create({
        bin_id: "test_bin_processed",
        timestamp: new Date().toISOString(),
        detection: { class_name: "metal", confidence: 0.9 },
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/trash-events?status=pending",
        {
          headers: {
            cookie: `session_id=${session.token}`,
          },
        },
      );

      expect(response.status).toBe(200);
      const responseBody = await response.json();

      expect(Array.isArray(responseBody.events)).toBe(true);
      expect(responseBody.events.length).toBeGreaterThan(0);

      responseBody.events.forEach((event) => {
        expect(event.review_status).toBe("pending");
      });
    });

    test("Filtering detections by specific reviewer (User Autoria)", async () => {
      const userA = await orchestrator.createUser({ username: "validador_a" });
      const userB = await orchestrator.createUser({ username: "validador_b" });
      await orchestrator.addFeaturesToUser(userA, ["read:trash_events"]);
      const session = await orchestrator.createSession(userA.id);

      const database = (await import("infra/database.js")).default;

      await database.query({
        text: `INSERT INTO trash_detections (bin_id, item_class, ai_prediction, confidence, detected_at, review_status, storage_status, dataset_status, reviewed_by)
               VALUES ('bin_test', 'plastic', 'plastic', 0.9, NOW(), 'approved', 'stored', 'eligible', $1)`,
        values: [userA.id],
      });

      await database.query({
        text: `INSERT INTO trash_detections (bin_id, item_class, ai_prediction, confidence, detected_at, review_status, storage_status, dataset_status, reviewed_by)
               VALUES ('bin_test', 'metal', 'metal', 0.9, NOW(), 'approved', 'stored', 'eligible', $1)`,
        values: [userB.id],
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/trash-events?reviewer=validador_a",
        {
          headers: { cookie: `session_id=${session.token}` },
        },
      );

      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.events.length).toBeGreaterThan(0);

      responseBody.events.forEach((event) => {
        expect(event.reviewed_by_username).toBe("validador_a");
      });
    });

    test("Filtering detections by system (unreviewed events)", async () => {
      const user = await orchestrator.createUser({});
      await orchestrator.addFeaturesToUser(user, ["read:trash_events"]);
      const session = await orchestrator.createSession(user.id);

      const database = (await import("infra/database.js")).default;

      await database.query({
        text: `INSERT INTO trash_detections (bin_id, item_class, ai_prediction, confidence, detected_at, review_status, storage_status, dataset_status, reviewed_by)
               VALUES ('bin_test', 'glass', 'glass', 0.9, NOW(), 'pending', 'pending', 'pending', NULL)`,
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/trash-events?reviewer=system",
        {
          headers: { cookie: `session_id=${session.token}` },
        },
      );

      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.events.length).toBeGreaterThan(0);

      responseBody.events.forEach((event) => {
        expect(event.reviewed_by_username).toBeNull();
      });
    });
  });
});
