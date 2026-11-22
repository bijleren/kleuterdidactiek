/*
  "Rangorde zeggen" — port of iOS RangordeView/ViewModel.
  A row of 2…maxBlocks identical blocks with one coloured; the child says its
  ordinal ("derde") or "nummer 3". Block count from settings.rangordeMax
  (2…10, capped by the niveau), changeable with the stepper. Prompt is spoken
  once; the lamp says the ordinal. Analytics prefix: rangorde.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { C, ExerciseShell, MicPanel } from '../ui';
import { useExerciseTracker, useListen, useMic, useStopOnUnmount } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { ordinalWord, randInt } from '../lib/dutch';
import { t } from '../strings';
import { BlockCountSetting, BlockCountStepper, BlockLabel, BlockRow, FooterRow } from './rangorde/shared';
import { GOLD_GRADIENT, rangordeMaxBlocks, saysOrdinal, useAdvance } from './rangorde/logic';

interface Round { n: number; count: number; highlighted: number }

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Rangorde() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const mic = useMic();
  const tracker = useExerciseTracker('rangorde');
  const advance = useAdvance();
  const maxBlocks = rangordeMaxBlocks(settings);
  const [round, setRound] = useState<Round | null>(null);
  const [solved, setSolved] = useState(false);
  const prompted = useRef(false);

  const next = useCallback(() => {
    advance.cancel();
    setRound((prev) => {
      const count = randInt(2, Math.max(2, maxBlocks));
      let hi = randInt(1, count);
      // Avoid repeating the exact same (count, position) back-to-back.
      if (prev && prev.count === count && prev.highlighted === hi) hi = (hi % count) + 1;
      return { n: (prev?.n ?? 0) + 1, count, highlighted: hi };
    });
    setSolved(false);
  }, [maxBlocks, advance]);

  // First round, and a fresh round whenever the block count changes (iOS setMax).
  // Keyed on primitive inputs only (not on `next`'s identity), so a new
  // round — and one tracker.shown() — happens only on mount / input change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { next(); }, [maxBlocks]);

  useEffect(() => {
    if (!round) return;
    tracker.shown();
    if (!prompted.current) {
      prompted.current = true;
      void voice.playInstruction(t('rangorde.prompt'), settings.spokenInstructions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.n]);

  const word = round ? ordinalWord(round.highlighted) ?? `${round.highlighted}e` : '';

  useListen(mic.ready && !!round && !solved, `rangorde-${round?.n}`, () => ({
    // Ordinals are distinct words → match immediately.
    stabilityMs: 0,
    near: word,
    match: (text, alts) => [text, ...alts].some((x) => saysOrdinal(x, round!.highlighted)),
    onMatch: () => {
      setSolved(true);
      tracker.markCorrect(`${round!.highlighted}e`);
      advance.schedule(next, 1000);
    },
  }));

  const hint = () => {
    if (!round || solved) return;
    void voice.playInstruction(word, true);
  };

  return (
    <ExerciseShell
      mode="rangorde"
      correct={tracker.correct}
      highlights={tracker.highlights}
      onHint={hint}
      hintLabel="Beluister het woord"
      extraSettings={<BlockCountSetting />}
      footer={<FooterRow onSkip={next}><MicPanel hint={t('rangorde.listening')} /></FooterRow>}
    >
      <div className="w-full max-w-4xl flex flex-col items-center gap-6">
        <BlockCountStepper />
        <p
          className="font-baloo font-bold text-2xl sm:text-3xl text-center transition-colors"
          style={{ color: solved ? C.success : C.text }}
        >
          {solved ? `${cap(word)}!` : t('rangorde.prompt')}
        </p>
        {round && (
          <div className="w-full py-6">
            <BlockRow
              blocks={Array.from({ length: round.count }, (_, k) => {
                const i = k + 1;
                const on = i === round.highlighted;
                return {
                  background: on ? (solved ? C.success : GOLD_GRADIENT) : 'rgba(255,255,255,.7)',
                  border: on ? (solved ? C.success : C.gold) : C.gold + '40',
                  borderWidth: on ? 3 : 1.5,
                  scale: on ? 1.08 : 1,
                  strong: on,
                  content: on && solved ? <BlockLabel>{`${i}e`}</BlockLabel> : undefined,
                };
              })}
            />
          </div>
        )}
      </div>
    </ExerciseShell>
  );
}
