// Place value with base-ten blocks (2nd grade, 2.NBT.A.1–4, Missouri Learning Standards), for the
// Crystal Mines: a prototype for the review page (review/proto/); nothing in the game reads it yet.
// No DOM: runs in Node.
//
// The school's guide teaches "How many tens are in 120? (12)", "34 tens and 3 ones is 343",
// "1 hundred + 14 tens + 5 ones = 245" and "376 is 37 tens and 6 ones". The odd splits read
// confusingly as text, so the blocks are always drawn, and the levels go from plain to odd:
// - blocks: flats, rods and cubes drawn, "□" (3 flats, 4 rods, 5 cubes is 345; zeros sometimes).
// - expanded: "200 + 40 + 5 = □", the blocks under each part.
// - tens: "How many tens in 120?" (12), 1 flat and 2 rods drawn.
// - odd: "34 tens and 3 ones = □" (343), 34 rods in rows of ten; "1 hundred + 14 tens + 5 ones".
// The blocks match the hints' (js/hints.js blocks()): rods 8 × 50 marked in fives, cubes 8 × 8.
import { spoken } from "./problems.js";

const GOLD = "var(--gold, #ffc93c)", CORAL = "var(--coral, #ff5a4e)", INK = "var(--ink, #f3efe4)", DARK = "var(--dark, #0c171c)", MUTED = "var(--muted, #a9bec1)";
const f1 = (n) => Math.round(n * 10) / 10;
const r = (rnd, a, b) => a + Math.floor(rnd() * (b - a + 1));

export const PV_LEVELS = [
  { id: "blocks", name: "Blocks to a number", grade: "2nd", stratum: "mines" },
  { id: "expanded", name: "Expanded form", grade: "2nd", stratum: "mines" },
  { id: "tens", name: "How many tens?", grade: "2nd", stratum: "mines" },
  { id: "odd", name: "Odd splits", grade: "2nd", stratum: "mines" }
];

// A problem: { kind, h, t, o (the blocks drawn: flats, rods, cubes), ans, form }.
export function pvProblem(id, rnd = Math.random) {
  if (id === "tens") { const h = r(rnd, 1, 3), t = r(rnd, 0, 9); return { kind: "tens", h, t, o: 0, ans: h * 10 + t }; }
  if (id === "odd") {
    // "34 tens and 3 ones" (10 to 39 tens) or "1 hundred + 14 tens + 5 ones" (10 to 19 tens).
    if (rnd() < 0.5) { const t = r(rnd, 10, 39), o = r(rnd, 0, 9); return { kind: "odd", form: "tens", h: 0, t, o, ans: t * 10 + o }; }
    const h = r(rnd, 1, 2), t = r(rnd, 10, 19), o = r(rnd, 0, 9);
    return { kind: "odd", form: "hundred", h, t, o, ans: h * 100 + t * 10 + o };
  }
  // A zero in the tens or the ones now and then (305, 340), never both (400 would be all flats).
  const h = r(rnd, 1, 9), z = rnd();
  const t = z < 0.15 ? 0 : r(rnd, 1, 9), o = z > 0.85 ? 0 : r(rnd, t ? 0 : 1, 9);
  return { kind: id === "expanded" ? "expanded" : "blocks", h, t, o, ans: h * 100 + t * 10 + o };
}

