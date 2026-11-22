/*
  Shared bits for the "rangorde" batch (Rangorde zeggen / aantikken, Positie,
  Telrij, Rangtelwoorden, Sorteer op grootte): the block row, the
  "Blokken − n +" stepper, the "Sla over" button and the footer row.
  Non-component helpers live in ./logic.ts.
*/
import type { CSSProperties, ReactNode } from 'react';
import { Minus, Plus, SkipForward } from 'lucide-react';
import { C, cx } from '../../ui';
import { useSettings } from '../../settings';
import { t } from '../../strings';
import { rangordeMaxBlocks } from './logic';

/* ------------------------------------------------------------------ */
/* Block count (settings.rangordeMax)                                   */
/* ------------------------------------------------------------------ */

/** The "Blokken  −  5  +" capsule (iOS blockCountStepper). */
export function BlockCountStepper({ inline }: { inline?: boolean }) {
  const { settings, update } = useSettings();
  const n = rangordeMaxBlocks(settings);
  const set = (v: number) => update({ rangordeMax: Math.min(10, Math.max(2, v)) });
  const btn = (enabled: boolean, onClick: () => void, icon: ReactNode, label: string) => (
    <button
      onClick={onClick}
      disabled={!enabled}
      aria-label={label}
      className="w-9 h-9 rounded-full bg-white flex items-center justify-center border transition active:scale-95"
      style={{ color: enabled ? C.gold : C.text + '40', borderColor: C.gold + '4d' }}
    >
      {icon}
    </button>
  );
  return (
    <div
      className={cx('inline-flex items-center gap-3 rounded-full border', inline ? '' : 'px-4 py-2 bg-white/60')}
      style={{ borderColor: inline ? 'transparent' : C.gold + '40' }}
    >
      <span className="text-sm font-semibold opacity-60">{t('rangorde.blocks')}</span>
      {btn(n > 2, () => set(n - 1), <Minus size={16} strokeWidth={3} />, 'Minder blokken')}
      <span className="font-baloo font-bold text-xl min-w-[1.6rem] text-center">{n}</span>
      {btn(n < 10, () => set(n + 1), <Plus size={16} strokeWidth={3} />, 'Meer blokken')}
    </div>
  );
}

/** extraSettings content for the two rangorde exercises. */
export function BlockCountSetting() {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>Aantal blokken (max.)</span>
      <BlockCountStepper inline />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Block row                                                            */
/* ------------------------------------------------------------------ */

export interface BlockSpec {
  background: string;
  border: string;
  borderWidth: number;
  content?: ReactNode;
  scale?: number;
  strong?: boolean;
  shake?: boolean;
  caption?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
}

/**
 * A row of square blocks that share the width (iOS: size = min(cap, max(min,
 * width/n))). `cap`/`min` in px.
 */
export function BlockRow({ blocks, cap = 96, min = 36, gap = 12, captions }: {
  blocks: BlockSpec[]; cap?: number; min?: number; gap?: number; captions?: boolean;
}) {
  const n = blocks.length;
  return (
    <div className="w-full flex justify-center items-start" style={{ gap }}>
      {blocks.map((b, i) => {
        const style: CSSProperties = {
          background: b.background,
          border: `${b.borderWidth}px solid ${b.border}`,
          transform: `scale(${b.scale ?? 1})`,
          boxShadow: b.strong ? '0 3px 10px rgba(0,0,0,.18)' : '0 2px 4px rgba(0,0,0,.06)',
          containerType: 'inline-size',
        };
        const inner = (
          <div
            className={cx('w-full aspect-square rounded-[14px] flex items-center justify-center font-baloo font-bold text-white transition-all duration-300', b.shake && 'kd-shake')}
            style={style}
          >
            {b.content}
          </div>
        );
        return (
          <div
            key={i}
            className="flex flex-col items-center gap-1.5"
            style={{ flex: `0 1 ${cap}px`, minWidth: min, maxWidth: `calc((100% - ${gap * (n - 1)}px) / ${n})` }}
          >
            {b.onClick ? (
              <button className="w-full" onClick={b.onClick} disabled={b.disabled} aria-label={b.label}>{inner}</button>
            ) : inner}
            {captions && <div className="h-4 text-xs font-bold leading-4">{b.caption ?? ' '}</div>}
          </div>
        );
      })}
    </div>
  );
}

/** Text inside a block, scaled to the block size (container query units). */
export function BlockLabel({ children, size = 42, color = 'white' }: { children: ReactNode; size?: number; color?: string }) {
  return <span style={{ fontSize: `${size}cqw`, color, lineHeight: 1 }}>{children}</span>;
}

/* ------------------------------------------------------------------ */
/* Buttons / flow                                                       */
/* ------------------------------------------------------------------ */

/** iOS SkipPillLabel ("Sla over"). */
export function SkipButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-baloo font-bold text-white active:scale-95 transition"
      style={{ background: C.text + '8c' }}
    >
      {t('exercise.skip')} <SkipForward size={16} />
    </button>
  );
}

/** Footer row: mic panel (or anything) + skip button. */
export function FooterRow({ children, onSkip }: { children?: ReactNode; onSkip: () => void }) {
  return (
    <div className="flex items-center gap-2 max-w-[44rem] mx-auto">
      <div className="flex-1 min-w-0">{children}</div>
      <SkipButton onClick={onSkip} />
    </div>
  );
}

