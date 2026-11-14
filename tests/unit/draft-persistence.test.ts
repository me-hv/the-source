// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDraftPersistence } from "@/features/capture/hooks/use-draft-persistence";

// Mock saveDraftAction
vi.mock("@/features/capture/actions", () => ({
  saveDraftAction: vi.fn(),
}));

import { saveDraftAction } from "@/features/capture/actions";

describe("Draft Persistence: useDraftPersistence hook", () => {
  const workspaceId = "ws-test-123";
  const captureType = "text";
  const storageKey = `the_source_draft_${workspaceId}_${captureType}`;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("persists draft synchronously to localStorage", () => {
    const { result } = renderHook(() =>
      useDraftPersistence({
        workspaceId,
        captureType,
      })
    );

    act(() => {
      result.current.persistDraft({
        title: "Chorus Idea",
        content: "We came from nothing to something",
        contentMarkdown: "We came from **nothing** to something",
      });
    });

    // Immediate state is saving
    expect(result.current.saveStatus).toBe("saving");

    // LocalStorage has the draft
    const raw = localStorage.getItem(storageKey);
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw!);
    expect(stored.title).toBe("Chorus Idea");
    expect(stored.content).toBe("We came from nothing to something");
    expect(stored.captureType).toBe("text");
  });

  it("loads stored draft from localStorage on request", () => {
    const initialData = {
      id: "draft-item-789",
      captureType: "text",
      title: "Pre-existing draft",
      content: "Written previously",
      updatedAt: Date.now(),
    };
    localStorage.setItem(storageKey, JSON.stringify(initialData));

    const { result } = renderHook(() =>
      useDraftPersistence({
        workspaceId,
        captureType,
      })
    );

    let loaded = null;
    act(() => {
      loaded = result.current.loadStoredDraft();
    });

    expect(loaded).toEqual(initialData);
    expect(result.current.draftId).toBe("draft-item-789");
  });

  it("triggers debounced server autosave after 1500ms", async () => {
    vi.mocked(saveDraftAction).mockResolvedValue({
      success: true,
      draftId: "server-draft-id-456",
    });

    const { result } = renderHook(() =>
      useDraftPersistence({
        workspaceId,
        captureType,
      })
    );

    act(() => {
      result.current.persistDraft({
        title: "Autosave Title",
        content: "Autosave body text",
      });
    });

    expect(saveDraftAction).not.toHaveBeenCalled();

    // Fast-forward 1500ms
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(saveDraftAction).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Autosave Title",
        content: "Autosave body text",
      }),
      undefined
    );

    expect(result.current.draftId).toBe("server-draft-id-456");
    expect(result.current.saveStatus).toBe("saved");
    expect(result.current.lastSaved).not.toBeNull();
  });

  it("ignores older in-flight server response when newer edits arrive", async () => {
    let resolveFirstSave: (val: any) => void;
    const firstSavePromise = new Promise((res) => {
      resolveFirstSave = res;
    });

    vi.mocked(saveDraftAction)
      .mockReturnValueOnce(firstSavePromise as any)
      .mockResolvedValueOnce({
        success: true,
        draftId: "draft-second-save",
      });

    const { result } = renderHook(() =>
      useDraftPersistence({
        workspaceId,
        captureType,
      })
    );

    // First edit
    act(() => {
      result.current.persistDraft({ title: "Edit 1", content: "Body 1" });
    });

    // Advance 1500ms to trigger first save
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(saveDraftAction).toHaveBeenCalledTimes(1);

    // Second edit before first save resolves
    act(() => {
      result.current.persistDraft({ title: "Edit 2", content: "Body 2" });
    });

    // First save resolves now (stale)
    await act(async () => {
      resolveFirstSave!({
        success: true,
        draftId: "draft-first-stale",
      });
    });

    // Status should remain saving because Edit 2 is pending
    expect(result.current.saveStatus).toBe("saving");
    expect(result.current.draftId).not.toBe("draft-first-stale");

    // Advance 1500ms to trigger second save
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.saveStatus).toBe("saved");
    expect(result.current.draftId).toBe("draft-second-save");
  });

  it("clears draft from localStorage and resets state on clearDraft", () => {
    const { result } = renderHook(() =>
      useDraftPersistence({
        workspaceId,
        captureType,
      })
    );

    act(() => {
      result.current.persistDraft({ title: "To Be Cleared" });
    });
    expect(localStorage.getItem(storageKey)).not.toBeNull();

    act(() => {
      result.current.clearDraft();
    });

    expect(localStorage.getItem(storageKey)).toBeNull();
    expect(result.current.draftId).toBeUndefined();
    expect(result.current.saveStatus).toBe("idle");
    expect(result.current.lastSaved).toBeNull();
  });
});
