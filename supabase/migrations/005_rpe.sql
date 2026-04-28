ALTER TABLE sets ADD COLUMN rpe INT CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10));
