"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css"; // Für mathematische Formatierungen

// Definiere ein benutzerdefiniertes Interface für die Code-Komponente
interface CustomCodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
  children?: React.ReactNode; // Mach Kinder optional, um mit erwarteten Typen übereinzustimmen
  className?: string;
}

// Definiere den Typ für Markdown-Komponenten
const markdownComponents: Components = {
  // Hier kannst du die gewünschten Markdown-Komponenten anpassen
  // Zum Beispiel:
  h1: ({ ...props }) => (
    <h1 className="text-3xl font-bold text-primary dark:text-primary-dark my-4" {...props} />
  ),
  // Weitere Anpassungen hier...
};

// Hilfsfunktionen zum Lesen und Schreiben von Cookies
const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";").map((c) => c.trim());
  for (const c of ca) {
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
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
  document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/";
};

const QuotePrependPage: React.FC = () => {
  // State-Hooks mit expliziten Typen
  const [inputText, setInputText] = useState<string>("");
  const [isClient, setIsClient] = useState<boolean>(false);
  const [notification, setNotification] = useState<string>("");
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [isMac, setIsMac] = useState<boolean>(false); // Zustand zur Erkennung, ob der Benutzer ein Mac verwendet
  const [useTwoButtons, setUseTwoButtons] = useState<boolean>(false); // Zustand für Checkbox

  // Refs mit präzisen Typen
  const inputTextareaRef = useRef<HTMLTextAreaElement>(null);
  const inputPreviewRef = useRef<HTMLDivElement>(null);

  // Initialisiere Client-Zustand, OS-Erkennung und lade Checkbox-Zustand aus Cookies
  useEffect(() => {
    setIsClient(true);
    const platform = navigator.platform.toLowerCase();
    setIsMac(platform.includes("mac"));

    // Initialisiere useTwoButtons aus Cookies (Standard: false)
    const useTwoButtonsCookie = getCookie("useTwoButtons");
    if (useTwoButtonsCookie) {
      setUseTwoButtons(useTwoButtonsCookie === "true");
    }
  }, []);

  // Setze Fokus und wähle Text im Eingabe-Textarea nach dem Setzen des Clients
  useEffect(() => {
    if (isClient && inputTextareaRef.current) {
      inputTextareaRef.current.focus();
      inputTextareaRef.current.select();
    }
  }, [isClient]);

  // Funktion zum Verarbeiten des Textes: Vor jede Zeile ein ">"
  const processText = (text: string): string => {
    return text
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
  };

  // Handler zum Verarbeiten des Textes
  const handleProcess = useCallback((): void => {
    const result = processText(inputText);
    navigator.clipboard
      .writeText(result)
      .then(() => {
        setNotification("Text erfolgreich verarbeitet und in die Zwischenablage kopiert!");
        setShowNotification(true);
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      })
      .catch((err: unknown) => {
        if (err instanceof Error) {
          setNotification(`Kopieren fehlgeschlagen: ${err.message}`);
        } else {
          setNotification("Unbekannter Fehler beim Kopieren.");
        }
        setShowNotification(true);
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      });
  }, [inputText]);

  // Handler zum Kopieren des verarbeiteten Textes in die Zwischenablage
  const handleCopy = useCallback(async (): Promise<void> => {
    const result = processText(inputText);
    if (isClient) {
      try {
        await navigator.clipboard.writeText(result);
        setNotification("Text in die Zwischenablage kopiert!");
      } catch (err: unknown) {
        if (err instanceof Error) {
          setNotification(`Kopieren fehlgeschlagen: ${err.message}`);
        } else {
          setNotification("Unbekannter Fehler beim Kopieren.");
        }
      }
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    } else {
      setNotification("Zwischenablagefunktion ist auf dem Server nicht verfügbar.");
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  }, [isClient, inputText]);

  // Handler zum Schließen der Benachrichtigung
  const handleCloseNotification = useCallback((): void => {
    setShowNotification(false);
  }, []);

  // Handler für Checkbox-Änderung
  const handleCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const checked = e.target.checked;
      setUseTwoButtons(checked);
      setCookie("useTwoButtons", checked.toString(), 365); // Speichern für 1 Jahr
    },
    []
  );

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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut für "Verarbeiten und Kopieren"
      // Für Mac: Meta (⌘) + Enter
      // Für andere: Ctrl + Enter
      if (
        (isMac && e.metaKey && e.key === "Enter") ||
        (!isMac && e.ctrlKey && e.key === "Enter")
      ) {
        e.preventDefault();
        if (useTwoButtons) {
          handleProcess();
        } else {
          handleProcess(); // Im Ein-Knopf-Modus dasselbe wie handleProcess
        }
      }

      // Zusätzlicher Shortcut für "Kopieren" bei zwei Buttons
      if (useTwoButtons) {
        // Für Mac: Command (⌘) + C
        // Für andere: Ctrl + C
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
          Zeilen mit "{">"}" Präfix hinzufügen
        </h1>

        {/* Input und Vorschau */}
        <div className="flex flex-col md:flex-row gap-8 flex-grow">
          {/* Eingabe-Textarea */}
          <textarea
            ref={inputTextareaRef}
            className="w-full md:w-1/2 p-4 border border-blue-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-black dark:text-white resize-y overflow-auto max-h-96 min-h-40"
            placeholder="Gib deinen Text hier ein..."
            value={inputText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInputText(e.target.value)
            }
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

        {/* Buttons Bereich */}
        <div className="mt-6 w-full flex flex-col items-center">
          {/* Buttons */}
          <div className="flex justify-center space-x-4 mb-2">
            {useTwoButtons ? (
              <>
                <button
                  className="bg-blue-600 dark:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={handleProcess}
                >
                  Text Verarbeiten
                </button>
                <button
                  className="bg-green-600 dark:bg-green-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  onClick={handleCopy}
                >
                  In Zwischenablage Kopieren
                </button>
              </>
            ) : (
              <button
                className="bg-purple-600 dark:bg-purple-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                onClick={handleProcess}
              >
                Verarbeiten & Kopieren
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Checkbox und Beschreibung */}
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
            Zwei Buttons anzeigen
          </label>
        </div>
        <p className="text-md text-gray-600 dark:text-gray-400">
          Aktiviere diese Option, um separate Buttons für das Verarbeiten und Kopieren des
          Textes zu haben. Wenn deaktiviert, führt ein einzelner Button beide Aktionen
          gleichzeitig aus. Diese Einstellung wird in deinem Browser gespeichert.
        </p>
      </div>

      {/* Shortcuts Anzeige */}
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
                    : Text Verarbeiten
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
                    : Text Verarbeiten
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
                    : In Zwischenablage Kopieren
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
                    : In Zwischenablage Kopieren
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
                  : Text Verarbeiten & Kopieren
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
                  : Text Verarbeiten & Kopieren
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
