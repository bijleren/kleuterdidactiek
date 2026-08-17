/*
  # Create Lessons Tables

  ## Overview
  Creates tables for managing lessons (lessen) in the agenda. Lessons can contain
  multiple items from different activity types (vocabulary, games, videos, materials, etc.)

  ## New Tables
  
  ### `lessons`
  Stores lesson metadata including title, description, and scheduling information
  - `id` (uuid, primary key)
  - `group_id` (uuid, foreign key to groups)
  - `school_id` (uuid, foreign key to schools)
  - `title` (text) - Lesson title
  - `description` (text, nullable) - Lesson description
  - `start_time` (timestamptz) - When the lesson starts
  - `end_time` (timestamptz) - When the lesson ends
  - `created_by` (uuid, foreign key to auth.users)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `lesson_items`
  Stores individual items that are part of a lesson
  - `id` (uuid, primary key)
  - `lesson_id` (uuid, foreign key to lessons)
  - `item_type` (text) - Type: 'vocabulary', 'game', 'writing', 'physical_task', 'video', 'material', 'goal'
  - `item_id` (text) - ID of the referenced item
  - `item_name` (text) - Display name of the item
  - `sort_order` (integer) - Order of items in the lesson
  - `notes` (text, nullable) - Optional notes for this item
  - `duration_minutes` (integer, nullable) - Planned duration for this item
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access lessons for their school
  - Only authenticated users can create/edit lessons
*/

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create lesson_items table
CREATE TABLE IF NOT EXISTS lesson_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  item_type text NOT NULL,
  item_id text NOT NULL,
  item_name text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  notes text,
  duration_minutes integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_item_type CHECK (item_type = ANY (ARRAY['vocabulary'::text, 'game'::text, 'writing'::text, 'physical_task'::text, 'video'::text, 'material'::text, 'goal'::text]))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS lessons_group_id_idx ON lessons(group_id);
CREATE INDEX IF NOT EXISTS lessons_school_id_idx ON lessons(school_id);
CREATE INDEX IF NOT EXISTS lessons_start_time_idx ON lessons(start_time);
CREATE INDEX IF NOT EXISTS lesson_items_lesson_id_idx ON lesson_items(lesson_id);

-- Enable RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lessons

CREATE POLICY "Users can view lessons from their school"
  ON lessons FOR SELECT
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM school_teammembers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create lessons for their school"
  ON lessons FOR INSERT
  TO authenticated
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM school_teammembers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update lessons from their school"
  ON lessons FOR UPDATE
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM school_teammembers
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM school_teammembers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete lessons from their school"
  ON lessons FOR DELETE
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM school_teammembers
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for lesson_items

CREATE POLICY "Users can view lesson items from their school"
  ON lesson_items FOR SELECT
  TO authenticated
  USING (
    lesson_id IN (
      SELECT id FROM lessons
      WHERE school_id IN (
        SELECT school_id FROM school_teammembers
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create lesson items for their school"
  ON lesson_items FOR INSERT
  TO authenticated
  WITH CHECK (
    lesson_id IN (
      SELECT id FROM lessons
      WHERE school_id IN (
        SELECT school_id FROM school_teammembers
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update lesson items from their school"
  ON lesson_items FOR UPDATE
  TO authenticated
  USING (
    lesson_id IN (
      SELECT id FROM lessons
      WHERE school_id IN (
        SELECT school_id FROM school_teammembers
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    lesson_id IN (
      SELECT id FROM lessons
      WHERE school_id IN (
        SELECT school_id FROM school_teammembers
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete lesson items from their school"
  ON lesson_items FOR DELETE
  TO authenticated
  USING (
    lesson_id IN (
      SELECT id FROM lessons
      WHERE school_id IN (
        SELECT school_id FROM school_teammembers
        WHERE user_id = auth.uid()
      )
    )
  );
