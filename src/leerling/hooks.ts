import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { speech, speechSupported } from './lib/speech';
import type { ListenOptions, SpeechState } from './lib/speech';
import { voice } from './lib/audio';
import { trackCorrect, trackShown } from './lib/progress';
import { useSettings } from './settings';

/** Live speech-recogniser state (transcript, listening, permission…). */
export function useSpeechState(): SpeechState {
  return useSyncExternalStore(
    (cb) => speech.subscribe(cb),
    () => speech.snapshot,
  );
}

/** True while one of our own clips / TTS is playing. */
export function useVoiceSpeaking(): boolean {
  return useSyncExternalStore(
    (cb) => voice.subscribe(cb),
    () => voice.isSpeaking,
  );
}

/**
 * Microphone readiness for a voice exercise: checks the permission on mount
 * and exposes `request()` for the "Microfoon aanzetten" button.
 * ready = supported + permission granted.
 */
export function useMic() {
  const st = useSpeechState();
  useEffect(() => {
    if (speechSupported) void speech.checkPermission();
  }, []);
  const request = useCallback(() => speech.requestPermission(), []);
  return {
    supported: st.supported,
    permission: st.permission,
    ready: st.supported && st.permission === 'granted',
    error: st.error,
    request,
  };
}

/**
 * Listen while `armed` is true, with the given options. Re-arms whenever
 * `key` changes (new question). Stops on unmount.
 */
export function useListen(armed: boolean, key: string, opts: () => ListenOptions) {
  const optsRef = useRef(opts);
  optsRef.current = opts;
  useEffect(() => {
    if (!armed) { speech.stop(); return; }
    // Wrap so the latest closures are always used.
    const o = optsRef.current();
    speech.listen({
      ...o,
      match: o.match ? (t, a) => optsRef.current().match!(t, a) : undefined,
      onText: o.onText ? (t, f, a) => optsRef.current().onText!(t, f, a) : undefined,
      onMatch: () => optsRef.current().onMatch?.(),
    });
    return () => speech.stop();
  }, [armed, key]);
}

/**
 * Progress + counters for one exercise. `prefix` is the iOS analytics event
 * prefix (e.g. 'saynumber' → saynumber_shown / saynumber_correct), so the
 * coach's overview in bijleer.school groups web and iPad practice together.
 */
export function useExerciseTracker(prefix: string) {
  const [correct, setCorrect] = useState(0);
  const [highlights, setHighlights] = useState<string[]>([]);
  const { settings } = useSettings();
  const shown = useCallback((skill = '') => trackShown(prefix, skill), [prefix]);
  const markCorrect = useCallback((label?: string, skill = '') => {
    trackCorrect(prefix, skill);
    setCorrect((c) => {
      const n = c + 1;
      if (n % 5 === 0) void voice.playInstruction('goed gedaan', settings.spokenInstructions);
      return n;
    });
    if (label !== undefined) setHighlights((h) => [label, ...h].slice(0, 12));
  }, [prefix, settings.spokenInstructions]);
  return { correct, highlights, shown, markCorrect };
}

/** setTimeout that is cleared on unmount / when called again. */
export function useTimer() {
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (ref.current) clearTimeout(ref.current); }, []);
  return useCallback((fn: () => void, ms: number) => {
    if (ref.current) clearTimeout(ref.current);
    ref.current = setTimeout(fn, ms);
  }, []);
}

/** Stop audio + recogniser when the exercise unmounts. */
export function useStopOnUnmount() {
  useEffect(() => () => { speech.stop(); voice.stop(); }, []);
}
