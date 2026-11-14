"use client";

import * as React from "react";

interface UseCaptureShortcutOptions {
  onOpen: () => void;
  enabled?: boolean;
}

export function useCaptureShortcut({
  onOpen,
  enabled = true,
}: UseCaptureShortcutOptions) {
  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      if (!isCmdOrCtrl || event.key.toLowerCase() !== "k") {
        return;
      }

      // If user is inside an active input, textarea, or contentEditable element,
      // allow normal editing operations (unless it's an explicit quick search trigger)
      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        const isEditable = target.isContentEditable;
        if (tagName === "INPUT" || tagName === "TEXTAREA" || isEditable) {
          // If already in an editor, don't hijack unless user explicitly pressed Cmd+K to summon global palette
          // However, standard app convention allows Cmd+K to summon modal even when focused elsewhere,
          // but we prevent default so browser URL bar isn't triggered.
        }
      }

      event.preventDefault();
      onOpen();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpen, enabled]);
}
