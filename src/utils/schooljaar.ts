/**
 * Het schooljaar, opgedeeld in didactische weken.
 *
 * Een schooljaar loopt van 1 september tot en met 30 juni. De data worden
 * berekend, niet ingetypt: met vaste constanten bleef de app na 1 september de
 * cijfers van vorig jaar tonen, en dat las als "dit doel heb je al geoefend"
 * terwijl het schooljaar net begon.
 *
 * Juli en augustus horen bij het schooljaar dat net afliep: wie in de vakantie
 * terugkijkt, wil het jaar zien dat achter de rug is.
 *
 * Welk schooljaar iemand bekijkt, staat in SchooljaarContext. De functies hier
 * rekenen met een startjaar en weten daar zelf niets van.
 */

const STARTMAAND = 8; // september, 0-based
const EINDMAAND = 5; // juni, 0-based
const EINDDAG = 30;

const tweeCijfers = (n: number) => String(n).padStart(2, '0');
const alsDatumtekst = (d: Date) =>
  `${d.getFullYear()}-${tweeCijfers(d.getMonth() + 1)}-${tweeCijfers(d.getDate())}`;

/** Het startjaar van het schooljaar waarin deze datum valt. */
export function huidigSchooljaar(datum = new Date()): number {
  return datum.getMonth() >= STARTMAAND ? datum.getFullYear() : datum.getFullYear() - 1;
}

export function schooljaarStart(startjaar: number): Date {
  return new Date(startjaar, STARTMAAND, 1);
}

export function schooljaarEind(startjaar: number): Date {
  return new Date(startjaar + 1, EINDMAAND, EINDDAG);
}

/** '2026-09-01' */
export const schooljaarStartTekst = (startjaar: number) => alsDatumtekst(schooljaarStart(startjaar));
/** '2027-06-30' */
export const schooljaarEindTekst = (startjaar: number) => alsDatumtekst(schooljaarEind(startjaar));
/** '2026-2027' */
export const schooljaarLabel = (startjaar: number) => `${startjaar}-${startjaar + 1}`;

/** Weeknummer van een datum, geteld vanaf de start van het schooljaar (0-based). */
export const getWeekNumber = (date: Date, schoolYearStart: Date): number => {
  const diff = date.getTime() - schoolYearStart.getTime();
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
};

/** Startdatums van alle weken in een schooljaar. */
export const getSchoolYearWeeks = (startjaar: number) => {
  const start = schooljaarStart(startjaar);
  const end = schooljaarEind(startjaar);
  const weeks: Date[] = [];
  const current = new Date(start);

  while (current < end) {
    weeks.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }

  return { start, end, weeks };
};
