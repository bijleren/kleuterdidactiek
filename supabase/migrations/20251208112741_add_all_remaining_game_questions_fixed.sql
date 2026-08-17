/*
  # Import All Remaining Game Questions
  
  1. Purpose
    - Imports all game questions from the original kleuterdoelen.html file
    - Adds questions for games that were missing them
  
  2. Changes
    - Adds complete question sets for 15 games that had no questions
    - Updates question counts to match actual data
*/

-- Animals Quiz (15 questions)
INSERT INTO game_questions (game_id, question, visual, answer, options, sort_order)
SELECT id, 'De koe is een...', '🐄', 'zoogdier', ARRAY['zoogdier', 'vogel', 'vis', 'insect']::text[], 1
FROM learning_games WHERE game_type = 'animals'
UNION ALL
SELECT id, 'De vogel is een...', '🐦', 'vogel', ARRAY['zoogdier', 'vogel', 'vis', 'insect']::text[], 2
FROM learning_games WHERE game_type = 'animals'
UNION ALL
SELECT id, 'De vis is een...', '🐟', 'vis', ARRAY['zoogdier', 'vogel', 'vis', 'insect']::text[], 3
FROM learning_games WHERE game_type = 'animals'
UNION ALL
SELECT id, 'De olifant is een...', '🐘', 'zoogdier', ARRAY['zoogdier', 'vogel', 'insect', 'vis']::text[], 4
FROM learning_games WHERE game_type = 'animals'
UNION ALL
SELECT id, 'De vlinder is een...', '🦋', 'insect', ARRAY['vogel', 'vis', 'insect', 'zoogdier']::text[], 5
FROM learning_games WHERE game_type = 'animals'
UNION ALL
SELECT id, 'De pinguïn is een...', '🐧', 'vogel', ARRAY['vis', 'vogel', 'zoogdier', 'insect']::text[], 6
FROM learning_games WHERE game_type = 'animals'
UNION ALL
SELECT id, 'De hond is een...', '🐕', 'zoogdier', ARRAY['zoogdier', 'vogel', 'vis', 'insect']::text[], 7
FROM learning_games WHERE game_type = 'animals'
UNION ALL
SELECT id, 'De adelaar is een...', '🦅', 'vogel', ARRAY['insect', 'vogel', 'zoogdier', 'vis']::text[], 8
FROM learning_games WHERE game_type = 'animals'
UNION ALL
SELECT id, 'De tropische vis is een...', '🐠', 'vis', ARRAY['vis', 'vogel', 'zoogdier', 'insect']::text[], 9
FROM learning_games WHERE game_type = 'animals'
UNION ALL
SELECT id, 'De bij is een...', '🐝', 'insect', ARRAY['vogel', 'insect', 'zoogdier', 'vis']::text[], 10
FROM learning_games WHERE game_type = 'animals'
UNION ALL
SELECT id, 'De kat is een...', '🐈', 'zoogdier', ARRAY['zoogdier', 'vogel', 'vis', 'insect']::text[], 11
FROM learning_games WHERE game_type = 'animals'
UNION ALL
SELECT id, 'De eend is een...', '🦆', 'vogel', ARRAY['vis', 'vogel', 'zoogdier', 'insect']::text[], 12
FROM learning_games WHERE game_type = 'animals'
UNION ALL
SELECT id, 'De haai is een...', '🦈', 'vis', ARRAY['zoogdier', 'vogel', 'vis', 'insect']::text[], 13
FROM learning_games WHERE game_type = 'animals'
UNION ALL
SELECT id, 'De rups is een...', '🐛', 'insect', ARRAY['insect', 'vogel', 'vis', 'zoogdier']::text[], 14
FROM learning_games WHERE game_type = 'animals'
UNION ALL
SELECT id, 'Het paard is een...', '🐴', 'zoogdier', ARRAY['zoogdier', 'vogel', 'vis', 'insect']::text[], 15
FROM learning_games WHERE game_type = 'animals';

-- Body Parts (12 questions)
INSERT INTO game_questions (game_id, question, visual, answer, options, sort_order)
SELECT id, 'Wat zie je hier?', '👀', 'ogen', ARRAY['oren', 'ogen', 'neus', 'mond']::text[], 1
FROM learning_games WHERE game_type = 'body'
UNION ALL
SELECT id, 'Wat zie je hier?', '👂', 'oren', ARRAY['oren', 'mond', 'ogen', 'neus']::text[], 2
FROM learning_games WHERE game_type = 'body'
UNION ALL
SELECT id, 'Wat zie je hier?', '👃', 'neus', ARRAY['neus', 'oren', 'mond', 'ogen']::text[], 3
FROM learning_games WHERE game_type = 'body'
UNION ALL
SELECT id, 'Wat zie je hier?', '👄', 'mond', ARRAY['neus', 'ogen', 'mond', 'oren']::text[], 4
FROM learning_games WHERE game_type = 'body'
UNION ALL
SELECT id, 'Wat zie je hier?', '🫀', 'hart', ARRAY['maag', 'hart', 'longen', 'nieren']::text[], 5
FROM learning_games WHERE game_type = 'body'
UNION ALL
SELECT id, 'Wat zie je hier?', '🫁', 'longen', ARRAY['longen', 'hart', 'maag', 'lever']::text[], 6
FROM learning_games WHERE game_type = 'body'
UNION ALL
SELECT id, 'Wat zie je hier?', '🧠', 'hersenen', ARRAY['hart', 'hersenen', 'maag', 'longen']::text[], 7
FROM learning_games WHERE game_type = 'body'
UNION ALL
SELECT id, 'Wat zie je hier?', '✋', 'hand', ARRAY['voet', 'hand', 'arm', 'been']::text[], 8
FROM learning_games WHERE game_type = 'body'
UNION ALL
SELECT id, 'Wat zie je hier?', '🦶', 'voet', ARRAY['hand', 'voet', 'been', 'arm']::text[], 9
FROM learning_games WHERE game_type = 'body'
UNION ALL
SELECT id, 'Wat zie je hier?', '💪', 'arm', ARRAY['been', 'arm', 'hand', 'voet']::text[], 10
FROM learning_games WHERE game_type = 'body'
UNION ALL
SELECT id, 'Wat zie je hier?', '🦵', 'been', ARRAY['arm', 'been', 'voet', 'hand']::text[], 11
FROM learning_games WHERE game_type = 'body'
UNION ALL
SELECT id, 'Wat zie je hier?', '👅', 'tong', ARRAY['mond', 'tong', 'tanden', 'lippen']::text[], 12
FROM learning_games WHERE game_type = 'body';

