// Shapes (K–3 geometry, Missouri Learning Standards): a prototype for the review page
// (review/proto/); nothing in the game reads it yet, and it has no fact keys. No DOM: runs in Node.
//
// Two kinds of problem, neither multiple choice:
// - Draw it: "Draw a triangle!" on the spell pad, read with the same $P recognizer as the spells
//   (js/sigil.js), with shape templates here. $P scales evenly and ignores stroke order, so a
//   triangle in one stroke or three lines reads the same. Two tiebreaks it can't do well alone:
//   the corners counted along the strokes (circle, pentagon and hexagon are close as clouds), and
//   the bounding box's aspect for a square or a rectangle (one family of four-sided shapes here).
// - Count it: how many sides, corners, faces, equal parts or squares, typed on the number pad,
//   with drawings in the house style.
import { cloud, cloudMatch } from "./sigil.js";

const DK = "#0c171c", GOLD = "#ffc93c", CORAL = "#ff5a4e", CREAM = "#f3efe4";
const f1 = (n) => Math.round(n * 10) / 10;
const rad = (d) => d * Math.PI / 180;

/* ---------- the shapes ---------- */
// Each shape's name, how it's said, and its corners (0 for a circle).
export const SHAPE_NAMES = ["circle", "triangle", "square", "rectangle", "rhombus", "pentagon", "hexagon"];
export const CORNERS = { circle: 0, triangle: 3, square: 4, rectangle: 4, rhombus: 4, pentagon: 5, hexagon: 6 };
export const article = (s) => (/^[aeiou]/.test(s) ? "an " : "a ");

// Points of a regular polygon (n corners) in a 100 box, its first corner straight up turned by
// rot degrees, stretched by sx and sy.
export function polygon(n, rot = 0, sx = 1, sy = 1) {
  return Array.from({ length: n }, (_, i) => {
    const a = rad(-90 + rot + i * 360 / n);
    return [50 + 45 * sx * Math.cos(a), 50 + 45 * sy * Math.sin(a)];
  });
}
function ellipse(sx, sy, n = 48) {
  return Array.from({ length: n + 1 }, (_, i) => { const a = rad(-90 + i * 360 / n); return [50 + 45 * sx * Math.cos(a), 50 + 45 * sy * Math.sin(a)]; });
}
// A closed outline as one stroke, or as one stroke per side.
export const closed = (pts) => [pts.concat([pts[0]])];
export const sides = (pts) => pts.map((p, i) => [p, pts[(i + 1) % pts.length]]);
function turn(pts, deg) {
  const a = rad(deg), c = Math.cos(a), s = Math.sin(a);
  return pts.map(([x, y]) => [50 + (x - 50) * c - (y - 50) * s, 50 + (x - 50) * s + (y - 50) * c]);
}
function stretch(pts, sx, sy) { return pts.map(([x, y]) => [50 + (x - 50) * sx, 50 + (y - 50) * sy]); }

