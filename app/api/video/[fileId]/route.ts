import { NextRequest, NextResponse } from "next/server";
import { getFileMetadata, getFileStream } from "@/lib/google-drive";
import { Readable } from "stream";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const range = request.headers.get("range") || undefined;

    const metadata = await getFileMetadata(fileId);
    const fileSize = parseInt(metadata.size || "0", 10);
    const mimeType = metadata.mimeType || "video/mp4";

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 10 * 1024 * 1024 - 1, fileSize - 1);
      const chunkSize = end - start + 1;

      const { stream } = await getFileStream(fileId, `bytes=${start}-${end}`);

      const nodeReadable = stream as unknown as Readable;
      const webStream = new ReadableStream({
        start(controller) {
          nodeReadable.on("data", (chunk: Buffer) => controller.enqueue(chunk));
          nodeReadable.on("end", () => controller.close());
          nodeReadable.on("error", (err: Error) => controller.error(err));
        },
      });

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": mimeType,
          "Content-Disposition": "inline",
        },
      });
    }

    const { stream } = await getFileStream(fileId);

    const nodeReadable = stream as unknown as Readable;
    const webStream = new ReadableStream({
      start(controller) {
        nodeReadable.on("data", (chunk: Buffer) => controller.enqueue(chunk));
        nodeReadable.on("end", () => controller.close());
        nodeReadable.on("error", (err: Error) => controller.error(err));
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Accept-Ranges": "bytes",
        "Content-Length": fileSize.toString(),
        "Content-Type": mimeType,
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    console.error("Video proxy error:", error);
    return NextResponse.json(
      { error: "Failed to stream video" },
      { status: 500 }
    );
  }
}
