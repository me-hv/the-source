"use client";

import * as React from "react";
import { saveLinkCaptureAction, fetchLinkMetadataAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link as LinkIcon, Sparkles, Loader2 } from "lucide-react";
import type { ItemRow } from "../types";

interface LinkCaptureProps {
  workspaceId: string;
  onSuccess: (item: ItemRow) => void;
  onError: (error: string) => void;
}

export function LinkCapture({
  onSuccess,
  onError,
}: LinkCaptureProps) {
  const [url, setUrl] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isFetchingMeta, setIsFetchingMeta] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleFetchMetadata = async () => {
    if (!url || !url.startsWith("http")) return;
    setIsFetchingMeta(true);
    try {
      const res = await fetchLinkMetadataAction(url);
      if (res.success && res.data) {
        if (res.data.title && !title) setTitle(res.data.title);
        if (res.data.description && !description) setDescription(res.data.description);
      }
    } catch {
      // Non-fatal: user can still save manually
    } finally {
      setIsFetchingMeta(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      onError("Please enter a valid URL.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await saveLinkCaptureAction({
        url,
        title: title.trim() || undefined,
        description: description.trim(),
      });

      if (res.success && res.item) {
        setUrl("");
        setTitle("");
        setDescription("");
        onSuccess(res.item);
      } else {
        onError(res.error || "Failed to save link reference");
      }
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Failed to save link reference");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* URL Input with Autofetch */}
      <div className="space-y-1.5">
        <Label htmlFor="link-url">URL / Web Resource (Required)</Label>
        <div className="flex gap-2">
          <Input
            id="link-url"
            type="url"
            placeholder="https://example.com/article-or-track"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isSubmitting}
            required
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFetchMetadata}
            disabled={!url || isFetchingMeta || isSubmitting}
            className="text-[11px] gap-1 px-3 shrink-0"
            title="Auto-fetch page title and description"
          >
            {isFetchingMeta ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3 text-primary" />
            )}
            <span>Inspect</span>
          </Button>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="link-title">Title (Optional)</Label>
        <Input
          id="link-title"
          placeholder="Title or Reference Label"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
          maxLength={200}
        />
      </div>

      {/* Personal Description */}
      <div className="space-y-1.5">
        <Label htmlFor="link-desc">Creative Context / Description (Optional)</Label>
        <textarea
          id="link-desc"
          rows={3}
          placeholder="Why does this inspire you? What connection does it spark?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          maxLength={2000}
          className="flex w-full rounded-md border border-border bg-input/50 p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting || !url}
          className="text-xs uppercase tracking-wider"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              <span>Saving Link...</span>
            </>
          ) : (
            <>
              <LinkIcon className="mr-1.5 h-3.5 w-3.5" />
              <span>Save Reference</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
