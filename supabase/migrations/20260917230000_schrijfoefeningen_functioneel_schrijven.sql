/*
  # Schrijf: oefeningen voor functioneel schrijven

  De tab telde 23 oefeningen, waarvan er 19 over motoriek gingen (1.2.1 t/m
  1.2.7) en 4 over functioneel schrijven (1.2.8 t/m 1.2.10). In de leerplannen
  ligt dat anders: van de 81 leerplandoelen bij de schrijfdoelen gaan er 37 over
  functioneel schrijven. Die kant was dus sterk ondervertegenwoordigd.

  Deze migratie voegt twaalf oefeningen toe, elk gebaseerd op leerplandoelen die
  nog nergens in de tab terugkwamen. Het doelnummer van het net staat telkens in
  de bijhorende opmerking.

  Daarnaast krijgt sort_order een doorlopende nummering per doel, zodat de
  nieuwe oefeningen bij hun doel staan en niet achteraan de lijst.
*/

INSERT INTO writing_exercises (title, emoji, goal_codes, description, instructions, tips, exercise_type, sort_order, is_active)
VALUES
  -- 1.2.7 — GO! NL.149: de schrijfrichting beschrijven, niet alleen toepassen
  ('Schrijfrichting benoemen', '🧭', ARRAY['1.2.7'],
   'Vertellen hoe je op een blad schrijft',
   'Laat de kleuters in hun eigen woorden zeggen waar je begint en welke kant je opgaat. Wijs het samen aan op een prentenboek of op een tekst in de klas.',
   ARRAY['Vraag: waar begint de juf met schrijven?', 'Laat een kleuter de weg met de vinger volgen', 'Linksboven beginnen, naar rechts, dan een regel zakken'],
   'richting_benoemen', 100, true),

  -- 1.2.8 — GO! NL.251: de betekenis van het eigen schrijfproduct weergeven
  ('Vertel over je tekening', '🗣️', ARRAY['1.2.8'],
   'Uitleggen wat je hebt vastgelegd',
   'Laat de kleuter na het tekenen of krabbelen vertellen wat er staat. Schrijf hun woorden eronder, zodat ze zien dat hun boodschap bewaard blijft.',
   ARRAY['Vraag niet "wat is dit?" maar "wat vertel je hier?"', 'Schrijf hun zin letterlijk op', 'Lees de zin samen terug'],
   'betekenis_vertellen', 101, true),

  -- 1.2.8 — GO! NL.252: een specifiek stuk uit het schrijfproduct terugvinden
  ('Zoek het in je tekening', '🔍', ARRAY['1.2.8'],
   'Een vraag beantwoorden met je eigen werk',
   'Stel een gerichte vraag over de tekening of krabbel die de kleuter maakte en laat hen het juiste stuk aanwijzen.',
   ARRAY['Vraag: waar staat wat jullie eerst deden?', 'Laat aanwijzen in plaats van navertellen', 'Werkt ook bij een gezamenlijk klasverslag'],
   'terugzoeken', 102, true),

  -- 1.2.8 — GO! NL.253: schrijven geïntegreerd tijdens het spel
  ('Schrijven in de hoeken', '🏪', ARRAY['1.2.8'],
   'Schrijfmateriaal een plek geven in het spel',
   'Leg papier en potlood in de winkel-, dokters- of bouwhoek en speel mee: een bestelling noteren, een briefje voor de patiënt, een bordje bij de toren.',
   ARRAY['Doe het zelf een keer voor in het spel', 'Krabbels tellen even goed mee als letters', 'Laat het materiaal staan, ook zonder opdracht'],
   'schrijven_in_spel', 103, true),

  -- 1.2.8 — OVSG NED stv 9.1: waarnemingen op een eenvoudige wijze registreren
  ('Waarnemingen noteren', '🌱', ARRAY['1.2.8'],
   'Bijhouden wat je ziet gebeuren',
   'Laat de kleuters over een paar dagen vastleggen wat ze zien: de boon die groeit, het weer van vandaag, wie er aanwezig is. Tekenen, streepjes of stickers volstaan.',
   ARRAY['Hang het blad op ooghoogte', 'Elke dag hetzelfde moment', 'Kijk samen terug: wat is er veranderd?'],
   'waarnemen_noteren', 104, true),

  -- 1.2.9 — OVSG NED stv 5.5 en 1.3: pictogrammen functioneel gebruiken
  ('Pictogrammen in de klas', '🚻', ARRAY['1.2.9'],
   'Tekens die iets duidelijk maken',
   'Zoek samen de pictogrammen in en rond de school en bedenk zelf een teken voor iets in de klas: waar het materiaal hoort, hoeveel kleuters in de hoek mogen.',
   ARRAY['Start bij tekens die ze al kennen', 'Laat hen zelf een teken bedenken en ophangen', 'Controleer samen of iedereen het begrijpt'],
   'pictogrammen', 105, true),

  -- 1.2.9 — OVSG NED stv 5.3: een uitnodiging of wensbrief schrijven
  ('Een uitnodiging maken', '✉️', ARRAY['1.2.9'],
   'Iets schrijven voor iemand anders',
   'Maak samen een uitnodiging of een kaartje: voor het oudermoment, voor een jarige of voor een zieke kleuter. Ieder vult aan met tekeningen, tekens of letters.',
   ARRAY['Bespreek eerst voor wie het is', 'Laat hen zelf iets toevoegen, ook al is het een krabbel', 'Geef de kaart echt af'],
   'uitnodiging', 106, true),

  -- 1.2.9 — OVSG NED stv 6.2: boodschappen worden bewaard en opnieuw opgeroepen
  ('Bewaar de boodschap', '📮', ARRAY['1.2.9'],
   'Ontdekken dat geschreven taal blijft',
   'Laat een kleuter iets tekenen of dicteren, hang het op en haal het later in de week terug boven. Klopt het nog met wat ze toen bedoelden?',
   ARRAY['Gebruik een klasbrievenbus of prikbord', 'Kom er dagen later op terug', 'Vergelijk met iets wat je alleen zei en dus weg is'],
   'boodschap_bewaren', 107, true),

  -- 1.2.9 — GO! NL.273: schrijfdoel en publiek beschrijven
  ('Voor wie schrijf je?', '🎯', ARRAY['1.2.9'],
   'Weten waarom en voor wie je iets schrijft',
   'Bekijk verschillende briefjes, lijstjes en kaarten in de klas en bespreek telkens: wie leest dit, en waarom is het geschreven?',
   ARRAY['Vergelijk een boodschappenlijstje met een verjaardagskaart', 'Vraag wat er zou gebeuren zonder dat briefje', 'Laat hen kiezen voor wie hun eigen werk is'],
   'schrijfdoel', 108, true),

  -- 1.2.10 — GO! NL.284: bijdragen aan een gezamenlijke tekst
  ('Samen een tekst maken', '📝', ARRAY['1.2.10'],
   'Ieder brengt een stuk van de tekst aan',
   'Schrijf samen een klastekst over iets wat jullie meemaakten. De kleuters vertellen, jij noteert op groot papier en leest telkens terug.',
   ARRAY['Noteer de woorden van de kleuters, niet die van jezelf', 'Lees na elke zin het geheel opnieuw', 'Hang de tekst op en gebruik hem later'],
   'samen_tekst', 109, true),

  -- 1.2.10 — GO! NL.285: schrijven over bekende onderwerpen
  ('Schrijven over wat je kent', '🏡', ARRAY['1.2.10'],
   'Een tekst over een vertrouwd onderwerp',
   'Laat de kleuters kiezen waarover ze iets willen vastleggen: hun huisdier, het weekend, hun favoriete spel. Tekenen, krabbels en letters mogen door elkaar.',
   ARRAY['Laat hen zelf het onderwerp kiezen', 'Vraag door voor ze beginnen', 'Laat het werk aan een ander kind voorstellen'],
   'bekend_onderwerp', 110, true),

  -- 1.2.10 — OVSG NED stv 5.1, 5.2 en 5.4: (re)construeren met beeldmateriaal
  ('Navertellen met prenten', '🖼️', ARRAY['1.2.10'],
   'Een verhaal of instructie opnieuw opbouwen',
   'Leg de prenten van een voorgelezen verhaal of van een uitgevoerde activiteit door elkaar en laat de kleuters ze in de juiste volgorde leggen en navertellen.',
   ARRAY['Begin met drie of vier prenten', 'Werkt ook met foto''s van de klas', 'Laat hen de volgorde uitleggen, niet alleen leggen'],
   'navertellen_prenten', 111, true);

/*
  Doorlopende nummering per doel: de nieuwe oefeningen staan zo bij hun doel in
  plaats van achteraan. De volgorde binnen een doel blijft zoals ze nu is.
*/
WITH genummerd AS (
  SELECT id,
         row_number() OVER (
           ORDER BY string_to_array(goal_codes[1], '.')::int[], sort_order
         ) AS nieuwe_volgorde
  FROM writing_exercises
)
UPDATE writing_exercises w
SET sort_order = g.nieuwe_volgorde
FROM genummerd g
WHERE g.id = w.id;
