"use client";

import * as React from "react";
import {
  FileText,
  Mic,
  Image as ImageIcon,
  Paperclip,
  Link as LinkIcon,
  ExternalLink,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ItemWithAsset } from "../types";

interface RecentCapturesProps {
  items: ItemWithAsset[];
  onTriggerCapture?: () => void;
}

export function RecentCaptures({ items, onTriggerCapture }: RecentCapturesProps) {
  const getItemIcon = (contentType: string) => {
    switch (contentType) {
      case "audio":
        return <Mic className="h-4 w-4 text-amber-500" />;
      case "image":
        return <ImageIcon className="h-4 w-4 text-emerald-500" />;
      case "file":
        return <Paperclip className="h-4 w-4 text-blue-500" />;
      case "link":
        return <LinkIcon className="h-4 w-4 text-violet-500" />;
      default:
        return <FileText className="h-4 w-4 text-primary" />;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/80 bg-background/30 p-8 text-center">
        <div className="mx-auto max-w-sm space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            No captures yet
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your studio vault is waiting. Record an audio take, write a lyrical idea, or capture an inspiration link to get started.
          </p>
          {onTriggerCapture && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onTriggerCapture}
                className="text-xs uppercase tracking-wider gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Open Quick Capture</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Recent Studio Captures ({items.length})
        </h3>
        {onTriggerCapture && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onTriggerCapture}
            className="text-[11px] h-7 gap-1 text-primary hover:text-primary hover:bg-primary/10"
          >
            <Plus className="h-3 w-3" />
            <span>New Capture</span>
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const meta = (item.metadata || {}) as Record<string, unknown>;
          const description = typeof meta.description === "string" ? meta.description : undefined;
          const originalFilename = typeof meta.originalFilename === "string" ? meta.originalFilename : undefined;

          return (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-lg border border-border/80 bg-card p-4 transition-colors hover:border-border"
            >
              <div className="space-y-2">
                {/* Header: Icon, Type Badge & Date */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {getItemIcon(item.content_type)}
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
                      {item.content_type}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60">
                    {formatDate(item.created_at)}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-sm font-medium tracking-tight text-foreground line-clamp-1">
                  {item.title || "Untitled"}
                </h4>

                {/* Content Preview by Type */}
                {item.content_type === "text" && item.content && (
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {item.content}
                  </p>
                )}

                {item.content_type === "link" && item.content && (
                  <div className="space-y-1">
                    <a
                      href={item.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline line-clamp-1 break-all"
                    >
                      <span className="truncate">{item.content}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                    {description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {description}
                      </p>
                    )}
                  </div>
                )}

                {item.content_type === "image" && item.signedUrl && (
                  <div className="relative mt-2 h-32 w-full overflow-hidden rounded border border-border/60 bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.signedUrl}
                      alt={item.title || "Capture asset"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                {item.content_type === "audio" && item.signedUrl && (
                  <div className="mt-2">
                    <audio
                      controls
                      src={item.signedUrl}
                      className="w-full h-8 rounded"
                    />
                  </div>
                )}

                {item.content_type === "file" && (
                  <div className="rounded border border-border/50 bg-secondary/30 p-2 text-[11px] text-muted-foreground truncate">
                    {originalFilename || item.title}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
