"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Workout } from "@/db/schema";
import { createBrowserClient } from "@/db/client";

interface WorkoutWithStats extends Workout {
  exercise_count: number;
  set_count: number;
  total_volume: number;
}

type DateFilter = "all" | "7days" | "30days" | "90days" | "this_year";
type SortOption = "date_desc" | "date_asc" | "volume_desc" | "duration_desc";

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
  { value: "90days", label: "Last 90 Days" },
  { value: "this_year", label: "This Year" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "date_desc", label: "Newest First" },
  { value: "date_asc", label: "Oldest First" },
  { value: "volume_desc", label: "Highest Volume" },
  { value: "duration_desc", label: "Longest Duration" },
];

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<WorkoutWithStats[]>([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState<WorkoutWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("date_desc");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function fetchWorkouts() {
      const supabase = createBrowserClient();

      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .is("deleted_at", null)
        .order("started_at", { ascending: false });

      if (error) {
        console.error("Error fetching workouts:", error);
        setLoading(false);
        return;
      }

      // Fetch stats for each workout
      const workoutsWithStats = await Promise.all(
        (data as Workout[] ?? []).map(async (workout) => {
          const { data: exercises } = await supabase
            .from("workout_exercises")
            .select("id")
            .eq("workout_id", workout.id);

          const exerciseIds = (exercises as { id: string }[] | null)?.map((e) => e.id) ?? [];
          let setCount = 0;
          let totalVolume = 0;

          if (exerciseIds.length > 0) {
            const { data: sets } = await supabase
              .from("sets")
              .select("reps, weight")
              .in("workout_exercise_id", exerciseIds);

            const typedSets = sets as { reps: number | null; weight: number | null }[] | null;
            setCount = typedSets?.length ?? 0;
            totalVolume = (typedSets ?? []).reduce((sum, set) => {
              if (set.reps && set.weight) {
                return sum + set.reps * set.weight;
              }
              return sum;
            }, 0);
          }

          return {
            ...workout,
            exercise_count: exerciseIds.length,
            set_count: setCount,
            total_volume: totalVolume,
          };
        })
      );

      setWorkouts(workoutsWithStats);
      setLoading(false);
    }

    fetchWorkouts();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...workouts];

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      let cutoff = new Date();

      switch (dateFilter) {
        case "7days":
          cutoff.setDate(now.getDate() - 7);
          break;
        case "30days":
          cutoff.setDate(now.getDate() - 30);
          break;
        case "90days":
          cutoff.setDate(now.getDate() - 90);
          break;
        case "this_year":
          cutoff = new Date(now.getFullYear(), 0, 1);
          break;
      }

      result = result.filter((w) => new Date(w.started_at) >= cutoff);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case "date_desc":
          return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
        case "date_asc":
          return new Date(a.started_at).getTime() - new Date(b.started_at).getTime();
        case "volume_desc":
          return b.total_volume - a.total_volume;
        case "duration_desc": {
          const durationA = a.ended_at
            ? new Date(a.ended_at).getTime() - new Date(a.started_at).getTime()
            : 0;
          const durationB = b.ended_at
            ? new Date(b.ended_at).getTime() - new Date(b.started_at).getTime()
            : 0;
          return durationB - durationA;
        }
        default:
          return 0;
      }
    });

    setFilteredWorkouts(result);
  }, [workouts, dateFilter, sortOption]);

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function formatDuration(started: string, ended: string | null): string {
    if (!ended) return "In progress";
    const start = new Date(started).getTime();
    const end = new Date(ended).getTime();
    const mins = Math.round((end - start) / 60000);
    return `${mins} min`;
  }

  // Calculate weekly stats
  const now = new Date();
  const weekAgo = new Date(now.getDate() - 7);
  const thisWeekWorkouts = workouts.filter((w) => new Date(w.started_at) >= weekAgo);
  const thisWeekVolume = thisWeekWorkouts.reduce((sum, w) => sum + w.total_volume, 0);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center text-zinc-500">
        Loading workouts...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Workouts</h1>
        <Link
          href="/workouts/active"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          + Start Workout
        </Link>
      </div>

      {/* Weekly summary */}
      {workouts.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-2xl font-bold">{thisWeekWorkouts.length}</div>
            <div className="text-xs text-zinc-500">This Week</div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-2xl font-bold">{thisWeekWorkouts.reduce((sum, w) => sum + w.set_count, 0)}</div>
            <div className="text-xs text-zinc-500">Sets</div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-2xl font-bold">
              {thisWeekVolume > 0 ? `${Math.round(thisWeekVolume).toLocaleString()} kg` : "—"}
            </div>
            <div className="text-xs text-zinc-500">Volume</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-300"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>

        {showFilters && (
          <div className="mt-3 space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-500">Date Range</label>
              <div className="flex flex-wrap gap-2">
                {DATE_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setDateFilter(filter.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      dateFilter === filter.value
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-500">Sort By</label>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortOption(option.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      sortOption === option.value
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="mb-3 text-xs text-zinc-500">
        {filteredWorkouts.length} workout{filteredWorkouts.length !== 1 ? "s" : ""}
      </div>

      {filteredWorkouts.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mb-4 text-5xl">💪</div>
          <h2 className="text-lg font-semibold">No workouts found</h2>
          <p className="mt-1 text-zinc-500">
            {workouts.length === 0
              ? "Start your first workout and begin tracking your progress."
              : "Try adjusting your filters to see more results."}
          </p>
          {workouts.length === 0 && (
            <Link
              href="/workouts/active"
              className="mt-4 inline-block rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Start Workout
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWorkouts.map((workout) => (
            <Link
              key={workout.id}
              href={`/workouts/${workout.id}`}
              className="block rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{workout.name || "Workout"}</h3>
                  <div className="mt-1 text-sm text-zinc-500">
                    {formatDate(workout.started_at)} ·{" "}
                    {formatDuration(workout.started_at, workout.ended_at)}
                  </div>
                </div>
                {workout.total_volume > 0 && (
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {Math.round(workout.total_volume).toLocaleString()} kg
                    </div>
                    <div className="text-xs text-zinc-500">volume</div>
                  </div>
                )}
              </div>
              <div className="mt-3 flex gap-4 text-xs text-zinc-500">
                <span>{workout.exercise_count} exercises</span>
                <span>{workout.set_count} sets</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
