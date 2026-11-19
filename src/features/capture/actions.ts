"use server";

import { revalidatePath } from "next/cache";
import { getCurrentWorkspaceContext } from "@/features/workspaces/queries";
import { getCaptureRepository } from "./repositories";
import {
  textCaptureSchema,
  linkCaptureSchema,
  fileMetaSchema,
  isSafePublicUrl,
  ALL_ALLOWED_MIME_TYPES,
  type TextCaptureInput,
  type LinkCaptureInput,
  type FileMetaInput,
} from "./validation/capture";
import type { CaptureResult, LinkMetadataResult } from "./types";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  return fallback;
}

/**
 * Saves a text note or creative draft to the user's workspace.
 */
export async function saveTextCaptureAction(
  input: TextCaptureInput,
  draftId?: string
): Promise<CaptureResult> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return { success: false, error: "Authentication required" };
  }

  const parsed = textCaptureSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  try {
    const repo = getCaptureRepository();
    const item = await repo.saveTextItem(
      parsed.data,
      context.workspace.id,
      context.profile.id,
      draftId
    );

    revalidatePath("/overview");
    return { success: true, item };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to save text note") };
  }
}

/**
 * Saves or updates an in-progress draft (debounced autosave).
 */
export async function saveDraftAction(
  input: Partial<TextCaptureInput>,
  draftId?: string
): Promise<{ success: boolean; draftId?: string; error?: string }> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return { success: false, error: "Authentication required" };
  }

  try {
    const repo = getCaptureRepository();
    const assignedDraftId = await repo.saveDraft(
      input,
      context.workspace.id,
      context.profile.id,
      draftId
    );
    return { success: true, draftId: assignedDraftId };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Draft save failed") };
  }
}

/**
 * Safely fetches link metadata on the server with SSRF protection.
 */
export async function fetchLinkMetadataAction(
  urlString: string
): Promise<{ success: boolean; data?: LinkMetadataResult; error?: string }> {
  if (!isSafePublicUrl(urlString)) {
    return { success: false, error: "Invalid or restricted URL target" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(urlString, {
      signal: controller.signal,
      headers: {
        "User-Agent": "TheSourceBot/1.0 (+https://thesource.studio)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}` };
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return { success: false, error: "Target is not an HTML document" };
    }

    const text = await res.text();
    const slice = text.slice(0, 102400);

    const titleMatch = slice.match(/<title[^>]*>([^<]+)<\/title>/i);
    const ogTitleMatch = slice.match(
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
    );
    const title = ogTitleMatch?.[1] || titleMatch?.[1] || undefined;

    const descMatch = slice.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
    );
    const ogDescMatch = slice.match(
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
    );
    const description = ogDescMatch?.[1] || descMatch?.[1] || undefined;

    return {
      success: true,
      data: {
        title: title ? title.trim() : undefined,
        description: description ? description.trim() : undefined,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to retrieve page metadata") };
  }
}

/**
 * Saves an external inspiration link to the user's workspace.
 */
export async function saveLinkCaptureAction(
  input: LinkCaptureInput
): Promise<CaptureResult> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return { success: false, error: "Authentication required" };
  }

  const parsed = linkCaptureSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid link input",
    };
  }

  const { url, title } = parsed.data;
  let finalTitle = title;

  if (!finalTitle) {
    const metaRes = await fetchLinkMetadataAction(url);
    if (metaRes.success && metaRes.data?.title) {
      finalTitle = metaRes.data.title;
    } else {
      try {
        finalTitle = new URL(url).hostname;
      } catch {
        finalTitle = "Inspiration Link";
      }
    }
  }

  try {
    const repo = getCaptureRepository();
    const item = await repo.saveLinkItem(
      parsed.data,
      context.workspace.id,
      context.profile.id,
      finalTitle || "Untitled Link"
    );

    revalidatePath("/overview");
    return { success: true, item };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to save link reference") };
  }
}

/**
 * Step 1 of upload: Validates constraints and provisions an item record and secure storage path.
 */
export async function prepareFileUploadAction(
  fileMeta: FileMetaInput
): Promise<{
  success: boolean;
  itemId?: string;
  storagePath?: string;
  workspaceId?: string;
  error?: string;
}> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return { success: false, error: "Authentication required" };
  }

  const parsed = fileMetaSchema.safeParse(fileMeta);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid file metadata",
    };
  }

  const { mimeType } = parsed.data;

  const isAllowed = ALL_ALLOWED_MIME_TYPES.some((allowed) =>
    mimeType.toLowerCase().startsWith(allowed.toLowerCase())
  );

  if (!isAllowed) {
    return {
      success: false,
      error: `Unsupported format: ${mimeType}. Allowed formats: audio, images, documents.`,
    };
  }

  try {
    const repo = getCaptureRepository();
    const prep = await repo.prepareUpload(
      parsed.data,
      context.workspace.id,
      context.profile.id
    );

    return {
      success: true,
      itemId: prep.itemId,
      storagePath: prep.storagePath,
      workspaceId: context.workspace.id,
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to initialize upload") };
  }
}

/**
 * Step 2 of upload: Once the binary is stored, inserts asset record and marks item active.
 */
export async function finalizeFileUploadAction(
  itemId: string,
  storagePath: string,
  fileMeta: FileMetaInput
): Promise<CaptureResult> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return { success: false, error: "Authentication required" };
  }

  const pathWorkspaceId = storagePath.split("/")[0];
  if (pathWorkspaceId !== context.workspace.id) {
    return { success: false, error: "Unauthorized storage path" };
  }

  try {
    const repo = getCaptureRepository();
    const result = await repo.finalizeUpload(
      itemId,
      storagePath,
      fileMeta,
      context.workspace.id
    );

    revalidatePath("/overview");

    return {
      success: true,
      item: result.item,
      asset: result.asset,
      signedUrl: result.signedUrl,
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to finalize upload") };
  }
}

/**
 * Creates a preview or signed URL for a private storage asset.
 */
export async function getSignedAssetUrlAction(
  storagePath: string
): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return { success: false, error: "Authentication required" };
  }

  const pathWorkspaceId = storagePath.split("/")[0];
  if (pathWorkspaceId !== context.workspace.id) {
    return { success: false, error: "Unauthorized asset access" };
  }

  try {
    const repo = getCaptureRepository();
    const signedUrl = await repo.getSignedUrl(storagePath, context.workspace.id);

    if (!signedUrl) {
      return { success: false, error: "Failed to generate signed URL" };
    }

    return { success: true, signedUrl };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to generate signed URL") };
  }
}

/**
 * Cleans up incomplete item and storage object if an upload fails midway.
 */
export async function deleteIncompleteCaptureAction(
  itemId: string,
  storagePath?: string
): Promise<{ success: boolean }> {
  const context = await getCurrentWorkspaceContext();
  if (!context) return { success: false };

  try {
    const repo = getCaptureRepository();
    const ok = await repo.deleteIncomplete(itemId, storagePath, context.workspace.id);
    return { success: ok };
  } catch {
    return { success: false };
  }
}
