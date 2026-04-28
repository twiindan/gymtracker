"use client";

import { useState, useEffect } from "react";
import { CalendarHeatmap } from "@/components/calendar-heatmap";
import { fetchWorkoutCalendarData } from "@/lib/calendar-utils";

export default function InsightsPage() {
  const [dateCounts, setDateCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkoutCalendarData(365)
      .then(setDateCounts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

      {/* Muscle Volume Placeholder */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Muscle Group Volume</h2>
          <p className="text-xs text-muted">Coming soon</p>
        </div>
        <div className="rounded-xl border-2 border-dashed border-border py-12 text-center">
          <div className="mb-2 text-3xl">💪</div>
          <p className="text-sm text-muted">
            Muscle group volume chart coming soon
          </p>
          <p className="text-xs text-muted mt-1">
            See which muscle groups you&apos;re training most over time.
          </p>
        </div>
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
