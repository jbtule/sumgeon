// The learning engine (DESIGN.md §5): bands and their levels, per-fact mastery records, and
// choosing each problem on purpose. No DOM: runs in Node for the tests.
//
// A fact record: { b: box 0–4, n: times seen, c: right, ms: average answer time, t: last seen }.
//   Right and unhinted moves a fact up a box (two when fast, from box 1 on); a miss sends it to
//   box 0; a hinted answer changes nothing, so mastery needs solves without help.
import { facts } from "./problems.js";
import { coinFacts, coinFactOf, COIN_LEVELS } from "./coins.js";
import { twoDigitFacts, twoLevel } from "./twodigit.js";
import { balanceFacts, balanceFactOf, inSet, moreFacts, moreFactOf, MORE_LEVELS } from "./balance.js";
import { hiddenFactOf, kinderHidden, firstHidden } from "./missing.js";
import { timesTens, fractionFacts, fractionFactOf, roundFacts, roundFactOf, rectFacts, rectFactOf } from "./third.js";
import { asks as asksOf } from "./traits.js";

// One band per grade, K to 3rd (DESIGN.md §2, §4.1), each the facts of one stratum, with its
// levels in the order the school teaches them (Missouri Learning Standards and the school's
// curriculum guides). A level opens when 70% of the level before it is learned (box 3 or more).
// Strands are small bands a stratum gives one monster (Trollar's coins, Chompers' "which is
// more?" in the Cellar): asked one floor a run, with their own levels.
const plain = (f) => !f.blank;
const within = (n) => (f) => plain(f) && ((f.op === "+" && f.ans <= n) || (f.op === "-" && f.x <= n));
const teen = (f) => plain(f) && ((f.op === "+" && (f.x === 10 || f.y === 10) && f.ans <= 20) || (f.op === "-" && f.x > 10 && f.x <= 20 && f.ans === 10));
// Crossing 10: the ones make more than a ten (8 + 5, 13 + 9), or taking away needs to break one
// (13 − 4, 20 − 1). 9 + 1 and 13 + 7 only reach it.
const crosses = (f) => (f.op === "+" ? (f.x % 10) + (f.y % 10) > 10 : f.x > 10 && f.y % 10 > f.x % 10);
const times = (set) => (f) => f.op === "×" && (set.includes(f.x) || set.includes(f.y)) && f.x <= 10 && f.y <= 10;
const divide = (set) => (f) => f.op === "÷" && set.includes(f.y) && f.ans <= 10;
const tens = (f) => f.op === "×" && Math.max(f.x, f.y) >= 20;
const big = (f) => (f.op === "×" && (f.x > 10 || f.y > 10)) || (f.op === "÷" && (f.y > 10 || f.ans > 10));
const is = (op) => (f) => f.op === op;
const any = (...tests) => (f) => tests.some((t) => t(f));
const hidden = (f) => !!f.blank;

