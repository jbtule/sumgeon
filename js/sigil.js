// Sigils: reading a digit drawn with a finger, for spell casting (app.js). A $P point-cloud
// recognizer (Vatavu, Anthony and Wobbrock, 2012), all on the device: no machine learning, no
// server. A drawing becomes a cloud of points, resampled, scaled and centered, and is compared
// with every template; $P doesn't care about stroke order or direction, which suits kids.
// No DOM: runs in Node for the tests.
//
// Templates are drawn here in a 100 × 100 box (y down), several per digit for how kids and
// grown-ups write them, each also slanted and stretched (VARIANTS), plus mirrored copies that
// mean "reversed". They're checked against real drawings in scripts/sigil-fixtures.json. Each
// player's drawings that are a good match for the answer (judge, below) are added as personal
// templates (app.js), so it learns their handwriting; a poor match is shown how to write it.

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
  // A z on top (across, then back to the left), then a belly that sweeps down to the left.
  [3, "z top", [join(line([22, 8], [72, 4], [30, 30], [52, 34], [64, 48], [62, 64], [50, 80], [36, 92], [22, 98]))]],
  [3, "z top, long tail", [line([20, 6], [70, 2], [28, 26], [52, 30], [66, 42], [66, 58], [58, 78], [50, 98])]],
  // A kindergartner's 3 (drawer-2): a round top, a middle point that comes all the way back to
  // the left edge, and a squarish belly.
  [3, "deep middle", [line([2, 4], [22, 1], [42, 6], [58, 16], [64, 30], [58, 44], [42, 48], [6, 48], [30, 54], [56, 64], [68, 76], [68, 90], [60, 99], [36, 97])]],
  [4, "open", [line([28, 5], [24, 58], [82, 58]), line([66, 14], [66, 95])]],
  [4, "closed", [line([64, 5], [18, 62], [86, 62]), line([64, 5], [64, 95])]],
  // A high crossbar and a long stem below it, the way many people write 4 (it read as a 9:
  // a head on top and a long tail). Open and closed.
  [4, "open, high bar", [line([28, 4], [24, 40], [84, 38]), line([60, 2], [66, 98])]],
  [4, "closed, high bar", [line([60, 3], [20, 40], [84, 40]), line([60, 3], [62, 98])]],
  // An open 4 whose crossbar curls up at the end, with the stem crossing its middle.
  [4, "open, curvy bar", [line([22, 2], [22, 44], [44, 44], [64, 46], [76, 42], [82, 32]), line([48, 14], [52, 98])]],
  [5, "one stroke", [join(line([74, 8], [30, 8], [28, 46]), arc(48, 67, 27, 25, -125, 150))]],
  [5, "big belly", [join(line([72, 6], [32, 6], [30, 40]), arc(46, 64, 30, 30, -115, 155))]],
  [5, "hat after", [join(line([30, 8], [28, 46]), arc(48, 67, 27, 25, -125, 150)), line([30, 8], [74, 8])]],
  // A wide top and a belly that runs straight down to the left, in one stroke from the top right.
  [5, "wide, from the top right", [line([88, 4], [36, 2], [30, 32], [46, 36], [70, 40], [74, 56], [60, 68], [36, 84], [10, 98])]],
  [6, "curl", [join(line([68, 6], [50, 14], [36, 30], [29, 50]), arc(50, 72, 22, 21, 180, 540, 24))]],
  // A tall stem that curves into a loop at the bottom.
  [6, "tall stem", [line([30, 2], [18, 12], [14, 34], [16, 56], [22, 74], [36, 62], [52, 60], [64, 68], [62, 86], [50, 98], [34, 98], [22, 88], [20, 76])]],
  // From the top right, over and down the left into one big lemon-shaped loop that fills the
  // digit, closing at the middle on the left.
  [6, "lemon loop", [line([58, 10], [46, 2], [32, 1], [18, 8], [7, 22], [2, 42], [3, 66], [12, 85], [26, 97], [42, 100], [54, 94], [57, 78], [52, 62], [40, 51], [24, 46], [4, 43])]],
  [7, "plain", [line([20, 8], [80, 8], [40, 95])]],
  // The bar slanted up to the right, then a long diagonal.
  [7, "slanted bar", [line([6, 26], [50, 10], [94, 4], [66, 40], [52, 66], [42, 94])]],
  [7, "with a crossbar", [line([20, 8], [80, 8], [40, 95]), line([34, 52], [72, 52])]],
  [8, "figure eight", [join(arc(50, 28, 20, 20, 90, -270, 20), arc(50, 72, 24, 22, -90, 270, 22))]],
  [8, "two circles", [arc(50, 28, 20, 20, 0, 360, 20), arc(50, 72, 24, 22, 0, 360, 22)]],
  // One stroke from the top right: down across the middle, around the bottom, back up through
  // the middle and around a flat top loop.
  [8, "from the top right", [line([78, 2], [60, 16], [46, 30], [36, 46], [56, 50], [70, 60], [74, 76], [66, 92], [48, 100], [30, 96], [24, 80], [28, 62], [34, 48], [18, 46], [4, 42], [10, 32], [28, 26], [48, 20], [56, 18])]],
  // Slanted, with a thin top loop leaning right and a small round bottom loop, in one stroke.
  [8, "slanted, thin top", [line([46, 2], [26, 6], [11, 18], [4, 38], [6, 57], [17, 68], [32, 76], [42, 88], [34, 99], [16, 100], [4, 92], [2, 77], [12, 62], [24, 46], [36, 28], [46, 12], [40, 1])]],
  [9, "straight", [join(arc(48, 30, 24, 22, 0, 360, 20), line([72, 30], [70, 95]))]],
  // A small head and a long tail: the 9 that a high-bar 4 would otherwise take.
  [9, "small head", [join(arc(48, 20, 20, 17, 0, 360, 20), line([68, 20], [68, 97]))]],
  // A pointed head, then a slanted stem that starts above it.
  [9, "pointed head", [line([42, 6], [22, 12], [6, 22], [2, 32], [16, 36], [30, 30], [40, 18], [44, 8]), line([48, 0], [40, 34], [26, 100])]],
  [9, "pointed head, upright", [line([50, 6], [30, 10], [14, 20], [10, 32], [24, 36], [38, 30], [48, 18], [52, 8]), line([54, 0], [52, 34], [50, 100])]],
  [9, "curly", [join(arc(48, 30, 24, 22, 0, 360, 20), line([72, 30], [72, 70], [62, 90], [45, 95], [30, 88]))]],
  // Like a "g": a big tilted head down to the left, then a stem with a hook back to the left.
  [9, "like a g", [line([54, 6], [34, 2], [16, 10], [6, 24], [8, 40], [22, 46], [40, 40], [52, 24], [56, 6], [58, 30], [58, 66], [56, 84], [46, 96], [30, 100], [14, 94], [6, 82])]]
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
// Variants of each shape, since $P scales a drawing evenly: a slanted or a stretched digit is a
// different cloud. [name, x shear (dx per dy), x stretch]. Slant is about 14° each way.
export const VARIANTS = [["", 0, 1], ["slanted right", -0.25, 1], ["slanted left", 0.25, 1], ["narrow", 0, 0.7], ["wide", 0, 1.4]];
const warp = (strokes, k, sx) => strokes.map((s) => s.map(([x, y]) => [50 + (x - 50) * sx + k * (y - 50), y]));

