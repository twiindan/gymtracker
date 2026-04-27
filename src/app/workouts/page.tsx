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

const DATE_FILTERS: { value: DateFilter; label: string; icon: string }[] = [
  { value: "all", label: "All Time", icon: "∞" },
  { value: "7days", label: "Last 7 Days", icon: "7" },
  { value: "30days", label: "Last 30 Days", icon: "30" },
  { value: "90days", label: "Last 90 Days", icon: "90" },
  { value: "this_year", label: "This Year", icon: "Y" },
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

  useEffect(() => {
    let result = [...workouts];

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

  const now = new Date();
  const weekAgo = new Date(now.getDate() - 7);
  const thisWeekWorkouts = workouts.filter((w) => new Date(w.started_at) >= weekAgo);
  const thisWeekVolume = thisWeekWorkouts.reduce((sum, w) => sum + w.total_volume, 0);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl py-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Workouts</h1>
            <p className="text-sm text-muted mt-1">Loading your training history...</p>
          </div>
        </div>
        <div className="py-12 text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-4 page-container">
      {/* Header */}
        <div className="mb-10 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Workouts</h1>
          <p className="text-sm text-muted mt-1">{workouts.length} total workouts logged</p>
        </div>
        <Link
          href="/workouts/active"
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] shrink-0 shadow-lg shadow-primary/25"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Start Workout
        </Link>
      </div>

      {/* Weekly Stats */}
      {workouts.length > 0 && (
        <div className="mb-8 grid grid-cols-3 gap-4">
          <StatCard 
            value={thisWeekWorkouts.length.toString()} 
            label="This Week" 
            icon={<CalendarIcon />}
            color="primary"
          />
          <StatCard 
            value={thisWeekWorkouts.reduce((sum, w) => sum + w.set_count, 0).toString()} 
            label="Sets" 
            icon={<DumbbellIcon />}
            color="accent"
          />
          <StatCard 
            value={thisWeekVolume > 0 ? `${Math.round(thisWeekVolume).toLocaleString()} kg` : "—"} 
            label="Volume" 
            icon={<WeightIcon />}
            color="warning"
          />
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-muted transition-all hover:bg-surface-elevated hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {showFilters ? "Hide Filters" : "Filters & Sort"}
          {(dateFilter !== "all" || sortOption !== "date_desc") && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              !
            </span>
          )}
        </button>

        {showFilters && (
          <div className="mt-3 space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div>
              <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-muted">Date Range</label>
              <div className="flex flex-wrap gap-2">
                {DATE_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setDateFilter(filter.value)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                      dateFilter === filter.value
                        ? "bg-primary text-white shadow-sm"
                        : "bg-primary-light/50 text-primary hover:bg-primary-light dark:bg-primary-light/20"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-muted">Sort By</label>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortOption(option.value)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                      sortOption === option.value
                        ? "bg-primary text-white shadow-sm"
                        : "bg-primary-light/50 text-primary hover:bg-primary-light dark:bg-primary-light/20"
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
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          {filteredWorkouts.length} workout{filteredWorkouts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filteredWorkouts.length === 0 ? (
        <div className="py-16 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light/30 mb-4">
            <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">No workouts found</h2>
          <p className="text-sm text-muted mb-4">
            {workouts.length === 0
              ? "Start your first workout and begin tracking your progress."
              : "Try adjusting your filters to see more results."}
          </p>
          {workouts.length === 0 && (
            <Link
              href="/workouts/active"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Start Workout
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWorkouts.map((workout, index) => (
            <Link
              key={workout.id}
              href={`/workouts/${workout.id}`}
              className="group block rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light/50 dark:bg-primary-light/20">
                    <span className="text-sm font-bold text-primary">
                      {new Date(workout.started_at).getDate()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{workout.name || "Workout"}</h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted">
                      <span>{formatDate(workout.started_at)}</span>
                      <span className="text-border">·</span>
                      <span>{formatDuration(workout.started_at, workout.ended_at)}</span>
                    </div>
                  </div>
                </div>
                {workout.total_volume > 0 && (
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-primary">
                      {Math.round(workout.total_volume).toLocaleString()} kg
                    </div>
                    <div className="text-xs text-muted">volume</div>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted border-t border-border/50 pt-3">
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                  {workout.exercise_count} exercises
                </span>
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                  {workout.set_count} sets
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ value, label, icon, color }: { value: string; label: string; icon: React.ReactNode; color: string }) {
  const colorClasses: Record<string, string> = {
    primary: "bg-primary-light text-primary dark:bg-primary-light/30",
    accent: "bg-accent-light text-accent dark:bg-accent-light/30",
    warning: "bg-warning/10 text-warning",
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 text-center transition-all hover:shadow-md">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-extrabold text-foreground">{value}</div>
      <div className="text-xs font-semibold text-muted uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

// Icons
function CalendarIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function DumbbellIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function WeightIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}
