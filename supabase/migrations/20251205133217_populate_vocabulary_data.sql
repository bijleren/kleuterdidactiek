/*
  # Populate Vocabulary Data
  
  ## Overview
  Populates vocabulary categories and words from the kleuterdoelen HTML file.
  Includes all vocabulary categories with their associated educational goal codes.
  
  ## Data Structure
  - Categories are organized by type (location, nature, geography, weather, time, body)
  - Each category contains words with specific goal code mappings
  - Goal codes reference Flemish educational standards (kleuterdoelen)
*/

-- Insert vocabulary categories
INSERT INTO vocabulary_categories (name, emoji, goal_codes, goal_description, category_type, sort_order) VALUES
  ('Positie & Richting', '📍', ARRAY['4.1.3', '2.4.5'], 'Relatieve ligging & plaatsbegrippen', 'location', 1),
  ('Aarde & Landschap', '🌍', ARRAY['4.2.1', '4.2.2'], 'Kenmerken aarde & landschappen', 'nature', 2),
  ('Aardrijkskunde', '🌍', ARRAY['4.1.1', '4.1.2', '4.2.6'], 'Topografie & Kosmografie', 'geography', 3),
  ('Weer & Klimaat', '🌤️', ARRAY['4.2.4', '4.3.3'], 'Weersverschijnselen', 'weather', 4),
  ('Seizoenen', '🍂', ARRAY['4.2.7'], 'Ritme seizoenen herkennen', 'time', 5),
  ('Heelal', '🌙', ARRAY['4.2.6'], 'Kosmografie begrippen', 'nature', 6),
  ('Wonen & Omgeving', '🏠', ARRAY['4.2.3'], 'Infrastructuur', 'location', 7),
  ('Lichaam', '🦶', ARRAY['3.3.1', '3.3.2', '3.3.3'], 'Lichaamsdelen kennen, functie & aanduiden', 'body', 8)
ON CONFLICT DO NOTHING;

-- Get category IDs for inserting words
DO $$
DECLARE
  cat_positie uuid;
  cat_aarde uuid;
  cat_aardrijkskunde uuid;
  cat_weer uuid;
  cat_seizoenen uuid;
  cat_heelal uuid;
  cat_wonen uuid;
  cat_lichaam uuid;
