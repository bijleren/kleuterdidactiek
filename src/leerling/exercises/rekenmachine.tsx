/*
  "Rekenmachine" — port of iOS Features/Rekenmachine (View + ViewModel).
  A number (niveau, optional 0) is shown; the child types it on an on-screen
  calculator (7-8-9 on top, ⌫, Wis, Klaar) and checks with "Klaar". Wrong →
  red display border. Correct → check mark, the number is read aloud, then
  "goed gedaan" on every 5th, then the next number after 1 s. "Typ dit getal"
  is spoken once when the exercise opens. Lamp = hear the number; "Overslaan"
  skips. The physical keyboard works too (digits, Backspace, Esc, Enter).
  Touch only, like iOS (no voice answers there). Analytics prefix: rekenmachine.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { BadgeCheck, Check, Delete, FastForward, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { C, ExerciseShell, cx } from '../ui';
import { useExerciseTracker, useStopOnUnmount, useTimer } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { randIntExcluding } from '../lib/dutch';
import { t } from '../strings';

export default function Rekenmachine() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const tracker = useExerciseTracker('rekenmachine');
  const later = useTimer();
  const [target, setTarget] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [typed, setTyped] = useState('');
  const [wrongTyped, setWrongTyped] = useState(false);
  const [round, setRound] = useState(0);
  const prompted = useRef(false);
  const seq = useRef(0); // invalidates a running celebration on skip / unmount
  useEffect(() => () => { seq.current++; }, []);

  const nextNumber = useCallback(() => {
    seq.current++;
    setTarget((prev) => randIntExcluding(settings.allowZero ? 0 : 1, settings.maxNumber, prev));
    setSolved(false);
    setTyped('');
    setWrongTyped(false);
    setRound((r) => r + 1);
  }, [settings.allowZero, settings.maxNumber]);

  useEffect(() => { nextNumber(); }, [nextNumber]);
  useEffect(() => {
    if (!round) return;
    tracker.shown();
    if (!prompted.current) {
      prompted.current = true;
      void voice.playInstruction(t('rekenmachine.prompt'), settings.spokenInstructions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const keyTap = (k: string) => {
    if (solved) return;
    setWrongTyped(false);
    setTyped((s) => (s.length < 8 ? s + k : s));
  };
  const backspace = () => {
    if (solved) return;
    setTyped((s) => s.slice(0, -1));
    setWrongTyped(false);
  };
  const clearEntry = () => {
    if (solved) return;
    setTyped('');
    setWrongTyped(false);
  };

  const validate = () => {
    if (solved || target === null || !typed) return;
    if (parseInt(typed, 10) !== target) { setWrongTyped(true); return; }
    setSolved(true);
    const my = ++seq.current;
    const t0 = target;
    void (async () => {
      // Read the number back fully, then count it (the tracker says
      // "goed gedaan" on every 5th), then pause and move on.
      await voice.playNumber(t0);
      if (my !== seq.current) return;
      tracker.markCorrect(String(t0));
      await voice.waitUntilQuiet();
      if (my !== seq.current) return;
      later(() => { if (my === seq.current) nextNumber(); }, 1000);
    })();
  };

  const hint = () => {
    if (target === null || solved) return;
    void voice.playNumber(target);
  };

  // Physical keyboard.
  const handlers = useRef({ keyTap, backspace, clearEntry, validate });
  handlers.current = { keyTap, backspace, clearEntry, validate };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const h = handlers.current;
      if (/^[0-9]$/.test(e.key)) h.keyTap(e.key);
      else if (e.key === 'Backspace') h.backspace();
      else if (e.key === 'Escape' || e.key === 'Delete') h.clearEntry();
      else if (e.key === 'Enter') { e.preventDefault(); h.validate(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const keyFace = (content: ReactNode, onClick: () => void, label: string) => (
    <button
      onClick={onClick}
      className="flex-1 h-14 rounded-xl bg-white font-baloo font-bold text-3xl leading-none flex items-center justify-center active:scale-95 transition shadow-sm"
      style={{ color: C.text, border: `1px solid ${C.gold}4d` }}
      aria-label={label}
    >
      {content}
    </button>
  );
  const keyRow = (keys: string[]) => (
    <div className="flex gap-2">{keys.map((k) => <span key={k} className="flex-1 flex">{keyFace(k, () => keyTap(k), k)}</span>)}</div>
  );

  return (
    <ExerciseShell
      mode="rekenmachine"
      correct={tracker.correct}
      highlights={tracker.highlights}
      metrics={[{ label: 'Juist', value: tracker.correct }]}
      onHint={hint}
      hintLabel="Beluister het getal"
    >
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-4 md:gap-5 items-stretch">
        {/* Target */}
        <div className="flex-1 bg-white rounded-3xl shadow-md p-7 flex flex-col items-center justify-center gap-4 min-h-[220px]">
          <p className="font-medium text-lg text-center" style={{ color: C.gold }}>{t('rekenmachine.prompt')}</p>
          <div className="font-baloo font-bold text-[72px] sm:text-[96px] leading-none" style={{ color: C.text }}>
            {target ?? ''}
          </div>
          <BadgeCheck
            size={64}
            className={cx('transition-all duration-300', solved ? 'opacity-100 scale-100' : 'opacity-0 scale-75')}
            style={{ color: C.success }}
          />
        </div>

        {/* Calculator */}
        <div className="w-full md:w-[340px] bg-white/70 rounded-3xl shadow-md p-3.5 flex flex-col gap-2.5">
          <div
            className="h-[66px] px-3.5 rounded-xl flex items-center justify-end font-baloo font-bold text-[44px] leading-none transition-colors"
            style={{ background: 'rgba(255,255,255,.9)', color: C.text, border: `2px solid ${(wrongTyped ? C.danger : C.gold)}80` }}
            aria-live="polite"
          >
            <span className={cx(wrongTyped && 'kd-shake')}>{typed || ' '}</span>
          </div>
          {keyRow(['7', '8', '9'])}
          {keyRow(['4', '5', '6'])}
          {keyRow(['1', '2', '3'])}
          <div className="flex gap-2">
            {keyFace('0', () => keyTap('0'), '0')}
            {keyFace(<Delete size={28} />, backspace, 'Wissen')}
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearEntry}
              className="w-[132px] h-14 rounded-xl text-white font-baloo font-bold text-base flex items-center justify-center gap-1.5 active:scale-95 transition"
              style={{ background: C.text + '8c' }}
            >
              <X size={18} strokeWidth={3} /> {t('rekenmachine.clear')}
            </button>
            <button
              onClick={validate}
              className="flex-1 h-14 rounded-xl text-white font-baloo font-bold text-lg flex items-center justify-center gap-1.5 active:scale-95 transition"
              style={{ background: C.success }}
            >
              <Check size={20} strokeWidth={3} /> {t('ms.validate')}
            </button>
          </div>
          <div className="flex justify-center pt-0.5">
            <button
              onClick={nextNumber}
              className="flex items-center gap-1.5 px-3 py-1 font-baloo font-bold text-sm"
              style={{ color: C.text + '99' }}
            >
              <FastForward size={14} fill="currentColor" /> {t('common.skip')}
            </button>
          </div>
        </div>
      </div>
    </ExerciseShell>
  );
}
