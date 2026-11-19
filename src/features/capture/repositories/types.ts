import type { ItemRow, ItemAssetRow, ItemWithAsset } from "@/features/items/types";
import type {
  TextCaptureInput,
  LinkCaptureInput,
  FileMetaInput,
} from "../validation/capture";

export interface CaptureRepository {
  /**
   * Retrieves active items for the workspace with joined assets and preview URLs.
   */
  getItems(workspaceId: string, limit?: number): Promise<ItemWithAsset[]>;

  /**
   * Retrieves a single item by ID within the specified workspace.
   */
  getItem(itemId: string, workspaceId: string): Promise<ItemWithAsset | null>;

  /**
   * Saves or publishes a text note / creative draft.
   */
  saveTextItem(
    input: TextCaptureInput,
    workspaceId: string,
    userId: string,
    draftId?: string
  ): Promise<ItemRow>;

  /**
   * Saves or updates an in-progress draft (debounced autosave).
   */
  saveDraft(
    input: Partial<TextCaptureInput>,
    workspaceId: string,
    userId: string,
    draftId?: string
  ): Promise<string>;

  /**
   * Saves an external inspiration bookmark link.
   */
  saveLinkItem(
    input: LinkCaptureInput,
    workspaceId: string,
    userId: string,
    finalTitle: string
  ): Promise<ItemRow>;

  /**
   * Stage 1: Provisions an item record in draft state and returns authorized storage path.
   */
  prepareUpload(
    fileMeta: FileMetaInput,
    workspaceId: string,
    userId: string
  ): Promise<{ itemId: string; storagePath: string }>;

  /**
   * Stage 2: Records the asset metadata and activates the item.
   */
  finalizeUpload(
    itemId: string,
    storagePath: string,
    fileMeta: FileMetaInput,
    workspaceId: string
  ): Promise<{ item: ItemRow; asset: ItemAssetRow; signedUrl: string | null }>;

  /**
   * Generates a preview or signed URL for an asset.
   */
  getSignedUrl(storagePath: string, workspaceId: string): Promise<string | null>;

  /**
   * Cleans up incomplete storage objects and draft items if upload fails.
   */
  deleteIncomplete(
    itemId: string,
    storagePath?: string,
    workspaceId?: string
  ): Promise<boolean>;
}
