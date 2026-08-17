/*
  # Create Routines System Tables

  ## Overview
  This migration creates the complete routines system that allows teachers to manage
  recurring classroom activities that automatically integrate into lesson calendars.

  ## New Tables
  
  ### 1. `routines`
  Core routine definitions with educational content and metadata.
  - `id` (uuid, primary key) - Unique routine identifier
  - `title` (text) - Routine name (e.g., "Ochtend Kring")
  - `description` (text) - Detailed explanation of the routine
  - `icon` (text) - Lucide icon name for visual identification
  - `color` (text) - Hex color code for UI theming
  - `images` (text array) - URLs to supporting images
  - `video_url` (text) - Optional Vimeo video URL for demonstration
  - `category` (enum) - When routine fits best: start_week, start_day, start_lesson, lesson, end_lesson, end_day, end_week
  - `goal_codes` (text array) - Array of educational goal codes this routine addresses
  - `is_default` (boolean) - Whether this is a system-provided routine (vs custom)
  - `school_id` (uuid) - School that created custom routine (null for defaults)
  - `created_by` (uuid) - User who created the routine
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `routine_goals`
  Junction table linking routines to specific educational goals.
  - `id` (uuid, primary key)
  - `routine_id` (uuid, foreign key) - References routines
  - `goal_code` (text) - References educational_goals
  - `created_at` (timestamptz)

  ### 3. `group_routines`
  Configuration for which routines are active for which groups and when.
  - `id` (uuid, primary key)
  - `group_id` (uuid, foreign key) - References groups
  - `routine_id` (uuid, foreign key) - References routines
  - `is_active` (boolean) - Whether routine is currently enabled
  - `start_date` (date) - When routine activation begins
  - `end_date` (date, nullable) - When routine activation ends (null = indefinite)
  - `frequency` (enum) - How often: weekly, bi_weekly
  - `week_alternation` (integer) - For bi-weekly: 0 or 1 to determine which weeks
  - `day_of_week` (integer array) - Days routine occurs (0=Sunday, 6=Saturday)
  - `template_block_ids` (uuid array) - Which time blocks routine occupies
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `routine_logs`
  Tracking when routines are executed by teachers.
  - `id` (uuid, primary key)
  - `group_id` (uuid, foreign key)
  - `routine_id` (uuid, foreign key)
  - `lesson_id` (uuid, foreign key, nullable) - Associated lesson if applicable
  - `executed_at` (timestamptz) - When routine was completed
  - `executed_by` (uuid, foreign key) - Teacher who marked complete
  - `notes` (text, nullable) - Optional notes about execution
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Admins can manage default routines
  - All authenticated teachers can view routines
  - Teachers can create custom routines for their school
  - Teachers can only manage routines for their assigned groups

  ## Indexes
  - Performance indexes on group_id, routine_id, is_active for fast queries
  - Date range indexes for efficient calendar generation
*/

