/*
  Days of the week — port of iOS Models/WeekDay.swift (maandag = 0 … zondag = 6).
  Used by "Dagen van de week" and "Gisteren en morgen".
*/
export const WEEK_DAYS = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'] as const;

export type WeekDay = number; // 0…6

/** Lowercased Dutch word (speech matching + clip name). */
export const dayWord = (d: WeekDay) => WEEK_DAYS[((d % 7) + 7) % 7];
/** Capitalised label for display. */
export const dayLabel = (d: WeekDay) => {
  const w = dayWord(d);
  return w[0].toUpperCase() + w.slice(1);
};
export const nextDay = (d: WeekDay) => (d + 1) % 7;
export const previousDay = (d: WeekDay) => (d + 6) % 7;
