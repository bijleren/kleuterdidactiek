/*
  # Storage policies for images_kleuter bucket

  Allow public read and authenticated upload to the images_kleuter bucket.
*/

-- Public read access (so getPublicUrl() works without signed URLs)
CREATE POLICY "Public read images_kleuter"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images_kleuter');

-- Admin and school users can upload
CREATE POLICY "Authenticated upload images_kleuter"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images_kleuter');

-- Authenticated users can update their uploads
CREATE POLICY "Authenticated update images_kleuter"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'images_kleuter');

-- Authenticated users can delete their uploads
CREATE POLICY "Authenticated delete images_kleuter"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'images_kleuter');
