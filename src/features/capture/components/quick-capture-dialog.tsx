"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CaptureTypeSelector } from "./capture-type-selector";
import { TextCapture } from "./text-capture";
import { AudioCapture } from "./audio-capture";
import { ImageCapture } from "./image-capture";
import { FileCapture } from "./file-capture";
import { LinkCapture } from "./link-capture";
import { useCaptureShortcut } from "../hooks/use-capture-shortcut";
import { toast } from "sonner";
import type { CaptureType, ItemRow } from "../types";

interface QuickCaptureDialogProps {
  workspaceId: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onItemSaved?: (item: ItemRow) => void;
}

export function QuickCaptureDialog({
  workspaceId,
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
  onItemSaved,
}: QuickCaptureDialogProps) {
  const [internalIsOpen, setInternalIsOpen] = React.useState(false);
  const [activeType, setActiveType] = React.useState<CaptureType>("text");

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const setIsOpen = React.useCallback(
    (open: boolean) => {
      if (isControlled && controlledOnOpenChange) {
        controlledOnOpenChange(open);
      } else {
        setInternalIsOpen(open);
      }
    },
    [isControlled, controlledOnOpenChange]
  );

  // Global keyboard shortcut: Cmd+K (Mac) / Ctrl+K (Windows/Linux)
  useCaptureShortcut({
    onOpen: () => setIsOpen(true),
    enabled: true,
  });

  const handleSuccess = (item: ItemRow) => {
    toast.success(`Captured: ${item.title || "Untitled"}`);
    setIsOpen(false);
    if (onItemSaved) {
      onItemSaved(item);
    }
  };

  const handleError = (errorMsg: string) => {
    toast.error(errorMsg || "Failed to save capture");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl border-border bg-card p-0 gap-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-4 pb-2 border-b border-border/80 bg-background/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xs uppercase tracking-widest text-primary flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Quick Capture</span>
            </DialogTitle>
            <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">
              Press Esc to close
            </span>
          </div>
          <DialogDescription className="text-[11px] text-muted-foreground text-left">
            Record a fleeting thought, voice note, visual fragment, or inspiration without friction.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Selector */}
        <CaptureTypeSelector
          activeType={activeType}
          onChange={(type) => setActiveType(type)}
        />

        {/* Dynamic Tab Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto">
          {activeType === "text" && (
            <TextCapture
              workspaceId={workspaceId}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          )}

          {activeType === "audio" && (
            <AudioCapture
              workspaceId={workspaceId}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          )}

          {activeType === "image" && (
            <ImageCapture
              workspaceId={workspaceId}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          )}

          {activeType === "file" && (
            <FileCapture
              workspaceId={workspaceId}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          )}

          {activeType === "link" && (
            <LinkCapture
              workspaceId={workspaceId}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
