// Reading charts, for Graphzilla (DESIGN.md §4.4): tally charts, picture graphs, bar graphs, line
// plots, frequency tables and line graphs, each grade's kind, drawn with dungeon things (torches,
// potions, keys…). A prototype for the review page (review/proto/); nothing in the game reads it
// yet. No DOM: the drawings are SVG strings, so the tests run in Node.
//
// Missouri Learning Standards (Data Analysis and Statistics, DS):
// - 1st: organize and read data in up to three categories: how many in each, in all, how many
//   more or less (tally charts, picture charts).
// - 2nd: picture graphs and bar graphs of up to four categories, scale 1: put together and
//   compare.
// - 3rd: scaled picture graphs (each picture = 2 or 5) and scaled bar graphs (by 2s, 5s): one- and
//   two-step "how many more, how many fewer"; line plots of lengths in halves and fourths.
// - 4th: frequency tables, line plots, bar and picture graphs, with mode and range.
// - 5th: line plots with the median; line graphs (a value, and the change between two points).
//
// Every problem is a fixed fact (chartFacts), so every spoken line can be recorded: a few data
// sets per level, each asked a few ways. Answers are whole numbers typed on the pad, and the
// damage is the answer, as everywhere. A fact: { op: "▥", set (its level), form, …its data, q
// (the question), ans, key }. Keys (stable, the data and the question, so a key is the problem):
// - "▥T1:torch5,potion7,key3:m.potion.key": a tally chart (T), picture graph (P) or bar graph (B)
//   at a scale (1, 2, 5, 10), its categories, and the question: "n.potion" how many potions,
//   "m.potion.key" how many more potions than keys, "f.key.potion" how many fewer keys than
//   potions, "t.torch.key" torches and keys together, "a" how many in all.
// - "▥L2:bone:2-8:2,3,3,5:at.5": a line plot in halves (L2; L4 fourths, L1 whole numbers), its
//   object, the line's ends and the data in those units, and "at.5" how many at 5 (2½), "gt.4"
//   how many longer than 4 (2), "mo" the mode, "ra" the range, "me" the median.
// - "▥F:gem:1x2,3x4,4x1:mo": a frequency table (value x how many), "mo", "ra" or "to" (in all).
// - "▥G5:gem:10,15,25,20,30,35:v.3": a line graph by 5s, a value a day: "v.3" day 3's value,
//   "c.2.5" the change from day 2 to day 5.
import { spoken } from "./problems.js";

const DK = "#0c171c", GOLD = "#ffc93c", INK = "#f3efe4", MUTED = "#a9bec1", CORAL = "#ff5a4e";
const f1 = (n) => Math.round(n * 10) / 10;
const cap = (t) => t[0].toUpperCase() + t.slice(1);
export const W = 360, H = 236;

/* ---------- the dungeon things ---------- */
// Nine things that read as small icons, each its own color (a bar is its thing's color).
export const OBJECTS = {
  torch: { one: "torch", many: "torches", c: "#ff8a2a" },
  potion: { one: "potion", many: "potions", c: "#ff5fa8" },
  key: { one: "key", many: "keys", c: GOLD },
  gem: { one: "gem", many: "gems", c: "#45d6e6" },
  bat: { one: "bat", many: "bats", c: "#9a7bff" },
  slime: { one: "slime", many: "slimes", c: "#7fdc5a" },
  mushroom: { one: "mushroom", many: "mushrooms", c: CORAL },
  shield: { one: "shield", many: "shields", c: "#4f8dff" },
  bone: { one: "bone", many: "bones", c: INK }
};
const THINGS = Object.keys(OBJECTS);
// Lengths are measured on bones, keys and torches; counts are things in a place (gems in each
// chest), and a line graph's things are found each day.
const LENGTHS = ["bone", "key", "torch"];
const PLACES = { gem: ["chest", "chests", "in"], bat: ["cave", "caves", "in"], mushroom: ["patch", "patches", "in"], potion: ["shelf", "shelves", "on"] };
// "Gems in each chest", "Potions on each shelf".
const eachPlace = (o) => `${PLACES[o][2]} each ${PLACES[o][0]}`;
const DAILY = { gem: "found", bat: "spotted", slime: "spotted", mushroom: "picked" };

// The house style at icon size: a dark outline, the color, a white sheen (as monsters.js solid()).
const sol = (s, c) => `<g fill="${DK}" stroke="${DK}" stroke-width="5" stroke-linejoin="round">${s}</g><g fill="${c}">${s}</g><g fill="url(#csh)">${s}</g>`;
const eyes = (y, dx = 3.2, r = 2.6) => `<circle cx="${-dx}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${dx}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${-dx + .5}" cy="${y + .4}" r="${r * .5}" fill="${DK}"/><circle cx="${dx + .5}" cy="${y + .4}" r="${r * .5}" fill="${DK}"/>`;
// Each in a 40 × 40 box around (0, 0).
const ICON = {
  torch: () => sol(`<path d="M-4 -1 H4 L2.5 18 Q0 20.5 -2.5 18 Z"/>`, "#a0673a")
    + sol(`<path d="M0 -20 Q6 -13 8.5 -9 Q11 -3 0 -4 Q-11 -3 -8.5 -9 Q-6 -13 0 -20 Z"/>`, "#ff8a2a")
    + `<path d="M0 -14 Q3.5 -10 4.5 -8 Q5 -5.5 0 -5.5 Q-5 -5.5 -4.5 -8 Q-3.5 -10 0 -14 Z" fill="#ffd23c"/>`
    + sol(`<rect x="-6.5" y="-6" width="13" height="6" rx="2"/>`, "#7d8f96"),
  potion: () => sol(`<rect x="-4.5" y="-14" width="9" height="10" rx="1.5"/>`, "#cfe8ef") + sol(`<rect x="-5.5" y="-19" width="11" height="6.5" rx="2"/>`, "#a0673a")
    + sol(`<circle cx="0" cy="6" r="12.5"/>`, "#ff5fa8") + `<circle cx="-4" cy="4" r="2.2" fill="#fff" opacity=".8"/><circle cx="3" cy="9" r="1.5" fill="#fff" opacity=".7"/>`,
  key: () => sol(`<circle cx="-9" cy="0" r="8.5"/><rect x="-2" y="-3.2" width="20" height="6.4" rx="2"/><rect x="9" y="1" width="4" height="8" rx="1"/><rect x="14.5" y="1" width="4" height="6" rx="1"/>`, GOLD)
    + `<circle cx="-9" cy="0" r="3.4" fill="${DK}"/>`,
  gem: () => sol(`<path d="M-14 -5 L-7 -13 L7 -13 L14 -5 L0 15 Z"/>`, "#45d6e6")
    + `<path d="M-14 -5 H14 M-7 -13 L-4 -5 L0 15 L4 -5 L7 -13" stroke="${DK}" stroke-width="1.6" fill="none" stroke-linejoin="round" opacity=".55"/>`,
  bat: () => sol(`<path d="M0 -6 C-4 -10 -10 -12 -19 -9 C-16 -6 -16 -2 -17 3 C-13 0 -11 2 -10 6 C-7 3 -4 4 -3 7 L0 9 L3 7 C4 4 7 3 10 6 C11 2 13 0 17 3 C16 -2 16 -6 19 -9 C10 -12 4 -10 0 -6 Z"/><path d="M-6 -4 L-6.5 -13 L-2 -8 Z M6 -4 L6.5 -13 L2 -8 Z"/>`, "#9a7bff")
    + `<circle cx="-2.6" cy="-2" r="1.7" fill="#fff"/><circle cx="2.6" cy="-2" r="1.7" fill="#fff"/>`,
  slime: () => sol(`<path d="M-16 12 C-18 -1 -10 -14 0 -14 C10 -14 18 -1 16 12 Q8 15 0 12.5 Q-8 15 -16 12 Z"/>`, "#7fdc5a") + eyes(0, 5, 3.2),
  mushroom: () => sol(`<path d="M-6 0 L6 0 L7 15 Q0 18 -7 15 Z"/>`, "#f3e2c4") + sol(`<path d="M-17 2 C-17 -10 -9 -17 0 -17 C9 -17 17 -10 17 2 Z"/>`, CORAL)
    + `<circle cx="-8" cy="-6" r="3" fill="#fff"/><circle cx="4" cy="-11" r="2.6" fill="#fff"/><circle cx="9" cy="-3" r="2.2" fill="#fff"/>`,
  shield: () => sol(`<path d="M-13 -16 H13 V-3 C13 8 6 14 0 18 C-6 14 -13 8 -13 -3 Z"/>`, "#4f8dff")
    + `<path d="M0 -14 V15 M-11 -4 H11" stroke="${GOLD}" stroke-width="3.5" stroke-linecap="round"/>`,
  bone: () => sol(`<g transform="rotate(-25)"><rect x="-11" y="-3.5" width="22" height="7"/><circle cx="-13" cy="-4" r="5"/><circle cx="-13" cy="4" r="5"/><circle cx="13" cy="-4" r="5"/><circle cx="13" cy="4" r="5"/></g>`, INK)
};
const k3 = (n) => Math.round(n * 1000) / 1000;
// A thing as an icon, size wide, centered on (x, y).
export const iconSvg = (id, x, y, size) => `<g transform="translate(${f1(x)} ${f1(y)}) scale(${k3(size / 40)})">${ICON[id]()}</g>`;
// Its left half (a half picture in a scaled picture graph): a nested svg clips it.
const halfIcon = (id, x, y, size) => `<svg x="${f1(x - size / 2)}" y="${f1(y - size / 2)}" width="${f1(size / 2)}" height="${f1(size)}" viewBox="-20 -20 20 40">${ICON[id]()}</svg><line x1="${f1(x)}" y1="${f1(y - size / 2 + 2)}" x2="${f1(x)}" y2="${f1(y + size / 2 - 2)}" stroke="${DK}" stroke-width="2.5" stroke-dasharray="3 3"/>`;

