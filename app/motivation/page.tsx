"use client";

import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import html2canvas from "html2canvas";
import {
  ArrowRight,
  Download,
  RefreshCw,
  Volume2,
  Camera,
  Maximize,
  Minimize,
  ImageOff,
} from "lucide-react";

// Your fallback quotes
import { quotes as fallbackQuotes } from "../../lib/quotes";

// Fallback backgrounds
import { fallbackBackgrounds } from "./fallback-bakgrounds";

export default function QuoteWallpaper() {
  const containerRef = useRef<HTMLDivElement>(null);

  // The current quote to display (from either API or fallback)
  const [quote, setQuote] = useState({ text: "", author: "" });

  // Tracks if we should fetch next quote from API or fallback
  const [useApiNext, setUseApiNext] = useState(true);

  // Loading & UI states
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);

  // Background crossfade
  const [background, setBackground] = useState({
    url: "",
    photographer: "",
    photographerUrl: "",
  });
  const [prevBackgroundUrl, setPrevBackgroundUrl] = useState("");

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Toggle "turn off" the background images
  const [isBackgroundOff, setIsBackgroundOff] = useState(false);

  /************************************************
   * Fetch Quote from ZenQuotes, fallback on error
   ************************************************/
  const fetchZenQuote = async () => {
    try {
      const response = await fetch("/api/zenquotes");
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();

      // data is usually [{ q: "...", a: "..." }]
      if (!Array.isArray(data) || !data[0] || !data[0].q) {
        throw new Error("Invalid data from ZenQuotes");
      }

      // Use the API quote
      setQuote({
        text: data[0].q,
        author: data[0].a || "Unknown",
      });
    } catch (error) {
      console.error("ZenQuotes error, using local fallback:", error);
      // If API fails, pick from fallback anyway
      const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
      setQuote({
        text: fallbackQuotes[randomIndex].text,
        author: fallbackQuotes[randomIndex].author,
      });
    }
  };

  /************************************************
   * Fetch Random Background Image (Unsplash or fallback)
   ************************************************/
  const fetchRandomImage = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/motivation");
      if (!response.ok) {
        console.error(`API response error: ${response.status}`);
        throw new Error("Failed to fetch image");
      }
      const data = await response.json();
      if (!data.url) {
        throw new Error("Invalid image data received");
      }

      setBackground({
        url: data.url,
        photographer: data.photographer || "Unknown",
        photographerUrl: data.photographerUrl || "#",
      });
    } catch (error) {
      console.error("Error fetching image:", error);
      // Use fallback backgrounds
      const fallback =
        fallbackBackgrounds[
        Math.floor(Math.random() * fallbackBackgrounds.length)
        ];
      setBackground(fallback);
    } finally {
      // Delay a bit longer for crossfade
      setTimeout(() => {
        setIsLoading(false);
      }, 700);
    }
  };

  /************************************************
   * changeQuote(): Alternate between API & local
   ************************************************/
  const changeQuote = () => {
    // Prepare crossfade for background
    setPrevBackgroundUrl(background.url);
    setIsLoading(true);

    // Check if we should fetch from API or from local quotes
    if (useApiNext) {
      // Attempt API quote (and fallback on error)
      fetchZenQuote();
    } else {
      // Force a local quote
      const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
      setQuote({
        text: fallbackQuotes[randomIndex].text,
        author: fallbackQuotes[randomIndex].author,
      });
    }

    // Flip for next time
    setUseApiNext(!useApiNext);

    // Always fetch a new background
    fetchRandomImage();
  };

  /************************************************
   * Text-to-speech (Epic voice version)
   ************************************************/
  const speakQuote = () => {
    if (!("speechSynthesis" in window)) {
      console.error("Text-to-speech not supported in this browser");
      return;
    }
    window.speechSynthesis.cancel();

    const speakWithEpicVoice = () => {
      const voices = window.speechSynthesis.getVoices();

      // Attempt to find a deep, epic-sounding male voice
      const epicVoice =
        voices.find(
          (voice) => voice.lang === "en-US" && voice.name.includes("Male")
        ) ||
        voices.find(
          (voice) =>
            voice.lang.startsWith("en") &&
            (voice.name.includes("Deep") || voice.name.includes("Male"))
        ) ||
        voices.find((voice) => voice.lang.startsWith("en")) ||
        voices[0]; // Fallback

      // Create the quote utterance
      const quoteUtterance = new SpeechSynthesisUtterance(quote.text);
      if (epicVoice) quoteUtterance.voice = epicVoice;
      quoteUtterance.rate = 0.8; // slower for dramatic effect
      quoteUtterance.pitch = 0.85; // deeper
      quoteUtterance.volume = 1.0; // full volume

      quoteUtterance.onend = () => {
        // Dramatic pause, then read the author
        setTimeout(() => {
          const authorUtterance = new SpeechSynthesisUtterance(
            "Quote from. " + quote.author
          );
          if (epicVoice) authorUtterance.voice = epicVoice;
          authorUtterance.rate = 0.75;
          authorUtterance.pitch = 0.85;
          authorUtterance.volume = 1.0;
          window.speechSynthesis.speak(authorUtterance);
        }, 800);
      };

      window.speechSynthesis.speak(quoteUtterance);
    };

    // Some browsers need "voiceschanged" event first
    if (window.speechSynthesis.getVoices().length) {
      speakWithEpicVoice();
    } else {
      window.speechSynthesis.addEventListener(
        "voiceschanged",
        function voicesChangedHandler() {
          speakWithEpicVoice();
          window.speechSynthesis.removeEventListener(
            "voiceschanged",
            voicesChangedHandler
          );
        }
      );
    }
  };

  /************************************************
   * Download the wallpaper (with watermark)
   ************************************************/
  const downloadWallpaper = async () => {
    if (!containerRef.current) return;

    // Watermark element
    // Watermark element
    const watermark = document.createElement("div");
    watermark.innerHTML =
      "<span style='opacity: 0.8'>Daily Motivation</span> • <span style='opacity: 0.5'>tools.adatepe.dev</span>";
    watermark.style.position = "absolute";
    watermark.style.bottom = "30px";
    watermark.style.left = "50%";
    watermark.style.transform = "translateX(-50%)";
    watermark.style.color = "rgba(255, 255, 255, 0.9)";
    watermark.style.fontSize = "14px";
    watermark.style.fontWeight = "300";
    watermark.style.letterSpacing = "1px";
    watermark.style.fontFamily = "'Inter', sans-serif";
    watermark.style.textShadow = "0 2px 4px rgba(0,0,0,0.5)";
    watermark.style.pointerEvents = "none";
    watermark.style.zIndex = "50";
    containerRef.current.appendChild(watermark);

    // Capture container
    const canvas = await html2canvas(containerRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      ignoreElements: (el) => el.classList.contains("no-screenshot"),
    });

    // Remove watermark
    containerRef.current.removeChild(watermark);

    // Download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "quote_wallpaper.png";
        link.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  /************************************************
   * Fullscreen toggling
   ************************************************/
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error enabling full-screen mode:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  /************************************************
   * Automatically update the quote & background
   * every 90 seconds (1.5 minutes)
   ************************************************/
  useEffect(() => {
    const interval = setInterval(() => {
      changeQuote();
    }, 90000);
    return () => clearInterval(interval);
  }, []);

  /************************************************
   * Initial Load: fetch first quote & background
   ************************************************/
  useEffect(() => {
    changeQuote();
  }, []);

  /************************************************
   * Handle background image loading errors
   ************************************************/
  useEffect(() => {
    if (!background.url) return;
    const img = new Image();
    img.src = background.url;
    img.onerror = () => {
      console.error("Failed to load background image, using fallback");
      setBackground({
        url: `/placeholder.svg?height=1080&width=1920&text=Inspirational+Quote&bg=111111`,
        photographer: "",
        photographerUrl: "",
      });
    };
  }, [background.url]);

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Playfair+Display:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <main
        ref={containerRef}
        className="min-h-screen relative flex flex-col items-center justify-center p-4 transition-all duration-1500 ease-out"
        style={{
          fontFamily: "'Inter', sans-serif",
          backgroundColor: isBackgroundOff ? "#000" : "transparent",
        }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Background crossfade layers */}
        {!isBackgroundOff && (
          <div className="absolute inset-0 z-0">
            {/* Previous background crossfade */}
            {prevBackgroundUrl && (
              <div
                className="absolute inset-0 transition-opacity duration-1500 ease-in-out"
                style={{ opacity: isLoading ? 1 : 0 }}
              >
                <img
                  src={prevBackgroundUrl}
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                  alt="Previous Background"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,0.75), rgba(0,0,0,0.7))",
                  }}
                ></div>
              </div>
            )}

            {/* Current background crossfade */}
            <div
              className="absolute inset-0 transition-opacity duration-1500 ease-in-out"
              style={{ opacity: isLoading ? 0 : 1 }}
            >
              {background.url ? (
                <img
                  src={background.url}
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                  alt="Current Background"
                />
              ) : null}

              {/* Dark gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.75), rgba(0,0,0,0.7))",
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Quote Container */}
        <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center justify-center px-4 py-16">
          <blockquote
            className="mb-12 transition-all duration-1000 ease-out"
            style={{
              opacity: isLoading ? 0 : 1,
              transform: isLoading ? "translateY(10px)" : "translateY(0)",
              fontFamily: "'Playfair Display', serif",
            }}
          >
            <p className="text-3xl md:text-4xl lg:text-5xl font-light text-white/90 leading-relaxed tracking-wide mb-8 text-center">
              "{quote.text}"
            </p>
            <footer className="text-lg md:text-xl text-white/60 text-center font-light tracking-wider">
              {quote.author}
            </footer>
          </blockquote>

          {/* Control buttons */}
          <div
            className={`flex justify-center gap-6 mt-8 transition-opacity duration-700 no-screenshot ${showControls ? "opacity-70" : "opacity-0"
              }`}
          >
            {/* New Quote */}
            <button
              onClick={changeQuote}
              className="text-white/50 hover:text-white/90 transition-colors duration-300 bg-transparent p-2 rounded-full hover:bg-black/20"
              aria-label="New Quote"
            >
              <RefreshCw className="h-5 w-5" />
            </button>

            {/* Speak Quote */}
            <button
              onClick={speakQuote}
              className="text-white/50 hover:text-white/90 transition-colors duration-300 bg-transparent p-2 rounded-full hover:bg-black/20"
              aria-label="Speak Quote"
            >
              <Volume2 className="h-5 w-5" />
            </button>

            {/* Download Wallpaper */}
            <button
              onClick={downloadWallpaper}
              className="text-white/50 hover:text-white/90 transition-colors duration-300 bg-transparent p-2 rounded-full hover:bg-black/20"
              aria-label="Download Wallpaper"
            >
              <Download className="h-5 w-5" />
            </button>

            {/* Toggle Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white/50 hover:text-white/90 transition-colors duration-300 bg-transparent p-2 rounded-full hover:bg-black/20"
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </button>

            {/* Background Toggle */}
            <button
              onClick={() => setIsBackgroundOff(!isBackgroundOff)}
              className="text-white/50 hover:text-white/90 transition-colors duration-300 bg-transparent p-2 rounded-full hover:bg-black/20"
              aria-label="Toggle Background"
            >
              <ImageOff className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Next Quote Button */}
        <div
          className={`fixed bottom-6 right-6 z-20 transition-opacity duration-700 no-screenshot ${showControls ? "opacity-70" : "opacity-0"
            }`}
        >
          <button
            onClick={changeQuote}
            className="text-white/50 hover:text-white/90 transition-colors duration-300 bg-transparent px-3 py-2 rounded-full hover:bg-black/20 flex items-center"
            aria-label="Next Quote"
          >
            <span className="mr-2 text-sm font-light">Next</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Photo credit (only if background is ON and there's a photographer) */}
        {background.photographer && !isBackgroundOff && (
          <a
            href={background.photographerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20 text-xs text-white/30 flex items-center gap-1 transition-opacity duration-700 hover:text-white/60 no-screenshot ${showControls ? "opacity-50" : "opacity-0"
              }`}
          >
            <Camera className="h-3 w-3" />
            <span>Photo by {background.photographer} on Unsplash</span>
          </a>
        )}
      </main>
    </>
  );
}
