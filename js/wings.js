// The Wings of the Sumgeon (DESIGN.md §4): each Wing is a run of floors drawn from its monster
// pool, with a rescue floor and a boss, and asks one band's facts. Mastery opens the next Wing.
// No DOM: runs in Node for the tests.
import { MON } from "./monsters.js";
import { HEROES } from "./heroes.js";
import { pool, learned } from "./learn.js";

const mon = (n) => MON.find((m) => m.n === n);

// floors: a monster's name, "rescue" (a cursed digit, or a pool monster once all are free) or
// "pool" (any pool monster). The boss is always last.
export const WINGS = [
  { id: "cellar", name: "The Counting Cellar", band: "sprout",
    pool: ["Plusquito", "Minustaur", "Quizard", "Trollar"], floors: ["Plusquito", "Minustaur", "rescue", "Quizard", "Trollar"], boss: "Make-Ten Golem" },
  { id: "hall", name: "The Balance Hall", band: "balance", after: "cellar",
    pool: ["Chompers", "Equal Twins"], floors: ["Chompers", "Equal Twins", "rescue", "Chompers", "pool"], boss: "The Unknown" },
  { id: "tower", name: "The Tables Tower", band: "apprentice", after: "cellar",
    pool: ["Timesaur", "Divvy", "Starbot", "Haberhasher"], floors: ["Timesaur", "Divvy", "rescue", "Starbot", "Haberhasher", "pool"], boss: "Sigma Rex" }
];
// A Wing opens the next when its boss has been beaten and this share of its facts is learned.
export const OPEN_AT = 0.6;

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

// One run's floors, as monsters.
export function runFloors(wing, team, rnd) {
  const r = rnd || Math.random, pick = () => mon(wing.pool[Math.floor(r() * wing.pool.length)]);
  return wing.floors.map((f) => {
    if (f === "rescue") { const d = nextRescue(team); return d == null ? pick() : cursedMonster(d); }
    if (f === "pool") return pick();
    return mon(f);
  }).concat([mon(wing.boss)]);
}

// The share of a Wing's facts learned (box 3 or more).
export function learnedShare(wing, recs) {
  const p = pool(wing.band);
  return p.filter((f) => learned(recs[f.key])).length / p.length;
}

// Which Wings are open. progress: { [wingId]: { boss: wins, best: floors } }; start: the band the
// player started in. A Wing opens when the Wing it comes after (\`after\`) has its boss beaten and
// 60% of its facts learned. Starting in a band opens every Wing at that grade or below: a 3rd
// grader starting in Apprentice has the Hall and the Tower open from the start.
const GRADE = { sprout: 0, balance: 1, apprentice: 2 };
export function openWings(progress, recs, start) {
  const open = [];
  WINGS.forEach((w, i) => {
    const prev = w.after && wingOf(w.after);
    const earned = prev && ((progress[prev.id] || {}).boss || 0) > 0 && learnedShare(prev, recs) >= OPEN_AT;
    if (i === 0 || GRADE[w.band] <= (GRADE[start] ?? 0) || earned) open.push(w.id);
  });
  return open;
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

// A floor's stars (DESIGN.md §6.1): ★ cleared, ★ no hearts lost on it, ★ a streak of 5 on it.
// Returns [cleared, noHeartsLost, streakOf5].
export const STREAK_STAR = 5;
export function floorStars(lost, bestStreak) { return [true, lost === 0, bestStreak >= STREAK_STAR]; }
// A Wing's stars so far, and the most it can have: { got, max }.
export function wingStars(wing, progress) {
  const p = (progress[wing.id] || {}).stars || [];
  return { got: p.reduce((a, b) => a + (b || 0), 0), max: (wing.floors.length + 1) * 3 };
}