/* ---------- the levels ---------- */
// In teaching order, each with the stratum Graphzilla would visit for it (4th and 5th grade's
// strata, the Fraction Forge and the Parenthesis Pyramid, aren't built yet).
export const CHART_LEVELS = [
  { id: "tally", name: "Tally charts", grade: "1st", stratum: "hall" },
  { id: "pic1", name: "Picture charts", grade: "1st", stratum: "hall" },
  { id: "pic2", name: "Picture graphs", grade: "2nd", stratum: "mines" },
  { id: "bar2", name: "Bar graphs", grade: "2nd", stratum: "mines" },
  { id: "spic3", name: "Scaled picture graphs", grade: "3rd", stratum: "tower" },
  { id: "sbar3", name: "Scaled bar graphs", grade: "3rd", stratum: "tower" },
  { id: "plot3", name: "Line plots in ½ and ¼", grade: "3rd", stratum: "tower" },
  { id: "freq4", name: "Frequency tables", grade: "4th", stratum: "forge" },
  { id: "plot4", name: "Line plots: mode, range", grade: "4th", stratum: "forge" },
  { id: "graph4", name: "Graphs by 10s", grade: "4th", stratum: "forge" },
  { id: "med5", name: "Line plots: the median", grade: "5th", stratum: "pyramid" },
  { id: "line5", name: "Line graphs", grade: "5th", stratum: "pyramid" }
];

/* ---------- facts and keys ---------- */
const countOf = (f, o) => (f.cats.find((c) => c[0] === o) || [0, 0])[1];
const sum = (a) => a.reduce((s, x) => s + x, 0);
// The mode of a list (the game only asks lists with one).
const modeOf = (vals) => { const n = {}; vals.forEach((v) => (n[v] = (n[v] || 0) + 1)); const top = Math.max(...Object.values(n)); return Object.keys(n).filter((v) => n[v] === top).map(Number); };
function answerOf(f) {
  const q = f.q;
  if (f.cats) {
    if (q.k === "n") return countOf(f, q.a);
    if (q.k === "m") return countOf(f, q.a) - countOf(f, q.b);
    if (q.k === "f") return countOf(f, q.b) - countOf(f, q.a);
    if (q.k === "t") return countOf(f, q.a) + countOf(f, q.b);
    return sum(f.cats.map((c) => c[1]));
  }
  if (f.form === "L") {
    if (q.k === "at") return f.vals.filter((v) => v === q.v).length;
    if (q.k === "gt") return f.vals.filter((v) => v > q.v).length;
    if (q.k === "mo") return modeOf(f.vals)[0];
    if (q.k === "ra") return f.vals[f.vals.length - 1] - f.vals[0];
    return f.vals[(f.vals.length - 1) / 2];
  }
  if (f.form === "F") {
    if (q.k === "mo") { const top = Math.max(...f.rows.map((r) => r[1])); return f.rows.find((r) => r[1] === top)[0]; }
    if (q.k === "ra") return f.rows[f.rows.length - 1][0] - f.rows[0][0];
    return sum(f.rows.map((r) => r[1]));
  }
  if (q.k === "v") return f.vals[q.d - 1];
  return Math.abs(f.vals[q.d2 - 1] - f.vals[q.d - 1]);
}
function setOf(f) {
  if (f.form === "T") return "tally";
  if (f.form === "P" || f.form === "B") {
    if (f.scale === 10) return "graph4";
    if (f.scale > 1) return f.form === "P" ? "spic3" : "sbar3";
    return f.form === "B" ? "bar2" : f.cats.length > 3 ? "pic2" : "pic1";
  }
  if (f.form === "L") return f.den > 1 ? "plot3" : f.q.k === "me" ? "med5" : "plot4";
  return f.form === "F" ? "freq4" : "line5";
}
const qText = (q) => [q.k, q.a, q.b, q.v, q.d, q.d2].filter((x) => x !== undefined).join(".");
function keyOf(f) {
  if (f.cats) return `▥${f.form}${f.scale}:${f.cats.map(([o, n]) => o + n).join(",")}:${qText(f.q)}`;
  if (f.form === "L") return `▥L${f.den}:${f.obj}:${f.from}-${f.to}:${f.vals.join(",")}:${qText(f.q)}`;
  if (f.form === "F") return `▥F:${f.obj}:${f.rows.map(([v, n]) => v + "x" + n).join(",")}:${qText(f.q)}`;
  return `▥G${f.scale}:${f.obj}:${f.vals.join(",")}:${qText(f.q)}`;
}
// A fact from its data and question: its level, answer and key.
export function chartFact(spec) {
  const f = Object.assign({ op: "▥" }, spec);
  f.set = setOf(f);
  f.ans = answerOf(f);
  f.key = keyOf(f);
  return f;
}
function parseQ(s, form) {
  const [k, x, y] = s.split(".");
  if (form === "L") return x === undefined ? { k } : { k, v: Number(x) };
  if (form === "G") return y === undefined ? { k, d: Number(x) } : { k, d: Number(x), d2: Number(y) };
  if (form === "F") return { k };
  return x === undefined ? { k } : y === undefined ? { k, a: x } : { k, a: x, b: y };
}
export function chartFactOf(key) {
  const parts = key.slice(1).split(":"), head = parts[0], form = head[0], scale = Number(head.slice(1));
  const q = parseQ(parts[parts.length - 1], form);
  if (form === "L") { const [from, to] = parts[2].split("-").map(Number); return chartFact({ form, den: scale, obj: parts[1], from, to, vals: parts[3].split(",").map(Number), q }); }
  if (form === "F") return chartFact({ form, obj: parts[1], rows: parts[2].split(",").map((r) => r.split("x").map(Number)), q });
  if (form === "G") return chartFact({ form, scale, obj: parts[1], vals: parts[2].split(",").map(Number), q });
  return chartFact({ form, scale, cats: parts[1].split(",").map((c) => { const m = /^([a-z]+)(\d+)$/.exec(c); return [m[1], Number(m[2])]; }), q });
}

