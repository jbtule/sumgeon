// Angles and classifying shapes (4th grade, 4.GM.A.2 and 4.GM.B.4, DESIGN.md §4.4): read an angle
// on a protractor (to the nearest 10°), the missing part of a right or straight angle (90° = 35° +
// □°), and count a drawn shape's right angles, pairs of parallel sides or lines of symmetry. Every
// answer is a whole number typed on the pad. No DOM: the drawings are SVG strings, so the tests
// run in Node. Keys: "∠r40", "∠a90,35", "∠R:trap", "∠P:hex", "∠S:kite".
import { spoken } from "./problems.js";

const INK = "var(--ink, #f3efe4)", GOLD = "var(--gold, #ffc93c)", CORAL = "var(--coral, #ff5a4e)", MUTED = "var(--muted, #9fb3b8)";
const f1 = (n) => Math.round(n * 10) / 10;
const cap = (t) => t[0].toUpperCase() + t.slice(1);
const txt = (x, y, t, size, color, anchor) => `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor || "middle"}" fill="${color || INK}" font-family="Nunito,sans-serif" font-size="${size || 13}" font-weight="900">${t}</text>`;

/* ---------- the shapes ----------
   Each is drawn from its corners (in a 0–100 box, y down), with what's counted: its right-angle
   corners, its pairs of parallel sides (as side indexes; side i goes from corner i to i + 1) and
   its lines of symmetry (as two points each). */
const SQ = [[10, 10], [90, 10], [90, 90], [10, 90]];
export const SHAPES = {
  square: { name: "square", pts: SQ, right: [0, 1, 2, 3], par: [[0, 2], [1, 3]], sym: [[[50, 0], [50, 100]], [[0, 50], [100, 50]], [[0, 0], [100, 100]], [[100, 0], [0, 100]]] },
  rect: { name: "rectangle", pts: [[0, 22], [100, 22], [100, 78], [0, 78]], right: [0, 1, 2, 3], par: [[0, 2], [1, 3]], sym: [[[50, 12], [50, 88]], [[-8, 50], [108, 50]]] },
  rtri: { name: "right triangle", pts: [[12, 8], [12, 92], [92, 92]], right: [1], par: [], sym: [] },
  trap: { name: "trapezoid", pts: [[8, 18], [60, 18], [94, 84], [8, 84]], right: [0, 3], par: [[0, 2]], sym: [] },
  isotrap: { name: "trapezoid", pts: [[28, 20], [72, 20], [96, 82], [4, 82]], right: [], par: [[0, 2]], sym: [[[50, 10], [50, 92]]] },
  para: { name: "parallelogram", pts: [[26, 20], [98, 20], [74, 82], [2, 82]], right: [], par: [[0, 2], [1, 3]], sym: [] },
  house: { name: "pentagon", pts: [[50, 4], [92, 40], [92, 96], [8, 96], [8, 40]], right: [2, 3], par: [[1, 3]], sym: [[[50, -4], [50, 104]]] },
  hex: { name: "hexagon", pts: [0, 60, 120, 180, 240, 300].map((a) => [f1(50 + 46 * Math.cos(a * Math.PI / 180)), f1(50 + 46 * Math.sin(a * Math.PI / 180))]), right: [], par: [[0, 3], [1, 4], [2, 5]],
    sym: [0, 30, 60, 90, 120, 150].map((a) => { const c = Math.cos(a * Math.PI / 180) * 54, s = Math.sin(a * Math.PI / 180) * 54; return [[f1(50 - c), f1(50 - s)], [f1(50 + c), f1(50 + s)]]; }) },
  eqtri: { name: "triangle", pts: [[50, 8], [96, 88], [4, 88]], right: [], par: [], sym: [[[50, 0], [50, 96]], [[2, 90], [76, 46]].map(([x, y]) => [x, y]), [[98, 90], [24, 46]]] },
  isotri: { name: "triangle", pts: [[50, 4], [78, 94], [22, 94]], right: [], par: [], sym: [[[50, -4], [50, 100]]] },
  kite: { name: "kite", pts: [[50, 4], [84, 36], [50, 96], [16, 36]], right: [], par: [], sym: [[[50, -4], [50, 104]]] }
};
// The equilateral triangle's lines of symmetry go from each corner to the middle of the side across.
SHAPES.eqtri.sym = SHAPES.eqtri.pts.map((p, i) => { const a = SHAPES.eqtri.pts[(i + 1) % 3], b = SHAPES.eqtri.pts[(i + 2) % 3]; return [p, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]]; });
const COUNT = { R: "right", P: "par", S: "sym" };
const ASK = { R: "Right angles", P: "Parallel pairs", S: "Symmetry lines" };

