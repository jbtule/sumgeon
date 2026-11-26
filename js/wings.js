// The Wings of the Sumgeon (DESIGN.md §4): each Wing is a run of floors drawn from its monster
// pool, with a rescue floor and a boss, and asks one grade's band of facts (§4.1: one stratum per
// grade, K to 3rd). They make a straight chain: mastery opens only the next. No DOM: runs in Node
// for the tests.
import { MON, LOOKS, lookOf } from "./monsters.js";
import { HEROES } from "./heroes.js";
import { pool, learned } from "./learn.js";

const mon = (n) => MON.find((m) => m.n === n);

// floors: a monster's name, "rescue" (a cursed digit, or a pool monster once all are free) or
// "pool" (any pool monster). The boss is always last. strands: monsters that ask a strand of their
// own here instead of the band (learn.js BANDS: Trollar's coins, Chompers' "which is more?",
// Triceraplus's three numbers, Squaresquatch's arrays). Depth 1's floors bring each monster in
// once; deeper, every floor but the rescue floor comes from the pool (runFloors).
export const WINGS = [
  { id: "cellar", name: "The Counting Cellar", band: "kinder", strands: { Trollar: "coinsK", Chompers: "more" },
    pool: ["Plusquito", "Minustaur", "Pipsqueak", "Chompers", "Trollar"], floors: ["Plusquito", "Pipsqueak", "rescue", "Chompers", "Trollar"], boss: "Make-Ten Golem" },
  { id: "hall", name: "The Balance Hall", band: "first", after: "cellar", strands: { Triceraplus: "three" },
    pool: ["Quizard", "Chompers", "Equal Twins", "Doublet", "Triceraplus"], floors: ["Quizard", "Equal Twins", "rescue", "Doublet", "Triceraplus"], boss: "Judo Judy" },
  { id: "mines", name: "The Crystal Mines", band: "second", after: "hall", strands: { Trollar: "coins", Squaresquatch: "arrays" },
    pool: ["Haberhasher", "Margot-Rythm", "Trollar", "Squaresquatch"], floors: ["Haberhasher", "Margot-Rythm", "rescue", "Trollar", "Squaresquatch"], boss: "The Centipede" },
  { id: "tower", name: "The Tables Tower", band: "third", after: "mines",
    pool: ["Timesaur", "Divvy", "Starbot", "Halfling"], floors: ["Timesaur", "Divvy", "rescue", "Starbot", "Halfling"], boss: "Sigma Rex" }
];
// The band a monster asks in a Wing: its strand there, or the Wing's band.
export const bandOf = (wing, m) => (wing.strands || {})[m.base || m.n] || wing.band;
// A Wing opens the ones after it when its boss has been beaten and this share of its facts is
// learned. Its depths go on below it either way.
export const OPEN_AT = 0.6;
// The depth map shows at least this many depths of a Wing, then grows as you go deeper.
export const MAP_DEPTHS = 5;

export const wingOf = (id) => WINGS.find((w) => w.id === id) || WINGS[0];

// The next digit to rescue: the lowest one not yet free, skipping the captain. null when all are.
export function nextRescue(team) {
  for (let d = 0; d <= 9; d++) if (d !== team.captain && !team.rescued.includes(d)) return d;
  return null;
}

// A cursed digit as a monster: mixed problems, and its Lucky Number trait (answers with its digit
// hit double).
export function cursedMonster(d) {
  const h = HEROES[d];
  return { n: "Cursed " + h.n, op: "mix", c: h.c, hits: 4, cursed: d, quip: "is free!" };
}

// One run's floors, as monsters. At depth 2 and deeper (DESIGN.md §6.3), every floor but the
// rescue floor and the boss is drawn from the pool, never the same monster twice in a row, so
// each run down mixes them differently.
export function runFloors(wing, team, rnd, depth) {
  const r = rnd || Math.random;
  let last = null;
  const pick = () => {
    const options = wing.pool.length > 1 ? wing.pool.filter((n) => n !== last) : wing.pool;
    return mon((last = options[Math.floor(r() * options.length)]));
  };
  return wing.floors.map((f, i) => {
    if (f === "rescue") { const d = nextRescue(team); last = null; return d == null ? pick() : cursedMonster(d); }
    if (f === "pool" || (depth || 1) > 1) return dressed(pick(), wing, depth, i);
    last = f;
    return mon(f);
  }).concat([mon(wing.boss)]);
}
// Below depth 1, each floor's monster wears one of its looks (monsters.js LOOKS), the same one
// every time you come back to that floor of that depth: a hash of the Wing, depth and floor.
function dressed(m, wing, depth, floor) {
  if ((depth || 1) < 2 || !LOOKS[m.n]) return m;
  let h = 2166136261;
  for (const ch of wing.id + ":" + depth + ":" + floor) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return lookOf(m, h % (LOOKS[m.n].length + 1));
}

// Depth: beating a Wing's boss opens its next depth, and "Go deeper" goes there. Each depth is
// tougher (HP), mixes its floors, and asks more of the newest problems.
export const depthHP = (d) => 1 + 0.15 * ((d || 1) - 1);
export const deepest = (wing, progress) => ((progress[wing.id] || {}).depth || 1);

// The share of a Wing's facts learned (box 3 or more).
// (The Wing's band only: strands are asked one floor a run.)
export function learnedShare(wing, recs) {
  const p = pool(wing.band);
  return p.filter((f) => learned(recs[f.key])).length / p.length;
}

