import { NextResponse } from "next/server";

import { checkConfiguredApiHealth } from "@/lib/api/health";
import { ApiHealthError } from "@/lib/api/health-request";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
} as const;

export async function GET(): Promise<NextResponse> {
  try {
    await checkConfiguredApiHealth();
    return NextResponse.json(
      { status: "reachable" },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    const code = error instanceof ApiHealthError ? error.code : "configuration";
    const upstreamStatus =
      error instanceof ApiHealthError ? error.upstreamStatus : undefined;
    console.error("API connectivity check failed", { code, upstreamStatus });

    return NextResponse.json(
      {
        status: "unavailable",
        message: "The API is not reachable right now.",
      },
      { status: 503, headers: noStoreHeaders },
    );
  }
}
