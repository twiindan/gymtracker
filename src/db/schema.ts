export type TrackingType = "reps" | "duration" | "distance" | "bodyweight";

export interface Exercise {
  id: string;
  name: string;
  primary_muscle_group: string;
  secondary_muscle_groups: string[];
  equipment: string | null;
  tracking_type: TrackingType;
  is_custom: boolean;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Workout {
  id: string;
  name: string | null;
  routine_id: string | null;
  scheduled_workout_id: string | null;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
}

export interface Routine {
  id: string;
  name: string;
  description: string | null;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduledWorkout {
  id: string;
  name: string;
  scheduled_date: string;
  routine_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface RoutineFolder {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  exercise_name: string;
  primary_muscle_group: string;
  sort_order: number;
  target_sets: number;
  target_reps_min: number | null;
  target_reps_max: number | null;
  notes: string | null;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise_name: string;
  primary_muscle_group: string;
  sort_order: number;
  notes: string | null;
}

export interface Set {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  rpe: number | null;
  notes: string | null;
  created_at: string;
}

// Client-side types for active workout state
export interface ActiveSet {
  id: string; // temporary client ID
  set_number: number;
  reps: number | null;
  weight: number | null;
  completed: boolean;
  rpe?: number | null;
}

export interface ActiveWorkoutExercise {
  id: string; // temporary client ID
  exercise_id: string;
  exercise_name: string;
  primary_muscle_group: string;
  tracking_type: TrackingType;
  sort_order: number;
  sets: ActiveSet[];
}

export interface ActiveWorkout {
  id: string | null; // null until saved
  name: string | null;
  started_at: string;
  exercises: ActiveWorkoutExercise[];
  notes: string | null;
}

export const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Quadriceps",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Abs",
  "Forearms",
  "Traps",
  "Lats",
  "Lower Back",
  "Full Body",
  "Cardio",
];

export const EQUIPMENT_TYPES = [
  "Barbell",
  "Dumbbell",
  "Machine",
  "Cable",
  "Bodyweight",
  "Kettlebell",
  "Resistance Band",
  "Smith Machine",
  "EZ Bar",
  "Trap Bar",
  "Other",
];
