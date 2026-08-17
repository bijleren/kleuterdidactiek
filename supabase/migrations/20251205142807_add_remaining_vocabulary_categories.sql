/*
  # Add Remaining Vocabulary Categories and Words
  
  ## Overview
  This migration adds the remaining 16 vocabulary categories that were missing from the initial migration:
  - Zintuigen (Senses)
  - Dieren (Animals)
  - Planten (Plants)
  - Levenscyclus (Life Cycle)
  - Licht & Magnetisme (Light & Magnetism)
  - Kleuren (Colors)
  - Vormen (Shapes)
  - Getallen (Numbers)
  - Meten (Measuring)
  - Tijd (Time)
  - Dagen van de week (Days of the week)
  - Gevoelens (Emotions)
  - Taal & Rijm (Language & Rhyme)
  - Schrijfvaardigheden (Writing Skills)
  - Muziek (Music)
  - Verkeer (Traffic)
  
  ## Changes
  1. **New Categories**: 16 additional vocabulary categories
  2. **New Words**: ~140 additional vocabulary words with goal code mappings
  3. **Educational Standards**: All words are mapped to Flemish educational goals
*/

-- Insert remaining vocabulary categories
INSERT INTO vocabulary_categories (name, emoji, goal_codes, goal_description, category_type, sort_order) VALUES
  ('Zintuigen', '👁️', ARRAY['3.3.1'], 'Fysieke functies', 'body', 9),
  ('Dieren', '🐾', ARRAY['3.1.1', '3.1.2'], 'Classificatie & kenmerken', 'animals', 10),
  ('Planten', '🌱', ARRAY['3.1.2'], 'Plantonderdelen', 'animals', 11),
  ('Levenscyclus', '🔄', ARRAY['3.1.3', '3.1.4'], 'Levensfasen', 'animals', 12),
  ('Licht & Magnetisme', '💡', ARRAY['3.5.1', '3.5.2', '3.5.4'], 'Natuurkundige verschijnselen', 'nature', 13),
  ('Kleuren', '🎨', ARRAY['6.3.1', '6.3.4'], 'Beeld bouwstenen & kleuren', 'art', 14),
  ('Vormen', '🔷', ARRAY['2.4.1', '2.4.2'], 'Vormleer', 'math', 15),
  ('Getallen', '🔢', ARRAY['2.1.1', '2.1.7', '2.1.8'], 'Tellen & vergelijken', 'math', 16),
  ('Meten', '📏', ARRAY['2.3.4', '2.3.7'], 'Lengte & massa begrippen', 'math', 17),
  ('Tijd', '⏰', ARRAY['2.3.16', '2.3.17', '2.3.18'], 'Dagen & tijdsbegrippen', 'time', 18),
  ('Dagen van de week', '📅', ARRAY['2.3.16'], 'Dagen kennen', 'time', 19),
  ('Gevoelens', '😊', ARRAY['9.3.1'], 'Emoties herkennen & benoemen', 'art', 20),
  ('Taal & Rijm', '📖', ARRAY['1.1.1', '1.4.4', '1.4.5'], 'Fonologisch bewustzijn', 'art', 21),
  ('Schrijfvaardigheden', '✏️', ARRAY['1.2.1', '1.2.2', '1.2.3', '1.2.4', '1.2.5', '1.2.6', '1.2.7'], 'Handschrift & voorbereidend schrijven', 'writing', 22),
  ('Muziek', '🎵', ARRAY['6.2.1', '6.2.5'], 'Muziek bouwstenen', 'art', 23),
  ('Verkeer', '🚦', ARRAY['9.1.1', '9.1.2'], 'Verkeersregels & veiligheid', 'location', 24)
ON CONFLICT DO NOTHING;

-- Insert all words for the new categories
DO $$
DECLARE
  cat_zintuigen uuid;
  cat_dieren uuid;
  cat_planten uuid;
  cat_levenscyclus uuid;
  cat_licht uuid;
  cat_kleuren uuid;
  cat_vormen uuid;
  cat_getallen uuid;
  cat_meten uuid;
  cat_tijd uuid;
  cat_dagen uuid;
  cat_gevoelens uuid;
  cat_taal uuid;
  cat_schrijven uuid;
  cat_muziek uuid;
  cat_verkeer uuid;
