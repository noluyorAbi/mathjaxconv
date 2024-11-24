"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [modifiedText, setModifiedText] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [notification, setNotification] = useState("");
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const processText = (text: string) => {
    const inlineRegex = /\\\(\s*(.*?)\s*\\\)/gs;
    const displayRegex = /\\\[\s*(.*?)\s*\\\]/gs;

    let result = text.replace(inlineRegex, (_, p1) => `$${p1}$`);
    result = result.replace(displayRegex, (_, p1) => `$$${p1}$$`);

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
        setNotification("Text copied to clipboard!");
        setShowNotification(true);
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      } catch (err) {
        setNotification("Failed to copy text: " + err);
        setShowNotification(true);
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      }
    } else {
      setNotification(
        "Clipboard functionality is not available on the server."
      );
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  };

  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-800 dark:to-black flex flex-col items-center py-10 text-black dark:text-white">
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
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-extrabold text-center text-blue-600 dark:text-blue-400 mb-8">
          LaTeX Environment Replacer
        </h1>
        <textarea
          className="w-full h-40 p-4 border border-blue-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 mb-6 bg-white dark:bg-gray-800 text-black dark:text-white"
          placeholder="Enter your text here..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        ></textarea>
        <div className="flex justify-center">
          <button
            className="bg-blue-600 dark:bg-blue-500 text-white font-semibold px-6 py-3 rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 transition duration-300"
            onClick={handleProcess}
          >
            Process Text
          </button>
        </div>
        {modifiedText && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">
              Modified Text
            </h2>
            <textarea
              className="w-full h-40 p-4 border border-green-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 mb-4 bg-white dark:bg-gray-800 text-black dark:text-white"
              value={modifiedText}
              readOnly
            ></textarea>
            <div className="flex justify-center">
              <button
                className="bg-green-600 dark:bg-green-500 text-white font-semibold px-6 py-3 rounded-full hover:bg-green-700 dark:hover:bg-green-600 transition duration-300"
                onClick={handleCopy}
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
