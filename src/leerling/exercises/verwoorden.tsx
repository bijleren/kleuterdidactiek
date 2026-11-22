/*
  "Verwoorden" — port of iOS VerwoordenView/ViewModel.
  Euro word problems that give meaning to the operations. Each round picks
  one of six story types (never the same twice in a row when avoidable):
    oorzaak (+), combinatie (+), vergelijking (−), keer (×), splitsen, delen (:)
  The story is shown with euro piles and read aloud from stitched clips
  ("ik heb" + 5 + "euro en ik win er" + 2 + "bij hoeveel heb ik nu").
  The child reasons aloud; the answer number is matched, then the full result
  sentence is shown and "N euro" is spoken. Hint speaks "N euro".
  Analytics prefix: verwoorden.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { C, ExerciseShell, MicPanel } from '../ui';
import { useExerciseTracker, useListen, useMic, useStopOnUnmount } from '../hooks';
import { useSettings } from '../settings';
import { randInt, spellInteger } from '../lib/dutch';
import { t } from '../strings';
import { CoinView, SkipButton } from './geld/common';
import { euroComps, playComponents, transcriptHasNumber, useAfterCorrect } from './geld/flow';
import type { Comp } from './geld/flow';

type Kind = 'oorzaak' | 'combinatie' | 'vergelijking' | 'keer' | 'splitsen' | 'delen';
const KINDS: Kind[] = ['oorzaak', 'combinatie', 'vergelijking', 'keer', 'splitsen', 'delen'];

interface CoinGroup { label: string; count: number; isBag?: boolean; unknown?: boolean }
interface Problem {
  kind: Kind;
  prompt: string;
  comps: Comp[];
  groups: CoinGroup[];
  answer: number;
  resultSentence: string;
}

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const range = (lo: number, hi: number) => Array.from({ length: Math.max(0, hi - lo + 1) }, (_, i) => lo + i);

/** iOS VerwoordenViewModel.build(kind). */
function build(kind: Kind, cap: number): Problem {
  const story = (n1: number, frag1: string, n2: number, frag2: string): Comp[] =>
    [{ text: 'ik heb' }, { number: n1 }, { text: frag1 }, { number: n2 }, { text: frag2 }];
  switch (kind) {
    case 'oorzaak': {
      const a = randInt(2, Math.max(2, Math.min(6, cap - 1)));
      const d = randInt(1, Math.min(4, Math.max(1, cap - 2)));
      const delta = Math.min(d, cap - a);
      const answer = a + delta;
      return {
        kind, answer,
        prompt: t('verwoorden.prompt.oorzaak', a, delta),
        comps: story(a, 'euro en ik win er', delta, 'bij hoeveel heb ik nu'),
        groups: [{ label: t('verwoorden.label.ikHad'), count: a }, { label: t('verwoorden.label.erbij'), count: delta }],
        resultSentence: t('verwoorden.result.oorzaak', answer),
      };
    }
    case 'combinatie': {
      const a = randInt(2, Math.max(2, Math.min(6, cap - 1)));
      const b = randInt(1, Math.min(4, cap - a));
      const answer = a + b;
      return {
        kind, answer,
        prompt: t('verwoorden.prompt.combinatie', a, b),
        comps: story(a, 'euro en jij hebt', b, 'euro hoeveel hebben we samen'),
        groups: [{ label: t('verwoorden.label.ik'), count: a }, { label: t('verwoorden.label.jij'), count: b }],
        resultSentence: t('verwoorden.result.combinatie', answer),
      };
    }
    case 'vergelijking': {
      const a = randInt(3, Math.max(3, Math.min(9, cap)));
      // Avoid a = 2b, otherwise the answer equals a stated number.
      const b = pick(range(1, a - 1).filter((x) => !(a % 2 === 0 && x === a / 2)));
      const answer = a - b;
      return {
        kind, answer,
        prompt: t('verwoorden.prompt.vergelijking', a, b),
        comps: story(a, 'euro en jij hebt', b, 'euro hoeveel heb jij er minder'),
        groups: [{ label: t('verwoorden.label.ik'), count: a }, { label: t('verwoorden.label.jij'), count: b }],
        resultSentence: t('verwoorden.result.vergelijking', answer),
      };
    }
    case 'keer': {
      const combos: [number, number][] = [];
      for (const bags of [2, 3]) for (const per of [2, 3]) if (bags * per <= cap) combos.push([bags, per]);
      const [bags, per] = combos.length ? pick(combos) : [2, 2];
      const answer = bags * per;
      return {
        kind, answer,
        prompt: t('verwoorden.prompt.keer', bags, per),
        comps: story(bags, 'zakjes met', per, 'euro hoeveel euro in totaal'),
        groups: Array.from({ length: bags }, () => ({ label: t('verwoorden.label.zakje'), count: per, isBag: true })),
        resultSentence: t('verwoorden.result.keer', answer),
      };
    }
    case 'splitsen': {
      const total = randInt(4, Math.max(4, Math.min(8, cap)));
      // Avoid p1 = total − p1 so the answer differs from the given part.
      const p1 = pick(range(1, total - 1).filter((x) => !(total % 2 === 0 && x === total / 2)));
      const answer = total - p1;
      return {
        kind, answer,
        prompt: t('verwoorden.prompt.splitsen', total, p1),
        comps: story(total, 'euro in de ene zak zit', p1, 'euro hoeveel zit er in de andere zak'),
        groups: [
          { label: t('verwoorden.label.eneZak'), count: p1, isBag: true },
          { label: t('verwoorden.label.andereZak'), count: 0, isBag: true, unknown: true },
        ],
        resultSentence: t('verwoorden.result.splitsen', answer),
      };
    }
    case 'delen': {
      // each ≠ friends, and the total stays within the niveau (else splitsen).
      const combos: [number, number][] = [];
      for (const f of [2, 3]) for (const e of [2, 3, 4]) if (e !== f && f * e <= cap) combos.push([f, e]);
      if (!combos.length) return build('splitsen', cap);
      const [friends, each] = pick(combos);
      const total = friends * each;
      return {
        kind, answer: each,
        prompt: t('verwoorden.prompt.delen', total, friends),
        comps: story(total, 'euro en verdeel ze eerlijk over', friends, 'vrienden hoeveel krijgt elk'),
        groups: [{ label: t('verwoorden.label.samen'), count: total }],
        resultSentence: t('verwoorden.result.delen', each),
      };
    }
  }
}

