/*
  Dev/test only: synthetic "handwritten" numbers, so recognition can be
  tested without a webcam. Two styles:
    * strokes — per-digit polyline templates, smoothed, with random slant,
      rotation, size and wobble (like a child's marker)
    * font    — a handwriting-like system font (Bradley Hand, Chalkboard…)
  Used by devHook.ts (bench + pointer-stroke simulation).
*/

type P = [number, number];

/** Digit templates in a 0.6 × 1 box (y down). One array per stroke. */
const T: Record<string, P[][]> = {
  0: [Array.from({ length: 25 }, (_, i) => {
    const a = -Math.PI / 2 + (i / 24) * Math.PI * 2;
    return [0.3 + 0.27 * Math.cos(a), 0.5 + 0.48 * Math.sin(a)] as P;
  })],
  1: [[[0.1, 0.24], [0.33, 0.02], [0.33, 1]]],
  2: [[[0.06, 0.28], [0.15, 0.08], [0.32, 0.02], [0.5, 0.1], [0.55, 0.28], [0.45, 0.5], [0.25, 0.72], [0.05, 0.97], [0.6, 0.97]]],
  3: [[[0.06, 0.12], [0.25, 0.02], [0.48, 0.08], [0.52, 0.25], [0.4, 0.43], [0.22, 0.48], [0.42, 0.52], [0.56, 0.7], [0.5, 0.9], [0.28, 0.99], [0.05, 0.9]]],
  4: [[[0.4, 0.02], [0.03, 0.68], [0.6, 0.68]], [[0.45, 0.32], [0.45, 1]]],
  5: [[[0.56, 0.03], [0.13, 0.03], [0.09, 0.45], [0.3, 0.38], [0.5, 0.45], [0.58, 0.68], [0.5, 0.9], [0.28, 0.99], [0.05, 0.9]]],
  6: [[[0.5, 0.04], [0.3, 0.15], [0.12, 0.4], [0.06, 0.68], [0.15, 0.92], [0.32, 0.99], [0.5, 0.9], [0.56, 0.7], [0.45, 0.55], [0.28, 0.53], [0.1, 0.65]]],
  7: [[[0.03, 0.04], [0.58, 0.04], [0.35, 0.5], [0.22, 0.98]]],
  8: [[[0.5, 0.12], [0.3, 0.02], [0.1, 0.12], [0.12, 0.32], [0.3, 0.48], [0.52, 0.65], [0.55, 0.86], [0.3, 0.99], [0.06, 0.86], [0.1, 0.65], [0.3, 0.48], [0.48, 0.32], [0.5, 0.12]]],
  9: [[[0.52, 0.22], [0.4, 0.04], [0.22, 0.03], [0.07, 0.18], [0.1, 0.38], [0.3, 0.45], [0.52, 0.3], [0.52, 0.22], [0.5, 0.6], [0.45, 0.98]]],
};

/** Catmull-Rom smoothing. */
function smooth(pts: P[], per = 6): P[] {
  if (pts.length < 3) return pts;
  const out: P[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)) as P);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Random in [a, b). Seeded so a bench is repeatable. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return (a: number, b: number) => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return a + (s / 4294967296) * (b - a);
  };
}

/**
 * Strokes for a number, fitted into a box (pixels). Each digit gets its own
 * random slant / rotation / size / wobble.
 */
export function numberStrokes(text: string, box: { x: number; y: number; w: number; h: number }, rnd = rng(Date.now())): P[][] {
  const n = text.length;
  const unitW = 0.6, gap = 0.22;
  const totalW = n * unitW + (n - 1) * gap;
  const s = Math.min(box.h / 1.15, box.w / (totalW * 1.15));
  const ox = box.x + (box.w - totalW * s) / 2, oy = box.y + (box.h - s) / 2;
  const all: P[][] = [];
  [...text].forEach((ch, i) => {
    const tpl = T[ch];
    if (!tpl) return;
    const slant = rnd(-0.18, 0.12), rot = rnd(-0.1, 0.1), sx = rnd(0.85, 1.12), sy = rnd(0.88, 1.08);
    const dx = rnd(-0.05, 0.05), dy = rnd(-0.06, 0.06);
    const cx = 0.3, cy = 0.5;
    for (const stroke of tpl) {
      const pts = smooth(stroke).map(([x, y]) => {
        let X = (x - cx) * sx, Y = (y - cy) * sy;
        X += -Y * slant;
        const c = Math.cos(rot), si = Math.sin(rot);
        [X, Y] = [X * c - Y * si, X * si + Y * c];
        X += rnd(-0.012, 0.012); Y += rnd(-0.012, 0.012);
        return [ox + (i * (unitW + gap) + cx + X + dx) * s, oy + (cy + Y + dy) * s] as P;
      });
      all.push(pts);
    }
  });
  return all;
}

