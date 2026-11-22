/*
  Digitool "Getalkaarten" — port of iOS Features/Digitool/DigiKaartenView.swift.
  Cards numbered 1–10 laid out in a row from left to right. The child drags
  them around the canvas (pointer events: mouse + touch); the reset button
  lines them up again. The card under the pointer stays on top; on release
  it keeps the highest z.
*/
import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as RPointerEvent } from 'react';
import { RotateCcw } from 'lucide-react';
import { C, ExerciseShell } from '../ui';
import { useStopOnUnmount } from '../hooks';
import { Card, ToolFrame, ToolHint, ToolIconButton, clamp, useElementSize, capture } from './digitool/kit';

interface NumCard { n: number; x: number; y: number; z: number }

export default function DigiKaarten() {
  useStopOnUnmount();
  const canvasRef = useRef<HTMLDivElement>(null);
  const size = useElementSize(canvasRef);
  const compact = size.width > 0 && size.width < 700;
  const cw = compact ? 88 : 120, ch = compact ? 120 : 164;
  const [cards, setCards] = useState<NumCard[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const zTop = useRef(20);
  const grab = useRef<{ n: number; dx: number; dy: number } | null>(null);

  /** (Re)lay the cards out in a row, 1 to 10 from left to right. */
  const lineUp = () => {
    if (!size.width) return;
    const half = cw / 2;
    const left = half + 20, right = size.width - half - 20;
    const step = (right - left) / 9;
    setCards(Array.from({ length: 10 }, (_, i) => ({ n: i + 1, x: left + i * step, y: size.height * 0.5, z: i + 1 })));
    zTop.current = 20;
  };

  // First layout once the canvas has a size.
  useEffect(() => {
    if (size.width && cards.length === 0) lineUp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width]);

  // Keep cards inside when the window shrinks.
  useEffect(() => {
    if (!size.width) return;
    setCards((cs) => cs.map((c) => ({
      ...c,
      x: clamp(c.x, cw / 2, size.width - cw / 2),
      y: clamp(c.y, ch / 2, size.height - ch / 2),
    })));
  }, [size.width, size.height, cw, ch]);

  const local = (e: RPointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onDown = (e: RPointerEvent<HTMLDivElement>, c: NumCard) => {
    e.preventDefault();
    capture(e);
    const p = local(e);
    grab.current = { n: c.n, dx: p.x - c.x, dy: p.y - c.y };
    setDragging(c.n);
  };
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const g = grab.current;
    if (!g) return;
    const p = local(e);
    const x = clamp(p.x - g.dx, cw / 2, size.width - cw / 2);
    const y = clamp(p.y - g.dy, ch / 2, size.height - ch / 2);
    setCards((cs) => cs.map((c) => (c.n === g.n ? { ...c, x, y } : c)));
  };
  const onUp = () => {
    const g = grab.current;
    if (!g) return;
    grab.current = null;
    zTop.current += 1;
    const z = zTop.current;
    setCards((cs) => cs.map((c) => (c.n === g.n ? { ...c, z } : c)));
    setDragging(null);
  };

  return (
    <ExerciseShell mode="digiKaarten" hideNiveau>
      <ToolFrame>
        <Card className="relative flex-1 min-h-0">
          <div ref={canvasRef} className="absolute inset-0 overflow-hidden rounded-3xl select-none">
            {cards.map((c) => (
              <div
                key={c.n}
                onPointerDown={(e) => onDown(e, c)}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                className="absolute flex items-center justify-center bg-white rounded-[14px] font-baloo font-extrabold cursor-grab active:cursor-grabbing"
                style={{
                  width: cw, height: ch,
                  left: c.x - cw / 2, top: c.y - ch / 2,
                  zIndex: dragging === c.n ? 5000 : c.z,
                  touchAction: 'none',
                  border: `2px solid ${C.gold}80`,
                  boxShadow: '0 4px 6px rgba(0,0,0,.16)',
                  fontSize: compact ? 52 : 72,
                  color: C.text,
                }}
              >
                {c.n}
              </div>
            ))}
          </div>
          <ToolIconButton icon={<RotateCcw size={28} strokeWidth={2.8} />} labelKey="digitool.reset" onClick={lineUp} />
        </Card>
        <ToolHint k="digiKaarten.hint" />
      </ToolFrame>
    </ExerciseShell>
  );
}
