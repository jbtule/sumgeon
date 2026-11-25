// Sigils: reading a digit drawn with a finger, for spell casting (app.js). A $P point-cloud
// recognizer (Vatavu, Anthony and Wobbrock, 2012), all on the device: no machine learning, no
// server. A drawing becomes a cloud of points, resampled, scaled and centered, and is compared
// with every template; $P doesn't care about stroke order or direction, which suits kids.
// No DOM: runs in Node for the tests.
//
// Templates are drawn here in a 100 × 100 box (y down), several per digit for how kids write
// them, plus mirrored copies that mean "reversed". Each player's clearly read drawings are added
// as personal templates (app.js), so it learns their handwriting.

const N = 32; // points per cloud

/* ---------- the templates ---------- */
// A run of points along an ellipse: center, radii, from and to angles in degrees (0 is right,
// 90 is down, since y points down).
function arc(cx, cy, rx, ry, a0, a1, steps = 16) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const a = (a0 + (a1 - a0) * i / steps) * Math.PI / 180;
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return out;
}
const line = (...pts) => pts;
const join = (...parts) => parts.flat();

// [digit, name, strokes]; a stroke is [[x, y], ...].
const SHAPES = [
  [0, "oval", [arc(50, 50, 30, 45, -90, 270, 28)]],
  [0, "narrow oval", [arc(50, 50, 20, 45, -90, 270, 28)]],
  [1, "line", [line([50, 5], [50, 95])], "same mirrored"],
  [1, "with a flag", [line([33, 24], [50, 5], [50, 95])]],
  [1, "with a flag and base", [line([33, 24], [50, 5], [50, 95]), line([30, 95], [70, 95])]],
  [2, "plain", [join(arc(50, 30, 26, 24, -165, 15), line([22, 93], [82, 93]))]],
  [2, "small hook", [join(arc(50, 24, 24, 17, -175, 5), line([20, 94], [86, 94]))]],
  [2, "with a loop", [join(arc(50, 30, 26, 24, -165, 15), line([30, 82]), arc(32, 84, 9, 8, 0, 360, 12), line([82, 92]))]],
  [3, "curly", [join(arc(48, 28, 26, 22, -155, 90), arc(48, 72, 28, 23, -90, 155))]],
  [3, "flat top", [join(line([24, 8], [74, 8], [46, 40]), arc(48, 68, 28, 24, -100, 155))]],
  [4, "open", [line([28, 5], [24, 58], [82, 58]), line([66, 14], [66, 95])]],
  [4, "closed", [line([64, 5], [18, 62], [86, 62]), line([64, 5], [64, 95])]],
  // A high crossbar and a long stem below it, the way many people write 4 (it read as a 9:
  // a head on top and a long tail). Open and closed.
  [4, "open, high bar", [line([28, 4], [24, 40], [84, 38]), line([60, 2], [66, 98])]],
  [4, "closed, high bar", [line([60, 3], [20, 40], [84, 40]), line([60, 3], [62, 98])]],
  [5, "one stroke", [join(line([74, 8], [30, 8], [28, 46]), arc(48, 67, 27, 25, -125, 150))]],
  [5, "big belly", [join(line([72, 6], [32, 6], [30, 40]), arc(46, 64, 30, 30, -115, 155))]],
  [5, "hat after", [join(line([30, 8], [28, 46]), arc(48, 67, 27, 25, -125, 150)), line([30, 8], [74, 8])]],
  [6, "curl", [join(line([68, 6], [50, 14], [36, 30], [29, 50]), arc(50, 72, 22, 21, 180, 540, 24))]],
  [7, "plain", [line([20, 8], [80, 8], [40, 95])]],
  [7, "with a crossbar", [line([20, 8], [80, 8], [40, 95]), line([34, 52], [72, 52])]],
  [8, "figure eight", [join(arc(50, 28, 20, 20, 90, -270, 20), arc(50, 72, 24, 22, -90, 270, 22))]],
  [8, "two circles", [arc(50, 28, 20, 20, 0, 360, 20), arc(50, 72, 24, 22, 0, 360, 22)]],
  [9, "straight", [join(arc(48, 30, 24, 22, 0, 360, 20), line([72, 30], [70, 95]))]],
  // A small head and a long tail: the 9 that a high-bar 4 would otherwise take.
  [9, "small head", [join(arc(48, 20, 20, 17, 0, 360, 20), line([68, 20], [68, 97]))]],
  [9, "curly", [join(arc(48, 30, 24, 22, 0, 360, 20), line([72, 30], [72, 70], [62, 90], [45, 95], [30, 88]))]]
];
// Digits whose mirror image is a different shape: the mirror means it's written backwards.
const CAN_REVERSE = new Set([1, 2, 3, 4, 5, 6, 7, 9]);
const mirror = (strokes) => strokes.map((s) => s.map(([x, y]) => [100 - x, y]));

