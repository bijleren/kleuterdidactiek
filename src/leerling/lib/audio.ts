/*
  Audio for the student exercises — port of the iOS NumberVoice/AudioPlayer.

  * Number clips:      /leerling-audio/getallen/<name>.mp3   (bundled with the app)
  * Instruction clips: /leerling-audio/instructies/<slug>.mp3, falling back to
                       https://woordenschat.be/instructions/<slug>.mp3
  * Anything missing:  browser text-to-speech (nl-BE / nl-NL voice)

  One shared player so that a new prompt always cuts off the previous one, and
  so the speech recogniser can wait until the room is quiet before listening
  (otherwise Chrome hears our own voice through the speakers).
*/
import { numberClips, spellInteger } from './dutch';

const NUMBER_BASE = '/leerling-audio/getallen/';
const INSTRUCTION_BASE = '/leerling-audio/instructies/';
const REMOTE_INSTRUCTION_BASE = 'https://woordenschat.be/instructions/';

/** Clips bundled in public/leerling-audio/instructies (kept in sync with the iOS bundle). */
import bundledInstructions from './bundledInstructions.json';
const BUNDLED = new Set<string>(bundledInstructions as string[]);

/** Text → clip slug, same rule as the iOS InstructionService. */
export function instructionSlug(text: string): string | null {
  const cleaned = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ');
  const words = cleaned.split(/\s+/).filter(Boolean);
  return words.length ? words.join('_') : null;
}

type Listener = () => void;

class Voice {
  /** Global switch (the speaker button). */
  enabled = true;
  private audio: HTMLAudioElement | null = null;
  private seq = 0;
  private speaking = 0;
  private failedRemote = new Set<string>();
  private listeners = new Set<Listener>();

  get isSpeaking(): boolean {
    return this.speaking > 0;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  /** Stop whatever is playing (clip sequence or TTS). */
  stop() {
    this.seq++;
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    if (this.speaking) {
      this.speaking = 0;
      this.emit();
    }
  }

  /** Resolves once nothing is playing (or after `timeoutMs`). */
  async waitUntilQuiet(timeoutMs = 8000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    await sleep(50);
    while (this.isSpeaking && Date.now() < deadline) await sleep(100);
  }

  private begin(): number {
    this.stop();
    this.speaking = 1;
    this.emit();
    return this.seq;
  }

  private finish(token: number) {
    if (token !== this.seq) return;
    this.speaking = 0;
    this.emit();
  }

  /** Play one URL; resolves true when it played to the end. */
  private playUrl(url: string, token: number): Promise<boolean> {
    return new Promise((resolve) => {
      if (token !== this.seq) return resolve(false);
      const a = new Audio(url);
      this.audio = a;
      let settled = false;
      // Safety net: a clip that never starts or never ends (network stall,
      // autoplay block) must not freeze the exercise waiting for it.
      let guard = setTimeout(() => done(false), 6000);
      const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(guard);
        a.onended = a.onerror = a.onplaying = null;
        resolve(ok && token === this.seq);
      };
      a.onplaying = () => {
        // Playing: allow the clip's own length plus a margin.
        clearTimeout(guard);
        const ms = isFinite(a.duration) && a.duration > 0 ? (a.duration - a.currentTime) * 1000 + 2000 : 15000;
        guard = setTimeout(() => done(true), ms);
      };
      a.onended = () => done(true);
      a.onerror = () => done(false);
      a.play().catch(() => done(false));
    });
  }

  /** Play a sequence of number clips by name ("20", "en", "euro"…). */
  async playClips(names: string[]): Promise<void> {
    if (!this.enabled || !names.length) return;
    const token = this.begin();
    for (const n of names) {
      const ok = await this.playUrl(NUMBER_BASE + encodeURIComponent(n) + '.mp3', token);
      if (!ok) break;
    }
    this.finish(token);
  }

