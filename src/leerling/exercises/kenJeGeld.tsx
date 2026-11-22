/*
  "Ken je geld" — port of iOS KenJeGeldView/ViewModel.
  A money value is asked and read aloud ("Welke is 5 euro?" / "Welke is 5
  cent?"); the child taps the matching coin or note. Each round picks euro or
  cent at random so both currencies are practised; values above the niveau
  are left out. Wrong tap → red border for 0.6 s. Correct → "5 euro" spoken,
  next round. Web extra: the lamp replays the question.
  Analytics prefix: kenjegeld.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { C, ExerciseShell, cx } from '../ui';
import { useExerciseTracker, useStopOnUnmount, useTimer } from '../hooks';
import { useSettings } from '../settings';
import { t } from '../strings';
import { CoinView, SkipButton } from './geld/common';
import { euroComps, playComponents, useAfterCorrect } from './geld/flow';

type Currency = 'euro' | 'cent';
const EURO_VALUES = [1, 2, 5, 10, 20, 50];
const CENT_VALUES = [1, 2, 5, 10, 20, 50];

interface Round { currency: Currency; options: number[]; target: number }

export default function KenJeGeld() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const tracker = useExerciseTracker('kenjegeld');
  const clearWrong = useTimer();
  const cap = settings.maxNumber;
  const [q, setQ] = useState<Round | null>(null);
  const [solved, setSolved] = useState(false);
  const [wrong, setWrong] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const roundRef = useRef(0);
  const lastKey = useRef('');

  const next = useCallback(() => {
    const currency: Currency = Math.random() < 0.5 ? 'euro' : 'cent';
    const options = (currency === 'euro' ? EURO_VALUES : CENT_VALUES).filter((v) => v <= cap);
    let target = options[Math.floor(Math.random() * options.length)];
    if (`${currency}-${target}` === lastKey.current) {
      target = options.find((v) => `${currency}-${v}` !== lastKey.current) ?? target;
    }
    lastKey.current = `${currency}-${target}`;
    setQ({ currency, options, target });
    setSolved(false);
    setWrong(null);
    roundRef.current += 1;
    setRound(roundRef.current);
  }, [cap]);

  useEffect(() => { next(); }, [next]);

  const speak = useCallback((r: Round) => {
    void playComponents([{ text: 'welke is' }, euroComps(r.target, r.currency)]);
  }, []);

  useEffect(() => {
    if (!q) return;
    tracker.shown();
    speak(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const afterCorrect = useAfterCorrect(roundRef, next);

  const tap = (v: number) => {
    if (!q || solved) return;
    if (v === q.target) {
      setWrong(null);
      setSolved(true);
      void afterCorrect(roundRef.current, () => playComponents([euroComps(q.target, q.currency)]),
        () => tracker.markCorrect(), 600);
    } else {
      setWrong(v);
      clearWrong(() => setWrong((w) => (w === v ? null : w)), 600);
    }
  };

  const isCent = q?.currency === 'cent';

  return (
    <ExerciseShell
      mode="kenJeGeld"
      correct={tracker.correct}
      onHint={() => q && !solved && speak(q)}
      hintLabel="Beluister de vraag"
    >
      {q && (
        <div className="w-full max-w-3xl flex flex-col items-center gap-6 sm:gap-8">
          <p className="font-baloo font-extrabold text-3xl sm:text-4xl text-center" style={{ color: C.text }}>
            {t(isCent ? 'kenJeGeld.prompt.cent' : 'kenJeGeld.prompt.euro', q.target)}
          </p>
          <div className="w-full rounded-[2rem] bg-white/70 shadow-lg border border-[#946B29]/20 p-5 sm:p-6 flex flex-wrap justify-center gap-3 sm:gap-4">
            {q.options.map((v) => {
              const isRight = solved && v === q.target;
              return (
                <button
                  key={`${q.currency}-${v}`}
                  onClick={() => tap(v)}
                  disabled={solved}
                  aria-label={isCent ? `${v} cent` : `${v} euro`}
                  className={cx('rounded-2xl p-2.5 bg-white/60 border-4 transition-transform hover:bg-white',
                    wrong === v && 'kd-shake')}
                  style={{
                    borderColor: isRight ? C.success : wrong === v ? C.danger : 'transparent',
                    transform: isRight ? 'scale(1.08)' : undefined,
                  }}
                >
                  <CoinView value={v} cent={isCent} size={100} />
                </button>
              );
            })}
          </div>
          <div className="w-full flex justify-end">
            <SkipButton onClick={next} />
          </div>
        </div>
      )}
    </ExerciseShell>
  );
}
