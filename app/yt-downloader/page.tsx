// Implemented at 2026-01-20T01:10:00+01:00 - YouTube Downloader Page with Real-Time Progress
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Youtube, Music, Film, CheckCircle2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

export default function YtDownloaderPage() {
    const [url, setUrl] = useState("");
    const [format, setFormat] = useState<"mp3" | "mp4">("mp3");
    const [status, setStatus] = useState<"idle" | "processing" | "downloading" | "completed" | "error">("idle");
    const [loadingText, setLoadingText] = useState("Processing...");
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const eventSourceRef = useRef<EventSource | null>(null);

    const handleDownload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (status === "processing" || status === "downloading") return;

        setStatus("processing");
        setError(null);
        setProgress(0);
        setLoadingText("Initializing connection...");

        // Close any existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const sseUrl = `/api/yt-download-stream?url=${encodeURIComponent(url)}&format=${format}`;
        const es = new EventSource(sseUrl);
        eventSourceRef.current = es;

        es.onopen = () => {
            setLoadingText("Starting download...");
        };

        es.onerror = (err) => {
            console.error("EventSource error:", err);
            // Only set error if we haven't completed (sometimes browser closes connection abruptly)
            if (status !== "completed") {
                setError("Connection lost. Please try again.");
                setStatus("error");
                es.close();
            }
        };

        es.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);

                switch (data.state) {
                    case "progress":
                        setProgress(data.value);
                        setLoadingText(data.text);
                        break;

                    case "completed":
                        setStatus("downloading");
                        setLoadingText("Finalizing download...");
                        setProgress(100);
                        es.close();

                        // Trigger actual file download
                        downloadFile(data.fileId, data.filename);
                        break;

                    case "error":
                        setError(data.message || "An unknown error occurred");
                        setStatus("error");
                        es.close();
                        break;
                }
            } catch (err) {
                console.error("Failed to parse event data", err);
            }
        };
    };

    const downloadFile = (fileId: string, filename: string) => {
        const downloadUrl = `/api/get-download?fileId=${fileId}&filename=${encodeURIComponent(filename)}`;
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();

        setStatus("completed");
        setTimeout(() => setStatus("idle"), 5000);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 flex items-center justify-center relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-80" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-lg"
            >
                <Card className="bg-gray-950/80 backdrop-blur-md border-gray-800 shadow-2xl">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-red-900/20">
                            <Youtube className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-3xl font-bold text-white tracking-tight">YouTube Converter</CardTitle>
                        <CardDescription className="text-gray-400 text-base">
                            Download high-quality audio or video instantly.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleDownload} className="space-y-6">

                            {/* Format Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 ml-1">Select Format</label>
                                <Tabs
                                    value={format}
                                    onValueChange={(v) => setFormat(v as "mp3" | "mp4")}
                                    className="w-full"
                                >
                                    <TabsList className="grid w-full grid-cols-2 bg-gray-900 border border-gray-800">
                                        <TabsTrigger value="mp3" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                                            <Music className="w-4 h-4 mr-2" />
                                            Audio (MP3)
                                        </TabsTrigger>
                                        <TabsTrigger value="mp4" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                            <Film className="w-4 h-4 mr-2" />
                                            Video (MP4)
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>

                            {/* URL Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 ml-1">Video URL</label>
                                <div className="relative">
                                    <Input
                                        type="url"
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        required
                                        disabled={status === "processing" || status === "downloading"}
                                        className="bg-gray-900 border-gray-700 text-white placeholder-gray-600 pl-4 pr-4 py-6 text-lg focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all rounded-xl"
                                    />
                                </div>
                            </div>

                            {/* Progress Bar - Only visible when processing */}
                            <AnimatePresence>
                                {(status === "processing" || status === "downloading") && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-2"
                                    >
                                        <div className="flex justify-between text-xs text-gray-400">
                                            <span>{loadingText}</span>
                                            <span>{Math.round(progress)}%</span>
                                        </div>
                                        <Progress value={progress} className="h-2 bg-gray-800" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Error Message */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-4 text-sm text-red-200 bg-red-950/40 border border-red-900/50 rounded-xl"
                                    >
                                        <p className="font-semibold">Error</p>
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Action Button */}
                            <Button
                                type="submit"
                                disabled={status === "processing" || status === "downloading" || !url}
                                className={`w-full py-6 text-lg font-bold shadow-lg transition-all duration-300 rounded-xl
                  ${format === 'mp3' ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600' : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600'}
                  disabled:opacity-70 disabled:cursor-not-allowed`}
                            >
                                {status === "processing" || status === "downloading" ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Processing...</span>
                                    </div>
                                ) : status === "completed" ? (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5" />
                                        <span>Download Complete!</span>
                                    </div>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-5 w-5" />
                                        Download {format.toUpperCase()}
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-gray-600 text-sm mt-6">
                    Depending on video length, processing may take a minute.
                </p>
            </motion.div>
        </div>
    );
}
