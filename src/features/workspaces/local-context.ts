import type { CurrentWorkspaceContext, Workspace, Profile } from "./types";

export const LOCAL_DEV_USER_ID = "00000000-0000-0000-0000-000000000001";
export const LOCAL_DEV_WORKSPACE_ID = "00000000-0000-0000-0000-000000000002";

export const LOCAL_DEV_PROFILE: Profile = {
  id: LOCAL_DEV_USER_ID,
  display_name: "Local Artist",
  avatar_url: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

export const LOCAL_DEV_WORKSPACE: Workspace = {
  id: LOCAL_DEV_WORKSPACE_ID,
  name: "The Source Studio (Local)",
  description: "Private local development studio vault",
  owner_id: LOCAL_DEV_USER_ID,
  is_personal: true,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

export const LOCAL_WORKSPACE_CONTEXT: CurrentWorkspaceContext = {
  workspace: LOCAL_DEV_WORKSPACE,
  profile: LOCAL_DEV_PROFILE,
};
