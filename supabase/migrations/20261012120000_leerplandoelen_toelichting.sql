/*
  # Toelichting bij een leerplandoel

  Bij de invoer van de leerplannen kwam alleen de doelzin mee. De netten zetten
  daar ondersteunende tekst naast — OVSG een ondersteunings- en
  verdiepingsleerlijn, GO! te hanteren begrippen, voorbeelden en aandachtspunten,
  Op.stap voorbeelden. Zoeken op een woord uit die tekst leverde niets op:
  "drukletters" bij NED stv 1.23 stond nergens in de databank.

  Per net andere kolommen, dus een jsonb met label → tekst. toelichting_tekst
  is er alleen voor het zoeken: PostgREST kan niet op jsonb ilike'n.

  De teksten zelf komen uit de bronbestanden in minimumdoelen/ en zijn
  eenmalig ingelezen (1.594 van de 3.179 doelen hebben er een; de overige
  hebben in hun bron geen toelichting).
*/
ALTER TABLE public.leerplandoelen
  ADD COLUMN IF NOT EXISTS toelichting jsonb;

ALTER TABLE public.leerplandoelen
  ADD COLUMN IF NOT EXISTS toelichting_tekst text
  GENERATED ALWAYS AS (coalesce(toelichting::text, '')) STORED;
