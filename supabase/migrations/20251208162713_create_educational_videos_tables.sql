/*
  # Create Educational Videos Management Tables

  ## Overview
  Creates tables for managing educational videos linked to learning goals.
  System admins can create global videos visible to all, regular users create school-specific videos.

  ## New Tables
  
  ### `educational_videos`
  - Video metadata, URL, ownership (global or school-specific)
  
  ### `educational_video_goals`
  - Links videos to kleuterdoelen goals
  
  ### `educational_video_sessions`
  - Tracks when videos are used in lessons

  ## Security
  - RLS enabled on all tables
  - Global videos readable by all authenticated users
  - School videos readable by school members only
  - Only system admins (super_admins table) can create global videos
*/

CREATE TABLE IF NOT EXISTS educational_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  url text NOT NULL,
  thumbnail_url text,
  duration_minutes integer,
  is_global boolean DEFAULT false,
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT educational_videos_school_check CHECK (
    (is_global = true AND school_id IS NULL) OR
    (is_global = false AND school_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS educational_video_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES educational_videos(id) ON DELETE CASCADE NOT NULL,
  goal_code text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(video_id, goal_code)
);

CREATE TABLE IF NOT EXISTS educational_video_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES educational_videos(id) ON DELETE CASCADE NOT NULL,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS educational_videos_school_id_idx ON educational_videos(school_id);
CREATE INDEX IF NOT EXISTS educational_videos_is_global_idx ON educational_videos(is_global);
CREATE INDEX IF NOT EXISTS educational_video_goals_video_id_idx ON educational_video_goals(video_id);
CREATE INDEX IF NOT EXISTS educational_video_goals_goal_code_idx ON educational_video_goals(goal_code);
CREATE INDEX IF NOT EXISTS educational_video_sessions_video_id_idx ON educational_video_sessions(video_id);
CREATE INDEX IF NOT EXISTS educational_video_sessions_group_id_idx ON educational_video_sessions(group_id);

ALTER TABLE educational_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE educational_video_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE educational_video_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view global videos"
  ON educational_videos FOR SELECT
  TO authenticated
  USING (is_global = true);

CREATE POLICY "Users can view their school's videos"
  ON educational_videos FOR SELECT
  TO authenticated
  USING (
    is_global = false
    AND school_id IN (
      SELECT school_id FROM school_teammembers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System admins can create global videos"
  ON educational_videos FOR INSERT
  TO authenticated
  WITH CHECK (
    is_global = true
    AND EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create school videos"
  ON educational_videos FOR INSERT
  TO authenticated
  WITH CHECK (
    is_global = false
    AND school_id IN (
      SELECT school_id FROM school_teammembers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System admins can update global videos"
  ON educational_videos FOR UPDATE
  TO authenticated
  USING (
    is_global = true
    AND EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their school's videos"
  ON educational_videos FOR UPDATE
  TO authenticated
  USING (
    is_global = false
    AND school_id IN (
      SELECT school_id FROM school_teammembers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System admins can delete global videos"
  ON educational_videos FOR DELETE
  TO authenticated
  USING (
    is_global = true
    AND EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their school's videos"
  ON educational_videos FOR DELETE
  TO authenticated
  USING (
    is_global = false
    AND school_id IN (
      SELECT school_id FROM school_teammembers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view video goals"
  ON educational_video_goals FOR SELECT
  TO authenticated
  USING (
    video_id IN (
      SELECT id FROM educational_videos
      WHERE is_global = true
      OR school_id IN (
        SELECT school_id FROM school_teammembers
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage video goals for accessible videos"
  ON educational_video_goals FOR INSERT
  TO authenticated
  WITH CHECK (
    video_id IN (
      SELECT id FROM educational_videos
      WHERE (
        is_global = true
        AND EXISTS (
          SELECT 1 FROM super_admins
          WHERE user_id = auth.uid()
        )
      )
      OR (
        is_global = false
        AND school_id IN (
          SELECT school_id FROM school_teammembers
          WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can delete video goals for accessible videos"
  ON educational_video_goals FOR DELETE
  TO authenticated
  USING (
    video_id IN (
      SELECT id FROM educational_videos
      WHERE (
        is_global = true
        AND EXISTS (
          SELECT 1 FROM super_admins
          WHERE user_id = auth.uid()
        )
      )
      OR (
        is_global = false
        AND school_id IN (
          SELECT school_id FROM school_teammembers
          WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can view video sessions for their schools"
  ON educational_video_sessions FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT id FROM groups
      WHERE school_id IN (
        SELECT school_id FROM school_teammembers
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create video sessions for their schools"
  ON educational_video_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    group_id IN (
      SELECT id FROM groups
      WHERE school_id IN (
        SELECT school_id FROM school_teammembers
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own video sessions"
  ON educational_video_sessions FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own video sessions"
  ON educational_video_sessions FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());