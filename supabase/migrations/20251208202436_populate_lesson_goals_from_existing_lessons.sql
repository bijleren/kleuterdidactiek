/*
  # Populate lesson_goals from existing lessons

  1. Purpose
    - Backfill the lesson_goals table with data from existing lessons
    - Extract goal codes from all lesson items and populate relationships
    - Ensures historical lesson data is available in the new optimized structure

  2. Process
    - For each existing lesson with items, extract goal codes
    - Handle vocabulary categories, vocabulary words, videos, materials, quizzes, etc.
    - Insert computed relationships into lesson_goals table

  3. Notes
    - This is a one-time migration for existing data
    - Future lessons will automatically populate lesson_goals when saved
    - Safe to run multiple times (uses INSERT with conflict handling)
*/

DO $$
DECLARE
  lesson_record RECORD;
  item_record RECORD;
  goal_code_text TEXT;
  goal_codes_array TEXT[];
  vocab_category_id UUID;
BEGIN
  FOR lesson_record IN 
    SELECT l.id, l.start_time, l.group_id
    FROM lessons l
    WHERE EXISTS (SELECT 1 FROM lesson_items WHERE lesson_id = l.id)
  LOOP
    goal_codes_array := ARRAY[]::TEXT[];

    FOR item_record IN 
      SELECT * FROM lesson_items WHERE lesson_id = lesson_record.id
    LOOP
      IF item_record.item_type = 'goal' THEN
        goal_codes_array := array_append(goal_codes_array, item_record.item_id);
      
      ELSIF item_record.item_type = 'vocabulary' THEN
        SELECT goal_codes INTO goal_codes_array
        FROM vocabulary_categories
        WHERE id = item_record.item_id::uuid;
        
      ELSIF item_record.item_type = 'vocabulary_word' THEN
        SELECT category_id INTO vocab_category_id
        FROM vocabulary_words
        WHERE id = item_record.item_id::uuid;
        
        IF vocab_category_id IS NOT NULL THEN
          SELECT goal_codes INTO goal_codes_array
          FROM vocabulary_categories
          WHERE id = vocab_category_id;
        END IF;
      
      ELSIF item_record.item_type = 'quiz' THEN
        SELECT goal_codes INTO goal_codes_array
        FROM learning_games
        WHERE id = item_record.item_id::uuid;
      
      ELSIF item_record.item_type = 'writing' THEN
        SELECT goal_codes INTO goal_codes_array
        FROM writing_exercises
        WHERE id = item_record.item_id::uuid;
      
      ELSIF item_record.item_type = 'physical_task' THEN
        SELECT goal_codes INTO goal_codes_array
        FROM physical_tasks
        WHERE id = item_record.item_id::uuid;
      
      ELSIF item_record.item_type = 'video' THEN
        FOR goal_code_text IN 
          SELECT goal_code FROM educational_video_goals WHERE video_id = item_record.item_id::uuid
        LOOP
          goal_codes_array := array_append(goal_codes_array, goal_code_text);
        END LOOP;
      
      ELSIF item_record.item_type = 'material' THEN
        FOR goal_code_text IN 
          SELECT goal_code FROM educational_material_goals WHERE material_id = item_record.item_id::uuid
        LOOP
          goal_codes_array := array_append(goal_codes_array, goal_code_text);
        END LOOP;
      END IF;
    END LOOP;

    IF array_length(goal_codes_array, 1) > 0 THEN
      FOREACH goal_code_text IN ARRAY goal_codes_array
      LOOP
        IF goal_code_text IS NOT NULL AND trim(goal_code_text) != '' THEN
          INSERT INTO lesson_goals (lesson_id, goal_code, lesson_start_time, group_id)
          VALUES (lesson_record.id, goal_code_text, lesson_record.start_time, lesson_record.group_id)
          ON CONFLICT DO NOTHING;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END $$;