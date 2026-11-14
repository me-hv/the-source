"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { WorkspaceHeader } from "./workspace-header";
import type { CurrentWorkspaceContext } from "@/features/workspaces/types";

interface WorkspaceShellProps {
  context: CurrentWorkspaceContext;
  children: React.ReactNode;
}

export function WorkspaceShell({ context, children }: WorkspaceShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { workspace, profile } = context;

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
    </div>
  );
}
