"use client";

import { BellRing, CalendarDays, History, ListChecks, LockKeyhole, StickyNote, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const features = [
  { id: "applications", label: "Applications", icon: ListChecks, lead: "Keep every role in one place.", copy: "Save the company, position, source link, stage, and notes together so each application is easy to pick up again.", highlights: ["Role and company details", "Pipeline stage", "Private notes"] },
  { id: "next-actions", label: "Next actions", icon: BellRing, lead: "Know what comes next.", copy: "Add a clear next step and date to each application, from sending a follow-up to preparing for an interview.", highlights: ["Follow-up reminders", "Interview preparation", "Clear due dates"] },
  { id: "timeline", label: "Timeline", icon: History, lead: "Keep the full history.", copy: "See stage changes, conversations, and decisions in order without searching through email, notes, and calendar events.", highlights: ["Stage changes", "Conversation notes", "Application history"] },
  { id: "privacy", label: "Privacy", icon: LockKeyhole, lead: "Your job search stays private.", copy: "Offerline is designed so each candidate can only access their own applications and notes.", highlights: ["Private candidate data", "Server-side ownership", "Secrets stay server-side"] },
] as const;

type FeatureId = (typeof features)[number]["id"];

function FeatureVisual({ id }: { id: FeatureId }) {
  const content: Record<FeatureId, { eyebrow: string; title: string; meta: string; icon: LucideIcon }> = {
    applications: { eyebrow: "Saved", title: "Product design role", meta: "Application added", icon: ListChecks },
    "next-actions": { eyebrow: "Interviewing", title: "Prepare portfolio walkthrough", meta: "Due Friday", icon: CalendarDays },
    timeline: { eyebrow: "History", title: "Technical interview completed", meta: "Stage updated", icon: History },
    privacy: { eyebrow: "Private workspace", title: "Only you can view this application", meta: "Ownership enforced", icon: LockKeyhole },
  };
  const item = content[id];
  const Icon = item.icon;
  return (
    <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-border/60 bg-foreground/[0.025] p-6">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_top,#27272a_0,transparent_58%)] opacity-60" />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950 p-5 shadow-2xl shadow-black/30">
        <div className="flex items-center justify-between text-xs text-zinc-500"><span>{item.eyebrow}</span><Icon className="size-4" /></div>
        <div className="mt-16 rounded-xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-zinc-100">{item.title}</p>
          <p className="mt-4 flex items-center gap-2 text-sm text-zinc-500"><StickyNote className="size-4" />{item.meta}</p>
        </div>
      </div>
    </div>
  );
}

export default function ProductWorkflow() {
  const [activeId, setActiveId] = useState<FeatureId>("applications");
  const sectionRefs = useRef<Partial<Record<FeatureId, HTMLElement | null>>>({});

  const scrollToFeature = (id: FeatureId) => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sectionRefs.current[id]?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    setActiveId(id);
  };

  useEffect(() => {
    const sections = features.map(({ id }) => sectionRefs.current[id]).filter((section): section is HTMLElement => section !== null);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      const nextId = visible[0]?.target.id as FeatureId | undefined;
      if (nextId) setActiveId(nextId);
    }, { rootMargin: "-25% 0px -55% 0px", threshold: [0.2, 0.5, 0.75] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="workflow" className="scroll-mt-24 py-20 md:py-28" aria-labelledby="workflow-title">
      <div className="mx-auto max-w-7xl px-6">
        <h2 id="workflow-title" className="max-w-4xl text-balance text-4xl font-medium tracking-tight">
          <span className="text-foreground">Everything your job search needs.</span><br />
          <span className="text-muted-foreground">Organised around each application.</span>
        </h2>
        <div className="mt-16 grid gap-10 md:mt-28 lg:grid-cols-[14rem_1fr] lg:gap-12">
          <nav className="sticky top-24 hidden h-fit lg:block" aria-label="Product features">
            <p className="text-sm text-muted-foreground">Product</p>
            <div className="mt-4 flex flex-col">
              {features.map((feature) => (
                <button key={feature.id} type="button" aria-current={activeId === feature.id ? "true" : undefined} onClick={() => scrollToFeature(feature.id)} className="-ml-4 rounded-lg px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current=true]:font-medium aria-[current=true]:text-foreground">
                  {feature.label}
                </button>
              ))}
            </div>
          </nav>
          <div className="flex flex-col gap-20 md:gap-28">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.id} id={feature.id} ref={(element) => { sectionRefs.current[feature.id] = element; }} className="grid scroll-mt-32 gap-8 md:grid-cols-5 md:gap-12">
                  <div className="flex flex-col justify-between pb-2 md:col-span-2">
                    <div>
                      <h3 className="mb-6 text-sm font-medium text-muted-foreground">{feature.label}</h3>
                      <p className="text-balance text-lg font-medium text-muted-foreground"><span className="text-foreground">{feature.lead}</span> {feature.copy}</p>
                    </div>
                    <ul className="mt-10 divide-y divide-border text-sm text-muted-foreground">
                      {feature.highlights.map((highlight) => <li key={highlight} className="flex items-center gap-3 py-3"><Icon className="size-4" />{highlight}</li>)}
                    </ul>
                  </div>
                  <div className="md:col-span-3"><FeatureVisual id={feature.id} /></div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