/* ---------- facts ---------- */
export function angleFact(key) {
  const t = key.slice(1);
  if (t[0] === "r") { const deg = +t.slice(1); return { op: "∠", kind: "read", deg, ans: deg, q: "Angle = □°", parts: ["Angle = ", null, "°"], key }; }
  if (t[0] === "a") { const [whole, part] = t.slice(1).split(",").map(Number); return { op: "∠", kind: "add", whole, part, ans: whole - part, q: `${whole}° = ${part}° + □°`, parts: [`${whole}° = ${part}° + `, null, "°"], key }; }
  const [what, shape] = t.split(":"), S = SHAPES[shape];
  return { op: "∠", kind: what, shape, name: S.name, ans: S[COUNT[what]].length, q: `${ASK[what]} = □`, parts: [`${ASK[what]} = `, null], key };
}
export function angleFacts() {
  const out = [];
  for (const d of [20, 30, 40, 50, 60, 70, 80, 100, 120, 130, 150, 160]) out.push(angleFact("∠r" + d));
  for (const p of [35, 60, 25, 70, 45, 15]) out.push(angleFact(`∠a90,${p}`));
  for (const p of [120, 45, 150, 75, 30, 100]) out.push(angleFact(`∠a180,${p}`));
  return out.map((f) => Object.assign(f, { set: "angles" }));
}
export function shapeAngleFacts() {
  const keys = ["R:square", "R:rect", "R:rtri", "R:trap", "R:para", "R:house", "P:square", "P:trap", "P:para", "P:rtri", "P:hex", "P:isotrap", "S:square", "S:rect", "S:eqtri", "S:isotri", "S:hex", "S:kite"];
  return keys.map((k) => Object.assign(angleFact("∠" + k), { set: "classify" }));
}

/* ---------- spoken ---------- */
const article = (w) => (/^[aeiou]/.test(w) ? "an " : "a ");
export function spokenAngle(p) {
  if (p.kind === "read") return "How many degrees is this angle?";
  if (p.kind === "add") return `${cap(spoken(p.whole))} degrees is ${spoken(p.part)} degrees and how many more?`;
  if (p.kind === "R") return `How many right angles does this ${p.name} have?`;
  if (p.kind === "P") return `How many pairs of parallel sides does this ${p.name} have?`;
  return `How many lines of symmetry does this ${p.name} have?`;
}
export function spokenAngleAnswer(p) {
  const n = (k, one, many) => `${spoken(k)} ${k === 1 ? one : many}`;
  if (p.kind === "read") return `It's ${spoken(p.ans)} degrees.`;
  if (p.kind === "add") return `${cap(spoken(p.part))} and ${spoken(p.ans)} make ${spoken(p.whole)} degrees.`;
  if (p.kind === "R") return `This ${p.name} has ${n(p.ans, "right angle", "right angles")}.`;
  if (p.kind === "P") return `This ${p.name} has ${n(p.ans, "pair", "pairs")} of parallel sides.`;
  return `This ${p.name} has ${n(p.ans, "line", "lines")} of symmetry.`;
}

/* ---------- drawings ----------
   opt.hint: the hint drawn on it; opt.worked: all of it (the answer shown). */
