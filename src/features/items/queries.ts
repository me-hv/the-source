import { getCaptureRepository } from "@/features/capture/repositories";
import type { ItemWithAsset } from "./types";

/**
 * Retrieves the most recent active items for the authenticated workspace
 * via the active CaptureRepository (Local or Supabase).
 */
export async function getRecentItems(
  workspaceId: string,
  limit: number = 10
): Promise<ItemWithAsset[]> {
  try {
    const repo = getCaptureRepository();
    return await repo.getItems(workspaceId, limit);
  } catch {
    return [];
  }
}
