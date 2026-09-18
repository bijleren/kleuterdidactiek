/*
  # Lesdoelen aanvullen uit de lesonderdelen

  lesson_goals werd alleen gevuld bij opslaan via het lesformulier. Een les die
  vanzelf ontstaat door een klik (een woord, een schrijfoefening, een
  doe-opdracht) kreeg wel onderdelen, maar geen doelen. Op 18 september 2026
  hadden 558 van de 605 lessen met onderdelen geen enkel opgeslagen doel,
  waardoor ze ontbraken in de lessen per doel van het minimumdoelenoverzicht.

  Deze migratie leidt de doelen af uit de onderdelen, met dezelfde regels als
  doelcodesPerLes in src/utils/lessonGoalExtractor.ts, en voegt enkel toe wat
  nog ontbreekt. Bestaande rijen blijven ongemoeid. Vanaf nu slaat
  logActivityToCalendar de doelen zelf mee op.
*/
WITH items AS (SELECT lesson_id, item_type, item_id, item_name FROM lesson_items),
codes AS (
  SELECT lesson_id, item_id AS code FROM items WHERE item_type = 'goal'
  UNION
  SELECT i.lesson_id, c FROM items i
    JOIN vocabulary_categories vc ON vc.id::text = i.item_id
    CROSS JOIN unnest(vc.goal_codes) c
    WHERE i.item_type = 'vocabulary'
  UNION
  -- Woorden: op id, en bij oudere of eigen woorden op de tekst.
  SELECT i.lesson_id, c FROM items i
    LEFT JOIN vocabulary_words w1 ON w1.id::text = i.item_id
    LEFT JOIN LATERAL (
      SELECT category_id FROM vocabulary_words w2
      WHERE w2.word = regexp_replace(i.item_name, '^Woordenschat:\s*', '', 'i')
      LIMIT 1
    ) w2 ON w1.id IS NULL
    JOIN vocabulary_categories vc ON vc.id = coalesce(w1.category_id, w2.category_id)
    CROSS JOIN unnest(vc.goal_codes) c
    WHERE i.item_type = 'vocabulary_word'
  UNION
  SELECT i.lesson_id, c FROM items i JOIN learning_games t ON t.id::text = i.item_id CROSS JOIN unnest(t.goal_codes) c WHERE i.item_type = 'quiz'
  UNION
  SELECT i.lesson_id, c FROM items i JOIN writing_exercises t ON t.id::text = i.item_id CROSS JOIN unnest(t.goal_codes) c WHERE i.item_type = 'writing'
  UNION
  SELECT i.lesson_id, c FROM items i JOIN physical_tasks t ON t.id::text = i.item_id CROSS JOIN unnest(t.goal_codes) c WHERE i.item_type = 'physical_task'
  UNION
  SELECT i.lesson_id, c FROM items i JOIN activity_presets t ON t.id::text = i.item_id CROSS JOIN unnest(t.goal_codes) c WHERE i.item_type = 'activity_preset'
  UNION
  SELECT i.lesson_id, g.goal_code FROM items i JOIN educational_video_goals g ON g.video_id::text = i.item_id WHERE i.item_type = 'video'
  UNION
  SELECT i.lesson_id, g.goal_code FROM items i JOIN educational_material_goals g ON g.material_id::text = i.item_id WHERE i.item_type = 'material'
)
INSERT INTO lesson_goals (lesson_id, goal_code, lesson_start_time, group_id)
SELECT DISTINCT c.lesson_id, c.code, l.start_time, l.group_id
FROM codes c
JOIN lessons l ON l.id = c.lesson_id
WHERE c.code IS NOT NULL AND trim(c.code) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM lesson_goals g WHERE g.lesson_id = c.lesson_id AND g.goal_code = c.code
  );
