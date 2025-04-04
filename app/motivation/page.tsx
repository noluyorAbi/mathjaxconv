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
} from "lucide-react";
import { quotes } from "../../lib/quotes";
import { fallbackBackgrounds } from "./fallback-bakgrounds";

export default function QuoteWallpaper() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [background, setBackground] = useState({
    url: "",
    photographer: "",
    photographerUrl: "",
  });
  const [prevBackgroundUrl, setPrevBackgroundUrl] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentQuote = quotes[currentQuoteIndex];

  // Fetch a random image from the API or use a fallback
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
      const fallback =
        fallbackBackgrounds[
          Math.floor(Math.random() * fallbackBackgrounds.length)
        ];
      setBackground(fallback);
    } finally {
      // Delay a bit longer for the crossfade to work smoothly
      setTimeout(() => {
        setIsLoading(false);
      }, 700);
    }
  };

  // Change quote and background with crossfade effect
  const changeQuote = () => {
    // Save current background URL for crossfade
    setPrevBackgroundUrl(background.url);
    setIsLoading(true);
    let newQuoteIndex;
    do {
      newQuoteIndex = Math.floor(Math.random() * quotes.length);
    } while (newQuoteIndex === currentQuoteIndex && quotes.length > 1);
    setCurrentQuoteIndex(newQuoteIndex);
    fetchRandomImage();
  };

  // Text-to-speech functionality
  const speakQuote = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(
        `${currentQuote.text}. ${currentQuote.author}`
      );
      window.speechSynthesis.speak(utterance);
    }
  };

  // Download the entire container (image, quote, etc.) as an image with a watermark
  const downloadWallpaper = async () => {
    if (containerRef.current) {
      // Create watermark element
      const watermark = document.createElement("div");
      watermark.innerText = "tools.adatepe.dev/motivation";
      watermark.style.position = "absolute";
      watermark.style.bottom = "20px";
      watermark.style.left = "50%";
      watermark.style.transform = "translateX(-50%)";
      watermark.style.color = "white";
      watermark.style.fontSize = "16px";
      watermark.style.fontFamily = "'Inter', sans-serif";
      watermark.style.pointerEvents = "none";
      // Append watermark to the container
      containerRef.current.appendChild(watermark);

      // Capture the container with html2canvas
      const canvas = await html2canvas(containerRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: false,
        ignoreElements: (element) =>
          element.classList.contains("no-screenshot"),
      });

      // Remove the watermark after capture
      containerRef.current.removeChild(watermark);

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
    }
  };

  // Toggle Fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable full-screen mode:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Listen for fullscreen changes to update state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Automatically change quote every 90 seconds (40 times per hour)
  useEffect(() => {
    const interval = setInterval(() => {
      changeQuote();
    }, 90000);
    return () => clearInterval(interval);
  }, []);

  // Initial load
  useEffect(() => {
    setCurrentQuoteIndex(Math.floor(Math.random() * quotes.length));
    fetchRandomImage();
  }, []);

  // Handle background image loading errors
  useEffect(() => {
    if (background.url) {
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
    }
  }, [background.url]);

  return (
    <>
      <Head>
        {/* Import the Inter font for UI and Playfair Display for quotes */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Playfair+Display:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <main
        ref={containerRef}
        className="min-h-screen relative flex flex-col items-center justify-center p-4 transition-all duration-1500 ease-out"
        style={{ fontFamily: "'Inter', sans-serif" }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Background layers for crossfade using <img> elements */}
        <div className="absolute inset-0 z-0">
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
          <div
            className="absolute inset-0 transition-opacity duration-1500 ease-in-out"
            style={{ opacity: isLoading ? 0 : 1 }}
          >
            <img
              src={background.url}
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
              alt="Current Background"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.75), rgba(0,0,0,0.7))",
              }}
            ></div>
          </div>
        </div>

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
              "{currentQuote.text}"
            </p>
            <footer className="text-lg md:text-xl text-white/60 text-center font-light tracking-wider">
              {currentQuote.author}
            </footer>
          </blockquote>

          {/* Control buttons (excluded from screenshot via no-screenshot class) */}
          <div
            className={`flex justify-center gap-6 mt-8 transition-opacity duration-700 no-screenshot ${
              showControls ? "opacity-70" : "opacity-0"
            }`}
          >
            <button
              onClick={changeQuote}
              className="text-white/50 hover:text-white/90 transition-colors duration-300 bg-transparent p-2 rounded-full hover:bg-black/20"
              aria-label="New Quote"
            >
              <RefreshCw className="h-5 w-5" />
            </button>

            <button
              onClick={speakQuote}
              className="text-white/50 hover:text-white/90 transition-colors duration-300 bg-transparent p-2 rounded-full hover:bg-black/20"
              aria-label="Speak Quote"
            >
              <Volume2 className="h-5 w-5" />
            </button>

            <button
              onClick={downloadWallpaper}
              className="text-white/50 hover:text-white/90 transition-colors duration-300 bg-transparent p-2 rounded-full hover:bg-black/20"
              aria-label="Download Wallpaper"
            >
              <Download className="h-5 w-5" />
            </button>

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
          </div>
        </div>

        {/* Next button */}
        <div
          className={`fixed bottom-6 right-6 z-20 transition-opacity duration-700 no-screenshot ${
            showControls ? "opacity-70" : "opacity-0"
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

        {/* Quote counter */}
        <div
          className={`fixed bottom-6 left-6 z-20 text-xs text-white/30 transition-opacity duration-700 no-screenshot ${
            showControls ? "opacity-50" : "opacity-0"
          }`}
        >
          {currentQuoteIndex + 1}/{quotes.length}
        </div>

        {/* Photo credit */}
        {background.photographer && (
          <a
            href={background.photographerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20 text-xs text-white/30 flex items-center gap-1 transition-opacity duration-700 hover:text-white/60 no-screenshot ${
              showControls ? "opacity-50" : "opacity-0"
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
