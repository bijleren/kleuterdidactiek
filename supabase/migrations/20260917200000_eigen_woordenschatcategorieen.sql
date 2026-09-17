/*
  # Eigen woordenschatcategorieën per school

  De categorieën in vocabulary_categories zijn systeemgegevens: leerkrachten
  mogen ze niet wijzigen (RLS staat op false). Een school die rond een eigen
  thema werkt, kon daardoor wel eigen woorden toevoegen, maar alleen binnen een
  bestaande categorie. Deze migratie voegt een tweede laag toe.

  1. Nieuwe tabel
    - `custom_vocabulary_categories`
      - hoort altijd bij een school
      - `group_id` is optioneel: leeg betekent de hele school, gevuld betekent
        alleen die klas. Zo kan een thema van één klas uit de lijst van de
        collega's blijven.
      - zachte verwijdering, net als custom_vocabulary, zodat er niets
        verdwijnt zolang er nog woorden aan hangen

  2. Wijziging custom_vocabulary
    - `category_id` mag nu leeg zijn en er komt `custom_category_id` bij.
      Een woord hangt aan precies één van de twee: een systeemcategorie of een
      eigen categorie van de school.

  3. Beveiliging
    - Elk teamlid van de school mag categorieën van die school lezen, aanmaken
      en verwijderen; buiten de school is er geen toegang.
*/

CREATE TABLE IF NOT EXISTS custom_vocabulary_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  -- Leeg = voor de hele school, gevuld = alleen voor deze klas.
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '📚',
  goal_codes text[] NOT NULL DEFAULT '{}',
  color_code text NOT NULL DEFAULT '#9CA3AF',
  is_deleted boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

/*
  Twee keer dezelfde naam binnen een school is verwarrend, maar een verwijderde
  naam mag opnieuw gebruikt worden. Daarom een deelindex op de actieve rijen.
  coalesce() omdat NULL in een index nooit gelijk is aan NULL: zonder dat zou
  dezelfde naam voor de hele school meerdere keren kunnen bestaan.
*/
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_vocabulary_categories_naam
  ON custom_vocabulary_categories (school_id, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name))
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_custom_vocabulary_categories_school
  ON custom_vocabulary_categories (school_id) WHERE is_deleted = false;

ALTER TABLE custom_vocabulary_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teamleden zien de eigen categorieën van hun school"
  ON custom_vocabulary_categories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = custom_vocabulary_categories.school_id
      AND school_teammembers.user_id = auth.uid()
    )
  );

CREATE POLICY "Teamleden maken eigen categorieën voor hun school"
  ON custom_vocabulary_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = custom_vocabulary_categories.school_id
      AND school_teammembers.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Teamleden verwijderen eigen categorieën van hun school"
  ON custom_vocabulary_categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = custom_vocabulary_categories.school_id
      AND school_teammembers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = custom_vocabulary_categories.school_id
      AND school_teammembers.user_id = auth.uid()
    )
  );

-- Een woord hangt voortaan aan een systeemcategorie óf aan een eigen categorie.
ALTER TABLE custom_vocabulary
  ALTER COLUMN category_id DROP NOT NULL;

ALTER TABLE custom_vocabulary
  ADD COLUMN IF NOT EXISTS custom_category_id uuid
  REFERENCES custom_vocabulary_categories(id) ON DELETE RESTRICT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'custom_vocabulary_een_categorie'
  ) THEN
    ALTER TABLE custom_vocabulary
      ADD CONSTRAINT custom_vocabulary_een_categorie
      CHECK (num_nonnulls(category_id, custom_category_id) = 1);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_custom_vocabulary_custom_category
  ON custom_vocabulary (custom_category_id) WHERE is_deleted = false;