/* ---------- the fixed samples ---------- */
// Made once from a fixed seed, so the same facts (and lines to record) every time.
function seeded(seed) { return () => ((seed = (seed * 9301 + 49297) % 233280) / 233280); }
const int = (a, b, rnd) => a + Math.floor(rnd() * (b - a + 1));
const pickN = (list, k, rnd) => { const a = list.slice(), out = []; while (out.length < k) out.push(a.splice(Math.floor(rnd() * a.length), 1)[0]); return out; };
// Category data: k things, counts lo..hi in steps of step, all different (so "more" always has an
// answer), and a total no bigger than most.
function catData(form, scale, k, lo, hi, step, most, rnd) {
  for (;;) {
    const counts = Array.from({ length: k }, () => int(lo / step, hi / step, rnd) * step);
    if (new Set(counts).size === k && sum(counts) <= most) return { form, scale, cats: pickN(THINGS, k, rnd).map((o, i) => [o, counts[i]]) };
  }
}
// The questions asked of one category data set: each kind in qs, on different things.
function catQuestions(d, qs, rnd) {
  const out = [], things = d.cats.map((c) => c[0]);
  const by = (a, b) => countOf(d, a) - countOf(d, b);
  let nTurn = pickN(things, things.length, rnd);
  for (const k of qs) {
    if (k === "a") { out.push({ k }); continue; }
    if (k === "n") { out.push({ k, a: nTurn.shift() }); continue; }
    const [a, b] = pickN(things, 2, rnd);
    if (k === "t") out.push({ k, a, b });
    else { const [big, small] = by(a, b) > 0 ? [a, b] : [b, a]; out.push(k === "m" ? { k, a: big, b: small } : { k, a: small, b: big }); }
  }
  return out;
}
// Lengths or counts for a line plot: n values from..to, at most cap at one place, optionally with
// one mode.
function plotVals(from, to, n, cap, oneMode, rnd) {
  for (;;) {
    const vals = Array.from({ length: n }, () => int(from, to, rnd)).sort((a, b) => a - b);
    const most = Math.max(...[...new Set(vals)].map((v) => vals.filter((x) => x === v).length));
    if (most <= cap && (!oneMode || modeOf(vals).length === 1)) return vals;
  }
}
let factCache = null;
export function chartFacts() {
  if (factCache) return factCache;
  const rnd = seeded(2027), out = [], seen = new Set();
  const add = (spec) => { const f = chartFact(spec); if (!seen.has(f.key) && f.ans > 0) { seen.add(f.key); out.push(f); } };
  const cats = (n, make, qs) => { for (let i = 0; i < n; i++) { const d = make(i); for (const q of catQuestions(d, qs(i), rnd)) add({ ...d, q }); } };
  // 1st grade: three things, totals within 20.
  cats(6, () => catData("T", 1, 3, 2, 10, 1, 20, rnd), (i) => ["n", "n", i % 2 ? "f" : "m", "a"]);
  cats(6, () => catData("P", 1, 3, 1, 8, 1, 20, rnd), (i) => ["n", "n", i % 2 ? "f" : "m", "a"]);
  // 2nd grade: four things, scale 1.
  cats(5, () => catData("P", 1, 4, 1, 9, 1, 30, rnd), () => ["n", "t", "m", "f", "a"]);
  cats(5, () => catData("B", 1, 4, 1, 9, 1, 30, rnd), () => ["n", "t", "m", "f", "a"]);
  // 3rd grade: each picture = 2 (halves for the odd ones) or 5; bars by 2s or 5s.
  cats(6, (i) => (i < 3 ? catData("P", 2, 3 + (i % 2), 2, 18, 1, 99, rnd) : catData("P", 5, 3, 5, 40, 5, 99, rnd)), () => ["n", "n", "m", "f", "t"]);
  cats(6, (i) => (i < 3 ? catData("B", 2, 4, 2, 18, 2, 99, rnd) : catData("B", 5, 4, 5, 45, 5, 999, rnd)), () => ["n", "m", "f", "t"]);
  // 3rd grade line plots: lengths in halves (1 to 4 inches) or fourths (1 to 3 inches).
  for (let i = 0; i < 6; i++) {
    const den = i < 3 ? 2 : 4, from = den, to = den === 2 ? 8 : 12, obj = LENGTHS[i % 3];
    const vals = plotVals(from + (den === 4 ? 1 : 0), to - (den === 4 ? 1 : 0), int(9, 13, rnd), 5, false, rnd);
    const at = pickN([...new Set(vals)].filter((v) => vals.filter((x) => x === v).length >= 2), 2, rnd);
    const gts = [...new Set(vals)].filter((v) => { const n = vals.filter((x) => x > v).length; return n >= 2 && n <= 9; });
    for (const v of at) add({ form: "L", den, obj, from, to, vals, q: { k: "at", v } });
    for (const v of pickN(gts, Math.min(2, gts.length), rnd)) add({ form: "L", den, obj, from, to, vals, q: { k: "gt", v } });
  }
  // 4th grade: frequency tables (things in each place), line plots of counts, graphs by 10s.
  for (let i = 0; i < 6; i++) {
    const obj = Object.keys(PLACES)[i % 4];
    let rows;
    do {
      rows = pickN([1, 2, 3, 4, 5, 6, 7, 8, 9], int(4, 6, rnd), rnd).sort((a, b) => a - b).map((v) => [v, int(1, 6, rnd)]);
    } while (rows.filter((r) => r[1] === Math.max(...rows.map((x) => x[1]))).length > 1);
    for (const k of ["mo", "ra", "to"]) add({ form: "F", obj, rows, q: { k } });
  }
  for (let i = 0; i < 6; i++) {
    const obj = Object.keys(PLACES)[(i + 1) % 4], from = int(1, 3, rnd), to = from + int(6, 8, rnd);
    const vals = plotVals(from, to, int(9, 14, rnd), 6, true, rnd);
    for (const q of [{ k: "mo" }, { k: "ra" }, { k: "at", v: pickN([...new Set(vals)], 1, rnd)[0] }]) add({ form: "L", den: 1, obj, from, to, vals, q });
  }
  cats(6, (i) => (i < 3 ? catData("B", 10, 4, 10, 90, 10, 999, rnd) : catData("P", 10, 3, 10, 90, 5, 999, rnd)), () => ["n", "m", "f", "t"]);
  // 5th grade: the median of a line plot (an odd number of values), and line graphs.
  for (let i = 0; i < 10; i++) {
    const obj = Object.keys(PLACES)[i % 4], from = int(1, 4, rnd), to = from + int(6, 8, rnd);
    add({ form: "L", den: 1, obj, from, to, vals: plotVals(from, to, [7, 9, 11, 13][i % 4], 6, false, rnd), q: { k: "me" } });
  }
  for (let i = 0; i < 6; i++) {
    const scale = [2, 5, 10][i % 3], obj = Object.keys(DAILY)[i % 4];
    let vals;
    do vals = Array.from({ length: 6 }, () => int(1, 9, rnd) * scale); while (new Set(vals).size < 5);
    const days = pickN([1, 2, 3, 4, 5, 6], 2, rnd);
    for (const d of days) add({ form: "G", scale, obj, vals, q: { k: "v", d } });
    for (let j = 0; j < 2; j++) {
      let d, d2;
      do [d, d2] = pickN([1, 2, 3, 4, 5, 6], 2, rnd).sort((a, b) => a - b); while (vals[d - 1] === vals[d2 - 1]);
      add({ form: "G", scale, obj, vals, q: { k: "c", d, d2 } });
    }
  }
  return (factCache = out);
}
export const chartLevel = (id) => CHART_LEVELS.find((l) => l.id === id) || CHART_LEVELS[0];
// A problem for the review page: one of the level's facts.
export function chartProblem(id, rnd = Math.random) {
  const all = chartFacts().filter((f) => f.set === id);
  return all[Math.floor(rnd() * all.length)];
}

