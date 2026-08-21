/*
  # Vijf startthema's

  Platformthema's (school_id null), zichtbaar voor iedereen als vertrekpunt:
  Aan zee, Op de boerderij, Herfst, Mijn lichaam, Onderweg. Samen 89 woorden.

  Elk thema mengt woorden die al in de woordenschat staan met woorden die er
  nog niet zijn — 60 bestaande tegenover 29 nieuwe. Dat is geen slordigheid
  maar de aard van de bestaande lijst: die 461 woorden komen uit de begrippen
  van de leerplannen (neerslag, zoogdieren, temperatuur), terwijl een thema ook
  schelp, kastanje en tractor nodig heeft. Van alle kandidaten voor deze vijf
  thema's bestonden alleen "water" en "zon" al.

  Geen materialen of video's meegeleverd: alles wat er nu staat hoort bij één
  school (is_global = false), dus dat in een platformthema zetten zou andermans
  inhoud tonen. Leerkrachten hangen hun eigen materiaal eraan.
*/

with nieuw as (
  insert into public.themas (school_id, naam, beschrijving, emoji, sort_order)
  values
    (null, 'Aan zee', 'Strand, water en alles wat je aan de kust tegenkomt.', '🏖️', 1),
    (null, 'Op de boerderij', 'Dieren, gewassen en het werk op een boerderij.', '🚜', 2),
    (null, 'Herfst', 'Vallende bladeren, wind en regen, en wat er in het bos gebeurt.', '🍂', 3),
    (null, 'Mijn lichaam', 'Lichaamsdelen, zintuigen en wat er vanbinnen gebeurt.', '🧍', 4),
    (null, 'Onderweg', 'Veilig op straat: voetpad, zebrapad en wat er voorbijrijdt.', '🚦', 5)
  returning id, naam
), items(naam, woord, volgorde) as (values
  ('Aan zee','strand',1),('Aan zee','zand',2),('Aan zee','zee',3),('Aan zee','water',4),
  ('Aan zee','zon',5),('Aan zee','wind',6),('Aan zee','plas',7),('Aan zee','rots',8),
  ('Aan zee','blauw',9),('Aan zee','schelp',10),('Aan zee','golf',11),('Aan zee','boot',12),
  ('Aan zee','emmer',13),('Aan zee','meeuw',14),('Aan zee','zwemmen',15),('Aan zee','zandkasteel',16),
  ('Op de boerderij','boerderij',1),('Op de boerderij','koe',2),('Op de boerderij','schaap',3),
  ('Op de boerderij','varken',4),('Op de boerderij','stal',5),('Op de boerderij','eieren',6),
  ('Op de boerderij','weide',7),('Op de boerderij','grasland',8),('Op de boerderij','akker',9),
  ('Op de boerderij','gewas',10),('Op de boerderij','zaad',11),('Op de boerderij','wortel',12),
  ('Op de boerderij','kip',13),('Op de boerderij','paard',14),('Op de boerderij','tractor',15),
  ('Op de boerderij','hooi',16),('Op de boerderij','melk',17),('Op de boerderij','boer',18),
  ('Herfst','herfst',1),('Herfst','blad',2),('Herfst','boom',3),('Herfst','stam',4),
  ('Herfst','bos',5),('Herfst','wind',6),('Herfst','regen',7),('Herfst','mist',8),
  ('Herfst','bewolking',9),('Herfst','bruin',10),('Herfst','oranje',11),
  ('Herfst','paddenstoel',12),('Herfst','kastanje',13),('Herfst','eikel',14),
  ('Herfst','tak',15),('Herfst','egel',16),('Herfst','laars',17),
  ('Mijn lichaam','ogen',1),('Mijn lichaam','oren',2),('Mijn lichaam','neus',3),
  ('Mijn lichaam','mond',4),('Mijn lichaam','huid',5),('Mijn lichaam','botten',6),
  ('Mijn lichaam','spieren',7),('Mijn lichaam','hart',8),('Mijn lichaam','longen',9),
  ('Mijn lichaam','maag',10),('Mijn lichaam','ademen',11),('Mijn lichaam','horen',12),
  ('Mijn lichaam','zien',13),('Mijn lichaam','ruiken',14),('Mijn lichaam','proeven',15),
  ('Mijn lichaam','voelen',16),('Mijn lichaam','hoofd',17),('Mijn lichaam','arm',18),
  ('Mijn lichaam','been',19),('Mijn lichaam','hand',20),('Mijn lichaam','voet',21),
  ('Mijn lichaam','buik',22),('Mijn lichaam','haar',23),
  ('Onderweg','straat',1),('Onderweg','weg',2),('Onderweg','voetpad',3),('Onderweg','zebrapad',4),
  ('Onderweg','oversteken',5),('Onderweg','verkeerslichten',6),('Onderweg','stopbord',7),
  ('Onderweg','berm',8),('Onderweg','fietshelm',9),('Onderweg','bus',10),('Onderweg','trein',11),
  ('Onderweg','spoor',12),('Onderweg','fiets',13),('Onderweg','auto',14),('Onderweg','step',15)
)
insert into public.thema_items (thema_id, item_type, item_id, item_name, sort_order)
select n.id, 'woord', i.woord, i.woord, i.volgorde
from items i join nieuw n on n.naam = i.naam;
