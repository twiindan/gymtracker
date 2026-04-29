-- Routine folders for hierarchical organization
CREATE TABLE routine_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES routine_folders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add folder_id to routines for folder assignment
ALTER TABLE routines
  ADD COLUMN folder_id UUID REFERENCES routine_folders(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_routine_folders_parent ON routine_folders(parent_id);
CREATE INDEX idx_routines_folder ON routines(folder_id);

-- Row-level security
ALTER TABLE routine_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "routine_folders_all" ON routine_folders FOR ALL USING (true);
