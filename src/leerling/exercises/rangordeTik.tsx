/*
  "Rangorde aantikken" — port of iOS RangordeTikView/ViewModel.
  A row of 2…maxBlocks identical blocks and the task "Tik op het derde blok";
  the child taps that block. A wrong tap flashes red for 0.6 s. Shares the
  rangordeMax setting with "Rangorde zeggen". The task is spoken from the
  tik_op_het + <ordinal> + blok clips each round. Touch-only, like iOS.
  Analytics prefix: rangordetik.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { C, ExerciseShell } from '../ui';
import { useExerciseTracker, useStopOnUnmount, useTimer } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { ordinalWord, randInt } from '../lib/dutch';
import { t } from '../strings';
import { BlockCountSetting, BlockCountStepper, BlockLabel, BlockRow, FooterRow } from './rangorde/shared';
import { rangordeMaxBlocks, useAdvance } from './rangorde/logic';

interface Round { n: number; count: number; target: number }

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function RangordeTik() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const tracker = useExerciseTracker('rangordetik');
  const advance = useAdvance();
  const wrongReset = useTimer();
  const maxBlocks = rangordeMaxBlocks(settings);
  const [round, setRound] = useState<Round | null>(null);
  const [solved, setSolved] = useState(false);
  const [wrongTapped, setWrongTapped] = useState<number | null>(null);
  const lastKey = useRef<string | null>(null);

  const next = useCallback(() => {
    advance.cancel();
    setWrongTapped(null);
    const count = randInt(2, Math.max(2, maxBlocks));
    let target = randInt(1, count);
    if (lastKey.current === `${count}-${target}`) target = (target % count) + 1;
    lastKey.current = `${count}-${target}`;
    setRound((prev) => ({ n: (prev?.n ?? 0) + 1, count, target }));
    setSolved(false);
  }, [maxBlocks, advance]);

  // Keyed on primitive inputs only (not on `next`'s identity), so a new
  // round — and one tracker.shown() — happens only on mount / input change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { next(); }, [maxBlocks]);

  useEffect(() => {
    if (!round) return;
    tracker.shown();
    // Speak the task ("Tik op het vierde blok") from stitched clips.
    const ord = ordinalWord(round.target);
    if (ord) {
      void voice.playParts([{ text: 'tik op het' }, { text: ord }, { text: 'blok' }], settings.spokenInstructions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.n]);

  const word = round ? ordinalWord(round.target) ?? `${round.target}e` : '';

  const tap = (i: number) => {
    if (!round || solved) return;
    if (i === round.target) {
      setWrongTapped(null);
      setSolved(true);
      tracker.markCorrect();
      advance.schedule(next, 900);
    } else {
      setWrongTapped(i);
      wrongReset(() => setWrongTapped(null), 600);
    }
  };

  return (
    <ExerciseShell
      mode="rangordeTik"
      correct={tracker.correct}
      extraSettings={<BlockCountSetting />}
      footer={<FooterRow onSkip={next} />}
    >
      <div className="w-full max-w-4xl flex flex-col items-center gap-6">
        <BlockCountStepper />
        <p
          className="font-baloo font-bold text-2xl sm:text-3xl text-center flex items-center gap-2 transition-colors"
          style={{ color: solved ? C.success : C.text }}
        >
          {solved && <BadgeCheck size={28} strokeWidth={2.5} />}
          {solved ? `${cap(word)}!` : t('rangordeTik.prompt', word)}
        </p>
        {round && (
          <div className="w-full py-6">
            <BlockRow
              blocks={Array.from({ length: round.count }, (_, k) => {
                const i = k + 1;
                const isCorrect = solved && i === round.target;
                const isWrong = wrongTapped === i;
                return {
                  background: isCorrect ? C.success : isWrong ? C.danger + 'd9' : 'rgba(255,255,255,.8)',
                  border: isCorrect ? C.success : isWrong ? C.danger : C.gold + '4d',
                  borderWidth: isCorrect || isWrong ? 3 : 1.5,
                  scale: isWrong ? 0.92 : 1,
                  strong: isCorrect,
                  content: isCorrect ? <BlockLabel size={40}>{`${i}e`}</BlockLabel> : undefined,
                  onClick: () => tap(i),
                  disabled: solved,
                  label: `Blok ${i}`,
                };
              })}
            />
          </div>
        )}
      </div>
    </ExerciseShell>
  );
}
