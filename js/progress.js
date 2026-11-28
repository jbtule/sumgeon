// Settings → Progress (DESIGN.md §9): what a grown-up sees of the player playing. Read-only: it
// changes nothing. Everything here is pure data from the saved records (learn.js: a fact record is
// { b: box 0–4, n: seen, c: right, ms: average answer time, t: last seen }) and the stratum's
// progress (wings.js); app.js draws it. No DOM: runs in Node for scripts/progress.test.mjs.
import { fourthLine } from "./fourth.js";
import { BANDS, pool, keyOf, factOf, learned, topBox, stepFacts, fluentFor, TIER_KNOWN, chaptersOf } from "./learn.js";
import { WINGS, PATHS, stepsOpen, chapterOf, megasOf, MEGA_EVERY, OPEN_AT, learnedShare, legendShare, legendDue, legendBeaten, deepest } from "./wings.js";
import { spokenFact } from "./problems.js";
import { coinOf } from "./coins.js";

/* ---------- one fact ---------- */
// Which band a key is first taught in (BANDS order: K first), for its fluent time. Built once.
let bandByKey = null;
function bandIndex() {
  if (bandByKey) return bandByKey;
  bandByKey = new Map();
  for (const b of Object.keys(BANDS)) for (const f of pool(b)) if (!bandByKey.has(f.key)) bandByKey.set(f.key, { band: b, ans: f.ans });
  return bandByKey;
}
// Every key any band asks (older saved keys that no band asks any more are left out).
export const known = (key) => bandIndex().has(key);
// How long a fluent answer to this fact may take (learn.js fluentFor: its level's or band's time, plus a
// second for each extra digit to tap).
export function fluentLimit(key) {
  const k = bandIndex().get(key);
  return k ? fluentFor(k.band, key, k.ans) : 4000;
}
// A fact's state from its record: "new" (not seen), "learning" (box 0–2), "learned" (box 3) or
// "mastered" (box 4); fluent: learned and answered, on average, inside its fluent time.
export function factState(rec, key) {
  if (!rec || !rec.n) return { state: "new", box: null, fluent: false };
  const b = rec.b || 0;
  return { state: b >= 4 ? "mastered" : b >= 3 ? "learned" : "learning", box: b, fluent: b >= 3 && rec.ms > 0 && rec.ms < fluentLimit(key) };
}
export const STATE_WORDS = { new: "not seen yet", learning: "learning", learned: "learned", mastered: "mastered" };

