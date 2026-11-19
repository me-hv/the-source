import { isLocalDataMode } from "@/lib/config/data-mode";
import type { CaptureRepository } from "./types";
import { SupabaseCaptureRepository } from "./supabase-repository";
import { LocalCaptureRepository } from "./local-repository";

let localRepoInstance: LocalCaptureRepository | null = null;
let supabaseRepoInstance: SupabaseCaptureRepository | null = null;

export function getLocalCaptureRepository(): LocalCaptureRepository {
  if (!localRepoInstance) {
    localRepoInstance = new LocalCaptureRepository();
  }
  return localRepoInstance;
}

export function getSupabaseCaptureRepository(): SupabaseCaptureRepository {
  if (!supabaseRepoInstance) {
    supabaseRepoInstance = new SupabaseCaptureRepository();
  }
  return supabaseRepoInstance;
}

/**
 * Factory that returns the active CaptureRepository based on environment data mode.
 * - In local dev mode: returns LocalCaptureRepository (file/local storage).
 * - In Supabase mode: returns SupabaseCaptureRepository (PostgreSQL + Supabase Storage).
 */
export function getCaptureRepository(): CaptureRepository {
  if (isLocalDataMode()) {
    return getLocalCaptureRepository();
  }
  return getSupabaseCaptureRepository();
}

export type { CaptureRepository } from "./types";
