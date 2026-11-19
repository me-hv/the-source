import { createClient } from "@/lib/supabase/client";
import { isLocalDataMode } from "@/lib/config/data-mode";
import { saveAssetToIndexedDB } from "@/lib/storage/indexed-db";
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
 * Uploads a binary file or recorded blob to the active repository (Local or Supabase)
 * and records it in items and item_assets.
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

  try {
    if (onProgress) onProgress(15);

    // Save binary into browser IndexedDB as local resilience cache
    try {
      await saveAssetToIndexedDB(
        storagePath,
        fileOrBlob,
        fileMeta.originalFilename,
        fileMeta.mimeType
      );
    } catch {
      // Non-fatal client cache failure
    }

    if (isLocalDataMode()) {
      // 2a. Local development mode: Upload via local storage API endpoint
      const formData = new FormData();
      formData.append("storagePath", storagePath);
      formData.append("file", fileOrBlob);

      const res = await fetch("/api/local-storage/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        await deleteIncompleteCaptureAction(itemId, storagePath);
        return {
          success: false,
          error: errorData.error || `Local upload failed (HTTP ${res.status})`,
        };
      }
    } else {
      // 2b. Supabase mode: Upload file/blob to private Supabase Storage
      const supabase = createClient();
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
