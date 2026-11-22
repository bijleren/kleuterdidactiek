/*
  "Tijd meten" — port of iOS TijdMetenView/ViewModel.
  A countdown time tool with three visualisations: hourglass (zandloper),
  digital timer and a Time-Timer disc. Presets 10/30/60 s plus a −/+ stepper
  (5 s steps, 5 s – 10 min), start/pause and reset. A tool, not scored
  (iOS logs only tijdmeten_style / tijdmeten_start, no progress).
  Web difference: a short "good" blip replaces the iOS success haptic at 0.
*/
import { useEffect, useId, useRef, useState } from 'react';
import { Hash, Hourglass as HourglassIcon, Minus, Pause, Play, Plus, RotateCcw, Timer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { C, ExerciseShell, cx } from '../ui';
import { useStopOnUnmount } from '../hooks';
import { blip } from '../lib/audio';
import { t } from '../strings';

type Style = 'zandloper' | 'timer' | 'timetimer';
const PRESETS = [10, 30, 60];
const STYLES: { id: Style; icon: LucideIcon }[] = [
  { id: 'zandloper', icon: HourglassIcon },
  { id: 'timer', icon: Hash },
  { id: 'timetimer', icon: Timer },
];
const TIMER_RED = 'rgb(217, 56, 56)';

export default function TijdMeten() {
  useStopOnUnmount();
  const [style, setStyle] = useState<Style>('timetimer');
  const [duration, setDurationState] = useState(30);
  const [remaining, setRemaining] = useState(30);
  const [running, setRunning] = useState(false);
  const endAt = useRef<number | null>(null);

  const progress = duration > 0 ? Math.max(0, Math.min(1, remaining / duration)) : 0;
  const finished = remaining <= 0;
  const secondsText = String(Math.ceil(Math.max(0, remaining)));

  // Tick loop (50 ms like iOS) while running.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (endAt.current === null) return;
      const r = (endAt.current - Date.now()) / 1000;
      if (r <= 0) {
        setRemaining(0);
        setRunning(false);
        endAt.current = null;
        blip('good');
      } else setRemaining(r);
    }, 50);
    return () => clearInterval(id);
  }, [running]);

  const reset = (d = duration) => {
    setRunning(false);
    endAt.current = null;
    setRemaining(d);
  };
  const setDuration = (d: number) => {
    setDurationState(d);
    reset(d);
  };
  const start = () => {
    const r = remaining <= 0 ? duration : remaining;
    setRemaining(r);
    endAt.current = Date.now() + r * 1000;
    setRunning(true);
  };
  const pause = () => {
    setRunning(false);
    if (endAt.current !== null) setRemaining(Math.max(0, (endAt.current - Date.now()) / 1000));
  };
  const toggle = () => (running ? pause() : start());

  return (
    <ExerciseShell mode="tijdMeten" hideNiveau>
      <div className="w-full max-w-3xl flex flex-col items-center gap-4">
        {/* Style selector */}
        <div className="flex gap-1 p-1 rounded-full bg-white/60 border border-[#946B29]/25">
          {STYLES.map(({ id, icon: Icon }) => {
            const active = style === id;
            return (
              <button
                key={id}
                onClick={() => setStyle(id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full font-baloo font-bold text-base transition"
                style={active
                  ? { background: `linear-gradient(180deg, ${C.goldMid}, ${C.gold})`, color: 'white' }
                  : { color: C.text + '99' }}
              >
                <Icon size={16} strokeWidth={2.6} /> {t(`tijdMeten.${id}`)}
              </button>
            );
          })}
        </div>

        {/* Visual */}
        <div className="w-full h-[44vh] min-h-[240px] flex items-center justify-center">
          {style === 'timer' && (
            <div className="w-full h-full bg-white rounded-[2rem] shadow-md flex flex-col items-center justify-center">
              <div
                className="font-baloo font-bold leading-none tabular-nums text-[8rem] sm:text-[11rem]"
                style={{ color: finished ? C.success : C.text }}
              >
                {secondsText}
              </div>
              <div className="font-semibold text-lg" style={{ color: C.text + '80' }}>
                {t(finished ? 'tijdMeten.done' : 'tijdMeten.seconds')}
              </div>
            </div>
          )}
          {style === 'timetimer' && <TimeTimerDisc progress={progress} finished={finished} label={secondsText} />}
          {style === 'zandloper' && (
            <div className="h-full flex flex-col items-center gap-2">
              <Hourglass progress={progress} />
              <div className="font-baloo font-bold text-2xl" style={{ color: finished ? C.success : C.text + 'b3' }}>
                {finished ? t('tijdMeten.done') : `${secondsText} s`}
              </div>
            </div>
          )}
        </div>

        {/* Duration presets + stepper */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {PRESETS.map((d) => {
            const active = duration === d;
            return (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className="px-5 py-2 rounded-full font-baloo font-bold border border-[#946B29]/25"
                style={active
                  ? { background: `linear-gradient(180deg, ${C.goldMid}, ${C.gold})`, color: 'white' }
                  : { background: 'rgba(255,255,255,.6)', color: C.text + '99' }}
              >
                {d}s
              </button>
            );
          })}
          <div className="flex items-center rounded-full bg-white/60 border border-[#946B29]/25">
            <button
              onClick={() => setDuration(Math.max(5, duration - 5))}
              className="w-10 h-10 flex items-center justify-center"
              style={{ color: C.gold }}
              aria-label={t('tijdMeten.less')}
              title={t('tijdMeten.less')}
            >
              <Minus size={18} strokeWidth={3} />
            </button>
            <span className="min-w-[3.2rem] text-center font-baloo font-bold tabular-nums">{duration}s</span>
            <button
              onClick={() => setDuration(Math.min(600, duration + 5))}
              className="w-10 h-10 flex items-center justify-center"
              style={{ color: C.gold }}
              aria-label={t('tijdMeten.more')}
              title={t('tijdMeten.more')}
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="w-full max-w-md flex items-center gap-3">
          <button
            onClick={toggle}
            className="flex-1 h-14 rounded-full font-baloo font-bold text-xl text-white flex items-center justify-center gap-2 active:scale-[.98] transition"
            style={{ background: `linear-gradient(180deg, ${C.goldMid}, ${C.gold})` }}
          >
            {running ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" />}
            {t(running ? 'tijdMeten.pause' : 'tijdMeten.start')}
          </button>
          <button
            onClick={() => reset()}
            className={cx('w-14 h-14 rounded-full bg-white flex items-center justify-center border border-[#946B29]/30')}
            style={{ color: C.gold }}
            aria-label="Opnieuw"
            title="Opnieuw"
          >
            <RotateCcw size={22} strokeWidth={2.6} />
          </button>
        </div>
      </div>
    </ExerciseShell>
  );
}

/** Time-Timer: a red wedge from 12 o'clock, clockwise, sized by `progress`. */
function TimeTimerDisc({ progress, finished, label }: { progress: number; finished: boolean; label: string }) {
  const r = 46;
  const a = -Math.PI / 2 + 2 * Math.PI * progress;
  const x = 50 + r * Math.cos(a), y = 50 + r * Math.sin(a);
  const large = progress > 0.5 ? 1 : 0;
  const fill = finished ? C.success : TIMER_RED;
  return (
    <svg viewBox="0 0 100 100" className="h-full max-w-full aspect-square">
      <circle cx="50" cy="50" r="48" fill="white" stroke={C.text + '26'} strokeWidth="2" />
      {progress >= 0.9999 ? (
        <circle cx="50" cy="50" r={r} fill={fill} />
      ) : progress > 0.0001 ? (
        <path d={`M50 50 L50 ${50 - r} A${r} ${r} 0 ${large} 1 ${x} ${y} Z`} fill={fill} />
      ) : null}
      <circle cx="50" cy="50" r="24" fill="white" />
      <text
        x="50" y="50" textAnchor="middle" dominantBaseline="central"
        fontFamily='"Baloo 2", cursive' fontWeight="800" fontSize="20" fill={C.text}
      >
        {label}
      </text>
    </svg>
  );
}

/** Hourglass: top sand shrinks and bottom sand grows as `progress` goes 1 → 0. */
function Hourglass({ progress }: { progress: number }) {
  const w = 66, h = 100, pad = h * 0.05, cx = w / 2, cy = h / 2;
  const lw = 2.2;
  const top = `M${pad} ${pad} L${w - pad} ${pad} L${cx} ${cy} Z`;
  const bot = `M${cx} ${cy} L${pad} ${h - pad} L${w - pad} ${h - pad} Z`;
  const topH = cy - pad, botH = h - pad - cy, f = 1 - progress;
  const id = 'hg' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="flex-1 min-h-0 max-h-full" style={{ aspectRatio: '0.66' }}>
      <defs>
        <clipPath id={`${id}t`}><path d={top} /></clipPath>
        <clipPath id={`${id}b`}><path d={bot} /></clipPath>
      </defs>
      <rect x="0" y={cy - progress * topH} width={w} height={progress * topH} fill={C.gold} clipPath={`url(#${id}t)`} />
      <g clipPath={`url(#${id}b)`}>
        <rect x="0" y={h - pad - f * botH} width={w} height={f * botH} fill={C.gold} />
        {progress > 0.001 && progress < 0.999 && (
          <line x1={cx} y1={cy} x2={cx} y2={h - pad - f * botH} stroke={C.gold} strokeWidth={lw} />
        )}
      </g>
      <path d={top} fill="none" stroke={C.text + '99'} strokeWidth={lw} strokeLinejoin="round" />
      <path d={bot} fill="none" stroke={C.text + '99'} strokeWidth={lw} strokeLinejoin="round" />
    </svg>
  );
}
