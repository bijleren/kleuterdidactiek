/*
  "Cijfers lezen" (kleuterCijfers) — port of iOS Features/Kleuter/ReadNumeralView.
  2.1.12: a numeral (1…min(10, niveau)) is shown and read aloud; the child taps
  the dot card with that many dots out of three ("Welke hoort erbij?"). Tapping
  the numeral reads it again. Correct → green + number spoken, next after
  0.6 s; wrong → red border for 0.6 s. With voice answers on (iOS .voiceChoice)
  the numeral is NOT read aloud (that would give the answer); saying a card's
  number or place selects it, a wrong one moves on after 1.3 s.
  Progress key: kleuterCijfers (iOS tracks no analytics for this game).
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
import { DotPattern, VoiceChoiceChrome, VoiceFooter } from './kleuter/components';

export default function KleuterCijfers() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const tracker = useKleuterTracker('kleuterCijfers');
  const advance = useTimer();
  const clearWrong = useTimer();
  const [target, setTarget] = useState(3);
  const [options, setOptions] = useState<number[]>([1, 2, 3]);
  const [solved, setSolved] = useState(false);
  const [wrong, setWrong] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const last = useRef(0);
  const voiceAnswers = useRef(settings.voiceAnswers);
  voiceAnswers.current = settings.voiceAnswers;

  const maxN = Math.min(10, settings.maxNumber);

  const speakTarget = useCallback((n: number) => {
    if (voiceAnswers.current) return; // don't read the answer when answering by voice
    void voice.playNumber(n);
  }, []);

  const newRound = useCallback(() => {
    let tg = randInt(1, maxN);
    if (tg === last.current) tg = (tg % maxN) + 1;
    last.current = tg;
    const opts = new Set<number>([tg]);
    while (opts.size < 3) opts.add(randInt(1, maxN));
    setTarget(tg);
    setOptions(shuffle([...opts]));
    setSolved(false);
    setWrong(null);
    setRound((r) => r + 1);
    speakTarget(tg);
  }, [maxN, speakTarget]);

  useEffect(() => { newRound(); }, [newRound]);
  useEffect(() => {
    if (round) tracker.shown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const tap = (opt: number) => {
    if (solved) return;
    if (opt === target) {
      setWrong(null);
      setSolved(true);
      tracker.markCorrect();
      void voice.playNumber(target);
      advance(newRound, 600);
    } else {
      setWrong(opt);
      clearWrong(() => setWrong((w) => (w === opt ? null : w)), 600);
    }
  };

  const voiceOptions: VoiceOption[] = options.map((o) => ({
    target: { number: o },
    select: () => {
      if (o === target) tap(o);
      else { setWrong(o); setSolved(true); advance(newRound, 1300); }
    },
  }));
  useVoiceChoice(voiceOptions, !solved, `num-${round}`);

  const isRight = (o: number) => solved && o === target;

  return (
    <ExerciseShell
      mode="kleuterCijfers"
      correct={tracker.correct}
      voiceAnswerToggle
      footer={settings.voiceAnswers ? <VoiceFooter /> : undefined}
    >
      <p className="font-baloo font-bold text-2xl sm:text-[26px] text-center mb-5 sm:mb-7">{t('kleuter.readNumeral.prompt')}</p>
      <button
        onClick={() => speakTarget(target)}
        className="w-full max-w-3xl h-[170px] sm:h-[200px] bg-white rounded-3xl shadow-md flex items-center justify-center font-baloo font-bold text-[110px] sm:text-[140px] leading-none mb-6 sm:mb-8"
        style={{ color: C.text }}
        aria-label={`Beluister ${target}`}
      >
        {target}
      </button>
      <div className="w-full max-w-3xl flex gap-3 sm:gap-[18px]">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => tap(o)}
            disabled={solved}
            className={cx('flex-1 min-w-0 h-[170px] sm:h-[190px] rounded-[20px] flex items-center justify-center transition active:scale-[0.98]',
              wrong === o && !solved && 'kd-shake')}
            style={{
              background: 'rgba(255,255,255,.75)',
              border: `3px solid ${isRight(o) ? C.success : wrong === o ? C.danger : C.gold + '66'}`,
            }}
            aria-label={String(o)}
          >
            <DotPattern count={o} color={isRight(o) ? C.success : C.gold} dot={24} />
          </button>
        ))}
      </div>
      <VoiceChoiceChrome options={voiceOptions} />
    </ExerciseShell>
  );
}
