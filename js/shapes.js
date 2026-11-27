// Shapes (K–3 geometry, Missouri Learning Standards): Polly-Gon's problems in the game (its
// strands shapesK, shapesH, shapesM and shapesT in learn.js; the facts at the end of this file),
// and the prototype on the review page (review/proto/). No DOM: runs in Node.
//
// Two kinds of problem, neither multiple choice:
// - Draw it: "Draw a triangle!" on the spell pad, read with the same $P recognizer as the spells
//   (js/sigil.js), with shape templates here. $P scales evenly and ignores stroke order, so a
//   triangle in one stroke or three lines reads the same. Two tiebreaks it can't do well alone:
//   the corners counted along the strokes (circle, pentagon and hexagon are close as clouds), and
//   the bounding box's aspect for a square or a rectangle (one family of four-sided shapes here).
// - Count it: how many sides, corners, faces, equal parts or squares, typed on the number pad,
//   with drawings in the house style; and 3rd grade's unit fractions (each part is 1/□).
import { cloud, cloudMatch } from "./sigil.js";
import { spoken } from "./problems.js";
import { fractionWords, unitName } from "./third.js";

const DK = "#0c171c", GOLD = "#ffc93c", CORAL = "#ff5a4e", CREAM = "#f3efe4";
const f1 = (n) => Math.round(n * 10) / 10;
const rad = (d) => d * Math.PI / 180;

