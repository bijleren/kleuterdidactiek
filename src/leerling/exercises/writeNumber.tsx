/*
  "Schrijf dit getal" — port of iOS WriteNumberView/ViewModel (+ Scan's
  NumberVisionService). A target number is shown (and spoken); the child
  writes it on paper and holds it to the webcam — or draws it on screen with
  the "Tekenen" input. Recognition: MNIST CNN + Tesseract.js (camera/recognize.ts).
  Correct → "Goed geschreven!", the number is spoken, next number after 1 s.
  Lamp = hear the number. Analytics prefix: writenumber.
*/
import { BadgeCheck } from 'lucide-react';
import { C, ExerciseShell } from '../ui';
import { useStopOnUnmount } from '../hooks';
import { t } from '../strings';
import { AnswerInputs } from './camera/AnswerInputs';
import { useNumberRounds } from './camera/useNumberRounds';

export default function WriteNumber() {
  useStopOnUnmount();
  const r = useNumberRounds('writenumber', 'writeNumber.prompt', true);

  return (
    <ExerciseShell
      mode="writeNumber"
      correct={r.tracker.correct}
      highlights={r.tracker.highlights}
      metrics={[{ label: 'Juist geschreven', value: r.tracker.correct }]}
      onHint={r.hint}
      hintLabel="Beluister het getal"
    >
      <div className="w-full max-w-6xl grid gap-4 md:grid-cols-2 h-[calc(100vh-8rem)] min-h-[440px]">
        <div className="min-h-0 order-2 md:order-1">
          <AnswerInputs target={r.target} solved={r.solved} onCorrect={r.correct} onSeen={r.setSeen} round={r.round} />
        </div>
        <div className="order-1 md:order-2 rounded-3xl bg-white shadow-lg flex flex-col items-center justify-center gap-3 p-6 text-center min-h-[200px]">
          {r.target === null ? (
            <p className="opacity-60 text-xl">{t('number.loading')}</p>
          ) : r.solved ? (
            <div className="kd-pop flex flex-col items-center gap-3">
              <BadgeCheck size={96} style={{ color: C.success }} strokeWidth={2.2} />
              <div className="font-baloo font-bold text-4xl" style={{ color: C.success }}>{t('writeNumber.correct')}</div>
              <div className="font-baloo font-bold text-7xl md:text-8xl">{r.target}</div>
            </div>
          ) : (
            <>
              <p className="font-baloo font-semibold text-xl" style={{ color: C.gold }}>{t('writeNumber.prompt')}</p>
              <button
                onClick={r.hint}
                aria-label="Beluister het getal"
                className="font-baloo font-bold leading-none text-[7rem] md:text-[11rem]"
                style={{ color: C.text }}
              >
                {r.target}
              </button>
              <p className="min-h-[1.5rem] font-medium" style={{ color: C.text, opacity: r.seen !== null ? 0.6 : 0.45 }}>
                {r.seen !== null ? t('writeNumber.seeing', r.seen) : t('writeNumber.showToCamera')}
              </p>
            </>
          )}
        </div>
      </div>
    </ExerciseShell>
  );
}