/* ---------- words ---------- */
const many = (o) => OBJECTS[o].many;
const things = (list) => cap(list.join(", ")) + ".";
// A length in halves or fourths: "2½", said "two and a half".
export const lenLabel = (u, den) => `${Math.floor(u / den)}${u % den ? ["", "¼", "½", "¾"][(u % den) * 4 / den] : ""}`;
const HALVES = { 1: "one fourth", 2: "a half", 3: "three fourths" };
export const lenWords = (u, den) => spoken(Math.floor(u / den)) + (u % den ? " and " + HALVES[(u % den) * 4 / den] : "") + (u === den ? " inch" : " inches");
const plotLabel = (f, u) => (f.den > 1 ? lenLabel(u, f.den) : String(u));
// What the chart is, said first: the things in it (a pre-reader can't read the labels), or its
// title.
function intro(f) {
  if (f.cats) return (f.form === "P" && f.scale > 1 ? `Each picture is ${spoken(f.scale)}. ` : "") + things(f.cats.map((c) => many(c[0])));
  if (f.form === "L" && f.den > 1) return `${cap(OBJECTS[f.obj].one)} lengths, in inches.`;
  if (f.form === "L" || f.form === "F") return `${cap(many(f.obj))} ${eachPlace(f.obj)}.`;
  return `${cap(many(f.obj))} ${DAILY[f.obj]} each day.`;
}
// The question alone (12 words at most, lines.test's limit for what a pre-reader hears).
export function chartQuestion(f) {
  const q = f.q;
  if (f.cats) {
    if (q.k === "n") return `How many ${many(q.a)}?`;
    if (q.k === "m") return `How many more ${many(q.a)} than ${many(q.b)}?`;
    if (q.k === "f") return `How many fewer ${many(q.a)} than ${many(q.b)}?`;
    if (q.k === "t") return `How many ${many(q.a)} and ${many(q.b)} in all?`;
    return "How many in all?";
  }
  if (q.k === "mo") return "What is the mode?";
  if (q.k === "ra") return "What is the range?";
  if (q.k === "me") return "What is the median?";
  if (f.form === "F") return `How many ${PLACES[f.obj][1]} in all?`;
  if (f.form === "L") {
    if (f.den > 1) return q.k === "at" ? `How many ${many(f.obj)} are ${lenWords(q.v, f.den)} long?` : `How many ${many(f.obj)} are longer than ${lenWords(q.v, f.den)}?`;
    return `How many ${PLACES[f.obj][1]} have ${spoken(q.v)} ${q.v === 1 ? OBJECTS[f.obj].one : many(f.obj)}?`;
  }
  if (q.k === "v") return `How many ${many(f.obj)} on day ${spoken(q.d)}?`;
  return `How many ${f.vals[q.d2 - 1] > f.vals[q.d - 1] ? "more" : "fewer"} ${many(f.obj)} on day ${spoken(q.d2)} than day ${spoken(q.d)}?`;
}
export const spokenChart = (f) => `${intro(f)} ${chartQuestion(f)}`;
// After a miss: "Seven potions.", "Four more potions.", "The mode is four."
export function spokenChartAnswer(f) {
  const q = f.q, n = spoken(f.ans), N = cap(n);
  const thing = (o) => (f.ans === 1 ? OBJECTS[o].one : many(o));
  if (f.cats) {
    if (q.k === "n") return `${N} ${thing(q.a)}.`;
    if (q.k === "m" || q.k === "f") return `${N} ${q.k === "m" ? "more" : "fewer"} ${thing(q.a)}.`;
    return `${N} in all.`;
  }
  if (q.k === "mo" || q.k === "ra" || q.k === "me") return `The ${{ mo: "mode", ra: "range", me: "median" }[q.k]} is ${n}.`;
  if (f.form === "F") return `${N} ${f.ans === 1 ? PLACES[f.obj][0] : PLACES[f.obj][1]} in all.`;
  if (f.form === "L") return `${N} ${f.den > 1 ? thing(f.obj) : f.ans === 1 ? PLACES[f.obj][0] : PLACES[f.obj][1]}.`;
  if (q.k === "v") return `${N} ${thing(f.obj)} on day ${spoken(q.d)}.`;
  return `${N} ${f.vals[q.d2 - 1] > f.vals[q.d - 1] ? "more" : "fewer"}.`;
}
// The problem's line under the chart (null is the answer's □).
export function chartLine(f) {
  const q = f.q, M = (o) => cap(many(o));
  let t;
  if (f.cats) t = q.k === "n" ? `${M(q.a)}:` : q.k === "m" ? `More ${many(q.a)} than ${many(q.b)}:` : q.k === "f" ? `Fewer ${many(q.a)} than ${many(q.b)}:` : q.k === "t" ? `${M(q.a)} and ${many(q.b)}:` : "In all:";
  else if (q.k === "mo" || q.k === "ra" || q.k === "me") t = `${{ mo: "Mode", ra: "Range", me: "Median" }[q.k]}:`;
  else if (f.form === "F") t = `${cap(PLACES[f.obj][1])} in all:`;
  else if (f.form === "L") t = f.den > 1 ? (q.k === "at" ? `${lenLabel(q.v, f.den)} inches:` : `Longer than ${lenLabel(q.v, f.den)} in:`) : `${cap(PLACES[f.obj][1])} with ${q.v}:`;
  else t = q.k === "v" ? `Day ${q.d}:` : `${f.vals[q.d2 - 1] > f.vals[q.d - 1] ? "More" : "Fewer"} on day ${q.d2} than day ${q.d}:`;
  return [t + " ", null];
}

/* ---------- counting partway ---------- */
// A hint counts along before answering, but never to the end: about half the steps (none of one
// or two), then "?"; worked, all of them.
export const shownOf = (n, worked) => (worked ? n : n <= 2 ? 0 : Math.floor(n / 2));
const partway = (vals, worked) => { const k = shownOf(vals.length, worked); return worked ? vals.join(", ") : k ? vals.slice(0, k).join(", ") + ", …?" : ""; };
// "Count the keys: 1, 2, …?", or "Count the keys." when there's nothing to count along. how ("by
// 5s") is said only with a count to follow, since a count of one step would be the answer.
const counted = (lead, vals, worked, how = "") => { const p = partway(vals, worked); return p ? `${lead}${how}: ${p}${worked ? "." : ""}` : `${lead}.`; };

