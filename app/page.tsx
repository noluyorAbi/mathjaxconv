"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css"; // For mathematical formatting

// Define a custom interface for the Code component's props
interface CustomCodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
  children?: React.ReactNode; // Make children optional to align with expected types
  className?: string;
}

// Define the type for Markdown components
const markdownComponents: Components = {
  h1: ({ ...props }) => (
    <h1
      className="text-3xl font-bold text-primary dark:text-primary-dark my-4"
      {...props}
    />
  ),
  h2: ({ ...props }) => (
    <h2
      className="text-2xl font-bold text-primary dark:text-primary-dark my-4"
      {...props}
    />
  ),
  h3: ({ ...props }) => (
    <h3
      className="text-xl font-bold text-primary dark:text-primary-dark my-4"
      {...props}
    />
  ),
  h4: ({ ...props }) => (
    <h4
      className="text-lg font-bold text-primary dark:text-primary-dark my-4"
      {...props}
    />
  ),
  h5: ({ ...props }) => (
    <h5
      className="text-base font-bold text-primary dark:text-primary-dark my-4"
      {...props}
    />
  ),
  h6: ({ ...props }) => (
    <h6
      className="text-sm font-bold text-primary dark:text-primary-dark my-4"
      {...props}
    />
  ),
  p: ({ ...props }) => (
    <p className="text-text-light dark:text-text-dark my-2" {...props} />
  ),
  strong: ({ ...props }) => (
    <strong
      className="font-bold text-primary dark:text-primary-dark"
      {...props}
    />
  ),
  em: ({ ...props }) => (
    <em className="italic text-text-light dark:text-text-dark" {...props} />
  ),
  ul: ({ ...props }) => (
    <ul
      className="list-disc list-inside my-2 text-text-light dark:text-text-dark"
      {...props}
    />
  ),
  ol: ({ ...props }) => (
    <ol
      className="list-decimal list-inside my-2 text-text-light dark:text-text-dark"
      {...props}
    />
  ),
  li: ({ ...props }) => <li className="my-1" {...props} />,
  blockquote: ({ ...props }) => (
    <blockquote
      className="border-l-4 border-primary dark:border-primary-dark pl-4 my-4 text-text-light dark:text-text-dark italic"
      {...props}
    />
  ),
  // Separate handling for <pre>
  pre: ({ ...props }) => (
    <pre
      className="bg-gray-200 dark:bg-gray-800 p-4 rounded-md my-4 overflow-auto"
      {...props}
    />
  ),

  // Separate handling for <code>
  code: ({ inline, className, children, ...props }: CustomCodeProps) => {
    if (inline) {
      return (
        <code
          className={`bg-gray-200 dark:bg-gray-800 p-1 rounded text-primary dark:text-primary-dark ${
            className || ""
          }`}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className="text-primary dark:text-primary-dark" {...props}>
        {children}
      </code>
    );
  },
  hr: ({ ...props }) => (
    <hr className="my-4 border-gray-300 dark:border-gray-700" {...props} />
  ),
  a: ({ ...props }) => (
    <a
      className="text-primary dark:text-primary-dark hover:underline"
      {...props}
    />
  ),
};

const Home: React.FC = () => {
  // State hooks with explicit types
  const [inputText, setInputText] = useState<string>("");
  const [modifiedText, setModifiedText] = useState<string>("");
  const [isClient, setIsClient] = useState<boolean>(false);
  const [notification, setNotification] = useState<string>("");
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [isMac, setIsMac] = useState<boolean>(false); // New state to track if user is on Mac

  // Refs with precise types
  const inputTextareaRef = useRef<HTMLTextAreaElement>(null);
  const inputPreviewRef = useRef<HTMLDivElement>(null);
  const modifiedTextareaRef = useRef<HTMLTextAreaElement>(null);
  const modifiedPreviewRef = useRef<HTMLDivElement>(null);

  // Set isClient and detect if user is on Mac after the first render
  useEffect(() => {
    setIsClient(true);
    const platform = navigator.platform.toLowerCase();
    setIsMac(platform.includes("mac"));
  }, []);

  // Set focus and select text on the input textarea after client is set
  useEffect(() => {
    if (isClient && inputTextareaRef.current) {
      inputTextareaRef.current.focus();
      inputTextareaRef.current.select();
    }
  }, [isClient]);

  // Function to process text
  const processText = (text: string): string => {
    const inlineRegex = /\\\(\s*(.*?)\s*\\\)/gs;
    const displayRegex = /\\\[\s*(.*?)\s*\\\]/gs;

    let result = text.replace(
      inlineRegex,
      (_: string, p1: string) => `$${p1}$`
    );
    result = result.replace(
      displayRegex,
      (_: string, p1: string) => `$$${p1}$$`
    );

    return result;
  };

  // Handler to process text and copy to clipboard
  const handleProcessAndCopy = useCallback(async (): Promise<void> => {
    const result = processText(inputText);
    setModifiedText(result);

    if (isClient) {
      try {
        await navigator.clipboard.writeText(result);
        setNotification("Text verarbeitet und in die Zwischenablage kopiert!");
      } catch (err: unknown) {
        if (err instanceof Error) {
          setNotification(`Fehler beim Kopieren: ${err.message}`);
        } else {
          setNotification("Unbekannter Fehler beim Kopieren.");
        }
      }
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    } else {
      setNotification(
        "Zwischenablagefunktion ist auf dem Server nicht verfügbar."
      );
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  }, [inputText, isClient]);

  // Handler to close the notification
  const handleCloseNotification = useCallback((): void => {
    setShowNotification(false);
  }, []);

  // Synchronized scrolling for input and preview
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

      const textareaScrollHeight =
        textarea.scrollHeight - textarea.clientHeight;
      const scrollPercentage =
        textareaScrollHeight > 0
          ? textarea.scrollTop / textareaScrollHeight
          : 0;

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

      const textareaScrollHeight =
        textarea.scrollHeight - textarea.clientHeight;
      textarea.scrollTop = scrollPercentage * textareaScrollHeight;
    };

    textarea.addEventListener("scroll", handleTextareaScroll);
    preview.addEventListener("scroll", handlePreviewScroll);

    return () => {
      textarea.removeEventListener("scroll", handleTextareaScroll);
      preview.removeEventListener("scroll", handlePreviewScroll);
    };
  }, []);

  // Synchronized scrolling for modified text and preview
  useEffect(() => {
    if (!modifiedText) return; // Only set if modified text exists

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

      const textareaScrollHeight =
        textarea.scrollHeight - textarea.clientHeight;
      const scrollPercentage =
        textareaScrollHeight > 0
          ? textarea.scrollTop / textareaScrollHeight
          : 0;

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

      const textareaScrollHeight =
        textarea.scrollHeight - textarea.clientHeight;
      textarea.scrollTop = scrollPercentage * textareaScrollHeight;
    };

    textarea.addEventListener("scroll", handleTextareaScroll);
    preview.addEventListener("scroll", handlePreviewScroll);

    return () => {
      textarea.removeEventListener("scroll", handleTextareaScroll);
      preview.removeEventListener("scroll", handlePreviewScroll);
    };
  }, [modifiedText]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut for "Process and Copy Text"
      // For Mac: Meta (⌘) + Enter
      // For Others: Ctrl + Enter
      if (
        (isMac && e.metaKey && e.key === "Enter") ||
        (!isMac && e.ctrlKey && e.key === "Enter")
      ) {
        e.preventDefault();
        handleProcessAndCopy();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleProcessAndCopy, isMac]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-800 dark:to-black flex flex-col justify-center items-center overflow-y-hidden text-black dark:text-white transition-colors duration-300 relative p-4">
      {/* Notification Banner */}
      <div
        className={`fixed top-0 left-0 w-full bg-green-500 text-white px-4 py-2 shadow-md flex items-center justify-between transition-opacity duration-500 ${
          showNotification ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <span>{notification}</span>
        <button
          className="text-white font-bold px-2"
          onClick={handleCloseNotification}
        >
          ×
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-5xl bg-white dark:bg-gray-900 rounded-lg shadow-md p-8 flex flex-col">
        {/* Header */}
        <h1 className="text-3xl font-extrabold text-center text-blue-600 dark:text-blue-400 mb-8">
          LaTeX Environment Replacer
        </h1>

        {/* Input and Preview */}
        <div className="flex flex-col md:flex-row gap-8 flex-grow">
          {/* Input Textarea */}
          <textarea
            ref={inputTextareaRef}
            className="w-full md:w-1/2 p-4 border border-blue-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-black dark:text-white resize-y overflow-auto max-h-96 min-h-40"
            placeholder="Enter your text here..."
            value={inputText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInputText(e.target.value)
            }
            rows={10}
          ></textarea>

          {/* Markdown Preview */}
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

        {/* Process Text and Copy Button */}
        <div className="flex justify-center mt-6">
          <button
            className="bg-blue-600 dark:bg-blue-500 text-white font-semibold px-6 py-3 rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 transition duration-300"
            onClick={handleProcessAndCopy}
          >
            Process Text & Copy
          </button>
        </div>

        {/* Modified Text Section */}
        {modifiedText && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">
              Modified Text
            </h2>
            <div className="flex flex-col md:flex-row gap-8">
              {/* Modified Textarea */}
              <textarea
                ref={modifiedTextareaRef}
                className="w-full md:w-1/2 p-4 border border-green-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-800 text-black dark:text-white resize-y overflow-auto max-h-96 min-h-40"
                value={modifiedText}
                readOnly
                onChange={() => {}}
                rows={10}
              ></textarea>

              {/* Modified Markdown Preview */}
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
          </div>
        )}
      </div>

      {/* Shortcuts Display */}
      <div className="mt-6 w-full max-w-5xl bg-white dark:bg-gray-900 rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">
          Shortcuts
        </h3>
        <ul className="list-disc list-inside text-text-light dark:text-text-dark">
          {isMac ? (
            <li>
              <kbd className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">
                ⌘
              </kbd>{" "}
              +{" "}
              <kbd className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">
                Enter
              </kbd>
              : Process and Copy Text
            </li>
          ) : (
            <li>
              <kbd className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">
                Ctrl
              </kbd>{" "}
              +{" "}
              <kbd className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">
                Enter
              </kbd>
              : Process and Copy Text
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Home;
