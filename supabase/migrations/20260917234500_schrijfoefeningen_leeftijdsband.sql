/*
  # Schrijf: leeftijdsband per oefening

  De schrijfoefeningen kenden geen leeftijd, de leerplannen wel. Schrijfhouding,
  schrijfpatronen, arceren en schrijfrichting hebben in geen enkel net een
  leerplandoel bij 2,5-4 jaar, maar stonden wel in de lijst van een instapklas.

  De band wordt niet geraden: een oefening geldt voor een leeftijd zodra één van
  de leerplandoelen bij haar minimumdoel die leeftijd bestrijkt. Zo volgt de tab
  dezelfde bron als de doelenoverzichten.

  Een oefening zonder enige leerplandoelkoppeling zou anders in elke klas
  wegvallen; die krijgt alle leeftijden, zoals nu.
*/

ALTER TABLE writing_exercises
  ADD COLUMN IF NOT EXISTS leeftijd_25_4 boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS leeftijd_4_5 boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS leeftijd_5_6 boolean NOT NULL DEFAULT false;

WITH per_oefening AS (
  SELECT w.id,
         bool_or(l.leeftijd_25_4) AS jong,
         bool_or(l.leeftijd_4_5) AS midden,
         bool_or(l.leeftijd_5_6) AS oud
  FROM writing_exercises w
  JOIN leerplandoel_minimumdoelen k ON k.code = ANY (w.goal_codes)
  JOIN leerplandoelen l ON l.id = k.leerplandoel_id
  GROUP BY w.id
)
UPDATE writing_exercises w
SET leeftijd_25_4 = coalesce(p.jong, false),
    leeftijd_4_5 = coalesce(p.midden, false),
    leeftijd_5_6 = coalesce(p.oud, false)
FROM per_oefening p
WHERE p.id = w.id;

-- Vangnet: zonder koppeling of zonder treffer blijft de oefening overal staan.
UPDATE writing_exercises
SET leeftijd_25_4 = true, leeftijd_4_5 = true, leeftijd_5_6 = true
WHERE NOT (leeftijd_25_4 OR leeftijd_4_5 OR leeftijd_5_6);
