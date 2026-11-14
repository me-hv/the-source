import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { CurrentWorkspaceContext, Profile } from "./types";

/**
 * Ensures a user has a profile and exactly one personal workspace.
 * Idempotent: Subsequent calls return the existing workspace without creating duplicates.
 */
export async function ensureUserWorkspace(
  supabase: SupabaseClient<Database>,
  userId: string,
  userEmail?: string | null,
  displayName?: string | null
): Promise<CurrentWorkspaceContext> {
  const fallbackName = displayName || (userEmail ? userEmail.split("@")[0] : "Creator");

  // 1. Fetch or create profile
  const { data: existingProfile, error: profileFetchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profileFetchError && profileFetchError.code !== "PGRST116") {
    throw new Error(`Failed to query user profile: ${profileFetchError.message}`);
  }

  let profile: Profile;

  if (existingProfile) {
    profile = existingProfile;
  } else {
    const { data: newProfile, error: profileInsertError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        display_name: fallbackName,
      })
      .select("*")
      .single();

    if (profileInsertError) {
      // Could be a race condition with DB trigger, re-fetch
      const { data: fallbackProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!fallbackProfile) {
        throw new Error(`Failed to create or retrieve profile: ${profileInsertError.message}`);
      }
      profile = fallbackProfile;
    } else {
      profile = newProfile;
    }
  }

  // 2. Fetch existing personal workspace
  const { data: existingWorkspace, error: wsFetchError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", userId)
    .eq("is_personal", true)
    .maybeSingle();

  if (wsFetchError && wsFetchError.code !== "PGRST116") {
    throw new Error(`Failed to query personal workspace: ${wsFetchError.message}`);
  }

  if (existingWorkspace) {
    return {
      workspace: existingWorkspace,
      profile,
    };
  }

  // 3. Create personal workspace if none exists
  const workspaceTitle = `${profile.display_name || fallbackName}'s Studio`;

  const { data: newWorkspace, error: wsInsertError } = await supabase
    .from("workspaces")
    .insert({
      owner_id: userId,
      name: workspaceTitle,
      description: "Personal creative workspace",
      is_personal: true,
    })
    .select("*")
    .single();

  if (wsInsertError) {
    // If caught by unique constraint (concurrent creation by DB trigger), fetch the created workspace
    const { data: createdWorkspace } = await supabase
      .from("workspaces")
      .select("*")
      .eq("owner_id", userId)
      .eq("is_personal", true)
      .single();

    if (!createdWorkspace) {
      throw new Error(`Failed to create personal workspace: ${wsInsertError.message}`);
    }

    return {
      workspace: createdWorkspace,
      profile,
    };
  }

  return {
    workspace: newWorkspace,
    profile,
  };
}
