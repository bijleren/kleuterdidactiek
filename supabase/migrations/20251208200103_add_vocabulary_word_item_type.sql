/*
  # Add vocabulary_word to valid item types

  1. Changes
    - Drop existing check constraint on lesson_items.item_type
    - Add new check constraint that includes 'vocabulary_word' type
    - This allows lessons to include individual vocabulary words
*/

ALTER TABLE lesson_items DROP CONSTRAINT IF EXISTS valid_item_type;

ALTER TABLE lesson_items ADD CONSTRAINT valid_item_type 
  CHECK (item_type = ANY (ARRAY[
    'vocabulary'::text, 
    'vocabulary_word'::text, 
    'quiz'::text,
    'game'::text, 
    'writing'::text, 
    'physical_task'::text, 
    'video'::text, 
    'material'::text, 
    'goal'::text
  ]));
