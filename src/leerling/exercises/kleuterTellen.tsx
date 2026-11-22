/*
  "Tellen tot 20" (kleuterTellen) — port of iOS Features/Kleuter/SequenceView.
  2.1.1 De telrij: four consecutive numbers with one gap ("3 4 ? 6"); the
  child taps the number that belongs in the gap (3 choices). Correct → the
  number is read aloud, next run after 0.6 s. Optional voice answers
  (iOS .voiceChoice): say the number or its place; a wrong spoken option is
  shown red and the round moves on after 1.3 s.
  Progress key: kleuterTellen (iOS tracks no analytics for this game).
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { C, ExerciseShell, cx } from '../ui';
import { useStopOnUnmount, useTimer } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { randInt, shuffle } from '../lib/dutch';
import { t } from '../strings';
import { useKleuterTracker, useVoiceChoice } from './kleuter/logic';
import type { VoiceOption } from './kleuter/logic';
import { VoiceChoiceChrome, VoiceFooter } from './kleuter/components';

export default function KleuterTellen() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const tracker = useKleuterTracker('kleuterTellen');
  const advance = useTimer();
  const clearWrong = useTimer();
  const [run, setRun] = useState([1, 2, 3, 4]);
  const [gap, setGap] = useState(2);
  const [options, setOptions] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [wrong, setWrong] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const last = useRef(0);

  // The run of 4 and every distractor stay within the max getal.
  const cap = Math.max(4, settings.maxNumber);
  const answer = run[gap];

  const newRound = useCallback(() => {
    const maxStart = cap - 3;
    let start = randInt(1, maxStart);
    if (start === last.current) start = (start % maxStart) + 1;
    last.current = start;
    const r = [start, start + 1, start + 2, start + 3];
    const g = randInt(0, 3);
    const a = r[g];
    const opts = new Set<number>([a]);
    while (opts.size < 3) {
      const cand = a + randInt(-3, 3);
      if (cand >= 1 && cand <= cap && cand !== a) opts.add(cand);
    }
    setRun(r);
    setGap(g);
    setOptions(shuffle([...opts]));
    setSolved(false);
    setWrong(null);
    setRound((n) => n + 1);
  }, [cap]);

  useEffect(() => { newRound(); }, [newRound]);
  useEffect(() => {
    if (round) tracker.shown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const tap = (opt: number) => {
    if (solved) return;
    if (opt === answer) {
      setWrong(null);
      setSolved(true);
      tracker.markCorrect();
      void voice.playNumber(answer);
      advance(newRound, 600);
    } else {
      setWrong(opt);
      clearWrong(() => setWrong((w) => (w === opt ? null : w)), 600);
    }
  };

  const voiceOptions: VoiceOption[] = options.map((o) => ({
    target: { number: o },
    select: () => {
      if (o === answer) tap(o);
      else { setWrong(o); setSolved(true); advance(newRound, 1300); }
    },
  }));
  useVoiceChoice(voiceOptions, !solved, `seq-${round}`);

  const optColor = (o: number) =>
    solved && o === answer ? C.success : wrong === o ? C.danger : C.gold;

  return (
    <ExerciseShell
      mode="kleuterTellen"
      correct={tracker.correct}
      voiceAnswerToggle
      footer={settings.voiceAnswers ? <VoiceFooter /> : undefined}
    >
      <p className="font-baloo font-bold text-2xl sm:text-3xl text-center mb-6 sm:mb-9">{t('kleuter.sequence.prompt')}</p>
      <div className="bg-white rounded-3xl shadow-md p-4 sm:p-5 flex gap-2 sm:gap-3.5 mb-8 sm:mb-10">
        {run.map((n, idx) => {
          const isGap = idx === gap;
          const shownColor = isGap ? (solved ? C.success : C.gold) : C.text;
          return (
            <div
              key={idx}
              className="w-[68px] h-[84px] sm:w-[84px] sm:h-[100px] rounded-[14px] flex items-center justify-center font-baloo font-bold text-[44px] sm:text-[56px] leading-none transition-colors"
              style={{
                color: shownColor,
                background: isGap ? '#fffdf8' : C.cream,
                border: isGap ? `3px solid ${(solved ? C.success : C.gold)}80` : '3px solid transparent',
              }}
            >
              {isGap ? (solved ? n : '?') : n}
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 sm:gap-[18px]">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => tap(o)}
            disabled={solved}
            className={cx('w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-full text-white font-baloo font-bold text-[36px] sm:text-[44px] leading-none shadow-md transition active:scale-95',
              wrong === o && !solved && 'kd-shake')}
            style={{ background: optColor(o) }}
          >
            {o}
          </button>
        ))}
      </div>
      <VoiceChoiceChrome options={voiceOptions} />
    </ExerciseShell>
  );
}