BEGIN
  -- Get category IDs
  SELECT id INTO cat_positie FROM vocabulary_categories WHERE name = 'Positie & Richting';
  SELECT id INTO cat_aarde FROM vocabulary_categories WHERE name = 'Aarde & Landschap';
  SELECT id INTO cat_aardrijkskunde FROM vocabulary_categories WHERE name = 'Aardrijkskunde';
  SELECT id INTO cat_weer FROM vocabulary_categories WHERE name = 'Weer & Klimaat';
  SELECT id INTO cat_seizoenen FROM vocabulary_categories WHERE name = 'Seizoenen';
  SELECT id INTO cat_heelal FROM vocabulary_categories WHERE name = 'Heelal';
  SELECT id INTO cat_wonen FROM vocabulary_categories WHERE name = 'Wonen & Omgeving';
  SELECT id INTO cat_lichaam FROM vocabulary_categories WHERE name = 'Lichaam';

  -- Insert words for Positie & Richting
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_positie, 'dichtbij', ARRAY['4.1.3', '2.4.5'], 1),
    (cat_positie, 'veraf', ARRAY['4.1.3', '2.4.5'], 2),
    (cat_positie, 'voor', ARRAY['4.1.3', '2.4.5'], 3),
    (cat_positie, 'achter', ARRAY['4.1.3', '2.4.5'], 4),
    (cat_positie, 'boven', ARRAY['4.1.3', '2.4.5'], 5),
    (cat_positie, 'onder', ARRAY['4.1.3', '2.4.5'], 6),
    (cat_positie, 'tussen', ARRAY['4.1.3', '2.4.5'], 7),
    (cat_positie, 'naast', ARRAY['4.1.3', '2.4.5'], 8),
    (cat_positie, 'binnen', ARRAY['4.1.3', '2.4.5'], 9),
    (cat_positie, 'buiten', ARRAY['4.1.3', '2.4.5'], 10),
    (cat_positie, 'in', ARRAY['4.1.3', '2.4.5'], 11),
    (cat_positie, 'uit', ARRAY['4.1.3', '2.4.5'], 12),
    (cat_positie, 'omhoog', ARRAY['2.4.5'], 13),
    (cat_positie, 'omlaag', ARRAY['2.4.5'], 14),
    (cat_positie, 'tegenover', ARRAY['2.4.5'], 15)
  ON CONFLICT DO NOTHING;

  -- Insert words for Aarde & Landschap
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_aarde, 'het land', ARRAY['4.2.1'], 1),
    (cat_aarde, 'het water', ARRAY['4.2.1'], 2),
    (cat_aarde, 'de lucht', ARRAY['4.2.1'], 3),
    (cat_aarde, 'de rots', ARRAY['4.2.1'], 4),
    (cat_aarde, 'het zand', ARRAY['4.2.1'], 5),
    (cat_aarde, 'de berg', ARRAY['4.2.2'], 6),
    (cat_aarde, 'de vallei', ARRAY['4.2.2'], 7),
    (cat_aarde, 'de zee', ARRAY['4.2.2'], 8),
    (cat_aarde, 'de rivier', ARRAY['4.2.2'], 9),
    (cat_aarde, 'het bos', ARRAY['4.2.2'], 10),
    (cat_aarde, 'de weide', ARRAY['4.2.2'], 11)
  ON CONFLICT DO NOTHING;

  -- Insert words for Aardrijkskunde
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_aardrijkskunde, 'België 🇧🇪', ARRAY['4.1.1'], 1),
    (cat_aardrijkskunde, 'de Schelde', ARRAY['4.1.1'], 2),
    (cat_aardrijkskunde, 'de Maas', ARRAY['4.1.1'], 3),
    (cat_aardrijkskunde, 'de Nijl 🇪🇬', ARRAY['4.1.1'], 4),
    (cat_aardrijkskunde, 'Egypte', ARRAY['4.1.1'], 5),
    (cat_aardrijkskunde, 'rivier', ARRAY['4.1.1'], 6),
    (cat_aardrijkskunde, 'wereldbol 🌍', ARRAY['4.1.2'], 7),
    (cat_aardrijkskunde, 'de aarde', ARRAY['4.1.2', '4.2.6'], 8),
    (cat_aardrijkskunde, 'land', ARRAY['4.1.2'], 9),
    (cat_aardrijkskunde, 'water', ARRAY['4.1.2'], 10),
    (cat_aardrijkskunde, 'oceaan', ARRAY['4.1.2'], 11),
    (cat_aardrijkskunde, 'zee', ARRAY['4.1.2'], 12),
    (cat_aardrijkskunde, 'noordpool ❄️', ARRAY['4.1.2'], 13),
    (cat_aardrijkskunde, 'zuidpool 🐧', ARRAY['4.1.2'], 14),
    (cat_aardrijkskunde, 'de zon ☀️', ARRAY['4.2.6'], 15),
    (cat_aardrijkskunde, 'de maan 🌙', ARRAY['4.2.6'], 16),
    (cat_aardrijkskunde, 'de sterren ⭐', ARRAY['4.2.6'], 17),
    (cat_aardrijkskunde, 'de dag', ARRAY['4.2.6'], 18),
    (cat_aardrijkskunde, 'de nacht', ARRAY['4.2.6'], 19),
    (cat_aardrijkskunde, 'draaien 🔄', ARRAY['4.2.6'], 20),
    (cat_aardrijkskunde, 'continent', ARRAY['4.1.2'], 21),
    (cat_aardrijkskunde, 'Europa', ARRAY['4.1.2'], 22),
    (cat_aardrijkskunde, 'Afrika', ARRAY['4.1.2'], 23)
  ON CONFLICT DO NOTHING;

  -- Insert words for Weer & Klimaat
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_weer, 'temperatuur', ARRAY['4.2.4'], 1),
    (cat_weer, 'neerslag', ARRAY['4.2.4'], 2),
    (cat_weer, 'bewolking', ARRAY['4.2.4', '4.2.5'], 3),
    (cat_weer, 'wind', ARRAY['4.2.4'], 4),
    (cat_weer, 'regen', ARRAY['4.3.3'], 5),
    (cat_weer, 'sneeuw', ARRAY['4.3.3'], 6),
    (cat_weer, 'hagel', ARRAY['4.3.3'], 7),
    (cat_weer, 'mist', ARRAY['4.3.3'], 8)
  ON CONFLICT DO NOTHING;

  -- Insert words for Seizoenen
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_seizoenen, 'lente', ARRAY['4.2.7'], 1),
    (cat_seizoenen, 'zomer', ARRAY['4.2.7'], 2),
    (cat_seizoenen, 'herfst', ARRAY['4.2.7'], 3),
    (cat_seizoenen, 'winter', ARRAY['4.2.7'], 4)
  ON CONFLICT DO NOTHING;

  -- Insert words for Heelal
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_heelal, 'aarde', ARRAY['4.2.6'], 1),
    (cat_heelal, 'maan', ARRAY['4.2.6'], 2),
    (cat_heelal, 'zon', ARRAY['4.2.6'], 3),
    (cat_heelal, 'sterren', ARRAY['4.2.6'], 4),
    (cat_heelal, 'dag', ARRAY['4.2.6'], 5),
    (cat_heelal, 'nacht', ARRAY['4.2.6'], 6)
  ON CONFLICT DO NOTHING;

  -- Insert words for Wonen & Omgeving
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_wonen, 'huis', ARRAY['4.2.3'], 1),
    (cat_wonen, 'appartement', ARRAY['4.2.3'], 2),
    (cat_wonen, 'tuin', ARRAY['4.2.3'], 3),
    (cat_wonen, 'straat', ARRAY['4.2.3'], 4),
    (cat_wonen, 'bus', ARRAY['4.2.3'], 5),
    (cat_wonen, 'trein', ARRAY['4.2.3'], 6),
    (cat_wonen, 'winkel', ARRAY['4.2.3'], 7),
    (cat_wonen, 'park', ARRAY['4.2.3'], 8),
    (cat_wonen, 'boerderij', ARRAY['4.2.3'], 9),
    (cat_wonen, 'fabriek', ARRAY['4.2.3'], 10)
  ON CONFLICT DO NOTHING;

  -- Insert words for Lichaam
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_lichaam, 'spieren', ARRAY['3.3.1', '3.3.2'], 1),
    (cat_lichaam, 'botten', ARRAY['3.3.1', '3.3.2'], 2),
    (cat_lichaam, 'longen', ARRAY['3.3.1', '3.3.2'], 3),
    (cat_lichaam, 'hart', ARRAY['3.3.1', '3.3.2'], 4),
    (cat_lichaam, 'maag', ARRAY['3.3.1', '3.3.2'], 5),
    (cat_lichaam, 'ogen', ARRAY['3.3.1', '3.3.2', '3.3.3'], 6),
    (cat_lichaam, 'oren', ARRAY['3.3.1', '3.3.2', '3.3.3'], 7),
    (cat_lichaam, 'neus', ARRAY['3.3.1', '3.3.2', '3.3.3'], 8),
    (cat_lichaam, 'mond', ARRAY['3.3.1', '3.3.2', '3.3.3'], 9),
    (cat_lichaam, 'huid', ARRAY['3.3.1', '3.3.2', '3.3.3'], 10)
  ON CONFLICT DO NOTHING;

END $$;