/* ---------- $P ---------- */
// Strokes ([[x, y], ...], ...) to a cloud of N points, resampled along the path, scaled to its
// longer side and centered on its centroid.
export function cloud(strokes) {
  const pts = [];
  strokes.forEach((s, id) => s.forEach(([x, y]) => pts.push({ x, y, id })));
  if (pts.length < 2) return null;
  return center(scale(resample(pts, N)));
}
function resample(pts, n) {
  let length = 0;
  for (let i = 1; i < pts.length; i++) if (pts[i].id === pts[i - 1].id) length += dist(pts[i - 1], pts[i]);
  const step = length / (n - 1), out = [pts[0]];
  if (!(step > 0)) return Array.from({ length: n }, () => ({ ...pts[0] }));
  let D = 0;
  const p = pts.map((q) => ({ ...q }));
  for (let i = 1; i < p.length; i++) {
    if (p[i].id !== p[i - 1].id) continue;
    const d = dist(p[i - 1], p[i]);
    if (D + d >= step) {
      const t = (step - D) / d, q = { x: p[i - 1].x + t * (p[i].x - p[i - 1].x), y: p[i - 1].y + t * (p[i].y - p[i - 1].y), id: p[i].id };
      out.push(q); p.splice(i, 0, q); D = 0;
    } else D += d;
  }
  while (out.length < n) out.push({ ...p[p.length - 1] });
  return out.slice(0, n);
}
function scale(pts) {
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const minX = Math.min(...xs), minY = Math.min(...ys), size = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY) || 1;
  return pts.map((p) => ({ x: (p.x - minX) / size, y: (p.y - minY) / size, id: p.id }));
}
function center(pts) {
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length, cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  return pts.map((p) => ({ x: p.x - cx, y: p.y - cy, id: p.id }));
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function greedy(a, b) {
  const step = Math.floor(Math.pow(N, 0.5));
  let best = Infinity;
  for (let i = 0; i < N; i += step) best = Math.min(best, cloudDistance(a, b, i), cloudDistance(b, a, i));
  return best;
}
function cloudDistance(a, b, start) {
  const used = new Array(N).fill(false);
  let sum = 0, i = start;
  do {
    let min = Infinity, idx = -1;
    for (let j = 0; j < N; j++) if (!used[j]) { const d = dist(a[i], b[j]); if (d < min) { min = d; idx = j; } }
    used[idx] = true;
    sum += (1 - ((i - start + N) % N) / N) * min;
    i = (i + 1) % N;
  } while (i !== start);
  return sum;
}

/* ---------- reading a drawing ---------- */
// The built-in templates, each { digit, reversed, name, points }.
export const TEMPLATES = SHAPES.flatMap(([digit, name, strokes, symmetric]) => {
  const out = [{ digit, reversed: false, name, points: cloud(strokes) }];
  if (CAN_REVERSE.has(digit) && !symmetric) out.push({ digit, reversed: true, name: name + ", backwards", points: cloud(mirror(strokes)) });
  return out;
});
export const SHAPES_FOR_TESTS = SHAPES.map(([digit, name, strokes, symmetric]) => ({ digit, name, strokes, symmetric: !!symmetric }));
export { mirror };

// How sure a read must be to count (both): the drawing is close to its best template (fit), and
// clearly closer to it than to any other digit (margin). Which way round it faces is a separate
// question: it only counts as reversed when the mirror image is clearly the better match
// (REVERSED_MARGIN), so a wobbly 1 gets the benefit of the doubt.
export const CLEAR = { fit: 0.3, margin: 0.12 };
export const REVERSED_MARGIN = 0.12;

// Reads strokes as a digit. personal: [{ digit, points }] learned from this player.
// Returns { digit, reversed, fit, margin, clear, name, others: [{ digit, fit }], points } or
// null for nothing drawn. fit runs 0–1 (1 is a perfect match); margin is how much better the
// best digit is than the next digit.
export function read(strokes, personal) {
  const c = cloud(strokes);
  if (!c) return null;
  const all = TEMPLATES.concat((personal || []).map((p) => ({ digit: p.digit, reversed: false, name: "yours", points: p.points })));
  const scored = all.map((t) => ({ t, d: greedy(c, t.points) })).sort((a, b) => a.d - b.d);
  // The best template for each digit, either way round.
  const byDigit = [], seen = new Set();
  for (const s of scored) if (!seen.has(s.t.digit)) { seen.add(s.t.digit); byDigit.push(s); }
  const top = byDigit[0], next = byDigit[1], digit = top.t.digit;
  const fit = (d) => Math.max(0, 1 - d / 3);
  const margin = next ? Math.max(0, (next.d - top.d) / next.d) : 1;
  // Which way round: the best forward and the best backwards template of this digit.
  const fwd = scored.find((s) => s.t.digit === digit && !s.t.reversed), back = scored.find((s) => s.t.digit === digit && s.t.reversed);
  const reversed = !!back && (!fwd || (fwd.d - back.d) / fwd.d >= REVERSED_MARGIN);
  const name = (reversed ? back : fwd || top).t.name;
  return {
    digit, reversed, name, fit: fit(top.d), margin,
    clear: fit(top.d) >= CLEAR.fit && margin >= CLEAR.margin,
    others: byDigit.slice(1, 4).map((s) => ({ digit: s.t.digit, fit: fit(s.d) })),
    points: c
  };
}