/* ---------- drawing helpers ---------- */
const DEFS = `<defs><linearGradient id="csh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
// Every word and number on a chart is a <text class="lab"> (the tests read them all).
function text(x, y, s, o = {}) {
  return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${o.anchor || "middle"}" font-family="${o.big ? "Bungee" : "Nunito"}, sans-serif" font-weight="${o.big ? 400 : 900}" font-size="${o.size || 12}" fill="${o.color || INK}"${o.halo ? ` stroke="${DK}" stroke-width="3.5" paint-order="stroke"` : ""}${o.op ? ` opacity="${o.op}"` : ""} class="lab">${s}</text>`;
}
const chalk = (d, w = 3, c = INK, op) => `<path d="${d}" stroke="${DK}" stroke-width="${w + 3.5}" stroke-linecap="round" stroke-linejoin="round" fill="none"${op ? ` opacity="${op}"` : ""}/><path d="${d}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"${op ? ` opacity="${op}"` : ""}/>`;
const guide = (x1, y1, x2, y2) => `<path d="M${f1(x1)} ${f1(y1)} L${f1(x2)} ${f1(y2)}" stroke="${GOLD}" stroke-width="2.5" stroke-dasharray="6 5" stroke-linecap="round" fill="none"/>`;
const band = (x, y, w, h) => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="8" fill="${GOLD}" fill-opacity=".12" stroke="${GOLD}" stroke-opacity=".6" stroke-width="2"/>`;
const ring = (x, y, w, h) => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="7" fill="none" stroke="${GOLD}" stroke-width="3"/>`;
const dot = (x, y, c = GOLD) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="4.5" fill="${c}" stroke="${DK}" stroke-width="2"/>`;
// A bracket beside a gap from y1 to y2 at x, opening toward dir (1 right, −1 left).
const bracket = (x, y1, y2, dir) => chalk(`M${f1(x - 6 * dir)} ${f1(y1)} H${f1(x)} V${f1(y2)} H${f1(x - 6 * dir)}`, 2.5, GOLD);
function frame(inner, label) {
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${label}">${DEFS}<rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="16" fill="#0f1f25" fill-opacity=".92" stroke="${DK}" stroke-width="4"/>${inner}</svg>`;
}

/* ---------- tally charts and picture graphs: a row per thing ---------- */
const TG = 54; // a bundle of five tallies and the gap after it
function rowsGeom(f) {
  const R = f.cats.length, keyH = f.form === "P" && f.scale > 1 ? 24 : 0, top = 10;
  const rowH = Math.min(62, (H - 12 - keyH - top) / R), x0 = 74;
  const most = Math.max(...f.cats.map((c) => Math.ceil(c[1] / f.scale)));
  const u = Math.min(34, (W - 14 - x0) / Math.max(most, 6));
  return { R, keyH, top, rowH, x0, u, size: Math.min(u * 0.9, rowH * 0.72), y: (i) => top + i * rowH, mid: (i) => top + i * rowH + rowH / 2 };
}
const tallyX = (g, k) => g.x0 + Math.floor(k / 5) * TG + (k % 5 === 4 ? 19 : (k % 5) * 10 + 4);
// Where a row of m stops (for lining two rows up).
const stopX = (f, g, m) => (f.form === "T" ? (m % 5 === 0 ? g.x0 + (m / 5) * TG - 8 : tallyX(g, m) - 5) : g.x0 + (m / f.scale) * g.u);
// A row's count, step by step: [{ x, v }] with v counted so far (a tally's bundles by 5s, then
// 1s; a picture by the scale, half a picture by half of it).
function rowSteps(f, g, i) {
  const n = f.cats[i][1], out = [];
  let v = 0;
  if (f.form === "T") {
    for (let k = 0; k < Math.floor(n / 5); k++) out.push({ x: g.x0 + k * TG + 19, v: (v += 5) });
    for (let k = Math.floor(n / 5) * 5; k < n; k++) out.push({ x: tallyX(g, k), v: ++v });
    return out;
  }
  const s = f.scale, full = Math.floor(n / s);
  for (let k = 0; k < full; k++) out.push({ x: g.x0 + k * g.u + g.u / 2, v: (v += s) });
  if (n % s) out.push({ x: g.x0 + full * g.u + g.u / 4, v: n });
  return out;
}
// The extra in the bigger of two rows, lined up from where the smaller one stops: [{ x, v, w }]
// (v counted so far, w the width it covers).
function extraSteps(f, g, big, small) {
  const out = [];
  let v = 0;
  if (f.form === "T") {
    for (let k = small; k < big;) {
      if (k % 5 === 0 && k + 5 <= big) { out.push({ x: g.x0 + (k / 5) * TG + 19, v: (v += 5), w: 44 }); k += 5; }
      else { out.push({ x: tallyX(g, k), v: ++v, w: 10 }); k++; }
    }
    return out;
  }
  // In half pictures where the scale has them (2, 10), whole pictures otherwise.
  const s = f.scale, unit = s === 2 || s === 10 ? s / 2 : s;
  for (let j = small / unit; j < big / unit;) {
    const k = Math.floor((j * unit) / s), end = Math.min(big / unit, ((k + 1) * s) / unit), part = end - j;
    const x1 = g.x0 + (j * unit / s) * g.u, x2 = g.x0 + (end * unit / s) * g.u;
    out.push({ x: (x1 + x2) / 2, v: (v += part * unit), w: x2 - x1 });
    j = end;
  }
  return out;
}
function rowsSvg(f, o) {
  const g = rowsGeom(f), q = f.q, idx = (t) => f.cats.findIndex((c) => c[0] === t);
  let back = "", s = "", over = "";
  f.cats.forEach(([obj, n], i) => {
    const y = g.y(i), m = g.mid(i);
    if (i) s += `<line x1="12" y1="${f1(y)}" x2="${W - 12}" y2="${f1(y)}" stroke="${INK}" stroke-opacity=".16" stroke-width="1.5"/>`;
    s += iconSvg(obj, 36, m - 6, Math.min(30, g.rowH * 0.58)) + text(36, y + g.rowH - 4, cap(many(obj)), { size: 10, color: MUTED });
    if (f.form === "T") {
      for (let k = 0; k < n; k++) {
        const gx = g.x0 + Math.floor(k / 5) * TG, h = Math.min(30, g.rowH * 0.62);
        s += k % 5 === 4 ? chalk(`M${f1(gx - 2)} ${f1(m + h / 2 - 3)} L${f1(gx + 40)} ${f1(m - h / 2 + 3)}`) : chalk(`M${f1(tallyX(g, k))} ${f1(m - h / 2)} V${f1(m + h / 2)}`);
      }
    } else {
      const full = Math.floor(n / f.scale);
      for (let k = 0; k < full; k++) s += iconSvg(obj, g.x0 + k * g.u + g.u / 2, m, g.size);
      if (n % f.scale) s += halfIcon(obj, g.x0 + full * g.u + g.u / 2, m, g.size);
    }
  });
  s += `<line x1="64" y1="${g.top}" x2="64" y2="${f1(g.top + g.R * g.rowH)}" stroke="${INK}" stroke-opacity=".4" stroke-width="2"/>`;
  if (g.keyH) s += text(W / 2, H - 14, `Each picture = ${f.scale}`, { size: 13, color: GOLD });
  if (o.hint) {
    const rowBand = (i) => band(8, g.y(i) + 2, W - 16, g.rowH - 4);
    const label = (x, i, v) => text(x, g.y(i) + g.rowH - 3, v, { size: 12, color: GOLD, halo: true });
    if (q.k === "n") {
      const i = idx(q.a), st = rowSteps(f, g, i), k = shownOf(st.length, o.worked);
      back += rowBand(i);
      st.forEach((p, j) => { if (j < k) over += label(p.x, i, p.v); });
      if (!o.worked) over += label(st[st.length - 1].x, i, "?");
    } else if (q.k === "m" || q.k === "f") {
      const [bi, si] = countOf(f, q.a) > countOf(f, q.b) ? [idx(q.a), idx(q.b)] : [idx(q.b), idx(q.a)];
      const big = f.cats[bi][1], small = f.cats[si][1], st = extraSteps(f, g, big, small), k = shownOf(st.length, o.worked);
      back += rowBand(bi) + rowBand(si);
      const x = stopX(f, g, small);
      over += guide(x, g.y(Math.min(bi, si)) + 4, x, g.y(Math.max(bi, si)) + g.rowH - 4);
      st.forEach((p, j) => {
        back += `<rect x="${f1(p.x - p.w / 2)}" y="${f1(g.mid(bi) - g.size / 2 - 3)}" width="${f1(p.w)}" height="${f1(g.size + 6)}" rx="6" fill="${GOLD}" fill-opacity=".28"/>`;
        if (j < k) over += label(p.x, bi, p.v);
      });
      if (!o.worked) over += label(st[st.length - 1].x, bi, "?");
    } else {
      const rows = q.k === "a" ? f.cats.map((_, i) => i) : [idx(q.a), idx(q.b)].sort((a, b) => a - b);
      rows.forEach((i) => (back += rowBand(i)));
      if (o.worked) rows.forEach((i) => (over += `<circle cx="56" cy="${f1(g.y(i) + 11)}" r="10" fill="${GOLD}" stroke="${DK}" stroke-width="2.5"/>` + text(56, g.y(i) + 15.5, f.cats[i][1], { size: 12, color: DK })));
      else {
        const first = rowSteps(f, g, rows[0]), k = shownOf(first.length, false), last = rowSteps(f, g, rows[rows.length - 1]);
        first.forEach((p, j) => { if (j < k) over += label(p.x, rows[0], p.v); });
        over += label(last[last.length - 1].x, rows[rows.length - 1], "?");
      }
    }
  }
  const kind = f.form === "T" ? "a tally chart" : "a picture graph";
  return frame(back + s + over, `${kind} of ${f.cats.map((c) => many(c[0])).join(", ")}`);
}

