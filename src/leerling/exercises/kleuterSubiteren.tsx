/*
  "Subiteren tot 5" (kleuterSubiteren) — port of iOS Features/Kleuter/SubitizeView.
  2.1.9: a small quantity (1…min(5, niveau)) flashes for 1.8 s; only after the
  dots are gone do the number buttons appear and can the child answer
  ("Hoeveel zie je?"). "Nog eens kijken" re-flashes for 1.2 s. Correct → the
  dots come back green with a check and the number is read aloud; next round
  after 0.6 s. Optional voice answers (iOS .voiceChoice) only while the dots
  are hidden; a wrong spoken number reveals the answer and moves on after 1.3 s.
  Progress key: kleuterSubiteren (iOS tracks no analytics for this game).
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { BadgeCheck, Eye } from 'lucide-react';
import { C, ExerciseShell, cx } from '../ui';
import { useStopOnUnmount, useTimer } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { randInt } from '../lib/dutch';
import { t } from '../strings';
import { useKleuterTracker, useVoiceChoice } from './kleuter/logic';
import type { VoiceOption } from './kleuter/logic';
import { DotPattern, VoiceChoiceChrome, VoiceFooter } from './kleuter/components';

type Phase = 'flash' | 'answer' | 'correct';

export default function KleuterSubiteren() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const tracker = useKleuterTracker('kleuterSubiteren');
  const flashTimer = useTimer();
  const advance = useTimer();
  const clearWrong = useTimer();
  const [target, setTarget] = useState(3);
  const [phase, setPhase] = useState<Phase>('flash');
  const [wrongTap, setWrongTap] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const last = useRef(0);

  const maxN = Math.min(5, settings.maxNumber);

  const flash = useCallback((seconds: number) => {
    setPhase('flash');
    flashTimer(() => setPhase((p) => (p === 'flash' ? 'answer' : p)), seconds * 1000);
  }, [flashTimer]);

  const newRound = useCallback(() => {
    let n = randInt(1, maxN);
    if (n === last.current && maxN > 1) n = (n % maxN) + 1;
    last.current = n;
    setTarget(n);
    setWrongTap(null);
    setRound((r) => r + 1);
    flash(1.8);
  }, [maxN, flash]);

  useEffect(() => { newRound(); }, [newRound]);
  useEffect(() => {
    if (round) tracker.shown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const tap = (n: number) => {
    // Only once the dots have disappeared — never while they are visible.
    if (phase !== 'answer') return;
    if (n === target) {
      setWrongTap(null);
      setPhase('correct');
      tracker.markCorrect();
      void voice.playNumber(target);
      advance(newRound, 600);
    } else {
      setWrongTap(n);
      clearWrong(() => setWrongTap((w) => (w === n ? null : w)), 600);
    }
  };

  const numbers = Array.from({ length: maxN }, (_, i) => i + 1);
  const voiceOptions: VoiceOption[] = numbers.map((n) => ({
    target: { number: n },
    select: () => {
      if (phase !== 'answer') return;
      if (n === target) tap(n);
      else { setWrongTap(n); setPhase('correct'); advance(newRound, 1300); }
    },
  }));
  useVoiceChoice(voiceOptions, phase === 'answer', `sub-${round}`);

  const buttonColor = (n: number) =>
    phase === 'correct' && n === target ? C.success : wrongTap === n ? C.danger : C.gold;

  return (
    <ExerciseShell
      mode="kleuterSubiteren"
      correct={tracker.correct}
      voiceAnswerToggle
      footer={settings.voiceAnswers ? <VoiceFooter /> : undefined}
    >
      <p className="font-baloo font-bold text-2xl sm:text-[30px] text-center mb-6 sm:mb-9">{t('kleuter.subitize.prompt')}</p>
      <div className="w-full max-w-2xl h-[300px] sm:h-[320px] bg-white rounded-3xl shadow-md p-6 flex items-center justify-center mb-8 sm:mb-9">
        {phase === 'flash' && (
          <div key={`f-${round}`} className="kd-pop"><DotPattern count={target} dot={52} /></div>
        )}
        {phase === 'answer' && (
          <div className="flex flex-col items-center gap-3 kd-pop">
            <span className="font-baloo font-bold text-[120px] leading-none" style={{ color: C.gold + 'b3' }}>?</span>
            <button className="kd-btn-secondary flex items-center gap-2 !text-base" onClick={() => flash(1.2)}>
              <Eye size={18} /> {t('kleuter.peek')}
            </button>
          </div>
        )}
        {phase === 'correct' && (
          <div className="flex flex-col items-center gap-3.5 kd-pop">
            <DotPattern count={target} color={C.success} dot={52} />
            <BadgeCheck size={56} style={{ color: C.success }} />
          </div>
        )}
      </div>
      <div className={cx('flex gap-3 sm:gap-4 transition-opacity duration-200', phase === 'flash' && 'opacity-0 pointer-events-none')}>
        {numbers.map((n) => (
          <button
            key={n}
            onClick={() => tap(n)}
            disabled={phase !== 'answer'}
            className={cx('w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] rounded-full text-white font-baloo font-bold text-[36px] sm:text-[44px] leading-none shadow-md transition active:scale-95',
              wrongTap === n && phase === 'answer' && 'kd-shake')}
            style={{ background: buttonColor(n) }}
          >
            {n}
          </button>
        ))}
      </div>
      <VoiceChoiceChrome options={voiceOptions} />
    </ExerciseShell>
  );
}
