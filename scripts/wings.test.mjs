// Wings: runs with a rescue floor and a boss, rescue order, and mastery opening the next stratum.
import assert from "node:assert/strict";
import { WINGS, runFloors, nextRescue, openWings, learnedShare, toOpen, bandOf, priorityFacts } from "../js/wings.js";
import { pool, BANDS } from "../js/learn.js";

const [cellar, hall, mines, tower, forge] = ["cellar", "hall", "mines", "tower", "forge"].map((id) => WINGS.find((w) => w.id === id));
// One stratum per grade, K to 4th, in a straight chain (DESIGN.md §4.1, §4.4).
assert.deepEqual(WINGS.map((w) => w.id), ["cellar", "hall", "mines", "tower", "forge"]);
assert.deepEqual(WINGS.map((w) => BANDS[w.band].grade), [0, 1, 2, 3, 4]);
assert.deepEqual(WINGS.map((w) => w.after || null), [null, "cellar", "hall", "mines", "tower"], "each opens only the next");
assert.deepEqual(forge.pool.concat([forge.boss]), ["Timesaur", "Divvy", "Boomainder", "Quarterjack", "Dotty", "Chompers", "Haberhasher", "Margot-Rythm", "Slimelipsis", "Polly-Gon", "Squaresquatch", "Tick-Tockus", "Trollar", "Graphzilla", "The Denominator"], "the Forge's three, and returning monsters visiting");
assert.deepEqual([hall, mines, tower, forge].map((w) => bandOf(w, { n: "Graphzilla" })), ["chartsH", "chartsM", "chartsT", "chartsF"], "Graphzilla reads its grade's charts in each stratum");
assert.equal(bandOf(cellar, { n: "Graphzilla" }), "kinder", "no charts in the Cellar (K's data is sorting, left out)");
assert.equal(bandOf(forge, { n: "Slimelipsis" }), "patF", "Slimelipsis brings patterns from a rule");
assert.equal(mines.name, "The Crystal Mines");
// Each stratum's monsters, and what they ask there.
const M = (w) => w.pool.concat([w.boss]);
assert.deepEqual(M(cellar), ["Plusquito", "Minustaur", "Pipsqueak", "Chompers", "Trollar", "Slimelipsis", "Polly-Gon", "Make-Ten Golem"]);
assert.deepEqual(M(hall), ["Plusquito", "Minustaur", "Quizard", "Chompers", "Equal Twins", "Doublet", "Triceraplus", "Haberhasher", "Tick-Tockus", "Slimelipsis", "Polly-Gon", "Trollar", "Graphzilla", "Judo Judy"], "the Hall gets Plusquito and Minustaur (within 20, crossing 10), Haberhasher visiting (tens) and Trollar (coin values)");
assert.equal(bandOf(hall, { n: "Trollar" }), "coinsH", "Trollar says what each coin is worth in the Hall");
assert.deepEqual(pool("coinsH").map((f) => f.key).sort(), pool("coinsK").filter((f) => f.level === 1).map((f) => f.key).sort(), "the Cellar's each coin, the same keys");
assert.deepEqual(M(mines), ["Haberhasher", "Margot-Rythm", "Trollar", "Squaresquatch", "Slimelipsis", "Tick-Tockus", "Chompers", "Triceraplus", "Polly-Gon", "Graphzilla", "The Centipede"], "the Mines' own monsters, with Chompers and Triceraplus visiting");
assert.deepEqual(M(tower), ["Timesaur", "Divvy", "Starbot", "Halfling", "Tick-Tockus", "Margot-Rythm", "Polly-Gon", "Chompers", "Graphzilla", "Sigma Rex"], "Margot-Rythm, Chompers and Graphzilla visit the Tower");
// Three-digit numbers: Chompers compares them in the Mines and Triceraplus adds up to four
// two-digit numbers there; Margot-Rythm brings 3rd grade's adding and subtracting to the Tower.
assert.deepEqual([bandOf(mines, named0("Chompers")), bandOf(mines, named0("Triceraplus")), bandOf(tower, named0("Margot-Rythm")), bandOf(mines, named0("Margot-Rythm"))], ["cmpM", "sumsM", "addT", "second"]);
function named0(n) { return { n }; }
// Depth 1's floors: each stratum keeps its five (the rescue floor third), every named floor is in
// its pool, and no monster comes twice in a row.
assert.deepEqual(WINGS.map((w) => w.floors), [
  ["Plusquito", "Pipsqueak", "rescue", "Chompers", "Trollar"],
  ["Quizard", "Equal Twins", "rescue", "Tick-Tockus", "Triceraplus"],
  ["Haberhasher", "Squaresquatch", "rescue", "Trollar", "Polly-Gon"],
  ["Timesaur", "Divvy", "rescue", "Tick-Tockus", "Halfling"],
  ["Timesaur", "Boomainder", "rescue", "Quarterjack", "Dotty"]]);
