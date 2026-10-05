import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { prisma } from "../database/neondb.js";
import { issueAccessToken } from "../lib/jwtAccess.js";

function bearer(userId: number): { Authorization: string } {
  return { Authorization: `Bearer ${issueAccessToken(userId)}` };
}

function billingRow(overrides: Record<string, unknown> = {}) {
  const createdAt = new Date("2025-01-01T00:00:00.000Z");
  return {
    id: 7,
    userId: 11,
    planId: 2,
    usageMetrics: { seats: 3 },
    status: "ACTIVE" as const,
    startDate: new Date("2025-01-01T00:00:00.000Z"),
    renewalDate: new Date("2030-01-01T00:00:00.000Z"),
    createdAt,
    updatedAt: createdAt,
    plan: {
      id: 2,
      name: "Professional",
      price: 2900,
      currency: "GBP" as const,
      frequency: "MONTHLY" as const,
      category: null,
      createdAt,
      updatedAt: createdAt,
    },
    ...overrides,
  };
}

describe("billing authorization and lifecycle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ["get", "/api/v1/billing"],
    ["get", "/api/v1/billing/renewals"],
    ["get", "/api/v1/billing/7"],
    ["put", "/api/v1/billing/7"],
    ["delete", "/api/v1/billing/7"],
  ] as const)("requires authentication for %s %s", async (method, path) => {
    const res = await request(createApp())[method](path);

    expect(res.status).toBe(401);
    expect(res.body.error?.code).toBe("UNAUTHORIZED");
  });

  it("scopes billing lists to the authenticated owner", async () => {
    vi.spyOn(prisma.subscription, "findMany").mockResolvedValue([
      billingRow(),
    ] as never);

    const res = await request(createApp())
      .get("/api/v1/billing")
      .set(bearer(11));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(prisma.subscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 11 } }),
    );
  });

  it("does not reveal a billing record owned by another user", async () => {
    vi.spyOn(prisma.subscription, "findFirst").mockResolvedValue(null);

    const res = await request(createApp())
      .get("/api/v1/billing/7")
      .set(bearer(12));

    expect(res.status).toBe(404);
    expect(res.body.error?.code).toBe("NOT_FOUND");
    expect(prisma.subscription.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 7, userId: 12 } }),
    );
  });

  it("constrains deletion by both record and owner", async () => {
    vi.spyOn(prisma.subscription, "deleteMany").mockResolvedValue({ count: 0 });

    const res = await request(createApp())
      .delete("/api/v1/billing/7")
      .set(bearer(12));

    expect(res.status).toBe(404);
    expect(prisma.subscription.deleteMany).toHaveBeenCalledWith({
      where: { id: 7, userId: 12 },
    });
  });

  it("updates only after an owner-scoped lookup", async () => {
    const existing = billingRow();
    vi.spyOn(prisma.subscription, "findFirst").mockResolvedValue(
      existing as never,
    );
    vi.spyOn(prisma.subscription, "update").mockResolvedValue({
      ...existing,
      usageMetrics: { seats: 5 },
    } as never);

    const res = await request(createApp())
      .put("/api/v1/billing/7")
      .set(bearer(11))
      .send({ usageMetrics: { seats: 5 } });

    expect(res.status).toBe(200);
    expect(prisma.subscription.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 7, userId: 11 } }),
    );
    expect(prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 7, userId: 11 } }),
    );
    expect(res.body.data.usageMetrics).toEqual({ seats: 5 });
  });

  it("rejects unknown create fields instead of silently discarding them", async () => {
    const res = await request(createApp())
      .post("/api/v1/billing/subscribe")
      .set(bearer(11))
      .send({
        planId: 2,
        startDate: "2025-01-01T00:00:00.000Z",
        userId: 999,
      });

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe("VALIDATION_ERROR");
  });

  it("returns an effective expired status without losing cancellation", async () => {
    vi.spyOn(prisma.subscription, "findFirst")
      .mockResolvedValueOnce(
        billingRow({
          renewalDate: new Date("2020-01-01T00:00:00.000Z"),
        }) as never,
      )
      .mockResolvedValueOnce(
        billingRow({
          status: "CANCELLED",
          renewalDate: new Date("2020-01-01T00:00:00.000Z"),
        }) as never,
      );

    const expired = await request(createApp())
      .get("/api/v1/billing/7")
      .set(bearer(11));
    const cancelled = await request(createApp())
      .get("/api/v1/billing/7")
      .set(bearer(11));

    expect(expired.body.data.status).toBe("EXPIRED");
    expect(cancelled.body.data.status).toBe("CANCELLED");
  });
});
