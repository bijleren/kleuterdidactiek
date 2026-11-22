/*
  Shared building blocks for the student exercises: the exercise frame
  (top bar, counter, settings, stop → summary), the microphone panel, the
  celebration overlay and the number keypad. Colours follow the iOS theme
  (gold #946B29 on cream).
*/
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Check, Delete, Lightbulb, Mic, MicOff, Settings as SettingsIcon, Volume2, VolumeX, X,
} from 'lucide-react';
import { t } from './strings';
import type { ModeId } from './modes';
import { MODE_ICONS } from './modes';
import { useMic, useSpeechState } from './hooks';
import { useSettings, NIVEAUS } from './settings';
import type { LeerlingSettings } from './settings';
import { voice } from './lib/audio';
import { speech } from './lib/speech';

export const C = {
  gold: '#946B29',
  goldMid: '#B88742',
  goldLight: '#F7E2B4',
  cream: '#F7F6F3',
  text: '#1F2937',
  success: '#28A745',
  danger: '#DC3545',
};

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

/* ------------------------------------------------------------------ */
/* Exercise frame                                                       */
/* ------------------------------------------------------------------ */

export interface SummaryMetric { label: string; value: string | number }

export interface ExerciseShellProps {
  mode: ModeId;
  children: ReactNode;
  /** Number shown in the ✓ pill (omit for tools). */
  correct?: number;
  /** Metrics for the stop screen (defaults to "Juist: n"). */
  metrics?: SummaryMetric[];
  /** Items shown as chips on the stop screen (solved numbers…). */
  highlights?: string[];
  /** Hint button (e.g. "hear the number"). */
  onHint?: () => void;
  hintLabel?: string;
  /** Extra settings for this exercise inside the settings panel. */
  extraSettings?: ReactNode;
  /** Hide the niveau picker (tools that ignore it). */
  hideNiveau?: boolean;
  /** Show the "answer by voice" toggle in settings (touch exercises). */
  voiceAnswerToggle?: boolean;
  /** Optional bottom area (mic panel, keypad…). */
  footer?: ReactNode;
}

export function ExerciseShell(p: ExerciseShellProps) {
  const navigate = useNavigate();
  const { settings, update } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const started = useRef(Date.now());
  const Icon = MODE_ICONS[p.mode];

  const stop = () => {
    speech.stop();
    voice.stop();
    if (p.correct === undefined || p.correct === 0) navigate('/leerling/oefenen');
    else setShowSummary(true);
  };

  return (
    <div className="min-h-screen flex flex-col font-quicksand" style={{ background: C.cream, color: C.text }}>
      <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 bg-white/80 backdrop-blur border-b border-[#946B29]/15 sticky top-0 z-20">
        <button onClick={stop} className="kd-icon-btn" aria-label="Stoppen">
          <ArrowLeft size={22} />
        </button>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="hidden sm:flex w-10 h-10 rounded-xl items-center justify-center text-white shrink-0" style={{ background: C.gold }}>
            <Icon size={22} />
          </span>
          <div className="min-w-0">
            <div className="font-baloo font-bold text-lg sm:text-xl leading-tight truncate">{t(`exercise.${p.mode}`)}</div>
            <div className="text-xs sm:text-sm opacity-60 truncate">{t(`exercise.${p.mode}.subtitle`)}</div>
          </div>
        </div>
        {p.correct !== undefined && (
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-full font-baloo font-bold text-lg text-white" style={{ background: C.success }} aria-label="Juist">
            <Check size={18} strokeWidth={3} /> {p.correct}
          </span>
        )}
        {p.onHint && (
          <button onClick={p.onHint} className="kd-icon-btn" aria-label={p.hintLabel ?? 'Hint'} title={p.hintLabel ?? 'Hint'}>
            <Lightbulb size={22} />
          </button>
        )}
        <button
          onClick={() => update({ sound: !settings.sound })}
          className="kd-icon-btn"
          aria-label={settings.sound ? 'Geluid uit' : 'Geluid aan'}
        >
          {settings.sound ? <Volume2 size={22} /> : <VolumeX size={22} />}
        </button>
        <button onClick={() => setShowSettings(true)} className="kd-icon-btn" aria-label="Instellingen">
          <SettingsIcon size={22} />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-3 sm:px-6 py-4 relative">
        {p.children}
      </main>

      {p.footer && <footer className="px-3 sm:px-6 pb-4">{p.footer}</footer>}

      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          hideNiveau={p.hideNiveau}
          voiceAnswerToggle={p.voiceAnswerToggle}
          extra={p.extraSettings}
        />
      )}
      {showSummary && (
        <SummarySheet
          mode={p.mode}
          seconds={Math.round((Date.now() - started.current) / 1000)}
          metrics={p.metrics ?? [{ label: 'Juist', value: p.correct ?? 0 }]}
          highlights={p.highlights}
          onContinue={() => setShowSummary(false)}
          onStop={() => navigate('/leerling/oefenen')}
        />
      )}
    </div>
  );
}

