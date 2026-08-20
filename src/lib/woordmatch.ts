/*
  Bepaalt of een leerplandoel echt over een bepaald woord gaat.

  Aanleiding: het woord "voor" hing aan vijftien leerplandoelen van Katholiek
  Onderwijs, waarvan er dertien over heel andere begrippen gingen — "in, uit,
  binnen, buiten", "omhoog, omlaag", "vooruit, achteruit". De koppeling loopt
  namelijk via het minimumdoel, en die is grofmaziger dan het leerplandoel.

  Veel leerplandoelen sommen hun begrippen letterlijk op. Doen ze dat, dan zijn
  ze specifiek en gaan ze alleen over de woorden die er staan. Doen ze dat niet
  ("Herkennen ruimtelijke relaties tussen objecten"), dan zijn ze algemeen en
  dekken ze het minimumdoel als geheel. GO! is bijna volledig van dat tweede
  type: 989 van de 993 doelen noemt geen begrippen.
*/

export type WoordRelevantie = 'noemt' | 'algemeen' | 'anders';

/** Somt dit doel zijn begrippen op? Dan gaat het alleen over die begrippen. */
function isSpecifiek(omschrijving: string): boolean {
  return /\bbegrip/i.test(omschrijving);
}

function normaliseer(tekst: string): string {
  return tekst
    .toLowerCase()
    .replace(/[…]/g, '...')          // … wordt ...
    .replace(/[‐-―-]/g, ' ')    // niet-evenveel wordt niet evenveel
    .replace(/[‘’'`´]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(t: string): string {
  return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Komt het woord voor in de opsomming?
 *
 * Haakjes maken optionele delen: "(er)voor" dekt zowel "voor" als "ervoor", en
 * "weg(nemen)" zowel "weg" als "wegnemen". Daarom wordt de tekst in twee
 * varianten gelegd — een zonder en een met de haakjesinhoud — en telt een
 * treffer in een van beide.
 *
 * Woordgrenzen zijn nodig, anders zou "voor" ook aanslaan op "vooruit" en
 * "voorwerpen", precies de doelen die er niet bij horen.
 */
function noemtWoord(omschrijving: string, woord: string): boolean {
  const zonderInhoud = normaliseer(omschrijving.replace(/\([^)]*\)/g, ' '));
  const metInhoud = normaliseer(omschrijving.replace(/[()]/g, ''));
  const patroon = new RegExp(`(^|[^\\p{L}])${escapeRegex(normaliseer(woord))}($|[^\\p{L}])`, 'iu');
  return patroon.test(zonderInhoud) || patroon.test(metInhoud);
}

/**
 * - 'noemt'    : het doel somt begrippen op en dit woord staat erbij
 * - 'algemeen' : het doel somt niets op en dekt het minimumdoel als geheel
 * - 'anders'   : het doel somt begrippen op, maar dit woord hoort er niet bij
 */
export function relevantieVoorWoord(omschrijving: string, woord: string): WoordRelevantie {
  if (!isSpecifiek(omschrijving)) return 'algemeen';
  return noemtWoord(omschrijving, woord) ? 'noemt' : 'anders';
}
