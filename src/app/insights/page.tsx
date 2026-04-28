"use client";

import { useState, useEffect } from "react";
import { CalendarHeatmap } from "@/components/calendar-heatmap";
import { fetchWorkoutCalendarData } from "@/lib/calendar-utils";
import { fetchMuscleVolume, type MuscleVolumeData } from "@/lib/muscle-volume-utils";
import { MuscleVolumeChart } from "@/components/muscle-volume-chart";

type TimeWindow = 7 | 30 | 90;

export default function InsightsPage() {
  const [dateCounts, setDateCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [muscleData, setMuscleData] = useState<MuscleVolumeData[]>([]);
  const [muscleLoading, setMuscleLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(30);

  useEffect(() => {
    fetchWorkoutCalendarData(365)
      .then(setDateCounts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setMuscleLoading(true);
    fetchMuscleVolume(timeWindow)
      .then(setMuscleData)
      .catch(console.error)
      .finally(() => setMuscleLoading(false));
  }, [timeWindow]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <svg
            className="h-5 w-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path d="M3 3v18h18" />
            <path d="M18 17V9" />
            <path d="M13 17V5" />
            <path d="M8 17v-3" />
          </svg>
          <h1 className="text-2xl font-bold">Insights</h1>
        </div>
        <p className="text-sm text-muted">
          Track your workout consistency and muscle group volume over time.
        </p>
      </div>

      {/* Calendar Heatmap Section */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Workout Consistency</h2>
          <p className="text-xs text-muted">Last 365 days</p>
        </div>

        {loading ? (
          <CalendarSkeleton />
        ) : (
          <CalendarHeatmap dateCounts={dateCounts} />
        )}
      </div>

      {/* Muscle Volume Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Muscle Group Volume</h2>
            <p className="text-sm text-muted">Total sets per muscle group</p>
          </div>
          <div className="flex gap-2">
            {([7, 30, 90] as TimeWindow[]).map((days) => (
              <button
                key={days}
                onClick={() => setTimeWindow(days)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  timeWindow === days
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>
        <MuscleVolumeChart data={muscleData} loading={muscleLoading} />
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 animate-pulse-slow">
      <div className="flex gap-3">
        <div className="w-8">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-[15px] w-6 rounded bg-border mb-0.5" />
          ))}
        </div>
        <div className="flex-1">
          <div className="h-3 w-16 rounded bg-border mb-2" />
          <div className="flex gap-0.5 flex-wrap">
            {Array.from({ length: 365 }).map((_, i) => (
              <div
                key={i}
                className="h-3 w-3 rounded-sm bg-border"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
