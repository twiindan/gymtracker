import { createBrowserClient } from "@/db/client";
import type {
  Exercise,
  Workout,
  WorkoutExercise,
  Set,
  Routine,
  RoutineExercise,
  ScheduledWorkout,
  RoutineFolder,
} from "@/db/schema";

export interface ExportData {
  exercises: Exercise[];
  workouts: Workout[];
  workout_exercises: WorkoutExercise[];
  sets: Set[];
  routines: Routine[];
  routine_exercises: RoutineExercise[];
  scheduled_workouts: ScheduledWorkout[];
  routine_folders: RoutineFolder[];
}

interface JsonWorkout {
  id: string;
  name: string | null;
  startedAt: string;
  endedAt: string | null;
  notes: string | null;
  exercises: JsonWorkoutExercise[];
}

interface JsonWorkoutExercise {
  name: string;
  primaryMuscleGroup: string;
  sortOrder: number;
  notes: string | null;
  sets: JsonSet[];
}

interface JsonSet {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  notes: string | null;
}

interface JsonRoutine {
  id: string;
  name: string;
  description: string | null;
  exercises: JsonRoutineExercise[];
}

interface JsonRoutineExercise {
  name: string;
  primaryMuscleGroup: string;
  sortOrder: number;
  targetSets: number;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
  notes: string | null;
}

interface JsonScheduledWorkout {
  id: string;
  name: string;
  scheduledDate: string;
  routineId: string | null;
  notes: string | null;
}

interface JsonRoutineFolder {
  id: string;
  name: string;
  parentId: string | null;
}

interface JsonCustomExercise {
  id: string;
  name: string;
  primaryMuscleGroup: string;
  secondaryMuscleGroups: string[];
  equipment: string | null;
  trackingType: string;
  description: string | null;
}

interface JsonExport {
  exportMetadata: {
    exportedAt: string;
    appVersion: string;
  };
  workouts: JsonWorkout[];
  routines: JsonRoutine[];
  scheduledWorkouts: JsonScheduledWorkout[];
  routineFolders: JsonRoutineFolder[];
  customExercises: JsonCustomExercise[];
}

export async function fetchAllExportData(): Promise<ExportData> {
  const supabase = createBrowserClient();

  const [
    exercisesResult,
    workoutsResult,
    workoutExercisesResult,
    setsResult,
    routinesResult,
    routineExercisesResult,
    scheduledWorkoutsResult,
    routineFoldersResult,
  ] = await Promise.all([
    supabase.from("exercises").select("id, name, primary_muscle_group, secondary_muscle_groups, equipment, tracking_type, description, created_at").eq("is_custom", true),
    supabase.from("workouts").select("id, name, routine_id, scheduled_workout_id, started_at, ended_at, notes, created_at").is("deleted_at", null).order("started_at", { ascending: true }),
    supabase.from("workout_exercises").select("id, workout_id, exercise_id, exercise_name, primary_muscle_group, sort_order, notes"),
    supabase.from("sets").select("id, workout_exercise_id, set_number, reps, weight, rpe, notes, created_at"),
    supabase.from("routines").select("id, name, description, folder_id, created_at, updated_at"),
    supabase.from("routine_exercises").select("id, routine_id, exercise_id, exercise_name, primary_muscle_group, sort_order, target_sets, target_reps_min, target_reps_max, notes"),
    supabase.from("scheduled_workouts").select("id, name, scheduled_date, routine_id, notes, created_at"),
    supabase.from("routine_folders").select("id, name, parent_id, created_at"),
  ]);

  return {
    exercises: exercisesResult.data ?? [],
    workouts: workoutsResult.data ?? [],
    workout_exercises: workoutExercisesResult.data ?? [],
    sets: setsResult.data ?? [],
    routines: routinesResult.data ?? [],
    routine_exercises: routineExercisesResult.data ?? [],
    scheduled_workouts: scheduledWorkoutsResult.data ?? [],
    routine_folders: routineFoldersResult.data ?? [],
  };
}

