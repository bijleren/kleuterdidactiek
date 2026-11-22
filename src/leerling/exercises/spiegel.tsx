/*
  "Spiegel" — port of iOS SpiegelView + MirrorCameraView. A live webcam
  mirror: the left half of the camera image stays, the right half is its
  reflection across the gold centre line — hold half a shape on the line and
  it becomes whole. Frames are drawn onto a canvas every animation frame.
  A tool: no niveau, no counter, no progress (iOS tracks nothing either).
*/
import { useEffect, useRef } from 'react';
import { ExerciseShell, C } from '../ui';
import { useStopOnUnmount } from '../hooks';
import { t } from '../strings';
import { CameraView } from './camera/CameraView';
import { useCamera } from './camera/useCamera';
import { sourceSize } from './camera/recognize';

export default function Spiegel() {
  useStopOnUnmount();
  const cam = useCamera(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const on = cam.state === 'on';
  const source = cam.source;

  useEffect(() => {
    if (!on) return;
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const c = canvasRef.current;
      const src = source();
      if (!c || !src) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = Math.round(c.clientWidth * dpr), H = Math.round(c.clientHeight * dpr);
      if (!W || !H) return;
      if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
      const { w: sw, h: sh } = sourceSize(src);
      if (!sw || !sh) return;
      // Cover-fit the frame into the whole view, then show only its left half.
      const s = Math.max(W / sw, H / sh);
      const dw = sw * s, dh = sh * s, dx = (W - dw) / 2, dy = (H - dh) / 2;
      const g = c.getContext('2d')!;
      for (const flip of [false, true]) {
        g.save();
        if (flip) { g.translate(W, 0); g.scale(-1, 1); }
        g.beginPath(); g.rect(0, 0, W / 2, H); g.clip();
        g.drawImage(src, dx, dy, dw, dh);
        g.restore();
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [on, source]);

  return (
    <ExerciseShell mode="spiegel" hideNiveau>
      <CameraView
        cam={cam}
        className="w-full max-w-6xl h-[calc(100vh-8rem)] min-h-[360px]"
        layer={<canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-label={t('exercise.spiegel')} />}
      >
        {on && (
          <>
            <div
              className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px] pointer-events-none"
              style={{ background: C.gold, boxShadow: '0 0 4px rgba(0,0,0,.45)' }}
            />
            <div className="absolute bottom-5 inset-x-0 flex justify-center pointer-events-none">
              <span className="px-4 py-2 rounded-full bg-black/40 text-white font-semibold">{t('spiegel.hint')}</span>
            </div>
          </>
        )}
      </CameraView>
    </ExerciseShell>
  );
}
