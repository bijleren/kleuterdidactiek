/*
  "Toon een getal" — port of iOS ScanNumberView/ViewModel. Open camera; the
  child holds up any number, we read it (MNIST CNN + Tesseract, they must
  agree or one must be very sure), and once the same number is seen twice in
  a row a card pops up with the number and its Dutch word, and the number is
  spoken. The card closes after 5 s (or on tap); 1.5 s cooldown before the
  next reading. The ✓ pill counts the different numbers found. iOS only logs
  scan_number_found (no _shown/_correct), so no progress rows are written.
*/
import { useEffect, useRef, useState } from 'react';
import { ScanLine, Sparkles, Star, Volume2 } from 'lucide-react';
import { C, ExerciseShell } from '../ui';
import { useStopOnUnmount, useTimer } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { spellInteger } from '../lib/dutch';
import { t } from '../strings';
import { CameraView } from './camera/CameraView';
import { useCamera, useFrameLoop } from './camera/useCamera';
import { readFrameOpen, warmUp } from './camera/recognize';

const TICK_MS = 600;
const COOLDOWN_MS = 1500;
const SHOW_MS = 5000;

export default function ScanNumber() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const cam = useCamera(true);
  const later = useTimer();
  const [found, setFound] = useState<number | null>(null);
  const [distinct, setDistinct] = useState<number[]>([]);
  const lastSeen = useRef<number | null>(null);
  const committedAt = useRef(0);

  useEffect(() => {
    warmUp();
    void voice.playInstruction(t('scanNumber.hint'), settings.spokenInstructions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => { setFound(null); lastSeen.current = null; };

  useFrameLoop(cam.state === 'on' && found === null, TICK_MS, async () => {
    if (Date.now() - committedAt.current < COOLDOWN_MS) return;
    const frame = cam.snapshot();
    if (!frame) return;
    const v = await readFrameOpen(frame);
    if (v === null) { lastSeen.current = null; return; }
    if (v !== lastSeen.current) { lastSeen.current = v; return; }
    // Same number twice in a row → commit.
    lastSeen.current = null;
    committedAt.current = Date.now();
    setFound(v);
    setDistinct((d) => (d.includes(v) ? d : [...d, v]));
    void voice.playNumber(v);
    later(() => setFound(null), SHOW_MS);
  });

  return (
    <ExerciseShell
      mode="scanNumber"
      correct={distinct.length}
      metrics={[{ label: 'Getallen ontdekt', value: distinct.length }]}
      highlights={distinct.slice(-12).reverse().map(String)}
      hideNiveau
    >
      <CameraView cam={cam} guide className="w-full max-w-6xl h-[calc(100vh-8rem)] min-h-[400px]">
        <div className="absolute top-4 inset-x-0 flex flex-col items-center gap-2 pointer-events-none">
          <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/45 border border-white/25 text-white font-semibold">
            <ScanLine size={16} /> {t('scanNumber.searching')}
          </span>
          {distinct.length > 0 && (
            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/45 border border-white/25 text-white">
              <Star size={18} fill={C.gold} style={{ color: C.gold }} />
              <b className="font-baloo text-xl">{distinct.length}</b>
              <span className="text-sm opacity-85">{t('number.counterLabel')}</span>
            </span>
          )}
        </div>
        <div className="absolute bottom-5 inset-x-0 flex justify-center px-4 pointer-events-none">
          <span className="flex items-center gap-2 px-5 py-3 rounded-full bg-black/55 border border-white/30 text-white font-semibold text-center">
            <Sparkles size={18} className="shrink-0" /> {t('scanNumber.hint')}
          </span>
        </div>
        {found !== null && (
          <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/25" onClick={dismiss}>
            <div
              className="kd-pop bg-white rounded-[2rem] shadow-2xl px-10 py-8 max-w-md w-full flex flex-col items-center gap-4 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="font-baloo font-bold leading-none text-[9rem]" style={{ color: C.text }}>{found}</div>
              <div className="font-baloo font-bold text-3xl" style={{ color: C.gold }}>{spellInteger(found)}</div>
              <button className="kd-btn flex items-center gap-2" onClick={() => void voice.playNumber(found)}>
                <Volume2 size={20} /> {t('number.listenAgain')}
              </button>
            </div>
          </div>
        )}
      </CameraView>
    </ExerciseShell>
  );
}
