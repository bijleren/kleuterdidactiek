/*
  "Zeg dit getal" — port of iOS SayNumberView/ViewModel.
  A number is shown; the child says it out loud. Correct → green, next
  number after 1 s. Hint (lamp) plays the number. Analytics prefix: saynumber.
*/
import { useCallback, useEffect, useState } from 'react';
import { ExerciseShell, MicPanel, NumberCard, Celebrate } from '../ui';
import { useExerciseTracker, useListen, useMic, useStopOnUnmount, useTimer } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { randIntExcluding, saysNumber, spellInteger } from '../lib/dutch';
import { t } from '../strings';

export default function SayNumber() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const mic = useMic();
  const tracker = useExerciseTracker('saynumber');
  const later = useTimer();
  const [target, setTarget] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [round, setRound] = useState(0);
  const [prompted, setPrompted] = useState(false);

  const next = useCallback(() => {
    setTarget((prev) => randIntExcluding(settings.allowZero ? 0 : 1, settings.maxNumber, prev));
    setSolved(false);
    setRound((r) => r + 1);
  }, [settings.allowZero, settings.maxNumber]);

  // First number + spoken prompt once.
  useEffect(() => { next(); }, [next]);
  useEffect(() => {
    if (target === null) return;
    tracker.shown();
    if (!prompted) {
      setPrompted(true);
      void voice.playInstruction(t('sayNumber.prompt'), settings.spokenInstructions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  useListen(mic.ready && target !== null && !solved, `say-${round}`, () => ({
    match: (text, alts) => [text, ...alts].some((x) => saysNumber(x, target!)),
    near: target !== null ? spellInteger(target) : undefined,
    onMatch: () => {
      setSolved(true);
      tracker.markCorrect(String(target));
      later(next, 1000);
    },
  }));

  const hint = () => {
    if (target === null || solved) return;
    void voice.playNumber(target);
  };

  return (
    <ExerciseShell
      mode="sayNumber"
      correct={tracker.correct}
      highlights={tracker.highlights}
      metrics={[{ label: 'Juist gezegd', value: tracker.correct }]}
      onHint={hint}
      hintLabel="Beluister het getal"
      footer={<MicPanel hint={t('sayNumber.listening')} />}
    >
      <p className="font-baloo font-bold text-2xl mb-4 opacity-80">{t('sayNumber.prompt')}</p>
      {target !== null && (
        <button onClick={hint} aria-label="Beluister het getal" className="relative">
          <NumberCard value={target} state={solved ? 'correct' : 'idle'} />
        </button>
      )}
      <Celebrate show={solved} text={t('sayNumber.correct')} />
    </ExerciseShell>
  );
}
