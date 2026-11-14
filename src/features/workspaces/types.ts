import type { Database } from "@/types/database.types";

export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface CurrentWorkspaceContext {
  workspace: Workspace;
  profile: Profile;
}
