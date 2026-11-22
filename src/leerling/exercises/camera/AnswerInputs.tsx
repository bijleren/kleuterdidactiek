/*
  The "inputs panel" of Schrijf dit getal and Cijferdictee (iOS
  WriteNumberView / DictationView inputsPanel): two toggles — Tonen (camera)
  and Tekenen (draw on screen) — with the live camera and/or the drawing pad.

  Camera: a frame every 0.6 s is read by the CNN + Tesseract and judged
  against the target; it counts once the last 3 frames give enough evidence
  (≥ 2 frames agreeing), like iOS's "same value twice in a row".
*/
import { useEffect, useRef, useState } from 'react';
import { Camera, Hand } from 'lucide-react';
import { C, cx } from '../../ui';
import { t } from '../../strings';
import { CameraView } from './CameraView';
import { DrawPad } from './DrawPad';
import { useCamera, useFrameLoop } from './useCamera';
import { readFrameFor, warmUp } from './recognize';

const TICK_MS = 600;
const WINDOW = 3;
const ACCEPT = 3;
const STORE_KEY = 'kd.leerling.camera.inputs';

function loadInputs(): { camera: boolean; draw: boolean } {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as { camera: boolean; draw: boolean };
  } catch { /* ignore */ }
  return { camera: true, draw: false };
}

export function AnswerInputs({ target, solved, onCorrect, onSeen, round }: {
  target: number | null;
  solved: boolean;
  onCorrect: () => void;
  onSeen: (s: string | null) => void;
  /** Changes per question: wipes the drawing and the camera votes. */
  round: number;
}) {
  const [inputs, setInputs] = useState(loadInputs);
  const cam = useCamera(inputs.camera);
  const votes = useRef<number[]>([]);
  const live = useRef({ target, solved, onCorrect, onSeen });
  live.current = { target, solved, onCorrect, onSeen };

  useEffect(() => { warmUp(); }, []);
  useEffect(() => { votes.current = []; }, [round]);

  const toggle = (k: 'camera' | 'draw') => setInputs((cur) => {
    const next = { ...cur, [k]: !cur[k] };
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    return next;
  });

  useFrameLoop(inputs.camera && cam.state === 'on' && !solved && target !== null, TICK_MS, async () => {
    const tg = live.current.target;
    const frame = cam.snapshot();
    if (!frame || tg === null) return;
    const j = await readFrameFor(frame, tg);
    if (live.current.target !== tg || live.current.solved) return;
    votes.current.push(j.votes);
    if (votes.current.length > WINDOW) votes.current.shift();
    live.current.onSeen(j.seen);
    const sum = votes.current.reduce((a, b) => a + b, 0);
    if (j.votes && sum >= ACCEPT) live.current.onCorrect();
  });

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="flex gap-2 shrink-0">
        <InputToggle on={inputs.camera} onClick={() => toggle('camera')} icon={<Camera size={20} />} label={t('ms.input.camera')} />
        <InputToggle on={inputs.draw} onClick={() => toggle('draw')} icon={<Hand size={20} />} label={t('ms.input.draw')} />
      </div>
      {!inputs.camera && !inputs.draw && (
        <p className="text-center pt-4 opacity-50 font-medium">{t('ms.pickInput')}</p>
      )}
      {inputs.camera && <CameraView cam={cam} guide className="flex-1 min-h-[180px]" />}
      {inputs.draw && (
        <DrawPad
          target={target}
          solved={solved}
          onCorrect={onCorrect}
          onSeen={onSeen}
          clearToken={round}
          compact
          className={inputs.camera ? 'h-[230px] shrink-0' : 'flex-1 min-h-[240px]'}
        />
      )}
    </div>
  );
}

function InputToggle({ on, onClick, icon, label }: { on: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={cx('flex-1 h-[58px] rounded-2xl flex flex-col items-center justify-center gap-0.5 font-baloo font-bold text-sm border transition')}
      style={on
        ? { background: `linear-gradient(180deg, ${C.goldMid}, ${C.gold})`, color: 'white', borderColor: C.gold + '4d' }
        : { background: 'rgba(255,255,255,.7)', color: C.text + 'b3', borderColor: C.gold + '4d' }}
    >
      {icon}
      {label}
    </button>
  );
}
