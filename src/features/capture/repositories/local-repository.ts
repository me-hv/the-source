import fs from "fs";
import path from "path";
import crypto from "crypto";
import { sanitizeFilename } from "../validation/capture";
import type {
  TextCaptureInput,
  LinkCaptureInput,
  FileMetaInput,
} from "../validation/capture";
import type { ItemRow, ItemAssetRow, ItemWithAsset } from "@/features/items/types";
import type { Json, ItemKind, ItemStatus } from "@/types/database.types";
import type { CaptureRepository } from "./types";

interface LocalStoreData {
  items: ItemRow[];
  assets: ItemAssetRow[];
}

const STORAGE_DIR = path.join(process.cwd(), ".local-storage");
const DATA_FILE = path.join(STORAGE_DIR, "data.json");
const ASSETS_DIR = path.join(STORAGE_DIR, "assets");

function ensureStorageDir(): void {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initialData: LocalStoreData = { items: [], assets: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  }
}

function readLocalData(): LocalStoreData {
  ensureStorageDir();
  try {
    const content = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(content) as LocalStoreData;
  } catch {
    return { items: [], assets: [] };
  }
}

function writeLocalData(data: LocalStoreData): void {
  ensureStorageDir();
  const tempFile = `${DATA_FILE}.${Date.now()}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tempFile, DATA_FILE);
}

function createDefaultItemRow(
  partial: Partial<ItemRow> & {
    id: string;
    workspace_id: string;
    created_by: string;
    title: string;
    kind: ItemKind;
    content_type: string;
    status: ItemStatus;
  }
): ItemRow {
  const now = new Date().toISOString();
  return {
    id: partial.id,
    workspace_id: partial.workspace_id,
    created_by: partial.created_by,
    title: partial.title,
    kind: partial.kind,
    content_type: partial.content_type,
    status: partial.status,
    content: partial.content ?? null,
    rich_content: (partial.rich_content || {}) as Json,
    content_markdown: partial.content_markdown ?? null,
    metadata: (partial.metadata || {}) as Json,
    journal_date: partial.journal_date ?? null,
    mood: partial.mood ?? null,
    is_favorite: partial.is_favorite ?? false,
    search_vector: partial.search_vector ?? null,
    created_at: partial.created_at ?? now,
    updated_at: partial.updated_at ?? now,
    deleted_at: partial.deleted_at ?? null,
  };
}

export class LocalCaptureRepository implements CaptureRepository {
  async getItems(workspaceId: string, limit = 20): Promise<ItemWithAsset[]> {
    const data = readLocalData();
    const items = data.items
      .filter((it) => it.workspace_id === workspaceId && it.status === "active")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    return items.map((item) => {
      const asset = data.assets.find((a) => a.item_id === item.id) || null;
      const signedUrl = asset?.storage_path
        ? `/api/local-storage/content?path=${encodeURIComponent(asset.storage_path)}`
        : null;

      return {
        ...item,
        asset,
        signedUrl,
      };
    });
  }

  async getItem(itemId: string, workspaceId: string): Promise<ItemWithAsset | null> {
    const data = readLocalData();
    const item = data.items.find(
      (it) => it.id === itemId && it.workspace_id === workspaceId
    );
    if (!item) return null;

    const asset = data.assets.find((a) => a.item_id === itemId) || null;
    const signedUrl = asset?.storage_path
      ? `/api/local-storage/content?path=${encodeURIComponent(asset.storage_path)}`
      : null;

    return {
      ...item,
      asset,
      signedUrl,
    };
  }

  async saveTextItem(
    input: TextCaptureInput,
    workspaceId: string,
    userId: string,
    draftId?: string
  ): Promise<ItemRow> {
    const data = readLocalData();
    const now = new Date().toISOString();
    const { title, content, richContent, contentMarkdown, status } = input;

    if (draftId) {
      const index = data.items.findIndex(
        (it) => it.id === draftId && it.workspace_id === workspaceId
      );
      if (index !== -1) {
        data.items[index] = {
          ...data.items[index],
          title: title || "Untitled",
          content: content || "",
          rich_content: (richContent || {}) as unknown as Json,
          content_markdown: contentMarkdown || "",
          status: status || "active",
          updated_at: now,
        };
        writeLocalData(data);
        return data.items[index];
      }
    }

    const newItem = createDefaultItemRow({
      id: crypto.randomUUID(),
      workspace_id: workspaceId,
      created_by: userId,
      title: title || "Untitled",
      kind: "note",
      content_type: "text",
      status: status || "active",
      content: content || "",
      rich_content: (richContent || {}) as unknown as Json,
      content_markdown: contentMarkdown || "",
      created_at: now,
      updated_at: now,
    });

    data.items.unshift(newItem);
    writeLocalData(data);
    return newItem;
  }

  async saveDraft(
    input: Partial<TextCaptureInput>,
    workspaceId: string,
    userId: string,
    draftId?: string
  ): Promise<string> {
    const data = readLocalData();
    const now = new Date().toISOString();
    const title = input.title?.trim() || "Untitled";
    const content = input.content || "";
    const richContent = (input.richContent || {}) as unknown as Json;
    const contentMarkdown = input.contentMarkdown || "";

    if (draftId) {
      const index = data.items.findIndex(
        (it) => it.id === draftId && it.workspace_id === workspaceId
      );
      if (index !== -1) {
        data.items[index] = {
          ...data.items[index],
          title,
          content,
          rich_content: richContent,
          content_markdown: contentMarkdown,
          status: "draft",
          updated_at: now,
        };
        writeLocalData(data);
        return data.items[index].id;
      }
    }

    const id = crypto.randomUUID();
    const newDraft = createDefaultItemRow({
      id,
      workspace_id: workspaceId,
      created_by: userId,
      title,
      kind: "note",
      content_type: "text",
      status: "draft",
      content,
      rich_content: richContent,
      content_markdown: contentMarkdown,
      created_at: now,
      updated_at: now,
    });

    data.items.unshift(newDraft);
    writeLocalData(data);
    return id;
  }

  async saveLinkItem(
    input: LinkCaptureInput,
    workspaceId: string,
    userId: string,
    finalTitle: string
  ): Promise<ItemRow> {
    const data = readLocalData();
    const now = new Date().toISOString();
    const { url, description } = input;
    const domain = new URL(url).hostname;

    const newItem = createDefaultItemRow({
      id: crypto.randomUUID(),
      workspace_id: workspaceId,
      created_by: userId,
      title: finalTitle || "Untitled Link",
      kind: "reference",
      content_type: "link",
      status: "active",
      content: url,
      rich_content: {},
      content_markdown: "",
      metadata: {
        url,
        domain,
        description: description || "",
        savedAt: now,
      },
      created_at: now,
      updated_at: now,
    });

    data.items.unshift(newItem);
    writeLocalData(data);
    return newItem;
  }

  async prepareUpload(
    fileMeta: FileMetaInput,
    workspaceId: string,
    userId: string
  ): Promise<{ itemId: string; storagePath: string }> {
    const data = readLocalData();
    const now = new Date().toISOString();
    const itemId = crypto.randomUUID();
    const { originalFilename, mimeType, fileSize, contentType, title, metadata } = fileMeta;

    const draftItem = createDefaultItemRow({
      id: itemId,
      workspace_id: workspaceId,
      created_by: userId,
      title: title || originalFilename,
      kind: "note",
      content_type: contentType,
      status: "draft",
      content: originalFilename,
      rich_content: {},
      content_markdown: "",
      metadata: {
        ...metadata,
        originalFilename,
        mimeType,
        fileSize,
      },
      created_at: now,
      updated_at: now,
    });

    data.items.unshift(draftItem);
    writeLocalData(data);

    const cleanFilename = sanitizeFilename(originalFilename);
    const storagePath = `${workspaceId}/${itemId}/${cleanFilename}`;

    return {
      itemId,
      storagePath,
    };
  }

  async finalizeUpload(
    itemId: string,
    storagePath: string,
    fileMeta: FileMetaInput,
    workspaceId: string
  ): Promise<{ item: ItemRow; asset: ItemAssetRow; signedUrl: string | null }> {
    const data = readLocalData();
    const now = new Date().toISOString();
    const assetId = crypto.randomUUID();

    const newAsset: ItemAssetRow = {
      id: assetId,
      workspace_id: workspaceId,
      item_id: itemId,
      storage_path: storagePath,
      original_filename: fileMeta.originalFilename,
      mime_type: fileMeta.mimeType,
      file_size: fileMeta.fileSize,
      checksum: null,
      created_at: now,
    };

    data.assets.push(newAsset);

    const itemIndex = data.items.findIndex(
      (it) => it.id === itemId && it.workspace_id === workspaceId
    );

    if (itemIndex === -1) {
      throw new Error("Item not found to finalize upload");
    }

    const currentItem = data.items[itemIndex];
    const updatedItem: ItemRow = {
      ...currentItem,
      title: fileMeta.title || fileMeta.originalFilename,
      status: "active",
      metadata: {
        ...(typeof currentItem.metadata === "object" && currentItem.metadata ? currentItem.metadata : {}),
        ...fileMeta.metadata,
        originalFilename: fileMeta.originalFilename,
        mimeType: fileMeta.mimeType,
        fileSize: fileMeta.fileSize,
        assetId,
      },
      updated_at: now,
    };

    data.items[itemIndex] = updatedItem;
    writeLocalData(data);

    const signedUrl = `/api/local-storage/content?path=${encodeURIComponent(storagePath)}`;

    return {
      item: updatedItem,
      asset: newAsset,
      signedUrl,
    };
  }

  async getSignedUrl(storagePath: string, workspaceId: string): Promise<string | null> {
    const pathWorkspaceId = storagePath.split("/")[0];
    if (pathWorkspaceId !== workspaceId) return null;
    return `/api/local-storage/content?path=${encodeURIComponent(storagePath)}`;
  }

  async deleteIncomplete(
    itemId: string,
    storagePath?: string,
    workspaceId?: string
  ): Promise<boolean> {
    const data = readLocalData();

    if (storagePath) {
      try {
        const fullDiskPath = path.join(ASSETS_DIR, storagePath);
        if (fs.existsSync(fullDiskPath)) {
          fs.unlinkSync(fullDiskPath);
        }
      } catch {
        // Non-fatal
      }
      data.assets = data.assets.filter((a) => a.storage_path !== storagePath);
    }

    data.items = data.items.filter((it) => {
      if (it.id === itemId && it.status === "draft") {
        if (workspaceId && it.workspace_id !== workspaceId) return true;
        return false;
      }
      return true;
    });

    writeLocalData(data);
    return true;
  }

  /**
   * Helper to write an uploaded binary buffer/stream directly to disk in local mode.
   */
  async saveBinaryFile(storagePath: string, buffer: Buffer): Promise<void> {
    ensureStorageDir();
    const fullPath = path.join(ASSETS_DIR, storagePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, buffer);
  }

  /**
   * Helper to read a binary file from local storage.
   */
  getBinaryFilePath(storagePath: string): string | null {
    ensureStorageDir();
    const safePath = path.normalize(storagePath).replace(/^(\.\.(\/|\\|$))+/, "");
    const fullPath = path.join(ASSETS_DIR, safePath);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
    return null;
  }
}