// Which Wings are open. progress: { [wingId]: { boss: wins, best: floors } }; start: the band the
// player started in. A Wing opens when the Wing it comes after (\`after\`) has its boss beaten and
// 60% of its facts learned. Starting in a band opens every Wing at that grade or below: a 3rd
// grader starting in the Tower has all four open from the start.
const GRADE = { kinder: 0, first: 1, second: 2, third: 3 };
// Bands saved before the grade strata (dungeon version 5), as today's.
export const OLD_BANDS = { sprout: "kinder", balance: "first", apprentice: "third" };
export function openWings(progress, recs, start) {
  const open = [];
  WINGS.forEach((w, i) => {
    const prev = w.after && wingOf(w.after);
    const earned = prev && open.includes(prev.id) && ((progress[prev.id] || {}).boss || 0) > 0 && learnedShare(prev, recs) >= OPEN_AT;
    if (i === 0 || GRADE[w.band] <= (GRADE[start] ?? 0) || earned) open.push(w.id);
  });
  return open;
}

// The grade a player picks (0 = K … 5), saved as settings.grade (DESIGN.md §2, §4.1): K starts in
// the Counting Cellar, 1st in the Balance Hall, 2nd in the Crystal Mines, and 3rd and up in the
// Tables Tower, each with every stratum above it open.
export const GRADES = [0, 1, 2, 3, 4, 5];
export const gradeBand = (g) => ["kinder", "first", "second"][g] || "third";
export const gradeLabel = (g) => (g === 0 ? "K" : String(g));
export const gradeName = (g) => (g === 0 ? "Kindergarten" : `Grade ${g}`);
// Settings with a grade picked: { ...st, grade, start, band }. Only settings change: what's been
// played and learned (wings, stars, depth, facts) is never touched, and strata opened by mastery
// stay open (openWings). `first`: the player had no grade yet, so their start never goes lower
// than it was. `fresh`: nothing played yet, so they start in their grade's stratum.
export function withGrade(st, grade, { first = false, fresh = false, progress = {}, recs = {} } = {}) {
  const b = gradeBand(grade);
  const start = first && (GRADE[st.start] ?? 0) > GRADE[b] ? st.start : b;
  let band = fresh ? start : st.band;
  if (!openWings(progress, recs, start).includes(WINGS.find((w) => w.band === band)?.id)) band = WINGS[0].band;
  return Object.assign({}, st, { grade, start, band });
}

// What's left to open a Wing, for the map: { prev, boss: beaten?, share, need }.
export function toOpen(wing, progress, recs) {
  const prev = wing.after && wingOf(wing.after);
  if (!prev) return null;
  return { prev, boss: ((progress[prev.id] || {}).boss || 0) > 0, share: learnedShare(prev, recs), need: OPEN_AT };
}

// How much tougher a floor's monster is by depth: 0.8 on floor 1, rising evenly to 1.3 for the
// boss (the last of n floors).
export function depthScale(i, n) { return n > 1 ? 0.8 + 0.5 * i / (n - 1) : 1; }

// A floor's stars (DESIGN.md §6.1). Returns [cleared, noHeartsLost, allFast].
// ★ cleared, ★ no hearts lost, ★ all fast: every answer on the floor right, quick (under the
// band's fluent time) and without a hint. A short floor can earn all three.
export function floorStars(lost, allFast) { return [true, lost === 0, !!allFast]; }
// A Wing's stars so far, and the most it can have: { got, max }.
export function wingStars(wing, progress) {
  const p = (progress[wing.id] || {}).stars || [];
  return { got: p.reduce((a, b) => a + (b || 0), 0), max: (wing.floors.length + 1) * 3 };
}

// The descent (js/descent.js): tapping "Enter the dungeon" drops the camera from the grass down
// through the strata to the chosen one and depth, then "Now entering the Sumgeon!" slams in.
// Times in ms. A later stratum or a deeper start falls further and takes a little longer, up to
// maxFall. After landing it holds long enough to read the title (hold); a tap goes on at once.
// The whole thing is at most about 4.3 s. "Go deeper" falls one depth inside its
// stratum; reduced motion is a quick fade with the title.
export const DESCENT = { lead: 250, fall: 950, perLayer: 150, perDepth: 100, maxFall: 1500, hold: 2200, fade: 350,
  deeperLead: 150, deeperFall: 800, deeperHold: 1500, quickIn: 150, quickHold: 300, quickFade: 150 };
// mode: "enter" (from the start screen), "deeper" (Go deeper) or "reduced". Returns which Wings'
// layers to draw (indexes into WINGS), whether the surface is on top, the depth the camera starts
// at (0: the surface), and when each part happens: the fall starts at `lead` and lands at `land`,
// the title shows at `titleAt`, the run starts at `ready`, and the overlay is gone at `total`.
export function descentPlan(wingId, depth, mode) {
  const T = DESCENT, i = Math.max(0, WINGS.findIndex((w) => w.id === wingId)), d = Math.max(1, depth || 1);
  if (mode === "reduced") {
    const ready = T.quickIn + T.quickHold;
    return { layers: [i], surface: false, from: d, to: d, lead: 0, fall: 0, titleAt: 0, land: T.quickIn, ready, total: ready + T.quickFade };
  }
  if (mode === "deeper") {
    const land = T.deeperLead + T.deeperFall, ready = land + T.deeperHold;
    return { layers: [i], surface: false, from: d - 1, to: d, lead: T.deeperLead, fall: T.deeperFall, titleAt: land, land, ready, total: ready + T.fade };
  }
  const fall = Math.min(T.maxFall, T.fall + T.perLayer * i + T.perDepth * (d - 1));
  const land = T.lead + fall, ready = land + T.hold;
  return { layers: WINGS.slice(0, i + 1).map((w, n) => n), surface: true, from: 0, to: d, lead: T.lead, fall,
    titleAt: T.lead + Math.round(fall / 2), land, ready, total: ready + T.fade };
}
