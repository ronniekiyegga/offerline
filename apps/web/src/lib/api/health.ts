import "server-only";

import { requestApiHealth } from "./health-request";

function configuredApiBaseUrl(): URL {
  const rawUrl = process.env.OFFERLINE_API_BASE_URL?.trim();
  if (!rawUrl) {
    throw new Error("OFFERLINE_API_BASE_URL is not configured.");
  }

  const url = new URL(rawUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("OFFERLINE_API_BASE_URL must use HTTP or HTTPS.");
  }
  return url;
}

export async function checkConfiguredApiHealth(): Promise<void> {
  await requestApiHealth(configuredApiBaseUrl());
}
