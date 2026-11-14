"use client";

import * as React from "react";
import { useAudioRecorder, formatAudioDuration } from "../hooks/use-audio-recorder";
import { uploadCaptureAsset } from "../services/upload-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mic,
  Square,
  Pause,
  Play,
  RotateCcw,
  UploadCloud,
  FileAudio,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ItemRow } from "../types";

interface AudioCaptureProps {
  workspaceId: string;
  onSuccess: (item: ItemRow) => void;
  onError: (error: string) => void;
}

export function AudioCapture({
  onSuccess,
  onError,
}: AudioCaptureProps) {
  const [activeTab, setActiveTab] = React.useState<"record" | "upload">("record");
  const [title, setTitle] = React.useState("");
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  // File upload state for existing audio files
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const {
    state: recordState,
    duration,
    audioBlob,
    audioUrl,
    mimeType,
    error: recorderError,
    canPause,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  const formatDuration = formatAudioDuration;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("audio/")) {
        onError("Please select a valid audio file (e.g. mp3, wav, m4a, ogg).");
        return;
      }
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSaveRecording = async () => {
    if (!audioBlob) return;
    setIsUploading(true);
    setUploadProgress(10);

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const filename = `take-${timestamp}.webm`;
    const finalTitle = title.trim() || `Voice Take — ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    try {
      const res = await uploadCaptureAsset(
        audioBlob,
        {
          title: finalTitle,
          originalFilename: filename,
          mimeType: mimeType || "audio/webm",
          fileSize: audioBlob.size,
          contentType: "audio",
          metadata: {
            durationSeconds: duration,
            recordedInBrowser: true,
          },
        },
        (progress) => setUploadProgress(progress)
      );

      if (res.success && res.item) {
        resetRecording();
        onSuccess(res.item);
      } else {
        onError(res.error || "Audio upload failed");
      }
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Failed to save audio recording");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleSaveExistingFile = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const res = await uploadCaptureAsset(
        selectedFile,
        {
          title: title.trim() || selectedFile.name,
          originalFilename: selectedFile.name,
          mimeType: selectedFile.type,
          fileSize: selectedFile.size,
          contentType: "audio",
          metadata: {
            uploadedAt: new Date().toISOString(),
          },
        },
        (progress) => setUploadProgress(progress)
      );

      if (res.success && res.item) {
        setSelectedFile(null);
        onSuccess(res.item);
      } else {
        onError(res.error || "Failed to upload audio file");
      }
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Failed to upload audio file");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle (Record vs Upload File) */}
      <div className="flex border-b border-border/80 gap-4 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("record")}
          className={cn(
            "pb-2 transition-colors",
            activeTab === "record"
              ? "border-b-2 border-primary text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Microphone Take
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={cn(
            "pb-2 transition-colors",
            activeTab === "upload"
              ? "border-b-2 border-primary text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Audio File Upload
        </button>
      </div>

      {/* Title Input */}
      <div className="space-y-1.5">
        <Label htmlFor="audio-title">Title (Optional)</Label>
        <Input
          id="audio-title"
          placeholder="Untitled Audio Take"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isUploading || recordState === "recording"}
          maxLength={200}
        />
      </div>

      {/* Record Mode */}
      {activeTab === "record" && (
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-input/10 p-6 text-center">
            {recorderError && (
              <div className="mb-4 flex items-center gap-1.5 rounded border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{recorderError}</span>
              </div>
            )}

            {/* Recording duration counter */}
            <div className="mb-3 font-mono text-3xl font-semibold tracking-wider text-foreground">
              {formatDuration(duration)}
            </div>

            {/* Status indicator */}
            <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
              {recordState === "recording" && (
                <>
                  <span className="h-2 w-2 animate-ping rounded-full bg-destructive" />
                  <span className="text-destructive font-medium uppercase tracking-wider">Recording Live Take</span>
                </>
              )}
              {recordState === "paused" && (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-amber-500 font-medium uppercase tracking-wider">Take Paused</span>
                </>
              )}
              {recordState === "recorded" && (
                <span className="text-primary uppercase tracking-wider font-medium">Recording Complete</span>
              )}
              {recordState === "idle" && (
                <span>Click Record to capture voice note</span>
              )}
            </div>

            {/* Recorder Controls */}
            <div className="flex items-center gap-3">
              {recordState === "idle" && (
                <Button
                  type="button"
                  onClick={startRecording}
                  className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs uppercase tracking-wider px-5"
                >
                  <Mic className="h-4 w-4" />
                  <span>Start Recording</span>
                </Button>
              )}

              {recordState === "recording" && (
                <>
                  {canPause && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={pauseRecording}
                      className="gap-1.5 text-xs uppercase"
                    >
                      <Pause className="h-3.5 w-3.5" />
                      <span>Pause</span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={stopRecording}
                    className="gap-1.5 text-xs uppercase"
                  >
                    <Square className="h-3.5 w-3.5" />
                    <span>Stop Take</span>
                  </Button>
                </>
              )}

              {recordState === "paused" && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={resumeRecording}
                    className="gap-1.5 text-xs uppercase"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Resume</span>
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={stopRecording}
                    className="gap-1.5 text-xs uppercase"
                  >
                    <Square className="h-3.5 w-3.5" />
                    <span>Finish</span>
                  </Button>
                </>
              )}

              {recordState === "recorded" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetRecording}
                  disabled={isUploading}
                  className="gap-1.5 text-xs uppercase"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Discard & Re-Record</span>
                </Button>
              )}
            </div>

            {/* Audio Preview Player */}
            {audioUrl && recordState === "recorded" && (
              <div className="mt-6 w-full max-w-md">
                <audio controls src={audioUrl} className="w-full h-10 rounded border border-border" />
              </div>
            )}
          </div>

          {/* Save Recording Button */}
          {recordState === "recorded" && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                onClick={handleSaveRecording}
                disabled={isUploading}
                className="text-xs uppercase tracking-wider"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    <span>Saving Take {uploadProgress ? `(${uploadProgress}%)` : "..."}</span>
                  </>
                ) : (
                  "Save Voice Note"
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Upload File Mode */}
      {activeTab === "upload" && (
        <div className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="audio/*"
            className="hidden"
          />

          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-input/10 p-8 text-center cursor-pointer hover:border-primary/60 transition-colors"
            >
              <FileAudio className="mb-2 h-8 w-8 text-muted-foreground/60" />
              <p className="text-xs font-medium text-foreground">Click or drop audio file here</p>
              <p className="text-[11px] text-muted-foreground mt-1">MP3, WAV, OGG, M4A, FLAC up to 50 MB</p>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-md border border-border bg-card p-3">
              <div className="flex items-center gap-3">
                <FileAudio className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &middot; {selectedFile.type}
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
                Change
              </Button>
            </div>
          )}

          {selectedFile && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                onClick={handleSaveExistingFile}
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
                    <span>Upload Audio</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
