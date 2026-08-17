/*
  # Cleanup Duplicate Schools RLS Policies

  1. Problem
    - Multiple overlapping SELECT policies on schools table causing conflicts
    - "authenticated_users_can_read_schools" (allows all)
    - "Users can view their organizations" (restrictive)
    - These conflicting policies can cause stack depth errors during inserts into user_schools

  2. Solution
    - Keep only the necessary policies
    - Remove old conflicting policies that were replaced by newer migrations
    - Ensure clean, non-overlapping policy set

  3. Changes
    - Drop old/duplicate policies
    - Keep the newer, simpler policy that allows authenticated users to read schools
*/

-- Drop old policies that were from earlier migrations
DROP POLICY IF EXISTS "Users can view their organizations" ON schools;
DROP POLICY IF EXISTS "Owners can update their organizations" ON schools;
DROP POLICY IF EXISTS "Users can create organizations" ON schools;

-- Keep these policies (already exist):
-- - authenticated_users_can_read_schools (SELECT - allows all authenticated)
-- - creators_and_admins_can_update_schools (UPDATE)
-- - users_can_create_schools (INSERT)
