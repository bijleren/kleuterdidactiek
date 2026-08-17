/*
  # Fix Domain 8 Sort Order

  1. Changes
    - Updates sort_order for domain 8 goals to follow the same pattern as other domains
    - Changes from 81-94 to 80101-80114 to maintain proper numerical ordering
    - Ensures domain 8 goals appear in correct position (after domain 7, before domain 9)
*/

UPDATE educational_goals 
SET sort_order = 80000 + sort_order
WHERE domain = '8' AND sort_order < 1000;