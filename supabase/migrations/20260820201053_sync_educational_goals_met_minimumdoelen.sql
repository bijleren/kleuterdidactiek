/*
  # De 94 ontbrekende minimumdoelen in de app zetten, en het zo houden

  educational_goals telde 128 rijen: 114 officiele minimumdoelen en 14 eigen
  doelen (domein 8, Sociale vaardigheden). Van de 208 officiele doelen
  ontbraken er dus 94 in de app — waaronder 11 te bereiken doelen, die
  wettelijk bindend zijn, zoals de telrij, rangorde tot 10 en getallen lezen
  tot 10. Er waren wel oefeningen voor, maar geen doel om ze aan te hangen.

  Het register minimumdoelen is een exacte kopie van het officiele bestand:
  208 codes en 208 doelzinnen, identiek tot op de tekst (md5 over alle
  code|doelzin-paren komt overeen).

  ## Afgeleide velden
  - description : de officiele doelzin, letterlijk
  - subject     : vakdiscipline
  - domain      : het eerste deel van de code
  - sort_order  : deterministisch uit de code, d*10000 + s*100 + n
  - title       : het officiele subthema, of het onderwerp als dat subthema
                  ontbreekt of te lang is voor een kop (>45 tekens)

  Titels zijn bewust niet uit de doelzin gegenereerd: afkappen gaf koppen als
  "Gepast reageren op vragen en". Het subthema is officiele terminologie,
  gemiddeld 23 tekens, en herhaalt zich soms — de code en de doelzin eronder
  maken het doel alsnog uniek herkenbaar.

  ## Voor de toekomst
  sync_educational_goals_from_minimumdoelen() voegt alleen ontbrekende doelen
  toe en raakt bestaande rijen nooit aan. Zo kan een nieuwe versie van het
  officiele bestand ingelezen worden zonder dat met de hand aangepaste titels
  of omschrijvingen overschreven worden. Wat afwijkt, wordt zichtbaar gemaakt
  via v_doelen_synchronisatie in plaats van stil rechtgezet.
*/

create or replace function public.sync_educational_goals_from_minimumdoelen()
returns table (toegevoegd integer, reeds_aanwezig integer, eigen_doelen integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_toegevoegd integer;
begin
  with nieuw as (
    insert into public.educational_goals
      (code, domain, subject, title, description, sort_order, minimumdoel_code)
    select
      m.code,
      split_part(m.code, '.', 1),
      m.vakdiscipline,
      case
        when coalesce(m.subthema, '') = '' or length(m.subthema) > 45
          then m.onderwerp
        else m.subthema
      end,
      m.doelzin,
      (split_part(m.code, '.', 1))::int * 10000
        + (split_part(m.code, '.', 2))::int * 100
        + (split_part(m.code, '.', 3))::int,
      m.code
    from public.minimumdoelen m
    where not exists (
      select 1 from public.educational_goals g where g.code = m.code
    )
    returning 1
  )
  select count(*)::int into v_toegevoegd from nieuw;

  return query
  select
    v_toegevoegd,
    (select count(*)::int from public.educational_goals g
       join public.minimumdoelen m on m.code = g.code) - v_toegevoegd,
    (select count(*)::int from public.educational_goals g
      where not exists (select 1 from public.minimumdoelen m where m.code = g.code));
end;
$$;

revoke all on function public.sync_educational_goals_from_minimumdoelen() from public, anon, authenticated;

comment on function public.sync_educational_goals_from_minimumdoelen() is
  'Zet officiele minimumdoelen die nog niet in educational_goals staan erbij. '
  'Werkt bestaande rijen nooit bij, zodat handmatige titels en omschrijvingen '
  'blijven staan. Verschillen zie je in v_doelen_synchronisatie.';

create or replace view public.v_doelen_synchronisatie as
select
  coalesce(g.code, m.code) as code,
  case
    when g.code is null then 'ontbreekt in app'
    when m.code is null then 'eigen doel, niet officieel'
    when g.description is distinct from m.doelzin then 'tekst wijkt af'
    else 'gelijk'
  end as status,
  m.is_te_bereiken,
  m.vakdiscipline,
  g.title,
  m.doelzin as officiele_doelzin,
  g.description as app_omschrijving
from public.educational_goals g
full outer join public.minimumdoelen m on m.code = g.code;

comment on view public.v_doelen_synchronisatie is
  'Vergelijkt educational_goals met het officiele register minimumdoelen. '
  'Status: gelijk, tekst wijkt af, ontbreekt in app, of eigen doel.';

select * from public.sync_educational_goals_from_minimumdoelen();
