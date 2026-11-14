"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { cn } from "@/lib/utils";
import {
  Compass,
  PlusCircle,
  Archive,
  Workflow,
  Sparkles,
  BookOpen,
  Settings,
  X,
} from "lucide-react";

interface SidebarProps {
  workspaceName?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ workspaceName, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const setQuickCaptureOpen = useWorkspaceStore((state) => state.setQuickCaptureOpen);

  const handleCaptureClick = () => {
    setQuickCaptureOpen(true);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header / Brand */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-5">
          <Link href="/overview" className="flex items-center space-x-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded border border-primary/50 bg-primary/10 text-[10px] font-bold tracking-widest text-primary">
              S
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              THE SOURCE
            </span>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Workspace context bar */}
        <div className="border-b border-sidebar-border px-5 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Current Workspace
          </p>
          <p className="truncate text-xs font-medium text-foreground">
            {workspaceName || "Personal Studio"}
          </p>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Navigation
          </p>

          {/* Overview */}
          <Link
            href="/overview"
            onClick={onClose}
            className={cn(
              "flex items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
              pathname === "/overview"
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
            )}
          >
            <div className="flex items-center space-x-2.5">
              <Compass
                className={cn(
                  "h-4 w-4",
                  pathname === "/overview" ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span>Overview</span>
            </div>
          </Link>

          {/* Capture (Phase 1 Enabled) */}
          <button
            type="button"
            onClick={handleCaptureClick}
            className="w-full flex items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-foreground transition-colors group"
          >
            <div className="flex items-center space-x-2.5">
              <PlusCircle className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-medium text-foreground">Capture</span>
            </div>
            <kbd className="hidden sm:inline-block rounded border border-border/80 bg-background/50 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
              Ctrl+K
            </kbd>
          </button>

          {/* Coming Soon Placeholders */}
          <div
            className="flex cursor-not-allowed items-center justify-between rounded-md px-2.5 py-2 text-xs font-normal text-muted-foreground/40 transition-colors"
            title="Coming soon in a future phase"
          >
            <div className="flex items-center space-x-2.5">
              <Archive className="h-4 w-4 opacity-50" />
              <span>Archive</span>
            </div>
            <span className="rounded border border-border/40 bg-secondary/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground/50">
              Soon
            </span>
          </div>

          <div
            className="flex cursor-not-allowed items-center justify-between rounded-md px-2.5 py-2 text-xs font-normal text-muted-foreground/40 transition-colors"
            title="Coming soon in a future phase"
          >
            <div className="flex items-center space-x-2.5">
              <Workflow className="h-4 w-4 opacity-50" />
              <span>Connections</span>
            </div>
            <span className="rounded border border-border/40 bg-secondary/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground/50">
              Soon
            </span>
          </div>

          <div
            className="flex cursor-not-allowed items-center justify-between rounded-md px-2.5 py-2 text-xs font-normal text-muted-foreground/40 transition-colors"
            title="Coming soon in a future phase"
          >
            <div className="flex items-center space-x-2.5">
              <Sparkles className="h-4 w-4 opacity-50" />
              <span>Inspiration</span>
            </div>
            <span className="rounded border border-border/40 bg-secondary/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground/50">
              Soon
            </span>
          </div>

          <div
            className="flex cursor-not-allowed items-center justify-between rounded-md px-2.5 py-2 text-xs font-normal text-muted-foreground/40 transition-colors"
            title="Coming soon in a future phase"
          >
            <div className="flex items-center space-x-2.5">
              <BookOpen className="h-4 w-4 opacity-50" />
              <span>Journal</span>
            </div>
            <span className="rounded border border-border/40 bg-secondary/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground/50">
              Soon
            </span>
          </div>

          <div
            className="flex cursor-not-allowed items-center justify-between rounded-md px-2.5 py-2 text-xs font-normal text-muted-foreground/40 transition-colors"
            title="Coming soon in a future phase"
          >
            <div className="flex items-center space-x-2.5">
              <Settings className="h-4 w-4 opacity-50" />
              <span>Settings</span>
            </div>
            <span className="rounded border border-border/40 bg-secondary/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground/50">
              Soon
            </span>
          </div>
        </nav>

        {/* Footer info */}
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded border border-border/40 bg-background/50 p-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-primary">
              Private Studio
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              Encrypted, sovereign creative space. Everything belongs to you.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
