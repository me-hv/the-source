import { z } from "zod";

export const BUCKET_FILE_SIZE_LIMIT = 52428800; // 50 MB

export const ALLOWED_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/flac",
  "audio/webm",
  "audio/webm;codecs=opus",
];

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
];

export const ALL_ALLOWED_MIME_TYPES = [
  ...ALLOWED_AUDIO_MIME_TYPES,
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_DOCUMENT_MIME_TYPES,
];

export const textCaptureSchema = z.object({
  title: z
    .string()
    .trim()
    .max(200, "Title must be under 200 characters")
    .optional()
    .transform((val) => (val && val.length > 0 ? val : "Untitled")),
  content: z.string().default(""),
  richContent: z.record(z.string(), z.any()).default({}),
  contentMarkdown: z.string().optional().default(""),
  status: z.enum(["active", "draft"]).default("active"),
});

export type TextCaptureInput = z.input<typeof textCaptureSchema>;

export const linkCaptureSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .url("Please enter a valid URL")
    .refine((url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    }, "Only HTTP and HTTPS URLs are supported"),
  title: z
    .string()
    .trim()
    .max(200, "Title must be under 200 characters")
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be under 2000 characters")
    .optional()
    .default(""),
});

export type LinkCaptureInput = z.input<typeof linkCaptureSchema>;

export const fileMetaSchema = z.object({
  title: z
    .string()
    .trim()
    .max(200, "Title must be under 200 characters")
    .optional()
    .transform((val) => (val && val.length > 0 ? val : "Untitled")),
  originalFilename: z.string().min(1, "Filename is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  fileSize: z
    .number()
    .min(1, "File cannot be empty")
    .max(BUCKET_FILE_SIZE_LIMIT, "File exceeds the 50 MB limit"),
  contentType: z.enum(["audio", "image", "file"]),
  metadata: z.record(z.string(), z.any()).optional().default({}),
});

export type FileMetaInput = z.input<typeof fileMetaSchema>;

export const audioMetaSchema = fileMetaSchema.extend({
  contentType: z.literal("audio"),
  mimeType: z.string().refine(
    (type) => ALLOWED_AUDIO_MIME_TYPES.some((allowed) => type.startsWith(allowed.split(";")[0])),
    "Unsupported audio format"
  ),
});

export const imageMetaSchema = fileMetaSchema.extend({
  contentType: z.literal("image"),
  mimeType: z.string().refine(
    (type) => ALLOWED_IMAGE_MIME_TYPES.includes(type),
    "Unsupported image format"
  ),
});

export const documentMetaSchema = fileMetaSchema.extend({
  contentType: z.literal("file"),
  mimeType: z.string().refine(
    (type) => ALLOWED_DOCUMENT_MIME_TYPES.includes(type),
    "Unsupported document format"
  ),
});

/**
 * Sanitizes an uploaded filename to prevent directory traversal or invalid characters.
 */
export function sanitizeFilename(filename: string): string {
  // Strip paths
  const base = filename.replace(/^.*[\\/]/, "");
  // Remove dangerous characters, allow alphanumerics, dots, dashes, underscores
  const clean = base.replace(/[^a-zA-Z0-9._-]/g, "_");
  return clean.slice(0, 100);
}

/**
 * Validates whether a URL targets a public internet destination (SSRF protection).
 */
export function isSafePublicUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    const hostname = url.hostname.toLowerCase();

    // Reject localhost / loopback
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "[::1]" ||
      hostname === "0.0.0.0"
    ) {
      return false;
    }

    // Reject private / internal IP ranges
    // 10.0.0.0/8
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return false;
    // 172.16.0.0/12
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return false;
    // 192.168.0.0/16
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return false;
    // 169.254.0.0/16 (link local)
    if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(hostname)) return false;
    // AWS/GCP instance metadata endpoint
    if (hostname === "169.254.169.254") return false;

    return true;
  } catch {
    return false;
  }
}
