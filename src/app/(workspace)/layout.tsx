import * as React from "react";
import { redirect } from "next/navigation";
import { getCurrentWorkspaceContext } from "@/features/workspaces/queries";
import { WorkspaceShell } from "@/components/layout/workspace-shell";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getCurrentWorkspaceContext();

  if (!context) {
    redirect("/login");
  }

  return <WorkspaceShell context={context}>{children}</WorkspaceShell>;
}
