/*
  # Create Student Goal Evaluation Tables

  ## Overview
  Creates tables to track individual student evaluations on educational goals. Teachers can conduct evaluation sessions where they assess each student on a specific goal using a three-point scale (no, almost, yes) with comments.

  ## New Tables

  ### `student_evaluation_sessions`
  Stores information about evaluation sessions where teachers assess students on specific goals.
  - `id` (uuid, primary key) - Unique session identifier
  - `group_id` (uuid, foreign key) - References groups table
  - `goal_code` (text) - Goal code being evaluated
  - `observation_method` (text) - Method used for observation (dropdown selection)
  - `observation_context` (text) - Additional context/notes about the observation
  - `evaluated_at` (timestamptz) - When the evaluation session occurred
  - `created_by` (uuid, foreign key) - Teacher who conducted the evaluation
  - `created_at` (timestamptz) - When the record was created

  ### `student_goal_evaluations`
  Stores individual student evaluation results within a session.
  - `id` (uuid, primary key) - Unique evaluation identifier
  - `session_id` (uuid, foreign key) - References student_evaluation_sessions
  - `student_id` (uuid, foreign key) - References students table
  - `goal_code` (text) - Goal code being evaluated
  - `result` (text) - Evaluation result: 'no', 'almost', 'yes'
  - `comment` (text, nullable) - Optional teacher comment about this evaluation
  - `evaluated_at` (timestamptz) - When the evaluation occurred
  - `created_by` (uuid, foreign key) - Teacher who made the evaluation
  - `created_at` (timestamptz) - When the record was created

  ## Security
  - Enable RLS on all tables
  - Users can only access evaluations for students in their school's groups
  - Teachers can create evaluations for their school's students
  - Read access for all authenticated users of the same school

  ## Indexes
  - Index on session_id for fast lookups of evaluations in a session
  - Index on student_id for fast student-specific queries
  - Index on goal_code for filtering by goal
  - Composite index on (student_id, goal_code) for student goal history
*/

-- Create student_evaluation_sessions table
CREATE TABLE IF NOT EXISTS student_evaluation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  goal_code text NOT NULL,
  observation_method text NOT NULL,
  observation_context text,
  evaluated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create student_goal_evaluations table
CREATE TABLE IF NOT EXISTS student_goal_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES student_evaluation_sessions(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  goal_code text NOT NULL,
  result text NOT NULL CHECK (result IN ('no', 'almost', 'yes')),
  comment text,
  evaluated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE student_evaluation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_goal_evaluations ENABLE ROW LEVEL SECURITY;

-- Policies for student_evaluation_sessions
CREATE POLICY "Users can view evaluation sessions for their school's groups"
  ON student_evaluation_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = student_evaluation_sessions.group_id
      AND stm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create evaluation sessions for their school's groups"
  ON student_evaluation_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = student_evaluation_sessions.group_id
      AND stm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own evaluation sessions"
  ON student_evaluation_sessions
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own evaluation sessions"
  ON student_evaluation_sessions
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Policies for student_goal_evaluations
CREATE POLICY "Users can view evaluations for their school's students"
  ON student_goal_evaluations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN school_teammembers stm ON stm.school_id = s.school_id
      WHERE s.id = student_goal_evaluations.student_id
      AND stm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create evaluations for their school's students"
  ON student_goal_evaluations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students s
      JOIN school_teammembers stm ON stm.school_id = s.school_id
      WHERE s.id = student_goal_evaluations.student_id
      AND stm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own evaluations"
  ON student_goal_evaluations
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own evaluations"
  ON student_goal_evaluations
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_evaluation_sessions_group_id
  ON student_evaluation_sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_student_evaluation_sessions_goal_code
  ON student_evaluation_sessions(goal_code);
CREATE INDEX IF NOT EXISTS idx_student_evaluation_sessions_evaluated_at
  ON student_evaluation_sessions(evaluated_at DESC);

CREATE INDEX IF NOT EXISTS idx_student_goal_evaluations_session_id
  ON student_goal_evaluations(session_id);
CREATE INDEX IF NOT EXISTS idx_student_goal_evaluations_student_id
  ON student_goal_evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_student_goal_evaluations_goal_code
  ON student_goal_evaluations(goal_code);
CREATE INDEX IF NOT EXISTS idx_student_goal_evaluations_student_goal
  ON student_goal_evaluations(student_id, goal_code);
CREATE INDEX IF NOT EXISTS idx_student_goal_evaluations_evaluated_at
  ON student_goal_evaluations(evaluated_at DESC);
