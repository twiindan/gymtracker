export interface PRRecord {
  value: number;
  date: string;
  workout_id: string;
  reps?: number;
  weight?: number;
}

export interface ExercisePRs {
  max_weight: PRRecord | null;
  max_reps: PRRecord | null;
  max_volume: PRRecord | null;
  estimated_1rm: PRRecord | null;
}

export interface SetWithContext {
  weight: number | null;
  reps: number | null;
  date: string;
  workout_id: string;
}

/**
 * Calculate estimated 1RM using the Epley formula:
 * 1RM = weight * (1 + reps / 30)
 */
export function calculate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  // Epley formula
  return weight * (1 + reps / 30);
}

/**
 * Calculate all PRs for an exercise from its sets.
 */
export function calculateExercisePRs(sets: SetWithContext[]): ExercisePRs {
  let maxWeight: PRRecord | null = null;
  let maxReps: PRRecord | null = null;
  let maxVolume: PRRecord | null = null;
  let max1RM: PRRecord | null = null;

  for (const set of sets) {
    if (set.weight === null || set.reps === null) continue;
    if (set.weight <= 0 || set.reps <= 0) continue;

    const volume = set.weight * set.reps;
    const oneRM = calculate1RM(set.weight, set.reps);

    if (!maxWeight || set.weight > maxWeight.value) {
      maxWeight = {
        value: set.weight,
        date: set.date,
        workout_id: set.workout_id,
        reps: set.reps,
      };
    }

    if (!maxReps || set.reps > maxReps.value) {
      maxReps = {
        value: set.reps,
        date: set.date,
        workout_id: set.workout_id,
        weight: set.weight,
      };
    }

    if (!maxVolume || volume > maxVolume.value) {
      maxVolume = {
        value: volume,
        date: set.date,
        workout_id: set.workout_id,
        weight: set.weight,
        reps: set.reps,
      };
    }

    if (!max1RM || oneRM > max1RM.value) {
      max1RM = {
        value: oneRM,
        date: set.date,
        workout_id: set.workout_id,
        weight: set.weight,
        reps: set.reps,
      };
    }
  }

  return {
    max_weight: maxWeight,
    max_reps: maxReps,
    max_volume: maxVolume,
    estimated_1rm: max1RM,
  };
}

export function formatPRValue(pr: PRRecord | null, type: "weight" | "reps" | "volume" | "1rm"): string {
  if (!pr) return "—";

  switch (type) {
    case "weight":
      return `${pr.value} kg`;
    case "reps":
      return `${pr.value} reps`;
    case "volume":
      return `${Math.round(pr.value)} kg`;
    case "1rm":
      return `${Math.round(pr.value)} kg`;
    default:
      return String(pr.value);
  }
}

export function formatPRContext(pr: PRRecord | null, type: "weight" | "reps" | "volume" | "1rm"): string {
  if (!pr) return "Log more sets";

  switch (type) {
    case "weight":
      return pr.reps ? `@ ${pr.reps} reps` : "";
    case "reps":
      return pr.weight ? `@ ${pr.weight} kg` : "";
    case "volume":
      return pr.weight && pr.reps ? `${pr.weight} kg × ${pr.reps}` : "";
    case "1rm":
      return pr.weight && pr.reps ? `${pr.weight} kg × ${pr.reps}` : "";
    default:
      return "";
  }
}

export function formatPRDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
