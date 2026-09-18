/*
  # Thema als lesonderdeel

  Een leerkracht kon in de planner woorden, video's en materialen aan een les
  hangen, maar geen thema. Wie een week rond "Herfst" werkt, moest de woorden
  van dat thema één voor één toevoegen.

  lesson_items.item_type krijgt de waarde 'thema', met het id uit themas. De
  doelen van zo'n onderdeel volgen uit de woorden, materialen en video's van
  het thema; zie doelcodesPerLes in src/utils/lessonGoalExtractor.ts.
*/
DO $$
DECLARE
  naam text;
BEGIN
  SELECT conname INTO naam
  FROM pg_constraint
  WHERE conrelid = 'public.lesson_items'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%item_type%';

  IF naam IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.lesson_items DROP CONSTRAINT %I', naam);
  END IF;
END $$;

ALTER TABLE public.lesson_items
  ADD CONSTRAINT lesson_items_item_type_check
  CHECK (item_type = ANY (ARRAY[
    'vocabulary', 'vocabulary_word', 'quiz', 'game', 'writing', 'physical_task',
    'video', 'material', 'activity_preset', 'goal', 'thema'
  ]));
