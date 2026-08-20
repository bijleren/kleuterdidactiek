/*
  # Schrijftab: concrete deelvaardigheden toevoegen

  De tab had acht oefeningen, precies een per minimumdoel 1.2.1 tot 1.2.8.
  De leerplannen van de drie netten benoemen binnen die doelen veel concretere
  stappen die als oefening ontbraken: horizontale en verticale lijnen, schuine
  en gebogen lijnen, cirkels, vierhoeken, driehoeken, spiralen, keerpunten,
  schriftligging, kleurtoonverloop en evenwijdig arceren. Bron per blok in het
  commentaar.

  goal_codes bevat alleen het minimumdoel. De leerplandoelen per net worden
  afgeleid via leerplandoel_minimumdoelen, zoals afgesproken voor
  platforminhoud: deze oefeningen worden door scholen van alle netten gebruikt,
  dus er hangt geen net aan vast.

  1.2.9 en 1.2.10 staan wel in minimumdoelen en in de leerplankoppelingen, maar
  nog niet in educational_goals. De drie oefeningen die daarnaar verwijzen
  tonen hun leerplandoelen correct, maar zijn nog niet filterbaar op de
  doelenpagina zolang die twee rijen ontbreken.

  Van 8 naar 23 oefeningen.
*/

insert into public.writing_exercises
  (title, emoji, exercise_type, goal_codes, description, instructions, tips, sort_order)
values
-- 1.2.1 pengreep
('Schrijfmaterialen verkennen', '🖌️', 'materialen', array['1.2.1'],
 'Verschillende schrijfmaterialen uitproberen',
 'Laat de kleuters schrijven en tekenen met dik en dun materiaal: krijt, dikke stift, penseel, potlood, vingerverf. Let op hoe de vingers bewegen, niet op het resultaat.',
 array['Begin groot en verticaal: op een bord of een blad aan de muur.','Dik materiaal eerst; dunne potloden vragen al veel vingercontrole.','Benoem wat je ziet: "jouw vingers bewegen mee".'], 2),

-- 1.2.2 schrijfhouding
('Schriftligging', '📄', 'schriftligging', array['1.2.2'],
 'Het blad juist leggen om te schrijven',
 'Leer de kleuters het blad lichtjes schuin te leggen, in de richting van de schrijfhand, en het met de andere hand vast te houden.',
 array['Rechtshandig: blad iets naar links gedraaid. Linkshandig: naar rechts.','De niet-schrijvende hand houdt het blad vast, die ligt niet stil in de schoot.','Plak eventueel een merkteken op de tafel als geheugensteun.'], 4),

-- 1.2.3 lijnen
('Horizontale en verticale lijnen', '➕', 'lijnen_recht', array['1.2.3'],
 'Rechte lijnen van links naar rechts en van boven naar onder',
 'Laat de kleuters rechte lijnen trekken tussen twee punten: eerst groot op een verticaal vlak, daarna op papier.',
 array['Van links naar rechts en van boven naar onder: dezelfde richting als bij het schrijven.','Eerst met de hele arm, pas daarna met de vingers.'], 6),
('Schuine en gebogen lijnen', '〽️', 'lijnen_gebogen', array['1.2.3'],
 'Schuine lijnen en bogen maken',
 'Laat de kleuters schuine lijnen en golvende bogen trekken. Laat de beweging eerst in de lucht maken, dan op papier.',
 array['Bogen vragen een vloeiende pols; laat ze niet stoppen halverwege.','Muziek of een verhaal helpt om de beweging door te trekken.'], 7),
('Cirkels tekenen', '⭕', 'cirkel', array['1.2.3'],
 'Een cirkel tekenen in één vloeiende beweging',
 'Laat de kleuters cirkels tekenen met een doorlopende draaibeweging, tegen de klok in.',
 array['De draairichting tegen de klok in bereidt letters als a, c, d en g voor.','Grote cirkels op een bord eerst, kleine op papier daarna.'], 8),
('Vierhoeken tekenen', '⬜', 'vierhoek', array['1.2.3'],
 'Een vierhoek tekenen met hoeken',
 'Laat de kleuters een vierkant of rechthoek tekenen: vier rechte lijnen met een duidelijke stop in elke hoek.',
 array['Benoem de stop: "en stop, en draai".','Laat ze de vorm eerst met de vinger natrekken.'], 9),
('Driehoeken tekenen', '🔺', 'driehoek', array['1.2.3'],
 'Een driehoek tekenen met schuine lijnen',
 'Laat de kleuters een driehoek tekenen. De schuine lijnen zijn moeilijker dan de rechte van een vierhoek.',
 array['Doe dit pas als vierhoeken lukken.','Laat ze de punt bovenaan beginnen.'], 10),
