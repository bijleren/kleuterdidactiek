/*
  # Create Custom Vocabulary Table

  1. New Tables
    - `custom_vocabulary`
      - `id` (uuid, primary key)
      - `school_id` (uuid, references schools)
      - `word` (text) - The custom vocabulary word
      - `category_id` (uuid, references vocabulary_categories)
      - `goal_codes` (text array) - Array of goal codes this word relates to
      - `is_deleted` (boolean) - Soft delete flag
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `deleted_at` (timestamptz, nullable)
      - `deleted_by` (uuid, nullable, references auth.users)

  2. Security
    - Enable RLS on `custom_vocabulary` table
    - Add policy for authenticated users to view custom vocabulary from their school
    - Add policy for authenticated users to insert custom vocabulary for their school
    - Add policy for authenticated users to soft delete custom vocabulary from their school

  3. Indexes
    - Add index on school_id for faster lookups
    - Add index on word for uniqueness checking
    - Add index on is_deleted for filtering active words
*/

CREATE TABLE IF NOT EXISTS custom_vocabulary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  word text NOT NULL,
  category_id uuid NOT NULL REFERENCES vocabulary_categories(id) ON DELETE RESTRICT,
  goal_codes text[] NOT NULL DEFAULT '{}',
  is_deleted boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT custom_vocabulary_word_school_unique UNIQUE(word, school_id, is_deleted)
);

CREATE INDEX IF NOT EXISTS idx_custom_vocabulary_school_id ON custom_vocabulary(school_id);
CREATE INDEX IF NOT EXISTS idx_custom_vocabulary_word ON custom_vocabulary(word);
CREATE INDEX IF NOT EXISTS idx_custom_vocabulary_is_deleted ON custom_vocabulary(is_deleted);

ALTER TABLE custom_vocabulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view custom vocabulary from their school"
  ON custom_vocabulary
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = custom_vocabulary.school_id
      AND school_teammembers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert custom vocabulary for their school"
  ON custom_vocabulary
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = custom_vocabulary.school_id
      AND school_teammembers.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can soft delete custom vocabulary from their school"
  ON custom_vocabulary
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = custom_vocabulary.school_id
      AND school_teammembers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = custom_vocabulary.school_id
      AND school_teammembers.user_id = auth.uid()
    )
  );