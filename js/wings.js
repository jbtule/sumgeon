// The Wings of the Sumgeon (DESIGN.md §4): each Wing is a run of floors drawn from its monster
// pool, with a rescue floor and a boss, and asks one grade's band of facts (§4.1: one stratum per
// grade, K to 3rd). They make a straight chain: mastery opens only the next. No DOM: runs in Node
// for the tests.
import { MON, LOOKS, lookOf, bossForm } from "./monsters.js";
import { HEROES } from "./heroes.js";
import { BANDS, pool, learned, stepFacts, openSteps, chaptersOf, topBox } from "./learn.js";
import { isDrawKey } from "./shapes.js";

const mon = (n) => MON.find((m) => m.n === n);

// floors: a monster's name, "rescue" (a cursed digit, or a pool monster once all are free) or
// "pool" (any pool monster). The boss is always last. strands: monsters that ask a strand of their
// own here instead of the band (learn.js BANDS: Trollar's coins, Chompers' "which is more?",
// Triceraplus's three numbers (up to four two-digit ones in the Mines), Squaresquatch's arrays,
// Tick-Tockus's time and Slimelipsis's patterns, each the stratum's grade of it; Chompers compares
// three-digit numbers in the Mines, and Margot-Rythm brings 3rd grade's adding and subtracting
// within 1000 to the Tower, which is otherwise × and ÷). Chompers and Triceraplus visit the Mines,
// and Margot-Rythm the Tower, from the pool (depth 2 and deeper). Slimelipsis only visits the Cellar and the Hall
// (their pools), and Tick-Tockus and Slimelipsis take a depth-1 floor in the rest, the monster
// they replace staying in the pool. Depth 1's floors bring each monster in
// once; deeper, every floor but the rescue floor comes from the pool (runFloors).
// Polly-Gon (shapes, its strand in every stratum) follows the school's priority standards: shapes
// aren't a priority in K, 1st or 3rd grade, so it visits the Cellar, the Hall and the Tower from
// their pools; 2nd grade's equal shares are, so it has a depth-1 floor in the Mines, in
// Margot-Rythm's place (her adding and subtracting within 1000 is the Mines' own band, which
// Haberhasher and the boss ask too), and she visits from the pool.
// Pipsqueak asks the dot flash and then his dice sums in the Cellar, as a strand (flashK).
// Chompers visits the Tower's pool too, with no strand there: he asks the band's comparisons, which
// in the Tower are comparing fractions (3/8 ○ 5/8), and eats the bigger fraction.
export const WINGS = [
  { id: "cellar", name: "The Counting Cellar", band: "kinder", strands: { Trollar: "coinsK", Chompers: "more", Slimelipsis: "patK", "Polly-Gon": "shapesK", Pipsqueak: "flashK" },
    pool: ["Plusquito", "Minustaur", "Pipsqueak", "Chompers", "Trollar", "Slimelipsis", "Polly-Gon"], floors: ["Plusquito", "Pipsqueak", "rescue", "Chompers", "Trollar"], boss: "Make-Ten Golem" },
  { id: "hall", name: "The Balance Hall", band: "first", after: "cellar", strands: { Triceraplus: "three", "Tick-Tockus": "timeH", Slimelipsis: "patH", "Polly-Gon": "shapesH", Trollar: "coinsH" },
    pool: ["Plusquito", "Minustaur", "Quizard", "Chompers", "Equal Twins", "Doublet", "Triceraplus", "Haberhasher", "Tick-Tockus", "Slimelipsis", "Polly-Gon", "Trollar"], floors: ["Quizard", "Equal Twins", "rescue", "Tick-Tockus", "Triceraplus"], boss: "Judo Judy" },
  { id: "mines", name: "The Crystal Mines", band: "second", after: "hall", strands: { Trollar: "coins", Squaresquatch: "arrays", Slimelipsis: "patM", "Tick-Tockus": "timeM", Chompers: "cmpM", Triceraplus: "sumsM", "Polly-Gon": "shapesM" },
    pool: ["Haberhasher", "Margot-Rythm", "Trollar", "Squaresquatch", "Slimelipsis", "Tick-Tockus", "Chompers", "Triceraplus", "Polly-Gon"], floors: ["Haberhasher", "Squaresquatch", "rescue", "Trollar", "Polly-Gon"], boss: "The Centipede" },
  { id: "tower", name: "The Tables Tower", band: "third", after: "mines", strands: { "Tick-Tockus": "timeT", "Margot-Rythm": "addT", "Polly-Gon": "shapesT" },
    pool: ["Timesaur", "Divvy", "Starbot", "Halfling", "Tick-Tockus", "Margot-Rythm", "Polly-Gon", "Chompers"], floors: ["Timesaur", "Divvy", "rescue", "Tick-Tockus", "Halfling"], boss: "Sigma Rex" }
];
/* ---------- paths (DESIGN.md §4.3) ----------
   Each stratum's single path of steps, in its grade's teaching order (the school's i-Ready guides).
   A step is a few of today's levels (of the band or a strand), so fact keys and records don't
   change: parts [[band, level name]], the monsters that ask it, and flags:
   - priority (★, a priority standard in the school's guide): only these count toward opening the
     next stratum;
   - ongoing: open from the start and kept open (counting, comparing in K);
   - review: an earlier grade's facts, mixed in as reviews, never new (learn.js choose);
   - chapter: steps come a chapter at a time, every 5 depths (a mega boss guards each chapter).
   learn.js openSteps opens them: about three new steps at once, the next when the oldest new one
   is 40% learned. Every level of every band is in exactly one step (review steps aside, which
   repeat an earlier stratum's), and a band's levels come in its path's order (scripts/paths.test.mjs). */
