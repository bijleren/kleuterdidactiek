/*
  # Optimize RLS Auth Performance - Part 1

  Fixes RLS policies to use (select auth.uid()) instead of auth.uid()
  to prevent re-evaluation for each row, significantly improving query performance.

  ## Tables Updated  
  - profiles
  - schools
  - groups
  - students

  ## Performance Impact
  Prevents auth functions from being called for every row, improving query performance
  by orders of magnitude on tables with many rows.
*/

-- profiles table policies
DROP POLICY IF EXISTS "School members can read other school members profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "School members can read other school members profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT us.user_id
      FROM user_schools us
      WHERE us.school_id IN (
        SELECT us_current.school_id
        FROM user_schools us_current
        WHERE us_current.user_id = (select auth.uid())
          AND us_current.status = 'approved'
          AND us_current.is_active = true
      )
      AND us.status = 'approved'
      AND us.is_active = true
    )
  );

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- schools table policies
DROP POLICY IF EXISTS "creators_and_admins_can_update_schools" ON schools;
DROP POLICY IF EXISTS "users_can_create_schools" ON schools;
DROP POLICY IF EXISTS "users_can_read_schools_for_joining" ON schools;

CREATE POLICY "creators_and_admins_can_update_schools"
  ON schools FOR UPDATE
  TO authenticated
  USING (
    created_by = (select auth.uid())
    OR id IN (
      SELECT school_id
      FROM user_schools
      WHERE user_id = (select auth.uid())
        AND role = 'admin'
        AND is_active = true
    )
  )
  WITH CHECK (
    created_by = (select auth.uid())
    OR id IN (
      SELECT school_id
      FROM user_schools
      WHERE user_id = (select auth.uid())
        AND role = 'admin'
        AND is_active = true
    )
  );

CREATE POLICY "users_can_create_schools"
  ON schools FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

CREATE POLICY "users_can_read_schools_for_joining"
  ON schools FOR SELECT
  TO authenticated
  USING (
    created_by = (select auth.uid())
    OR id IN (
      SELECT school_id
      FROM user_schools
      WHERE user_id = (select auth.uid())
        AND status = 'approved'
        AND is_active = true
    )
    OR true
  );

-- groups table policies
DROP POLICY IF EXISTS "Approved members can delete groups" ON groups;
DROP POLICY IF EXISTS "Approved members can insert groups" ON groups;
DROP POLICY IF EXISTS "Approved members can read groups" ON groups;
DROP POLICY IF EXISTS "Approved members can update groups" ON groups;

CREATE POLICY "Approved members can delete groups"
  ON groups FOR DELETE
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id
      FROM user_schools
      WHERE user_id = (select auth.uid())
        AND status = 'approved'
        AND is_active = true
    )
  );

CREATE POLICY "Approved members can insert groups"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (
    school_id IN (
      SELECT school_id
      FROM user_schools
      WHERE user_id = (select auth.uid())
        AND status = 'approved'
        AND is_active = true
    )
  );

CREATE POLICY "Approved members can read groups"
  ON groups FOR SELECT
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id
      FROM user_schools
      WHERE user_id = (select auth.uid())
        AND status = 'approved'
        AND is_active = true
    )
  );

CREATE POLICY "Approved members can update groups"
  ON groups FOR UPDATE
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id
      FROM user_schools
      WHERE user_id = (select auth.uid())
        AND status = 'approved'
        AND is_active = true
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT school_id
      FROM user_schools
      WHERE user_id = (select auth.uid())
        AND status = 'approved'
        AND is_active = true
    )
  );

-- students table policies
DROP POLICY IF EXISTS "Approved members can delete students" ON students;
DROP POLICY IF EXISTS "Approved members can insert students" ON students;
DROP POLICY IF EXISTS "Approved members can read students" ON students;
DROP POLICY IF EXISTS "Approved members can update students" ON students;

CREATE POLICY "Approved members can delete students"
  ON students FOR DELETE
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id
      FROM user_schools
      WHERE user_id = (select auth.uid())
        AND status = 'approved'
        AND is_active = true
    )
  );

CREATE POLICY "Approved members can insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (
    school_id IN (
      SELECT school_id
      FROM user_schools
      WHERE user_id = (select auth.uid())
        AND status = 'approved'
        AND is_active = true
    )
  );

CREATE POLICY "Approved members can read students"
  ON students FOR SELECT
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id
      FROM user_schools
      WHERE user_id = (select auth.uid())
        AND status = 'approved'
        AND is_active = true
    )
  );

CREATE POLICY "Approved members can update students"
  ON students FOR UPDATE
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id
      FROM user_schools
      WHERE user_id = (select auth.uid())
        AND status = 'approved'
        AND is_active = true
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT school_id
      FROM user_schools
      WHERE user_id = (select auth.uid())
        AND status = 'approved'
        AND is_active = true
    )
  );