export const BANDS = {
  // The Counting Cellar.
  kinder: {
    label: "Kindergarten", grade: 0, hearts: 7, fluentMs: 4000,
    facts: () => facts().concat(kinderHidden()),
    levels: [
      { name: "Within 5, with zero", has: within(5) },
      { name: "Within 10", has: within(10) },
      { name: "Make 10 and number bonds", has: (f) => hidden(f) && f.fact.ans <= 10 },
      { name: "10 and some more", has: any(teen, (f) => hidden(f) && f.x === 10) }
    ]
  },
  // The Balance Hall.
  first: {
    label: "1st grade", grade: 1, hearts: 7, fluentMs: 4000,
    facts: () => facts().concat(balanceFacts(), firstHidden(), twoDigitFacts()),
    levels: [
      // Within 10 and 10 and some more (10 + 6, 16 − 6) are the Cellar's: here, the rest of the
      // teens (13 + 4, 17 − 5; a teen take away a teen, 17 − 12, is left out to keep the level short).
      { name: "Within 20, not crossing 10", has: any((f) => within(20)(f) && !within(10)(f) && !teen(f) && !crosses(f) && !(f.op === "-" && f.y > 10), inSet("Compare to 10"), inSet("The other side")) },
      { name: "Crossing 10", has: any((f) => within(20)(f) && crosses(f), inSet("Compare sums")) },
      { name: "Missing numbers and the equal sign", has: any(hidden, inSet("Balance both sides")) },
      { name: "Add and subtract tens", has: any(twoLevel("Add tens", "Subtract tens", "10 more", "10 less", "Add tens to a number"), inSet("Compare to 100")) }
    ]
  },
  // The Crystal Mines: two-digit ± within 100, adding and subtracting mixed, then regrouping,
  // then 10 and 100 more or less within 1000.
  second: {
    label: "2nd grade", grade: 2, hearts: 5, fluentMs: 6000, facts: twoDigitFacts,
    levels: [
      { name: "Add and subtract, no regrouping", has: twoLevel("Add ones", "Add tens and ones", "Subtract, no regrouping") },
      { name: "Add and subtract, regrouping", has: twoLevel("Add and regroup", "Subtract and regroup") },
      { name: "10 and 100 more or less", has: twoLevel("10 more, 10 less to 1000", "100 more, 100 less") }
    ]
  },
  // The Tables Tower: × and ÷ only, in the school's order, then the rest of 3rd grade.
  third: {
    label: "3rd grade", grade: 3, hearts: 5, fluentMs: 4000,
    facts: () => facts().concat(timesTens(), fractionFacts(), roundFacts(), rectFacts()),
    levels: [
      { name: "× 0, 1, 2, 5 and 10", has: times([0, 1, 2, 5, 10]) },
      { name: "÷ 1, 2, 5 and 10", has: divide([1, 2, 5, 10]) },
      { name: "× 3, 4 and 6", has: times([3, 4, 6]) },
      { name: "÷ 3, 4 and 6", has: divide([3, 4, 6]) },
      { name: "× 7, 8 and 9", has: times([7, 8, 9]) },
      { name: "÷ 7, 8 and 9", has: divide([7, 8, 9]) },
      { name: "× tens", has: tens },
      { name: "Fractions", has: is("/") },
      { name: "Rounding", has: is("≈") },
      { name: "Area and perimeter", has: is("▭") },
      { name: "× and ÷ 11 and 12", has: big }
    ]
  },
  // Strands open their next level at half learned: they're asked one floor a run, so 70% kept
  // Trollar on pennies for runs on end.
  // Coins in the Cellar (K): find the coin, and what each is worth.
  coinsK: { label: "Coins", strand: true, unlock: 0.5, hearts: 7, fluentMs: 5000, facts: coinFacts, levels: COIN_LEVELS.slice(0, 2) },
  // Counting coins in the Mines (2nd grade; 1st grade's counting comes along).
  coins: { label: "Counting coins", strand: true, unlock: 0.5, hearts: 5, fluentMs: 5000, facts: coinFacts,
    levels: COIN_LEVELS.slice(2).map((l) => ({ name: l.name, has: (f) => !f.find && !COIN_LEVELS[1].has(f) && l.has(f) })) },
  // Which is more (K): Chompers in the Cellar.
  more: { label: "Which is more", strand: true, unlock: 0.5, hearts: 7, fluentMs: 4000, facts: moreFacts, levels: MORE_LEVELS }
};
export const UNLOCK = 0.7;
const BOX_MAX = 4;
// Review spacing by box: a box-3 fact comes back after 10 minutes, box 4 after a day.
const DUE_MS = { 3: 10 * 60e3, 4: 24 * 3600e3 };

