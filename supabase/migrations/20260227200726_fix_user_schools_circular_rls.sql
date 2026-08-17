/*
  # Fix user_schools Circular RLS Dependencies

  1. Problem
    - SELECT policy uses is_school_member() function which queries user_schools
    - This creates circular dependency during INSERT operations
    - Results in "stack depth limit exceeded" error when joining a school

  2. Solution
    - Replace the is_school_member() function call with direct query
    - Simplify policies to avoid recursion
    - Users can see:
      - Their own user_schools records (direct)
      - Other members of schools they belong to (via direct table check, not function)

  3. Changes
    - Drop policy using is_school_member()
    - Create simpler policy that checks user_schools directly without function wrapper
*/

-- Drop the policy that uses the circular function
DROP POLICY IF EXISTS "School members can read other school members" ON user_schools;

-- Create a simpler policy that avoids the function call
-- Users can see other members of schools where they are already approved members
CREATE POLICY "Users can see members of their schools"
  ON user_schools
  FOR SELECT
  TO authenticated
  USING (
    -- Can see records where the school_id matches a school they're a member of
    school_id IN (
      SELECT us.school_id
      FROM user_schools us
      WHERE us.user_id = auth.uid()
        AND us.status = 'approved'
        AND us.is_active = true
    )
  );
