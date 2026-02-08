/**
 * Dynamic OG image for KaTeX playground shares
 * GET /api/og/katex?katex=...&mode=...
 * Returns 1200x630 PNG for Open Graph / Twitter cards
 *
 * CHANGE LOG & FEATURES:
 * 1. Initial implementation
 * - What: ImageResponse with LaTeX source, domain at bottom right (from NEXT_PUBLIC_SITE_URL)
 * - Why: Social preview when sharing KaTeX links
 * 2. Font fix
 * - What: Use Satori default fonts (no custom font)
 * - Why: GeistMonoVF.woff is a variable font; @vercel/og does not support variable fonts
 */
import { ImageResponse } from "next/og";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const DOMAIN = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname
  : "tools.adatepe.dev";
const MAX_LATEX_LENGTH = 100;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const katexParam = searchParams.get("katex");

    const displayText = katexParam?.trim()
      ? katexParam.length > MAX_LATEX_LENGTH
        ? `${katexParam.slice(0, MAX_LATEX_LENGTH)}...`
        : katexParam
      : "Enter LaTeX to preview";

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fdfbf7",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              padding: 80,
            }}
          >
            <div
              style={{
                fontSize: 36,
                color: "#1e293b",
                textAlign: "center",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                maxWidth: "90%",
              }}
            >
              {displayText}
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 40,
              right: 40,
              fontSize: 24,
              color: "#64748b",
            }}
          >
            {DOMAIN}
          </div>
        </div>
      ),
      {
        width: OG_WIDTH,
        height: OG_HEIGHT,
      }
    );
  } catch (err) {
    console.error("[api/og/katex]", err);
    return new Response("Failed to generate image", { status: 500 });
  }
}
