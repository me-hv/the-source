import { createClient } from "@/lib/supabase/client";
import {
  prepareFileUploadAction,
  finalizeFileUploadAction,
  deleteIncompleteCaptureAction,
} from "../actions";
import type { FileMetaInput } from "../validation/capture";
import type { CaptureResult } from "../types";

export interface UploadProgressCallback {
  (progress: number): void;
}

/**
 * Uploads a binary file or recorded blob to Supabase Storage and records it in items and item_assets.
 */
export async function uploadCaptureAsset(
  fileOrBlob: File | Blob,
  fileMeta: FileMetaInput,
  onProgress?: UploadProgressCallback
): Promise<CaptureResult> {
  // 1. Prepare upload on server (validates constraints and creates draft item)
  const prep = await prepareFileUploadAction(fileMeta);
  if (!prep.success || !prep.itemId || !prep.storagePath) {
    return {
      success: false,
      error: prep.error || "Could not prepare file capture",
    };
  }

  const { itemId, storagePath } = prep;
  const supabase = createClient();

  try {
    if (onProgress) onProgress(15);

    // 2. Upload file/blob to private Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("source-assets")
      .upload(storagePath, fileOrBlob, {
        contentType: fileMeta.mimeType,
        upsert: true,
      });

    if (uploadError) {
      // Clean up draft item on failure
      await deleteIncompleteCaptureAction(itemId, storagePath);
      return {
        success: false,
        error: `Storage upload failed: ${uploadError.message}`,
      };
    }

    if (onProgress) onProgress(85);

    // 3. Finalize upload (creates item_assets record and updates status to active)
    const finalized = await finalizeFileUploadAction(itemId, storagePath, fileMeta);
    if (!finalized.success) {
      await deleteIncompleteCaptureAction(itemId, storagePath);
      return {
        success: false,
        error: finalized.error || "Failed to finalize asset",
      };
    }

    if (onProgress) onProgress(100);

    return finalized;
  } catch (err: unknown) {
    await deleteIncompleteCaptureAction(itemId, storagePath);
    const msg = err instanceof Error ? err.message : "An unexpected error occurred during upload";
    return {
      success: false,
      error: msg,
    };
  }
}
