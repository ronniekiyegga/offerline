import request from "supertest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/database/neondb.js";
import { issueAccessToken } from "../src/lib/jwtAccess.js";

function bearerForUserId(id: number): string {
  return issueAccessToken(id);
}

describe("POST /api/v1/billing/subscribe", () => {
  beforeEach(() => {
    vi.spyOn(prisma.plan, "findUnique").mockReset();
    vi.spyOn(prisma.subscription, "create").mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 without Authorization", async () => {
    const res = await request(createApp())
      .post("/api/v1/billing/subscribe")
      .send({
        planId: 1,
        startDate: "2020-06-01T00:00:00.000Z",
      });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid body (Zod)", async () => {
    const res = await request(createApp())
      .post("/api/v1/billing/subscribe")
      .set("Authorization", `Bearer ${bearerForUserId(1)}`)
      .send({ planId: "nope", startDate: "not-a-date" });
    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe("VALIDATION_ERROR");
  });

  it("returns 201 and billing record when plan exists", async () => {
    const start = new Date("2020-06-01T00:00:00.000Z");
    const renewal = new Date("2020-07-01T00:00:00.000Z");
    const createdAt = new Date("2024-01-01T00:00:00.000Z");
    const updatedAt = new Date("2024-01-01T00:00:00.000Z");

    vi.spyOn(prisma.plan, "findUnique").mockResolvedValue({
      id: 1,
      name: "Starter",
      price: 0,
      currency: "GBP",
      frequency: "MONTHLY",
      category: null,
      createdAt,
      updatedAt,
    });

    vi.spyOn(prisma.subscription, "create").mockResolvedValue({
      id: 7,
      userId: 1,
      planId: 1,
      usageMetrics: { apiCalls: 42 },
      status: "ACTIVE",
      startDate: start,
      renewalDate: renewal,
      createdAt,
      updatedAt,
      plan: {
        id: 1,
        name: "Starter",
        price: 0,
        currency: "GBP",
        frequency: "MONTHLY",
        category: null,
        createdAt,
        updatedAt,
      },
    } as never);

    const res = await request(createApp())
      .post("/api/v1/billing/subscribe")
      .set("Authorization", `Bearer ${bearerForUserId(1)}`)
      .send({
        planId: 1,
        startDate: start.toISOString(),
        usageMetrics: { apiCalls: 42 },
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      id: 7,
      userId: 1,
      planId: 1,
      plan: { id: 1, name: "Starter" },
    });
    expect(res.body.data.usageMetrics).toEqual({ apiCalls: 42 });
    expect(prisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 1,
          planId: 1,
          usageMetrics: { apiCalls: 42 },
        }),
      }),
    );
  });
});
