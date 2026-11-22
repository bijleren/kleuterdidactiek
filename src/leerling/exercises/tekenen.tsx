/*
  "Tekenen" — port of iOS TekenenView/ViewModel + DrawingCanvasView.
  A number is shown; the child draws it on screen (mouse, finger or pen) and
  the strokes are recognised (MNIST CNN + Tesseract, camera/recognize.ts).
  Not right → strokes turn red and "Wis" lights up. Correct → check mark,
  the number is spoken, next after 1 s. Lamp = hear the number, plus
  "Overslaan". Analytics prefix: tekenen.
*/
import { BadgeCheck, FastForward } from 'lucide-react';
import { C, ExerciseShell, cx } from '../ui';
import { useStopOnUnmount } from '../hooks';
import { t } from '../strings';
import { DrawPad } from './camera/DrawPad';
import { useNumberRounds } from './camera/useNumberRounds';

export default function Tekenen() {
  useStopOnUnmount();
  const r = useNumberRounds('tekenen', 'tekenen.prompt', false);

  return (
    <ExerciseShell
      mode="tekenen"
      correct={r.tracker.correct}
      highlights={r.tracker.highlights}
      metrics={[{ label: 'Juist', value: r.tracker.correct }]}
      onHint={r.hint}
      hintLabel="Beluister het getal"
    >
      <div className="w-full max-w-6xl grid gap-4 md:grid-cols-[3fr_2fr] h-[calc(100vh-8rem)] min-h-[440px]">
        <DrawPad
          target={r.target}
          solved={r.solved}
          onCorrect={r.correct}
          clearToken={r.round}
          className="min-h-[300px] order-2 md:order-1"
          extraButtons={
              <button
                onClick={r.next}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-baloo font-bold text-white"
                style={{ background: C.text + '8c' }}
              >
                <FastForward size={18} /> {t('common.skip')}
              </button>
          }
        />
        <div className="order-1 md:order-2 rounded-3xl bg-white shadow-lg flex flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="font-baloo font-semibold text-xl" style={{ color: C.gold }}>{t('tekenen.prompt')}</p>
          <div className="font-baloo font-bold leading-none text-[6rem] md:text-[9rem]" style={{ color: C.text }}>
            {r.target ?? ''}
          </div>
          <BadgeCheck size={64} className={cx(r.solved ? 'kd-pop' : 'opacity-0')} style={{ color: C.success }} />
        </div>
      </div>
    </ExerciseShell>
  );
}