const COIN = 44;

export default function Verwoorden() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const mic = useMic();
  const tracker = useExerciseTracker('verwoorden');
  const cap = settings.maxNumber;
  const [p, setP] = useState<Problem | null>(null);
  const [solved, setSolved] = useState(false);
  const [round, setRound] = useState(0);
  const roundRef = useRef(0);
  const lastKind = useRef<Kind | null>(null);

  const next = useCallback(() => {
    let kind = pick(KINDS);
    if (kind === lastKind.current) kind = pick(KINDS);
    lastKind.current = kind;
    setP(build(kind, cap));
    setSolved(false);
    roundRef.current += 1;
    setRound(roundRef.current);
  }, [cap]);

  useEffect(() => { next(); }, [next]);

  useEffect(() => {
    if (!p) return;
    tracker.shown();
    void playComponents(p.comps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const afterCorrect = useAfterCorrect(roundRef, next);

  useListen(mic.ready && p !== null && !solved, `verwoorden-${round}`, () => ({
    stabilityMs: 0,
    near: p ? spellInteger(p.answer) : undefined,
    match: (text, alts) => [text, ...alts].some((x) => transcriptHasNumber(x, p!.answer)),
    onMatch: () => {
      const q = p!;
      setSolved(true);
      void afterCorrect(roundRef.current, () => playComponents([euroComps(q.answer)]),
        () => tracker.markCorrect(q.resultSentence), 1600);
    },
  }));

  const hint = () => {
    if (!p || solved) return;
    void playComponents([euroComps(p.answer)]);
  };

  return (
    <ExerciseShell
      mode="verwoorden"
      correct={tracker.correct}
      highlights={tracker.highlights}
      onHint={hint}
      hintLabel="Beluister het antwoord"
      footer={<MicPanel hint={t('verwoorden.listening')} />}
    >
      {p && (
        <div className="w-full max-w-4xl flex flex-col items-center gap-4">
          <button
            onClick={() => !solved && void playComponents(p.comps)}
            className="font-baloo font-extrabold text-2xl sm:text-3xl text-center leading-snug"
            style={{ color: C.text }}
            title="Lees opnieuw voor"
          >
            {p.prompt}
          </button>
          <div className="w-full flex flex-wrap justify-center items-start gap-3">
            {p.groups.map((g, i) => (
              <div
                key={i}
                className="rounded-[1.1rem] p-2.5 flex flex-col items-center gap-2"
                style={{ background: 'rgba(255,255,255,0.65)', border: `1.5px solid ${C.gold}40` }}
              >
                <div className="text-sm font-bold opacity-70">{g.label}</div>
                <div
                  className="rounded-2xl flex items-center justify-center"
                  style={g.isBag ? { background: C.gold + '1a', border: `2px dashed ${C.gold}66` } : undefined}
                >
                  {g.unknown ? (
                    <div
                      className="font-baloo font-extrabold flex items-center justify-center"
                      style={{ color: C.gold, fontSize: COIN, width: COIN + 32, height: COIN + 32 }}
                    >
                      ?
                    </div>
                  ) : (
                    <div
                      className="p-2.5 grid gap-1.5"
                      style={{ gridTemplateColumns: `repeat(${Math.min(5, Math.max(1, g.count))}, ${COIN}px)` }}
                    >
                      {Array.from({ length: g.count }, (_, k) => <CoinView key={k} value={1} size={COIN} />)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="font-baloo font-extrabold text-2xl sm:text-3xl text-center min-h-[2.5rem]" style={{ color: C.success }}>
            {solved ? p.resultSentence : ' '}
          </div>
          <div className="w-full flex justify-end">
            <SkipButton onClick={next} />
          </div>
        </div>
      )}
    </ExerciseShell>
  );
}
