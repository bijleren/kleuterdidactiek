/*
  Drawn faces for the "tellen2" batch, ported from the iOS SwiftUI views:
  PlayingCardFace (pips in the classic layout, no rank digit),
  CountingCardFace (the same card with tappable pips for Speelkaarten tellen),
  DiceFace and HandsFace (bundled hand photos, mirrored second hand for 6–10).
*/
import { C } from '../../ui';
import { SUIT_COLOR, dicePositions, pipPositions } from './logic';
import type { Suit } from './logic';

/* ------------------------------------------------------------------ */
/* Suit symbols (SVG, drawn in a 100×100 box)                           */
/* ------------------------------------------------------------------ */

function SuitShape({ suit }: { suit: Suit }) {
  switch (suit) {
    case 'hearts':
      return <path d="M50 90 C44 83 6 60 6 33 C6 17 18 8 30 8 C40 8 47 14 50 23 C53 14 60 8 70 8 C82 8 94 17 94 33 C94 60 56 83 50 90 Z" />;
    case 'diamonds':
      return <path d="M50 3 L86 50 L50 97 L14 50 Z" />;
    case 'spades':
      return (
        <path d="M50 4 C56 14 94 38 94 60 C94 74 84 82 72 82 C63 82 57 78 53 71 C54 81 58 89 67 96 L33 96 C42 89 46 81 47 71 C43 78 37 82 28 82 C16 82 6 74 6 60 C6 38 44 14 50 4 Z" />
      );
    case 'clubs':
      return (
        <>
          <circle cx="50" cy="27" r="20" />
          <circle cx="26" cy="58" r="20" />
          <circle cx="74" cy="58" r="20" />
          <circle cx="50" cy="52" r="12" />
          <path d="M46 58 C46 78 40 89 32 96 L68 96 C60 89 54 78 54 58 Z" />
        </>
      );
  }
}

/** A suit symbol of `size` (viewBox units) centred on (cx, cy). */
function SuitIcon({ suit, cx, cy, size, opacity = 1, rotate = false }: {
  suit: Suit; cx: number; cy: number; size: number; opacity?: number; rotate?: boolean;
}) {
  const s = size / 100;
  return (
    <g
      transform={`translate(${cx} ${cy}) ${rotate ? 'rotate(180)' : ''} scale(${s}) translate(-50 -50)`}
      fill={SUIT_COLOR[suit]}
      opacity={opacity}
    >
      <SuitShape suit={suit} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Playing card                                                         */
/* ------------------------------------------------------------------ */

const CARD_W = 100;
const CARD_H = 100 / 0.7;
const INSET_X = CARD_W * 0.17;
const INSET_Y = CARD_H * 0.11;
const AREA_W = CARD_W - INSET_X * 2;
const AREA_H = CARD_H - INSET_Y * 2;
const PIP = CARD_W * 0.155;

function CardBody() {
  return (
    <rect x="1" y="1" width={CARD_W - 2} height={CARD_H - 2} rx={CARD_W * 0.08}
      fill="white" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
  );
}

const cardStyle = { filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.18))' };

/** Number card (rank 1–10) with its pips — no digit, the child must count. */
export function PlayingCardFace({ rank, suit, className }: { rank: number; suit: Suit; className?: string }) {
  return (
    <svg viewBox={`0 0 ${CARD_W} ${CARD_H}`} className={className} style={cardStyle} role="img" aria-label="Speelkaart">
      <CardBody />
      {pipPositions(rank).map(([x, y], i) => (
        <SuitIcon key={i} suit={suit} cx={INSET_X + x * AREA_W} cy={INSET_Y + y * AREA_H} size={PIP} />
      ))}
    </svg>
  );
}

export type PipState = { kind: 'uncounted' } | { kind: 'pending' } | { kind: 'counted'; n: number };

/** The card for "Speelkaarten tellen": tappable pips with their counting state. */
export function CountingCardFace({ rank, suit, states, onTap, className }: {
  rank: number; suit: Suit; states: PipState[]; onTap: (i: number) => void; className?: string;
}) {
  return (
    <svg viewBox={`0 0 ${CARD_W} ${CARD_H}`} className={className} style={{ ...cardStyle, touchAction: 'manipulation' }}>
      <CardBody />
      <SuitIcon suit={suit} cx={INSET_X * 0.62} cy={INSET_Y * 0.75} size={CARD_W * 0.085} />
      <SuitIcon suit={suit} cx={CARD_W - INSET_X * 0.62} cy={CARD_H - INSET_Y * 0.75} size={CARD_W * 0.085} rotate />
      {pipPositions(rank).map(([x, y], i) => {
        const cx = INSET_X + x * AREA_W, cy = INSET_Y + y * AREA_H;
        const st = states[i] ?? { kind: 'uncounted' };
        return (
          <g
            key={i}
            onClick={() => onTap(i)}
            style={{ cursor: st.kind === 'uncounted' ? 'pointer' : 'default' }}
            role="button"
            aria-label={st.kind === 'counted' ? `Geteld: ${st.n}` : 'Symbool'}
          >
            {/* generous tap target */}
            <rect x={cx - PIP * 0.85} y={cy - PIP * 0.85} width={PIP * 1.7} height={PIP * 1.7} fill="transparent" />
            {st.kind === 'counted' && (
              <>
                <circle cx={cx} cy={cy} r={PIP * 0.75} fill={C.success} opacity={0.18} />
                <SuitIcon suit={suit} cx={cx} cy={cy} size={PIP * 0.8} opacity={0.35} />
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                  fontSize={PIP * 0.9} fontWeight={800} fill={C.success} className="font-baloo">
                  {st.n}
                </text>
              </>
            )}
            {st.kind === 'pending' && (
              <>
                <circle cx={cx} cy={cy} r={PIP * 0.775} fill="none" stroke={C.gold} strokeWidth={1.2} />
                <SuitIcon suit={suit} cx={cx} cy={cy} size={PIP} />
              </>
            )}
            {st.kind === 'uncounted' && <SuitIcon suit={suit} cx={cx} cy={cy} size={PIP} />}
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Die                                                                  */
/* ------------------------------------------------------------------ */

export function DiceFace({ value, className }: { value: number; className?: string }) {
  const inset = 16;
  const area = 100 - inset * 2;
  const pip = value > 6 ? 12 : 16;
  return (
    <svg viewBox="0 0 100 100" className={className} style={cardStyle} role="img" aria-label="Dobbelsteen">
      <rect x="1" y="1" width="98" height="98" rx="16" fill="white" stroke={C.gold} strokeOpacity={0.45} strokeWidth="1" />
      {dicePositions(value).map(([x, y], i) => (
        <circle key={i} cx={inset + x * area} cy={inset + y * area} r={pip / 2} fill={C.text} />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Hands                                                                */
/* ------------------------------------------------------------------ */

const HAND_BASE = '/leerling-img/handen/';

/** One hand for 1–5; for 6–10 a full hand plus a mirrored hand for the rest. */
export function HandsFace({ value, className }: { value: number; className?: string }) {
  const hand = (fingers: number, mirrored = false) => (
    <img
      src={`${HAND_BASE}hand${fingers}.png`}
      alt=""
      draggable={false}
      className="h-full w-auto max-w-[50%] object-contain select-none"
      style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
    />
  );
  return (
    <div className={className} role="img" aria-label="Handen">
      <div className="h-full w-full flex items-center justify-center gap-2">
        {value <= 5 ? hand(Math.max(1, value)) : (<>{hand(5)}{hand(value - 5, true)}</>)}
      </div>
    </div>
  );
}
