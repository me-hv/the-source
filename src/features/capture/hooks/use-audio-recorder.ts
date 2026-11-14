"use client";

import * as React from "react";

export type RecordingState = "idle" | "recording" | "paused" | "recorded";

export interface UseAudioRecorderReturn {
  state: RecordingState;
  duration: number; // in seconds
  audioBlob: Blob | null;
  audioUrl: string | null;
  mimeType: string;
  error: string | null;
  isSupported: boolean;
  canPause: boolean;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  resetRecording: () => void;
}

/**
 * Discovers the best supported audio MIME type across browsers.
 */
export function formatAudioDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function getSupportedAudioMimeType(): string {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return "audio/webm";
  }

  const candidateTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/wav",
  ];

  for (const type of candidateTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "";
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [state, setState] = React.useState<RecordingState>("idle");
  const [duration, setDuration] = React.useState<number>(0);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [mimeType, setMimeType] = React.useState<string>("audio/webm");
  const [error, setError] = React.useState<string | null>(null);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof MediaRecorder !== "undefined";

  const canPause =
    typeof MediaRecorder !== "undefined" &&
    typeof MediaRecorder.prototype.pause === "function" &&
    typeof MediaRecorder.prototype.resume === "function";

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = React.useCallback(async () => {
    setError(null);
    if (!isSupported) {
      setError("Audio recording is not supported in this browser.");
      return;
    }

    try {
      // 1. Request microphone access only upon user action
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // 2. Select compatible MIME type
      const selectedMime = getSupportedAudioMimeType();
      setMimeType(selectedMime || "audio/webm");

      const options: MediaRecorderOptions = selectedMime ? { mimeType: selectedMime } : {};
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(chunksRef.current, {
          type: selectedMime || "audio/webm",
        });
        setAudioBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setAudioUrl(url);
        setState("recorded");
        clearTimer();
        stopStream();
      };

      recorder.onerror = () => {
        setError("An error occurred during audio recording.");
        clearTimer();
        stopStream();
        setState("idle");
      };

      // 3. Start recording in slices
      recorder.start(250);
      setState("recording");
      setDuration(0);

      clearTimer();
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      if (errorObj.name === "NotAllowedError" || errorObj.name === "PermissionDeniedError") {
        setError("Microphone permission was denied. Please allow microphone access to record.");
      } else if (errorObj.name === "NotFoundError" || errorObj.name === "DevicesNotFoundError") {
        setError("No microphone device was found on your system.");
      } else {
        setError(errorObj.message || "Could not initialize microphone recording.");
      }
      setState("idle");
      clearTimer();
      stopStream();
    }
  }, [isSupported]);

  const pauseRecording = React.useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      try {
        mediaRecorderRef.current.pause();
        setState("paused");
        clearTimer();
      } catch {
        // Pause not supported
      }
    }
  }, [state]);

  const resumeRecording = React.useCallback(() => {
    if (mediaRecorderRef.current && state === "paused") {
      try {
        mediaRecorderRef.current.resume();
        setState("recording");
        timerRef.current = setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);
      } catch {
        // Resume error
      }
    }
  }, [state]);

  const stopRecording = React.useCallback(() => {
    if (mediaRecorderRef.current && (state === "recording" || state === "paused")) {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        clearTimer();
        stopStream();
        setState("idle");
      }
    }
  }, [state]);

  const resetRecording = React.useCallback(() => {
    clearTimer();
    stopStream();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setState("idle");
    setError(null);
    chunksRef.current = [];
  }, [audioUrl]);

  // Clean up on unmount or browser navigation
  React.useEffect(() => {
    return () => {
      clearTimer();
      stopStream();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return {
    state,
    duration,
    audioBlob,
    audioUrl,
    mimeType,
    error,
    isSupported,
    canPause,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  };
}
