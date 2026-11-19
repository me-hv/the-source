import { NextResponse, type NextRequest } from "next/server";
import fs from "fs";
import { isLocalDataMode } from "@/lib/config/data-mode";
import { getLocalCaptureRepository } from "@/features/capture/repositories";

export async function GET(request: NextRequest) {
  if (!isLocalDataMode()) {
    return NextResponse.json({ error: "Local storage content is only available in local mode" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const storagePath = searchParams.get("path");

  if (!storagePath) {
    return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
  }

  const repo = getLocalCaptureRepository();
  const filePath = repo.getBinaryFilePath(storagePath);

  if (!filePath || !fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;

  // Determine Content-Type based on file extension
  let contentType = "application/octet-stream";
  const lowerPath = storagePath.toLowerCase();
  if (lowerPath.endsWith(".webm")) contentType = "audio/webm";
  else if (lowerPath.endsWith(".mp3")) contentType = "audio/mpeg";
  else if (lowerPath.endsWith(".wav")) contentType = "audio/wav";
  else if (lowerPath.endsWith(".ogg")) contentType = "audio/ogg";
  else if (lowerPath.endsWith(".m4a")) contentType = "audio/mp4";
  else if (lowerPath.endsWith(".png")) contentType = "image/png";
  else if (lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) contentType = "image/jpeg";
  else if (lowerPath.endsWith(".webp")) contentType = "image/webp";
  else if (lowerPath.endsWith(".gif")) contentType = "image/gif";
  else if (lowerPath.endsWith(".svg")) contentType = "image/svg+xml";
  else if (lowerPath.endsWith(".pdf")) contentType = "application/pdf";
  else if (lowerPath.endsWith(".txt")) contentType = "text/plain; charset=utf-8";
  else if (lowerPath.endsWith(".md")) contentType = "text/markdown; charset=utf-8";

  // Check for HTTP Range header (crucial for audio/video seeking)
  const range = request.headers.get("range");

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${fileSize}` },
      });
    }

    const chunksize = end - start + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });

    // Convert node readstream to web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => controller.enqueue(chunk));
        fileStream.on("end", () => controller.close());
        fileStream.on("error", (err) => controller.error(err));
      },
    });

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize.toString(),
        "Content-Type": contentType,
      },
    });
  }

  // Full file response
  const fileStream = fs.createReadStream(filePath);
  const webStream = new ReadableStream({
    start(controller) {
      fileStream.on("data", (chunk) => controller.enqueue(chunk));
      fileStream.on("end", () => controller.close());
      fileStream.on("error", (err) => controller.error(err));
    },
  });

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Length": fileSize.toString(),
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
    },
  });
}
