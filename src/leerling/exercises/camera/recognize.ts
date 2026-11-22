/*
  Number recognition for the camera / drawing exercises — replaces Apple
  Vision (iOS NumberVisionService). Ported from RekenClubWeb (js/digits.js +
  js/ocr.js), where it already works:

    1. crop + threshold (adaptive for camera frames, so shadows don't matter)
    2. connected components → digit blobs (fragments of one digit merged)
    3. every blob → 28×28 MNIST-style image → small CNN (public/leerling-models/digits)
    4. Tesseract.js reads the whole number as a second opinion
    5. judge() fuses both, knowing the expected answer (votes 0 / 1 / 2)

  TensorFlow.js and Tesseract.js are loaded lazily (dynamic import), so they
  never end up in the main bundle. Tesseract fetches its worker, wasm core and
  language data from its default CDN.
*/
import type * as TF from '@tensorflow/tfjs';
import type Tesseract from 'tesseract.js';

export type Source = HTMLCanvasElement | HTMLVideoElement | HTMLImageElement;
export interface Region { x: number; y: number; w: number; h: number }
export const FULL: Region = { x: 0, y: 0, w: 1, h: 1 };

const MODEL_URL = '/leerling-models/digits/model.json';

// Dev-only test hooks (window.__kdCamera / __kdDraw / __kdDigits).
if (import.meta.env.DEV && typeof window !== 'undefined') void import('./devHook');

/* ------------------------------------------------------------------ */
/* Lazy loading                                                         */
/* ------------------------------------------------------------------ */

let tfMod: typeof TF | null = null;
let modelPromise: Promise<TF.LayersModel> | null = null;

/** Load TensorFlow.js + the MNIST digit model once. */
export function loadDigitModel(): Promise<TF.LayersModel> {
  modelPromise ??= (async () => {
    const tf = await import('@tensorflow/tfjs');
    tfMod = tf;
    const m = await tf.loadLayersModel(MODEL_URL);
    tf.tidy(() => { m.predict(tf.zeros([1, 28, 28, 1])); }); // warm up
    return m;
  })().catch((e) => { modelPromise = null; throw e; });
  return modelPromise;
}

let digitWorker: Promise<Tesseract.Worker> | null = null;
function getDigitWorker(): Promise<Tesseract.Worker> {
  digitWorker ??= (async () => {
    const mod = await import('tesseract.js');
    const T = ((mod as unknown as { default?: typeof Tesseract }).default ?? mod) as typeof Tesseract;
    const w = await T.createWorker('eng', 1);
    await w.setParameters({ tessedit_char_whitelist: '0123456789,.', preserve_interword_spaces: '1' });
    return w;
  })().catch((e) => { digitWorker = null; throw e; });
  return digitWorker;
}

/** Start downloading both engines in the background (camera / draw opened). */
export function warmUp() {
  loadDigitModel().catch(() => {});
  getDigitWorker().catch(() => {});
}

/* ------------------------------------------------------------------ */
/* 1. crop + threshold                                                  */
/* ------------------------------------------------------------------ */

export function sourceSize(src: Source): { w: number; h: number } {
  if (src instanceof HTMLVideoElement) return { w: src.videoWidth, h: src.videoHeight };
  if (src instanceof HTMLImageElement) return { w: src.naturalWidth, h: src.naturalHeight };
  return { w: src.width, h: src.height };
}

interface Mask { mask: Uint8Array; W: number; H: number }

