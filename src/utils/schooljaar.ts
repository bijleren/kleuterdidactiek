/**
 * Het schooljaar opgedeeld in didactische weken.
 *
 * Deze definitie stond eerder alleen in GoalsOverview. Nu de leerplandoelen
 * dezelfde weekbalk tonen staat ze hier, zodat een wijziging aan het schooljaar
 * op één plek gebeurt en de twee overzichten niet uit elkaar kunnen lopen.
 */

export const SCHOOLJAAR_START = '2025-09-01';
export const SCHOOLJAAR_EIND = '2026-06-30';
export const SCHOOLJAAR_LABEL = '2025-2026';

/** Weeknummer van een datum, geteld vanaf de start van het schooljaar (0-based). */
export const getWeekNumber = (date: Date, schoolYearStart: Date): number => {
  const diff = date.getTime() - schoolYearStart.getTime();
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
};

/** Startdatums van alle weken in het schooljaar. */
export const getSchoolYearWeeks = () => {
  const start = new Date(SCHOOLJAAR_START);
  const end = new Date(SCHOOLJAAR_EIND);
  const weeks: Date[] = [];
  const current = new Date(start);

  while (current < end) {
    weeks.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }

  return { start, end, weeks };
};
