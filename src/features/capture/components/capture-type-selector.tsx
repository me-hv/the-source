"use client";

import * as React from "react";
import { FileText, Mic, Image as ImageIcon, Paperclip, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CaptureType } from "../types";

interface CaptureTypeSelectorProps {
  activeType: CaptureType;
  onChange: (type: CaptureType) => void;
  disabled?: boolean;
}

const captureTypes: Array<{
  id: CaptureType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    id: "text",
    label: "Note / Draft",
    icon: FileText,
    description: "Lyrics, rhymes, chords, or notes",
  },
  {
    id: "audio",
    label: "Voice / Audio",
    icon: Mic,
    description: "Record voice take or upload audio",
  },
  {
    id: "image",
    label: "Visual Reference",
    icon: ImageIcon,
    description: "Artwork, photos, or references",
  },
  {
    id: "file",
    label: "Document",
    icon: Paperclip,
    description: "PDF, text, sheet, or document",
  },
  {
    id: "link",
    label: "Inspiration Link",
    icon: LinkIcon,
    description: "URL or creative resource",
  },
];

export function CaptureTypeSelector({
  activeType,
  onChange,
  disabled = false,
}: CaptureTypeSelectorProps) {
  return (
    <div className="flex border-b border-border bg-muted/40 p-1 gap-1 overflow-x-auto">
      {captureTypes.map((item) => {
        const Icon = item.icon;
        const isActive = activeType === item.id;

        return (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(item.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap outline-none",
              isActive
                ? "bg-card text-foreground border border-border shadow-sm text-primary"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            title={item.description}
          >
            <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
