-- Auto-set user_id on insert for all user-scoped tables

CREATE OR REPLACE FUNCTION set_user_id() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to all user-scoped tables
CREATE TRIGGER set_workouts_user_id 
  BEFORE INSERT ON workouts 
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_workout_exercises_user_id 
  BEFORE INSERT ON workout_exercises 
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_sets_user_id 
  BEFORE INSERT ON sets 
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_routines_user_id 
  BEFORE INSERT ON routines 
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_routine_exercises_user_id 
  BEFORE INSERT ON routine_exercises 
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_scheduled_workouts_user_id 
  BEFORE INSERT ON scheduled_workouts 
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_routine_folders_user_id 
  BEFORE INSERT ON routine_folders 
  FOR EACH ROW EXECUTE FUNCTION set_user_id();
