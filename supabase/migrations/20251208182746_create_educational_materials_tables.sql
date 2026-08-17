/*
  # Create Educational Materials Management Tables

  ## Overview
  Creates tables for managing educational materials (websites, books, documents, etc.) 
  linked to learning goals. System admins can create global materials visible to all, 
  regular users create school-specific materials.

  ## New Tables
  
  ### `educational_materials`
  - Material metadata (title, description, URL, type)
  - Ownership (global or school-specific)
  
  ### `educational_material_goals`
  - Links materials to kleuterdoelen goals
  
  ### `educational_material_sessions`
  - Tracks when materials are used in lessons

  ## Security
  - RLS enabled on all tables
  - Global materials readable by all authenticated users
  - School materials readable by school members only
  - Only system admins (super_admins table) can create global materials
*/

CREATE TABLE IF NOT EXISTS educational_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  url text,
  material_type text NOT NULL DEFAULT 'website',
  is_global boolean DEFAULT false,
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT educational_materials_school_check CHECK (
    (is_global = true AND school_id IS NULL) OR
    (is_global = false AND school_id IS NOT NULL)
  ),
  CONSTRAINT educational_materials_type_check CHECK (
    material_type IN ('website', 'book', 'document', 'other')
  )
);

CREATE TABLE IF NOT EXISTS educational_material_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES educational_materials(id) ON DELETE CASCADE NOT NULL,
  goal_code text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(material_id, goal_code)
);

CREATE TABLE IF NOT EXISTS educational_material_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES educational_materials(id) ON DELETE CASCADE NOT NULL,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS educational_materials_school_id_idx ON educational_materials(school_id);
CREATE INDEX IF NOT EXISTS educational_materials_is_global_idx ON educational_materials(is_global);
CREATE INDEX IF NOT EXISTS educational_materials_type_idx ON educational_materials(material_type);
CREATE INDEX IF NOT EXISTS educational_material_goals_material_id_idx ON educational_material_goals(material_id);
CREATE INDEX IF NOT EXISTS educational_material_goals_goal_code_idx ON educational_material_goals(goal_code);
CREATE INDEX IF NOT EXISTS educational_material_sessions_material_id_idx ON educational_material_sessions(material_id);
CREATE INDEX IF NOT EXISTS educational_material_sessions_group_id_idx ON educational_material_sessions(group_id);

ALTER TABLE educational_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE educational_material_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE educational_material_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view global materials"
  ON educational_materials FOR SELECT
  TO authenticated
  USING (is_global = true);

CREATE POLICY "Users can view their school's materials"
  ON educational_materials FOR SELECT
  TO authenticated
  USING (
    is_global = false
    AND school_id IN (
      SELECT school_id FROM school_teammembers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System admins can create global materials"
  ON educational_materials FOR INSERT
  TO authenticated
  WITH CHECK (
    is_global = true
    AND EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create school materials"
  ON educational_materials FOR INSERT
  TO authenticated
  WITH CHECK (
    is_global = false
    AND school_id IN (
      SELECT school_id FROM school_teammembers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System admins can update global materials"
  ON educational_materials FOR UPDATE
  TO authenticated
  USING (
    is_global = true
    AND EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their school's materials"
  ON educational_materials FOR UPDATE
  TO authenticated
  USING (
    is_global = false
    AND school_id IN (
      SELECT school_id FROM school_teammembers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System admins can delete global materials"
  ON educational_materials FOR DELETE
  TO authenticated
  USING (
    is_global = true
    AND EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their school's materials"
  ON educational_materials FOR DELETE
  TO authenticated
  USING (
    is_global = false
    AND school_id IN (
      SELECT school_id FROM school_teammembers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view material goals"
  ON educational_material_goals FOR SELECT
  TO authenticated
  USING (
    material_id IN (
      SELECT id FROM educational_materials
      WHERE is_global = true
      OR school_id IN (
        SELECT school_id FROM school_teammembers
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage material goals for accessible materials"
  ON educational_material_goals FOR INSERT
  TO authenticated
  WITH CHECK (
    material_id IN (
      SELECT id FROM educational_materials
      WHERE (
        is_global = true
        AND EXISTS (
          SELECT 1 FROM super_admins
          WHERE user_id = auth.uid()
        )
      )
      OR (
        is_global = false
        AND school_id IN (
          SELECT school_id FROM school_teammembers
          WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can delete material goals for accessible materials"
  ON educational_material_goals FOR DELETE
  TO authenticated
  USING (
    material_id IN (
      SELECT id FROM educational_materials
      WHERE (
        is_global = true
        AND EXISTS (
          SELECT 1 FROM super_admins
          WHERE user_id = auth.uid()
        )
      )
      OR (
        is_global = false
        AND school_id IN (
          SELECT school_id FROM school_teammembers
          WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can view material sessions for their schools"
  ON educational_material_sessions FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT id FROM groups
      WHERE school_id IN (
        SELECT school_id FROM school_teammembers
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create material sessions for their schools"
  ON educational_material_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    group_id IN (
      SELECT id FROM groups
      WHERE school_id IN (
        SELECT school_id FROM school_teammembers
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own material sessions"
  ON educational_material_sessions FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own material sessions"
  ON educational_material_sessions FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());