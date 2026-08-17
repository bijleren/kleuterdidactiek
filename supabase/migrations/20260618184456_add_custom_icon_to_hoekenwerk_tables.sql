-- Add custom_icon_id FK to activity_presets, activity_options, and activity_boards
ALTER TABLE activity_presets
  ADD COLUMN IF NOT EXISTS custom_icon_id uuid REFERENCES school_hoekenwerk_icons(id) ON DELETE SET NULL;

ALTER TABLE activity_options
  ADD COLUMN IF NOT EXISTS custom_icon_id uuid REFERENCES school_hoekenwerk_icons(id) ON DELETE SET NULL;

ALTER TABLE activity_boards
  ADD COLUMN IF NOT EXISTS custom_icon_id uuid REFERENCES school_hoekenwerk_icons(id) ON DELETE SET NULL;
