/*
  "Rangtelwoorden" — port of iOS RangtelwoordenView/ViewModel.
  Like Tellen, but the child says the ordinals in order: eerste, tweede …
  tiende (capped by the niveau). The staircase lights up as each ordinal is
  heard. Prompt spoken once; the lamp says the next ordinal; "Sla over"
  restarts. Analytics prefix: rangtelwoorden.
*/
import { useEffect, useRef, useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { C, ExerciseShell, MicPanel } from '../ui';
import { useExerciseTracker, useListen, useMic, useStopOnUnmount } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { ordinalWord, tokens } from '../lib/dutch';
import { t } from '../strings';
import { FooterRow } from './rangorde/shared';
import { GOLD_GRADIENT, ordinalOfToken, useAdvance } from './rangorde/logic';

/** Advance `count` by finding ordinal count+1, count+2… in order (iOS advanceCount). */
function advanceCount(text: string, count: number, target: number): number {
  let c = count;
  for (const tok of tokens(text)) {
    if (c >= target) break;
    if (ordinalOfToken(tok) === c + 1) c++;
  }
  return c;
}

export default function Rangtelwoorden() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const mic = useMic();
  const tracker = useExerciseTracker('rangtelwoorden');
  const advance = useAdvance();
  const target = Math.max(1, Math.min(10, settings.maxNumber));
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const [done, setDone] = useState(false);
  const [round, setRound] = useState(0);
  const prompted = useRef(false);

  const startRound = () => {
    advance.cancel();
    countRef.current = 0;
    setCount(0);
    setDone(false);
    setRound((r) => r + 1);
  };

  useEffect(() => {
    if (round === 0) return;
    tracker.shown();
    if (!prompted.current) {
      prompted.current = true;
      void voice.playInstruction(t('rangtelwoorden.prompt'), settings.spokenInstructions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  // Niveau changed → restart.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { startRound(); }, [target]);

  useListen(mic.ready && !done && round > 0, `rangtel-${round}-${target}`, () => ({
    stabilityMs: 0,
    clearAfterMs: 2500,
    onText: (text, _final, alts) => {
      let best = countRef.current;
      for (const x of [text, ...alts]) best = Math.max(best, advanceCount(x, countRef.current, target));
      if (best > countRef.current) {
        countRef.current = best;
        setCount(best);
      }
    },
    match: () => countRef.current >= target,
    onMatch: () => {
      setCount(target);
      setDone(true);
      tracker.markCorrect();
      advance.schedule(startRound, 1600);
    },
  }));

  const hint = () => {
    if (done || countRef.current >= target) return;
    const w = ordinalWord(countRef.current + 1);
    if (w) void voice.playInstruction(w, true);
  };

  return (
    <ExerciseShell
      mode="rangtelwoorden"
      correct={tracker.correct}
      metrics={[{ label: 'Keer gedaan', value: tracker.correct }]}
      onHint={hint}
      hintLabel="Welk woord komt nu?"
      footer={<FooterRow onSkip={startRound}><MicPanel hint={t('rangtelwoorden.listening')} /></FooterRow>}
    >
      <p className="font-baloo font-bold text-2xl sm:text-3xl text-center mb-4">{t('rangtelwoorden.prompt')}</p>
      <div className="relative w-full max-w-5xl h-[52vh] min-h-[260px] bg-white rounded-3xl shadow-md p-3 sm:p-5">
        <div className="flex items-end h-full gap-1.5 sm:gap-2.5">
          {Array.from({ length: target }, (_, k) => k + 1).map((i) => {
            const lit = i <= count;
            const isNext = !done && i === count + 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center h-full justify-end min-w-0">
                <span
                  className="font-baloo font-bold leading-none mb-1 text-lg sm:text-2xl"
                  style={{ color: lit ? C.gold : C.text + '73' }}
                >
                  {i}e
                </span>
                <div
                  className="w-full rounded-lg transition-all duration-300"
                  style={{
                    height: `calc((100% - 2rem) * ${i / target})`,
                    background: lit ? GOLD_GRADIENT : 'rgba(255,255,255,.65)',
                    border: `${isNext ? 3 : 1.5}px solid ${isNext ? C.gold : C.gold + (lit ? '80' : '33')}`,
                    boxShadow: lit ? '0 1px 3px rgba(0,0,0,.12)' : '0 1px 3px rgba(0,0,0,.05)',
                  }}
                />
              </div>
            );
          })}
        </div>
        {done && (
          <div className="absolute inset-x-0 top-4 flex justify-center kd-pop">
            <BadgeCheck size={64} style={{ color: C.success }} />
          </div>
        )}
      </div>
    </ExerciseShell>
  );
}
