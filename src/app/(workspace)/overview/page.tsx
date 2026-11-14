import type { Metadata } from "next";
import { getCurrentWorkspaceContext } from "@/features/workspaces/queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mic, FileText, Bookmark, Sparkles, Shield, Compass, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Overview — THE SOURCE",
  description: "Private creative studio overview.",
};

export default async function OverviewPage() {
  const context = await getCurrentWorkspaceContext();
  const displayName = context?.profile.display_name || "Creator";
  const workspaceName = context?.workspace.name || "Personal Studio";

  return (
    <div className="space-y-8">
      {/* Editorial Header Banner */}
      <div className="space-y-2 border-b border-border/60 pb-6">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
            Creative Sanctuary
          </span>
          <span className="text-muted-foreground/40">&middot;</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {workspaceName}
          </span>
        </div>
        <h1 className="text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
          Welcome back, {displayName}.
        </h1>
        <p className="max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
          THE SOURCE is your sovereign creative workspace. A quiet, private universe where you
          capture fleeting ideas, preserve what moves you, connect disparate inspirations, and
          build your life&apos;s work.
        </p>
      </div>

      {/* Quick Capture Placeholder (Phase 1 preview) */}
      <div className="rounded-lg border border-border/80 bg-card p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded border border-primary/40 bg-primary/10 text-primary">
                <Sparkles className="h-3 w-3" />
              </div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Quick Capture Engine
              </h2>
              <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                Coming in Phase 1
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Frictionless capture for fleeting audio memos, rhyme schemes, lyrical fragments, and reference imagery.
            </p>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground/60 text-xs">
            <span className="italic">Ready for integration</span>
          </div>
        </div>

        {/* Input Mockup Box */}
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-2 rounded-md border border-dashed border-border/80 bg-background/50 p-3">
          <div className="flex-1 text-xs text-muted-foreground/60 italic w-full">
            &ldquo;Record a voice note, paste a lyrical draft, or capture a reference thought...&rdquo;
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              disabled
              className="flex items-center gap-1.5 rounded border border-border/50 bg-secondary/40 px-2.5 py-1 text-[11px] text-muted-foreground/50 cursor-not-allowed"
            >
              <Mic className="h-3 w-3" />
              <span>Voice</span>
            </button>
            <button
              disabled
              className="flex items-center gap-1.5 rounded border border-border/50 bg-secondary/40 px-2.5 py-1 text-[11px] text-muted-foreground/50 cursor-not-allowed"
            >
              <FileText className="h-3 w-3" />
              <span>Draft</span>
            </button>
            <button
              disabled
              className="flex items-center gap-1.5 rounded border border-border/50 bg-secondary/40 px-2.5 py-1 text-[11px] text-muted-foreground/50 cursor-not-allowed"
            >
              <Bookmark className="h-3 w-3" />
              <span>Reference</span>
            </button>
          </div>
        </div>
      </div>

      {/* Honest Empty-State & Studio Manifesto */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="p-5 pb-3">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded border border-border bg-secondary/50 text-foreground">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-sm font-medium">Sovereign Ownership</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Zero unauthorized access
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 text-xs text-muted-foreground leading-relaxed">
            Everything you capture belongs strictly to you. No public sharing, no training on your
            lyrics, and no silent AI alterations. Your database is isolated by Row Level Security.
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardHeader className="p-5 pb-3">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded border border-border bg-secondary/50 text-foreground">
              <Compass className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-sm font-medium">Intentional Architecture</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Built for creative minds
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 text-xs text-muted-foreground leading-relaxed">
            Designed for songwriters, rappers, musicians, and thinkers. Capture quickly, structure
            fluidly, and discover connections between ideas without arbitrary corporate folders.
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardHeader className="p-5 pb-3">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded border border-border bg-secondary/50 text-foreground">
              <ArrowRight className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-sm font-medium">Next Horizon: Phase 1</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Capture & Ingestion
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 text-xs text-muted-foreground leading-relaxed">
            Phase 0 establishes the database, private storage buckets, secure authentication, and
            workspaces. Phase 1 will deliver the first-class multi-modal Capture experience.
          </CardContent>
        </Card>
      </div>

      {/* Honest Empty State Section */}
      <div className="rounded-lg border border-dashed border-border/80 bg-background/30 p-8 text-center">
        <div className="mx-auto max-w-md space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Workspace Empty & Untouched
          </p>
          <p className="text-xs text-muted-foreground/80 leading-relaxed">
            Your creative vault has been created with secure database ownership. No items have been
            captured yet. When Phase 1 begins, this overview will reflect your active ideas,
            recent audio memos, and emerging connections.
          </p>
        </div>
      </div>
    </div>
  );
}
