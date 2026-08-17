/*
  # Create Lesson-Goal Relationship Table for Performance Optimization

  1. New Tables
    - `lesson_goals`
      - `id` (uuid, primary key) - Unique identifier
      - `lesson_id` (uuid, foreign key) - References lessons table
      - `goal_code` (text) - The goal identifier (e.g., "1.1.1")
      - `lesson_start_time` (timestamptz) - Cached lesson start time for efficient filtering
      - `group_id` (uuid) - Cached group ID for efficient filtering
      - `created_at` (timestamptz) - When this relationship was recorded

  2. Purpose
    - Pre-compute which goals are contained in each lesson
    - Eliminate expensive nested queries when loading goals overview
    - Automatically maintained when lessons are saved/updated/deleted

  3. Security
    - Enable RLS on `lesson_goals` table
    - Users can read lesson_goals for groups they have access to
    - Users can insert/update/delete lesson_goals for lessons they can manage

  4. Performance
    - Index on lesson_id for fast lookups
    - Index on goal_code for filtering by goal
    - Index on group_id and lesson_start_time for date range queries
    - Composite index for common query patterns
*/

-- Create the lesson_goals table
CREATE TABLE IF NOT EXISTS lesson_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  goal_code text NOT NULL,
  lesson_start_time timestamptz NOT NULL,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lesson_goals_lesson_id ON lesson_goals(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_goals_goal_code ON lesson_goals(goal_code);
CREATE INDEX IF NOT EXISTS idx_lesson_goals_group_id ON lesson_goals(group_id);
CREATE INDEX IF NOT EXISTS idx_lesson_goals_start_time ON lesson_goals(lesson_start_time);
CREATE INDEX IF NOT EXISTS idx_lesson_goals_group_date ON lesson_goals(group_id, lesson_start_time);

-- Enable Row Level Security
ALTER TABLE lesson_goals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view lesson_goals for groups they belong to
CREATE POLICY "Users can view lesson_goals for their groups"
  ON lesson_goals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM school_teammembers stm
      JOIN groups g ON g.school_id = stm.school_id
      WHERE g.id = lesson_goals.group_id
      AND stm.user_id = auth.uid()
    )
  );

-- Policy: Users can insert lesson_goals for lessons in their groups
CREATE POLICY "Users can insert lesson_goals for their groups"
  ON lesson_goals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN school_teammembers stm ON stm.school_id = l.school_id
      WHERE l.id = lesson_goals.lesson_id
      AND stm.user_id = auth.uid()
    )
  );

-- Policy: Users can update lesson_goals for lessons in their groups
CREATE POLICY "Users can update lesson_goals for their groups"
  ON lesson_goals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN school_teammembers stm ON stm.school_id = l.school_id
      WHERE l.id = lesson_goals.lesson_id
      AND stm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN school_teammembers stm ON stm.school_id = l.school_id
      WHERE l.id = lesson_goals.lesson_id
      AND stm.user_id = auth.uid()
    )
  );

-- Policy: Users can delete lesson_goals for lessons in their groups
CREATE POLICY "Users can delete lesson_goals for their groups"
  ON lesson_goals FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN school_teammembers stm ON stm.school_id = l.school_id
      WHERE l.id = lesson_goals.lesson_id
      AND stm.user_id = auth.uid()
    )
  );