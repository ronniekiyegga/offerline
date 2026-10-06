import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string; uniColor?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoIcon />
      <span className="text-base font-semibold tracking-tight">Offerline</span>
    </span>
  );
}

export function LogoIcon({ className }: { className?: string; uniColor?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid size-7 place-items-center rounded-full border border-foreground/20",
        className,
      )}
    >
      <span className="h-px w-3.5 bg-foreground" />
      <span className="absolute size-1.5 rounded-full bg-foreground" />
    </span>
  );
}
