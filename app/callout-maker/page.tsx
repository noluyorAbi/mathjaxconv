"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css"; // For mathematical formatting

// Define the type for Markdown components
const markdownComponents: Components = {
  // You can customize the desired Markdown components here
  // For example:
  h1: ({ ...props }) => (
    <h1
      className="text-3xl font-bold text-primary dark:text-primary-dark my-4"
      {...props}
    />
  ),
  // More customizations here...
};

// Helper functions for reading and writing cookies
const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";").map((c) => c.trim());
  for (const c of ca) {
    if (c.indexOf(nameEQ) === 0)
      return decodeURIComponent(c.substring(nameEQ.length));
  }
  return null;
};

const setCookie = (name: string, value: string, days: number): void => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie =
    name + "=" + encodeURIComponent(value) + expires + "; path=/";
};

// Define available callout types
const calloutTypes = [
  { type: "info", title: "Info" },
  { type: "warning", title: "Warning" },
  { type: "note", title: "Note" },
  { type: "abstract", title: "Abstract" },
  { type: "todo", title: "Todo" },
  { type: "tip", title: "Tip" },
  { type: "success", title: "Success" },
  { type: "question", title: "Question" },
  { type: "failure", title: "Failure" },
  { type: "danger", title: "Danger" },
  { type: "bug", title: "Bug" },
  { type: "example", title: "Example" },
  { type: "quote", title: "Quote" },
];

