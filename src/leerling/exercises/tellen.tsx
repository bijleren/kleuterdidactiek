/*
  "Tellen" — port of iOS TellenView/ViewModel.
  Count aloud from 1 to the niveau (max 20). The numbers climb as a
  staircase; each stair lights up when that number is heard in order.
  Analytics prefix: tellen.
*/
import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, RotateCcw } from 'lucide-react';
import { C, ExerciseShell, MicPanel, cx } from '../ui';
import { useExerciseTracker, useListen, useMic, useStopOnUnmount, useTimer } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { numberWord } from '../lib/dutch';
import { t } from '../strings';

/** Advance `count` by finding count+1, count+2… in order in the transcript (iOS advanceCount). */
function advanceCount(text: string, count: number, target: number): number {
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

export default function Tellen() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const mic = useMic();
  const tracker = useExerciseTracker('tellen');
  const later = useTimer();
  const target = Math.max(1, Math.min(settings.maxNumber, 20));
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const [done, setDone] = useState(false);
  const [round, setRound] = useState(0);

  const startRound = () => {
    countRef.current = 0;
    setCount(0);
    setDone(false);
    setRound((r) => r + 1);
  };

  useEffect(() => {
    if (round === 0) return;
    tracker.shown();
    void voice.playInstruction(t('tellen.prompt', target), settings.spokenInstructions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, target]);

  // Niveau changed → restart.
  useEffect(() => { startRound(); }, [target]);

  useListen(mic.ready && !done, `tellen-${round}-${target}`, () => ({
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
      later(startRound, 1600);
    },
  }));

  const hint = () => {
    if (done || countRef.current >= target) return;
    void voice.playNumber(countRef.current + 1);
  };

  const compact = target > 10;

  return (
    <ExerciseShell
      mode="tellen"
      correct={tracker.correct}
      metrics={[{ label: 'Keer geteld', value: tracker.correct }]}
      onHint={hint}
      hintLabel="Welk getal komt nu?"
      footer={
        <div className="flex items-center gap-2 max-w-[40rem] mx-auto">
          <div className="flex-1"><MicPanel hint={t('tellen.listening')} /></div>
          <button className="kd-icon-btn !w-14 !h-14" onClick={startRound} aria-label="Opnieuw beginnen" title="Opnieuw beginnen">
            <RotateCcw size={22} />
          </button>
        </div>
      }
    >
      <p className="font-baloo font-bold text-2xl sm:text-3xl text-center mb-4">{t('tellen.prompt', target)}</p>
      <div className="relative w-full max-w-5xl h-[52vh] min-h-[260px] bg-white rounded-3xl shadow-md p-3 sm:p-5">
        <div className={cx('flex items-end h-full', compact ? 'gap-1' : 'gap-1.5 sm:gap-2.5')}>
          {Array.from({ length: target }, (_, k) => k + 1).map((i) => {
            const lit = i <= count;
            const isNext = !done && i === count + 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center h-full justify-end min-w-0">
                <span
                  className={cx('font-baloo font-bold leading-none mb-1', compact ? 'text-sm sm:text-lg' : 'text-lg sm:text-2xl')}
                  style={{ color: lit ? C.gold : C.text + '73' }}
                >
                  {i}
                </span>
                <div className="w-full flex flex-col-reverse gap-[2px]" style={{ height: `calc((100% - 2rem) * ${i / target})` }}>
                  {Array.from({ length: i }, (_, u) => (
                    <div
                      key={u}
                      className="flex-1 rounded-[4px] transition-colors duration-300"
                      style={{
                        background: lit ? `linear-gradient(180deg, ${C.goldMid}, ${C.gold})` : 'rgba(255,255,255,.65)',
                        border: `${isNext ? 2 : 1}px solid ${isNext ? C.gold : C.gold + (lit ? '8c' : '38')}`,
                      }}
                    />
                  ))}
                </div>
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
