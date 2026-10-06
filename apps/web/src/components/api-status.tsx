"use client";

import { Check, LoaderCircle, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";

type ConnectivityState = "loading" | "reachable" | "unavailable";

function isReachableResponse(value: unknown): boolean {
  return typeof value === "object" && value !== null && "status" in value && value.status === "reachable";
}

export function ApiStatus() {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<ConnectivityState>("loading");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function checkHealth() {
      try {
        const response = await fetch("/api/health", { cache: "no-store", signal: controller.signal });
        const body: unknown = await response.json();
        if (active) setStatus(response.ok && isReachableResponse(body) ? "reachable" : "unavailable");
      } catch {
        if (active && !controller.signal.aborted) setStatus("unavailable");
      }
    }

    void checkHealth();
    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  const isRetrying = status === "loading" && attempt > 0;
  const copy = status === "reachable"
    ? { title: "API reachable", detail: "The liveness endpoint responded.", icon: Check }
    : status === "unavailable"
      ? { title: "API unavailable", detail: "The connectivity check failed.", icon: X }
      : { title: isRetrying ? "Checking again" : "Checking API reachability", detail: "Waiting for the liveness response.", icon: LoaderCircle };
  const StatusIcon = copy.icon;

  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-4 sm:grid-cols-[auto_1fr_auto]" aria-live="polite" aria-atomic="true">
      <span className={`grid size-10 place-items-center rounded-full ${status === "reachable" ? "bg-emerald-400/10 text-emerald-400" : status === "unavailable" ? "bg-red-400/10 text-red-400" : "bg-foreground/5 text-muted-foreground"}`}>
        <StatusIcon className={`size-4 ${status === "loading" ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
      </span>
      <div>
        <p className="font-medium">{copy.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{copy.detail}</p>
      </div>
      {(status === "unavailable" || isRetrying) && (
        <button
          className="col-start-2 inline-flex min-h-10 w-fit items-center gap-2 rounded-full border border-border px-4 text-sm font-medium transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:col-start-auto"
          type="button"
          disabled={isRetrying}
          onClick={() => { setStatus("loading"); setAttempt((current) => current + 1); }}
        >
          <RefreshCw className={`size-3.5 ${isRetrying ? "animate-spin motion-reduce:animate-none" : ""}`} />
          {isRetrying ? "Checking…" : "Try again"}
        </button>
      )}
    </div>
  );
}
