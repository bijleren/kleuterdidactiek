/*
  # Populate Default Activity Presets with Educational Goals

  ## Overview
  This migration populates the activity_presets table with default "hoekenwerk" (corner work) 
  activities commonly used in Dutch kindergarten classrooms. Each preset is associated with 
  relevant educational goals (kleuterdoelen).

  ## Default Presets
  
  ### 1. Bouwhoek (Building Corner)
  - Focus: Spatial awareness, motor skills, creativity
  - Goals: Physical development, creative thinking, collaboration
  
  ### 2. Leeshoek (Reading Corner)
  - Focus: Language development, listening skills
  - Goals: Language acquisition, concentration, story comprehension
  
  ### 3. Rekenhoek (Math Corner)
  - Focus: Numbers, counting, mathematical thinking
  - Goals: Number sense, problem solving, logical thinking
  
  ### 4. Huishoek (Play House Corner)
  - Focus: Role play, social interaction
  - Goals: Social skills, language use, imagination
  
  ### 5. Tekenhoek (Drawing Corner)
  - Focus: Fine motor skills, creative expression
  - Goals: Motor development, creativity, color recognition
  
  ### 6. Knutselhoek (Crafts Corner)
  - Focus: Fine motor skills, following instructions
  - Goals: Motor development, concentration, creativity
  
  ### 7. Zandtafel (Sand Table)
  - Focus: Sensory exploration, imaginative play
  - Goals: Sensory development, motor skills, creativity
  
  ### 8. Zelfstandig Werken (Independent Work)
  - Focus: Self-reliance, task completion
  - Goals: Independence, concentration, task persistence

  ## Goal Code Mapping
  Goals are mapped to domains 1-8 of the kleuterdoelen framework:
  - Domain 1: Personal development
  - Domain 2: Social-emotional development
  - Domain 3: Physical/motor development
  - Domain 4: Creative development
  - Domain 5: Language development
  - Domain 6: Cognitive development/thinking
  - Domain 7: World orientation
  - Domain 8: Early literacy/writing
*/

-- Insert default activity presets with associated goal codes
INSERT INTO activity_presets (
  school_id,
  name,
  description,
  icon,
  color,
  max_students,
  is_default,
  goal_codes
) VALUES
  -- Bouwhoek (Building Corner)
  (
    NULL,
    'Bouwhoek',
    'Bouwen en construeren met blokken en ander materiaal',
    '🏗️',
    '#B5F0BE',
    4,
    true,
    ARRAY['3.1.1', '3.1.2', '3.2.1', '4.1.1', '4.2.1', '6.1.1', '6.2.1']
  ),
  
  -- Leeshoek (Reading Corner)
  (
    NULL,
    'Leeshoek',
    'Boeken lezen en bekijken',
    '📚',
    '#FF8E8E',
    3,
    true,
    ARRAY['5.1.1', '5.1.2', '5.2.1', '5.2.2', '8.1.1', '8.1.2', '1.2.1']
  ),
  
  -- Rekenhoek (Math Corner)
  (
    NULL,
    'Rekenhoek',
    'Tellen, sorteren en rekenen',
    '🔢',
    '#7EDCD5',
    4,
    true,
    ARRAY['6.1.1', '6.1.2', '6.2.1', '6.2.2', '6.3.1', '6.3.2', '7.1.1']
  ),
  
  -- Huishoek (Play House Corner)
  (
    NULL,
    'Huishoek',
    'Rollenspel en samen spelen',
    '🏠',
    '#FFCC80',
    4,
    true,
    ARRAY['2.1.1', '2.1.2', '2.2.1', '2.2.2', '4.1.1', '4.2.1', '5.1.1', '5.2.1']
  ),
  
  -- Tekenhoek (Drawing Corner)
  (
    NULL,
    'Tekenhoek',
    'Tekenen en kleuren',
    '✏️',
    '#D9C8FF',
    4,
    true,
    ARRAY['3.2.1', '3.2.2', '4.1.1', '4.1.2', '4.2.1', '8.2.1', '8.2.2']
  ),
  
  -- Knutselhoek (Crafts Corner)
  (
    NULL,
    'Knutselhoek',
    'Knippen, plakken en knutselen',
    '✂️',
    '#FFD966',
    3,
    true,
    ARRAY['3.2.1', '3.2.2', '4.1.1', '4.1.2', '4.2.1', '1.1.1', '1.2.1']
  ),
  
  -- Zandtafel (Sand Table)
  (
    NULL,
    'Zandtafel',
    'Spelen met zand en kleine voorwerpen',
    '🏖️',
    '#9B9EFF',
    4,
    true,
    ARRAY['3.1.1', '3.2.1', '4.1.1', '4.2.1', '7.1.1', '7.2.1']
  ),
  
  -- Zelfstandig Werken (Independent Work)
  (
    NULL,
    'Zelfstandig Werken',
    'Individuele opdrachten en werkbladen',
    '📝',
    '#FFB3B3',
    NULL,
    true,
    ARRAY['1.1.1', '1.1.2', '1.2.1', '1.2.2', '6.1.1', '6.2.1', '8.1.1', '8.2.1']
  ),
  
  -- Muziekhoek (Music Corner)
  (
    NULL,
    'Muziekhoek',
    'Muziek maken en luisteren',
    '🎵',
    '#E8B4FF',
    3,
    true,
    ARRAY['4.1.1', '4.1.2', '4.2.1', '5.1.1', '5.2.1', '3.1.1']
  ),
  
  -- Puzzelhoek (Puzzle Corner)
  (
    NULL,
    'Puzzelhoek',
    'Puzzelen en denkspelletjes',
    '🧩',
    '#7EDCD5',
    2,
    true,
    ARRAY['6.1.1', '6.2.1', '6.3.1', '1.1.1', '1.2.1', '3.2.1']
  ),
  
  -- Computerhoek (Computer Corner)
  (
    NULL,
    'Computerhoek',
    'Educatieve computerspelletjes',
    '💻',
    '#B5F0BE',
    2,
    true,
    ARRAY['6.1.1', '6.2.1', '5.1.1', '8.1.1', '1.1.1']
  ),
  
  -- Themahoek (Theme Corner)
  (
    NULL,
    'Themahoek',
    'Activiteiten rond het huidige thema',
    '🎨',
    '#FFCC80',
    4,
    true,
    ARRAY['7.1.1', '7.1.2', '7.2.1', '5.1.1', '5.2.1', '4.1.1', '6.1.1']
  )

ON CONFLICT DO NOTHING;