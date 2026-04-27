-- Add soft delete support to workouts
ALTER TABLE workouts ADD COLUMN deleted_at TIMESTAMPTZ;

-- Create index for filtered queries
CREATE INDEX idx_workouts_deleted_at ON workouts(deleted_at) WHERE deleted_at IS NULL;

-- Update existing queries to filter out deleted workouts
-- Note: Application code should add .is('deleted_at', null) or .is('deleted_at', null) to queries