('Spiralen tekenen', '🌀', 'spiraal', array['1.2.3'],
 'Een spiraal tekenen zonder te stoppen',
 'Laat de kleuters van buiten naar binnen draaien in één doorlopende beweging, zonder de lijnen te raken.',
 array['Een spiraal vraagt gedoseerde druk en een losse pols.','Laat ze eerst met de vinger in zand of scheerschuim draaien.'], 11),

-- 1.2.4 schrijfpatronen
('Patronen met keerpunten', '🔁', 'patronen_keerpunt', array['1.2.4'],
 'Patronen met kruispunten, keerpunten en draairichting',
 'Laat de kleuters patronen schrijven waarin de lijn keert, kruist of van draairichting verandert: lussen, guirlandes, arcaden.',
 array['Het keerpunt is het moeilijkste moment; laat het traag maken.','Eerst zonder liniatuur, daarna tussen twee lijnen.'], 13),

-- 1.2.5 kleuren
('Grote vlakken inkleuren', '🎨', 'kleuren_groot', array['1.2.5'],
 'Grote vlakken inkleuren, voor de jongste kleuters',
 'Laat de kleuters grote, eenvoudige vormen inkleuren met dik materiaal. De lijn hoeft nog niet gerespecteerd te worden.',
 array['Dit is de opstap naar egaal binnen de lijntjes kleuren.','Dikke waskrijtjes vragen minder kracht dan potloden.'], 15),
('Kleurtoonverloop', '🌈', 'kleurtoon', array['1.2.5'],
 'Kleuren met verschil in kleurtoon',
 'Laat de kleuters met wisselende druk kleuren, zodat lichte en donkere zones ontstaan in dezelfde kleur.',
 array['Dit oefent de druk op het schrijfmateriaal, wat later helpt bij het schrijven.','Laat ze de overgang vergelijken: waar is het donker, waar licht?'], 16),

-- 1.2.6 arceren
('Arceren met evenwijdige lijnen', '▦', 'arceren_evenwijdig', array['1.2.6'],
 'Arceren met gelijke tussenruimtes',
 'Laat de kleuters een vlak arceren met lijnen die evenwijdig lopen en even ver uit elkaar liggen.',
 array['Gelijke tussenruimte vraagt controle en overzicht; laat het rustig aan.','Laat ze eerst de richting van de lijnen kiezen en die volhouden.'], 18),

-- 1.2.9 functie van schrift (minimumdoel zit nog niet in educational_goals)
('Waarvoor dient schrift?', '📖', 'functie_schrift', array['1.2.9'],
 'Ontdekken waarom mensen schrijven',
 'Bekijk samen briefjes, boodschappenlijstjes, pictogrammen en verkeersborden. Praat over wat ze betekenen en waarom iemand het opschreef.',
 array['Gebruik echte voorbeelden uit de klas: een naamkaartje, de kalender, een uitnodiging.','Laat kleuters zelf een boodschap "schrijven" met tekeningen of tekens.'], 21),
('Mijn naam schrijven', '🔤', 'naam_schrijven', array['1.2.9'],
 'De eigen voornaam leren schrijven',
 'Laat de kleuters hun voornaam natrekken en daarna zelf schrijven, met een naamkaartje als voorbeeld.',
 array['De eigen naam is voor veel kleuters het eerste wat ze willen schrijven.','Hoofdletter vooraan, de rest klein: zo staat het ook op hun naamkaartje.'], 22),

-- 1.2.10 ideeen voor een tekst
('Ideeën voor een tekst', '💡', 'tekstideeen', array['1.2.10'],
 'Samen bedenken wat er in een tekst komt',
 'Laat de kleuters vertellen wat er in een brief, verslag of verhaal moet staan. Jij schrijft mee op; zij bepalen de inhoud.',
 array['Vertrek van iets echts: een bedankbriefje, een uitnodiging, een verslag van de uitstap.','Laat hen de volgorde bepalen: wat eerst, wat daarna?'], 23);

/* De bestaande acht mee in de nieuwe volgorde, zodat de tab een opbouw volgt. */
update public.writing_exercises set sort_order = 1  where exercise_type = 'pengreep';
update public.writing_exercises set sort_order = 3  where exercise_type = 'houding';
update public.writing_exercises set sort_order = 5  where exercise_type = 'lijnen';
update public.writing_exercises set sort_order = 12 where exercise_type = 'patronen';
update public.writing_exercises set sort_order = 14 where exercise_type = 'kleuren';
update public.writing_exercises set sort_order = 17 where exercise_type = 'arceren';
update public.writing_exercises set sort_order = 19 where exercise_type = 'richting';
update public.writing_exercises set sort_order = 20 where exercise_type = 'ideeen';