for (const w of WINGS) {
  assert.ok(w.floors.every((f) => f === "rescue" || f === "pool" || w.pool.includes(f)), `${w.id}: every floor is in the pool`);
  for (const depth of [1, 2, 3, 5, 9]) for (let seed = 1; seed < 40; seed++) {
    let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const names = runFloors(w, { captain: 5, rescued: [] }, rnd, depth).map((m) => m.base || m.n);
    assert.ok(names.every((n, i) => !i || n !== names[i - 1]), `${w.id} depth ${depth}: ${names.join(", ")}`);
  }
}
// The new monsters' strands and bands: Squaresquatch asks arrays in the Mines and Triceraplus
// three numbers in the Hall, Pipsqueak the dot flash (and his dice sums) in the Cellar; the rest
// their stratum's band.
assert.deepEqual([bandOf(mines, { n: "Squaresquatch" }), bandOf(mines, { n: "Margot-Rythm" }), bandOf(hall, { n: "Doublet" }), bandOf(tower, { n: "Halfling" }), bandOf(cellar, { n: "Pipsqueak" }), bandOf(hall, { n: "Triceraplus" })],
  ["arrays", "second", "first", "third", "flashK", "three"]);
const named = (n) => ({ n });
assert.deepEqual([bandOf(cellar, named("Trollar")), bandOf(mines, named("Trollar")), bandOf(cellar, named("Chompers")), bandOf(hall, named("Chompers")), bandOf(mines, named("Haberhasher"))],
  ["coinsK", "coins", "more", "first", "second"], "Trollar finds coins in the Cellar and counts them in the Mines");
