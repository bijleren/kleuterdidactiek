/*
  Port of iOS Features/Kleuter/CompareView, shared by two modes:
  * 'compare'      (kleuterBegrippen, 2.1.7) — "Welke groep heeft meer/minder?":
                   tap the group with more / fewer dots.
  * 'conservation' (kleuterBehoud, 2.1.5/2.1.6) — "Evenveel?": two groups laid
                   out differently (left dots smaller than right) → Ja / Nee.
  Correct → green, next round after 0.6 s; wrong tap → red for 0.6 s.
  Voice (iOS .voiceChoice): say a group's number (compare) or ja/juist,
  nee/neen/fout (conservation), or the place; a wrong spoken option shows
  red and the round moves on after 1.3 s.
*/
import { useCallback, useEffect, useState } from 'react';
import { C, ExerciseShell, cx } from '../../ui';
import type { ModeId } from '../../modes';
import { useStopOnUnmount, useTimer } from '../../hooks';
import { useSettings } from '../../settings';
import { randInt } from '../../lib/dutch';
import { t } from '../../strings';
import { useKleuterTracker, useVoiceChoice } from './logic';
import type { VoiceOption } from './logic';
import { DotPattern, VoiceChoiceChrome, VoiceFooter } from './components';

export function CompareGame({ mode }: { mode: 'compare' | 'conservation' }) {
  useStopOnUnmount();
  const modeId: ModeId = mode === 'compare' ? 'kleuterBegrippen' : 'kleuterBehoud';
  const { settings } = useSettings();
  const tracker = useKleuterTracker(modeId);
  const advance = useTimer();
  const clearWrong = useTimer();
  const [left, setLeft] = useState(4);
  const [right, setRight] = useState(6);
  const [wantMore, setWantMore] = useState(true);
  const [solved, setSolved] = useState(false);
  const [wrongSide, setWrongSide] = useState<number | null>(null);
  const [wrongYesNo, setWrongYesNo] = useState<boolean | null>(null);
  const [round, setRound] = useState(0);

  const cap = Math.min(9, settings.maxNumber);
  const equal = left === right;
  const correctSide = wantMore ? (left > right ? 0 : 1) : (left < right ? 0 : 1);

  const newRound = useCallback(() => {
    setSolved(false); setWrongSide(null); setWrongYesNo(null);
    if (mode === 'compare') {
      const a = randInt(1, cap);
      let b = randInt(1, cap);
      while (a === b) b = randInt(1, cap);
      setLeft(a); setRight(b); setWantMore(Math.random() < 0.5);
    } else {
      const n = randInt(3, Math.max(3, cap));
      let r = n;
      if (Math.random() >= 0.5) {
        r = Math.min(cap, Math.max(1, n + (Math.random() < 0.5 ? 1 : -1) * randInt(1, 2)));
        if (r === n) r = n > 1 ? n - 1 : n + 1;
      }
      setLeft(n); setRight(r);
    }
    setRound((x) => x + 1);
  }, [mode, cap]);

  useEffect(() => { newRound(); }, [newRound]);
  useEffect(() => {
    if (round) tracker.shown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const win = () => {
    setSolved(true);
    tracker.markCorrect();
    advance(newRound, 600);
  };

  const tapGroup = (side: number) => {
    if (solved || mode !== 'compare') return;
    if (side === correctSide) win();
    else {
      setWrongSide(side);
      clearWrong(() => setWrongSide((w) => (w === side ? null : w)), 600);
    }
  };

  const tapYesNo = (v: boolean) => {
    if (solved) return;
    if (v === equal) win();
    else {
      setWrongYesNo(v);
      clearWrong(() => setWrongYesNo(null), 600);
    }
  };

  const voiceWrong = () => { setSolved(true); advance(newRound, 1300); };
  const voiceOptions: VoiceOption[] = mode === 'compare'
    ? [0, 1].map((side) => ({
      target: { number: side === 0 ? left : right },
      select: () => {
        if (side === correctSide) tapGroup(side);
        else { setWrongSide(side); voiceWrong(); }
      },
    }))
    : [true, false].map((v) => ({
      target: { words: v ? ['ja', 'juist'] : ['nee', 'neen', 'fout'] },
      select: () => {
        if (v === equal) tapYesNo(v);
        else { setWrongYesNo(v); voiceWrong(); }
      },
    }));
  useVoiceChoice(voiceOptions, !solved, `${mode}-${round}`);

  const prompt = mode === 'compare'
    ? t(wantMore ? 'kleuter.compare.more' : 'kleuter.compare.less')
    : t('kleuter.conservation.prompt');

  const groupCard = (side: number, count: number, dot: number) => {
    const isAnswer = solved && mode === 'compare' && side === correctSide;
    const color = isAnswer ? C.success : wrongSide === side ? C.danger : C.gold;
    return (
      <button
        onClick={() => tapGroup(side)}
        disabled={solved || mode === 'conservation'}
        className={cx('flex-1 min-w-0 h-[240px] sm:h-[260px] rounded-[20px] p-3.5 flex items-center justify-center transition',
          mode === 'compare' && !solved && 'hover:brightness-[1.02] active:scale-[0.98]',
          wrongSide === side && !solved && 'kd-shake')}
        style={{ background: 'rgba(255,255,255,.75)', border: `3px solid ${color}66`, cursor: mode === 'compare' && !solved ? 'pointer' : 'default' }}
        aria-label={String(count)}
      >
        <DotPattern count={count} color={color} dot={dot} />
      </button>
    );
  };

  const yesNo = (v: boolean) => {
    const isCorrect = solved && v === equal;
    const tint = v ? C.success : C.danger;
    return (
      <button
        onClick={() => tapYesNo(v)}
        disabled={solved}
        className="px-9 py-4 rounded-full text-white font-baloo font-bold text-[22px] leading-none shadow-sm active:scale-95 transition"
        style={{ background: isCorrect ? C.success : wrongYesNo === v ? C.danger : tint }}
      >
        {t(v ? 'kleuter.yes' : 'kleuter.no')}
      </button>
    );
  };

  return (
    <ExerciseShell
      mode={modeId}
      correct={tracker.correct}
      voiceAnswerToggle
      footer={settings.voiceAnswers ? <VoiceFooter /> : undefined}
    >
      <p className="font-baloo font-bold text-2xl sm:text-[30px] text-center mb-6 sm:mb-8">{prompt}</p>
      <div className="w-full max-w-3xl flex gap-3 sm:gap-6">
        {groupCard(0, left, 30)}
        {groupCard(1, right, 40)}
      </div>
      {mode === 'conservation' && (
        <div className="flex gap-4 mt-7 sm:mt-8">
          {yesNo(true)}
          {yesNo(false)}
        </div>
      )}
      <VoiceChoiceChrome options={voiceOptions} />
    </ExerciseShell>
  );
}
