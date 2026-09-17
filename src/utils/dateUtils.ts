/*
  Alle datums en tijden die de gebruiker ziet of kiest, zijn Belgische tijd: de lokale
  tijd van het toestel. Gebruik nooit toISOString() om een datum of uur voor de gebruiker
  te maken: dat geeft UTC, waardoor een uur 1 à 2 uur verschuift en een datum rond
  middernacht op de vorige dag valt. Naar de database gaan tijdstippen wel als
  toISOString(), want dat is een volledig tijdstip met tijdzone.
*/

const tweeCijfers = (n: number) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' in Belgische tijd. */
export function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${tweeCijfers(date.getMonth() + 1)}-${tweeCijfers(date.getDate())}`;
}

/** 'HH:mm' in Belgische tijd. */
export function toLocalTimeString(date: Date): string {
  return `${tweeCijfers(date.getHours())}:${tweeCijfers(date.getMinutes())}`;
}

/** 'YYYY-MM-DDTHH:mm' voor een <input type="datetime-local">, in Belgische tijd. */
export function toLocalDateTimeInput(date: Date): string {
  return `${toLocalDateString(date)}T${toLocalTimeString(date)}`;
}

/** Zet de waarde van een datetime-local-veld (Belgische tijd) om naar een tijdstip voor de database. */
export function localDateTimeInputToISO(value: string): string {
  return new Date(value).toISOString();
}

/** Leest 'YYYY-MM-DD' als middernacht Belgische tijd (new Date('YYYY-MM-DD') geeft middernacht UTC). */
export function parseLocalDate(value: string): Date {
  const [jaar, maand, dag] = value.split('-').map(Number);
  return new Date(jaar, maand - 1, dag);
}
