"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export default function StopwatchPage() {
  const [time, setTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Formats seconds into "hh:mm:ss"
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${secs}`;
  };

  const handleStart = () => {
    if (isRunning) return;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);
  };

  const handlePause = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
  };

  const handleReset = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    setTime(0);
  };

  // Cleanup the interval when the component unmounts
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      {/* Fullscreen Timer Display */}
      <div className="text-9xl font-mono transition-all duration-300 ease-in-out mb-12 dark:text-white">
        {formatTime(time)}
      </div>

      {/* Control Buttons */}
      <div className="flex space-x-4">
        <Button
          onClick={handleStart}
          disabled={isRunning}
          className="bg-green-500 hover:bg-green-600"
        >
          Start
        </Button>
        <Button
          onClick={handlePause}
          disabled={!isRunning}
          className="bg-yellow-500 hover:bg-yellow-600"
        >
          Pause
        </Button>
        <Button onClick={handleReset} className="bg-red-500 hover:bg-red-600">
          Reset
        </Button>
      </div>
    </div>
  );
}