// The built-in templates, each { digit, reversed, name, points }: every shape in every variant,
// and its mirror: reversed for a digit that can face the wrong way, or the same digit drawn the
// other way round for 0 and 8 (an 8 begun at the top left).
export const TEMPLATES = SHAPES.flatMap(([digit, name, strokes, symmetric]) => {
  const ways = [[false, "", strokes]];
  if (!symmetric) ways.push(CAN_REVERSE.has(digit) ? [true, ", backwards", mirror(strokes)] : [false, ", mirrored", mirror(strokes)]);
  return ways.flatMap(([reversed, suffix, st]) => VARIANTS.map(([v, k, sx]) =>
    ({ digit, reversed, name: name + suffix + (v ? `, ${v}` : ""), points: cloud(warp(st, k, sx)) })));
});
export const SHAPES_FOR_TESTS = SHAPES.map(([digit, name, strokes, symmetric]) => ({ digit, name, strokes, symmetric: !!symmetric }));
export { mirror };
// The $P match itself (a distance; 0 is the same cloud), for other readers built on it
// (js/shapes.js).
export { greedy as cloudMatch };

// How sure a read must be to count (both): the drawing is close to its best template (fit), and
// clearly closer to it than to any other digit (margin), either way round. A backwards read needs
// a wider margin (CLEAR.reversed): every digit's mirror is a template too, so a 7 or a 4 has more
// near neighbours facing the wrong way (a backwards 9 is close to a backwards 7 or 4), and most
// drawings face the right way. Which way round it faces is a separate question: it only counts as
// reversed when the mirror image is clearly the better match (REVERSED_MARGIN), so a wobbly 1
// gets the benefit of the doubt.
export const CLEAR = { fit: 0.3, margin: 0.15, reversed: 0.2 };
export const REVERSED_MARGIN = 0.12;

