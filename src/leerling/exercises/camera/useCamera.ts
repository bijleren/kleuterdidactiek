/*
  Webcam access for the camera exercises (web counterpart of the iOS
  CameraController): getUserMedia with a front/back switch, a stable <video>
  ref, and snapshot() to freeze the current frame for recognition.

  Dev only: a synthetic frame can be injected (window.__kdCamera.feed(canvas))
  so the exercises can be tested where the camera is blocked. While a fake
  frame is set it replaces the camera completely.
*/
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

export type CamState = 'idle' | 'starting' | 'on' | 'denied' | 'unavailable';

/* ---------------- fake frame store (dev hook) ---------------- */

interface FakeFrame { canvas: HTMLCanvasElement; url: string }
let fake: FakeFrame | null = null;
const subs = new Set<() => void>();

export function setFakeFrame(canvas: HTMLCanvasElement | null) {
  fake = canvas ? { canvas, url: canvas.toDataURL('image/jpeg', 0.85) } : null;
  subs.forEach((f) => f());
}

export function useFakeFrame(): FakeFrame | null {
  return useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => fake);
}

/* ---------------- the hook ---------------- */

export interface CameraHandle {
  state: CamState;
  /** Callback ref for the <video> element. */
  videoRef: (v: HTMLVideoElement | null) => void;
  /** Freeze the current frame (null when no frame is available yet). */
  snapshot: () => HTMLCanvasElement | null;
  /** The live source to draw from (video, or the fake frame). */
  source: () => HTMLVideoElement | HTMLCanvasElement | null;
  switchCamera: () => void;
  retry: () => void;
  canSwitch: boolean;
  fakeUrl: string | null;
}

export function useCamera(enabled: boolean): CameraHandle {
  const video = useRef<HTMLVideoElement | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CamState>('idle');
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [attempt, setAttempt] = useState(0);
  const [canSwitch, setCanSwitch] = useState(false);
  const fakeFrame = useFakeFrame();

  const attach = useCallback((v: HTMLVideoElement | null) => {
    if (!v || !stream.current) return;
    if (v.srcObject !== stream.current) v.srcObject = stream.current;
    v.muted = true;
    v.playsInline = true;
    void v.play().catch(() => {});
  }, []);

  const videoRef = useCallback((v: HTMLVideoElement | null) => {
    video.current = v;
    attach(v);
  }, [attach]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setState('starting');
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setState('unavailable'); return; }
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        stream.current = s;
        attach(video.current);
        setState('on');
        try {
          const devs = await navigator.mediaDevices.enumerateDevices();
          if (!cancelled) setCanSwitch(devs.filter((d) => d.kind === 'videoinput').length > 1);
        } catch { /* ignore */ }
      } catch (e) {
        if (cancelled) return;
        const name = (e as { name?: string })?.name;
        setState(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable');
      }
    })();
    return () => {
      cancelled = true;
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = null;
      if (video.current) video.current.srcObject = null;
      setState('idle');
    };
  }, [enabled, facing, attempt, attach]);

  const source = useCallback((): HTMLVideoElement | HTMLCanvasElement | null => {
    if (fake) return fake.canvas;
    const v = video.current;
    return v && stream.current && v.videoWidth > 0 ? v : null;
  }, []);

  const snapshot = useCallback((): HTMLCanvasElement | null => {
    const src = source();
    if (!src) return null;
    if (src instanceof HTMLCanvasElement) return src;
    const c = document.createElement('canvas');
    c.width = src.videoWidth; c.height = src.videoHeight;
    c.getContext('2d')!.drawImage(src, 0, 0);
    return c;
  }, [source]);

  return {
    state: fakeFrame ? 'on' : state,
    videoRef,
    snapshot,
    source,
    switchCamera: () => setFacing((f) => (f === 'environment' ? 'user' : 'environment')),
    retry: () => setAttempt((a) => a + 1),
    canSwitch,
    fakeUrl: fakeFrame?.url ?? null,
  };
}

/** Run `tick` every `ms` while `active` (never overlapping). */
export function useFrameLoop(active: boolean, ms: number, tick: () => Promise<void>) {
  const ref = useRef(tick);
  ref.current = tick;
  useEffect(() => {
    if (!active) return;
    let busy = false;
    const id = setInterval(async () => {
      if (busy) return;
      busy = true;
      try { await ref.current(); } finally { busy = false; }
    }, ms);
    return () => clearInterval(id);
  }, [active, ms]);
}