// A fact as written, with its answer ("7 × 8 = 56"), and the sentence the game says for it.
// Most problems show a □ where the answer goes, so it's filled in; a few kinds read better
// spelled out.
export function factText(key) {
  const f = factOf(key, () => 0.99), a = f.ans, said = spokenFact(f);
  const fill = (q, v) => q.replace("□", v);
  let text;
  if ("+-×÷Σ".includes(f.op) && !f.blank) text = `${f.q} = ${a}`;
  else if (f.op === "○") text = fill(f.q, f.sym);
  else if (f.op === "M") text = `${f.q}: ${a} is more`;
  else if (f.op === "more") text = `${f.q}: ${a} is more`;
  else if (f.op === "¢" && f.find) text = `How many ${f.q}? ${a}`;
  else if (f.op === "¢" && /^¢t?\d/.test(key) && Object.values(f.coins).reduce((s, n) => s + n, 0) === 1) text = `A ${coinOf(Object.keys(f.coins).find((k) => f.coins[k])).name} is ${a}¢`;
  else if (f.op === "¢") text = `${f.q} = ${a}¢`;
  else if (f.op === "$") text = said.replace(/\.$/, "");
  else if (f.op === "≈") text = `${f.n} ≈ ${a} (nearest ${f.to})`;
  // 4th grade's rectangles with a side to find, and angles and shapes (fourth.js, angles.js).
  // 4th grade's lines with their answers in place: "29 ÷ 4 = 7 R 1", "$3.25 + $1.40 = $4.65".
  else if (f.parts && f.op !== "∠") text = fourthLine(f, String).join("");
  else if (f.op === "P") text = `${f.n} is ${f.sym === "P" ? "prime" : "composite"}`;
  else if (f.op === "▭" && (f.kind === "s" || f.kind === "q")) text = `${f.kind === "s" ? "Area " + f.area : "Perimeter " + f.per}, sides ${f.h} and ${a}`;
  else if (f.op === "∠" && f.name) text = `${fill(f.q, a)} (${f.name})`;
  else if (f.op === "▭") text = `${f.kind === "a" ? "Area" : "Perimeter"} of ${f.w} by ${f.h} = ${a}`;
  else if (f.op === "✓") text = `${f.q}: ${f.sym === "T" ? "true" : "false"}`;
  else if (f.op === "◇" && f.draw) text = f.q;
  else if (f.op === "◇" && f.shape) text = `${fill(f.q, a)} (${f.shape})`;
  else if (f.op === "⁙") text = { d: `A die's ${a}`, f: `${a} on a five-frame`, o: `A domino, ${f.groups.join(" and ")}: ${a}`, s: `Dots in groups, ${f.groups.join(" + ")}: ${a}` }[f.kind] || fill(f.q, a);
  else if (f.op === "↔" && f.kind === "where") text = `${a}/${f.d} on a number line`;
  // Length: the answer said whole ("The pencil is longer than the crayon", "About six inches").
  else if (f.op === "ℓ") text = f.sym ? said.replace(/\.$/, "") : f.q.replace("□", a);
  else if ((f.q.match(/□/g) || []).length === 1 && f.op !== "✎" && f.op !== "◐") text = fill(f.q, a);
  else text = said.replace(/\.$/, "");
  return { text, said };
}
// The problem without its answer, for a chip ("7 × 8"); kinds whose question is a picture use
// the written fact.
export function factLabel(key) {
  const f = factOf(key, () => 0.99);
  if ("+-×÷Σ".includes(f.op) && !f.blank) return f.q;
  return factText(key).text;
}
// "just now", "5 minutes ago", "3 hours ago", "yesterday", "4 days ago", "3 weeks ago".
export function ago(ms) {
  const m = Math.floor(ms / 60e3), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (m < 1) return "just now";
  if (h < 1) return m === 1 ? "a minute ago" : `${m} minutes ago`;
  if (d < 1) return h === 1 ? "an hour ago" : `${h} hours ago`;
  if (d === 1) return "yesterday";
  if (d < 14) return `${d} days ago`;
  if (d < 60) return `${Math.floor(d / 7)} weeks ago`;
  return `${Math.floor(d / 30)} months ago`;
}
// Seconds, to a tenth under 10 ("3.2 s").
export const secs = (ms) => (ms < 10000 ? (ms / 1000).toFixed(1) : String(Math.round(ms / 1000))) + " s";
// What a fact's details show (tap a cell or a chip).
export function factDetail(key, rec, now) {
  const { text, said } = factText(key), s = factState(rec, key), r = rec || {};
  return {
    key, text, said, ...s,
    seen: r.n || 0, right: r.c || 0, missed: Math.max(0, (r.n || 0) - (r.c || 0)),
    avg: r.ms > 0 ? secs(r.ms) : null, fluentIn: secs(fluentLimit(key)),
    last: r.t ? ago(Math.max(0, now - r.t)) : null,
    placed: !!r.placed
  };
}

