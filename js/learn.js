// The learning engine (DESIGN.md §5): bands and their levels, per-fact mastery records, and
// choosing each problem on purpose. No DOM: runs in Node for the tests.
//
// A fact record: { b: box 0–4, n: times seen, c: right, ms: average answer time, t: last seen }.
//   Right and unhinted moves a fact up a box (two when fast, from box 1 on); a miss sends it to
//   box 0; a hinted answer changes nothing, so mastery needs solves without help.
import { facts } from "./problems.js";

// Facts by the order classrooms teach them (Missouri Learning Standards, DESIGN.md §2, §5.3).
// A level opens when 70% of the level before it is learned (box 3 or more).
const within = (n) => (f) => (f.op === "+" && f.ans <= n) || (f.op === "-" && f.x <= n);
const teen = (f) => (f.op === "+" && (f.x === 10 || f.y === 10)) || (f.op === "-" && f.x > 10 && f.ans === 10);
const times = (set) => (f) => f.op === "×" && (set.includes(f.x) || set.includes(f.y)) && f.x <= 10 && f.y <= 10;
const divide = (set) => (f) => f.op === "÷" && set.includes(f.y) && f.ans <= 10;
const big = (f) => (f.op === "×" && (f.x > 10 || f.y > 10)) || (f.op === "÷" && (f.y > 10 || f.ans > 10));

export const BANDS = {
  sprout: {
    label: "Sprout", grades: "Kindergarten–1st", hearts: 7, fluentMs: 3000,
    levels: [
      { name: "Within 5", has: within(5) },
      { name: "Within 10", has: within(10) },
      { name: "10 and some more", has: teen },
      { name: "Within 20", has: within(20) }
    ]
  },
  apprentice: {
    label: "Apprentice", grades: "2nd–3rd", hearts: 5, fluentMs: 3000,
    levels: [
      { name: "Add and subtract within 20", has: within(20) },
      { name: "× 2, 5 and 10", has: times([2, 5, 10]) },
      { name: "÷ 2, 5 and 10", has: divide([2, 5, 10]) },
      { name: "× 3 and 4", has: times([3, 4]) },
      { name: "÷ 3 and 4", has: divide([3, 4]) },
      { name: "× 6, 7, 8 and 9", has: times([6, 7, 8, 9]) },
      { name: "÷ 6, 7, 8 and 9", has: divide([6, 7, 8, 9]) },
      { name: "× and ÷ 11 and 12", has: big }
    ]
  }
};
export const UNLOCK = 0.7;
const BOX_MAX = 4;
// Review spacing by box: a box-3 fact comes back after 10 minutes, box 4 after a day.
const DUE_MS = { 3: 10 * 60e3, 4: 24 * 3600e3 };

// One key per fact. Turnarounds share a key for + and × (3 + 4 is 4 + 3); − and ÷ don't.
export function keyOf(f) {
  if (f.op === "+" || f.op === "×") return f.op + Math.min(f.x, f.y) + "," + Math.max(f.x, f.y);
  return f.op + f.x + "," + f.y;
}
// A problem for a key, turned around half the time for + and ×.
export function factOf(key, rnd) {
  const op = key[0], [a, b] = key.slice(1).split(",").map(Number);
  const flip = (op === "+" || op === "×") && (rnd || Math.random)() < 0.5;
  const x = flip ? b : a, y = flip ? a : b;
  const ans = { "+": x + y, "-": x - y, "×": x * y, "÷": x / y }[op];
  return { op, x, y, ans, q: x + " " + (op === "-" ? "−" : op) + " " + y, key };
}

// The band's facts, each once, with the first level that has it: [{ key, op, ans, level }].
const poolCache = {};
export function pool(bandKey) {
  if (poolCache[bandKey]) return poolCache[bandKey];
  const band = BANDS[bandKey], seen = {}, out = [];
  for (const f of facts()) {
    const key = keyOf(f);
    if (seen[key]) continue;
    const level = band.levels.findIndex((l) => l.has(f));
    if (level < 0) continue;
    seen[key] = true;
    out.push({ key, op: f.op, ans: f.ans, level });
  }
  return (poolCache[bandKey] = out);
}

export function learned(rec) { return !!rec && rec.b >= 3; }
export function mastered(rec, fluentMs) { return !!rec && rec.b >= BOX_MAX && rec.ms > 0 && rec.ms < fluentMs; }

// The highest open level: each level opens once 70% of the one before is learned.
export function openLevel(bandKey, recs) {
  const band = BANDS[bandKey], p = pool(bandKey);
  let L = 0;
  while (L < band.levels.length - 1) {
    const here = p.filter((f) => f.level === L);
    const done = here.filter((f) => learned(recs[f.key])).length;
    if (!here.length || done / here.length < UNLOCK) break;
    L++;
  }
  return L;
}