-- Weather Words (10 questions)
INSERT INTO game_questions (game_id, question, visual, answer, options, sort_order)
SELECT id, 'Wat is dit?', '☀️', 'zon', ARRAY['zon', 'regen', 'sneeuw', 'wind']::text[], 1
FROM learning_games WHERE game_type = 'weather'
UNION ALL
SELECT id, 'Wat is dit?', '🌧️', 'regen', ARRAY['wind', 'regen', 'zon', 'sneeuw']::text[], 2
FROM learning_games WHERE game_type = 'weather'
UNION ALL
SELECT id, 'Wat is dit?', '❄️', 'sneeuw', ARRAY['sneeuw', 'hagel', 'regen', 'mist']::text[], 3
FROM learning_games WHERE game_type = 'weather'
UNION ALL
SELECT id, 'Wat is dit?', '🌫️', 'mist', ARRAY['mist', 'wind', 'zon', 'regen']::text[], 4
FROM learning_games WHERE game_type = 'weather'
UNION ALL
SELECT id, 'Wat is dit?', '💨', 'wind', ARRAY['regen', 'sneeuw', 'wind', 'zon']::text[], 5
FROM learning_games WHERE game_type = 'weather'
UNION ALL
SELECT id, 'Wat is dit?', '☁️', 'bewolking', ARRAY['zon', 'bewolking', 'regen', 'mist']::text[], 6
FROM learning_games WHERE game_type = 'weather'
UNION ALL
SELECT id, 'Wat is dit?', '⛈️', 'onweer', ARRAY['regen', 'onweer', 'wind', 'sneeuw']::text[], 7
FROM learning_games WHERE game_type = 'weather'
UNION ALL
SELECT id, 'Wat is dit?', '🌈', 'regenboog', ARRAY['zon', 'regenboog', 'regen', 'wind']::text[], 8
FROM learning_games WHERE game_type = 'weather'
UNION ALL
SELECT id, 'Wat is dit?', '🌡️', 'temperatuur', ARRAY['temperatuur', 'zon', 'warmte', 'koude']::text[], 9
FROM learning_games WHERE game_type = 'weather'
UNION ALL
SELECT id, 'Wat is dit?', '🌨️', 'hagel', ARRAY['sneeuw', 'hagel', 'regen', 'mist']::text[], 10
FROM learning_games WHERE game_type = 'weather';

-- Position Words (15 questions)
INSERT INTO game_questions (game_id, question, visual, answer, options, sort_order)
SELECT id, 'De kat zit...de doos', '📦🐱', 'onder', ARRAY['boven', 'onder', 'naast', 'in']::text[], 1
FROM learning_games WHERE game_type = 'position'
UNION ALL
SELECT id, 'De kat zit...de doos', '🐱📦', 'op', ARRAY['boven', 'onder', 'op', 'naast']::text[], 2
FROM learning_games WHERE game_type = 'position'
UNION ALL
SELECT id, 'De kat zit...de doos', '📦(🐱)', 'in', ARRAY['op', 'in', 'onder', 'naast']::text[], 3
FROM learning_games WHERE game_type = 'position'
UNION ALL
SELECT id, 'De kat zit...de doos', '🐱 📦', 'naast', ARRAY['in', 'naast', 'onder', 'boven']::text[], 4
FROM learning_games WHERE game_type = 'position'
UNION ALL
SELECT id, 'De kat zit...de doos', '🐱→📦', 'voor', ARRAY['achter', 'voor', 'in', 'naast']::text[], 5
FROM learning_games WHERE game_type = 'position'
UNION ALL
SELECT id, 'De kat zit...de doos', '📦←🐱', 'achter', ARRAY['voor', 'achter', 'in', 'naast']::text[], 6
FROM learning_games WHERE game_type = 'position'
UNION ALL
SELECT id, 'De auto rijdt...het huis', '🏠 ← 🚗', 'naar', ARRAY['van', 'naar', 'in', 'uit']::text[], 7
FROM learning_games WHERE game_type = 'position'
UNION ALL
SELECT id, 'De eekhoorn zit...de bomen', '🌳 🐿️ 🌳', 'tussen', ARRAY['naast', 'voor', 'tussen', 'achter']::text[], 8
FROM learning_games WHERE game_type = 'position'
UNION ALL
SELECT id, 'De hond loopt naar...', '⬅️ 🐕', 'links', ARRAY['links', 'rechts', 'boven', 'onder']::text[], 9
FROM learning_games WHERE game_type = 'position'
UNION ALL
SELECT id, 'De hond loopt naar...', '🐕 ➡️', 'rechts', ARRAY['links', 'rechts', 'voor', 'achter']::text[], 10
FROM learning_games WHERE game_type = 'position'
UNION ALL
SELECT id, 'De boom is...het huis', '🏠........🌳', 'ver van', ARRAY['dichtbij', 'ver van', 'in', 'boven']::text[], 11
FROM learning_games WHERE game_type = 'position'
UNION ALL
SELECT id, 'De boom is...het huis', '🏠🌳', 'dichtbij', ARRAY['ver van', 'dichtbij', 'in', 'op']::text[], 12
FROM learning_games WHERE game_type = 'position'
UNION ALL
SELECT id, 'De ballon gaat...', '⬆️ 🎈', 'omhoog', ARRAY['omlaag', 'omhoog', 'links', 'rechts']::text[], 13
FROM learning_games WHERE game_type = 'position'
UNION ALL
SELECT id, 'De ballon gaat...', '🎈 ⬇️', 'omlaag', ARRAY['omhoog', 'omlaag', 'links', 'rechts']::text[], 14
FROM learning_games WHERE game_type = 'position'
UNION ALL
SELECT id, 'De kat is...het huis', '🏠\n⬇️\n🐱', 'buiten', ARRAY['binnen', 'buiten', 'boven', 'onder']::text[], 15
FROM learning_games WHERE game_type = 'position';

