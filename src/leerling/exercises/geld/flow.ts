/*
  Voice + round-flow helpers for the geld batch:
  * transcriptHasNumber — port of iOS VoiceTarget.transcriptHasNumber
    (exact number or counting run ending at it; stricter than saysNumber).
  * saysEuro — "euro(s)" or the € sign Chrome writes for it.
  * playComponents — iOS NumberVoice.playComponents: a stitched sequence of
    instruction fragments + number clips (gated by sound only, like iOS).
  * useAfterCorrect — iOS celebration task: confirmation audio, then the
    counter (+ "goed gedaan" every 5th, from the tracker), then a pause and
    the next round; abandoned when the round changes or the page closes.
*/
import { useCallback, useEffect, useRef } from 'react';
import { sleep, voice } from '../../lib/audio';
import { matchesSpelled, numberClips, spellInteger, tokens } from '../../lib/dutch';

/** A digit run is n, or counting that ends at n ("345" for 3-4-5). */
function runMatches(run: string, n: number): boolean {
  if (parseInt(run, 10) === n) return true;
  if (run.length < 2) return false;
  for (let start = n - 1; start >= 1; start--) {
    let s = '';
    for (let k = start; k <= n; k++) s += String(k);
    if (s === run) return true;
  }
  return false;
}

/** iOS VoiceTarget.transcriptHasNumber. */
export function transcriptHasNumber(transcript: string, n: number): boolean {
  for (const tok of tokens(transcript)) {
    if (/^\d+$/.test(tok) && runMatches(tok, n)) return true;
  }
  return matchesSpelled(transcript, spellInteger(n));
}

/** The transcript contains the word "euro(s)" — or the € sign Chrome writes for it. */
export function saysEuro(transcript: string): boolean {
  if (transcript.includes('€')) return true;
  const toks = tokens(transcript);
  return toks.includes('euro') || toks.includes('euros');
}

export type Comp = { text: string } | { number: number } | { clips: string[] };

/** Number clips + "euro" ("zeven euro") as one clip sequence. */
export function euroComps(n: number, unit: 'euro' | 'cent' = 'euro'): Comp {
  return { clips: [...numberClips(n), unit] };
}

/**
 * Stitched prompt (instruction fragments + numbers), like iOS playComponents:
 * not gated by the "instructies voorlezen" setting, only by sound.
 */
export function playComponents(parts: Comp[]): Promise<void> {
  return voice.playParts(parts, true);
}

/* ------------------------------------------------------------------ */
/* Round flow                                                           */
/* ------------------------------------------------------------------ */

/**
 * Returns `run(round, confirm, done, pauseMs)`: plays `confirm` audio, calls
 * `done` (count it — the tracker adds "goed gedaan" every 5th), waits until the
 * voice is quiet + `pauseMs`, then `next()` — unless `roundRef` moved on.
 */
export function useAfterCorrect(roundRef: { current: number }, next: () => void) {
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  const nextRef = useRef(next);
  nextRef.current = next;
  return useCallback(async (round: number, confirm: (() => Promise<void>) | null, done: () => void, pauseMs: number) => {
    const still = () => alive.current && roundRef.current === round;
    if (confirm) await confirm();
    if (!still()) return;
    done();
    await voice.waitUntilQuiet();
    await sleep(pauseMs);
    if (still()) nextRef.current();
  }, [roundRef]);
}

