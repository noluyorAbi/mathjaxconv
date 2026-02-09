"use client";

/**
 * KlausurChatClient
 * Mobile-first PDF full view with AI chat Sidebar.
 * Desktop: Sidebar PUSHES content (split view).
 * Mobile: Sidebar is an OVERLAY (Sheet).
 * Persists chat history to localStorage.
 */
import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Loader2,
  Send,
  MessageCircle,
  Maximize2,
  Minimize2,
  Trash2,
  Sparkles,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
interface ChatMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
  timestamp?: number;
}

interface CustomCodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
  children?: React.ReactNode;
  className?: string;
}

// --- Markdown Components (Premium Styling) ---
const chatMarkdownComponents: Components = {
  h1: ({ ...props }) => (
    <h1 className="text-lg font-bold my-3 text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1" {...props} />
  ),
  h2: ({ ...props }) => (
    <h2 className="text-base font-bold my-2 text-slate-800 dark:text-slate-200" {...props} />
  ),
  h3: ({ ...props }) => (
    <h3 className="text-sm font-bold my-2 text-slate-700 dark:text-slate-300" {...props} />
  ),
  p: ({ ...props }) => <p className="mb-2 last:mb-0 leading-relaxed text-sm text-slate-700 dark:text-slate-300" {...props} />,
  strong: ({ ...props }) => <strong className="font-semibold text-slate-900 dark:text-slate-100" {...props} />,
  em: ({ ...props }) => <em className="italic text-slate-800 dark:text-slate-200" {...props} />,
  ul: ({ ...props }) => <ul className="list-disc list-inside my-2 space-y-1 text-sm pl-2" {...props} />,
  ol: ({ ...props }) => <ol className="list-decimal list-inside my-2 space-y-1 text-sm pl-2" {...props} />,
  li: ({ ...props }) => <li className="pl-1" {...props} />,
  blockquote: ({ ...props }) => (
    <blockquote
      className="border-l-4 border-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-950/20 pl-4 py-2 my-2 text-sm italic rounded-r-lg"
      {...props}
    />
  ),
  pre: (props) => (
    <pre
      className="bg-slate-900 text-slate-50 p-3 rounded-lg my-3 overflow-x-auto text-xs font-mono shadow-inner border border-slate-800"
      {...props}
    />
  ),
  code: ({ inline, className, children, ...props }: CustomCodeProps) => {
    if (inline) {
      return (
        <code
          className={cn(
            "bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-xs font-mono text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700/50",
            className
          )}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className="font-mono" {...props}>
        {children}
      </code>
    );
  },
  hr: ({ ...props }) => <hr className="my-4 border-slate-200 dark:border-slate-700/50" {...props} />,
  a: ({ ...props }) => (
    <a
      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline underline-offset-2 transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
};

// --- Helper Components ---

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const text = message.parts.map((p) => p.text).join("\n");

  return (
    <div
      className={cn(
        "flex w-full mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-5 py-3.5 text-sm shadow-sm relative overflow-hidden",
          isUser
            ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-tr-sm"
            : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-sm shadow-md"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
        ) : (
          <div className="prose prose-sm prose-slate dark:prose-invert max-w-none prose-headings:mb-2 prose-p:mb-2 prose-pre:my-2">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={chatMarkdownComponents}
            >
              {text}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

// Extracted UI for reuse between Desktop Sidebar and Mobile Sheet
function ChatUI({
  messages,
  loading,
  error,
  input,
  setInput,
  sendMessage,
  handleKeyDown,
  clearHistory,
  scrollRef,
  onClose
}: {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  input: string;
  setInput: (v: string) => void;
  sendMessage: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  clearHistory: () => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/50 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-950 dark:to-slate-900/50 shrink-0 flex items-center justify-between gap-4">
        <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1">
          <h2 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 truncate">
            Lern-Assistent
          </h2>
          <p className="text-xs text-slate-500 font-medium truncate">
            Klausur PDF Experte
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearHistory}
              className="h-9 w-9 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              title="Verlauf löschen"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 hidden md:flex"
              title="Schliessen"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/20 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
            <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-full mb-4">
              <Sparkles className="h-8 w-8 text-indigo-500" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Wie kann ich helfen?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              Stelle Fragen zu deinem Skript oder den Aufgaben. Ich antworte basierend auf dem Dokument.
            </p>

            <div className="mt-8 grid gap-2 w-full max-w-xs">
              {["Fasse das Thema zusammen", "Erkläre Aufgabe 3", "Was sind die wichtigsten Formeln?"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                  }}
                  className="text-xs py-2 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-left truncate shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
            {loading && (
              <div className="flex items-center gap-3 animate-pulse text-slate-400 ml-1">
                <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" />
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}

        {error && (
          <div className="mx-4 my-2 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900/50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <span className="font-semibold">Fehler:</span> {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 shadow-[0_-1px_10px_rgba(0,0,0,0.03)] dark:shadow-none z-10 shrink-0">
        <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:border-indigo-500/50 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all duration-200">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Schreib eine Nachricht..."
            className="flex-1 w-full min-h-[44px] max-h-32 py-2.5 px-3 bg-transparent border-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none text-sm focus:ring-0 focus:outline-none leading-relaxed"
            rows={1}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            size="icon"
            className={cn(
              "mb-0.5 rounded-xl h-10 w-10 shrink-0 transition-all duration-200",
              input.trim() && !loading
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 dark:shadow-none"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400"
            )}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5 ml-0.5" />
            )}
          </Button>
        </div>
        <div className="text-[10px] text-center text-slate-400 mt-2 font-medium">
          AI kann Fehler machen. Überprüfe wichtige Infos im PDF.
        </div>
      </div>
    </div>
  );
}

const PDF_URL = "/klausur-vorbereitung-aufgabe-loesung-pro-quelle.pdf";
const STORAGE_KEY = "klausur-chat-history";

export default function KlausurChatClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // State for layout
  // 'desktop-open': Sidebar is open on desktop (pushing content)
  // 'mobile-open': Sheet is open on mobile (overlay)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Controls both desktop sidebar and mobile sheet

  const scrollRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // --- Mobile Check ---
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // --- Persistence ---
  useEffect(() => {
    // Load history
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    }
  }, []);

  useEffect(() => {
    // Save history
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const clearHistory = useCallback(() => {
    if (window.confirm("Chat-Verlauf wirklich löschen?")) {
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // --- Scroll ---
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  useEffect(() => {
    if (isSidebarOpen) {
      scrollToBottom();
    }
  }, [messages, isSidebarOpen, scrollToBottom]);

  // --- Messaging ---
  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      parts: [{ text: trimmed }],
      timestamp: Date.now(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);
    scrollToBottom();

    try {
      const res = await fetch("/api/klausur-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Request failed");
      }

      const modelMessage: ChatMessage = {
        role: "model",
        parts: [{ text: data.text ?? "" }],
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, scrollToBottom]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // --- Fullscreen ---
  const toggleFullscreen = useCallback(async () => {
    const container = pdfContainerRef.current;
    if (!container) return; // Should be the wrapper div

    if (!fullscreen) {
      try {
        await container.requestFullscreen();
        setFullscreen(true);
      } catch { /* no-op */ }
    } else {
      try {
        await document.exitFullscreen();
        setFullscreen(false);
      } catch {
        setFullscreen(false);
      }
    }
  }, [fullscreen]);

  useEffect(() => {
    const handler = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Shared props for ChatUI
  const chatProps = {
    messages,
    loading,
    error,
    input,
    setInput,
    sendMessage,
    handleKeyDown,
    clearHistory,
    scrollRef,
    onClose: () => setIsSidebarOpen(false),
  };

  return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col font-sans overflow-hidden">
      {/* Header - Glassmorphism */}
      <header className="absolute top-0 left-0 right-0 z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 h-14 flex items-center justify-between px-4 transition-all">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500/10 p-1.5 rounded-lg">
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <h1 className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
              Klausurvorbereitung
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-full"
            aria-label={fullscreen ? "Vollbild beenden" : "Vollbild"}
          >
            {fullscreen ? (
              <Minimize2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            ) : (
              <Maximize2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            )}
          </Button>

          {/* Toggle Sidebar Button (Desktop only, visible if sidebar is closed) */}
          {!isSidebarOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
              className="hidden md:flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs font-semibold">Chat öffnen</span>
            </Button>
          )}
        </div>
      </header>

      {/* Main Layout: Flex Row for Push Effect */}
      <div className="flex-1 flex flex-row h-full pt-14 relative overflow-hidden">

        {/* PDF Area - Pushed by sidebar */}
        <div
          ref={pdfContainerRef}
          className="flex-1 relative h-full bg-slate-100 dark:bg-slate-900 transition-all duration-300 ease-in-out"
        >
          <iframe
            src={PDF_URL}
            className="w-full h-full border-none shadow-inner"
            title="Klausur PDF"
          />
        </div>

        {/* Desktop Sidebar (Push) */}
        <aside
          className={cn(
            "hidden md:flex flex-col border-l border-slate-200/50 dark:border-slate-800/50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl z-10 transition-all duration-300 ease-in-out overflow-hidden",
            isSidebarOpen ? "w-[450px] opacity-100 translate-x-0" : "w-0 opacity-0 translate-x-10"
          )}
        >
          <ChatUI {...chatProps} />
        </aside>

        {/* Mobile FAB Trigger (Only visible on mobile) */}
        <div className="md:hidden fixed bottom-6 right-6 z-40">
          <Sheet open={isSidebarOpen && isMobile} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "h-14 w-14 rounded-full shadow-xl shadow-indigo-500/30",
                  "bg-gradient-to-tr from-indigo-600 to-violet-600 text-white",
                  "flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/50 active:scale-95",
                  "ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "animate-in zoom-in slide-in-from-bottom-4 duration-500"
                )}
                aria-label="Chat öffnen"
              >
                <MessageCircle className="h-7 w-7" />
                {messages.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white border-2 border-white dark:border-slate-900">
                    {messages.length}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90dvh] w-full p-0 rounded-t-2xl flex flex-col overflow-hidden">
              <SheetTitle className="sr-only">Lern-Assistent</SheetTitle>
              <ChatUI {...chatProps} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
