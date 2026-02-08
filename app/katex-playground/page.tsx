/**
 * KaTeX Playground - Server Page
 * Renders dynamic metadata for OG sharing and the client playground.
 *
 * CHANGE LOG & FEATURES:
 * 1. Dynamic OG metadata
 * - What: generateMetadata sets og:image to /api/og/katex?katex=...&mode=...
 * - Why: Social preview when sharing KaTeX links
 */
import type { Metadata } from "next";
import KatexPlaygroundClient from "./KatexPlaygroundClient";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.adatepe.dev";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ katex?: string; mode?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const katex = params.katex?.trim();
  const mode = params.mode === "inline" ? "inline" : "block";

  const imageUrl = katex
    ? `${BASE_URL}/api/og/katex?katex=${encodeURIComponent(katex)}&mode=${mode}`
    : undefined;

  return {
    title: "KaTeX Playground",
    description: "Live KaTeX math preview. Share and edit LaTeX expressions.",
    openGraph: {
      title: "KaTeX Playground",
      description: "Live KaTeX math preview. Share and edit LaTeX expressions.",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: katex ? `LaTeX: ${katex.slice(0, 80)}${katex.length > 80 ? "..." : ""}` : "KaTeX Playground",
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export default function KatexPlaygroundPage() {
  return <KatexPlaygroundClient />;
}
