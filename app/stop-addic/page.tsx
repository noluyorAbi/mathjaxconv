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
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type Status = "success" | "fail";

type HabitCategory = {
  id: number;
  slug: string;
  name: string;
  description: string;
};

type LogsByCategory = {
  [categoryId: number]: {
    [date: string]: Status;
  };
};

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

// Helper: Get weekday name with Monday first
const getWeekdayName = (index: number) => {
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return weekdays[index];
};

// Helper: Get weekday index with Monday first
const getWeekdayIndex = (date: Date) => {
  // JavaScript getDay returns 0 for Sunday, 1 for Monday, etc.
  // We need to adjust this to match our array where 0 is Monday
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  return day === 0 ? 6 : day - 1; // Convert to 0 = Monday, 6 = Sunday
};

// Fixed version - explicitly create new date object in local timezone
const calculateWeekdayIndex = (dateStr: string) => {
  // Parse the ISO date string into a Date object with correct local handling
  const [year, month, day] = dateStr.split("-").map((num) => parseInt(num, 10));
  const date = new Date(year, month - 1, day); // month is 0-indexed in JS Date
  return getWeekdayIndex(date);
};

// Helper: Compute streaks from the logs
const computeStreaks = (logs: { [key: string]: Status }) => {
  // Compute longest streak from all success dates (sorted ascending)
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

  // Determine the most recent logged day regardless of status.
  const allDates = Object.keys(logs).map((dateStr) => new Date(dateStr));
  if (allDates.length === 0) {
    return { currentStreak: 0, longestStreak: longest };
  }
  allDates.sort((a, b) => b.getTime() - a.getTime());
  const latestDate = allDates[0];
  const latestDateStr = latestDate.toISOString().split("T")[0];

  // If the most recent logged day was a fail, current streak is 0.
  if (logs[latestDateStr] !== "success") {
    return { currentStreak: 0, longestStreak: longest };
  }

  // Count backward from the latest logged success.
  let current = 0;
  let referenceDate = new Date(latestDate);
  while (true) {
    const dateStr = referenceDate.toISOString().split("T")[0];
    if (logs[dateStr] === "success") {
      current++;
      referenceDate.setDate(referenceDate.getDate() - 1);
    } else {
      break;
    }
  }
  return { currentStreak: current, longestStreak: longest };
};