-- Rhyming (15 questions)
INSERT INTO game_questions (game_id, question, visual, answer, options, sort_order)
SELECT id, 'Wat rijmt op "kat"?', '🐱', 'mat', ARRAY['hond', 'mat', 'boom', 'vis']::text[], 1
FROM learning_games WHERE game_type = 'rhyme'
UNION ALL
SELECT id, 'Wat rijmt op "muis"?', '🐭', 'huis', ARRAY['kat', 'huis', 'deur', 'raam']::text[], 2
FROM learning_games WHERE game_type = 'rhyme'
UNION ALL
SELECT id, 'Wat rijmt op "boom"?', '🌳', 'room', ARRAY['blad', 'room', 'tak', 'bos']::text[], 3
FROM learning_games WHERE game_type = 'rhyme'
UNION ALL
SELECT id, 'Wat rijmt op "bal"?', '⚽', 'val', ARRAY['val', 'rond', 'speel', 'goal']::text[], 4
FROM learning_games WHERE game_type = 'rhyme'
UNION ALL
SELECT id, 'Wat rijmt op "vis"?', '🐟', 'lis', ARRAY['water', 'zee', 'lis', 'boot']::text[], 5
FROM learning_games WHERE game_type = 'rhyme'
UNION ALL
SELECT id, 'Wat rijmt op "beer"?', '🐻', 'peer', ARRAY['peer', 'bos', 'groot', 'bruin']::text[], 6
FROM learning_games WHERE game_type = 'rhyme'
UNION ALL
SELECT id, 'Wat rijmt op "boot"?', '⛵', 'groot', ARRAY['klein', 'water', 'groot', 'zee']::text[], 7
FROM learning_games WHERE game_type = 'rhyme'
UNION ALL
SELECT id, 'Wat rijmt op "hond"?', '🐕', 'rond', ARRAY['kat', 'rond', 'staart', 'blaf']::text[], 8
FROM learning_games WHERE game_type = 'rhyme'
UNION ALL
SELECT id, 'Wat rijmt op "zon"?', '☀️', 'kon', ARRAY['maan', 'kon', 'warm', 'licht']::text[], 9
FROM learning_games WHERE game_type = 'rhyme'
UNION ALL
SELECT id, 'Wat rijmt op "roos"?', '🌹', 'boos', ARRAY['bloem', 'boos', 'rood', 'tuin']::text[], 10
FROM learning_games WHERE game_type = 'rhyme'
UNION ALL
SELECT id, 'Wat rijmt op "been"?', '🦵', 'steen', ARRAY['arm', 'steen', 'voet', 'lopen']::text[], 11
FROM learning_games WHERE game_type = 'rhyme'
UNION ALL
SELECT id, 'Wat rijmt op "dak"?', '🏠', 'tak', ARRAY['huis', 'tak', 'raam', 'deur']::text[], 12
FROM learning_games WHERE game_type = 'rhyme'
UNION ALL
SELECT id, 'Wat rijmt op "maan"?', '🌙', 'baan', ARRAY['ster', 'baan', 'nacht', 'zon']::text[], 13
FROM learning_games WHERE game_type = 'rhyme'
UNION ALL
SELECT id, 'Wat rijmt op "kip"?', '🐔', 'schip', ARRAY['ei', 'schip', 'haan', 'veer']::text[], 14
FROM learning_games WHERE game_type = 'rhyme'
UNION ALL
SELECT id, 'Wat rijmt op "neus"?', '👃', 'reus', ARRAY['oog', 'reus', 'mond', 'oor']::text[], 15
FROM learning_games WHERE game_type = 'rhyme';

