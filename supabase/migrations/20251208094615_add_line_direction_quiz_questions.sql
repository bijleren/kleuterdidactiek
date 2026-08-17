/*
  # Add Questions for Line Recognition and Direction Quiz Games

  ## Overview
  Populates game questions for two visual perception games:
  - Lijn Herkennen (Line Recognition): 5 questions about identifying different types of lines
  - Richting Quiz (Direction Quiz): 7 questions about reading/writing direction

  ## Changes
  - Adds 5 questions for "Lijn Herkennen" game (4b50fafc-1f2d-44ee-907c-761ecbd3344d)
  - Adds 7 questions for "Richting Quiz" game (5bf25ba4-cb02-49d3-bace-5498693fabaf)
  - Each question includes visual elements (HTML/emoji), question text, correct answer, and multiple choice options
  
  ## Question Details
  
  ### Lijn Herkennen
  - Questions about identifying line types: straight, curved, wavy, vertical, diagonal
  - Visual representations using HTML/CSS line drawings
  
  ### Richting Quiz  
  - Questions about writing/reading direction (left, right, up, down)
  - Questions about recognizing letters vs numbers
  - Visual cues using emojis
*/

-- Insert questions for Lijn Herkennen game
INSERT INTO game_questions (game_id, question, visual, answer, options, sort_order) VALUES
(
  '4b50fafc-1f2d-44ee-907c-761ecbd3344d',
  'Dit is een...lijn',
  '<div style="width:100px;height:4px;background:#333;margin:2rem auto;"></div>',
  'rechte',
  ARRAY['rechte', 'gebogen', 'zigzag', 'golvende'],
  1
),
(
  '4b50fafc-1f2d-44ee-907c-761ecbd3344d',
  'Dit is een...lijn',
  '<div style="width:100px;height:50px;border:4px solid #333;border-radius:50%;border-bottom:none;margin:2rem auto;"></div>',
  'gebogen',
  ARRAY['rechte', 'gebogen', 'zigzag', 'onderbroken'],
  2
),
(
  '4b50fafc-1f2d-44ee-907c-761ecbd3344d',
  'Dit is een...lijn',
  '<div style="font-size:3rem;letter-spacing:0;">〰️〰️〰️</div>',
  'golvende',
  ARRAY['rechte', 'gebogen', 'zigzag', 'golvende'],
  3
),
(
  '4b50fafc-1f2d-44ee-907c-761ecbd3344d',
  'Dit is een...lijn',
  '<div style="width:100px;height:4px;background:#333;margin:2rem auto;transform:rotate(90deg);"></div>',
  'verticale',
  ARRAY['horizontale', 'verticale', 'diagonale', 'gebogen'],
  4
),
(
  '4b50fafc-1f2d-44ee-907c-761ecbd3344d',
  'Dit is een...lijn',
  '<div style="width:100px;height:4px;background:#333;margin:2rem auto;transform:rotate(45deg);"></div>',
  'schuine',
  ARRAY['rechte', 'verticale', 'schuine', 'gebogen'],
  5
);

-- Insert questions for Richting Quiz game
INSERT INTO game_questions (game_id, question, visual, answer, options, sort_order) VALUES
(
  '5bf25ba4-cb02-49d3-bace-5498693fabaf',
  'Welke richting gaan we bij het schrijven?',
  '➡️',
  'rechts',
  ARRAY['links', 'rechts', 'boven', 'onder'],
  1
),
(
  '5bf25ba4-cb02-49d3-bace-5498693fabaf',
  'Waar beginnen we te lezen?',
  '📖',
  'links',
  ARRAY['links', 'rechts', 'midden', 'onder'],
  2
),
(
  '5bf25ba4-cb02-49d3-bace-5498693fabaf',
  'Na een regel gaan we naar...',
  '⬇️',
  'beneden',
  ARRAY['boven', 'beneden', 'links', 'rechts'],
  3
),
(
  '5bf25ba4-cb02-49d3-bace-5498693fabaf',
  'Dit zijn...',
  'ABC',
  'letters',
  ARRAY['cijfers', 'letters', 'vormen', 'kleuren'],
  4
),
(
  '5bf25ba4-cb02-49d3-bace-5498693fabaf',
  'Dit zijn...',
  '123',
  'cijfers',
  ARRAY['cijfers', 'letters', 'vormen', 'kleuren'],
  5
),
(
  '5bf25ba4-cb02-49d3-bace-5498693fabaf',
  'We schrijven van links naar...',
  '📝',
  'rechts',
  ARRAY['links', 'rechts', 'boven', 'onder'],
  6
),
(
  '5bf25ba4-cb02-49d3-bace-5498693fabaf',
  'We lezen van boven naar...',
  '📄',
  'beneden',
  ARRAY['boven', 'beneden', 'links', 'rechts'],
  7
);
