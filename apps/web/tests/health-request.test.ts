import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ApiHealthError,
  requestApiHealth,
} from "../src/lib/api/health-request";

const apiBaseUrl = new URL("https://api.offerline.test");

afterEach(() => {
  vi.useRealTimers();
});

describe("requestApiHealth", () => {
  it("accepts the expected successful response without caching", async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      requestApiHealth(apiBaseUrl, { fetchImplementation }),
    ).resolves.toEqual({ ok: true });
    expect(fetchImplementation).toHaveBeenCalledWith(
      new URL("https://api.offerline.test/health"),
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("rejects an unsuccessful upstream response", async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 503 }));

    await expect(
      requestApiHealth(apiBaseUrl, { fetchImplementation }),
    ).rejects.toMatchObject({
      code: "upstream-response",
      upstreamStatus: 503,
    });
  });

  it("rejects a successful response with the wrong shape", async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ healthy: true }), { status: 200 }),
    );

    await expect(
      requestApiHealth(apiBaseUrl, { fetchImplementation }),
    ).rejects.toMatchObject({ code: "malformed-response" });
  });

  it("normalizes connection failures", async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError("connection refused"));

    await expect(
      requestApiHealth(apiBaseUrl, { fetchImplementation }),
    ).rejects.toMatchObject({ code: "connection" });
  });

  it("aborts an upstream request after the configured timeout", async () => {
    vi.useFakeTimers();
    const fetchImplementation = vi.fn<typeof fetch>((_input, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });

    const request = requestApiHealth(apiBaseUrl, {
      fetchImplementation,
      timeoutMs: 50,
    });
    const expectation = expect(request).rejects.toBeInstanceOf(ApiHealthError);

    await vi.advanceTimersByTimeAsync(50);
    await expectation;
    await expect(request).rejects.toMatchObject({ code: "timeout" });
  });
});