// One key per fact. Turnarounds share a key for + and × (3 + 4 is 4 + 3); − and ÷ don't. Facts
// that carry a key of their own (coins, comparing, balancing, □ facts, fractions, rounding,
// rectangles) keep it.
export function keyOf(f) {
  if (f.key && !"+-×÷".includes(f.key[0])) return f.key;
  if (f.op === "+" || f.op === "×") return f.op + Math.min(f.x, f.y) + "," + Math.max(f.x, f.y);
  return f.op + f.x + "," + f.y;
}
// A problem for a key, turned around half the time for + and ×.
export function factOf(key, rnd) {
  const own = { "¢": coinFactOf, "○": balanceFactOf, "=": balanceFactOf, "□": hiddenFactOf, "M": moreFactOf, "/": fractionFactOf, "≈": roundFactOf, "▭": rectFactOf }[key[0]];
  if (own) return own(key, rnd);
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
  for (const f of (band.facts || facts)()) {
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
    if (!here.length || done / here.length < (band.unlock || UNLOCK)) break;
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
// Placement: a fact seen for the first time and answered right, fast and without a hint is one
// the player already knows, so it goes straight to learned (box 3). A fluent player isn't held
// back by facts they know; facts they don't still get the whole climb.
export function record(rec, { ok, ms, hinted, now, fluentMs }) {
  const first = !rec || !rec.n;
  const r = Object.assign({ b: 0, n: 0, c: 0, ms: 0, t: 0 }, rec);
  r.n++; r.t = now;
  if (!ok) { r.b = 0; return r; }
  r.c++;
  if (hinted) return r;
  r.ms = r.ms ? Math.round(r.ms * 0.7 + ms * 0.3) : Math.round(ms);
  if (first && ms < fluentMs) { r.b = 3; return r; }
  r.b = Math.min(BOX_MAX, r.b + (r.b >= 1 && ms < fluentMs ? 2 : 1));
  return r;
}

/* ---------- skipping ahead (fluent players) ----------
   Each band's facts, easiest first, are cut into tiers of about TIER facts that stay inside a
   level. While a player answers fluently, app.js asks a probe from a tier above the first one
   not yet learned (the frontier); SKIP_PROBES fluent probes out of the last SKIP_WINDOW count
   everything below the probe's tier as known (skipTo). The leap grows: probes start one tier
   above the frontier, and each skip in a row doubles how far up they come from (1, 2, 4 tiers,
   up to MAX_LEAP), so a fluent player climbs fast; a slipped window drops it back to 1. The levels go in teaching order, so fluency on a harder tier means the easier ones
   are known. Skipped facts still come back as reviews, and a miss sends them back to learning. */
export const TIER = 20;
// Skipping needs SKIP_PROBES fluent probes out of the last SKIP_WINDOW, so one mis-tap or slow
// answer doesn't undo it; tuned so a fluent player opens the next strata in about five runs
// (scripts/balance-sim.mjs).
export const SKIP_PROBES = 5, SKIP_WINDOW = 6, MAX_LEAP = 4;
// How long a fluent answer may take: the band's time for thinking and one tap, plus a second
// for each extra digit to tap. A two-digit answer gets 4 s in Sprout.
export function fluentTime(bandMs, answer) { return bandMs + 1000 * Math.max(0, String(answer).length - 1); }
// How hard a fact is inside its level: its answer, and a bit more for crossing ten.
function hardness(f) {
  if (!"+-×÷".includes(f.key[0])) return f.ans;
  const [a, b] = String(f.key).slice(1).split(",").map((n) => parseInt(n, 10));
  if (f.op === "+" && a < 10 && b < 10 && a + b > 10) return f.ans + 6;
  if (f.op === "-" && a > 10 && b % 10 > a % 10) return a + 6;
  if (f.op === "÷") return a;
  return f.ans;
}
const tierCache = {};
export function tiers(bandKey) {
  if (tierCache[bandKey]) return tierCache[bandKey];
  const p = pool(bandKey), out = [];
  for (const L of [...new Set(p.map((f) => f.level))].sort((x, y) => x - y)) {
    const fs = p.filter((f) => f.level === L).sort((x, y) => hardness(x) - hardness(y) || (x.key < y.key ? -1 : 1));
    const n = Math.max(1, Math.round(fs.length / TIER));
    for (let i = 0; i < n; i++) out.push(fs.slice(Math.floor(i * fs.length / n), Math.floor((i + 1) * fs.length / n)).map((f) => f.key));
  }
  return (tierCache[bandKey] = out);
}
export const tierOf = (bandKey, key) => tiers(bandKey).findIndex((t) => t.includes(key));
// The first tier not yet mostly learned (UNLOCK of it).
export function frontier(bandKey, recs) {
  const t = tiers(bandKey);
  for (let i = 0; i < t.length; i++) if (t[i].filter((k) => learned(recs[k])).length / t[i].length < UNLOCK) return i;
  return t.length;
}
// A probe: a fact not learned yet from `leap` tiers above the frontier (1 by default; the top
// tier at most), or null when there's none.
// asks: the kinds of problem the monster asks (traits.js asks), as a test on an operation.
export function probeKey(bandKey, recs, rnd, recent, avoidAns, leap, asks) {
  const t = tiers(bandKey), fr = frontier(bandKey, recs);
  if (fr + 1 >= t.length) return null;
  const i = Math.min(t.length - 1, fr + Math.max(1, leap || 1));
  const factAt = (k) => pool(bandKey).find((x) => x.key === k) || {};
  const ansOf = (k) => { const f = factAt(k); return f.op + " " + f.ans; };
  let fresh = t[i].filter((k) => !learned(recs[k]) && !(recent || []).includes(k) && (!asks || asks(factAt(k).op)));
  const varied = fresh.filter((k) => !(avoidAns || []).includes(ansOf(k)));
  if (varied.length) fresh = varied;
  return fresh.length ? fresh[Math.floor((rnd || Math.random)() * fresh.length)] : null;
}
// Counts every fact in the tiers below `upto` as known (box 3, placed). Returns how many.
export function skipTo(bandKey, recs, upto, now, fluentMs) {
  const t = tiers(bandKey);
  let n = 0;
  for (let i = 0; i < upto; i++) for (const k of t[i]) {
    if (learned(recs[k])) continue;
    recs[k] = { b: 3, n: 1, c: 1, ms: Math.round(fluentMs * 0.8), t: now, placed: 1 };
    n++;
  }
  return n;
}

// The next fact's key. opts: { now, rnd, recent: [keys] (not again so soon), retry: key due now
// or null, asks: a test on an operation for the kinds of problem the monster asks at all
// (traits.js asks: Chompers only compares), op: the monster's operation, preferred 70% of the
// time when it has facts here, like: a test on a key for facts the monster asks more often (a
// trait), also 70% }.
// About 60% learning facts (seen, box 0–2, weighted to box 0 and the longest unseen), 25%
// review facts that are due, 15% new ones (from the newest open level first).
export function choose(bandKey, recs, opts) {
  const rnd = opts.rnd || Math.random, now = opts.now, recent = opts.recent || [];
  if (opts.retry) return opts.retry;
  const L = openLevel(bandKey, recs);
  let open = asked(bandKey, L, opts.asks).filter((f) => !recent.includes(f.key));
  if (!open.length) open = asked(bandKey, L, opts.asks);
  // Not the same kind of problem with the same answer as the last couple (opts.avoidAns, as
  // "op ans" like "- 10"), when there's anything else: the teen subtraction facts (17 − 7,
  // 15 − 5, 12 − 2) all equal 10 and came up in a row. A different kind (3 + 7) is fine.
  const varied = open.filter((f) => !(opts.avoidAns || []).includes(f.op + " " + f.ans));
  if (varied.length) open = varied;
  // New facts come from everything open when the monster's own operation has none left, so a
  // new level of another kind (fractions, under Timesaur) still arrives.
  const allFresh = open.filter((f) => !recs[f.key] || !recs[f.key].n);
  if (opts.op) {
    const mine = open.filter((f) => f.op === opts.op);
    if (mine.length && rnd() < 0.7) open = mine;
  }
  if (opts.like) {
    const liked = open.filter((f) => opts.like(f.key));
    if (liked.length && rnd() < 0.7) open = liked;
  }
  // The captain's digit (opts.digit), now and then (opts.digitShare): answers with it, when there
  // are any, so the hero's power hits (and their first Hero Moment) come early at depth 1. It only
  // narrows which facts are open; the learning, review and new shares below are unchanged.
  if (opts.digit != null && opts.digitShare && rnd() < opts.digitShare) {
    const mine = open.filter((f) => String(f.ans).includes(String(opts.digit)));
    if (mine.length) open = mine;
  }
  // Or the other way (opts.avoidDigitShare): answers without it, when there are any. The first
  // fight uses this, since it has no Hero Moments: the captain's digit is saved for the fight
  // after, where its first answer is the captain's first moment.
  if (opts.digit != null && opts.avoidDigitShare && rnd() < opts.avoidDigitShare) {
    const other = open.filter((f) => !String(f.ans).includes(String(opts.digit)));
    if (other.length) open = other;
  }
  let fresh = open.filter((f) => !recs[f.key] || !recs[f.key].n);
  if (!fresh.length) fresh = allFresh;
  const learning = open.filter((f) => recs[f.key] && recs[f.key].n && recs[f.key].b <= 2);
  const due = open.filter((f) => { const r = recs[f.key]; return r && r.b >= 3 && now - r.t >= DUE_MS[r.b]; });
  // Deeper in a Wing (opts.depth), more of the newest problems: 15% at depth 1, up to 35%.
  const freshShare = 0.15 + Math.min(0.2, 0.05 * ((opts.depth || 1) - 1));
  const groups = [[learning, 0.6], [due, 0.25], [fresh, freshShare]].filter(([g]) => g.length);
  if (!groups.length) return open[Math.floor(rnd() * open.length)].key; // all learned and not due: anything open
  let roll = rnd() * groups.reduce((s, [, w]) => s + w, 0), pick = groups[0][0];
  for (const [g, w] of groups) { if (roll < w) { pick = g; break; } roll -= w; }
  if (pick === fresh) {
    // From the newest level.
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

// A fact for a spell (app.js): learned, with a one-digit answer, from the open levels and not
// one of the last few; the monster's operation preferred. Null when there's none.
export function spellKey(bandKey, recs, opts) {
  const rnd = opts.rnd || Math.random, recent = opts.recent || [], L = openLevel(bandKey, recs);
  let ok = asked(bandKey, L, opts.asks).filter((f) => "+-×÷".includes(f.key[0]) && f.ans >= 0 && f.ans <= 9 && learned(recs[f.key]) && !recent.includes(f.key));
  const varied = ok.filter((f) => !(opts.avoidAns || []).includes(f.op + " " + f.ans));
  if (varied.length) ok = varied;
  const mine = ok.filter((f) => f.op === opts.op);
  if (mine.length) ok = mine;
  return ok.length ? ok[Math.floor(rnd() * ok.length)].key : null;
}

// Monster HP (DESIGN.md §5.5): the average answer of what this player is actually being asked
// (the open levels, with the monster's operation preferred) × its hits. app.js scales it by depth.
// A few big answers (rounding to 100, 7 × 90) would make every fight long, so each answer counts
// at most 3 times the middle one.
export function monsterHP(m, bandKey, recs) {
  const L = openLevel(bandKey, recs), open = asked(bandKey, L, asksOf(m));
  const mine = open.filter((f) => f.op === m.op);
  // A monster that hides a number (m.blank, Quizard) is hit by the hidden number: on average,
  // the mean of the fact's two numbers.
  const val = (f) => { if (!m.blank || !"+-×÷".includes(f.key[0])) return f.ans; const [a, b] = f.key.slice(1).split(",").map(Number); return (a + b) / 2; };
  const avg = (fs) => { const v = fs.map(val).sort((a, b) => a - b), cap = Math.max(10, 3 * v[v.length >> 1]); return v.reduce((s, x) => s + Math.min(x, cap), 0) / v.length; };
  const mean = mine.length ? avg(mine) * 0.7 + avg(open) * 0.3 : avg(open);
  return Math.max(10, Math.round(mean * m.hits));
}
// The facts open to a monster: the open levels' facts of the kinds it asks. With none open (the
// Equal Twins before any balancing is), its kind from the lowest level that has it; with none at
// all, everything open.
function asked(bandKey, L, asks) {
  const open = pool(bandKey).filter((f) => f.level <= L);
  if (!asks) return open;
  const mine = open.filter((f) => asks(f.op));
  if (mine.length) return mine;
  const kind = pool(bandKey).filter((f) => asks(f.op));
  if (!kind.length) return open;
  const low = Math.min(...kind.map((f) => f.level));
  return kind.filter((f) => f.level === low);
}
