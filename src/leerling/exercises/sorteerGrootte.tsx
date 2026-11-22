/*
  "Sorteer op grootte" — port of iOS SorteerGrootteView/ViewModel.
  3…5 bars of distinct sizes, shuffled; the child drags them into order,
  small → large or large → small (random per round). Length rounds stack
  horizontal bars vertically (legend beside them); height rounds put vertical
  bars in a row (legend below). A ghost bar follows the pointer; dropping on a
  slot swaps the two bars. Solved when the order is right → green, next.
  Instruction spoken every round. Analytics prefix: sorteer.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ArrowDown, ArrowRight, Hand, Menu } from 'lucide-react';
import { C, ExerciseShell, cx } from '../ui';
import { useExerciseTracker, useStopOnUnmount } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { randInt, shuffle } from '../lib/dutch';
import { t } from '../strings';
import { FooterRow } from './rangorde/shared';
import { GOLD_GRADIENT, useAdvance } from './rangorde/logic';

interface Item { id: number; rank: number }
type Dimension = 'length' | 'height';
interface Round { n: number; count: number; dimension: Dimension; ascending: boolean }

let nextId = 1;

function makeRound(n: number): { round: Round; items: Item[] } {
  const count = randInt(3, 5);
  const dimension: Dimension = Math.random() < 0.5 ? 'length' : 'height';
  const ascending = Math.random() < 0.5;
  const ranks = Array.from({ length: count }, (_, k) => k + 1);
  const goal = ascending ? ranks : ranks.slice().reverse();
  let order = shuffle(ranks);
  // Don't hand the child an already-solved row.
  if (order.join() === goal.join()) order.reverse();
  if (order.join() === goal.join()) [order[0], order[count - 1]] = [order[count - 1], order[0]];
  order = order.slice();
  return {
    round: { n, count, dimension, ascending },
    items: order.map((rank) => ({ id: nextId++, rank })),
  };
}

/** Size along the sort axis: lerp between lo and hi (hi capped by the viewport). */
function sizeCss(rank: number, count: number, lo: number, hi: string): string {
  const f = count > 1 ? (rank - 1) / (count - 1) : 1;
  return `calc(${lo}px + (${hi} - ${lo}px) * ${f})`;
}

