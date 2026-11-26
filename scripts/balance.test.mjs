// The Balance Hall: comparing and balancing problems, their keys, words and hints.
import assert from "node:assert/strict";
import { balanceFacts, balanceFactOf, compareFact, balanceFact, BALANCE_SETS, moreFacts, moreFact } from "../js/balance.js";
import { pool, openLevel, choose, factOf } from "../js/learn.js";
import { asks } from "../js/traits.js";
import { MON } from "../js/monsters.js";
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
// The sets go in 1st grade's band (the Balance Hall), each in the level that teaches it, and
// Chompers and the Twins each have their kind from the first level.
assert.equal(BALANCE_SETS.length, 5);
const hall = pool("first").filter((f) => f.op === "○" || f.op === "=");
assert.equal(hall.length, 120, "every comparing and balancing fact is in the Hall");
for (const op of ["○", "="]) assert.ok(hall.some((f) => f.op === op && f.level === 0), op);
const mon = (n) => MON.find((m) => m.n === n);
for (let i = 0; i < 50; i++) {
  assert.equal(choose("first", {}, { now: 0, asks: asks(mon("Chompers")) })[0], "○", "Chompers only compares");
  assert.equal(choose("first", {}, { now: 0, asks: asks(mon("Equal Twins")) })[0], "=", "the Twins only balance");
  assert.ok(!"○=".includes(choose("first", {}, { now: 0, asks: asks(mon("Minustaur")) })[0]), "Minustaur never compares");
}

// Which is more (K): two different numbers to 10, the answer the bigger one.
const more = moreFacts();
assert.equal(more.length, 45);
assert.ok(more.every((f) => f.ans === Math.max(f.x, f.y) && f.x !== f.y && f.ans <= 10));
const m74 = moreFact(7, 4);
assert.deepEqual([m74.q, m74.ans, m74.key], ["7 or 4", 7, "M4,7"]);
assert.deepEqual([factOf("M4,7", () => 0.9).q, factOf("M4,7", () => 0.1).q], ["4 or 7", "7 or 4"]);
assert.equal(spokenProblem(m74), "Which is more, seven or four?");
assert.equal(spokenFact(moreFact(4, 7)), "Seven is more than four.");
assert.equal(hintFor(m74, true).say, "Line them up: the longer row is more. More = 7");
assert.equal(openLevel("more", {}), 0);
assert.ok(pool("more").filter((f) => f.level === 0).every((f) => f.ans <= 5));

const c = compareFact("3 + 4", "8"), b = balanceFact("3 + 4", "□ + 5");
assert.deepEqual([c.sym, c.ans, c.q, c.key], ["<", 8, "3 + 4 □ 8", "○3+4,8"]);
assert.deepEqual([b.ans, b.q, b.key], [2, "3 + 4 = □ + 5", "=3+4,□+5"]);
assert.equal(balanceFact("7", "□ + 2").ans, 5);
assert.equal(balanceFact("□ + 2", "7").ans, 5);
assert.equal(spokenProblem(c), "Compare three plus four and eight.");
assert.equal(spokenFact(c), "three plus four is less than eight");
assert.equal(spokenProblem(b), "three plus four equals what plus five");
assert.equal(spokenFact(b), "three plus four equals two plus five");
assert.equal(hintFor(c, true).say, "3 + 4 is 7. Line them up. The mouth opens to the bigger number. 3 + 4 < 8");
assert.equal(hintFor(b, false).say, "Both sides are the same. 3 + 4 = 7, so □ + 5 = 7. 7 − 5 = ?");
assert.match(hintFor(compareFact("43", "34"), false).say, /^Compare the tens first\. The mouth opens to the bigger number\. 43 \? 34$/);
console.log("✓ balance");
