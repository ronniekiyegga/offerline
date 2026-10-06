import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Offerline — A calmer candidate workflow",
  description:
    "Offerline is building a private, focused workflow for managing job applications and next actions.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