// The templates' base shapes: [family, name, corner points (or a closed curve for a circle)].
// Squares and rectangles are one family ("quad"): the aspect decides which.
const rhomb60 = (flip) => { const pts = [[10, 72], [60, 72], [85, 28.7], [35, 28.7]]; return flip ? pts.map(([x, y]) => [100 - x, y]) : pts; };
const BASES = [
  ["circle", "circle", ellipse(1, 1), true],
  ["circle", "round, a little wide", ellipse(1, 0.85), true],
  ["circle", "round, a little tall", ellipse(0.85, 1), true],
  ["triangle", "triangle", polygon(3)],
  ["triangle", "triangle, point down", polygon(3, 180)],
  ["triangle", "right triangle", [[18, 15], [18, 85], [82, 85]]],
  ["triangle", "right triangle, the other way", [[82, 15], [82, 85], [18, 85]]],
  ["triangle", "tall triangle", [[50, 5], [28, 95], [72, 95]]],
  ["triangle", "wide triangle", [[5, 78], [95, 78], [50, 30]]],
  ["quad", "square", [[15, 15], [85, 15], [85, 85], [15, 85]]],
  ["quad", "wide rectangle", [[5, 28], [95, 28], [95, 72], [5, 72]]],
  ["quad", "tall rectangle", [[28, 5], [72, 5], [72, 95], [28, 95]]],
  ["quad", "long rectangle", [[2, 35], [98, 35], [98, 65], [2, 65]]],
  ["rhombus", "diamond, tall", [[50, 5], [80, 50], [50, 95], [20, 50]]],
  ["rhombus", "diamond, wide", [[50, 20], [95, 50], [50, 80], [5, 50]]],
  ["rhombus", "slanted rhombus", rhomb60(false)],
  ["rhombus", "slanted rhombus, the other way", rhomb60(true)],
  ["pentagon", "pentagon", polygon(5)],
  ["pentagon", "house", [[50, 8], [88, 42], [88, 92], [12, 92], [12, 42]]],
  ["hexagon", "hexagon", polygon(6)],
  ["hexagon", "hexagon, flat top", polygon(6, 30)]
];
// Variants: turned a little each way (not the circle), and for shapes whose stretch doesn't
// change what they are, a little narrower or wider. (A square stretched is a rectangle.)
const TURNS = [0, -12, 12, -24, 24];
const STRETCH = { triangle: true, pentagon: true, hexagon: true, rhombus: true };
export const SHAPE_TEMPLATES = BASES.flatMap(([family, name, pts, curve]) => {
  const out = [];
  // A rhombus turned far stops looking like one (a diamond turned 40° reads as a slanted box), so
  // it turns only a little.
  for (const t of curve ? [0] : family === "rhombus" ? TURNS.slice(0, 3) : TURNS) {
    for (const [sx, sy, v] of STRETCH[family] ? [[1, 1, ""], [0.82, 1, ", narrower"], [1, 0.82, ", wider"]] : [[1, 1, ""]]) {
      const p = stretch(turn(pts, t), sx, sy), strokes = curve ? [p] : closed(p);
      out.push({ family, name: name + (t ? `, turned ${t}°` : "") + v, strokes, points: cloud(strokes) });
    }
  }
  return out;
});

/* ---------- counting corners ---------- */
// Corners along the strokes: sharp turns inside a stroke, and the places where strokes meet at an
// angle (a triangle drawn as three lines). A circle has none, however it's drawn. Turns are
// measured over a window about 7% of the drawing's size each side, so a corner drawn a little
// round still counts, and a circle's gentle bend (about 20° over that window) doesn't.
export const CORNER = { turn: 40, join: 140, near: 0.16 };
export function countCorners(strokes) {
  const all = strokes.flat();
  if (all.length < 2) return 0;
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
  const step = size * 0.025, k = 3;
  let count = 0;
  const ends = [];
  for (const s of strokes) {
    let p = even(s, step);
    if (p.length < 2) continue;
    const isClosed = p.length > 8 && Math.hypot(p[0][0] - p[p.length - 1][0], p[0][1] - p[p.length - 1][1]) < size * CORNER.near;
    if (isClosed) p = p.slice(0, -1);
    const n = p.length, at = (i) => p[isClosed ? (i + n) % n : i];
    const turns = p.map((_, i) => {
      if (!isClosed && (i < k || i >= n - k)) return 0;
      const a = at(i - k), b = at(i), c = at(i + k);
      return angleBetween([b[0] - a[0], b[1] - a[1]], [c[0] - b[0], c[1] - b[1]]);
    });
    for (let i = 0; i < n; i++) {
      if (turns[i] < CORNER.turn) continue;
      let peak = true;
      for (let j = -k; j <= k && peak; j++) {
        if (!j) continue;
        const q = isClosed ? (i + j + n) % n : i + j;
        if (q < 0 || q >= n) continue;
        if (turns[q] > turns[i] || (j < 0 && turns[q] === turns[i])) peak = false;
      }
      if (peak) count++;
    }
    if (!isClosed) {
      const m = Math.min(k, n - 1);
      ends.push({ pt: p[0], away: [p[m][0] - p[0][0], p[m][1] - p[0][1]] });
      ends.push({ pt: p[n - 1], away: [p[n - 1 - m][0] - p[n - 1][0], p[n - 1 - m][1] - p[n - 1][1]] });
    }
  }
  // Ends that meet: two strokes (or a stroke's own two ends) joining at an angle make a corner;
  // joining straight on (a side drawn in two goes) doesn't.
  const used = new Array(ends.length).fill(false);
  for (let i = 0; i < ends.length; i++) {
    if (used[i]) continue;
    const group = [i];
    for (let j = i + 1; j < ends.length; j++) if (!used[j] && Math.hypot(ends[i].pt[0] - ends[j].pt[0], ends[i].pt[1] - ends[j].pt[1]) < size * CORNER.near) group.push(j);
    if (group.length < 2) continue;
    group.forEach((g) => { used[g] = true; });
    if (group.length > 2 || angleBetween(ends[group[0]].away, ends[group[1]].away) < CORNER.join) count++;
  }
  return count;
}
function angleBetween(u, v) {
  const lu = Math.hypot(...u), lv = Math.hypot(...v);
  if (!lu || !lv) return 0;
  return Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / (lu * lv)))) * 180 / Math.PI;
}
// A stroke resampled to points step apart.
function even(s, step) {
  const out = [s[0]];
  let carry = 0;
  for (let i = 1; i < s.length; i++) {
    let [x0, y0] = s[i - 1];
    const [x1, y1] = s[i];
    let d = Math.hypot(x1 - x0, y1 - y0);
    while (carry + d >= step) {
      const t = (step - carry) / d;
      x0 += (x1 - x0) * t; y0 += (y1 - y0) * t;
      out.push([x0, y0]);
      d = Math.hypot(x1 - x0, y1 - y0); carry = 0;
    }
    carry += d;
  }
  if (out.length > 1) { const [lx, ly] = out[out.length - 1], [ex, ey] = s[s.length - 1]; if (Math.hypot(ex - lx, ey - ly) > step / 2) out.push(s[s.length - 1]); }
  return out;
}