// The question, as written on screen (the slot is null).
export function pvLine(p) {
  if (p.kind === "expanded") return [[p.h * 100, p.t * 10, p.o].filter((v) => v).join(" + ") + " = ", null];
  if (p.kind === "tens") return [`Tens in ${p.h * 100 + p.t * 10}: `, null];
  if (p.kind === "odd" && p.form === "tens") return [`${p.t} tens and ${p.o} one${p.o === 1 ? "" : "s"} = `, null];
  if (p.kind === "odd") return [`${p.h} hundred${p.h > 1 ? "s" : ""} + ${p.t} tens + ${p.o} one${p.o === 1 ? "" : "s"} = `, null];
  return ["What number? ", null];
}
// "Three hundreds, four tens and five ones. What number?"; "How many tens in one hundred
// twenty?"; "Thirty-four tens and three ones is what number?"
const unit = (n, one, many) => `${spoken(n)} ${n === 1 ? one : many}`;
const cap = (t) => t[0].toUpperCase() + t.slice(1);
function partsWords(h, t, o) {
  const parts = [h && unit(h, "hundred", "hundreds"), t && unit(t, "ten", "tens"), o && unit(o, "one", "ones")].filter(Boolean);
  return parts.length > 1 ? parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1] : parts[0];
}
export function spokenPV(p) {
  if (p.kind === "tens") return `How many tens in ${spoken(p.h * 100 + p.t * 10)}?`;
  if (p.kind === "expanded") return `${cap([p.h * 100, p.t * 10, p.o].filter((v) => v).map(spoken).join(" plus "))} equals what?`;
  if (p.kind === "odd") return `${cap(partsWords(p.h, p.t, p.o))} is what number?`;
  return `${cap(partsWords(p.h, p.t, p.o))}. What number?`;
}
export const spokenPVAnswer = (p) => (p.kind === "tens" ? `${cap(spoken(p.ans))} tens.` : `It's ${spoken(p.ans)}.`);

/* ---------- the blocks ---------- */
// A cube, a rod (ten cubes up), a flat (ten rods across): the hints' sizes.
const cube = (x, y, color) => `<rect x="${f1(x)}" y="${f1(y)}" width="8" height="8" rx="1.5" fill="${color}" class="cube"/>`;
function rod(x, y, color) {
  let s = `<rect x="${f1(x)}" y="${f1(y)}" width="8" height="50" rx="1.5" fill="${color}" class="rod"/>`;
  for (let k = 1; k < 10; k++) s += `<line x1="${f1(x)}" y1="${f1(y + k * 5)}" x2="${f1(x + 8)}" y2="${f1(y + k * 5)}" stroke="${DARK}" stroke-width="1"/>`;
  return s;
}
function flat(x, y, color) {
  let s = `<rect x="${f1(x)}" y="${f1(y)}" width="50" height="50" rx="2" fill="${color}" class="flat"/>`;
  for (let k = 1; k < 10; k++) s += `<line x1="${f1(x + k * 5)}" y1="${f1(y)}" x2="${f1(x + k * 5)}" y2="${f1(y + 50)}" stroke="${DARK}" stroke-width=".8"/><line x1="${f1(x)}" y1="${f1(y + k * 5)}" x2="${f1(x + 50)}" y2="${f1(y + k * 5)}" stroke="${DARK}" stroke-width=".8"/>`;
  return s;
}
// A group: n flats in rows of 5; n rods in groups of ten (11 apart, a gap between groups, two
// groups to a row), so tens of tens show before any hint; n cubes in pairs, up the way the
// hints stack them. Each returns { s, w, h } drawn from (x, y).
function flats(n, x, y, color) {
  const per = 5, rows = Math.ceil(n / per);
  let s = "";
  for (let i = 0; i < n; i++) s += flat(x + (i % per) * 54, y + Math.floor(i / per) * 54, color);
  return { s, w: Math.min(n, per) * 54 - 4, h: rows * 54 - 4 };
}
function rods(n, x, y, color, opt = {}) {
  let s = "";
  const groups = Math.ceil(n / 10), perRow = 2;
  const gw = 10 * 11 - 3, gh = 50;
  for (let g = 0; g < groups; g++) {
    const gx = x + (g % perRow) * (gw + 12), gy = y + Math.floor(g / perRow) * (gh + 12), k = Math.min(10, n - g * 10);
    // The hint rings each full ten of tens as a hundred: rods slide together into a flat outline.
    if (opt.ringTens && k === 10) s += `<rect x="${f1(gx - 3)}" y="${f1(gy - 3)}" width="${gw + 6}" height="${gh + 6}" rx="4" fill="none" stroke="${GOLD}" stroke-width="2.5" stroke-dasharray="5 3"/>` + `<text x="${f1(gx + gw / 2)}" y="${f1(gy + gh + 11)}" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="11" fill="${GOLD}">100</text>`;
    for (let i = 0; i < k; i++) s += rod(gx + i * 11, gy, color);
  }
  const rowsUsed = Math.ceil(groups / perRow);
  return { s, w: n ? Math.min(groups, perRow) * (gw + 12) - 12 : 0, h: n ? rowsUsed * (gh + 12) - 12 + (opt.ringTens ? 10 : 0) : 0 };
}
function cubes(n, x, y, color) {
  let s = "";
  for (let i = 0; i < n; i++) s += cube(x + (i % 2) * 10, y + 42 - Math.floor(i / 2) * 10, color);
  return { s, w: n ? (n > 1 ? 18 : 8) : 0, h: n ? 50 : 0 };
}

