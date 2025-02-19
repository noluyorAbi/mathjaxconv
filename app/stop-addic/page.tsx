"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

// Helper: Generate all days in a given month
const getDaysInMonth = (year: number, month: number): Date[] => {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

type Status = "success" | "fail";

// Helper: Compute streaks from the logs
const computeStreaks = (logs: {
  [key: string]: Status;
}): { currentStreak: number; longestStreak: number } => {
  const successDates = Object.keys(logs)
    .filter((dateStr) => logs[dateStr] === "success")
    .map((dateStr) => new Date(dateStr));
  successDates.sort((a, b) => a.getTime() - b.getTime());

  let longest = 0;
  let streak = 0;
  let prevDate: Date | null = null;
  for (const date of successDates) {
    if (prevDate) {
      const diff =
        (date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
      } else {
        streak = 1;
      }
    } else {
      streak = 1;
    }
    if (streak > longest) longest = streak;
    prevDate = date;
  }

  let current = 0;
  let d = new Date();
  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().split("T")[0];
    if (logs[dateStr] === "success") {
      current++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return { currentStreak: current, longestStreak: longest };
};

export default function Page() {
  const [logs, setLogs] = useState<{ [key: string]: Status }>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch logs from Supabase on mount
  useEffect(() => {
    async function fetchLogs() {
      const { data, error } = await supabase
        .from("user_logs")
        .select("date, status");
      if (error) {
        console.error("Error fetching logs:", error);
        return;
      }
      const logsData: { [key: string]: Status } = {};
      data?.forEach((entry: { date: string; status: string }) => {
        logsData[entry.date] = entry.status as Status;
      });
      setLogs(logsData);
    }
    fetchLogs();
  }, []);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const days = getDaysInMonth(year, month);
  const firstDayWeekday = new Date(year, month, 1).getDay();
  const blanks = Array(firstDayWeekday).fill(null);
  const calendarDays = [...blanks, ...days];

  const handleStatusSelect = async (status: Status | null) => {
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split("T")[0];

      // Optimistically update local state
      setLogs((prevLogs) => {
        if (status === null) {
          const { [dateStr]: _, ...rest } = prevLogs;
          return rest;
        }
        return { ...prevLogs, [dateStr]: status };
      });

      // Update Supabase table
      if (status === null) {
        const { error } = await supabase
          .from("user_logs")
          .delete()
          .eq("date", dateStr);
        if (error) console.error("Error deleting log:", error);
      } else {
        const { error } = await supabase
          .from("user_logs")
          .upsert({ date: dateStr, status });
        if (error) console.error("Error upserting log:", error);
      }
      setSelectedDate(null);
    }
  };

  const { currentStreak, longestStreak } = computeStreaks(logs);

  // Framer Motion variants
  const dayVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  };
  const modalVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 flex flex-col">
      <header className="bg-gray-800 text-white p-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Addiction Tracker
        </h1>
        <p className="mt-2 text-lg text-gray-300">
          Track your progress, build streaks, and crush your goals.
        </p>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Streak Counters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
            <p className="text-sm text-gray-300">Current Streak</p>
            <p className="text-3xl font-bold text-green-400">{currentStreak}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
            <p className="text-sm text-gray-300">Longest Streak</p>
            <p className="text-3xl font-bold text-blue-400">{longestStreak}</p>
          </div>
        </div>

        {/* Calendar Card */}
        <motion.div
          className="bg-white/10 backdrop-blur rounded-lg shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white">
              {today.toLocaleString("default", { month: "long" })} {year}
            </h2>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 text-center font-medium text-gray-300 border-b pb-2 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-4">
            {calendarDays.map((day, index) => {
              if (day === null) return <div key={index} className="h-16" />;
              const dateStr = day.toISOString().split("T")[0];
              let circleColor = "bg-gray-500";
              if (logs[dateStr] === "success") circleColor = "bg-green-500";
              else if (logs[dateStr] === "fail") circleColor = "bg-red-500";

              return (
                <motion.div
                  key={index}
                  className="h-16 flex flex-col items-center justify-center cursor-pointer"
                  variants={dayVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                  onClick={() => setSelectedDate(day)}
                >
                  <div
                    className={`rounded-full w-10 h-10 ${circleColor} flex items-center justify-center text-white font-bold shadow-md`}
                  >
                    {day.getDate()}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </main>

      <footer className="text-center py-4 text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Addiction Tracker. All rights
        reserved.
      </footer>

      {/* Improved Modal Alert */}
      <Dialog
        open={!!selectedDate}
        onOpenChange={(open) => {
          if (!open) setSelectedDate(null);
        }}
      >
        <DialogContent>
          <motion.div
            className="bg-white rounded-lg shadow-lg p-6 max-w-xs mx-auto relative"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.3 }}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedDate(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              &#x2715;
            </button>
            <DialogHeader>
              <DialogTitle className="text-center text-lg font-semibold mb-1">
                {selectedDate?.toLocaleDateString()}
              </DialogTitle>
              <p className="text-center text-sm text-gray-500 mb-4">
                Set your status for the day
              </p>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => handleStatusSelect("success")}
                variant="default"
              >
                Didn&apos;t do it
              </Button>
              <Button
                onClick={() => handleStatusSelect("fail")}
                variant="destructive"
              >
                Did it
              </Button>
              <Button
                onClick={() => handleStatusSelect(null)}
                variant="outline"
              >
                Clear
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