assert.equal(bandOf(cellar, { n: "Baby Trollar", base: "Trollar" }), "coinsK", "a look asks what its monster does");
// Batch 1 (time and patterns): Tick-Tockus tells the time of each stratum's grade (hours in the
// Hall, 5 minutes in the Mines, the minute and elapsed time in the Tower), and Slimelipsis counts
// in its patterns (on and back in the Cellar, to 120 and by 5s in the Hall, skip counting and odd
// and even in the Mines), each a strand there; Slimelipsis only visits the Cellar and the Hall.
assert.deepEqual([cellar, hall, mines].map((w) => bandOf(w, named("Slimelipsis"))), ["patK", "patH", "patM"]);
assert.deepEqual([hall, mines, tower].map((w) => bandOf(w, named("Tick-Tockus"))), ["timeH", "timeM", "timeT"]);
assert.equal(bandOf(hall, { n: "Grandfather Tockus", base: "Tick-Tockus" }), "timeH");
for (const b of ["patK", "patH", "patM", "timeH", "timeM", "timeT"]) assert.ok(BANDS[b].strand, `${b} is a strand`);
assert.ok(!cellar.floors.includes("Slimelipsis") && !hall.floors.includes("Slimelipsis"), "Slimelipsis visits the Cellar and the Hall from their pools");
for (const w of [hall, tower]) assert.ok(w.floors.includes("Tick-Tockus"), `Tick-Tockus has a depth-1 floor in ${w.id}`);
// The Mines' depth-1 floors are 2nd grade's priority standards (the school's guide): place value
// and two- and three-digit work (Haberhasher), arrays (Squaresquatch), money (Trollar) and equal
// shares (Polly-Gon). Margot-Rythm's adding and subtracting within 1000 is the Mines' own band
// (Haberhasher and the boss ask it), so she comes from the pool; so do time to 5 minutes and skip
// counting, which aren't priorities there (Tick-Tockus and Slimelipsis), from depth 2.
assert.deepEqual(mines.floors.filter((n) => n !== "rescue").sort(), ["Haberhasher", "Polly-Gon", "Squaresquatch", "Trollar"]);
assert.ok(["Tick-Tockus", "Slimelipsis", "Margot-Rythm"].every((n) => mines.pool.includes(n)));
// Shapes (Polly-Gon): a strand in each stratum, each its grade's; shapes aren't a priority in K,
// 1st or 3rd grade, so it visits the Cellar, the Hall and the Tower from their pools.
assert.deepEqual(WINGS.map((w) => bandOf(w, named("Polly-Gon"))), ["shapesK", "shapesH", "shapesM", "shapesT", "fourth"], "in the Forge, the band's angles and shapes");
assert.equal(bandOf(cellar, { n: "Baby Polly", base: "Polly-Gon" }), "shapesK");
for (const w of [cellar, hall, tower]) assert.ok(w.pool.includes("Polly-Gon") && !w.floors.includes("Polly-Gon"), `Polly-Gon visits ${w.id} from the pool`);
// Only the path's priority steps (DESIGN.md §4.3) count toward opening the next stratum: not
// counting on and back in the Cellar, or counting by 5s in the Hall.
assert.equal(learnedShare(cellar, Object.fromEntries(pool("patK").filter((f) => f.level < 2).map((f) => [f.key, { b: 4 }]))), 0, "counting on and back isn't a priority step");
assert.equal(learnedShare(hall, Object.fromEntries(pool("patH").filter((f) => f.level === 2).map((f) => [f.key, { b: 4 }]))), 0, "nor counting by 5s");
assert.ok(learnedShare(cellar, Object.fromEntries(pool("coinsK").map((f) => [f.key, { b: 4 }]))) > 0, "coins are");
const run = runFloors(cellar, { captain: 5, rescued: [] }, () => 0);
assert.equal(run.length, 6);
assert.equal(run[3].n, "Chompers", "floor 4 is Chompers");
assert.equal(run[2].cursed, 0, "floor 3 holds the lowest digit not rescued");
assert.ok(run[run.length - 1].boss, "the boss is last");
assert.ok(run.every((m) => m && m.n), "every floor has a monster");
assert.equal(runFloors(tower, { captain: 0, rescued: [] }, () => 0).length, 6);

// Rescue order skips the captain and the rescued; null once all nine are free.
assert.equal(nextRescue({ captain: 0, rescued: [] }), 1);
assert.equal(nextRescue({ captain: 1, rescued: [0, 2] }), 3);
assert.equal(nextRescue({ captain: 9, rescued: [0, 1, 2, 3, 4, 5, 6, 7, 8] }), null);
const allFree = runFloors(cellar, { captain: 9, rescued: [0, 1, 2, 3, 4, 5, 6, 7, 8] }, () => 0);
assert.equal(allFree[2].cursed, undefined, "with everyone free, the rescue floor is a regular monster");

// Every Wing's monsters exist and their art draws.
for (const w of WINGS) for (const m of runFloors(w, { captain: 0, rescued: [1, 2, 3, 4, 5, 6, 7, 8, 9] })) assert.ok(m.d, `${w.id}: ${m.n}`);