export default function SorteerGrootte() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const tracker = useExerciseTracker('sorteer');
  const advance = useAdvance();
  const [round, setRound] = useState<Round | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [solved, setSolved] = useState(false);
  const [drag, setDrag] = useState<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const roundNo = useRef(0);

  const next = useCallback(() => {
    advance.cancel();
    const r = makeRound(++roundNo.current);
    setRound(r.round);
    setItems(r.items);
    setSolved(false);
    setDrag(null);
  }, [advance]);

  // Keyed on primitive inputs only (not on `next`'s identity), so a new
  // round — and one tracker.shown() — happens only on mount / input change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { next(); }, []);

  const instructionText = round ? t(round.ascending ? 'sorteer.prompt.asc' : 'sorteer.prompt.desc') : '';

  useEffect(() => {
    if (!round) return;
    tracker.shown();
    void voice.playInstruction(instructionText, settings.spokenInstructions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.n]);

  const swapTo = (id: number, j: number) => {
    if (!round || solved) return;
    const i = items.findIndex((it) => it.id === id);
    if (i < 0 || j < 0 || j >= items.length || i === j) return;
    const nextItems = items.slice();
    [nextItems[i], nextItems[j]] = [nextItems[j], nextItems[i]];
    setItems(nextItems);
    const goal = Array.from({ length: round.count }, (_, k) => (round.ascending ? k + 1 : round.count - k));
    if (nextItems.map((it) => it.rank).join() === goal.join()) {
      setSolved(true);
      tracker.markCorrect();
      advance.schedule(next, 1200);
    }
  };

  /* ---- pointer drag (mouse + touch) ---- */
  const onDown = (id: number) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (solved) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY };
    setDrag({ id, x: e.clientX, y: e.clientY, moved: false });
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag || !start.current) return;
    const moved = drag.moved || Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) >= 4;
    setDrag({ ...drag, x: e.clientX, y: e.clientY, moved });
  };
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const d = drag;
    setDrag(null);
    start.current = null;
    if (!d.moved) return;
    slotRefs.current.forEach((el, idx) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) swapTo(d.id, idx);
    });
  };

  const isLength = round?.dimension === 'length';
  const count = round?.count ?? 3;

  const bar = (item: Item, ghost: boolean) => (
    <div
      className="rounded-[9px] flex items-center justify-center"
      style={{
        background: solved ? C.success : GOLD_GRADIENT,
        border: '1.5px solid rgba(255,255,255,.5)',
        boxShadow: ghost ? '0 6px 16px rgba(0,0,0,.25)' : '0 1px 3px rgba(0,0,0,.14)',
        width: isLength ? sizeCss(item.rank, count, 90, 'min(460px, 55vw)') : 48,
        height: isLength ? 40 : sizeCss(item.rank, count, 70, 'min(300px, 36vh)'),
        transition: ghost ? undefined : 'background .3s',
      }}
    >
      {/* Greepje: shows the bar can be grabbed; gone once the row is right. */}
      {!solved && <Menu size={16} strokeWidth={3} color="white" style={{ opacity: ghost ? 0.95 : 0.75 }} />}
    </div>
  );

  const draggable = (item: Item) => (
    <div
      onPointerDown={onDown(item.id)}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={() => { setDrag(null); start.current = null; }}
      className={cx(!solved && 'cursor-grab active:cursor-grabbing')}
      style={{ touchAction: 'none', opacity: drag?.moved && drag.id === item.id ? 0 : 1 }}
    >
      {bar(item, false)}
    </div>
  );

  const marker = (big: boolean) => (
    <div className="flex flex-col items-center gap-1 min-w-[52px]" aria-label={t(big ? 'sorteer.groot.lang' : 'sorteer.klein.lang')}>
      <div className="h-10 flex items-center">
        <div
          style={{
            width: big ? 40 : 16, height: big ? 40 : 16, borderRadius: big ? 7 : 4,
            background: GOLD_GRADIENT, border: '1.5px solid rgba(255,255,255,.6)', boxShadow: '0 1px 3px rgba(0,0,0,.12)',
          }}
        />
      </div>
      <span className="font-baloo font-bold text-base">{t(big ? 'sorteer.groot' : 'sorteer.klein')}</span>
    </div>
  );

  const asc = round?.ascending ?? true;
  const dragged = drag?.moved ? items.find((it) => it.id === drag.id) : undefined;

  return (
    <ExerciseShell
      mode="sorteerGrootte"
      correct={tracker.correct}
      hideNiveau
      footer={<FooterRow onSkip={next} />}
    >
      {round && (
        <div className="w-full max-w-5xl flex flex-col items-center gap-5 select-none">
          <div className="text-center">
            <p className="font-baloo font-bold text-2xl sm:text-3xl" style={{ color: solved ? C.success : C.text }}>
              {instructionText}
            </p>
            <p className="mt-1 font-bold opacity-75 flex items-center justify-center gap-2">
              <Hand size={18} /> {t('sorteer.actie')}
            </p>
          </div>

          {isLength ? (
            <div className="w-full flex items-center justify-center gap-4 sm:gap-6">
              <div className="flex flex-col items-center gap-2.5 w-16 shrink-0">
                {marker(!asc)}
                <ArrowDown size={20} strokeWidth={3} style={{ color: C.gold }} />
                {marker(asc)}
              </div>
              <div className="flex-1 max-w-[520px] flex flex-col gap-2.5">
                {items.map((it, idx) => (
                  <div key={it.id} ref={(el) => { slotRefs.current[idx] = el; }} className="flex py-0.5">
                    {draggable(it)}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-2xl flex flex-col items-center gap-4">
              <div className="w-full flex items-end gap-2.5" style={{ height: 'min(300px, 36vh)' }}>
                {items.map((it, idx) => (
                  <div key={it.id} ref={(el) => { slotRefs.current[idx] = el; }} className="flex-1 h-full flex items-end justify-center">
                    {draggable(it)}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                {marker(!asc)}
                <ArrowRight size={20} strokeWidth={3} style={{ color: C.gold }} />
                {marker(asc)}
              </div>
            </div>
          )}
        </div>
      )}

      {dragged && drag && (
        <div
          className="fixed z-30 pointer-events-none"
          style={{ left: drag.x, top: drag.y, transform: 'translate(-50%, -50%)' }}
        >
          {bar(dragged, true)}
        </div>
      )}
    </ExerciseShell>
  );
}
