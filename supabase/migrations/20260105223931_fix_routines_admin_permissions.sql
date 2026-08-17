/*
  # Fix Routines Admin Permissions

  ## Overview
  Updates RLS policies to allow school admins to edit and delete default routines.

  ## Changes
  - Drop existing UPDATE and DELETE policies on routines table
  - Create new policies that check for admin role in school_teammembers
  - Admins can now modify default routines
  - Regular users can still only modify their own custom routines
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can update routines they created or admins can update defaults" ON routines;
DROP POLICY IF EXISTS "Users can delete their own custom routines" ON routines;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_school_admin(check_school_id uuid)
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
    AND role = 'admin'
    AND is_active = true
  );
$$;

-- New UPDATE policy: users can update their own routines, admins can update any routine (including defaults)
CREATE POLICY "Users can update their routines and admins can update any routine"
  ON routines FOR UPDATE
  TO authenticated
  USING (
    -- User created this custom routine
    (is_default = false AND created_by = auth.uid())
    -- User is member of the school for custom routines
    OR (is_default = false AND school_id IN (
      SELECT school_id FROM school_teammembers WHERE user_id = auth.uid()
    ))
    -- User is admin for any routine (including defaults)
    OR EXISTS (
      SELECT 1 FROM school_teammembers 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND is_active = true
    )
  )
  WITH CHECK (
    -- User created this custom routine
    (is_default = false AND created_by = auth.uid())
    -- User is member of the school for custom routines
    OR (is_default = false AND school_id IN (
      SELECT school_id FROM school_teammembers WHERE user_id = auth.uid()
    ))
    -- User is admin for any routine (including defaults)
    OR EXISTS (
      SELECT 1 FROM school_teammembers 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND is_active = true
    )
  );

-- New DELETE policy: users can delete their own routines, admins can delete any routine (including defaults)
CREATE POLICY "Users can delete their routines and admins can delete any routine"
  ON routines FOR DELETE
  TO authenticated
  USING (
    -- User created this custom routine
    (is_default = false AND created_by = auth.uid())
    -- User is member of the school for custom routines
    OR (is_default = false AND school_id IN (
      SELECT school_id FROM school_teammembers WHERE user_id = auth.uid()
    ))
    -- User is admin for any routine (including defaults)
    OR EXISTS (
      SELECT 1 FROM school_teammembers 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND is_active = true
    )
  );