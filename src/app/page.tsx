"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Workout } from "@/db/schema";
import { createBrowserClient } from "@/db/client";
import { calculateExercisePRs, type SetWithContext } from "@/lib/pr-calculator";

interface RecentWorkout {
  id: string;
  name: string | null;
  started_at: string;
  exercise_count: number;
  set_count: number;
}

interface RecentRoutine {
  id: string;
  name: string;
  exercise_count: number;
}

interface RecentPR {
  exercise_name: string;
  type: string;
  value: string;
  date: string;
}

export default function Home() {
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);
  const [recentRoutines, setRecentRoutines] = useState<RecentRoutine[]>([]);
  const [recentPRs, setRecentPRs] = useState<RecentPR[]>([]);
  const [monthlyVolume, setMonthlyVolume] = useState(0);
  const [workoutStreak, setWorkoutStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecent() {
      const supabase = createBrowserClient();

      const { data: workouts } = await supabase
        .from("workouts")
        .select("*")
        .is("deleted_at", null)
        .order("started_at", { ascending: false })
        .limit(3);

      const enriched = await Promise.all(
        (workouts as Workout[] | null ?? []).map(async (workout) => {
          const { data: exercises } = await supabase
            .from("workout_exercises")
            .select("id")
            .eq("workout_id", workout.id);

          const exerciseIds = (exercises as { id: string }[] | null)?.map((e) => e.id) ?? [];
          let setCount = 0;

          if (exerciseIds.length > 0) {
            const { data: sets } = await supabase
              .from("sets")
              .select("id")
              .in("workout_exercise_id", exerciseIds);
            setCount = (sets as { id: string }[] | null)?.length ?? 0;
          }

          return {
            id: workout.id,
            name: workout.name,
            started_at: workout.started_at,
            exercise_count: exerciseIds.length,
            set_count: setCount,
          };
        })
      );

      setRecentWorkouts(enriched);

      // Fetch recent routines
      const { data: routines } = await supabase
        .from("routines")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(3);

      const routinesWithCount = await Promise.all(
        (routines ?? []).map(async (routine) => {
          const { count } = await supabase
            .from("routine_exercises")
            .select("*", { count: "exact", head: true })
            .eq("routine_id", (routine as { id: string }).id);
          return {
            id: (routine as { id: string }).id,
            name: (routine as { name: string }).name,
            exercise_count: count ?? 0,
          };
        })
      );

      setRecentRoutines(routinesWithCount);

      // Calculate monthly volume
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: monthWorkouts } = await supabase
        .from("workouts")
        .select("id")
        .gte("started_at", monthStart.toISOString())
        .is("deleted_at", null);

      let monthVolume = 0;
      if (monthWorkouts && monthWorkouts.length > 0) {
        const monthWorkoutIds = monthWorkouts.map((w) => (w as { id: string }).id);
        const { data: monthExercises } = await supabase
          .from("workout_exercises")
          .select("id")
          .in("workout_id", monthWorkoutIds);

        if (monthExercises && monthExercises.length > 0) {
          const monthExerciseIds = (monthExercises as { id: string }[]).map((e) => e.id);
          const { data: monthSets } = await supabase
            .from("sets")
            .select("weight, reps")
            .in("workout_exercise_id", monthExerciseIds);

          monthVolume = ((monthSets as { weight: number | null; reps: number | null }[] | null) ?? []).reduce(
            (sum, set) => sum + (set.weight && set.reps ? set.weight * set.reps : 0),
            0
          );
        }
      }
      setMonthlyVolume(monthVolume);

      // Calculate workout streak (consecutive weeks with at least 1 workout in last 30 days)
      const { data: allWorkouts } = await supabase
        .from("workouts")
        .select("started_at")
        .is("deleted_at", null)
        .order("started_at", { ascending: false })
        .limit(100);

      if (allWorkouts && allWorkouts.length > 0) {
        const weeks = new Set<string>();
        (allWorkouts as { started_at: string }[]).forEach((w) => {
          const date = new Date(w.started_at);
          const yearWeek = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
          weeks.add(yearWeek);
        });
        setWorkoutStreak(Math.min(weeks.size, 4)); // Cap at 4 for display
      }

      // Fetch recent PRs (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentSets } = await supabase
        .from("sets")
        .select("weight, reps, workout_exercise_id, created_at")
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (recentSets && recentSets.length > 0) {
        const weIds = [...new Set((recentSets as { workout_exercise_id: string }[]).map((s) => s.workout_exercise_id))];

        const { data: workoutExercises } = await supabase
          .from("workout_exercises")
          .select("id, exercise_id, exercise_name")
          .in("id", weIds);

        const weMap = new Map(
          (workoutExercises as { id: string; exercise_id: string; exercise_name: string }[] | null ?? []).map((we) => [
            we.id,
            we,
          ])
        );

        // Group sets by exercise and find PRs
        const exerciseSets = new Map<string, SetWithContext[]>();
        (recentSets as { weight: number | null; reps: number | null; workout_exercise_id: string; created_at: string }[]).forEach(
          (set) => {
            const we = weMap.get(set.workout_exercise_id);
            if (!we || set.weight === null || set.reps === null) return;

            if (!exerciseSets.has(we.exercise_id)) {
              exerciseSets.set(we.exercise_id, []);
            }
            exerciseSets.get(we.exercise_id)!.push({
              weight: set.weight,
              reps: set.reps,
              date: set.created_at,
              workout_id: set.workout_exercise_id,
            });
          }
        );

        const prs: RecentPR[] = [];
        for (const [exerciseId, sets] of exerciseSets) {
          const prsData = calculateExercisePRs(sets);
          const we = Array.from(weMap.values()).find((w) => w.exercise_id === exerciseId);
          if (!we) continue;

          if (prsData.max_weight) {
            prs.push({
              exercise_name: we.exercise_name,
              type: "Max Weight",
              value: `${prsData.max_weight.value} kg`,
              date: prsData.max_weight.date,
            });
          }
          if (prsData.estimated_1rm) {
            prs.push({
              exercise_name: we.exercise_name,
              type: "Est. 1RM",
              value: `${Math.round(prsData.estimated_1rm.value)} kg`,
              date: prsData.estimated_1rm.date,
            });
          }
        }

        // Sort by date and take top 5
        prs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentPRs(prs.slice(0, 5));
      }

      setLoading(false);
    }

    fetchRecent();
  }, []);

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">GymTracker</h1>
        <p className="mt-2 text-zinc-500">
          Effortlessly log every workout and clearly see strength progress over time.
        </p>
      </div>

      {/* Start Workout CTA */}
      <div className="mb-8">
        <Link
          href="/workouts/active"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-4 text-lg font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Start Workout
        </Link>
      </div>

      {/* Stats Row */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-2xl font-bold">{loading ? "—" : Math.round(monthlyVolume).toLocaleString()}</div>
          <div className="text-xs text-zinc-500">kg this month</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-2xl font-bold">{loading ? "—" : workoutStreak}</div>
          <div className="text-xs text-zinc-500">Active weeks</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-2xl font-bold">{loading ? "—" : recentWorkouts.length}</div>
          <div className="text-xs text-zinc-500">Recent workouts</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-2xl font-bold">{loading ? "—" : recentRoutines.length}</div>
          <div className="text-xs text-zinc-500">Routines</div>
        </div>
      </div>

      {/* Recent PRs */}
      {recentPRs.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Recent PRs</h2>
          <div className="space-y-2">
            {recentPRs.map((pr, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <div className="font-medium">{pr.exercise_name}</div>
                  <div className="text-xs text-zinc-500">{pr.type}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-amber-700 dark:text-amber-400">{pr.value}</div>
                  <div className="text-xs text-zinc-500">{formatDate(pr.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Routines */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Routines</h2>
          <Link
            href="/routines"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-300"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-zinc-500">Loading...</div>
        ) : recentRoutines.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 py-6 text-center dark:border-zinc-700">
            <p className="text-zinc-500">No routines yet. Create your first template!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentRoutines.map((routine) => (
              <Link
                key={routine.id}
                href={`/workouts/active?routine_id=${routine.id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-3 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{routine.name}</span>
                  </div>
                  <div className="text-xs text-zinc-500">{routine.exercise_count} exercises</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Workouts */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Workouts</h2>
          <Link
            href="/workouts"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-300"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-zinc-500">Loading...</div>
        ) : recentWorkouts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 py-8 text-center dark:border-zinc-700">
            <p className="text-zinc-500">No workouts yet. Start your first one!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentWorkouts.map((workout) => (
              <Link
                key={workout.id}
                href={`/workouts/${workout.id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-3 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{workout.name || "Workout"}</div>
                    <div className="text-xs text-zinc-500">{formatDate(workout.started_at)}</div>
                  </div>
                  <div className="text-right text-xs text-zinc-500">
                    <div>{workout.exercise_count} exercises</div>
                    <div>{workout.set_count} sets</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