function binarize(src: Source, region: Region, adaptive: boolean, workH: number): Mask {
  const { w: SW, h: SH } = sourceSize(src);
  const sx = region.x * SW, sy = region.y * SH, sw = region.w * SW, sh = region.h * SH;
  const scale = Math.min(1.5, workH / sh);
  const W = Math.max(8, Math.round(sw * scale)), H = Math.max(8, Math.round(sh * scale));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
  g.drawImage(src, sx, sy, sw, sh, 0, 0, W, H);
  const d = g.getImageData(0, 0, W, H).data;
  const gray = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) gray[i] = (d[i * 4] * 299 + d[i * 4 + 1] * 587 + d[i * 4 + 2] * 114) / 1000;
  const mask = new Uint8Array(W * H);
  if (!adaptive) {
    for (let i = 0; i < W * H; i++) mask[i] = gray[i] < 140 ? 1 : 0;
    return { mask, W, H };
  }
  // Adaptive (Bradley) threshold with an integral image: ink = clearly darker
  // than its neighbourhood. Robust to uneven light and shadows on paper.
  const I = new Float64Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) {
    let row = 0;
    for (let x = 0; x < W; x++) { row += gray[y * W + x]; I[(y + 1) * (W + 1) + x + 1] = I[y * (W + 1) + x + 1] + row; }
  }
  const r = Math.max(6, Math.round(H / 7));
  let lo = 255, hi = 0;
  for (let i = 0; i < W * H; i++) { if (gray[i] < lo) lo = gray[i]; if (gray[i] > hi) hi = gray[i]; }
  const contrast = hi - lo;
  for (let y = 0; y < H; y++) {
    const y0 = Math.max(0, y - r), y1 = Math.min(H, y + r + 1);
    for (let x = 0; x < W; x++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(W, x + r + 1);
      const sum = I[y1 * (W + 1) + x1] - I[y0 * (W + 1) + x1] - I[y1 * (W + 1) + x0] + I[y0 * (W + 1) + x0];
      const mean = sum / ((x1 - x0) * (y1 - y0));
      mask[y * W + x] = gray[y * W + x] < mean * 0.78 && mean - gray[y * W + x] > contrast * 0.18 ? 1 : 0;
    }
  }
  return { mask, W, H };
}

/* ------------------------------------------------------------------ */
/* 2. connected components → digits                                     */
/* ------------------------------------------------------------------ */

interface Blob { x0: number; y0: number; x1: number; y1: number; area: number; pixels: number[]; border: boolean }

function components({ mask, W, H }: Mask): Blob[] {
  const label = new Int32Array(W * H).fill(-1);
  const comps: Blob[] = [];
  const stack: number[] = [];
  for (let start = 0; start < W * H; start++) {
    if (!mask[start] || label[start] !== -1) continue;
    const id = comps.length;
    const c: Blob = { x0: W, y0: H, x1: 0, y1: 0, area: 0, pixels: [], border: false };
    label[start] = id; stack.push(start);
    while (stack.length) {
      const p = stack.pop()!;
      const x = p % W, y = (p / W) | 0;
      c.area++; c.pixels.push(p);
      if (x < c.x0) c.x0 = x;
      if (x > c.x1) c.x1 = x;
      if (y < c.y0) c.y0 = y;
      if (y > c.y1) c.y1 = y;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) c.border = true;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const q = yy * W + xx;
        if (mask[q] && label[q] === -1) { label[q] = id; stack.push(q); }
      }
    }
    comps.push(c);
  }
  return comps;
}

const bw = (c: Blob) => c.x1 - c.x0 + 1;
const bh = (c: Blob) => c.y1 - c.y0 + 1;

function mergeInto(a: Blob, b: Blob) {
  a.x0 = Math.min(a.x0, b.x0); a.y0 = Math.min(a.y0, b.y0); a.x1 = Math.max(a.x1, b.x1); a.y1 = Math.max(a.y1, b.y1);
  a.area += b.area; a.pixels = a.pixels.concat(b.pixels);
}

/** A blob much wider than tall is usually touching digits: cut at the thinnest columns. */
function splitWide(c: Blob, W: number): Blob[] | null {
  const w = bw(c), h = bh(c);
  if (w < h * 1.1) return null;
  const n = Math.min(4, Math.max(2, Math.round(w / (h * 0.72))));
  const col = new Int32Array(w);
  for (const p of c.pixels) col[(p % W) - c.x0]++;
  const cuts: number[] = [];
  for (let k = 1; k < n; k++) {
    const centre = Math.round((k * w) / n), span = Math.round((w / n) * 0.3);
    let best = centre;
    for (let x = Math.max(1, centre - span); x <= Math.min(w - 2, centre + span); x++) if (col[x] < col[best]) best = x;
    cuts.push(best);
  }
  const parts: Blob[] = Array.from({ length: n }, () => ({ x0: W, y0: Infinity, x1: 0, y1: 0, area: 0, pixels: [], border: c.border }));
  for (const p of c.pixels) {
    const x = (p % W) - c.x0, y = (p / W) | 0;
    let k = 0;
    while (k < cuts.length && x >= cuts[k]) k++;
    const q = parts[k];
    q.pixels.push(p); q.area++;
    if (x + c.x0 < q.x0) q.x0 = x + c.x0;
    if (x + c.x0 > q.x1) q.x1 = x + c.x0;
    if (y < q.y0) q.y0 = y;
    if (y > q.y1) q.y1 = y;
  }
  const ok = parts.filter((q) => q.area > 0);
  return ok.length > 1 ? ok : null;
}