export function buildJsonExport(data: ExportData): string {
  const workoutExercisesByWorkout = new Map<string, WorkoutExercise[]>();
  for (const we of data.workout_exercises) {
    if (!workoutExercisesByWorkout.has(we.workout_id)) {
      workoutExercisesByWorkout.set(we.workout_id, []);
    }
    workoutExercisesByWorkout.get(we.workout_id)!.push(we);
  }

  const setsByWorkoutExercise = new Map<string, Set[]>();
  for (const set of data.sets) {
    if (!setsByWorkoutExercise.has(set.workout_exercise_id)) {
      setsByWorkoutExercise.set(set.workout_exercise_id, []);
    }
    setsByWorkoutExercise.get(set.workout_exercise_id)!.push(set);
  }

  const routineExercisesByRoutine = new Map<string, RoutineExercise[]>();
  for (const re of data.routine_exercises) {
    if (!routineExercisesByRoutine.has(re.routine_id)) {
      routineExercisesByRoutine.set(re.routine_id, []);
    }
    routineExercisesByRoutine.get(re.routine_id)!.push(re);
  }

  const workouts: JsonWorkout[] = data.workouts.map((workout) => {
    const exercises = workoutExercisesByWorkout.get(workout.id) ?? [];
    const jsonExercises: JsonWorkoutExercise[] = exercises.map((we) => {
      const sets = setsByWorkoutExercise.get(we.id) ?? [];
      const jsonSets: JsonSet[] = sets.map((s) => ({
        setNumber: s.set_number,
        weight: s.weight,
        reps: s.reps,
        rpe: s.rpe,
        notes: s.notes,
      }));
      return {
        name: we.exercise_name,
        primaryMuscleGroup: we.primary_muscle_group,
        sortOrder: we.sort_order,
        notes: we.notes,
        sets: jsonSets,
      };
    });

    return {
      id: workout.id,
      name: workout.name,
      startedAt: workout.started_at,
      endedAt: workout.ended_at,
      notes: workout.notes,
      exercises: jsonExercises,
    };
  });

  const routines: JsonRoutine[] = data.routines.map((routine) => {
    const exercises = routineExercisesByRoutine.get(routine.id) ?? [];
    const jsonExercises: JsonRoutineExercise[] = exercises.map((re) => ({
      name: re.exercise_name,
      primaryMuscleGroup: re.primary_muscle_group,
      sortOrder: re.sort_order,
      targetSets: re.target_sets,
      targetRepsMin: re.target_reps_min,
      targetRepsMax: re.target_reps_max,
      notes: re.notes,
    }));

    return {
      id: routine.id,
      name: routine.name,
      description: routine.description,
      exercises: jsonExercises,
    };
  });

  const scheduledWorkouts: JsonScheduledWorkout[] = data.scheduled_workouts.map((sw) => ({
    id: sw.id,
    name: sw.name,
    scheduledDate: sw.scheduled_date,
    routineId: sw.routine_id,
    notes: sw.notes,
  }));

  const routineFolders: JsonRoutineFolder[] = data.routine_folders.map((rf) => ({
    id: rf.id,
    name: rf.name,
    parentId: rf.parent_id,
  }));

  const customExercises: JsonCustomExercise[] = data.exercises.map((ex) => ({
    id: ex.id,
    name: ex.name,
    primaryMuscleGroup: ex.primary_muscle_group,
    secondaryMuscleGroups: ex.secondary_muscle_groups,
    equipment: ex.equipment,
    trackingType: ex.tracking_type,
    description: ex.description,
  }));

  const result: JsonExport = {
    exportMetadata: {
      exportedAt: new Date().toISOString(),
      appVersion: "GymTracker v2.0",
    },
    workouts,
    routines,
    scheduledWorkouts,
    routineFolders,
    customExercises,
  };

  return JSON.stringify(result, null, 2);
}

function escapeCsvField(value: string | null): string {
  if (value === null) return "";
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

export function buildCsvExport(data: ExportData): string {
  const headers = "workout_date,workout_name,exercise_name,set_number,weight,reps,rpe,notes,primary_muscle_group,tracking_type";

  const workoutById = new Map<string, Workout>();
  for (const w of data.workouts) {
    workoutById.set(w.id, w);
  }

  const workoutExerciseById = new Map<string, WorkoutExercise>();
  for (const we of data.workout_exercises) {
    workoutExerciseById.set(we.id, we);
  }

  const exerciseById = new Map<string, Exercise>();
  for (const ex of data.exercises) {
    exerciseById.set(ex.id, ex);
  }

  const rows: string[] = [];

  for (const set of data.sets) {
    const workoutExercise = workoutExerciseById.get(set.workout_exercise_id);
    if (!workoutExercise) continue;

    const workout = workoutById.get(workoutExercise.workout_id);
    if (!workout) continue;

    const workoutDate = workout.started_at.split("T")[0];
    const workoutName = escapeCsvField(workout.name);
    const exerciseName = escapeCsvField(workoutExercise.exercise_name);
    const setNumber = set.set_number;
    const weight = set.weight !== null ? String(set.weight) : "";
    const reps = set.reps !== null ? String(set.reps) : "";
    const rpe = set.rpe !== null ? String(set.rpe) : "";
    const notes = escapeCsvField(set.notes);
    const primaryMuscleGroup = escapeCsvField(workoutExercise.primary_muscle_group);

    const exercise = exerciseById.get(workoutExercise.exercise_id);
    const trackingType = exercise ? escapeCsvField(exercise.tracking_type) : "";

    rows.push(
      `${workoutDate},${workoutName},${exerciseName},${setNumber},${weight},${reps},${rpe},${notes},${primaryMuscleGroup},${trackingType}`
    );
  }

  if (rows.length === 0) {
    return headers;
  }

  return headers + "\n" + rows.join("\n");
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
