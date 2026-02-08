"use client";

/**
 * KaTeX Playground
 * Live KaTeX preview with AI assist, display mode toggle, copy options, and shareable URL.
 *
 * CHANGE LOG & FEATURES:
 *
 * 1. Core playground
 * - What: Textarea input, live KaTeX preview via katex.renderToString
 * - Why: Enables real-time math expression editing
 * - Dependencies: katex, useSearchParams
 *
 * 2. Display mode
 * - What: Inline vs block toggle (displayMode option)
 * - Why: Different rendering for inline vs block equations
 *
 * 3. AI chat
 * - What: Collapsible panel calls /api/katex-generate, inserts result
 * - Why: Natural language to KaTeX generation
 *
 * 4. Copy options
 * - What: Copy as Markdown ($ / $$) and RichText (HTML)
 * - Why: Paste into docs, editors, etc.
 *
 * 5. Shareable URL
 * - What: katex and mode in searchParams, Share button copies URL
 * - Why: Share expressions via link
 *
 * CRITICAL NOTES:
 * - Security: KaTeX uses throwOnError: false; API validates prompt length
 * - URL limit: Long content may exceed ~2k chars; show toast fallback
 */
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import katex from "katex";
import "katex/dist/katex.min.css";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Copy, Share2, Sparkles } from "lucide-react";

const MAX_URL_LENGTH = 1800;

type DisplayMode = "inline" | "block";

