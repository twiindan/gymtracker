-- Auth migration: Add user_id to all tables and enable proper RLS
-- Note: Run this via Supabase CLI after setting up auth

-- ============================================
-- 1. ADD user_id TO ALL TABLES (nullable first)
-- ============================================

-- Exercises: built-in exercises have NULL user_id (shared), custom exercises have user_id
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);

-- Workouts
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);

-- Workout exercises
ALTER TABLE workout_exercises ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_workout_exercises_user_id ON workout_exercises(user_id);

-- Sets
ALTER TABLE sets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_sets_user_id ON sets(user_id);

-- Routines
ALTER TABLE routines ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);

-- Routine exercises
ALTER TABLE routine_exercises ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_routine_exercises_user_id ON routine_exercises(user_id);

-- Scheduled workouts
ALTER TABLE scheduled_workouts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_user_id ON scheduled_workouts(user_id);

-- Routine folders
ALTER TABLE routine_folders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_routine_folders_user_id ON routine_folders(user_id);

-- ============================================
-- 2. UPDATE ROW LEVEL SECURITY POLICIES
-- ============================================

-- Exercises: built-in (user_id IS NULL) are readable by all, custom are user-scoped
DROP POLICY IF EXISTS exercises_read_all ON exercises;
DROP POLICY IF EXISTS exercises_insert_custom ON exercises;
DROP POLICY IF EXISTS exercises_update_custom ON exercises;
DROP POLICY IF EXISTS exercises_delete_custom ON exercises;

CREATE POLICY "exercises_select_builtin" ON exercises FOR SELECT USING (user_id IS NULL);
CREATE POLICY "exercises_select_own" ON exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "exercises_insert_own" ON exercises FOR INSERT WITH CHECK (auth.uid() = user_id AND is_custom = true);
CREATE POLICY "exercises_update_own" ON exercises FOR UPDATE USING (auth.uid() = user_id AND is_custom = true);
CREATE POLICY "exercises_delete_own" ON exercises FOR DELETE USING (auth.uid() = user_id AND is_custom = true);

-- Workouts
DROP POLICY IF EXISTS workouts_all ON workouts;
CREATE POLICY "workouts_select" ON workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "workouts_insert" ON workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "workouts_update" ON workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "workouts_delete" ON workouts FOR DELETE USING (auth.uid() = user_id);

-- Workout exercises
DROP POLICY IF EXISTS workout_exercises_all ON workout_exercises;
CREATE POLICY "workout_exercises_select" ON workout_exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "workout_exercises_insert" ON workout_exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "workout_exercises_update" ON workout_exercises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "workout_exercises_delete" ON workout_exercises FOR DELETE USING (auth.uid() = user_id);

-- Sets
DROP POLICY IF EXISTS sets_all ON sets;
CREATE POLICY "sets_select" ON sets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sets_insert" ON sets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sets_update" ON sets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sets_delete" ON sets FOR DELETE USING (auth.uid() = user_id);

-- Routines
DROP POLICY IF EXISTS routines_all ON routines;
CREATE POLICY "routines_select" ON routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "routines_insert" ON routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "routines_update" ON routines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "routines_delete" ON routines FOR DELETE USING (auth.uid() = user_id);

-- Routine exercises
DROP POLICY IF EXISTS routine_exercises_all ON routine_exercises;
CREATE POLICY "routine_exercises_select" ON routine_exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "routine_exercises_insert" ON routine_exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "routine_exercises_update" ON routine_exercises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "routine_exercises_delete" ON routine_exercises FOR DELETE USING (auth.uid() = user_id);

-- Scheduled workouts
DROP POLICY IF EXISTS scheduled_workouts_all ON scheduled_workouts;
CREATE POLICY "scheduled_workouts_select" ON scheduled_workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "scheduled_workouts_insert" ON scheduled_workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "scheduled_workouts_update" ON scheduled_workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "scheduled_workouts_delete" ON scheduled_workouts FOR DELETE USING (auth.uid() = user_id);

-- Routine folders
DROP POLICY IF EXISTS routine_folders_all ON routine_folders;
CREATE POLICY "routine_folders_select" ON routine_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "routine_folders_insert" ON routine_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "routine_folders_update" ON routine_folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "routine_folders_delete" ON routine_folders FOR DELETE USING (auth.uid() = user_id);
