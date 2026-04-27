-- Workout sessions
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Exercises performed within a workout (denormalized snapshot)
CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) NOT NULL,
  exercise_name TEXT NOT NULL,
  primary_muscle_group TEXT NOT NULL,
  sort_order INT NOT NULL,
  notes TEXT
);

-- Individual sets
CREATE TABLE sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE NOT NULL,
  set_number INT NOT NULL,
  reps INT,
  weight DECIMAL(8,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_workouts_started_at ON workouts(started_at DESC);
CREATE INDEX idx_workout_exercises_workout ON workout_exercises(workout_id);
CREATE INDEX idx_workout_exercises_exercise ON workout_exercises(exercise_id);
CREATE INDEX idx_sets_workout_exercise ON sets(workout_exercise_id);

-- Row-level security (single-user, open policies)
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workouts_all" ON workouts FOR ALL USING (true);

ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_exercises_all" ON workout_exercises FOR ALL USING (true);

ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sets_all" ON sets FOR ALL USING (true);
