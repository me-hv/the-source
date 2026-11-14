"use client";

import * as React from "react";
import { Mic, FileText, Bookmark, Sparkles, Image as ImageIcon } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function QuickCaptureTriggerBox() {
  const setQuickCaptureOpen = useWorkspaceStore((state) => state.setQuickCaptureOpen);

  return (
    <div className="rounded-lg border border-border/80 bg-card p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded border border-primary/40 bg-primary/10 text-primary">
              <Sparkles className="h-3 w-3" />
            </div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Multi-Modal Capture Engine
            </h2>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-primary border border-primary/20">
              Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Frictionless capture for audio takes, rhyme schemes, lyrical drafts, and visual references.
          </p>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <kbd className="rounded border border-border/80 bg-background/60 px-2 py-0.5 text-[10px] font-mono">
            Ctrl+K / ⌘K
          </kbd>
        </div>
      </div>

      {/* Input Mockup Box (Clickable Launchpad) */}
      <div
        onClick={() => setQuickCaptureOpen(true)}
        className="mt-4 flex flex-col sm:flex-row items-center gap-2 rounded-md border border-dashed border-border/80 bg-background/50 p-3 cursor-pointer hover:border-primary/60 transition-colors"
      >
        <div className="flex-1 text-xs text-muted-foreground/60 italic w-full">
          &ldquo;Record a voice note, paste a lyrical draft, or capture a reference thought...&rdquo;
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded border border-border/60 bg-secondary/60 hover:bg-secondary px-2.5 py-1 text-[11px] text-foreground transition-colors"
          >
            <Mic className="h-3 w-3 text-amber-500" />
            <span>Voice</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded border border-border/60 bg-secondary/60 hover:bg-secondary px-2.5 py-1 text-[11px] text-foreground transition-colors"
          >
            <FileText className="h-3 w-3 text-primary" />
            <span>Draft</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded border border-border/60 bg-secondary/60 hover:bg-secondary px-2.5 py-1 text-[11px] text-foreground transition-colors"
          >
            <ImageIcon className="h-3 w-3 text-emerald-500" />
            <span>Visual</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded border border-border/60 bg-secondary/60 hover:bg-secondary px-2.5 py-1 text-[11px] text-foreground transition-colors"
          >
            <Bookmark className="h-3 w-3 text-violet-500" />
            <span>Link</span>
          </button>
        </div>
      </div>
    </div>
  );
}
