/*
  "Instructies met vormen" — port of iOS VormInstructiesView.
  A grid of six 2D shapes OR 3D solids and a spoken + written instruction,
  four difficulty combinations mixed freely:
    • enkel:      "Tik op de driehoek"              — shape only
    • dubbel:     "Tik op de rode driehoek"         — shape + colour (with a
                   same-shape, other-colour distractor)
    • meervoudig: "Tik op de bol en op de kubus"    — two targets
  The child taps the matching shape(s): found targets ring green, wrong taps
  flash red. All found → next round after 0.8 s. The instruction is stitched
  from recorded clips (tik op · de rode driehoek · en op …); the speaker
  button repeats it. Touch only, like iOS (no voice answer).
  iOS logs no analytics for this mode, so no progress is written here either.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { C, ExerciseShell } from '../ui';
import { useStopOnUnmount, useTimer } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { randInt, shuffle } from '../lib/dutch';
import { FlatShape, SolidShape } from './taal/shapes';
import { FLAT_KINDS, PALETTE, SOLID_KINDS } from './taal/shapeData';
import type { FlatKind, SolidKind } from './taal/shapeData';

type Kind = { flat: FlatKind } | { solid: SolidKind };

const NOUN: Record<FlatKind | SolidKind, string> = {
  square: 'vierkant', circle: 'cirkel', triangle: 'driehoek', rectangle: 'rechthoek',
  bal: 'bol', kubus: 'kubus', balk: 'balk', cilinder: 'cilinder', kegel: 'kegel', piramide: 'piramide',
};
/** Dutch colour adjectives, aligned with PALETTE. */
const COLOR_ADJ = ['rode', 'blauwe', 'groene', 'gele', 'oranje', 'paarse'];

const kindKey = (k: Kind) => ('flat' in k ? k.flat : k.solid);
const noun = (k: Kind) => NOUN[kindKey(k)];
const article = (k: Kind) => ('flat' in k && k.flat === 'square' ? 'het' : 'de');

interface Option { id: number; kind: Kind; colorIndex: number; found: boolean }
interface Round { options: Option[]; remaining: Set<number>; text: string; parts: { text: string }[] }

let nextId = 1;
const randColor = () => randInt(0, PALETTE.length - 1);

function makeRound(): Round {
  const is3D = Math.random() < 0.5;
  const useColor = Math.random() < 0.5;
  const twoTargets = Math.random() < 0.5;
  const kinds: Kind[] = is3D ? SOLID_KINDS.map((s) => ({ solid: s })) : FLAT_KINDS.map((f) => ({ flat: f }));

  const pool = shuffle(kinds);
  const targets = pool.slice(0, twoTargets ? 2 : 1);
  const fillers = pool.slice(targets.length);

  const opts: Omit<Option, 'id' | 'found'>[] = targets.map((k) => ({ kind: k, colorIndex: randColor() }));
  const targetCount = opts.length;
  if (useColor) {
    // Same shape, other colour: makes the colour part of the instruction matter.
    const t0 = opts[0];
    const others = PALETTE.map((_, i) => i).filter((i) => i !== t0.colorIndex);
    opts.push({ kind: t0.kind, colorIndex: others[randInt(0, others.length - 1)] });
  }
  while (opts.length < 6 && fillers.length) {
    // Fillers: kinds that are NOT a target, so single instructions stay unambiguous.
    opts.push({ kind: fillers[randInt(0, fillers.length - 1)], colorIndex: randColor() });
  }
  const order = shuffle(opts.map((o, i) => ({ o, isTarget: i < targetCount })));
  const options: Option[] = order.map(({ o }) => ({ ...o, id: nextId++, found: false }));
  const remaining = new Set(order.flatMap((x, i) => (x.isTarget ? [i] : [])));

  // Instruction text + clips, targets in grid order.
  const texts: string[] = [];
  const parts: { text: string }[] = [{ text: 'tik op' }];
  [...remaining].sort((a, b) => a - b).forEach((idx, i) => {
    const o = options[idx];
    if (i > 0) parts.push({ text: 'en op' });
    if (useColor) {
      const adj = COLOR_ADJ[o.colorIndex];
      texts.push(`${article(o.kind)} ${adj} ${noun(o.kind)}`);
      parts.push({ text: article(o.kind) }, { text: adj }, { text: noun(o.kind) });
    } else {
      texts.push(`${article(o.kind)} ${noun(o.kind)}`);
      parts.push({ text: `${article(o.kind)} ${noun(o.kind)}` }); // "de driehoek" clip
    }
  });
  return { options, remaining, text: 'Tik op ' + texts.join(' en op '), parts };
}

