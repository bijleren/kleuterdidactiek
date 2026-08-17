/*
  # Create Activity Presets System

  ## Overview
  This migration creates the activity_presets table to store reusable activity templates
  that can be used for "hoekenwerk" (corner work) and other kindergarten activities.

  ## New Tables

  ### `activity_presets`
  Stores reusable activity templates with associated educational goals
  - `id` (uuid, primary key) - Unique identifier
  - `school_id` (uuid, foreign key, nullable) - Null for system defaults, specific school for custom presets
  - `name` (text) - Name of the activity preset
  - `description` (text, nullable) - Optional description
  - `icon` (text) - Emoji or icon representation
  - `color` (text) - Hex color code for visual identification
  - `max_students` (integer, nullable) - Maximum number of students (null = unlimited)
  - `is_default` (boolean) - Whether this is a system default preset
  - `goal_codes` (text array) - Array of educational goal codes associated with this preset
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Row Level Security enabled
  - Users can view system defaults (school_id = null) and presets from their school
  - Only users from the associated school can create, update, or delete custom presets
  - System defaults cannot be modified by users

  ## Performance
  - Index on school_id for filtering
  - GIN index on goal_codes for array searches
  - Index on is_default for quick filtering of system presets
*/

-- Create activity_presets table
CREATE TABLE IF NOT EXISTS activity_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT '🎨',
  color text NOT NULL DEFAULT '#FF8E8E',
  max_students integer CHECK (max_students > 0),
  is_default boolean DEFAULT false,
  goal_codes text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_presets_school_id ON activity_presets(school_id);
CREATE INDEX IF NOT EXISTS idx_activity_presets_is_default ON activity_presets(is_default);
CREATE INDEX IF NOT EXISTS idx_activity_presets_goal_codes ON activity_presets USING GIN (goal_codes);

-- Enable Row Level Security
ALTER TABLE activity_presets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view system defaults and presets from their school
CREATE POLICY "Users can view activity presets"
  ON activity_presets FOR SELECT
  TO authenticated
  USING (
    school_id IS NULL OR
    EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = activity_presets.school_id
      AND school_teammembers.user_id = auth.uid()
    )
  );

-- Policy: Users can create presets for their school
CREATE POLICY "Users can create activity presets for their schools"
  ON activity_presets FOR INSERT
  TO authenticated
  WITH CHECK (
    school_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = activity_presets.school_id
      AND school_teammembers.user_id = auth.uid()
    )
  );

-- Policy: Users can update custom presets from their school (not system defaults)
CREATE POLICY "Users can update custom activity presets from their schools"
  ON activity_presets FOR UPDATE
  TO authenticated
  USING (
    school_id IS NOT NULL AND
    is_default = false AND
    EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = activity_presets.school_id
      AND school_teammembers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    school_id IS NOT NULL AND
    is_default = false AND
    EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = activity_presets.school_id
      AND school_teammembers.user_id = auth.uid()
    )
  );

-- Policy: Users can delete custom presets from their school (not system defaults)
CREATE POLICY "Users can delete custom activity presets from their schools"
  ON activity_presets FOR DELETE
  TO authenticated
  USING (
    school_id IS NOT NULL AND
    is_default = false AND
    EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = activity_presets.school_id
      AND school_teammembers.user_id = auth.uid()
    )
  );