/*
  # Optimize RLS Auth Performance - Simple Policies

  Fixes simple RLS policies to use (select auth.uid()) for better performance.

  ## Tables Updated
  - user_favorites
  - school_teammembers
*/

-- user_favorites table policies
DROP POLICY IF EXISTS "Users can delete own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can read own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can update own favorites" ON user_favorites;

CREATE POLICY "Users can delete own favorites"
  ON user_favorites FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own favorites"
  ON user_favorites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can read own favorites"
  ON user_favorites FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own favorites"
  ON user_favorites FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- school_teammembers table policies
DROP POLICY IF EXISTS "Users can delete own record" ON school_teammembers;
DROP POLICY IF EXISTS "Users can insert own record" ON school_teammembers;
DROP POLICY IF EXISTS "Users can update own record" ON school_teammembers;
DROP POLICY IF EXISTS "Users can view own records" ON school_teammembers;

CREATE POLICY "Users can delete own record"
  ON school_teammembers FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own record"
  ON school_teammembers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own record"
  ON school_teammembers FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can view own records"
  ON school_teammembers FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));
