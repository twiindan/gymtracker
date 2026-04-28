import { createBrowserClient } from "@/db/client";

export const UPPER_BODY_MUSCLES = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Traps",
  "Lats",
  "Abs",
];

export function isUpperBodyMuscle(muscleGroup: string): boolean {
  return UPPER_BODY_MUSCLES.includes(muscleGroup);
}

export interface SessionEntry {
  weight: number | null;
  reps: number | null;
  workout_started_at: string;
}

export interface ProgressionSuggestion {
  exerciseId: string;
  exerciseName: string;
  primaryMuscleGroup: string;
  previousWeight: number | null;
  previousReps: number | null;
  suggestedWeight: number | null;
  suggestedReps: number | null;
  reason: "pr" | "plateau";
}

export function detectPlateau(
  sessions: SessionEntry[],
  minConsecutive: number = 2
): boolean {
  if (sessions.length < minConsecutive) return false;

  const recent = sessions.slice(0, minConsecutive);
  const first = recent[0];

  return recent.every(
    (s) => s.weight === first.weight && s.reps === first.reps
  );
}

export function getProgressionSuggestion(
  exerciseId: string,
  exerciseName: string,
  primaryMuscleGroup: string,
  previousWeight: number | null,
  previousReps: number | null,
  hasPlateau: boolean,
  hasPR: boolean
): ProgressionSuggestion | null {
  if (!hasPR && !hasPlateau) return null;

  let suggestedWeight: number | null = null;
  let suggestedReps: number | null = null;

  if (previousWeight !== null) {
    const increment = isUpperBodyMuscle(primaryMuscleGroup) ? 2.5 : 1.25;
    suggestedWeight = Math.round((previousWeight + increment) * 100) / 100;
    suggestedReps = previousReps;
  } else {
    suggestedReps = (previousReps ?? 0) + 1;
  }

  return {
    exerciseId,
    exerciseName,
    primaryMuscleGroup,
    previousWeight,
    previousReps,
    suggestedWeight,
    suggestedReps,
    reason: hasPR ? "pr" : "plateau",
  };
}

export async function fetchExerciseHistory(
  exerciseId: string,
  limit: number = 10
): Promise<SessionEntry[]> {
  const supabase = createBrowserClient();

  const { data } = await supabase
    .from("sets")
    .select(
      "weight, reps, workout_exercises!inner(workout_id, workouts!inner(started_at))"
    )
    .eq("workout_exercises.exercise_id", exerciseId)
    .order("workouts.started_at", { ascending: false })
    .limit(limit);

  if (!data) return [];

  return (data as unknown as Array<{
    weight: number | null;
    reps: number | null;
    workout_exercises: {
      workouts: { started_at: string };
    };
  }>).map((row) => ({
    weight: row.weight,
    reps: row.reps,
    workout_started_at: row.workout_exercises.workouts.started_at,
  }));
}

export function groupSetsBySession(
  history: SessionEntry[]
): SessionEntry[][] {
  const sessions: SessionEntry[][] = [];
  let currentSession: SessionEntry[] = [];
  let currentDate = "";

  for (const entry of history) {
    const entryDate = new Date(entry.workout_started_at).toDateString();
    if (entryDate !== currentDate) {
      if (currentSession.length > 0) {
        sessions.push(currentSession);
      }
      currentSession = [];
      currentDate = entryDate;
    }
    currentSession.push(entry);
  }

  if (currentSession.length > 0) {
    sessions.push(currentSession);
  }

  return sessions;
}

export function getLastSetPerSession(sessions: SessionEntry[][]): SessionEntry[] {
  return sessions.map((session) => session[session.length - 1]);
}

export function getMaxWeightReps(sessions: SessionEntry[][]): {
  maxWeight: number | null;
  maxReps: number | null;
} {
  let maxWeight: number | null = null;
  let maxReps: number | null = null;

  for (const session of sessions) {
    for (const entry of session) {
      if (entry.weight !== null && (maxWeight === null || entry.weight > maxWeight)) {
        maxWeight = entry.weight;
      }
      if (entry.reps !== null && (maxReps === null || entry.reps > maxReps)) {
        maxReps = entry.reps;
      }
    }
  }

  return { maxWeight, maxReps };
}