/* ---------- where they are: a stratum's path ---------- */
// A step counts as learned at this share of its facts learned (box 3+): the share that counts a
// tier as known for skipping ahead.
export const DONE_AT = TIER_KNOWN;
// Each step of a stratum's path, in teaching order: its name, flags, chapter, how many facts it
// has, seen, learned (box 3+) and mastered (box 4), the share learned, and a state: "learned",
// "now" (open: in the window, or an ongoing or review step) or "later" (not open yet).
export function stepRows(wing, progress, recs, chapter) {
  const path = PATHS[wing.id], { open } = stepsOpen(wing, progress, recs, chapter);
  return path.map((s, i) => {
    const fs = stepFacts(s), count = (t) => fs.filter((f) => t(recs[f.key])).length;
    const total = fs.length, nLearned = count(learned), share = total ? nLearned / total : 0;
    return {
      i, name: s.name, chapter: s.chapter, priority: s.priority, ongoing: s.ongoing, review: s.review,
      total, seen: count((r) => r && r.n), learned: nLearned, mastered: count(topBox), share,
      state: share >= DONE_AT ? "learned" : open.includes(i) ? "now" : "later",
      keys: fs.map((f) => f.key)
    };
  });
}
// The words for a step's state: "Learned ✓"; an open step "Up now" once it's been asked, and "Up
// next" until then (open, but no problem from it yet: a step can wait a little for its turn); "Not
// started" for one not open yet.
export function stepLabel(r) {
  return r.state === "learned" ? "Learned ✓" : r.state === "now" ? (r.seen ? "Up now" : "Up next") : "Not started";
}
// Above each path: the chapter they're on and the next mega boss's depth; how close the next
// stratum is; and the Legend.
//   next: null (the last stratum), or { name, open, share, need, boss: beaten? }
//   legend: { state: "beaten" | "open" | "locked", share: of the priority facts mastered }
export function stratumSummary(wing, progress, recs, openIds) {
  const p = (progress || {})[wing.id] || {}, path = PATHS[wing.id];
  const after = WINGS.find((w) => w.after === wing.id);
  const next = after ? { name: after.name, open: (openIds || []).includes(after.id), share: learnedShare(wing, recs), need: OPEN_AT, boss: (p.boss || 0) > 0 } : null;
  return {
    id: wing.id, name: wing.name,
    chapter: chapterOf(wing, progress), chapters: chaptersOf(path),
    nextMega: MEGA_EVERY * (megasOf(p) + 1), deepest: deepest(wing, progress || {}),
    next,
    legend: { state: legendBeaten(wing, progress) ? "beaten" : legendDue(wing, progress, recs) ? "open" : "locked", share: legendShare(wing, recs) }
  };
}
// The open strata, the current one first.
export function strataOrder(openIds, currentId) {
  return WINGS.filter((w) => openIds.includes(w.id)).sort((a, b) => (b.id === currentId) - (a.id === currentId));
}

