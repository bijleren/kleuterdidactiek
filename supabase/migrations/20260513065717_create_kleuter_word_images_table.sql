/*
  # Create kleuter_word_images table and images_kleuter storage bucket

  ## Summary
  Introduces a flexible multi-image system for vocabulary words used in the
  kleuterschool vocabulary tracker. Images can be uploaded by admins globally
  or by individual schools. The structure is forward-compatible with custom
  vocabulary words.

  ## New Tables

  ### `kleuter_word_images`
  Stores one row per image per word. Multiple images are supported per word,
  per type, and per source (admin or school).

  Columns:
  - `id` — UUID primary key
  - `word` — the vocabulary word (matches wordfrequency.word, no FK so custom vocab works too)
  - `image_type` — category of image: 'isolated', 'context', or 'general'
  - `storage_path` — path inside the `images_kleuter` Supabase bucket
  - `label` — optional human-readable caption (nullable)
  - `source_type` — 'admin' for global images, 'school' for school-specific uploads
  - `school_id` — nullable FK to schools; NULL means the image belongs to all schools
  - `custom_vocabulary_id` — nullable FK to custom_vocabulary; for future custom word images
  - `sort_order` — integer for ordering images of the same type within the same word
  - `uploaded_by` — nullable FK to auth.users
  - `is_active` — soft-disable flag, default true
  - `created_at` — timestamp

  ## Security
  - RLS enabled; authenticated users can read all active images
  - Admin writes happen via service role (bypasses RLS)
  - School-scoped insert/update prepared for future use

  ## Notes
  - The `images_kleuter` storage bucket must be created as a PUBLIC bucket
    so that `getPublicUrl()` works without signed URLs
  - Storage path convention for admin: words/{word}/{type}_{uuid}.{ext}
  - Storage path convention for schools: schools/{school_id}/words/{word}/{type}_{uuid}.{ext}
*/

CREATE TABLE IF NOT EXISTS kleuter_word_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  word text NOT NULL,
  image_type text NOT NULL DEFAULT 'general',
  storage_path text NOT NULL,
  label text,
  source_type text NOT NULL DEFAULT 'admin',
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  custom_vocabulary_id uuid REFERENCES custom_vocabulary(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,

  CONSTRAINT kleuter_word_images_image_type_check
    CHECK (image_type IN ('isolated', 'context', 'general')),
  CONSTRAINT kleuter_word_images_source_type_check
    CHECK (source_type IN ('admin', 'school'))
);

-- Indexes for the primary query pattern: look up images by word
CREATE INDEX IF NOT EXISTS kleuter_word_images_word_idx
  ON kleuter_word_images (word);

CREATE INDEX IF NOT EXISTS kleuter_word_images_word_type_idx
  ON kleuter_word_images (word, image_type);

CREATE INDEX IF NOT EXISTS kleuter_word_images_school_idx
  ON kleuter_word_images (school_id);

CREATE INDEX IF NOT EXISTS kleuter_word_images_custom_vocab_idx
  ON kleuter_word_images (custom_vocabulary_id);

CREATE INDEX IF NOT EXISTS kleuter_word_images_active_idx
  ON kleuter_word_images (word, is_active);

ALTER TABLE kleuter_word_images ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all active images (both admin and school-specific)
CREATE POLICY "Authenticated users can view active word images"
  ON kleuter_word_images FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Schools can insert their own images
CREATE POLICY "Schools can insert their own word images"
  ON kleuter_word_images FOR INSERT
  TO authenticated
  WITH CHECK (
    source_type = 'school'
    AND school_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM user_schools
      WHERE user_schools.school_id = kleuter_word_images.school_id
        AND user_schools.user_id = auth.uid()
    )
  );

-- Schools can update their own images
CREATE POLICY "Schools can update their own word images"
  ON kleuter_word_images FOR UPDATE
  TO authenticated
  USING (
    source_type = 'school'
    AND school_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM user_schools
      WHERE user_schools.school_id = kleuter_word_images.school_id
        AND user_schools.user_id = auth.uid()
    )
  )
  WITH CHECK (
    source_type = 'school'
    AND school_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM user_schools
      WHERE user_schools.school_id = kleuter_word_images.school_id
        AND user_schools.user_id = auth.uid()
    )
  );

-- Schools can delete their own images
CREATE POLICY "Schools can delete their own word images"
  ON kleuter_word_images FOR DELETE
  TO authenticated
  USING (
    source_type = 'school'
    AND school_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM user_schools
      WHERE user_schools.school_id = kleuter_word_images.school_id
        AND user_schools.user_id = auth.uid()
    )
  );