export default function Page() {
  const [categories, setCategories] = useState<HabitCategory[]>([]);
  const [logsByCategory, setLogsByCategory] = useState<LogsByCategory>({});
  const [selectedCategory, setSelectedCategory] = useState<number | "all">(
    "all"
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // State for displayed month/year (for calendar view)
  const [displayYear, setDisplayYear] = useState<number>(
    new Date().getFullYear()
  );
  const [displayMonth, setDisplayMonth] = useState<number>(
    new Date().getMonth()
  );

  // Fetch categories and logs from Supabase on mount
  useEffect(() => {
    async function fetchData() {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("habit_categories")
        .select("*")
        .order("id");

      if (categoriesError) {
        console.error("Error fetching categories:", categoriesError);
        return;
      }

      setCategories(categoriesData || []);

      // Fetch all logs
      const { data: logsData, error: logsError } = await supabase
        .from("user_logs")
        .select("*");

      if (logsError) {
        console.error("Error fetching logs:", logsError);
        return;
      }

      // Group logs by category
      const groupedLogs: LogsByCategory = {};
      logsData?.forEach((log) => {
        if (!groupedLogs[log.category_id]) {
          groupedLogs[log.category_id] = {};
        }
        groupedLogs[log.category_id][log.date] = log.status as Status;
      });
      setLogsByCategory(groupedLogs);
    }
    fetchData();
  }, []);

  // Generate days for the currently displayed month/year
  const displayedDays = getDaysInMonth(displayYear, displayMonth);
  const firstDay = new Date(displayYear, displayMonth, 1);
  const firstDayWeekday = getWeekdayIndex(firstDay);
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
    if (selectedDate && selectedCategory !== "all") {
      const dateStr = selectedDate.toISOString().split("T")[0];

      // Optimistically update local state
      setLogsByCategory((prevLogs) => {
        const categoryLogs = { ...prevLogs[selectedCategory] };
        if (status === null) {
          delete categoryLogs[dateStr];
        } else {
          categoryLogs[dateStr] = status;
        }
        return {
          ...prevLogs,
          [selectedCategory]: categoryLogs,
        };
      });

      // Update Supabase table
      if (status === null) {
        const { error } = await supabase
          .from("user_logs")
          .delete()
          .eq("date", dateStr)
          .eq("category_id", selectedCategory);
        if (error) {
          console.error("Error deleting log:", error.message, error.details);
          return;
        }
      } else {
        const { data, error } = await supabase
          .from("user_logs")
          .upsert(
            {
              date: dateStr,
              status,
              category_id: selectedCategory,
            },
            {
              onConflict: "date,category_id",
            }
          )
          .select();

        if (error) {
          console.error("Error upserting log:", error.message, error.details);
          return;
        }
        console.log("Successfully upserted log:", data);
      }
      setSelectedDate(null);
    }
  };

  // Helper function to check if all categories have success status for a date
  const isAllSuccess = (dateStr: string) => {
    return categories.every(
      (category) => logsByCategory[category.id]?.[dateStr] === "success"
    );
  };

  // Get logs for current view (either specific category or combined)
  const getCurrentLogs = () => {
    if (selectedCategory === "all") {
      const combinedLogs: { [key: string]: Status } = {};
      Object.values(logsByCategory).forEach((categoryLogs) => {
        Object.entries(categoryLogs).forEach(([date, status]) => {
          if (
            status === "success" &&
            (!combinedLogs[date] || isAllSuccess(date))
          ) {
            combinedLogs[date] = "success";
          } else {
            combinedLogs[date] = "fail";
          }
        });
      });
      return combinedLogs;
    }
    return logsByCategory[selectedCategory] || {};
  };

  // Calculate additional statistics
  const calculateStats = () => {
    const logs = getCurrentLogs();
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Helper function to get date string in YYYY-MM-DD format
    const getDateString = (date: Date) => date.toISOString().split("T")[0];

    // Helper function to check if a date is today or in the past
    const isValidDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date <= today;
    };

    // Last 7 days stats (only count days up to today)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return getDateString(date);
    }).filter(isValidDate);

    const last7DaysStats = last7Days
      .map((dateStr) => ({
        date: dateStr,
        status: logs[dateStr],
      }))
      .filter((log) => log.status !== undefined);

    const last7DaysSuccess = last7DaysStats.filter(
      (log) => log.status === "success"
    ).length;
    const lastWeekRate =
      last7DaysStats.length > 0
        ? Math.round((last7DaysSuccess / last7DaysStats.length) * 100)
        : 0;

    // Last 30 days stats (only count days up to today)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return getDateString(date);
    }).filter(isValidDate);

    const last30DaysStats = last30Days
      .map((dateStr) => ({
        date: dateStr,
        status: logs[dateStr],
      }))
      .filter((log) => log.status !== undefined);

    const last30DaysSuccess = last30DaysStats.filter(
      (log) => log.status === "success"
    ).length;
    const lastMonthRate =
      last30DaysStats.length > 0
        ? Math.round((last30DaysSuccess / last30DaysStats.length) * 100)
        : 0;

    // Best and worst days (only consider days with actual entries)
    const weekdayStats = Array(7)
      .fill(null)
      .map(() => ({
        success: 0,
        total: 0,
      }));

    // Count successes and totals for each weekday
    Object.entries(logs).forEach(([dateStr, status]) => {
      const date = new Date(dateStr);
      if (date > today) return; // Skip future dates
      const weekdayIndex = calculateWeekdayIndex(dateStr);
      weekdayStats[weekdayIndex].total++;
      if (status === "success") {
        weekdayStats[weekdayIndex].success++;
      }
    });

    // Calculate rates for each weekday (minimum 2 entries required)
    const weekdayRates = weekdayStats
      .map((stats, index) => ({
        index,
        success: stats.success,
        total: stats.total,
        rate: stats.total >= 2 ? stats.success / stats.total : -1,
      }))
      // Important: Only include days that actually have entries (at least 2)
      .filter((day) => day.total >= 2);

    // Initialize with default values that will be shown if no valid days exist
    let bestDay = { index: -1, rate: 0, success: 0, total: 0 };
    let worstDay = { index: -1, rate: 0, success: 0, total: 0 };

    if (weekdayRates.length > 0) {
      // Sort by rate in descending order
      const sortedRates = [...weekdayRates].sort((a, b) => b.rate - a.rate);

      // Best day is the first one (highest rate)
      bestDay = sortedRates[0];

      // Worst day is the last one (lowest rate), but only if we have more than one day
      if (sortedRates.length > 1) {
        worstDay = sortedRates[sortedRates.length - 1];
      }
    }

    return {
      lastWeekRate,
      lastWeekTotal: last7DaysStats.length,
      lastWeekSuccess: last7DaysSuccess,
      lastMonthRate,
      lastMonthTotal: last30DaysStats.length,
      lastMonthSuccess: last30DaysSuccess,
      bestDay: {
        name: bestDay.index >= 0 ? getWeekdayName(bestDay.index) : "N/A",
        rate: bestDay.index >= 0 ? Math.round(bestDay.rate * 100) : 0,
        total: bestDay.total,
        success: bestDay.success,
      },
      worstDay: {
        name: worstDay.index >= 0 ? getWeekdayName(worstDay.index) : "N/A",
        rate: worstDay.index >= 0 ? Math.round(worstDay.rate * 100) : 0,
        total: worstDay.total,
        success: worstDay.success,
      },
    };
  };

  const stats = calculateStats();
  const { currentStreak, longestStreak } = computeStreaks(getCurrentLogs());

  // Prepare chart data for the displayed month
  const dayLabels = displayedDays.map((day) => day.getDate().toString());
  const successData = displayedDays.map((day) => {
    const dateStr = day.toISOString().split("T")[0];
    return getCurrentLogs()[dateStr] === "success" ? 1 : 0;
  });
  const failData = displayedDays.map((day) => {
    const dateStr = day.toISOString().split("T")[0];
    return getCurrentLogs()[dateStr] === "fail" ? 1 : 0;
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

  // Prepare Pie chart data for overall monthly totals
  const totalSuccess = successData.reduce<number>((sum, val) => sum + val, 0);
  const totalFail = failData.reduce<number>((sum, val) => sum + val, 0);

  // *** Yearly Overview Chart Calculation ***
  // For the current year, we aggregate logs per month.
  const currentYearValue = new Date().getFullYear();
  const yearlySuccess = new Array(12).fill(0);
  const yearlyFail = new Array(12).fill(0);
  Object.entries(getCurrentLogs()).forEach(([dateStr, status]) => {
    const date = new Date(dateStr);
    if (date.getFullYear() === currentYearValue) {
      const month = date.getMonth(); // 0-based index
      if (status === "success") {
        yearlySuccess[month]++;
      } else if (status === "fail") {
        yearlyFail[month]++;
      }
    }
  });
  const yearlyBarChartData = {
    labels: MONTH_NAMES,
    datasets: [
      {
        label: "Success",
        data: yearlySuccess,
        backgroundColor: "rgba(34,197,94,0.6)",
      },
      {
        label: "Fail",
        data: yearlyFail,
        backgroundColor: "rgba(239,68,68,0.6)",
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

  // Use a stable array of month names for the calendar header
  const monthName = MONTH_NAMES[displayMonth];

  // Calculate success rate per weekday for the chart
  const getWeekdayStats = () => {
    const logs = getCurrentLogs();
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const weekdayStats = Array(7)
      .fill(null)
      .map(() => ({
        success: 0,
        total: 0,
      }));

    Object.entries(logs).forEach(([dateStr, status]) => {
      const date = new Date(dateStr);
      if (date > today) return; // Skip future dates
      const weekdayIndex = calculateWeekdayIndex(dateStr);
      weekdayStats[weekdayIndex].total++;
      if (status === "success") {
        weekdayStats[weekdayIndex].success++;
      }
    });

    return weekdayStats.map((stat) =>
      stat.total >= 2 ? Math.round((stat.success / stat.total) * 100) : 0
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-900 to-teal-900 flex flex-col">
      {/* HEADER */}
      <header className="bg-black/30 backdrop-blur text-white p-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-teal-400">
          Habit Tracker
        </h1>
        <p className="mt-2 text-lg text-gray-300">
          Track multiple habits, build streaks, and achieve your goals.
        </p>
      </header>

      {/* Category Selection */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              selectedCategory === "all"
                ? "bg-gradient-to-r from-cyan-400 to-teal-400 text-white shadow-lg shadow-cyan-500/20"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            All Habits
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${
                selectedCategory === category.id
                  ? "bg-gradient-to-r from-cyan-400 to-teal-400 text-white shadow-lg shadow-cyan-500/20"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* STREAKS */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center transform hover:scale-105 transition-all duration-200 border border-white/10 group relative">
            <p className="text-sm text-gray-300 mb-2">Current Streak</p>
            <p className="text-4xl font-bold text-cyan-400">{currentStreak}</p>
            <p className="text-xs text-gray-400 mt-2">days</p>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Number of consecutive successful days
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center transform hover:scale-105 transition-all duration-200 border border-white/10 group relative">
            <p className="text-sm text-gray-300 mb-2">Longest Streak</p>
            <p className="text-4xl font-bold text-teal-400">{longestStreak}</p>
            <p className="text-xs text-gray-400 mt-2">days</p>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Your longest run of consecutive successful days
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center transform hover:scale-105 transition-all duration-200 border border-white/10 group relative">
            <p className="text-sm text-gray-300 mb-2">Success Rate</p>
            <p className="text-4xl font-bold text-emerald-400">
              {totalSuccess + totalFail > 0
                ? Math.round((totalSuccess / (totalSuccess + totalFail)) * 100)
                : 0}
              %
            </p>
            <p className="text-xs text-gray-400 mt-2">overall</p>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Percentage of successful days out of all tracked days
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center transform hover:scale-105 transition-all duration-200 border border-white/10 group relative">
            <p className="text-sm text-gray-300 mb-2">Total Days Tracked</p>
            <p className="text-4xl font-bold text-blue-400">
              {totalSuccess + totalFail}
            </p>
            <p className="text-xs text-gray-400 mt-2">days</p>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Total number of days you've tracked your habit
            </div>
          </div>
        </div>

        {/* ADDITIONAL STATS */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center transform hover:scale-105 transition-all duration-200 border border-white/10 group relative">
            <p className="text-sm text-gray-300 mb-2">Last 7 Days</p>
            <p className="text-4xl font-bold text-cyan-400">
              {stats.lastWeekRate}%
            </p>
            <p className="text-xs text-gray-400 mt-2">success rate</p>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Success rate for the past week
              <br />
              {stats.lastWeekSuccess} successful days out of{" "}
              {stats.lastWeekTotal} tracked days
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center transform hover:scale-105 transition-all duration-200 border border-white/10 group relative">
            <p className="text-sm text-gray-300 mb-2">Last 30 Days</p>
            <p className="text-4xl font-bold text-teal-400">
              {stats.lastMonthRate}%
            </p>
            <p className="text-xs text-gray-400 mt-2">success rate</p>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Success rate for the past month
              <br />
              {stats.lastMonthSuccess} successful days out of{" "}
              {stats.lastMonthTotal} tracked days
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center transform hover:scale-105 transition-all duration-200 border border-white/10 group relative">
            <p className="text-sm text-gray-300 mb-2">Best Day</p>
            <p className="text-4xl font-bold text-emerald-400">
              {stats.bestDay.rate}%
            </p>
            <p className="text-xs text-gray-400 mt-2">{stats.bestDay.name}</p>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Your most successful day of the week
              <br />
              {stats.bestDay.success} successful days out of{" "}
              {stats.bestDay.total} tracked {stats.bestDay.name}s
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center transform hover:scale-105 transition-all duration-200 border border-white/10 group relative">
            <p className="text-sm text-gray-300 mb-2">Challenging Day</p>
            <p className="text-4xl font-bold text-rose-400">
              {stats.worstDay.rate}%
            </p>
            <p className="text-xs text-gray-400 mt-2">{stats.worstDay.name}</p>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Your most challenging day of the week
              <br />
              {stats.worstDay.success} successful days out of{" "}
              {stats.worstDay.total} tracked {stats.worstDay.name}s
            </div>
          </div>
        </div>

        {/* CALENDAR CARD */}
        <motion.div
          className="bg-white/10 backdrop-blur rounded-lg shadow-lg p-6 mb-8 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Month/Year + Navigation */}
          <div className="flex justify-between items-center mb-6">
            <Button
              onClick={handlePrevMonth}
              className="bg-white/10 hover:bg-white/20 text-white h-12 border border-white/10"
            >
              &lt; Prev
            </Button>
            <h2 className="text-3xl font-bold text-white">
              {monthName} {displayYear}
            </h2>
            <Button
              onClick={handleNextMonth}
              className="bg-white/10 hover:bg-white/20 text-white h-12 border border-white/10"
            >
              Next &gt;
            </Button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 text-center font-medium text-gray-300 border-b border-white/10 pb-2 mb-4">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
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
              if (getCurrentLogs()[dateStr] === "success")
                circleColor = "bg-green-500";
              else if (getCurrentLogs()[dateStr] === "fail")
                circleColor = "bg-red-500";

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
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Monthly Progress */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 transform hover:scale-105 transition-all duration-200 border border-white/10">
            <h3 className="text-xl text-white font-bold mb-6 flex items-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
              Monthly Progress
            </h3>
            <div className="h-80">
              <Bar
                data={barChartData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: { position: "top" as const },
                    tooltip: {
                      backgroundColor: "rgba(0,0,0,0.8)",
                      padding: 12,
                      titleColor: "#fff",
                      bodyColor: "#fff",
                      borderColor: "#333",
                      borderWidth: 1,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { stepSize: 1 },
                      grid: {
                        color: "rgba(255,255,255,0.1)",
                      },
                    },
                    x: {
                      grid: {
                        display: false,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Weekly Pattern */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 transform hover:scale-105 transition-all duration-200 border border-white/10">
            <h3 className="text-xl text-white font-bold mb-6 flex items-center">
              <span className="w-2 h-2 bg-cyan-500 rounded-full mr-2"></span>
              Weekly Pattern
            </h3>
            <div className="h-80">
              <Bar
                data={{
                  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                  datasets: [
                    {
                      label: "Success Rate",
                      data: getWeekdayStats(),
                      backgroundColor: "rgba(34,211,238,0.6)",
                      borderColor: "rgba(34,211,238,1)",
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: "rgba(0,0,0,0.8)",
                      padding: 12,
                      callbacks: {
                        label: (context) =>
                          `Success rate: ${Math.round(context.raw as number)}%`,
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: "Success Rate (%)",
                        color: "rgba(255,255,255,0.7)",
                      },
                      grid: {
                        color: "rgba(255,255,255,0.1)",
                      },
                      ticks: {
                        callback: (value) => `${value}%`,
                      },
                    },
                    x: {
                      grid: {
                        display: false,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Yearly Overview */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 transform hover:scale-105 transition-all duration-200 border border-white/10 md:col-span-2">
            <h3 className="text-xl text-white font-bold mb-6 flex items-center">
              <span className="w-2 h-2 bg-teal-500 rounded-full mr-2"></span>
              Yearly Overview ({currentYearValue})
            </h3>
            <div className="h-80">
              <Bar
                data={yearlyBarChartData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: { position: "top" as const },
                    tooltip: {
                      backgroundColor: "rgba(0,0,0,0.8)",
                      padding: 12,
                    },
                  },
                  scales: {
                    x: {
                      stacked: true,
                      grid: {
                        display: false,
                      },
                    },
                    y: {
                      stacked: true,
                      beginAtZero: true,
                      grid: {
                        color: "rgba(255,255,255,0.1)",
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="text-center py-6 text-gray-400 text-sm bg-black/30 backdrop-blur mt-12">
        <p>© {currentYearValue} Habit Tracker. All rights reserved.</p>
        <p className="mt-1 text-xs text-gray-500">
          Track your progress. Build better habits.
        </p>
      </footer>

      {/* MODAL DIALOG */}
      <Dialog
        open={!!selectedDate}
        onOpenChange={(open) => {
          if (!open) setSelectedDate(null);
        }}
      >
        <DialogContent className="bg-gray-800/90 backdrop-blur border-gray-700">
          <motion.div
            className="rounded-lg p-6 max-w-xs mx-auto"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.3 }}
          >
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-semibold mb-1 text-white">
                {selectedDate
                  ? new Date(selectedDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : ""}
                {selectedCategory !== "all" && (
                  <span className="block text-sm text-gray-400 mt-1">
                    {categories.find((c) => c.id === selectedCategory)?.name}
                  </span>
                )}
              </DialogTitle>
              <p className="text-center text-sm text-gray-400 mt-4 mb-6">
                How did you do today?
              </p>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Button
                onClick={() => handleStatusSelect("success")}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-12 text-lg font-medium shadow-lg shadow-emerald-500/20"
                disabled={selectedCategory === "all"}
              >
                Success 🎉
              </Button>
              <Button
                onClick={() => handleStatusSelect("fail")}
                className="bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white h-12 text-lg font-medium shadow-lg shadow-rose-500/20"
                disabled={selectedCategory === "all"}
              >
                Not Today 😔
              </Button>
              <Button
                onClick={() => handleStatusSelect(null)}
                className="bg-white/10 hover:bg-white/20 text-white h-12 text-lg font-medium border border-white/10"
                disabled={selectedCategory === "all"}
              >
                Clear Entry
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
