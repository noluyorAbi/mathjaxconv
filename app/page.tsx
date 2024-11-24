"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css"; // Für mathematische Formatierungen

export default function Home(): JSX.Element {
  const [inputText, setInputText] = useState<string>("");
  const [modifiedText, setModifiedText] = useState<string>("");
  const [isClient, setIsClient] = useState<boolean>(false);
  const [notification, setNotification] = useState<string>("");
  const [showNotification, setShowNotification] = useState<boolean>(false);

  // Refs für Eingabe und Vorschau
  const inputTextareaRef = useRef<HTMLTextAreaElement>(null);
  const inputPreviewRef = useRef<HTMLDivElement>(null);

  // Refs für modifizierten Text und Vorschau
  const modifiedTextareaRef = useRef<HTMLTextAreaElement>(null);
  const modifiedPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Synchronisiertes Scrollen für Eingabe und Vorschau
  useEffect(() => {
    const textarea = inputTextareaRef.current;
    const preview = inputPreviewRef.current;

    if (!textarea || !preview) return;

    let isSyncingFromTextarea = false;
    let isSyncingFromPreview = false;

    const handleTextareaScroll = () => {
      if (isSyncingFromPreview) {
        isSyncingFromPreview = false;
        return;
      }
      if (!textarea || !preview) return;
      isSyncingFromTextarea = true;

      const textareaScrollHeight = textarea.scrollHeight - textarea.clientHeight;
      const scrollPercentage =
        textareaScrollHeight > 0 ? textarea.scrollTop / textareaScrollHeight : 0;

      const previewScrollHeight = preview.scrollHeight - preview.clientHeight;
      preview.scrollTop = scrollPercentage * previewScrollHeight;
    };

    const handlePreviewScroll = () => {
      if (isSyncingFromTextarea) {
        isSyncingFromTextarea = false;
        return;
      }
      if (!textarea || !preview) return;
      isSyncingFromPreview = true;

      const previewScrollHeight = preview.scrollHeight - preview.clientHeight;
      const scrollPercentage =
        previewScrollHeight > 0 ? preview.scrollTop / previewScrollHeight : 0;

      const textareaScrollHeight = textarea.scrollHeight - textarea.clientHeight;
      textarea.scrollTop = scrollPercentage * textareaScrollHeight;
    };

    textarea.addEventListener("scroll", handleTextareaScroll);
    preview.addEventListener("scroll", handlePreviewScroll);

    return () => {
      textarea.removeEventListener("scroll", handleTextareaScroll);
      preview.removeEventListener("scroll", handlePreviewScroll);
    };
  }, []);

  // Synchronisiertes Scrollen für modifizierten Text und Vorschau
  useEffect(() => {
    if (!modifiedText) return; // Nur setzen, wenn modifizierter Text existiert

    const textarea = modifiedTextareaRef.current;
    const preview = modifiedPreviewRef.current;

    if (!textarea || !preview) return;

    let isSyncingFromTextarea = false;
    let isSyncingFromPreview = false;

    const handleTextareaScroll = () => {
      if (isSyncingFromPreview) {
        isSyncingFromPreview = false;
        return;
      }
      if (!textarea || !preview) return;
      isSyncingFromTextarea = true;

      const textareaScrollHeight = textarea.scrollHeight - textarea.clientHeight;
      const scrollPercentage =
        textareaScrollHeight > 0 ? textarea.scrollTop / textareaScrollHeight : 0;

      const previewScrollHeight = preview.scrollHeight - preview.clientHeight;
      preview.scrollTop = scrollPercentage * previewScrollHeight;
    };

    const handlePreviewScroll = () => {
      if (isSyncingFromTextarea) {
        isSyncingFromTextarea = false;
        return;
      }
      if (!textarea || !preview) return;
      isSyncingFromPreview = true;

      const previewScrollHeight = preview.scrollHeight - preview.clientHeight;
      const scrollPercentage =
        previewScrollHeight > 0 ? preview.scrollTop / previewScrollHeight : 0;

      const textareaScrollHeight = textarea.scrollHeight - textarea.clientHeight;
      textarea.scrollTop = scrollPercentage * textareaScrollHeight;
    };

    textarea.addEventListener("scroll", handleTextareaScroll);
    preview.addEventListener("scroll", handlePreviewScroll);

    return () => {
      textarea.removeEventListener("scroll", handleTextareaScroll);
      preview.removeEventListener("scroll", handlePreviewScroll);
    };
  }, [modifiedText]);

  const processText = (text: string): string => {
    const inlineRegex = /\\\(\s*(.*?)\s*\\\)/gs;
    const displayRegex = /\\\[\s*(.*?)\s*\\\]/gs;

    let result = text.replace(inlineRegex, (_: string, p1: string) => `$${p1}$`);
    result = result.replace(displayRegex, (_: string, p1: string) => `$$${p1}$$`);

    return result;
  };

  const handleProcess = () => {
    const result = processText(inputText);
    setModifiedText(result);
  };

  const handleCopy = async () => {
    if (isClient) {
      try {
        await navigator.clipboard.writeText(modifiedText);
        setNotification("Text in die Zwischenablage kopiert!");
        setShowNotification(true);
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setNotification("Fehler beim Kopieren: " + err.message);
        } else {
          setNotification("Unbekannter Fehler beim Kopieren.");
        }
        setShowNotification(true);
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      }
    } else {
      setNotification("Die Zwischenablagefunktion ist auf dem Server nicht verfügbar.");
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  };

  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  // Anpassung der Markdown-Komponenten mit Tailwind CSS Klassen
  const markdownComponents: Components = {
    h1: ({ node, ...props }) => (
      <h1 className="text-3xl font-bold text-primary dark:text-primary-dark my-4" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-2xl font-bold text-primary dark:text-primary-dark my-4" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="text-xl font-bold text-primary dark:text-primary-dark my-4" {...props} />
    ),
    h4: ({ node, ...props }) => (
      <h4 className="text-lg font-bold text-primary dark:text-primary-dark my-4" {...props} />
    ),
    h5: ({ node, ...props }) => (
      <h5 className="text-base font-bold text-primary dark:text-primary-dark my-4" {...props} />
    ),
    h6: ({ node, ...props }) => (
      <h6 className="text-sm font-bold text-primary dark:text-primary-dark my-4" {...props} />
    ),
    p: ({ node, ...props }) => (
      <p className="text-text-light dark:text-text-dark my-2" {...props} />
    ),
    strong: ({ node, ...props }) => (
      <strong className="font-bold text-primary dark:text-primary-dark" {...props} />
    ),
    em: ({ node, ...props }) => (
      <em className="italic text-text-light dark:text-text-dark" {...props} />
    ),
    ul: ({ node, ...props }) => (
      <ul className="list-disc list-inside my-2 text-text-light dark:text-text-dark" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className="list-decimal list-inside my-2 text-text-light dark:text-text-dark" {...props} />
    ),
    li: ({ node, ...props }) => <li className="my-1" {...props} />,
    blockquote: ({ node, ...props }) => (
      <blockquote
        className="border-l-4 border-primary dark:border-primary-dark pl-4 my-4 text-text-light dark:text-text-dark italic"
        {...props}
      />
    ),
    code: ({ node, inline, className, children, ...props }) => {
      return !inline ? (
        <pre className="bg-gray-200 dark:bg-gray-800 p-4 rounded-md my-4 overflow-auto">
          <code className="text-primary dark:text-primary-dark" {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code
          className="bg-gray-200 dark:bg-gray-800 p-1 rounded text-primary dark:text-primary-dark"
          {...props}
        >
          {children}
        </code>
      );
    },
    hr: ({ node, ...props }) => (
      <hr className="my-4 border-gray-300 dark:border-gray-700" {...props} />
    ),
    a: ({ node, ...props }) => (
      <a className="text-primary dark:text-primary-dark hover:underline" {...props} />
    ),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-800 dark:to-black flex justify-center items-center overflow-y-hidden text-black dark:text-white transition-colors duration-300 relative">
      {/* Benachrichtigungsbanner */}
      <div
        className={`fixed top-0 left-0 w-full bg-green-500 text-white px-4 py-2 shadow-md flex items-center justify-between transition-opacity duration-500 ${
          showNotification ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <span>{notification}</span>
        <button className="text-white font-bold px-2" onClick={handleCloseNotification}>
          ×
        </button>
      </div>

      {/* Hauptcontainer */}
      <div className="w-full max-w-5xl bg-white dark:bg-gray-900 rounded-lg shadow-md p-8 flex flex-col">
        {/* Header */}
        <h1 className="text-3xl font-extrabold text-center text-blue-600 dark:text-blue-400 mb-8">
          LaTeX Environment Replacer
        </h1>

        {/* Eingabe und Vorschau */}
        <div className="flex flex-col md:flex-row gap-8 flex-grow">
          {/* Eingabe-Textarea */}
          <textarea
            ref={inputTextareaRef}
            className="w-full md:w-1/2 p-4 border border-blue-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-black dark:text-white resize-y overflow-auto max-h-96 min-h-40"
            placeholder="Gib hier deinen Text ein..."
            value={inputText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
            rows={10}
          ></textarea>

          {/* Markdown Vorschau */}
          <div
            ref={inputPreviewRef}
            className="w-full md:w-1/2 p-4 border border-blue-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white overflow-auto max-h-96"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={markdownComponents}
            >
              {inputText}
            </ReactMarkdown>
          </div>
        </div>

        {/* Prozessieren Button */}
        <div className="flex justify-center mt-6">
          <button
            className="bg-blue-600 dark:bg-blue-500 text-white font-semibold px-6 py-3 rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 transition duration-300"
            onClick={handleProcess}
          >
            Text verarbeiten
          </button>
        </div>

        {/* Modifizierter Text Abschnitt */}
        {modifiedText && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">
              Modifizierter Text
            </h2>
            <div className="flex flex-col md:flex-row gap-8">
              {/* Modifizierter Textarea */}
              <textarea
                ref={modifiedTextareaRef}
                className="w-full md:w-1/2 p-4 border border-green-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-800 text-black dark:text-white resize-y overflow-auto max-h-96 min-h-40"
                value={modifiedText}
                readOnly
                onChange={() => {}}
                rows={10}
              ></textarea>

              {/* Modifizierte Markdown Vorschau */}
              <div
                ref={modifiedPreviewRef}
                className="w-full md:w-1/2 p-4 border border-green-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white overflow-auto max-h-96"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={markdownComponents}
                >
                  {modifiedText}
                </ReactMarkdown>
              </div>
            </div>

            {/* Kopieren Button */}
            <div className="flex justify-center mt-6">
              <button
                className="bg-green-600 dark:bg-green-500 text-white font-semibold px-6 py-3 rounded-full hover:bg-green-700 dark:hover:bg-green-600 transition duration-300"
                onClick={handleCopy}
              >
                In Zwischenablage kopieren
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
