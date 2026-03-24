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
      const payload = {
        bin_id: "smart_bin_01",
        timestamp: "2026-03-19T16:00:00.000Z",
        detection: {
          class_name: "glass",
          confidence: 0.885,
        },
      };
      await trashEvent.create(payload);
      const response = await fetch("http://localhost:3000/api/v1/trash-events");
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(Array.isArray(responseBody.events)).toBe(true);
      expect(responseBody.events.length).toBeGreaterThan(0);
      expect(typeof responseBody.total).toBe("number");
      expect(responseBody.total).toBeGreaterThan(0);
    });
  });
});
