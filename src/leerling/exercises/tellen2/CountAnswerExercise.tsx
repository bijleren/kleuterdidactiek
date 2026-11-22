/*
  The shared "how many?" exercise behind Speelkaarten, Dobbelsteen and
  Handen — a port of the three near-identical iOS view models
  (PlayingCardViewModel / DobbelsteenViewModel / HandenViewModel).

  An item (card / die face / hands) is shown on one side; on the other the
  child answers with the inputs switched on: microphone (say it) and/or an
  on-screen keypad (type it, "Klaar" to check). Whichever input first gives
  the right number wins. On success the number is read back, "goed gedaan"
  every 5th time, then the next item after 1 s.

  Web differences: the iOS camera ("Tonen") and drawing ("Tekenen") inputs
  are not available here; only "Zeggen" and "Typen" are offered.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Delete, Check, Keyboard, Mic } from 'lucide-react';
import { AnswerModeSettings, C, ExerciseShell, MicPanel, cx, useShake } from '../../ui';
import { useExerciseTracker, useListen, useMic, useStopOnUnmount, useTimer } from '../../hooks';
import { useSettings } from '../../settings';
import type { LeerlingSettings } from '../../settings';
import { voice } from '../../lib/audio';
import { speech } from '../../lib/speech';
import { saysNumber } from '../../lib/dutch';
import { t } from '../../strings';
import { capToNiveau, pickNext } from './logic';
import { SkipButton, SolvedSeal } from './bits';

type Which = 'playingCard' | 'dobbelsteen' | 'handen';

export interface CountAnswerConfig<X> {
  mode: Which;
  /** iOS analytics prefix (`<prefix>_shown` / `<prefix>_correct`). */
  prefix: string;
  /** Highest value before the niveau cap (10 for cards/hands, 6 for the die). */
  maxValue: number;
  promptKey: string;
  /** How many digits may be typed (1 for the die, 2 otherwise). */
  maxTyped: number;
  /** Extra per-item data (e.g. the card suit). Must be a stable function. */
  makeExtra: () => X;
  /** Label for the stop-screen chips ("3 ♥"). */
  label: (value: number, extra: X) => string;
  /** The item to count. */
  renderFace: (value: number, extra: X) => ReactNode;
}

interface Item<X> { id: number; value: number; extra: X }

