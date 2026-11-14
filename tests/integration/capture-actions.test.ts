// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock getCurrentWorkspaceContext
const mockWorkspace = {
  id: "workspace-aaa-111",
  name: "My Studio",
  slug: "my-studio",
  owner_id: "user-aaa-111",
};
const mockProfile = {
  id: "user-aaa-111",
  email: "artist@thesource.studio",
  display_name: "Lead Artist",
};

vi.mock("@/features/workspaces/queries", () => ({
  getCurrentWorkspaceContext: vi.fn(),
}));

import { getCurrentWorkspaceContext } from "@/features/workspaces/queries";

// Supabase mock setup
let mockDbItems: any[] = [];
let mockDbAssets: any[] = [];
let mockStorageFiles: string[] = [];

const mockSupabase = {
  from: vi.fn((table: string) => {
    let currentOperation: "insert" | "update" | "delete" | "select" = "select";
    let payload: any = null;
    let filters: Record<string, any> = {};

    const builder: any = {
      insert: vi.fn((data: any) => {
        currentOperation = "insert";
        payload = data;
        return builder;
      }),
      update: vi.fn((data: any) => {
        currentOperation = "update";
        payload = data;
        return builder;
      }),
      delete: vi.fn(() => {
        currentOperation = "delete";
        return builder;
      }),
      select: vi.fn(() => builder),
      eq: vi.fn((column: string, value: any) => {
        filters[column] = value;
        return builder;
      }),
      single: vi.fn(async () => {
        if (currentOperation === "insert") {
          const newRecord = {
            id: `id-${Math.random().toString(36).substring(7)}`,
            ...payload,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          if (table === "items") mockDbItems.push(newRecord);
          if (table === "item_assets") mockDbAssets.push(newRecord);
          return { data: newRecord, error: null };
        }

        if (currentOperation === "update") {
          const index = mockDbItems.findIndex((it) => it.id === filters.id);
          if (index !== -1) {
            mockDbItems[index] = { ...mockDbItems[index], ...payload };
            return { data: mockDbItems[index], error: null };
          }
          return {
            data: { id: filters.id, ...payload },
            error: null,
          };
        }

        return { data: null, error: new Error("Not found") };
      }),
    };

    return builder;
  }),
  storage: {
    from: vi.fn(() => ({
      createSignedUrl: vi.fn(async (path: string) => ({
        data: { signedUrl: `https://mock.supabase.co/storage/v1/sign/${path}?token=abc` },
        error: null,
      })),
      remove: vi.fn(async (paths: string[]) => {
        mockStorageFiles = mockStorageFiles.filter((p) => !paths.includes(p));
        return { data: paths, error: null };
      }),
    })),
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockSupabase),
}));

import {
  saveTextCaptureAction,
  saveDraftAction,
  fetchLinkMetadataAction,
  saveLinkCaptureAction,
  prepareFileUploadAction,
  finalizeFileUploadAction,
  getSignedAssetUrlAction,
  deleteIncompleteCaptureAction,
} from "@/features/capture/actions";

