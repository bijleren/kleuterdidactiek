/*
  # Add Goal Codes Support to Activity Presets

  1. Changes to Existing Tables
    - `activity_presets`
      - Add `goal_codes` (text array) - List of educational goal codes associated with this preset
      - Add index on goal_codes for filtering performance

  2. Purpose
    - Allow activity presets to be linked to educational goals
    - Enable automatic goal tracking when presets are marked as "in les gedaan"
    - Support filtering and searching presets by goal codes

  3. Security
    - Existing RLS policies remain unchanged
    - No new security concerns introduced

  4. Notes
    - Nullable field for backwards compatibility with existing presets
    - Will be populated with appropriate goals in subsequent migrations
*/

-- Add goal_codes column to activity_presets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_presets' AND column_name = 'goal_codes'
  ) THEN
    ALTER TABLE activity_presets ADD COLUMN goal_codes text[] DEFAULT '{}';
  END IF;
END $$;

-- Create index for filtering by goal codes
CREATE INDEX IF NOT EXISTS idx_activity_presets_goal_codes ON activity_presets USING GIN (goal_codes);