-- Comparing (15 questions)
INSERT INTO game_questions (game_id, question, visual, answer, options, sort_order)
SELECT id, 'Welke is groter?', '🐘 🐁', 'olifant', ARRAY['olifant', 'muis']::text[], 1
FROM learning_games WHERE game_type = 'sorting'
UNION ALL
SELECT id, 'Welke is hoger?', '🌳 🌸', 'boom', ARRAY['boom', 'bloem']::text[], 2
FROM learning_games WHERE game_type = 'sorting'
UNION ALL
SELECT id, 'Welke is sneller?', '🚗 🚲', 'auto', ARRAY['auto', 'fiets']::text[], 3
FROM learning_games WHERE game_type = 'sorting'
UNION ALL
SELECT id, 'Welke is groter?', '🍉 🍓', 'watermeloen', ARRAY['watermeloen', 'aardbei']::text[], 4
FROM learning_games WHERE game_type = 'sorting'
UNION ALL
SELECT id, 'Welke is sneller?', '🐌 🐇', 'konijn', ARRAY['slak', 'konijn']::text[], 5
FROM learning_games WHERE game_type = 'sorting'
UNION ALL
SELECT id, 'Welke is zwaarder?', '🪶 🪨', 'steen', ARRAY['veer', 'steen']::text[], 6
FROM learning_games WHERE game_type = 'sorting'
UNION ALL
SELECT id, 'Welke is hoger?', '🦒 🐕', 'giraf', ARRAY['giraf', 'hond']::text[], 7
FROM learning_games WHERE game_type = 'sorting'
UNION ALL
SELECT id, 'Welke is groter?', '🐋 🐟', 'walvis', ARRAY['walvis', 'vis']::text[], 8
FROM learning_games WHERE game_type = 'sorting'
UNION ALL
SELECT id, 'Welke is hoger?', '🏔️ 🏠', 'berg', ARRAY['berg', 'huis']::text[], 9
FROM learning_games WHERE game_type = 'sorting'
UNION ALL
SELECT id, 'Welke is kleiner?', '🐜 🐕', 'mier', ARRAY['mier', 'hond']::text[], 10
FROM learning_games WHERE game_type = 'sorting'
UNION ALL
SELECT id, 'Welke is warmer?', '❄️ 🔥', 'vuur', ARRAY['sneeuw', 'vuur']::text[], 11
FROM learning_games WHERE game_type = 'sorting'
UNION ALL
SELECT id, 'Welke is groter?', '🌊 💧', 'zee', ARRAY['zee', 'druppel']::text[], 12
FROM learning_games WHERE game_type = 'sorting'
UNION ALL
SELECT id, 'Welke is gevaarlijker?', '🦁 🐈', 'leeuw', ARRAY['leeuw', 'kat']::text[], 13
FROM learning_games WHERE game_type = 'sorting'
UNION ALL
SELECT id, 'Welke vliegt?', '🚂 🚁', 'helikopter', ARRAY['trein', 'helikopter']::text[], 14
FROM learning_games WHERE game_type = 'sorting'
UNION ALL
SELECT id, 'Welke zie je overdag?', '☀️ 🌙', 'zon', ARRAY['zon', 'maan']::text[], 15
FROM learning_games WHERE game_type = 'sorting';

-- Letter Recognition (15 questions)
INSERT INTO game_questions (game_id, question, visual, answer, options, sort_order)
SELECT id, 'Welke letter zie je?', '<span style="font-size:6rem;font-family:serif">A</span>', 'a', ARRAY['a', 'b', 'c', 'd']::text[], 1
FROM learning_games WHERE game_type = 'letters'
UNION ALL
SELECT id, 'Welke letter zie je?', '<span style="font-size:6rem;font-family:serif">B</span>', 'b', ARRAY['d', 'b', 'p', 'a']::text[], 2
FROM learning_games WHERE game_type = 'letters'
UNION ALL
SELECT id, 'Welke letter zie je?', '<span style="font-size:6rem;font-family:serif">M</span>', 'm', ARRAY['n', 'm', 'w', 'v']::text[], 3
FROM learning_games WHERE game_type = 'letters'
UNION ALL
SELECT id, 'Welke letter zie je?', '<span style="font-size:6rem;font-family:serif">S</span>', 's', ARRAY['z', 's', 'c', 'o']::text[], 4
FROM learning_games WHERE game_type = 'letters'
UNION ALL
SELECT id, 'Welke letter zie je?', '<span style="font-size:6rem;font-family:serif">O</span>', 'o', ARRAY['o', 'c', 'e', 'a']::text[], 5
FROM learning_games WHERE game_type = 'letters'
UNION ALL
SELECT id, 'Welke letter zie je?', '<span style="font-size:6rem;font-family:serif">P</span>', 'p', ARRAY['b', 'd', 'p', 'q']::text[], 6
FROM learning_games WHERE game_type = 'letters'
UNION ALL
SELECT id, 'Welke letter zie je?', '<span style="font-size:6rem;font-family:serif">T</span>', 't', ARRAY['l', 'i', 't', 'f']::text[], 7
FROM learning_games WHERE game_type = 'letters'
UNION ALL
SELECT id, 'Welke letter zie je?', '<span style="font-size:6rem;font-family:serif">E</span>', 'e', ARRAY['e', 'f', 'a', 'c']::text[], 8
FROM learning_games WHERE game_type = 'letters'
UNION ALL
SELECT id, 'Welke letter zie je?', '<span style="font-size:6rem;font-family:serif">R</span>', 'r', ARRAY['p', 'r', 'b', 'k']::text[], 9
FROM learning_games WHERE game_type = 'letters'
UNION ALL
SELECT id, 'Welke letter zie je?', '<span style="font-size:6rem;font-family:serif">I</span>', 'i', ARRAY['l', 'i', 'j', 't']::text[], 10
FROM learning_games WHERE game_type = 'letters'
UNION ALL
SELECT id, 'Welke letter zie je?', '<span style="font-size:6rem;font-family:serif">N</span>', 'n', ARRAY['m', 'n', 'h', 'u']::text[], 11
FROM learning_games WHERE game_type = 'letters'
UNION ALL
SELECT id, 'Welke letter zie je?', '<span style="font-size:6rem;font-family:serif">K</span>', 'k', ARRAY['x', 'k', 'h', 'r']::text[], 12
FROM learning_games WHERE game_type = 'letters'
UNION ALL
SELECT id, 'Welke letter zie je?', '<span style="font-size:6rem;font-family:serif">L</span>', 'l', ARRAY['i', 'l', 't', 'j']::text[], 13
FROM learning_games WHERE game_type = 'letters'
UNION ALL
SELECT id, 'Welke letter zie je?', '<span style="font-size:6rem;font-family:serif">D</span>', 'd', ARRAY['b', 'p', 'd', 'q']::text[], 14
FROM learning_games WHERE game_type = 'letters'
UNION ALL
SELECT id, 'Welke letter zie je?', '<span style="font-size:6rem;font-family:serif">G</span>', 'g', ARRAY['c', 'o', 'g', 'q']::text[], 15
FROM learning_games WHERE game_type = 'letters';

