// Two-digit + and − (Hashbrown): the fixed sample, its levels, and the hints.
import assert from "node:assert/strict";
import { twoDigitFacts, TWO_LEVELS } from "../js/twodigit.js";
import { pool, openLevel, choose, keyOf } from "../js/learn.js";
import { hintFor } from "../js/hints.js";

const fs = twoDigitFacts();
assert.equal(fs.length, 200);
assert.deepEqual(fs, twoDigitFacts(), "the sample never changes");
assert.ok(fs.every((f) => (f.op === "+" ? f.ans > 20 && f.ans <= 100 : f.x > 20 && f.ans > 0)), "past 20, within 100");
const within20 = new Set(pool("apprentice").map((f) => f.key));
assert.ok(fs.every((f) => !within20.has(keyOf(f))), "no overlap with the within-20 facts");
const lv = (i) => fs.filter((f) => f.lv === i);
assert.ok(lv(3).every((f) => (f.x % 10) + (f.y % 10) >= 10), "add and regroup carries");
assert.ok(lv(6).every((f) => f.x % 10 < f.y % 10), "subtract and regroup borrows");
assert.ok(lv(0).concat(lv(4)).every((f) => !(f.x % 10) && !(f.y % 10)), "tens only");
assert.equal(pool("place").length, 200);
assert.equal(openLevel("place", {}), 0);
assert.match(choose("place", {}, { now: 0, rnd: () => 0.5 }), /^\+\d0,\d0$/, "a new player adds tens");
assert.equal(TWO_LEVELS.length, 7);
// Hints.
assert.equal(hintFor({ op: "+", x: 38, y: 25, ans: 63 }, false).say, "Tens and ones: 30 + 20 = 50, 8 + 5 = 13. 50 + 13 = ?");
assert.equal(hintFor({ op: "+", x: 10, y: 50, ans: 60 }, false).say, "1 ten + 5 tens. 10 + 50 = ?");
assert.equal(hintFor({ op: "-", x: 52, y: 28, ans: 24 }, true).say, "Think addition: count up from 28 to 52. 2 + 20 + 2 = 24");
assert.equal(hintFor({ op: "-", x: 70, y: 30, ans: 40 }, false).say, "7 tens take away 3 tens. 70 − 30 = ?");
console.log("✓ two-digit");
