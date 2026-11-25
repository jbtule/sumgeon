// Wings: runs with a rescue floor and a boss, rescue order, and mastery opening the Tower.
import assert from "node:assert/strict";
import { WINGS, runFloors, nextRescue, openWings, learnedShare, toOpen } from "../js/wings.js";
import { pool } from "../js/learn.js";

const [cellar, hall, tower] = ["cellar", "hall", "tower"].map((id) => WINGS.find((w) => w.id === id));
const run = runFloors(cellar, { captain: 5, rescued: [] }, () => 0);
assert.equal(run.length, 6);
assert.equal(run[3].n, "Quizard", "floor 4 is Quizard");
assert.equal(run[2].cursed, 0, "floor 3 holds the lowest digit not rescued");
assert.ok(run[run.length - 1].boss, "the boss is last");
assert.ok(run.every((m) => m && m.n), "every floor has a monster");
assert.equal(runFloors(tower, { captain: 0, rescued: [] }, () => 0).length, 7);

// Rescue order skips the captain and the rescued; null once all nine are free.
assert.equal(nextRescue({ captain: 0, rescued: [] }), 1);
assert.equal(nextRescue({ captain: 1, rescued: [0, 2] }), 3);
assert.equal(nextRescue({ captain: 9, rescued: [0, 1, 2, 3, 4, 5, 6, 7, 8] }), null);
const allFree = runFloors(cellar, { captain: 9, rescued: [0, 1, 2, 3, 4, 5, 6, 7, 8] }, () => 0);
assert.equal(allFree[2].cursed, undefined, "with everyone free, the rescue floor is a regular monster");

// Every Wing's monsters exist and their art draws.
for (const w of WINGS) for (const m of runFloors(w, { captain: 0, rescued: [1, 2, 3, 4, 5, 6, 7, 8, 9] })) assert.ok(m.d, `${w.id}: ${m.n}`);

// The Tower opens for a Sprout player only after the Golem is beaten and 60% of the Cellar is learned.
assert.deepEqual(openWings({}, {}, "sprout"), ["cellar"]);
assert.deepEqual(openWings({}, {}, "apprentice"), ["cellar", "hall", "tower"], "starting in Apprentice opens the Hall and the Tower");
const recs = {};
const cellarFacts = pool("sprout");
cellarFacts.slice(0, Math.ceil(cellarFacts.length * 0.6)).forEach((f) => (recs[f.key] = { b: 3, n: 3, c: 3, ms: 2000, t: 0 }));
assert.ok(learnedShare(cellar, recs) >= 0.6);
assert.deepEqual(openWings({}, recs, "sprout"), ["cellar"], "learning alone isn't enough: beat the boss too");
assert.deepEqual(openWings({ cellar: { boss: 1 } }, {}, "sprout"), ["cellar"], "the boss alone isn't enough: learn the facts too");
assert.deepEqual(openWings({ cellar: { boss: 1 } }, recs, "sprout"), ["cellar", "hall", "tower"], "the Cellar opens both the Hall and the Tower");
assert.equal(toOpen(hall, {}, {}).prev.id, "cellar", "the Hall comes after the Cellar, and doesn't block the Tower");
// Going deep doesn't open what's below: only mastery does.
assert.deepEqual(openWings({ cellar: { boss: 9, depth: 10 } }, {}, "sprout"), ["cellar"]);
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
assert.deepEqual(runFloors(cellar, { captain: 5, rescued: [] }, () => 0, 1).map((m) => m.n).slice(0, 2), ["Plusquito", "Minustaur"], "depth 1 keeps the Wing's own order and looks");
// Below depth 1, monsters wear their looks: across depths, some floors are in a look.
const looked = [2, 3, 4, 5, 6, 7].flatMap((d) => runFloors(cellar, { captain: 5, rescued: [] }, () => 0.5, d)).filter((m) => m.base);
assert.ok(looked.length > 0 && looked.every((m) => m.look && m.n !== m.base));
assert.equal(depthHP(1), 1);
assert.ok(Math.abs(depthHP(3) - 1.3) < 1e-9);
assert.equal(deepest(cellar, {}), 1);
assert.equal(deepest(cellar, { cellar: { depth: 4 } }), 4);
console.log("✓ wings");

// Stars.
import { floorStars, wingStars } from "../js/wings.js";
assert.deepEqual(floorStars(0, true), [true, true, true]);
assert.deepEqual(floorStars(2, false), [true, false, false]);
assert.deepEqual(wingStars(WINGS[0], { cellar: { stars: [3, 1, 2] } }), { got: 6, max: 18 });
assert.deepEqual(wingStars(tower, {}), { got: 0, max: 21 });
assert.deepEqual(wingStars(hall, {}), { got: 0, max: 18 });
console.log("✓ stars");

// The descent: deeper starts fall longer, never past about 4.3 s (with time to read the title); Go deeper and reduced motion are short.
{
  const { descentPlan, DESCENT } = await import("../js/wings.js");
  const c1 = descentPlan("cellar", 1, "enter"), t1 = descentPlan("tower", 1, "enter"), t3 = descentPlan("tower", 3, "enter");
  assert.deepEqual([c1.layers, c1.surface, c1.from, c1.to], [[0], true, 0, 1]);
  assert.deepEqual(t1.layers, [0, 1, 2], "falls past every stratum above the Tower");
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
