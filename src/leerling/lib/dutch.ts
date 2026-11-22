/*
  Dutch number words and voice matching — a port of the iOS app's
  NumberToDutch, DutchNumber, DutchNumberAudio and VoiceTarget helpers.
*/

const DIRECT: Record<number, string> = {
  0: 'nul', 1: 'een', 2: 'twee', 3: 'drie', 4: 'vier',
  5: 'vijf', 6: 'zes', 7: 'zeven', 8: 'acht', 9: 'negen',
  10: 'tien', 11: 'elf', 12: 'twaalf',
  13: 'dertien', 14: 'veertien', 15: 'vijftien',
  16: 'zestien', 17: 'zeventien', 18: 'achttien', 19: 'negentien',
  20: 'twintig', 30: 'dertig', 40: 'veertig', 50: 'vijftig',
  60: 'zestig', 70: 'zeventig', 80: 'tachtig', 90: 'negentig',
  100: 'honderd',
};

/** 0…100 → Dutch word ("tweeëntwintig"), else null. */
export function numberWord(n: number): string | null {
  if (DIRECT[n] !== undefined) return DIRECT[n];
  if (n <= 20 || n >= 100) return null;
  const ones = n % 10;
  const tens = Math.floor(n / 10) * 10;
  if (ones === 0) return DIRECT[tens];
  const combining = ones === 2 ? 'tweeën' : ones === 3 ? 'drieën' : DIRECT[ones] + 'en';
  return combining + DIRECT[tens];
}

/** Any integer → Dutch words. */
export function spellInteger(n: number): string {
  if (n < 0) return 'min ' + spellInteger(-n);
  const w = numberWord(n);
  if (w) return w;
  if (n < 1000) {
    const h = Math.floor(n / 100), r = n % 100;
    const hundreds = h === 1 ? 'honderd' : spellInteger(h) + 'honderd';
    return r === 0 ? hundreds : hundreds + spellInteger(r);
  }
  if (n < 1_000_000) {
    const th = Math.floor(n / 1000), r = n % 1000;
    const thousands = th === 1 ? 'duizend' : spellInteger(th) + 'duizend';
    return r === 0 ? thousands : thousands + ' ' + spellInteger(r);
  }
  const m = Math.floor(n / 1_000_000), r = n % 1_000_000;
  const millions = m === 1 ? 'een miljoen' : spellInteger(m) + ' miljoen';
  return r === 0 ? millions : millions + ' ' + spellInteger(r);
}

/** Integer → the recorded clip names (public/leerling-audio/getallen). */
export function numberClips(n: number): string[] {
  if (n <= 0) return ['0'];
  const p: string[] = [];
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor(n / 1000) % 1000;
  const units = n % 1000;
  const group3 = (g: number) => {
    const h = Math.floor(g / 100), r = g % 100;
    const out: string[] = [];
    if (h > 0) {
      out.push(String(h * 100));
      if ((r >= 1 && r <= 9) || r === 11 || r === 12) out.push('en');
    }
    if (r > 0) out.push(String(r));
    return out;
  };
  if (millions > 0) { p.push(...group3(millions), 'miljoen'); }
  if (thousands > 0) {
    if (thousands === 1) p.push('1000');
    else p.push(...group3(thousands), '1000');
  }
  if (units > 0) p.push(...group3(units));
  return p;
}

/** Replace digit runs by their Dutch word ("ik zie 5" → "ik zie vijf"). */
export function normalizeDigits(text: string): string {
  return text.replace(/\d+/g, (run) => {
    const n = parseInt(run, 10);
    return numberWord(n) ?? run;
  });
}

