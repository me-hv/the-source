import Link from "next/link";
import { getCurrentWorkspaceContext } from "@/features/workspaces/queries";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Sparkles, Feather } from "lucide-react";

export default async function HomePage() {
  const context = await getCurrentWorkspaceContext();

  if (context) {
    redirect("/overview");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20">
      {/* Editorial Navigation */}
      <header className="flex h-16 items-center justify-between border-b border-border/60 px-6 sm:px-12">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-primary/50 bg-primary/10 text-xs font-bold tracking-widest text-primary">
            S
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground">
            THE SOURCE
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            Enter Studio
          </Link>
          <Link href="/signup">
            <Button size="sm" className="text-xs uppercase tracking-wider">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center sm:px-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/50 px-3 py-1 text-[11px] font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>Phase 0: Architecture & Foundation</span>
          </div>

          <h1 className="text-4xl font-normal tracking-tight text-foreground sm:text-6xl md:text-7xl font-serif">
            Everything you create comes from something.
          </h1>

          <p className="mx-auto max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed font-sans">
            A private creative universe for songwriters, musicians, rappers, authors, and artists.
            Capture fleeting thoughts, organize inspiration, and preserve your creative legacy
            with absolute sovereign privacy.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto text-xs uppercase tracking-widest font-semibold px-8">
                Establish Your Source
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-xs uppercase tracking-widest font-semibold px-8"
              >
                Enter Studio
              </Button>
            </Link>
          </div>
        </div>

        {/* Studio Principles */}
        <div className="mx-auto mt-24 grid max-w-4xl grid-cols-1 gap-8 text-left sm:grid-cols-3">
          <div className="space-y-2 border-t border-border/60 pt-4">
            <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
              <Lock className="h-3.5 w-3.5" />
              <span>Sovereign Storage</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every note, recording, and thought is private to your workspace. Row Level Security guarantees isolation.
            </p>
          </div>

          <div className="space-y-2 border-t border-border/60 pt-4">
            <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
              <Feather className="h-3.5 w-3.5" />
              <span>Zero Interference</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No AI generates creative work on your behalf. Your voice, your lyricism, and your vision remain untouched.
            </p>
          </div>

          <div className="space-y-2 border-t border-border/60 pt-4">
            <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Creative Knowledge</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Organize, connect, and cross-reference ideas organically. Connect lyrical lines to musical references.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 px-6 py-6 text-center text-xs text-muted-foreground sm:px-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-5xl mx-auto">
          <span>&copy; {new Date().getFullYear()} THE SOURCE. All rights reserved.</span>
          <span>Phase 0: Sovereign Foundation</span>
        </div>
      </footer>
    </div>
  );
}
