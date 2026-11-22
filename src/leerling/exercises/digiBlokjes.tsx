/*
  Digitool "Klikblokjes" — port of iOS Features/Digitool/DigiBlokjesView.swift.
  Linking cubes that snap together on a grid. Drag the starter block from the
  tray onto the canvas (or tap it) to add a block in the chosen colour and
  size (1×1, 2×2 or 3×3 cells). Blocks snap to the grid on release, so cubes
  placed side by side click into bars and towers. Double-tap removes a block.

  Two drag modes, like the physical material:
    • "Vast aan elkaar" (sticky, default): grabbing a block takes every block
      clicked on above and to the right of it along — the piece moves as one;
      if the whole piece doesn't fit anywhere near the drop, it springs back.
    • "Blokje per blokje": only the grabbed block moves.
*/
import { useRef, useState } from 'react';
import type { PointerEvent as RPointerEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { C, ExerciseShell } from '../ui';
import { useStopOnUnmount } from '../hooks';
import { t } from '../strings';
import {
  Card, ColorRow, GOLD_GRADIENT, PALETTE, PillGroup, ToolFrame, ToolHint, ToolIconButton, newId, useDoubleTap, useElementSize, capture,
} from './digitool/kit';

interface Block {
  id: string;
  colorIndex: number;
  col: number;
  row: number;
  /** Side length in grid cells (1, 2 or 3). */
  size: number;
  /** Free centre position while the pointer is down; undefined = on the grid. */
  drag?: { x: number; y: number };
}

type DragMode = 'sticky' | 'single';
interface Member { id: string; dc: number; dr: number; dx: number; dy: number }

const SIZES = [1, 2, 3];
const key = (c: number, r: number) => `${c},${r}`;

/** Every grid cell covered by a block's footprint. */
function cellsOf(col: number, row: number, size: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) out.push([col + i, row + j]);
  return out;
}

/** A linking cube: full-cell square with one darker stud per unit cell. */
function BlockLook({ color, size }: { color: string; size: number }) {
  const studs = [];
  for (let k = 0; k < size * size; k++) {
    const i = k % size, j = Math.floor(k / size);
    studs.push(
      <circle key={k} cx={(i + 0.5) * 100} cy={(j + 0.5) * 100} r={21} fill="rgba(0,0,0,0.14)" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />,
    );
  }
  const s = size * 100;
  return (
    <svg viewBox={`0 0 ${s} ${s}`} width="100%" height="100%" style={{ display: 'block' }}>
      <rect x={0.75} y={0.75} width={s - 1.5} height={s - 1.5} rx={5 * size} fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      {studs}
    </svg>
  );
}

