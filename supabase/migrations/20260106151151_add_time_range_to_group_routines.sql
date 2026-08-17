/*
  # Add Time Range Fields to Group Routines

  ## Overview
  Adds start_time and end_time fields to the group_routines table to allow teachers
  to specify when during the day a routine should occur. This helps automatically
  determine which lesson block the routine belongs to.

  ## Changes
  
  ### Modified Tables
  - `group_routines`
    - Added `start_time` (time, nullable) - When the routine should start
    - Added `end_time` (time, nullable) - When the routine should end

  ## Notes
  - Both fields are optional (nullable) for backward compatibility
  - If specified, these times help match routines to lesson blocks
  - Times are stored in HH:MM:SS format (PostgreSQL time type)
*/

-- Add time range fields to group_routines
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_routines' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE group_routines ADD COLUMN start_time time;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_routines' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE group_routines ADD COLUMN end_time time;
  END IF;
END $$;