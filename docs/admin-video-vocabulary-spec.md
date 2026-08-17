# Admin Specification: Video-Word Link Management

This document describes the admin pages for managing the global educational video library and its vocabulary (woordenschat) connections. Only admin-role users can manage video-word links; teachers cannot.

## Database

Links are stored in the existing `educational_video_vocabulary` table:
- `id` (uuid, primary key)
- `video_id` (uuid, references `educational_videos`)
- `word` (text, the vocabulary word)
- `category_id` (uuid, optional, references `vocabulary_categories`)
- `created_at` (timestamp)
- Unique constraint on `(video_id, word)` prevents duplicates.

Multiple videos can be linked to the same word (one row per pair). A single video can be linked to many words.

### RLS Policies (already applied)

- **SELECT**: any authenticated user can read video-word links (so teachers and students see which videos belong to a word).
- **INSERT / UPDATE / DELETE**: only users who are an admin in a school team (`school_teammembers.role = 'admin'`) can create, update, or delete links.

## Admin Pages

### 1. Video Library List

A table of all global (`is_global = true`) videos:
- Columns: title, URL, duration, linked goal count, linked vocab word count.
- Search by title.
- Filter by vocabulary category (using `category_id` on the link table).
- Click a row to open the edit form.

### 2. Add / Edit Global Video Form

Fields:
- **Title** (text, required)
- **Description** (textarea, optional)
- **URL** (text, required) - accepts YouTube or Vimeo URLs. The app detects the provider automatically.
- **Duration** (text or number, optional)
- **Goal picker** - same multi-select picker teachers see, linking `lesson_goals` to the video.
- **Vocabulary picker** - search by word text, filter by category. Selected words appear as removable chips. Saving writes one row per word into `educational_video_vocabulary` with the video_id, word text, and category_id.
- **Bulk category linking** - an action to link all words in a vocabulary category to the video in one step. Useful when a video supports an entire theme (e.g. all "Dieren" words).

### 3. Per-Word Reverse View

A page listing each vocabulary word with the videos linked to it:
- Columns: word, category, linked video titles.
- Filter to show only words with no linked video (so admins can spot gaps).
- Click a word to jump to the video library filtered to that word.

## Direct URL Links

In addition to linking catalogue videos, admins can link a word directly to a YouTube or Vimeo URL without creating a catalogue entry. This is done from the Betekenis modal in the vocabulary tracker:

- The admin sees a "Video toevoegen (directe link)" form at the bottom of the meaning modal.
- They paste a YouTube or Vimeo URL and an optional title.
- The link is saved to `educational_video_vocabulary` with `video_id = null`, `direct_url`, and `direct_title` set.
- The video appears alongside catalogue videos in the meaning modal for all users.

### Database support

The `educational_video_vocabulary` table has:
- `video_id` (nullable) — set when linking to a catalogue video.
- `direct_url` (text, nullable) — set when linking a direct YouTube/Vimeo URL.
- `direct_title` (text, nullable) — optional display title for direct links.
- CHECK constraint: at least one of `video_id` or `direct_url` must be set.

## Permissions

- Admin pages write rows into `educational_video_vocabulary` with `is_global = true` and `school_id = null` on the video.
- The RLS policies restrict writes to admin-role users only.
- Regular teachers see the linked videos in the Betekenis modal and video screens, but cannot add, edit, or remove links.

## Video Embedding

The app supports both YouTube and Vimeo embedding via the shared `getVideoEmbed` helper (`src/utils/videoEmbed.ts`). The helper:
- Detects YouTube URLs (watch, youtu.be, embed) and returns the embed URL + thumbnail.
- Detects Vimeo URLs (player.vimeo.com, vimeo.com/<id>) and returns the embed URL.
- Returns `type: 'unknown'` for unsupported URLs, falling back to an "Open Video" link.
