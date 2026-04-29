-- Scheduled workouts (planning layer, separate from actual workouts)
CREATE TABLE scheduled_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  routine_id UUID REFERENCES routines(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link workouts back to their scheduled origin
ALTER TABLE workouts
  ADD COLUMN scheduled_workout_id UUID REFERENCES scheduled_workouts(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_scheduled_workouts_date ON scheduled_workouts(scheduled_date);
CREATE INDEX idx_workouts_scheduled ON workouts(scheduled_workout_id);

-- Row-level security
ALTER TABLE scheduled_workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scheduled_workouts_all" ON scheduled_workouts FOR ALL USING (true);
