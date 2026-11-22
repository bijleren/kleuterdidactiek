/*
  "Vormen" — port of iOS VormenView/ViewModel (+ ShapeGlyph).
  A shape, line or point concept is drawn (a mix of all 14: punt, lijn,
  recht, gebogen, rond, hoek, driehoek, rechthoek, vierkant, cirkel, kubus,
  balk, bol, piramide); the child says the word. Correct → "de cirkel" in
  green, next shape after 1.1 s. Hint (lamp) says the answer ("de kubus").
  Prompt "Welke vorm is dit?" is spoken once per session.
  Analytics prefix: vormen.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { C, ExerciseShell } from '../ui';
import { useExerciseTracker, useListen, useMic, useStopOnUnmount, useTimer } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { tokenMatchesTarget, tokens, fold } from '../lib/dutch';
import { t } from '../strings';
import { ShapeGlyph } from './taal/shapes';
import { SHAPE_DISPLAY, SHAPE_KINDS, SHAPE_WORDS } from './taal/shapeData';
import type { ShapeKind } from './taal/shapeData';
import { VoiceFooter } from './taal/VoiceFooter';

const ALL_SHAPE_WORDS = new Set(Object.values(SHAPE_WORDS).flat().map(fold));

/**
 * iOS: any of the kind's words as a token, or the recogniser's own target
 * rules on the first word (t/d flip, ≥3-letter suffix). The suffix rule is
 * not applied to tokens that are themselves another shape word, so
 * "driehoek" does not count for "hoek".
 */
function saysShape(text: string, kind: ShapeKind): boolean {
  const words = SHAPE_WORDS[kind].map(fold);
  const target = words[0];
  return tokens(text).some((tok) =>
    words.includes(tok) || (!ALL_SHAPE_WORDS.has(tok) && tokenMatchesTarget(tok, target)));
}

const randomKind = () => SHAPE_KINDS[Math.floor(Math.random() * SHAPE_KINDS.length)];

export default function Vormen() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const mic = useMic();
  const tracker = useExerciseTracker('vormen');
  const later = useTimer();
  const [kind, setKind] = useState<ShapeKind | null>(null);
  const [solved, setSolved] = useState(false);
  const [n, setN] = useState(0);
  const lastKind = useRef<ShapeKind | null>(null);
  const prompted = useRef(false);

  const nextShape = useCallback(() => {
    let k = randomKind();
    if (lastKind.current === k) k = randomKind();
    lastKind.current = k;
    setKind(k);
    setSolved(false);
    setN((x) => x + 1);
  }, []);

  useEffect(() => { nextShape(); }, [nextShape]);

  useEffect(() => {
    if (!kind) return;
    tracker.shown();
    if (!prompted.current) {
      prompted.current = true;
      void voice.playInstruction(t('vormen.prompt'), settings.spokenInstructions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  useListen(mic.ready && !!kind && !solved, `vormen-${n}`, () => ({
    stabilityMs: 0,
    near: kind ? SHAPE_WORDS[kind][0] : undefined,
    match: (text, alts) => !!kind && [text, ...alts].some((x) => saysShape(x, kind)),
    onMatch: () => {
      if (!kind) return;
      setSolved(true);
      tracker.markCorrect(SHAPE_DISPLAY[kind]);
      later(async () => {
        await voice.waitUntilQuiet();
        nextShape();
      }, 1100);
    },
  }));

  const hint = () => {
    if (!kind || solved) return;
    void voice.playInstruction(SHAPE_DISPLAY[kind], true);
  };

  return (
    <ExerciseShell
      mode="vormen"
      correct={tracker.correct}
      highlights={tracker.highlights}
      metrics={[{ label: 'Juist', value: tracker.correct }]}
      onHint={hint}
      hintLabel="Hoe heet deze vorm?"
      hideNiveau
      footer={<VoiceFooter hint={t('vormen.listening')} onSkip={nextShape} />}
    >
      <p className="font-baloo font-bold text-2xl sm:text-3xl text-center mb-4">{t('vormen.prompt')}</p>
      {kind && (
        <div className="w-full max-w-2xl h-[52vh] min-h-[280px] bg-white rounded-[2rem] shadow-md p-6 flex flex-col items-center">
          <div className="flex-1 min-h-0 w-full flex items-center justify-center">
            <ShapeGlyph key={n} kind={kind} className="h-full max-w-full aspect-square" />
          </div>
          <p
            key={solved ? 'a' : 'q'}
            className="font-baloo font-bold text-4xl sm:text-5xl h-14 kd-pop"
            style={{ color: C.success }}
          >
            {solved ? SHAPE_DISPLAY[kind] : ' '}
          </p>
        </div>
      )}
    </ExerciseShell>
  );
}
