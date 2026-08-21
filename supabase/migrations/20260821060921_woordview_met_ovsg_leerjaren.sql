/*
  # OVSG-leerjaren meenemen in de woordkoppeling

  De view gaf per woord en net alleen de drie gedeelde leeftijdsbanden. OVSG
  kent elk doel aan precies een leerjaar toe en heeft er vier: instap (2,5) en
  1ste kleuterklas (3) vallen allebei in de band 2,5-4. Op de woordenschatpagina
  kon je die twee daardoor niet uit elkaar houden, terwijl dat op de
  leerdoelenpagina wel kan.

  Daarom een extra kolom met de OVSG-leerjaren waarin een woord voorkomt. Voor
  de andere netten blijft ze leeg; die hebben geen eigen leerjaar. De kolom
  staat achteraan omdat create or replace de bestaande kolomvolgorde niet mag
  omgooien.
*/
create or replace view public.v_woord_per_net_en_leeftijd
with (security_invoker = true) as
with woorden as (
  select w.id, w.word, w.goal_codes, false as is_custom, null::uuid as school_id
  from public.vocabulary_words w
  union all
  select c.id, c.word, c.goal_codes, true, c.school_id
  from public.custom_vocabulary c
  where c.is_deleted is not true
), direct as (
  select w.id as word_id, w.word, w.is_custom, w.school_id, l.net_code,
         bool_or(d.leeftijd_25_4) as leeftijd_25_4,
         bool_or(d.leeftijd_4_5)  as leeftijd_4_5,
         bool_or(d.leeftijd_5_6)  as leeftijd_5_6,
         'direct'::text as precisie,
         array_remove(array_agg(distinct l.extra->>'leeftijdsgroep'), null) as ovsg_groepen
  from woorden w
  join public.leerplandoel_details d
    on d.soort = 'te hanteren begrip' and lower(d.tekst) = lower(w.word)
  join public.leerplandoelen l on l.id = d.leerplandoel_id
  group by w.id, w.word, w.is_custom, w.school_id, l.net_code
), afgeleid as (
  select w.id, w.word, w.is_custom, w.school_id, l.net_code,
         bool_or(l.leeftijd_25_4) as leeftijd_25_4,
         bool_or(l.leeftijd_4_5)  as leeftijd_4_5,
         bool_or(l.leeftijd_5_6)  as leeftijd_5_6,
         'afgeleid'::text as precisie,
         array_remove(array_agg(distinct l.extra->>'leeftijdsgroep'), null) as ovsg_groepen
  from woorden w
  join public.leerplandoel_minimumdoelen lm on lm.code = any (w.goal_codes)
  join public.leerplandoelen l on l.id = lm.leerplandoel_id
  group by w.id, w.word, w.is_custom, w.school_id, l.net_code
)
select direct.word_id, direct.word, direct.is_custom, direct.school_id, direct.net_code,
       direct.leeftijd_25_4, direct.leeftijd_4_5, direct.leeftijd_5_6,
       direct.precisie, direct.ovsg_groepen
from direct
union all
select a.id, a.word, a.is_custom, a.school_id, a.net_code,
       a.leeftijd_25_4, a.leeftijd_4_5, a.leeftijd_5_6,
       a.precisie, a.ovsg_groepen
from afgeleid a
where not exists (
  select 1 from direct d where d.word_id = a.id and d.net_code = a.net_code
);
