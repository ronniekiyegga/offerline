import Link from "next/link";

import { Logo } from "@/components/logo";

const footerLinks = [
  { href: "#workflow", label: "Workflow" },
  { href: "#roadmap", label: "Roadmap" },
  { href: "#status", label: "Build status" },
] as const;

export default function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col justify-between gap-10 sm:flex-row sm:items-center">
          <Link href="/" aria-label="Offerline home"><Logo /></Link>
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              {footerLinks.map((link) => <li key={link.href}><Link className="transition-colors hover:text-foreground" href={link.href}>{link.label}</Link></li>)}
              <li><Link className="transition-colors hover:text-foreground" href="https://github.com/ronniekiyegga/subscription-api">GitHub</Link></li>
            </ul>
          </nav>
        </div>
        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Offerline</span>
          <span>Job application tracking for candidates.</span>
        </div>
      </div>
    </footer>
  );
}
