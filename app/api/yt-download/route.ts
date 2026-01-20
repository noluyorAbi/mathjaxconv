// Implemented at 2026-01-20T00:53:00+01:00 - YouTube Audio/Video Downloader API Route
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { url, format = "mp3" } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Basic validation for YouTube URL
    if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    const tempDir = os.tmpdir();
    const fileId = randomUUID();
    // Use the correct extension for the output template
    const outputExt = format === "mp4" ? "mp4" : "mp3";
    const outputPath = path.join(tempDir, `${fileId}.%(ext)s`);

    let command = "";
    
    // Using Android client emulation to bypass "Sign in to confirm you're not a bot"
    const commonArgs = `--extractor-args "youtube:player_client=android"`;

    if (format === "mp4") {
      // Download best video + best audio and merge to mp4
      // -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" ensures we get an MP4 container
      command = `yt-dlp ${commonArgs} -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${outputPath}" "${url}"`;
    } else {
      // Extract audio as mp3
      command = `yt-dlp -x ${commonArgs} --audio-format mp3 -o "${outputPath}" "${url}"`;
    }

    console.log("Executing command:", command);
    
    const { stdout, stderr } = await execAsync(command);
    console.log("yt-dlp stdout:", stdout);
    if (stderr) console.error("yt-dlp stderr:", stderr);

    // yt-dlp replaces %(ext)s with the actual extension
    // For mp3 extraction, it's definitely mp3
    // For mp4 download, it should be mp4 due to our format selection, but fallback to whatever yt-dlp decided if strict format wasn't found (though unlikely with our format string)
    const filePath = path.join(tempDir, `${fileId}.${outputExt}`);

    try {
      // Check if file exists (yt-dlp might have chosen a different extension if merge failed or format wasn't available)
      await fs.access(filePath);
      
      const fileBuffer = await fs.readFile(filePath);

      // Clean up the file immediately after reading
      await fs.unlink(filePath).catch((err) => console.error("Failed to cleanup temp file:", err));

      const contentType = format === "mp4" ? "video/mp4" : "audio/mpeg";
      const filename = `download.${outputExt}`;

      return new NextResponse(fileBuffer as any, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } catch (readError) {
      console.error("Error reading file:", readError);
      // Try to find if any file starting with fileId exists to cleanup
      // (Advanced cleanup logic would go here)
      return NextResponse.json(
        { error: "Failed to process the downloaded file. It might be due to a format conversion error." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Download error:", error);
    const errorMessage = error.stderr || error.message || "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
