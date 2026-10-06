"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const menuItems = [
  { name: "Workflow", href: "#workflow" },
  { name: "Roadmap", href: "#roadmap" },
  { name: "Build status", href: "#status" },
] as const;

export function HeroHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("overflow-hidden", menuOpen);
    return () => document.documentElement.classList.remove("overflow-hidden");
  }, [menuOpen]);

  return (
    <header>
      <nav
        aria-label="Primary navigation"
        data-state={menuOpen ? "active" : "closed"}
        className="fixed top-0 z-50 w-full px-2 data-[state=active]:inset-y-0 data-[state=active]:bg-background lg:data-[state=active]:bottom-auto lg:data-[state=active]:bg-transparent"
      >
        <div className="mx-auto mt-2 max-w-7xl px-6">
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:py-4">
            <div className="flex w-full items-center justify-between lg:w-auto">
              <Link href="/" aria-label="Offerline home">
                <Logo />
              </Link>
              <button
                type="button"
                aria-expanded={menuOpen}
                aria-controls="mobile-navigation"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen((open) => !open)}
                className="relative z-20 grid size-11 place-items-center rounded-full border border-border lg:hidden"
              >
                {menuOpen ? (
                  <X className="size-5" />
                ) : (
                  <span className="flex w-4 flex-col gap-1.5" aria-hidden="true">
                    <span className="h-px w-full bg-foreground" />
                    <span className="h-px w-full bg-foreground" />
                  </span>
                )}
              </button>
            </div>

            <ul className="absolute inset-0 m-auto hidden size-fit gap-8 text-sm lg:flex">
              {menuItems.map((item) => (
                <li key={item.href}>
                  <Link className="text-muted-foreground transition-colors hover:text-foreground" href={item.href}>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>

            <div id="mobile-navigation" className="hidden w-full in-data-[state=active]:block lg:block lg:w-auto">
              <ul className="space-y-1 py-8 lg:hidden">
                {menuItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="block py-3 text-2xl font-medium"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <Button size="sm" nativeButton={false} render={<Link href="#status">Check API reachability</Link>} />
            </div>
          </div>
        </div>
      </nav>
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-30 h-24 bg-background/70 backdrop-blur-xl [mask-image:linear-gradient(to_bottom,black,transparent)]" />
    </header>
  );
}
