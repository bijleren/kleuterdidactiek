/*
  # Eigen doe-opdrachten per school of klas

  physical_tasks bevatte tot nu alleen platformopdrachten: iedereen mocht lezen,
  alleen een platformbeheerder mocht schrijven. Scholen willen ook hun eigen
  doe-opdrachten kwijt. Zelfde opzet als bij themas: één tabel, met een
  school_id dat leeg blijft voor de opdrachten van het platform.

  1. Nieuwe kolommen
    - `school_id` leeg = platformopdracht, gevuld = opdracht van die school
    - `group_id` optioneel: gevuld betekent alleen die klas
    - `created_by` wie de opdracht maakte

  2. Beveiliging
    - Lezen: platformopdrachten plus die van je eigen school. Dit vervangt het
      oude "iedereen leest alles": zonder die wijziging zagen scholen elkaars
      eigen opdrachten.
    - Schrijven: teamleden beheren de opdrachten van hun eigen school,
      platformbeheerders die van het platform. Niemand komt aan de andere kant.
*/

ALTER TABLE physical_tasks
  ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_physical_tasks_school ON physical_tasks (school_id) WHERE school_id IS NOT NULL;

-- Een klas zonder school kan niet: dan is niet te bepalen wie de opdracht mag zien.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'physical_tasks_klas_hoort_bij_school') THEN
    ALTER TABLE physical_tasks
      ADD CONSTRAINT physical_tasks_klas_hoort_bij_school
      CHECK (group_id IS NULL OR school_id IS NOT NULL);
  END IF;
END $$;

DROP POLICY IF EXISTS "Authenticated can read physical_tasks" ON physical_tasks;

CREATE POLICY "Lezen: platformopdrachten en eigen school"
  ON physical_tasks
  FOR SELECT
  TO authenticated
  USING (
    school_id IS NULL
    OR EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = physical_tasks.school_id
      AND school_teammembers.user_id = auth.uid()
    )
  );

CREATE POLICY "Teamleden maken doe-opdrachten voor hun school"
  ON physical_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    school_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = physical_tasks.school_id
      AND school_teammembers.user_id = auth.uid()
    )
  );

CREATE POLICY "Teamleden passen doe-opdrachten van hun school aan"
  ON physical_tasks
  FOR UPDATE
  TO authenticated
  USING (
    school_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = physical_tasks.school_id
      AND school_teammembers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    school_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = physical_tasks.school_id
      AND school_teammembers.user_id = auth.uid()
    )
  );

CREATE POLICY "Teamleden verwijderen doe-opdrachten van hun school"
  ON physical_tasks
  FOR DELETE
  TO authenticated
  USING (
    school_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM school_teammembers
      WHERE school_teammembers.school_id = physical_tasks.school_id
      AND school_teammembers.user_id = auth.uid()
    )
  );
