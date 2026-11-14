"use client";

import * as React from "react";
import { uploadCaptureAsset } from "../services/upload-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Paperclip, FileText, X, UploadCloud, Loader2 } from "lucide-react";
import { ALLOWED_DOCUMENT_MIME_TYPES } from "../validation/capture";
import type { ItemRow } from "../types";

interface FileCaptureProps {
  workspaceId: string;
  onSuccess: (item: ItemRow) => void;
  onError: (error: string) => void;
}

export function FileCapture({
  onSuccess,
  onError,
}: FileCaptureProps) {
  const [title, setTitle] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleProcessFile = (file: File) => {
    // MIME validation or extension fallback
    const isDoc =
      ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type) ||
      file.name.endsWith(".pdf") ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".md");

    if (!isDoc) {
      onError("Please select a supported document (PDF, Text, or Markdown).");
      return;
    }

    if (file.size > 52428800) {
      onError("File size exceeds the 50 MB limit.");
      return;
    }

    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const res = await uploadCaptureAsset(selectedFile, {
        title: title.trim() || selectedFile.name,
        originalFilename: selectedFile.name,
        mimeType: selectedFile.type || "application/octet-stream",
        fileSize: selectedFile.size,
        contentType: "file",
        metadata: {
          uploadedAt: new Date().toISOString(),
        },
      });

      if (res.success && res.item) {
        setSelectedFile(null);
        onSuccess(res.item);
      } else {
        onError(res.error || "File upload failed");
      }
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
        className="hidden"
      />

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="file-title">Title (Optional)</Label>
        <Input
          id="file-title"
          placeholder="Document / Liner Notes / Script Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isUploading}
          maxLength={200}
        />
      </div>

      {/* Upload Drop Zone / Selected view */}
      {!selectedFile ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border/80 bg-input/10 hover:border-primary/60"
          }`}
        >
          <Paperclip className="mb-2 h-8 w-8 text-muted-foreground/60" />
          <p className="text-xs font-medium text-foreground">
            Click to upload or drag and drop document
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            PDF, TXT, Markdown up to 50 MB
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded border border-border bg-secondary">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground truncate max-w-xs sm:max-w-md">
                {selectedFile.name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &middot;{" "}
                {selectedFile.type || "Document"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedFile(null)}
            disabled={isUploading}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {selectedFile && (
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="submit"
            disabled={isUploading}
            className="text-xs uppercase tracking-wider"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                <span>Uploading Document...</span>
              </>
            ) : (
              <>
                <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
                <span>Save Document</span>
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  );
}
