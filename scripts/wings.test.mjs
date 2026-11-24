// Wings: runs with a rescue floor and a boss, rescue order, and mastery opening the Tower.
import assert from "node:assert/strict";
import { WINGS, runFloors, nextRescue, openWings, learnedShare, toOpen } from "../js/wings.js";
import { pool } from "../js/learn.js";

const cellar = WINGS[0], tower = WINGS[1];
const run = runFloors(cellar, { captain: 5, rescued: [] }, () => 0);
assert.equal(run.length, 5);
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
assert.deepEqual(openWings({}, {}, "apprentice"), ["cellar", "tower"], "starting in Apprentice opens the Tower");
const recs = {};
const cellarFacts = pool("sprout");
cellarFacts.slice(0, Math.ceil(cellarFacts.length * 0.6)).forEach((f) => (recs[f.key] = { b: 3, n: 3, c: 3, ms: 2000, t: 0 }));
assert.ok(learnedShare(cellar, recs) >= 0.6);
assert.deepEqual(openWings({}, recs, "sprout"), ["cellar"], "learning alone isn't enough: beat the boss too");
assert.deepEqual(openWings({ cellar: { boss: 1 } }, {}, "sprout"), ["cellar"], "the boss alone isn't enough: learn the facts too");
assert.deepEqual(openWings({ cellar: { boss: 1 } }, recs, "sprout"), ["cellar", "tower"]);
assert.equal(toOpen(tower, {}, {}).boss, false);
console.log("✓ wings");

// Stars.
import { floorStars, wingStars } from "../js/wings.js";
assert.deepEqual(floorStars(0, 5), [true, true, true]);
assert.deepEqual(floorStars(2, 4), [true, false, false]);
assert.deepEqual(wingStars(WINGS[0], { cellar: { stars: [3, 1, 2] } }), { got: 6, max: 15 });
assert.deepEqual(wingStars(WINGS[1], {}), { got: 0, max: 21 });
console.log("✓ stars");
