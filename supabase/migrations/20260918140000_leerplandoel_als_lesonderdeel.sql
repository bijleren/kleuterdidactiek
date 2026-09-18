/*
  # Leerplandoel als lesonderdeel

  In het lesformulier kon een leerkracht extra minimumdoelen toevoegen, maar
  geen leerplandoelen van het eigen net. Wie volgens het leerplan werkt, moest
  zijn doel dus vertalen naar het officiële minimumdoel.

  lesson_items.item_type krijgt de waarde 'leerplandoel', met het id uit
  leerplandoelen. Zo'n onderdeel telt voor de minimumdoelen waaraan het
  leerplandoel gekoppeld is; zie doelcodesPerLes in
  src/utils/lessonGoalExtractor.ts.
*/
ALTER TABLE public.lesson_items DROP CONSTRAINT IF EXISTS lesson_items_item_type_check;

ALTER TABLE public.lesson_items
  ADD CONSTRAINT lesson_items_item_type_check
  CHECK (item_type = ANY (ARRAY[
    'vocabulary', 'vocabulary_word', 'quiz', 'game', 'writing', 'physical_task',
    'video', 'material', 'activity_preset', 'goal', 'thema', 'leerplandoel'
  ]));
