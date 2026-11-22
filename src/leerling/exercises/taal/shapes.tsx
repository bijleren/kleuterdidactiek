/*
  Shapes for "Vormen" (port of iOS Features/Vormen/ShapeGlyph.swift) and the
  2D/3D shapes for "Instructies met vormen" (iOS DigiVormenView / SolidShape).
  iOS draws some Vormen glyphs with SF Symbols (gold outlines); those are
  redrawn here as SVG in the same style. Everything uses a 0…100 viewBox.
*/
import { useId } from 'react';
import type { ReactNode } from 'react';
import { C } from '../../ui';
import type { FlatKind, ShapeKind, SolidKind } from './shapeData';

/* ------------------------------------------------------------------ */
/* Vormen                                                               */
/* ------------------------------------------------------------------ */

const DARK = C.text;
const sym = { fill: 'none', stroke: C.gold, strokeWidth: 4.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** One Vormen glyph, filling its box (square). */
export function ShapeGlyph({ kind, className }: { kind: ShapeKind; className?: string }) {
  const gid = 'g' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const lw = 3;
  const line = { stroke: DARK, strokeWidth: lw, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
  let body: ReactNode = null;
  switch (kind) {
    // ---- SF-symbol style (gold outlines) ----
    case 'recht':
      body = <line x1="26" y1="74" x2="74" y2="26" {...sym} />;
      break;
    case 'rond':
      body = <circle cx="50" cy="50" r="29" {...sym} />;
      break;
    case 'hoek':
      body = (
        <g {...sym}>
          <path d="M70 72 L24 72 L60 28" />
          <path d="M38 72 A14 14 0 0 0 33 61" strokeWidth={3} />
        </g>
      );
      break;
    case 'driehoek':
      body = <path d="M50 22 L80 75 L20 75 Z" {...sym} />;
      break;
    case 'rechthoek':
      body = <rect x="19" y="33" width="62" height="36" rx="5" {...sym} />;
      break;
    case 'vierkant':
      body = <rect x="22" y="22" width="56" height="56" rx="5" {...sym} />;
      break;
    case 'cirkel':
      body = <circle cx="50" cy="50" r="30" fill={C.gold} />;
      break;
    case 'kubus':
      body = (
        <g {...sym}>
          <path d="M50 20 L76 34 L76 66 L50 80 L24 66 L24 34 Z" />
          <path d="M24 34 L50 48 L76 34 M50 48 L50 80" />
        </g>
      );
      break;
    case 'piramide':
      body = (
        <g {...sym}>
          <path d="M50 18 L20 70 L56 84 L82 64 Z" />
          <path d="M50 18 L56 84" />
        </g>
      );
      break;
    // ---- Canvas drawings (dark) ----
    case 'punt':
      body = <circle cx="50" cy="50" r="7" fill={DARK} />;
      break;
    case 'lijn':
      body = (
        <g>
          <line x1="18" y1="50" x2="82" y2="50" {...line} />
          <circle cx="18" cy="50" r={lw * 0.9} fill={DARK} />
          <circle cx="82" cy="50" r={lw * 0.9} fill={DARK} />
        </g>
      );
      break;
    case 'gebogen':
      body = <path d="M18 82 Q50 8.4 82 82" {...line} />;
      break;
    case 'balk': {
      const fx = 18, fy = 35.9, fw = 49.9, fh = 26.9, d = 11.97;
      const tl = [fx, fy], tr = [fx + fw, fy], br = [fx + fw, fy + fh];
      const p = (pts: number[][]) => 'M' + pts.map((q) => q.join(' ')).join(' L') + ' Z';
      body = (
        <g stroke={DARK} strokeWidth={lw} strokeLinejoin="round">
          <rect x={fx} y={fy} width={fw} height={fh} fill={C.gold + '38'} />
          <path d={p([tl, tr, [tr[0] + d, tr[1] - d], [tl[0] + d, tl[1] - d]])} fill={C.gold + '61'} />
          <path d={p([tr, br, [br[0] + d, br[1] - d], [tr[0] + d, tr[1] - d]])} fill={C.gold + '4d'} />
        </g>
      );
      break;
    }
    case 'bol':
      body = (
        <g>
          <defs>
            <radialGradient id={gid} gradientUnits="userSpaceOnUse" cx="39.8" cy="38.5" r="54.4">
              <stop offset="0" stopColor="white" />
              <stop offset="0.5" stopColor={C.gold} />
              <stop offset="1" stopColor={C.gold} stopOpacity="0.6" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="32" fill={`url(#${gid})`} stroke={DARK} strokeWidth={lw * 0.8} />
        </g>
      );
      break;
  }
  return <svg viewBox="0 0 100 100" className={className} role="img" aria-label="vorm">{body}</svg>;
}

/* ------------------------------------------------------------------ */
/* Instructies met vormen                                               */
/* ------------------------------------------------------------------ */


/** A flat 2D shape filled with `color` (thin dark outline), filling its box. */
export function FlatShape({ kind, color }: { kind: FlatKind; color: string }) {
  const stroke = { stroke: 'rgba(0,0,0,.15)', strokeWidth: 1.5 };
  if (kind === 'rectangle') {
    return (
      <svg viewBox="0 0 130 65" className="w-full h-full overflow-visible">
        <rect x="1" y="1" width="128" height="63" rx="6" fill={color} {...stroke} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
      {kind === 'square' && <rect x="1" y="1" width="98" height="98" rx="6" fill={color} {...stroke} />}
      {kind === 'circle' && <circle cx="50" cy="50" r="49" fill={color} {...stroke} />}
      {kind === 'triangle' && <path d="M50 1 L99 99 L1 99 Z" fill={color} {...stroke} strokeLinejoin="round" />}
    </svg>
  );
}

/** A 3D solid with two-tone shading — port of iOS SolidShape. */
export function SolidShape({ kind, color }: { kind: SolidKind; color: string }) {
  const id = 's' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const P = (pts: [number, number][]) => 'M' + pts.map(([x, y]) => `${x * 100} ${y * 100}`).join(' L') + ' Z';
  const face = (d: string, light = 0, dark = 0) => (
    <g>
      <path d={d} fill={color} />
      {light > 0 && <path d={d} fill="white" fillOpacity={light} />}
      {dark > 0 && <path d={d} fill="black" fillOpacity={dark} />}
    </g>
  );
  let body: ReactNode = null;
  switch (kind) {
    case 'bal':
      body = (
        <>
          <defs>
            <radialGradient id={id} gradientUnits="userSpaceOnUse" cx="36" cy="32" r="62">
              <stop offset="0" stopColor="white" stopOpacity="0.65" />
              <stop offset="0.5" stopColor="white" stopOpacity="0" />
              <stop offset="1" stopColor="black" stopOpacity="0.25" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="44" fill={color} />
          <circle cx="50" cy="50" r="44" fill={`url(#${id})`} />
        </>
      );
      break;
    case 'kubus': {
      const d = 0.22, f = 0.78;
      body = (
        <>
          {face(P([[0, d], [f, d], [f, d + f], [0, d + f]]))}
          {face(P([[0, d], [d, 0], [d + f, 0], [f, d]]), 0.35)}
          {face(P([[f, d], [d + f, 0], [1, f], [f, d + f]]), 0, 0.25)}
        </>
      );
      break;
    }
    case 'balk':
      body = (
        <>
          {face(P([[0, 0.35], [0.85, 0.35], [0.85, 0.8], [0, 0.8]]))}
          {face(P([[0, 0.35], [0.15, 0.2], [1, 0.2], [0.85, 0.35]]), 0.35)}
          {face(P([[0.85, 0.35], [1, 0.2], [1, 0.65], [0.85, 0.8]]), 0, 0.25)}
        </>
      );
      break;
    case 'cilinder': {
      const bodyD = 'M15 12 L85 12 L85 88 A35 12 0 0 1 15 88 Z';
      body = (
        <>
          <defs>
            <linearGradient id={id} x1="0.15" y1="0" x2="0.85" y2="0">
              <stop offset="0" stopColor="black" stopOpacity="0.22" />
              <stop offset="0.5" stopColor="white" stopOpacity="0.25" />
              <stop offset="1" stopColor="black" stopOpacity="0.22" />
            </linearGradient>
          </defs>
          <path d={bodyD} fill={color} />
          <path d={bodyD} fill={`url(#${id})`} />
          {face('M15 12 A35 12 0 1 0 85 12 A35 12 0 1 0 15 12 Z', 0.4)}
        </>
      );
      break;
    }
    case 'kegel': {
      const cone = P([[0.5, 0.02], [0.1, 0.86], [0.9, 0.86]]);
      body = (
        <>
          <defs>
            <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="20" y1="50" x2="90" y2="50">
              <stop offset="0" stopColor="white" stopOpacity="0.3" />
              <stop offset="0.5" stopColor="white" stopOpacity="0" />
              <stop offset="1" stopColor="black" stopOpacity="0.22" />
            </linearGradient>
          </defs>
          {face('M10 86 A40 12 0 1 0 90 86 A40 12 0 1 0 10 86 Z', 0, 0.2)}
          <path d={cone} fill={color} />
          <path d={cone} fill={`url(#${id})`} />
        </>
      );
      break;
    }
    case 'piramide':
      body = (
        <>
          {face(P([[0.5, 0.06], [0.06, 0.82], [0.62, 0.94]]), 0.2)}
          {face(P([[0.5, 0.06], [0.62, 0.94], [0.94, 0.7]]), 0, 0.28)}
        </>
      );
      break;
  }
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,.15))' }}>
      {body}
    </svg>
  );
}
