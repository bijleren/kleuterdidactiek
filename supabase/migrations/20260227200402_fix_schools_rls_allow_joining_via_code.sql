/*
  # Fix Schools RLS Policy - Allow Joining via School Code

  1. Problem
    - Current RLS policy on schools table only allows users to see schools they're already members of
    - This creates a chicken-and-egg problem: users can't join a school because they can't see it until they're a member
    - Users trying to join via school code get "School niet gevonden" error even when the code is valid

  2. Solution
    - Update the SELECT policy to allow ALL authenticated users to read schools
    - This allows users to look up schools by code when joining
    - Security is maintained because:
      - Users can only SEE school basic info (name, code)
      - Users still need proper permissions to INSERT into user_schools
      - Users still need proper permissions to access school data (students, groups, etc.)

  3. Changes
    - Drop current restrictive SELECT policy
    - Create new SELECT policy that allows all authenticated users to read schools
    - This restores the "OR true" clause that was removed in previous migration
*/

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "users_can_read_their_schools" ON schools;

-- Create policy that allows authenticated users to see schools (needed for joining via code)
CREATE POLICY "authenticated_users_can_read_schools"
  ON schools
  FOR SELECT
  TO authenticated
  USING (true);
