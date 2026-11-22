/*
  "Is het evenveel" — port of iOS Features/IsHetEvenveel (View + ViewModel).
  Two areas each show 1…min(10, niveau) dots of random sizes (so size is no
  cue for quantity); the child taps Ja or Nee: same amount? Half of the
  rounds are equal. "Is het evenveel?" is spoken once when the exercise
  opens. Correct → green, next round after 0.9 s (after "goed gedaan" on
  every 5th, from the tracker); wrong → red for 0.6 s. "Overslaan" skips.
  Touch only, like iOS (no voice answers there).
  Analytics prefix: evenveel.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { FastForward } from 'lucide-react';
import { C, ExerciseShell, cx } from '../ui';
import { useExerciseTracker, useStopOnUnmount, useTimer } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { randInt } from '../lib/dutch';
import { t } from '../strings';

interface Dot { id: number; factor: number }

let dotId = 0;
const makeDots = (n: number): Dot[] =>
  Array.from({ length: n }, () => ({ id: ++dotId, factor: 0.4 + Math.random() * 0.6 }));

const MIN_DOT = 22;
const MAX_DOT = 58;
const PER_ROW = 4;

export default function IsHetEvenveel() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const tracker = useExerciseTracker('evenveel');
  const advance = useTimer();
  const clearWrong = useTimer();
  const [leftDots, setLeftDots] = useState<Dot[]>([]);
  const [rightDots, setRightDots] = useState<Dot[]>([]);
  const [solved, setSolved] = useState(false);
  const [wrong, setWrong] = useState<boolean | null>(null);
  const [round, setRound] = useState(0);
  const prompted = useRef(false);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const equal = leftDots.length === rightDots.length;
  const maxDots = Math.max(1, Math.min(10, settings.maxNumber));

  const nextRound = useCallback(() => {
    const n1 = randInt(1, maxDots);
    let n2 = n1;
    if (Math.random() >= 0.5 && maxDots > 1) {
      do { n2 = randInt(1, maxDots); } while (n2 === n1);
    }
    setLeftDots(makeDots(n1));
    setRightDots(makeDots(n2));
    setSolved(false);
    setWrong(null);
    setRound((r) => r + 1);
  }, [maxDots]);

  useEffect(() => { nextRound(); }, [nextRound]);
  useEffect(() => {
    if (!round) return;
    tracker.shown();
    // Only when the exercise loads — repeating it every round is too much.
    if (!prompted.current) {
      prompted.current = true;
      void voice.playInstruction(t('evenveel.prompt'), settings.spokenInstructions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const answer = (v: boolean) => {
    if (solved) return;
    if (v === equal) {
      setWrong(null);
      setSolved(true);
      const praise = (tracker.correct + 1) % 5 === 0;
      tracker.markCorrect();
      if (praise) {
        // "goed gedaan" (played by the tracker) finishes before moving on.
        void voice.waitUntilQuiet().then(() => { if (alive.current) advance(nextRound, 900); });
      } else {
        advance(nextRound, 900);
      }
    } else {
      setWrong(v);
      clearWrong(() => setWrong((w) => (w === v ? null : w)), 600);
    }
  };

  const area = (dots: Dot[]) => {
    const rows: Dot[][] = [];
    for (let i = 0; i < dots.length; i += PER_ROW) rows.push(dots.slice(i, i + PER_ROW));
    return (
      <div
        className="flex-1 min-w-0 rounded-[20px] p-3 flex flex-col items-center justify-center gap-2.5"
        style={{ background: 'rgba(255,255,255,.65)', border: `2px solid ${C.gold}4d` }}
      >
        {rows.map((row, r) => (
          <div key={r} className="flex items-center gap-2.5">
            {row.map((d) => {
              const s = MIN_DOT + (MAX_DOT - MIN_DOT) * d.factor;
              return (
                <span
                  key={d.id}
                  className="rounded-full kd-pop"
                  style={{ width: s, height: s, background: C.gold, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.55)' }}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const yesNo = (v: boolean) => {
    const isCorrect = solved && v === equal;
    const tint = v ? C.success : C.danger;
    return (
      <button
        onClick={() => answer(v)}
        disabled={solved}
        className={cx('min-w-[130px] px-6 py-4 rounded-full text-white font-baloo font-bold text-2xl leading-none shadow-sm active:scale-95 transition',
          wrong === v && 'kd-shake')}
        style={{ background: isCorrect ? C.success : wrong === v ? C.danger : tint }}
      >
        {t(v ? 'kleuter.yes' : 'kleuter.no')}
      </button>
    );
  };

  return (
    <ExerciseShell
      mode="isHetEvenveel"
      correct={tracker.correct}
      metrics={[{ label: 'Juist', value: tracker.correct }]}
    >
      <div className="w-full max-w-4xl flex flex-col items-center gap-[18px] h-[calc(100vh-7.5rem)] min-h-[440px] max-h-[720px]">
        <p className="font-baloo font-bold text-2xl sm:text-[30px] text-center">{t('evenveel.prompt')}</p>
        <div key={round} className="w-full flex-1 min-h-0 flex gap-3 sm:gap-[22px]">
          {area(leftDots)}
          {area(rightDots)}
        </div>
        <div className="flex gap-[18px]">
          {yesNo(true)}
          {yesNo(false)}
        </div>
        <div className="w-full flex justify-end">
          <button
            onClick={nextRound}
            className="flex items-center gap-2 px-[18px] py-2.5 rounded-xl text-white font-baloo font-bold text-[15px]"
            style={{ background: C.text + '8c' }}
          >
            <FastForward size={16} fill="currentColor" /> {t('common.skip')}
          </button>
        </div>
      </div>
    </ExerciseShell>
  );
}
