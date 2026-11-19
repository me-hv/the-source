"use client";

import * as React from "react";
import { UserNav } from "./user-nav";
import { isLocalDataMode } from "@/lib/config/data-mode";
import { Menu } from "lucide-react";

interface WorkspaceHeaderProps {
  title: string;
  workspaceName?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  onOpenMobileMenu?: () => void;
}

export function WorkspaceHeader({
  title,
  workspaceName,
  displayName,
  avatarUrl,
  onOpenMobileMenu,
}: WorkspaceHeaderProps) {
  const isLocal = isLocalDataMode();

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
            {title}
          </h1>
          <span className="hidden text-muted-foreground/40 sm:inline">&middot;</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {workspaceName || "Personal Studio"}
          </span>
        </div>
      </div>

      {/* Right: Workspace badge & User Profile dropdown */}
      <div className="flex items-center gap-3">
        {isLocal ? (
          <div className="flex items-center rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-400">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Local Vault (No Supabase)</span>
          </div>
        ) : (
          <div className="hidden items-center rounded border border-border/60 bg-secondary/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground md:flex">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Sovereign Storage Active</span>
          </div>
        )}

        <UserNav
          displayName={displayName}
          avatarUrl={avatarUrl}
          workspaceName={workspaceName}
        />
      </div>
    </header>
  );
}