export function strokePath(g: CanvasRenderingContext2D, strokes: P[][], width: number, color: string) {
  g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = width; g.strokeStyle = color;
  for (const s of strokes) {
    g.beginPath();
    g.moveTo(s[0][0], s[0][1]);
    for (const p of s.slice(1)) g.lineTo(p[0], p[1]);
    g.stroke();
  }
}

export const HAND_FONTS = ['Bradley Hand', 'Chalkboard SE', 'Marker Felt', 'Noteworthy', 'Comic Sans MS', 'Segoe Print', 'Arial'];

/** Fonts from HAND_FONTS that are really installed (not the fallback). */
export function availableFonts(): string[] {
  const c = document.createElement('canvas').getContext('2d')!;
  const probe = '0123456789';
  c.font = '40px monospace';
  const base = c.measureText(probe).width;
  c.font = '40px serif';
  const base2 = c.measureText(probe).width;
  return HAND_FONTS.filter((f) => {
    c.font = `40px "${f}", monospace`;
    const a = c.measureText(probe).width;
    c.font = `40px "${f}", serif`;
    const b = c.measureText(probe).width;
    return a !== base || b !== base2;
  });
}

/**
 * A synthetic webcam frame (1280×720): a sheet of paper with uneven light on
 * a darker desk, the number written on it, plus sensor noise.
 */
export function cameraFrame(text: string, opts: { style?: 'strokes' | 'font'; font?: string; seed?: number; ink?: string } = {}): HTMLCanvasElement {
  const rnd = rng(opts.seed ?? Date.now());
  const W = 1280, H = 720;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  // Desk + room.
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#6b5a48'); bg.addColorStop(1, '#3d342b');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // Paper (slightly rotated) with a light gradient (shadow on one side).
  g.save();
  g.translate(W / 2 + rnd(-40, 40), H / 2 + rnd(-20, 20));
  g.rotate(rnd(-0.06, 0.06));
  const pw = rnd(700, 860), ph = rnd(430, 520);
  const pg = g.createLinearGradient(-pw / 2, 0, pw / 2, 0);
  pg.addColorStop(0, '#f2efe8'); pg.addColorStop(1, `rgb(${rnd(185, 215) | 0},${rnd(180, 210) | 0},${rnd(170, 200) | 0})`);
  g.fillStyle = pg; g.fillRect(-pw / 2, -ph / 2, pw, ph);
  const box = { x: -pw * 0.38, y: -ph * 0.36, w: pw * 0.76, h: ph * 0.72 };
  const ink = opts.ink ?? (rnd(0, 1) < 0.5 ? '#1b1f2a' : '#1d2f6b');
  if (opts.style === 'font') {
    const font = opts.font ?? 'Bradley Hand';
    g.fillStyle = ink;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    let size = box.h * 0.9;
    g.font = `bold ${size}px "${font}", cursive`;
    const w = g.measureText(text).width;
    if (w > box.w) { size *= box.w / w; g.font = `bold ${size}px "${font}", cursive`; }
    g.fillText(text, 0, 0);
  } else {
    const digitH = Math.min(box.h, rnd(0.65, 1) * box.h);
    const strokes = numberStrokes(text, { ...box, y: box.y + (box.h - digitH) / 2, h: digitH }, rnd);
    strokePath(g, strokes, digitH * rnd(0.06, 0.1), ink);
  }
  g.restore();
  // Sensor noise.
  const img = g.getImageData(0, 0, W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = rnd(-14, 14);
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** A drawing like the pad makes: white canvas, dark strokes. Returns the canvas + ink box. */
export function drawingCanvas(text: string, opts: { seed?: number; w?: number; h?: number } = {}) {
  const rnd = rng(opts.seed ?? Date.now());
  const W = opts.w ?? 1000, H = opts.h ?? 560;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
  const hh = rnd(0.35, 0.75) * H;
  const box = { x: rnd(0.05, 0.25) * W, y: rnd(0.05, 0.95 - hh / H) * H, w: W * 0.55, h: hh };
  const strokes = numberStrokes(text, box, rnd);
  const lw = Math.max(10, H / 20);
  strokePath(g, strokes, lw, '#1F2937');
  const pts = strokes.flat();
  const ink = {
    x0: Math.min(...pts.map((p) => p[0])) - lw / 2, y0: Math.min(...pts.map((p) => p[1])) - lw / 2,
    x1: Math.max(...pts.map((p) => p[0])) + lw / 2, y1: Math.max(...pts.map((p) => p[1])) + lw / 2,
  };
  return { canvas: c, ink };
}