const step = (name, parts, monsters, chapter, flags = {}) => Object.assign({ name, parts, monsters, chapter, priority: false, ongoing: false, review: false }, flags);
const P = { priority: true };
export const PATHS = {
  cellar: [
    step("How many, and which is more, to 5", [["flashK", "How many dots? To 3"], ["flashK", "How many dots? To 5"], ["flashK", "Dots any way"], ["more", "Which is more, to 5"]], ["Pipsqueak", "Chompers"], 1, { priority: true, ongoing: true }),
    step("Add and take away within 5", [["kinder", "Within 5, with zero"]], ["Plusquito", "Minustaur"], 1, P),
    step("Count on, count back", [["patK", "Count on by 1s"], ["patK", "Count back by 1s"]], ["Slimelipsis"], 1, { ongoing: true }),
    step("Within 10", [["kinder", "Within 10"], ["flashK", "Dice sums"], ["more", "Which is more, to 10"]], ["Plusquito", "Minustaur", "Pipsqueak", "Chompers"], 1, P),
    step("Coins", [["coinsK", "Find the coin"], ["coinsK", "Each coin"]], ["Trollar"], 1, P),
    step("Make 10", [["kinder", "Make 10 and number bonds"]], ["Plusquito"], 2, P),
    step("10 and some more", [["kinder", "10 and some more"], ["patK", "Count by 10s"]], ["Minustaur", "Slimelipsis"], 2, P),
    step("Shapes", [["shapesK", "Circles, squares, triangles, rectangles"], ["shapesK", "Hexagons, sides and corners"]], ["Polly-Gon"], 2, P)
  ],
  hall: [
    // The Cellar's facts within 10, kept up as reviews (1st grade builds on them).
    step("Review: within 10", [["kinder", "Within 5, with zero"], ["kinder", "Within 10"]], ["Plusquito", "Minustaur"], 1, { review: true }),
    step("Within 20", [["first", "Within 20, not crossing 10"]], ["Plusquito", "Minustaur"], 1, P),
    // Counting on to 120, and back from 20 (new), all year.
    step("Count to 120, and back from 20", [["patH", "Count on to 120"], ["patH", "Count back from 20"]], ["Slimelipsis"], 1, { priority: true, ongoing: true }),
    step("Three numbers", [["three", "Three numbers"]], ["Triceraplus"], 1, P),
    step("Crossing 10", [["first", "Crossing 10"]], ["Plusquito", "Minustaur"], 1, P),
    step("Doubles and near doubles", [["first", "Doubles and near doubles"]], ["Doublet"], 1, P),
    step("The equal sign", [["first", "The equal sign"]], ["Equal Twins", "Quizard"], 2, P),
    step("Compare with < = >", [["first", "Compare with < = >"]], ["Chompers"], 2, P),
    step("Add and subtract tens", [["first", "Add and subtract tens"]], ["Haberhasher"], 2, P),
    // Two-digit plus one-digit, then plus two-digit, with and without regrouping (moved from the
    // Mines' first levels; the same keys).
    step("Add two-digit numbers", [["first", "Add two-digit numbers"], ["first", "Add two-digit numbers, regrouping"]], ["Haberhasher", "Plusquito"], 2, P),
    step("Shapes", [["shapesH", "Sides and corners"], ["shapesH", "Halves and fourths"]], ["Polly-Gon"], 3, P),
    step("Time to the hour and half hour", [["timeH", "Hours"], ["timeH", "Half hours"]], ["Tick-Tockus"], 3, P),
    // Coin values (1.GM.C.9, new in the Hall): Trollar visits with the Cellar's "each coin".
    step("Coin values", [["coinsH", "Each coin"]], ["Trollar"], 3, P),
    step("Count by 5s", [["patH", "Count by 5s"]], ["Slimelipsis"], 3)
  ],
  mines: [
    // Fluency within 20 (2nd grade's priority, i-Ready lessons 1–2): the Hall's facts as reviews.
    step("Review: within 20", [["first", "Within 20, not crossing 10"], ["first", "Crossing 10"], ["first", "Doubles and near doubles"]], ["Haberhasher", "Margot-Rythm"], 1, { review: true }),
    step("Two-digit add and subtract", [["second", "Add and subtract, no regrouping"], ["second", "Add and subtract, regrouping"]], ["Haberhasher", "Margot-Rythm"], 1, P),
    step("Money", [["coins", "Pennies"], ["coins", "Nickels and pennies"], ["coins", "Dimes"], ["coins", "Quarters"], ["coins", "Dollar bills"], ["coins", "Bills and coins"]], ["Trollar"], 1, P),
    step("Time to 5 minutes", [["timeM", "5 minutes"], ["timeM", "What time is it? (5 minutes)"]], ["Tick-Tockus"], 1),
    step("Three-digit place value", [["second", "Hundreds, tens and ones"], ["second", "Tens in a number"], ["patM", "Count by 100s"], ["patM", "What's missing? By 2s, 5s, 10s, 100s"]], ["Haberhasher", "Slimelipsis"], 1, P),
    step("Compare three-digit numbers", [["cmpM", "Compare three-digit numbers"]], ["Chompers"], 2, P),
    step("10 and 100 more or less", [["second", "10 and 100 more or less"]], ["Haberhasher"], 2, P),
    step("Add and subtract within 1000", [["second", "Add within 1000"], ["second", "Add within 1000, regrouping"], ["second", "Subtract within 1000"], ["second", "Subtract within 1000, regrouping"]], ["Margot-Rythm", "Haberhasher"], 2, P),
    step("Up to four numbers", [["sumsM", "Three two-digit numbers"], ["sumsM", "Four two-digit numbers"]], ["Triceraplus"], 2),
    step("Shapes and equal shares", [["shapesM", "Sides, corners and faces"], ["shapesM", "Equal shares"], ["shapesM", "Rows and columns of squares"]], ["Polly-Gon"], 3, P),
    step("Arrays", [["arrays", "Arrays of 2 and 3 rows"], ["arrays", "Arrays of 4 and 5 rows"]], ["Squaresquatch"], 3, P),
    step("Even and odd, count by 2s", [["patM", "Count by 2s"], ["patM", "Odd and even to 20"], ["patM", "Odd and even to 100"]], ["Slimelipsis"], 3)
  ],
  tower: [
    step("Add and subtract within 1000", [["addT", "Add within 1000"], ["addT", "Subtract within 1000"]], ["Margot-Rythm"], 1, { review: true }),
    step("× 0, 1, 2, 5 and 10", [["third", "× 0, 1, 2, 5 and 10"]], ["Timesaur", "Starbot"], 1, P),
    step("× 3, 4 and 6", [["third", "× 3, 4 and 6"]], ["Timesaur"], 1, P),
    step("× 7, 8 and 9", [["third", "× 7, 8 and 9"]], ["Timesaur", "Starbot"], 1, P),
    step("Division", [["third", "÷ 1, 2, 5 and 10"], ["third", "÷ 3, 4 and 6"], ["third", "÷ 7, 8 and 9"]], ["Divvy"], 1, P),
    step("× tens and rounding", [["third", "× tens"], ["third", "Rounding"]], ["Timesaur", "Starbot"], 2, P),
    step("Fractions", [["third", "Fractions on a number line"], ["third", "Equal fractions"], ["third", "Compare fractions"]], ["Halfling", "Chompers"], 2, P),
    step("Time to the minute", [["timeT", "To the minute"], ["timeT", "How long? In the hour"], ["timeT", "Minutes later, in the hour"], ["timeT", "How long? Across the hour"], ["timeT", "Minutes later, across the hour"]], ["Tick-Tockus"], 2),
    step("Area and perimeter", [["third", "Area and perimeter"]], ["Starbot", "Divvy"], 3, P),
    step("Shapes", [["shapesT", "Quadrilaterals"], ["shapesT", "Unit fractions"]], ["Polly-Gon"], 3),
    step("× and ÷ 11 and 12", [["third", "× and ÷ 11 and 12"]], ["Timesaur", "Divvy"], 3)
  ]
};
// Level names to indexes ([band, index]), checked: a name that isn't a level is a mistake.
for (const steps of Object.values(PATHS)) for (const s of steps) s.parts = s.parts.map(([b, name]) => {
  const L = BANDS[b].levels.findIndex((l) => l.name === name);
  if (L < 0) throw new Error(`PATHS: ${b} has no level "${name}"`);
  return [b, L];
});
export const pathOf = (wing) => PATHS[wing.id];
// The chapter a player has reached in a stratum (DESIGN.md §4.3): 1 + the mega bosses beaten
// there (saved as wings[id].megas), up to the path's last chapter. Everyone starts at chapter 1
// (dungeon version 6 started runs over); what they've learned still lets skipping ahead carry them
// along the path.
export const megasOf = (p) => (p && p.megas) || 0;
export function chapterOf(wing, progress) { return Math.min(chaptersOf(PATHS[wing.id]), 1 + megasOf((progress || {})[wing.id])); }
// The steps open to a player in a stratum (learn.js openSteps), with the most that ever joined
// (saved as wings[id].steps) kept open.
export function stepsOpen(wing, progress, recs, chapter) {
  const p = (progress || {})[wing.id] || {};
  return openSteps(PATHS[wing.id], recs, chapter || chapterOf(wing, progress), p.steps || 0);
}

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