/* ---------- fact maps ---------- */
// The four grids. Each cell is one fact; turnarounds (3 + 4, 4 + 3) share a key (learn.js keyOf),
// so both cells show the same record. Subtraction and division are laid out like their inverse:
// a row for what's taken away (or the divisor) and a column for the answer, so 13 − 4 sits where
// 9 + 4 does.
//   add: a + b, 0–10 by 0–10 (sums to 20; a teen plus a number, 13 + 4, is in the list below)
//   sub: (a + b) − a, taking away 0–10, answers 0–10 (13 − 4 is row 4, column 9)
//   times: a × b, 0–12 by 0–12
//   divide: (a × b) ÷ a, dividing by 1–12, answers 0–12
const span = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
export const GRIDS = [
  { id: "add", name: "Addition", sign: "+", rows: span(0, 10), cols: span(0, 10), key: (r, c) => keyOf({ op: "+", x: r, y: c }), text: (r, c) => `${r} + ${c}`, words: (r, c) => `${r} plus ${c}`, corner: "+" },
  { id: "sub", name: "Subtraction", sign: "−", rows: span(0, 10), cols: span(0, 10), key: (r, c) => `-${r + c},${r}`, text: (r, c) => `${r + c} − ${r}`, words: (r, c) => `${r + c} minus ${r}`, corner: "−", rowHead: "take away", colHead: "answer" },
  { id: "times", name: "Times", sign: "×", rows: span(0, 12), cols: span(0, 12), key: (r, c) => keyOf({ op: "×", x: r, y: c }), text: (r, c) => `${r} × ${c}`, words: (r, c) => `${r} times ${c}`, corner: "×" },
  { id: "divide", name: "Division", sign: "÷", rows: span(1, 12), cols: span(0, 12), key: (r, c) => `÷${r * c},${r}`, text: (r, c) => `${r * c} ÷ ${r}`, words: (r, c) => `${r * c} divided by ${r}`, corner: "÷", rowHead: "divide by", colHead: "answer" }
];
const gridKeys = new Map();
// The keys a grid holds (cells that are facts some band asks).
function keysOfGrid(g) {
  if (!gridKeys.has(g.id)) { const s = new Set(); for (const r of g.rows) for (const c of g.cols) { const k = g.key(r, c); if (known(k)) s.add(k); } gridKeys.set(g.id, s); }
  return gridKeys.get(g.id);
}
export const inAnyGrid = (key) => GRIDS.some((g) => keysOfGrid(g).has(key));
// A grid's rows of cells: { row, cells: [null (no such fact) or { key, row, col, text, label,
// state, box, fluent }] }, and its totals.
export function gridOf(id, recs) {
  const g = GRIDS.find((x) => x.id === id), seenKeys = new Set();
  let n = 0, nLearned = 0, nMastered = 0;
  const rows = g.rows.map((r) => ({ row: r, cells: g.cols.map((c) => {
    const key = g.key(r, c);
    if (!known(key)) return null;
    const s = factState(recs[key], key);
    if (!seenKeys.has(key)) { seenKeys.add(key); n++; if (s.state === "learned" || s.state === "mastered") nLearned++; if (s.state === "mastered") nMastered++; }
    return { key, row: r, col: c, text: g.text(r, c), label: `${g.words(r, c)}: ${STATE_WORDS[s.state]}${s.fluent ? ", fluent" : ""}`, ...s };
  }) }));
  return { id, name: g.name, corner: g.corner, rowHead: g.rowHead || null, colHead: g.colHead || null, cols: g.cols, rows, total: n, learned: nLearned, mastered: nMastered };
}
// The facts the open strata ask (their paths' steps), each key once, with the stratum it's from.
export function openFacts(openIds) {
  const seen = new Set(), out = [];
  for (const w of WINGS) if (openIds.includes(w.id)) for (const s of PATHS[w.id]) for (const f of stepFacts(s)) if (!seen.has(f.key)) { seen.add(f.key); out.push(f.key); }
  return out;
}
// The grids to show: those with a fact in an open stratum, or a fact the player has seen.
export function gridsFor(openIds, recs) {
  const keys = new Set(openFacts(openIds));
  return GRIDS.filter((g) => [...keysOfGrid(g)].some((k) => keys.has(k) || (recs[k] && recs[k].n))).map((g) => g.id);
}

