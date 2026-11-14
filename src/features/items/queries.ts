import { createClient } from "@/lib/supabase/server";
import type { ItemWithAsset } from "./types";

/**
 * Retrieves the most recent active items for the authenticated workspace.
 */
export async function getRecentItems(
  workspaceId: string,
  limit: number = 10
): Promise<ItemWithAsset[]> {
  try {
    const supabase = await createClient();

    // 1. Fetch items
    const { data: items, error } = await supabase
      .from("items")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !items) {
      return [];
    }

    // 2. Fetch associated assets
    const itemIds = items.map((i) => i.id);
    const { data: assets } = await supabase
      .from("item_assets")
      .select("*")
      .eq("workspace_id", workspaceId)
      .in("item_id", itemIds);

    const assetMap = new Map((assets || []).map((a) => [a.item_id, a]));

    // 3. Attach assets and create signed URLs for media preview
    const itemsWithAssets: ItemWithAsset[] = await Promise.all(
      items.map(async (item) => {
        const asset = assetMap.get(item.id) || null;
        let signedUrl: string | null = null;

        if (asset && (item.content_type === "audio" || item.content_type === "image")) {
          try {
            const { data: signed } = await supabase.storage
              .from("source-assets")
              .createSignedUrl(asset.storage_path, 3600);
            signedUrl = signed?.signedUrl || null;
          } catch {
            signedUrl = null;
          }
        }

        return {
          ...item,
          asset,
          signedUrl,
        };
      })
    );

    return itemsWithAssets;
  } catch {
    return [];
  }
}
