"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { WorkspaceHeader } from "./workspace-header";
import { QuickCaptureDialog } from "@/features/capture/components/quick-capture-dialog";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { CurrentWorkspaceContext } from "@/features/workspaces/types";

interface WorkspaceShellProps {
  context: CurrentWorkspaceContext;
  children: React.ReactNode;
}

export function WorkspaceShell({ context, children }: WorkspaceShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { workspace, profile } = context;

  const quickCaptureOpen = useWorkspaceStore((state) => state.quickCaptureOpen);
  const setQuickCaptureOpen = useWorkspaceStore((state) => state.setQuickCaptureOpen);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        workspaceName={workspace.name}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        <WorkspaceHeader
          title="Overview"
          workspaceName={workspace.name}
          displayName={profile.display_name}
          avatarUrl={profile.avatar_url}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>

      {/* Global Quick Capture Dialog (Ctrl+K / ⌘K) */}
      <QuickCaptureDialog
        workspaceId={workspace.id}
        isOpen={quickCaptureOpen}
        onOpenChange={setQuickCaptureOpen}
      />
    </div>
  );
}
