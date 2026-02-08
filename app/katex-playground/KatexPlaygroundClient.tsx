"use client";

/**
 * KaTeX Playground
 * Live KaTeX preview with AI assist, display mode toggle, copy options, and shareable URL.
 *
 * CHANGE LOG & FEATURES:
 *
 * 1. Core playground
 * - What: Textarea input, live KaTeX preview via katex.render
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
 * - What: Export PNG, Copy as Image, Copy Markdown ($ / $$), Copy Plain Text
 * - Why: Paste into docs, editors, or export as image
 *
 * 5. Shareable URL
 * - What: katex and mode in searchParams, Share button copies URL
 * - Why: Share expressions via link
 *
 * 6. Styling overhaul
 * - What: Polished layout, typography, card structure, mode toggle, toolbar, AI panel
 * - Why: Professional UI and better UX
 *
 * 7. Cheatsheet
 * - What: Symbol reference with search, table/grid view, sortable columns
 * - Why: Quick lookup and insert of KaTeX codes
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
import html2canvas from "html2canvas";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Copy,
  Share2,
  Sparkles,
  Loader2,
  BookOpen,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Download,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ThemeToggle } from "./ThemeToggle";
import { useUndoableState } from "./useUndoableState";
import { KATEX_CHEATSHEET } from "./katex-cheatsheet";

const MAX_URL_LENGTH = 1800;

type DisplayMode = "inline" | "block";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightSearch({ text, searchQuery }: { text: string; searchQuery: string }): React.ReactNode {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return text;
  const words = q.split(/\s+/).filter(Boolean);
  const pattern = words.map(escapeRegExp).join("|");
  const regex = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-300/50 text-inherit rounded px-0.5 font-medium">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

const SUGGESTED_QUERIES = ["Pythagorean Theorem", "Integral of sin(x)", "Matrix inversion"];

function KatexPlaygroundContent() {
  const searchParams = useSearchParams();
  const {
    value: katexInput,
    setValue: setKatexInput,
    setValueReplace: setKatexInputReplace,
    undo,
    redo,
  } = useUndoableState("");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("block");
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [notification, setNotification] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [cheatsheetSearch, setCheatsheetSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<"name" | "code" | "definition" | "explanationMath" | "explanationCompSci" | "category">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [cheatsheetView, setCheatsheetView] = useState<"table" | "grid">("table");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

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
        setKatexInputReplace(decodeURIComponent(k));
      } catch {
        setKatexInputReplace(k);
      }
    }
    if (m === "inline" || m === "block") setDisplayMode(m);
  }, [searchParams, setKatexInputReplace]);

  useEffect(() => {
    parseFromUrl();
  }, [parseFromUrl]);

  const previewRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [hasRenderedContent, setHasRenderedContent] = useState(false);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;

    const trimmed = katexInput.trim();
    if (!trimmed) {
      el.innerHTML = "";
      setRenderError(null);
      setHasRenderedContent(false);
      return;
    }

    try {
      katex.render(trimmed, el, {
        displayMode: displayMode === "block",
        throwOnError: false,
      });
      setRenderError(null);
      setHasRenderedContent(true);
    } catch (err) {
      el.innerHTML = "";
      setRenderError(err instanceof Error ? err.message : "Parse error");
      setHasRenderedContent(false);
    }
  }, [katexInput, displayMode]);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (katexInput.trim()) {
      const encoded = encodeURIComponent(katexInput.trim());
      if (encoded.length <= MAX_URL_LENGTH) {
        params.set("katex", katexInput.trim());
      }
    }
    params.set("mode", displayMode);
    const url = `${window.location.origin}/katex-playground?${params.toString()}`;
    window.history.replaceState({}, "", url);
  }, [katexInput, displayMode]);

  useEffect(() => {
    const timer = setTimeout(updateUrl, 300);
    return () => clearTimeout(timer);
  }, [updateUrl]);

  const handleShare = useCallback(async () => {
    const encoded = encodeURIComponent(katexInput.trim());
    if (encoded.length > MAX_URL_LENGTH) {
      showNotify("Content too long to share via URL. Copy the KaTeX instead.");
      return;
    }
    const params = new URLSearchParams({ katex: katexInput.trim(), mode: displayMode });
    const url = `${window.location.origin}/katex-playground?${params.toString()}`;
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
        setAiModalOpen(false);
        inputRef.current?.focus();
      } else {
        setChatError("No KaTeX in response");
      }
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setChatLoading(false);
    }
  }, [chatPrompt, showNotify, setKatexInput]);

  const groupedCheatsheet = React.useMemo(() => {
    const q = cheatsheetSearch.trim().toLowerCase();
    const searchWords = q ? q.split(/\s+/).filter(Boolean) : [];
    const matches = (s: { name: string; code: string; definition: string; explanationMath: string; explanationCompSci: string }, cat: string) =>
      !searchWords.length ||
      searchWords.every(
        (w) =>
          s.name.toLowerCase().includes(w) ||
          s.code.toLowerCase().includes(w) ||
          s.definition.toLowerCase().includes(w) ||
          s.explanationMath.toLowerCase().includes(w) ||
          s.explanationCompSci.toLowerCase().includes(w) ||
          cat.toLowerCase().includes(w)
      );
    const dir = sortDirection === "asc" ? 1 : -1;
    return KATEX_CHEATSHEET.map((cat) => {
      const symbols = cat.symbols
        .filter((s) => matches(s, cat.title))
        .map((s) => ({ ...s, category: cat.title }))
        .sort((a, b) => {
          const va = sortColumn === "category" ? a.category : a[sortColumn];
          const vb = sortColumn === "category" ? b.category : b[sortColumn];
          return dir * String(va).localeCompare(String(vb), undefined, { numeric: true });
        });
      return { title: cat.title, symbols };
    }).filter((g) => g.symbols.length > 0);
  }, [cheatsheetSearch, sortColumn, sortDirection]);

  const copyToInput = useCallback((code: string) => {
    setKatexInput((prev) => prev + code);
    showNotify("Inserted into input");
  }, [showNotify, setKatexInput]);

  const handleSort = useCallback(
    (col: "name" | "code" | "definition" | "explanationMath" | "explanationCompSci" | "category") => {
      setSortColumn(col);
      setSortDirection((d) =>
        sortColumn === col ? (d === "asc" ? "desc" : "asc") : "asc"
      );
    },
    [sortColumn]
  );

  const SortIcon = ({ col }: { col: "name" | "code" | "definition" | "explanationMath" | "explanationCompSci" | "category" }) =>
    sortColumn === col ? (
      sortDirection === "asc" ? (
        <ArrowUp className="h-4 w-4" />
      ) : (
        <ArrowDown className="h-4 w-4" />
      )
    ) : (
      <ArrowUpDown className="h-4 w-4 opacity-50" />
    );

  const lineCount = katexInput.split("\n").length;
  const charCount = katexInput.length;

  const getCaptureOptions = useCallback(() => {
    const isDark = document.documentElement.classList.contains("dark");
    return {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: isDark ? "#0f172a" : "#ffffff",
    };
  }, []);

  const handleExportImage = useCallback(async () => {
    const el = captureRef.current;
    if (!el || !hasRenderedContent || renderError) {
      showNotify("Nothing to export");
      return;
    }
    try {
      const canvas = await html2canvas(el, getCaptureOptions());
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "katex-export.png";
          link.click();
          URL.revokeObjectURL(url);
          showNotify("Image downloaded");
        }
      });
    } catch (err) {
      showNotify(`Export failed: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  }, [hasRenderedContent, renderError, showNotify, getCaptureOptions]);

  const handleCopyImage = useCallback(async () => {
    const el = captureRef.current;
    if (!el || !hasRenderedContent || renderError) {
      showNotify("Nothing to copy");
      return;
    }
    try {
      const canvas = await html2canvas(el, getCaptureOptions());
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          showNotify("Image copied to clipboard");
        } catch {
          showNotify("Copy image failed");
        }
      });
    } catch (err) {
      showNotify(`Copy failed: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  }, [hasRenderedContent, renderError, showNotify, getCaptureOptions]);

  const handleCopyMarkdown = useCallback(async () => {
    if (!katexInput.trim()) {
      showNotify("Nothing to copy");
      return;
    }
    const wrapped =
      displayMode === "block"
        ? `$$${katexInput.trim()}$$`
        : `$${katexInput.trim()}$`;
    try {
      await navigator.clipboard.writeText(wrapped);
      showNotify("Copied as Markdown");
    } catch (err) {
      showNotify(`Copy failed: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  }, [katexInput, displayMode, showNotify]);

  const handleCopyPlainText = useCallback(async () => {
    if (!katexInput.trim()) {
      showNotify("Nothing to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(katexInput.trim());
      showNotify("Copied as plain text");
    } catch (err) {
      showNotify(`Copy failed: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  }, [katexInput, showNotify]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col items-center overflow-y-auto relative px-6 pb-20">
      {/* Notification Toast */}
      <div
        className={cn(
          "fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg",
          "bg-emerald-600 text-white font-medium text-sm",
          "flex items-center gap-3 transition-all duration-300 ease-out",
          showNotification
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        )}
      >
        <span>{notification}</span>
        <button
          className="p-1 hover:bg-white/20 rounded transition-colors"
          onClick={() => setShowNotification(false)}
          aria-label="Dismiss"
        >
          x
        </button>
      </div>

      <div className="w-full max-w-4xl">
        {/* Header */}
        <header className="w-full py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <h1 className="text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-200">
              KaTeX Playground
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleShare}
              disabled={!katexInput.trim()}
              className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </header>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden">
          {/* Editor Section */}
          <div className="p-8 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                LaTeX Markup
              </label>
              <div className="segmented-control flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <div className="relative">
                  <input
                    type="radio"
                    id="inline"
                    name="mode"
                    className="sr-only"
                    checked={displayMode === "inline"}
                    onChange={() => setDisplayMode("inline")}
                  />
                  <label
                    htmlFor="inline"
                    className="block px-4 py-1 text-xs font-semibold rounded-md cursor-pointer transition-all text-slate-500"
                  >
                    Inline
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="radio"
                    id="display"
                    name="mode"
                    className="sr-only"
                    checked={displayMode === "block"}
                    onChange={() => setDisplayMode("block")}
                  />
                  <label
                    htmlFor="display"
                    className="block px-4 py-1 text-xs font-semibold rounded-md cursor-pointer transition-all text-slate-500"
                  >
                    Display
                  </label>
                </div>
              </div>
            </div>
            <div className="relative group flex min-h-[160px]">
              <div
                ref={lineNumbersRef}
                className="absolute left-0 top-0 h-full min-h-[160px] w-12 overflow-y-auto overflow-x-hidden overscroll-none bg-slate-50 dark:bg-slate-950/30 border-r border-slate-100 dark:border-slate-800 flex flex-col items-center pt-4 text-[10px] text-slate-400 font-mono select-none"
              >
                {Array.from({ length: Math.max(lineCount, 3) }, (_, i) => (
                  <span key={i} className="leading-[1.5rem] block w-full text-center">
                    {i + 1}
                  </span>
                ))}
              </div>
              <textarea
                ref={inputRef}
                onScroll={(e) => {
                  const el = lineNumbersRef.current;
                  if (el) el.scrollTop = e.currentTarget.scrollTop;
                }}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "z") {
                    e.preventDefault();
                    if (e.shiftKey) redo();
                    else undo();
                  } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
                    e.preventDefault();
                    redo();
                  }
                }}
                className="w-full min-h-[160px] pl-16 py-4 pr-4 bg-transparent border-none focus:ring-0 font-mono text-base leading-[1.5rem] text-slate-700 dark:text-slate-300 resize-none"
                placeholder="\\begin{matrix} a & b \\\\ c & d \\end{matrix}"
                value={katexInput}
                onChange={(e) => setKatexInput(e.target.value)}
              />
            </div>
          </div>

          {/* Preview Section */}
          <div className="p-8 bg-paper dark:bg-slate-900/50 min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Rendered Preview
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-slate-600 dark:text-slate-400 hover:text-primary"
                  onClick={handleExportImage}
                  disabled={!hasRenderedContent || !!renderError}
                >
                  <Download className="h-4 w-4" />
                  Export PNG
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-slate-600 dark:text-slate-400 hover:text-primary"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[200px]">
                    <DropdownMenuItem
                      onClick={handleCopyImage}
                      disabled={!hasRenderedContent || !!renderError}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Copy as Image
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleCopyMarkdown}
                      disabled={!katexInput.trim()}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Copy as Markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleCopyPlainText}
                      disabled={!katexInput.trim()}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy as Plain Text
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="relative flex-grow flex items-center justify-center">
              {renderError ? (
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                  {renderError}
                </p>
              ) : (
                <>
                  <div
                    ref={captureRef}
                    className={cn(
                      "overflow-auto max-w-full min-h-[1.5rem] text-center",
                      displayMode === "block" && "flex justify-center",
                      hasRenderedContent &&
                        "bg-white dark:bg-slate-900 p-10 rounded-xl border border-slate-200 dark:border-slate-700"
                    )}
                  >
                    <div
                      ref={previewRef}
                      className={cn(
                        "katex-font katex-display text-3xl text-slate-800 dark:text-slate-100 leading-relaxed inline-block",
                        displayMode === "block" && "block"
                      )}
                    />
                  </div>
                  {!hasRenderedContent && (
                    <p className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm pointer-events-none">
                      Rendered output will appear here
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-800 text-center">
              <p className="text-xs italic text-slate-400">Rendered with KaTeX 0.16.9 engine</p>
            </div>
          </div>

          {/* AI Panel */}
          <Collapsible open={aiPanelOpen} onOpenChange={setAiPanelOpen}>
            <CollapsibleTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center justify-between gap-4 px-6 py-4",
                  "border-t border-slate-200 dark:border-slate-800",
                  "bg-slate-50/80 dark:bg-slate-900/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/50",
                  "transition-colors duration-200"
                )}
              >
                <span className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI: Generate KaTeX from description
                </span>
                {aiPanelOpen ? (
                  <ChevronUp className="h-5 w-5 text-slate-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-500" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Describe the math you want (e.g. quadratic formula, integral of x squared)
                </p>
                <div className="flex gap-3">
                  <Input
                    type="text"
                    className="flex-1 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    placeholder="e.g. quadratic formula"
                    value={chatPrompt}
                    onChange={(e) => setChatPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  />
                  <Button
                    onClick={handleGenerate}
                    disabled={chatLoading}
                    className="h-10 px-6 bg-primary text-white hover:bg-primary/90"
                  >
                    {chatLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Generate"
                    )}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {SUGGESTED_QUERIES.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className="text-xs px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => setChatPrompt(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                {chatError && (
                  <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                    {chatError}
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Notebook Footer */}
        <div className="mt-6 flex justify-between text-xs text-slate-400 font-medium">
          <div className="flex gap-4">
            <span>Characters: {charCount}</span>
            <span>Lines: {lineCount}</span>
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Live Sync Active
            </span>
          </div>
        </div>

        {/* AI FAB */}
        <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
            >
              <Sparkles className="h-7 w-7 group-hover:rotate-12 transition-transform" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Math Assistant
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-slate-500 leading-relaxed">
                Describe the formula or problem you want to generate in natural language.
              </p>
              <textarea
                className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4 text-sm focus:ring-primary focus:border-primary min-h-[100px] resize-none"
                placeholder="e.g., Generate the Schrodinger equation in 3D..."
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleGenerate()}
              />
              <div className="flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setAiModalOpen(false)}
                  className="text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={chatLoading}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  {chatLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Generate"
                  )}
                </Button>
              </div>
              {chatError && (
                <p className="text-sm text-red-600 dark:text-red-400">{chatError}</p>
              )}
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 border-t border-slate-100 dark:border-slate-800 rounded-b-xl -mx-6 -mb-6">
              <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                Suggested Queries
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {SUGGESTED_QUERIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="text-[11px] px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => setChatPrompt(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* KaTeX Cheatsheet - always visible below main card */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            KaTeX Cheatsheet
          </h2>
          <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search by name, code, definition, math/comp-sci explanation"
                      value={cheatsheetSearch}
                      onChange={(e) => setCheatsheetSearch(e.target.value)}
                      className="pl-9 h-10 bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setCheatsheetView("table")}
                      className={cn(
                        "p-2 rounded-md transition-colors",
                        cheatsheetView === "table"
                          ? "bg-white dark:bg-slate-800 shadow-sm text-primary"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                      title="Table view"
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheatsheetView("grid")}
                      className={cn(
                        "p-2 rounded-md transition-colors",
                        cheatsheetView === "grid"
                          ? "bg-white dark:bg-slate-800 shadow-sm text-primary"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                      title="Grid view"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="max-h-[500px] overflow-y-auto overflow-x-hidden">
                  {groupedCheatsheet.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-sm py-8 text-center">
                      No symbols match &quot;{cheatsheetSearch}&quot;
                    </p>
                  ) : cheatsheetView === "table" ? (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden overflow-x-hidden">
                      <Table className="w-full table-fixed border-collapse">
                        <colgroup>
                          <col className="w-[8%]" />
                          <col className="w-[12%]" />
                          <col className="w-[10%]" />
                          <col className="w-[12%]" />
                          <col className="w-[22%]" />
                          <col className="w-[22%]" />
                          <col className="w-[14%]" />
                        </colgroup>
                        <TableHeader>
                          <TableRow className="border-b border-slate-200 dark:border-slate-700">
                            <TableHead className="bg-slate-50 dark:bg-slate-900/80 sticky top-0 z-10 px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                              Symbol
                            </TableHead>
                            <TableHead
                              className="bg-slate-50 dark:bg-slate-900/80 sticky top-0 z-10 px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                              onClick={() => handleSort("code")}
                            >
                              <button type="button" className="flex items-center gap-1 w-full justify-start">
                                Code
                                <SortIcon col="code" />
                              </button>
                            </TableHead>
                            <TableHead
                              className="bg-slate-50 dark:bg-slate-900/80 sticky top-0 z-10 px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                              onClick={() => handleSort("name")}
                            >
                              <button type="button" className="flex items-center gap-1 w-full justify-start">
                                Name
                                <SortIcon col="name" />
                              </button>
                            </TableHead>
                            <TableHead
                              className="bg-slate-50 dark:bg-slate-900/80 sticky top-0 z-10 px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                              onClick={() => handleSort("definition")}
                            >
                              <button type="button" className="flex items-center gap-1 w-full justify-start">
                                Definition
                                <SortIcon col="definition" />
                              </button>
                            </TableHead>
                            <TableHead
                              className="bg-slate-50 dark:bg-slate-900/80 sticky top-0 z-10 px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                              onClick={() => handleSort("explanationMath")}
                            >
                              <button type="button" className="flex items-center gap-1 w-full justify-start">
                                Explanation (Math)
                                <SortIcon col="explanationMath" />
                              </button>
                            </TableHead>
                            <TableHead
                              className="bg-slate-50 dark:bg-slate-900/80 sticky top-0 z-10 px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                              onClick={() => handleSort("explanationCompSci")}
                            >
                              <button type="button" className="flex items-center gap-1 w-full justify-start">
                                Explanation (Comp Sci)
                                <SortIcon col="explanationCompSci" />
                              </button>
                            </TableHead>
                            <TableHead
                              className="bg-slate-50 dark:bg-slate-900/80 sticky top-0 z-10 px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                              onClick={() => handleSort("category")}
                            >
                              <button type="button" className="flex items-center gap-1 w-full justify-start">
                                Category
                                <SortIcon col="category" />
                              </button>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupedCheatsheet.map((group) => (
                            <React.Fragment key={group.title}>
                              <TableRow className="border-b border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80">
                                <TableCell colSpan={7} className="px-3 py-1.5 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 text-sm">
                                  <HighlightSearch text={group.title} searchQuery={cheatsheetSearch} />
                                </TableCell>
                              </TableRow>
                              {group.symbols.map((sym, i) => (
                                <CheatsheetTableRow
                                  key={`${sym.code}-${sym.category}-${i}`}
                                  symbol={sym}
                                  onCopy={copyToInput}
                                  searchQuery={cheatsheetSearch}
                                />
                              ))}
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {groupedCheatsheet.map((group) => (
                        <div key={group.title}>
                          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                            <HighlightSearch text={group.title} searchQuery={cheatsheetSearch} />
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                            {group.symbols.map((sym) => (
                              <CheatsheetSymbolCard
                                key={`${sym.code}-${sym.category}`}
                                symbol={sym}
                                onCopy={copyToInput}
                                searchQuery={cheatsheetSearch}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
        </section>
      </div>
    </div>
  );
}

function CheatsheetSymbolCard({
  symbol,
  onCopy,
  searchQuery,
}: {
  symbol: { name: string; code: string; definition: string; explanationMath: string; explanationCompSci: string; category: string };
  onCopy: (code: string) => void;
  searchQuery: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      katex.render(symbol.code, el, { throwOnError: false });
    } catch {
      el.textContent = symbol.code;
    }
  }, [symbol.code]);

  return (
    <button
      type="button"
      onClick={() => onCopy(symbol.code)}
      className={cn(
        "flex flex-col items-center gap-1 p-3 rounded-lg border",
        "border-slate-200 dark:border-slate-700",
        "bg-slate-50/50 dark:bg-slate-800/30",
        "hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/20",
        "transition-colors text-left"
      )}
    >
      <div ref={ref} className="katex-display text-lg min-h-[1.5rem] flex items-center justify-center [&>.katex]:text-base" />
      <code className="text-xs text-slate-600 dark:text-slate-400 truncate w-full text-center font-mono">
        <HighlightSearch text={symbol.code} searchQuery={searchQuery} />
      </code>
    </button>
  );
}

function CheatsheetTableRow({
  symbol,
  onCopy,
  searchQuery,
}: {
  symbol: { name: string; code: string; definition: string; explanationMath: string; explanationCompSci: string; category: string };
  onCopy: (code: string) => void;
  searchQuery: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      katex.render(symbol.code, el, { throwOnError: false });
    } catch {
      el.textContent = symbol.code;
    }
  }, [symbol.code]);

  return (
    <TableRow
      className="cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/10 border-b border-slate-200 dark:border-slate-700"
      onClick={() => onCopy(symbol.code)}
    >
      <TableCell className="px-3 py-2 overflow-hidden">
        <div ref={ref} className="katex-display min-h-[1.25rem] [&>.katex]:text-xs" />
      </TableCell>
      <TableCell className="px-3 py-2 font-mono text-xs overflow-hidden">
        <span className="block truncate">
          <HighlightSearch text={symbol.code} searchQuery={searchQuery} />
        </span>
      </TableCell>
      <TableCell className="px-3 py-2 text-xs overflow-hidden">
        <span className="block truncate">
          <HighlightSearch text={symbol.name} searchQuery={searchQuery} />
        </span>
      </TableCell>
      <TableCell className="px-3 py-2 text-xs overflow-hidden">
        <span className="block truncate">
          <HighlightSearch text={symbol.definition} searchQuery={searchQuery} />
        </span>
      </TableCell>
      <TableCell className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 overflow-hidden" title={symbol.explanationMath}>
        <span className="block truncate">
          <HighlightSearch text={symbol.explanationMath} searchQuery={searchQuery} />
        </span>
      </TableCell>
      <TableCell className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 overflow-hidden" title={symbol.explanationCompSci}>
        <span className="block truncate">
          <HighlightSearch text={symbol.explanationCompSci} searchQuery={searchQuery} />
        </span>
      </TableCell>
      <TableCell className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 overflow-hidden">
        <span className="block truncate">
          <HighlightSearch text={symbol.category} searchQuery={searchQuery} />
        </span>
      </TableCell>
    </TableRow>
  );
}

export default function KatexPlaygroundClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <KatexPlaygroundContent />
    </Suspense>
  );
}
