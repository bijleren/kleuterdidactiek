/*
  # Seed Default Routines

  ## Overview
  This migration populates the routines table with 15 default routines covering
  all 9 educational domains. These routines provide teachers with ready-to-use
  recurring classroom activities that integrate into their lesson calendars.

  ## Routines Included
  
  1. **Ochtend Kring** (Domain 8: Sociale vaardigheden) - Morning circle
  2. **Kalender Bespreking** (Domain 2: Wiskunde) - Calendar discussion
  3. **Weerkring** (Domain 4: Aardrijkskunde) - Weather circle
  4. **Woordenschat Moment** (Domain 1: Nederlands) - Vocabulary moment
  5. **Telritueel** (Domain 2: Wiskunde) - Counting ritual
  6. **Muziek & Beweging** (Domain 6: Muzische vorming) - Music and movement
  7. **Lichaamsoefening** (Domain 7: Lichamelijke opvoeding) - Physical exercise
  8. **Vriendjeskring** (Domain 8: Sociale vaardigheden) - Friendship circle
  9. **Natuurobservatie** (Domain 3: Wetenschap) - Nature observation
  10. **Taalspelletje** (Domain 1: Nederlands) - Language game
  11. **Rekenspelletje** (Domain 2: Wiskunde) - Math game
  12. **Creatief Moment** (Domain 6: Muzische vorming) - Creative moment
  13. **Conflict Oplossing** (Domain 8: Sociale vaardigheden) - Conflict resolution
  14. **Groepsregels Herhaling** (Domain 8: Sociale vaardigheden) - Group rules review
  15. **Dag Afsluiting** (Domain 8: Sociale vaardigheden) - Day closing
  16. **Geschiedenisverhaal** (Domain 5: Geschiedenis) - History story

  ## Goal Mapping
  Each routine is linked to relevant educational goals to enable progress tracking
  and goal-based filtering.
*/

