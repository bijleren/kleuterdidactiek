/*
  "Positie" — port of iOS PositieView/ViewModel.
  A row of 3…5 blocks with one highlighted ("?"); the child says its position
  word: eerste, laatste, middelste, vorige, volgende. For vorige/volgende a
  blue reference block marked "hier" is shown; each round is built so exactly
  one word is the natural answer. Max blocks = niveau (3…5). Prompt spoken
  once; the lamp says the word. Analytics prefix: positie.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { C, ExerciseShell, MicPanel } from '../ui';
import { useExerciseTracker, useListen, useMic, useStopOnUnmount } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { randInt } from '../lib/dutch';
import { t } from '../strings';
import { BlockLabel, BlockRow, FooterRow } from './rangorde/shared';
import { GOLD_GRADIENT, saysWord, useAdvance } from './rangorde/logic';

type Concept = 'eerste' | 'laatste' | 'middelste' | 'vorige' | 'volgende';
const CONCEPTS: Concept[] = ['eerste', 'laatste', 'middelste', 'vorige', 'volgende'];
const REFERENCE = 'rgb(59, 128, 217)';

interface Round { n: number; count: number; target: number; reference: number | null; concept: Concept }

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function makeRound(n: number, maxNumber: number, last: Concept | null): Round {
  let concept = pick(CONCEPTS);
  if (last === concept) concept = pick(CONCEPTS);
  // Never show more blocks than the active niveau allows (floor 3).
  const maxBlocks = Math.min(5, Math.max(3, maxNumber));
  // vorige/volgende need at least 4 blocks; fall back below niveau 4.
  if (maxBlocks < 4 && (concept === 'vorige' || concept === 'volgende')) {
    concept = pick<Concept>(['eerste', 'laatste', 'middelste']);
  }
  let count: number, target: number;
  let reference: number | null = null;
  switch (concept) {
    case 'eerste':
      count = randInt(3, maxBlocks); target = 1; break;
    case 'laatste':
      count = randInt(3, maxBlocks); target = count; break;
    case 'middelste':
      count = maxBlocks >= 5 && Math.random() < 0.5 ? 5 : 3; target = (count + 1) / 2; break;
    case 'vorige':
    case 'volgende': {
      count = maxBlocks >= 5 && Math.random() < 0.5 ? 5 : 4;
      const mid = count % 2 === 1 ? (count + 1) / 2 : -1;
      const candidates: number[] = [];
      for (let i = 2; i <= count - 1; i++) if (i !== mid) candidates.push(i);
      target = candidates.length ? pick(candidates) : 2;
      // vorige: target is just BEFORE the reference; volgende: just AFTER.
      reference = concept === 'vorige' ? target + 1 : target - 1;
      break;
    }
  }
  return { n, count, target, reference, concept };
}

export default function Positie() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const mic = useMic();
  const tracker = useExerciseTracker('positie');
  const advance = useAdvance();
  const [round, setRound] = useState<Round | null>(null);
  const [solved, setSolved] = useState(false);
  const prompted = useRef(false);

  const next = useCallback(() => {
    advance.cancel();
    setRound((prev) => makeRound((prev?.n ?? 0) + 1, settings.maxNumber, prev?.concept ?? null));
    setSolved(false);
  }, [settings.maxNumber, advance]);

  // Keyed on primitive inputs only (not on `next`'s identity), so a new
  // round — and one tracker.shown() — happens only on mount / input change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { next(); }, [settings.maxNumber]);

  useEffect(() => {
    if (!round) return;
    tracker.shown();
    if (!prompted.current) {
      prompted.current = true;
      void voice.playInstruction(t('positie.prompt'), settings.spokenInstructions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.n]);

  useListen(mic.ready && !!round && !solved, `positie-${round?.n}`, () => ({
    stabilityMs: 0,
    near: round?.concept,
    match: (text, alts) => [text, ...alts].some((x) => saysWord(x, round!.concept)),
    onMatch: () => {
      setSolved(true);
      tracker.markCorrect(round!.concept);
      advance.schedule(next, 1000);
    },
  }));

  const hint = () => {
    if (!round || solved) return;
    void voice.playInstruction(round.concept, true);
  };

  return (
    <ExerciseShell
      mode="positie"
      correct={tracker.correct}
      highlights={tracker.highlights}
      onHint={hint}
      hintLabel="Beluister het woord"
      footer={<FooterRow onSkip={next}><MicPanel hint={t('positie.listening')} /></FooterRow>}
    >
      {round && (
        <div className="w-full max-w-4xl flex flex-col items-center gap-3">
          <p
            className="font-baloo font-bold text-2xl sm:text-3xl text-center transition-colors"
            style={{ color: solved ? C.success : C.text }}
          >
            {solved ? `${cap(round.concept)}!` : t('positie.prompt')}
          </p>
          <p className="text-sm font-medium opacity-55 h-5">
            {round.reference !== null ? t('positie.referenceHint') : ''}
          </p>
          <div className="w-full py-6">
            <BlockRow
              captions
              blocks={Array.from({ length: round.count }, (_, k) => {
                const i = k + 1;
                const isTarget = i === round.target;
                const isRef = round.reference === i;
                return {
                  background: isTarget ? (solved ? C.success : GOLD_GRADIENT) : isRef ? 'rgba(59,128,217,.85)' : 'rgba(255,255,255,.7)',
                  border: isTarget ? (solved ? C.success : C.gold) : isRef ? REFERENCE : C.gold + '40',
                  borderWidth: isTarget || isRef ? 3 : 1.5,
                  scale: isTarget ? 1.06 : 1,
                  strong: isTarget || isRef,
                  content: isTarget && !solved ? <BlockLabel size={45}>?</BlockLabel>
                    : isRef ? <MapPin color="white" style={{ width: '40cqw', height: '40cqw' }} strokeWidth={2.5} />
                      : undefined,
                  caption: isRef ? <span style={{ color: REFERENCE }}>{t('positie.here')}</span> : undefined,
                };
              })}
            />
          </div>
        </div>
      )}
    </ExerciseShell>
  );
}
