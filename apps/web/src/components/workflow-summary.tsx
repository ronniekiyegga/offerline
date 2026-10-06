import { CalendarClock, Files, Search, StickyNote } from "lucide-react";

const fragments = [
  { icon: Search, title: "Tabs", copy: "Role pages and research scattered across a browser." },
  { icon: Files, title: "Spreadsheets", copy: "Stages that are accurate only when you remember to update them." },
  { icon: StickyNote, title: "Notes", copy: "Interview context separated from the application it belongs to." },
  { icon: CalendarClock, title: "Reminders", copy: "Next actions without the history that explains why they matter." },
] as const;

export default function WorkflowSummary() {
  return (
    <section className="border-y border-border bg-card/35 py-20 md:py-28" aria-labelledby="fragmented-title">
      <div className="mx-auto max-w-7xl px-6">
        <h2 id="fragmented-title" className="max-w-4xl text-balance text-4xl font-medium tracking-tight md:text-5xl">
          <span className="text-muted-foreground">A job search should not live across four tools.</span> Offerline brings the work together.
        </h2>
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {fragments.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="min-h-60 bg-background p-6">
              <Icon className="size-5 text-muted-foreground" />
              <h3 className="mt-20 font-medium">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
