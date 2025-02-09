"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// -------------------------------------------------------
// Types & Constants
// -------------------------------------------------------

type Phase = "work" | "break";

interface BreakPreset {
  label: string;
  duration: number; // in seconds
}

const WORK_DURATION = 90 * 60; // 1.5 hrs deep work

const BREAK_PRESETS: BreakPreset[] = [
  { label: "Quick Break (10 min)", duration: 10 * 60 },
  { label: "Extended Break (30 min)", duration: 30 * 60 },
];

// -------------------------------------------------------
// Utility Function
// -------------------------------------------------------

// Formats seconds into "hh:mm:ss"
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${secs}`;
}

// -------------------------------------------------------
// Presentational Components
// -------------------------------------------------------

type TimerDisplayProps = {
  phase: Phase;
  time: number;
  totalDuration: number;
};

function TimerDisplay({ phase, time, totalDuration }: TimerDisplayProps) {
  // Calculate progress as a percentage (0 = just started, 100 = completed)
  const progress = 100 - Math.floor((time / totalDuration) * 100);

  return (
    <div className="w-full max-w-md mx-auto mb-12 text-center">
      <div className="text-8xl font-mono transition-all duration-300 ease-in-out text-white">
        {formatTime(time)}
      </div>
      <div className="mt-4 text-2xl font-semibold text-white">
        {phase === "work" ? "Deep Work Session" : "Break Session"}
      </div>
      <div className="mt-6 w-full max-w-md mx-auto">
        {/* Styled progress bar with a dark background */}
        <Progress value={progress} className="h-4 rounded-full bg-gray-700" />
      </div>
    </div>
  );
}

type TimerControlsProps = {
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  isRunning: boolean;
};

function TimerControls({
  onStart,
  onPause,
  onReset,
  isRunning,
}: TimerControlsProps) {
  return (
    <div className="flex space-x-4 mb-12 justify-center">
      <Button
        onClick={onStart}
        disabled={isRunning}
        className="bg-green-600 hover:bg-green-700"
      >
        Start
      </Button>
      <Button
        onClick={onPause}
        disabled={!isRunning}
        className="bg-yellow-600 hover:bg-yellow-700"
      >
        Pause
      </Button>
      <Button onClick={onReset} className="bg-red-600 hover:bg-red-700">
        Reset
      </Button>
    </div>
  );
}

type BreakPresetSelectorProps = {
  presets: BreakPreset[];
  selectedPreset: BreakPreset;
  onSelect: (preset: BreakPreset) => void;
};

function BreakPresetSelector({
  presets,
  selectedPreset,
  onSelect,
}: BreakPresetSelectorProps) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold mb-4 text-white">
        Select Break Duration
      </h2>
      <div className="flex flex-wrap justify-center gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            onClick={() => onSelect(preset)}
            variant={
              selectedPreset.label === preset.label ? "default" : "outline"
            }
            size="sm"
            className="transition-all duration-200 ease-in-out"
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Main Pomodoro Page Component
// -------------------------------------------------------

export default function PomodoroPage() {
  // Phase state: "work" or "break"
  const [phase, setPhase] = useState<Phase>("work");
  // Timer (in seconds) for the current phase
  const [time, setTime] = useState<number>(WORK_DURATION);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  // Selected break preset (work duration is fixed)
  const [selectedBreakPreset, setSelectedBreakPreset] = useState<BreakPreset>(
    BREAK_PRESETS[0]
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Audio refs for sound cues.
  const focusSoundRef = useRef<HTMLAudioElement | null>(null);
  const breakSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio objects.
  useEffect(() => {
    focusSoundRef.current = new Audio("/sounds/focus-start.mp3");
    breakSoundRef.current = new Audio("/sounds/break-start.mp3");
  }, []);

  // Whenever the phase or selected break preset changes, reset the timer.
  useEffect(() => {
    if (phase === "work") {
      setTime(WORK_DURATION);
    } else {
      setTime(selectedBreakPreset.duration);
    }
  }, [phase, selectedBreakPreset]);

  // Timer tick and automatic phase transition.
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          // Automatically transition between phases with sound cues.
          if (phase === "work") {
            breakSoundRef.current?.play();
            setPhase("break");
          } else {
            focusSoundRef.current?.play();
            setPhase("work");
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, phase]);

  // -------------------------------------------------------
  // Event Handlers
  // -------------------------------------------------------

  const handleStart = () => {
    if (isRunning) return;
    setIsRunning(true);
  };

  const handlePause = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
  };

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    if (phase === "work") {
      setTime(WORK_DURATION);
    } else {
      setTime(selectedBreakPreset.duration);
    }
  };

  const handleBreakPresetSelect = (preset: BreakPreset) => {
    if (phase === "break") {
      setTime(preset.duration);
    }
    setSelectedBreakPreset(preset);
  };

  // Use darker, modern background gradients.
  const backgroundClass =
    phase === "work"
      ? "bg-gradient-to-br from-purple-900 to-black"
      : "bg-gradient-to-br from-red-900 to-black";

  // Total duration for the current phase.
  const totalDuration =
    phase === "work" ? WORK_DURATION : selectedBreakPreset.duration;

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------

  return (
    <div
      className={`min-h-screen ${backgroundClass} flex flex-col items-center justify-center p-4`}
    >
      <TimerDisplay phase={phase} time={time} totalDuration={totalDuration} />
      <TimerControls
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
        isRunning={isRunning}
      />
      {phase === "break" && (
        <BreakPresetSelector
          presets={BREAK_PRESETS}
          selectedPreset={selectedBreakPreset}
          onSelect={handleBreakPresetSelect}
        />
      )}
    </div>
  );
}
