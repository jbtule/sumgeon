// Two-digit + and − (Haberhasher, the Crystal Mines), 1st grade's tens (the Balance Hall), and
// 2nd grade's 10 and 100 more or less: the fixed samples, their levels, and the hints.
import assert from "node:assert/strict";
import { twoDigitFacts, TWO_LEVELS } from "../js/twodigit.js";
import { pool, openLevel, choose, keyOf, factOf, BANDS } from "../js/learn.js";
import { facts } from "../js/problems.js";
import { hintFor } from "../js/hints.js";

const fs = twoDigitFacts();
assert.equal(fs.length, 280);
assert.deepEqual(fs, twoDigitFacts(), "the sample never changes");
assert.equal(new Set(fs.map(keyOf)).size, fs.length, "each fact once");
const lv = (name) => fs.filter((f) => TWO_LEVELS[f.lv].name === name);
const two = fs.filter((f) => !TWO_LEVELS[f.lv].big);
assert.ok(two.every((f) => (f.op === "+" ? f.ans > 20 && f.ans <= 100 : f.x > 20 && f.ans > 0)), "past 20, within 100");
const within20 = new Set(facts().map(keyOf));
assert.ok(fs.every((f) => !within20.has(keyOf(f))), "no overlap with the within-20 facts");
assert.ok(lv("Add and regroup").every((f) => (f.x % 10) + (f.y % 10) >= 10), "add and regroup carries");
assert.ok(lv("Subtract and regroup").every((f) => f.x % 10 < f.y % 10), "subtract and regroup borrows");
assert.ok(lv("Add tens").concat(lv("Subtract tens")).every((f) => !(f.x % 10) && !(f.y % 10)), "tens only");
assert.ok(lv("10 more").every((f) => f.x === 10 && f.y % 10) && lv("10 less").every((f) => f.y === 10 && f.x % 10), "10 more and 10 less");
assert.ok(lv("Add tens to a number").every((f) => (f.x % 10 === 0) !== (f.y % 10 === 0) && f.ans < 100), "34 + 20");
const big = fs.filter((f) => TWO_LEVELS[f.lv].big);
assert.equal(big.length, 48);
assert.ok(big.every((f) => { const n = f.op === "+" ? Math.max(f.x, f.y) : f.x, s = f.op === "+" ? Math.min(f.x, f.y) : f.y; return n >= 100 && n <= 999 && [10, 100].includes(s) && f.ans >= 100 && f.ans <= 999; }), "within 1000");
// 1st grade's tens are the Hall's last level; the Mines ask the rest, adding and subtracting mixed.
const hall = pool("first").filter((f) => f.level === BANDS.first.levels.length - 1 && "+-".includes(f.op));
assert.equal(hall.length, lv("Add tens").length + lv("Subtract tens").length + lv("10 more").length + lv("10 less").length + lv("Add tens to a number").length);
assert.equal(pool("second").length, fs.length - hall.length);
assert.ok([0, 1].every((L) => ["+", "-"].every((op) => pool("second").some((f) => f.level === L && f.op === op))), "each Mines level adds and subtracts");
assert.equal(openLevel("second", {}), 0);
const first = factOf(choose("second", {}, { now: 0, rnd: () => 0.5 }));
assert.ok((first.x % 10) + (first.y % 10) < 10 || first.op === "-", "a new player starts without regrouping");
// Hints.
assert.equal(hintFor({ op: "+", x: 38, y: 25, ans: 63 }, false).say, "Tens and ones: 30 + 20 = 50, 8 + 5 = 13. 50 + 13 = ?");
assert.equal(hintFor({ op: "+", x: 10, y: 50, ans: 60 }, false).say, "1 ten + 5 tens. 10 + 50 = ?");
assert.equal(hintFor({ op: "-", x: 52, y: 28, ans: 24 }, true).say, "Think addition: count up from 28 to 52. 2 + 20 + 2 = 24");
assert.equal(hintFor({ op: "-", x: 70, y: 30, ans: 40 }, false).say, "7 tens take away 3 tens. 70 − 30 = ?");
assert.equal(hintFor({ op: "+", x: 10, y: 34, ans: 44 }, false).say, "Add the tens: 10 + 30 = 40. 40 + 4 = ?");
assert.equal(hintFor({ op: "+", x: 100, y: 345, ans: 445 }, false).say, "100 more: the hundreds go up by 1. 100 + 345 = ?");
assert.equal(hintFor({ op: "+", x: 10, y: 395, ans: 405 }, false).say, "10 more: 9 tens and 1 more ten is 10 tens, a new hundred. 10 + 395 = ?");
assert.equal(hintFor({ op: "-", x: 405, y: 10, ans: 395 }, true).say, "10 less: there are no tens, so break a hundred into 10 tens. 405 − 10 = 395");
console.log("✓ two-digit");
