// Three-digit numbers in the Crystal Mines (2nd grade) beyond adding and subtracting (which
// twodigit.test.mjs checks): comparing three-digit numbers (Chompers, 2.NBT.A.4) and adding up
// to four two-digit numbers (Triceraplus, 2.NBT.B.7). Their facts, keys, levels, words and hints.
import assert from "node:assert/strict";
import { compare1000Facts, decidingPlace, compareFact } from "../js/balance.js";
import { sumFacts, sumFact, threeFacts, threeFactOf, tenPairOf, SUM_LEVELS } from "../js/three.js";
import { pool, factOf, keyOf, openLevel, BANDS } from "../js/learn.js";
import { spokenProblem, spokenFact } from "../js/problems.js";
import { hintFor } from "../js/hints.js";
import { stackable } from "../js/twodigit.js";
import { asks } from "../js/traits.js";

/* ---------- comparing three-digit numbers ---------- */
const cs = compare1000Facts();
assert.equal(cs.length, 24);
assert.deepEqual(cs, compare1000Facts(), "the sample never changes");
assert.equal(new Set(cs.map((f) => f.key)).size, 24, "each once");
const v = (f) => [Number(f.l), Number(f.r)];
assert.ok(cs.every((f) => v(f).every((n) => n >= 100 && n <= 999)), "three-digit numbers");
assert.ok(cs.every((f) => f.op === "○" && f.ans === Math.max(...v(f)) && f.key === "○" + f.l + "," + f.r), "the bigger number is the damage");
const by = (p) => cs.filter((f) => decidingPlace(...v(f)) === p).length;
assert.ok(by("hundreds") >= 5 && by("tens") >= 7 && by("ones") >= 5 && by(null) === 3, "each place decides some, and a few are the same");
assert.ok(cs.filter((f) => { const [a, b] = v(f).map(String); return a !== b && a === b.split("").reverse().join(""); }).length >= 4, "the digits turned around");
assert.ok(cs.some((f) => f.sym === "<") && cs.some((f) => f.sym === ">") && cs.some((f) => f.sym === "="));
// Chompers' strand in the Mines: its own facts, the key read back the same.
assert.deepEqual(pool("cmpM").map((p) => p.key).sort(), cs.map((f) => f.key).sort());
for (const f of cs) assert.deepEqual(factOf(f.key), compareFact(f.l, f.r));
assert.ok(cs.every((f) => asks({ n: "Chompers" })(f.op, f.key)), "Chompers asks them");
// Words, and a hint that compares by place and never shows the symbol before answering.
const c = compareFact("345", "354");
assert.equal(spokenProblem(c), "Compare three hundred forty-five and three hundred fifty-four.");
assert.equal(spokenFact(c), "three hundred forty-five is less than three hundred fifty-four");
assert.equal(hintFor(c, false).say, "Same hundreds. Then the tens: 4 tens and 5 tens. 345 ? 354");
assert.equal(hintFor(compareFact("729", "927"), false).say, "Compare the hundreds first: 7 hundreds and 9 hundreds. 729 ? 927");
assert.equal(hintFor(compareFact("518", "516"), true).say, "Same hundreds and tens. Then the ones: 8 ones and 6 ones. 518 > 516");
assert.equal(hintFor(compareFact("463", "463"), true).say, "Same hundreds, tens and ones. 463 = 463");
assert.equal(hintFor(compareFact("145", "345"), false).say, "Compare the hundreds first: 1 hundred and 3 hundreds. 145 ? 345", "1 hundred");
for (const f of cs) {
  const b = hintFor(f, false), w = hintFor(f, true);
  assert.ok(!/[<>]|&[lg]t;/.test(b.say + b.model.replace(/<[^>]*>/g, "")), f.q);
  assert.ok(!/stroke="var\(--gold\)" stroke-width="3"/.test(b.model), `${f.q}: nothing ringed in gold before answering`);
  assert.ok(w.say.endsWith(`${f.l} ${f.sym} ${f.r}`), w.say);
  if (f.sym !== "=") assert.match(w.model, /stroke="var\(--gold\)" stroke-width="3"/, "worked, the bigger digit is ringed");
}

/* ---------- adding up to four two-digit numbers ---------- */
const ss = sumFacts();
assert.equal(ss.length, 24);
assert.deepEqual(ss, sumFacts());
assert.deepEqual(SUM_LEVELS.map((l) => ss.filter((f) => f.nums.length === l.n).length), [12, 12], "three numbers, then four");
assert.ok(ss.every((f) => f.nums.every((n) => n > 10 && n < 100 && n % 10) && f.ans < 100 && f.ans === f.nums.reduce((t, n) => t + n, 0)), "two-digit numbers with ones, the sum within 100");
assert.ok(ss.filter((f) => tenPairOf(f.nums)).length === 12, "half have two numbers whose ones make a ten");
assert.equal(new Set(ss.map((f) => f.key)).size, 24);
assert.ok(!ss.some((f) => threeFacts().some((t) => t.key === f.key)), "none of the Hall's");
assert.deepEqual(threeFactOf("Σ23,14,31,12"), sumFact([23, 14, 31, 12]));
assert.deepEqual([sumFact([23, 14, 31, 12]).q, sumFact([23, 14, 31, 12]).key, sumFact([23, 14, 31, 12]).ans], ["23 + 14 + 31 + 12", "Σ23,14,31,12", 80]);
assert.equal(threeFactOf("Σ4,3,6").q, "4 + 3 + 6", "the Hall's three numbers read back the same");
assert.equal(keyOf(sumFact([23, 14, 31, 12])), "Σ23,14,31,12");
// Triceraplus's strand in the Mines: three numbers first, then four.
assert.deepEqual(BANDS.sumsM.levels.map((l) => l.name), ["Three two-digit numbers", "Four two-digit numbers"]);
assert.ok(pool("sumsM").every((p) => p.level === factOf(p.key).nums.length - 3));
assert.equal(openLevel("sumsM", {}), 0);
// Stacked (four rows) about half the time; the Hall's 4 + 3 + 6 never.
assert.ok(ss.every(stackable) && !threeFacts().some(stackable));
// Words and hints: find a ten when two ones make one, else the tens then the ones.
const s4 = sumFact([23, 14, 31, 12]);
assert.equal(spokenProblem(s4), "twenty-three plus fourteen plus thirty-one plus twelve");
assert.equal(spokenFact(s4), "twenty-three plus fourteen plus thirty-one plus twelve is eighty");
assert.equal(hintFor(s4, false).say, "Add the tens: 20 + 10 + 30 + 10 = 70. Add the ones: 3 + 4 + 1 + 2 = 10. 70 + 10 = ?");
assert.equal(hintFor(sumFact([23, 14, 31, 17]), false).say, "Find a ten: 23 + 17 = 40. 40 + 14 + 31 = ?");
assert.match(hintFor(sumFact([23, 14, 31, 17]), false).model, /stroke-dasharray="4 3"/, "the two that make a ten are ringed");
assert.equal(hintFor(threeFactOf("Σ4,3,6"), false).say, "Find the ten: 4 + 6 = 10. 10 + 3 = ?", "the Hall's keep their ten-frames");
for (const f of ss) {
  assert.ok(hintFor(f, false).say.endsWith("= ?") && hintFor(f, true).say.endsWith("= " + f.ans), f.q);
  assert.ok(!/ \+ 0\b/.test(hintFor(f, true).say), f.q);
}
console.log("✓ three-digit: comparing, and adding up to four numbers");
