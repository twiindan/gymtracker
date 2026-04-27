import type { TrackingType } from "./schema";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      exercises: {
        Row: {
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
        };
        Insert: {
          id?: string;
          name: string;
          primary_muscle_group: string;
          secondary_muscle_groups?: string[];
          equipment?: string | null;
          tracking_type?: TrackingType;
          is_custom?: boolean;
          is_active?: boolean;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          primary_muscle_group?: string;
          secondary_muscle_groups?: string[];
          equipment?: string | null;
          tracking_type?: TrackingType;
          is_custom?: boolean;
          is_active?: boolean;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workouts: {
        Row: {
          id: string;
          name: string | null;
          routine_id: string | null;
          started_at: string;
          ended_at: string | null;
          notes: string | null;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          routine_id?: string | null;
          started_at?: string;
          ended_at?: string | null;
          notes?: string | null;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          routine_id?: string | null;
          started_at?: string;
          ended_at?: string | null;
          notes?: string | null;
          deleted_at?: string | null;
          created_at?: string;
        };
      };
      routines: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      routine_exercises: {
        Row: {
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
        };
        Insert: {
          id?: string;
          routine_id: string;
          exercise_id: string;
          exercise_name: string;
          primary_muscle_group: string;
          sort_order: number;
          target_sets?: number;
          target_reps_min?: number | null;
          target_reps_max?: number | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          routine_id?: string;
          exercise_id?: string;
          exercise_name?: string;
          primary_muscle_group?: string;
          sort_order?: number;
          target_sets?: number;
          target_reps_min?: number | null;
          target_reps_max?: number | null;
          notes?: string | null;
        };
      };
      workout_exercises: {
        Row: {
          id: string;
          workout_id: string;
          exercise_id: string;
          exercise_name: string;
          primary_muscle_group: string;
          sort_order: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          workout_id: string;
          exercise_id: string;
          exercise_name: string;
          primary_muscle_group: string;
          sort_order: number;
          notes?: string | null;
        };
        Update: {
          id?: string;
          workout_id?: string;
          exercise_id?: string;
          exercise_name?: string;
          primary_muscle_group?: string;
          sort_order?: number;
          notes?: string | null;
        };
      };
      sets: {
        Row: {
          id: string;
          workout_exercise_id: string;
          set_number: number;
          reps: number | null;
          weight: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_exercise_id: string;
          set_number: number;
          reps?: number | null;
          weight?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workout_exercise_id?: string;
          set_number?: number;
          reps?: number | null;
          weight?: number | null;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