/* ---------- reading a drawing ---------- */
// How sure a read must be (as the spells': CLEAR in sigil.js), how much each corner too many or
// too few counts against a family, and the aspect (long side ÷ short side of the drawing's box)
// that makes a four-sided shape a square or a rectangle. 3rd grade is stricter.
export const SHAPE_CLEAR = { fit: 0.3, margin: 0.15 };
export const CORNER_WEIGHT = 0.3;
export const ASPECT = { k: { square: 1.25, rectangle: 1.4 }, third: { square: 1.15, rectangle: 1.3 } };
const fitOf = (d) => Math.max(0, 1 - d / 3);
const FAMILY_CORNERS = { circle: 0, triangle: 3, quad: 4, rhombus: 4, pentagon: 5, hexagon: 6 };

// Reads strokes ([[x, y], …], …) as a shape. opt.strict: 3rd grade's square/rectangle line.
// Returns null for nothing drawn, else { shape, clear, fit, margin, corners, aspect, fits: {
// shape: fit }, template: { shape: its closest template } }.
export function readShape(strokes, opt = {}) {
  const pts = strokes.flat();
  if (pts.length < 2) return null;
  const c = cloud(strokes);
  if (!c) return null;
  const corners = countCorners(strokes);
  const aspect = aspectOf(pts);
  // Each family's closest template, weighed by how far its corners are from what was counted.
  const best = {};
  for (const t of SHAPE_TEMPLATES) {
    const d = cloudMatch(c, t.points);
    if (!best[t.family] || d < best[t.family].raw) best[t.family] = { raw: d, t };
  }
  for (const f in best) best[f].d = best[f].raw * (1 + CORNER_WEIGHT * Math.min(3, Math.abs(corners - FAMILY_CORNERS[f])));
  const ranked = Object.entries(best).sort((a, b) => a[1].d - b[1].d);
  const [fam, top] = ranked[0], next = ranked[1][1];
  const fit = fitOf(top.d), margin = Math.max(0, (next.d - top.d) / next.d);
  // A four-sided shape: the aspect decides, and between the two lines it's unsure.
  const line = ASPECT[opt.strict ? "third" : "k"];
  const quadAs = aspect <= line.square ? "square" : aspect >= line.rectangle ? "rectangle" : null;
  const shape = fam === "quad" ? quadAs || (aspect < (line.square + line.rectangle) / 2 ? "square" : "rectangle") : fam;
  const fits = {}, template = {};
  for (const [f, b] of ranked) {
    if (f === "quad") {
      // A square or rectangle fits as well as the quad family does, unless the aspect clearly
      // says it's the other one.
      fits.square = quadAs === "rectangle" ? 0 : fitOf(b.d);
      fits.rectangle = quadAs === "square" ? 0 : fitOf(b.d);
      template.square = template.rectangle = b.t;
    } else { fits[f] = fitOf(b.d); template[f] = b.t; }
  }
  return { shape, clear: fit >= SHAPE_CLEAR.fit && margin >= SHAPE_CLEAR.margin && (fam !== "quad" || !!quadAs), fit, margin, corners, aspect, fits, template, family: fam, aspectSure: fam !== "quad" || !!quadAs };
}

