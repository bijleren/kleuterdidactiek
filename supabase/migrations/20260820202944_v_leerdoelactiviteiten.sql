/*
  # Concrete doe-activiteiten uit de leerplannen, per minimumdoel gebundeld

  De leerplannen van de drie netten staan vol doelen die een concrete handeling
  beschrijven: klauteren, rijgen, stapelen, sorteren, boetseren, wegen. Twee
  doelen uit verschillende netten die aan hetzelfde minimumdoel hangen, mikken
  per definitie op hetzelfde. Zo kan een leerkracht zien hoe een ander net
  hetzelfde doel aanpakt.

  Afgeleid, niet gecureerd, in dezelfde lijn als de doelen bij platforminhoud:
  verandert een leerplan, dan volgt deze lijst vanzelf.

  ## Ontdubbeling
  GO! herhaalt dezelfde zin onder verschillende doelnummers — "Verplaatsen zich
  door te springen." staat er vier keer, met bijna identieke metadata. Zonder
  ontdubbeling zou de lijst vollopen met herhalingen. De sleutel is daarom
  (minimumdoel, net, tekst); de doelnummers worden samengevoegd en de
  leeftijdsbanden samengenomen.

  Van 361 gekoppelde treffers blijven zo 336 unieke activiteiten over,
  verdeeld over 100 minimumdoelen. Bij twintig daarvan dragen alle drie de
  netten activiteiten aan.

  ## Werkwoordenlijst
  Een heuristiek, geen officiele indeling. Ze staat hier zodat ze op een plek
  bijgesteld kan worden. Doelen zonder handelingswerkwoord ("kennen de
  begrippen...") vallen er bewust buiten: daar valt weinig te doen.
*/
create or replace view public.v_leerdoelactiviteiten
with (security_invoker = true) as
with concreet as (
  select
    l.id, l.net_code, l.doelnummer, btrim(l.omschrijving) as activiteit,
    l.leeftijd_25_4, l.leeftijd_4_5, l.leeftijd_5_6,
    l.path_labels
  from public.leerplandoelen l
  where l.omschrijving ~* '\m(teken|knip|plak|bouw|sorteer|rijg|kleur|scheur|kneed|stapel|vouw|prik|zing|dans|klim|klauter|spring|rol|gooi|werp|vang|meet|weeg|orden|speel|beweeg|construeer|experimenteer|onderzoek|verzamel|vergelijk|schilder|boetseer|balanceer|huppel|kruip|mik|trap)'
)
select
  lm.code                                              as minimumdoel,
  c.net_code,
  c.activiteit,
  array_agg(distinct c.doelnummer order by c.doelnummer) as doelnummers,
  bool_or(c.leeftijd_25_4)                             as leeftijd_25_4,
  bool_or(c.leeftijd_4_5)                              as leeftijd_4_5,
  bool_or(c.leeftijd_5_6)                              as leeftijd_5_6,
  (array_agg(c.path_labels order by c.doelnummer))[1]  as pad
from concreet c
join public.leerplandoel_minimumdoelen lm on lm.leerplandoel_id = c.id
group by lm.code, c.net_code, c.activiteit;

comment on view public.v_leerdoelactiviteiten is
  'Concrete doe-activiteiten uit de leerplandoelen van de drie netten, '
  'ontdubbeld per (minimumdoel, net, tekst) en gebundeld per minimumdoel. '
  'Twee activiteiten onder hetzelfde minimumdoel mikken op hetzelfde doel.';
