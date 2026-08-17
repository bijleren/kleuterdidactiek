/*
  # Add ISBN field to educational materials

  ## Changes
  - Add `isbn` column to `educational_materials` table for book ISBN numbers
  - Field is optional and only relevant for books
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'educational_materials' AND column_name = 'isbn'
  ) THEN
    ALTER TABLE educational_materials ADD COLUMN isbn text;
  END IF;
END $$;