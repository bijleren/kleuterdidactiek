/*
  Immediate finger/mouse drag for the geld batch — web counterpart of the iOS
  "ghost follows the finger, drop into whichever zone the finger is over"
  pattern (GeefNeem, GelijkMaken, Groepjes, KeerNemen). Pointer events, so
  mouse, pen and touch all work; draggables get `touch-action: none`.

  const dd = useDragDrop<Zone>({ enabled, onDrop: (id, zone) => … });
  <div ref={dd.zoneRef('left')}>…<div {...dd.bind(item.id)}>…</div></div>
  <DragGhost drag={dd.drag}>{token}</DragGhost>   (DragGhost: common.tsx)
*/
import { useCallback, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';

export interface DragState<Z> { id: string; x: number; y: number; over: Z | null }

/** Same as iOS DragGesture(minimumDistance: 4). */
const MIN_DISTANCE = 4;

export function useDragDrop<Z extends string | number>(opts: {
  enabled: boolean;
  onDrop: (id: string, zone: Z) => void;
}) {
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const zones = useRef(new Map<Z, HTMLElement>());
  const start = useRef<{ id: string; x: number; y: number; pointerId: number; moved: boolean } | null>(null);
  const [drag, setDrag] = useState<DragState<Z> | null>(null);

  const zoneAt = useCallback((x: number, y: number): Z | null => {
    for (const [z, el] of zones.current) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return z;
    }
    return null;
  }, []);

  /** Ref callback that registers a drop zone. */
  const zoneRef = useCallback((z: Z) => (el: HTMLElement | null) => {
    if (el) zones.current.set(z, el);
    else zones.current.delete(z);
  }, []);

  const bind = (id: string) => ({
    onPointerDown(e: ReactPointerEvent<HTMLElement>) {
      if (!optsRef.current.enabled) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      start.current = { id, x: e.clientX, y: e.clientY, pointerId: e.pointerId, moved: false };
    },
    onPointerMove(e: ReactPointerEvent<HTMLElement>) {
      const s = start.current;
      if (!s || s.pointerId !== e.pointerId) return;
      if (!s.moved && Math.hypot(e.clientX - s.x, e.clientY - s.y) < MIN_DISTANCE) return;
      s.moved = true;
      setDrag({ id: s.id, x: e.clientX, y: e.clientY, over: zoneAt(e.clientX, e.clientY) });
    },
    onPointerUp(e: ReactPointerEvent<HTMLElement>) {
      const s = start.current;
      if (!s || s.pointerId !== e.pointerId) return;
      start.current = null;
      setDrag(null);
      if (!s.moved || !optsRef.current.enabled) return;
      const z = zoneAt(e.clientX, e.clientY);
      if (z !== null) optsRef.current.onDrop(s.id, z);
    },
    onPointerCancel() {
      start.current = null;
      setDrag(null);
    },
    style: {
      touchAction: 'none',
      cursor: opts.enabled ? (drag?.id === id ? 'grabbing' : 'grab') : 'default',
      opacity: drag?.id === id ? 0 : 1,
    } as CSSProperties,
  });

  return { drag, bind, zoneRef };
}
