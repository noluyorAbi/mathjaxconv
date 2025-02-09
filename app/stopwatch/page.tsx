"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// -------------------------------------------------------
// Unsupported Modal Component
// -------------------------------------------------------
type UnsupportedModalProps = {
  onClose: () => void;
};

function UnsupportedModal({ onClose }: UnsupportedModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black opacity-50"></div>
      {/* Modal content */}
      <div className="bg-white rounded-lg shadow-lg p-6 z-10 max-w-md w-full">
        <h2 className="text-xl text-black font-semibold mb-4">
          Picture-in-Picture Unavailable
        </h2>
        <p className="text-gray-700 mb-6">
          Your browser does not support Picture-in-Picture for canvas capture
          streams. Please use a supported browser.
        </p>
        <div className="flex justify-end">
          <Button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Stopwatch with Picture-in-Picture
// -------------------------------------------------------
export default function StopwatchPage() {
  // Stopwatch states (time is measured in milliseconds)
  const [time, setTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [showMilliseconds, setShowMilliseconds] = useState<boolean>(false);
  const [accumulatedTime, setAccumulatedTime] = useState<number>(0);

  // Controls hover state – to reveal hidden controls when the mouse is near
  const [controlsHovered, setControlsHovered] = useState<boolean>(false);

  // For PiP unsupported modal
  const [showUnsupportedModal, setShowUnsupportedModal] =
    useState<boolean>(false);

  // Refs for timing, canvas, and video elements
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  /**
   * Formats the elapsed time (in ms) into a string.
   * If showMilliseconds is true, the output includes milliseconds.
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

  // Start the stopwatch
  const handleStart = () => {
    if (isRunning) return;
    setIsRunning(true);
    startTimeRef.current = Date.now();
    intervalRef.current = window.setInterval(() => {
      if (startTimeRef.current !== null) {
        setTime(accumulatedTime + (Date.now() - startTimeRef.current));
      }
    }, 30); // Update every 30ms for smooth display
  };

  // Pause the stopwatch
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

  // Reset the stopwatch
  const handleReset = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    setTime(0);
    setAccumulatedTime(0);
    startTimeRef.current = null;
  };

  // Toggle the display of milliseconds
  const handleToggleMilliseconds = () => {
    setShowMilliseconds((prev) => !prev);
  };

  // -------------------------------------------------------
  // Picture-in-Picture Handler
  // -------------------------------------------------------
  const handlePictureInPicture = () => {
    if (!videoRef.current) return;

    // Check for Firefox (which may not support canvas PiP)
    const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");
    if (isFirefox) {
      setShowUnsupportedModal(true);
      return;
    }

    // Ensure the video is playing so that PiP can be requested
    videoRef.current
      .play()
      .catch((err) => console.error("Video play error:", err));

    try {
      if (videoRef.current.requestPictureInPicture) {
        videoRef.current
          .requestPictureInPicture()
          .catch((err) => console.error("PiP error:", err));
      } else if ((videoRef.current as any).webkitSetPresentationMode) {
        // For Safari
        (videoRef.current as any).webkitSetPresentationMode(
          "picture-in-picture"
        );
      } else {
        console.warn("Picture-in-Picture is not supported by this browser.");
      }
    } catch (error) {
      console.error("Error requesting PiP:", error);
    }
  };

  // -------------------------------------------------------
  // Draw the current time on the hidden canvas for PiP
  // -------------------------------------------------------
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const width = 300;
    const height = 150;
    canvasRef.current.width = width;
    canvasRef.current.height = height;

    // Clear the canvas with the specified background color
    ctx.fillStyle = "#2E3440";
    ctx.fillRect(0, 0, width, height);

    // Draw the current time (centered)
    ctx.font = "48px sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(formatTime(time), width / 2, height / 2);
  }, [time, showMilliseconds]);

  // -------------------------------------------------------
  // Set up the video element with the canvas stream for PiP
  // -------------------------------------------------------
  useEffect(() => {
    if (canvasRef.current && videoRef.current && !videoRef.current.srcObject) {
      const stream = canvasRef.current.captureStream();
      videoRef.current.srcObject = stream;
    }
  }, []);

  // Cleanup the interval when the component unmounts
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
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
        style={{ width: "100%", display: "flex", justifyContent: "center" }}
      >
        {/* Controls Container */}
        <div
          className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 transition-opacity duration-300"
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
          <Button
            onClick={handlePictureInPicture}
            className={`bg-indigo-600 hover:bg-indigo-700 ${
              isRunning && !controlsHovered ? "pointer-events-none" : ""
            }`}
          >
            Picture-in-Picture
          </Button>
        </div>
      </div>

      {/* Hidden canvas for PiP content */}
      <div style={{ display: "none" }}>
        <canvas ref={canvasRef} />
      </div>

      {/* Video element minimally visible for PiP */}
      <video
        ref={videoRef}
        playsInline
        style={{
          width: "1px",
          height: "1px",
          opacity: 0.01,
          position: "fixed",
          bottom: 0,
          right: 0,
          pointerEvents: "none",
        }}
      />

      {/* Render the unsupported modal if needed */}
      {showUnsupportedModal && (
        <UnsupportedModal onClose={() => setShowUnsupportedModal(false)} />
      )}
    </div>
  );
}
