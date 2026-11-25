// The Balance Hall: comparing and balancing problems, their keys, words and hints.
import assert from "node:assert/strict";
import { balanceFacts, balanceFactOf, compareFact, balanceFact, BALANCE_LEVELS } from "../js/balance.js";
import { pool, openLevel, choose } from "../js/learn.js";
import { spokenProblem, spokenFact } from "../js/problems.js";
import { hintFor } from "../js/hints.js";

const fs = balanceFacts();
assert.equal(fs.length, 120);
for (const f of fs) {
  const g = balanceFactOf(f.key);
  assert.ok(g.q === f.q && g.ans === f.ans && g.sym === f.sym, f.key);
  assert.ok(f.ans >= 1, `${f.key}: damage is at least 1`);
}
assert.ok(fs.some((f) => f.sym === "=") && fs.some((f) => f.sym === "<") && fs.some((f) => f.sym === ">"));
// Both kinds in each of the first two levels, so Chompers and the Twins both have problems.
for (const lv of [0, 1]) for (const op of ["○", "="]) assert.ok(fs.some((f) => f.lv === lv && f.op === op), `${lv} ${op}`);
assert.equal(BALANCE_LEVELS.length, 3);
assert.equal(pool("balance").length, 120);
assert.equal(openLevel("balance", {}), 0);
assert.ok(["○", "="].includes(choose("balance", {}, { now: 0, rnd: () => 0.5 })[0]));

const c = compareFact("3 + 4", "8"), b = balanceFact("3 + 4", "□ + 5");
assert.deepEqual([c.sym, c.ans, c.q, c.key], ["<", 8, "3 + 4 □ 8", "○3+4,8"]);
assert.deepEqual([b.ans, b.q, b.key], [2, "3 + 4 = □ + 5", "=3+4,□+5"]);
assert.equal(balanceFact("7", "□ + 2").ans, 5);
assert.equal(balanceFact("□ + 2", "7").ans, 5);
assert.equal(spokenProblem(c), "Compare three plus four and eight.");
assert.equal(spokenFact(c), "three plus four is less than eight");
assert.equal(spokenProblem(b), "three plus four equals what plus five");
assert.equal(spokenFact(b), "three plus four equals two plus five");
assert.equal(hintFor(c, true).say, "3 + 4 is 7. Line them up: is one row longer, or are they the same? 3 + 4 < 8");
assert.equal(hintFor(b, false).say, "Both sides are the same. 3 + 4 = 7, so □ + 5 = 7. 7 − 5 = ?");
assert.match(hintFor(compareFact("43", "34"), false).say, /^Compare the tens first, then the ones\. 43 \? 34$/);
console.log("✓ balance");
