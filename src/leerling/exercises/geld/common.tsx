/*
  Shared helpers for the "geld" batch (prijzen, kenJeGeld, geefNeem,
  verwoorden, gelijkMaken, groepjes, keerNemen):

  * CoinView / EuroPile — port of the iOS KleuterComponents money images.
  * GoldToken — the iOS goldGradient token / block.
  * SkipButton — the iOS "Sla over" pill.
  * DragGhost — the token that follows the pointer (see drag.ts).
  Non-component helpers live in flow.ts and drag.ts.
*/
import type { CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { DragState } from './drag';
import { SkipForward } from 'lucide-react';
import { C } from '../../ui';
import { t } from '../../strings';

/* ------------------------------------------------------------------ */
/* Money images                                                         */
/* ------------------------------------------------------------------ */

const IMG_BASE = '/leerling-img/euro/';

/** A euro coin/note (or cent coin) from the real image; notes keep their wide aspect. */
export function CoinView({ value, size = 60, cent = false, style }: {
  value: number; size?: number; cent?: boolean; style?: CSSProperties;
}) {
  return (
    <img
      src={`${IMG_BASE}${value}${cent ? 'Cent' : 'Euro'}.png`}
      alt={cent ? `${value} cent` : `${value} euro`}
      draggable={false}
      className="select-none"
      style={{
        width: size, height: size, objectFit: 'contain',
        filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))', ...style,
      }}
    />
  );
}

/** `count` €1 coins in rows of five (vijfstructuur), like iOS EuroPile. */
export function EuroPile({ count, coinSize = 56, gap = 8 }: { count: number; coinSize?: number; gap?: number }) {
  const rows: number[] = [];
  for (let i = 0; i < count; i += 5) rows.push(Math.min(5, count - i));
  return (
    <div className="flex flex-col items-center" style={{ gap }}>
      {rows.map((n, r) => (
        <div key={r} className="flex" style={{ gap }}>
          {Array.from({ length: n }, (_, i) => <CoinView key={i} value={1} size={coinSize} />)}
        </div>
      ))}
    </div>
  );
}

/** Gold token (iOS Theme.goldGradient circle / rounded square). */
export function GoldToken({ size, square = false, style }: { size: number; square?: boolean; style?: CSSProperties }) {
  return (
    <div
      className="select-none"
      style={{
        width: size, height: size,
        borderRadius: square ? 8 : '9999px',
        background: `linear-gradient(135deg, ${C.gold}, ${C.goldMid})`,
        border: '1.5px solid rgba(255,255,255,0.5)',
        boxShadow: '0 2px 3px rgba(0,0,0,0.15)',
        ...style,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* UI bits                                                              */
/* ------------------------------------------------------------------ */

export function SkipButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-baloo font-bold text-white disabled:opacity-40 active:scale-95 transition"
      style={{ background: 'rgba(31,41,55,0.55)' }}
    >
      {t('exercise.skip')} <SkipForward size={16} />
    </button>
  );
}

/** The token that follows the pointer while dragging (portalled to <body>). */
export function DragGhost<Z>({ drag, children }: { drag: DragState<Z> | null; children: ReactNode }) {
  if (!drag) return null;
  return createPortal(
    <div
      style={{
        position: 'fixed', left: drag.x, top: drag.y, transform: 'translate(-50%, -50%) scale(1.08)',
        pointerEvents: 'none', zIndex: 60, filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.25))',
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