function KatexPlaygroundContent() {
  const searchParams = useSearchParams();
  const [katexInput, setKatexInput] = useState("");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("block");
  const [notification, setNotification] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const showNotify = useCallback((msg: string) => {
    setNotification(msg);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  }, []);

  const parseFromUrl = useCallback(() => {
    const k = searchParams.get("katex");
    const m = searchParams.get("mode");
    if (k) {
      try {
        setKatexInput(decodeURIComponent(k));
      } catch {
        setKatexInput(k);
      }
    }
    if (m === "inline" || m === "block") setDisplayMode(m);
  }, [searchParams]);

  useEffect(() => {
    parseFromUrl();
  }, [parseFromUrl]);

  const { html: renderedHtml, error: renderError } = React.useMemo(() => {
    const trimmed = katexInput.trim();
    if (!trimmed) return { html: null as string | null, error: null as string | null };
    try {
      const html = katex.renderToString(trimmed, {
        displayMode: displayMode === "block",
        throwOnError: false,
      });
      return { html, error: null };
    } catch (err) {
      return {
        html: null,
        error: err instanceof Error ? err.message : "Parse error",
      };
    }
  }, [katexInput, displayMode]);

  const updateUrl = useCallback(() => {
    if (!katexInput.trim()) return;
    const encoded = encodeURIComponent(katexInput.trim());
    if (encoded.length > MAX_URL_LENGTH) return;
    const url = `${window.location.origin}/katex-playground?katex=${encoded}&mode=${displayMode}`;
    window.history.replaceState({}, "", url);
  }, [katexInput, displayMode]);

  useEffect(() => {
    const timer = setTimeout(updateUrl, 500);
    return () => clearTimeout(timer);
  }, [updateUrl]);

  const copyMarkdown = useCallback(async () => {
    const text =
      displayMode === "inline"
        ? `$${katexInput.trim()}$`
        : `$$${katexInput.trim()}$$`;
    try {
      await navigator.clipboard.writeText(text);
      showNotify("Copied as Markdown");
    } catch (err) {
      showNotify(`Copy failed: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  }, [katexInput, displayMode, showNotify]);

  const copyRichText = useCallback(async () => {
    if (!renderedHtml) {
      showNotify("Nothing to copy");
      return;
    }
    const plain = katexInput.trim();
    try {
      const blob = new Blob([renderedHtml], { type: "text/html" });
      const plainBlob = new Blob([plain], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": blob, "text/plain": plainBlob }),
      ]);
      showNotify("Copied as RichText");
    } catch {
      try {
        await navigator.clipboard.writeText(plain);
        showNotify("Copied as plain text (HTML not supported)");
      } catch (e) {
        showNotify(`Copy failed: ${e instanceof Error ? e.message : "Unknown"}`);
      }
    }
  }, [renderedHtml, katexInput, showNotify]);

  const handleShare = useCallback(async () => {
    const encoded = encodeURIComponent(katexInput.trim());
    if (encoded.length > MAX_URL_LENGTH) {
      showNotify("Content too long to share via URL. Copy the KaTeX instead.");
      return;
    }
    const url = `${window.location.origin}/katex-playground?katex=${encoded}&mode=${displayMode}`;
    try {
      await navigator.clipboard.writeText(url);
      showNotify("Link copied to clipboard");
    } catch (err) {
      showNotify(`Copy failed: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  }, [katexInput, displayMode, showNotify]);

  const handleGenerate = useCallback(async () => {
    const prompt = chatPrompt.trim();
    if (!prompt) return;
    setChatLoading(true);
    setChatError(null);
    try {
      const res = await fetch("/api/katex-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setChatError(data?.error ?? "Generation failed");
        return;
      }
      if (data.katex) {
        setKatexInput(data.katex);
        setChatPrompt("");
        showNotify("KaTeX inserted");
        inputRef.current?.focus();
      } else {
        setChatError("No KaTeX in response");
      }
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setChatLoading(false);
    }
  }, [chatPrompt, showNotify]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-800 dark:to-black flex flex-col items-center overflow-y-auto text-black dark:text-white transition-colors duration-300 relative p-4">
      <div
        className={`fixed top-0 left-0 w-full bg-green-500 text-white px-4 py-2 shadow-md flex items-center justify-between transition-opacity duration-500 z-50 ${
          showNotification ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <span>{notification}</span>
        <button
          className="text-white font-bold px-2"
          onClick={() => setShowNotification(false)}
        >
          x
        </button>
      </div>

      <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-lg shadow-md p-8 flex flex-col">
        <h1 className="text-3xl font-extrabold text-center text-blue-600 dark:text-blue-400 mb-6">
          KaTeX Playground
        </h1>

        <div className="flex flex-col md:flex-row gap-6 flex-grow">
          <div className="flex-1 flex flex-col gap-4">
            <textarea
              ref={inputRef}
              className="w-full p-4 border border-blue-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white resize-y font-mono text-sm min-h-32"
              placeholder="Enter KaTeX (e.g. x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a})"
              value={katexInput}
              onChange={(e) => setKatexInput(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  checked={displayMode === "inline"}
                  onChange={() => setDisplayMode("inline")}
                  className="text-blue-600"
                />
                <span>Inline</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  checked={displayMode === "block"}
                  onChange={() => setDisplayMode("block")}
                  className="text-blue-600"
                />
                <span>Block</span>
              </label>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div
              className={`w-full p-4 border rounded-lg min-h-32 flex items-center justify-center ${
                renderError
                  ? "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950"
                  : "border-blue-300 dark:border-gray-700 bg-white dark:bg-gray-800"
              }`}
            >
              {renderError ? (
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {renderError}
                </p>
              ) : renderedHtml ? (
                <div
                  className="katex-display overflow-auto"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Preview will appear here
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyMarkdown}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Markdown
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={copyRichText}
            disabled={!renderedHtml}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy RichText
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={!katexInput.trim()}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share URL
          </Button>
        </div>

        <Collapsible open={chatOpen} onOpenChange={setChatOpen} className="mt-8">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <Sparkles className="h-4 w-4" />
              AI: Generate KaTeX from description
              {chatOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Describe the math you want (e.g. quadratic formula, integral of x squared)
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 border rounded-md bg-white dark:bg-gray-900 text-black dark:text-white"
                  placeholder="e.g. quadratic formula"
                  value={chatPrompt}
                  onChange={(e) => setChatPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                />
                <Button onClick={handleGenerate} disabled={chatLoading}>
                  {chatLoading ? "Generating..." : "Generate"}
                </Button>
              </div>
              {chatError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {chatError}
                </p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

export default function KatexPlaygroundPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <KatexPlaygroundContent />
    </Suspense>
  );
}