/**
 * The instruction is the question itself — always read (iOS ignores the
 * "instructies voorlezen" setting here; the speaker button still mutes).
 */
function speak(r: Round | null) {
  if (r) void voice.playParts(r.parts, true);
}

export default function VormInstructies() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const later = useTimer();
  const [round, setRound] = useState<Round | null>(null);
  const [wrongId, setWrongId] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [correct, setCorrect] = useState(0);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const newRound = useCallback(() => {
    const r = makeRound();
    setRound(r);
    setSolved(false);
    setWrongId(null);
    speak(r);
  }, []);

  useEffect(() => {
    newRound();
    return () => { if (wrongTimer.current) clearTimeout(wrongTimer.current); };
  }, [newRound]);

  const tap = (index: number) => {
    if (!round || solved || round.options[index].found) return;
    if (round.remaining.has(index)) {
      const remaining = new Set(round.remaining);
      remaining.delete(index);
      const options = round.options.map((o, i) => (i === index ? { ...o, found: true } : o));
      setRound({ ...round, options, remaining });
      setWrongId(null);
      if (remaining.size === 0) {
        setSolved(true);
        const c = correct + 1;
        setCorrect(c);
        // Praise sparingly: "goed gedaan" only every 5th success.
        if (c % 5 === 0) void voice.playInstruction('goed gedaan', settings.spokenInstructions);
        later(async () => {
          await voice.waitUntilQuiet();
          newRound();
        }, 800);
      }
    } else {
      const id = round.options[index].id;
      setWrongId(id);
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => setWrongId((w) => (w === id ? null : w)), 600);
    }
  };

  return (
    <ExerciseShell
      mode="vormInstructies"
      correct={correct}
      metrics={[{ label: 'Juist', value: correct }]}
      hideNiveau
    >
      {round && (
        <div className="w-full max-w-4xl flex flex-col gap-5 sm:gap-7">
          <div className="flex items-center justify-center gap-3 bg-white rounded-3xl shadow-sm px-5 py-4 sm:py-5 border border-[#946B29]/15">
            <p className="font-baloo font-bold text-2xl sm:text-3xl text-center" style={{ color: C.text }}>{round.text}</p>
            <button
              onClick={() => speak(round)}
              className="shrink-0 p-2 rounded-full hover:bg-[#F7E2B4]"
              style={{ color: C.gold }}
              aria-label="Beluister de opdracht"
              title="Beluister de opdracht"
            >
              <Volume2 size={26} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {round.options.map((o, i) => {
              const border = o.found ? C.success : wrongId === o.id ? C.danger : C.gold + '66';
              const color = PALETTE[o.colorIndex];
              const isRect = 'flat' in o.kind && o.kind.flat === 'rectangle';
              return (
                <button
                  key={o.id}
                  onClick={() => tap(i)}
                  disabled={solved || o.found}
                  className={"h-32 sm:h-40 lg:h-44 rounded-[18px] flex items-center justify-center transition active:scale-[.97]"}
                  style={{ background: 'rgba(255,255,255,.7)', border: `3px solid ${border}` }}
                  aria-label={`${article(o.kind)} ${COLOR_ADJ[o.colorIndex]} ${noun(o.kind)}`}
                >
                  <div className={isRect ? 'w-[46%] max-w-[8.5rem] aspect-[2/1]' : 'h-[62%] aspect-square'}>
                    {'flat' in o.kind
                      ? <FlatShape kind={o.kind.flat} color={color} />
                      : <SolidShape kind={o.kind.solid} color={color} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </ExerciseShell>
  );
}
