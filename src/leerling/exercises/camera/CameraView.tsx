/*
  Live camera preview for the camera exercises (iOS CameraPreviewView +
  CameraPermissionDeniedView): the video (contain-fitted, unmirrored so a
  written number reads the right way round), an optional dashed guide over
  the part of the frame we read, a "switch camera" button, and friendly
  messages when the camera is blocked or missing.
*/
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CameraOff, Loader2, SwitchCamera } from 'lucide-react';
import { C, cx } from '../../ui';
import { t } from '../../strings';
import type { CameraHandle } from './useCamera';
import { CAMERA_REGION } from './recognize';

export function CameraView({ cam, guide = false, className, children, onTap, rounded = true, layer }: {
  cam: CameraHandle; guide?: boolean; className?: string; children?: ReactNode; onTap?: () => void; rounded?: boolean;
  /** Drawn right over the video (e.g. the mirror canvas), under the messages and buttons. */
  layer?: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [aspect, setAspect] = useState(16 / 9);

  // Where the contain-fitted frame sits inside the box (for the guide).
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => {
      const W = el.clientWidth, H = el.clientHeight;
      if (!W || !H) return;
      const w = Math.min(W, H * aspect), h = w / aspect;
      setFit({ x: (W - w) / 2, y: (H - h) / 2, w, h });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect]);

  const on = cam.state === 'on';
  return (
    <div
      ref={box}
      className={cx('relative overflow-hidden bg-[#1f1a12]', rounded && 'rounded-3xl border-2', className)}
      style={{ borderColor: C.gold + '59' }}
      onClick={onTap}
    >
      {cam.fakeUrl ? (
        <img
          src={cam.fakeUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-contain"
          onLoad={(e) => setAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight || 16 / 9)}
        />
      ) : (
        <video
          ref={cam.videoRef}
          muted
          playsInline
          autoPlay
          className={cx('absolute inset-0 w-full h-full object-contain', !on && 'invisible')}
          onLoadedMetadata={(e) => setAspect(e.currentTarget.videoWidth / e.currentTarget.videoHeight || 16 / 9)}
        />
      )}
      {on && layer}

      {on && guide && fit && (
        <div
          className="absolute pointer-events-none rounded-2xl"
          style={{
            left: fit.x + CAMERA_REGION.x * fit.w,
            top: fit.y + CAMERA_REGION.y * fit.h,
            width: CAMERA_REGION.w * fit.w,
            height: CAMERA_REGION.h * fit.h,
            border: '3px dashed rgba(255,255,255,.8)',
            boxShadow: '0 0 0 9999px rgba(0,0,0,.18)',
          }}
        />
      )}

      {!on && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center bg-white/85">
          {cam.state === 'denied' || cam.state === 'unavailable' ? (
            <>
              <CameraOff size={44} style={{ color: C.danger }} />
              <div className="font-baloo font-bold text-xl">
                {cam.state === 'denied' ? t('ms.cameraDenied') : 'Geen camera gevonden'}
              </div>
              <p className="text-sm opacity-70 max-w-xs">
                {cam.state === 'denied'
                  ? <>Klik op het slotje naast het webadres en zet <b>Camera</b> op Toestaan.</>
                  : 'Sluit een webcam aan en probeer opnieuw.'}
              </p>
              <button className="kd-btn-secondary" onClick={(e) => { e.stopPropagation(); cam.retry(); }}>Opnieuw proberen</button>
            </>
          ) : (
            <Loader2 size={40} className="animate-spin" style={{ color: C.gold }} />
          )}
        </div>
      )}

      {on && cam.canSwitch && (
        <button
          className="absolute top-3 right-3 w-12 h-12 rounded-full flex items-center justify-center text-white bg-black/45 border border-white/25"
          onClick={(e) => { e.stopPropagation(); cam.switchCamera(); }}
          aria-label={t('studentLogin.flipCamera')}
          title={t('studentLogin.flipCamera')}
        >
          <SwitchCamera size={22} />
        </button>
      )}
      {children}
    </div>
  );
}
