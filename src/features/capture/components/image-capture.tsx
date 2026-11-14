"use client";

import * as React from "react";
import { uploadCaptureAsset } from "../services/upload-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, X, UploadCloud, Loader2 } from "lucide-react";
import { ALLOWED_IMAGE_MIME_TYPES } from "../validation/capture";
import type { ItemRow } from "../types";

interface ImageCaptureProps {
  workspaceId: string;
  onSuccess: (item: ItemRow) => void;
  onError: (error: string) => void;
}

export function ImageCapture({
  onSuccess,
  onError,
}: ImageCaptureProps) {
  const [title, setTitle] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleProcessFile = (file: File) => {
    // MIME validation
    const isValidMime = ALLOWED_IMAGE_MIME_TYPES.includes(file.type);
    if (!isValidMime) {
      onError("Please select a supported image format (JPEG, PNG, WEBP, GIF, SVG).");
      return;
    }

    if (file.size > 52428800) {
      onError("Image size exceeds the 50 MB limit.");
      return;
    }

    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
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

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const res = await uploadCaptureAsset(selectedFile, {
        title: title.trim() || selectedFile.name,
        originalFilename: selectedFile.name,
        mimeType: selectedFile.type,
        fileSize: selectedFile.size,
        contentType: "image",
        metadata: {
          uploadedAt: new Date().toISOString(),
        },
      });

      if (res.success && res.item) {
        handleRemove();
        onSuccess(res.item);
      } else {
        onError(res.error || "Image upload failed");
      }
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Failed to upload visual asset");
    } finally {
      setIsUploading(false);
    }
  };

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
      />

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="image-title">Title (Optional)</Label>
        <Input
          id="image-title"
          placeholder="Visual Reference / Artwork Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isUploading}
          maxLength={200}
        />
      </div>

      {/* Upload Box / Preview */}
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
          <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground/60" />
          <p className="text-xs font-medium text-foreground">
            Click to upload or drag and drop image
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            JPEG, PNG, WebP, GIF, SVG up to 50 MB
          </p>
        </div>
      ) : (
        <div className="relative rounded-lg border border-border bg-card p-3">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {previewUrl && (
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded border border-border/80 bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 space-y-1 text-center sm:text-left">
              <p className="text-xs font-medium text-foreground truncate max-w-xs">
                {selectedFile.name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &middot; {selectedFile.type}
              </p>
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                  disabled={isUploading}
                  className="text-[11px] h-7"
                >
                  <X className="mr-1 h-3 w-3" />
                  <span>Remove Image</span>
                </Button>
              </div>
            </div>
          </div>
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
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
                <span>Save Visual Asset</span>
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  );
}
