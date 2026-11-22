/*
  Non-component helpers for the "rangorde" batch: colours, block count,
  ordinal matching and the move-on-after-celebration hook.
*/
import { useCallback, useMemo, useRef } from 'react';
import { C } from '../../ui';
import { useTimer } from '../../hooks';
import type { LeerlingSettings } from '../../settings';
import { voice } from '../../lib/audio';
import { ORDINALS, matchesPosition, tokenMatchesTarget, tokens, wordToNumber } from '../../lib/dutch';

export const GOLD_GRADIENT = `linear-gradient(180deg, ${C.goldMid}, ${C.gold})`;

/** iOS maxBlocks: rangordeMax clamped to 2…10, then capped by the niveau. */
export function rangordeMaxBlocks(s: LeerlingSettings): number {
  return Math.max(1, Math.min(Math.min(10, Math.max(2, s.rangordeMax)), s.maxNumber));
}

/**
 * Move on after a celebration: waits `ms`, then until our own audio (e.g. the
 * "goed gedaan" every 5th success) has finished — like iOS, which plays the
 * praise fully before the pause. `cancel()` (skip / new round) drops it.
 */
export function useAdvance() {
  const later = useTimer();
  const token = useRef(0);
  const cancel = useCallback(() => { token.current++; }, []);
  const schedule = useCallback((fn: () => void, ms: number) => {
    const my = ++token.current;
    later(() => {
      void voice.waitUntilQuiet().then(() => { if (my === token.current) fn(); });
    }, ms);
  }, [later]);
  // Stable object, so it can sit in useCallback deps.
  return useMemo(() => ({ schedule, cancel }), [schedule, cancel]);
}

/* ------------------------------------------------------------------ */
/* Ordinals                                                             */
/* ------------------------------------------------------------------ */

/**
 * Ordinal (1…10) a single spoken token stands for: "derde", and the forms
 * Chrome writes as digits ("3e", "2de", "1ste" — after digit normalisation
 * these arrive as "driee", "tweede", "eenste").
 */
export function ordinalOfToken(tok: string): number | null {
  const i = ORDINALS.indexOf(tok);
  if (i >= 0) return i + 1;
  const d = tok.match(/^(\d+)(e|de|ste)$/);
  if (d) return parseInt(d[1], 10);
  for (const suf of ['ste', 'de', 'e']) {
    if (tok.length > suf.length && tok.endsWith(suf)) {
      const n = wordToNumber(tok.slice(0, -suf.length));
      if (n !== null && n >= 1) return n;
    }
  }
  return null;
}

/**
 * Does the transcript name ordinal position `pos`? Same as the iOS target
 * (ordinal word, recogniser token rules) + VoiceTarget.matchesPosition
 * ("nummer 3"), plus the digit forms above.
 */
export function saysOrdinal(text: string, pos: number): boolean {
  const word = ORDINALS[pos - 1];
  if (!word) return false;
  if (tokens(text).some((tok) => tokenMatchesTarget(tok, word) || ordinalOfToken(tok) === pos)) return true;
  return matchesPosition(text, pos);
}

/** Does the transcript contain one of `words` as a token (iOS VoiceTarget.words)? */
export function saysWord(text: string, word: string): boolean {
  return tokens(text).some((tok) => tokenMatchesTarget(tok, word));
}