// The picture: the flats, rods and cubes side by side (labeled under each group with the hint,
// or, for expanded form, always). opt.hint and opt.worked shape the hint:
// - tens: each flat shown as its ten rods, inside the flat's outline, counted.
// - odd: each ten rods ringed as a hundred.
export function pvSvg(p, opt = {}) {
  const hint = !!opt.hint, gap = 18;
  const parts = [];
  if (p.kind === "tens" && hint) {
    // The flats broken into rods: every hundred is ten rods, so all the rods are counted.
    parts.push({ g: rods(p.h * 10 + p.t, 0, 0, GOLD, { ringTens: true }), label: opt.worked ? `${p.h * 10 + p.t} tens` : "? tens" });
  } else {
    if (p.h) parts.push({ g: flats(p.h, 0, 0, CORAL), label: `${p.h * 100}` });
    if (p.t) parts.push({ g: rods(p.t, 0, 0, GOLD, { ringTens: p.kind === "odd" && hint }), label: p.kind === "odd" && hint ? `${p.t} tens` : `${p.t * 10}` });
    if (p.o) parts.push({ g: cubes(p.o, 0, 0, INK), label: `${p.o}` });
  }
  const showLabels = hint || p.kind === "expanded";
  const H = Math.max(...parts.map((q) => q.g.h)) + (showLabels ? 20 : 0);
  let x = 0, s = "";
  for (const q of parts) {
    // Each group sits on the same floor.
    const y = Math.max(...parts.map((v) => v.g.h)) - q.g.h;
    s += `<g transform="translate(${f1(x)} ${f1(y)})">${q.g.s}</g>`;
    if (showLabels) s += `<text x="${f1(x + q.g.w / 2)}" y="${f1(H - 3)}" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="15" fill="${p.kind === "expanded" ? INK : GOLD}">${q.label}</text>`;
    x += q.g.w + gap;
  }
  const W = Math.max(60, x - gap);
  return `<svg viewBox="-6 -6 ${f1(W + 12)} ${f1(H + 12)}" class="pv" role="img" aria-label="${p.h} hundreds, ${p.t} tens, ${p.o} ones">${s}</svg>`;
}
// The hint's words. Before answering they stop at "?".
export function pvHint(p, worked) {
  const end = worked ? p.ans : "?";
  const place = (h, t, o) => `${h} hundred${h === 1 ? "" : "s"}, ${t} ten${t === 1 ? "" : "s"}, ${o} one${o === 1 ? "" : "s"}`;
  if (p.kind === "tens") return { say: `${p.h === 1 ? "1 hundred is" : `${p.h} hundreds are`} ${p.h * 10} tens. ${p.h * 10} + ${p.t} = ${worked ? `${p.ans} tens` : "?"}` };
  if (p.kind === "odd") {
    const H = p.h + Math.floor(p.t / 10), T = p.t % 10;
    return { say: `Every 10 tens make a hundred: ${p.t} tens is ${Math.floor(p.t / 10)} hundred${Math.floor(p.t / 10) === 1 ? "" : "s"} and ${T} ten${T === 1 ? "" : "s"}. ${place(H, T, p.o)} = ${end}` };
  }
  if (p.kind === "expanded") return { say: `Each part is a place: ${place(p.h, p.t, p.o)} = ${end}` };
  return { say: `${p.h * 100} + ${p.t * 10} + ${p.o} = ${end}` };
}
// The blocks a picture draws, for the tests: { flats, rods, cubes }.
export const blockCounts = (svg) => ({ flats: (svg.match(/class="flat"/g) || []).length, rods: (svg.match(/class="rod"/g) || []).length, cubes: (svg.match(/class="cube"/g) || []).length });
