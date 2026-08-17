/*
# Add custom_icon_id to hoekenwerk_templates

Adds the same custom icon support that activity_presets, activity_options, and activity_boards
already have. Teachers can now upload a photo from the school_hoekenwerk_icons bucket
and use it as the template icon instead of a Lucide icon.

## Modified Tables
- `hoekenwerk_templates`: new nullable column `custom_icon_id` (FK to school_hoekenwerk_icons, SET NULL on delete)
*/

ALTER TABLE hoekenwerk_templates
  ADD COLUMN IF NOT EXISTS custom_icon_id uuid REFERENCES school_hoekenwerk_icons(id) ON DELETE SET NULL;