-- Senses (10 questions)
INSERT INTO game_questions (game_id, question, visual, answer, options, sort_order)
SELECT id, 'Waarmee kun je ZIEN?', '👀', 'ogen', ARRAY['oren', 'ogen', 'neus', 'huid']::text[], 1
FROM learning_games WHERE game_type = 'senses'
UNION ALL
SELECT id, 'Waarmee kun je HOREN?', '👂', 'oren', ARRAY['ogen', 'oren', 'mond', 'neus']::text[], 2
FROM learning_games WHERE game_type = 'senses'
UNION ALL
SELECT id, 'Waarmee kun je RUIKEN?', '👃', 'neus', ARRAY['neus', 'mond', 'ogen', 'oren']::text[], 3
FROM learning_games WHERE game_type = 'senses'
UNION ALL
SELECT id, 'Waarmee kun je PROEVEN?', '👅', 'tong', ARRAY['neus', 'tong', 'ogen', 'oren']::text[], 4
FROM learning_games WHERE game_type = 'senses'
UNION ALL
SELECT id, 'Waarmee kun je VOELEN?', '✋', 'huid', ARRAY['ogen', 'oren', 'huid', 'neus']::text[], 5
FROM learning_games WHERE game_type = 'senses'
UNION ALL
SELECT id, 'Welk zintuig gebruik je voor MUZIEK?', '🎵', 'horen', ARRAY['zien', 'horen', 'ruiken', 'proeven']::text[], 6
FROM learning_games WHERE game_type = 'senses'
UNION ALL
SELECT id, 'Welk zintuig gebruik je voor een BLOEM ruiken?', '🌹', 'ruiken', ARRAY['zien', 'horen', 'ruiken', 'voelen']::text[], 7
FROM learning_games WHERE game_type = 'senses'
UNION ALL
SELECT id, 'Welk zintuig gebruik je om SNOEP te proeven?', '🍭', 'proeven', ARRAY['zien', 'proeven', 'ruiken', 'horen']::text[], 8
FROM learning_games WHERE game_type = 'senses'
UNION ALL
SELECT id, 'Welk zintuig gebruik je voor TV kijken?', '📺', 'zien', ARRAY['zien', 'horen', 'voelen', 'proeven']::text[], 9
FROM learning_games WHERE game_type = 'senses'
UNION ALL
SELECT id, 'Welk zintuig zegt je dat ijs KOUD is?', '🧊', 'voelen', ARRAY['zien', 'proeven', 'voelen', 'horen']::text[], 10
FROM learning_games WHERE game_type = 'senses';

-- Life Cycle (10 questions)
INSERT INTO game_questions (game_id, question, visual, answer, options, sort_order)
SELECT id, 'Wat doet een zaad?', '🥒➡️🌱', 'kiemen', ARRAY['kiemen', 'sterven', 'vliegen', 'zwemmen']::text[], 1
FROM learning_games WHERE game_type = 'lifecycle'
UNION ALL
SELECT id, 'Dit is een...', '👶', 'baby', ARRAY['volwassene', 'baby', 'tiener', 'kleuter']::text[], 2
FROM learning_games WHERE game_type = 'lifecycle'
UNION ALL
SELECT id, 'De boom doet...', '🌱➡️🌳', 'groeien', ARRAY['krimpen', 'groeien', 'vliegen', 'sterven']::text[], 3
FROM learning_games WHERE game_type = 'lifecycle'
UNION ALL
SELECT id, 'De rups wordt een...', '🐛➡️🦋', 'vlinder', ARRAY['bij', 'vlinder', 'vogel', 'spin']::text[], 4
FROM learning_games WHERE game_type = 'lifecycle'
UNION ALL
SELECT id, 'Uit het ei komt een...', '��➡️🐣', 'kuiken', ARRAY['vis', 'kuiken', 'slang', 'muis']::text[], 5
FROM learning_games WHERE game_type = 'lifecycle'
UNION ALL
SELECT id, 'Na baby komt...', '👶➡️🧒', 'peuter', ARRAY['volwassene', 'baby', 'peuter', 'tiener']::text[], 6
FROM learning_games WHERE game_type = 'lifecycle'
UNION ALL
SELECT id, 'Na peuter komt...', '🧒➡️👦', 'kleuter', ARRAY['baby', 'kleuter', 'volwassene', 'peuter']::text[], 7
FROM learning_games WHERE game_type = 'lifecycle'
UNION ALL
SELECT id, 'Na de bloem komt de...', '🌸➡️🍎', 'vrucht', ARRAY['wortel', 'vrucht', 'blad', 'stengel']::text[], 8
FROM learning_games WHERE game_type = 'lifecycle'
UNION ALL
SELECT id, 'De puppy wordt een...', '🐕➡️🐕‍🦺', 'volwassen hond', ARRAY['kat', 'paard', 'volwassen hond', 'vis']::text[], 9
FROM learning_games WHERE game_type = 'lifecycle'
UNION ALL
SELECT id, 'Dit deel van de plant noemen we...', '🌿', 'blad', ARRAY['wortel', 'bloem', 'blad', 'stam']::text[], 10
FROM learning_games WHERE game_type = 'lifecycle';