// With every variant there are a few hundred templates, too many for full $P on a phone. A quick
// pass (one greedy match, one way: a tenth of the work) keeps the closest SHORTLIST templates and
// the closest PER_DIGIT of each digit, so every digit's best match is still measured fully.
const SHORTLIST = 24, PER_DIGIT = 3;
function shortlist(c, all) {
  const quick = all.map((t) => ({ t, q: cloudDistance(c, t.points, 0) })).sort((a, b) => a.q - b.q);
  const count = {};
  return quick.filter((s, i) => {
    count[s.t.digit] = (count[s.t.digit] || 0) + 1;
    return i < SHORTLIST || count[s.t.digit] <= PER_DIGIT;
  }).map((s) => s.t);
}

// Reads strokes as a digit. personal: [{ digit, points }] learned from this player.
// Returns { digit, reversed, fit, margin, clear, name, others: [{ digit, fit }], forward:
// { [digit]: fit }, points } or
// null for nothing drawn. fit runs 0–1 (1 is a perfect match); margin is how much better the
// best digit is than the next digit.
export function read(strokes, personal) {
  const c = cloud(strokes);
  if (!c) return null;
  const all = TEMPLATES.concat((personal || []).map((p) => ({ digit: p.digit, reversed: false, name: "yours", points: p.points })));
  const scored = shortlist(c, all).map((t) => ({ t, d: greedy(c, t.points) })).sort((a, b) => a.d - b.d);
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
    clear: fit(top.d) >= CLEAR.fit && margin >= (reversed ? CLEAR.reversed : CLEAR.margin),
    others: byDigit.slice(1, 4).map((s) => ({ digit: s.t.digit, fit: fit(s.d) })),
    // Each digit's best fit facing the right way (a digit missing had no close template).
    forward: Object.fromEntries([...scored].reverse().filter((s) => !s.t.reversed).map((s) => [s.t.digit, fit(s.d)])),
    points: c
  };
}

/* ---------- reading a spell, knowing the answer ---------- */
// The game knows the answer, so a drawing only has to look like it, not be sure it's nothing
// else. A wrong answer costs a heart, so only a clear read of another digit is wrong. Outcomes:
// - "wrong": read clearly as another digit (checked first, so nothing clear is ever overruled).
// - "backwards": read clearly as the answer, facing the wrong way (half damage, as before).
// - "hit": a good match: the best digit is the answer, facing the right way, with fit ≥
//   ACCEPT.good and clear, or close to it (margin ≥ ACCEPT.near). learn: kept as one of the
//   player's templates, unless the built-in templates alone (builtin: that read, or r when the
//   player has none) read it clearly as another digit, so a lucky read can't teach a wrong shape.
// - "show": a poor match: the math was right, so it hits for full damage, but the game shows
//   how to write the digit and doesn't learn it, so a kid isn't taught to keep an odd shape (a
//   squared-U 4). The answer is the best digit, or its own best fit (facing the right way) is
//   within ACCEPT.gap of the best digit's, and at least ACCEPT.floor.
// - "retry": anything else ("Incantation failed!", no cost).
// The numbers come from the real drawings (scripts/sigil-fixtures.json): every one fits its own
// digit at 0.6 or better but a kindergartner's squared-U 4 (0.27), so good starts at 0.5 and the
// floor sits just under 0.27. A scribble fits its best digit at 0.3 or more, so the floor alone
// doesn't stop nonsense; the gap does: 0.05 of fit is about a third of the clear margin.
export const ACCEPT = { floor: 0.25, gap: 0.05, good: 0.5, near: 0.05 };
export function judge(r, answer, builtin) {
  if (!r) return { outcome: "retry", learn: false, fit: 0 };
  if (r.clear && r.digit !== answer) return { outcome: "wrong", learn: false, fit: r.fit };
  if (r.clear && r.digit === answer && r.reversed) return { outcome: "backwards", learn: false, fit: r.fit };
  const own = r.forward[answer] || 0, best = r.digit === answer && !r.reversed;
  if (best && own >= ACCEPT.good && (r.clear || r.margin >= ACCEPT.near)) {
    const b = builtin || r;
    return { outcome: "hit", fit: own, learn: !(b.clear && b.digit !== answer) };
  }
  if (own >= ACCEPT.floor && (r.digit === answer || own >= r.fit - ACCEPT.gap)) return { outcome: "show", learn: false, fit: own };
  return { outcome: "retry", learn: false, fit: own };
}
