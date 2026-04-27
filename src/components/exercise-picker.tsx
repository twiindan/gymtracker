"use client";

import { useState, useEffect } from "react";
import type { Exercise } from "@/db/schema";
import { createBrowserClient } from "@/db/client";
import { ExerciseSearch } from "./exercise-search";

interface ExercisePickerProps {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
  excludeIds?: string[];
}

export function ExercisePicker({ onSelect, onClose, excludeIds = [] }: ExercisePickerProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filtered, setFiltered] = useState<Exercise[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createBrowserClient();

      // Fetch all exercises
      const { data: allExercises, error } = await supabase
        .from("exercises")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("Error fetching exercises:", error);
      } else {
        setExercises(allExercises ?? []);
        setFiltered(allExercises ?? []);
      }

      // Fetch recent exercises from last 5 workouts
      const { data: recentWorkouts } = await supabase
        .from("workouts")
        .select("id")
        .order("started_at", { ascending: false })
        .limit(5);

      if (recentWorkouts && recentWorkouts.length > 0) {
        const workoutIds = (recentWorkouts as { id: string }[]).map((w) => w.id);
        const { data: recentExercises } = await supabase
          .from("workout_exercises")
          .select("exercise_id")
          .in("workout_id", workoutIds)
          .order("id", { ascending: false })
          .limit(20);

        if (recentExercises) {
          const ids = [...new Set((recentExercises as { exercise_id: string }[]).map((e) => e.exercise_id))];
          setRecentIds(ids);
        }
      }

      setLoading(false);
    }
    fetchData();
  }, []);

  const recentExercises = exercises.filter(
    (ex) => recentIds.includes(ex.id) && !excludeIds.includes(ex.id)
  );

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFiltered(exercises);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(
      exercises.filter(
        (ex) =>
          ex.name.toLowerCase().includes(q) ||
          ex.primary_muscle_group.toLowerCase().includes(q)
      )
    );
  };

  const availableFiltered = filtered.filter((ex) => !excludeIds.includes(ex.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-t-xl bg-white sm:rounded-xl dark:bg-zinc-900">
        <div className="sticky top-0 border-b border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Add Exercise</h2>
            <button
              onClick={onClose}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-3">
            <ExerciseSearch onSearch={handleSearch} resultCount={availableFiltered.length} />
          </div>
        </div>

        <div className="overflow-y-auto p-4">
          {loading ? (
            <div className="py-8 text-center text-zinc-500">Loading exercises...</div>
          ) : (
            <>
              {recentExercises.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-medium text-zinc-500">Recent</h3>
                  <div className="space-y-2">
                    {recentExercises.slice(0, 6).map((exercise) => (
                      <button
                        key={exercise.id}
                        onClick={() => onSelect(exercise)}
                        className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        <div className="font-medium">{exercise.name}</div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {exercise.primary_muscle_group}
                          {exercise.equipment && ` · ${exercise.equipment}`}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="mb-2 text-sm font-medium text-zinc-500">
                  {availableFiltered.length === exercises.length - excludeIds.length
                    ? "All Exercises"
                    : "Search Results"}
                </h3>
                <div className="space-y-2">
                  {availableFiltered.map((exercise) => (
                    <button
                      key={exercise.id}
                      onClick={() => onSelect(exercise)}
                      className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      <div className="font-medium">{exercise.name}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {exercise.primary_muscle_group}
                        {exercise.equipment && ` · ${exercise.equipment}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