-- Patterns (10 questions)
INSERT INTO game_questions (game_id, question, visual, answer, options, sort_order)
SELECT id, 'Wat komt er?', '🔴🔵🔴🔵🔴❓', '🔵', ARRAY['🔴', '🔵', '🟢', '🟡']::text[], 1
FROM learning_games WHERE game_type = 'patterns'
UNION ALL
SELECT id, 'Wat komt er?', '⭐⭐🌙⭐⭐🌙⭐⭐❓', '🌙', ARRAY['⭐', '🌙', '☀️', '🌟']::text[], 2
FROM learning_games WHERE game_type = 'patterns'
UNION ALL
SELECT id, 'Wat komt er?', '🍎🍎🍌🍎🍎🍌🍎🍎❓', '🍌', ARRAY['🍎', '🍌', '🍊', '🍇']::text[], 3
FROM learning_games WHERE game_type = 'patterns'
UNION ALL
SELECT id, 'Wat komt er?', '🔺🔺🔻🔺🔺🔻🔺🔺❓', '🔻', ARRAY['🔺', '🔻', '⬜', '🔵']::text[], 4
FROM learning_games WHERE game_type = 'patterns'
UNION ALL
SELECT id, 'Wat komt er?', '🐱🐶🐱🐶🐱❓', '🐶', ARRAY['🐱', '🐶', '🐰', '🐻']::text[], 5
FROM learning_games WHERE game_type = 'patterns'
UNION ALL
SELECT id, 'Wat komt er?', '1️⃣2️⃣1️⃣2️⃣1️⃣❓', '2️⃣', ARRAY['1️⃣', '2️⃣', '3️⃣', '0️⃣']::text[], 6
FROM learning_games WHERE game_type = 'patterns'
UNION ALL
SELECT id, 'Wat komt er?', '🟢🟢🔴🟢🟢🔴🟢🟢❓', '🔴', ARRAY['🟢', '🔴', '🔵', '🟡']::text[], 7
FROM learning_games WHERE game_type = 'patterns'
UNION ALL
SELECT id, 'Wat komt er?', '❤️💙❤️💙❤️💙❤️❓', '💙', ARRAY['❤️', '💙', '💚', '💛']::text[], 8
FROM learning_games WHERE game_type = 'patterns'
UNION ALL
SELECT id, 'Wat komt er?', '⬆️⬇️⬆️⬇️⬆️❓', '⬇️', ARRAY['⬆️', '⬇️', '⬅️', '➡️']::text[], 9
FROM learning_games WHERE game_type = 'patterns'
UNION ALL
SELECT id, 'Wat komt er?', '🌸🌸🌼🌸🌸🌼🌸🌸❓', '🌼', ARRAY['🌸', '🌼', '🌹', '🌻']::text[], 10
FROM learning_games WHERE game_type = 'patterns';

-- Geography (12 questions)
INSERT INTO game_questions (game_id, question, visual, answer, options, sort_order)
SELECT id, 'In welk land wonen wij?', '🇧🇪', 'België', ARRAY['Nederland', 'België', 'Frankrijk', 'Duitsland']::text[], 1
FROM learning_games WHERE game_type = 'geography'
UNION ALL
SELECT id, 'Welke rivier stroomt door België?', '🌊〰️', 'de Schelde', ARRAY['de Nijl', 'de Schelde', 'de Amazone', 'de Rijn']::text[], 2
FROM learning_games WHERE game_type = 'geography'
UNION ALL
SELECT id, 'Welke rivier stroomt door Egypte?', '🇪🇬🏛️', 'de Nijl', ARRAY['de Nijl', 'de Schelde', 'de Maas', 'de Zee']::text[], 3
FROM learning_games WHERE game_type = 'geography'
UNION ALL
SELECT id, 'Hoe noemen we de hele wereld?', '🌍', 'de aarde', ARRAY['de maan', 'de aarde', 'de zon', 'de ster']::text[], 4
FROM learning_games WHERE game_type = 'geography'
UNION ALL
SELECT id, 'Wat is er het MEESTE op aarde?', '🌍🌊', 'water', ARRAY['water', 'land', 'bergen', 'bomen']::text[], 5
FROM learning_games WHERE game_type = 'geography'
UNION ALL
SELECT id, 'Waar woont de ijsbeer?', '❄️🐻‍❄️', 'noordpool', ARRAY['zuidpool', 'noordpool', 'België', 'Afrika']::text[], 6
FROM learning_games WHERE game_type = 'geography'
UNION ALL
SELECT id, 'Waar woont de pinguïn?', '🐧❄️', 'zuidpool', ARRAY['noordpool', 'zuidpool', 'Europa', 'Egypte']::text[], 7
FROM learning_games WHERE game_type = 'geography'
UNION ALL
SELECT id, 'Wat geeft ons licht overdag?', '☀️', 'de zon', ARRAY['de maan', 'de sterren', 'de zon', 'de lamp']::text[], 8
FROM learning_games WHERE game_type = 'geography'
UNION ALL
SELECT id, 'Wat zie je s nachts aan de hemel?', '🌙⭐', 'de maan en sterren', ARRAY['de zon', 'de maan en sterren', 'wolken', 'vogels']::text[], 9
FROM learning_games WHERE game_type = 'geography'
UNION ALL
SELECT id, 'Wat doet de aarde de hele tijd?', '🌍🔄', 'draaien', ARRAY['stilstaan', 'draaien', 'springen', 'vallen']::text[], 10
FROM learning_games WHERE game_type = 'geography'
UNION ALL
SELECT id, 'Waarom is het soms dag?', '🌍➡️☀️', 'de zon schijnt', ARRAY['de maan schijnt', 'de zon schijnt', 'het regent', 'het sneeuwt']::text[], 11
FROM learning_games WHERE game_type = 'geography'
UNION ALL
SELECT id, 'Op welk continent ligt België?', '🗺️', 'Europa', ARRAY['Afrika', 'Europa', 'Azië', 'Amerika']::text[], 12
FROM learning_games WHERE game_type = 'geography';