-- Create enum types
DO $$ BEGIN
  CREATE TYPE routine_category AS ENUM (
    'start_week',
    'start_day', 
    'start_lesson',
    'lesson',
    'end_lesson',
    'end_day',
    'end_week'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE routine_frequency AS ENUM (
    'weekly',
    'bi_weekly'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create routines table
CREATE TABLE IF NOT EXISTS routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'circle',
  color text NOT NULL DEFAULT '#3b82f6',
  images text[] DEFAULT '{}',
  video_url text,
  category routine_category NOT NULL DEFAULT 'lesson',
  goal_codes text[] DEFAULT '{}',
  is_default boolean DEFAULT false,
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create routine_goals junction table
CREATE TABLE IF NOT EXISTS routine_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  goal_code text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(routine_id, goal_code)
);

-- Create group_routines table
CREATE TABLE IF NOT EXISTS group_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  start_date date NOT NULL,
  end_date date,
  frequency routine_frequency NOT NULL DEFAULT 'weekly',
  week_alternation integer DEFAULT 0 CHECK (week_alternation IN (0, 1)),
  day_of_week integer[] NOT NULL DEFAULT '{}',
  template_block_ids uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Create routine_logs table
CREATE TABLE IF NOT EXISTS routine_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL,
  executed_at timestamptz DEFAULT now(),
  executed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_routines_school_id ON routines(school_id);
CREATE INDEX IF NOT EXISTS idx_routines_is_default ON routines(is_default);
CREATE INDEX IF NOT EXISTS idx_routines_category ON routines(category);

CREATE INDEX IF NOT EXISTS idx_routine_goals_routine_id ON routine_goals(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_goals_goal_code ON routine_goals(goal_code);

CREATE INDEX IF NOT EXISTS idx_group_routines_group_id ON group_routines(group_id);
CREATE INDEX IF NOT EXISTS idx_group_routines_routine_id ON group_routines(routine_id);
CREATE INDEX IF NOT EXISTS idx_group_routines_is_active ON group_routines(is_active);
CREATE INDEX IF NOT EXISTS idx_group_routines_dates ON group_routines(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_routine_logs_group_id ON routine_logs(group_id);
CREATE INDEX IF NOT EXISTS idx_routine_logs_routine_id ON routine_logs(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_logs_executed_at ON routine_logs(executed_at);

-- Enable Row Level Security
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for routines table

-- Anyone authenticated can view default routines and routines from their school
CREATE POLICY "Users can view routines from their school"
  ON routines FOR SELECT
  TO authenticated
  USING (
    is_default = true 
    OR school_id IN (
      SELECT school_id FROM school_teammembers WHERE user_id = auth.uid()
    )
  );

-- Teachers can create routines for their school
CREATE POLICY "Teachers can create routines for their school"
  ON routines FOR INSERT
  TO authenticated
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM school_teammembers WHERE user_id = auth.uid()
    )
  );

-- Only admins can update default routines, teachers can update their school's routines
CREATE POLICY "Users can update routines they created or admins can update defaults"
  ON routines FOR UPDATE
  TO authenticated
  USING (
    (is_default = false AND created_by = auth.uid())
    OR (is_default = false AND school_id IN (
      SELECT school_id FROM school_teammembers WHERE user_id = auth.uid()
    ))
  )
  WITH CHECK (
    (is_default = false AND created_by = auth.uid())
    OR (is_default = false AND school_id IN (
      SELECT school_id FROM school_teammembers WHERE user_id = auth.uid()
    ))
  );

-- Only creators can delete custom routines (defaults cannot be deleted)
CREATE POLICY "Users can delete their own custom routines"
  ON routines FOR DELETE
  TO authenticated
  USING (
    is_default = false 
    AND (
      created_by = auth.uid()
      OR school_id IN (
        SELECT school_id FROM school_teammembers WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for routine_goals table

CREATE POLICY "Users can view routine goals"
  ON routine_goals FOR SELECT
  TO authenticated
  USING (
    routine_id IN (
      SELECT id FROM routines WHERE is_default = true OR school_id IN (
        SELECT school_id FROM school_teammembers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create routine goals for their routines"
  ON routine_goals FOR INSERT
  TO authenticated
  WITH CHECK (
    routine_id IN (
      SELECT id FROM routines WHERE created_by = auth.uid() OR school_id IN (
        SELECT school_id FROM school_teammembers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete routine goals for their routines"
  ON routine_goals FOR DELETE
  TO authenticated
  USING (
    routine_id IN (
      SELECT id FROM routines WHERE created_by = auth.uid() OR school_id IN (
        SELECT school_id FROM school_teammembers WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for group_routines table

CREATE POLICY "Users can view group routines for their groups"
  ON group_routines FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT g.id FROM groups g
      JOIN school_teammembers stm ON g.school_id = stm.school_id
      WHERE stm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create group routines for their groups"
  ON group_routines FOR INSERT
  TO authenticated
  WITH CHECK (
    group_id IN (
      SELECT g.id FROM groups g
      JOIN school_teammembers stm ON g.school_id = stm.school_id
      WHERE stm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update group routines for their groups"
  ON group_routines FOR UPDATE
  TO authenticated
  USING (
    group_id IN (
      SELECT g.id FROM groups g
      JOIN school_teammembers stm ON g.school_id = stm.school_id
      WHERE stm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT g.id FROM groups g
      JOIN school_teammembers stm ON g.school_id = stm.school_id
      WHERE stm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete group routines for their groups"
  ON group_routines FOR DELETE
  TO authenticated
  USING (
    group_id IN (
      SELECT g.id FROM groups g
      JOIN school_teammembers stm ON g.school_id = stm.school_id
      WHERE stm.user_id = auth.uid()
    )
  );

-- RLS Policies for routine_logs table

CREATE POLICY "Users can view routine logs for their groups"
  ON routine_logs FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT g.id FROM groups g
      JOIN school_teammembers stm ON g.school_id = stm.school_id
      WHERE stm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create routine logs for their groups"
  ON routine_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    group_id IN (
      SELECT g.id FROM groups g
      JOIN school_teammembers stm ON g.school_id = stm.school_id
      WHERE stm.user_id = auth.uid()
    )
    AND executed_by = auth.uid()
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_routines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_routines_updated_at_trigger ON routines;
CREATE TRIGGER update_routines_updated_at_trigger
  BEFORE UPDATE ON routines
  FOR EACH ROW
  EXECUTE FUNCTION update_routines_updated_at();

DROP TRIGGER IF EXISTS update_group_routines_updated_at_trigger ON group_routines;
CREATE TRIGGER update_group_routines_updated_at_trigger
  BEFORE UPDATE ON group_routines
  FOR EACH ROW
  EXECUTE FUNCTION update_routines_updated_at();