"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

// -------------------------------------------------------
// TEST MODE FLAG
// -------------------------------------------------------

// Test mode is enabled only in non-production environments.
const TEST_MODE = process.env.NODE_ENV !== "production";

// -------------------------------------------------------
// Types & Constants
// -------------------------------------------------------

type Phase = "work" | "break";

interface BreakPreset {
  label: string;
  duration: number; // in seconds
}

const WORK_DURATION = TEST_MODE ? 10 : 90 * 60; // 10 sec in test mode, otherwise 1.5 hrs

const BREAK_PRESETS: BreakPreset[] = TEST_MODE
  ? [{ label: "Test Break (5 sec)", duration: 5 }]
  : [
      { label: "Quick Break (10 min)", duration: 10 * 60 },
      { label: "Extended Break (30 min)", duration: 30 * 60 },
    ];

// -------------------------------------------------------
// Utility Function
// -------------------------------------------------------

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
// Modal Component for Unsupported Browsers
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
        <h2 className="text-xl  text-black font-semibold mb-4">
          Picture-in-Picture Unavailable
        </h2>
        <p className="text-gray-700 mb-6">
          Your browser (Firefox) does not support Picture-in-Picture for canvas
          capture streams. Please use a supported browser such as Edge,
          or Safari.
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
// Presentational Components
// -------------------------------------------------------

type TimerDisplayProps = {
  phase: Phase;
  time: number;
  totalDuration: number;
};

