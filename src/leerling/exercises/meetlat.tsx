/*
  "Meetlat" — port of iOS MeetlatView/ViewModel, the ruler variant of Tellen.
  The child counts aloud from 1 to 10 (or 20, settings.meetlatMax, capped at
  the niveau); each number lights up on the ruler, the distance from 0 fills
  in and a marker moves along, tying the count to length. Voice-only.
  Analytics prefix: meetlat.
*/
import { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { C, ExerciseShell, MicPanel, Pill } from '../ui';
import { useExerciseTracker, useListen, useMic, useStopOnUnmount, useTimer } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { t } from '../strings';
import { advanceCount, capToNiveau } from './tellen2/logic';
import { Segmented, SkipButton } from './tellen2/bits';

/** Logical px per centimetre (iPad: ≈52 pt/cm, so it looks like a real ruler). */
const PX_PER_CM = 52;
const INSET = 30;
const H = 260;

function Ruler({ n, count, done }: { n: number; count: number; done: boolean }) {
  const usable = PX_PER_CM * n;
  const W = INSET * 2 + usable;
  const x = (cm: number) => INSET + (usable * cm) / n;
  const rulerH = 120;
  const top = (H - rulerH) / 2;
  const mmSpacing = usable / n / 10;
  const ticks: ReactElement[] = [];
  if (mmSpacing >= 1.4) {
    for (let k = 0; k < n; k++) {
      for (let m = 1; m < 10; m++) {
        const px = x(k + m / 10);
        const h = m === 5 ? rulerH * 0.26 : rulerH * 0.15;
        ticks.push(<line key={`mm${k}-${m}`} x1={px} y1={top} x2={px} y2={top + h} stroke={C.text} strokeOpacity={0.3} strokeWidth={1} />);
      }
    }
  }
  const mx = x(count);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxWidth: W, maxHeight: '48vh' }} role="img" aria-label={`Meetlat, ${count} centimeter`}>
      {/* Ruler body */}
      <rect x={INSET - 8} y={top} width={usable + 16} height={rulerH} rx={12} fill="white" fillOpacity={0.9} stroke={C.gold} strokeOpacity={0.4} strokeWidth={2} />
      {/* Distance 0 → count */}
      {count > 0 && (
        <rect x={x(0)} y={top} width={x(count) - x(0)} height={rulerH} rx={8} fill={C.gold} fillOpacity={0.3}
          style={{ transition: 'width .3s ease' }} />
      )}
      {ticks}
      {/* Whole-cm ticks + numbers */}
      {Array.from({ length: n + 1 }, (_, k) => {
        const counted = k <= count;
        const current = k === count;
        const tickH = current ? rulerH * 0.7 : rulerH * 0.5;
        const color = current ? C.gold : C.text;
        const op = current ? 1 : counted ? 0.7 : 0.4;
        return (
          <g key={k}>
            <line x1={x(k)} y1={top} x2={x(k)} y2={top + tickH} stroke={color} strokeOpacity={op} strokeWidth={current ? 4 : 2} />
            <text x={x(k)} y={top + rulerH + 18} textAnchor="middle" dominantBaseline="central"
              fontSize={current ? 24 : n > 10 ? 18 : 16} fontWeight={800} className="font-baloo"
              fill={color} fillOpacity={current ? 1 : counted ? 0.8 : 0.45}>
              {k}
            </text>
          </g>
        );
      })}
      {/* Marker above the current number */}
      <path d={`M${mx} ${top - 6} L${mx - 9} ${top - 22} L${mx + 9} ${top - 22} Z`} fill={done ? C.success : C.gold}
        style={{ transition: 'd .3s ease' }} />
    </svg>
  );
}

export default function Meetlat() {
  useStopOnUnmount();
  const { settings, update } = useSettings();
  const mic = useMic();
  const tracker = useExerciseTracker('meetlat');
  const later = useTimer();
  const target = capToNiveau(settings.meetlatMax === 20 ? 20 : 10, settings.maxNumber);
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

  useEffect(() => {
    if (round === 0) return;
    tracker.shown();
    if (!prompted.current) {
      // iOS playPromptOnce: spoken for the first round only.
      prompted.current = true;
      void voice.playInstruction(t('meetlat.prompt'), settings.spokenInstructions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  // Ruler length / niveau changed → restart.
  useEffect(() => { startRound(); }, [target]);

  useListen(mic.ready && !done, `meetlat-${round}-${target}`, () => ({
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
      countRef.current = target;
      setCount(target);
      setDone(true);
      tracker.markCorrect();
      void voice.waitUntilQuiet().then(() => later(startRound, 1600));
    },
  }));

  /** "Tip" — say the next number (does not advance the count). */
  const hint = () => {
    if (done || countRef.current >= target) return;
    void voice.playNumber(countRef.current + 1);
  };

  const setMax = (n: number) => {
    const len = n === 20 ? 20 : 10;
    update({ meetlatMax: len });
    // iOS setMax always restarts the round (a new length restarts via the effect).
    if (capToNiveau(len, settings.maxNumber) === target) startRound();
  };

  const lengthChoice = settings.meetlatMax === 20 ? 20 : 10;

  return (
    <ExerciseShell
      mode="meetlat"
      correct={tracker.correct}
      metrics={[{ label: 'Keer geteld', value: tracker.correct }]}
      onHint={hint}
      hintLabel={t('common.hint')}
      extraSettings={
        <div>
          <div className="font-semibold mb-2">Meetlat</div>
          <div className="flex gap-2">
            {[10, 20].map((n) => <Pill key={n} active={lengthChoice === n} onClick={() => setMax(n)}>tot {n}</Pill>)}
          </div>
        </div>
      }
      footer={
        <div className="flex items-center gap-2 max-w-[40rem] mx-auto">
          <div className="flex-1 min-w-0"><MicPanel hint={t('meetlat.listening')} /></div>
          <SkipButton onClick={startRound} restart />
        </div>
      }
    >
      <div className="flex flex-col items-center gap-4 w-full">
        <Segmented value={lengthChoice} onChange={setMax} options={[{ value: 10, label: 'tot 10' }, { value: 20, label: 'tot 20' }]} />
        <p className="font-baloo font-extrabold text-xl sm:text-2xl text-center">{t('meetlat.prompt')}</p>
        <div className="w-full max-w-6xl flex justify-center">
          <Ruler n={target} count={count} done={done} />
        </div>
      </div>
    </ExerciseShell>
  );
}
