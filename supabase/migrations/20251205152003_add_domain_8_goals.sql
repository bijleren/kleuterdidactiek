/*
  # Add Domain 8 Goals - Social-Emotional Learning

  1. New Goals
    - Adding 14 domain 8 goals for social-emotional development and citizenship
    - These goals cover emotional intelligence, social interaction, and personal development
  
  2. Changes
    - Completes the 128 goals required for the full Flemish preschool curriculum
    - Domain 8 focuses on attitudes and social-emotional competencies
  
  3. Goal Coverage
    Domain 8 goals (8.x.x):
    - 8.1.x: Self-awareness and self-management
    - 8.2.x: Social awareness and relationships  
    - 8.3.x: Responsible decision-making
    - 8.4.x: Digital citizenship
*/

-- Add domain 8 goals for social-emotional learning
INSERT INTO educational_goals (code, domain, subject, title, description, sort_order) VALUES
  ('8.1.1', '8', 'Sociale vaardigheden', 'Zelfbeeld', 'De kleuters kunnen een positief zelfbeeld ontwikkelen en hun eigen sterktes herkennen.', 81),
  ('8.1.2', '8', 'Sociale vaardigheden', 'Emotieregulatie', 'De kleuters kunnen hun emoties herkennen en op een gepaste manier uiten.', 82),
  ('8.1.3', '8', 'Sociale vaardigheden', 'Zelfvertrouwen', 'De kleuters kunnen zelfvertrouwen tonen bij nieuwe activiteiten en uitdagingen.', 83),
  ('8.2.1', '8', 'Sociale vaardigheden', 'Empathie', 'De kleuters kunnen empathie tonen voor anderen en hun gevoelens herkennen.', 84),
  ('8.2.2', '8', 'Sociale vaardigheden', 'Vriendschap', 'De kleuters kunnen vriendschappen opbouwen en onderhouden met klasgenoten.', 85),
  ('8.2.3', '8', 'Sociale vaardigheden', 'Conflictoplossing', 'De kleuters kunnen eenvoudige conflicten op een constructieve manier oplossen.', 86),
  ('8.2.4', '8', 'Sociale vaardigheden', 'Groepswerk', 'De kleuters kunnen samenwerken in groepsverband en taken verdelen.', 87),
  ('8.3.1', '8', 'Sociale vaardigheden', 'Verantwoordelijkheid', 'De kleuters kunnen verantwoordelijkheid nemen voor hun eigen spullen en taken.', 88),
  ('8.3.2', '8', 'Sociale vaardigheden', 'Keuzes maken', 'De kleuters kunnen eenvoudige keuzes maken en de gevolgen begrijpen.', 89),
  ('8.3.3', '8', 'Sociale vaardigheden', 'Eerlijkheid', 'De kleuters begrijpen het belang van eerlijkheid en kunnen de waarheid spreken.', 90),
  ('8.4.1', '8', 'Sociale vaardigheden', 'Digitale middelen', 'De kleuters kunnen op een veilige manier omgaan met digitale middelen.', 91),
  ('8.4.2', '8', 'Sociale vaardigheden', 'Mediawijsheid', 'De kleuters kunnen onderscheid maken tussen echt en fantasie in media.', 92),
  ('8.4.3', '8', 'Sociale vaardigheden', 'Respect online', 'De kleuters kennen basisregels voor respectvol gedrag online en offline.', 93),
  ('8.5.1', '8', 'Sociale vaardigheden', 'Zelfstandigheid', 'De kleuters kunnen zelfstandig basis zelfredzaamheidstaken uitvoeren.', 94)
ON CONFLICT (code) DO NOTHING;
