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
// The blocks are drawn as the hints' (js/hints.js blocks(): rods marked in tens of cubes), but bigger,
// outlined and on a place-value mat, so they read on any wall.
import { spoken } from "./problems.js";

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


/* ---------- the blocks, on a place-value mat ---------- */
// The blocks sit on a mat in the game's own look (a dark panel like the hint box: the stratum's
// --panel, a --line border, rounded corners) with three columns (hundreds | tens | ones, labels in
// --muted, dividers in --line), as in class, so they read at a glance whatever the wall. Classic
// base-ten colors stay bright: flats and rods blue, cubes orange, each with a dark outline, a light
// edge and a sheen, a little apart so 2 cubes read as 2. Values in chalk; the hint's in gold.
const DK = "#0c171c", BLUE = "#3fa6e8", ORANGE = "#ff8a3c";
const PANEL = "var(--panel, #1a313a)", LINE = "var(--line, #2a4852)", MUTED = "var(--muted, #a9bec1)", CHALK = "var(--ink, #f3efe4)", HINT = "var(--gold, #ffc93c)";
const SHEEN = `<linearGradient id="pvsh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
const block = (x, y, w, h, fill, cls) => `<rect x="${f1(x)}" y="${f1(y)}" width="${w}" height="${h}" rx="2" fill="${fill}" stroke="${DK}" stroke-width="2" class="${cls}"/><rect x="${f1(x + 1)}" y="${f1(y + 1)}" width="${w - 2}" height="${h - 2}" rx="1.5" fill="url(#pvsh)" stroke="#ffffff66" stroke-width="1"/>`;
const CUBE = 14, ROD_W = 11, ROD_H = 60, FLAT = 60;
const cube = (x, y) => block(x, y, CUBE, CUBE, ORANGE, "cube");
function rod(x, y) {
  let s = block(x, y, ROD_W, ROD_H, BLUE, "rod");
  for (let k = 1; k < 10; k++) s += `<line x1="${f1(x)}" y1="${f1(y + k * 6)}" x2="${f1(x + ROD_W)}" y2="${f1(y + k * 6)}" stroke="${DK}" stroke-width=".9" opacity=".55"/>`;
  return s;
}
function flat(x, y) {
  let s = block(x, y, FLAT, FLAT, BLUE, "flat");
  for (let k = 1; k < 10; k++) s += `<line x1="${f1(x + k * 6)}" y1="${f1(y)}" x2="${f1(x + k * 6)}" y2="${f1(y + FLAT)}" stroke="${DK}" stroke-width=".7" opacity=".45"/><line x1="${f1(x)}" y1="${f1(y + k * 6)}" x2="${f1(x + FLAT)}" y2="${f1(y + k * 6)}" stroke="${DK}" stroke-width=".7" opacity=".45"/>`;
  return s;
}
// A group: n flats in rows of 3; n rods in groups of ten (two groups to a row, a gap between), so
// tens of tens show before any hint; n cubes in pairs, stacked up, 4 apart. Each { s, w, h }.
function flats(n) {
  const per = 3;
  let s = "";
  for (let i = 0; i < n; i++) s += flat((i % per) * (FLAT + 6), Math.floor(i / per) * (FLAT + 6));
  return { s, w: n ? Math.min(n, per) * (FLAT + 6) - 6 : 0, h: n ? Math.ceil(n / per) * (FLAT + 6) - 6 : 0 };
}
function rods(n, opt = {}) {
  let s = "";
  const groups = Math.ceil(n / 10), perRow = n > 10 ? 2 : 1, step = ROD_W + 3, gw = 10 * step - 3, gh = ROD_H;
  for (let g = 0; g < groups; g++) {
    const gx = (g % perRow) * (gw + 12), gy = Math.floor(g / perRow) * (gh + 16), k = Math.min(10, n - g * 10);
    // The hint rings each full ten of tens as a hundred: rods slide together into a flat outline.
    if (opt.ringTens && k === 10) s += `<rect x="${f1(gx - 4)}" y="${f1(gy - 4)}" width="${gw + 8}" height="${gh + 8}" rx="5" fill="none" stroke="${HINT}" stroke-width="3" stroke-dasharray="6 4"/>` + `<text x="${f1(gx + gw / 2)}" y="${f1(gy + gh + 14)}" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="12" fill="${HINT}">100</text>`;
    for (let i = 0; i < k; i++) s += rod(gx + i * step, gy);
  }
  const rowsUsed = Math.ceil(groups / perRow);
  return { s, w: n ? Math.min(groups, perRow) * (gw + 12) - 12 : 0, h: n ? rowsUsed * (gh + 16) - 16 : 0 };
}
function cubes(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += cube((i % 2) * (CUBE + 4), ROD_H - CUBE - Math.floor(i / 2) * (CUBE + 4));
  return { s, w: n ? (n > 1 ? 2 * CUBE + 4 : CUBE) : 0, h: n ? ROD_H : 0 };
}

// The picture: a mat with three columns (hundreds | tens | ones), each column's blocks standing
// on the same floor, its label at the top; under each, its value with the hint (or, for expanded
// form, always). opt.hint and opt.worked shape the hint:
// - tens: each flat shown as its ten rods in the tens column, ringed as hundreds, counted.
// - odd: each ten rods ringed as a hundred.
export function pvSvg(p, opt = {}) {
  const hint = !!opt.hint;
  const tensHint = p.kind === "tens" && hint;
  const cols = [
    { name: "hundreds", g: tensHint ? flats(0) : flats(p.h), label: p.h && !tensHint ? `${p.h * 100}` : "" },
    { name: "tens", g: tensHint ? rods(p.h * 10 + p.t, { ringTens: true }) : rods(p.t, { ringTens: p.kind === "odd" && hint }),
      label: tensHint ? (opt.worked ? `${p.h * 10 + p.t} tens` : "? tens") : p.kind === "odd" && hint ? `${p.t} tens` : p.t ? `${p.t * 10}` : "" },
    { name: "ones", g: cubes(p.o), label: p.o ? `${p.o}` : "" }
  ];
  const showLabels = hint || p.kind === "expanded";
  const pad = 12, top = 24, inner = Math.max(ROD_H, ...cols.map((c) => c.g.h)), bottom = showLabels ? 26 : 10;
  let x = 0, s = "";
  cols.forEach((c, i) => {
    const w = Math.max(i === 2 ? 44 : 64, c.g.w) + pad * 2;
    if (i) s += `<line x1="${f1(x)}" y1="6" x2="${f1(x)}" y2="${f1(top + inner + bottom - 6)}" stroke="${LINE}" stroke-width="2"/>`;
    s += `<text x="${f1(x + w / 2)}" y="16" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="11" fill="${MUTED}">${c.name}</text>`;
    s += `<g transform="translate(${f1(x + (w - c.g.w) / 2)} ${f1(top + inner - c.g.h)})">${c.g.s}</g>`;
    if (showLabels && c.label) s += `<text x="${f1(x + w / 2)}" y="${f1(top + inner + 19)}" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="15" fill="${hint ? HINT : CHALK}">${c.label}</text>`;
    x += w;
  });
  const W = x, H = top + inner + bottom;
  const mat = `<rect x="0" y="0" width="${f1(W)}" height="${f1(H)}" rx="14" fill="${PANEL}" stroke="${LINE}" stroke-width="3"/>`;
  return `<svg viewBox="-6 -6 ${f1(W + 12)} ${f1(H + 12)}" class="pv" role="img" aria-label="${p.h} hundreds, ${p.t} tens, ${p.o} ones"><defs>${SHEEN}</defs>${mat}${s}</svg>`;
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
