"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  Exercise,
  ActiveWorkout,
  ActiveWorkoutExercise,
  ActiveSet,
} from "@/db/schema";
import { createBrowserClient } from "@/db/client";
import { ExercisePicker } from "@/components/exercise-picker";
import { SetInput } from "@/components/set-input";
import {
  getProgressionSuggestion,
  fetchExerciseHistory,
  isUpperBodyMuscle,
  detectPlateau,
  groupSetsBySession,
  getLastSetPerSession,
  getMaxWeightReps,
  type ProgressionSuggestion,
} from "@/lib/progression-utils";

const STORAGE_KEY = "gymtracker-active-workout";

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function createEmptySet(setNumber: number, prevSet?: ActiveSet): ActiveSet {
  return {
    id: generateId(),
    set_number: setNumber,
    weight: prevSet?.weight ?? null,
    reps: prevSet?.reps ?? null,
    rpe: prevSet?.rpe ?? null,
    completed: false,
  };
}

function createWorkoutExercise(exercise: Exercise, sortOrder: number): ActiveWorkoutExercise {
  return {
    id: generateId(),
    exercise_id: exercise.id,
    exercise_name: exercise.name,
    primary_muscle_group: exercise.primary_muscle_group,
    tracking_type: exercise.tracking_type,
    sort_order: sortOrder,
    sets: [createEmptySet(1)],
  };
}

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function ActiveWorkoutPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-zinc-500">Loading...</div>}>
      <ActiveWorkoutInner />
    </Suspense>
  );
}

function ActiveWorkoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routineId = searchParams.get("routine_id");
  const copyFromId = searchParams.get("copy_from");
  const scheduledWorkoutId = searchParams.get("scheduled_workout_id");

  const [workout, setWorkout] = useState<ActiveWorkout | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [suggestions, setSuggestions] = useState<ProgressionSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load from localStorage on mount, or initialize from routine/copy
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ActiveWorkout;
        setWorkout(parsed);
        return;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    // Initialize from routine, copy, or scheduled workout if params present
    if (routineId || copyFromId || scheduledWorkoutId) {
      initializeFromSource();
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (workout) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workout));
    }
  }, [workout]);

  // Elapsed timer
  useEffect(() => {
    if (workout) {
      const started = new Date(workout.started_at).getTime();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - started) / 1000));
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [workout?.started_at]);

  // Fetch progression suggestions when exercises are loaded
  useEffect(() => {
    if (workout && workout.exercises.length > 0) {
      fetchSuggestions();
    }
  }, [workout?.id]);

  async function fetchSuggestions() {
    if (!workout) return;
    setLoadingSuggestions(true);
    try {
      const newSuggestions: ProgressionSuggestion[] = [];

      for (const exercise of workout.exercises) {
        try {
          const history = await fetchExerciseHistory(exercise.exercise_id, 20);
          if (history.length === 0) continue;

          const sessions = groupSetsBySession(history);
          const lastPerSession = getLastSetPerSession(sessions);

          // Check for plateau (last 2 sessions same weight/reps)
          const hasPlateau = detectPlateau(lastPerSession, 2);

          // Check for PR: compare most recent session against all-time max
          const { maxWeight, maxReps } = getMaxWeightReps(sessions);
          const lastSession = lastPerSession[0];
          const hasPR =
            (lastSession.weight !== null && lastSession.weight === maxWeight) ||
            (lastSession.reps !== null && lastSession.reps === maxReps);

          const suggestion = getProgressionSuggestion(
            exercise.exercise_id,
            exercise.exercise_name,
            exercise.primary_muscle_group,
            lastSession.weight,
            lastSession.reps,
            hasPlateau,
            hasPR
          );

          if (suggestion) {
            newSuggestions.push(suggestion);
          }
        } catch {
          // Silently skip exercises that fail to fetch history
        }
      }

      setSuggestions(newSuggestions);
    } catch {
      // Silently skip suggestions if fetch fails
    } finally {
      setLoadingSuggestions(false);
    }
  }

  async function initializeFromSource() {
    setInitializing(true);
    const supabase = createBrowserClient();

    try {
      if (routineId) {
        // Fetch routine exercises
        const { data: routineData } = await supabase
          .from("routines")
          .select("*")
          .eq("id", routineId)
          .single();

        const { data: routineExercises } = await supabase
          .from("routine_exercises")
          .select("*")
          .eq("routine_id", routineId)
          .order("sort_order");

        if (routineExercises && routineExercises.length > 0) {
          const exercises: ActiveWorkoutExercise[] = (routineExercises as { exercise_id: string; exercise_name: string; primary_muscle_group: string; target_sets: number }[]).map((re, i) => ({
            id: generateId(),
            exercise_id: re.exercise_id,
            exercise_name: re.exercise_name,
            primary_muscle_group: re.primary_muscle_group,
            tracking_type: "reps" as const,
            sort_order: i,
            sets: Array.from({ length: re.target_sets || 3 }, (_, j) => createEmptySet(j + 1)),
          }));

          const routineName = routineData ? (routineData as { name: string }).name : null;
          const newWorkout: ActiveWorkout = {
            id: null,
            name: routineName ? `${routineName} - ${new Date().toLocaleDateString()}` : null,
            started_at: new Date().toISOString(),
            exercises,
            notes: null,
          };
          setWorkout(newWorkout);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newWorkout));
        } else {
          startWorkout();
        }
      } else if (copyFromId) {
        // Fetch workout to copy
        const { data: workoutData } = await supabase
          .from("workouts")
          .select("*")
          .eq("id", copyFromId)
          .single();

        const { data: workoutExercises } = await supabase
          .from("workout_exercises")
          .select("*")
          .eq("workout_id", copyFromId)
          .order("sort_order");

        if (workoutExercises && workoutExercises.length > 0) {
          const exercises: ActiveWorkoutExercise[] = [];

          for (const we of workoutExercises as { id: string; exercise_id: string; exercise_name: string; primary_muscle_group: string; sort_order: number }[]) {
            const { data: sets } = await supabase
              .from("sets")
              .select("reps, weight, rpe")
              .eq("workout_exercise_id", we.id)
              .order("set_number");

            exercises.push({
              id: generateId(),
              exercise_id: we.exercise_id,
              exercise_name: we.exercise_name,
              primary_muscle_group: we.primary_muscle_group,
              tracking_type: "reps" as const,
              sort_order: we.sort_order,
            sets: (sets as { reps: number | null; weight: number | null; rpe: number | null }[] | null ?? []).map((s, i) => ({
              id: generateId(),
              set_number: i + 1,
              weight: s.weight,
              reps: s.reps,
              rpe: s.rpe,
              completed: false,
            })),
            });
          }

          const sourceName = workoutData ? (workoutData as { name: string | null }).name : null;
          const newWorkout: ActiveWorkout = {
            id: null,
            name: sourceName ? `Copy of ${sourceName}` : null,
            started_at: new Date().toISOString(),
            exercises,
            notes: null,
          };
          setWorkout(newWorkout);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newWorkout));
        } else {
          startWorkout();
        }
      } else if (scheduledWorkoutId) {
        // Fetch scheduled workout
        const { data: scheduledData } = await supabase
          .from("scheduled_workouts")
          .select("*")
          .eq("id", scheduledWorkoutId)
          .single();

        if (scheduledData && (scheduledData as { routine_id: string | null }).routine_id) {
          // Pre-populate from linked routine
          const routineIdFromScheduled = (scheduledData as { routine_id: string | null }).routine_id;
          const { data: routineExercises } = await supabase
            .from("routine_exercises")
            .select("*")
            .eq("routine_id", routineIdFromScheduled!)
            .order("sort_order");

          if (routineExercises && routineExercises.length > 0) {
            const exercises: ActiveWorkoutExercise[] = (routineExercises as { exercise_id: string; exercise_name: string; primary_muscle_group: string; target_sets: number }[]).map((re, i) => ({
              id: generateId(),
              exercise_id: re.exercise_id,
              exercise_name: re.exercise_name,
              primary_muscle_group: re.primary_muscle_group,
              tracking_type: "reps" as const,
              sort_order: i,
              sets: Array.from({ length: re.target_sets || 3 }, (_, j) => createEmptySet(j + 1)),
            }));

            const scheduledName = (scheduledData as { name: string }).name;
            const newWorkout: ActiveWorkout = {
              id: null,
              name: `${scheduledName} - ${new Date().toLocaleDateString()}`,
              started_at: new Date().toISOString(),
              exercises,
              notes: null,
            };
            setWorkout(newWorkout);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newWorkout));
          } else {
            startWorkout();
          }
        } else {
          startWorkout();
        }
      }
    } catch {
      startWorkout();
    } finally {
      setInitializing(false);
    }
  }

  const startWorkout = useCallback(() => {
    const newWorkout: ActiveWorkout = {
      id: null,
      name: null,
      started_at: new Date().toISOString(),
      exercises: [],
      notes: null,
    };
    setWorkout(newWorkout);
    setElapsed(0);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newWorkout));
  }, []);

  const addExercise = useCallback(
    (exercise: Exercise) => {
      if (!workout) return;
      const newExercise = createWorkoutExercise(
        exercise,
        workout.exercises.length
      );
      setWorkout({
        ...workout,
        exercises: [...workout.exercises, newExercise],
      });
      setShowPicker(false);
    },
    [workout]
  );

  const removeExercise = useCallback(
    (exerciseId: string) => {
      if (!workout) return;
      setWorkout({
        ...workout,
        exercises: workout.exercises.filter((ex) => ex.id !== exerciseId),
      });
    },
    [workout]
  );

  const updateSet = useCallback(
    (exerciseId: string, setId: string, updatedSet: ActiveSet) => {
      if (!workout) return;
      setWorkout({
        ...workout,
        exercises: workout.exercises.map((ex) =>
          ex.id === exerciseId
            ? {
                ...ex,
                sets: ex.sets.map((s) => (s.id === setId ? updatedSet : s)),
              }
            : ex
        ),
      });
    },
    [workout]
  );

  const addSet = useCallback(
    (exerciseId: string) => {
      if (!workout) return;
      setWorkout({
        ...workout,
        exercises: workout.exercises.map((ex) =>
          ex.id === exerciseId
            ? {
                ...ex,
                sets: [...ex.sets, createEmptySet(ex.sets.length + 1, ex.sets[ex.sets.length - 1])],
              }
            : ex
        ),
      });
    },
    [workout]
  );

  const duplicateSet = useCallback(
    (exerciseId: string, setId: string) => {
      if (!workout) return;
      setWorkout({
        ...workout,
        exercises: workout.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          const setIndex = ex.sets.findIndex((s) => s.id === setId);
          if (setIndex === -1) return ex;
          const sourceSet = ex.sets[setIndex];
          const newSet: ActiveSet = {
            id: generateId(),
            set_number: ex.sets.length + 1,
            weight: sourceSet.weight,
            reps: sourceSet.reps,
            rpe: sourceSet.rpe,
            completed: false,
          };
          return {
            ...ex,
            sets: [...ex.sets, newSet],
          };
        }),
      });
    },
    [workout]
  );

  const deleteSet = useCallback(
    (exerciseId: string, setId: string) => {
      if (!workout) return;
      setWorkout({
        ...workout,
        exercises: workout.exercises.map((ex) =>
          ex.id === exerciseId
            ? {
                ...ex,
                sets: ex.sets
                  .filter((s) => s.id !== setId)
                  .map((s, i) => ({ ...s, set_number: i + 1 })),
              }
            : ex
        ),
      });
    },
    [workout]
  );

  const moveExercise = useCallback(
    (exerciseId: string, direction: "up" | "down") => {
      if (!workout) return;
      const index = workout.exercises.findIndex((ex) => ex.id === exerciseId);
      if (index === -1) return;
      if (direction === "up" && index === 0) return;
      if (direction === "down" && index === workout.exercises.length - 1) return;

      const newExercises = [...workout.exercises];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      [newExercises[index], newExercises[swapIndex]] = [
        newExercises[swapIndex],
        newExercises[index],
      ];

      setWorkout({
        ...workout,
        exercises: newExercises.map((ex, i) => ({ ...ex, sort_order: i })),
      });
    },
    [workout]
  );

  const cancelWorkout = useCallback(() => {
    if (confirm("Cancel this workout? All progress will be lost.")) {
      setWorkout(null);
      localStorage.removeItem(STORAGE_KEY);
      setElapsed(0);
    }
  }, []);

  const finishWorkout = useCallback(async () => {
    if (!workout || workout.exercises.length === 0) {
      setError("Add at least one exercise before finishing.");
      return;
    }

    const hasSets = workout.exercises.some((ex) => ex.sets.length > 0);
    if (!hasSets) {
      setError("Add at least one set before finishing.");
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createBrowserClient();

    try {
      // 1. Insert workout
      const { data: workoutData, error: workoutError } = await supabase
        .from("workouts")
        .insert({
          name: workout.name || `Workout - ${new Date().toLocaleDateString()}`,
          routine_id: routineId || null,
          scheduled_workout_id: scheduledWorkoutId || null,
          started_at: workout.started_at,
          ended_at: new Date().toISOString(),
          notes: workout.notes,
        } as never)
        .select("id")
        .single();

      if (workoutError) throw workoutError;
      if (!workoutData) throw new Error("Failed to create workout");

      const workoutId = (workoutData as { id: string }).id;

      // 2. Insert workout_exercises
      for (const ex of workout.exercises) {
          const { data: weData, error: weError } = await supabase
            .from("workout_exercises")
            .insert({
              workout_id: workoutId,
              exercise_id: ex.exercise_id,
              exercise_name: ex.exercise_name,
              primary_muscle_group: ex.primary_muscle_group,
              sort_order: ex.sort_order,
              notes: null,
            } as never)
            .select("id")
            .single();

            if (weError) throw weError;
            if (!weData) throw new Error("Failed to create workout exercise");

            const workoutExerciseId = (weData as { id: string }).id;

        // 3. Insert sets
        if (ex.sets.length > 0) {
          const setsToInsert = ex.sets.map((set) => ({
            workout_exercise_id: workoutExerciseId,
            set_number: set.set_number,
            reps: set.reps,
            weight: set.weight,
            rpe: set.rpe,
            notes: null,
          }));

          const { error: setsError } = await supabase.from("sets").insert(setsToInsert as never);
          if (setsError) throw setsError;
        }
      }

      // Success - clear state and redirect
      localStorage.removeItem(STORAGE_KEY);
      setWorkout(null);
      router.push("/workouts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save workout");
      setSaving(false);
    }
  }, [workout, router, routineId, scheduledWorkoutId]);

  // Start workout screen
  if (!workout) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-24">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Start Workout</h1>
          <p className="mt-2 text-zinc-500">Log your sets, track your progress.</p>
        </div>
        {initializing ? (
          <div className="text-zinc-500">Loading...</div>
        ) : (
          <>
            <button
              onClick={startWorkout}
              className="w-full max-w-xs rounded-xl bg-zinc-900 py-4 text-lg font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Start New Workout
            </button>
            <a
              href="/exercises"
              className="mt-4 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-300"
            >
              Browse exercises first
            </a>
          </>
        )}
      </div>
    );
  }

  // Active workout screen
  return (
    <div className="mx-auto max-w-2xl py-4">
      {/* Header */}
      <div className="sticky top-14 z-10 -mx-4 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Active Workout</h1>
            <div className="text-sm text-zinc-500">{formatElapsed(elapsed)}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={cancelWorkout}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              onClick={finishWorkout}
              disabled={saving}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving ? "Saving..." : "Finish"}
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}
      </div>

      {/* Progression Suggestions */}
      {loadingSuggestions && (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm text-zinc-500">Loading suggestions...</div>
        </div>
      )}
      {suggestions.length > 0 && !loadingSuggestions && (
        <div className="mt-4 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Suggested Progression</h2>
          {suggestions.map((suggestion) => (
            <ProgressionSuggestionCard
              key={suggestion.exerciseId}
              suggestion={suggestion}
              onAccept={(exerciseId, weight, reps) => {
                setWorkout((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    exercises: prev.exercises.map((ex) => {
                      if (ex.id !== exerciseId) return ex;
                      const firstSet = ex.sets[0];
                      if (!firstSet) return ex;
                      return {
                        ...ex,
                        sets: ex.sets.map((s, i) =>
                          i === 0 ? { ...s, weight: weight ?? s.weight, reps: reps ?? s.reps } : s
                        ),
                      };
                    }),
                  };
                });
              }}
              onDismiss={(exerciseId) => {
                setSuggestions((prev) => prev.filter((s) => s.exerciseId !== exerciseId));
              }}
            />
          ))}
        </div>
      )}

      {/* Exercises */}
      <div className="mt-4 space-y-6">
        {workout.exercises.length === 0 && (
          <div className="py-12 text-center text-zinc-500">
            No exercises yet. Tap "Add Exercise" to get started.
          </div>
        )}

        {workout.exercises.map((exercise, exIndex) => (
          <div
            key={exercise.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{exercise.exercise_name}</h3>
                <div className="text-xs text-zinc-500">
                  {exercise.primary_muscle_group}
                  {exercise.tracking_type !== "reps" && (
                    <span className="ml-1 capitalize">· {exercise.tracking_type}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                {exIndex > 0 && (
                  <button
                    onClick={() => moveExercise(exercise.id, "up")}
                    className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                )}
                {exIndex < workout.exercises.length - 1 && (
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

            {/* Sets */}
            <div className="space-y-2">
              {exercise.sets.map((set, setIndex) => (
                <SetInput
                  key={set.id}
                  set={set}
                  trackingType={exercise.tracking_type}
                  onUpdate={(updated) => updateSet(exercise.id, set.id, updated)}
                  onDuplicate={() => duplicateSet(exercise.id, set.id)}
                  onDelete={() => deleteSet(exercise.id, set.id)}
                  isLast={setIndex === exercise.sets.length - 1}
                />
              ))}
            </div>

            {/* Add Set button */}
            <button
              onClick={() => addSet(exercise.id)}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 py-2 text-sm font-medium text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Set
            </button>
          </div>
        ))}
      </div>

      {/* Add Exercise button */}
      <button
        onClick={() => setShowPicker(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 py-4 text-base font-semibold text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Exercise
      </button>

      {/* Exercise Picker Modal */}
      {showPicker && (
        <ExercisePicker
          onSelect={addExercise}
          onClose={() => setShowPicker(false)}
          excludeIds={workout.exercises.map((ex) => ex.exercise_id)}
        />
      )}
    </div>
  );
}

function ProgressionSuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
}: {
  suggestion: ProgressionSuggestion;
  onAccept: (exerciseId: string, weight: number | null, reps: number | null) => void;
  onDismiss: (exerciseId: string) => void;
}) {
  const [weight, setWeight] = useState(suggestion.suggestedWeight);
  const [reps, setReps] = useState(suggestion.suggestedReps);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">{suggestion.exerciseName}</div>
          <div className="text-xs text-zinc-500 mt-1">
            {suggestion.reason === "pr" ? "Personal record!" : "Plateau detected"} — try increasing:
          </div>
          <div className="flex items-center gap-3 mt-2">
            {suggestion.previousWeight !== null && (
              <div className="flex items-center gap-1 text-sm">
                <span className="text-zinc-400 line-through">{suggestion.previousWeight}kg</span>
                <span className="text-zinc-400">→</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={weight ?? ""}
                  onChange={(e) => setWeight(e.target.value === "" ? null : parseFloat(e.target.value))}
                  className="w-16 rounded border border-amber-300 bg-white px-2 py-1 text-center text-sm font-semibold text-amber-700 outline-none focus:border-amber-500 dark:border-amber-800 dark:bg-amber-900 dark:text-amber-300"
                  step={0.5}
                  min={0}
                />
                <span className="text-xs text-zinc-500">kg</span>
              </div>
            )}
            {suggestion.previousReps !== null && (
              <div className="flex items-center gap-1 text-sm">
                <span className="text-zinc-400 line-through">{suggestion.previousReps} reps</span>
                <span className="text-zinc-400">→</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={reps ?? ""}
                  onChange={(e) => setReps(e.target.value === "" ? null : parseInt(e.target.value, 10))}
                  className="w-14 rounded border border-amber-300 bg-white px-2 py-1 text-center text-sm font-semibold text-amber-700 outline-none focus:border-amber-500 dark:border-amber-800 dark:bg-amber-900 dark:text-amber-300"
                  step={1}
                  min={0}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onAccept(suggestion.exerciseId, weight, reps)}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
          >
            Apply
          </button>
          <button
            onClick={() => onDismiss(suggestion.exerciseId)}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-amber-100 hover:text-zinc-600 dark:hover:bg-amber-900"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