// How much help a fact gets (DESIGN.md §5.3): "show" the model automatically for a new fact,
// a hint "button" while learning, "none" once it's in review.
export function helpFor(rec) {
  if (!rec || !rec.n) return "show";
  return rec.b <= 2 ? "button" : "none";
}

// After an answer. ok: right; ms: time taken; hinted: a hint was open.
export function record(rec, { ok, ms, hinted, now, fluentMs }) {
  const r = Object.assign({ b: 0, n: 0, c: 0, ms: 0, t: 0 }, rec);
  r.n++; r.t = now;
  if (!ok) { r.b = 0; return r; }
  r.c++;
  if (hinted) return r;
  r.ms = r.ms ? Math.round(r.ms * 0.7 + ms * 0.3) : Math.round(ms);
  r.b = Math.min(BOX_MAX, r.b + (r.b >= 1 && ms < fluentMs ? 2 : 1));
  return r;
}

// The next fact's key. opts: { now, rnd, recent: [keys] (not again so soon), retry: key due now
// or null, op: the monster's operation, preferred 70% of the time when it has facts here,
// like: a test on a key for facts the monster asks more often (a trait), also 70% }.
// About 60% learning facts (seen, box 0–2, weighted to box 0 and the longest unseen), 25%
// review facts that are due, 15% new ones (from the newest open level first).
export function choose(bandKey, recs, opts) {
  const rnd = opts.rnd || Math.random, now = opts.now, recent = opts.recent || [];
  if (opts.retry) return opts.retry;
  const L = openLevel(bandKey, recs);
  let open = pool(bandKey).filter((f) => f.level <= L && !recent.includes(f.key));
  if (!open.length) open = pool(bandKey).filter((f) => f.level <= L);
  if (opts.op) {
    const mine = open.filter((f) => f.op === opts.op);
    if (mine.length && rnd() < 0.7) open = mine;
  }
  if (opts.like) {
    const liked = open.filter((f) => opts.like(f.key));
    if (liked.length && rnd() < 0.7) open = liked;
  }
  const fresh = open.filter((f) => !recs[f.key] || !recs[f.key].n);
  const learning = open.filter((f) => recs[f.key] && recs[f.key].n && recs[f.key].b <= 2);
  const due = open.filter((f) => { const r = recs[f.key]; return r && r.b >= 3 && now - r.t >= DUE_MS[r.b]; });
  const groups = [[learning, 0.6], [due, 0.25], [fresh, 0.15]].filter(([g]) => g.length);
  if (!groups.length) return open[Math.floor(rnd() * open.length)].key; // all learned and not due: anything open
  let roll = rnd() * groups.reduce((s, [, w]) => s + w, 0), pick = groups[0][0];
  for (const [g, w] of groups) { if (roll < w) { pick = g; break; } roll -= w; }
  if (pick === fresh) {
    const newest = Math.max(...fresh.map((f) => f.level));
    const top = fresh.filter((f) => f.level === newest);
    return top[Math.floor(rnd() * top.length)].key;
  }
  if (pick === learning) {
    // Weighted: box 0 counts 3, box 1 counts 2, box 2 counts 1; then the longest unseen.
    // A little randomness keeps equal facts from always coming in the same order.
    const w = learning.map((f) => ({ f, w: 3 - recs[f.key].b + rnd() * 0.5 }));
    w.sort((a, b) => b.w - a.w || recs[a.f.key].t - recs[b.f.key].t);
    return w[Math.floor(rnd() * Math.min(3, w.length))].f.key;
  }
  due.sort((a, b) => recs[a.key].t - recs[b.key].t);
  return due[0].key;
}

// Monster HP (DESIGN.md §5.5): the average answer of what this player is actually being asked
// (the open levels, with the monster's operation preferred) × its hits. app.js scales it by depth.
export function monsterHP(m, bandKey, recs) {
  const L = openLevel(bandKey, recs), open = pool(bandKey).filter((f) => f.level <= L);
  const mine = open.filter((f) => f.op === m.op);
  // A monster that hides a number (m.blank, Quizard) is hit by the hidden number: on average,
  // the mean of the fact's two numbers.
  const val = (f) => { if (!m.blank) return f.ans; const [a, b] = f.key.slice(1).split(",").map(Number); return (a + b) / 2; };
  const avg = (fs) => fs.reduce((s, f) => s + val(f), 0) / fs.length;
  const mean = mine.length ? avg(mine) * 0.7 + avg(open) * 0.3 : avg(open);
  return Math.max(10, Math.round(mean * m.hits));
}