  /** Say a whole number with the recorded clips (TTS if a clip is missing). */
  async playNumber(n: number): Promise<void> {
    if (!this.enabled) return;
    if (n < 0 || n > 999_999) return this.speak(spellInteger(n));
    const token = this.begin();
    for (const name of numberClips(n)) {
      const ok = await this.playUrl(NUMBER_BASE + name + '.mp3', token);
      if (!ok) {
        if (token === this.seq) await this.ttsInner(spellInteger(n), token);
        break;
      }
    }
    this.finish(token);
  }

  /**
   * Play a spoken instruction ("zeg dit getal"). Uses the bundled clip,
   * then woordenschat.be, then TTS. `spokenInstructions` = the setting.
   */
  async playInstruction(text: string, spokenInstructions = true): Promise<void> {
    if (!this.enabled || !spokenInstructions) return;
    const slug = instructionSlug(text);
    if (!slug) return;
    const token = this.begin();
    let ok = false;
    if (BUNDLED.has(slug)) {
      ok = await this.playUrl(INSTRUCTION_BASE + slug + '.mp3', token);
    } else if (!this.failedRemote.has(slug)) {
      ok = await this.playUrl(REMOTE_INSTRUCTION_BASE + slug + '.mp3', token);
      if (!ok && token === this.seq) this.failedRemote.add(slug);
    }
    if (!ok && token === this.seq) await this.ttsInner(text, token);
    this.finish(token);
  }

  /** Play several instruction / number parts back to back. */
  async playParts(parts: Array<{ text: string } | { number: number } | { clips: string[] }>, spokenInstructions = true): Promise<void> {
    for (const p of parts) {
      if (!this.enabled) return;
      // An instruction part is skipped (not "interrupted") when spoken
      // instructions are off — the numbers after it must still play.
      if ('text' in p && (!spokenInstructions || !instructionSlug(p.text))) continue;
      if ('clips' in p && !p.clips.length) continue;
      const before = this.seq;
      if ('text' in p) await this.playInstruction(p.text, spokenInstructions);
      else if ('number' in p) await this.playNumber(p.number);
      else await this.playClips(p.clips);
      // Someone else called stop() / started new audio — abandon the rest.
      if (this.seq !== before + 1) return;
    }
  }

  /** Browser text-to-speech in Dutch. */
  async speak(text: string): Promise<void> {
    if (!this.enabled) return;
    const token = this.begin();
    await this.ttsInner(text, token);
    this.finish(token);
  }

  private ttsInner(text: string, token: number): Promise<void> {
    return new Promise((resolve) => {
      if (typeof speechSynthesis === 'undefined' || token !== this.seq) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      const voice = dutchVoice();
      if (voice) u.voice = voice;
      u.lang = voice?.lang ?? 'nl-BE';
      u.rate = 0.9;
      const t = setTimeout(resolve, 8000);
      u.onend = u.onerror = () => { clearTimeout(t); resolve(); };
      speechSynthesis.speak(u);
    });
  }
}

let cachedVoice: SpeechSynthesisVoice | null | undefined;
function dutchVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  if (typeof speechSynthesis === 'undefined') return null;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;
  cachedVoice =
    voices.find((v) => v.lang === 'nl-BE') ??
    voices.find((v) => v.lang.startsWith('nl')) ??
    null;
  return cachedVoice;
}
if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.onvoiceschanged = () => { cachedVoice = undefined; };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** The single shared voice for the whole student app. */
export const voice = new Voice();

/** Short success / error blips made with WebAudio (no files needed). */
let ctx: AudioContext | null = null;
export function blip(kind: 'good' | 'bad' | 'tap') {
  if (!voice.enabled) return;
  try {
    ctx ??= new AudioContext();
    const now = ctx.currentTime;
    const notes = kind === 'good' ? [660, 880] : kind === 'bad' ? [300, 220] : [520];
    notes.forEach((f, i) => {
      const o = ctx!.createOscillator();
      const g = ctx!.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const t0 = now + i * 0.09;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      o.connect(g).connect(ctx!.destination);
      o.start(t0);
      o.stop(t0 + 0.18);
    });
  } catch {
    /* audio not available */
  }
}
