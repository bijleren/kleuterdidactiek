/*
  "Telrij" — port of iOS TelrijView/ViewModel.
  A line of 1…10 blocks (capped by the niveau) with one anchor block showing
  its number; an instruction tells what to say out loud:
    Tel door / Tel terug          — count on to the end / back to 1
    Juist ervoor / Juist erna     — the number just before / after
    1 minder / 1 meer             — the previous / next number
  Every instruction is an ordered list of numbers; each one heard in order
  lights its block. The instruction is spoken every round; the lamp says the
  next number. Analytics prefix: telrij.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { C, ExerciseShell, MicPanel, cx } from '../ui';
import { useExerciseTracker, useListen, useMic, useStopOnUnmount } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { numberWord, numbersInTranscript, randInt } from '../lib/dutch';
import { t } from '../strings';
import { BlockLabel, FooterRow } from './rangorde/shared';
import { GOLD_GRADIENT, useAdvance } from './rangorde/logic';

type Instruction = 'telDoor' | 'telTerug' | 'juistErvoor' | 'juistErna' | 'eenMeer' | 'eenMinder';
const INSTRUCTIONS: Instruction[] = ['telDoor', 'telTerug', 'juistErvoor', 'juistErna', 'eenMeer', 'eenMinder'];
const FORWARD = new Set<Instruction>(['telDoor', 'eenMeer', 'juistErna']);

interface Round { n: number; highlighted: number; instruction: Instruction; sequence: number[] }

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, k) => a + k);

function makeRound(n: number, len: number, last: Instruction | null): Round {
  let instr = pick(INSTRUCTIONS);
  if (instr === last) instr = pick(INSTRUCTIONS);
  let h: number, seq: number[];
  switch (instr) {
    case 'telDoor': h = randInt(1, len - 1); seq = range(h + 1, len); break;
    case 'telTerug': h = randInt(2, len); seq = range(1, h - 1).reverse(); break;
    case 'juistErna': case 'eenMeer': h = randInt(1, len - 1); seq = [h + 1]; break;
    default: h = randInt(2, len); seq = [h - 1]; break;
  }
  return { n, highlighted: h, instruction: instr, sequence: seq };
}

/**
 * How far the transcript gets through `seq`, starting at `counted`: the
 * expected numbers must appear in order (iOS advance). Matched per word, so
 * "twee" never counts as "een" (iOS searched substrings).
 */
function advanceSeq(text: string, seq: number[], counted: number): number {
  let c = counted;
  for (const v of numbersInTranscript(text)) {
    if (c >= seq.length) break;
    if (v === seq[c]) c++;
  }
  return c;
}

export default function Telrij() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const mic = useMic();
  const tracker = useExerciseTracker('telrij');
  const advance = useAdvance();
  const len = Math.max(2, Math.min(10, settings.maxNumber));
  const [round, setRound] = useState<Round | null>(null);
  const [counted, setCounted] = useState(0);
  const countedRef = useRef(0);
  const [solved, setSolved] = useState(false);

  const next = useCallback(() => {
    advance.cancel();
    countedRef.current = 0;
    setCounted(0);
    setRound((prev) => makeRound((prev?.n ?? 0) + 1, len, prev?.instruction ?? null));
    setSolved(false);
  }, [len, advance]);

  // Keyed on primitive inputs only (not on `next`'s identity), so a new
  // round — and one tracker.shown() — happens only on mount / input change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { next(); }, [len]);

  useEffect(() => {
    if (!round) return;
    tracker.shown();
    // Speak the instruction ("Tel door", "Juist ervoor"…) each round.
    void voice.playInstruction(t(`telrij.${round.instruction}`), settings.spokenInstructions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.n]);

  const summaryLabel = (r: Round) =>
    r.instruction === 'telDoor' ? `${r.highlighted}→${len}`
      : r.instruction === 'telTerug' ? `${r.highlighted}→1`
        : r.sequence.join('');

  useListen(mic.ready && !!round && !solved, `telrij-${round?.n}`, () => ({
    // Numbers 1–10 are prefix-free → match immediately for fluid counting.
    stabilityMs: 0,
    clearAfterMs: 2500,
    onText: (text, _final, alts) => {
      if (!round) return;
      let best = countedRef.current;
      for (const x of [text, ...alts]) best = Math.max(best, advanceSeq(x, round.sequence, countedRef.current));
      if (best > countedRef.current) {
        countedRef.current = best;
        setCounted(best);
      }
    },
    match: () => !!round && countedRef.current >= round.sequence.length,
    onMatch: () => {
      if (!round) return;
      countedRef.current = round.sequence.length;
      setCounted(round.sequence.length);
      setSolved(true);
      tracker.markCorrect(summaryLabel(round));
      advance.schedule(next, 1200);
    },
  }));

  const hint = () => {
    if (!round || solved || countedRef.current >= round.sequence.length) return;
    const w = numberWord(round.sequence[countedRef.current]);
    if (w) void voice.playInstruction(w, true);
  };

  const Arrow = round && FORWARD.has(round.instruction) ? ArrowRight : ArrowLeft;
  const revealed = new Set(round ? round.sequence.slice(0, counted) : []);

  return (
    <ExerciseShell
      mode="telrij"
      correct={tracker.correct}
      highlights={tracker.highlights}
      onHint={hint}
      hintLabel="Welk getal komt nu?"
      footer={<FooterRow onSkip={next}><MicPanel hint={t('telrij.listening')} /></FooterRow>}
    >
      {round && (
        <div className="w-full max-w-5xl flex flex-col items-center gap-8">
          <p className="font-baloo font-bold text-2xl sm:text-3xl text-center flex items-center gap-3">
            <Arrow size={28} strokeWidth={3} style={{ color: C.gold }} />
            {t(`telrij.${round.instruction}`)}
          </p>
          <div className="w-full flex justify-center gap-1.5 sm:gap-2.5 py-4">
            {range(1, len).map((i) => {
              const isAnchor = i === round.highlighted;
              const isCounted = revealed.has(i) && !isAnchor;
              // Blocks still to answer: pre-highlighted with a "?".
              const isTarget = round.sequence.includes(i) && !isCounted && !isAnchor;
              return (
                <div key={i} style={{ flex: '0 1 84px', minWidth: 26 }}>
                  <div
                    className={cx('w-full aspect-square rounded-xl flex items-center justify-center font-baloo font-bold transition-all duration-300')}
                    style={{
                      containerType: 'inline-size',
                      background: isAnchor ? GOLD_GRADIENT : isCounted ? C.success : isTarget ? C.gold + '2e' : 'rgba(255,255,255,.6)',
                      border: `${isAnchor || isTarget ? 3 : 1.5}px solid ${isAnchor ? C.gold : isCounted ? C.success : isTarget ? C.gold : C.gold + '33'}`,
                      transform: `scale(${isAnchor ? 1.08 : 1})`,
                      boxShadow: isAnchor || isCounted ? '0 3px 8px rgba(0,0,0,.15)' : '0 2px 4px rgba(0,0,0,.05)',
                    }}
                  >
                    {isAnchor || isCounted ? <BlockLabel size={50}>{i}</BlockLabel>
                      : isTarget ? <BlockLabel size={50} color={C.gold}>?</BlockLabel> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </ExerciseShell>
  );
}