function SummarySheet(p: {
  mode: ModeId; seconds: number; metrics: SummaryMetric[]; highlights?: string[];
  onContinue: () => void; onStop: () => void;
}) {
  const m = Math.floor(p.seconds / 60), s = p.seconds % 60;
  return (
    <Overlay onClose={p.onContinue}>
      <div className="text-center">
        <div className="text-5xl mb-2">🎉</div>
        <h2 className="font-baloo font-bold text-3xl" style={{ color: C.gold }}>Knap gedaan!</h2>
        <p className="opacity-70">{t(`exercise.${p.mode}`)} · {m > 0 ? `${m} min ` : ''}{s} s</p>
        <div className="flex flex-wrap justify-center gap-3 my-5">
          {p.metrics.map((x) => (
            <div key={x.label} className="rounded-2xl px-5 py-3 bg-white border border-[#946B29]/20">
              <div className="font-baloo font-bold text-3xl">{x.value}</div>
              <div className="text-sm opacity-70">{x.label}</div>
            </div>
          ))}
        </div>
        {!!p.highlights?.length && (
          <div className="flex flex-wrap justify-center gap-2 mb-5">
            {p.highlights.map((h, i) => (
              <span key={i} className="px-3 py-1 rounded-full font-baloo font-bold" style={{ background: C.goldLight, color: C.gold }}>{h}</span>
            ))}
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <button className="kd-btn-secondary" onClick={p.onContinue}>Verder oefenen</button>
          <button className="kd-btn" onClick={p.onStop}>Stoppen</button>
        </div>
      </div>
    </Overlay>
  );
}

export function Overlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="relative bg-[#F7F6F3] rounded-3xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="absolute top-3 right-3 kd-icon-btn" onClick={onClose} aria-label="Sluiten"><X size={20} /></button>
        {children}
      </div>
    </div>
  );
}

