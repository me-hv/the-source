// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { LocalCaptureRepository } from "@/features/capture/repositories/local-repository";
import { getCaptureRepository } from "@/features/capture/repositories";
import { getDataMode, isLocalDataMode } from "@/lib/config/data-mode";

const STORAGE_DIR = path.join(process.cwd(), ".local-storage");
const DATA_FILE = path.join(STORAGE_DIR, "data.json");
const ASSETS_DIR = path.join(STORAGE_DIR, "assets");

describe("Local Development Mode & Capture Repository", () => {
  const workspaceId = "00000000-0000-0000-0000-000000000002";
  const userId = "00000000-0000-0000-0000-000000000001";
  let repo: LocalCaptureRepository;

  beforeEach(() => {
    // Reset local data store before each test
    if (fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({ items: [], assets: [] }, null, 2), "utf-8");
    }
    repo = new LocalCaptureRepository();
  });

  afterAll(() => {
    // Clean up test data file
    if (fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({ items: [], assets: [] }, null, 2), "utf-8");
    }
  });

  it("selects LocalCaptureRepository when NEXT_PUBLIC_DATA_MODE is local", () => {
    process.env.NEXT_PUBLIC_DATA_MODE = "local";
    expect(getDataMode()).toBe("local");
    expect(isLocalDataMode()).toBe(true);

    const activeRepo = getCaptureRepository();
    expect(activeRepo).toBeInstanceOf(LocalCaptureRepository);
  });

  it("saves a text note to local storage and retrieves it in recent items", async () => {
    const item = await repo.saveTextItem(
      {
        title: "Local Lyric Idea",
        content: "Under the neon lights we found the groove",
        richContent: { type: "doc" },
        contentMarkdown: "Under the neon lights we found the groove",
        status: "active",
      },
      workspaceId,
      userId
    );

    expect(item.id).toBeDefined();
    expect(item.title).toBe("Local Lyric Idea");
    expect(item.kind).toBe("note");
    expect(item.content_type).toBe("text");
    expect(item.status).toBe("active");

    const items = await repo.getItems(workspaceId);
    expect(items.length).toBe(1);
    expect(items[0].id).toBe(item.id);
    expect(items[0].title).toBe("Local Lyric Idea");
  });

  it("saves and updates an in-progress draft", async () => {
    const draftId = await repo.saveDraft(
      {
        title: "Draft 1",
        content: "Rough melody idea",
      },
      workspaceId,
      userId
    );

    expect(draftId).toBeDefined();

    // Verify draft is not listed under active items
    const activeItems = await repo.getItems(workspaceId);
    expect(activeItems.length).toBe(0);

    // Update draft
    const updatedDraftId = await repo.saveDraft(
      {
        title: "Draft 1 Revised",
        content: "Rough melody idea with acoustic rhythm",
      },
      workspaceId,
      userId,
      draftId
    );

    expect(updatedDraftId).toBe(draftId);

    // Promote draft to active note
    const published = await repo.saveTextItem(
      {
        title: "Final Acoustic Track",
        content: "Rough melody idea with acoustic rhythm",
        status: "active",
      },
      workspaceId,
      userId,
      draftId
    );

    expect(published.id).toBe(draftId);
    expect(published.status).toBe("active");

    const recent = await repo.getItems(workspaceId);
    expect(recent.length).toBe(1);
    expect(recent[0].title).toBe("Final Acoustic Track");
  });

  it("saves an inspiration link with kind 'reference' and content_type 'link'", async () => {
    const linkItem = await repo.saveLinkItem(
      {
        url: "https://thesource.studio/inspiration/analog-synths",
        title: "Analog Synth Guide",
        description: "Great notes on Moog oscillators",
      },
      workspaceId,
      userId,
      "Analog Synth Guide"
    );

    expect(linkItem.kind).toBe("reference");
    expect(linkItem.content_type).toBe("link");
    expect(linkItem.content).toBe("https://thesource.studio/inspiration/analog-synths");

    const items = await repo.getItems(workspaceId);
    expect(items.length).toBe(1);
    expect(items[0].kind).toBe("reference");
  });

  it("handles the full file/audio upload lifecycle locally without Supabase", async () => {
    // 1. Prepare upload
    const prep = await repo.prepareUpload(
      {
        title: "Bass Take 01",
        originalFilename: "bass_take_01.wav",
        mimeType: "audio/wav",
        fileSize: 524288,
        contentType: "audio",
      },
      workspaceId,
      userId
    );

    expect(prep.itemId).toBeDefined();
    expect(prep.storagePath).toBe(`${workspaceId}/${prep.itemId}/bass_take_01.wav`);

    // 2. Save binary to local disk
    const mockAudioData = Buffer.from("RIFF....WAVEfmt ....data....");
    await repo.saveBinaryFile(prep.storagePath, mockAudioData);

    const fullDiskPath = repo.getBinaryFilePath(prep.storagePath);
    expect(fullDiskPath).not.toBeNull();
    expect(fs.existsSync(fullDiskPath!)).toBe(true);

    // 3. Finalize upload
    const finalized = await repo.finalizeUpload(
      prep.itemId,
      prep.storagePath,
      {
        title: "Bass Take 01",
        originalFilename: "bass_take_01.wav",
        mimeType: "audio/wav",
        fileSize: 524288,
        contentType: "audio",
      },
      workspaceId
    );

    expect(finalized.item.status).toBe("active");
    expect(finalized.asset).toBeDefined();
    expect(finalized.signedUrl).toContain(`/api/local-storage/content?path=`);

    // 4. Retrieve recent items and verify joined asset and preview URL
    const items = await repo.getItems(workspaceId);
    expect(items.length).toBe(1);
    expect(items[0].content_type).toBe("audio");
    expect(items[0].signedUrl).toContain(encodeURIComponent(prep.storagePath));
  });

  it("cleans up storage file and draft item on incomplete upload", async () => {
    const prep = await repo.prepareUpload(
      {
        title: "Failed Take",
        originalFilename: "corrupted.webm",
        mimeType: "audio/webm",
        fileSize: 1024,
        contentType: "audio",
      },
      workspaceId,
      userId
    );

    await repo.saveBinaryFile(prep.storagePath, Buffer.from("test-audio"));
    expect(fs.existsSync(repo.getBinaryFilePath(prep.storagePath)!)).toBe(true);

    const deleted = await repo.deleteIncomplete(prep.itemId, prep.storagePath, workspaceId);
    expect(deleted).toBe(true);

    // File should be removed from disk
    const pathAfter = repo.getBinaryFilePath(prep.storagePath);
    expect(pathAfter).toBeNull();

    // Item should be removed from store
    const items = await repo.getItems(workspaceId);
    expect(items.find((i) => i.id === prep.itemId)).toBeUndefined();
  });
});
