/*
  Progress rollup — same table and keys as the iOS app (rekenlezer_progress,
  app 'kleuterdidactiek'), written with the child's card hash so no coach
  login is needed. `<exercise>_shown` = an attempt, `<exercise>_correct` = a
  correct answer; whole-app time goes to the pseudo-exercise 'sessie'.
*/
import { supabase } from '../../lib/supabase';
import { APP_ID } from './student';

interface Delta { correct: number; seconds: number; attempts: number }

let hash: string | null = null;
const pending = new Map<string, Delta>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function setProgressHash(h: string | null) {
  if (h !== hash) void flush();
  hash = h;
}

function keyOf(exercise: string, skill: string) {
  return exercise + '\u0000' + skill;
}

export function bump(exercise: string, d: Partial<Delta> & { skill?: string }) {
  if (!hash) return; // guest: nothing to attribute
  const correct = d.correct ?? 0, seconds = d.seconds ?? 0, attempts = d.attempts ?? 0;
  if (!correct && !seconds && !attempts) return;
  const k = keyOf(exercise, d.skill ?? '');
  const cur = pending.get(k) ?? { correct: 0, seconds: 0, attempts: 0 };
  cur.correct += correct; cur.seconds += seconds; cur.attempts += attempts;
  pending.set(k, cur);
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => void flush(), 4000);
}

/** An exercise item was shown (one attempt). `exercise` = iOS analytics prefix. */
export function trackShown(exercise: string, skill = '') {
  bump(exercise, { attempts: 1, skill });
}

/** The child answered correctly. */
export function trackCorrect(exercise: string, skill = '') {
  bump(exercise, { correct: 1, skill });
}

function params(h: string, k: string, v: Delta) {
  const [exercise, skill] = k.split('\u0000');
  return {
    p_hash: h, p_exercise: exercise, p_skill: skill,
    p_correct: v.correct, p_seconds: v.seconds, p_app: APP_ID, p_attempts: v.attempts,
  };
}

export async function flush(): Promise<void> {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  const h = hash;
  if (!h || !pending.size) return;
  const batch = new Map(pending);
  pending.clear();
  const rpc = supabase.rpc.bind(supabase) as unknown as (fn: string, p: object) => Promise<{ error: unknown }>;
  for (const [k, v] of batch) {
    try {
      const { error } = await rpc('bump_rekenlezer_progress_by_hash', params(h, k, v));
      if (error) throw error;
    } catch {
      const cur = pending.get(k) ?? { correct: 0, seconds: 0, attempts: 0 };
      cur.correct += v.correct; cur.seconds += v.seconds; cur.attempts += v.attempts;
      pending.set(k, cur);
    }
  }
}

/** Last-chance flush when the tab closes: keepalive fetch straight to PostgREST. */
export function flushOnUnload() {
  const h = hash;
  if (!h || !pending.size) return;
  const url = import.meta.env.VITE_SUPABASE_URL + '/rest/v1/rpc/bump_rekenlezer_progress_by_hash';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  for (const [k, v] of pending) {
    try {
      void fetch(url, {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', apikey: key, Authorization: 'Bearer ' + key },
        body: JSON.stringify(params(h, k, v)),
      });
    } catch { /* ignore */ }
  }
  pending.clear();
}

/* ---------- whole-app session timer ('sessie') ---------- */

let sessionStart: number | null = null;
let visibleSince: number | null = null;
let accumulated = 0;

/** Count only time the tab is visible (the iOS timer only runs in the foreground). */
export function startSession() {
  endSession();
  sessionStart = Date.now();
  accumulated = 0;
  visibleSince = document.visibilityState === 'visible' ? Date.now() : null;
}

export function endSession() {
  if (sessionStart === null) return;
  if (visibleSince !== null) accumulated += Date.now() - visibleSince;
  const seconds = Math.round(accumulated / 1000);
  sessionStart = null;
  visibleSince = null;
  accumulated = 0;
  if (seconds >= 3) bump('sessie', { seconds });
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (sessionStart === null) return;
    if (document.visibilityState === 'hidden') {
      if (visibleSince !== null) accumulated += Date.now() - visibleSince;
      visibleSince = null;
      // Bank the time so far; a closed tab would otherwise lose it.
      const seconds = Math.round(accumulated / 1000);
      if (seconds >= 3) { bump('sessie', { seconds }); accumulated = 0; }
      flushOnUnload();
    } else {
      visibleSince = Date.now();
    }
  });
  window.addEventListener('pagehide', () => flushOnUnload());
}
