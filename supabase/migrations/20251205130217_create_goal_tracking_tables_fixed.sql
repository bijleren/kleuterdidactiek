/*
  # Goal Tracking Tables for Kleuterdidactiek

  ## Overview
  Creates tables to track educational goal progress at the group level for Flemish kindergarten education.

  ## New Tables
  
  ### `educational_goals`
  - `code` (text, primary key) - Goal code (e.g., "1.1.1", "2.3.4")
  - `domain` (text) - Domain number (1-9)
  - `subject` (text) - Subject name (Nederlands, Wiskunde, etc.)
  - `title` (text) - Short title of the goal
  - `description` (text) - Full description of what the goal entails
  - `created_at` (timestamptz) - When the goal was added to system

  ### `goal_tracking_sessions`
  - `id` (uuid, primary key)
  - `group_id` (uuid, foreign key) - References groups table
  - `goal_codes` (text[]) - Array of goal codes practiced in this session
  - `activity_type` (text) - Type of activity (vocabulary, game, physical_task, writing, etc.)
  - `activity_name` (text) - Specific activity name
  - `practiced_at` (timestamptz) - When the session occurred
  - `duration_minutes` (integer) - How long the session lasted
  - `repetitions` (integer) - Number of times practiced
  - `notes` (text) - Teacher notes about the session
  - `created_by` (uuid, foreign key) - Teacher who logged the session
  - `created_at` (timestamptz)

  ### `group_goal_progress`
  - `id` (uuid, primary key)
  - `group_id` (uuid, foreign key) - References groups table
  - `goal_code` (text) - Goal code being tracked
  - `total_sessions` (integer) - Number of times practiced
  - `total_repetitions` (integer) - Total repetitions across all sessions
  - `last_practiced_at` (timestamptz) - Most recent practice date
  - `first_practiced_at` (timestamptz) - First time practiced
  - `mastery_level` (text) - introduced, practicing, proficient, mastered
  - `updated_at` (timestamptz)

  ### `vocabulary_practice_log`
  - `id` (uuid, primary key)
  - `group_id` (uuid, foreign key) - References groups table
  - `word` (text) - The word practiced
  - `goal_codes` (text[]) - Associated goal codes
  - `clicked_at` (timestamptz) - When the word was clicked/practiced
  - `created_by` (uuid, foreign key) - Teacher who logged it

  ## Security
  - Enable RLS on all tables
  - Users can only access data for schools they belong to
  - Teachers can log sessions for their groups
  - Read access for all authenticated users of the same school
*/

-- Create educational_goals table
CREATE TABLE IF NOT EXISTS educational_goals (
  code text PRIMARY KEY,
  domain text NOT NULL,
  subject text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create goal_tracking_sessions table
CREATE TABLE IF NOT EXISTS goal_tracking_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  goal_codes text[] NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('vocabulary', 'game', 'physical_task', 'writing', 'general', 'other')),
  activity_name text,
  practiced_at timestamptz DEFAULT now(),
  duration_minutes integer,
  repetitions integer DEFAULT 1,
  notes text,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create group_goal_progress table
CREATE TABLE IF NOT EXISTS group_goal_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  goal_code text NOT NULL,
  total_sessions integer DEFAULT 0,
  total_repetitions integer DEFAULT 0,
  last_practiced_at timestamptz,
  first_practiced_at timestamptz,
  mastery_level text DEFAULT 'introduced' CHECK (mastery_level IN ('introduced', 'practicing', 'proficient', 'mastered')),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(group_id, goal_code)
);

-- Create vocabulary_practice_log table
CREATE TABLE IF NOT EXISTS vocabulary_practice_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  word text NOT NULL,
  goal_codes text[],
  clicked_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) NOT NULL
);

-- Enable RLS
ALTER TABLE educational_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_tracking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_practice_log ENABLE ROW LEVEL SECURITY;

-- Policies for educational_goals (read-only for all authenticated users)
CREATE POLICY "Anyone can read educational goals"
  ON educational_goals
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for goal_tracking_sessions
CREATE POLICY "Users can view sessions for their school's groups"
  ON goal_tracking_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = goal_tracking_sessions.group_id
      AND stm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sessions for their school's groups"
  ON goal_tracking_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = goal_tracking_sessions.group_id
      AND stm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own sessions"
  ON goal_tracking_sessions
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own sessions"
  ON goal_tracking_sessions
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Policies for group_goal_progress
CREATE POLICY "Users can view progress for their school's groups"
  ON group_goal_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = group_goal_progress.group_id
      AND stm.user_id = auth.uid()
    )
  );

CREATE POLICY "System can update progress"
  ON group_goal_progress
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = group_goal_progress.group_id
      AND stm.user_id = auth.uid()
    )
  );

-- Policies for vocabulary_practice_log
CREATE POLICY "Users can view vocabulary logs for their school's groups"
  ON vocabulary_practice_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = vocabulary_practice_log.group_id
      AND stm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can log vocabulary practice"
  ON vocabulary_practice_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = vocabulary_practice_log.group_id
      AND stm.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goal_tracking_sessions_group_id ON goal_tracking_sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_goal_tracking_sessions_practiced_at ON goal_tracking_sessions(practiced_at DESC);
CREATE INDEX IF NOT EXISTS idx_goal_tracking_sessions_goal_codes ON goal_tracking_sessions USING GIN(goal_codes);

CREATE INDEX IF NOT EXISTS idx_group_goal_progress_group_id ON group_goal_progress(group_id);
CREATE INDEX IF NOT EXISTS idx_group_goal_progress_goal_code ON group_goal_progress(goal_code);
CREATE INDEX IF NOT EXISTS idx_group_goal_progress_last_practiced ON group_goal_progress(last_practiced_at DESC);

CREATE INDEX IF NOT EXISTS idx_vocabulary_practice_group_id ON vocabulary_practice_log(group_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_practice_clicked_at ON vocabulary_practice_log(clicked_at DESC);

-- Function to update group_goal_progress when a session is logged
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

-- Create trigger to auto-update progress
DROP TRIGGER IF EXISTS trigger_update_goal_progress ON goal_tracking_sessions;
CREATE TRIGGER trigger_update_goal_progress
  AFTER INSERT ON goal_tracking_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_group_goal_progress();