// The long side ÷ the short side of the smallest box around the points, at any turn (in 3°
// steps), so a rectangle drawn tilted is still long and thin.
export function aspectOf(pts) {
  let best = null;
  for (let d = 0; d < 90; d += 3) {
    const a = rad(d), c = Math.cos(a), s = Math.sin(a);
    const us = pts.map(([x, y]) => x * c + y * s), vs = pts.map(([x, y]) => -x * s + y * c);
    const w = Math.max(...us) - Math.min(...us), h = Math.max(...vs) - Math.min(...vs);
    if (!best || w * h < best.area) best = { area: w * h, aspect: Math.max(w, h) / (Math.min(w, h) || 1) };
  }
  return best.aspect;
}
// Which shapes answer for the one asked. In 3rd grade a square is a rectangle and a rhombus too
// (3.G.A.1), so drawing one counts; before that, a square and a rectangle are told apart.
export function accepts(asked, strict) {
  const ok = new Set([asked]);
  if (strict && (asked === "rectangle" || asked === "rhombus")) ok.add("square");
  return ok;
}
// Judging a drawing, knowing what was asked (as judge in sigil.js):
// - "wrong": a clear read of a shape that doesn't answer (checked first).
// - "hit": the best read answers, a good fit, clear or close to it.
// - "show": it counts, but the clean shape is shown over it: the best read answers with a poorer
//   fit, or the asked shape's own fit is close to the best (a square that's nearly a rectangle).
// - "retry": anything else (try again, no cost).
export const SHAPE_ACCEPT = { good: 0.5, near: 0.05, floor: 0.25, gap: 0.05 };
export function judgeShape(r, asked, strict) {
  if (!r) return { outcome: "retry", fit: 0 };
  const ok = accepts(asked, strict);
  if (r.clear && !ok.has(r.shape)) return { outcome: "wrong", fit: r.fit };
  const own = Math.max(...[...ok].map((s) => r.fits[s] || 0));
  if (ok.has(r.shape) && own >= SHAPE_ACCEPT.good && (r.clear || r.margin >= SHAPE_ACCEPT.near) && r.aspectSure !== false) return { outcome: "hit", fit: own };
  if (own >= SHAPE_ACCEPT.floor && (ok.has(r.shape) || own >= r.fit - SHAPE_ACCEPT.gap)) return { outcome: "show", fit: own };
  return { outcome: "retry", fit: own };
}
// The clean shape to glow over a drawing: the asked shape's closest template, fitted to the
// drawing's box (a square and a circle stay square, centered).
export function cleanShape(r, asked, box) {
  const t = r && r.template[asked] ? r.template[asked] : SHAPE_TEMPLATES.find((x) => x.family === (asked === "square" || asked === "rectangle" ? "quad" : asked) && x.name.startsWith(asked === "rectangle" ? "wide rectangle" : asked === "square" ? "square" : asked));
  let strokes = t.strokes;
  if (asked === "square") strokes = closed([[15, 15], [85, 15], [85, 85], [15, 85]]);
  if (asked === "rectangle" && box.w < box.h * 1.2 && box.h < box.w * 1.2) strokes = closed([[5, 28], [95, 28], [95, 72], [5, 72]]);
  const ps = strokes.flat(), xs = ps.map((p) => p[0]), ys = ps.map((p) => p[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys), tw = Math.max(...xs) - x0 || 1, th = Math.max(...ys) - y0 || 1;
  let sx = box.w / tw, sy = box.h / th;
  if (asked === "square" || asked === "circle") sx = sy = Math.min(sx, sy);
  const ox = box.x + (box.w - tw * sx) / 2, oy = box.y + (box.h - th * sy) / 2;
  return strokes.map((s) => s.map(([x, y]) => [ox + (x - x0) * sx, oy + (y - y0) * sy]));
}

/* ---------- draw-it problems ---------- */
// Levels: K's four shapes, then 2nd grade's pentagon and hexagon, then 3rd's rhombus (and the
// stricter square/rectangle line, where a square counts as a rectangle or a rhombus).
export const DRAW_LEVELS = [
  { id: "drawK", name: "Draw: K shapes", grade: "K", shapes: ["circle", "square", "triangle", "rectangle"] },
  { id: "draw2", name: "Draw: + pentagon, hexagon", grade: "2nd", shapes: ["circle", "square", "triangle", "rectangle", "pentagon", "hexagon"] },
  { id: "draw3", name: "Draw: + rhombus", grade: "3rd", shapes: ["square", "triangle", "rectangle", "pentagon", "hexagon", "rhombus"], strict: true }
];
export const spokenDraw = (shape) => `Draw ${article(shape)}${shape}!`;

/* ---------- count-it problems ---------- */
export const COUNT_LEVELS = [
  { id: "sides", name: "Count: sides", grade: "K–2nd" },
  { id: "corners", name: "Count: corners", grade: "K–2nd" },
  { id: "faces", name: "Count: faces", grade: "1st–2nd" },
  { id: "parts", name: "Count: equal parts", grade: "1st–3rd" },
  { id: "squares", name: "Count: squares in all", grade: "2nd" }
];
export const SHAPE_LEVELS = [...DRAW_LEVELS, ...COUNT_LEVELS];
export const shapeLevel = (id) => SHAPE_LEVELS.find((l) => l.id === id) || SHAPE_LEVELS[0];
export const isDraw = (id) => DRAW_LEVELS.some((l) => l.id === id);

// An irregular polygon with n corners, so counting is counting, not knowing a shape's name: its
// corners at uneven angles and distances and turned any way, but convex and with every corner a
// clear turn (at least 28°), in a 200 box.
export function irregular(n, rnd) {
  for (let tries = 0; tries < 200; tries++) {
    const rot = rnd() * 360, pts = [];
    for (let i = 0; i < n; i++) {
      const a = rad(rot + (i + (rnd() - 0.5) * 0.5) * 360 / n), r = 70 + rnd() * 22;
      pts.push([f1(100 + r * Math.cos(a)), f1(100 + r * Math.sin(a))]);
    }
    if (convexTurns(pts).every((t) => t >= 28 && t <= 150)) return pts;
  }
  return polygon(n).map(([x, y]) => [f1(x * 2), f1(y * 2)]);
}
// The turn at each corner of a closed polygon, in degrees (all the same way round when convex;
// a turn the other way is negative).
export function convexTurns(pts) {
  const n = pts.length, sign = [];
  const out = pts.map((b, i) => {
    const a = pts[(i - 1 + n) % n], c = pts[(i + 1) % n];
    const u = [b[0] - a[0], b[1] - a[1]], v = [c[0] - b[0], c[1] - b[1]];
    sign.push(Math.sign(u[0] * v[1] - u[1] * v[0]));
    return angleBetween(u, v);
  });
  return sign.every((s) => s === sign[0]) ? out : out.map(() => -1);
}

const pick = (list, rnd) => list[Math.floor(rnd() * list.length)];
// A counting problem: { kind, ans, … }.
// - sides / corners: { pts } an irregular polygon with 3 to 6 corners (sometimes regular).
// - faces: { solid: "cube" (6) | "pyramid" (5, a square pyramid) }.
// - parts: { whole: "circle" | "rectangle", n: 2–4, cut: how it's cut }.
// - squares: { rows, cols } a rectangle split into rows and columns (2nd: 2–4 rows of 2–5).
export function countProblem(kind, rnd = Math.random) {
  if (kind === "sides" || kind === "corners") {
    const n = 3 + Math.floor(rnd() * 4);
    const pts = rnd() < 0.25 ? polygon(n, rnd() * 360).map(([x, y]) => [f1(x * 2), f1(y * 2)]) : irregular(n, rnd);
    return { kind, n, pts, ans: n };
  }
  if (kind === "faces") { const solid = rnd() < 0.6 ? "cube" : "pyramid"; return { kind, solid, ans: solid === "cube" ? 6 : 5 }; }
  if (kind === "parts") {
    const whole = rnd() < 0.5 ? "circle" : "rectangle", n = 2 + Math.floor(rnd() * 3);
    const cut = whole === "circle" ? "slices" : pick(n === 2 ? ["across", "down", "diagonal"] : n === 3 ? ["across", "down"] : ["across", "down", "grid"], rnd);
    return { kind, whole, n, cut, ans: n };
  }
  const rows = 2 + Math.floor(rnd() * 3), cols = 2 + Math.floor(rnd() * 4);
  return { kind: "squares", rows, cols, ans: rows * cols };
}
// The question on screen, short so it fits a phone beside the answer (the voice asks it whole).
export const COUNT_LINE = { sides: "Sides", corners: "Corners", faces: "Faces", parts: "Equal parts", squares: "Squares in all" };
export function spokenCount(p) {
  if (p.kind === "sides") return "How many sides?";
  if (p.kind === "corners") return "How many corners?";
  if (p.kind === "faces") return `How many faces does this ${p.solid === "cube" ? "cube" : "pyramid"} have?`;
  if (p.kind === "parts") return "How many equal parts?";
  return "How many squares in all?";
}

/* ---------- the drawings ---------- */
const COLORS = { 3: "#ff8a5c", 4: "#5cc8ff", 5: "#b58cff", 6: "#7fdc8a" };
const sheen = `<defs><linearGradient id="shsh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
const house = (shape, color) => `<g fill="${DK}" stroke="${DK}" stroke-width="10" stroke-linejoin="round">${shape}</g><g fill="${color}">${shape}</g><g fill="url(#shsh)">${shape}</g>`;
const poly = (pts) => `<path d="M${pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(" L")} Z"/>`;
// A numbered badge (the hint's count): gold, or "?" for the one still to count.
function badge(x, y, label, strong) {
  return `<circle cx="${f1(x)}" cy="${f1(y)}" r="13" fill="${strong ? GOLD : DK}" stroke="${GOLD}" stroke-width="2.5"/><text x="${f1(x)}" y="${f1(y)}" dy=".35em" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="15" fill="${strong ? DK : GOLD}">${label}</text>`;
}
const svgBox = (w, h, body, label, pad = 18) => `<svg viewBox="${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}" class="shape" role="img" aria-label="${label}">${sheen}${body}</svg>`;

// The counting drawing. opt.hint: number what's counted; opt.worked: the last one too (before,
// the last is "?").
export function countSvg(p, opt = {}) {
  const hint = opt.hint, worked = opt.worked, lab = (i, n) => (i === n - 1 && !worked ? "?" : i + 1);
  if (p.kind === "sides" || p.kind === "corners") {
    let s = house(poly(p.pts), COLORS[p.n]);
    if (hint) {
      const cx = p.pts.reduce((t, q) => t + q[0], 0) / p.n, cy = p.pts.reduce((t, q) => t + q[1], 0) / p.n;
      // Start at the top and go round clockwise, as a finger would.
      const start = p.pts.reduce((bi, q, i) => (q[1] < p.pts[bi][1] ? i : bi), 0);
      const cw = convexTurns(p.pts)[0] >= 0 && clockwise(p.pts);
      const order = Array.from({ length: p.n }, (_, i) => (cw ? start + i : start - i + p.n) % p.n);
      order.forEach((idx, i) => {
        if (p.kind === "corners") {
          const [x, y] = p.pts[idx], d = Math.hypot(x - cx, y - cy);
          s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="7" fill="${GOLD}" stroke="${DK}" stroke-width="2.5"/>` + badge(x + (x - cx) / d * 24, y + (y - cy) / d * 24, lab(i, p.n), i === p.n - 1);
        } else {
          const a = p.pts[idx], b = p.pts[(idx + (cw ? 1 : -1) + p.n) % p.n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, d = Math.hypot(mx - cx, my - cy) || 1;
          s += `<path d="M${f1(a[0])} ${f1(a[1])} L${f1(b[0])} ${f1(b[1])}" stroke="${GOLD}" stroke-width="5" stroke-linecap="round" opacity=".9"/>` + badge(mx + (mx - cx) / d * 22, my + (my - cy) / d * 22, lab(i, p.n), i === p.n - 1);
        }
      });
    }
    return svgBox(200, 200, s, `a shape with ${p.kind === "sides" ? "sides" : "corners"} to count`, 30);
  }
  if (p.kind === "faces") return solidSvg(p.solid, hint);
  if (p.kind === "parts") return partsSvg(p, hint, worked);
  return gridSvg(p, hint, worked);
}
function clockwise(pts) { let a = 0; pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }); return a > 0; }

