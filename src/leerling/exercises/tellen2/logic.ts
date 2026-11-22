/*
  Shared logic for the "tellen2" batch (Speelkaarten, Speelkaarten tellen,
  Dobbelsteen, Handen, Klikblokjes, Meetlat) — small ports of helpers that
  every iOS view model in this batch repeats.
*/
import { numberWord, randInt } from '../../lib/dutch';

/**
 * Next value in 1…max, never the same as the previous one — exactly the iOS
 * rule: `if last == value { value = (value % max) + 1 }`.
 */
export function pickNext(max: number, last?: number | null): number {
  const m = Math.max(1, max);
  let v = randInt(1, m);
  if (last != null && v === last && m > 1) v = (v % m) + 1;
  return v;
}

/** iOS SkillLevel.cap: max(1, min(n, niveau)). */
export function capToNiveau(n: number, maxNumber: number): number {
  return Math.max(1, Math.min(n, maxNumber));
}

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const SUIT_GLYPH: Record<Suit, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
export const SUIT_COLOR: Record<Suit, string> = {
  hearts: '#D12129', diamonds: '#D12129', clubs: '#1F1F24', spades: '#1F1F24',
};
export function randomSuit(): Suit {
  return SUITS[randInt(0, SUITS.length - 1)];
}

/**
 * Normalised pip positions (within the inset pip area) for ranks 1–10,
 * the standard playing-card layout (iOS PlayingCardFace.pipPositions).
 */
export function pipPositions(rank: number): [number, number][] {
  const L = 0.18, C = 0.5, R = 0.82;
  switch (rank) {
    case 1: return [[C, 0.5]];
    case 2: return [[C, 0.1], [C, 0.9]];
    case 3: return [[C, 0.1], [C, 0.5], [C, 0.9]];
    case 4: return [[L, 0.1], [R, 0.1], [L, 0.9], [R, 0.9]];
    case 5: return [[L, 0.1], [R, 0.1], [C, 0.5], [L, 0.9], [R, 0.9]];
    case 6: return [[L, 0.1], [R, 0.1], [L, 0.5], [R, 0.5], [L, 0.9], [R, 0.9]];
    case 7: return [[L, 0.1], [R, 0.1], [C, 0.3], [L, 0.5], [R, 0.5], [L, 0.9], [R, 0.9]];
    case 8: return [[L, 0.1], [R, 0.1], [C, 0.3], [L, 0.5], [R, 0.5], [C, 0.7], [L, 0.9], [R, 0.9]];
    case 9: return [[L, 0.08], [R, 0.08], [L, 0.36], [R, 0.36], [C, 0.5], [L, 0.64], [R, 0.64], [L, 0.92], [R, 0.92]];
    case 10: return [[L, 0.08], [R, 0.08], [C, 0.25], [L, 0.36], [R, 0.36], [L, 0.64], [R, 0.64], [C, 0.75], [L, 0.92], [R, 0.92]];
    default: return [[C, 0.5]];
  }
}

/** Die pip positions (iOS DiceFace.positions) for 1–10. */
export function dicePositions(value: number): [number, number][] {
  const l = 0.18, c = 0.5, r = 0.82;
  switch (value) {
    case 1: return [[c, c]];
    case 2: return [[l, l], [r, r]];
    case 3: return [[l, l], [c, c], [r, r]];
    case 4: return [[l, l], [r, l], [l, r], [r, r]];
    case 5: return [[l, l], [r, l], [c, c], [l, r], [r, r]];
    case 6: return [[l, l], [r, l], [l, c], [r, c], [l, r], [r, r]];
    case 7: return [[l, l], [r, l], [l, c], [c, c], [r, c], [l, r], [r, r]];
    case 8: return [[l, l], [c, l], [r, l], [l, c], [r, c], [l, r], [c, r], [r, r]];
    case 9: return [[l, l], [c, l], [r, l], [l, c], [c, c], [r, c], [l, r], [c, r], [r, r]];
    case 10: {
      const rows = [0.1, 0.3, 0.5, 0.7, 0.9];
      return [...rows.map((y): [number, number] => [0.3, y]), ...rows.map((y): [number, number] => [0.7, y])];
    }
    default: return [[c, c]];
  }
}

/**
 * Advance a running count by finding count+1, count+2… in order in the
 * transcript (iOS MeetlatViewModel.advanceCount / TellenViewModel).
 */
export function advanceCount(text: string, count: number, target: number): number {
  const s = text.toLowerCase();
  let c = count;
  let from = 0;
  while (c < target) {
    const next = c + 1;
    let loc = -1, end = 0;
    for (const cand of [numberWord(next) ?? '', String(next)]) {
      if (!cand) continue;
      const i = s.indexOf(cand, from);
      if (i !== -1 && (loc === -1 || i < loc)) { loc = i; end = i + cand.length; }
    }
    if (loc === -1) break;
    c = next;
    from = end;
  }
  return c;
}
