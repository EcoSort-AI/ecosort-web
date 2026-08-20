import orchestrator from "tests/orchestrator.js";
import crypto from "node:crypto";
import database from "infra/database.js";

const TEST_BIN_ID = "smart_bin_01";
const TEST_TOKEN = "eco_test_secret_token";
const TEST_TOKEN_HASH = crypto
  .createHash("sha256")
  .update(TEST_TOKEN)
  .digest("hex");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();

  await database.query({
    text: `
      INSERT INTO device_settings (device_name, confidence_threshold, classes_status, token_hash) 
      VALUES ($1, 80, '{"plastico": true}'::jsonb, $2)
    `,
    values: [TEST_BIN_ID, TEST_TOKEN_HASH],
  });
});

describe("POST to /api/v1/trash-events", () => {
  describe("Device Authentication (P0-04)", () => {
    test("Saving a new detection from the smart bin with valid token", async () => {
      const payload = {
        bin_id: TEST_BIN_ID,
        timestamp: "2026-03-19T15:01:52.939Z",
        detection: {
          class_name: "plastic",
          confidence: 0.932,
        },
        image_path: "pending/test-mock-image.jpg",
      };

      const response = await fetch(
        "http://localhost:3000/api/v1/trash-events",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TEST_TOKEN}`,
          },
          body: JSON.stringify(payload),
        },
      );

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody.id).toBeDefined();
      expect(responseBody.bin_id).toBe(TEST_BIN_ID);
      expect(responseBody.item_class).toBe("plastic");
      expect(responseBody.confidence).toBeCloseTo(0.932);
      expect(responseBody.review_status).toBe("pending");
      expect(responseBody.storage_status).toBe("pending");
      expect(responseBody.dataset_status).toBe("pending");
    });

    test("Should reject request without Bearer token", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/trash-events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bin_id: TEST_BIN_ID,
            timestamp: "2026-03-19T15:01:52.939Z",
            detection: { class_name: "plastic", confidence: 0.932 },
          }),
        },
      );

      expect(response.status).toBe(401);
      const responseBody = await response.json();
      expect(responseBody.name).toBe("UnauthorizedError");
    });

    test("Should reject request if token does not match the bin_id", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/trash-events",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer token_falso_ou_invalido",
          },
          body: JSON.stringify({
            bin_id: TEST_BIN_ID,
            timestamp: "2026-03-19T15:01:52.939Z",
            detection: { class_name: "plastic", confidence: 0.932 },
          }),
        },
      );

      expect(response.status).toBe(403);
      const responseBody = await response.json();
      expect(responseBody.name).toBe("ForbiddenError");
    });

    test("With invalid data (Zod Validation)", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/trash-events",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TEST_TOKEN}`,
          },
          body: JSON.stringify({
            bin_id: "smart_bin_quebrada",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message:
          "O campo 'timestamp' é obrigatório e deve ser uma data válida no formato ISO 8601.",
        action: "Ajuste os dados enviados e tente novamente.",
        status_code: 400,
      });
    });
  });
});
