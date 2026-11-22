/*
  Shared logic for the "kleuter" batch (kleuter games, Is het evenveel,
  Rekenmachine):
  * useKleuterTracker — progress counters WITHOUT the "goed gedaan" praise
    (the iOS kleuter games never praise; useExerciseTracker does every 5th).
  * useVoiceChoice — port of the iOS `.voiceChoice` modifier: listen for ANY
    option (its content, or its place "eerste/tweede…") and fire that
    option's `select`, so a wrong spoken option is selected too.
*/
import { useCallback, useRef, useState } from 'react';
import { useListen, useMic } from '../../hooks';
import { useSettings } from '../../settings';
import { trackCorrect, trackShown } from '../../lib/progress';
import { containsAnyWord, matchesPosition, saysNumber, spellInteger } from '../../lib/dutch';

/**
 * Counter + progress rows for exercises that iOS does not praise.
 * `prefix` = progress key (`<prefix>_shown` / `<prefix>_correct`).
 */
export function useKleuterTracker(prefix: string) {
  const [correct, setCorrect] = useState(0);
  const shown = useCallback(() => trackShown(prefix), [prefix]);
  const markCorrect = useCallback(() => {
    trackCorrect(prefix);
    setCorrect((c) => c + 1);
  }, [prefix]);
  return { correct, shown, markCorrect };
}

/** What a spoken option should match (iOS VoiceTarget.number / .words). */
export type VoiceTarget = { number: number } | { words: string[] };

export interface VoiceOption {
  target: VoiceTarget;
  select: () => void;
}

export function targetKey(t: VoiceTarget): string {
  return 'number' in t ? `n${t.number}` : 'w' + t.words.join(',');
}

/** Text shown in the "Wat kan je zeggen?" sheet (iOS spokenHint). */
export function spokenHint(t: VoiceTarget): string {
  return 'number' in t ? spellInteger(t.number) : t.words.join(' / ');
}

function matchesTarget(transcript: string, t: VoiceTarget): boolean {
  if ('number' in t) return saysNumber(transcript, t.number);
  return containsAnyWord(transcript, t.words);
}

/**
 * Multiple-choice voice answers for a touch exercise. Listens while voice
 * answers are on, the mic is ready and `active` is true. `roundKey` must
 * change for every new question so the recogniser re-arms.
 */
export function useVoiceChoice(options: VoiceOption[], active: boolean, roundKey: string) {
  const { settings } = useSettings();
  const mic = useMic();
  const chosen = useRef(-1);
  const key = roundKey + '|' + options.map((o) => targetKey(o.target)).join(',');
  useListen(settings.voiceAnswers && mic.ready && active && options.length > 0, key, () => ({
    match: (text, alts) => {
      for (const x of [text, ...alts]) {
        for (let i = 0; i < options.length; i++) {
          if (matchesTarget(x, options[i].target) || matchesPosition(x, i + 1)) {
            chosen.current = i;
            return true;
          }
        }
      }
      return false;
    },
    onMatch: () => {
      const i = chosen.current;
      chosen.current = -1;
      if (i >= 0) options[i]?.select();
    },
  }));
}

/** Dots per row in a DotPattern (≤5, like a five-frame). */
export function dotRows(count: number, perRow = 5): number[] {
  const out: number[] = [];
  for (let r = count; r > 0; r -= perRow) out.push(Math.min(perRow, r));
  return out;
}
