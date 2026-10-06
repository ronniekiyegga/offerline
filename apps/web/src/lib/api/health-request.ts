export const API_HEALTH_TIMEOUT_MS = 3_000;

export type ApiHealthPayload = { ok: true };
export type ApiHealthFailureCode =
  | "connection"
  | "malformed-response"
  | "timeout"
  | "upstream-response";

export class ApiHealthError extends Error {
  constructor(
    public readonly code: ApiHealthFailureCode,
    message: string,
    public readonly upstreamStatus?: number,
  ) {
    super(message);
    this.name = "ApiHealthError";
  }
}

function isApiHealthPayload(value: unknown): value is ApiHealthPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    value.ok === true
  );
}

type HealthRequestOptions = {
  fetchImplementation?: typeof fetch;
  timeoutMs?: number;
};

export async function requestApiHealth(
  apiBaseUrl: URL,
  options: HealthRequestOptions = {},
): Promise<ApiHealthPayload> {
  const fetchImplementation = options.fetchImplementation ?? fetch;
  const timeoutMs = options.timeoutMs ?? API_HEALTH_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetchImplementation(new URL("/health", apiBaseUrl), {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } catch {
    if (controller.signal.aborted) {
      throw new ApiHealthError("timeout", "The API health request timed out.");
    }
    throw new ApiHealthError("connection", "The API could not be reached.");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new ApiHealthError(
      "upstream-response",
      "The API returned an unsuccessful response.",
      response.status,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiHealthError(
      "malformed-response",
      "The API returned malformed JSON.",
    );
  }

  if (!isApiHealthPayload(payload)) {
    throw new ApiHealthError(
      "malformed-response",
      "The API health response did not match its contract.",
    );
  }

  return payload;
}
