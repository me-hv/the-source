export type DataMode = "local" | "supabase";

/**
 * Returns the active data mode ('local' or 'supabase').
 * Local mode allows development without creating a Supabase project.
 * Local mode is strictly prohibited in real production deployments.
 */
export function getDataMode(): DataMode {
  const mode = process.env.NEXT_PUBLIC_DATA_MODE?.trim().toLowerCase();

  // Guard: Never allow local mode in real production hosting environments
  if (mode === "local") {
    if (process.env.VERCEL_ENV === "production" || process.env.FLY_APP_NAME) {
      throw new Error(
        "CRITICAL: NEXT_PUBLIC_DATA_MODE=local is forbidden in production deployments."
      );
    }
    return "local";
  }

  // Default to supabase mode (never silently fall back to local)
  return "supabase";
}

export function isLocalDataMode(): boolean {
  try {
    return getDataMode() === "local";
  } catch {
    return false;
  }
}