/** Lowercase and strip diacritics ("tweeën" → "tweeen", "één" → "een"). */
export function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Ordered word tokens (letters/digits only), folded. */
export function tokens(s: string): string[] {
  return fold(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

export function containsToken(transcript: string, word: string): boolean {
  return tokens(transcript).includes(fold(word));
}

/** True when the transcript contains any of the given words. */
export function containsAnyWord(transcript: string, words: string[]): boolean {
  const toks = new Set(tokens(transcript));
  return words.some((w) => toks.has(fold(w)));
}

/** Spelled phrase appears as one token, or the whole transcript glued equals it. */
export function matchesSpelled(transcript: string, spelled: string): boolean {
  const target = fold(spelled).replace(/[^\p{L}\p{N}]/gu, '');
  if (!target) return false;
  const toks = tokens(transcript);
  return toks.includes(target) || toks.join('') === target;
}

/** Digits in the transcript as a number ("12" → 12), or null. */
export function parseDigits(raw: string): number | null {
  const m = raw.match(/-?\d+(?:[.,]\d+)?/);
  if (!m) return null;
  return parseFloat(m[0].replace(',', '.'));
}

/**
 * Does the transcript say the number `n`? Accepts digits, the spelled word
 * (with/without diacritics), and common child variants ("eentje", "één").
 * Mirrors VoiceTarget.number + SpeechRecognizer.tokenMatchesTarget.
 */
export function saysNumber(transcript: string, n: number): boolean {
  const toks = tokens(transcript);
  for (const tok of toks) {
    if (/^\d+$/.test(tok) && parseInt(tok, 10) === n) return true;
  }
  const spelled = fold(spellInteger(n)).replace(/\s+/g, '');
  if (matchesSpelled(transcript, spelled)) return true;
  for (const tok of toks) if (tokenMatchesTarget(tok, spelled)) return true;
  if (n === 1 && toks.some((t) => t === 'eentje' || t === 'ene')) return true;
  return false;
}

/** Same rules as the iOS recogniser: exact, final t/d flip, or ≥3-letter suffix. */
export function tokenMatchesTarget(token: string, target: string): boolean {
  if (!target) return false;
  if (token === target) return true;
  if (tdFlipEqual(token, target)) return true;
  if (target.length >= 3 && token.endsWith(target)) return true;
  if (target.length >= 3 && token.length >= target.length && tdFlipEqual(token.slice(-target.length), target)) return true;
  return false;
}

function tdFlipEqual(a: string, b: string): boolean {
  if (a.length !== b.length || !a) return false;
  if (a.slice(0, -1) !== b.slice(0, -1)) return false;
  const td = ['t', 'd'];
  return td.includes(a[a.length - 1]) && td.includes(b[b.length - 1]);
}

/** Every number (0…100) that appears in the transcript, in spoken order. */
export function numbersInTranscript(transcript: string): number[] {
  const out: number[] = [];
  for (const tok of tokens(transcript)) {
    if (/^\d+$/.test(tok)) {
      const run = tok;
      const n = parseInt(run, 10);
      // Chrome sometimes glues a counted sequence together ("12345").
      if (run.length > 2 && n > 100) {
        out.push(...splitCountRun(run));
      } else out.push(n);
      continue;
    }
    const n = wordToNumber(tok);
    if (n !== null) out.push(n);
  }
  return out;
}

function splitCountRun(run: string): number[] {
  // Greedy: try to read it as 1,2,3… or 10,11,12… starting at its first number.
  for (const firstLen of [1, 2]) {
    let i = 0;
    let cur = parseInt(run.slice(0, firstLen), 10);
    const out: number[] = [];
    while (i < run.length) {
      const s = String(cur);
      if (run.startsWith(s, i)) { out.push(cur); i += s.length; cur++; }
      else break;
    }
    if (i === run.length && out.length > 1) return out;
  }
  return run.split('').map((d) => parseInt(d, 10));
}

const WORD_TO_NUM: Map<string, number> = (() => {
  const m = new Map<string, number>();
  for (let n = 0; n <= 100; n++) {
    const w = numberWord(n);
    if (w) m.set(fold(w), n);
  }
  m.set('eentje', 1); m.set('ene', 1);
  return m;
})();

export function wordToNumber(tok: string): number | null {
  const f = fold(tok);
  const v = WORD_TO_NUM.get(f);
  return v === undefined ? null : v;
}

export const ORDINALS = ['eerste', 'tweede', 'derde', 'vierde', 'vijfde',
  'zesde', 'zevende', 'achtste', 'negende', 'tiende'];

export function ordinalWord(pos: number): string | null {
  return pos >= 1 && pos <= ORDINALS.length ? ORDINALS[pos - 1] : null;
}

/** Position answer: the ordinal, or "nummer/keuze 2". */
export function matchesPosition(transcript: string, pos: number): boolean {
  const toks = new Set(tokens(transcript));
  const o = ordinalWord(pos);
  if (o && toks.has(o)) return true;
  if (!['keuze', 'keus', 'optie', 'nummer'].some((w) => toks.has(w))) return false;
  const nw = fold(numberWord(pos) ?? '');
  return toks.has(nw) || toks.has(String(pos));
}

/** Rough letter-position similarity used for the "bijna!" hint. */
export function phoneticSimilarity(a: string, b: string): number {
  const x = fold(a).replace(/[^a-z]/g, '');
  const y = fold(b).replace(/[^a-z]/g, '');
  if (!x || !y) return 0;
  let matches = 0;
  for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] === y[i]) matches++;
  return matches / Math.max(x.length, y.length);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function randInt(lo: number, hi: number): number {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

/** Random int in [lo, hi] different from `exclude` (when possible). */
export function randIntExcluding(lo: number, hi: number, exclude?: number | null): number {
  if (hi <= lo) return lo;
  let v = randInt(lo, hi);
  for (let g = 0; g < 8 && v === exclude; g++) v = randInt(lo, hi);
  return v;
}
