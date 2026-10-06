import { CalendarDays, LockKeyhole } from "lucide-react";

import { WorkflowStrip } from "@/components/workflow-strip";

const exampleStages = [
  { label: "Saved", count: "04", item: "Product design role" },
  { label: "Interviewing", count: "02", item: "Technical conversation" },
  { label: "Decision", count: "01", item: "Review the offer" },
] as const;

export default function HeroSection() {
  return (
    <div className="overflow-hidden">
      <section className="relative px-4 pb-4 pt-32 lg:pt-44" aria-labelledby="hero-title">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h1 id="hero-title" className="relative z-10 mx-auto max-w-2xl text-balance text-4xl font-medium tracking-tight sm:text-5xl">
                <span className="text-muted-foreground">Keep every opportunity moving.</span> Manage your job search in one place.
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-balance leading-7 text-muted-foreground">
                Save roles, track interviews, and keep the next step clear without relying on scattered tabs and spreadsheets.
              </p>
            </div>
            <WorkflowStrip />
          </div>

          <div className="relative mx-auto mt-12 max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 px-5 py-16 shadow-2xl shadow-black/40 sm:px-10 lg:py-24">
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_top,#3f3f46_0,transparent_48%)] opacity-60" />
            <div className="relative mx-auto max-w-5xl rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur sm:p-6">
              <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Example workflow</p>
                  <p className="mt-1 text-sm text-zinc-200">Applications in motion</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400"><LockKeyhole className="size-3.5" /> Private by design</div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {exampleStages.map((stage) => (
                  <div key={stage.label} className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="flex items-center justify-between text-xs text-zinc-500"><span>{stage.label}</span><span>{stage.count}</span></div>
                    <div className="mt-10 rounded-lg border border-white/10 bg-zinc-900 p-4 text-sm text-zinc-200">
                      {stage.item}
                      <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500"><CalendarDays className="size-3.5" /> Next action captured</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
      </section>
    </div>
  );
}
