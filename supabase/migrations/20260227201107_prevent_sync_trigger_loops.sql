/*
  # Prevent Infinite Trigger Loops in Sync Functions

  1. Problem
    - user_schools INSERT triggers sync to school_teammembers
    - school_teammembers INSERT triggers sync back to user_schools
    - This creates an infinite loop that could cause stack depth errors

  2. Solution
    - Add loop detection using session variables
    - Skip reverse sync if we're already in a sync operation
    - Use PostgreSQL's configuration settings to track sync state

  3. Changes
    - Update both sync functions to check for and set sync flags
    - Prevent re-triggering when already in a sync operation
*/

-- Recreate the user_schools → school_teammembers sync with loop protection
CREATE OR REPLACE FUNCTION sync_user_schools_to_teammembers()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent infinite loops: skip if we're already in a sync from teammembers
  IF current_setting('app.syncing_from_teammembers', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Set flag to indicate we're syncing from user_schools
  PERFORM set_config('app.syncing_from_user_schools', 'true', true);

  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Only sync approved and active users
    IF NEW.status = 'approved' AND NEW.is_active = true THEN
      INSERT INTO school_teammembers (user_id, school_id, role, joined_at, is_active, invited_by)
      VALUES (NEW.user_id, NEW.school_id, NEW.role, NEW.joined_at, NEW.is_active, NULL)
      ON CONFLICT (user_id, school_id)
      DO UPDATE SET
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        joined_at = LEAST(school_teammembers.joined_at, EXCLUDED.joined_at);
    ELSIF TG_OP = 'UPDATE' AND (NEW.status != 'approved' OR NEW.is_active = false) THEN
      -- If user is no longer approved or active, remove from school_teammembers
      DELETE FROM school_teammembers
      WHERE user_id = NEW.user_id AND school_id = NEW.school_id;
    END IF;
    
    -- Clear the flag
    PERFORM set_config('app.syncing_from_user_schools', 'false', true);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove from school_teammembers when deleted from user_schools
    DELETE FROM school_teammembers
    WHERE user_id = OLD.user_id AND school_id = OLD.school_id;
    
    -- Clear the flag
    PERFORM set_config('app.syncing_from_user_schools', 'false', true);
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the school_teammembers → user_schools sync with loop protection
CREATE OR REPLACE FUNCTION sync_teammembers_to_user_schools()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent infinite loops: skip if we're already in a sync from user_schools
  IF current_setting('app.syncing_from_user_schools', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Set flag to indicate we're syncing from teammembers
  PERFORM set_config('app.syncing_from_teammembers', 'true', true);

  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Sync active members to user_schools as approved
    IF NEW.is_active = true THEN
      INSERT INTO user_schools (user_id, school_id, role, joined_at, is_active, status)
      VALUES (NEW.user_id, NEW.school_id, NEW.role, NEW.joined_at, NEW.is_active, 'approved')
      ON CONFLICT (user_id, school_id)
      DO UPDATE SET
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        status = 'approved',
        joined_at = LEAST(user_schools.joined_at, EXCLUDED.joined_at);
    ELSIF TG_OP = 'UPDATE' AND NEW.is_active = false THEN
      -- If member is deactivated, mark as inactive in user_schools
      UPDATE user_schools
      SET is_active = false
      WHERE user_id = NEW.user_id AND school_id = NEW.school_id;
    END IF;
    
    -- Clear the flag
    PERFORM set_config('app.syncing_from_teammembers', 'false', true);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove from user_schools when deleted from school_teammembers
    DELETE FROM user_schools
    WHERE user_id = OLD.user_id AND school_id = OLD.school_id;
    
    -- Clear the flag
    PERFORM set_config('app.syncing_from_teammembers', 'false', true);
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
