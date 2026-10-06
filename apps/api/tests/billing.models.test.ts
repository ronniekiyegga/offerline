import { describe, expect, it, vi } from "vitest";
import {
  calculateRenewalDate,
  resolveSubscriptionStatusByRenewal,
} from "../src/models/billing.models.js";

describe("billing date rules", () => {
  it("uses calendar months and clamps to the last day", () => {
    const start = new Date("2024-01-31T10:15:00.000Z");

    expect(calculateRenewalDate(start, "MONTHLY").toISOString()).toBe(
      "2024-02-29T10:15:00.000Z",
    );
  });

  it("uses calendar years for leap-day subscriptions", () => {
    const start = new Date("2024-02-29T10:15:00.000Z");

    expect(calculateRenewalDate(start, "YEARLY").toISOString()).toBe(
      "2025-02-28T10:15:00.000Z",
    );
  });

  it("expires only active records whose renewal is in the past", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const past = new Date("2025-12-31T23:59:59.000Z");

    expect(resolveSubscriptionStatusByRenewal(past, "ACTIVE")).toBe("EXPIRED");
    expect(resolveSubscriptionStatusByRenewal(past, "CANCELLED")).toBe(
      "CANCELLED",
    );

    vi.useRealTimers();
  });
});
