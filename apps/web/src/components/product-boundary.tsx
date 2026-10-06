import { Activity, Database, ShieldCheck } from "lucide-react";

import { ApiStatus } from "@/components/api-status";

export default function ProductBoundary() {
  return (
    <section id="status" className="scroll-mt-24 overflow-hidden py-20 md:py-32" aria-labelledby="status-title">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Development status</p>
          <h2 id="status-title" className="mt-5 text-balance text-4xl font-medium tracking-tight md:text-6xl">Offerline is currently in development.</h2>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">
            The API foundation is in place. The candidate dashboard, browser sign-in, and application workflow are the next parts of the product to be built.
          </p>
          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, label: "Ownership", value: "Server enforced" },
              { icon: Database, label: "Database", value: "Not checked here" },
              { icon: Activity, label: "Health route", value: "Liveness only" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="border-t border-border pt-4">
                <Icon className="size-4 text-muted-foreground" />
                <p className="mt-4 text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm font-medium">{value}</p>
              </div>
            ))}
          </div>
        </div>
        <aside className="rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-black/20" aria-label="API connectivity">
          <div className="mb-8 flex items-center justify-between border-b border-border pb-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">API connection</p>
            <span className="rounded-full border border-border px-2.5 py-1 text-[0.65rem] uppercase tracking-wider text-muted-foreground">No cache</span>
          </div>
          <ApiStatus />
          <p className="mt-6 text-xs leading-5 text-muted-foreground">This check shows whether the API is reachable. It does not check the database.</p>
        </aside>
      </div>
    </section>
  );
}
