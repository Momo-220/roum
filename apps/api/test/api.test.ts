import { describe, expect, it } from "vitest";
import app from "../src/index";

describe("API Health & Routing", () => {
  it("GET /health renvoie un statut ok et l'environnement", async () => {
    const res = await app.request("/health", {
      method: "GET",
    }, {
      APP_NAME: "ROUM_TRANSIT_TEST",
      ENVIRONMENT: "test",
      DB: {} as any,
    });

    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.status).toBe("ok");
    expect(json.app).toBe("ROUM_TRANSIT_TEST");
    expect(json.env).toBe("test");
  });

  it("GET /route-inexistante renvoie une 404 propre en JSON", async () => {
    const res = await app.request("/route-inexistante");
    expect(res.status).toBe(404);
    const json = await res.json() as any;
    expect(json.error).toContain("introuvable");
  });

  it("GET /api/v1/public/tracking/mauvais-format renvoie une 400", async () => {
    const res = await app.request("/api/v1/public/tracking/123456", {
      method: "GET",
    }, {
      DB: {} as any,
      APP_NAME: "ROUM_TRANSIT_TEST",
      ENVIRONMENT: "test",
    });

    expect(res.status).toBe(400);
    const json = await res.json() as any;
    expect(json.error).toContain("invalide");
  });
});
