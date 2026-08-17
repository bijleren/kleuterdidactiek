/*
  # Add Goal Tracking for Videos and Materials
  
  ## Overview
  Creates triggers to automatically update goal progress when educational videos 
  or materials are used in lessons. This ensures that practicing goals via videos 
  or materials counts toward overall goal tracking.

  ## Changes
  
  ### Functions
  - `update_goal_progress_from_video_session()` - Updates goal progress when video is used
  - `update_goal_progress_from_material_session()` - Updates goal progress when material is used
  
  ### Triggers
  - `trigger_update_goal_progress_from_video` - Fires after video session insert
  - `trigger_update_goal_progress_from_material` - Fires after material session insert

  ## Notes
  - These functions mirror the logic in `update_group_goal_progress()` but work with video/material sessions
  - Goal codes are retrieved from the linking tables (educational_video_goals, educational_material_goals)
  - Activity type is set to 'video' or 'material' to differentiate from other session types
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
      updated_at = now(),
      mastery_level = CASE
        WHEN group_goal_progress.total_sessions + 1 >= 20 THEN 'mastered'
        WHEN group_goal_progress.total_sessions + 1 >= 10 THEN 'proficient'
        WHEN group_goal_progress.total_sessions + 1 >= 3 THEN 'practicing'
        ELSE 'introduced'
      END;
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
      updated_at = now(),
      mastery_level = CASE
        WHEN group_goal_progress.total_sessions + 1 >= 20 THEN 'mastered'
        WHEN group_goal_progress.total_sessions + 1 >= 10 THEN 'proficient'
        WHEN group_goal_progress.total_sessions + 1 >= 3 THEN 'practicing'
        ELSE 'introduced'
      END;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for video sessions
DROP TRIGGER IF EXISTS trigger_update_goal_progress_from_video ON educational_video_sessions;
CREATE TRIGGER trigger_update_goal_progress_from_video
  AFTER INSERT ON educational_video_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress_from_video_session();

-- Create trigger for material sessions
DROP TRIGGER IF EXISTS trigger_update_goal_progress_from_material ON educational_material_sessions;
CREATE TRIGGER trigger_update_goal_progress_from_material
  AFTER INSERT ON educational_material_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress_from_material_session();
