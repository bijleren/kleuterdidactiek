-- Create public storage bucket for hoekenwerk icons
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hoekenwerk_icons',
  'hoekenwerk_icons',
  true,
  524288, -- 512 KB max (already cropped to 128x128 WebP before upload)
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Public read hoekenwerk_icons"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hoekenwerk_icons');

-- Authenticated users can upload
CREATE POLICY "Authenticated upload hoekenwerk_icons"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'hoekenwerk_icons');

-- Authenticated users can update their uploads
CREATE POLICY "Authenticated update hoekenwerk_icons"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'hoekenwerk_icons');

-- Authenticated users can delete their uploads
CREATE POLICY "Authenticated delete hoekenwerk_icons"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'hoekenwerk_icons');

-- Metadata table for icons uploaded per school
CREATE TABLE school_hoekenwerk_icons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  original_name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE school_hoekenwerk_icons ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_school_hoekenwerk_icons_school ON school_hoekenwerk_icons(school_id);

-- Any team member of the school can read icons
CREATE POLICY "select_school_hoekenwerk_icons" ON school_hoekenwerk_icons FOR SELECT
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM school_teammembers
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Authenticated users can insert icons for their school
CREATE POLICY "insert_school_hoekenwerk_icons" ON school_hoekenwerk_icons FOR INSERT
  TO authenticated
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM school_teammembers
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Only the uploader can delete their own icon
CREATE POLICY "delete_school_hoekenwerk_icons" ON school_hoekenwerk_icons FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());
