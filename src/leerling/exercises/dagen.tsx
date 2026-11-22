/*
  "Dagen van de week" — port of iOS DagenView/ViewModel.
  The child recites maandag … zondag in order; each day card lights up as it
  is heard (sequence matching like tellen). All seven → celebration, new round
  after 1.6 s. Hint (lamp) says the next day; the skip pill restarts the round.
  The prompt is spoken once per session. Analytics prefix: dagen.
*/
import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, CheckCircle2 } from 'lucide-react';
import { C, ExerciseShell, cx } from '../ui';
import { useExerciseTracker, useListen, useMic, useStopOnUnmount, useTimer } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { t } from '../strings';
import { WEEK_DAYS, dayLabel, dayWord } from './taal/weekdays';
import { VoiceFooter } from './taal/VoiceFooter';

const N = WEEK_DAYS.length;

/** iOS advance(): find day[count], day[count+1]… in order in the transcript. */
function advance(text: string, count: number): number {
  const s = text.toLowerCase();
  let c = count;
  let from = 0;
  while (c < N) {
    const i = s.indexOf(dayWord(c), from);
    if (i === -1) break;
    c += 1;
    from = i + dayWord(c - 1).length;
  }
  return c;
}

export default function Dagen() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const mic = useMic();
  const tracker = useExerciseTracker('dagen');
  const later = useTimer();
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const [done, setDone] = useState(false);
  const [round, setRound] = useState(0);
  const prompted = useRef(false);

  const startRound = () => {
    countRef.current = 0;
    setCount(0);
    setDone(false);
    setRound((r) => r + 1);
  };

  useEffect(() => { startRound(); }, []);

  useEffect(() => {
    if (round === 0) return;
    tracker.shown();
    if (!prompted.current) {
      prompted.current = true;
      void voice.playInstruction(t('dagen.prompt'), settings.spokenInstructions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  useListen(mic.ready && !done && round > 0, `dagen-${round}`, () => ({
    stabilityMs: 0,
    clearAfterMs: 2500,
    onText: (text, _final, alts) => {
      let best = countRef.current;
      for (const x of [text, ...alts]) best = Math.max(best, advance(x, countRef.current));
      if (best > countRef.current) {
        countRef.current = best;
        setCount(best);
      }
    },
    match: () => countRef.current >= N,
    onMatch: () => {
      setCount(N);
      setDone(true);
      tracker.markCorrect();
      later(async () => {
        await voice.waitUntilQuiet(); // let "goed gedaan" finish first
        startRound();
      }, 1600);
    },
  }));

  const hint = () => {
    if (done || countRef.current >= N) return;
    void voice.playInstruction(dayWord(countRef.current), true);
  };

  return (
    <ExerciseShell
      mode="dagen"
      correct={tracker.correct}
      metrics={[{ label: 'Keer gedaan', value: tracker.correct }]}
      onHint={hint}
      hintLabel="Welke dag komt nu?"
      hideNiveau
      footer={<VoiceFooter hint={t('dagen.listening')} onSkip={startRound} restartIcon />}
    >
      <p className="font-baloo font-bold text-2xl sm:text-3xl text-center mb-4">{t('dagen.prompt')}</p>
      <div className="relative w-full max-w-6xl h-[46vh] min-h-[220px] flex gap-1.5 sm:gap-2.5">
        {WEEK_DAYS.map((_, d) => {
          const lit = d < count;
          const isNext = d === count && !done;
          return (
            <div
              key={d}
              className="flex-1 min-w-0 flex flex-col items-center justify-center gap-2 rounded-2xl px-1 py-3 transition-all duration-300"
              style={{
                background: lit ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.5)',
                border: `${isNext ? 3 : 1}px solid ${isNext ? C.gold : C.gold + '33'}`,
                transform: lit ? 'scale(1.02)' : undefined,
              }}
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center font-baloo font-bold"
                style={lit
                  ? { background: `linear-gradient(180deg, ${C.goldMid}, ${C.gold})`, color: 'white' }
                  : { background: 'rgba(255,255,255,.7)', color: C.text + '80' }}
              >
                {d + 1}
              </span>
              <span
                className={cx('font-baloo font-bold leading-tight text-center truncate max-w-full',
                  'text-sm md:text-lg lg:text-xl')}
                style={{ color: lit ? C.text : C.text + '66' }}
              >
                {dayLabel(d)}
              </span>
              <CheckCircle2 size={22} style={{ color: C.success, opacity: lit ? 1 : 0 }} className="transition-opacity" />
            </div>
          );
        })}
        {done && (
          <div className="absolute inset-x-0 -top-2 flex justify-center kd-pop pointer-events-none">
            <BadgeCheck size={64} style={{ color: C.success }} />
          </div>
        )}
      </div>
    </ExerciseShell>
  );
}
