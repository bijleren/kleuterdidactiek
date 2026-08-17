/*
# Add direct URL support to video-vocabulary links

## Summary
Currently, a vocabulary word can only be linked to a video that exists in the
`educational_videos` catalogue. This migration adds the ability to link a word
directly to a YouTube or Vimeo URL without requiring a catalogue entry.

## Changes
### Modified Table: educational_video_vocabulary
- `video_id` is now nullable (was NOT NULL). When null, the link is a direct URL.
- New column `direct_url` (text, nullable) — the YouTube/Vimeo URL.
- New column `direct_title` (text, nullable) — optional display title for the direct link.
- New CHECK constraint: at least one of `video_id` or `direct_url` must be set.
- Updated unique constraint: replaced UNIQUE(video_id, word) with a new constraint
  that allows both catalogue links and direct-URL links per word without collision.

## Security
- RLS policies unchanged: admins can insert/update/delete, all authenticated users can read.

## Notes
1. Existing catalogue-based links continue to work unchanged.
2. Direct-URL links have video_id = null, so they are independent of the video catalogue.
3. The CHECK constraint ensures every row has either a catalogue video or a direct URL.
4. Idempotent: uses IF NOT EXISTS / DO $$ blocks for safe re-runs.
*/

-- Make video_id nullable so direct-URL links can exist without a catalogue video
ALTER TABLE educational_video_vocabulary
  ALTER COLUMN video_id DROP NOT NULL;

-- Add direct_url and direct_title columns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'educational_video_vocabulary' AND column_name = 'direct_url'
  ) THEN
    ALTER TABLE educational_video_vocabulary ADD COLUMN direct_url text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'educational_video_vocabulary' AND column_name = 'direct_title'
  ) THEN
    ALTER TABLE educational_video_vocabulary ADD COLUMN direct_title text;
  END IF;
END $$;

-- Ensure at least one of video_id or direct_url is set
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'video_or_direct_url_required'
  ) THEN
    ALTER TABLE educational_video_vocabulary
      ADD CONSTRAINT video_or_direct_url_required
      CHECK (video_id IS NOT NULL OR direct_url IS NOT NULL);
  END IF;
END $$;

-- Replace the unique constraint to allow direct-URL links per word
-- Drop old constraint if it exists, then add a new one that covers both link types
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'educational_video_vocabulary_video_id_word_key'
  ) THEN
    ALTER TABLE educational_video_vocabulary
      DROP CONSTRAINT educational_video_vocabulary_video_id_word_key;
  END IF;
END $$;

-- New unique constraint: prevents duplicate catalogue links AND duplicate direct-URL links per word
-- Uses COALESCE so that null video_id values are treated as distinct (allowing multiple direct URLs per word)
-- but the same catalogue video can't be linked twice to the same word
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_video_word_link'
  ) THEN
    ALTER TABLE educational_video_vocabulary
      ADD CONSTRAINT unique_video_word_link UNIQUE (video_id, direct_url, word);
  END IF;
END $$;

-- Add index for direct_url lookups
CREATE INDEX IF NOT EXISTS idx_educational_video_vocabulary_direct_url
  ON educational_video_vocabulary(direct_url);
