import { describe, it, expect } from "vitest";
import {
  textCaptureSchema,
  linkCaptureSchema,
  fileMetaSchema,
  audioMetaSchema,
  imageMetaSchema,
  documentMetaSchema,
  sanitizeFilename,
  isSafePublicUrl,
  BUCKET_FILE_SIZE_LIMIT,
} from "@/features/capture/validation/capture";

describe("Capture Validation: textCaptureSchema", () => {
  it("defaults title to 'Untitled' when title is omitted or empty", () => {
    const res1 = textCaptureSchema.parse({ content: "Lyric idea" });
    expect(res1.title).toBe("Untitled");
    expect(res1.content).toBe("Lyric idea");

    const res2 = textCaptureSchema.parse({ title: "   ", content: "Beat rhythm" });
    expect(res2.title).toBe("Untitled");
  });

  it("preserves non-empty title and trims whitespace", () => {
    const res = textCaptureSchema.parse({ title: "  Verse 1 Hook  ", content: "Test" });
    expect(res.title).toBe("Verse 1 Hook");
  });

  it("rejects title exceeding 200 characters", () => {
    const longTitle = "a".repeat(201);
    expect(() => textCaptureSchema.parse({ title: longTitle })).toThrow(/under 200 characters/);
  });

  it("stores canonical richContent and markdown defaults", () => {
    const sampleJson = { type: "doc", content: [{ type: "paragraph", text: "sample" }] };
    const res = textCaptureSchema.parse({
      title: "Draft 1",
      content: "sample",
      richContent: sampleJson,
      contentMarkdown: "sample",
    });
    expect(res.richContent).toEqual(sampleJson);
    expect(res.contentMarkdown).toBe("sample");
  });
});

describe("Capture Validation: linkCaptureSchema", () => {
  it("accepts valid http and https URLs", () => {
    const res1 = linkCaptureSchema.parse({ url: "https://soundcloud.com/track/123" });
    expect(res1.url).toBe("https://soundcloud.com/track/123");

    const res2 = linkCaptureSchema.parse({ url: "http://example.com/sample.mp3" });
    expect(res2.url).toBe("http://example.com/sample.mp3");
  });

  it("rejects non-http/https protocols such as javascript: or ftp:", () => {
    expect(() => linkCaptureSchema.parse({ url: "javascript:alert(1)" })).toThrow(
      /Only HTTP and HTTPS URLs are supported/
    );
    expect(() => linkCaptureSchema.parse({ url: "ftp://example.com/file" })).toThrow(
      /Only HTTP and HTTPS URLs are supported/
    );
  });

  it("rejects malformed URLs", () => {
    expect(() => linkCaptureSchema.parse({ url: "not-a-valid-url" })).toThrow(
      /Please enter a valid URL/
    );
  });

  it("enforces description limit of 2000 characters", () => {
    const longDesc = "a".repeat(2001);
    expect(() =>
      linkCaptureSchema.parse({ url: "https://example.com", description: longDesc })
    ).toThrow(/under 2000 characters/);
  });
});

