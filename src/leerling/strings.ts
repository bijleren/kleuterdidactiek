import strings from './strings.nl.json';

const table = strings as Record<string, string>;

/**
 * Dutch (nl-BE) UI strings, converted from the iOS app's Localizable.strings
 * so the web version uses exactly the same wording. `%d` / `%@` / `%1$@`
 * placeholders are filled in order from `args`.
 */
export function t(key: string, ...args: (string | number)[]): string {
  const raw = table[key];
  if (raw === undefined) return key;
  let i = 0;
  return raw.replace(/%(\d+\$)?(lld|ld|d|@|s|\.\df|f)/g, (_m, pos: string | undefined) => {
    const idx = pos ? parseInt(pos, 10) - 1 : i++;
    const v = args[idx];
    return v === undefined ? '' : String(v);
  });
}

export function hasString(key: string): boolean {
  return key in table;
}
