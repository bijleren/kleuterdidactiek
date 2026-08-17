/*
  # Populate Games, Writing Exercises, and Physical Tasks
  
  ## Overview
  Populates learning games, writing exercises, and physical tasks data
  from the kleuterdoelen HTML file.
*/

-- Insert learning games
INSERT INTO learning_games (name, emoji, description, question_count, goal_codes, game_type, difficulty_level, sort_order) VALUES
  ('Kleuren Raden', '🎨', '15 vragen over kleuren', 15, ARRAY['6.3.1', '6.3.4'], 'colors', 1, 1),
  ('Tellen', '🔢', '20 telvragen tot 10', 20, ARRAY['2.1.1', '2.1.8'], 'counting', 1, 2),
  ('Vormen Herkennen', '🔷', '12 vormvragen', 12, ARRAY['2.4.1', '2.4.2'], 'shapes', 1, 3),
  ('Dieren Quiz', '🐾', '15 vragen over diersoorten', 15, ARRAY['3.1.1', '3.1.2'], 'animals', 1, 4),
  ('Lichaamsdelen', '🦶', '12 vragen over het lichaam', 12, ARRAY['3.3.1', '3.3.2', '3.3.3'], 'body', 1, 5),
  ('Weer Woorden', '🌤️', '10 weervragen', 10, ARRAY['4.2.4', '4.3.3'], 'weather', 1, 6),
  ('Positie Woorden', '📍', '15 plaatsvragen met 3D beelden', 15, ARRAY['4.1.3', '2.4.5'], 'position', 2, 7),
  ('Rijmen', '🎵', '15 rijmvragen', 15, ARRAY['1.1.1', '1.4.4'], 'rhyme', 2, 8),
  ('Gevoelens', '😊', '12 emotievragen', 12, ARRAY['9.3.1'], 'emotions', 1, 9),
  ('Vergelijken', '📦', '15 vergelijkingsvragen', 15, ARRAY['2.3.4', '2.3.5', '2.3.7'], 'sorting', 2, 10),
  ('Dagen van de Week', '📅', '10 vragen over dagen', 10, ARRAY['2.3.16', '2.3.17', '2.3.18'], 'days', 1, 11),
  ('Letters Herkennen', '🔤', '15 lettervragen', 15, ARRAY['1.1.4', '1.4.4'], 'letters', 2, 12),
  ('Zintuigen', '👁️', '10 vragen over zintuigen', 10, ARRAY['3.3.1'], 'senses', 1, 13),
  ('Levenscyclus', '🔄', '10 vragen over groeien', 10, ARRAY['3.1.3', '3.1.4'], 'lifecycle', 2, 14),
  ('Patronen', '🔶', '10 patroonvragen', 10, ARRAY['2.4.4'], 'patterns', 2, 15),
  ('Seizoenen', '🍂', '10 seizoenvragen', 10, ARRAY['4.2.7'], 'seasons', 1, 16),
  ('Aardrijkskunde', '🌍', '12 vragen over de wereld', 12, ARRAY['4.1.1', '4.1.2', '4.2.6'], 'geography', 2, 17),
  ('Rangorde', '🏆', '10 vragen over eerste/laatste', 10, ARRAY['2.1.2', '2.1.3'], 'ranking', 2, 18),
  ('Flitsen', '👀', '12 subiteer-vragen', 12, ARRAY['2.1.9'], 'subitize', 3, 19),
  ('Geld', '💶', '10 vragen over betalen', 10, ARRAY['2.3.10', '2.3.11'], 'money', 3, 20)
ON CONFLICT DO NOTHING;