// A cube or a square pyramid, drawn at a slant: the faces you see filled, the hidden edges
// dashed. The hint numbers the faces you can see.
function solidSvg(solid, hint) {
  let s = "";
  if (solid === "cube") {
    const F = [[30, 70], [130, 70], [130, 170], [30, 170]], dx = 45, dy = -40;
    const top = [F[0], F[1], [F[1][0] + dx, F[1][1] + dy], [F[0][0] + dx, F[0][1] + dy]];
    const side = [F[1], [F[1][0] + dx, F[1][1] + dy], [F[2][0] + dx, F[2][1] + dy], F[2]];
    const hid = [F[3][0] + dx, F[3][1] + dy];
    s += `<path d="M${F[3][0]} ${F[3][1]} L${hid[0]} ${hid[1]} L${top[3][0]} ${top[3][1]} M${hid[0]} ${hid[1]} L${side[2][0]} ${side[2][1]}" fill="none" stroke="${CREAM}" stroke-width="3" stroke-dasharray="6 6" opacity=".6"/>`;
    s += house(poly(side), "#3fa6e8") + house(poly(top), "#8fd4ff") + house(poly(F), "#5cc8ff");
    if (hint) s += badge(80, 120, 1, false) + badge(110, 50, 2, false) + badge(152, 100, 3, false);
    return svgBox(180, 180, s, "a cube");
  }
  const B = [[20, 160], [130, 160], [170, 125], [60, 125]], apex = [92, 15];
  s += `<path d="M${B[3][0]} ${B[3][1]} L${B[0][0]} ${B[0][1]} M${B[3][0]} ${B[3][1]} L${B[2][0]} ${B[2][1]} M${B[3][0]} ${B[3][1]} L${apex[0]} ${apex[1]}" fill="none" stroke="${CREAM}" stroke-width="3" stroke-dasharray="6 6" opacity=".6"/>`;
  s += house(poly([B[1], B[2], apex]), "#e0a33c") + house(poly([B[0], B[1], apex]), "#ffc93c");
  if (hint) s += badge(86, 120, 1, false) + badge(128, 105, 2, false);
  return svgBox(180, 170, s, "a square pyramid");
}
// A circle or a rectangle cut into n equal parts; the hint shades and numbers them one by one.
function partsSvg(p, hint, worked) {
  let s = "";
  const shade = (i) => (hint ? (i % 2 ? "#ff8a7f" : GOLD) : "#5cc8ff");
  const lab = (i) => (i === p.n - 1 && !worked ? "?" : i + 1);
  if (p.whole === "circle") {
    const c = 100, r = 85;
    s += house(`<circle cx="${c}" cy="${c}" r="${r}"/>`, "#5cc8ff");
    for (let i = 0; i < p.n; i++) {
      const a0 = rad(-90 + i * 360 / p.n), a1 = rad(-90 + (i + 1) * 360 / p.n), mid = (a0 + a1) / 2;
      if (hint) s += `<path d="M${c} ${c} L${f1(c + r * Math.cos(a0))} ${f1(c + r * Math.sin(a0))} A${r} ${r} 0 0 1 ${f1(c + r * Math.cos(a1))} ${f1(c + r * Math.sin(a1))} Z" fill="${shade(i)}" opacity=".85"/>`;
      if (hint) s += badge(c + r * 0.55 * Math.cos(mid), c + r * 0.55 * Math.sin(mid), lab(i), i === p.n - 1);
    }
    for (let i = 0; i < p.n; i++) { const a = rad(-90 + i * 360 / p.n); s += `<path d="M${c} ${c} L${f1(c + r * Math.cos(a))} ${f1(c + r * Math.sin(a))}" stroke="${DK}" stroke-width="5" stroke-linecap="round"/>`; }
    s += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${DK}" stroke-width="5"/>`;
    return svgBox(200, 200, s, `a circle in ${p.n} equal parts`);
  }
  const W = 200, H = 130, parts = [];
  if (p.cut === "grid") for (let i = 0; i < 4; i++) parts.push([[(i % 2) * W / 2, Math.floor(i / 2) * H / 2], [(i % 2 + 1) * W / 2, Math.floor(i / 2) * H / 2], [(i % 2 + 1) * W / 2, (Math.floor(i / 2) + 1) * H / 2], [(i % 2) * W / 2, (Math.floor(i / 2) + 1) * H / 2]]);
  else if (p.cut === "diagonal") parts.push([[0, 0], [W, 0], [0, H]], [[W, 0], [W, H], [0, H]]);
  else for (let i = 0; i < p.n; i++) {
    if (p.cut === "down") parts.push([[i * W / p.n, 0], [(i + 1) * W / p.n, 0], [(i + 1) * W / p.n, H], [i * W / p.n, H]]);
    else parts.push([[0, i * H / p.n], [W, i * H / p.n], [W, (i + 1) * H / p.n], [0, (i + 1) * H / p.n]]);
  }
  s += house(poly([[0, 0], [W, 0], [W, H], [0, H]]), "#5cc8ff");
  parts.forEach((q, i) => {
    if (hint) s += `<g fill="${shade(i)}" opacity=".85">${poly(q)}</g>`;
    s += `<g fill="none" stroke="${DK}" stroke-width="5" stroke-linejoin="round">${poly(q)}</g>`;
    if (hint) { const cx = q.reduce((t, v) => t + v[0], 0) / q.length, cy = q.reduce((t, v) => t + v[1], 0) / q.length; s += badge(cx, cy, lab(i), i === p.n - 1); }
  });
  return svgBox(W, H, s, `a rectangle in ${p.n} equal parts`);
}
// Rows × columns of squares. The hint numbers the first row's squares, then counts on by rows
// (4, 8 …) only partway before answering: to the halfway row, or just the first row with 2 or 3
// rows; the rows still to go are dimmed and unnumbered, so it never counts to the end. Worked,
// every row has its running total.
export const rowsCounted = (p, worked) => (worked ? p.rows : p.rows <= 3 ? 1 : Math.floor(p.rows / 2));
function gridSvg(p, hint, worked) {
  const u = Math.min(200 / p.cols, 150 / p.rows), W = u * p.cols, H = u * p.rows, upto = rowsCounted(p, worked);
  let s = house(poly([[0, 0], [W, 0], [W, H], [0, H]]), "#7fdc8a");
  for (let r = 0; r < p.rows; r++) {
    if (hint && r < upto && r % 2 === 0) s += `<rect x="0" y="${f1(r * u)}" width="${f1(W)}" height="${f1(u)}" fill="${GOLD}" opacity=".35"/>`;
    if (hint && r >= upto) s += `<rect x="0" y="${f1(r * u)}" width="${f1(W)}" height="${f1(u)}" fill="${DK}" opacity=".45"/>`;
    for (let c = 0; c < p.cols; c++) s += `<rect x="${f1(c * u)}" y="${f1(r * u)}" width="${f1(u)}" height="${f1(u)}" fill="none" stroke="${DK}" stroke-width="4"/>`;
    if (hint && r < upto) s += badge(W + 26, r * u + u / 2, (r + 1) * p.cols, false);
  }
  // The first row's squares, numbered.
  if (hint) for (let c = 0; c < p.cols; c++) s += `<text x="${f1(c * u + u / 2)}" y="${f1(u / 2)}" dy=".35em" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="${f1(Math.min(18, u * 0.45))}" fill="${DK}" class="cnt">${c + 1}</text>`;
  return svgBox(W + (hint ? 40 : 0), H, s, `${p.rows} rows of ${p.cols} squares`);
}

