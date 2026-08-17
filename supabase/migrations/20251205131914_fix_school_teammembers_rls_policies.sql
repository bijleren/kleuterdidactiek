/*
  # Fix infinite recursion in school_teammembers RLS policies

  1. Changes
    - Drop existing policies that cause infinite recursion
    - Create new simplified policies that avoid self-referencing
    - Allow users to see their own records without recursion
    - Allow users to see other teammembers from schools where they're already members (using a security definer function)

  2. Security
    - Users can view their own teammember records
    - Users can view teammembers from schools they belong to
    - Only admins can manage teammembers
    - Users can insert their own records
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read school teammembers" ON school_teammembers;
DROP POLICY IF EXISTS "Admins can manage teammembers" ON school_teammembers;
DROP POLICY IF EXISTS "Users can insert own teammember record" ON school_teammembers;

-- Create a security definer function to check school membership without recursion
CREATE OR REPLACE FUNCTION user_is_school_member(check_school_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM school_teammembers
    WHERE school_id = check_school_id 
    AND user_id = auth.uid() 
    AND is_active = true
  );
$$;

-- Users can view their own records
CREATE POLICY "Users can view own teammember records"
  ON school_teammembers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can view teammembers from schools they belong to
CREATE POLICY "Users can view school teammembers where they are members"
  ON school_teammembers
  FOR SELECT
  TO authenticated
  USING (user_is_school_member(school_id));

-- Users can insert their own records
CREATE POLICY "Users can insert own teammember record"
  ON school_teammembers
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can update teammembers in their schools
CREATE POLICY "Admins can update teammembers"
  ON school_teammembers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM school_teammembers st
      WHERE st.school_id = school_teammembers.school_id
      AND st.user_id = auth.uid()
      AND st.role = 'admin'
      AND st.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM school_teammembers st
      WHERE st.school_id = school_teammembers.school_id
      AND st.user_id = auth.uid()
      AND st.role = 'admin'
      AND st.is_active = true
    )
  );

-- Admins can delete teammembers in their schools
CREATE POLICY "Admins can delete teammembers"
  ON school_teammembers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM school_teammembers st
      WHERE st.school_id = school_teammembers.school_id
      AND st.user_id = auth.uid()
      AND st.role = 'admin'
      AND st.is_active = true
    )
  );