BEGIN
  -- Get category IDs
  SELECT id INTO cat_zintuigen FROM vocabulary_categories WHERE name = 'Zintuigen';
  SELECT id INTO cat_dieren FROM vocabulary_categories WHERE name = 'Dieren';
  SELECT id INTO cat_planten FROM vocabulary_categories WHERE name = 'Planten';
  SELECT id INTO cat_levenscyclus FROM vocabulary_categories WHERE name = 'Levenscyclus';
  SELECT id INTO cat_licht FROM vocabulary_categories WHERE name = 'Licht & Magnetisme';
  SELECT id INTO cat_kleuren FROM vocabulary_categories WHERE name = 'Kleuren';
  SELECT id INTO cat_vormen FROM vocabulary_categories WHERE name = 'Vormen';
  SELECT id INTO cat_getallen FROM vocabulary_categories WHERE name = 'Getallen';
  SELECT id INTO cat_meten FROM vocabulary_categories WHERE name = 'Meten';
  SELECT id INTO cat_tijd FROM vocabulary_categories WHERE name = 'Tijd';
  SELECT id INTO cat_dagen FROM vocabulary_categories WHERE name = 'Dagen van de week';
  SELECT id INTO cat_gevoelens FROM vocabulary_categories WHERE name = 'Gevoelens';
  SELECT id INTO cat_taal FROM vocabulary_categories WHERE name = 'Taal & Rijm';
  SELECT id INTO cat_schrijven FROM vocabulary_categories WHERE name = 'Schrijfvaardigheden';
  SELECT id INTO cat_muziek FROM vocabulary_categories WHERE name = 'Muziek';
  SELECT id INTO cat_verkeer FROM vocabulary_categories WHERE name = 'Verkeer';

  -- Zintuigen
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_zintuigen, 'zien', ARRAY['3.3.1'], 1),
    (cat_zintuigen, 'horen', ARRAY['3.3.1'], 2),
    (cat_zintuigen, 'ruiken', ARRAY['3.3.1'], 3),
    (cat_zintuigen, 'proeven', ARRAY['3.3.1'], 4),
    (cat_zintuigen, 'voelen', ARRAY['3.3.1'], 5),
    (cat_zintuigen, 'bewegen', ARRAY['3.3.1'], 6),
    (cat_zintuigen, 'ademen', ARRAY['3.3.1'], 7),
    (cat_zintuigen, 'honger', ARRAY['3.3.1', '3.2.4'], 8),
    (cat_zintuigen, 'dorst', ARRAY['3.3.1', '3.2.4'], 9)
  ON CONFLICT DO NOTHING;

  -- Dieren
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_dieren, 'fauna', ARRAY['3.1.1'], 1),
    (cat_dieren, 'zoogdieren', ARRAY['3.1.1'], 2),
    (cat_dieren, 'vogels', ARRAY['3.1.1'], 3),
    (cat_dieren, 'vissen', ARRAY['3.1.1'], 4),
    (cat_dieren, 'insecten', ARRAY['3.1.1'], 5),
    (cat_dieren, 'flora', ARRAY['3.1.1'], 6),
    (cat_dieren, 'eieren', ARRAY['3.1.2'], 7),
    (cat_dieren, 'zogend', ARRAY['3.1.2'], 8)
  ON CONFLICT DO NOTHING;

  -- Planten
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_planten, 'wortel', ARRAY['3.1.2'], 1),
    (cat_planten, 'stengel', ARRAY['3.1.2'], 2),
    (cat_planten, 'stam', ARRAY['3.1.2'], 3),
    (cat_planten, 'blad', ARRAY['3.1.2'], 4),
    (cat_planten, 'bloem', ARRAY['3.1.2'], 5),
    (cat_planten, 'vrucht', ARRAY['3.1.2'], 6),
    (cat_planten, 'zaad', ARRAY['3.1.2'], 7)
  ON CONFLICT DO NOTHING;

  -- Levenscyclus
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_levenscyclus, 'geboren worden', ARRAY['3.1.3'], 1),
    (cat_levenscyclus, 'kiemen', ARRAY['3.1.3'], 2),
    (cat_levenscyclus, 'groeien', ARRAY['3.1.3'], 3),
    (cat_levenscyclus, 'sterven', ARRAY['3.1.3'], 4),
    (cat_levenscyclus, 'baby', ARRAY['3.1.4'], 5),
    (cat_levenscyclus, 'peuter', ARRAY['3.1.4'], 6),
    (cat_levenscyclus, 'kleuter', ARRAY['3.1.4'], 7),
    (cat_levenscyclus, 'kind', ARRAY['3.1.4'], 8),
    (cat_levenscyclus, 'volwassene', ARRAY['3.1.4'], 9)
  ON CONFLICT DO NOTHING;

  -- Licht & Magnetisme
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_licht, 'lamp', ARRAY['3.5.1'], 1),
    (cat_licht, 'licht', ARRAY['3.5.1', '3.5.2'], 2),
    (cat_licht, 'donker', ARRAY['3.5.1'], 3),
    (cat_licht, 'schaduw', ARRAY['3.5.1'], 4),
    (cat_licht, 'spiegel', ARRAY['3.5.1', '3.5.2'], 5),
    (cat_licht, 'magneet', ARRAY['3.5.1', '3.5.4'], 6),
    (cat_licht, 'aantrekken', ARRAY['3.5.1', '3.5.4'], 7),
    (cat_licht, 'afstoten', ARRAY['3.5.1', '3.5.4'], 8),
    (cat_licht, 'batterij', ARRAY['3.5.1'], 9)
  ON CONFLICT DO NOTHING;

  -- Kleuren
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_kleuren, 'rood', ARRAY['6.3.1', '6.3.4'], 1),
    (cat_kleuren, 'geel', ARRAY['6.3.1', '6.3.4'], 2),
    (cat_kleuren, 'blauw', ARRAY['6.3.1', '6.3.4'], 3),
    (cat_kleuren, 'groen', ARRAY['6.3.1', '6.3.4'], 4),
    (cat_kleuren, 'oranje', ARRAY['6.3.1', '6.3.4'], 5),
    (cat_kleuren, 'paars', ARRAY['6.3.1', '6.3.4'], 6),
    (cat_kleuren, 'wit', ARRAY['6.3.1'], 7),
    (cat_kleuren, 'zwart', ARRAY['6.3.1'], 8),
    (cat_kleuren, 'grijs', ARRAY['6.3.1'], 9),
    (cat_kleuren, 'bruin', ARRAY['6.3.1'], 10)
  ON CONFLICT DO NOTHING;

  -- Vormen
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_vormen, 'driehoek', ARRAY['2.4.1', '2.4.2'], 1),
    (cat_vormen, 'rechthoek', ARRAY['2.4.1', '2.4.2'], 2),
    (cat_vormen, 'vierkant', ARRAY['2.4.1', '2.4.2'], 3),
    (cat_vormen, 'cirkel', ARRAY['2.4.1', '2.4.2'], 4),
    (cat_vormen, 'kubus', ARRAY['2.4.1', '2.4.2'], 5),
    (cat_vormen, 'balk', ARRAY['2.4.1', '2.4.2'], 6),
    (cat_vormen, 'bol', ARRAY['2.4.1', '2.4.2'], 7),
    (cat_vormen, 'piramide', ARRAY['2.4.1', '2.4.2'], 8),
    (cat_vormen, 'rond', ARRAY['2.4.1'], 9),
    (cat_vormen, 'recht', ARRAY['2.4.1'], 10)
  ON CONFLICT DO NOTHING;

  -- Getallen
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_getallen, 'evenveel', ARRAY['2.1.7'], 1),
    (cat_getallen, 'veel', ARRAY['2.1.7'], 2),
    (cat_getallen, 'weinig', ARRAY['2.1.7'], 3),
    (cat_getallen, 'meer', ARRAY['2.1.7'], 4),
    (cat_getallen, 'minder', ARRAY['2.1.7'], 5),
    (cat_getallen, 'eerste', ARRAY['2.1.7'], 6),
    (cat_getallen, 'laatste', ARRAY['2.1.7'], 7),
    (cat_getallen, 'hoeveel', ARRAY['2.1.7'], 8)
  ON CONFLICT DO NOTHING;

  -- Meten
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_meten, 'lang', ARRAY['2.3.4'], 1),
    (cat_meten, 'kort', ARRAY['2.3.4'], 2),
    (cat_meten, 'hoog', ARRAY['2.3.4'], 3),
    (cat_meten, 'laag', ARRAY['2.3.4'], 4),
    (cat_meten, 'groot', ARRAY['2.3.4'], 5),
    (cat_meten, 'klein', ARRAY['2.3.4'], 6),
    (cat_meten, 'vol', ARRAY['2.3.4'], 7),
    (cat_meten, 'leeg', ARRAY['2.3.4'], 8),
    (cat_meten, 'zwaar', ARRAY['2.3.7'], 9),
    (cat_meten, 'licht', ARRAY['2.3.7'], 10)
  ON CONFLICT DO NOTHING;

  -- Tijd
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_tijd, 'vandaag', ARRAY['2.3.17', '2.3.18'], 1),
    (cat_tijd, 'gisteren', ARRAY['2.3.17', '2.3.18'], 2),
    (cat_tijd, 'morgen', ARRAY['2.3.17', '2.3.18'], 3),
    (cat_tijd, 'eerder', ARRAY['2.3.17'], 4),
    (cat_tijd, 'later', ARRAY['2.3.17'], 5),
    (cat_tijd, 'eerst', ARRAY['2.3.17'], 6),
    (cat_tijd, 'daarna', ARRAY['2.3.17'], 7),
    (cat_tijd, 'dag', ARRAY['2.3.17'], 8),
    (cat_tijd, 'week', ARRAY['2.3.17'], 9)
  ON CONFLICT DO NOTHING;

  -- Dagen van de week
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_dagen, 'maandag', ARRAY['2.3.16'], 1),
    (cat_dagen, 'dinsdag', ARRAY['2.3.16'], 2),
    (cat_dagen, 'woensdag', ARRAY['2.3.16'], 3),
    (cat_dagen, 'donderdag', ARRAY['2.3.16'], 4),
    (cat_dagen, 'vrijdag', ARRAY['2.3.16'], 5),
    (cat_dagen, 'zaterdag', ARRAY['2.3.16'], 6),
    (cat_dagen, 'zondag', ARRAY['2.3.16'], 7)
  ON CONFLICT DO NOTHING;

  -- Gevoelens
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_gevoelens, 'blij', ARRAY['9.3.1'], 1),
    (cat_gevoelens, 'verdrietig', ARRAY['9.3.1'], 2),
    (cat_gevoelens, 'boos', ARRAY['9.3.1'], 3),
    (cat_gevoelens, 'bang', ARRAY['9.3.1'], 4),
    (cat_gevoelens, 'moe', ARRAY['9.3.1'], 5),
    (cat_gevoelens, 'verbaasd', ARRAY['9.3.1'], 6),
    (cat_gevoelens, 'trots', ARRAY['9.3.1'], 7)
  ON CONFLICT DO NOTHING;

  -- Taal & Rijm
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_taal, 'woord', ARRAY['1.4.4'], 1),
    (cat_taal, 'rijm', ARRAY['1.1.1', '1.4.4'], 2),
    (cat_taal, 'klank', ARRAY['1.4.4', '1.4.5'], 3),
    (cat_taal, 'letter', ARRAY['1.4.4', '1.1.4'], 4),
    (cat_taal, 'klankgroep', ARRAY['1.1.1', '1.4.4'], 5)
  ON CONFLICT DO NOTHING;

  -- Schrijfvaardigheden
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_schrijven, 'pengreep', ARRAY['1.2.1'], 1),
    (cat_schrijven, 'schrijfhouding', ARRAY['1.2.2'], 2),
    (cat_schrijven, 'rechte lijn', ARRAY['1.2.3'], 3),
    (cat_schrijven, 'gebogen lijn', ARRAY['1.2.3'], 4),
    (cat_schrijven, 'schrijfpatroon', ARRAY['1.2.4'], 5),
    (cat_schrijven, 'kleuren', ARRAY['1.2.5'], 6),
    (cat_schrijven, 'arceren', ARRAY['1.2.6'], 7),
    (cat_schrijven, 'schrijfrichting', ARRAY['1.2.7'], 8)
  ON CONFLICT DO NOTHING;

  -- Muziek
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_muziek, 'klank', ARRAY['6.2.1'], 1),
    (cat_muziek, 'toon', ARRAY['6.2.1'], 2),
    (cat_muziek, 'snel', ARRAY['6.2.1'], 3),
    (cat_muziek, 'langzaam', ARRAY['6.2.1'], 4),
    (cat_muziek, 'hard', ARRAY['6.2.1'], 5),
    (cat_muziek, 'zacht', ARRAY['6.2.1'], 6),
    (cat_muziek, 'lied', ARRAY['6.2.5'], 7),
    (cat_muziek, 'triangel', ARRAY['6.2.5'], 8),
    (cat_muziek, 'tamboerijn', ARRAY['6.2.5'], 9)
  ON CONFLICT DO NOTHING;

  -- Verkeer
  INSERT INTO vocabulary_words (category_id, word, goal_codes, sort_order) VALUES
    (cat_verkeer, 'zebrapad', ARRAY['9.1.1'], 1),
    (cat_verkeer, 'verkeerslichten', ARRAY['9.1.1'], 2),
    (cat_verkeer, 'stopbord', ARRAY['9.1.1'], 3),
    (cat_verkeer, 'voetpad', ARRAY['9.1.1'], 4),
    (cat_verkeer, 'oversteken', ARRAY['9.1.1'], 5),
    (cat_verkeer, 'fietshelm', ARRAY['9.1.2'], 6)
  ON CONFLICT DO NOTHING;

END $$;
