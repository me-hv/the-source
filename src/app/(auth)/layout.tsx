import * as React from "react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 selection:bg-primary/20">
      {/* Subtle top branding */}
      <div className="mb-8 flex flex-col items-center space-y-2 text-center">
        <Link href="/" className="group flex items-center space-x-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-primary/40 bg-primary/10 text-[11px] font-bold tracking-widest text-primary transition-colors group-hover:border-primary">
            S
          </div>
          <span className="text-sm font-semibold tracking-[0.25em] text-foreground uppercase">
            THE SOURCE
          </span>
        </Link>
        <p className="text-[12px] font-normal tracking-wide text-muted-foreground">
          Everything you create comes from something.
        </p>
      </div>

      {/* Auth Card Container */}
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-2xl shadow-black/50 sm:p-8">
        {children}
      </div>

      {/* Subtle footer notice */}
      <div className="mt-8 text-center text-[11px] text-muted-foreground/60">
        Private creative knowledge management &middot; Phase 0 Foundation
      </div>
    </div>
  );
}
