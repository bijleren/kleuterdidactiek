/*
  # Eigen doelen uit de officiele nummering halen

  De veertien eigen doelen van de app (Sociale vaardigheden) hadden codes als
  8.1.1 en 8.2.3. Die zien er precies uit als een officieel minimumdoel terwijl
  ze het niet zijn: aan de code alleen kan een leerkracht niet zien dat dit doel
  niet van de overheid komt.

  Domein 8 ontbreekt in de kleuterdoelen omdat dat Frans is, en dat hoeven
  kleuters niet te leren. Het nummer is dus wel degelijk vergeven, alleen niet
  in deze onderwijsstructuur. Zodra deze doelen naast die van het lager
  onderwijs komen te staan — waar Frans wel telt — botsen ze.

  Daarom een prefix met letters: 8.1.1 wordt SV.1.1. Officiele codes bestaan
  alleen uit cijfers en punten, dus verwarring en botsing zijn allebei
  uitgesloten. De onderverdeling blijft behouden (SV.1 zelfbeeld, SV.2 samen,
  SV.3 verantwoordelijkheid, SV.4 media, SV.5 zelfstandigheid). De schrijfwijze
  sluit ook aan bij de leerplandoelen, die al letterprefixen gebruiken zoals
  WI.666.

  Er zijn geen foreign keys naar educational_goals.code, dus de verwijzingen
  staan als losse tekst in goal_codes-arrays en goal_code-kolommen. Die
  verhuizen hier mee: 46 rijen over zes tabellen, alles in een transactie.
  Na afloop: 0 achtergebleven 8.-codes, 0 verwijzingen zonder doel.
*/

create temporary table hernoem on commit drop as
select code as oud, 'SV.' || substring(code from 3) as nieuw
from public.educational_goals
where code like '8.%';

-- Arrays: elke code apart vervangen, volgorde behouden.
update public.activity_presets p set goal_codes = (
  select array_agg(coalesce(h.nieuw, u.c) order by u.ord)
  from unnest(p.goal_codes) with ordinality as u(c, ord)
  left join hernoem h on h.oud = u.c
) where exists (select 1 from hernoem h where h.oud = any(p.goal_codes));

update public.routines r set goal_codes = (
  select array_agg(coalesce(h.nieuw, u.c) order by u.ord)
  from unnest(r.goal_codes) with ordinality as u(c, ord)
  left join hernoem h on h.oud = u.c
) where exists (select 1 from hernoem h where h.oud = any(r.goal_codes));

update public.goal_tracking_sessions s set goal_codes = (
  select array_agg(coalesce(h.nieuw, u.c) order by u.ord)
  from unnest(s.goal_codes) with ordinality as u(c, ord)
  left join hernoem h on h.oud = u.c
) where exists (select 1 from hernoem h where h.oud = any(s.goal_codes));

-- Tekstkolommen.
update public.routine_goals x set goal_code = h.nieuw from hernoem h where x.goal_code = h.oud;
update public.lesson_goals x set goal_code = h.nieuw from hernoem h where x.goal_code = h.oud;
update public.group_goal_progress x set goal_code = h.nieuw from hernoem h where x.goal_code = h.oud;

-- En tot slot het doel zelf, plus het domein dat nu ook geen cijfer meer is.
update public.educational_goals g
   set code = h.nieuw, domain = 'SV'
  from hernoem h
 where g.code = h.oud;
