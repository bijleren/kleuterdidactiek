/*
  Speech recognition for the student exercises — the web counterpart of the
  iOS SpeechRecognizer, built on the Web Speech API (Chrome and Edge; Safari
  also works). Dutch, continuous, with interim results.

  Behaviour copied from iOS:
  * wait until our own audio is quiet before listening (no self-echo), and
    pause while an instruction or number clip plays;
  * a match must stay a match for `stabilityMs` before it counts, so
    "twee" is not accepted while the child is still saying "tweeëntwintig";
  * after 1.5 s without new words the transcript window is cleared, so an
    old wrong answer does not stick to the next attempt;
  * the session restarts by itself when the browser ends it.
*/
import { voice, sleep } from './audio';
import { normalizeDigits, phoneticSimilarity, tokens, fold } from './dutch';

/* Minimal typings for the (prefixed) Web Speech API. */
interface SRAlternative { transcript: string; confidence: number }
interface SRResult { isFinal: boolean; length: number; [i: number]: SRAlternative }
interface SRResultList { length: number; [i: number]: SRResult }
interface SREvent { resultIndex: number; results: SRResultList }
interface SRErrorEvent { error: string; message?: string }
interface SR {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SRCtor = new () => SR;

function recognitionCtor(): SRCtor | null {
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const speechSupported = typeof window !== 'undefined' && recognitionCtor() !== null;

export type MicPermission = 'unknown' | 'granted' | 'denied';
export type SpeechError = null | 'unsupported' | 'denied' | 'network' | 'nomic';

export interface SpeechState {
  supported: boolean;
  permission: MicPermission;
  /** A listen session is wanted (may be paused while audio plays). */
  active: boolean;
  /** The browser is actually capturing right now. */
  capturing: boolean;
  /** Current transcript window (digits replaced by Dutch words). */
  transcript: string;
  /** The child said something close to the target ("bijna!"). */
  nearMatch: boolean;
  error: SpeechError;
}

export interface ListenOptions {
  /**
   * Called for every transcript update (best guess + alternatives). Return
   * true when the answer is right. Ignored when `onText` handles everything.
   */
  match?: (text: string, alternatives: string[]) => boolean;
  /** Called once the match held for `stabilityMs`. Listening stops first. */
  onMatch?: () => void;
  /** Free-form stream for exercises that track sequences (tellen, dagen…). */
  onText?: (text: string, isFinal: boolean, alternatives: string[]) => void;
  /** Default 500 ms like iOS; 0 = commit immediately. */
  stabilityMs?: number;
  /** Target phrase used for the "bijna" hint. */
  near?: string;
  /** Clear the window after this much silence (default 1500 ms). */
  clearAfterMs?: number;
}

type Listener = (s: SpeechState) => void;

class SpeechEngine {
  private state: SpeechState = {
    supported: speechSupported,
    permission: 'unknown',
    active: false,
    capturing: false,
    transcript: '',
    nearMatch: false,
    error: speechSupported ? null : 'unsupported',
  };
  private listeners = new Set<Listener>();
  private rec: SR | null = null;
  private opts: ListenOptions | null = null;
  private session = 0;
  private lang = 'nl-BE';
  private windowStart = 0;
  private clearTimer: ReturnType<typeof setTimeout> | null = null;
  private matchTimer: ReturnType<typeof setTimeout> | null = null;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private lastText = '';
  private lastAlts: string[] = [];
  private lastLength = 0;
  private lastFinal = true;
  private networkFailures = 0;
  private pausedForAudio = false;

  constructor() {
    voice.subscribe(() => this.onVoiceChange());
  }

  get snapshot(): SpeechState {
    return this.state;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  private set(patch: Partial<SpeechState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l(this.state));
  }

  /** Ask for the microphone once (shows the browser's permission prompt). */
  async requestPermission(): Promise<MicPermission> {
    if (!speechSupported) return 'denied';
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      this.set({ permission: 'granted', error: null });
      return 'granted';
    } catch (e) {
      const name = (e as DOMException)?.name;
      if (name === 'NotFoundError') {
        this.set({ permission: 'denied', error: 'nomic' });
      } else {
        this.set({ permission: 'denied', error: 'denied' });
      }
      return 'denied';
    }
  }

  /** Dev only: pretend the mic is allowed (sessions then wait for simulate()). */
  private devGranted = false;
  devGrant() {
    this.devGranted = true;
    this.set({ permission: 'granted', error: null, supported: true });
  }

  /** Check the permission without prompting (Chrome/Edge support this). */
  async checkPermission(): Promise<MicPermission> {
    if (this.devGranted) return 'granted';
    try {
      const st = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      const p: MicPermission = st.state === 'granted' ? 'granted' : st.state === 'denied' ? 'denied' : 'unknown';
      this.set({ permission: p, error: p === 'denied' ? 'denied' : this.state.error === 'denied' ? null : this.state.error });
      return p;
    } catch {
      return this.state.permission;
    }
  }

  /** Start listening for an answer. Replaces any previous session. */
  listen(opts: ListenOptions) {
    this.stop();
    if (!speechSupported) return;
    this.opts = opts;
    this.session++;
    this.networkFailures = 0;
    this.set({ active: true, transcript: '', nearMatch: false });
    const token = this.session;
    void (async () => {
      await voice.waitUntilQuiet();
      if (token !== this.session || !this.opts) return;
      this.begin();
    })();
  }

  /** Stop listening entirely. */
  stop() {
    this.session++;
    this.opts = null;
    this.clearTimers();
    this.teardown();
    this.pausedForAudio = false;
    if (this.state.active || this.state.capturing || this.state.transcript) {
      this.set({ active: false, capturing: false, transcript: '', nearMatch: false });
    }
  }

  /** Forget what was heard so far (start a fresh window). */
  clearTranscript() {
    // Skip everything heard so far; keep a phrase that is still in progress.
    this.windowStart = this.lastFinal ? this.lastLength : Math.max(0, this.lastLength - 1);
    this.lastText = '';
    this.lastAlts = [];
    if (this.matchTimer) { clearTimeout(this.matchTimer); this.matchTimer = null; }
    this.set({ transcript: '', nearMatch: false });
  }

  private clearTimers() {
    for (const t of [this.clearTimer, this.matchTimer, this.restartTimer]) if (t) clearTimeout(t);
    this.clearTimer = this.matchTimer = this.restartTimer = null;
  }

  private teardown() {
    const r = this.rec;
    this.rec = null;
    if (r) {
      r.onresult = r.onerror = r.onend = r.onstart = null;
      try { r.abort(); } catch { /* already stopped */ }
    }
  }

  /** Pause while our own audio plays; resume once it is quiet again. */
  private onVoiceChange() {
    if (!this.opts) return;
    if (voice.isSpeaking && this.rec) {
      this.pausedForAudio = true;
      this.teardown();
      this.set({ capturing: false });
    } else if (!voice.isSpeaking && this.pausedForAudio) {
      this.pausedForAudio = false;
      const token = this.session;
      setTimeout(() => {
        if (token === this.session && this.opts && !this.rec && !voice.isSpeaking) this.begin();
      }, 250);
    }
  }

  private begin() {
    const Ctor = recognitionCtor();
    if (!Ctor || !this.opts) return;
    if (voice.isSpeaking) { this.pausedForAudio = true; return; }
    this.teardown();
    if (this.devGranted) { this.set({ capturing: true }); return; }
    const rec = new Ctor();
    rec.lang = this.lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    this.windowStart = 0;
    this.lastLength = 0;
    this.lastFinal = true;
    this.lastText = '';
    const token = this.session;

    rec.onstart = () => {
      if (token !== this.session) return;
      this.set({ capturing: true, permission: 'granted', error: null });
    };
    rec.onresult = (e) => {
      if (token !== this.session) return;
      this.networkFailures = 0;
      this.handleResults(e.results);
    };
    rec.onerror = (e) => {
      if (token !== this.session) return;
      switch (e.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          this.set({ permission: 'denied', error: 'denied', capturing: false });
          this.opts = null;
          this.set({ active: false });
          break;
        case 'audio-capture':
          this.set({ error: 'nomic', capturing: false });
          break;
        case 'language-not-supported':
          this.lang = this.lang === 'nl-BE' ? 'nl-NL' : 'nl';
          break;
        case 'network':
          this.networkFailures++;
          if (this.networkFailures >= 3) this.set({ error: 'network' });
          break;
        default:
          // 'no-speech', 'aborted' → onend restarts us.
          break;
      }
    };
    rec.onend = () => {
      if (token !== this.session) return;
      this.rec = null;
      this.set({ capturing: false });
      if (!this.opts || this.pausedForAudio) return;
      if (this.state.error === 'denied') return;
      const delay = this.networkFailures ? Math.min(4000, 500 * this.networkFailures) : 250;
      this.restartTimer = setTimeout(() => {
        if (token === this.session && this.opts && !this.rec) this.begin();
      }, delay);
    };

    this.rec = rec;
    try {
      rec.start();
    } catch {
      this.restartTimer = setTimeout(() => {
        if (token === this.session && this.opts) this.begin();
      }, 400);
    }
  }

  private handleResults(results: SRResultList) {
    const opts = this.opts;
    if (!opts) return;
    this.lastLength = results.length;
    this.lastFinal = results.length ? results[results.length - 1].isFinal : true;
    const start = Math.min(this.windowStart, results.length);
    let best = '';
    let lastAlts: string[] = [];
    let isFinal = true;
    for (let i = start; i < results.length; i++) {
      const r = results[i];
      const top = r[0]?.transcript ?? '';
      if (i === results.length - 1) {
        lastAlts = [];
        for (let a = 1; a < r.length; a++) lastAlts.push(best + ' ' + r[a].transcript);
        isFinal = r.isFinal;
      }
      best += ' ' + top;
    }
    const text = normalizeDigits(best.replace(/\s+/g, ' ').trim());
    const alts = lastAlts.map((a) => normalizeDigits(a.replace(/\s+/g, ' ').trim()));
    this.lastText = text;
    this.lastAlts = alts;

    let near = false;
    if (opts.near) {
      const target = fold(opts.near).replace(/\s+/g, '');
      near = tokens(text).some((tok) => tok !== target && phoneticSimilarity(tok, target) >= 0.5);
    }
    this.set({ transcript: text, nearMatch: near });

    // Clear the window after a pause, like iOS.
    if (this.clearTimer) clearTimeout(this.clearTimer);
    const token = this.session;
    this.clearTimer = setTimeout(() => {
      if (token !== this.session) return;
      this.clearTranscript();
    }, opts.clearAfterMs ?? 1500);

    if (opts.onText) opts.onText(text, isFinal, alts);
    if (!opts.match) return;

    const stability = opts.stabilityMs ?? 500;
    if (stability <= 0 || isFinal) {
      this.commitIfMatch();
    } else {
      if (this.matchTimer) clearTimeout(this.matchTimer);
      this.matchTimer = setTimeout(() => {
        if (token === this.session) this.commitIfMatch();
      }, stability);
    }
  }

  /**
   * Test hook (dev only, window.__kdSpeech): feed a transcript as if the
   * browser heard it. Each call is a fresh window, like a pause in between.
   */
  simulate(text: string, isFinal = true): boolean {
    if (!this.opts) return false;
    const r = { 0: { transcript: text, confidence: 1 }, length: 1, isFinal } as unknown as SRResult;
    const list = { 0: r, length: 1 } as unknown as SRResultList;
    this.windowStart = 0;
    this.handleResults(list);
    return true;
  }

  private commitIfMatch() {
    const opts = this.opts;
    if (!opts?.match) return;
    if (!opts.match(this.lastText, this.lastAlts)) return;
    const cb = opts.onMatch;
    this.stop();
    cb?.();
  }
}

/** The one shared recogniser (there is only one microphone). */
export const speech = new SpeechEngine();

if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Lets us test voice exercises without a real microphone:
  //   __kdSpeech.grant(); __kdSpeech.simulate('vijf')
  (window as unknown as Record<string, unknown>).__kdSpeech = {
    simulate: (t: string, final = true) => speech.simulate(t, final),
    grant: () => speech.devGrant(),
    state: () => speech.snapshot,
  };
}

/** Convenience: wait for a match once. Resolves false if stopped. */
export function listenOnce(match: (t: string, alts: string[]) => boolean, near?: string): Promise<boolean> {
  return new Promise((resolve) => {
    speech.listen({ match, near, onMatch: () => resolve(true) });
  });
}

export { sleep };
