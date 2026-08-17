/*
  # Fix Video and Material Goal Tracking Functions
  
  ## Overview
  Fixes the trigger functions to remove mastery_level updates since that column 
  doesn't exist in the group_goal_progress table.

  ## Changes
  - Updates `update_goal_progress_from_video_session()` to remove mastery_level
  - Updates `update_goal_progress_from_material_session()` to remove mastery_level
  
  ## Notes
  The group_goal_progress table only tracks counts and timestamps, not mastery levels.
*/

-- Function to update goal progress when a video session is logged
CREATE OR REPLACE FUNCTION update_goal_progress_from_video_session()
RETURNS TRIGGER AS $$
DECLARE
  current_goal_code text;
  video_goals text[];
BEGIN
  -- Get all goal codes associated with this video
  SELECT ARRAY_AGG(goal_code) INTO video_goals
  FROM educational_video_goals
  WHERE video_id = NEW.video_id;

  -- If no goals are associated, exit early
  IF video_goals IS NULL OR array_length(video_goals, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- Update progress for each goal code
  FOREACH current_goal_code IN ARRAY video_goals
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
      1,
      NEW.created_at,
      NEW.created_at,
      now()
    )
    ON CONFLICT (group_id, goal_code)
    DO UPDATE SET
      total_sessions = group_goal_progress.total_sessions + 1,
      total_repetitions = group_goal_progress.total_repetitions + 1,
      last_practiced_at = NEW.created_at,
      updated_at = now();
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update goal progress when a material session is logged
CREATE OR REPLACE FUNCTION update_goal_progress_from_material_session()
RETURNS TRIGGER AS $$
DECLARE
  current_goal_code text;
  material_goals text[];
BEGIN
  -- Get all goal codes associated with this material
  SELECT ARRAY_AGG(goal_code) INTO material_goals
  FROM educational_material_goals
  WHERE material_id = NEW.material_id;

  -- If no goals are associated, exit early
  IF material_goals IS NULL OR array_length(material_goals, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- Update progress for each goal code
  FOREACH current_goal_code IN ARRAY material_goals
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
      1,
      NEW.created_at,
      NEW.created_at,
      now()
    )
    ON CONFLICT (group_id, goal_code)
    DO UPDATE SET
      total_sessions = group_goal_progress.total_sessions + 1,
      total_repetitions = group_goal_progress.total_repetitions + 1,
      last_practiced_at = NEW.created_at,
      updated_at = now();
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
