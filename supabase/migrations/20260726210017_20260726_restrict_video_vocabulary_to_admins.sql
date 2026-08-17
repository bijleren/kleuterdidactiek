/*
# Restrict educational video vocabulary links to admin users

## Summary
Tightens the RLS policies on `educational_video_vocabulary` so that only
admin-role users (school team members with role = 'admin') can create,
update, or delete video-word links. All authenticated users can still
read the links (so teachers and students can see which videos belong to
a word). This matches the existing admin-role pattern used across the
codebase (e.g. routines admin permissions).

## Changes
- Drops the existing permissive INSERT / UPDATE / DELETE policies.
- Creates new INSERT / UPDATE / DELETE policies that check the current
  user is an admin in at least one school team (`school_teammembers.role = 'admin'`).
- SELECT policy remains open to all authenticated users.

## Security
- SELECT: any authenticated user can read video-word links.
- INSERT / UPDATE / DELETE: only users who are an admin in a school team.
*/

DROP POLICY IF EXISTS "insert_video_vocabulary" ON educational_video_vocabulary;
CREATE POLICY "insert_video_vocabulary" ON educational_video_vocabulary
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM school_teammembers st
      WHERE st.user_id = auth.uid() AND st.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "update_video_vocabulary" ON educational_video_vocabulary;
CREATE POLICY "update_video_vocabulary" ON educational_video_vocabulary
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM school_teammembers st
      WHERE st.user_id = auth.uid() AND st.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM school_teammembers st
      WHERE st.user_id = auth.uid() AND st.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "delete_video_vocabulary" ON educational_video_vocabulary;
CREATE POLICY "delete_video_vocabulary" ON educational_video_vocabulary
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM school_teammembers st
      WHERE st.user_id = auth.uid() AND st.role = 'admin'
    )
  );
