import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST to /api/v1/trash-events", () => {
  describe("Device Authentication (P0-04)", () => {
    test("Saving a new detection from the smart bin with valid token", async () => {
      const payload = {
        bin_id: "smart_bin_01",
        timestamp: "2026-03-19T15:01:52.939Z",
        detection: {
          class_name: "plastic",
          confidence: 0.932,
        },
      };

      const response = await fetch(
        "http://localhost:3000/api/v1/trash-events",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer ecotoken_smart_bin_01",
          },
          body: JSON.stringify(payload),
        },
      );

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody.id).toBeDefined();
      expect(responseBody.bin_id).toBe("smart_bin_01");
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
            bin_id: "smart_bin_01",
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
            Authorization: "Bearer ecotoken_outra_lixeira",
          },
          body: JSON.stringify({
            bin_id: "smart_bin_01",
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
            Authorization: "Bearer ecotoken_smart_bin_quebrada",
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
