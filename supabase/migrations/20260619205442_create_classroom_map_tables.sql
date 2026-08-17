-- Classroom maps: teacher uploads an image of their classroom
CREATE TABLE classroom_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES student_groups(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT 'Mijn Klaslokaal',
  image_url text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE classroom_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_classroom_maps" ON classroom_maps FOR SELECT
  TO authenticated
  USING (school_id IN (
    SELECT school_id FROM school_teammembers WHERE user_id = auth.uid()
  ));

CREATE POLICY "insert_classroom_maps" ON classroom_maps FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    school_id IN (SELECT school_id FROM school_teammembers WHERE user_id = auth.uid())
  );

CREATE POLICY "update_classroom_maps" ON classroom_maps FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "delete_classroom_maps" ON classroom_maps FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Hotspots: positioned zones on the classroom image linked to activity options
CREATE TABLE classroom_hotspots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid NOT NULL REFERENCES classroom_maps(id) ON DELETE CASCADE,
  activity_option_id uuid REFERENCES activity_options(id) ON DELETE SET NULL,
  label text NOT NULL,
  x_percent numeric NOT NULL CHECK (x_percent >= 0 AND x_percent <= 100),
  y_percent numeric NOT NULL CHECK (y_percent >= 0 AND y_percent <= 100),
  color text NOT NULL DEFAULT '#4ECDC4',
  max_students integer DEFAULT 4 CHECK (max_students > 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE classroom_hotspots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_classroom_hotspots" ON classroom_hotspots FOR SELECT
  TO authenticated
  USING (map_id IN (
    SELECT cm.id FROM classroom_maps cm
    JOIN school_teammembers stm ON stm.school_id = cm.school_id
    WHERE stm.user_id = auth.uid()
  ));

CREATE POLICY "insert_classroom_hotspots" ON classroom_hotspots FOR INSERT
  TO authenticated
  WITH CHECK (map_id IN (
    SELECT id FROM classroom_maps WHERE created_by = auth.uid()
  ));

CREATE POLICY "update_classroom_hotspots" ON classroom_hotspots FOR UPDATE
  TO authenticated
  USING (map_id IN (
    SELECT id FROM classroom_maps WHERE created_by = auth.uid()
  ))
  WITH CHECK (map_id IN (
    SELECT id FROM classroom_maps WHERE created_by = auth.uid()
  ));

CREATE POLICY "delete_classroom_hotspots" ON classroom_hotspots FOR DELETE
  TO authenticated
  USING (map_id IN (
    SELECT id FROM classroom_maps WHERE created_by = auth.uid()
  ));

-- Storage bucket for classroom images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'classroom-maps',
  'classroom-maps',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "classroom_maps_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'classroom-maps');

CREATE POLICY "classroom_maps_read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'classroom-maps');

CREATE POLICY "classroom_maps_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'classroom-maps' AND auth.uid()::text = (storage.foldername(name))[1]);