// Every other kind of fact, by its key: the name a grown-up knows it by.
export function kindOf(key) {
  const op = key[0];
  if (op === "+" || op === "-") {
    const [x, y] = key.slice(1).split(",").map(Number), top = op === "+" ? x + y : x;
    return top <= 20 ? "teens" : Math.max(x, y) < 100 && top < 100 ? "two" : Math.max(x, y) < 1000 ? "three" : "million";
  }
  // 4th grade's (the Fraction Forge): multi-digit × and ÷ apart from 3rd grade's × tens and ÷ past 12.
  if (op === "×") { const [x, y] = key.slice(1).split(",").map(Number), a = Math.min(x, y), b = Math.max(x, y); return b <= 12 || (a < 10 && b < 100 && b % 10 === 0) ? "tens" : "mul4"; }
  if (op === "÷") { const [x, y] = key.slice(1).split(",").map(Number); return x > 144 || (x / y > 12 && y <= 9) ? "div4" : "big"; }
  if (op === "○" && key.includes(".")) return "decimals";
  if (op === "¢" || op === "$") return "coins";
  if (op === "/" || op === "↔") return "fractions";
  if (op === "○" && key.includes("/")) return "fractions";
  return { "ℓ": "length", "▥": "charts", "□": "missing", "M": "more", "○": "compare", "=": "balance", "✓": "truefalse", "✎": "truefalse", "Σ": "sums", "▦": "arrays", "⌚": "time", "…": "patterns", "◐": "oddeven", "#": "placevalue", "◇": "shapes", "⁙": "dots", "≈": "rounding", "▭": "area", "R": "remainders", "E": "steps", "F": "steps", "ƒ": "fracops", "d": "decimals", "∠": "angles", "u": "units", "P": "primes", "D": "coins" }[op] || "other";
}
export const KIND_NAMES = {
  dots: "Dot flash", more: "Which is more", missing: "Missing numbers", teens: "Teen facts (13 + 4)", compare: "Comparing", balance: "Balancing (equal sign)",
  truefalse: "True or false", sums: "Three or more numbers", two: "Two-digit + and −", three: "Three-digit + and −", placevalue: "Place value",
  coins: "Coins and money", time: "Telling time", patterns: "Counting patterns", oddeven: "Odd and even", arrays: "Arrays", shapes: "Shapes",
  tens: "× tens", big: "÷ past 12", rounding: "Rounding", fractions: "Fractions", area: "Area and perimeter",
  million: "+ and − to a million", mul4: "Multi-digit ×", div4: "Multi-digit ÷", remainders: "Remainders", steps: "Multi-step and factors", fracops: "Adding and multiplying fractions",
  decimals: "Decimals", primes: "Prime or composite", angles: "Angles and shapes", units: "Measurement", charts: "Reading charts", length: "Measuring length", other: "Other"
};
// The other kinds the open strata ask, in the order they first come up: { id, name, keys, total,
// seen, learned, mastered } (learned counts box 3 and 4).
export function kindsFor(openIds, recs) {
  const by = new Map();
  for (const key of openFacts(openIds)) {
    if (inAnyGrid(key)) continue;
    const id = kindOf(key);
    if (!by.has(id)) by.set(id, { id, name: KIND_NAMES[id], keys: [], total: 0, seen: 0, learned: 0, mastered: 0 });
    const k = by.get(id), r = recs[key];
    k.keys.push(key); k.total++;
    if (r && r.n) k.seen++;
    if (learned(r)) k.learned++;
    if (topBox(r)) k.mastered++;
  }
  return [...by.values()];
}

/* ---------- needs work ---------- */
// The most-missed facts (by misses, then by miss rate), leaving out the ones since mastered; and
// the slowest facts they know but not yet by heart (learned, but their average time over the
// fluent time), slowest for their fact first. Up to `limit` each: [{ key, misses, rate } |
// { key, ms, over }].
export function needsWork(recs, limit = 8) {
  const keys = Object.keys(recs || {}).filter((k) => known(k) && recs[k] && recs[k].n);
  const missed = keys.map((key) => { const r = recs[key], misses = r.n - (r.c || 0); return { key, misses, rate: misses / r.n, t: r.t || 0 }; })
    .filter((m) => m.misses > 0 && !topBox(recs[m.key]))
    .sort((a, b) => b.misses - a.misses || b.rate - a.rate || b.t - a.t).slice(0, limit);
  const slow = keys.filter((k) => learned(recs[k]) && recs[k].ms > fluentLimit(k))
    .map((key) => ({ key, ms: recs[key].ms, over: recs[key].ms / fluentLimit(key) }))
    .sort((a, b) => b.over - a.over || b.ms - a.ms).slice(0, limit);
  return { missed, slow };
}
