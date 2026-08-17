/*
  # Add Material and Video Sessions to Analytics
  
  ## Overview
  Updates the trigger functions to also create entries in goal_tracking_sessions
  so that material and video usage appears in the analytics page.

  ## Changes
  - Updates `update_goal_progress_from_video_session()` to insert into goal_tracking_sessions
  - Updates `update_goal_progress_from_material_session()` to insert into goal_tracking_sessions
  
  ## Notes
  The analytics page reads from goal_tracking_sessions, so we need to create entries
  there in addition to updating group_goal_progress.
*/

-- Function to update goal progress when a video session is logged
CREATE OR REPLACE FUNCTION update_goal_progress_from_video_session()
RETURNS TRIGGER AS $$
DECLARE
  current_goal_code text;
  video_goals text[];
  video_title text;
BEGIN
  -- Get video title
  SELECT title INTO video_title
  FROM educational_videos
  WHERE id = NEW.video_id;

  -- Get all goal codes associated with this video
  SELECT ARRAY_AGG(goal_code) INTO video_goals
  FROM educational_video_goals
  WHERE video_id = NEW.video_id;

  -- If no goals are associated, exit early
  IF video_goals IS NULL OR array_length(video_goals, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- Create entry in goal_tracking_sessions for analytics
  INSERT INTO goal_tracking_sessions (
    group_id,
    goal_codes,
    activity_type,
    activity_name,
    practiced_at,
    notes,
    created_by,
    created_at
  )
  VALUES (
    NEW.group_id,
    video_goals,
    'video',
    video_title,
    NEW.created_at,
    NEW.notes,
    NEW.created_by,
    NEW.created_at
  );

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
  material_title text;
BEGIN
  -- Get material title
  SELECT title INTO material_title
  FROM educational_materials
  WHERE id = NEW.material_id;

  -- Get all goal codes associated with this material
  SELECT ARRAY_AGG(goal_code) INTO material_goals
  FROM educational_material_goals
  WHERE material_id = NEW.material_id;

  -- If no goals are associated, exit early
  IF material_goals IS NULL OR array_length(material_goals, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- Create entry in goal_tracking_sessions for analytics
  INSERT INTO goal_tracking_sessions (
    group_id,
    goal_codes,
    activity_type,
    activity_name,
    practiced_at,
    notes,
    created_by,
    created_at
  )
  VALUES (
    NEW.group_id,
    material_goals,
    'material',
    material_title,
    NEW.created_at,
    NEW.notes,
    NEW.created_by,
    NEW.created_at
  );

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
