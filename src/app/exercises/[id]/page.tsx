"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Exercise } from "@/db/schema";
import { createBrowserClient } from "@/db/client";
import { PRBadges } from "@/components/pr-badges";
import { ProgressChart } from "@/components/progress-chart";
import { calculateExercisePRs, type SetWithContext } from "@/lib/pr-calculator";

interface WorkoutHistoryEntry {
  workout_id: string;
  workout_name: string | null;
  date: string;
  best_weight: number | null;
  best_reps: number | null;
  total_volume: number;
  sets_count: number;
}

export default function ExerciseProgressPage() {
  const params = useParams();
  const exerciseId = params.id as string;

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [chartData, setChartData] = useState<{ date: string; weight: number | null; volume: number | null; estimated_1rm: number | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createBrowserClient();

      // Fetch exercise
      const { data: exerciseData, error: exerciseError } = await supabase
        .from("exercises")
        .select("*")
        .eq("id", exerciseId)
        .single();

      if (exerciseError || !exerciseData) {
        setLoading(false);
        return;
      }

      setExercise(exerciseData as Exercise);

      // Fetch all workout_exercises for this exercise
      const { data: workoutExercises } = await supabase
        .from("workout_exercises")
        .select("id, workout_id, exercise_name")
        .eq("exercise_id", exerciseId)
        .order("id", { ascending: false });

      if (!workoutExercises || workoutExercises.length === 0) {
        setLoading(false);
        return;
      }

      const weIds = (workoutExercises as { id: string; workout_id: string; exercise_name: string }[]).map((we) => we.id);

      // Fetch all sets for these workout_exercises
      const { data: setsData } = await supabase
        .from("sets")
        .select("workout_exercise_id, set_number, reps, weight")
        .in("workout_exercise_id", weIds)
        .order("set_number");

      // Fetch workout metadata
      const workoutIds = [...new Set((workoutExercises as { workout_id: string }[]).map((we) => we.workout_id))];
      const { data: workoutsData } = await supabase
        .from("workouts")
        .select("id, name, started_at")
        .in("id", workoutIds)
        .order("started_at", { ascending: true });

      const workoutsMap = new Map(
        (workoutsData as { id: string; name: string | null; started_at: string }[] | null ?? []).map((w) => [
          w.id,
          w,
        ])
      );

      // Build history per workout
      const workoutExerciseMap = new Map(
        (workoutExercises as { id: string; workout_id: string }[]).map((we) => [we.id, we.workout_id])
      );

      const historyEntries: WorkoutHistoryEntry[] = [];
      const chartPoints: { date: string; weight: number | null; volume: number | null; estimated_1rm: number | null }[] = [];

      for (const workoutId of workoutIds) {
        const workout = workoutsMap.get(workoutId);
        if (!workout) continue;

        const weIdsForWorkout = (workoutExercises as { id: string; workout_id: string }[])
          .filter((we) => we.workout_id === workoutId)
          .map((we) => we.id);

        const setsForWorkout = (setsData as { workout_exercise_id: string; weight: number | null; reps: number | null }[] | null ?? []).filter((s) =>
          weIdsForWorkout.includes(s.workout_exercise_id)
        );

        let bestWeight: number | null = null;
        let bestReps: number | null = null;
        let totalVolume = 0;

        for (const set of setsForWorkout) {
          if (set.weight !== null && set.reps !== null) {
            if (bestWeight === null || set.weight > bestWeight) {
              bestWeight = set.weight;
              bestReps = set.reps;
            }
            totalVolume += set.weight * set.reps;
          }
        }

        historyEntries.push({
          workout_id: workoutId,
          workout_name: workout.name,
          date: workout.started_at,
          best_weight: bestWeight,
          best_reps: bestReps,
          total_volume: totalVolume,
          sets_count: setsForWorkout.length,
        });

        let max1RM: number | null = null;
        for (const set of setsForWorkout) {
          if (set.weight !== null && set.reps !== null && set.weight > 0 && set.reps > 0) {
            const oneRM = set.weight * (1 + set.reps / 30);
            if (max1RM === null || oneRM > max1RM) {
              max1RM = oneRM;
            }
          }
        }

        chartPoints.push({
          date: workout.started_at,
          weight: bestWeight,
          volume: totalVolume > 0 ? totalVolume : null,
          estimated_1rm: max1RM,
        });
      }

      // Sort history newest first
      historyEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistory(historyEntries);
      setChartData(chartPoints);
      setLoading(false);
    }

    fetchData();
  }, [exerciseId]);

  // Calculate PRs
  const allSets: SetWithContext[] = history.flatMap((h) => {
    if (h.best_weight !== null && h.best_reps !== null) {
      return [{ weight: h.best_weight, reps: h.best_reps, date: h.date, workout_id: h.workout_id }];
    }
    return [];
  });
  const prs = calculateExercisePRs(allSets);

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center text-zinc-500">
        Loading exercise data...
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <div className="text-red-600">Exercise not found</div>
        <Link href="/exercises" className="mt-4 inline-block text-sm text-zinc-500 hover:text-zinc-900">
          ← Back to exercises
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-4">
      {/* Back link */}
      <Link
        href="/exercises"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-300"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to exercises
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{exercise.name}</h1>
        <div className="mt-1 flex flex-wrap gap-2 text-sm text-zinc-500">
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
            {exercise.primary_muscle_group}
          </span>
          {exercise.equipment && <span>{exercise.equipment}</span>}
          {exercise.is_custom && (
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Custom
            </span>
          )}
        </div>
      </div>

      {/* PR Badges */}
      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Personal Records</h2>
        <PRBadges prs={prs} />
      </div>

      {/* Progress Chart */}
      {history.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Progress Over Time</h2>
          <ProgressChart data={chartData} />
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Workout History</h2>
        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 py-8 text-center text-zinc-500 dark:border-zinc-700">
            No workouts logged yet. Start tracking to see your progress!
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => (
              <Link
                key={entry.workout_id}
                href={`/workouts/${entry.workout_id}`}
                className="block rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{entry.workout_name || "Workout"}</div>
                    <div className="text-xs text-zinc-500">{formatDate(entry.date)}</div>
                  </div>
                  <div className="text-right text-sm">
                    {entry.best_weight !== null && (
                      <div className="font-medium">{entry.best_weight} kg × {entry.best_reps}</div>
                    )}
                    <div className="text-xs text-zinc-500">
                      {entry.sets_count} sets · {Math.round(entry.total_volume)} kg volume
                    </div>
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
