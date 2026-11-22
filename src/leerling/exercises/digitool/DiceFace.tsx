/*
  A die face 1–10 with pips in the standard (domino-style) arrangement —
  port of iOS Features/Dobbelsteen/DiceFace.swift. 7–10 use denser layouts
  with slightly smaller pips; 10 = two columns of five.
*/
import { C } from '../../ui';

function positions(value: number): [number, number][] {
  const l = 0.18, c = 0.5, r = 0.82;
  switch (value) {
    case 1: return [[c, c]];
    case 2: return [[l, l], [r, r]];
    case 3: return [[l, l], [c, c], [r, r]];
    case 4: return [[l, l], [r, l], [l, r], [r, r]];
    case 5: return [[l, l], [r, l], [c, c], [l, r], [r, r]];
    case 6: return [[l, l], [r, l], [l, c], [r, c], [l, r], [r, r]];
    case 7: return [[l, l], [r, l], [l, c], [c, c], [r, c], [l, r], [r, r]];
    case 8: return [[l, l], [c, l], [r, l], [l, c], [r, c], [l, r], [c, r], [r, r]];
    case 9: return [[l, l], [c, l], [r, l], [l, c], [c, c], [r, c], [l, r], [c, r], [r, r]];
    case 10: {
      const rows = [0.1, 0.3, 0.5, 0.7, 0.9];
      return [...rows.map((y) => [0.3, y] as [number, number]), ...rows.map((y) => [0.7, y] as [number, number])];
    }
    default: return [[c, c]];
  }
}

export function DiceFace({ value, size }: { value: number; size: number }) {
  const inset = 16, area = 100 - inset * 2;
  const pip = value > 6 ? 12 : 16;
  return (
    <svg
      width={size}
      height={size}
      viewBox="-2 -2 104 104"
      role="img"
      aria-label={`Dobbelsteen: ${value}`}
      style={{ filter: 'drop-shadow(0 5px 10px rgba(0,0,0,.18))' }}
    >
      <rect x="0" y="0" width="100" height="100" rx="16" fill="white" stroke={C.gold} strokeOpacity={0.45} strokeWidth={1.2} />
      {positions(value).map(([x, y], i) => (
        <circle key={i} cx={inset + x * area} cy={inset + y * area} r={pip / 2} fill={C.text} />
      ))}
    </svg>
  );
}
