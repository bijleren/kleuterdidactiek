/*
  The free canvas shared by Digitool "Platte vormen" (DigiVormenView.swift) and
  "Ruimtefiguren" (DigiLichamenView.swift) — both iOS views have exactly the
  same interaction model:
    • pick a colour in the colour row;
    • drag a figure from the tray onto the canvas, or click/tap it to add it
      near the middle;
    • drag a placed figure to move it (it comes to the front);
    • tap a placed figure to give it the current colour, double-tap to remove;
    • two fingers on a figure: pinch to resize (0.4×–2.5×), turn to rotate.
      Web extra for mouse users: scroll wheel on a figure resizes it,
      shift + scroll rotates it.
    • the trash button clears the canvas.
*/
import { useRef, useState } from 'react';
import type { PointerEvent as RPointerEvent, ReactNode, WheelEvent as RWheelEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { ExerciseShell } from '../../ui';
import type { ModeId } from '../../modes';
import { useStopOnUnmount } from '../../hooks';
import {
  Card, ColorRow, PALETTE, ToolFrame, ToolHint, ToolIconButton, clamp, newId, useDoubleTap, useElementSize, capture,
} from './kit';

interface Placed<K> { id: string; kind: K; colorIndex: number; x: number; y: number; z: number; scale: number; rotation: number }

export interface FreeCanvasProps<K extends string> {
  mode: ModeId;
  hintKey: string;
  kinds: K[];
  initialColor: number;
  /** Size of a placed figure (compact = narrow canvas). */
  size: (kind: K, compact: boolean) => { w: number; h: number };
  /** Size of the figure inside the tray. */
  traySize: (kind: K, compact: boolean) => { w: number; h: number };
  /** Tray slot (the clickable box around a tray figure). */
  traySlot: (compact: boolean) => { w: number; h: number };
  /** Keep figure centres this far from the canvas edge. */
  margin: number;
  render: (kind: K, color: string) => ReactNode;
  label: (kind: K) => string;
}

export function FreeCanvas<K extends string>(p: FreeCanvasProps<K>) {
  useStopOnUnmount();
  const canvasRef = useRef<HTMLDivElement>(null);
  const cs = useElementSize(canvasRef);
  const compact = cs.width > 0 && cs.width < 640;
  const [items, setItems] = useState<Placed<K>[]>([]);
  const [colorIndex, setColorIndex] = useState(p.initialColor);
  const zTop = useRef(1);
  const tap = useDoubleTap();
  const [ghost, setGhost] = useState<{ kind: K; x: number; y: number } | null>(null);

  const clampPt = (x: number, y: number) => ({
    x: clamp(x, p.margin, cs.width - p.margin),
    y: clamp(y, p.margin, cs.height - p.margin),
  });

  const add = (kind: K, at: { x: number; y: number } | null) => {
    zTop.current += 1;
    const pos = at
      ? clampPt(at.x, at.y)
      : { x: Math.max(cs.width * 0.5, 100) + (Math.random() * 100 - 50), y: Math.max(cs.height * 0.5, 100) + (Math.random() * 100 - 50) };
    setItems((its) => [...its, { id: newId(), kind, colorIndex, x: pos.x, y: pos.y, z: zTop.current, scale: 1, rotation: 0 }]);
  };

  const patch = (id: string, f: (it: Placed<K>) => Partial<Placed<K>>) =>
    setItems((its) => its.map((it) => (it.id === id ? { ...it, ...f(it) } : it)));

  /* ---------- placed figures: drag / tap / double-tap / pinch ---------- */

  const gesture = useRef<{
    id: string;
    pointers: Map<number, { x: number; y: number }>;
    grabDx: number; grabDy: number; startX: number; startY: number; moved: boolean; multi: boolean;
    pinch?: { dist: number; angle: number; scale: number; rotation: number };
  } | null>(null);

  const local = (e: { clientX: number; clientY: number }) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const pinchMetrics = (pts: { x: number; y: number }[]) => {
    const [a, b] = pts;
    return { dist: Math.hypot(b.x - a.x, b.y - a.y), angle: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
  };

  const onItemDown = (e: RPointerEvent<HTMLDivElement>, it: Placed<K>) => {
    e.preventDefault();
    capture(e);
    const pt = local(e);
    const g = gesture.current;
    if (g && g.id === it.id) {
      // Second finger on the same figure → pinch / rotate.
      g.pointers.set(e.pointerId, pt);
      g.multi = true;
      const m = pinchMetrics([...g.pointers.values()]);
      g.pinch = { ...m, scale: it.scale, rotation: it.rotation };
      return;
    }
    gesture.current = {
      id: it.id, pointers: new Map([[e.pointerId, pt]]),
      grabDx: pt.x - it.x, grabDy: pt.y - it.y, startX: pt.x, startY: pt.y, moved: false, multi: false,
    };
  };

  const onItemMove = (e: RPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || !g.pointers.has(e.pointerId)) return;
    const pt = local(e);
    g.pointers.set(e.pointerId, pt);
    if (g.pointers.size >= 2 && g.pinch) {
      const m = pinchMetrics([...g.pointers.values()].slice(0, 2));
      const base = g.pinch;
      patch(g.id, () => ({
        scale: clamp(base.scale * (m.dist / Math.max(base.dist, 1)), 0.4, 2.5),
        rotation: base.rotation + (m.angle - base.angle),
      }));
      return;
    }
    if (g.multi) return;
    if (!g.moved && Math.hypot(pt.x - g.startX, pt.y - g.startY) < 4) return;
    if (!g.moved) {
      g.moved = true;
      zTop.current += 1;
      const z = zTop.current;
      patch(g.id, () => ({ z }));
    }
    const pos = clampPt(pt.x - g.grabDx, pt.y - g.grabDy);
    patch(g.id, () => pos);
  };

  const onItemUp = (e: RPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || !g.pointers.has(e.pointerId)) return;
    g.pointers.delete(e.pointerId);
    if (g.pointers.size > 0) {
      // One finger lifted from a pinch: stop pinching, don't start dragging.
      g.pinch = undefined;
      return;
    }
    gesture.current = null;
    if (g.moved || g.multi || e.type === 'pointercancel') return;
    if (tap(g.id) === 'double') setItems((its) => its.filter((x) => x.id !== g.id));
    else patch(g.id, () => ({ colorIndex }));
  };

  const onItemWheel = (e: RWheelEvent<HTMLDivElement>, it: Placed<K>) => {
    const d = e.deltaY;
    if (e.shiftKey) patch(it.id, (x) => ({ rotation: x.rotation + Math.sign(d) * 10 }));
    else patch(it.id, (x) => ({ scale: clamp(x.scale * (d > 0 ? 0.92 : 1.08), 0.4, 2.5) }));
  };

  /* ---------- tray: drag a figure out, or tap it to add ---------- */

  const tray = useRef<{ kind: K; startX: number; startY: number; moved: boolean } | null>(null);

  const onTrayDown = (e: RPointerEvent<HTMLButtonElement>, kind: K) => {
    e.preventDefault();
    capture(e);
    tray.current = { kind, startX: e.clientX, startY: e.clientY, moved: false };
  };
  const onTrayMove = (e: RPointerEvent<HTMLButtonElement>) => {
    const tr = tray.current;
    if (!tr) return;
    if (!tr.moved && Math.hypot(e.clientX - tr.startX, e.clientY - tr.startY) < 3) return;
    tr.moved = true;
    setGhost({ kind: tr.kind, x: e.clientX, y: e.clientY });
  };
  const onTrayUp = (e: RPointerEvent<HTMLButtonElement>) => {
    const tr = tray.current;
    tray.current = null;
    setGhost(null);
    if (!tr || e.type === 'pointercancel') return;
    if (!tr.moved) { add(tr.kind, null); return; }
    const r = canvasRef.current!.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
      add(tr.kind, { x: e.clientX - r.left, y: e.clientY - r.top });
    }
  };

  const slot = p.traySlot(compact);

  return (
    <ExerciseShell mode={p.mode} hideNiveau>
      <ToolFrame>
        <Card className="relative flex-1 min-h-0">
          <div ref={canvasRef} className="absolute inset-0 overflow-hidden rounded-3xl select-none">
            {items.map((it) => {
              const s = p.size(it.kind, compact);
              return (
                <div
                  key={it.id}
                  onPointerDown={(e) => onItemDown(e, it)}
                  onPointerMove={onItemMove}
                  onPointerUp={onItemUp}
                  onPointerCancel={onItemUp}
                  onWheel={(e) => onItemWheel(e, it)}
                  className="absolute cursor-grab active:cursor-grabbing"
                  aria-label={p.label(it.kind)}
                  style={{
                    width: s.w, height: s.h, left: it.x - s.w / 2, top: it.y - s.h / 2, zIndex: it.z,
                    transform: `rotate(${it.rotation}deg) scale(${it.scale})`,
                    touchAction: 'none',
                  }}
                >
                  {p.render(it.kind, PALETTE[it.colorIndex])}
                </div>
              );
            })}
          </div>
          <ToolIconButton icon={<Trash2 size={28} strokeWidth={2.6} />} labelKey="digitool.clear" onClick={() => setItems([])} />
        </Card>
        <ToolHint k={p.hintKey} />
        <Card className="flex items-center justify-center flex-wrap gap-x-6 gap-y-2 px-4 py-3">
          {p.kinds.map((kind) => {
            const ts = p.traySize(kind, compact);
            return (
              <button
                key={kind}
                onPointerDown={(e) => onTrayDown(e, kind)}
                onPointerMove={onTrayMove}
                onPointerUp={onTrayUp}
                onPointerCancel={onTrayUp}
                aria-label={p.label(kind)}
                title={p.label(kind)}
                className="flex items-center justify-center rounded-xl hover:bg-[#F7E2B4]/50 transition"
                style={{ width: slot.w, height: slot.h, touchAction: 'none' }}
              >
                <span style={{ width: ts.w, height: ts.h }} className="block pointer-events-none">
                  {p.render(kind, PALETTE[colorIndex])}
                </span>
              </button>
            );
          })}
        </Card>
        <ColorRow selected={colorIndex} onPick={setColorIndex} />
      </ToolFrame>
      {ghost && (() => {
        const s = p.size(ghost.kind, compact);
        return (
          <div
            className="fixed pointer-events-none z-[9999]"
            style={{ width: s.w, height: s.h, left: ghost.x - s.w / 2, top: ghost.y - s.h / 2, opacity: 0.85 }}
          >
            {p.render(ghost.kind, PALETTE[colorIndex])}
          </div>
        );
      })()}
    </ExerciseShell>
  );
}
