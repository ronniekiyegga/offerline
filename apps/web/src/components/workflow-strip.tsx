const workflowSteps = ["Save the role", "Track the stage", "Plan the next move", "Keep the history"] as const;

export function WorkflowStrip() {
  return (
    <ol aria-label="Planned candidate workflow" className="relative mt-16 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:mt-24 lg:grid-cols-4">
      {workflowSteps.map((step, index) => (
        <li key={step} className="flex items-center gap-3 border-t border-border pt-4">
          <span className="font-mono text-xs text-foreground/60">0{index + 1}</span>
          {step}
        </li>
      ))}
    </ol>
  );
}
