
-- Add image_url column to evaluations
ALTER TABLE student_goal_evaluations
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for observation images (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'observation-images',
  'observation-images',
  true,
  10485760,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload observation images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'observation-images');

-- Allow authenticated users to update their own uploads
CREATE POLICY "Authenticated users can update own observation images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'observation-images' AND auth.uid() = owner);

-- Public can read all observation images (so Excel links work for anyone with the URL)
CREATE POLICY "Public can read observation images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'observation-images');

-- Authenticated users can delete their own uploads
CREATE POLICY "Authenticated users can delete own observation images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'observation-images' AND auth.uid() = owner);
