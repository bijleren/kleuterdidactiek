/*
  # Remove Duplicate Indexes

  ## Overview
  This migration removes duplicate indexes that waste storage space and slow down write operations.

  ## Changes Made
  1. **activity_sessions table**
     - Removing duplicate index `idx_activity_sessions_activity_option_id`
     - Keeping `idx_activity_sessions_option_id` as the primary index for the activity_option_id column

  ## Impact
  - Reduces index maintenance overhead on INSERT/UPDATE/DELETE operations
  - Frees up storage space
  - No impact on query performance (keeping one index for the column)
*/

-- Remove duplicate index on activity_sessions.activity_option_id
-- Keep idx_activity_sessions_option_id, drop idx_activity_sessions_activity_option_id
DROP INDEX IF EXISTS idx_activity_sessions_activity_option_id;
