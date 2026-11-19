import { NextResponse, type NextRequest } from "next/server";
import { isLocalDataMode } from "@/lib/config/data-mode";
import { getLocalCaptureRepository } from "@/features/capture/repositories";

export async function POST(request: NextRequest) {
  if (!isLocalDataMode()) {
    return NextResponse.json({ error: "Local storage upload is only available in local mode" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const storagePath = formData.get("storagePath") as string | null;
    const file = formData.get("file") as File | Blob | null;

    if (!storagePath || !file) {
      return NextResponse.json({ error: "Missing storagePath or file" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const repo = getLocalCaptureRepository();
    await repo.saveBinaryFile(storagePath, buffer);

    return NextResponse.json({ success: true, storagePath });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
