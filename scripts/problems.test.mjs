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
console.log("✓ problems");
