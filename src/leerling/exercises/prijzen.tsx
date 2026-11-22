/*
  "Prijzen lezen" — port of iOS PrijzenView/ViewModel.
  A price €1…€10 (capped at the niveau) is shown as "€N" plus N euro coins in
  rows of five. The child reads it aloud and must say the amount WITH "euro"
  ("zeven" alone is not enough). Correct → "N euro" in green + spoken, next
  price after 1 s. Hint (lamp) speaks "N euro". Analytics prefix: prijzen.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { C, ExerciseShell, MicPanel, cx } from '../ui';
import { useExerciseTracker, useListen, useMic, useStopOnUnmount } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { randInt, spellInteger } from '../lib/dutch';
import { t } from '../strings';
import { EuroPile, SkipButton } from './geld/common';
import { euroComps, playComponents, saysEuro, transcriptHasNumber, useAfterCorrect } from './geld/flow';

const MAX_AMOUNT = 10;

export default function Prijzen() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const mic = useMic();
  const tracker = useExerciseTracker('prijzen');
  const maxAmount = Math.max(1, Math.min(MAX_AMOUNT, settings.maxNumber));
  const [amount, setAmount] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [round, setRound] = useState(0);
  const roundRef = useRef(0);
  const prompted = useRef(false);

  const next = useCallback(() => {
    setAmount((prev) => {
      let a = randInt(1, maxAmount);
      if (prev === a) a = (a % maxAmount) + 1;
      return a;
    });
    setSolved(false);
    roundRef.current += 1;
    setRound(roundRef.current);
  }, [maxAmount]);

  useEffect(() => { next(); }, [next]);

  useEffect(() => {
    if (round === 0) return;
    tracker.shown();
    // iOS playPromptOnce: the instruction once per session.
    if (!prompted.current) {
      prompted.current = true;
      void voice.playInstruction(t('prijzen.prompt'), settings.spokenInstructions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const afterCorrect = useAfterCorrect(roundRef, next);

  useListen(mic.ready && amount !== null && !solved, `prijzen-${round}`, () => ({
    stabilityMs: 0,
    near: amount !== null ? spellInteger(amount) : undefined,
    // Require BOTH the number AND "euro" (or the € sign Chrome writes).
    match: (text, alts) => [text, ...alts].some((x) => transcriptHasNumber(x, amount!) && saysEuro(x)),
    onMatch: () => {
      const a = amount!;
      setSolved(true);
      void afterCorrect(roundRef.current, () => playComponents([euroComps(a)]),
        () => tracker.markCorrect(`€${a}`), 1000);
    },
  }));

  const hint = () => {
    if (amount === null || solved) return;
    void playComponents([euroComps(amount)]);
  };

  return (
    <ExerciseShell
      mode="prijzen"
      correct={tracker.correct}
      highlights={tracker.highlights}
      onHint={hint}
      hintLabel="Beluister het bedrag"
      footer={<MicPanel hint={t('prijzen.listening')} />}
    >
      <div className="w-full max-w-2xl flex flex-col items-center gap-4">
        <p className="font-baloo font-bold text-xl sm:text-2xl text-center" style={{ color: C.gold }}>
          {t('prijzen.prompt')}
        </p>
        {amount !== null && (
          <div
            className={cx('w-full rounded-[2rem] bg-white shadow-lg border-4 flex flex-col items-center gap-5 px-6 py-6 sm:py-8 transition')}
            style={{ borderColor: solved ? C.success : C.gold + '33' }}
          >
            <div className="font-baloo font-extrabold leading-none text-[5.5rem] sm:text-[7rem]" style={{ color: C.text }}>
              €{amount}
            </div>
            <EuroPile count={amount} coinSize={60} />
            <div className="font-baloo font-extrabold text-2xl sm:text-3xl min-h-[2.5rem]" style={{ color: C.success }}>
              {solved ? `${amount} euro` : ' '}
            </div>
          </div>
        )}
        <div className="w-full flex justify-end">
          <SkipButton onClick={next} />
        </div>
      </div>
    </ExerciseShell>
  );
}