-- Insert writing exercises
INSERT INTO writing_exercises (title, emoji, goal_codes, description, instructions, tips, exercise_type, sort_order) VALUES
  (
    'Pengreep', 
    '✋', 
    ARRAY['1.2.1'], 
    'Dynamische pengreep hanteren', 
    'De driepuntsgreep: duim, wijsvinger en middenvinger houden het potlood vast.',
    ARRAY['Duim en wijsvinger tegenover elkaar', 'Middenvinger ondersteunt', 'Ontspannen vingers, niet knijpen'],
    'pengreep',
    1
  ),
  (
    'Schrijfhouding',
    '🪑',
    ARRAY['1.2.2'],
    'Correcte schrijfhouding aannemen',
    'Rechtop zitten met beide voeten op de grond, papier schuin voor je.',
    ARRAY['Rechtop zitten', 'Voeten plat op de grond', 'Papier schuin', 'Vrije hand houdt papier vast'],
    'houding',
    2
  ),
  (
    'Lijnen Tekenen',
    '📏',
    ARRAY['1.2.3'],
    'Rechte en gebogen lijnen tekenen',
    'Oefen met het trekken van verschillende soorten lijnen: recht, gebogen, zigzag.',
    ARRAY['Begin met grote bewegingen', 'Gebruik de hele arm', 'Oefen van groot naar klein'],
    'lijnen',
    3
  ),
  (
    'Schrijfpatronen',
    '〰️',
    ARRAY['1.2.4'],
    'Grafische patronen reproduceren',
    'Kopieer en herhaal patronen zoals golven, lussen, en zigzaglijnen.',
    ARRAY['Start langzaam', 'Houd een vast ritme aan', 'Maak vloeiende bewegingen'],
    'patronen',
    4
  ),
  (
    'Kleuren',
    '🖍️',
    ARRAY['1.2.5'],
    'Vlakken en figuren inkleuren',
    'Kleur binnen de lijnen met regelmatige bewegingen.',
    ARRAY['Kleur in één richting', 'Blijf binnen de lijnen', 'Gebruik gelijkmatige druk'],
    'kleuren',
    5
  ),
  (
    'Arceren',
    '📐',
    ARRAY['1.2.6'],
    'Vlakken arceren met verschillende technieken',
    'Vul vlakken met parallelle lijnen, kruislijnen of stippen.',
    ARRAY['Gebruik verschillende patronen', 'Houd lijnen evenwijdig', 'Varieer de dichtheid'],
    'arceren',
    6
  ),
  (
    'Schrijfrichting',
    '➡️',
    ARRAY['1.2.7'],
    'Correct schrijfrichting toepassen',
    'Oefen met schrijven van links naar rechts en van boven naar beneden.',
    ARRAY['Begin linksboven', 'Beweeg naar rechts', 'Van boven naar onder'],
    'richting',
    7
  )
ON CONFLICT DO NOTHING;