/** Group blobs into digits (left → right) and find a decimal comma. */
function layout(comps: Blob[], W: number, H: number, camera: boolean): { digits: Blob[]; commaAt: number } {
  const cs = comps.filter((c) => c.area >= Math.max(6, W * H * 0.0004) && !(camera && c.border && (bh(c) > H * 0.6 || bw(c) > W * 0.5)));
  if (!cs.length) return { digits: [], commaAt: -1 };
  const maxH = Math.max(...cs.map(bh));
  if (maxH < H * (camera ? 0.18 : 0.08)) return { digits: [], commaAt: -1 };
  const big = cs.filter((c) => bh(c) >= maxH * 0.45);
  const small = cs.filter((c) => bh(c) < maxH * 0.45);
  big.sort((a, b) => a.x0 - b.x0);
  const digits: Blob[] = [];
  for (const c of big) {
    const last = digits[digits.length - 1];
    if (last) {
      const ov = Math.min(last.x1, c.x1) - Math.max(last.x0, c.x0);
      const narrow = Math.min(bw(last), bw(c));
      const shorter = bh(last) < bh(c) ? last : c;
      // A tall thin stroke is a "1", not a fragment — even when it's a bit shorter.
      const oneLike = bh(shorter) > 2.2 * bw(shorter) && bh(shorter) >= maxH * 0.5;
      const fragment = bh(shorter) < maxH * 0.72 && !oneLike;
      if ((fragment && ov > 0.3 * narrow) || (ov > 0.85 * narrow && !oneLike)) { mergeInto(last, c); continue; }
    }
    digits.push({ ...c, pixels: c.pixels.slice() });
  }
  const baseline = digits.reduce((s, d) => s + d.y1, 0) / digits.length;
  let commaAt = -1;
  for (const s of small) {
    const host = digits.find((d) => s.x0 >= d.x0 - 2 && s.x1 <= d.x1 + 2);
    if (host) { mergeInto(host, s); continue; }
    const cx = (s.x0 + s.x1) / 2;
    const i = digits.findIndex((d, k) => k < digits.length - 1 && cx > d.x1 && cx < digits[k + 1].x0);
    if (i >= 0 && s.y0 > baseline - maxH * 0.45 && bh(s) < maxH * 0.45) commaAt = i + 1;
  }
  return { digits: digits.filter((d) => bh(d) >= maxH * 0.45), commaAt };
}

/* ------------------------------------------------------------------ */
/* 3. digit → 28×28 MNIST-style image                                   */
/* ------------------------------------------------------------------ */