// A half protractor (0 to 180, ticks every 10°, numbers every 30°) with the angle's two rays from
// its middle: one along 0, the other at deg. The hint counts the ticks by 10s from 0, partway.
function protractor(p, opt) {
  const cx = 110, cy = 104, R = 92, at = (deg, r) => [f1(cx + r * Math.cos(-deg * Math.PI / 180)), f1(cy + r * Math.sin(-deg * Math.PI / 180))];
  let s = `<path d="M${cx - R} ${cy} A${R} ${R} 0 0 1 ${cx + R} ${cy} Z" fill="#ffc93c18" stroke="${INK}" stroke-width="2.5"/>`;
  for (let d = 0; d <= 180; d += 10) { const [x1, y1] = at(d, R), [x2, y2] = at(d, d % 30 ? R - 8 : R - 13); s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="${d % 30 ? 1.5 : 2.5}"/>`; }
  // (0 and 180 sit just above the baseline, clear of the rays.)
  for (let d = 0; d <= 180; d += 30) { const [x, y] = at(d, R - 24); s += txt(x, y + (d % 180 ? 4 : -6), d, 11, MUTED); }
  // The hint: the count by 10s along the arc to the ray, stopping short before answering.
  if (opt.hint || opt.worked) {
    const upto = opt.worked ? p.deg : Math.max(10, Math.floor(p.deg / 20) * 10);
    for (let d = 10; d <= upto; d += 10) { const [x, y] = at(d, R + 10); s += txt(x, y + 4, d, 10, d === p.deg ? GOLD : CORAL); }
    if (!opt.worked) { const [x, y] = at(p.deg, R + 12); s += txt(x, y + 4, "?", 12, GOLD); }
  }
  const [ex, ey] = at(p.deg, R + 2), [bx] = at(0, R + 2), arc = at(p.deg, 26);
  s += `<path d="M${cx + 26} ${cy} A26 26 0 0 0 ${arc[0]} ${arc[1]}" fill="none" stroke="${GOLD}" stroke-width="3"/>`;
  s += `<line x1="${cx}" y1="${cy}" x2="${bx}" y2="${cy}" stroke="${CORAL}" stroke-width="4" stroke-linecap="round"/><line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="${CORAL}" stroke-width="4" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="4" fill="${INK}"/>`;
  return { s, w: 220, h: 114, label: "an angle on a protractor" };
}
// A right or straight angle cut by a ray: the part given, labeled, and the part to find.
function split(p, opt) {
  const cx = p.whole === 90 ? 40 : 110, cy = 96, R = 84, at = (deg, r) => [f1(cx + r * Math.cos(-deg * Math.PI / 180)), f1(cy + r * Math.sin(-deg * Math.PI / 180))];
  const end = at(p.whole, R), mid = at(p.part, R), arcA = at(p.part, 30), arcB = at(p.whole, 44), arcB0 = at(p.part, 44);
  let s = `<line x1="${cx}" y1="${cy}" x2="${cx + R}" y2="${cy}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><line x1="${cx}" y1="${cy}" x2="${end[0]}" y2="${end[1]}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
  s += `<line x1="${cx}" y1="${cy}" x2="${mid[0]}" y2="${mid[1]}" stroke="${CORAL}" stroke-width="4" stroke-linecap="round"/>`;
  if (p.whole === 90) s += `<path d="M${cx + 12} ${cy} V${cy - 12} H${cx}" fill="none" stroke="${INK}" stroke-width="2"/>`;
  s += `<path d="M${cx + 30} ${cy} A30 30 0 0 0 ${arcA[0]} ${arcA[1]}" fill="none" stroke="${GOLD}" stroke-width="3"/><path d="M${arcB0[0]} ${arcB0[1]} A44 44 0 0 0 ${arcB[0]} ${arcB[1]}" fill="none" stroke="${CORAL}" stroke-width="3"/>`;
  const la = at(p.part / 2, 52), lb = at((p.part + p.whole) / 2, 64);
  s += txt(la[0], la[1] + 5, p.part + "°", 13, GOLD) + txt(lb[0], lb[1] + 5, opt.worked ? p.ans + "°" : "?", 13, CORAL);
  return { s, w: p.whole === 90 ? 140 : 220, h: 104, label: `${p.whole} degrees cut in two` };
}
// A shape, its sides drawn; the hint marks the right angles (little squares), the parallel sides
// (arrow marks, one pair at a time in gold and coral) or the lines of symmetry (dashed), half of
// them before answering.
function shapePic(p, opt) {
  const S = SHAPES[p.shape], k = 0.9, X = (x) => f1(10 + x * k), Y = (y) => f1(8 + y * k), n = S.pts.length;
  let s = `<path d="M${S.pts.map(([x, y]) => X(x) + " " + Y(y)).join(" L")} Z" fill="#ffc93c22" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
  const show = (list) => (opt.worked ? list : opt.hint ? list.slice(0, Math.floor(list.length / 2)) : []);
  if (p.kind === "R") for (const i of show(S.right)) {
    const [x, y] = S.pts[i], a = S.pts[(i + n - 1) % n], b = S.pts[(i + 1) % n], u = (q) => { const dx = q[0] - x, dy = q[1] - y, l = Math.hypot(dx, dy); return [dx / l * 10, dy / l * 10]; };
    const [ax, ay] = u(a), [bx, by] = u(b);
    s += `<path d="M${X(x + ax)} ${Y(y + ay)} L${X(x + ax + bx)} ${Y(y + ay + by)} L${X(x + bx)} ${Y(y + by)}" fill="none" stroke="${GOLD}" stroke-width="2.5"/>`;
  }
  if (p.kind === "P") show(S.par).forEach((pair, j) => {
    const col = j % 2 ? CORAL : GOLD;
    for (const i of pair) {
      const [x1, y1] = S.pts[i], [x2, y2] = S.pts[(i + 1) % n], mx = (x1 + x2) / 2, my = (y1 + y2) / 2, l = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / l, uy = (y2 - y1) / l;
      s += `<line x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}" stroke="${col}" stroke-width="4" stroke-linecap="round"/>`;
      s += `<path d="M${X(mx - ux * 4 - uy * 5)} ${Y(my - uy * 4 + ux * 5)} L${X(mx + ux * 3)} ${Y(my + uy * 3)} L${X(mx - ux * 4 + uy * 5)} ${Y(my - uy * 4 - ux * 5)}" fill="none" stroke="${col}" stroke-width="2.5"/>`;
    }
  });
  if (p.kind === "S") for (const [[x1, y1], [x2, y2]] of show(S.sym)) s += `<line x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}" stroke="${CORAL}" stroke-width="2.5" stroke-dasharray="6 5"/>`;
  return { s, w: 110, h: 110, label: `a ${S.name}` };
}
export function angleSvg(p, opt) {
  opt = opt || {};
  const { s, w, h, label } = p.kind === "read" ? protractor(p, opt) : p.kind === "add" ? split(p, opt) : shapePic(p, opt);
  return `<svg class="anglefig" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}">${s}</svg>`;
}

