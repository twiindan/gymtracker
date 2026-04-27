"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { Routine, RoutineExercise } from "@/db/schema";
import { createBrowserClient } from "@/db/client";

export default function RoutineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const routineId = params.id as string;

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoutine() {
      const supabase = createBrowserClient();

      const { data: routineData, error: routineError } = await supabase
        .from("routines")
        .select("*")
        .eq("id", routineId)
        .single();

      if (routineError || !routineData) {
        setError("Routine not found");
        setLoading(false);
        return;
      }

      const { data: exercisesData, error: exercisesError } = await supabase
        .from("routine_exercises")
        .select("*")
        .eq("routine_id", routineId)
        .order("sort_order");

      if (exercisesError) {
        setError(exercisesError.message);
        setLoading(false);
        return;
      }

      setRoutine(routineData as Routine);
      setExercises((exercisesData ?? []) as RoutineExercise[]);
      setLoading(false);
    }

    fetchRoutine();
  }, [routineId]);

  async function deleteRoutine() {
    if (!confirm("Delete this routine? This cannot be undone.")) return;

    const supabase = createBrowserClient();
    const { error } = await supabase.from("routines").delete().eq("id", routineId);

    if (error) {
      setError(error.message);
    } else {
      router.push("/routines");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center text-zinc-500">
        Loading routine...
      </div>
    );
  }

  if (error || !routine) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="text-red-600">{error || "Routine not found"}</div>
        <Link
          href="/routines"
          className="mt-4 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
        >
          ← Back to routines
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Back link */}
      <Link
        href="/routines"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-300"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to routines
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{routine.name}</h1>
            {routine.description && (
              <p className="mt-1 text-sm text-zinc-500">{routine.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/workouts/active?routine_id=${routineId}`}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Start Workout
            </Link>
            <button
              onClick={deleteRoutine}
              className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-2xl font-bold">{exercises.length}</div>
          <div className="text-xs text-zinc-500">Exercises</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-2xl font-bold">
            {exercises.reduce((sum, ex) => sum + (ex.target_sets || 0), 0)}
          </div>
          <div className="text-xs text-zinc-500">Total Sets</div>
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-3">
        {exercises.map((exercise, index) => (
          <div
            key={exercise.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{exercise.exercise_name}</h3>
                <div className="text-xs text-zinc-500">{exercise.primary_muscle_group}</div>
              </div>
              <div className="text-right text-sm text-zinc-500">
                <div>{exercise.target_sets} sets</div>
                {(exercise.target_reps_min || exercise.target_reps_max) && (
                  <div className="text-xs">
                    {exercise.target_reps_min ?? "?"} - {exercise.target_reps_max ?? "?"} reps
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
