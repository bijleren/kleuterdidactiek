/*
  # Fix activity_sessions column name

  ## Changes
  - Rename `ended_at` to `end_time` in activity_sessions table for consistency with code usage
  
  ## Notes
  This migration ensures the column name matches what the application code expects.
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_sessions' AND column_name = 'ended_at'
  ) THEN
    ALTER TABLE activity_sessions RENAME COLUMN ended_at TO end_time;
  END IF;
END $$;