export default function DigiBlokjes() {
  useStopOnUnmount();
  const canvasRef = useRef<HTMLDivElement>(null);
  const cs = useElementSize(canvasRef);
  const cell = cs.width > 0 && cs.width < 640 ? 60 : 80;
  const maxCol = Math.max(0, Math.floor(cs.width / cell) - 1);
  const maxRow = Math.max(0, Math.floor(cs.height / cell) - 1);

  const [blocks, setBlocksState] = useState<Block[]>([]);
  const blocksRef = useRef(blocks);
  const setBlocks = (next: Block[]) => { blocksRef.current = next; setBlocksState(next); };

  const [colorIndex, setColorIndex] = useState(0);
  const [blockSize, setBlockSize] = useState(1);
  const [dragMode, setDragMode] = useState<DragMode>('sticky');
  const tap = useDoubleTap();

  const center = (b: Block) => ({ x: (b.col + b.size / 2) * cell, y: (b.row + b.size / 2) * cell });

  /** Cells taken by resting blocks, excluding the given ids. */
  const occupiedCells = (excluding: Set<string>) => {
    const out = new Set<string>();
    for (const b of blocksRef.current) {
      if (excluding.has(b.id) || b.drag) continue;
      for (const [c, r] of cellsOf(b.col, b.row, b.size)) out.add(key(c, r));
    }
    return out;
  };

  /** True when a size×size footprint at base (c, r) is in bounds and free. */
  const fits = (c: number, r: number, size: number, occupied: Set<string>) => {
    if (c < 0 || r < 0 || c + size - 1 > maxCol || r + size - 1 > maxRow) return false;
    return cellsOf(c, r, size).every(([a, b]) => !occupied.has(key(a, b)));
  };

  /** Walks outward in square rings around (c0, r0) until `ok` holds. */
  const searchRings = (c0: number, r0: number, ok: (c: number, r: number) => boolean): [number, number] | null => {
    if (ok(c0, r0)) return [c0, r0];
    const maxR = Math.max(maxCol, maxRow, 1);
    for (let radius = 1; radius <= maxR; radius++) {
      for (let dc = -radius; dc <= radius; dc++) {
        for (let dr = -radius; dr <= radius; dr++) {
          if (Math.abs(dc) !== radius && Math.abs(dr) !== radius) continue;
          if (ok(c0 + dc, r0 + dr)) return [c0 + dc, r0 + dr];
        }
      }
    }
    return null;
  };

  /** Base cell whose footprint centre is nearest to the drop point. */
  const nearestFreeCell = (p: { x: number; y: number }, size: number, excluding: Set<string>): [number, number] => {
    const occupied = occupiedCells(excluding);
    const c0 = Math.min(Math.max(Math.round(p.x / cell - size / 2), 0), Math.max(0, maxCol - size + 1));
    const r0 = Math.min(Math.max(Math.round(p.y / cell - size / 2), 0), Math.max(0, maxRow - size + 1));
    return searchRings(c0, r0, (c, r) => fits(c, r, size, occupied)) ?? [c0, r0];
  };

  /**
   * The connected piece hanging on a grabbed block: flood-fill following
   * only "above" and "to the right" links (like lifting a physical
   * linking-cube construction by one cube).
   */
  const connectedGroup = (origin: Block): Member[] => {
    const byCell = new Map<string, Block>();
    for (const b of blocksRef.current) {
      if (b.drag) continue;
      for (const [c, r] of cellsOf(b.col, b.row, b.size)) byCell.set(key(c, r), b);
    }
    const offsets = (b: Block): Member => {
      const dc = b.col - origin.col, dr = b.row - origin.row;
      const half = (b.size - origin.size) / 2;
      return { id: b.id, dc, dr, dx: (dc + half) * cell, dy: (dr + half) * cell };
    };
    const result: Member[] = [{ id: origin.id, dc: 0, dr: 0, dx: 0, dy: 0 }];
    const seen = new Set([origin.id]);
    const queue = [origin];
    while (queue.length) {
      const cur = queue.pop()!;
      const neighbours: [number, number][] = [];
      for (let i = 0; i < cur.size; i++) neighbours.push([cur.col + i, cur.row - 1]);
      for (let j = 0; j < cur.size; j++) neighbours.push([cur.col + cur.size, cur.row + j]);
      for (const [c, r] of neighbours) {
        const b = byCell.get(key(c, r));
        if (!b || seen.has(b.id)) continue;
        seen.add(b.id);
        result.push(offsets(b));
        queue.push(b);
      }
    }
    return result;
  };

  /* ---------- dragging placed blocks ---------- */

  const gesture = useRef<{
    id: string; pointerId: number; startX: number; startY: number; grabDx: number; grabDy: number;
    moved: boolean; group: Member[];
  } | null>(null);

  const local = (e: { clientX: number; clientY: number }) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onBlockDown = (e: RPointerEvent<HTMLDivElement>, b: Block) => {
    if (gesture.current) return;
    e.preventDefault();
    capture(e);
    const pt = local(e);
    const c = center(b);
    gesture.current = { id: b.id, pointerId: e.pointerId, startX: pt.x, startY: pt.y, grabDx: pt.x - c.x, grabDy: pt.y - c.y, moved: false, group: [] };
  };

  const onBlockMove = (e: RPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    const pt = local(e);
    if (!g.moved) {
      if (Math.hypot(pt.x - g.startX, pt.y - g.startY) < 4) return;
      g.moved = true;
      const origin = blocksRef.current.find((x) => x.id === g.id);
      if (!origin) { gesture.current = null; return; }
      g.group = dragMode === 'sticky' ? connectedGroup(origin) : [{ id: origin.id, dc: 0, dr: 0, dx: 0, dy: 0 }];
    }
    const p = { x: pt.x - g.grabDx, y: pt.y - g.grabDy };
    const byId = new Map(g.group.map((m) => [m.id, m]));
    setBlocks(blocksRef.current.map((b) => {
      const m = byId.get(b.id);
      return m ? { ...b, drag: { x: p.x + m.dx, y: p.y + m.dy } } : b;
    }));
  };

  const onBlockUp = (e: RPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    gesture.current = null;
    if (!g.moved) {
      if (e.type !== 'pointercancel' && tap(g.id) === 'double') {
        setBlocks(blocksRef.current.filter((b) => b.id !== g.id));
      }
      return;
    }
    const pt = local(e);
    const p = { x: pt.x - g.grabDx, y: pt.y - g.grabDy };
    const current = blocksRef.current;
    const grabbed = current.find((b) => b.id === g.id);
    if (!grabbed) return;
    const ids = new Set(g.group.map((m) => m.id));

    if (g.group.length === 1) {
      // Single block (either mode): nearest free cell.
      const [c, r] = nearestFreeCell(p, grabbed.size, ids);
      setBlocks(current.map((b) => (b.id === g.id ? { ...b, col: c, row: r, drag: undefined } : b)));
      return;
    }

    // Sticky group: nearest base where the WHOLE piece fits; else spring back.
    const occupied = occupiedCells(ids);
    const sizeOf = new Map(current.map((b) => [b.id, b.size]));
    const groupFits = (c: number, r: number) =>
      g.group.every((m) => fits(c + m.dc, r + m.dr, sizeOf.get(m.id) ?? 1, occupied));
    const c0 = Math.round(p.x / cell - grabbed.size / 2);
    const r0 = Math.round(p.y / cell - grabbed.size / 2);
    const base = searchRings(c0, r0, groupFits);
    const byId = new Map(g.group.map((m) => [m.id, m]));
    setBlocks(current.map((b) => {
      const m = byId.get(b.id);
      if (!m) return b;
      return base ? { ...b, col: base[0] + m.dc, row: base[1] + m.dr, drag: undefined } : { ...b, drag: undefined };
    }));
  };

  /* ---------- tray: starter block ---------- */

  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const tray = useRef<{ startX: number; startY: number; moved: boolean } | null>(null);

  const addBlock = (c: number, r: number) =>
    setBlocks([...blocksRef.current, { id: newId(), colorIndex, col: c, row: r, size: blockSize }]);

  /** Tapping the tray block adds one in the top-left area of the canvas. */
  const addAtSpawn = () => {
    const spawn = { x: cell * (blockSize / 2 + 1), y: cell * (blockSize / 2 + 1) };
    const [c, r] = nearestFreeCell(spawn, blockSize, new Set());
    addBlock(c, r);
  };

  const onTrayDown = (e: RPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    capture(e);
    tray.current = { startX: e.clientX, startY: e.clientY, moved: false };
  };
  const onTrayMove = (e: RPointerEvent<HTMLButtonElement>) => {
    const tr = tray.current;
    if (!tr) return;
    if (!tr.moved && Math.hypot(e.clientX - tr.startX, e.clientY - tr.startY) < 3) return;
    tr.moved = true;
    setGhost({ x: e.clientX, y: e.clientY });
  };
  const onTrayUp = (e: RPointerEvent<HTMLButtonElement>) => {
    const tr = tray.current;
    tray.current = null;
    setGhost(null);
    if (!tr || e.type === 'pointercancel') return;
    if (!tr.moved) { addAtSpawn(); return; }
    const rect = canvasRef.current!.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
      const [c, r] = nearestFreeCell({ x: e.clientX - rect.left, y: e.clientY - rect.top }, blockSize, new Set());
      addBlock(c, r);
    }
  };

  const traySide = cell === 60 ? 48 : 60;
  const unit = cell === 60 ? 16 : 20;

  return (
    <ExerciseShell mode="digiBlokjes" hideNiveau>
      <ToolFrame>
        <Card className="relative flex-1 min-h-0">
          <div ref={canvasRef} className="absolute inset-0 overflow-hidden rounded-3xl select-none">
            {blocks.map((b) => {
              const side = cell * b.size;
              const pos = b.drag ?? center(b);
              return (
                <div
                  key={b.id}
                  onPointerDown={(e) => onBlockDown(e, b)}
                  onPointerMove={onBlockMove}
                  onPointerUp={onBlockUp}
                  onPointerCancel={onBlockUp}
                  className="absolute cursor-grab active:cursor-grabbing"
                  style={{
                    width: side, height: side, left: pos.x - side / 2, top: pos.y - side / 2,
                    zIndex: b.drag ? 10 : 0, touchAction: 'none',
                    filter: b.drag ? 'drop-shadow(0 4px 6px rgba(0,0,0,.2))' : undefined,
                  }}
                >
                  <BlockLook color={PALETTE[b.colorIndex]} size={b.size} />
                </div>
              );
            })}
          </div>
          <ToolIconButton icon={<Trash2 size={28} strokeWidth={2.6} />} labelKey="digitool.clear" onClick={() => setBlocks([])} />
        </Card>
        <ToolHint k="digiBlokjes.hint" />
        <div className="flex justify-center">
          <PillGroup
            options={[
              { value: 'sticky' as const, label: t('digiBlokjes.mode.sticky') },
              { value: 'single' as const, label: t('digiBlokjes.mode.one') },
            ]}
            value={dragMode}
            onChange={setDragMode}
          />
        </div>
        <Card className="flex items-center justify-center gap-7 px-4 py-3">
          <div className="flex items-end gap-2.5">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setBlockSize(s)}
                aria-label={t(`digiBlokjes.size${s}`)}
                title={t(`digiBlokjes.size${s}`)}
                className="rounded transition active:scale-95"
                style={{
                  width: unit * s, height: unit * s,
                  background: blockSize === s ? GOLD_GRADIENT : 'white',
                  border: blockSize === s ? 'none' : `1.5px solid ${C.gold}66`,
                }}
              />
            ))}
          </div>
          <button
            onPointerDown={onTrayDown}
            onPointerMove={onTrayMove}
            onPointerUp={onTrayUp}
            onPointerCancel={onTrayUp}
            aria-label={t(`digiBlokjes.size${blockSize}`)}
            className="block cursor-grab"
            style={{ width: traySide, height: traySide, touchAction: 'none' }}
          >
            <span className="block w-full h-full pointer-events-none"><BlockLook color={PALETTE[colorIndex]} size={blockSize} /></span>
          </button>
        </Card>
        <ColorRow selected={colorIndex} onPick={setColorIndex} />
      </ToolFrame>
      {ghost && (
        <div
          className="fixed pointer-events-none z-[9999]"
          style={{
            width: cell * blockSize, height: cell * blockSize,
            left: ghost.x - (cell * blockSize) / 2, top: ghost.y - (cell * blockSize) / 2, opacity: 0.85,
          }}
        >
          <BlockLook color={PALETTE[colorIndex]} size={blockSize} />
        </div>
      )}
    </ExerciseShell>
  );
}
