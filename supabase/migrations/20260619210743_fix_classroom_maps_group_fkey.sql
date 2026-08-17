ALTER TABLE classroom_maps
  DROP CONSTRAINT IF EXISTS classroom_maps_group_id_fkey;

ALTER TABLE classroom_maps
  ADD CONSTRAINT classroom_maps_group_id_fkey
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;
