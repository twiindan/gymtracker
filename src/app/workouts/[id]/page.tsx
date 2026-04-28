"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { Workout, WorkoutExercise, Set, Exercise } from "@/db/schema";
import { createBrowserClient } from "@/db/client";
import { ExercisePicker } from "@/components/exercise-picker";

interface ExerciseWithSets extends WorkoutExercise {
  sets: Set[];
}

interface WorkoutDetail {
  workout: Workout;
  exercises: ExerciseWithSets[];
}

export default function WorkoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workoutId = params.id as string;

  const [data, setData] = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    started_at: "",
    notes: "",
  });

  async function fetchWorkout() {
    const supabase = createBrowserClient();

    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .select("*")
      .eq("id", workoutId)
      .is("deleted_at", null)
      .single();

    if (workoutError || !workout) {
      setError("Workout not found");
      setLoading(false);
      return;
    }

    const { data: exercises, error: exercisesError } = await supabase
      .from("workout_exercises")
      .select("*")
      .eq("workout_id", workoutId)
      .order("sort_order");

    if (exercisesError) {
      setError(exercisesError.message);
      setLoading(false);
      return;
    }

    const exercisesWithSets = await Promise.all(
      (exercises as WorkoutExercise[] ?? []).map(async (ex) => {
        const { data: sets } = await supabase
          .from("sets")
          .select("*")
          .eq("workout_exercise_id", ex.id)
          .order("set_number");

        return {
          ...ex,
          sets: (sets ?? []) as Set[],
        };
      })
    );

    const workoutData = {
      workout: workout as Workout,
      exercises: exercisesWithSets,
    };

    setData(workoutData);
    setEditForm({
      name: workoutData.workout.name || "",
      started_at: new Date(workoutData.workout.started_at).toISOString().slice(0, 16),
      notes: workoutData.workout.notes || "",
    });
    setLoading(false);
  }

  useEffect(() => {
    fetchWorkout();
  }, [workoutId]);

  async function saveMetadata() {
    if (!data) return;
    setSaving(true);

    const supabase = createBrowserClient();
    const { error } = await supabase
      .from("workouts")
      .update({
        name: editForm.name || null,
        started_at: new Date(editForm.started_at).toISOString(),
        notes: editForm.notes || null,
      } as never)
      .eq("id", workoutId);

    if (error) {
      setError(error.message);
    } else {
      await fetchWorkout();
      setIsEditing(false);
    }
    setSaving(false);
  }

  async function addExerciseToWorkout(exercise: Exercise) {
    if (!data) return;
    const supabase = createBrowserClient();

    const { data: weData, error: weError } = await supabase
      .from("workout_exercises")
      .insert({
        workout_id: workoutId,
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        primary_muscle_group: exercise.primary_muscle_group,
        sort_order: data.exercises.length,
        notes: null,
      } as never)
      .select("id")
      .single();

    if (weError || !weData) {
      setError(weError?.message || "Failed to add exercise");
      return;
    }

    // Add one empty set
    await supabase.from("sets").insert({
      workout_exercise_id: (weData as { id: string }).id,
      set_number: 1,
      reps: null,
      weight: null,
      notes: null,
    } as never);

    await fetchWorkout();
    setShowPicker(false);
  }

  async function removeExercise(exerciseId: string) {
    if (!confirm("Remove this exercise and all its sets?")) return;

    const supabase = createBrowserClient();
    const { error } = await supabase
      .from("workout_exercises")
      .delete()
      .eq("id", exerciseId);

    if (error) {
      setError(error.message);
    } else {
      await fetchWorkout();
    }
  }

  async function updateSet(setId: string, field: "weight" | "reps", value: number | null) {
    const supabase = createBrowserClient();
    const { error } = await supabase
      .from("sets")
      .update({ [field]: value } as never)
      .eq("id", setId);

    if (error) setError(error.message);
  }

  async function addSet(workoutExerciseId: string, currentSetCount: number) {
    const supabase = createBrowserClient();
    const { error } = await supabase.from("sets").insert({
      workout_exercise_id: workoutExerciseId,
      set_number: currentSetCount + 1,
      reps: null,
      weight: null,
      notes: null,
    } as never);

    if (error) {
      setError(error.message);
    } else {
      await fetchWorkout();
    }
  }

  async function deleteSet(setId: string, workoutExerciseId: string) {
    const supabase = createBrowserClient();
    const { error } = await supabase.from("sets").delete().eq("id", setId);

    if (error) {
      setError(error.message);
      return;
    }

    // Resequence remaining sets
    const { data: remainingSets } = await supabase
      .from("sets")
      .select("id")
      .eq("workout_exercise_id", workoutExerciseId)
      .order("set_number");

    if (remainingSets) {
      for (let i = 0; i < remainingSets.length; i++) {
        await supabase
          .from("sets")
          .update({ set_number: i + 1 } as never)
          .eq("id", (remainingSets[i] as { id: string }).id);
      }
    }

    await fetchWorkout();
  }

  async function deleteWorkout() {
    const supabase = createBrowserClient();
    const { error } = await supabase
      .from("workouts")
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq("id", workoutId);

    if (error) {
      setError(error.message);
    } else {
      router.push("/workouts");
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatDuration(started: string, ended: string | null): string {
    if (!ended) return "In progress";
    const start = new Date(started).getTime();
    const end = new Date(ended).getTime();
    const mins = Math.round((end - start) / 60000);
    return `${mins} min`;
  }

  function calculateSetVolume(set: Set): number {
    if (set.reps && set.weight) {
      return set.reps * set.weight;
    }
    return 0;
  }

  function calculateTotalVolume(exercises: ExerciseWithSets[]): number {
    return exercises.reduce((total, ex) => {
      return total + ex.sets.reduce((sum, set) => sum + calculateSetVolume(set), 0);
    }, 0);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center text-zinc-500">
        Loading workout...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <div className="text-red-600">{error || "Workout not found"}</div>
        <Link
          href="/workouts"
          className="mt-4 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
        >
          ← Back to workouts
        </Link>
      </div>
    );
  }

  const { workout, exercises } = data;
  const totalVolume = calculateTotalVolume(exercises);
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  return (
    <div className="mx-auto max-w-2xl py-4">
      {/* Back link */}
      <Link
        href="/workouts"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-300"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to workouts
      </Link>

      {/* Header */}
      <div className="mb-6">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Workout Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Workout name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Date & Time</label>
              <input
                type="datetime-local"
                value={editForm.started_at}
                onChange={(e) => setEditForm({ ...editForm, started_at: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Optional notes..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveMetadata}
                disabled={saving}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditForm({
                    name: workout.name || "",
                    started_at: new Date(workout.started_at).toISOString().slice(0, 16),
                    notes: workout.notes || "",
                  });
                }}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {workout.name || "Workout"}
                </h1>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-500">
                  <span>{formatDate(workout.started_at)}</span>
                  <span>·</span>
                  <span>
                    {formatTime(workout.started_at)} -{" "}
                    {workout.ended_at ? formatTime(workout.ended_at) : "..."}
                  </span>
                  <span>·</span>
                  <span>{formatDuration(workout.started_at, workout.ended_at)}</span>
                </div>
              </div>
              <div className="flex gap-2">
              <Link
                href={`/workouts/active?copy_from=${workout.id}`}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Copy
              </Link>
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900"
              >
                Delete
              </button>
              </div>
            </div>
            {workout.notes && (
              <div className="mt-3 rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {workout.notes}
              </div>
            )}
          </>
        )}
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-2xl font-bold">{exercises.length}</div>
          <div className="text-xs text-zinc-500">Exercises</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-2xl font-bold">{totalSets}</div>
          <div className="text-xs text-zinc-500">Sets</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-2xl font-bold">
            {totalVolume > 0 ? `${Math.round(totalVolume).toLocaleString()} kg` : "—"}
          </div>
          <div className="text-xs text-zinc-500">Volume</div>
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {exercises.map((exercise) => {
          const exerciseVolume = exercise.sets.reduce(
            (sum, set) => sum + calculateSetVolume(set),
            0
          );

          return (
            <div
              key={exercise.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{exercise.exercise_name}</h3>
                  <div className="text-xs text-zinc-500">{exercise.primary_muscle_group}</div>
                </div>
                <div className="flex items-center gap-2">
                  {exerciseVolume > 0 && (
                    <div className="text-right text-sm text-zinc-500">
                      {Math.round(exerciseVolume).toLocaleString()} kg
                    </div>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => removeExercise(exercise.id)}
                      className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900"
                      title="Remove exercise"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Sets table */}
              {exercise.sets.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800">
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Set</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">Weight</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">Reps</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">RPE</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">Volume</th>
                        {isEditing && <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {exercise.sets.map((set) => (
                        <tr key={set.id}>
                          <td className="px-3 py-2">{set.set_number}</td>
                          <td className="px-3 py-2 text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                inputMode="decimal"
                                defaultValue={set.weight ?? ""}
                                onBlur={(e) => {
                                  const val = e.target.value === "" ? null : parseFloat(e.target.value);
                                  updateSet(set.id, "weight", val).then(() => fetchWorkout());
                                }}
                                className="w-20 rounded border border-zinc-300 px-2 py-1 text-right text-sm dark:border-zinc-700 dark:bg-zinc-900"
                                min={0}
                                step={0.5}
                              />
                            ) : (
                              set.weight !== null ? `${set.weight} kg` : "—"
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                inputMode="numeric"
                                defaultValue={set.reps ?? ""}
                                onBlur={(e) => {
                                  const val = e.target.value === "" ? null : parseInt(e.target.value, 10);
                                  updateSet(set.id, "reps", val).then(() => fetchWorkout());
                                }}
                                className="w-20 rounded border border-zinc-300 px-2 py-1 text-right text-sm dark:border-zinc-700 dark:bg-zinc-900"
                                min={0}
                                step={1}
                              />
                            ) : (
                              set.reps !== null ? set.reps : "—"
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {set.rpe !== null ? (
                              <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                {set.rpe}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {calculateSetVolume(set) > 0
                              ? `${Math.round(calculateSetVolume(set)).toLocaleString()} kg`
                              : "—"}
                          </td>
                          {isEditing && (
                            <td className="px-3 py-2 text-right">
                              <button
                                onClick={() => deleteSet(set.id, exercise.id)}
                                className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-zinc-500">No sets logged</div>
              )}

              {isEditing && (
                <button
                  onClick={() => addSet(exercise.id, exercise.sets.length)}
                  className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 py-2 text-sm font-medium text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Set
                </button>
              )}
            </div>
          );
        })}
      </div>

      {isEditing && (
        <button
          onClick={() => setShowPicker(true)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 py-4 text-base font-semibold text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Exercise
        </button>
      )}

      {/* Exercise Picker Modal */}
      {showPicker && (
        <ExercisePicker
          onSelect={addExerciseToWorkout}
          onClose={() => setShowPicker(false)}
          excludeIds={exercises.map((ex) => ex.exercise_id)}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Delete Workout</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Delete this workout? This cannot be undone.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={deleteWorkout}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
