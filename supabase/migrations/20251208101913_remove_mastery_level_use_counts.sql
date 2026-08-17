/*
  # Remove Mastery Level and Use Count-Based Progress

  ## Changes
  1. Drop mastery_level column from group_goal_progress table
  2. Update trigger function to remove mastery_level logic
  
  ## Notes
  - Progress is now tracked purely by count of sessions
  - Categories: 1-5 times, 5-20 times, 20-50 times, 50+ times
*/

-- Drop the mastery_level column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_goal_progress' AND column_name = 'mastery_level'
  ) THEN
    ALTER TABLE group_goal_progress DROP COLUMN mastery_level;
  END IF;
END $$;

-- Update the trigger function to remove mastery_level logic
CREATE OR REPLACE FUNCTION update_group_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
  current_goal_code text;
BEGIN
  -- Update progress for each goal code in the session
  FOREACH current_goal_code IN ARRAY NEW.goal_codes
  LOOP
    INSERT INTO group_goal_progress (
      group_id,
      goal_code,
      total_sessions,
      total_repetitions,
      last_practiced_at,
      first_practiced_at,
      updated_at
    )
    VALUES (
      NEW.group_id,
      current_goal_code,
      1,
      NEW.repetitions,
      NEW.practiced_at,
      NEW.practiced_at,
      now()
    )
    ON CONFLICT (group_id, goal_code)
    DO UPDATE SET
      total_sessions = group_goal_progress.total_sessions + 1,
      total_repetitions = group_goal_progress.total_repetitions + NEW.repetitions,
      last_practiced_at = NEW.practiced_at,
      updated_at = now();
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;