-- Routines / workout templates
CREATE TABLE routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Exercises within a routine (ordering matters)
CREATE TABLE routine_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID REFERENCES routines(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  primary_muscle_group TEXT NOT NULL,
  sort_order INT NOT NULL,
  target_sets INT DEFAULT 3,
  target_reps_min INT,
  target_reps_max INT,
  notes TEXT
);

-- Add routine_id to workouts for tracking which routine was used
ALTER TABLE workouts ADD COLUMN routine_id UUID REFERENCES routines(id);

-- Indexes
CREATE INDEX idx_routine_exercises_routine ON routine_exercises(routine_id);
CREATE INDEX idx_workouts_routine ON workouts(routine_id);

-- Row-level security
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "routines_all" ON routines FOR ALL USING (true);

ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "routine_exercises_all" ON routine_exercises FOR ALL USING (true);
