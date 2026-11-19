import { createClient } from "@/lib/supabase/server";
import { sanitizeFilename } from "../validation/capture";
import type {
  TextCaptureInput,
  LinkCaptureInput,
  FileMetaInput,
} from "../validation/capture";
import type { ItemRow, ItemAssetRow, ItemWithAsset } from "@/features/items/types";
import type { Json } from "@/types/database.types";
import type { CaptureRepository } from "./types";

export class SupabaseCaptureRepository implements CaptureRepository {
  async getItems(workspaceId: string, limit = 20): Promise<ItemWithAsset[]> {
    const supabase = await createClient();

    const { data: items, error: itemsError } = await supabase
      .from("items")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (itemsError || !items) {
      return [];
    }

    const itemIds = items.map((it) => it.id);
    if (itemIds.length === 0) return [];

    const { data: assets } = await supabase
      .from("item_assets")
      .select("*")
      .eq("workspace_id", workspaceId)
      .in("item_id", itemIds);

    const assetMap = new Map<string, ItemAssetRow>();
    if (assets) {
      for (const asset of assets) {
        if (!assetMap.has(asset.item_id)) {
          assetMap.set(asset.item_id, asset);
        }
      }
    }

    const results: ItemWithAsset[] = [];
    for (const item of items) {
      const asset = assetMap.get(item.id) || null;
      let signedUrl: string | null = null;

      if (asset?.storage_path) {
        try {
          const { data } = await supabase.storage
            .from("source-assets")
            .createSignedUrl(asset.storage_path, 3600);
          signedUrl = data?.signedUrl || null;
        } catch {
          signedUrl = null;
        }
      }

      results.push({
        ...item,
        asset,
        signedUrl,
      });
    }

    return results;
  }

  async getItem(itemId: string, workspaceId: string): Promise<ItemWithAsset | null> {
    const supabase = await createClient();

    const { data: item, error } = await supabase
      .from("items")
      .select("*")
      .eq("id", itemId)
      .eq("workspace_id", workspaceId)
      .single();

    if (error || !item) return null;

    const { data: asset } = await supabase
      .from("item_assets")
      .select("*")
      .eq("item_id", itemId)
      .eq("workspace_id", workspaceId)
      .single();

    let signedUrl: string | null = null;
    if (asset?.storage_path) {
      try {
        const { data } = await supabase.storage
          .from("source-assets")
          .createSignedUrl(asset.storage_path, 3600);
        signedUrl = data?.signedUrl || null;
      } catch {
        signedUrl = null;
      }
    }

    return {
      ...item,
      asset: asset || null,
      signedUrl,
    };
  }

  async saveTextItem(
    input: TextCaptureInput,
    workspaceId: string,
    userId: string,
    draftId?: string
  ): Promise<ItemRow> {
    const supabase = await createClient();
    const { title, content, richContent, contentMarkdown, status } = input;

    if (draftId) {
      const { data: updatedItem, error } = await supabase
        .from("items")
        .update({
          title: title || "Untitled",
          content: content || "",
          rich_content: (richContent || {}) as unknown as Json,
          content_markdown: contentMarkdown || "",
          status: status || "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", draftId)
        .eq("workspace_id", workspaceId)
        .select("*")
        .single();

      if (error || !updatedItem) {
        throw new Error(error?.message || "Failed to update draft");
      }
      return updatedItem;
    }

    const { data: newItem, error } = await supabase
      .from("items")
      .insert({
        workspace_id: workspaceId,
        created_by: userId,
        title: title || "Untitled",
        kind: "note",
        content_type: "text",
        status: status || "active",
        content: content || "",
        rich_content: (richContent || {}) as unknown as Json,
        content_markdown: contentMarkdown || "",
      })
      .select("*")
      .single();

    if (error || !newItem) {
      throw new Error(error?.message || "Failed to save text note");
    }
    return newItem;
  }

  async saveDraft(
    input: Partial<TextCaptureInput>,
    workspaceId: string,
    userId: string,
    draftId?: string
  ): Promise<string> {
    const supabase = await createClient();
    const title = input.title?.trim() || "Untitled";
    const content = input.content || "";
    const richContent = (input.richContent || {}) as unknown as Json;
    const contentMarkdown = input.contentMarkdown || "";

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
        .eq("workspace_id", workspaceId)
        .select("id")
        .single();

      if (error || !data) throw new Error(error?.message || "Failed to update draft");
      return data.id;
    }

    const { data, error } = await supabase
      .from("items")
      .insert({
        workspace_id: workspaceId,
        created_by: userId,
        title,
        kind: "note",
        content_type: "text",
        status: "draft",
        content,
        rich_content: richContent as unknown as Json,
        content_markdown: contentMarkdown,
      })
      .select("id")
      .single();

    if (error || !data) throw new Error(error?.message || "Failed to create draft");
    return data.id;
  }

