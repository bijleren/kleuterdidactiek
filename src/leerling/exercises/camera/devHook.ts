/*
  Dev-only test hooks for the camera batch (loaded from useCamera.ts only
  when import.meta.env.DEV). The camera is blocked in the test browser, so:

    __kdCamera.show('12')            feed a synthetic webcam frame showing "12"
    __kdCamera.show('12', {style:'font', font:'Bradley Hand'})
    __kdCamera.feed(null)            back to the real camera
    __kdDraw.draw('7')               draw "7" on the visible drawing pad with pointer events
    await __kdDigits.bench()         recognition accuracy on synthetic samples
*/
import { setFakeFrame } from './useCamera';
import { availableFonts, cameraFrame, drawingCanvas, numberStrokes, rng } from './synth';
import { readDrawingFor, readFrameFor, readFrameOpen } from './recognize';

const w = window as unknown as Record<string, unknown>;

w.__kdCamera = {
  feed: (c: HTMLCanvasElement | null) => setFakeFrame(c),
  show: (text: string, opts: Parameters<typeof cameraFrame>[1] = {}) => {
    const c = cameraFrame(text, opts);
    setFakeFrame(c);
    return c;
  },
};

/** Simulate a child drawing `text` on the drawing pad (real pointer events). */
async function drawOnPad(text: string, seed = Date.now()) {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-kd-drawpad]');
  if (!canvas) return false;
  const r = canvas.getBoundingClientRect();
  const box = { x: r.width * 0.2, y: r.height * 0.15, w: r.width * 0.6, h: r.height * 0.7 };
  const strokes = numberStrokes(text, box, rng(seed));
  const fire = (type: string, x: number, y: number) => canvas.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', isPrimary: true,
    clientX: r.left + x, clientY: r.top + y, buttons: type === 'pointerup' ? 0 : 1,
  }));
  for (const s of strokes) {
    fire('pointerdown', s[0][0], s[0][1]);
    for (const p of s.slice(1)) {
      fire('pointermove', p[0], p[1]);
      await new Promise((res) => setTimeout(res, 4));
    }
    const last = s[s.length - 1];
    fire('pointerup', last[0], last[1]);
    await new Promise((res) => setTimeout(res, 60));
  }
  return true;
}

w.__kdDraw = { draw: drawOnPad };

interface BenchOpts { numbers?: number[]; seeds?: number; fonts?: string[] }

/**
 * Accuracy on synthetic samples:
 *  - camera, judged against the right number: per-frame votes ≥ 1 (a static
 *    frame is then accepted after 2–3 ticks) and = 2
 *  - camera, judged against a wrong number (n+1): false accepts
 *  - camera open reading (Toon een getal): exact number
 *  - drawing pad: accepted (votes 2, or 1 twice)
 */
async function bench(o: BenchOpts = {}) {
  const numbers = o.numbers ?? Array.from({ length: 21 }, (_, i) => i);
  const seeds = o.seeds ?? 2;
  const fonts = o.fonts ?? availableFonts();
  const styles: Array<{ style: 'strokes' | 'font'; font?: string }> = [{ style: 'strokes' }, ...fonts.map((f) => ({ style: 'font' as const, font: f }))];
  const rows: Record<string, { n: number; hit: number; strong: number; falseAcc: number; open: number; misses: string[] }> = {};
  const t0 = performance.now();
  for (const st of styles) {
    const key = st.style === 'font' ? `font:${st.font}` : 'strokes';
    const row = (rows[key] = { n: 0, hit: 0, strong: 0, falseAcc: 0, open: 0, misses: [] as string[] });
    for (const n of numbers) for (let s = 0; s < (st.style === 'font' ? 1 : seeds); s++) {
      const frame = cameraFrame(String(n), { ...st, seed: 1000 * n + s + 1 });
      const j = await readFrameFor(frame, n);
      const wrong = await readFrameFor(frame, n + 1);
      const open = await readFrameOpen(frame);
      row.n++;
      if (j.votes >= 1) row.hit++; else row.misses.push(`${n}→${j.seen ?? '∅'}`);
      if (j.votes === 2) row.strong++;
      if (wrong.votes >= 1) row.falseAcc++;
      if (open === n) row.open++;
    }
  }
  // Drawing pad.
  const draw = { n: 0, hit: 0, falseAcc: 0, misses: [] as string[] };
  for (const n of numbers) for (let s = 0; s < seeds + 1; s++) {
    const { canvas, ink } = drawingCanvas(String(n), { seed: 77 * n + s + 5 });
    const j = await readDrawingFor(canvas, ink, n, false, () => false);
    const wrong = await readDrawingFor(canvas, ink, n + 1, false, () => false);
    draw.n++;
    if (j.votes >= 2) draw.hit++; else draw.misses.push(`${n}→${j.seen ?? '∅'}(${j.votes})`);
    if (wrong.votes >= 2) draw.falseAcc++;
  }
  const pct = (a: number, b: number) => `${Math.round((100 * a) / Math.max(1, b))}%`;
  return {
    seconds: Math.round((performance.now() - t0) / 100) / 10,
    camera: Object.fromEntries(Object.entries(rows).map(([k, r]) => [k, {
      samples: r.n, accepted: pct(r.hit, r.n), strong: pct(r.strong, r.n), falseAccept: pct(r.falseAcc, r.n), openRead: pct(r.open, r.n), misses: r.misses.join(' '),
    }])),
    drawing: { samples: draw.n, acceptedFirstRead: pct(draw.hit, draw.n), falseAccept: pct(draw.falseAcc, draw.n), misses: draw.misses.join(' ') },
  };
}

w.__kdDigits = { bench, cameraFrame, drawingCanvas, readFrameFor, readFrameOpen, readDrawingFor, availableFonts };
