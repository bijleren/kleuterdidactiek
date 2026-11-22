/*
  "Speelkaarten tellen" — port of iOS CardCountView/ViewModel.
  A playing card (rank 1–10, capped at the niveau) is shown; the child taps
  each pip AND says the running count out loud. A pip only completes (and
  unlocks the next) once both the tap and its spoken number are in — tap
  first or say first, either order works — enforcing one-to-one
  correspondence. Counts upward (1→rank) or downward (rank→1) per
  settings.cardCountDownward (Omhoog/Omlaag capsule + settings toggle).
  Analytics prefix: cardcount.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { ExerciseShell, MicPanel, Toggle } from '../ui';
import { useExerciseTracker, useListen, useMic, useStopOnUnmount, useTimer } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { saysNumber } from '../lib/dutch';
import { t } from '../strings';
import { CountingCardFace } from './tellen2/faces';
import type { PipState } from './tellen2/faces';
import { capToNiveau, pickNext, randomSuit } from './tellen2/logic';
import type { Suit } from './tellen2/logic';
import { Segmented, SkipButton, SolvedSeal } from './tellen2/bits';

interface CountState {
  /** Bumped on every (re)start of a card — drives listening + analytics. */
  gen: number;
  rank: number;
  suit: Suit;
  down: boolean;
  pips: PipState[];
  counted: number;
  /** The number to say for the current step. */
  expected: number;
  /** A tapped pip awaiting its spoken number. */
  pending: number | null;
  /** The spoken number arrived (awaiting a tap). */
  heard: boolean;
  done: boolean;
}

function begin(gen: number, rank: number, suit: Suit, down: boolean): CountState {
  return {
    gen, rank, suit, down,
    pips: Array.from({ length: rank }, () => ({ kind: 'uncounted' as const })),
    counted: 0, expected: down ? rank : 1, pending: null, heard: false, done: false,
  };
}

/** Complete the current step when both the tap and the spoken number are in. */
function tryConfirm(s: CountState): CountState {
  if (s.pending === null || !s.heard) return s;
  const pips = s.pips.slice();
  pips[s.pending] = { kind: 'counted', n: s.expected };
  const counted = s.counted + 1;
  if (counted >= s.rank) return { ...s, pips, counted, pending: null, heard: false, done: true };
  return { ...s, pips, counted, pending: null, heard: false, expected: s.expected + (s.down ? -1 : 1) };
}

export default function CardCount() {
  useStopOnUnmount();
  const { settings, update } = useSettings();
  const mic = useMic();
  const tracker = useExerciseTracker('cardcount');
  const later = useTimer();
  const maxRank = capToNiveau(10, settings.maxNumber);
  const down = settings.cardCountDownward;
  const [s, setS] = useState<CountState | null>(null);
  const prompted = useRef(false);
  const genRef = useRef(0);

  const nextCard = useCallback(() => {
    const gen = ++genRef.current;
    setS((prev) => begin(gen, pickNext(maxRank, prev?.rank), randomSuit(), down));
  }, [maxRank, down]);

  // First card; a new card when the niveau changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { nextCard(); }, [maxRank]);

  // Direction changed → restart this card (iOS setDownward).
  useEffect(() => {
    if (s && s.down !== down) setS(begin(++genRef.current, s.rank, s.suit, down));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [down]);

  // Every (re)start counts as shown; the instruction is spoken once.
  useEffect(() => {
    if (!s) return;
    tracker.shown();
    if (!prompted.current) {
      prompted.current = true;
      void voice.playInstruction(t('cardCount.prompt'), settings.spokenInstructions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s?.gen]);

  // Card complete → count it, "goed gedaan" every 5th (tracker), next after 1.4 s.
  const complete = (gen: number) => {
    tracker.markCorrect();
    void voice.waitUntilQuiet().then(() => {
      if (genRef.current === gen) later(nextCard, 1400);
    });
  };

  /** Apply a step outside the state updater (so StrictMode cannot double-count). */
  const apply = (next: CountState) => {
    if (!s || next === s) return;
    setS(next);
    if (next.done && !s.done) complete(next.gen);
  };

  // Listen for the expected number; re-armed at every step.
  const listening = !!s && !s.done && !s.heard && s.counted < s.rank;
  useListen(mic.ready && listening, `cc-${s?.gen ?? 0}-${s?.expected ?? 0}`, () => ({
    stabilityMs: 0, // 1–10 is a small, prefix-free set → match immediately (iOS)
    match: (text, alts) => !!s && [text, ...alts].some((x) => saysNumber(x, s.expected)),
    onMatch: () => { if (s && !s.done) apply(tryConfirm({ ...s, heard: true })); },
  }));

  /** Tap a pip. Ignored while another pip still awaits its spoken number. */
  const tap = (i: number) => {
    if (!s || s.done || s.pending !== null || s.pips[i]?.kind !== 'uncounted') return;
    const pips = s.pips.slice();
    pips[i] = { kind: 'pending' };
    apply(tryConfirm({ ...s, pips, pending: i }));
  };

  /** "Tip" — say the number for the current pip (does not advance). */
  const hint = () => {
    if (!s || s.done || s.counted >= s.rank) return;
    void voice.playNumber(s.expected);
  };

  const skip = () => { voice.stop(); nextCard(); };
  const setDown = (d: boolean) => update({ cardCountDownward: d });

  return (
    <ExerciseShell
      mode="cardCount"
      correct={tracker.correct}
      metrics={[{ label: 'Kaarten geteld', value: tracker.correct }]}
      onHint={hint}
      hintLabel={t('common.hint')}
      extraSettings={<Toggle label="Omlaag tellen" value={down} onChange={setDown} />}
      footer={
        <div className="flex items-center gap-2 max-w-[40rem] mx-auto">
          <div className="flex-1 min-w-0"><MicPanel hint={t('cardCount.listening')} /></div>
          <SkipButton onClick={skip} />
        </div>
      }
    >
      <div className="flex flex-col items-center gap-3 w-full">
        <Segmented
          value={down ? 'down' : 'up'}
          onChange={(v) => setDown(v === 'down')}
          options={[
            { value: 'up', label: <><ArrowUp size={14} strokeWidth={3} /> {t('cardCount.up')}</> },
            { value: 'down', label: <><ArrowDown size={14} strokeWidth={3} /> {t('cardCount.down')}</> },
          ]}
        />
        <p className="font-baloo font-extrabold text-xl sm:text-2xl text-center">{t('cardCount.prompt')}</p>
        {s && (
          <div className="relative">
            <CountingCardFace
              rank={s.rank}
              suit={s.suit}
              states={s.pips}
              onTap={tap}
              className="h-[min(54vh,470px)] w-auto max-w-full"
            />
            <SolvedSeal show={s.done} size={56} />
          </div>
        )}
      </div>
    </ExerciseShell>
  );
}
