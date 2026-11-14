import { create } from "zustand";
import type { Profile, Workspace } from "@/features/workspaces/types";

interface WorkspaceState {
  workspace: Workspace | null;
  profile: Profile | null;
  sidebarOpen: boolean;
  quickCaptureOpen: boolean;
  setWorkspace: (workspace: Workspace | null) => void;
  setProfile: (profile: Profile | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setQuickCaptureOpen: (open: boolean) => void;
  toggleQuickCapture: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspace: null,
  profile: null,
  sidebarOpen: true,
  quickCaptureOpen: false,
  setWorkspace: (workspace) => set({ workspace }),
  setProfile: (profile) => set({ profile }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setQuickCaptureOpen: (open) => set({ quickCaptureOpen: open }),
  toggleQuickCapture: () =>
    set((state) => ({ quickCaptureOpen: !state.quickCaptureOpen })),
}));
