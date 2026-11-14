import type { Database } from "@/types/database.types";

export type ItemRow = Database["public"]["Tables"]["items"]["Row"];
export type ItemAssetRow = Database["public"]["Tables"]["item_assets"]["Row"];

export interface ItemWithAsset extends ItemRow {
  asset?: ItemAssetRow | null;
  signedUrl?: string | null;
}
