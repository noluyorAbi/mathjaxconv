"use client";

import { useState, useEffect } from "react";

// Helper function to interpolate between two hex colors based on a factor (0 to 1)
function interpolateColor(color1: string, color2: string, factor: number): string {
  const hex = (x: number) => {
    const h = Math.round(x).toString(16);
    return h.length === 1 ? "0" + h : h;
  };

  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = r1 + (r2 - r1) * factor;
  const g = g1 + (g2 - g1) * factor;
  const b = b1 + (b2 - b1) * factor;

  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

type Mode = "black" | "white" | "sunlight";

export default function BlackWhiteScreen() {
  const [mode, setMode] = useState<Mode>("black");
  // For sunlight mode: slider value from 0 (cool) to 100 (warm)
  const [sunlightWarmth, setSunlightWarmth] = useState(50);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Cycle through modes: black → white → sunlight → black...
  const cycleMode = () => {
    setMode((prev) => {
      if (prev === "black") return "white";
      if (prev === "white") return "sunlight";
      return "black";
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Listen for fullscreen changes to update state accordingly
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Determine background color based on mode and sunlight warmth setting
  let backgroundColor = "#000000";
  if (mode === "black") {
    backgroundColor = "#000000";
  } else if (mode === "white") {
    backgroundColor = "#ffffff";
  } else if (mode === "sunlight") {
    // In sunlight mode, interpolate between cool daylight (pure white) and a warm white tone.
    const coolColor = "#ffffff";
    // Using a warm white tone (ivory) instead of a strong orange
    const warmColor = "#fffff0";
    backgroundColor = interpolateColor(coolColor, warmColor, sunlightWarmth / 100);
  }

  return (
    <div
      className="group relative min-h-screen flex items-center justify-center transition-colors duration-500"
      style={{ backgroundColor }}
    >
      {/* Controls appear on hover */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <button
          onClick={cycleMode}
          className="px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gray-800 text-white hover:bg-gray-700"
        >
          {mode === "black"
            ? "Switch to White"
            : mode === "white"
            ? "Switch to Sunlight"
            : "Switch to Black"}
        </button>

        {mode === "sunlight" && (
          <div className="flex flex-col">
            <label htmlFor="warmth" className="text-white text-xs mb-1">
              Adjust Warmth
            </label>
            <input
              id="warmth"
              type="range"
              min="0"
              max="100"
              value={sunlightWarmth}
              onChange={(e) => setSunlightWarmth(Number(e.target.value))}
              className="w-48"
            />
          </div>
        )}

        <button
          onClick={toggleFullscreen}
          className="px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gray-800 text-white hover:bg-gray-700"
        >
          {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        </button>
      </div>

      {/* Explanation text visible when controls are hidden */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-gray-500 text-xs transition-opacity duration-300 group-hover:opacity-0">
        Hover anywhere to reveal controls.
      </div>
    </div>
  );
}
