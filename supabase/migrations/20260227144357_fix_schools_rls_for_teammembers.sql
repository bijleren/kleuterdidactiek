/*
  # Fix Schools RLS Policy for Team Members

  1. Changes
    - Drop old SELECT policies on schools table that don't include school_teammembers
    - Add new SELECT policy that checks school_teammembers table
    - This allows users to see schools they are team members of via the school_teammembers table

  2. Security
    - Users can only see schools where they are listed in school_teammembers
    - Maintains existing access through school_users and user_schools tables
    - Uses OR condition to allow any of the three membership tables
*/

-- Drop the old SELECT policy that only checks school_users and user_schools
DROP POLICY IF EXISTS "users_can_read_schools_for_joining" ON schools;

-- Create new SELECT policy that includes school_teammembers
CREATE POLICY "users_can_read_their_schools"
  ON schools
  FOR SELECT
  TO authenticated
  USING (
    -- User is the creator
    created_by = auth.uid()
    -- OR user is in user_schools table
    OR id IN (
      SELECT school_id
      FROM user_schools
      WHERE user_id = auth.uid()
        AND status = 'approved'
        AND is_active = true
    )
    -- OR user is in school_users table
    OR id IN (
      SELECT school_id
      FROM school_users
      WHERE user_id = auth.uid()
    )
    -- OR user is in school_teammembers table
    OR id IN (
      SELECT school_id
      FROM school_teammembers
      WHERE user_id = auth.uid()
        AND is_active = true
    )
    -- OR user is the owner
    OR owner_user_id = auth.uid()
  );
