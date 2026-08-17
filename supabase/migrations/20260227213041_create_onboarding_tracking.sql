/*
  # Create onboarding tracking tables

  1. New Tables
    - `group_onboarding_progress`
      - `id` (uuid, primary key)
      - `group_id` (uuid, references groups)
      - `user_id` (uuid, references auth.users)
      - `feature` (text) - feature name that was used
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `group_onboarding_progress` table
    - Add policies for authenticated users to manage their own progress
  
  3. Features Tracked
    - agenda_viewed
    - kleuterdoelen_viewed
    - activiteit_viewed
    - students_added
    - groups_created
    - materials_added
    - videos_added
    - analytics_viewed
*/

CREATE TABLE IF NOT EXISTS group_onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id, feature)
);

ALTER TABLE group_onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view onboarding progress for their groups"
  ON group_onboarding_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_onboarding_progress.group_id
      AND g.school_id IN (
        SELECT school_id FROM user_schools
        WHERE user_id = auth.uid()
        AND status = 'approved'
        AND is_active = true
      )
    )
  );

CREATE POLICY "Users can insert onboarding progress for their groups"
  ON group_onboarding_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_onboarding_progress.group_id
      AND g.school_id IN (
        SELECT school_id FROM user_schools
        WHERE user_id = auth.uid()
        AND status = 'approved'
        AND is_active = true
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_onboarding_group_user ON group_onboarding_progress(group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_feature ON group_onboarding_progress(feature);