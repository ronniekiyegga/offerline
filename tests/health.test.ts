import request from "supertest";
import { describe, it, expect } from "vitest";
import { createApp } from "../app.js";

describe("GET /health", () => {
  it("returns 200 and ok: true", async () => {
    const res = await request(createApp()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("returns structured errors for malformed JSON", async () => {
    const res = await request(createApp())
      .post("/api/v1/auth/sign-in")
      .set("Content-Type", "application/json")
      .send('{"email":');

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual({
      code: "INVALID_JSON",
      message: "Request body contains invalid JSON.",
    });
  });
});