// The Hall opens for a kindergartner only after the Golem is beaten and 60% of the Cellar is learned.
assert.deepEqual(openWings({}, {}, "kinder"), ["cellar"]);
assert.deepEqual(openWings({}, {}, "third"), ["cellar", "hall", "mines", "tower"], "starting in 3rd grade opens all four");
const recs = {};
const cellarFacts = priorityFacts(cellar);
cellarFacts.slice(0, Math.ceil(cellarFacts.length * 0.6)).forEach((f) => (recs[f.key] = { b: 3, n: 3, c: 3, ms: 2000, t: 0 }));
assert.ok(learnedShare(cellar, recs) >= 0.6);
assert.deepEqual(openWings({}, recs, "kinder"), ["cellar"], "learning alone isn't enough: beat the boss too");
assert.deepEqual(openWings({ cellar: { boss: 1 } }, {}, "kinder"), ["cellar"], "the boss alone isn't enough: learn the facts too");
assert.deepEqual(openWings({ cellar: { boss: 1 } }, recs, "kinder"), ["cellar", "hall"], "the Cellar opens only the Hall");
assert.equal(toOpen(tower, {}, {}).prev.id, "mines", "the Tower comes after the Mines");
// The chain, one at a time: the Hall opens the Mines, the Mines the Tower.
{
  const r = {}, learn = (w) => { const p = priorityFacts(w); p.slice(0, Math.ceil(p.length * 0.6)).forEach((f) => (r[f.key] = { b: 3, n: 3, c: 3, ms: 2000, t: 0 })); };
  learn(cellar); learn(hall);
  assert.deepEqual(openWings({ cellar: { boss: 1 }, hall: { boss: 1 } }, r, "kinder"), ["cellar", "hall", "mines"]);
  learn(mines);
  assert.deepEqual(openWings({ cellar: { boss: 1 }, hall: { boss: 1 }, mines: { boss: 1 } }, r, "kinder"), ["cellar", "hall", "mines", "tower"]);
  assert.deepEqual(openWings({ cellar: { boss: 1 }, mines: { boss: 1 } }, r, "kinder"), ["cellar", "hall"], "no skipping the Hall's boss");
}
// Going deep doesn't open what's below: only mastery does.
assert.deepEqual(openWings({ cellar: { boss: 9, depth: 10 } }, {}, "kinder"), ["cellar"]);
assert.equal(toOpen(tower, {}, {}).boss, false);
// Depth: floor 1 is easier, the boss tougher, rising evenly.
import { depthScale } from "../js/wings.js";
assert.equal(depthScale(0, 6), 0.8);
assert.equal(depthScale(5, 6), 1.3);
assert.ok(depthScale(2, 6) > depthScale(1, 6) && depthScale(1, 6) > depthScale(0, 6));
// Depth: deeper runs keep the rescue floor and the boss, and mix the rest from the pool, never
// the same monster twice in a row.
import { depthHP, deepest } from "../js/wings.js";
let seq = 0; const rnd = () => ((seq = (seq * 9301 + 49297) % 233280) / 233280);
for (let k = 0; k < 50; k++) {
  const deep = runFloors(cellar, { captain: 5, rescued: [] }, rnd, 3);
  assert.equal(deep.length, 6);
  assert.equal(deep[2].cursed, 0, "the rescue floor stays");
  assert.ok(deep[5].boss, "the boss stays last");
  for (let i = 1; i < 5; i++) if (i !== 2 && i !== 3) assert.notEqual(deep[i].base || deep[i].n, deep[i - 1].base || deep[i - 1].n, "no monster twice in a row");
  assert.ok(deep.slice(0, 5).every((m) => m.cursed != null || cellar.pool.includes(m.base || m.n)));
  assert.deepEqual(runFloors(cellar, { captain: 5, rescued: [] }, () => 0.3, 3).map((m) => m.n), runFloors(cellar, { captain: 5, rescued: [] }, () => 0.3, 3).map((m) => m.n), "a depth's looks are the same each time");
}
assert.deepEqual(runFloors(cellar, { captain: 5, rescued: [] }, () => 0, 1).map((m) => m.n).slice(0, 2), ["Plusquito", "Pipsqueak"], "depth 1 keeps the Wing's own order and looks");
// Below depth 1, monsters wear their looks: across depths, some floors are in a look.
const looked = [2, 3, 4, 5, 6, 7].flatMap((d) => runFloors(cellar, { captain: 5, rescued: [] }, () => 0.5, d)).filter((m) => m.base && !m.boss);
assert.ok(looked.length > 0 && looked.every((m) => m.look && m.n !== m.base));
assert.equal(depthHP(1), 1);
assert.ok(Math.abs(depthHP(3) - 1.3) < 1e-9);
assert.equal(deepest(cellar, {}), 1);
assert.equal(deepest(cellar, { cellar: { depth: 4 } }), 4);
// Batch 2's monsters at depth 1: the Equal Twins (true or false) in the Hall, Haberhasher (place
// value) and Margot-Rythm (always stacked) in the Mines, Halfling (the number line) in the Tower;
// Trollar's dollars in the Mines' coin strand (its pool), and true or false, place value and the
// number line count toward their stratum's 60% (they're band facts), dollars don't (a strand).
{
  assert.ok(hall.floors.includes("Equal Twins") && mines.floors.includes("Haberhasher") && mines.pool.includes("Margot-Rythm") && tower.floors.includes("Halfling"));
  assert.ok(mines.pool.includes("Trollar") && bandOf(mines, { n: "Trollar" }) === "coins");
  assert.ok(pool("first").some((f) => f.op === "✓") && pool("second").some((f) => f.op === "#") && pool("third").some((f) => f.op === "↔"));
  assert.ok(!pool("second").some((f) => f.op === "$") && pool("coins").some((f) => f.op === "$"));
}
console.log("✓ wings");