function toMnist(d: Blob, W: number): Float32Array {
  const w = bw(d), h = bh(d);
  const set = new Uint8Array(w * h);
  for (const p of d.pixels) set[(((p / W) | 0) - d.y0) * w + ((p % W) - d.x0)] = 1;
  let perim = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!set[y * w + x]) continue;
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1 || !set[y * w + x - 1] || !set[y * w + x + 1] || !set[(y - 1) * w + x] || !set[(y + 1) * w + x]) perim++;
  }
  const thick = Math.max(1, (2 * d.area) / Math.max(1, perim));
  const f = 20 / Math.max(w, h);
  // MNIST strokes are ~2.5 px at this scale: thicken thin ink.
  const want = 2.4 / f;
  const grow = Math.max(0, Math.round((want - thick) / 2));
  const pad = grow + 1;
  const PW = w + pad * 2, PH = h + pad * 2;
  const img = new ImageData(PW, PH);
  const put = (x: number, y: number) => { const i = (y * PW + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = 255; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!set[y * w + x]) continue;
    for (let dy = -grow; dy <= grow; dy++) for (let dx = -grow; dx <= grow; dx++) {
      if (dx * dx + dy * dy > grow * grow + 0.5) continue;
      put(x + pad + dx, y + pad + dy);
    }
  }
  for (let i = 3; i < img.data.length; i += 4) if (!img.data[i]) img.data[i] = 255; // opaque black bg
  const a = document.createElement('canvas'); a.width = PW; a.height = PH;
  a.getContext('2d')!.putImageData(img, 0, 0);
  const g2 = 20 / Math.max(PW - 2, PH - 2);
  const tw = Math.max(1, Math.round(PW * g2)), th = Math.max(1, Math.round(PH * g2));
  const b = document.createElement('canvas'); b.width = 28; b.height = 28;
  const bg = b.getContext('2d', { willReadFrequently: true })!;
  bg.fillStyle = '#000'; bg.fillRect(0, 0, 28, 28);
  bg.imageSmoothingQuality = 'high';
  bg.drawImage(a, (28 - tw) / 2, (28 - th) / 2, tw, th);
  let px = bg.getImageData(0, 0, 28, 28).data;
  // Centre by centre of mass (as MNIST does).
  let m = 0, mx = 0, my = 0;
  for (let i = 0; i < 784; i++) { const v = px[i * 4]; m += v; mx += v * (i % 28); my += v * ((i / 28) | 0); }
  if (m > 0) {
    const ox = Math.round(14 - mx / m), oy = Math.round(14 - my / m);
    if (ox || oy) {
      bg.fillRect(0, 0, 28, 28);
      bg.drawImage(a, (28 - tw) / 2 + ox, (28 - th) / 2 + oy, tw, th);
      px = bg.getImageData(0, 0, 28, 28).data;
    }
  }
  const out = new Float32Array(784);
  for (let i = 0; i < 784; i++) out[i] = px[i * 4] / 255;
  return out;
}

/* ------------------------------------------------------------------ */
/* 4. CNN reading                                                       */
/* ------------------------------------------------------------------ */

export interface CnnReading { probs: number[][]; commaAt: number; text: string; confidence: number }

/** Read the digits in a region with the CNN, or null when nothing digit-like is there. */
export async function readDigits(src: Source, region: Region, camera = false): Promise<CnnReading | null> {
  const model = await loadDigitModel();
  const tf = tfMod!;
  const m = binarize(src, region, camera, camera ? 220 : 200);
  const { digits, commaAt } = layout(components(m), m.W, m.H, camera);
  if (!digits.length || digits.length > 7) return null;
  // Wide blobs may be touching digits: classify them whole AND split, keep the more confident reading.
  const units: Blob[] = [];
  const plan = digits.map((d) => {
    const whole = units.push(d) - 1;
    const parts = splitWide(d, m.W);
    return { whole, parts: parts ? parts.map((q) => units.push(q) - 1) : null };
  });
  const input = new Float32Array(units.length * 784);
  units.forEach((d, i) => input.set(toMnist(d, m.W), i * 784));
  const all = tf.tidy(() => (model.predict(tf.tensor4d(input, [units.length, 28, 28, 1])) as TF.Tensor).arraySync() as number[][]);
  const conf = (p: number[]) => Math.max(...p);
  const probs: number[][] = [];
  let comma = commaAt;
  plan.forEach((pl, i) => {
    const w = all[pl.whole];
    const useSplit = pl.parts && Math.min(...pl.parts.map((k) => conf(all[k]))) > Math.max(0.6, conf(w) + 0.15);
    if (useSplit && pl.parts) {
      pl.parts.forEach((k) => probs.push(all[k]));
      if (commaAt > 0 && i < commaAt) comma += pl.parts.length - 1;
    } else probs.push(w);
  });
  if (probs.length > 7) return null;
  const top = probs.map((p) => p.indexOf(Math.max(...p)));
  let text = top.join('');
  if (comma > 0) text = text.slice(0, comma) + ',' + text.slice(comma);
  return { probs, commaAt: comma, text, confidence: Math.min(...probs.map((p, i) => p[top[i]])) };
}

