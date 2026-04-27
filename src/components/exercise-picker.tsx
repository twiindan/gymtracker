"use client";

import { useState, useEffect } from "react";
import type { Exercise } from "@/db/schema";
import { createBrowserClient } from "@/db/client";
import { ExerciseSearch } from "./exercise-search";
import { CustomExerciseForm } from "./custom-exercise-form";

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
  const [showCustomForm, setShowCustomForm] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = createBrowserClient();

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

  function handleFormSuccess() {
    setShowCustomForm(false);
    // Refresh exercises list
    async function refresh() {
      const supabase = createBrowserClient();
      const { data } = await supabase
        .from("exercises")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (data) {
        setExercises(data);
        setFiltered(data);
      }
    }
    refresh();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-t-2xl bg-surface sm:rounded-2xl border border-border shadow-2xl animate-slide-up">
        <div className="sticky top-0 border-b border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Add Exercise</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-muted hover:bg-surface-elevated transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-3">
            <ExerciseSearch onSearch={handleSearch} resultCount={availableFiltered.length} />
          </div>
        </div>

        <div className="overflow-y-auto p-4">
          {loading ? (
            <div className="py-8 text-center">
              <div className="inline-flex h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <p className="mt-2 text-sm text-muted">Loading exercises...</p>
            </div>
          ) : (
            <>
              {/* Create custom exercise button */}
              <button
                onClick={() => setShowCustomForm(true)}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary-light/20 px-4 py-3 text-sm font-semibold text-primary transition-all hover:border-primary hover:bg-primary-light/40"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Create New Exercise
              </button>

              {recentExercises.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-semibold text-muted">Recent</h3>
                  <div className="space-y-2">
                    {recentExercises.slice(0, 6).map((exercise) => (
                      <button
                        key={exercise.id}
                        onClick={() => onSelect(exercise)}
                        className="group flex w-full items-center justify-between rounded-xl border border-border bg-surface p-3 text-left transition-all hover:border-primary/50 hover:bg-primary-light/20 dark:hover:bg-primary-light/10"
                      >
                        <div>
                          <div className="font-medium text-sm">{exercise.name}</div>
                          <div className="mt-0.5 text-xs text-muted">
                            {exercise.primary_muscle_group}
                            {exercise.equipment && ` · ${exercise.equipment}`}
                          </div>
                        </div>
                        <svg className="h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="mb-2 text-sm font-semibold text-muted">
                  {availableFiltered.length === exercises.length - excludeIds.length
                    ? "All Exercises"
                    : "Search Results"}
                </h3>
                <div className="space-y-2">
                  {availableFiltered.map((exercise) => (
                    <button
                      key={exercise.id}
                      onClick={() => onSelect(exercise)}
                      className="group flex w-full items-center justify-between rounded-xl border border-border bg-surface p-3 text-left transition-all hover:border-primary/50 hover:bg-primary-light/20 dark:hover:bg-primary-light/10"
                    >
                      <div>
                        <div className="font-medium text-sm">{exercise.name}</div>
                        <div className="mt-0.5 text-xs text-muted">
                          {exercise.primary_muscle_group}
                          {exercise.equipment && ` · ${exercise.equipment}`}
                        </div>
                      </div>
                      <svg className="h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Custom Exercise Form Modal */}
      {showCustomForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-6 shadow-2xl border border-border animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Create New Exercise</h2>
              <button
                onClick={() => setShowCustomForm(false)}
                className="rounded-lg p-2 text-muted hover:bg-surface-elevated transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CustomExerciseForm
              onSuccess={handleFormSuccess}
              onCancel={() => setShowCustomForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