// The monsters with an open step (DESIGN.md §4.3), newest step first: a monster arrives as its
// step opens, and one with no open step doesn't appear (bosses aside). first: the player's first
// run in the stratum, which meets them in the path's order instead (the first step's monster
// first: Plusquito in the Cellar, not Trollar's coins).
export function stepMonsters(path, open, first) {
  const out = [];
  for (const i of [...open].sort((a, b) => (first ? a - b : b - a))) for (const n of path[i].monsters) if (!out.includes(n)) out.push(n);
  return out;
}

// One run's floors, as monsters. avail (the path's open steps' monsters, newest first,
// stepMonsters): at depth 1 the floors are the newest steps' monsters in that order, so a new
// monster takes a depth-1 floor from the next run; at depth 2 and deeper (DESIGN.md §6.3) every
// floor but the rescue floor and the boss is drawn from them. Without avail, the Wing's own floors
// and pool. Variety: never the same monster twice in a row, and none twice in a run while there
// are others, so each run down mixes them differently.
export function runFloors(wing, team, rnd, depth, avail, legend) {
  const r = rnd || Math.random, list = avail && avail.length ? avail : null, all = list || wing.pool, used = new Set();
  let last = null, next = 0;
  const pick = () => {
    let options = all.filter((n) => n !== last && !used.has(n));
    if (!options.length) options = all.length > 1 ? all.filter((n) => n !== last) : all;
    last = options[Math.floor(r() * options.length)];
    used.add(last);
    return mon(last);
  };
  return wing.floors.map((f, i) => {
    if (f === "rescue") { const d = nextRescue(team); last = null; return d == null ? pick() : cursedMonster(d); }
    if (list && (depth || 1) <= 1) {
      while (next < list.length && (list[next] === last || used.has(list[next]))) next++;
      if (next >= list.length) return pick();
      last = list[next++]; used.add(last);
      return mon(last);
    }
    if (f === "pool" || (depth || 1) > 1) return dressed(pick(), wing, depth, i);
    last = f;
    return mon(f);
  }).concat([bossAt(wing, depth, legend)]);
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

// The boss at each depth builds up to a mega boss every MEGA_EVERY depths (DESIGN.md §4.3, §14.2):
// the normal boss at depths 1–2 of each five, powering up at 3 and 4 (some of its mega form's
// parts, a little more HP, "I'm getting stronger!"), and the mega boss at 5, 10, 15…: crowned,
// with its second trait and a big chest. Beating a mega boss opens the next chapter.
export const MEGA_EVERY = 5;
// 0: the boss; 1 and 2: powering up; 3: the mega boss.
export function bossStage(depth) { const k = (((depth || 1) - 1) % MEGA_EVERY) + 1; return k <= 2 ? 0 : k < MEGA_EVERY ? k - 2 : 3; }
export const isMega = (depth) => bossStage(depth) === 3;
// How much more HP the boss has at each stage.
export const BOSS_HP = [1, 1.1, 1.2, 1.4];
// legend: the stratum's Legend is due (legendDue), and takes the boss's place at any depth.
export function bossAt(wing, depth, legend) {
  const b = mon(wing.boss), s = bossStage(depth);
  if (legend) return bossForm(b, "legend") || b;
  return (s === 3 ? bossForm(b, "mega") : s ? bossForm(b, "power", s) : null) || b;
}

/* ---------- the Legend boss (DESIGN.md §14.2) ----------
   Once every fact of a stratum's priority steps is mastered (box 4), the next run there, at any
   depth, ends with its boss's golden Legend form: a final exam (learn.js examKey), with the
   boss's trait and its mega trait, and the mega boss's HP. Lost, it's there again on the next run
   (saved as wings[id].legendOpen, so a miss that takes a fact out of box 4 doesn't take the Legend
   away) until it's beaten (wings[id].legend: when). The priority steps are what "the stratum's
   band" means since the paths (§4.3): the ones that open the next stratum. Drawn shapes don't
   count (a drawing needs a touch screen); review steps are an earlier grade's. */
export const LEGEND_HP = BOSS_HP[3];
export function legendFacts(wing) { return priorityFacts(wing).filter((f) => !isDrawKey(f.key)); }
// The share of them mastered (0–1).
export function legendShare(wing, recs) { const fs = legendFacts(wing); return fs.filter((f) => topBox(recs[f.key])).length / fs.length; }
export const legendReady = (wing, recs) => legendShare(wing, recs) >= 1;
// How far along the way to the Legend (0–1), for the depth map: each of its facts counts by its
// box (a learned one, box 3, half; a mastered one, box 4, whole), so it moves as facts are learned
// and reaches 1 exactly when the Legend is ready.
const LEGEND_WEIGHT = [0, 0.1, 0.25, 0.5, 1];
export function legendProgress(wing, recs) {
  const fs = legendFacts(wing);
  if (!fs.length) return 0;
  const sum = fs.reduce((t, f) => { const r = recs[f.key]; return t + (r ? LEGEND_WEIGHT[Math.min(4, Math.max(0, r.b | 0))] : 0); }, 0);
  return Math.min(1, sum / fs.length);
}
export const legendBeaten = (wing, progress) => !!((progress || {})[wing.id] || {}).legend;
// Whether the next run here ends with the Legend: ready (or opened before and not beaten yet).
// test: ?legend, treating the stratum as mastered.
export function legendDue(wing, progress, recs, test) {
  const p = (progress || {})[wing.id] || {};
  return !p.legend && (!!test || !!p.legendOpen || legendReady(wing, recs));
}
// Saved progress: the Legend opened (it stays until beaten), and beaten (when). Both return the
// stratum's progress.
export function openLegend(progress, wingId) {
  const p = progress[wingId] || (progress[wingId] = { boss: 0, best: 0 });
  if (!p.legend) p.legendOpen = true;
  return p;
}
export function beatLegend(progress, wingId, now) {
  const p = progress[wingId] || (progress[wingId] = { boss: 0, best: 0 });
  if (!p.legend) p.legend = now || Date.now();
  delete p.legendOpen;
  return p;
}
export const deepest = (wing, progress) => ((progress[wing.id] || {}).depth || 1);

// The share of a Wing's priority steps learned (box 3 or more; DESIGN.md §4.3): the school's
// priority standards. Other steps (time, patterns, shapes…) never hold up the next stratum.
const priorityCache = {};
export function priorityFacts(wing) {
  if (priorityCache[wing.id]) return priorityCache[wing.id];
  const seen = new Set(), out = [];
  for (const s of PATHS[wing.id]) if (s.priority && !s.review) for (const f of stepFacts(s)) if (!seen.has(f.key)) { seen.add(f.key); out.push(f); }
  return (priorityCache[wing.id] = out);
}
export function learnedShare(wing, recs) {
  const p = priorityFacts(wing);
  return p.filter((f) => learned(recs[f.key])).length / p.length;
}

// Which Wings are open. progress: { [wingId]: { boss: wins, best: floors } }; start: the band the
// player started in. A Wing opens when the Wing it comes after (\`after\`) has its boss beaten and
// 60% of its path's priority steps learned (DESIGN.md §4.3). Starting in a band opens every Wing
// at that grade or below: a 3rd grader starting in the Tower has all four open from the start. A
// Wing once opened stays open (unlocked, saved), even if a miss takes a fact back out of learned.
const GRADE = { kinder: 0, first: 1, second: 2, third: 3 };
// Bands saved before the grade strata (dungeon version 5), as today's.
export const OLD_BANDS = { sprout: "kinder", balance: "first", apprentice: "third" };
export function openWings(progress, recs, start) {
  const open = [];
  WINGS.forEach((w, i) => {
    const prev = w.after && wingOf(w.after);
    const earned = prev && open.includes(prev.id) && ((progress[prev.id] || {}).boss || 0) > 0 && learnedShare(prev, recs) >= OPEN_AT;
    if (i === 0 || GRADE[w.band] <= (GRADE[start] ?? 0) || earned || (progress[w.id] || {}).unlocked) open.push(w.id);
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