describe("Capture Server Actions Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbItems = [];
    mockDbAssets = [];
    mockStorageFiles = [];

    vi.mocked(getCurrentWorkspaceContext).mockResolvedValue({
      workspace: mockWorkspace as any,
      profile: mockProfile as any,
    });
  });

  describe("saveTextCaptureAction", () => {
    it("fails when authentication context is missing", async () => {
      vi.mocked(getCurrentWorkspaceContext).mockResolvedValue(null);

      const res = await saveTextCaptureAction({
        content: "Lost lyric",
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Authentication required/);
    });

    it("creates a new text item with kind 'note' and content_type 'text'", async () => {
      const res = await saveTextCaptureAction({
        title: "Song Hook",
        content: "Everything you create comes from something",
        richContent: { type: "doc" },
        contentMarkdown: "Everything you create comes from something",
      });

      expect(res.success).toBe(true);
      expect(res.item).toBeDefined();
      expect(res.item?.title).toBe("Song Hook");
      expect(res.item?.kind).toBe("note");
      expect(res.item?.content_type).toBe("text");
      expect(res.item?.workspace_id).toBe(mockWorkspace.id);
      expect(res.item?.status).toBe("active");
    });

    it("updates an existing draft when draftId is provided", async () => {
      const draftRecord = {
        id: "draft-item-999",
        workspace_id: mockWorkspace.id,
        title: "Old Draft",
        kind: "note",
        content_type: "text",
        status: "draft",
      };
      mockDbItems.push(draftRecord);

      const res = await saveTextCaptureAction(
        {
          title: "Promoted to Note",
          content: "Final verse lyrics",
          status: "active",
        },
        "draft-item-999"
      );

      expect(res.success).toBe(true);
      expect(res.item?.title).toBe("Promoted to Note");
      expect(res.item?.status).toBe("active");
    });
  });

  describe("saveDraftAction", () => {
    it("persists in-progress draft with status 'draft'", async () => {
      const res = await saveDraftAction({
        title: "WIP Note",
        content: "Working on it...",
      });

      expect(res.success).toBe(true);
      expect(res.draftId).toBeDefined();
    });
  });

  describe("fetchLinkMetadataAction (SSRF-safe)", () => {
    it("rejects loopback and private IP addresses without issuing fetch", async () => {
      const fetchSpy = vi.spyOn(global, "fetch");

      const res1 = await fetchLinkMetadataAction("http://localhost:8000/internal");
      expect(res1.success).toBe(false);
      expect(res1.error).toMatch(/restricted URL target/);

      const res2 = await fetchLinkMetadataAction("http://169.254.169.254/meta-data");
      expect(res2.success).toBe(false);

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("extracts page title and og:description from public HTML", async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Audio Sample Library</title>
            <meta property="og:description" content="Curated analog synth samples" />
          </head>
          <body><h1>Welcome</h1></body>
        </html>
      `;

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
        text: async () => mockHtml,
      } as any);

      const res = await fetchLinkMetadataAction("https://example.com/samples");
      expect(res.success).toBe(true);
      expect(res.data?.title).toBe("Audio Sample Library");
      expect(res.data?.description).toBe("Curated analog synth samples");
    });
  });

  describe("saveLinkCaptureAction", () => {
    it("saves inspiration link with kind 'reference' and content_type 'link'", async () => {
      const res = await saveLinkCaptureAction({
        url: "https://pitchfork.com/reviews/albums/123",
        title: "Album Review",
        description: "Inspirational review notes",
      });

      expect(res.success).toBe(true);
      expect(res.item?.kind).toBe("reference");
      expect(res.item?.content_type).toBe("link");
      expect(res.item?.content).toBe("https://pitchfork.com/reviews/albums/123");
    });
  });

  describe("prepareFileUploadAction & finalizeFileUploadAction lifecycle", () => {
    it("prepares upload with workspace/item/filename storage path", async () => {
      const res = await prepareFileUploadAction({
        title: "Snare Sample",
        originalFilename: "snare 01.wav",
        mimeType: "audio/wav",
        fileSize: 1048576,
        contentType: "audio",
      });

      expect(res.success).toBe(true);
      expect(res.itemId).toBeDefined();
      expect(res.storagePath).toBe(`${mockWorkspace.id}/${res.itemId}/snare_01.wav`);
    });

    it("rejects unauthorized file format", async () => {
      const res = await prepareFileUploadAction({
        title: "Executable",
        originalFilename: "malware.exe",
        mimeType: "application/x-msdownload",
        fileSize: 1024,
        contentType: "file",
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Unsupported format/);
    });

    it("finalizes upload: inserts item_assets row and returns signed URL", async () => {
      const storagePath = `${mockWorkspace.id}/item-abc/snare_01.wav`;

      const res = await finalizeFileUploadAction("item-abc", storagePath, {
        title: "Snare Sample",
        originalFilename: "snare 01.wav",
        mimeType: "audio/wav",
        fileSize: 1048576,
        contentType: "audio",
      });

      expect(res.success).toBe(true);
      expect(res.asset).toBeDefined();
      expect(res.signedUrl).toContain("mock.supabase.co/storage");
    });

    it("rejects finalize attempt for a path belonging to another workspace", async () => {
      const foreignPath = "other-workspace-id/item-abc/snare.wav";

      const res = await finalizeFileUploadAction("item-abc", foreignPath, {
        title: "Snare Sample",
        originalFilename: "snare.wav",
        mimeType: "audio/wav",
        fileSize: 1024,
        contentType: "audio",
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Unauthorized storage path/);
    });
  });

  describe("getSignedAssetUrlAction", () => {
    it("enforces workspace isolation on signed URL requests", async () => {
      const foreignPath = "another-workspace/item-xyz/file.pdf";
      const res = await getSignedAssetUrlAction(foreignPath);

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Unauthorized asset access/);
    });

    it("returns signed URL for user's own workspace assets", async () => {
      const myPath = `${mockWorkspace.id}/item-xyz/file.pdf`;
      const res = await getSignedAssetUrlAction(myPath);

      expect(res.success).toBe(true);
      expect(res.signedUrl).toContain(myPath);
    });
  });

  describe("deleteIncompleteCaptureAction", () => {
    it("deletes draft item and cleans up storage when an upload fails", async () => {
      const storagePath = `${mockWorkspace.id}/item-failed/take.webm`;
      mockStorageFiles.push(storagePath);

      const res = await deleteIncompleteCaptureAction("item-failed", storagePath);

      expect(res.success).toBe(true);
      expect(mockStorageFiles).not.toContain(storagePath);
    });
  });
});
