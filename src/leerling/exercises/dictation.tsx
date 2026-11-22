/*
  "Cijferdictee" — port of iOS DictationView/ViewModel. The number is only
  heard (shown as ? boxes); the child writes it and shows it to the webcam,
  or draws it with the "Tekenen" input. "Beluister" replays the number,
  "Tip" reveals one more digit (left → right), "Overslaan" skips. On a match
  the whole number is revealed, spoken, next after 1 s.
  Analytics prefix: dictation.
*/
import { useEffect, useState } from 'react';
import { BadgeCheck, FastForward, Lightbulb, Volume2 } from 'lucide-react';
import { C, ExerciseShell, cx } from '../ui';
import { useStopOnUnmount } from '../hooks';
import { t } from '../strings';
import { AnswerInputs } from './camera/AnswerInputs';
import { useNumberRounds } from './camera/useNumberRounds';

export default function Dictation() {
  useStopOnUnmount();
  const r = useNumberRounds('dictation', 'dictation.prompt', true);
  const [revealed, setRevealed] = useState(0);
  useEffect(() => { setRevealed(0); }, [r.round]);

  const digits = r.target === null ? [] : String(r.target).split('');
  const canHint = !r.solved && revealed < digits.length;

  return (
    <ExerciseShell
      mode="dictation"
      correct={r.tracker.correct}
      highlights={r.tracker.highlights}
      metrics={[{ label: 'Juist gehoord', value: r.tracker.correct }]}
    >
      <div className="w-full max-w-6xl grid gap-4 md:grid-cols-2 h-[calc(100vh-8rem)] min-h-[440px]">
        <div className="min-h-0 order-2 md:order-1">
          <AnswerInputs target={r.target} solved={r.solved} onCorrect={r.correct} onSeen={r.setSeen} round={r.round} />
        </div>
        <div className="order-1 md:order-2 rounded-3xl bg-white shadow-lg flex flex-col items-center justify-center gap-5 p-6 text-center min-h-[220px]">
          {r.target === null ? (
            <p className="opacity-60 text-xl">{t('number.loading')}</p>
          ) : (
            <>
              <p className="font-baloo font-bold text-2xl" style={{ color: r.solved ? C.success : C.gold }}>
                {t(r.solved ? 'dictation.correct' : 'dictation.prompt')}
              </p>
              <div className="flex gap-2 justify-center">
                {digits.map((d, i) => {
                  const show = r.solved || i < revealed;
                  const tint = r.solved ? C.success : C.gold;
                  return (
                    <span
                      key={i}
                      className="font-baloo font-bold text-6xl md:text-7xl min-w-[4.5rem] px-3 py-1 rounded-xl border-2 transition"
                      style={{
                        color: r.solved ? C.success : show ? C.text : C.gold,
                        background: tint + (show ? '24' : '0f'),
                        borderColor: tint + '66',
                      }}
                    >
                      {show ? d : '?'}
                    </span>
                  );
                })}
              </div>
              {r.solved ? (
                <BadgeCheck size={72} className="kd-pop" style={{ color: C.success }} />
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <ActionButton icon={<Volume2 size={20} />} label={t('number.listen')} onClick={r.hint} />
                    <ActionButton icon={<Lightbulb size={20} />} label={t('dictation.hint')} disabled={!canHint} onClick={() => setRevealed((n) => Math.min(digits.length, n + 1))} />
                    <ActionButton icon={<FastForward size={20} />} label={t('common.skip')} onClick={r.next} />
                  </div>
                  <p className="min-h-[1.5rem] text-sm font-medium opacity-60">
                    {r.seen !== null ? t('writeNumber.seeing', r.seen) : ' '}
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </ExerciseShell>
  );
}

function ActionButton({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx('kd-btn-secondary flex items-center gap-2', disabled && 'opacity-45')}
    >
      {icon} {label}
    </button>
  );
}
