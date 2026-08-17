/*
  # Simplify user_schools RLS to Prevent Recursion

  1. Problem
    - Previous policy still had self-referential subquery on user_schools
    - During INSERT, checking "what schools am I in" creates recursion
    - Stack depth exceeded when joining a school

  2. Solution
    - Keep SELECT policies simple and non-recursive
    - Users can always see their own records (no subquery needed)
    - Users can see other members only via school_teammembers join (no recursion)
    - Rely on school_teammembers table for cross-member visibility

  3. Changes
    - Drop recursive policy
    - Keep only direct ownership check for SELECT
    - Add policy to see members via school_teammembers (separate table)
*/

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can see members of their schools" ON user_schools;

-- This policy already exists and is safe (direct check, no recursion):
-- "Users can read own school relationships" - checks user_id = auth.uid()

-- Add policy to see other members via school_teammembers (different table, no recursion)
CREATE POLICY "Users can see school members via teammembers table"
  ON user_schools
  FOR SELECT
  TO authenticated
  USING (
    -- Can see user_schools records for schools where they appear in school_teammembers
    EXISTS (
      SELECT 1
      FROM school_teammembers stm
      WHERE stm.school_id = user_schools.school_id
        AND stm.user_id = auth.uid()
        AND stm.is_active = true
    )
  );
