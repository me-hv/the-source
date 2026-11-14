import { createClient } from "@/lib/supabase/server";
import { ensureUserWorkspace } from "./service";
import type { CurrentWorkspaceContext } from "./types";

/**
 * Retrieves the current authenticated user's workspace context.
 * Strictly verifies ownership on the server side using auth.getUser().
 */
export async function getCurrentWorkspaceContext(): Promise<CurrentWorkspaceContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const displayName = user.user_metadata?.display_name as string | undefined;

  return await ensureUserWorkspace(
    supabase,
    user.id,
    user.email,
    displayName
  );
}