-- Insert physical tasks (doe-opdrachten)
INSERT INTO physical_tasks (title, emoji, goal_codes, description, instructions, duration_minutes, materials_needed, task_category, sort_order) VALUES
  (
    'Grove Motoriek: Springen',
    '🦘',
    ARRAY['3.4.1', '3.4.2'],
    'Oefen springen op verschillende manieren',
    'Laat kinderen springen op twee benen, op één been, voorwaarts, achterwaarts, en zijwaarts. Combineer met opdrachten zoals "spring als een kikker".',
    15,
    ARRAY['Ruimte om te bewegen', 'Eventueel muziek'],
    'motoriek',
    1
  ),
  (
    'Balans Oefeningen',
    '🤸',
    ARRAY['3.4.1', '3.4.3'],
    'Ontwikkel balans en coördinatie',
    'Laat kinderen op één been staan, over een lijn lopen, of op een laag bankje balanceren.',
    10,
    ARRAY['Lijn of touw op de grond', 'Laag bankje (optioneel)'],
    'motoriek',
    2
  ),
  (
    'Gooien en Vangen',
    '⚽',
    ARRAY['3.4.4', '3.4.5'],
    'Oefen oog-handcoördinatie',
    'Oefen gooien en vangen met zachte ballen, zakjes of ballonnen. Start dichtbij en vergroot geleidelijk de afstand.',
    15,
    ARRAY['Zachte ballen', 'Zaadjes', 'Ballonnen'],
    'motoriek',
    3
  ),
  (
    'Knippen met Schaar',
    '✂️',
    ARRAY['3.4.6'],
    'Fijne motoriek: knippen',
    'Laat kinderen oefenen met knippen: rechte lijnen, gebogen lijnen, en uiteindelijk vormen uitknippen.',
    20,
    ARRAY['Kinderscharen', 'Papier met lijnen', 'Kleurrijk papier'],
    'fijn-motoriek',
    4
  ),
  (
    'Rijgen en Knopen',
    '🧵',
    ARRAY['3.4.6'],
    'Fijne motoriek: rijgen',
    'Oefen rijgen met grote kralen, pasta, of knopen. Dit ontwikkelt handvaardigheid en concentratie.',
    15,
    ARRAY['Grote kralen', 'Rijgkoord', 'Pasta met gaten'],
    'fijn-motoriek',
    5
  ),
  (
    'Vormen Leggen',
    '🔷',
    ARRAY['2.4.1', '2.4.2', '2.4.3'],
    'Ruimtelijk inzicht met vormen',
    'Gebruik blokken, tangram of andere vormenmaterialen om figuren na te leggen of eigen creaties te maken.',
    20,
    ARRAY['Blokken', 'Tangram', 'Voorbeeldkaarten'],
    'constructie',
    6
  ),
  (
    'Sorteren en Classificeren',
    '📦',
    ARRAY['2.2.1', '2.2.2'],
    'Verzamelingen maken op basis van kenmerken',
    'Laat kinderen voorwerpen sorteren op kleur, vorm, grootte of functie. Bespreek de sorteerregels.',
    15,
    ARRAY['Diverse voorwerpen', 'Bakjes of schalen'],
    'logica',
    7
  ),
  (
    'Patronen Maken',
    '🔶',
    ARRAY['2.4.4'],
    'Herken en maak patronen',
    'Begin met eenvoudige AB patronen en bouw op naar complexere patronen. Gebruik blokken, kralen of tekeningen.',
    15,
    ARRAY['Blokken of kralen in verschillende kleuren', 'Voorbeeldkaarten'],
    'logica',
    8
  ),
  (
    'Muziek en Ritme',
    '🎵',
    ARRAY['6.2.1', '6.2.2'],
    'Muzikale bewegingsopdrachten',
    'Dans en beweeg op muziek, klap ritmes na, gebruik eenvoudige instrumenten om ritmes te maken.',
    20,
    ARRAY['Muziek', 'Eenvoudige instrumenten (triangel, tamboerijn)'],
    'muziek',
    9
  ),
  (
    'Verhaaltje Naspelen',
    '🎭',
    ARRAY['1.3.1', '1.3.2', '6.1.1'],
    'Dramatisch spel en expressie',
    'Speel bekende verhalen na of laat kinderen eigen verhalen bedenken en uitbeelden. Focus op expressie en samenwerken.',
    25,
    ARRAY['Eenvoudige kostuums', 'Attributen'],
    'drama',
    10
  ),
  (
    'Buitenspel: Zoektocht',
    '🔍',
    ARRAY['2.5.1', '4.1.3'],
    'Oriëntatie en zoeken',
    'Organiseer een zoektocht buiten waarbij kinderen voorwerpen moeten vinden op basis van aanwijzingen over positie.',
    30,
    ARRAY['Voorwerpen om te verstoppen', 'Aanwijzingenkaarten'],
    'buitenspel',
    11
  ),
  (
    'Samenwerkingsspel',
    '🤝',
    ARRAY['9.2.1', '9.2.2'],
    'Samenwerken aan een doel',
    'Spelletjes waarbij kinderen moeten samenwerken: gezamenlijk een toren bouwen, samen een puzzel maken.',
    20,
    ARRAY['Bouwmateriaal of puzzel', 'Genoeg ruimte'],
    'sociaal',
    12
  )
ON CONFLICT DO NOTHING;
