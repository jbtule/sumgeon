// Problems and spoken text: answers are right, numbers stay in range, words match.
import assert from "node:assert/strict";
import { DIFF, gen, pickOp, monsterHP, spoken, spokenProblem, spokenFact } from "../js/problems.js";
import { MON } from "../js/monsters.js";

for (const diff of Object.keys(DIFF)) {
  const d = DIFF[diff];
  for (let i = 0; i < 2000; i++) {
    const a = gen("+", diff); assert.equal(a.ans, a.x + a.y); assert.ok(a.x >= 1 && a.x <= d.add && a.y >= 1 && a.y <= d.add);
    const s = gen("-", diff); assert.equal(s.ans, s.x - s.y); assert.ok(s.ans >= 1, "no zero or negative differences");
    const m = gen("×", diff); assert.equal(m.ans, m.x * m.y); assert.ok(m.x >= 2 && m.x <= d.mul && m.y >= 2 && m.y <= d.mul);
    const q = gen("÷", diff); assert.equal(q.x / q.y, q.ans); assert.ok(Number.isInteger(q.ans) && q.ans >= 1, "division comes out even");
  }
}
assert.equal(gen("-", "easy", () => 0).q, "2 − 1", "the shown minus is a real minus sign");

// A monster's own operation comes up about 70% of the time, plus its share of the rest.
let own = 0;
for (let i = 0; i < 10000; i++) if (pickOp(MON[0], ["+", "-", "×", "÷"]) === "+") own++;
assert.ok(own > 7300 && own < 8300, `Plusquito picked + ${own} times in 10000`);
assert.equal(pickOp(MON[3], ["+"]), "+", "a disabled operation is never used");
for (const m of MON) assert.ok(monsterHP(m, ["+", "-"], "easy") >= 10);

assert.equal(spoken(0), "zero");
assert.equal(spoken(15), "fifteen");
assert.equal(spoken(56), "fifty-six");
assert.equal(spoken(40), "forty");
assert.equal(spoken(100), "one hundred");
assert.equal(spoken(312), "three hundred twelve");
assert.equal(spoken(2500), "two thousand five hundred");
assert.equal(spoken(-3), "negative three");
const p = { op: "+", x: 7, y: 8, ans: 15 };
assert.equal(spokenProblem(p), "seven plus eight");
assert.equal(spokenFact(p), "seven plus eight is fifteen");
assert.equal(spokenProblem({ op: "÷", x: 56, y: 7, ans: 8 }), "fifty-six divided by seven");
// The zero facts and × 0, × 1 (K and 3rd grade), spoken.
import { facts } from "../js/problems.js";
assert.equal(spokenFact({ op: "-", x: 4, y: 4, ans: 0 }), "four minus four is zero");
assert.ok(facts().some((f) => f.op === "÷" && f.x === 0) && !facts().some((f) => f.op === "÷" && f.y === 0), "0 ÷ 7, never ÷ 0");
// 3rd grade past the tables (third.js): every answer a whole number, and its words.
import { timesTens, fractionFacts, fractionFact, roundFacts, roundFact, rectFacts, rectFact } from "../js/third.js";
for (const f of [].concat(timesTens(), fractionFacts(), roundFacts(), rectFacts())) assert.ok(Number.isInteger(f.ans) && f.ans > 0, f.key || f.q);
assert.ok(timesTens().every((f) => f.x >= 2 && f.x <= 9 && f.y % 10 === 0 && f.y >= 20 && f.y <= 90 && f.ans === f.x * f.y));
assert.equal(new Set(fractionFacts().map((f) => f.key)).size, fractionFacts().length);
assert.ok(fractionFacts().every((f) => f.a * f.d === f.ans * f.b && [1, 2, 3, 4, 6, 8].includes(f.b) && [2, 3, 4, 6, 8].includes(f.d)), "equal fractions");
assert.deepEqual([fractionFact(1, 2, 4).q, fractionFact(1, 2, 4).ans], ["1/2 = □/4", 2]);
assert.equal(spokenProblem(fractionFact(1, 2, 4)), "one half equals what fourths");
assert.equal(spokenFact(fractionFact(2, 4, 2)), "two fourths equals one half");
assert.equal(spokenProblem(fractionFact(1, 1, 3)), "one equals what thirds");
assert.deepEqual([roundFact(45, 10).ans, roundFact(44, 10).ans, roundFact(250, 100).ans, roundFact(951, 100).ans], [50, 40, 300, 1000], "halfway rounds up");
assert.equal(spokenProblem(roundFact(347, 100)), "Round three hundred forty-seven to the nearest hundred.");
assert.equal(spokenFact(roundFact(47, 10)), "Forty-seven rounds to fifty.");
assert.deepEqual([rectFact("a", 4, 3).ans, rectFact("p", 4, 3).ans], [12, 14]);
assert.equal(spokenProblem(rectFact("p", 4, 3)), "What is the perimeter of a four by three rectangle?");
assert.equal(spokenFact(rectFact("a", 4, 3)), "A four by three rectangle has an area of twelve.");
console.log("✓ problems");
