"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowRightLeft, Copy, Check } from "lucide-react";

export default function MarkdownToJiraPage() {
    const [inputText, setInputText] = useState("");
    const [outputText, setOutputText] = useState("");
    const [copied, setCopied] = useState(false);
    const [isMac, setIsMac] = useState(false);

    useEffect(() => {
        setIsMac(navigator.platform.toLowerCase().includes("mac"));
    }, []);

    const convertToJira = (markdown: string) => {
        let jira = markdown;

        // Headers
        // Must be done carefully to avoid matching inside code blocks (handled simply here, could be improved)
        // h6 -> h1 order matters to avoid partial matches if using simple regex
        jira = jira.replace(/^###### (.*$)/gm, "h6. $1");
        jira = jira.replace(/^##### (.*$)/gm, "h5. $1");
        jira = jira.replace(/^#### (.*$)/gm, "h4. $1");
        jira = jira.replace(/^### (.*$)/gm, "h3. $1");
        jira = jira.replace(/^## (.*$)/gm, "h2. $1");
        jira = jira.replace(/^# (.*$)/gm, "h1. $1");

        // Bold + Italic (*** or ___) -> _*text*_
        jira = jira.replace(/(\*\*\*)(.*?)\1/g, "_*$2*_");
        jira = jira.replace(/(___)(.*?)\1/g, "_*$2*_");

        // Bold (** or __) -> *text*
        jira = jira.replace(/(\*\*)(.*?)\1/g, "*$2*");
        jira = jira.replace(/(__)(.*?)\1/g, "*$2*");

        // Italic (* or _) -> _text_
        // Note: Jira uses _ for italic. * is bold.
        // Markdown: *italics* or _italics_
        // We need to be careful not to match list items *
        jira = jira.replace(/(\*)(?!\s)(.*?)(?<!\s)\1/g, "_$2_");
        jira = jira.replace(/(_)(.*?)\1/g, "_$2_");

        // Unordered Lists
        // Markdown: - or *
        // Jira: *
        jira = jira.replace(/^(\s*)-\s/gm, "$1* ");
        // Convert Markdown * lists to Jira * lists (already essentially the same but normalizing)
        // Jira supports deeper nesting with **
        // Simple replacement: just ensure - becomes *

        // Ordered Lists
        // Markdown: 1.
        // Jira: #
        jira = jira.replace(/^(\s*)\d+\.\s/gm, "$1# ");

        // Links
        // [text](url) -> [text|url]
        jira = jira.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "[$1|$2]");

        // Code Blocks
        // ```language ... ``` -> {code:language} ... {code}
        // Handle optional language
        jira = jira.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, content) => {
            const codeTag = lang ? `{code:${lang}}` : "{code}";
            return `${codeTag}\n${content}{code}`;
        });

        // Inline Code
        // `code` -> {{code}}
        jira = jira.replace(/`([^`]+)`/g, "{{$1}}");

        // Blockquotes
        // > text -> {quote}text{quote} is one way, or bq.
        // Jira bq. is for single line. {quote} is for block.
        // Let's use {quote} wrapper if we detect contiguous blockquotes?
        // Or strictly Convert > to bq. 
        jira = jira.replace(/^>\s?(.*$)/gm, "bq. $1");

        return jira;
    };

    const handleConvert = useCallback(() => {
        const result = convertToJira(inputText);
        setOutputText(result);
    }, [inputText]);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(outputText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy", err);
        }
    }, [outputText]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // CMD/CTRL + Enter to Convert
            if ((isMac ? e.metaKey : e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleConvert();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isMac, handleConvert]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-slate-900 text-slate-900 dark:text-slate-100 p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Markdown to Jira Converter
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Transform your standard Markdown documentation into Jira Wiki Markup instantly.
                    </p>
                </div>

                {/* Main Interface */}
                <div className="grid md:grid-cols-2 gap-6 h-[600px]">
                    {/* Input Section */}
                    <div className="flex flex-col space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl flex-1 flex flex-col overflow-hidden border border-slate-200 dark:border-gray-700">
                            <div className="bg-slate-50 dark:bg-gray-800/50 px-4 py-3 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Markdown Input</span>
                                <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
                                    {isMac ? "⌘ + Enter" : "Ctrl + Enter"} to convert
                                </span>
                            </div>
                            <textarea
                                className="flex-1 w-full p-4 bg-transparent resize-none outline-none font-mono text-sm leading-relaxed"
                                placeholder="# Paste your Markdown here..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Output Section */}
                    <div className="flex flex-col space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl flex-1 flex flex-col overflow-hidden border border-slate-200 dark:border-gray-700 relative">
                            <div className="bg-slate-50 dark:bg-gray-800/50 px-4 py-3 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Jira Markup Output</span>
                                <button
                                    onClick={handleCopy}
                                    disabled={!outputText}
                                    className={`flex items-center gap-2 px-3 py-1 rounded-md transition-all text-xs font-medium ${copied
                                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                            : "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                    {copied ? "Copied!" : "Copy"}
                                </button>
                            </div>
                            <textarea
                                className="flex-1 w-full p-4 bg-transparent resize-none outline-none font-mono text-sm leading-relaxed text-slate-600 dark:text-slate-300"
                                placeholder="Jira formatted text will appear here..."
                                value={outputText}
                                readOnly
                            />
                        </div>
                    </div>
                </div>

                {/* Action Button (Mobile/Secondary) */}
                <div className="flex justify-center">
                    <button
                        onClick={handleConvert}
                        className="group relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800"
                    >
                        <span className="relative px-8 py-3.5 transition-all ease-in-out duration-200 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0 text-lg font-bold flex items-center gap-3">
                            <ArrowRightLeft className="w-5 h-5" />
                            Convert to Jira
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
