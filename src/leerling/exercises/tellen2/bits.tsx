/*
  Small UI pieces shared by the "tellen2" batch: the skip pill, the green
  check seal shown on a solved item, and the gold segmented capsule
  (Omhoog/Omlaag, tot 10/tot 20) the iOS views put above the exercise.
*/
import type { ReactNode } from 'react';
import { BadgeCheck, FastForward, RotateCw } from 'lucide-react';
import { C, cx } from '../../ui';
import { t } from '../../strings';

/** iOS SkipPillLabel ("Overslaan"), grey pill. */
export function SkipButton({ onClick, restart = false, className }: { onClick: () => void; restart?: boolean; className?: string }) {
  const Icon = restart ? RotateCw : FastForward;
  return (
    <button
      onClick={onClick}
      className={cx('flex items-center justify-center gap-2 px-4 h-12 rounded-xl font-baloo font-bold text-base text-white shrink-0 active:scale-95 transition', className)}
      style={{ background: 'rgba(31,41,55,0.55)' }}
    >
      <Icon size={18} /> {t('common.skip')}
    </button>
  );
}

/** checkmark.seal.fill in the top-right corner of a solved item. */
export function SolvedSeal({ show, size = 52 }: { show: boolean; size?: number }) {
  if (!show) return null;
  return (
    <span className="absolute -top-3 -right-3 rounded-full bg-white kd-pop flex z-10">
      <BadgeCheck size={size} style={{ color: C.success }} strokeWidth={2.5} />
    </span>
  );
}

/** Two-option gold capsule (direction / ruler length). */
export function Segmented<T extends string | number>({ value, options, onChange }: {
  value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex gap-2 p-1 rounded-full bg-white/60 border border-[#946B29]/25">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full font-baloo font-bold text-sm transition"
            style={active
              ? { background: `linear-gradient(180deg, ${C.goldMid}, ${C.gold})`, color: 'white' }
              : { color: C.text + '99' }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
