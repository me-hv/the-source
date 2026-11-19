"use client";

import * as React from "react";
import { Mic, FileText, Bookmark, Sparkles, Image as ImageIcon, Paperclip } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function QuickCaptureTriggerBox() {
  const openQuickCapture = useWorkspaceStore((state) => state.openQuickCapture);

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

      {/* Launchpad Quick Cards */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <button
          type="button"
          onClick={() => openQuickCapture("text")}
          className="flex flex-col items-start gap-1.5 rounded-md border border-border/80 bg-background/50 p-3 text-left hover:border-primary/60 hover:bg-secondary/40 transition-colors group"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded border border-border bg-card text-foreground group-hover:border-primary/50">
            <FileText className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-xs font-medium text-foreground">Capture Idea</span>
          <span className="text-[10px] text-muted-foreground">Lyrics & notes</span>
        </button>

        <button
          type="button"
          onClick={() => openQuickCapture("audio")}
          className="flex flex-col items-start gap-1.5 rounded-md border border-border/80 bg-background/50 p-3 text-left hover:border-amber-500/60 hover:bg-secondary/40 transition-colors group"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded border border-border bg-card text-foreground group-hover:border-amber-500/50">
            <Mic className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <span className="text-xs font-medium text-foreground">Voice Take</span>
          <span className="text-[10px] text-muted-foreground">Audio recording</span>
        </button>

        <button
          type="button"
          onClick={() => openQuickCapture("image")}
          className="flex flex-col items-start gap-1.5 rounded-md border border-border/80 bg-background/50 p-3 text-left hover:border-emerald-500/60 hover:bg-secondary/40 transition-colors group"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded border border-border bg-card text-foreground group-hover:border-emerald-500/50">
            <ImageIcon className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <span className="text-xs font-medium text-foreground">Visual Asset</span>
          <span className="text-[10px] text-muted-foreground">Artwork & photos</span>
        </button>

        <button
          type="button"
          onClick={() => openQuickCapture("file")}
          className="flex flex-col items-start gap-1.5 rounded-md border border-border/80 bg-background/50 p-3 text-left hover:border-blue-500/60 hover:bg-secondary/40 transition-colors group"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded border border-border bg-card text-foreground group-hover:border-blue-500/50">
            <Paperclip className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <span className="text-xs font-medium text-foreground">Document</span>
          <span className="text-[10px] text-muted-foreground">PDFs & files</span>
        </button>

        <button
          type="button"
          onClick={() => openQuickCapture("link")}
          className="col-span-2 sm:col-span-1 flex flex-col items-start gap-1.5 rounded-md border border-border/80 bg-background/50 p-3 text-left hover:border-violet-500/60 hover:bg-secondary/40 transition-colors group"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded border border-border bg-card text-foreground group-hover:border-violet-500/50">
            <Bookmark className="h-3.5 w-3.5 text-violet-500" />
          </div>
          <span className="text-xs font-medium text-foreground">Inspiration Link</span>
          <span className="text-[10px] text-muted-foreground">URLs & references</span>
        </button>
      </div>
    </div>
  );
}