/* ---------- bar graphs and line graphs: an axis up the left ---------- */
function axisGeom(f, most) {
  const line = f.form === "G", x0 = 50, y0 = line ? 174 : 180, yTop = line ? 34 : 18;
  const M = f.scale * (Math.floor(most / f.scale) + 1);
  return { x0, y0, yTop, M, yOf: (v) => y0 - ((y0 - yTop) * v) / M };
}
function axisSvg(g, scale) {
  let s = "";
  for (let v = 0; v <= g.M; v += scale) {
    const y = g.yOf(v);
    if (v) s += `<line x1="${g.x0}" y1="${f1(y)}" x2="${W - 14}" y2="${f1(y)}" stroke="${INK}" stroke-opacity=".14" stroke-width="1.5"/>`;
    s += text(g.x0 - 9, y + 4.5, v, { size: g.M / scale > 10 ? 11 : 12, anchor: "end" });
  }
  return s + chalk(`M${g.x0} ${f1(g.yTop - 6)} V${g.y0} H${W - 14}`, 3);
}
// The counts up the axis to v, by the scale (scale, 2 × scale, … v).
const upTo = (v, s) => Array.from({ length: v / s }, (_, i) => (i + 1) * s);
function barsSvg(f, o) {
  const most = Math.max(...f.cats.map((c) => c[1])), g = axisGeom(f, most), q = f.q, R = f.cats.length;
  const slot = (W - 16 - (g.x0 + 6)) / R, bw = Math.min(46, slot * 0.6), cx = (i) => g.x0 + 6 + slot * (i + 0.5);
  const idx = (t) => f.cats.findIndex((c) => c[0] === t);
  let back = "", s = axisSvg(g, f.scale), over = "";
  f.cats.forEach(([obj, n], i) => {
    const x = cx(i) - bw / 2, y = g.yOf(n);
    s += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(bw)}" height="${f1(g.y0 - y)}" rx="3" fill="${OBJECTS[obj].c}" stroke="${DK}" stroke-width="3"/><rect x="${f1(x)}" y="${f1(y)}" width="${f1(bw)}" height="${f1(g.y0 - y)}" rx="3" fill="url(#csh)"/>`;
    s += iconSvg(obj, cx(i), g.y0 + 19, 24) + text(cx(i), g.y0 + 46, cap(many(obj)), { size: 10, color: MUTED });
  });
  s += chalk(`M${g.x0} ${g.y0} H${W - 14}`, 3);
  if (o.hint) {
    const top = (i) => g.yOf(f.cats[i][1]);
    // Guide lines from bar tops across to the numbers.
    const read = (i) => guide(cx(i) - bw / 2, top(i), g.x0, top(i));
    const value = (i) => text(cx(i), top(i) - 6, f.cats[i][1], { size: 13, color: GOLD, halo: true });
    if (q.k === "n") {
      const i = idx(q.a), v = f.cats[i][1], ups = upTo(v, f.scale), k = shownOf(ups.length, o.worked);
      back += ring(cx(i) - bw / 2 - 4, top(i) - 4, bw + 8, g.y0 - top(i) + 8);
      over += read(i);
      ups.forEach((u, j) => { if (j < k) over += dot(g.x0, g.yOf(u)); });
      over += o.worked ? value(i) : text(cx(i), top(i) - 6, "?", { size: 13, color: GOLD, halo: true });
    } else if (q.k === "m" || q.k === "f") {
      const [bi, si] = countOf(f, q.a) > countOf(f, q.b) ? [idx(q.a), idx(q.b)] : [idx(q.b), idx(q.a)];
      const big = f.cats[bi][1], small = f.cats[si][1], dir = si < bi ? -1 : 1;
      const near = cx(bi) + dir * (bw / 2 + 5);
      over += guide(cx(si) - dir * bw / 2, top(si), cx(bi) + dir * bw / 2, top(si));
      over += bracket(near, g.yOf(small), g.yOf(big), dir);
      const ups = upTo(big - small, f.scale), k = shownOf(ups.length, o.worked);
      ups.forEach((u, j) => { if (j < k) over += text(near + dir * 5, g.yOf(small + u) + 4, u, { size: 11, color: GOLD, anchor: dir < 0 ? "end" : "start", halo: true }); });
      if (!o.worked) over += text(near + dir * 5, g.yOf(big) + 4, "?", { size: 13, color: GOLD, anchor: dir < 0 ? "end" : "start", halo: true });
      over += `<rect x="${f1(cx(bi) - bw / 2)}" y="${f1(g.yOf(big))}" width="${f1(bw)}" height="${f1(g.yOf(small) - g.yOf(big))}" rx="3" fill="${GOLD}" fill-opacity=".4" stroke="${GOLD}" stroke-width="2" stroke-dasharray="5 4"/>`;
    } else {
      const bars = q.k === "a" ? f.cats.map((_, i) => i) : [idx(q.a), idx(q.b)];
      bars.forEach((i) => { over += read(i); if (o.worked) over += value(i); });
    }
  }
  return frame(back + s + over, `a bar graph of ${f.cats.map((c) => many(c[0])).join(", ")}`);
}
function lineGraphSvg(f, o) {
  const g = axisGeom(f, Math.max(...f.vals)), q = f.q, N = f.vals.length;
  const xOf = (d) => g.x0 + 24 + ((d - 1) * (W - 34 - (g.x0 + 24))) / (N - 1), pt = (d) => [xOf(d), g.yOf(f.vals[d - 1])];
  let s = text(20, 22, `${cap(many(f.obj))} ${DAILY[f.obj]} each day`, { size: 13, color: MUTED, anchor: "start" }) + axisSvg(g, f.scale), over = "";
  for (let d = 1; d <= N; d++) s += text(xOf(d), g.y0 + 17, d, { size: 12 });
  s += text((g.x0 + W) / 2, g.y0 + 36, "Day", { size: 12, color: MUTED });
  s += chalk("M" + f.vals.map((_, i) => pt(i + 1).map(f1).join(" ")).join(" L"), 3.5, OBJECTS[f.obj].c);
  for (let d = 1; d <= N; d++) { const [x, y] = pt(d); s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="6" fill="${OBJECTS[f.obj].c}" stroke="${DK}" stroke-width="3"/>`; }
  if (o.hint) {
    const across = (d) => { const [x, y] = pt(d); return guide(x, y, g.x0, y); };
    if (q.k === "v") {
      const [x, y] = pt(q.d), ups = upTo(f.vals[q.d - 1], f.scale), k = shownOf(ups.length, o.worked);
      over += guide(x, g.y0, x, y) + across(q.d) + `<circle cx="${f1(x)}" cy="${f1(y)}" r="11" fill="none" stroke="${GOLD}" stroke-width="3"/>`;
      ups.forEach((u, j) => { if (j < k) over += dot(g.x0, g.yOf(u)); });
      over += text(x + 13, y - 8, o.worked ? f.vals[q.d - 1] : "?", { size: 13, color: GOLD, anchor: "start", halo: true });
    } else {
      const a = f.vals[q.d - 1], b = f.vals[q.d2 - 1], lo = Math.min(a, b), hi = Math.max(a, b), bx = g.x0 + 10;
      over += across(q.d) + across(q.d2);
      [q.d, q.d2].forEach((d) => { const [x, y] = pt(d); over += `<circle cx="${f1(x)}" cy="${f1(y)}" r="11" fill="none" stroke="${GOLD}" stroke-width="3"/>`; });
      over += bracket(bx, g.yOf(lo), g.yOf(hi), -1);
      const ups = upTo(hi - lo, f.scale), k = shownOf(ups.length, o.worked);
      ups.forEach((u, j) => { if (j < k) over += text(bx + 10, g.yOf(lo + u) + 4, u, { size: 11, color: GOLD, anchor: "start", halo: true }); });
      if (!o.worked) over += text(bx + 10, g.yOf(hi) + 4, "?", { size: 13, color: GOLD, anchor: "start", halo: true });
    }
  }
  return frame(s + over, `a line graph of ${many(f.obj)} ${DAILY[f.obj]} each day`);
}

/* ---------- line plots: an X for each one ---------- */
function plotGeom(f) {
  const most = Math.max(...f.vals.map((v) => f.vals.filter((x) => x === v).length));
  const N = f.to - f.from, y = Math.round(Math.min(168, 104 + most * 11));
  return { y, x: (u) => 32 + ((u - f.from) * 296) / N, xs: (i) => y - 14 - i * 17 };
}
// Each X in order, smallest first and, at one place, from the bottom up: [{ v, x, y }].
function plotXs(f, g) {
  const at = {};
  return f.vals.map((v) => { const j = (at[v] = (at[v] || 0) + 1) - 1; return { v, x: g.x(v), y: g.xs(j) }; });
}
const X = (x, y, c = INK, op) => chalk(`M${f1(x - 5.5)} ${f1(y - 5.5)} L${f1(x + 5.5)} ${f1(y + 5.5)} M${f1(x + 5.5)} ${f1(y - 5.5)} L${f1(x - 5.5)} ${f1(y + 5.5)}`, 3, c, op);
function plotSvg(f, o) {
  const g = plotGeom(f), q = f.q, xs = plotXs(f, g), N = xs.length;
  let back = "", s = "", over = "";
  s += chalk(`M18 ${g.y} H${W - 18}`, 3);
  for (let u = f.from; u <= f.to; u++) {
    const whole = f.den === 1 || u % f.den === 0;
    s += chalk(`M${f1(g.x(u))} ${g.y - (whole ? 7 : 5)} V${g.y + (whole ? 7 : 5)}`, whole ? 2.5 : 2);
    s += text(g.x(u), g.y + 24, plotLabel(f, u), { size: whole ? 15 : 13, big: whole });
  }
  s += text(W / 2, Math.min(H - 12, g.y + 52), f.den > 1 ? `${cap(OBJECTS[f.obj].one)} lengths (inches)` : `${cap(many(f.obj))} ${eachPlace(f.obj)}`, { size: 13, color: MUTED });
  // The median, crossing off one from each end: crossed[i] for the X at i.
  const pairs = (N - 1) / 2, cross = q.k === "me" && o.hint ? (o.worked ? pairs : Math.floor(pairs / 2)) : 0;
  xs.forEach((p, i) => { const off = i < cross || i >= N - cross; s += X(p.x, p.y, INK, off ? ".3" : null); if (off) over += chalk(`M${f1(p.x - 8)} ${f1(p.y + 7)} L${f1(p.x + 8)} ${f1(p.y - 7)}`, 2.5, CORAL); });
  const column = (v) => { const n = f.vals.filter((x) => x === v).length; return ring(g.x(v) - 11, g.xs(n - 1) - 11, 22, g.y - g.xs(n - 1) + 15); };
  const label = (p, t) => text(p.x + 9, p.y - 5, t, { size: 11, color: GOLD, anchor: "start", halo: true });
  if (o.hint) {
    if (q.k === "at" || q.k === "gt") {
      const mine = xs.filter((p) => (q.k === "at" ? p.v === q.v : p.v > q.v)), k = shownOf(mine.length, o.worked);
      if (q.k === "at") back += band(g.x(q.v) - 13, 30, 26, g.y - 22);
      else {
        const mid = (g.x(q.v) + g.x(q.v + 1)) / 2;
        back += band(mid, 30, W - 14 - mid, g.y - 22);
        over += guide(mid, 26, mid, g.y + 10);
      }
      mine.forEach((p, j) => { if (j < k) over += label(p, j + 1); });
      if (!o.worked && mine.length) over += label(mine[mine.length - 1], "?");
    } else if (q.k === "mo") {
      [...new Set(f.vals)].forEach((v) => (back += column(v)));
      if (o.worked) back += band(g.x(f.ans) - 15, 26, 30, g.y - 18);
    } else if (q.k === "ra") {
      const lo = f.vals[0], hi = f.vals[N - 1], ya = g.y + 36;
      back += column(lo) + column(hi);
      over += chalk(`M${f1(g.x(lo) + 4)} ${ya} H${f1(g.x(hi) - 4)} M${f1(g.x(lo) + 10)} ${ya - 5} L${f1(g.x(lo) + 4)} ${ya} L${f1(g.x(lo) + 10)} ${ya + 5} M${f1(g.x(hi) - 10)} ${ya - 5} L${f1(g.x(hi) - 4)} ${ya} L${f1(g.x(hi) - 10)} ${ya + 5}`, 2.5, GOLD);
      over += text((g.x(lo) + g.x(hi)) / 2, ya - 4, o.worked ? f.ans : "?", { size: 13, color: GOLD, halo: true });
    } else if (q.k === "me" && o.worked) {
      const p = xs[pairs];
      over += `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="11" fill="none" stroke="${GOLD}" stroke-width="3"/>`;
    }
  }
  return frame(back + s + over, `a line plot of ${f.den > 1 ? `${OBJECTS[f.obj].one} lengths` : `${many(f.obj)} ${eachPlace(f.obj)}`}`);
}

/* ---------- frequency tables ---------- */
function freqSvg(f, o) {
  const R = f.rows.length, top = 58, rowH = Math.min(34, (H - top - 10) / R), q = f.q;
  const C1 = 80, C2 = 186, C3 = 296, place = PLACES[f.obj];
  let back = "", s = text(W / 2, 22, `${cap(many(f.obj))} ${eachPlace(f.obj)}`, { size: 13, color: MUTED });
  s += iconSvg(f.obj, C1 - 32, 42, 20) + text(C1 + 6, 47, cap(many(f.obj)), { size: 13, color: GOLD }) + text(C2, 47, "Tally", { size: 13, color: GOLD }) + text(C3, 47, cap(place[1]), { size: 13, color: GOLD });
  s += `<path d="M16 ${top} H${W - 16} M133 32 V${f1(top + R * rowH)} M243 32 V${f1(top + R * rowH)}" stroke="${INK}" stroke-opacity=".4" stroke-width="2" fill="none"/>`;
  const rowY = (i) => top + i * rowH, mid = (i) => rowY(i) + rowH / 2;
  f.rows.forEach(([v, n], i) => {
    if (i) s += `<line x1="16" y1="${f1(rowY(i))}" x2="${W - 16}" y2="${f1(rowY(i))}" stroke="${INK}" stroke-opacity=".14" stroke-width="1.5"/>`;
    s += text(C1, mid(i) + 6, v, { size: 16, big: true });
    const h = Math.min(16, rowH * 0.6), x0 = C2 - 22;
    for (let k = 0; k < n; k++) {
      const gx = x0 + Math.floor(k / 5) * 34;
      s += k % 5 === 4 ? chalk(`M${f1(gx - 2)} ${f1(mid(i) + h / 2 - 2)} L${f1(gx + 23)} ${f1(mid(i) - h / 2 + 2)}`, 2) : chalk(`M${f1(gx + (k % 5) * 6.5)} ${f1(mid(i) - h / 2)} V${f1(mid(i) + h / 2)}`, 2);
    }
    s += text(C3, mid(i) + 6, n, { size: 16, big: true });
  });
  if (o.hint) {
    const col = (x, w) => ring(x - w / 2, 32, w, top - 32 + R * rowH + 2);
    const rowRing = (i) => ring(22, rowY(i) + 2, W - 44, rowH - 4);
    if (q.k === "mo" || q.k === "to") back += col(C3, 96);
    else back += col(C1, 96);
    if (o.worked && q.k === "mo") back += rowRing(f.rows.findIndex((r) => r[0] === f.ans));
    if (q.k === "ra") back += rowRing(0) + rowRing(R - 1);
  }
  return frame(back + s, `a frequency table of ${many(f.obj)} ${eachPlace(f.obj)}`);
}

/* ---------- any chart ---------- */
// opt.hint draws the hint on the chart; opt.worked, the worked hint.
export function chartSvg(f, opt = {}) {
  if (f.form === "T" || f.form === "P") return rowsSvg(f, opt);
  if (f.form === "B") return barsSvg(f, opt);
  if (f.form === "L") return plotSvg(f, opt);
  if (f.form === "F") return freqSvg(f, opt);
  return lineGraphSvg(f, opt);
}

/* ---------- the hint's words ---------- */
// Never the answer before answering: counting goes about halfway, then "?".
export function chartHint(f, worked) {
  const q = f.q, A = f.ans;
  if (f.cats) {
    const rows = f.form !== "B", g = rows ? rowsGeom(f) : null, idx = (t) => f.cats.findIndex((c) => c[0] === t);
    const by = f.scale > 1 ? ` by ${f.scale}s` : "";
    if (q.k === "n") {
      const n = countOf(f, q.a), done = worked ? ` ${n} ${n === 1 ? OBJECTS[q.a].one : many(q.a)}.` : "";
      if (!rows) return { say: (worked ? `The bar stops at ${n}.` : counted("Follow the top of the bar across to the numbers", upTo(n, f.scale), false, `. Count up${by}`)) + done };
      const steps = rowSteps(f, g, idx(q.a)).map((p) => p.v);
      if (f.form === "T") return { say: counted(n >= 5 ? "Count the tallies, the slanted one too" : "Count each mark", steps, worked, n >= 5 ? (n % 5 ? " by 5s, then 1s" : " by 5s") : "") + done };
      const half = f.scale > 1 && n % f.scale ? ` Half a picture is ${f.scale / 2}.` : "";
      return { say: (f.scale > 1 ? `Each picture is ${f.scale}.${half} ` + counted("Count the pictures", steps, worked, ` by ${f.scale}s`) : counted(`Count the ${many(q.a)}`, steps, worked)) + done };
    }
    if (q.k === "m" || q.k === "f") {
      const big = Math.max(countOf(f, q.a), countOf(f, q.b)), small = Math.min(countOf(f, q.a), countOf(f, q.b));
      if (worked) return { say: `${big} − ${small} = ${A}. ${A} ${q.k === "m" ? "more" : "fewer"} ${A === 1 ? OBJECTS[q.a].one : many(q.a)}.` };
      if (!rows) return { say: counted("Line up the tops. Count the gap", upTo(big - small, f.scale), false, by) };
      return { say: counted("Line them up. Count the extra", extraSteps(f, g, big, small).map((p) => p.v), false) };
    }
    const list = q.k === "a" ? f.cats.map((c) => c[1]) : [countOf(f, q.a), countOf(f, q.b)];
    if (worked) return { say: `${list.join(" + ")} = ${A}.` };
    if (!rows) return { say: q.k === "a" ? "Read every bar. Then add them all." : "Read both bars. Then add them." };
    const first = q.k === "a" ? 0 : Math.min(idx(q.a), idx(q.b));
    return { say: counted("Count one row, then count on", rowSteps(f, g, first).map((p) => p.v), false, by) };
  }
  if (f.form === "L") {
    const at = (u) => (f.den > 1 ? lenLabel(u, f.den) : String(u));
    if (q.k === "at") return { say: worked ? `${A} ${A === 1 ? "X" : "Xs"} at ${at(q.v)}.` : counted(`Find ${at(q.v)}. Count the Xs above it`, upTo(A, 1), false) };
    if (q.k === "gt") return { say: worked ? `${A} ${A === 1 ? OBJECTS[f.obj].one : many(f.obj)} are longer than ${at(q.v)} inches.` : counted(`Longer than ${at(q.v)} is to the right of it. Count those Xs`, upTo(A, 1), false) };
    if (q.k === "mo") return { say: worked ? `${A} has the most Xs. The mode is ${A}.` : "The mode has the most Xs. Find the tallest stack." };
    if (q.k === "ra") return { say: worked ? `${f.vals[f.vals.length - 1]} − ${f.vals[0]} = ${A}. The range is ${A}.` : "The range is the biggest minus the smallest. Find both ends." };
    return { say: worked ? `The middle X is at ${A}. The median is ${A}.` : "Cross off one X from each end, again and again. The last X is the median." };
  }
  if (f.form === "F") {
    const place = PLACES[f.obj][1], ns = f.rows.map((r) => r[1]);
    if (q.k === "mo") return { say: worked ? `${A} has the most ${place}. The mode is ${A}.` : `The mode has the most ${place}. Find the biggest number of ${place}.` };
    if (q.k === "ra") return { say: worked ? `${f.rows[f.rows.length - 1][0]} − ${f.rows[0][0]} = ${A}. The range is ${A}.` : `The range is the most ${many(f.obj)} minus the fewest.` };
    return { say: worked ? `${ns.join(" + ")} = ${A}.` : `Add the ${cap(place)} column: ${ns.slice(0, Math.max(1, Math.floor(ns.length / 2))).join(" + ")} + … = ?` };
  }
  const by = f.scale > 1 ? ` by ${f.scale}s` : "";
  if (q.k === "v") return { say: worked ? `Day ${q.d} is at ${A}.` : counted(`Go up from day ${q.d} to the dot, then across`, upTo(A, f.scale), false, `. Count up${by}`) };
  const a = f.vals[q.d - 1], b = f.vals[q.d2 - 1];
  return { say: worked ? `${Math.max(a, b)} − ${Math.min(a, b)} = ${A}.` : counted("Read both dots. How far apart?", upTo(A, f.scale), false, ` Count${by}`) };
}

// Graphzilla's back plates echo the chart (monsters.js draws them): up to four bars [{ v, c }].
export function platesOf(f) {
  if (f.cats) return f.cats.slice(0, 4).map(([o, n]) => ({ v: n, c: OBJECTS[o].c }));
  const c = OBJECTS[f.obj].c;
  if (f.form === "F") return f.rows.slice(0, 4).map((r) => ({ v: r[1], c }));
  if (f.form === "G") return f.vals.slice(0, 4).map((v) => ({ v, c }));
  return [...new Set(f.vals)].slice(0, 4).map((v) => ({ v: f.vals.filter((x) => x === v).length, c }));
}
