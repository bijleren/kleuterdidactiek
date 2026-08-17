/*
  # Add 'activity_preset' to Activity Type Enums

  ## Overview
  Updates CHECK constraints on goal_tracking_sessions and lesson_items tables
  to allow 'activity_preset' as a valid activity/item type.

  ## Changes to Existing Tables
  
  ### `goal_tracking_sessions`
  - Drop existing CHECK constraint on activity_type
  - Add new CHECK constraint that includes 'activity_preset'
  
  ### `lesson_items`
  - Drop existing CHECK constraint on item_type
  - Add new CHECK constraint that includes 'activity_preset'

  ## Purpose
  - Enable tracking of activity preset usage in goal tracking sessions
  - Allow activity presets to be added as lesson items in the agenda
  - Support the new Activity Presets feature throughout the system

  ## Security
  - No changes to RLS policies
  - Existing security model remains intact
*/

-- Update goal_tracking_sessions table to allow 'activity_preset' activity type
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'goal_tracking_sessions_activity_type_check'
  ) THEN
    ALTER TABLE goal_tracking_sessions DROP CONSTRAINT goal_tracking_sessions_activity_type_check;
  END IF;

  -- Add new constraint with 'activity_preset' included
  ALTER TABLE goal_tracking_sessions 
    ADD CONSTRAINT goal_tracking_sessions_activity_type_check 
    CHECK (activity_type IN ('vocabulary', 'game', 'physical_task', 'writing', 'video', 'material', 'activity_preset', 'general', 'other'));
END $$;

-- Update lesson_items table to allow 'activity_preset' item type
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_item_type'
  ) THEN
    ALTER TABLE lesson_items DROP CONSTRAINT valid_item_type;
  END IF;

  -- Add new constraint with 'activity_preset' included
  ALTER TABLE lesson_items 
    ADD CONSTRAINT valid_item_type 
    CHECK (item_type = ANY (ARRAY['vocabulary'::text, 'vocabulary_word'::text, 'quiz'::text, 'game'::text, 'writing'::text, 'physical_task'::text, 'video'::text, 'material'::text, 'activity_preset'::text, 'goal'::text]));
END $$;