const QuotePrependPage: React.FC = () => {
  // State hooks with explicit types
  const [inputText, setInputText] = useState<string>("");
  const [isClient, setIsClient] = useState<boolean>(false);
  const [notification, setNotification] = useState<string>("");
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [isMac, setIsMac] = useState<boolean>(false); // State to detect if the user is on a Mac
  const [useTwoButtons, setUseTwoButtons] = useState<boolean>(false); // State for checkbox
  const [selectedCallout, setSelectedCallout] = useState<string>("info"); // State for selected callout

  // Refs with precise types
  const inputTextareaRef = useRef<HTMLTextAreaElement>(null);
  const inputPreviewRef = useRef<HTMLDivElement>(null);

  // Initialize client state, OS detection, and load checkbox state from cookies
  useEffect(() => {
    setIsClient(true);
    const platform = navigator.platform.toLowerCase();
    setIsMac(platform.includes("mac"));

    // Initialize useTwoButtons from cookies (default: false)
    const useTwoButtonsCookie = getCookie("useTwoButtons");
    if (useTwoButtonsCookie) {
      setUseTwoButtons(useTwoButtonsCookie === "true");
    }

    // Initialize selectedCallout from cookies (default: 'info')
    const selectedCalloutCookie = getCookie("selectedCallout");
    if (selectedCalloutCookie) {
      setSelectedCallout(selectedCalloutCookie);
    }
  }, []);

  // Set focus and select text in the input textarea after setting the client
  useEffect(() => {
    if (isClient && inputTextareaRef.current) {
      inputTextareaRef.current.focus();
      inputTextareaRef.current.select();
    }
  }, [isClient]);

  // Function to process the text: prepend callout syntax
  const processText = (text: string): string => {
    const callout = calloutTypes.find((c) => c.type === selectedCallout);
    const calloutTitle = callout ? callout.title : "Info";
    return `> [!${selectedCallout}] ${calloutTitle}\n> \n> ${text
      .split("\n")
      .join("\n> ")}`;
  };

  // Handler to process the text
  const handleProcess = useCallback((): void => {
    const result = processText(inputText);
    navigator.clipboard
      .writeText(result)
      .then(() => {
        setNotification("Text successfully processed and copied to clipboard!");
        setShowNotification(true);
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      })
      .catch((err: unknown) => {
        if (err instanceof Error) {
          setNotification(`Copy failed: ${err.message}`);
        } else {
          setNotification("Unknown error occurred while copying.");
        }
        setShowNotification(true);
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      });
  }, [inputText, selectedCallout]);

  // Handler to copy the processed text to the clipboard
  const handleCopy = useCallback(async (): Promise<void> => {
    const result = processText(inputText);
    if (isClient) {
      try {
        await navigator.clipboard.writeText(result);
        setNotification("Text copied to clipboard!");
      } catch (err: unknown) {
        if (err instanceof Error) {
          setNotification(`Copy failed: ${err.message}`);
        } else {
          setNotification("Unknown error occurred while copying.");
        }
      }
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    } else {
      setNotification(
        "Clipboard functionality is not available on the server."
      );
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  }, [isClient, inputText, selectedCallout]);

  // Handler to close the notification
  const handleCloseNotification = useCallback((): void => {
    setShowNotification(false);
  }, []);

  // Handler for checkbox change
  const handleCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const checked = e.target.checked;
      setUseTwoButtons(checked);
      setCookie("useTwoButtons", checked.toString(), 365); // Save for 1 year
    },
    []
  );

  // Handler for callout type change
  const handleCalloutChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const selected = e.target.value;
      setSelectedCallout(selected);
      setCookie("selectedCallout", selected, 365); // Save for 1 year
    },
    []
  );

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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut for "Process and Copy"
      // For Mac: Meta (⌘) + Enter
      // For others: Ctrl + Enter
      if (
        (isMac && e.metaKey && e.key === "Enter") ||
        (!isMac && e.ctrlKey && e.key === "Enter")
      ) {
        e.preventDefault();
        if (useTwoButtons) {
          handleProcess();
        } else {
          handleProcess(); // In single-button mode same as handleProcess
        }
      }

      // Additional shortcut for "Copy" when using two buttons
      if (useTwoButtons) {
        // For Mac: Command (⌘) + C
        // For others: Ctrl + C
        if (
          (isMac && e.metaKey && e.key.toLowerCase() === "c") ||
          (!isMac && e.ctrlKey && e.key.toLowerCase() === "c")
        ) {
          e.preventDefault();
          handleCopy();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleProcess, handleCopy, isMac, useTwoButtons]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-800 dark:to-black flex flex-col justify-center items-center overflow-y-auto text-black dark:text-white transition-colors duration-300 relative p-4">
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
          Add Callout Prefix and Lines
        </h1>

        {/* Callout Selection */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Callout Type</h2>
          <div className="flex flex-wrap gap-4">
            {calloutTypes.map((callout) => (
              <label key={callout.type} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="calloutType"
                  value={callout.type}
                  checked={selectedCallout === callout.type}
                  onChange={handleCalloutChange}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-md font-medium capitalize">
                  {callout.title}
                </span>
              </label>
            ))}
          </div>
        </div>

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

        {/* Buttons Area */}
        <div className="mt-6 w-full flex flex-col items-center">
          {/* Buttons */}
          <div className="flex justify-center space-x-4 mb-2">
            {useTwoButtons ? (
              <>
                <button
                  className="bg-blue-600 dark:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={handleProcess}
                >
                  Process Text
                </button>
                <button
                  className="bg-green-600 dark:bg-green-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  onClick={handleCopy}
                >
                  Copy to Clipboard
                </button>
              </>
            ) : (
              <button
                className="bg-purple-600 dark:bg-purple-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                onClick={handleProcess}
              >
                Process & Copy
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Checkbox and Description */}
      <div className="mt-6 w-full max-w-5xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="buttonMode"
            checked={useTwoButtons}
            onChange={handleCheckboxChange}
            className="mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition duration-200 ease-in-out"
          />
          <label
            htmlFor="buttonMode"
            className="text-lg text-gray-800 dark:text-gray-200 font-medium cursor-pointer"
          >
            Show Two Buttons
          </label>
        </div>
        <p className="text-md text-gray-600 dark:text-gray-400">
          Enable this option to have separate buttons for processing and copying
          the text. When disabled, a single button performs both actions
          simultaneously. This setting is saved in your browser.
        </p>
      </div>

      {/* Shortcuts Display */}
      <div className="mt-6 w-full max-w-5xl bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
          Shortcuts
        </h3>
        <ul className="list-disc list-inside text-text-light dark:text-text-dark space-y-2">
          {useTwoButtons ? (
            <>
              <li>
                {isMac ? (
                  <>
                    <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      ⌘
                    </kbd>{" "}
                    +{" "}
                    <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      Enter
                    </kbd>
                    : Process Text
                  </>
                ) : (
                  <>
                    <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      Ctrl
                    </kbd>{" "}
                    +{" "}
                    <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      Enter
                    </kbd>
                    : Process Text
                  </>
                )}
              </li>
              <li>
                {isMac ? (
                  <>
                    <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      ⌘
                    </kbd>{" "}
                    +{" "}
                    <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      C
                    </kbd>
                    : Copy to Clipboard
                  </>
                ) : (
                  <>
                    <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      Ctrl
                    </kbd>{" "}
                    +{" "}
                    <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      C
                    </kbd>
                    : Copy to Clipboard
                  </>
                )}
              </li>
            </>
          ) : (
            <li>
              {isMac ? (
                <>
                  <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                    ⌘
                  </kbd>{" "}
                  +{" "}
                  <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                    Enter
                  </kbd>
                  : Process & Copy Text
                </>
              ) : (
                <>
                  <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                    Ctrl
                  </kbd>{" "}
                  +{" "}
                  <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                    Enter
                  </kbd>
                  : Process & Copy Text
                </>
              )}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default QuotePrependPage;
