import type { Database } from "@/types/database.types";

export type CaptureType = "text" | "audio" | "image" | "file" | "link";

export type ItemRow = Database["public"]["Tables"]["items"]["Row"];
export type ItemAssetRow = Database["public"]["Tables"]["item_assets"]["Row"];

export interface CaptureResult {
  success: boolean;
  item?: ItemRow;
  asset?: ItemAssetRow;
  error?: string;
  signedUrl?: string | null;
}

export interface LinkMetadataResult {
  title?: string;
  description?: string;
  favicon?: string;
  ogImage?: string;
}

export type DraftSaveStatus = "idle" | "saving" | "saved" | "error";

export interface StoredDraft {
  id?: string;
  captureType: CaptureType;
  title: string;
  content: string;
  richContent: Record<string, unknown>;
  contentMarkdown?: string;
  linkUrl?: string;
  linkDescription?: string;
  updatedAt: number;
}
