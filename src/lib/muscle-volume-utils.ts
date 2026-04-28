import { createBrowserClient } from "@/db/client";

export interface MuscleVolumeData {
  muscle_group: string;
  total_sets: number;
  total_volume: number;
}

/**
 * Fetch muscle group volume data for the last N days.
 * Counts only primary muscle groups (secondary excluded).
 * Filters soft-deleted workouts.
 * Returns array sorted by total_sets descending.
 */
export async function fetchMuscleVolume(
  days: number = 30
): Promise<MuscleVolumeData[]> {
  const supabase = createBrowserClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Step 1: Get non-deleted workout IDs in time window
  const { data: workouts } = await supabase
    .from("workouts")
    .select("id")
    .is("deleted_at", null)
    .gte("started_at", startDate.toISOString());

  if (!workouts || workouts.length === 0) {
    return [];
  }

  // Step 2: Get workout_exercises with primary_muscle_group (denormalized)
  const workoutIds = (workouts as { id: string }[]).map((w) => w.id);
  const { data: weData } = await supabase
    .from("workout_exercises")
    .select("id, primary_muscle_group")
    .in("workout_id", workoutIds);

  if (!weData || weData.length === 0) {
    return [];
  }

  // Step 3: Get all sets for these workout_exercises
  const weIds = (weData as { id: string; primary_muscle_group: string }[]).map(
    (we) => we.id
  );
  const weMap = new Map<string, string>(
    (weData as { id: string; primary_muscle_group: string }[]).map((we) => [
      we.id,
      we.primary_muscle_group,
    ])
  );

  const { data: sets } = await supabase
    .from("sets")
    .select("workout_exercise_id, reps, weight")
    .in("workout_exercise_id", weIds);

  // Step 4: Client-side aggregation by muscle_group
  const muscleMap = new Map<string, { total_sets: number; total_volume: number }>();
  (sets as { workout_exercise_id: string; reps: number | null; weight: number | null }[] ?? []).forEach((set) => {
    const muscle = weMap.get(set.workout_exercise_id);
    if (!muscle) return;
    const entry = muscleMap.get(muscle) ?? { total_sets: 0, total_volume: 0 };
    entry.total_sets += 1;
    if (set.reps != null && set.weight != null) {
      entry.total_volume += set.reps * set.weight;
    }
    muscleMap.set(muscle, entry);
  });

  // Step 5: Convert to array, sort by total_sets descending
  return Array.from(muscleMap.entries())
    .map(([muscle_group, data]) => ({ muscle_group, ...data }))
    .sort((a, b) => b.total_sets - a.total_sets);
}
