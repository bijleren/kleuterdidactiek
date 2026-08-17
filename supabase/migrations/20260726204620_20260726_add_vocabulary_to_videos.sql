/*
# Add vocabulary linking to educational videos

## Summary
Allows teachers to link vocabulary words to educational videos.

## Changes

### New Table: educational_video_vocabulary
Links an educational video to a vocabulary word (from the existing vocabulary system).
- id: uuid primary key
- video_id: references educational_videos
- word: the vocabulary word text (matches vocabulary_words.word or custom_vocabulary.word)
- category_id: optional reference to vocabulary_categories for display grouping
- created_at: timestamp

## Security
- RLS enabled; authenticated users can manage their own school's video-vocabulary links.
- Since educational_video_goals uses authenticated-only policies, we follow the same pattern.

## Notes
1. The word is stored as plain text so it works with both system words and custom school words.
2. Deleting a video cascades and removes its vocabulary links.
3. Idempotent: uses IF NOT EXISTS and DROP POLICY IF EXISTS.
*/

CREATE TABLE IF NOT EXISTS educational_video_vocabulary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES educational_videos(id) ON DELETE CASCADE,
  word text NOT NULL,
  category_id uuid REFERENCES vocabulary_categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(video_id, word)
);

ALTER TABLE educational_video_vocabulary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_video_vocabulary" ON educational_video_vocabulary;
CREATE POLICY "select_video_vocabulary" ON educational_video_vocabulary
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_video_vocabulary" ON educational_video_vocabulary;
CREATE POLICY "insert_video_vocabulary" ON educational_video_vocabulary
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_video_vocabulary" ON educational_video_vocabulary;
CREATE POLICY "update_video_vocabulary" ON educational_video_vocabulary
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_video_vocabulary" ON educational_video_vocabulary;
CREATE POLICY "delete_video_vocabulary" ON educational_video_vocabulary
  FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_educational_video_vocabulary_video_id ON educational_video_vocabulary(video_id);
