/*
  # Create student_groups junction table

  ## Overview
  Creates a junction table to manage many-to-many relationships between students and groups (classes).

  ## New Tables

  ### `student_groups`
  Junction table linking students to groups.
  - `id` (uuid, primary key) - Unique identifier
  - `student_id` (uuid, foreign key) - References students table
  - `group_id` (uuid, foreign key) - References groups table
  - `joined_at` (timestamptz) - When the student joined the group
  - `created_at` (timestamptz) - When the record was created

  ## Security
  - Enable RLS on the table
  - Users can only access student_groups for their school's groups and students
  - Teachers can add/remove students from their school's groups

  ## Indexes
  - Index on student_id for fast student lookups
  - Index on group_id for fast group lookups
  - Unique constraint on (student_id, group_id) to prevent duplicates
*/

-- Create student_groups table
CREATE TABLE IF NOT EXISTS student_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, group_id)
);

-- Enable RLS
ALTER TABLE student_groups ENABLE ROW LEVEL SECURITY;

-- Policies for student_groups
CREATE POLICY "Users can view student_groups for their school"
  ON student_groups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = student_groups.group_id
      AND stm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add students to their school's groups"
  ON student_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = student_groups.group_id
      AND stm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove students from their school's groups"
  ON student_groups
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = student_groups.group_id
      AND stm.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_groups_student_id ON student_groups(student_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_group_id ON student_groups(group_id);
