"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton"; // Adjust import to your setup

export default function Loading() {
  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      {/* Language Switch */}
      <div className="flex justify-end mb-4">
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>

      {/* New Task Form Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 mb-6">
        <div className="flex flex-col space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex flex-col space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex flex-col space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex flex-col space-y-2 sm:col-span-2 lg:col-span-1 sm:items-end justify-end">
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* "Understanding the Eisenhower Matrix" link skeleton */}
      <div className="mb-8">
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Display Info checkbox */}
      <div className="mb-6 flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Quadrants Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quadrant 1 */}
        <div className="p-4 rounded-3xl min-h-[220px] border border-gray-200/70 dark:border-gray-800/70 shadow-xl space-y-3">
          <div className="text-center mb-4">
            <Skeleton className="h-5 w-1/2 mx-auto" />
          </div>
          {/* A few skeleton cards inside quadrant */}
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`q1-skel-${idx}`}
              className="bg-white dark:bg-gray-900 shadow-lg rounded-xl border border-gray-200/70 dark:border-gray-800/70 p-3"
            >
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>

        {/* Quadrant 2 */}
        <div className="p-4 rounded-3xl min-h-[220px] border border-gray-200/70 dark:border-gray-800/70 shadow-xl space-y-3">
          <div className="text-center mb-4">
            <Skeleton className="h-5 w-2/3 mx-auto" />
          </div>
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`q2-skel-${idx}`}
              className="bg-white dark:bg-gray-900 shadow-lg rounded-xl border border-gray-200/70 dark:border-gray-800/70 p-3"
            >
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>

        {/* Quadrant 3 */}
        <div className="p-4 rounded-3xl min-h-[220px] border border-gray-200/70 dark:border-gray-800/70 shadow-xl space-y-3">
          <div className="text-center mb-4">
            <Skeleton className="h-5 w-1/2 mx-auto" />
          </div>
          {Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={`q3-skel-${idx}`}
              className="bg-white dark:bg-gray-900 shadow-lg rounded-xl border border-gray-200/70 dark:border-gray-800/70 p-3"
            >
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>

        {/* Quadrant 4 */}
        <div className="p-4 rounded-3xl min-h-[220px] border border-gray-200/70 dark:border-gray-800/70 shadow-xl space-y-3">
          <div className="text-center mb-4">
            <Skeleton className="h-5 w-2/3 mx-auto" />
          </div>
          {Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={`q4-skel-${idx}`}
              className="bg-white dark:bg-gray-900 shadow-lg rounded-xl border border-gray-200/70 dark:border-gray-800/70 p-3"
            >
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>

      {/* Calendar + Upcoming tasks */}
      <div className="mt-12 flex flex-col md:flex-row gap-6 md:gap-8 items-start justify-center">
        {/* Calendar skeleton */}
        <div className="flex justify-center">
          <div className="w-fit space-y-3">
            <Skeleton className="h-5 w-40" />
            <div className="mx-auto rounded-xl border dark:border-gray-800 p-4 grid grid-cols-7 gap-2">
              {/* Mock days */}
              {Array.from({ length: 28 }).map((_, i) => (
                <Skeleton
                  key={`cal-skel-${i}`}
                  className="h-8 w-8 rounded-full"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming tasks */}
        <div className="md:w-8/12 w-full space-y-3">
          <Skeleton className="h-5 w-40 mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`upcoming-task-${i}`}
              className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 space-y-2"
            >
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>

      {/* Completed Tasks */}
      <div className="mt-12">
        <div className="w-full flex justify-between items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-md p-4">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