-- Ranking (10 questions)
INSERT INTO game_questions (game_id, question, visual, answer, options, sort_order)
SELECT id, 'Wie wint de gouden medaille?', '🥇🥈🥉', 'de eerste', ARRAY['de eerste', 'de tweede', 'de derde', 'de laatste']::text[], 1
FROM learning_games WHERE game_type = 'ranking'
UNION ALL
SELECT id, 'Welk cijfer komt NA de tweede?', '1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣', 'de derde', ARRAY['de eerste', 'de derde', 'de vierde', 'de tweede']::text[], 2
FROM learning_games WHERE game_type = 'ranking'
UNION ALL
SELECT id, 'De beer is de...', '🐢🐇🦊🐻🦁', 'vierde', ARRAY['derde', 'vierde', 'vijfde', 'tweede']::text[], 3
FROM learning_games WHERE game_type = 'ranking'
UNION ALL
SELECT id, 'De peer is de...', '🍎🍊🍋🍐🍇', 'vierde', ARRAY['derde', 'vijfde', 'vierde', 'tweede']::text[], 4
FROM learning_games WHERE game_type = 'ranking'
UNION ALL
SELECT id, 'De laatste ster is de...', '⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐', 'tiende', ARRAY['negende', 'tiende', 'achtste', 'zevende']::text[], 5
FROM learning_games WHERE game_type = 'ranking'
UNION ALL
SELECT id, 'De ambulance is de...', '🚗🚌🚎🚐🚑', 'vijfde', ARRAY['vierde', 'vijfde', 'derde', 'zesde']::text[], 6
FROM learning_games WHERE game_type = 'ranking'
UNION ALL
SELECT id, 'Het zesde boek is het...', '📚📚📚📚📚📚', 'laatste', ARRAY['eerste', 'vijfde', 'laatste', 'vierde']::text[], 7
FROM learning_games WHERE game_type = 'ranking'
UNION ALL
SELECT id, 'Hoeveel kikkers zijn er?', '🐸🐸🐸🐸🐸🐸🐸', 'zeven', ARRAY['zes', 'zeven', 'acht', 'vijf']::text[], 8
FROM learning_games WHERE game_type = 'ranking'
UNION ALL
SELECT id, 'De achtste ballon is de...', '🎈🎈🎈🎈🎈🎈🎈🎈', 'laatste', ARRAY['zevende', 'laatste', 'zesde', 'negende']::text[], 9
FROM learning_games WHERE game_type = 'ranking'
UNION ALL
SELECT id, 'De eerste bloem staat...', '🌺🌺🌺', 'vooraan', ARRAY['achteraan', 'vooraan', 'in het midden', 'laatste']::text[], 10
FROM learning_games WHERE game_type = 'ranking';

-- Subitizing (12 questions)
INSERT INTO game_questions (game_id, question, visual, answer, options, sort_order)
SELECT id, 'Hoeveel zie je?', '⚫', '1', ARRAY['1', '2', '3']::text[], 1
FROM learning_games WHERE game_type = 'subitize'
UNION ALL
SELECT id, 'Hoeveel zie je?', '⚫⚫', '2', ARRAY['1', '2', '3']::text[], 2
FROM learning_games WHERE game_type = 'subitize'
UNION ALL
SELECT id, 'Hoeveel zie je?', '⚫⚫⚫', '3', ARRAY['2', '3', '4']::text[], 3
FROM learning_games WHERE game_type = 'subitize'
UNION ALL
SELECT id, 'Hoeveel zie je?', '⚫⚫<br>⚫⚫', '4', ARRAY['3', '4', '5']::text[], 4
FROM learning_games WHERE game_type = 'subitize'
UNION ALL
SELECT id, 'Hoeveel zie je?', '⚫⚫<br>⚫⚫⚫', '5', ARRAY['4', '5', '6']::text[], 5
FROM learning_games WHERE game_type = 'subitize'
UNION ALL
SELECT id, 'Hoeveel zie je op de dobbelsteen?', '🎲 ⚀', '1', ARRAY['1', '2', '3']::text[], 6
FROM learning_games WHERE game_type = 'subitize'
UNION ALL
SELECT id, 'Hoeveel zie je op de dobbelsteen?', '🎲 ⚁', '2', ARRAY['1', '2', '3']::text[], 7
FROM learning_games WHERE game_type = 'subitize'
UNION ALL
SELECT id, 'Hoeveel zie je op de dobbelsteen?', '🎲 ⚂', '3', ARRAY['2', '3', '4']::text[], 8
FROM learning_games WHERE game_type = 'subitize'
UNION ALL
SELECT id, 'Hoeveel zie je op de dobbelsteen?', '🎲 ⚃', '4', ARRAY['3', '4', '5']::text[], 9
FROM learning_games WHERE game_type = 'subitize'
UNION ALL
SELECT id, 'Hoeveel zie je op de dobbelsteen?', '🎲 ⚄', '5', ARRAY['4', '5', '6']::text[], 10
FROM learning_games WHERE game_type = 'subitize'
UNION ALL
SELECT id, 'Hoeveel vingers heeft een hand?', '✋', '5', ARRAY['4', '5', '6']::text[], 11
FROM learning_games WHERE game_type = 'subitize'
UNION ALL
SELECT id, 'Hoeveel ogen heb je?', '👀', '2', ARRAY['1', '2', '3']::text[], 12
FROM learning_games WHERE game_type = 'subitize';

