import { Check, CircleDashed } from "lucide-react";

const milestones = [
  {
    label: "Now",
    title: "Connected foundation",
    status: "Implemented",
    items: ["Express API preserved", "Next.js landing page", "Safe liveness connectivity"],
  },
  {
    label: "Next",
    title: "Candidate workflow",
    status: "Proposed",
    items: ["Browser sign-in", "Create an application", "View the application pipeline"],
  },
  {
    label: "Later",
    title: "Useful depth",
    status: "Unscheduled",
    items: ["Stage history", "Next-action reminders", "Deliberate integrations"],
  },
] as const;

export default function DeliveryRoadmap() {
  return (
    <section id="roadmap" className="scroll-mt-24 border-y border-border bg-card/35 py-20 md:py-28" aria-labelledby="roadmap-title">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-xl">
          <p className="text-sm text-muted-foreground">Product roadmap</p>
          <h2 id="roadmap-title" className="mt-5 text-balance text-4xl font-medium tracking-tight lg:text-5xl">What we&apos;re working on.</h2>
        </div>
        <div className="mt-14 grid gap-px overflow-hidden border border-border bg-border lg:grid-cols-3">
          {milestones.map((milestone, index) => (
            <article key={milestone.label} className="flex min-h-[25rem] flex-col bg-background p-7">
              <div className="flex items-start justify-between">
                <div><p className="text-sm text-muted-foreground">{milestone.label}</p><h3 className="mt-2 text-xl font-medium">{milestone.title}</h3></div>
                <span className="rounded-full border border-border px-2.5 py-1 text-[0.65rem] uppercase tracking-wider text-muted-foreground">{milestone.status}</span>
              </div>
              <div className="my-10 text-5xl font-medium tracking-tight text-foreground/20">0{index + 1}</div>
              <ul className="mt-auto space-y-3 text-sm text-muted-foreground">
                {milestone.items.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    {index === 0 ? <Check className="size-3.5" /> : <CircleDashed className="size-3.5" />}{item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
