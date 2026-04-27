-- Create exercises table
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  primary_muscle_group TEXT NOT NULL,
  secondary_muscle_groups TEXT[] DEFAULT '{}',
  equipment TEXT,
  tracking_type TEXT NOT NULL DEFAULT 'reps' CHECK (tracking_type IN ('reps', 'duration', 'distance', 'bodyweight')),
  is_custom BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_exercises_name_trgm ON exercises USING gin(name gin_trgm_ops);
CREATE INDEX idx_exercises_muscle_group ON exercises(primary_muscle_group);
CREATE INDEX idx_exercises_equipment ON exercises(equipment);
CREATE INDEX idx_exercises_tracking_type ON exercises(tracking_type);
CREATE INDEX idx_exercises_is_custom ON exercises(is_custom);

-- Row-level security
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercises_read_all" ON exercises FOR SELECT USING (true);
CREATE POLICY "exercises_insert_custom" ON exercises FOR INSERT WITH CHECK (is_custom = true);
CREATE POLICY "exercises_update_custom" ON exercises FOR UPDATE USING (is_custom = true);
CREATE POLICY "exercises_delete_custom" ON exercises FOR DELETE USING (is_custom = true);