// Stars.
import { floorStars, wingStars } from "../js/wings.js";
assert.deepEqual(floorStars(0, true), [true, true, true]);
assert.deepEqual(floorStars(2, false), [true, false, false]);
assert.deepEqual(wingStars(WINGS[0], { cellar: { stars: [3, 1, 2] } }), { got: 6, max: 18 });
assert.deepEqual(wingStars(tower, {}), { got: 0, max: 18 });
assert.deepEqual(wingStars(mines, {}), { got: 0, max: 18 });
assert.deepEqual(wingStars(hall, {}), { got: 0, max: 18 });
console.log("✓ stars");

// The descent: deeper starts fall longer, never past about 4.3 s (with time to read the title); Go deeper and reduced motion are short.
{
  const { descentPlan, DESCENT } = await import("../js/wings.js");
  const c1 = descentPlan("cellar", 1, "enter"), t1 = descentPlan("tower", 1, "enter"), t3 = descentPlan("tower", 3, "enter");
  assert.deepEqual([c1.layers, c1.surface, c1.from, c1.to], [[0], true, 0, 1]);
  assert.deepEqual(t1.layers, [0, 1, 2, 3], "falls past every stratum above the Tower");
  assert.ok(c1.fall < descentPlan("hall", 1, "enter").fall && descentPlan("hall", 1, "enter").fall < t1.fall, "a later stratum falls longer");
  assert.ok(t1.fall < t3.fall, "a deeper start falls longer");
  assert.equal(c1.total, 3750);
  for (const w of WINGS) for (let d = 1; d <= 30; d++) {
    const p = descentPlan(w.id, d, "enter");
    assert.ok(p.total <= 4300, `${w.id} depth ${d}: ${p.total} ms`);
    assert.ok(p.lead < p.titleAt && p.titleAt < p.land && p.land < p.ready && p.ready < p.total);
  }
  const deeper = descentPlan("hall", 4, "deeper");
  assert.deepEqual([deeper.layers, deeper.surface, deeper.from, deeper.to], [[1], false, 3, 4]);
  assert.ok(deeper.total < c1.total);
  assert.equal(descentPlan("tower", 7, "reduced").total, 600, "reduced motion: a quick fade");
  assert.equal(descentPlan("tower", 7, "reduced").fall, 0);
  assert.ok(DESCENT.maxFall + DESCENT.lead + DESCENT.hold + DESCENT.fade <= 4300);
  assert.ok(DESCENT.hold >= 2000, "long enough to read the title");
}

