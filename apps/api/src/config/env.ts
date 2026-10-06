import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { config } from "dotenv";

function findPackageRoot(start: string): string {
  let current = start;
  while (true) {
    if (existsSync(resolve(current, "package.json"))) return current;
    const parent = dirname(current);
    if (parent === current) {
      throw new Error("Unable to locate the API package root.");
    }
    current = parent;
  }
}

const root = findPackageRoot(import.meta.dirname);
const base = resolve(root, ".env");

if (existsSync(base)) config({ path: base });

const raw = process.env.NODE_ENV?.trim().toLowerCase();
if (raw && raw !== "development" && raw !== "production" && raw !== "test") {
  throw new Error("NODE_ENV must be development, production, or test.");
}
const NODE_ENV = raw ?? "development";

config({ path: resolve(root, `.env.${NODE_ENV}.local`), override: true });

process.env.NODE_ENV = NODE_ENV;

const DATABASE_URL = process.env.DATABASE_URL;
const DIRECT_URL = process.env.DIRECT_URL;
// JWT
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const ARCJET_KEY_RAW = process.env.ARCJET_KEY?.trim();
const ARCJET_KEY =
  ARCJET_KEY_RAW && ARCJET_KEY_RAW.length > 0 ? ARCJET_KEY_RAW : undefined;
const PORT_RAW = Number(process.env.PORT ?? 5500);

if (!Number.isInteger(PORT_RAW) || PORT_RAW < 1 || PORT_RAW > 65_535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

export const env = {
  NODE_ENV,
  PORT: PORT_RAW,
  DATABASE_URL,
  DIRECT_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  ARCJET_KEY,
} as const;

export function assertRuntimeConfig(): void {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  }
  if (
    JWT_EXPIRES_IN &&
    !/^\d+$/.test(JWT_EXPIRES_IN) &&
    !/^\d+(ms|s|m|h|d|w|y)$/.test(JWT_EXPIRES_IN)
  ) {
    throw new Error(
      "JWT_EXPIRES_IN must be seconds or a duration such as 1h or 7d.",
    );
  }
  if (NODE_ENV === "production" && !ARCJET_KEY) {
    throw new Error("ARCJET_KEY is required in production.");
  }
}
