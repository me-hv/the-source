"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceContext } from "@/features/workspaces/queries";
import {
  textCaptureSchema,
  linkCaptureSchema,
  fileMetaSchema,
  sanitizeFilename,
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

  const supabase = await createClient();
  const { title, content, richContent, contentMarkdown, status } = parsed.data;

  try {
    if (draftId) {
      const { data: updatedItem, error: updateError } = await supabase
        .from("items")
        .update({
          title,
          content,
          rich_content: richContent,
          content_markdown: contentMarkdown,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", draftId)
        .eq("workspace_id", context.workspace.id)
        .select("*")
        .single();

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      revalidatePath("/overview");
      return { success: true, item: updatedItem };
    } else {
      const { data: newItem, error: insertError } = await supabase
        .from("items")
        .insert({
          workspace_id: context.workspace.id,
          created_by: context.profile.id,
          title,
          kind: "note",
          content_type: "text",
          status,
          content,
          rich_content: richContent,
          content_markdown: contentMarkdown,
        })
        .select("*")
        .single();

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      revalidatePath("/overview");
      return { success: true, item: newItem };
    }
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

  const title = input.title?.trim() || "Untitled";
  const content = input.content || "";
  const richContent = input.richContent || {};
  const contentMarkdown = input.contentMarkdown || "";

  const supabase = await createClient();

  try {
    if (draftId) {
      const { data, error } = await supabase
        .from("items")
        .update({
          title,
          content,
          rich_content: richContent,
          content_markdown: contentMarkdown,
          status: "draft",
          updated_at: new Date().toISOString(),
        })
        .eq("id", draftId)
        .eq("workspace_id", context.workspace.id)
        .select("id")
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, draftId: data.id };
    } else {
      const { data, error } = await supabase
        .from("items")
        .insert({
          workspace_id: context.workspace.id,
          created_by: context.profile.id,
          title,
          kind: "note",
          content_type: "text",
          status: "draft",
          content,
          rich_content: richContent,
          content_markdown: contentMarkdown,
        })
        .select("id")
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, draftId: data.id };
    }
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
    const ogTitleMatch = slice.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const title = ogTitleMatch?.[1] || titleMatch?.[1] || undefined;

    const descMatch = slice.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    const ogDescMatch = slice.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
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

  const { url, title, description } = parsed.data;
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

  const domain = new URL(url).hostname;
  const supabase = await createClient();

  try {
    const { data: item, error: insertError } = await supabase
      .from("items")
      .insert({
        workspace_id: context.workspace.id,
        created_by: context.profile.id,
        title: finalTitle || "Untitled Link",
        kind: "reference",
        content_type: "link",
        status: "active",
        content: url,
        metadata: {
          url,
          domain,
          description: description || "",
          savedAt: new Date().toISOString(),
        },
      })
      .select("*")
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

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

  const { originalFilename, mimeType, fileSize, contentType, title, metadata } = parsed.data;

  const isAllowed = ALL_ALLOWED_MIME_TYPES.some((allowed) =>
    mimeType.toLowerCase().startsWith(allowed.toLowerCase())
  );

  if (!isAllowed) {
    return {
      success: false,
      error: `Unsupported format: ${mimeType}. Allowed formats: audio, images, documents.`,
    };
  }

  const supabase = await createClient();

  try {
    const { data: item, error: itemError } = await supabase
      .from("items")
      .insert({
        workspace_id: context.workspace.id,
        created_by: context.profile.id,
        title: title || originalFilename,
        kind: "note",
        content_type: contentType,
        status: "draft",
        content: originalFilename,
        metadata: {
          ...metadata,
          originalFilename,
          mimeType,
          fileSize,
        },
      })
      .select("id")
      .single();

    if (itemError) {
      return { success: false, error: itemError.message };
    }

    const cleanFilename = sanitizeFilename(originalFilename);
    const storagePath = `${context.workspace.id}/${item.id}/${cleanFilename}`;

    return {
      success: true,
      itemId: item.id,
      storagePath,
      workspaceId: context.workspace.id,
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to initialize upload") };
  }
}

/**
 * Step 2 of upload: Once the binary is in Storage, inserts item_assets record and marks item active.
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

  const supabase = await createClient();

  try {
    const { data: asset, error: assetError } = await supabase
      .from("item_assets")
      .insert({
        workspace_id: context.workspace.id,
        item_id: itemId,
        storage_path: storagePath,
        original_filename: fileMeta.originalFilename,
        mime_type: fileMeta.mimeType,
        file_size: fileMeta.fileSize,
      })
      .select("*")
      .single();

    if (assetError) {
      return { success: false, error: `Asset recording failed: ${assetError.message}` };
    }

    const { data: item, error: itemUpdateError } = await supabase
      .from("items")
      .update({
        status: "active",
        title: fileMeta.title || fileMeta.originalFilename,
        metadata: {
          ...fileMeta.metadata,
          originalFilename: fileMeta.originalFilename,
          mimeType: fileMeta.mimeType,
          fileSize: fileMeta.fileSize,
          assetId: asset.id,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("workspace_id", context.workspace.id)
      .select("*")
      .single();

    if (itemUpdateError) {
      return { success: false, error: `Item update failed: ${itemUpdateError.message}` };
    }

    const { data: signedData } = await supabase.storage
      .from("source-assets")
      .createSignedUrl(storagePath, 3600);

    revalidatePath("/overview");

    return {
      success: true,
      item,
      asset,
      signedUrl: signedData?.signedUrl || null,
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to finalize upload") };
  }
}

/**
 * Creates a signed URL for a private storage asset.
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

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("source-assets")
    .createSignedUrl(storagePath, 3600);

  if (error || !data) {
    return { success: false, error: error?.message || "Failed to generate signed URL" };
  }

  return { success: true, signedUrl: data.signedUrl };
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

  const supabase = await createClient();

  try {
    if (storagePath) {
      const pathWorkspaceId = storagePath.split("/")[0];
      if (pathWorkspaceId === context.workspace.id) {
        await supabase.storage.from("source-assets").remove([storagePath]);
      }
    }

    await supabase
      .from("items")
      .delete()
      .eq("id", itemId)
      .eq("workspace_id", context.workspace.id)
      .eq("status", "draft");

    return { success: true };
  } catch {
    return { success: false };
  }
}