  async saveLinkItem(
    input: LinkCaptureInput,
    workspaceId: string,
    userId: string,
    finalTitle: string
  ): Promise<ItemRow> {
    const supabase = await createClient();
    const { url, description } = input;
    const domain = new URL(url).hostname;

    const { data: item, error } = await supabase
      .from("items")
      .insert({
        workspace_id: workspaceId,
        created_by: userId,
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

    if (error || !item) {
      throw new Error(error?.message || "Failed to save link reference");
    }
    return item;
  }

  async prepareUpload(
    fileMeta: FileMetaInput,
    workspaceId: string,
    userId: string
  ): Promise<{ itemId: string; storagePath: string }> {
    const supabase = await createClient();
    const { originalFilename, mimeType, fileSize, contentType, title, metadata } = fileMeta;

    const { data: item, error: itemError } = await supabase
      .from("items")
      .insert({
        workspace_id: workspaceId,
        created_by: userId,
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

    if (itemError || !item) {
      throw new Error(itemError?.message || "Failed to initialize item record for upload");
    }

    const cleanFilename = sanitizeFilename(originalFilename);
    const storagePath = `${workspaceId}/${item.id}/${cleanFilename}`;

    return {
      itemId: item.id,
      storagePath,
    };
  }

  async finalizeUpload(
    itemId: string,
    storagePath: string,
    fileMeta: FileMetaInput,
    workspaceId: string
  ): Promise<{ item: ItemRow; asset: ItemAssetRow; signedUrl: string | null }> {
    const supabase = await createClient();

    const { data: asset, error: assetError } = await supabase
      .from("item_assets")
      .insert({
        workspace_id: workspaceId,
        item_id: itemId,
        storage_path: storagePath,
        original_filename: fileMeta.originalFilename,
        mime_type: fileMeta.mimeType,
        file_size: fileMeta.fileSize,
      })
      .select("*")
      .single();

    if (assetError || !asset) {
      throw new Error(`Asset recording failed: ${assetError?.message}`);
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
      .eq("workspace_id", workspaceId)
      .select("*")
      .single();

    if (itemUpdateError || !item) {
      throw new Error(`Item update failed: ${itemUpdateError?.message}`);
    }

    const { data: signedData } = await supabase.storage
      .from("source-assets")
      .createSignedUrl(storagePath, 3600);

    return {
      item,
      asset,
      signedUrl: signedData?.signedUrl || null,
    };
  }

  async getSignedUrl(storagePath: string, workspaceId: string): Promise<string | null> {
    const pathWorkspaceId = storagePath.split("/")[0];
    if (pathWorkspaceId !== workspaceId) return null;

    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from("source-assets")
      .createSignedUrl(storagePath, 3600);

    if (error || !data) return null;
    return data.signedUrl;
  }

  async deleteIncomplete(
    itemId: string,
    storagePath?: string,
    workspaceId?: string
  ): Promise<boolean> {
    const supabase = await createClient();
    try {
      if (storagePath) {
        await supabase.storage.from("source-assets").remove([storagePath]);
      }
      let query = supabase.from("items").delete().eq("id", itemId).eq("status", "draft");
      if (workspaceId) {
        query = query.eq("workspace_id", workspaceId);
      }
      await query;
      return true;
    } catch {
      return false;
    }
  }
}
