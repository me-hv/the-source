// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  formatAudioDuration,
  getSupportedAudioMimeType,
  useAudioRecorder,
} from "@/features/capture/hooks/use-audio-recorder";

describe("Audio Recorder: formatAudioDuration", () => {
  it("formats zero seconds as 00:00", () => {
    expect(formatAudioDuration(0)).toBe("00:00");
  });

  it("formats seconds less than a minute correctly", () => {
    expect(formatAudioDuration(9)).toBe("00:09");
    expect(formatAudioDuration(45)).toBe("00:45");
  });

  it("formats multi-minute durations correctly", () => {
    expect(formatAudioDuration(60)).toBe("01:00");
    expect(formatAudioDuration(125)).toBe("02:05");
    expect(formatAudioDuration(3600)).toBe("60:00");
  });

  it("handles negative numbers and NaN gracefully", () => {
    expect(formatAudioDuration(-5)).toBe("00:00");
    expect(formatAudioDuration(NaN)).toBe("00:00");
  });
});

describe("Audio Recorder: getSupportedAudioMimeType", () => {
  const originalMediaRecorder = window.MediaRecorder;

  afterEach(() => {
    window.MediaRecorder = originalMediaRecorder;
  });

  it("returns audio/webm if MediaRecorder is not supported in the environment", () => {
    // @ts-expect-error - simulating unsupported environment
    delete window.MediaRecorder;
    expect(getSupportedAudioMimeType()).toBe("audio/webm");
  });

  it("picks the first supported MIME type in preference order", () => {
    const mockMediaRecorder = vi.fn() as unknown as typeof MediaRecorder;
    mockMediaRecorder.isTypeSupported = vi.fn((type: string) => {
      return type === "audio/webm;codecs=opus";
    });
    window.MediaRecorder = mockMediaRecorder;

    expect(getSupportedAudioMimeType()).toBe("audio/webm;codecs=opus");
  });

  it("falls back to audio/mp4 on Safari/WebKit", () => {
    const mockMediaRecorder = vi.fn() as unknown as typeof MediaRecorder;
    mockMediaRecorder.isTypeSupported = vi.fn((type: string) => {
      return type === "audio/mp4";
    });
    window.MediaRecorder = mockMediaRecorder;

    expect(getSupportedAudioMimeType()).toBe("audio/mp4");
  });
});

describe("Audio Recorder: useAudioRecorder hook lifecycle", () => {
  let mockTracks: { stop: ReturnType<typeof vi.fn> }[];
  let mockStream: { getTracks: () => typeof mockTracks };
  let mockRecorderInstance: {
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    resume: ReturnType<typeof vi.fn>;
    ondataavailable: ((e: { data: Blob }) => void) | null;
    onstop: (() => void) | null;
    onerror: (() => void) | null;
  };

  beforeEach(() => {
    vi.useFakeTimers();

    mockTracks = [{ stop: vi.fn() }];
    mockStream = {
      getTracks: () => mockTracks,
    };

    mockRecorderInstance = {
      start: vi.fn(),
      stop: vi.fn(() => {
        if (mockRecorderInstance.onstop) mockRecorderInstance.onstop();
      }),
      pause: vi.fn(),
      resume: vi.fn(),
      ondataavailable: null,
      onstop: null,
      onerror: null,
    };

    // Mock navigator.mediaDevices.getUserMedia
    Object.defineProperty(navigator, "mediaDevices", {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    });

    // Mock MediaRecorder constructor and prototype
    const mockMediaRecorder = vi.fn().mockImplementation(() => mockRecorderInstance) as any;
    mockMediaRecorder.prototype = {
      pause: vi.fn(),
      resume: vi.fn(),
    };
    mockMediaRecorder.isTypeSupported = vi.fn(() => true);
    window.MediaRecorder = mockMediaRecorder;

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => "blob:http://localhost/test-audio");
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("initializes in idle state", () => {
    const { result } = renderHook(() => useAudioRecorder());
    expect(result.current.state).toBe("idle");
    expect(result.current.duration).toBe(0);
    expect(result.current.audioBlob).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("starts recording and increments duration timer", async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.state).toBe("recording");
    expect(mockRecorderInstance.start).toHaveBeenCalledWith(250);

    // Advance timer by 3 seconds
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.duration).toBe(3);
  });

  it("pauses and resumes recording correctly", async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.duration).toBe(2);

    // Pause
    act(() => {
      result.current.pauseRecording();
    });
    expect(result.current.state).toBe("paused");
    expect(mockRecorderInstance.pause).toHaveBeenCalled();

    // Advance timer while paused: duration should NOT change
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.duration).toBe(2);

    // Resume
    act(() => {
      result.current.resumeRecording();
    });
    expect(result.current.state).toBe("recording");
    expect(mockRecorderInstance.resume).toHaveBeenCalled();

    // Advance timer again
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.duration).toBe(4);
  });

  it("stops recording, stops tracks, creates blob and sets state to recorded", async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    // Simulate incoming data chunk
    act(() => {
      if (mockRecorderInstance.ondataavailable) {
        mockRecorderInstance.ondataavailable({
          data: new Blob(["audio-data"], { type: "audio/webm" }),
        });
      }
    });

    // Stop
    act(() => {
      result.current.stopRecording();
    });

    expect(result.current.state).toBe("recorded");
    expect(result.current.audioBlob).not.toBeNull();
    expect(result.current.audioUrl).toBe("blob:http://localhost/test-audio");
    expect(mockTracks[0].stop).toHaveBeenCalled();
  });

  it("handles microphone permission denial gracefully", async () => {
    const permError = new Error("Permission denied");
    permError.name = "NotAllowedError";

    navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(permError);

    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.state).toBe("idle");
    expect(result.current.error).toMatch(/Microphone permission was denied/);
  });

  it("resets recording state and revokes object URL", async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      result.current.stopRecording();
    });
    expect(result.current.state).toBe("recorded");

    act(() => {
      result.current.resetRecording();
    });

    expect(result.current.state).toBe("idle");
    expect(result.current.audioBlob).toBeNull();
    expect(result.current.audioUrl).toBeNull();
    expect(result.current.duration).toBe(0);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/test-audio");
  });
});
