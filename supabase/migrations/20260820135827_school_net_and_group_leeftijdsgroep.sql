/*
  # Net op schoolniveau, leeftijdsgroep op klasniveau

  ## Probleem
  De keuze van net en leeftijd stond alleen in localStorage van de browser:
  onder een sleutel voor de hele browser, dus niet per klas, niet gedeeld met
  collega's, weg na het wissen van je cache, en onzichtbaar voor de server.
  Een leerkracht met een K1 en een K3 kreeg voor allebei hetzelfde filter, en
  de agenda kan er niets mee.

  ## Aanpak
  Net hoort bij de school (voorlopig een school = een net), leeftijdsband bij
  de klas. Beide optioneel: leeg betekent geen filter en dus alle doelen.
  Het is een kijkfilter, geen beperking — de interface houdt een vinkje
  "toon alle doelen" en de knoppen per net blijven staan om te vergelijken.

  ## Backfill
  Uit het vrije tekstveld groups.grade_level, dat 90 verschillende spellingen
  telde ("K3", "3kk", "3KL", "derde kleuter", ...). Alleen ondubbelzinnige
  waarden zijn omgezet: 168 van de 379 klassen. Klassen die twee banden
  overspannen ("K2, K3"), lager onderwijs en onleesbare waarden blijven leeg
  en worden dus niet gefilterd. Peuter/instap en 1ste kleuterklas vallen
  allebei binnen 2,5-4, dus combinaties daarvan zijn wel eenduidig.
*/

alter table public.schools
  add column if not exists net_code text
    check (net_code is null or net_code in ('KATH', 'GO', 'OVSG'));

comment on column public.schools.net_code is
  'Onderwijsnet van de school. Null = niet opgegeven; dan geen netfilter.';

alter table public.groups
  add column if not exists leeftijdsgroep text
    check (leeftijdsgroep is null or leeftijdsgroep in ('2,5-4', '4-5', '5-6'));

comment on column public.groups.leeftijdsgroep is
  'Leeftijdsband van de klas, zelfde waarden als leerplandoelen.leeftijd. '
  'Null = niet opgegeven; dan geen leeftijdsfilter.';

with g as (
  select id, lower(regexp_replace(coalesce(grade_level, ''), '[^A-Za-z0-9]', '', 'g')) as k
  from public.groups
  where leeftijdsgroep is null
), m as (
  select id,
    case
      when k in ('k0','k1','k1a','1kl','1stekleuterklas','1stekleuter','p','p1','peu','pk',
                 'peuters','instap','instappers','onthaalklas',
                 'k0k1','k01','k0enk1','pk1','peutersk1','ptsk1','peuter1kk','peuteren1stekleuterklas')
        then '2,5-4'
      when k in ('k2','2k','2kk','2kl','2dekleuterklas','tweedekleuterklas') then '4-5'
      when k in ('k3','3k','3kk','3kka','3kl','kl3','k3b','3dekleuter','3dekleuterklas',
                 '3ekleuterklas','derdekleuter') then '5-6'
      else null
    end as band
  from g
)
update public.groups gr
   set leeftijdsgroep = m.band
  from m
 where gr.id = m.id and m.band is not null;
