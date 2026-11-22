/*
  Drawing pad — port of iOS DrawingCanvasView + DrawInputPanel (Tekenen and
  the "Tekenen" answer input of Schrijf dit getal / Cijferdictee).

  * pointer events (mouse, finger, pen), thick dark strokes on white
  * read 0.7 s after the last stroke (CNN + Tesseract) and every 1.2 s while
    still drawing (CNN only), checked against the expected number
  * 1.3 s after a reading that is not right the strokes turn red and the
    "Wis" button lights up — "wipe and try again"
  * animated "Teken hier" cue while empty
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Eraser, Hand } from 'lucide-react';
import { C, cx } from '../../ui';
import { t } from '../../strings';
import { readDrawingFor, warmUp } from './recognize';

type Pt = [number, number];
const IDLE_MS = 700;
const LIVE_MS = 1200;
const RED_AFTER_MS = 1300;

export function DrawPad({ target, solved, onCorrect, onSeen, clearToken, className, extraButtons, compact }: {
  target: number | null;
  solved: boolean;
  onCorrect: () => void;
  onSeen?: (s: string | null) => void;
  /** Change to wipe the canvas (new number). */
  clearToken: number;
  className?: string;
  extraButtons?: ReactNode;
  compact?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Pt[][]>([]);
  const drawing = useRef(false);
  const inkVersion = useRef(0);
  const readVersion = useRef(-1);
  const liveVersion = useRef(-1);
  const lastLive = useRef(0);
  const busy = useRef(false);
  const votes = useRef<number[]>([]);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const redTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [empty, setEmpty] = useState(true);
  const [red, setRed] = useState(false);
  const [seen, setSeen] = useState<string | null>(null);
  const redRef = useRef(false);

  const live = useRef({ target, solved, onCorrect, onSeen });
  live.current = { target, solved, onCorrect, onSeen };

  useEffect(() => { warmUp(); }, []);

  const lineWidth = () => Math.max(10, (canvasRef.current?.clientHeight ?? 300) / 20);

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const g = c.getContext('2d', { willReadFrequently: true })!;
    const dpr = c.width / Math.max(1, c.clientWidth);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, c.height);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.lineWidth = lineWidth();
    g.strokeStyle = redRef.current ? C.danger : C.text;
    for (const s of strokes.current) {
      if (!s.length) continue;
      g.beginPath();
      g.moveTo(s[0][0], s[0][1]);
      if (s.length === 1) g.lineTo(s[0][0] + 0.1, s[0][1] + 0.1);
      for (const p of s.slice(1)) g.lineTo(p[0], p[1]);
      g.stroke();
    }
  }, []);

  // Size the backing store to the element (sharp on retina), keep strokes.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr);
      if (w && h && (c.width !== w || c.height !== h)) { c.width = w; c.height = h; redraw(); }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);
    return () => ro.disconnect();
  }, [redraw]);

  const setRedState = (on: boolean) => {
    if (redRef.current === on) return;
    redRef.current = on;
    setRed(on);
    redraw();
  };

  const report = (s: string | null) => { setSeen(s); live.current.onSeen?.(s); };

  const clear = useCallback(() => {
    strokes.current = [];
    drawing.current = false;
    inkVersion.current++;
    votes.current = [];
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (redTimer.current) clearTimeout(redTimer.current);
    redRef.current = false;
    setRed(false);
    setEmpty(true);
    setSeen(null);
    live.current.onSeen?.(null);
    redraw();
  }, [redraw]);

  useEffect(() => { clear(); }, [clearToken, clear]);
  useEffect(() => () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (redTimer.current) clearTimeout(redTimer.current);
  }, []);
  useEffect(() => { if (solved && redTimer.current) { clearTimeout(redTimer.current); setRedState(false); } }, [solved]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Ink bounding box in canvas pixels (stroke width included). */
  const inkBox = () => {
    const c = canvasRef.current!;
    const dpr = c.width / Math.max(1, c.clientWidth);
    const pts = strokes.current.flat();
    if (!pts.length) return null;
    const half = lineWidth() / 2;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return { x0: (x0 - half) * dpr, y0: (y0 - half) * dpr, x1: (x1 + half) * dpr, y1: (y1 + half) * dpr };
  };

  const recognize = async (isLive: boolean) => {
    const { target: tg, solved: done } = live.current;
    const c = canvasRef.current;
    if (!c || tg === null || done || !strokes.current.length) return;
    const version = inkVersion.current;
    if ((isLive ? liveVersion.current : readVersion.current) === version) return;
    if (busy.current) {
      if (!isLive) idleTimer.current = setTimeout(() => void recognize(false), 300);
      return;
    }
    busy.current = true;
    try {
      // Read the dark strokes even if they're currently shown in red.
      const wasRed = redRef.current;
      if (wasRed) { redRef.current = false; redraw(); }
      const stale = () => live.current.target !== tg || live.current.solved || inkVersion.current !== version;
      const j = await readDrawingFor(c, inkBox(), tg, isLive, stale);
      if (wasRed && !stale()) { redRef.current = true; redraw(); }
      if (live.current.target !== tg || live.current.solved) return;
      if (isLive) liveVersion.current = version; else readVersion.current = version;
      report(j.seen);
      if (j.votes) votes.current.push(j.votes);
      const sum = votes.current.slice(-2).reduce((a, b) => a + b, 0);
      if (j.votes >= 2 || sum >= 3) { live.current.onCorrect(); return; }
      if (!isLive && inkVersion.current === version) {
        if (redTimer.current) clearTimeout(redTimer.current);
        redTimer.current = setTimeout(() => {
          if (!live.current.solved && strokes.current.length && inkVersion.current === version) setRedState(true);
        }, RED_AFTER_MS);
      }
    } finally {
      busy.current = false;
    }
  };

  const pt = (e: React.PointerEvent): Pt => {
    const r = canvasRef.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (solved) return;
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
    drawing.current = true;
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (redTimer.current) clearTimeout(redTimer.current);
    setRedState(false);
    strokes.current.push([pt(e)]);
    inkVersion.current++;
    setEmpty(false);
    redraw();
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const s = strokes.current[strokes.current.length - 1];
    const p = pt(e);
    const prev = s[s.length - 1];
    s.push(p);
    inkVersion.current++;
    const c = canvasRef.current!;
    const g = c.getContext('2d')!;
    g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = lineWidth(); g.strokeStyle = C.text;
    g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(p[0], p[1]); g.stroke();
    if (Date.now() - lastLive.current > LIVE_MS) { lastLive.current = Date.now(); void recognize(true); }
  };
  const onUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => void recognize(false), IDLE_MS);
  };

  return (
    <div className={cx('flex flex-col gap-2 bg-white/70 rounded-3xl p-3 shadow-sm border border-[#946B29]/15', className)}>
      <div
        className="relative flex-1 min-h-0 rounded-2xl bg-white overflow-hidden border-2 transition-colors"
        style={{ borderColor: red ? C.danger + 'b3' : C.gold + '59' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          style={{ touchAction: 'none' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={onUp}
          aria-label={t('tekenen.drawHere')}
          data-kd-drawpad=""
        />
        {empty && <DrawHint />}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cx('flex-1 min-w-[8rem] opacity-60 truncate', compact ? 'text-sm' : 'text-base')}>
          {seen !== null ? t('writeNumber.seeing', seen) : t('tekenen.hint')}
        </span>
        <button
          onClick={clear}
          className={cx('flex items-center gap-2 rounded-full font-baloo font-bold border-2 transition', compact ? 'px-4 py-1.5 text-base' : 'px-5 py-2 text-lg')}
          style={red
            ? { background: C.danger, color: 'white', borderColor: C.danger, transform: 'scale(1.08)' }
            : { background: 'white', color: C.gold, borderColor: C.gold + '66' }}
        >
          <Eraser size={20} /> {t('tekenen.clear')}
        </button>
        {extraButtons}
      </div>
    </div>
  );
}

/** Animated "draw here" cue over an empty canvas (iOS DrawHintOverlay). */
function DrawHint() {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
      <svg viewBox="0 0 100 62" className="w-1/3 max-w-[180px]" aria-hidden>
        <path
          d="M12 44 C24 10 40 11 50 17 C62 25 78 53 88 44"
          fill="none" stroke={C.gold} strokeOpacity={0.4} strokeWidth={6} strokeLinecap="round"
          pathLength={1} className="kd-draw-hint-path"
        />
      </svg>
      <Hand size={30} style={{ color: C.gold, opacity: 0.55 }} />
      <span className="mt-1 font-semibold text-sm" style={{ color: C.gold + 'b3' }}>{t('tekenen.drawHere')}</span>
      <style>{`.kd-draw-hint-path{stroke-dasharray:1;stroke-dashoffset:1;animation:kd-draw-hint 1.3s ease-in-out infinite alternate}
@keyframes kd-draw-hint{to{stroke-dashoffset:0}}`}</style>
    </div>
  );
}
