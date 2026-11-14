import { describe, it, expect, vi } from "vitest";
import { ensureUserWorkspace } from "@/features/workspaces/service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

describe("Workspace Creation & Duplicate Prevention Service", () => {
  it("should create profile and personal workspace when user logs in for the first time", async () => {
    const mockProfile = {
      id: "user-123",
      display_name: "Coltrane",
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockWorkspace = {
      id: "ws-123",
      owner_id: "user-123",
      name: "Coltrane's Studio",
      description: "Personal creative workspace",
      is_personal: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
              }),
            }),
          };
        }
        if (table === "workspaces") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockWorkspace, error: null }),
              }),
            }),
          };
        }
        return {} as any;
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await ensureUserWorkspace(
      mockSupabase,
      "user-123",
      "coltrane@atlantic.com",
      "Coltrane"
    );

    expect(result.workspace.id).toBe("ws-123");
    expect(result.workspace.is_personal).toBe(true);
    expect(result.profile.display_name).toBe("Coltrane");
  });

  it("should retrieve existing personal workspace on subsequent logins and never duplicate", async () => {
    const existingProfile = {
      id: "user-123",
      display_name: "Coltrane",
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const existingWorkspace = {
      id: "ws-existing-999",
      owner_id: "user-123",
      name: "Coltrane's Studio",
      description: "Personal creative workspace",
      is_personal: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const insertSpy = vi.fn();

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: existingProfile, error: null }),
          };
        }
        if (table === "workspaces") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: existingWorkspace, error: null }),
            insert: insertSpy,
          };
        }
        return {} as any;
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await ensureUserWorkspace(
      mockSupabase,
      "user-123",
      "coltrane@atlantic.com",
      "Coltrane"
    );

    expect(result.workspace.id).toBe("ws-existing-999");
    expect(result.workspace.name).toBe("Coltrane's Studio");
    // Ensure insert was NEVER called since workspace already existed
    expect(insertSpy).not.toHaveBeenCalled();
  });
});