-- Money (10 questions)
INSERT INTO game_questions (game_id, question, visual, answer, options, sort_order)
SELECT id, 'Dit is een...', '🪙', 'munt', ARRAY['munt', 'biljet', 'kaart', 'bon']::text[], 1
FROM learning_games WHERE game_type = 'money'
UNION ALL
SELECT id, 'Dit is een...', '💵', 'biljet', ARRAY['munt', 'biljet', 'kaart', 'bon']::text[], 2
FROM learning_games WHERE game_type = 'money'
UNION ALL
SELECT id, 'In de winkel moet je...', '🛒💶', 'betalen', ARRAY['betalen', 'stelen', 'wachten', 'slapen']::text[], 3
FROM learning_games WHERE game_type = 'money'
UNION ALL
SELECT id, 'Het snoepje...1 euro', '🍬 = 1€', 'kost', ARRAY['kost', 'weegt', 'eet', 'slaapt']::text[], 4
FROM learning_games WHERE game_type = 'money'
UNION ALL
SELECT id, 'Speelgoed wisselen heet...', '🧸🔄🚗', 'ruilen', ARRAY['kopen', 'ruilen', 'stelen', 'gooien']::text[], 5
FROM learning_games WHERE game_type = 'money'
UNION ALL
SELECT id, 'Met geld kun je dingen...', '💶💶', 'kopen', ARRAY['kopen', 'eten', 'drinken', 'gooien']::text[], 6
FROM learning_games WHERE game_type = 'money'
UNION ALL
SELECT id, 'Op het kaartje staat de...', '🏷️ 2€', 'prijs', ARRAY['naam', 'prijs', 'kleur', 'grootte']::text[], 7
FROM learning_games WHERE game_type = 'money'
UNION ALL
SELECT id, 'Dit symbool is van de...', '€', 'euro', ARRAY['euro', 'dollar', 'pond', 'yen']::text[], 8
FROM learning_games WHERE game_type = 'money'
UNION ALL
SELECT id, 'Na het kiezen moet je...', '🛍️💳', 'afrekenen', ARRAY['wegrennen', 'afrekenen', 'slapen', 'eten']::text[], 9
FROM learning_games WHERE game_type = 'money'
UNION ALL
SELECT id, 'Geld bewaar je in een...', '👛', 'portemonnee', ARRAY['portemonnee', 'koelkast', 'bed', 'auto']::text[], 10
FROM learning_games WHERE game_type = 'money';

-- Seasons (10 questions)
INSERT INTO game_questions (game_id, question, visual, answer, options, sort_order)
SELECT id, 'Welk seizoen is dit?', '🌸🌷🌱', 'lente', ARRAY['lente', 'zomer', 'herfst', 'winter']::text[], 1
FROM learning_games WHERE game_type = 'seasons'
UNION ALL
SELECT id, 'Welk seizoen is dit?', '☀️🏖️🌴', 'zomer', ARRAY['lente', 'zomer', 'herfst', 'winter']::text[], 2
FROM learning_games WHERE game_type = 'seasons'
UNION ALL
SELECT id, 'Welk seizoen is dit?', '🍂🍁🎃', 'herfst', ARRAY['lente', 'zomer', 'herfst', 'winter']::text[], 3
FROM learning_games WHERE game_type = 'seasons'
UNION ALL
SELECT id, 'Welk seizoen is dit?', '❄️⛄🧣', 'winter', ARRAY['lente', 'zomer', 'herfst', 'winter']::text[], 4
FROM learning_games WHERE game_type = 'seasons'
UNION ALL
SELECT id, 'In welk seizoen worden veel dieren geboren?', '🐣🌈', 'lente', ARRAY['lente', 'zomer', 'herfst', 'winter']::text[], 5
FROM learning_games WHERE game_type = 'seasons'
UNION ALL
SELECT id, 'In welk seizoen ga je zwemmen?', '🏊‍♂️🍦', 'zomer', ARRAY['lente', 'zomer', 'herfst', 'winter']::text[], 6
FROM learning_games WHERE game_type = 'seasons'
UNION ALL
SELECT id, 'In welk seizoen is Kerstmis?', '🎄🎁', 'winter', ARRAY['lente', 'zomer', 'herfst', 'winter']::text[], 7
FROM learning_games WHERE game_type = 'seasons'
UNION ALL
SELECT id, 'In welk seizoen begint school?', '🍎📚', 'herfst', ARRAY['lente', 'zomer', 'herfst', 'winter']::text[], 8
FROM learning_games WHERE game_type = 'seasons'
UNION ALL
SELECT id, 'Wanneer draag je wanten?', '🧤❄️', 'winter', ARRAY['lente', 'zomer', 'herfst', 'winter']::text[], 9
FROM learning_games WHERE game_type = 'seasons'
UNION ALL
SELECT id, 'Wanneer groeien zonnebloemen?', '🌻🌽', 'zomer', ARRAY['lente', 'zomer', 'herfst', 'winter']::text[], 10
FROM learning_games WHERE game_type = 'seasons';

-- Update question counts for all games
UPDATE learning_games SET question_count = 15 WHERE game_type = 'animals';
UPDATE learning_games SET question_count = 12 WHERE game_type = 'body';
UPDATE learning_games SET question_count = 10 WHERE game_type = 'weather';
UPDATE learning_games SET question_count = 15 WHERE game_type = 'position';
UPDATE learning_games SET question_count = 15 WHERE game_type = 'rhyme';
UPDATE learning_games SET question_count = 15 WHERE game_type = 'sorting';
UPDATE learning_games SET question_count = 15 WHERE game_type = 'letters';
UPDATE learning_games SET question_count = 10 WHERE game_type = 'senses';
UPDATE learning_games SET question_count = 10 WHERE game_type = 'lifecycle';
UPDATE learning_games SET question_count = 10 WHERE game_type = 'patterns';
UPDATE learning_games SET question_count = 12 WHERE game_type = 'geography';
UPDATE learning_games SET question_count = 10 WHERE game_type = 'ranking';
UPDATE learning_games SET question_count = 12 WHERE game_type = 'subitize';
UPDATE learning_games SET question_count = 10 WHERE game_type = 'money';
UPDATE learning_games SET question_count = 10 WHERE game_type = 'seasons';