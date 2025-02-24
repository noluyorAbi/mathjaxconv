"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";

// Register Chart.js components (required for react-chartjs-2)
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

type Status = "success" | "fail";

// A fixed array of month names to avoid locale/timezone differences
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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

// Helper: Compute streaks from the logs
const computeStreaks = (logs: { [key: string]: Status }) => {
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

  // Calculate current streak by going backward from today
  let current = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const dateStr = today.toISOString().split("T")[0];
    if (logs[dateStr] === "success") {
      current++;
      today.setDate(today.getDate() - 1);
    } else {
      break;
    }
  }
  return { currentStreak: current, longestStreak: longest };
};

export default function Page() {
  const [logs, setLogs] = useState<{ [key: string]: Status }>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // State for displayed month/year
  const [displayYear, setDisplayYear] = useState<number>(
    new Date().getFullYear()
  );
  const [displayMonth, setDisplayMonth] = useState<number>(
    new Date().getMonth()
  );

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

  // Generate days for the currently displayed month/year
  const displayedDays = getDaysInMonth(displayYear, displayMonth);
  const firstDayWeekday = new Date(displayYear, displayMonth, 1).getDay();
  const blanks = Array(firstDayWeekday).fill(null);
  const calendarDays = [...blanks, ...displayedDays];

  // Next/prev month navigation
  const handlePrevMonth = () => {
    let newMonth = displayMonth - 1;
    let newYear = displayYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear = displayYear - 1;
    }
    setDisplayMonth(newMonth);
    setDisplayYear(newYear);
  };

  const handleNextMonth = () => {
    let newMonth = displayMonth + 1;
    let newYear = displayYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear = displayYear + 1;
    }
    setDisplayMonth(newMonth);
    setDisplayYear(newYear);
  };

  // Handle logs upsert/delete
  const handleStatusSelect = async (status: Status | null) => {
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split("T")[0];

      // Optimistically update local state
      setLogs((prevLogs) => {
        if (status === null) {
          // Simply return a new object without the specified dateStr
          return {
            ...Object.fromEntries(
              Object.entries(prevLogs).filter(([key]) => key !== dateStr)
            ),
          };
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

  // Compute streaks
  const { currentStreak, longestStreak } = computeStreaks(logs);

  // Prepare chart data for the displayed month
  const dayLabels = displayedDays.map((day) => day.getDate().toString());
  const successData = displayedDays.map((day) => {
    const dateStr = day.toISOString().split("T")[0];
    return logs[dateStr] === "success" ? 1 : 0;
  });
  const failData = displayedDays.map((day) => {
    const dateStr = day.toISOString().split("T")[0];
    return logs[dateStr] === "fail" ? 1 : 0;
  });

  const barChartData = {
    labels: dayLabels,
    datasets: [
      {
        label: "Success",
        data: successData,
        backgroundColor: "rgba(34,197,94,0.6)", // Tailwind green-500
      },
      {
        label: "Fail",
        data: failData,
        backgroundColor: "rgba(239,68,68,0.6)", // Tailwind red-500
      },
    ],
  };

  // Calculate cumulative success data
  let cumulative = 0;
  const cumulativeSuccessData = successData.map((val) => {
    cumulative += val;
    return cumulative;
  });

  const lineChartData = {
    labels: dayLabels,
    datasets: [
      {
        label: "Cumulative Successes",
        data: cumulativeSuccessData,
        borderColor: "rgba(34,197,94,0.8)",
        backgroundColor: "rgba(34,197,94,0.2)",
      },
    ],
  };

  // Prepare Pie chart data for overall monthly totals
  const totalSuccess = successData.reduce<number>((sum, val) => sum + val, 0);
  const totalFail = failData.reduce<number>((sum, val) => sum + val, 0);
  const pieChartData = {
    labels: ["Success", "Fail"],
    datasets: [
      {
        data: [totalSuccess, totalFail],
        backgroundColor: ["rgba(34,197,94,0.6)", "rgba(239,68,68,0.6)"],
      },
    ],
  };

  // Framer Motion variants
  const dayVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  };
  const modalVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  };

  // Use a stable array of month names
  const monthName = MONTH_NAMES[displayMonth];

  // Memoize the current year for the footer
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 flex flex-col">
      {/* HEADER */}
      <header className="bg-gray-800 text-white p-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Addiction Tracker
        </h1>
        <p className="mt-2 text-lg text-gray-300">
          Track your progress, build streaks, and crush your goals.
        </p>
      </header>

      {/* MAIN */}
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* STREAKS */}
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

        {/* CALENDAR CARD */}
        <motion.div
          className="bg-white/10 backdrop-blur rounded-lg shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Month/Year + Navigation */}
          <div className="flex justify-between items-center mb-6">
            <Button
              onClick={handlePrevMonth}
              className="bg-gray-600 hover:bg-gray-500 text-white"
            >
              &lt; Prev
            </Button>
            <h2 className="text-3xl font-bold text-white">
              {monthName} {displayYear}
            </h2>
            <Button
              onClick={handleNextMonth}
              className="bg-gray-600 hover:bg-gray-500 text-white"
            >
              Next &gt;
            </Button>
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
              if (day === null) {
                return <div key={`blank-${index}`} className="h-16" />;
              }
              const dateStr = day.toISOString().split("T")[0];
              let circleColor = "bg-gray-500";
              if (logs[dateStr] === "success") circleColor = "bg-green-500";
              else if (logs[dateStr] === "fail") circleColor = "bg-red-500";

              return (
                <motion.div
                  key={dateStr}
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

        {/* CHARTS SECTION */}
        <div className="mt-10 space-y-8">
          {/* Bar Chart */}
          <div className="bg-white/10 rounded-lg p-4">
            <h3 className="text-xl text-white font-bold mb-4">
              Daily Success/Fail (Bar)
            </h3>
            <div className="w-full md:w-3/4 lg:w-1/2 mx-auto h-64">
              <Bar
                data={barChartData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: { position: "top" as const },
                    title: { display: true, text: "Daily Log" },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { stepSize: 1 },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Line Chart */}
          <div className="bg-white/10 rounded-lg p-4">
            <h3 className="text-xl text-white font-bold mb-4">
              Cumulative Successes (Line)
            </h3>
            <div className="w-full md:w-3/4 lg:w-1/2 mx-auto h-64">
              <Line
                data={lineChartData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: { position: "top" as const },
                    title: {
                      display: true,
                      text: "Cumulative Success",
                    },
                  },
                  scales: {
                    y: { beginAtZero: true },
                  },
                }}
              />
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white/10 rounded-lg p-4">
            <h3 className="text-xl text-white font-bold mb-4">
              Overall Success Ratio (Pie)
            </h3>
            <div className="w-full md:w-3/4 lg:w-1/2 mx-auto h-64">
              <Pie
                data={pieChartData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: { position: "top" as const },
                    title: {
                      display: true,
                      text: "Overall Success Ratio",
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="text-center py-4 text-gray-400 text-sm">
        © {currentYear} Addiction Tracker. All rights reserved.
      </footer>

      {/* MODAL DIALOG */}
      <Dialog
        open={!!selectedDate}
        onOpenChange={(open) => {
          if (!open) setSelectedDate(null);
        }}
      >
        <DialogContent>
          <motion.div
            className="rounded-lg shadow-lg p-6 max-w-xs mx-auto"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.3 }}
          >
            <DialogHeader>
              <DialogTitle className="text-center text-lg font-semibold mb-1">
                {/* Use a stable, timezone-independent format */}
                {selectedDate ? selectedDate.toISOString().split("T")[0] : ""}
              </DialogTitle>
              <p className="text-center text-sm text-gray-500 mb-4">
                Set your status for the day
              </p>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => handleStatusSelect("success")}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                Didn&apos;t do it
              </Button>
              <Button
                onClick={() => handleStatusSelect("fail")}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Did it
              </Button>
              <Button
                onClick={() => handleStatusSelect(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white"
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
