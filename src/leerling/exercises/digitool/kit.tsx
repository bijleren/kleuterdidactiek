/*
  Shared bits for the Digitool free-play tools — port of iOS DigitoolKit.swift:
  the classroom colour palette, the colour-picker row, the segmented option
  pills, the round trash / reset button, the one-line hint, plus small
  web helpers (canvas size observer, tap vs. double-tap detection).
  The tools are digital versions of physical materials: no scoring.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { C, cx } from '../../ui';
import { t } from '../../strings';

/** Bright, high-contrast colours matching classic classroom materials. */
export const PALETTE = [
  'rgb(227,66,61)',   // red
  'rgb(56,125,222)',  // blue
  'rgb(71,173,89)',   // green
  'rgb(250,196,48)',  // yellow
  'rgb(242,133,38)',  // orange
  'rgb(158,92,199)',  // purple
];

export const GOLD_GRADIENT = `linear-gradient(180deg, ${C.goldMid}, ${C.gold})`;

/** A row of clickable colour dots; the selected one gets a gold ring. */
export function ColorRow({ selected, onPick }: { selected: number; onPick: (i: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-3 py-1">
      {PALETTE.map((col, i) => (
        <button
          key={i}
          onClick={() => onPick(i)}
          aria-label={`Kleur ${i + 1}`}
          className="relative w-[42px] h-[42px] rounded-full transition active:scale-95"
          style={{
            background: col,
            border: '2px solid white',
            boxShadow: selected === i
              ? `0 0 0 3px white, 0 0 0 6.5px ${C.gold}, 0 2px 3px rgba(0,0,0,.15)`
              : '0 2px 3px rgba(0,0,0,.15)',
          }}
        />
      ))}
    </div>
  );
}

/** Capsule with option pills (dice count, max…), like iOS DigitoolPill rows. */
export function PillGroup<T extends string | number>({ options, value, onChange }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex gap-2 p-1 rounded-full bg-white/60 border" style={{ borderColor: C.gold + '40' }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            className="px-3.5 py-2 rounded-full font-quicksand font-extrabold text-sm whitespace-nowrap transition"
            style={active ? { background: GOLD_GRADIENT, color: 'white' } : { color: C.text + '99' }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** The trash / reset circle button shown bottom-right on the canvases. */
export function ToolIconButton({ icon, labelKey, onClick }: { icon: ReactNode; labelKey: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={t(labelKey)}
      title={t(labelKey)}
      className="absolute bottom-3 right-3 z-[9000] w-[72px] h-[72px] rounded-full flex items-center justify-center bg-white/90 transition active:scale-95"
      style={{ color: C.text + 'a6', border: `1.5px solid ${C.gold}59`, boxShadow: '0 3px 5px rgba(0,0,0,.12)' }}
    >
      {icon}
    </button>
  );
}

/** One-line usage hint shown under a tool's canvas. */
export function ToolHint({ k }: { k: string }) {
  return <p className="text-center text-sm font-medium px-2" style={{ color: C.text + '8c' }}>{t(k)}</p>;
}

/** White rounded card used for canvases and trays. */
export function Card({ className, children, innerRef }: { className?: string; children?: ReactNode; innerRef?: RefObject<HTMLDivElement> }) {
  return (
    <div
      ref={innerRef}
      className={cx('bg-white rounded-3xl border', className)}
      style={{ borderColor: C.gold + '26', boxShadow: '0 4px 14px rgba(0,0,0,.06)' }}
    >
      {children}
    </div>
  );
}

/** Live size of an element (ResizeObserver). */
export function useElementSize(ref: RefObject<HTMLElement>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/**
 * Tap / double-tap detection per id. `tap(id)` returns 'double' when the
 * same id was tapped within 320 ms, otherwise 'single'.
 */
export function useDoubleTap() {
  const last = useRef<{ id: string; at: number } | null>(null);
  return useCallback((id: string): 'single' | 'double' => {
    const now = Date.now();
    const l = last.current;
    if (l && l.id === id && now - l.at < 320) { last.current = null; return 'double'; }
    last.current = { id, at: now };
    return 'single';
  }, []);
}

/** Wrapper that fills the exercise area (between top bar and page bottom) without page scroll. */
export function ToolFrame({ children }: { children: ReactNode }) {
  return (
    <div className="self-stretch flex-1 min-h-0 flex flex-col gap-3 w-full max-w-[1400px] mx-auto" style={{ height: 'calc(100dvh - 100px)' }}>
      {children}
    </div>
  );
}

let idSeq = 0;
export const newId = () => `i${++idSeq}-${Math.random().toString(36).slice(2, 7)}`;

export const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));

/** setPointerCapture that never throws (synthetic / already-released pointers). */
export function capture(e: { currentTarget: Element; pointerId: number }) {
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
}