-- Insert default routines
INSERT INTO routines (title, description, icon, color, category, goal_codes, is_default, school_id, created_by)
VALUES
  (
    'Ochtend Kring',
    'Begin de dag met een gezellige kring waarin kinderen elkaar begroeten, nieuwtjes delen en het dagprogramma bespreken. Dit bevordert de sociale cohesie en geeft structuur aan de dag.',
    'circle',
    '#10b981',
    'start_day',
    ARRAY['8.2.1', '8.2.2', '1.3.1', '1.3.5'],
    true,
    NULL,
    NULL
  ),
  (
    'Kalender Bespreking',
    'Bespreek samen de datum, dag van de week, het seizoen en bijzondere gebeurtenissen. Kinderen leren tijdsbegrippen en oriënteren zich in de tijd.',
    'calendar',
    '#3b82f6',
    'start_day',
    ARRAY['2.3.16', '2.3.18', '2.3.19', '5.2.3'],
    true,
    NULL,
    NULL
  ),
  (
    'Weerkring',
    'Observeer en bespreek het weer. Kinderen kijken naar buiten, benoemen weersverschijnselen en leren over wolken, wind en temperatuur.',
    'cloud-rain',
    '#0ea5e9',
    'start_day',
    ARRAY['4.2.4', '4.2.5', '3.1.1'],
    true,
    NULL,
    NULL
  ),
  (
    'Woordenschat Moment',
    'Introduceer nieuwe woorden of oefen bekende woordenschat met visuele ondersteuning en voorwerpen. Kinderen breiden hun vocabulaire uit.',
    'book-open',
    '#8b5cf6',
    'lesson',
    ARRAY['1.4.1', '1.3.5', '1.3.1'],
    true,
    NULL,
    NULL
  ),
  (
    'Telritueel',
    'Tel samen voorwerpen, kinderen of dagen. Oefen de telrij en getalsbegrip op een speelse en visuele manier met concrete materialen.',
    'hash',
    '#f59e0b',
    'lesson',
    ARRAY['2.1.1', '2.1.2', '2.1.9'],
    true,
    NULL,
    NULL
  ),
  (
    'Muziek & Beweging',
    'Beweeg samen op muziek met eenvoudige dansjes, bewegingsliedjes of muzikale spelletjes. Kinderen ontwikkelen ritmegevoel en motoriek.',
    'music',
    '#ec4899',
    'lesson',
    ARRAY['6.2.1', '6.2.2', '6.5.1', '7.1.2'],
    true,
    NULL,
    NULL
  ),
  (
    'Lichaamsoefening',
    'Doe samen gerichte bewegingsoefeningen zoals springen, balanceren, kruipen of klimmen. Bevordert de motorische ontwikkeling en lichaamsbeheersing.',
    'activity',
    '#ef4444',
    'lesson',
    ARRAY['7.1.1', '7.1.2', '7.1.6', '7.1.7'],
    true,
    NULL,
    NULL
  ),
  (
    'Vriendjeskring',
    'Praat samen over vriendschap, complimenten geven en aardig zijn voor elkaar. Kinderen oefenen empathie en sociale vaardigheden.',
    'heart',
    '#f472b6',
    'lesson',
    ARRAY['8.2.1', '8.2.2', '8.2.4'],
    true,
    NULL,
    NULL
  ),
  (
    'Natuurobservatie',
    'Observeer samen planten, dieren of natuurverschijnselen in de klas of buiten. Kinderen ontwikkelen onderzoeksvaardigheden en leren over de natuur.',
    'leaf',
    '#22c55e',
    'lesson',
    ARRAY['3.1.1', '3.1.2', '4.2.2'],
    true,
    NULL,
    NULL
  ),
  (
    'Taalspelletje',
    'Speel een taalgericht spelletje zoals rijmen, klanken zoeken, raadsels of woordspelletjes. Bevordert fonologisch bewustzijn en taalplezier.',
    'message-circle',
    '#6366f1',
    'lesson',
    ARRAY['1.1.1', '1.1.2', '1.4.5', '1.3.5'],
    true,
    NULL,
    NULL
  ),
  (
    'Rekenspelletje',
    'Speel een rekenspelletje met dobbelstenen, kaarten of beweging. Kinderen oefenen getalbegrip, vergelijken en sorteren op een speelse manier.',
    'dices',
    '#f97316',
    'lesson',
    ARRAY['2.1.2', '2.1.8', '2.4.18', '2.5.1'],
    true,
    NULL,
    NULL
  ),
  (
    'Creatief Moment',
    'Creëer samen met verschillende materialen en technieken. Kinderen experimenteren met kleur, vorm, textuur en ontwikkelen hun creatieve expressie.',
    'palette',
    '#a855f7',
    'lesson',
    ARRAY['6.1.1', '6.3.1', '6.3.4', '6.3.3'],
    true,
    NULL,
    NULL
  ),
  (
    'Conflict Oplossing',
    'Bespreek samen conflicten of moeilijke situaties die zich voordeden. Kinderen leren problemen oplossen en met elkaar communiceren.',
    'message-square',
    '#dc2626',
    'lesson',
    ARRAY['8.2.3', '8.2.4', '8.3.1', '8.3.2'],
    true,
    NULL,
    NULL
  ),
  (
    'Groepsregels Herhaling',
    'Herhaal en bespreek de groepsregels en afspraken. Kinderen begrijpen wat er verwacht wordt en leren verantwoordelijkheid nemen.',
    'shield',
    '#0891b2',
    'start_week',
    ARRAY['8.3.1', '8.3.3', '7.2.1', '8.2.4'],
    true,
    NULL,
    NULL
  ),
  (
    'Dag Afsluiting',
    'Sluit de dag af met een rustig moment waarin kinderen vertellen wat ze hebben geleerd, wat leuk was en elkaar bedanken. Bevordert reflectie en dankbaarheid.',
    'sunset',
    '#ea580c',
    'end_day',
    ARRAY['8.1.2', '8.1.3', '1.3.5', '8.2.1'],
    true,
    NULL,
    NULL
  ),
  (
    'Geschiedenisverhaal',
    'Vertel een verhaal over vroeger, over hoe dingen veranderd zijn of over historische gebeurtenissen op kindniveau. Kinderen ontwikkelen tijdsbesef en historisch bewustzijn.',
    'book',
    '#7c3aed',
    'lesson',
    ARRAY['5.1.1', '5.1.2', '5.2.2', '5.2.3'],
    true,
    NULL,
    NULL
  )
ON CONFLICT DO NOTHING;

-- Insert routine_goals mappings
INSERT INTO routine_goals (routine_id, goal_code)
SELECT r.id, unnest(r.goal_codes)
FROM routines r
WHERE r.is_default = true
ON CONFLICT (routine_id, goal_code) DO NOTHING;