export function CountAnswerExercise<X>(cfg: CountAnswerConfig<X>) {
  useStopOnUnmount();
  const { settings, update } = useSettings();
  const mic = useMic();
  const tracker = useExerciseTracker(cfg.prefix);
  const later = useTimer();
  const inputs = settings[cfg.mode];
  const max = capToNiveau(cfg.maxValue, settings.maxNumber);
  const { makeExtra } = cfg;

  const [item, setItem] = useState<Item<X> | null>(null);
  const [solved, setSolved] = useState(false);
  const [typed, setTyped] = useState('');
  const [wrongTyped, setWrongTyped] = useState(false);
  const [shake, fireShake] = useShake();
  const solvedRef = useRef(false);
  const token = useRef(0);
  const prompted = useRef(false);

  const next = useCallback(() => {
    token.current++;
    solvedRef.current = false;
    setItem((prev) => ({ id: (prev?.id ?? 0) + 1, value: pickNext(max, prev?.value), extra: makeExtra() }));
    setSolved(false);
    setTyped('');
    setWrongTyped(false);
  }, [max, makeExtra]);

  // First item, and a fresh one when the niveau changes.
  useEffect(() => { next(); }, [next]);

  useEffect(() => {
    if (!item) return;
    tracker.shown();
    if (!prompted.current) {
      // iOS playPromptOnce: the instruction is spoken for the first item only.
      prompted.current = true;
      void voice.playInstruction(t(cfg.promptKey), settings.spokenInstructions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  const registerCorrect = () => {
    if (!item || solvedRef.current) return;
    solvedRef.current = true;
    setSolved(true);
    const tok = ++token.current;
    const it = item;
    void (async () => {
      // Read the number back fully, then count it (the tracker says
      // "goed gedaan" every 5th success) and move on after 1 s.
      await voice.playNumber(it.value);
      if (tok !== token.current) return;
      tracker.markCorrect(cfg.label(it.value, it.extra));
      await voice.waitUntilQuiet();
      if (tok !== token.current) return;
      later(next, 1000);
    })();
  };

  // Microphone input.
  useListen(inputs.mic && mic.ready && !!item && !solved, `${cfg.mode}-${item?.id ?? 0}`, () => ({
    stabilityMs: 0, // 1…10 is a small, prefix-free set → match immediately (iOS)
    match: (text, alts) => !!item && [text, ...alts].some((x) => saysNumber(x, item.value)),
    onMatch: registerCorrect,
  }));

  // Keypad input.
  const keyTap = (k: string) => {
    if (!item || solvedRef.current) return;
    setWrongTyped(false);
    setTyped((v) => (v.length < cfg.maxTyped ? v + k : v));
  };
  const backspace = () => { setTyped((v) => v.slice(0, -1)); setWrongTyped(false); };
  const validate = () => {
    if (!item || solvedRef.current || !typed) return;
    const v = parseInt(typed, 10);
    if (v === item.value) registerCorrect();
    else { setWrongTyped(true); fireShake(); }
  };

  const skip = () => { voice.stop(); next(); };

  const hint = () => {
    if (!item || solved) return;
    void voice.playNumber(item.value); // the recogniser pauses while it plays
  };

  const setInput = (patch: Partial<LeerlingSettings['playingCard']>) => {
    if (patch.mic) void speech.requestPermission();
    update({ [cfg.mode]: { ...inputs, ...patch } } as Partial<LeerlingSettings>);
  };

  // Keys up to the niveau-capped max ("0" only exists to type 10).
  const digits = cfg.maxTyped === 1
    ? Array.from({ length: Math.min(9, max) }, (_, i) => String(i + 1))
    : [...Array.from({ length: Math.min(9, max) }, (_, i) => String(i + 1)), ...(max >= 10 ? ['0'] : [])];

  return (
    <ExerciseShell
      mode={cfg.mode}
      correct={tracker.correct}
      highlights={tracker.highlights}
      onHint={hint}
      hintLabel={t('common.hint')}
      extraSettings={<AnswerModeSettings which={cfg.mode} />}
    >
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-4 md:gap-6 items-stretch">
        {/* Question */}
        <section className="relative flex-1 bg-white rounded-3xl shadow-md p-5 sm:p-6 flex flex-col items-center justify-center gap-3 min-h-[320px]">
          <p className="font-baloo font-semibold text-xl text-center" style={{ color: C.gold }}>{t(cfg.promptKey)}</p>
          {item && (
            <div className="relative">
              {cfg.renderFace(item.value, item.extra)}
              <SolvedSeal show={solved} />
            </div>
          )}
          <div className="font-baloo font-extrabold text-5xl h-14 leading-none flex items-center" style={{ color: C.success }}>
            {solved && item ? <span className="kd-pop">{item.value}</span> : ' '}
          </div>
        </section>

        {/* Inputs */}
        <section className="md:w-[22rem] shrink-0 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <InputToggle icon={<Mic size={20} />} label={t('ms.input.mic')} on={inputs.mic} onClick={() => setInput({ mic: !inputs.mic })} />
            <InputToggle icon={<Keyboard size={20} />} label={t('ms.input.keypad')} on={inputs.keypad} onClick={() => setInput({ keypad: !inputs.keypad })} />
          </div>
          {!inputs.mic && !inputs.keypad && (
            <p className="text-center pt-4 opacity-50 font-medium">{t('ms.pickInput')}</p>
          )}
          {inputs.mic && <div className="[&>.kd-mic-panel]:w-full"><MicPanel hint={t('ms.listening')} /></div>}
          {inputs.keypad && (
            <div className="bg-white rounded-3xl shadow-sm border border-[#946B29]/15 p-3 flex flex-col gap-2">
              <div
                className={cx('h-14 rounded-xl flex items-center justify-center font-baloo font-extrabold text-4xl bg-white/80 border-2', shake && 'kd-shake')}
                style={{ borderColor: (wrongTyped ? C.danger : C.gold) + '80' }}
              >
                {typed || ' '}
              </div>
              <KeyRows digits={digits} onKey={keyTap} onBack={backspace} onEnter={validate} disabled={solved} />
              <button
                onClick={validate}
                disabled={solved}
                className="h-14 rounded-xl flex items-center justify-center gap-2 font-baloo font-extrabold text-lg text-white disabled:opacity-50 active:scale-[.98] transition"
                style={{ background: C.success }}
              >
                <Check size={22} strokeWidth={3} /> {t('ms.validate')}
              </button>
            </div>
          )}
          <SkipButton onClick={skip} className="self-end" />
        </section>
      </div>
    </ExerciseShell>
  );
}

function InputToggle({ icon, label, on, onClick }: { icon: ReactNode; label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className="h-[58px] rounded-2xl flex flex-col items-center justify-center gap-0.5 font-baloo font-bold text-xs border border-[#946B29]/30 transition"
      style={on
        ? { background: `linear-gradient(180deg, ${C.goldMid}, ${C.gold})`, color: 'white' }
        : { background: 'rgba(255,255,255,0.7)', color: C.text + 'b3' }}
    >
      {icon}
      {label}
    </button>
  );
}

/** Digit keys (max 5 per row) + backspace; the physical keyboard works too. */
function KeyRows({ digits, onKey, onBack, onEnter, disabled }: {
  digits: string[]; onKey: (k: string) => void; onBack: () => void; onEnter: () => void; disabled: boolean;
}) {
  const ref = useRef({ digits, onKey, onBack, onEnter, disabled });
  ref.current = { digits, onKey, onBack, onEnter, disabled };
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const r = ref.current;
      if (r.disabled) return;
      if (r.digits.includes(e.key)) r.onKey(e.key);
      else if (e.key === 'Backspace') r.onBack();
      else if (e.key === 'Enter') r.onEnter();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const keys = [...digits, 'del'];
  // Die (1–6): rows of three like iOS; cards/hands: rows of five.
  const cols = digits.length <= 6 ? Math.min(3, keys.length) : 5;
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {keys.map((k) => (
        <button
          key={k}
          disabled={disabled}
          onClick={() => (k === 'del' ? onBack() : onKey(k))}
          aria-label={k === 'del' ? 'Wissen' : k}
          className="h-14 rounded-xl bg-white border border-[#946B29]/30 font-baloo font-extrabold text-2xl flex items-center justify-center shadow-sm active:scale-95 transition disabled:opacity-50"
          style={{ color: C.text }}
        >
          {k === 'del' ? <Delete size={24} /> : k}
        </button>
      ))}
    </div>
  );
}