// The grade (DESIGN.md §2, §4.1): K starts in the Cellar, 1st in the Hall, 2nd in the Mines, 3rd in
// the Tower, and 4th and 5th in the Forge, each with every stratum above it open.
{
  const { GRADES, gradeBand, withGrade, OLD_BANDS } = await import("../js/wings.js");
  assert.deepEqual(GRADES.map(gradeBand), ["kinder", "first", "second", "third", "fourth", "fourth"]);
  assert.deepEqual(openWings({}, {}, gradeBand(0)), ["cellar"]);
  assert.deepEqual(openWings({}, {}, gradeBand(1)), ["cellar", "hall"]);
  assert.deepEqual(openWings({}, {}, gradeBand(2)), ["cellar", "hall", "mines"]);
  assert.deepEqual(openWings({}, {}, gradeBand(3)), ["cellar", "hall", "mines", "tower"]);
  assert.deepEqual(openWings({}, {}, gradeBand(5)), ["cellar", "hall", "mines", "tower", "forge"], "4th and 5th start in the Forge");
  assert.equal(withGrade({ band: "kinder", start: "kinder" }, 4, { first: true, fresh: true }).band, "fourth");
  // A grade 4 or 5 player who started in the Tower before the Forge (start "third"): app.js raises
  // their start to "fourth" on load, so the Forge opens, and their band (where they play) stays.
  assert.deepEqual(openWings({}, {}, "fourth"), ["cellar", "hall", "mines", "tower", "forge"]);
  assert.deepEqual(OLD_BANDS, { sprout: "kinder", balance: "first", apprentice: "third" });
  const base = { band: "kinder", start: "kinder", sfx: true };
  // A new player starts in their grade's stratum.
  assert.deepEqual(withGrade(base, 3, { first: true, fresh: true }), { ...base, grade: 3, start: "third", band: "third" });
  assert.equal(withGrade(base, 1, { first: true, fresh: true }).band, "first");
  assert.equal(withGrade(base, 2, { first: true, fresh: true }).band, "second");
  assert.equal(withGrade(base, 0, { first: true, fresh: true }).band, "kinder");
  // A player with progress keeps the stratum they're in.
  assert.equal(withGrade(base, 4, { first: true }).band, "kinder");
  // Picking an older grade opens more; the first pick never lowers what a player already had open.
  const had = { band: "third", start: "third" };
  assert.equal(withGrade(had, 0, { first: true }).start, "third");
  assert.equal(withGrade(had, 0, { first: true }).band, "third");
  // Changing it later (a grade picked by mistake) can lower it: a stratum no longer open falls
  // back to the Cellar...
  const lowered = withGrade({ ...had, grade: 3 }, 1);
  assert.deepEqual([lowered.grade, lowered.start, lowered.band], [1, "first", "kinder"]);
  // ...and it only changes settings: progress and facts stay as they were, and strata opened by
  // mastery or played stay open.
  const progress = { cellar: { boss: 2, best: 6, depth: 3, depthStars: { 1: 12 }, stars: [3, 3, 2] }, hall: { boss: 1 }, mines: { boss: 1, depth: 2 } };
  const r = {};
  for (const w of [cellar, hall, mines]) { const p = priorityFacts(w); p.slice(0, Math.ceil(p.length * 0.6)).forEach((f) => (r[f.key] = { b: 3, n: 3, c: 3, ms: 2000, t: 0 })); }
  const keep = JSON.stringify([progress, r]);
  const mastered = withGrade({ band: "third", start: "third", grade: 3 }, 0, { progress, recs: r });
  assert.equal(JSON.stringify([progress, r]), keep, "lowering the grade never touches progress");
  assert.equal(mastered.start, "kinder");
  assert.equal(mastered.band, "third", "the Tower stays open: it was opened by mastery");
  assert.deepEqual(openWings(progress, r, mastered.start), ["cellar", "hall", "mines", "tower"]);
  console.log("✓ grades");
}
