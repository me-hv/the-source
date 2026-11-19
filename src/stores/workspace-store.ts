import { create } from "zustand";
import type { Profile, Workspace } from "@/features/workspaces/types";
import type { CaptureType } from "@/features/capture/types";

interface WorkspaceState {
  workspace: Workspace | null;
  profile: Profile | null;
  sidebarOpen: boolean;
  quickCaptureOpen: boolean;
  activeCaptureType: CaptureType;
  setWorkspace: (workspace: Workspace | null) => void;
  setProfile: (profile: Profile | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setQuickCaptureOpen: (open: boolean) => void;
  setActiveCaptureType: (type: CaptureType) => void;
  openQuickCapture: (type?: CaptureType) => void;
  toggleQuickCapture: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspace: null,
  profile: null,
  sidebarOpen: true,
  quickCaptureOpen: false,
  activeCaptureType: "text",
  setWorkspace: (workspace) => set({ workspace }),
  setProfile: (profile) => set({ profile }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setQuickCaptureOpen: (open) => set({ quickCaptureOpen: open }),
  setActiveCaptureType: (type) => set({ activeCaptureType: type }),
  openQuickCapture: (type = "text") =>
    set({ quickCaptureOpen: true, activeCaptureType: type }),
  toggleQuickCapture: () =>
    set((state) => ({ quickCaptureOpen: !state.quickCaptureOpen })),
}));
