import type { Metadata } from "next";
import { getCurrentWorkspaceContext } from "@/features/workspaces/queries";
import { getRecentItems } from "@/features/items/queries";
import { QuickCaptureTriggerBox } from "@/features/capture/components/quick-capture-trigger-box";
import { RecentCaptures } from "@/features/items/components/recent-captures";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Compass, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Overview — THE SOURCE",
  description: "Private creative studio overview.",
};

export default async function OverviewPage() {
  const context = await getCurrentWorkspaceContext();
  const displayName = context?.profile.display_name || "Creator";
  const workspaceName = context?.workspace.name || "Personal Studio";

  // Fetch recent captures for the authenticated workspace
  const recentItems = context ? await getRecentItems(context.workspace.id, 12) : [];

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

      {/* Multi-Modal Capture Engine Launchpad */}
      <QuickCaptureTriggerBox />

      {/* Recent Captures Stream */}
      <RecentCaptures items={recentItems} />

      {/* Studio Manifesto */}
      <div className="grid gap-6 md:grid-cols-3 pt-4 border-t border-border/60">
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
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-sm font-medium">Multi-Modal Flow</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Audio, lyrics, imagery & links
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 text-xs text-muted-foreground leading-relaxed">
            Record voice memos, write Markdown lyrics, upload visual references, and archive web links
            seamlessly from any view via the global capture shortcut.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