// The hint's words (the drawing comes from countSvg with hint on).
export function countHint(p, worked) {
  const list = (n) => Array.from({ length: n }, (_, i) => i + 1).slice(0, worked ? n : n - 1).join(", ") + (worked ? "" : ", ?");
  if (p.kind === "sides") return { say: `Count each side, going round: ${list(p.n)}${worked ? `. ${p.n} sides.` : ""}` };
  if (p.kind === "corners") return { say: `Count each corner, going round: ${list(p.n)}${worked ? `. ${p.n} corners.` : ""}` };
  if (p.kind === "faces") return p.solid === "cube"
    ? { say: `You can see 3 faces. 3 more hide on the back. 3 + 3 = ${worked ? 6 : "?"}` }
    : { say: `4 triangles go round, and a square is on the bottom. 4 + 1 = ${worked ? 5 : "?"}` };
  if (p.kind === "parts") return { say: `Count the parts: ${list(p.n)}${worked ? `. ${p.n} equal parts.` : ""}` };
  // "Each row has 4: 4, 8, … How many in 3 rows?"; worked, "4 + 4 + 4 = 12".
  if (worked) return { say: `${Array.from({ length: p.rows }, () => p.cols).join(" + ")} = ${p.ans}` };
  const run = Array.from({ length: rowsCounted(p, false) }, (_, i) => (i + 1) * p.cols);
  return { say: `Each row has ${p.cols}: ${run.join(", ")}, … How many in ${p.rows} rows?` };
}