/* ------------------------------------------------------------------ */
/* 5. Tesseract reading                                                 */
/* ------------------------------------------------------------------ */

function otsu(hist: number[], total: number): number {
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, best = 0, thr = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t]; if (!wB) continue;
    const wF = total - wB; if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB, mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) { best = between; thr = t; }
  }
  return thr;
}

/** Crop + scale + clean black-on-white canvas for Tesseract. */
function preprocess(src: Source, region: Region, targetWidth: number, targetHeight: number | null, binarizeIt: boolean): HTMLCanvasElement {
  const { w: W, h: H } = sourceSize(src);
  const sx = Math.round(region.x * W), sy = Math.round(region.y * H);
  const sw = Math.max(1, Math.round(region.w * W)), sh = Math.max(1, Math.round(region.h * H));
  const scale = targetHeight ? targetHeight / sh : Math.min(2, Math.max(0.4, targetWidth / sw));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(sw * scale)); c.height = Math.max(1, Math.round(sh * scale));
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.imageSmoothingQuality = 'high';
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.drawImage(src, sx, sy, sw, sh, 0, 0, c.width, c.height);
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = img.data, hist = new Array<number>(256).fill(0);
  for (let i = 0; i < d.length; i += 4) {
    const y = ((d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000) | 0;
    d[i] = d[i + 1] = d[i + 2] = y; hist[y]++;
  }
  if (binarizeIt) {
    const t = otsu(hist, d.length / 4);
    for (let i = 0; i < d.length; i += 4) { const v = d[i] > t ? 255 : 0; d[i] = d[i + 1] = d[i + 2] = v; }
  }
  g.putImageData(img, 0, 0);
  return c;
}

export interface TessReading { text: string; confidence: number }

let tessBusy = false;

/**
 * Tesseract on one region. Returns the first number ("45", "3,5") with its
 * confidence, or null. Drawings pass `targetHeight` (ink ~90 px tall) and PSM
 * 8 / 13; camera frames use PSM 7.
 */
export async function readNumberTess(
  src: Source, region: Region,
  { targetWidth = 900, targetHeight = null, psm = '7', minConfidence = 45 }: { targetWidth?: number; targetHeight?: number | null; psm?: string; minConfidence?: number } = {},
): Promise<TessReading | null> {
  if (tessBusy) return null;
  tessBusy = true;
  try {
    const w = await getDigitWorker();
    await w.setParameters({ tessedit_pageseg_mode: psm as unknown as Tesseract.PSM });
    const canvas = preprocess(src, region, targetWidth, targetHeight, true);
    const { data } = await w.recognize(canvas);
    const txt = data.text.replace(/\s+/g, '');
    const m = txt.match(/\d+(?:[.,]\d+)?/);
    if (!m || data.confidence < minConfidence) return null;
    return { text: m[0].replace('.', ','), confidence: data.confidence };
  } catch {
    return null;
  } finally {
    tessBusy = false;
  }
}

/* ------------------------------------------------------------------ */
/* 6. Fusion                                                            */
/* ------------------------------------------------------------------ */

export interface Judgement { votes: 0 | 1 | 2; seen: string | null }

/**
 * Fuse CNN + Tesseract for one snapshot, knowing which number we expect
 * ("12"). 2 = strong evidence the answer is written, 1 = plausible, 0 = no.
 */
