// Implemented at 2026-01-20T01:12:00+01:00 - YouTube Download File Server
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId");
  const filename = searchParams.get("filename") || "download.mp3";

  if (!fileId) {
    return NextResponse.json({ error: "File ID is required" }, { status: 400 });
  }

  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, filename);

  try {
    await fs.access(filePath);
    const fileBuffer = await fs.readFile(filePath);

    // Clean up immediately after reading
    await fs.unlink(filePath).catch((err) => console.error("Failed to cleanup temp file:", err));

    const ext = path.extname(filename).toLowerCase();
    const contentType = ext === ".mp4" ? "video/mp4" : "audio/mpeg";

    return new NextResponse(fileBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="download${ext}"`,
      },
    });

  } catch (error) {
    console.error("File serve error:", error);
    return NextResponse.json(
      { error: "File not found or expired" },
      { status: 404 }
    );
  }
}
