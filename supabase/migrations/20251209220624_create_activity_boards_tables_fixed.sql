/*
  # Create Activity Boards System Tables

  ## Overview
  This migration creates the complete database structure for the Activi-Tijd (Activity Time) management system,
  allowing teachers to manage activity-based learning sessions with students.

  ## New Tables

  ### `activity_boards`
  Main board table that groups activity options together
  - `id` (uuid, primary key)
  - `school_id` (uuid, foreign key to schools)
  - `created_by` (uuid, foreign key to auth.users)
  - `name` (text) - Board name
  - `description` (text) - Board description
  - `is_active` (boolean) - Whether board is currently active
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `activity_options`
  Individual activities available on a board
  - `id` (uuid, primary key)
  - `board_id` (uuid, foreign key to activity_boards)
  - `name` (text) - Activity name
  - `description` (text) - Activity description
  - `color` (text) - Hex color for visual identification
  - `icon` (text) - Lucide icon name
  - `max_students` (integer) - Maximum number of students (null = unlimited)
  - `sort_order` (integer) - Display order on board
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### `activity_sessions`
  Tracks individual student sessions in activities
  - `id` (uuid, primary key)
  - `activity_option_id` (uuid, foreign key to activity_options)
  - `student_id` (uuid, foreign key to students)
  - `started_by` (uuid, foreign key to auth.users)
  - `started_at` (timestamptz)
  - `ended_at` (timestamptz) - Null while session is active
  - `rating` (integer) - 1-5 rating of activity
  - `notes` (text) - Teacher notes about session
  - `created_at` (timestamptz)

  ## Security
  - Row Level Security enabled on all tables
  - Policies ensure users can only access data from their schools
  - Authenticated users required for all operations
*/

-- Create activity_boards table
CREATE TABLE IF NOT EXISTS activity_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create activity_options table
CREATE TABLE IF NOT EXISTS activity_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES activity_boards(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT '#6B7280',
  icon text NOT NULL DEFAULT 'Grid',
  max_students integer,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create activity_sessions table
CREATE TABLE IF NOT EXISTS activity_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_option_id uuid NOT NULL REFERENCES activity_options(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  started_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_boards_school_id') THEN
    CREATE INDEX idx_activity_boards_school_id ON activity_boards(school_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_options_board_id') THEN
    CREATE INDEX idx_activity_options_board_id ON activity_options(board_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_sessions_option_id') THEN
    CREATE INDEX idx_activity_sessions_option_id ON activity_sessions(activity_option_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_sessions_student_id') THEN
    CREATE INDEX idx_activity_sessions_student_id ON activity_sessions(student_id);
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE activity_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_boards
CREATE POLICY "Users can view boards from their schools"
  ON activity_boards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = activity_boards.school_id
      AND school_teammembers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create boards in their schools"
  ON activity_boards FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = activity_boards.school_id
      AND school_teammembers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update boards from their schools"
  ON activity_boards FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = activity_boards.school_id
      AND school_teammembers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = activity_boards.school_id
      AND school_teammembers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete boards from their schools"
  ON activity_boards FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = activity_boards.school_id
      AND school_teammembers.user_id = auth.uid()
    )
  );

-- RLS Policies for activity_options
CREATE POLICY "Users can view options from boards in their schools"
  ON activity_options FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM activity_boards
      JOIN school_teammembers ON school_teammembers.school_id = activity_boards.school_id
      WHERE activity_boards.id = activity_options.board_id
      AND school_teammembers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create options in boards from their schools"
  ON activity_options FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM activity_boards
      JOIN school_teammembers ON school_teammembers.school_id = activity_boards.school_id
      WHERE activity_boards.id = activity_options.board_id
      AND school_teammembers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update options in boards from their schools"
  ON activity_options FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM activity_boards
      JOIN school_teammembers ON school_teammembers.school_id = activity_boards.school_id
      WHERE activity_boards.id = activity_options.board_id
      AND school_teammembers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM activity_boards
      JOIN school_teammembers ON school_teammembers.school_id = activity_boards.school_id
      WHERE activity_boards.id = activity_options.board_id
      AND school_teammembers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete options in boards from their schools"
  ON activity_options FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM activity_boards
      JOIN school_teammembers ON school_teammembers.school_id = activity_boards.school_id
      WHERE activity_boards.id = activity_options.board_id
      AND school_teammembers.user_id = auth.uid()
    )
  );

-- RLS Policies for activity_sessions
CREATE POLICY "Users can view sessions from their schools"
  ON activity_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM activity_options
      JOIN activity_boards ON activity_boards.id = activity_options.board_id
      JOIN school_teammembers ON school_teammembers.school_id = activity_boards.school_id
      WHERE activity_options.id = activity_sessions.activity_option_id
      AND school_teammembers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sessions in their schools"
  ON activity_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM activity_options
      JOIN activity_boards ON activity_boards.id = activity_options.board_id
      JOIN school_teammembers ON school_teammembers.school_id = activity_boards.school_id
      WHERE activity_options.id = activity_sessions.activity_option_id
      AND school_teammembers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sessions in their schools"
  ON activity_sessions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM activity_options
      JOIN activity_boards ON activity_boards.id = activity_options.board_id
      JOIN school_teammembers ON school_teammembers.school_id = activity_boards.school_id
      WHERE activity_options.id = activity_sessions.activity_option_id
      AND school_teammembers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM activity_options
      JOIN activity_boards ON activity_boards.id = activity_options.board_id
      JOIN school_teammembers ON school_teammembers.school_id = activity_boards.school_id
      WHERE activity_options.id = activity_sessions.activity_option_id
      AND school_teammembers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sessions in their schools"
  ON activity_sessions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM activity_options
      JOIN activity_boards ON activity_boards.id = activity_options.board_id
      JOIN school_teammembers ON school_teammembers.school_id = activity_boards.school_id
      WHERE activity_options.id = activity_sessions.activity_option_id
      AND school_teammembers.user_id = auth.uid()
    )
  );