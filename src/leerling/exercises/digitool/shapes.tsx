/*
  SVG renderings of the Digitool figures:
  • FlatShape  — square / circle / triangle / rectangle (DigiVormenView.shapeView)
  • SolidShape — bal / kubus / balk / cilinder / kegel / piramide with simple
    two-tone shading (DigiLichamenView.SolidShape, same geometry in a 0–100 box).
  Both fill their parent box.
*/
import { useId } from 'react';
import type { ReactNode } from 'react';

export type FlatKind = 'square' | 'circle' | 'triangle' | 'rectangle';
export type SolidKind = 'bal' | 'kubus' | 'balk' | 'cilinder' | 'kegel' | 'piramide';

const STROKE = 'rgba(0,0,0,0.15)';

export function FlatShape({ kind, color }: { kind: FlatKind; color: string }) {
  // Rendered in pixels-ish units via a viewBox matching the aspect ratio.
  const w = kind === 'rectangle' ? 200 : 100, h = 100;
  return (
    <svg viewBox={`-1 -1 ${w + 2} ${h + 2}`} width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      {kind === 'circle' && <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} fill={color} stroke={STROKE} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />}
      {(kind === 'square' || kind === 'rectangle') && (
        <rect x={0} y={0} width={w} height={h} rx={kind === 'square' ? 6 : 8} fill={color} stroke={STROKE} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      )}
      {kind === 'triangle' && (
        <polygon points={`${w / 2},0 ${w},${h} 0,${h}`} fill={color} stroke={STROKE} strokeWidth={1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      )}
    </svg>
  );
}

export function SolidShape({ kind, color }: { kind: SolidKind; color: string }) {
  const uid = useId().replace(/:/g, '');
  const poly = (pts: [number, number][]) => pts.map(([x, y]) => `${x * 100},${y * 100}`).join(' ');
  const shade = (light = 0, dark = 0) => (
    light > 0 ? `rgba(255,255,255,${light})` : dark > 0 ? `rgba(0,0,0,${dark})` : 'none'
  );
  /** A face in the base colour with an optional white / black tint on top. */
  const face = (key: string, pts: [number, number][], light = 0, dark = 0) => (
    <g key={key}>
      <polygon points={poly(pts)} fill={color} />
      {(light > 0 || dark > 0) && <polygon points={poly(pts)} fill={shade(light, dark)} />}
    </g>
  );

  let body: ReactNode;
  switch (kind) {
    case 'bal':
      body = (
        <>
          <defs>
            <radialGradient id={`g${uid}`} cx={36} cy={32} r={62} fx={36} fy={32} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="white" stopOpacity={0.65} />
              <stop offset="0.5" stopColor="white" stopOpacity={0} />
              <stop offset="1" stopColor="black" stopOpacity={0.25} />
            </radialGradient>
          </defs>
          <circle cx={50} cy={50} r={44} fill={color} />
          <circle cx={50} cy={50} r={44} fill={`url(#g${uid})`} />
        </>
      );
      break;
    case 'kubus': {
      const d = 0.22, f = 0.78;
      body = (
        <>
          {face('f1', [[0, d], [f, d], [f, 1], [0, 1]], 0, 0)}
          {face('f2', [[0, d], [d, 0], [d + f, 0], [f, d]], 0.35, 0)}
          {face('f3', [[f, d], [d + f, 0], [1, f], [f, d + f]], 0, 0.25)}
        </>
      );
      break;
    }
    case 'balk':
      body = (
        <>
          {face('f4', [[0, 0.35], [0.85, 0.35], [0.85, 0.8], [0, 0.8]], 0, 0)}
          {face('f5', [[0, 0.35], [0.15, 0.2], [1, 0.2], [0.85, 0.35]], 0.35, 0)}
          {face('f6', [[0.85, 0.35], [1, 0.2], [1, 0.65], [0.85, 0.8]], 0, 0.25)}
        </>
      );
      break;
    case 'cilinder':
      body = (
        <>
          <defs>
            <linearGradient id={`g${uid}`} x1="15" y1="50" x2="85" y2="50" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="black" stopOpacity={0.22} />
              <stop offset="0.5" stopColor="white" stopOpacity={0.25} />
              <stop offset="1" stopColor="black" stopOpacity={0.22} />
            </linearGradient>
          </defs>
          <path d="M15 12 H85 V88 A35 12 0 0 1 15 88 Z" fill={color} />
          <path d="M15 12 H85 V88 A35 12 0 0 1 15 88 Z" fill={`url(#g${uid})`} />
          <ellipse cx={50} cy={12} rx={35} ry={12} fill={color} />
          <ellipse cx={50} cy={12} rx={35} ry={12} fill="rgba(255,255,255,0.4)" />
        </>
      );
      break;
    case 'kegel':
      body = (
        <>
          <defs>
            <linearGradient id={`g${uid}`} x1="20" y1="50" x2="90" y2="50" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="white" stopOpacity={0.3} />
              <stop offset="0.5" stopColor="white" stopOpacity={0} />
              <stop offset="1" stopColor="black" stopOpacity={0.22} />
            </linearGradient>
          </defs>
          <ellipse cx={50} cy={86} rx={40} ry={12} fill={color} />
          <ellipse cx={50} cy={86} rx={40} ry={12} fill="rgba(0,0,0,0.2)" />
          <polygon points="50,2 10,86 90,86" fill={color} />
          <polygon points="50,2 10,86 90,86" fill={`url(#g${uid})`} />
        </>
      );
      break;
    case 'piramide':
      body = (
        <>
          {face('f7', [[0.5, 0.06], [0.06, 0.82], [0.62, 0.94]], 0.2, 0)}
          {face('f8', [[0.5, 0.06], [0.62, 0.94], [0.94, 0.7]], 0, 0.28)}
        </>
      );
      break;
  }

  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: 'block', overflow: 'visible', filter: 'drop-shadow(0 3px 4px rgba(0,0,0,.15))' }}>
      {body}
    </svg>
  );
}
