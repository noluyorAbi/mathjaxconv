"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Download, RefreshCw, Volume2, Camera } from "lucide-react";
import { quotes } from "../../lib/quotes";
import { fallbackBackgrounds } from "./fallback-bakgrounds";

export default function QuoteWallpaper() {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [background, setBackground] = useState({
    url: "",
    photographer: "",
    photographerUrl: "",
  });

  const currentQuote = quotes[currentQuoteIndex];

  // Fetch a random image from Unsplash API or use fallback
  const fetchRandomImage = async () => {
    try {
      setIsLoading(true);

      // Fetch a random dark, mysterious image
      const response = await fetch("/api/motivation");

      if (!response.ok) {
        console.error(`API response error: ${response.status}`);
        throw new Error("Failed to fetch image");
      }

      const data = await response.json();

      // Check if we got valid data
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
      // Use one of our fallback backgrounds
      const fallback =
        fallbackBackgrounds[
          Math.floor(Math.random() * fallbackBackgrounds.length)
        ];
      setBackground(fallback);
    } finally {
      // Always finish loading after a delay for smooth transition
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  // Change quote and background
  const changeQuote = () => {
    setIsLoading(true);

    // Get random quote index that's different from current
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

  // Download current wallpaper
  const downloadWallpaper = () => {
    // In a real app, this would create a composite image with the quote and background
    // For now, we'll just open the image in a new tab
    if (background.url) {
      window.open(background.url, "_blank");
    }
  };

  // Change quote automatically every 45 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      changeQuote();
    }, 45000);

    return () => clearInterval(interval);
  }, [currentQuoteIndex]);

  // Initial load
  useEffect(() => {
    setCurrentQuoteIndex(Math.floor(Math.random() * quotes.length));
    fetchRandomImage();
  }, []);

  // Add this useEffect to handle background image loading errors
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
    <main
      className="min-h-screen flex flex-col items-center justify-center p-4 transition-all duration-1000 ease-in-out"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.7)), url('${background.url}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        opacity: isLoading ? 0 : 1,
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center px-4 py-16">
        <blockquote
          className="mb-12 transition-all duration-700 ease-in-out"
          style={{
            opacity: isLoading ? 0 : 1,
            transform: isLoading ? "translateY(10px)" : "translateY(0)",
          }}
        >
          <p className="text-2xl md:text-3xl lg:text-4xl font-light text-white/90 leading-relaxed tracking-wide mb-8 text-center">
            "{currentQuote.text}"
          </p>
          <footer className="text-base md:text-lg text-white/60 text-center font-light tracking-wider">
            {currentQuote.author}
          </footer>
        </blockquote>

        <div
          className={`flex justify-center gap-6 mt-8 transition-opacity duration-500 ${
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
            className="text-white/50 hover:text-white/90 transition-colors duration-300 bg-transparent p-2 rounded-full hover:bg-black/20"
            onClick={downloadWallpaper}
            aria-label="Download Wallpaper"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        className={`fixed bottom-6 right-6 z-20 transition-opacity duration-500 ${
          showControls ? "opacity-70" : "opacity-0"
        }`}
      >
        <button
          onClick={changeQuote}
          className="text-white/50 hover:text-white/90 transition-colors duration-300 bg-transparent px-3 py-2 rounded-full hover:bg-black/20 flex items-center"
        >
          <span className="mr-2 text-sm font-light">Next</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div
        className={`fixed bottom-6 left-6 z-20 text-xs text-white/30 transition-opacity duration-500 ${
          showControls ? "opacity-50" : "opacity-0"
        }`}
      >
        {currentQuoteIndex + 1}/{quotes.length}
      </div>

      {background.photographer && (
        <a
          href={background.photographerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20 text-xs text-white/30 flex items-center gap-1 transition-opacity duration-500 hover:text-white/60 ${
            showControls ? "opacity-50" : "opacity-0"
          }`}
        >
          <Camera className="h-3 w-3" />
          <span>Photo by {background.photographer} on Unsplash</span>
        </a>
      )}
    </main>
  );
}
