// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCaptureShortcut } from "@/features/capture/hooks/use-capture-shortcut";

describe("Keyboard Shortcut: useCaptureShortcut hook", () => {
  it("triggers onOpen when Ctrl+K is pressed", () => {
    const onOpen = vi.fn();
    renderHook(() => useCaptureShortcut({ onOpen }));

    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      cancelable: true,
    });
    window.dispatchEvent(event);

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it("triggers onOpen when Cmd+K (metaKey) is pressed on macOS", () => {
    const onOpen = vi.fn();
    renderHook(() => useCaptureShortcut({ onOpen }));

    const event = new KeyboardEvent("keydown", {
      key: "K",
      metaKey: true,
      cancelable: true,
    });
    window.dispatchEvent(event);

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it("does not trigger when K is pressed without Ctrl or Cmd", () => {
    const onOpen = vi.fn();
    renderHook(() => useCaptureShortcut({ onOpen }));

    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: false,
      metaKey: false,
    });
    window.dispatchEvent(event);

    expect(onOpen).not.toHaveBeenCalled();
  });

  it("does not trigger when other shortcuts are pressed (e.g. Ctrl+P)", () => {
    const onOpen = vi.fn();
    renderHook(() => useCaptureShortcut({ onOpen }));

    const event = new KeyboardEvent("keydown", {
      key: "p",
      ctrlKey: true,
    });
    window.dispatchEvent(event);

    expect(onOpen).not.toHaveBeenCalled();
  });

  it("does not trigger when disabled", () => {
    const onOpen = vi.fn();
    renderHook(() => useCaptureShortcut({ onOpen, enabled: false }));

    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
    });
    window.dispatchEvent(event);

    expect(onOpen).not.toHaveBeenCalled();
  });

  it("removes event listener on unmount", () => {
    const onOpen = vi.fn();
    const { unmount } = renderHook(() => useCaptureShortcut({ onOpen }));

    unmount();

    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
    });
    window.dispatchEvent(event);

    expect(onOpen).not.toHaveBeenCalled();
  });
});
