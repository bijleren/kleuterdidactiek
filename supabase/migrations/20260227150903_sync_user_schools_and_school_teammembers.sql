/*
  # Unified School Connection System - Bidirectional Sync
  
  1. Overview
    - Synchronizes user-school connections between Leescoach (user_schools) and Kleuterdidactiek (school_teammembers)
    - Ensures both platforms stay in sync automatically for all future registrations
    - Handles deduplication and conflict resolution
  
  2. Initial Data Sync
    - Copies all approved users from user_schools to school_teammembers
    - Only syncs users with status='approved' and is_active=true
    - Skips duplicates using ON CONFLICT to prevent errors
  
  3. Column Mapping
    user_schools → school_teammembers:
    - user_id → user_id (direct copy)
    - school_id → school_id (direct copy)
    - role → role (direct copy)
    - joined_at → joined_at (direct copy)
    - is_active → is_active (direct copy)
    - status: Only 'approved' users are synced
    - invited_by: Set to NULL (not present in user_schools)
  
  4. Automatic Triggers
    A. user_schools → school_teammembers (Forward Sync)
       - ON INSERT: When approved user joins via Leescoach, auto-add to school_teammembers
       - ON UPDATE: When status changes to 'approved', auto-add to school_teammembers
       - ON UPDATE: Sync role and is_active changes
       - ON DELETE: Remove from school_teammembers (maintains referential integrity)
    
    B. school_teammembers → user_schools (Reverse Sync)
       - ON INSERT: When user joins via Kleuterdidactiek, auto-add to user_schools as 'approved'
       - ON UPDATE: Sync role and is_active changes
       - ON DELETE: Remove from user_schools (maintains referential integrity)
  
  5. Deduplication Protection
    - Uses ON CONFLICT (user_id, school_id) DO UPDATE
    - Prevents duplicate entries
    - Updates existing records instead of failing
  
  6. Business Logic
    - Leescoach uses 'status' field for approval workflow
    - Kleuterdidactiek has no status field (all users implicitly approved)
    - Only approved Leescoach users appear in Kleuterdidactiek
    - All Kleuterdidactiek users appear as approved in Leescoach
*/

-- Step 1: Initial sync of approved users from user_schools to school_teammembers
INSERT INTO school_teammembers (user_id, school_id, role, joined_at, is_active, invited_by)
SELECT 
  us.user_id,
  us.school_id,
  us.role,
  us.joined_at,
  us.is_active,
  NULL as invited_by
FROM user_schools us
WHERE us.status = 'approved' 
  AND us.is_active = true
ON CONFLICT (user_id, school_id) 
DO UPDATE SET
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  joined_at = LEAST(school_teammembers.joined_at, EXCLUDED.joined_at);

-- Step 2: Create trigger function for user_schools → school_teammembers sync
CREATE OR REPLACE FUNCTION sync_user_schools_to_teammembers()
RETURNS TRIGGER AS $$
BEGIN
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
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove from school_teammembers when deleted from user_schools
    DELETE FROM school_teammembers
    WHERE user_id = OLD.user_id AND school_id = OLD.school_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger on user_schools table
DROP TRIGGER IF EXISTS trigger_sync_user_schools_to_teammembers ON user_schools;
CREATE TRIGGER trigger_sync_user_schools_to_teammembers
  AFTER INSERT OR UPDATE OR DELETE ON user_schools
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_schools_to_teammembers();

-- Step 4: Create trigger function for school_teammembers → user_schools sync
CREATE OR REPLACE FUNCTION sync_teammembers_to_user_schools()
RETURNS TRIGGER AS $$
BEGIN
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
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove from user_schools when deleted from school_teammembers
    DELETE FROM user_schools
    WHERE user_id = OLD.user_id AND school_id = OLD.school_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger on school_teammembers table
DROP TRIGGER IF EXISTS trigger_sync_teammembers_to_user_schools ON school_teammembers;
CREATE TRIGGER trigger_sync_teammembers_to_user_schools
  AFTER INSERT OR UPDATE OR DELETE ON school_teammembers
  FOR EACH ROW
  EXECUTE FUNCTION sync_teammembers_to_user_schools();

-- Step 6: Add helpful comment
COMMENT ON FUNCTION sync_user_schools_to_teammembers() IS 
  'Automatically syncs approved users from Leescoach (user_schools) to Kleuterdidactiek (school_teammembers). Only users with status=approved and is_active=true are synced.';

COMMENT ON FUNCTION sync_teammembers_to_user_schools() IS 
  'Automatically syncs users from Kleuterdidactiek (school_teammembers) to Leescoach (user_schools). All active members are synced as approved users.';
