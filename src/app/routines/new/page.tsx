"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Exercise } from "@/db/schema";
import { createBrowserClient } from "@/db/client";
import { ExercisePicker } from "@/components/exercise-picker";

interface RoutineExerciseForm {
  id: string; // temp client id
  exercise_id: string;
  exercise_name: string;
  primary_muscle_group: string;
  sort_order: number;
  target_sets: number;
  target_reps_min: number | null;
  target_reps_max: number | null;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export default function NewRoutinePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState<RoutineExerciseForm[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addExercise(exercise: Exercise) {
    const newExercise: RoutineExerciseForm = {
      id: generateId(),
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      primary_muscle_group: exercise.primary_muscle_group,
      sort_order: exercises.length,
      target_sets: 3,
      target_reps_min: 8,
      target_reps_max: 12,
    };
    setExercises([...exercises, newExercise]);
    setShowPicker(false);
  }

  function removeExercise(exerciseId: string) {
    setExercises(exercises.filter((ex) => ex.id !== exerciseId).map((ex, i) => ({ ...ex, sort_order: i })));
  }

  function moveExercise(exerciseId: string, direction: "up" | "down") {
    const index = exercises.findIndex((ex) => ex.id === exerciseId);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === exercises.length - 1) return;

    const newExercises = [...exercises];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newExercises[index], newExercises[swapIndex]] = [newExercises[swapIndex], newExercises[index]];
    setExercises(newExercises.map((ex, i) => ({ ...ex, sort_order: i })));
  }

  function updateExercise(exerciseId: string, field: keyof RoutineExerciseForm, value: unknown) {
    setExercises(exercises.map((ex) => (ex.id === exerciseId ? { ...ex, [field]: value } : ex)));
  }

  async function saveRoutine() {
    if (!name.trim()) {
      setError("Routine name is required");
      return;
    }
    if (exercises.length === 0) {
      setError("Add at least one exercise");
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createBrowserClient();

    try {
      // Insert routine
      const { data: routineData, error: routineError } = await supabase
        .from("routines")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
        } as never)
        .select("id")
        .single();

      if (routineError || !routineData) throw routineError || new Error("Failed to create routine");

      const routineId = (routineData as { id: string }).id;

      // Insert routine_exercises
      const routineExercisesToInsert = exercises.map((ex) => ({
        routine_id: routineId,
        exercise_id: ex.exercise_id,
        exercise_name: ex.exercise_name,
        primary_muscle_group: ex.primary_muscle_group,
        sort_order: ex.sort_order,
        target_sets: ex.target_sets,
        target_reps_min: ex.target_reps_min,
        target_reps_max: ex.target_reps_max,
        notes: null,
      }));

      const { error: exercisesError } = await supabase.from("routine_exercises").insert(routineExercisesToInsert as never);
      if (exercisesError) throw exercisesError;

      router.push(`/routines/${routineId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save routine");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-4">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">New Routine</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Routine Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Push Day"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            rows={2}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>

      {/* Exercises */}
      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Exercises</h2>

        {exercises.length === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-300 py-8 text-center text-zinc-500 dark:border-zinc-700">
            No exercises yet. Tap below to add exercises.
          </div>
        )}

        <div className="space-y-3">
          {exercises.map((exercise, index) => (
            <div
              key={exercise.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{exercise.exercise_name}</h3>
                  <div className="text-xs text-zinc-500">{exercise.primary_muscle_group}</div>
                </div>
                <div className="flex gap-1">
                  {index > 0 && (
                    <button
                      onClick={() => moveExercise(exercise.id, "up")}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                  )}
                  {index < exercises.length - 1 && (
                    <button
                      onClick={() => moveExercise(exercise.id, "down")}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => removeExercise(exercise.id)}
                    className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Target Sets</label>
                  <input
                    type="number"
                    value={exercise.target_sets}
                    onChange={(e) => updateExercise(exercise.id, "target_sets", parseInt(e.target.value) || 1)}
                    min={1}
                    max={20}
                    className="w-full rounded-md border border-zinc-200 px-2 py-1.5 text-center text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Min Reps</label>
                  <input
                    type="number"
                    value={exercise.target_reps_min ?? ""}
                    onChange={(e) => updateExercise(exercise.id, "target_reps_min", e.target.value === "" ? null : parseInt(e.target.value))}
                    min={1}
                    className="w-full rounded-md border border-zinc-200 px-2 py-1.5 text-center text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Max Reps</label>
                  <input
                    type="number"
                    value={exercise.target_reps_max ?? ""}
                    onChange={(e) => updateExercise(exercise.id, "target_reps_max", e.target.value === "" ? null : parseInt(e.target.value))}
                    min={1}
                    className="w-full rounded-md border border-zinc-200 px-2 py-1.5 text-center text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowPicker(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 py-3 text-sm font-semibold text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Exercise
        </button>
      </div>

      {/* Save button */}
      <div className="mt-8 flex gap-3">
        <button
          onClick={saveRoutine}
          disabled={saving}
          className="flex-1 rounded-lg bg-zinc-900 py-3 text-base font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {saving ? "Saving..." : "Save Routine"}
        </button>
        <button
          onClick={() => router.push("/routines")}
          className="rounded-lg border border-zinc-300 px-6 py-3 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>

      {/* Exercise Picker */}
      {showPicker && (
        <ExercisePicker
          onSelect={addExercise}
          onClose={() => setShowPicker(false)}
          excludeIds={exercises.map((ex) => ex.exercise_id)}
        />
      )}
    </div>
  );
}
