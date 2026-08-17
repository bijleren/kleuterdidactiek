/*
  # Fix Goal Session Counting - Deduplicate Goal Codes
  
  ## Problem
  When a single session contains multiple activities with the same goal code
  (e.g., 3 vocabulary words all mapping to goal "1.1.1"), the trigger was
  counting each occurrence separately, inflating the session count.
  
  ## Solution
  1. Update the trigger function to deduplicate goal codes before processing
  2. Recalculate all existing progress data with correct counts
  
  ## Changes
  - Modified `update_group_goal_progress()` function to use DISTINCT goal codes
  - Clear and rebuild `group_goal_progress` table with accurate counts
  - Preserve first_practiced_at and last_practiced_at dates correctly
  
  ## Impact
  - Each session now counts as 1 session per unique goal, regardless of repetitions
  - Historical data is recalculated to reflect correct session counts
*/

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS trigger_update_goal_progress ON goal_tracking_sessions;

-- Update the function to deduplicate goal codes
CREATE OR REPLACE FUNCTION update_group_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
  current_goal_code text;
  unique_goal_codes text[];
BEGIN
  -- Get unique goal codes from the array to avoid counting duplicates
  SELECT ARRAY(SELECT DISTINCT unnest(NEW.goal_codes)) INTO unique_goal_codes;
  
  -- Update progress for each UNIQUE goal code in the session
  FOREACH current_goal_code IN ARRAY unique_goal_codes
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

-- Recreate the trigger
CREATE TRIGGER trigger_update_goal_progress
  AFTER INSERT ON goal_tracking_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_group_goal_progress();

-- Recalculate all existing progress data
-- Step 1: Clear existing progress data
TRUNCATE TABLE group_goal_progress;

-- Step 2: Rebuild progress from all sessions with deduplicated goal codes
INSERT INTO group_goal_progress (
  group_id,
  goal_code,
  total_sessions,
  total_repetitions,
  first_practiced_at,
  last_practiced_at,
  updated_at
)
SELECT 
  group_id,
  goal_code,
  COUNT(*) as total_sessions,
  SUM(repetitions) as total_repetitions,
  MIN(practiced_at) as first_practiced_at,
  MAX(practiced_at) as last_practiced_at,
  now() as updated_at
FROM (
  -- Deduplicate goal codes per session before counting
  SELECT DISTINCT
    s.id as session_id,
    s.group_id,
    unnest(s.goal_codes) as goal_code,
    s.practiced_at,
    s.repetitions
  FROM goal_tracking_sessions s
) sessions_with_unique_goals
GROUP BY group_id, goal_code
ORDER BY group_id, goal_code;