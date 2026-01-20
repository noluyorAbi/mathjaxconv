// Implemented at 2026-01-20T01:12:00+01:00 - YouTube Audio/Video Downloader SSE Route
import { spawn } from "child_process";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";

// Helper to write SSE data
function writeSSE(writer: WritableStreamDefaultWriter, data: object) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  writer.write(new TextEncoder().encode(message));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const format = searchParams.get("format") || "mp3";

  if (!url) {
    return new Response("URL is required", { status: 400 });
  }

  // Set up SSE stream
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  // Run the process slightly delayed to ensure the stream is established
  setTimeout(async () => {
    try {
      if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
        writeSSE(writer, { state: "error", message: "Invalid YouTube URL" });
        await writer.close();
        return;
      }

      const tempDir = os.tmpdir();
      const fileId = randomUUID();
      const outputExt = format === "mp4" ? "mp4" : "mp3";
      const outputPath = path.join(tempDir, `${fileId}.%(ext)s`);

      // Android client to bypass bot detection
      const commonArgs = [
        "--extractor-args", "youtube:player_client=android",
        "--newline", // Crucial for parsing progress line by line
        "--progress",
      ];

      let args: string[] = [];
      
      if (format === "mp4") {
        args = [
          ...commonArgs,
          "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
          "-o", outputPath,
          url
        ];
      } else {
        args = [
          ...commonArgs,
          "-x",
          "--audio-format", "mp3",
          "-o", outputPath,
          url
        ];
      }

      console.log("Spawning yt-dlp with args:", args.join(" "));
      const child = spawn("yt-dlp", args);

      child.stdout.on("data", (data) => {
        const lines = data.toString().split("\n");
        for (const line of lines) {
           if (!line.trim()) continue;
           
           const percentMatch = line.match(/(\d+\.?\d*)%/);
           if (percentMatch) {
             const percent = parseFloat(percentMatch[1]);
             writeSSE(writer, { state: "progress", value: percent, text: `${percent.toFixed(1)}% - Downloading...` });
           } else if (line.includes("[ExtractAudio]")) {
             writeSSE(writer, { state: "progress", value: 95, text: "Extracting Audio..." });
           } else if (line.includes("[Merger]")) {
             writeSSE(writer, { state: "progress", value: 95, text: "Merging Video/Audio..." });
           }
        }
      });

      child.stderr.on("data", (data) => {
        const errorMsg = data.toString();
        console.log("yt-dlp stderr:", errorMsg);
        
        if (errorMsg.includes("Sign in to confirm")) {
          writeSSE(writer, { state: "error", message: "Bot detection triggered. Try again later." });
        }
      });

      child.on("close", async (code) => {
        if (code === 0) {
          const finalFilename = `${fileId}.${outputExt}`;
          writeSSE(writer, { state: "completed", fileId, filename: finalFilename });
        } else {
          writeSSE(writer, { state: "error", message: "Download process failed." });
        }
        await writer.close();
      });

      child.on("error", async (err) => {
        console.error("Spawn error:", err);
        writeSSE(writer, { state: "error", message: "Failed to start download process." });
        await writer.close();
      });

    } catch (err: unknown) {
      console.error("Stream handler error:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      writeSSE(writer, { state: "error", message });
      await writer.close();
    }
  }, 100);

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
