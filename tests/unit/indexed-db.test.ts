// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveDraftToIndexedDB,
  getDraftFromIndexedDB,
  deleteDraftFromIndexedDB,
  saveAssetToIndexedDB,
  getAssetFromIndexedDB,
  deleteAssetFromIndexedDB,
} from "@/lib/storage/indexed-db";

describe("Browser Storage: IndexedDB Vault Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles missing indexedDB gracefully without throwing", async () => {
    // When indexedDB is not supported or disabled in the browser environment
    // @ts-expect-error - simulating unsupported environment
    delete window.indexedDB;

    await expect(saveDraftToIndexedDB("test-key", { text: "sample" })).resolves.toBeUndefined();
    await expect(getDraftFromIndexedDB("test-key")).resolves.toBeNull();
    await expect(deleteDraftFromIndexedDB("test-key")).resolves.toBeUndefined();
    await expect(
      saveAssetToIndexedDB("path/1", new Blob(["audio"]), "audio.webm", "audio/webm")
    ).resolves.toBeUndefined();
    await expect(getAssetFromIndexedDB("path/1")).resolves.toBeNull();
    await expect(deleteAssetFromIndexedDB("path/1")).resolves.toBeUndefined();
  });
});