export function judge(cnn: CnnReading | null, tess: string | null, expected: string): Judgement {
  const norm = (s: string | null) => (s || '').replace(/\s/g, '').replace(/\./g, ',').replace(/^0+(?=\d)/, '');
  let votes: 0 | 1 | 2 = 0;
  const t = norm(tess);
  if (t === expected) votes = 2;
  if (cnn) {
    const n = cnn.probs.length;
    if (cnn.text === expected && cnn.confidence >= 0.5) votes = 2;
    else if (n === expected.length) {
      let logp = 0, inTop2 = true;
      cnn.probs.forEach((p, i) => {
        const want = +expected[i];
        logp += Math.log(Math.max(1e-6, p[want]));
        const sorted = [...p].sort((a, b) => b - a);
        if (p[want] < sorted[1]) inTop2 = false;
      });
      const gm = Math.exp(logp / n);
      if (inTop2 && gm >= 0.3 && cnn.commaAt < 0) votes = Math.max(votes, gm >= 0.6 ? 2 : 1) as 0 | 1 | 2;
      if (votes === 1 && t === expected) votes = 2;
    }
  }
  const seen = votes ? expected : cleanSeen(cnn?.text) ?? cleanSeen(t);
  return { votes, seen };
}

/** "07" → "7", "3,5" → "4" (integer levels round like iOS SkillLevel.value(fromScaled:)). */
function cleanSeen(s: string | null | undefined): string | null {
  if (!s) return null;
  const v = parseFloat(s.replace(',', '.'));
  return Number.isFinite(v) ? String(Math.round(v)) : null;
}

/* ------------------------------------------------------------------ */
/* High-level entry points used by the exercises                        */
/* ------------------------------------------------------------------ */

/** The part of a camera frame we read (also drawn as a guide over the preview). */
export const CAMERA_REGION: Region = { x: 0.12, y: 0.15, w: 0.76, h: 0.7 };

/** One camera frame, checked against the expected number. */
export async function readFrameFor(frame: Source, expected: number): Promise<Judgement> {
  const [cnn, tess] = await Promise.all([
    readDigits(frame, CAMERA_REGION, true).catch(() => null),
    readNumberTess(frame, CAMERA_REGION),
  ]);
  return judge(cnn, tess?.text ?? null, String(expected));
}

/**
 * One camera frame, open reading (Toon een getal): the number the child
 * shows, or null. Needs the CNN and Tesseract to agree, or one of them to be
 * very sure — a webcam frame is full of things that are not numbers.
 */
export async function readFrameOpen(frame: Source): Promise<number | null> {
  const [cnn, tess] = await Promise.all([
    readDigits(frame, CAMERA_REGION, true).catch(() => null),
    readNumberTess(frame, CAMERA_REGION),
  ]);
  const c = cnn && cnn.commaAt < 0 ? cleanSeen(cnn.text) : null;
  const t = cleanSeen(tess?.text);
  let pick: string | null = null;
  if (c && t && c === t) pick = c;
  else if (c && cnn!.confidence >= 0.9) pick = c;
  else if (t && tess!.confidence >= 75) pick = t;
  return pick === null ? null : parseInt(pick, 10);
}

/**
 * A drawing (white canvas, dark ink) checked against the expected number.
 * The CNN reads first; Tesseract only runs on the ink box when the CNN isn't
 * already sure (and not during live reads while still drawing).
 */
export async function readDrawingFor(
  canvas: HTMLCanvasElement, ink: { x0: number; y0: number; x1: number; y1: number } | null,
  expected: number, live: boolean, isStale: () => boolean,
): Promise<Judgement> {
  const exp = String(expected);
  const cnn = await readDigits(canvas, FULL).catch(() => null);
  let j = judge(cnn, null, exp);
  if (j.votes >= 2 || live || !ink || isStale()) return j;
  const W = canvas.width, H = canvas.height;
  const inkH = Math.max(10, ink.y1 - ink.y0), m = inkH * 0.3;
  const x0 = Math.max(0, ink.x0 - m), y0 = Math.max(0, ink.y0 - m);
  const x1 = Math.min(W, ink.x1 + m), y1 = Math.min(H, ink.y1 + m);
  const region = { x: x0 / W, y: y0 / H, w: (x1 - x0) / W, h: (y1 - y0) / H };
  for (const psm of ['8', '13', '7']) {
    const r = await readNumberTess(canvas, region, { targetHeight: Math.round((90 * (y1 - y0)) / inkH), psm });
    if (isStale()) return j;
    if (!r) continue;
    const j2 = judge(cnn, r.text, exp);
    if (j2.votes > j.votes || (!j.seen && j2.seen)) j = j2;
    if (j.votes >= 2) break;
  }
  return j;
}