/* ---------- hints ---------- */
const WHY = {
  read: "Measuring angles: a protractor's scale counts degrees round a half circle, 180 in all. Kids put its middle on the corner and one side on 0, then count by tens to the other side.",
  add: "Angles add up: an angle cut in two parts is the sum of the parts. A right angle is 90°, a straight angle 180°, so the missing part is what's left: 90 − 35.",
  R: "Right angles: a right angle is a square corner, 90°. Kids check each corner, often with the corner of a sheet of paper, and mark it with a little square.",
  P: "Parallel sides: two sides that go the same way and never meet, like train tracks. Kids mark each pair with matching arrows.",
  S: "Lines of symmetry: a line that folds the shape into two halves that match exactly. Kids imagine folding it, or try it with a paper cut-out."
};
export function angleHint(p, worked) {
  const say = p.kind === "read" ? `Count by 10s from 0 along the scale. Angle = ${worked ? p.ans : "?"}`
    : p.kind === "add" ? `${p.part} + □ = ${p.whole}. ${p.whole} − ${p.part} = ${worked ? p.ans : "?"}`
    : p.kind === "R" ? `A right angle is a square corner. ${worked ? "Right angles = " + p.ans : "Check each corner. Right angles = ?"}`
    : p.kind === "P" ? `Parallel sides never meet. ${worked ? "Parallel pairs = " + p.ans : "Match them in pairs. Parallel pairs = ?"}`
    : `Fold it so the halves match. ${worked ? "Symmetry lines = " + p.ans : "Symmetry lines = ?"}`;
  return { say, grownups: WHY[p.kind === "read" || p.kind === "add" ? p.kind : p.kind] };
}
