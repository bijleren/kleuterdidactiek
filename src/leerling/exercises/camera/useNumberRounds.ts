/*
  The shared question flow of Schrijf dit getal, Cijferdictee and Tekenen
  (iOS WriteNumberViewModel / DictationViewModel / TekenenViewModel):

    nextNumber → random target at the niveau (never the same twice), `<prefix>_shown`,
                 the prompt once (playPromptOnce) then — for write/dictation — the number
    correct    → celebrate, speak the number fully, `<prefix>_correct`
                 ("goed gedaan" every 5th, via the tracker), 1 s pause, next number
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { useExerciseTracker, useTimer } from '../../hooks';
import { useSettings } from '../../settings';
import { sleep, voice } from '../../lib/audio';
import { randIntExcluding } from '../../lib/dutch';
import { t } from '../../strings';

const CELEBRATION_MS = 1000;

export function useNumberRounds(prefix: string, promptKey: string, speakNumberOnShow: boolean) {
  const { settings } = useSettings();
  const tracker = useExerciseTracker(prefix);
  const later = useTimer();
  const [q, setQ] = useState<{ target: number; round: number } | null>(null);
  const [solved, setSolved] = useState(false);
  const [seen, setSeen] = useState<string | null>(null);
  const qRef = useRef(q);
  qRef.current = q;
  const solvedRef = useRef(false);
  const prompted = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const lo = settings.allowZero ? 0 : 1;
  const hi = settings.maxNumber;

  const next = useCallback(() => {
    solvedRef.current = false;
    setQ((prev) => ({ target: randIntExcluding(lo, hi, prev?.target), round: (prev?.round ?? 0) + 1 }));
    setSolved(false);
    setSeen(null);
  }, [lo, hi]);

  // First number, and a fresh one when the niveau changes.
  useEffect(() => { next(); }, [next]);

  useEffect(() => {
    if (!q) return;
    tracker.shown();
    const parts: Array<{ text: string } | { number: number }> = [];
    if (!prompted.current) {
      prompted.current = true;
      // (playParts stops after a skipped instruction, so only add it when it will play.)
      if (settings.spokenInstructions) parts.push({ text: t(promptKey) });
    }
    if (speakNumberOnShow) parts.push({ number: q.target });
    if (parts.length) void voice.playParts(parts, settings.spokenInstructions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q?.round]);

  const correct = useCallback(() => {
    const cur = qRef.current;
    if (!cur || solvedRef.current) return;
    solvedRef.current = true;
    setSolved(true);
    setSeen(String(cur.target));
    void (async () => {
      // (Capped: a clip that never ends must not block the exercise.)
      await Promise.race([voice.playNumber(cur.target), sleep(5000)]);
      if (!alive.current || qRef.current?.round !== cur.round) return;
      tracker.markCorrect(String(cur.target));
      await voice.waitUntilQuiet(4000);
      if (!alive.current || qRef.current?.round !== cur.round) return;
      later(next, CELEBRATION_MS);
    })();
  }, [tracker, later, next]);

  const hint = useCallback(() => {
    const cur = qRef.current;
    if (cur && !solvedRef.current) void voice.playNumber(cur.target);
  }, []);

  return {
    target: q?.target ?? null,
    round: q?.round ?? 0,
    solved,
    seen,
    setSeen: (s: string | null) => { if (!solvedRef.current) setSeen(s); },
    next,
    correct,
    hint,
    tracker,
  };
}