function TimerDisplay({ phase, time, totalDuration }: TimerDisplayProps) {
  // Calculate progress as the percentage of elapsed time.
  const progress = ((totalDuration - time) / totalDuration) * 100;

  return (
    <div className="w-full max-w-md mx-auto mb-12 text-center">
      <div className="text-8xl font-mono transition-all duration-300 ease-in-out text-white">
        {formatTime(time)}
      </div>
      <div className="mt-4 text-2xl font-semibold text-white">
        {phase === "work" ? "Deep Work Session" : "Break Session"}
      </div>
      <div className="mt-6 w-full max-w-md mx-auto">
        {/* Custom progress bar */}
        <div className="relative h-4 w-full bg-gray-700 rounded-full">
          <div
            className="absolute left-0 top-0 h-full bg-green-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 text-white text-sm">{progress.toFixed(0)}%</div>
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

type SoundSelectorProps = {
  selectedSound: string;
  onSelect: (sound: string) => void;
};

/**
 * Custom sound selector that displays the current selection as a button.
 * When clicked, it opens a dropdown list of sound options.
 */
function SoundSelector({ selectedSound, onSelect }: SoundSelectorProps) {
  const SOUND_OPTIONS = [
    { label: "Bell Dinging", value: "/bell-dinging-jam-fx-2-2-00-05.mp3" },
    { label: "Sonar Pings", value: "/sonar-pings-tomas-herudek-1-00-40.mp3" },
  ];

  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  // When a sound option is clicked, select it and close the dropdown.
  const handleOptionClick = (option: { label: string; value: string }) => {
    onSelect(option.value);
    setIsOpen(false);
  };

  // Play the preview for a given option.
  const handlePlayPreview = (
    option: { label: string; value: string },
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    const audio = new Audio(option.value);
    audio.play();

    // If the option is Sonar Pings, cap the preview at 9 seconds.
    if (option.value === "/sonar-pings-tomas-herudek-1-00-40.mp3") {
      const playDuration = 9000; // 9 seconds
      const fadeDuration = 3000; // 3 seconds fade-out
      const fadeSteps = 20;
      const stepTime = fadeDuration / fadeSteps;

      setTimeout(() => {
        const fadeOut = setInterval(() => {
          if (audio.volume > 0.05) {
            audio.volume -= 0.05;
          } else {
            clearInterval(fadeOut);
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 1;
          }
        }, stepTime);
      }, playDuration);
    }
  };

  const currentOption =
    SOUND_OPTIONS.find((opt) => opt.value === selectedSound) ||
    SOUND_OPTIONS[0];

  return (
    <div className="relative inline-block text-left mt-4">
      <div>
        <button
          type="button"
          onClick={toggleDropdown}
          className="inline-flex justify-between w-56 rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-gray-800 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none"
        >
          {currentOption.label}
          {isOpen ? (
            <FiChevronUp className="ml-2 text-white" />
          ) : (
            <FiChevronDown className="ml-2 text-white" />
          )}
        </button>
      </div>
      {isOpen && (
        <div className="origin-top-right absolute mt-2 w-56 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1">
            {SOUND_OPTIONS.map((option) => (
              <div
                key={option.value}
                onClick={() => handleOptionClick(option)}
                className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-700"
              >
                <span className="text-white">{option.label}</span>
                <button
                  onClick={(e) => handlePlayPreview(option, e)}
                  className="text-blue-400 hover:text-blue-500 focus:outline-none"
                >
                  Test Audio
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------
// Main Pomodoro Page Component with Picture-in-Picture Option
// -------------------------------------------------------

export default function PomodoroPage() {
  const [phase, setPhase] = useState<Phase>("work");
  const [time, setTime] = useState<number>(WORK_DURATION);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedBreakPreset, setSelectedBreakPreset] = useState<BreakPreset>(
    BREAK_PRESETS[0]
  );
  const [selectedSound, setSelectedSound] = useState<string>(
    "/bell-dinging-jam-fx-2-2-00-05.mp3"
  );
  const [showUnsupportedModal, setShowUnsupportedModal] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Audio refs for sound cues.
  const focusSoundRef = useRef<HTMLAudioElement | null>(null);
  const breakSoundRef = useRef<HTMLAudioElement | null>(null);

  // Refs for Picture-in-Picture elements.
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    focusSoundRef.current = new Audio(selectedSound);
    breakSoundRef.current = new Audio(selectedSound);
  }, [selectedSound]);

  useEffect(() => {
    if (canvasRef.current && videoRef.current && !videoRef.current.srcObject) {
      const stream = canvasRef.current.captureStream();
      videoRef.current.srcObject = stream;
    }
  }, []);

  useEffect(() => {
    setTime(phase === "work" ? WORK_DURATION : selectedBreakPreset.duration);
  }, [phase, selectedBreakPreset]);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
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

  const totalDuration =
    phase === "work" ? WORK_DURATION : selectedBreakPreset.duration;

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const width = 300;
    const height = 150;
    canvasRef.current.width = width;
    canvasRef.current.height = height;

    // Clear canvas.
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    // Draw timer text.
    ctx.font = "48px sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(formatTime(time), width / 2, height / 2 - 20);

    // Draw progress bar.
    const progressPercentage = ((totalDuration - time) / totalDuration) * 100;
    const barWidth = width - 40;
    const barHeight = 20;
    const barX = 20;
    const barY = height - 40;
    ctx.fillStyle = "#444";
    ctx.fillRect(barX, barY, barWidth, barHeight);
    const fillWidth = (progressPercentage / 100) * barWidth;
    ctx.fillStyle = "#0f0";
    ctx.fillRect(barX, barY, fillWidth, barHeight);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }, [time, totalDuration]);

  // Picture-in-Picture handler.
  const handlePictureInPicture = () => {
    if (!videoRef.current) return;

    // Detect Firefox.
    const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");
    if (isFirefox) {
      // Instead of an alert, show a custom modal.
      setShowUnsupportedModal(true);
      return;
    }

    // Ensure the video is playing.
    videoRef.current
      .play()
      .catch((err) => console.error("Video play error:", err));

    try {
      if (videoRef.current.requestPictureInPicture) {
        videoRef.current
          .requestPictureInPicture()
          .catch((err) => console.error("PiP error:", err));
      } else if ((videoRef.current as any).webkitSetPresentationMode) {
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
    setTime(phase === "work" ? WORK_DURATION : selectedBreakPreset.duration);
  };

  const handleBreakPresetSelect = (preset: BreakPreset) => {
    if (phase === "break") {
      setTime(preset.duration);
    }
    setSelectedBreakPreset(preset);
  };

  const backgroundClass =
    phase === "work"
      ? "bg-gradient-to-br from-purple-900 to-black"
      : "bg-gradient-to-br from-red-900 to-black";

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
      <SoundSelector
        selectedSound={selectedSound}
        onSelect={setSelectedSound}
      />
      <div className="flex justify-center mt-4">
        <Button
          onClick={handlePictureInPicture}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          Picture-in-Picture
        </Button>
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
      {/* Render modal if unsupported */}
      {showUnsupportedModal && (
        <UnsupportedModal onClose={() => setShowUnsupportedModal(false)} />
      )}
    </div>
  );
}
