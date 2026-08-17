/*
  # Add Video and Material Activity Types
  
  ## Overview
  Adds 'video' and 'material' to the allowed activity types in goal_tracking_sessions
  so that video and material usage can be tracked in analytics.

  ## Changes
  - Drops existing activity_type check constraint
  - Creates new check constraint with 'video' and 'material' included
  
  ## Notes
  This allows the trigger functions to insert video and material sessions into
  the goal_tracking_sessions table for analytics tracking.
*/

-- Drop the old constraint
ALTER TABLE goal_tracking_sessions 
DROP CONSTRAINT IF EXISTS goal_tracking_sessions_activity_type_check;

-- Add new constraint with video and material included
ALTER TABLE goal_tracking_sessions
ADD CONSTRAINT goal_tracking_sessions_activity_type_check 
CHECK (activity_type = ANY (ARRAY['vocabulary'::text, 'game'::text, 'physical_task'::text, 'writing'::text, 'general'::text, 'other'::text, 'video'::text, 'material'::text]));

-- Backfill educational video sessions
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
SELECT 
  evs.group_id,
  ARRAY_AGG(DISTINCT evg.goal_code),
  'video' as activity_type,
  ev.title as activity_name,
  evs.created_at as practiced_at,
  evs.notes,
  evs.created_by,
  evs.created_at
FROM educational_video_sessions evs
JOIN educational_videos ev ON ev.id = evs.video_id
JOIN educational_video_goals evg ON evg.video_id = evs.video_id
GROUP BY evs.id, evs.group_id, ev.title, evs.created_at, evs.notes, evs.created_by
ON CONFLICT DO NOTHING;

-- Backfill educational material sessions
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
SELECT 
  ems.group_id,
  ARRAY_AGG(DISTINCT emg.goal_code),
  'material' as activity_type,
  em.title as activity_name,
  ems.created_at as practiced_at,
  ems.notes,
  ems.created_by,
  ems.created_at
FROM educational_material_sessions ems
JOIN educational_materials em ON em.id = ems.material_id
JOIN educational_material_goals emg ON emg.material_id = ems.material_id
GROUP BY ems.id, ems.group_id, em.title, ems.created_at, ems.notes, ems.created_by
ON CONFLICT DO NOTHING;
