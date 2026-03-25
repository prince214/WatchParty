import { NextResponse } from "next/server";
import { listVideoFiles } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || undefined;
    const files = await listVideoFiles(folderId);

    const result = files.map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      size: f.size ? formatBytes(parseInt(f.size, 10)) : null,
      thumbnail: f.thumbnailLink ?? null,
    }));

    return NextResponse.json({ files: result });
  } catch (error) {
    console.error("Drive list error:", error);
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
