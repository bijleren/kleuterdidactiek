/*
  "Transformaties" — port of iOS TransformatiesView/ViewModel. Take a webcam
  photo (tap the preview or "Foto nemen"), then explore transformations on
  it: zoom out / in (÷×1.2, 0.3…4×), rotate a quarter turn, mirror, reset —
  with a slider for a faint overlay of the original to compare. "Nieuwe foto"
  goes back to the camera. A tool: no niveau, no counter (iOS only logs
  transformaties_capture, which writes no progress).
*/
import { useState } from 'react';
import { Camera, FlipHorizontal2, Layers, RotateCcw, RotateCw, SwitchCamera, ZoomIn, ZoomOut } from 'lucide-react';
import { C, ExerciseShell } from '../ui';
import { useStopOnUnmount } from '../hooks';
import { t } from '../strings';
import { CameraView } from './camera/CameraView';
import { useCamera } from './camera/useCamera';

export default function Transformaties() {
  useStopOnUnmount();
  const [photo, setPhoto] = useState<string | null>(null);
  const cam = useCamera(photo === null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ghost, setGhost] = useState(0);
  const ready = cam.state === 'on';

  const capture = () => {
    const frame = cam.snapshot();
    if (!frame) return;
    setPhoto(frame.toDataURL('image/jpeg', 0.9));
  };
  const resetTransforms = () => { setScale(1); setRotation(0); setFlipped(false); };
  const retake = () => { resetTransforms(); setGhost(0); setPhoto(null); };

  return (
    <ExerciseShell mode="transformaties" hideNiveau>
      <div className="w-full max-w-5xl h-[calc(100vh-8rem)] min-h-[420px] flex flex-col gap-3">
        {photo === null ? (
          <>
            <p className="font-baloo font-bold text-2xl text-center shrink-0">{t('transformaties.takePrompt')}</p>
            <CameraView cam={cam} className="flex-1 min-h-0 cursor-pointer" onTap={() => { if (ready) capture(); }} />
            <div className="flex justify-center shrink-0">
              <button className="kd-btn flex items-center gap-2 !text-xl !px-7 !py-3" disabled={!ready} onClick={capture}>
                <Camera size={22} /> {t('transformaties.take')}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-end shrink-0">
              <button
                onClick={retake}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border font-baloo font-bold"
                style={{ color: C.gold, borderColor: C.gold + '4d' }}
              >
                <SwitchCamera size={18} /> {t('transformaties.new')}
              </button>
            </div>
            <div className="relative flex-1 min-h-0 overflow-hidden rounded-3xl bg-white/50 border-[1.5px]" style={{ borderColor: C.gold + '40' }}>
              <img
                src={photo}
                alt=""
                className="absolute inset-0 w-full h-full object-contain"
                style={{
                  transform: `rotate(${rotation}deg) scale(${flipped ? -scale : scale}, ${scale})`,
                  transition: 'transform .35s cubic-bezier(.34,1.3,.64,1)',
                }}
              />
              <img
                src={photo}
                alt=""
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                style={{ opacity: ghost }}
              />
            </div>
            <label className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/60 shrink-0">
              <Layers size={20} style={{ color: C.gold }} />
              <span className="text-sm font-semibold opacity-60">{t('transformaties.ghost')}</span>
              <input
                type="range" min={0} max={0.8} step={0.01} value={ghost}
                onChange={(e) => setGhost(parseFloat(e.target.value))}
                className="flex-1"
                style={{ accentColor: C.gold }}
              />
            </label>
            <div className="grid grid-cols-5 gap-2 sm:gap-3 shrink-0">
              <Ctrl icon={<ZoomOut size={22} />} label={t('transformaties.zoomOut')} onClick={() => setScale((s) => Math.max(0.3, s / 1.2))} />
              <Ctrl icon={<ZoomIn size={22} />} label={t('transformaties.zoomIn')} onClick={() => setScale((s) => Math.min(4, s * 1.2))} />
              <Ctrl icon={<RotateCw size={22} />} label={t('transformaties.rotate')} onClick={() => setRotation((r) => r + 90)} />
              <Ctrl icon={<FlipHorizontal2 size={22} />} label={t('transformaties.mirror')} onClick={() => setFlipped((f) => !f)} />
              <Ctrl icon={<RotateCcw size={22} />} label={t('transformaties.reset')} onClick={resetTransforms} />
            </div>
          </>
        )}
      </div>
    </ExerciseShell>
  );
}

function Ctrl({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-[64px] rounded-2xl bg-white/80 border flex flex-col items-center justify-center gap-1 font-baloo font-bold text-xs sm:text-sm active:scale-95 transition"
      style={{ borderColor: C.gold + '4d', color: C.text }}
    >
      {icon}
      <span className="truncate max-w-full px-1">{label}</span>
    </button>
  );
}
