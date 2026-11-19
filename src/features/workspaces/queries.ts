import { cookies } from "next/headers";
import { isLocalDataMode } from "@/lib/config/data-mode";
import { LOCAL_WORKSPACE_CONTEXT } from "./local-context";
import { createClient } from "@/lib/supabase/server";
import { ensureUserWorkspace } from "./service";
import type { CurrentWorkspaceContext } from "./types";

/**
 * Retrieves the current authenticated user's workspace context.
 * In local data mode: verifies the local development session cookie.
 * In Supabase mode: strictly verifies ownership on the server side using auth.getUser().
 */
export async function getCurrentWorkspaceContext(): Promise<CurrentWorkspaceContext | null> {
  if (isLocalDataMode()) {
    try {
      const cookieStore = await cookies();
      const localSession = cookieStore.get("source_local_session")?.value;
      if (localSession === "active") {
        return LOCAL_WORKSPACE_CONTEXT;
      }
      return null;
    } catch {
      return null;
    }
  }

  try {
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
  } catch {
    return null;
  }
}
