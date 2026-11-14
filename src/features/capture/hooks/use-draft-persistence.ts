"use client";

import * as React from "react";
import { saveDraftAction } from "../actions";
import type { CaptureType, DraftSaveStatus, StoredDraft } from "../types";

interface UseDraftPersistenceOptions {
  workspaceId: string;
  captureType: CaptureType;
  enabled?: boolean;
}

export function useDraftPersistence({
  workspaceId,
  captureType,
  enabled = true,
}: UseDraftPersistenceOptions) {
  const [draftId, setDraftId] = React.useState<string | undefined>(undefined);
  const [saveStatus, setSaveStatus] = React.useState<DraftSaveStatus>("idle");
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);

  const storageKey = React.useMemo(
    () => `the_source_draft_${workspaceId}_${captureType}`,
    [workspaceId, captureType]
  );

  // In-flight sequence tracking to prevent older saves from overwriting newer edits
  const latestSequenceRef = React.useRef(0);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load draft from local storage on mount/switch
  const loadStoredDraft = React.useCallback((): StoredDraft | null => {
    if (typeof window === "undefined" || !enabled) return null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const storedId = parsed.id || parsed.draftId;
      if (storedId) {
        setDraftId(storedId);
      }
      return parsed;
    } catch {
      return null;
    }
  }, [storageKey, enabled]);

  // Save draft locally & schedule debounced server autosave
  const persistDraft = React.useCallback(
    (draftData: {
      title?: string;
      content?: string;
      richContent?: Record<string, unknown>;
      contentMarkdown?: string;
      linkUrl?: string;
      linkDescription?: string;
    }) => {
      if (!enabled || typeof window === "undefined") return;

      const currentSeq = ++latestSequenceRef.current;
      setSaveStatus("saving");

      // 1. Immediately write to local storage as safety net
      try {
        const stored: StoredDraft = {
          id: draftId,
          captureType,
          title: draftData.title || "",
          content: draftData.content || "",
          richContent: draftData.richContent || {},
          contentMarkdown: draftData.contentMarkdown || "",
          linkUrl: draftData.linkUrl,
          linkDescription: draftData.linkDescription,
          updatedAt: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(stored));
      } catch {
        // LocalStorage quota or access error
      }

      // 2. Clear pending server save timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // 3. Debounced server autosave (1500ms)
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const res = await saveDraftAction(
            {
              title: draftData.title,
              content: draftData.content,
              richContent: draftData.richContent,
              contentMarkdown: draftData.contentMarkdown,
            },
            draftId
          );

          // Discard if newer edit occurred while in-flight
          if (currentSeq !== latestSequenceRef.current) {
            return;
          }

          if (res.success && res.draftId) {
            setDraftId(res.draftId);
            setSaveStatus("saved");
            setLastSaved(new Date());

            // Update local storage with assigned server draftId
            try {
              const current = localStorage.getItem(storageKey);
              if (current) {
                const parsed = JSON.parse(current);
                parsed.draftId = res.draftId;
                localStorage.setItem(storageKey, JSON.stringify(parsed));
              }
            } catch {}
          } else {
            setSaveStatus("error");
          }
        } catch {
          if (currentSeq === latestSequenceRef.current) {
            setSaveStatus("error");
          }
        }
      }, 1500);
    },
    [enabled, draftId, captureType, storageKey]
  );

  // Clear draft on successful save or reset
  const clearDraft = React.useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setDraftId(undefined);
    setSaveStatus("idle");
    setLastSaved(null);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(storageKey);
      } catch {}
    }
  }, [storageKey]);

  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    draftId,
    setDraftId,
    saveStatus,
    lastSaved,
    loadStoredDraft,
    persistDraft,
    clearDraft,
  };
}