function SettingsPanel(p: { onClose: () => void; hideNiveau?: boolean; voiceAnswerToggle?: boolean; extra?: ReactNode }) {
  const { settings, update } = useSettings();
  return (
    <Overlay onClose={p.onClose}>
      <h2 className="font-baloo font-bold text-2xl mb-4" style={{ color: C.gold }}>Instellingen</h2>
      {!p.hideNiveau && (
        <div className="mb-5">
          <div className="font-semibold mb-2">Getallen tot</div>
          <div className="flex flex-wrap gap-2">
            {NIVEAUS.map((n) => (
              <Pill key={n} active={settings.maxNumber === n} onClick={() => update({ maxNumber: n })}>{n}</Pill>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Toggle label="Instructies voorlezen" value={settings.spokenInstructions} onChange={(v) => update({ spokenInstructions: v })} />
        <Toggle label="Geluid" value={settings.sound} onChange={(v) => update({ sound: v })} />
        {!p.hideNiveau && <Toggle label="Ook 0 gebruiken" value={settings.allowZero} onChange={(v) => update({ allowZero: v })} />}
        {p.voiceAnswerToggle && (
          <Toggle label="Ook antwoorden met je stem" value={settings.voiceAnswers} onChange={(v) => update({ voiceAnswers: v })} />
        )}
      </div>
      {p.extra && <div className="mt-5 pt-4 border-t border-[#946B29]/15 space-y-2">{p.extra}</div>}
    </Overlay>
  );
}

export function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cx('min-w-[3rem] px-3 py-1.5 rounded-full font-baloo font-bold text-lg border-2 transition')}
      style={active
        ? { background: C.gold, color: 'white', borderColor: C.gold }
        : { background: 'white', color: C.gold, borderColor: C.gold + '40' }}
    >
      {children}
    </button>
  );
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 py-1.5 cursor-pointer select-none">
      <span>{label}</span>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className="w-12 h-7 rounded-full relative transition shrink-0"
        style={{ background: value ? C.success : '#d1d5db' }}
      >
        <span className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all" style={{ left: value ? 22 : 2 }} />
      </button>
    </label>
  );
}

/** Settings for the camera / mic / keypad / draw answer modes. */
export function AnswerModeSettings({ which }: { which: 'playingCard' | 'dobbelsteen' | 'handen' }) {
  const { settings, update } = useSettings();
  const m = settings[which];
  const set = (patch: Partial<LeerlingSettings['playingCard']>) => {
    const next = { ...m, ...patch };
    if (!next.mic && !next.keypad && !next.camera && !next.draw) next.keypad = true;
    update({ [which]: next } as Partial<LeerlingSettings>);
  };
  return (
    <>
      <div className="font-semibold">Antwoorden met</div>
      <Toggle label="Microfoon (zeg het)" value={m.mic} onChange={(v) => set({ mic: v })} />
      <Toggle label="Cijfertoetsen" value={m.keypad} onChange={(v) => set({ keypad: v })} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Microphone                                                           */
/* ------------------------------------------------------------------ */

/**
 * The mic status strip under a voice exercise: asks for permission, shows
 * "Ik luister…" with the live transcript, or explains why speech does not
 * work (other browser, mic blocked).
 */
export function MicPanel({ hint }: { hint?: string }) {
  const mic = useMic();
  const st = useSpeechState();

  if (!mic.supported) {
    return (
      <div className="kd-mic-panel" style={{ borderColor: C.danger + '55' }}>
        <MicOff size={22} style={{ color: C.danger }} />
        <span>Spraakherkenning werkt in <b>Chrome</b> of <b>Edge</b>. Open deze pagina in een van die browsers.</span>
      </div>
    );
  }
  if (mic.permission === 'denied' || st.error === 'denied') {
    return (
      <div className="kd-mic-panel" style={{ borderColor: C.danger + '55' }}>
        <MicOff size={22} style={{ color: C.danger }} />
        <span>De microfoon staat uit. Klik op het slotje naast het webadres en zet <b>Microfoon</b> op Toestaan.</span>
      </div>
    );
  }
  if (st.error === 'nomic') {
    return (
      <div className="kd-mic-panel" style={{ borderColor: C.danger + '55' }}>
        <MicOff size={22} style={{ color: C.danger }} />
        <span>Er is geen microfoon gevonden. Sluit er een aan en probeer opnieuw.</span>
      </div>
    );
  }
  if (mic.permission !== 'granted') {
    return (
      <div className="kd-mic-panel">
        <Mic size={22} style={{ color: C.gold }} />
        <span className="flex-1">Deze oefening luistert naar je stem.</span>
        <button className="kd-btn" onClick={() => void mic.request()}>Microfoon aanzetten</button>
      </div>
    );
  }
  return (
    <div className="kd-mic-panel" aria-live="polite">
      <span className={cx('kd-mic-dot', st.capturing && 'kd-mic-dot-on')}>
        <Mic size={20} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm opacity-60">
          {st.error === 'network' ? 'Geen verbinding met de spraakherkenning…'
            : st.capturing ? 'Ik luister…' : st.active ? 'Even wachten…' : hint ?? ''}
        </div>
        <div className="font-baloo text-xl truncate min-h-[1.75rem]">
          {st.transcript ? `“${st.transcript}”` : ''}
          {st.nearMatch && <span className="ml-2 text-base font-bold" style={{ color: C.goldMid }}>{t('exercise.almost')}</span>}
        </div>
      </div>
    </div>
  );
}

/** Small round mic badge for touch exercises with optional voice answers. */
export function VoiceToggleButton() {
  const { settings, update } = useSettings();
  const st = useSpeechState();
  const on = settings.voiceAnswers;
  return (
    <button
      onClick={() => {
        if (!on) void speech.requestPermission();
        update({ voiceAnswers: !on });
      }}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center z-10"
      style={{ color: on ? C.gold : '#9ca3af', outline: on && st.capturing ? `3px solid ${C.gold}99` : undefined }}
      aria-label={on ? 'Stem uitzetten' : 'Antwoorden met je stem'}
      title={on ? 'Stem uitzetten' : 'Antwoorden met je stem'}
    >
      {on ? <Mic size={24} /> : <MicOff size={24} />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Feedback                                                             */
/* ------------------------------------------------------------------ */

/** Green "Goed zo!" flash over the exercise area. */
export function Celebrate({ show, text = 'Goed zo!' }: { show: boolean; text?: string }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
      <div className="kd-pop rounded-3xl px-8 py-5 text-white font-baloo font-bold text-4xl shadow-xl flex items-center gap-3" style={{ background: C.success }}>
        <Check size={40} strokeWidth={3} /> {text}
      </div>
    </div>
  );
}

/** Shake an element briefly on a wrong answer: add className when `on`. */
export function useShake(): [boolean, () => void] {
  const [on, setOn] = useState(false);
  const fire = () => {
    setOn(false);
    requestAnimationFrame(() => setOn(true));
    setTimeout(() => setOn(false), 500);
  };
  return [on, fire];
}

/** Big number card ("Zeg dit getal"). */
export function NumberCard({ value, state = 'idle', size = 'xl' }: { value: string | number; state?: 'idle' | 'correct' | 'wrong'; size?: 'lg' | 'xl' }) {
  return (
    <div
      className={cx('rounded-[2rem] bg-white shadow-lg flex items-center justify-center font-baloo font-bold border-4 transition',
        size === 'xl' ? 'w-56 h-56 sm:w-72 sm:h-72 text-[7rem] sm:text-[9rem]' : 'w-40 h-40 text-7xl',
        state === 'wrong' && 'kd-shake')}
      style={{
        borderColor: state === 'correct' ? C.success : C.gold + '33',
        color: state === 'correct' ? C.success : C.text,
      }}
    >
      {value}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Keypad                                                               */
/* ------------------------------------------------------------------ */

/**
 * Number keypad. Calls onSubmit(value) on OK (or automatically when the
 * typed value has as many digits as `autoLength`). Physical keyboard works too.
 */
export function Keypad({ onSubmit, autoLength, disabled }: { onSubmit: (n: number) => void; autoLength?: number; disabled?: boolean }) {
  const [val, setVal] = useState('');
  const valRef = useRef(val);
  valRef.current = val;

  const press = (k: string) => {
    if (disabled) return;
    if (k === 'del') { setVal((v) => v.slice(0, -1)); return; }
    if (k === 'ok') {
      if (valRef.current) { onSubmit(parseInt(valRef.current, 10)); setVal(''); }
      return;
    }
    const next = (valRef.current + k).slice(0, 4);
    if (autoLength && next.length >= autoLength) {
      onSubmit(parseInt(next, 10));
      setVal('');
    } else setVal(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('del');
      else if (e.key === 'Enter') press('ok');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, autoLength, onSubmit]);

  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="h-14 mb-2 rounded-2xl bg-white border-2 border-[#946B29]/20 flex items-center justify-center font-baloo font-bold text-4xl">
        {val || <span className="opacity-25">?</span>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].map((k) => (
          <button
            key={k}
            disabled={disabled}
            onClick={() => press(k)}
            className="h-14 rounded-2xl font-baloo font-bold text-2xl shadow-sm active:scale-95 transition flex items-center justify-center disabled:opacity-40"
            style={k === 'ok'
              ? { background: C.success, color: 'white' }
              : k === 'del' ? { background: C.goldLight, color: C.gold } : { background: 'white', color: C.text }}
            aria-label={k === 'del' ? 'Wissen' : k === 'ok' ? 'OK' : k}
          >
            {k === 'del' ? <Delete size={24} /> : k === 'ok' ? <Check size={26} strokeWidth={3} /> : k}
          </button>
        ))}
      </div>
    </div>
  );
}