describe("Capture Validation: fileMetaSchema & MIME schemas", () => {
  it("validates file sizes within the 50 MB limit", () => {
    const valid = fileMetaSchema.parse({
      originalFilename: "sample.mp3",
      mimeType: "audio/mpeg",
      fileSize: 10 * 1024 * 1024,
      contentType: "audio",
    });
    expect(valid.title).toBe("Untitled");
    expect(valid.fileSize).toBe(10 * 1024 * 1024);
  });

  it("rejects zero-byte files", () => {
    expect(() =>
      fileMetaSchema.parse({
        originalFilename: "empty.wav",
        mimeType: "audio/wav",
        fileSize: 0,
        contentType: "audio",
      })
    ).toThrow(/File cannot be empty/);
  });

  it("rejects files exceeding 50 MB limit", () => {
    expect(() =>
      fileMetaSchema.parse({
        originalFilename: "huge.wav",
        mimeType: "audio/wav",
        fileSize: BUCKET_FILE_SIZE_LIMIT + 1,
        contentType: "audio",
      })
    ).toThrow(/File exceeds the 50 MB limit/);
  });

  it("validates audio MIME types strictly with audioMetaSchema", () => {
    expect(() =>
      audioMetaSchema.parse({
        originalFilename: "track.mp3",
        mimeType: "audio/mpeg",
        fileSize: 1024,
        contentType: "audio",
      })
    ).not.toThrow();

    expect(() =>
      audioMetaSchema.parse({
        originalFilename: "track.exe",
        mimeType: "application/x-msdownload",
        fileSize: 1024,
        contentType: "audio",
      })
    ).toThrow(/Unsupported audio format/);
  });

  it("validates image MIME types strictly with imageMetaSchema", () => {
    expect(() =>
      imageMetaSchema.parse({
        originalFilename: "moodboard.png",
        mimeType: "image/png",
        fileSize: 2048,
        contentType: "image",
      })
    ).not.toThrow();

    expect(() =>
      imageMetaSchema.parse({
        originalFilename: "moodboard.bmp",
        mimeType: "image/bmp",
        fileSize: 2048,
        contentType: "image",
      })
    ).toThrow(/Unsupported image format/);
  });

  it("validates document MIME types strictly with documentMetaSchema", () => {
    expect(() =>
      documentMetaSchema.parse({
        originalFilename: "lyrics.pdf",
        mimeType: "application/pdf",
        fileSize: 5000,
        contentType: "file",
      })
    ).not.toThrow();

    expect(() =>
      documentMetaSchema.parse({
        originalFilename: "lyrics.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileSize: 5000,
        contentType: "file",
      })
    ).toThrow(/Unsupported document format/);
  });
});

describe("Capture Validation: sanitizeFilename", () => {
  it("strips path traversal sequences and directory separators", () => {
    expect(sanitizeFilename("../../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("C:\\Windows\\System32\\cmd.exe")).toBe("cmd.exe");
    expect(sanitizeFilename("folder/subfolder/track 01.mp3")).toBe("track_01.mp3");
  });

  it("replaces special and potentially dangerous characters with underscores", () => {
    expect(sanitizeFilename("my<cool>track;$(rm -rf).wav")).toBe("my_cool_track___rm_-rf_.wav");
  });

  it("limits length to 100 characters", () => {
    const longName = "a".repeat(150) + ".mp3";
    const sanitized = sanitizeFilename(longName);
    expect(sanitized.length).toBeLessThanOrEqual(100);
  });
});

describe("Capture Validation: SSRF Protection isSafePublicUrl", () => {
  it("allows public internet domains and IPs", () => {
    expect(isSafePublicUrl("https://example.com")).toBe(true);
    expect(isSafePublicUrl("https://genius.com/lyrics/track")).toBe(true);
    expect(isSafePublicUrl("https://open.spotify.com/track/123")).toBe(true);
    expect(isSafePublicUrl("http://93.184.216.34/resource")).toBe(true);
  });

  it("rejects loopback and localhost variants", () => {
    expect(isSafePublicUrl("http://localhost:3000/secret")).toBe(false);
    expect(isSafePublicUrl("http://127.0.0.1:8080")).toBe(false);
    expect(isSafePublicUrl("http://0.0.0.0:5432")).toBe(false);
    expect(isSafePublicUrl("http://[::1]/status")).toBe(false);
  });

  it("rejects private network IP subnets (RFC 1918)", () => {
    // 10.0.0.0/8
    expect(isSafePublicUrl("http://10.0.0.1/admin")).toBe(false);
    expect(isSafePublicUrl("http://10.255.255.254/internal")).toBe(false);

    // 172.16.0.0/12
    expect(isSafePublicUrl("http://172.16.0.5/api")).toBe(false);
    expect(isSafePublicUrl("http://172.31.255.255/api")).toBe(false);

    // 192.168.0.0/16
    expect(isSafePublicUrl("http://192.168.1.1/router")).toBe(false);
    expect(isSafePublicUrl("http://192.168.0.100/config")).toBe(false);
  });

  it("rejects cloud metadata IP addresses", () => {
    expect(isSafePublicUrl("http://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isSafePublicUrl("http://169.254.0.1/link-local")).toBe(false);
  });

  it("rejects invalid URLs and non-http/https protocols", () => {
    expect(isSafePublicUrl("not-a-url")).toBe(false);
    expect(isSafePublicUrl("ftp://1.1.1.1/file")).toBe(false);
    expect(isSafePublicUrl("file:///etc/hosts")).toBe(false);
  });
});