/* ---------- the shapes ---------- */
// Each shape's name, how it's said, and its corners (0 for a circle).
export const SHAPE_NAMES = ["circle", "triangle", "square", "rectangle", "rhombus", "pentagon", "hexagon"];
export const CORNERS = { circle: 0, triangle: 3, square: 4, rectangle: 4, rhombus: 4, pentagon: 5, hexagon: 6 };
export const article = (s) => (/^[aeiou]/.test(s) ? "an " : "a ");
const cap = (t) => t[0].toUpperCase() + t.slice(1);

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
  // A kid's circle on the wide drawing pad often comes out an oval.
  ["circle", "oval, wide", ellipse(1, 0.68), true],
  ["circle", "oval, tall", ellipse(0.68, 1), true],
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
export const CORNER_WEIGHT = 0.3, CIRCLE_CORNERS = 2;
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
  // (A round shape is allowed a couple of corners: an oval's tight ends, or where a circle's
  // stroke meets itself, can count as one.)
  const off = (f) => (f === "circle" ? Math.max(0, corners - CIRCLE_CORNERS) : Math.abs(corners - FAMILY_CORNERS[f]));
  for (const f in best) best[f].d = best[f].raw * (1 + CORNER_WEIGHT * Math.min(3, off(f)));
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
// Which shapes answer for the one asked. A square is a rectangle (four square corners) and a
// rhombus (four equal sides), so drawing one counts for either: 3rd grade says so (3.G.A.1), and
// the K and 1st grade guides don't set a square apart from a rectangle either, so a
// kindergartner's square for "rectangle" isn't marked wrong. A long rectangle is never a square.
// A quadrilateral (3rd grade) is any four-sided shape. strict (3rd grade) only tightens the
// aspect line that tells a square from a rectangle (ASPECT).
export function accepts(asked) {
  const ok = new Set([asked]);
  if (asked === "rectangle" || asked === "rhombus") ok.add("square");
  if (asked === "quadrilateral") ["square", "rectangle", "rhombus"].forEach((s) => ok.add(s));
  return ok;
}
// Judging a drawing, knowing what was asked (as judge in sigil.js):
// - "wrong": a clear read of a shape that doesn't answer (checked first).
// - "hit": the best read answers, a good fit, clear or close to it.
// - "show": it counts, but the clean shape is shown over it: the best read answers with a poorer
//   fit, or the asked shape's own fit is close to the best (a square that's nearly a rectangle).
// - "retry": anything else (try again, no cost).
export const SHAPE_ACCEPT = { good: 0.5, near: 0.05, floor: 0.25, gap: 0.05 };
// edge: the drawing ran off the pad (offEdge in sigil.js): a read that would be wrong is unclear
// instead ("retry", edge: true), so a shape cut off by the edge isn't "That looks like a square!".
export function judgeShape(r, asked, strict, edge) {
  const j = judgeShapeRead(r, asked, strict);
  return edge && j.outcome === "wrong" ? { outcome: "retry", fit: j.fit, edge: true } : j;
}
function judgeShapeRead(r, asked, strict) {
  if (!r) return { outcome: "retry", fit: 0 };
  const ok = accepts(asked, strict);
  if (r.clear && !ok.has(r.shape)) return { outcome: "wrong", fit: r.fit };
  const own = Math.max(...[...ok].map((s) => r.fits[s] || 0));
  // Not sure whether it's a square or a rectangle only matters when just one of them answers.
  const either = ok.has("square") && ok.has("rectangle") && r.family === "quad";
  if (ok.has(r.shape) && own >= SHAPE_ACCEPT.good && (r.clear || r.margin >= SHAPE_ACCEPT.near || either) && (r.aspectSure !== false || either)) return { outcome: "hit", fit: own };
  if (own >= SHAPE_ACCEPT.floor && (ok.has(r.shape) || own >= r.fit - SHAPE_ACCEPT.gap)) return { outcome: "show", fit: own };
  return { outcome: "retry", fit: own };
}
// The clean shape to glow over a drawing: the asked shape's closest template, fitted to the
// drawing's box (a square and a circle stay square, centered).
export function cleanShape(r, asked, box) {
  // (A rhombus's first template is the tall diamond: none is named "rhombus" first.)
  const fam = asked === "square" || asked === "rectangle" ? "quad" : asked;
  const t = r && r.template[asked] ? r.template[asked] : SHAPE_TEMPLATES.find((x) => x.family === fam && x.name.startsWith(asked === "rectangle" ? "wide rectangle" : asked === "square" ? "square" : asked)) || SHAPE_TEMPLATES.find((x) => x.family === fam);
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

// How many of n things (sides, corners, equal parts) the hint counts before answering: about
// half (none of 2, just the first of 3), so it never counts to the end; worked, all of them.
export const partsCounted = (n, worked) => (worked ? n : Math.floor(n / 2));
// The label on thing i of n: its number while counted, "?" on the last before answering, and
// nothing on the ones still to count (drawn dimmer).
const labelOf = (i, n, worked) => (i < partsCounted(n, worked) ? i + 1 : i === n - 1 ? "?" : null);

// The counting drawing. opt.hint: number what's counted, partway (partsCounted); opt.worked: all
// of it.
export function countSvg(p, opt = {}) {
  const hint = opt.hint, worked = opt.worked;
  if (p.kind === "sides" || p.kind === "corners") {
    let s = house(poly(p.pts), COLORS[p.n]);
    if (hint) {
      const cx = p.pts.reduce((t, q) => t + q[0], 0) / p.n, cy = p.pts.reduce((t, q) => t + q[1], 0) / p.n;
      // Start at the top and go round clockwise, as a finger would.
      const start = p.pts.reduce((bi, q, i) => (q[1] < p.pts[bi][1] ? i : bi), 0);
      const cw = convexTurns(p.pts)[0] >= 0 && clockwise(p.pts);
      const order = Array.from({ length: p.n }, (_, i) => (cw ? start + i : start - i + p.n) % p.n);
      order.forEach((idx, i) => {
        const lab = labelOf(i, p.n, worked), dim = lab == null || lab === "?" ? ' opacity=".45"' : "";
        if (p.kind === "corners") {
          const [x, y] = p.pts[idx], d = Math.hypot(x - cx, y - cy);
          s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="7" fill="${GOLD}" stroke="${DK}" stroke-width="2.5"${dim}/>` + (lab == null ? "" : badge(x + (x - cx) / d * 24, y + (y - cy) / d * 24, lab, i === p.n - 1));
        } else {
          const a = p.pts[idx], b = p.pts[(idx + (cw ? 1 : -1) + p.n) % p.n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, d = Math.hypot(mx - cx, my - cy) || 1;
          s += `<path d="M${f1(a[0])} ${f1(a[1])} L${f1(b[0])} ${f1(b[1])}" stroke="${GOLD}" stroke-width="5" stroke-linecap="round"${dim || ' opacity=".9"'}/>` + (lab == null ? "" : badge(mx + (mx - cx) / d * 22, my + (my - cy) / d * 22, lab, i === p.n - 1));
        }
      });
    }
    return svgBox(200, 200, s, `a shape with ${p.kind === "sides" ? "sides" : "corners"} to count`, 30);
  }
  if (p.kind === "faces") return solidSvg(p.solid, hint);
  if (p.kind === "parts" || p.kind === "unit") return partsSvg(p, hint, worked);
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
// A circle or a rectangle cut into n equal parts (cut: "across", "down", "diagonal" for 2, or
// "grid", 2 rows: 4, 6 or 8). The hint shades and numbers them one by one, partway before
// answering (partsCounted). A unit fraction (kind "unit") has its first part shaded gold all along;
// worked, that part says 1/n.
function partsSvg(p, hint, worked) {
  let s = "";
  const unit = p.kind === "unit";
  const shade = (i) => (unit ? (i === 0 ? GOLD : null) : hint && labelOf(i, p.n, worked) != null && labelOf(i, p.n, worked) !== "?" ? (i % 2 ? "#ff8a7f" : GOLD) : null);
  const label = (i) => (unit && worked && i === 0 ? `1/${p.n}` : labelOf(i, p.n, worked));
  const tag = (x, y, i) => { const l = label(i); if (!hint || l == null) return ""; return String(l).includes("/") ? fracBadge(x, y, l) : badge(x, y, l, i === p.n - 1); };
  if (p.whole === "circle") {
    const c = 100, r = 85;
    s += house(`<circle cx="${c}" cy="${c}" r="${r}"/>`, "#5cc8ff");
    for (let i = 0; i < p.n; i++) {
      const a0 = rad(-90 + i * 360 / p.n), a1 = rad(-90 + (i + 1) * 360 / p.n);
      if (shade(i)) s += `<path d="M${c} ${c} L${f1(c + r * Math.cos(a0))} ${f1(c + r * Math.sin(a0))} A${r} ${r} 0 0 1 ${f1(c + r * Math.cos(a1))} ${f1(c + r * Math.sin(a1))} Z" fill="${shade(i)}" opacity=".85"/>`;
    }
    for (let i = 0; i < p.n; i++) { const a = rad(-90 + i * 360 / p.n); s += `<path d="M${c} ${c} L${f1(c + r * Math.cos(a))} ${f1(c + r * Math.sin(a))}" stroke="${DK}" stroke-width="5" stroke-linecap="round"/>`; }
    s += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${DK}" stroke-width="5"/>`;
    for (let i = 0; i < p.n; i++) { const mid = rad(-90 + (i + 0.5) * 360 / p.n), k = p.n > 6 ? 0.66 : 0.55; s += tag(c + r * k * Math.cos(mid), c + r * k * Math.sin(mid), i); }
    return svgBox(200, 200, s, `a circle in ${p.n} equal parts`);
  }
  const W = 200, H = 130, parts = [];
  if (p.cut === "grid") {
    const cols = p.n / 2;
    for (let i = 0; i < p.n; i++) { const x0 = (i % cols) * W / cols, y0 = Math.floor(i / cols) * H / 2; parts.push([[x0, y0], [x0 + W / cols, y0], [x0 + W / cols, y0 + H / 2], [x0, y0 + H / 2]]); }
  } else if (p.cut === "diagonal") parts.push([[0, 0], [W, 0], [0, H]], [[W, 0], [W, H], [0, H]]);
  else for (let i = 0; i < p.n; i++) {
    if (p.cut === "down") parts.push([[i * W / p.n, 0], [(i + 1) * W / p.n, 0], [(i + 1) * W / p.n, H], [i * W / p.n, H]]);
    else parts.push([[0, i * H / p.n], [W, i * H / p.n], [W, (i + 1) * H / p.n], [0, (i + 1) * H / p.n]]);
  }
  s += house(poly([[0, 0], [W, 0], [W, H], [0, H]]), "#5cc8ff");
  parts.forEach((q, i) => {
    if (shade(i)) s += `<g fill="${shade(i)}" opacity=".85">${poly(q)}</g>`;
    s += `<g fill="none" stroke="${DK}" stroke-width="5" stroke-linejoin="round">${poly(q)}</g>`;
  });
  // A diagonal half's middle is a third of the way in from its square corner.
  parts.forEach((q, i) => { const cx = q.reduce((t, v) => t + v[0], 0) / q.length, cy = q.reduce((t, v) => t + v[1], 0) / q.length; s += tag(cx, cy, i); });
  return svgBox(W, H, s, `a rectangle in ${p.n} equal parts`);
}
// "1/4" in a gold rounded tag, for the shaded part of a unit fraction, worked.
function fracBadge(x, y, label) {
  return `<rect x="${f1(x - 22)}" y="${f1(y - 14)}" width="44" height="28" rx="10" fill="${GOLD}" stroke="${DK}" stroke-width="2.5"/><text x="${f1(x)}" y="${f1(y)}" dy=".35em" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="16" fill="${DK}">${label}</text>`;
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
// Before answering, sides, corners and parts are counted about halfway ("1, 2, … How many?");
// worked, all the way, and the shape's name when it has one ("A hexagon has 6 sides.").
export function countHint(p, worked) {
  const upto = partsCounted(p.n, worked), nums = Array.from({ length: upto }, (_, i) => i + 1).join(", ");
  const count = (what) => (worked ? `${what}: ${nums}.` : upto ? `${what}: ${nums}, … How many?` : `${what}. How many?`);
  const whose = p.shape ? `${cap(article(p.shape))}${p.shape} has` : "It has";
  if (p.kind === "sides") return { say: `${count("Count each side, going round")}${worked ? ` ${whose} ${p.n} sides.` : ""}` };
  if (p.kind === "corners") return { say: `${count("Count each corner, going round")}${worked ? ` ${whose} ${p.n} corners.` : ""}` };
  if (p.kind === "faces") return p.solid === "cube"
    ? { say: `You can see 3 faces. 3 more hide on the back. 3 + 3 = ${worked ? 6 : "?"}` }
    : { say: `4 triangles go round, and a square is on the bottom. 4 + 1 = ${worked ? 5 : "?"}` };
  if (p.kind === "parts") return { say: `${count("Count the parts")}${worked ? ` ${p.n} equal parts.` : ""}` };
  if (p.kind === "unit") return { say: worked ? `Count the equal parts: ${nums}. Each part is 1/${p.n}.` : `Count the equal parts${upto ? `: ${nums}, …` : "."} Each part is 1/?` };
  // "Each row has 4: 4, 8, … How many in 3 rows?"; worked, "4 + 4 + 4 = 12".
  if (worked) return { say: `${Array.from({ length: p.rows }, () => p.cols).join(" + ")} = ${p.ans}` };
  const run = Array.from({ length: rowsCounted(p, false) }, (_, i) => (i + 1) * p.cols);
  return { say: `Each row has ${p.cols}: ${run.join(", ")}, … How many in ${p.rows} rows?` };
}

/* ---------- the game's facts (Polly-Gon's strands: learn.js shapesK, shapesH, shapesM, shapesT) ----------
   Fixed samples with keys, so a level can be learned and every problem is recorded:
   - "◇draw:tri": draw a triangle (touch screens, on the spell pad). Shapes: circle, tri, sq,
     rect, rhom, pent, hex, and quad (any four-sided shape, 3rd grade).
   - "◇sides:tri", "◇corners:hex": the sides (or corners) of a named shape, drawn; "◇sides:5": a
     shape with 5 sides, drawn uneven and turned any way, so it's counting, not knowing a name.
   - "◇faces:cube" (6), "◇faces:pyramid" (a square pyramid, 5).
   - "◇parts:circle4", "◇parts:rect2a": how many equal parts? A rectangle is cut across (a), down
     (d), corner to corner (x), or in a grid of 2 rows (g).
   - "◇squares:3,4": 3 rows of 4 squares, how many in all?
   - "◇unit:circle4", "◇unit:rect6g": one of the equal parts shaded, "each part is 1/□" (3rd grade).
   A fact: { op: "◇", kind, key, q, ans, … }. A drawing's ans here is its sides (a circle's 0); in
   a fight it hits for the strand's typical answer instead (learn.js drawHit). */
export const SHAPE_CODE = { circle: "circle", tri: "triangle", sq: "square", rect: "rectangle", rhom: "rhombus", pent: "pentagon", hex: "hexagon", quad: "quadrilateral" };
const SIDES = { circle: 0, triangle: 3, square: 4, rectangle: 4, rhombus: 4, pentagon: 5, hexagon: 6, quadrilateral: 4 };
export const isDrawKey = (key) => String(key).startsWith("◇draw:");
const x2 = (pts) => pts.map(([x, y]) => [f1(x * 2), f1(y * 2)]);
// A named shape's corners in a 200 box, turned one of the ways it's met: a triangle point up or
// down, a square upright or on its corner, a rectangle wide or tall, a rhombus as a diamond or
// slanted (every side 110 long).
function namedPts(shape, rnd) {
  const r = rnd();
  if (shape === "triangle") return x2(polygon(3, r < 0.7 ? 0 : 180));
  if (shape === "square") return r < 0.75 ? [[30, 30], [170, 30], [170, 170], [30, 170]] : x2(polygon(4, 0));
  if (shape === "rectangle") return r < 0.6 ? [[10, 50], [190, 50], [190, 150], [10, 150]] : [[50, 10], [150, 10], [150, 190], [50, 190]];
  if (shape === "rhombus") return r < 0.5 ? [[100, 8], [160, 100], [100, 192], [40, 100]] : [[10, 145], [120, 145], [175, 49.7], [65, 49.7]];
  if (shape === "quadrilateral") return [[40, 60], [170, 35], [160, 170], [25, 150]];
  if (shape === "pentagon") return x2(polygon(5, r < 0.75 ? 0 : 180));
  return x2(polygon(6, r < 0.5 ? 0 : 30));
}
const PARTS = /^(circle|rect)(\d)([adxg]?)$/, CUT = { a: "across", d: "down", x: "diagonal", g: "grid" };
// A fact from its key; rnd turns a named shape and draws an uneven one.
export function shapeFactOf(key, rnd = Math.random) {
  const [kind, arg] = key.slice(1).split(":"), base = { op: "◇", kind, key };
  if (kind === "draw") { const shape = SHAPE_CODE[arg]; return Object.assign(base, { draw: true, shape, ans: SIDES[shape], q: `Draw ${article(shape)}${shape}` }); }
  if (kind === "sides" || kind === "corners") {
    const shape = SHAPE_CODE[arg] || null, n = shape ? SIDES[shape] : Number(arg);
    return Object.assign(base, { shape, n, pts: shape ? namedPts(shape, rnd) : irregular(n, rnd), ans: n, q: `${cap(kind)} = □` });
  }
  if (kind === "faces") return Object.assign(base, { solid: arg, ans: arg === "cube" ? 6 : 5, q: "Faces = □" });
  if (kind === "squares") { const [rows, cols] = arg.split(",").map(Number); return Object.assign(base, { rows, cols, ans: rows * cols, q: "Squares = □" }); }
  const m = PARTS.exec(arg), n = Number(m[2]), whole = m[1] === "circle" ? "circle" : "rectangle";
  return Object.assign(base, { whole, n, cut: whole === "circle" ? "slices" : CUT[m[3]], ans: n, q: kind === "unit" ? "1/□" : "Equal parts = □" });
}
// Each strand's levels, in the school's order, as their keys. Drawing is never more than 40% of a
// level, so on a mouse or keyboard (no drawing: app.js asks counting instead) every level can
// still be half learned and open the next.
const K = (kind, list) => list.map((a) => `◇${kind}:${a}`);
export const SHAPE_STRANDS = {
  // K (K.GM.A): name and draw circles, squares, triangles and rectangles, then hexagons; their
  // sides and corners.
  shapesK: [
    { name: "Circles, squares, triangles, rectangles", keys: [...K("draw", ["circle", "sq", "tri", "rect"]), ...K("sides", ["tri", "sq", "rect"]), ...K("corners", ["tri", "sq", "rect"])] },
    { name: "Hexagons, sides and corners", keys: [...K("draw", ["hex"]), ...K("sides", ["hex", 3, 4, 5, 6]), ...K("corners", ["hex", 3, 4, 5, 6])] }
  ],
  // 1st (1.GM.A.1, A.3): defining attributes (sides and corners, whatever the shape's size or
  // turn), then halves and fourths of circles and rectangles.
  shapesH: [
    { name: "Sides and corners", keys: [...K("draw", ["circle", "tri", "sq", "rect", "hex"]), ...K("sides", ["tri", "sq", "rect", "hex", 3, 4, 5, 6]), ...K("corners", [3, 4, 5, 6])] },
    { name: "Halves and fourths", keys: K("parts", ["circle2", "circle4", "rect2a", "rect2d", "rect2x", "rect4a", "rect4d", "rect4g"]) }
  ],
  // 2nd (2.GM.A.1–3): shapes with a given number of sides or angles (triangles, quadrilaterals,
  // pentagons, hexagons) and a cube's faces; equal shares of circles and rectangles in 2, 3 or 4
  // (a priority standard); a rectangle in rows and columns of squares, counted.
  shapesM: [
    { name: "Sides, corners and faces", keys: [...K("draw", ["tri", "sq", "rect", "pent", "hex"]), ...K("sides", ["pent", 3, 4, 5, 6]), ...K("corners", ["pent", 3, 4, 5, 6]), ...K("faces", ["cube", "pyramid"])] },
    { name: "Equal shares", keys: K("parts", ["circle2", "circle3", "circle4", "rect2a", "rect2d", "rect2x", "rect3a", "rect3d", "rect4a", "rect4d", "rect4g"]) },
    { name: "Rows and columns of squares", keys: K("squares", [2, 3, 4].flatMap((r) => [2, 3, 4, 5].map((c) => `${r},${c}`))) }
  ],
  // 3rd (3.G.A.1, A.2): quadrilaterals (a square is a rectangle and a rhombus), then shapes cut
  // into equal areas, each part a unit fraction of the whole.
  shapesT: [
    { name: "Quadrilaterals", keys: [...K("draw", ["quad", "sq", "rect", "rhom"]), ...K("sides", ["rhom", 4, 5, 6]), ...K("corners", ["rhom", 4, 5, 6])] },
    { name: "Unit fractions", keys: K("unit", ["circle2", "circle3", "circle4", "circle6", "circle8", "rect2a", "rect3d", "rect4a", "rect4g", "rect6g", "rect8g"]) }
  ]
};
let factCache = null;
// Every shape fact once (the strands share some: a triangle's sides are K's and 1st grade's).
export function shapeFacts() {
  if (factCache) return factCache;
  const keys = [...new Set(Object.values(SHAPE_STRANDS).flat().flatMap((l) => l.keys))];
  return (factCache = keys.map((k) => shapeFactOf(k, () => 0.5)));
}

/* ---------- what's said ---------- */
// Asked: "Draw a triangle!", "How many sides does this hexagon have?", "How many corners?",
// "How many faces does this cube have?", "How many equal parts?", "How many squares in all?",
// and 3rd grade's "The whole is cut into equal parts. Each part is one what?"
// Kokoro says "hexagon" HEK-sag-un and "pentagon" PEN-tag-un (espeak: hˈɛksæɡən); spelled
// "hexa-gon" and "penta-gon" it says HEK-suh-gon and PEN-tuh-gon, as a teacher does. Only in what's
// spoken: the screen keeps the words.
export const sayShapes = (t) => t.replace(/([Hh])exagon/g, "$1exa-gon").replace(/([Pp])entagon/g, "$1enta-gon");
export function spokenShape(p) { return sayShapes(spokenShapeText(p)); }
export function spokenShapeAnswer(p) { return sayShapes(spokenShapeAnswerText(p)); }
export function squawkLine(p) { return sayShapes(squawkLineText(p)); }
function spokenShapeText(p) {
  if (p.kind === "draw") return spokenDraw(p.shape);
  if (p.kind === "sides" || p.kind === "corners") return p.shape ? `How many ${p.kind} does this ${p.shape} have?` : `How many ${p.kind}?`;
  if (p.kind === "faces") return `How many faces does this ${p.solid === "cube" ? "cube" : "pyramid"} have?`;
  if (p.kind === "parts") return "How many equal parts?";
  if (p.kind === "squares") return "How many squares in all?";
  return "The whole is cut into equal parts. Each part is one what?";
}
// Said after a miss: what the shape is ("A triangle has three sides and three corners."), or the
// count ("A hexagon has six sides.", "It has five corners.", "Four equal parts: fourths.",
// "Three rows of four make twelve squares.", "Each part is one fourth.").
const DRAWN = { circle: "A circle is round, with no corners.", triangle: "A triangle has three sides and three corners.", square: "A square has four sides, all the same length.",
  rectangle: "A rectangle has four sides and four square corners.", rhombus: "A rhombus has four sides, all the same length.", pentagon: "A pentagon has five sides and five corners.",
  hexagon: "A hexagon has six sides and six corners.", quadrilateral: "A quadrilateral has four sides and four corners." };
function spokenShapeAnswerText(p) {
  if (p.kind === "draw") return DRAWN[p.shape];
  if (p.kind === "sides" || p.kind === "corners") return `${p.shape ? cap(article(p.shape)) + p.shape : "It"} has ${spoken(p.n)} ${p.kind}.`;
  if (p.kind === "faces") return p.solid === "cube" ? "A cube has six faces." : "A square pyramid has five faces.";
  if (p.kind === "parts") return `${cap(spoken(p.n))} equal parts: ${unitName(p.n)}.`;
  if (p.kind === "squares") return `${cap(spoken(p.rows))} rows of ${spoken(p.cols)} make ${spoken(p.ans)} squares.`;
  return `Each part is ${fractionWords(1, p.n, spoken)}.`;
}
// Polly-Gon's squawk before each problem: "Squawk! Polly want a
// triangle!" for a drawing, the shape's name for a named one, else what's counted.
function squawkLineText(p) {
  if (p.kind === "draw") return `Squawk! Polly want ${article(p.shape)}${p.shape}!`;
  if (p.shape) return `Squawk! ${cap(p.shape)}!`;
  if (p.kind === "faces") return p.solid === "cube" ? "Squawk! Cube!" : "Squawk! Pyramid!";
  if (p.kind === "parts" || p.kind === "unit") return "Squawk! Equal parts!";
  if (p.kind === "squares") return "Squawk! Squares!";
  return "Squawk! Count with me!";
}
// The screen's words for a count (app.js): "Sides = □".
export const SHAPE_LINE = { sides: "Sides", corners: "Corners", faces: "Faces", parts: "Equal parts", squares: "Squares" };

/* ---------- drawing it: the hint and the clean shape ---------- */
// The hint for a drawing: the shape's corners as dots to join, numbered going round, the first
// sides drawn and the rest left to do (a circle: its first half traced, the rest dotted).
// Worked: the whole shape, each side numbered.
export function drawHintSvg(shape, worked) {
  let s = "";
  if (shape === "circle") {
    s += worked ? house(`<circle cx="100" cy="100" r="80"/>`, "#5cc8ff")
      : `<circle cx="100" cy="100" r="80" fill="none" stroke="${CREAM}" stroke-width="4" stroke-dasharray="3 10" stroke-linecap="round" opacity=".7"/><path d="M100 20 A80 80 0 0 1 100 180" fill="none" stroke="${GOLD}" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="20" r="8" fill="${GOLD}" stroke="${DK}" stroke-width="2.5"/>`;
    return svgBox(200, 200, s, worked ? "a circle" : "a circle, half traced");
  }
  const pts = namedPts(shape, () => 0), n = pts.length, cx = pts.reduce((t, q) => t + q[0], 0) / n, cy = pts.reduce((t, q) => t + q[1], 0) / n;
  if (worked) s += house(poly(pts), COLORS[n]);
  else {
    s += `<path d="M${pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(" L")} Z" fill="none" stroke="${CREAM}" stroke-width="4" stroke-dasharray="3 10" stroke-linecap="round" opacity=".7"/>`;
    for (let i = 0; i < Math.floor(n / 2); i++) { const a = pts[i], b = pts[(i + 1) % n]; s += `<path d="M${f1(a[0])} ${f1(a[1])} L${f1(b[0])} ${f1(b[1])}" stroke="${GOLD}" stroke-width="7" stroke-linecap="round"/>`; }
  }
  pts.forEach(([x, y], i) => {
    const d = Math.hypot(x - cx, y - cy) || 1;
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="8" fill="${GOLD}" stroke="${DK}" stroke-width="2.5"/>`;
    if (!worked) s += badge(x + (x - cx) / d * 24, y + (y - cy) / d * 24, i + 1, false);
  });
  // Worked: each side numbered, at its middle.
  if (worked) pts.forEach((a, i) => { const b = pts[(i + 1) % n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, d = Math.hypot(mx - cx, my - cy) || 1; s += badge(mx + (mx - cx) / d * 22, my + (my - cy) / d * 22, i + 1, i === n - 1); });
  return svgBox(200, 200, s, worked ? `${article(shape)}${shape}` : `${n} dots to join`, 30);
}
// The hint's words: "A triangle has 3 corners. Join the dots!"; worked, "A triangle has 3 sides
// and 3 corners."
export function drawHint(shape, worked) {
  if (shape === "circle") return { say: worked ? "A circle is round all the way, with no corners." : "A circle is round. Keep going all the way round!" };
  const n = SIDES[shape], A = cap(article(shape)) + shape;
  if (worked) return { say: shape === "square" || shape === "rhombus" ? `${A} has 4 sides, all the same length.` : `${A} has ${n} sides and ${n} corners.` };
  return { say: `${A} has ${n} corners. Join the dots!` };
}
// The clean shape to glow over a drawing (cleanShape), for the shape that answered: what they drew
// when it counts (a square for "rectangle"), or the one asked (a rectangle for "quadrilateral").
export function cleanFor(r, asked, box) {
  const ok = accepts(asked), mine = r && ok.has(r.shape);
  return cleanShape(mine ? r : null, mine ? r.shape : asked === "quadrilateral" ? "rectangle" : asked, box);
}
