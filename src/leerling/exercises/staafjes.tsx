/*
  "Klikblokjes" (staafjes) — port of iOS StaafjesView/ViewModel.
  A bar of linking cubes (length = amount 1–10, capped at the niveau,
  colours alternating red/blue like a Montessori number rod) is shown; the
  child counts the blocks and says how many there are. Voice-only.
  Correct → the number is read back, shown in green, next rod after 1.2 s.
  Analytics prefix: staafjes.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { C, ExerciseShell, MicPanel, cx } from '../ui';
import { useExerciseTracker, useListen, useMic, useStopOnUnmount, useTimer } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { saysNumber } from '../lib/dutch';
import { t } from '../strings';
import { capToNiveau, pickNext } from './tellen2/logic';
import { SkipButton } from './tellen2/bits';

const RED = 'rgb(217,54,46)';
const BLUE = 'rgb(41,89,168)';

export default function Staafjes() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const mic = useMic();
  const tracker = useExerciseTracker('staafjes');
  const later = useTimer();
  const max = capToNiveau(10, settings.maxNumber);
  const [round, setRound] = useState<{ id: number; n: number } | null>(null);
  const [solved, setSolved] = useState(false);
  const token = useRef(0);
  const prompted = useRef(false);

  const newRound = useCallback(() => {
    token.current++;
    setRound((prev) => ({ id: (prev?.id ?? 0) + 1, n: pickNext(max, prev?.n) }));
    setSolved(false);
  }, [max]);

  useEffect(() => { newRound(); }, [newRound]);

  useEffect(() => {
    if (!round) return;
    tracker.shown();
    if (!prompted.current) {
      prompted.current = true;
      void voice.playInstruction(t('staafjes.prompt'), settings.spokenInstructions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.id]);

  useListen(mic.ready && !!round && !solved, `staafjes-${round?.id ?? 0}`, () => ({
    stabilityMs: 0, // 1…10 is a small, prefix-free set → match immediately (iOS)
    match: (text, alts) => !!round && [text, ...alts].some((x) => saysNumber(x, round.n)),
    onMatch: () => {
      if (!round) return;
      setSolved(true);
      const tok = ++token.current;
      const n = round.n;
      void (async () => {
        // Read the number back fully, count it ("goed gedaan" every 5th), next after 1.2 s.
        await voice.playNumber(n);
        if (tok !== token.current) return;
        tracker.markCorrect(String(n));
        await voice.waitUntilQuiet();
        if (tok === token.current) later(newRound, 1200);
      })();
    },
  }));

  const hint = () => {
    if (!round || solved) return;
    void voice.playNumber(round.n);
  };

  const skip = () => { voice.stop(); newRound(); };

  const n = round?.n ?? 0;
  return (
    <ExerciseShell
      mode="staafjes"
      correct={tracker.correct}
      onHint={hint}
      hintLabel={t('common.hint')}
      footer={
        <div className="flex items-center gap-2 max-w-[40rem] mx-auto">
          <div className="flex-1 min-w-0"><MicPanel hint={t('staafjes.listening')} /></div>
          <SkipButton onClick={skip} />
        </div>
      }
    >
      <p className="font-baloo font-extrabold text-2xl sm:text-3xl text-center mb-6" style={{ color: C.gold }}>
        {t('staafjes.prompt')}
      </p>
      <div
        className={cx('flex gap-[2px] transition-transform duration-300', solved && 'scale-[1.04]')}
        style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.18))' }}
        aria-label="Klikblokjes"
      >
        {Array.from({ length: n }, (_, i) => (
          <div
            key={`${round?.id}-${i}`}
            className="relative rounded-md flex items-center justify-center"
            style={{
              width: 'clamp(30px, 7.5vw, 64px)',
              height: 'clamp(52px, 12.5vw, 106px)',
              background: i % 2 === 0 ? RED : BLUE,
              border: '1.5px solid rgba(0,0,0,0.22)',
            }}
          >
            <span
              className="absolute rounded-full"
              style={{ width: '50%', aspectRatio: '1', background: 'rgba(0,0,0,0.14)', border: '1.5px solid rgba(255,255,255,0.35)' }}
            />
            <span
              className="relative font-baloo font-extrabold text-white"
              style={{ fontSize: 'clamp(13px, 3vw, 26px)', textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}
            >
              {i + 1}
            </span>
          </div>
        ))}
      </div>
      <div className="font-baloo font-extrabold text-6xl h-20 mt-6 flex items-center" style={{ color: C.success }}>
        {solved ? <span className="kd-pop">{n}</span> : ' '}
      </div>
    </ExerciseShell>
  );
}
