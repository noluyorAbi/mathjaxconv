"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export default function StopwatchPage() {
  // Elapsed time in milliseconds.
  const [time, setTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  // Whether to show milliseconds.
  const [showMilliseconds, setShowMilliseconds] = useState<boolean>(false);
  // Time accumulated from previous runs (for pause/resume).
  const [accumulatedTime, setAccumulatedTime] = useState<number>(0);
  // Ref to hold the start time of the current run.
  const startTimeRef = useRef<number | null>(null);
  // Ref for the interval ID.
  const intervalRef = useRef<number | null>(null);
  // State to track whether the mouse is near the controls.
  const [controlsHovered, setControlsHovered] = useState<boolean>(false);

  /**
   * Formats the elapsed time (in ms) into a string.
   * If `showMilliseconds` is true, milliseconds are included.
   */
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");

    if (showMilliseconds) {
      const milliseconds = (ms % 1000).toString().padStart(3, "0");
      return `${hours}:${minutes}:${seconds}.${milliseconds}`;
    } else {
      return `${hours}:${minutes}:${seconds}`;
    }
  };

  /**
   * Starts the stopwatch by recording the start time and starting an interval.
   */
  const handleStart = () => {
    if (isRunning) return;
    setIsRunning(true);
    startTimeRef.current = Date.now();
    intervalRef.current = window.setInterval(() => {
      if (startTimeRef.current !== null) {
        setTime(accumulatedTime + (Date.now() - startTimeRef.current));
      }
    }, 30); // update every 30ms for smooth display
  };

  /**
   * Pauses the stopwatch by stopping the interval and accumulating elapsed time.
   */
  const handlePause = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (startTimeRef.current !== null) {
      setAccumulatedTime((prev) => prev + (Date.now() - startTimeRef.current!));
    }
    setIsRunning(false);
    startTimeRef.current = null;
  };

  /**
   * Resets the stopwatch completely.
   */
  const handleReset = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    setTime(0);
    setAccumulatedTime(0);
    startTimeRef.current = null;
  };

  /**
   * Toggles whether milliseconds are shown in the display.
   */
  const handleToggleMilliseconds = () => {
    setShowMilliseconds((prev) => !prev);
  };

  // Cleanup the interval when the component unmounts.
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      {/* Timer Display */}
      <div className="text-9xl font-mono transition-all duration-300 ease-in-out mb-12 dark:text-white">
        {formatTime(time)}
      </div>

      {/* Hover-Detection Wrapper for Controls */}
      <div
        onMouseEnter={() => setControlsHovered(true)}
        onMouseLeave={() => setControlsHovered(false)}
        className="relative"
        // The wrapper spans full width and centers its content.
        style={{ width: "100%", display: "flex", justifyContent: "center" }}
      >
        {/* Controls Container */}
        <div
          className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 transition-opacity duration-300"
          // If the stopwatch is running and the mouse isn’t near the controls, fade them out.
          style={{ opacity: isRunning && !controlsHovered ? 0 : 1 }}
        >
          <Button
            onClick={handleStart}
            disabled={isRunning}
            className={`bg-green-500 hover:bg-green-600 ${
              isRunning && !controlsHovered ? "pointer-events-none" : ""
            }`}
          >
            Start
          </Button>
          <Button
            onClick={handlePause}
            disabled={!isRunning}
            className={`bg-yellow-500 hover:bg-yellow-600 ${
              isRunning && !controlsHovered ? "pointer-events-none" : ""
            }`}
          >
            Pause
          </Button>
          <Button
            onClick={handleReset}
            className={`bg-red-500 hover:bg-red-600 ${
              isRunning && !controlsHovered ? "pointer-events-none" : ""
            }`}
          >
            Reset
          </Button>
          <Button
            onClick={handleToggleMilliseconds}
            className={`bg-blue-500 hover:bg-blue-600 ${
              isRunning && !controlsHovered ? "pointer-events-none" : ""
            }`}
          >
            {showMilliseconds ? "Hide Milliseconds" : "Show Milliseconds"}
          </Button>
        </div>
      </div>
    </div>
  );
}
