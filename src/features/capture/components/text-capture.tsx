"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TiptapEditor } from "./tiptap-editor";
import { useDraftPersistence } from "../hooks/use-draft-persistence";
import { saveTextCaptureAction } from "../actions";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { ItemRow } from "../types";

interface TextCaptureProps {
  workspaceId: string;
  onSuccess: (item: ItemRow) => void;
  onError: (error: string) => void;
}

export function TextCapture({
  workspaceId,
  onSuccess,
  onError,
}: TextCaptureProps) {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [richContent, setRichContent] = React.useState<Record<string, unknown>>({});
  const [contentMarkdown, setContentMarkdown] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    draftId,
    saveStatus,
    loadStoredDraft,
    persistDraft,
    clearDraft,
  } = useDraftPersistence({
    workspaceId,
    captureType: "text",
  });

  // Attempt draft restoration on mount
  React.useEffect(() => {
    const draft = loadStoredDraft();
    if (draft) {
      if (draft.title) setTitle(draft.title);
      if (draft.content) setContent(draft.content);
      if (draft.richContent) setRichContent(draft.richContent);
      if (draft.contentMarkdown) setContentMarkdown(draft.contentMarkdown);
    }
  }, [loadStoredDraft]);

  const handleEditorChange = React.useCallback(
    (data: { json: Record<string, unknown>; text: string; markdown: string }) => {
      setContent(data.text);
      setRichContent(data.json);
      setContentMarkdown(data.markdown);

      persistDraft({
        title,
        content: data.text,
        richContent: data.json,
        contentMarkdown: data.markdown,
      });
    },
    [title, persistDraft]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    persistDraft({
      title: newTitle,
      content,
      richContent,
      contentMarkdown,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await saveTextCaptureAction(
        {
          title,
          content,
          richContent,
          contentMarkdown,
          status: "active",
        },
        draftId
      );

      if (res.success && res.item) {
        clearDraft();
        onSuccess(res.item);
      } else {
        onError(res.error || "Failed to save note");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save note";
      onError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title & Autosave status bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="note-title">Title (Optional)</Label>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="h-2.5 w-2.5 animate-spin text-muted-foreground" />
                <span>Autosaving draft...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <CheckCircle2 className="h-2.5 w-2.5 text-primary" />
                <span className="text-primary/90">Draft saved</span>
              </>
            )}
            {saveStatus === "error" && (
              <>
                <AlertCircle className="h-2.5 w-2.5 text-destructive" />
                <span className="text-destructive">Local fallback active</span>
              </>
            )}
          </div>
        </div>
        <Input
          id="note-title"
          placeholder="Untitled note or song draft"
          value={title}
          onChange={handleTitleChange}
          disabled={isSubmitting}
          maxLength={200}
        />
      </div>

      {/* Rich Text Editor */}
      <div className="space-y-1.5">
        <Label>Creative Notes / Lyrics</Label>
        <TiptapEditor
          initialContent={richContent}
          onChange={handleEditorChange}
        />
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="text-xs uppercase tracking-wider"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Recording to Studio...
            </>
          ) : (
            "Save Note"
          )}
        </Button>
      </div>
    </form>
  );
}
