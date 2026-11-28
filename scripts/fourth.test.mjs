// 4th grade (the Fraction Forge, DESIGN.md §4.4): the band's fixed samples, keys and answers.
import assert from "node:assert/strict";
import { BANDS, pool, factOf, keyOf } from "../js/learn.js";
import { commas, bigText, remFact, fourthLine } from "../js/fourth.js";
import { spokenProblem, spokenFact } from "../js/problems.js";

const band = BANDS.fourth, facts = band.facts();
// Every level has a sample worth learning, in the guide's order.
band.levels.forEach((l) => assert.ok(facts.filter(l.has).length >= 15, l.name));
assert.deepEqual(band.levels.slice(0, 3).map((l) => l.name), ["Compare to a million", "Round to any place", "Add and subtract to a million"]);
// The samples are fixed: the same keys every build.
assert.deepEqual(BANDS.fourth.facts().map(keyOf), facts.map(keyOf));
// Every key makes its fact again, with the same answer; every answer a whole number (no decimal
// key in 4th grade), never negative; seven digits at most.
for (const p of pool("fourth")) {
  const f = factOf(p.key, () => 0.3), g = factOf(p.key, () => 0.7);
  assert.equal(keyOf(f), p.key, p.key);
  assert.equal(f.ans, g.ans, p.key);
  assert.ok(Number.isInteger(f.ans) && f.ans >= 0 && String(f.ans).length <= 7, `${p.key}: ${f.ans}`);
  if (f.slots) f.slots.forEach((v) => assert.ok(Number.isInteger(v) && v >= 0, p.key));
  assert.ok(spokenProblem(f) && spokenFact(f) && !/undefined|NaN/.test(spokenProblem(f) + spokenFact(f)), p.key);
}
// Commas from 10,000, as the guide writes them; four digits stay plain.
assert.equal(commas(45312), "45,312");
assert.equal(commas(4672), "4672");
assert.equal(bigText("45312 □ 708215 and 2459"), "45,312 □ 708,215 and 2459");
// A remainder: two slots, the quotient then the remainder, less than the divisor.
const r = remFact(29, 4);
assert.deepEqual(r.slots, [7, 1]);
assert.equal(fourthLine(r, String).join(""), "29 ÷ 4 = 7 R 1");
for (const p of pool("fourth").filter((x) => x.op === "R")) { const f = factOf(p.key); assert.ok(f.rem > 0 && f.rem < f.y && f.quo * f.y + f.rem === f.x, p.key); }
// A mixed number: the whole, then the numerator, not simplified (3 1/3 + 2 2/3 = 5 3/3).
const m = factOf("ƒ3 1/3+2 2/3");
assert.deepEqual(m.slots, [5, 3]);
assert.equal(fourthLine(m, String).join(""), "3 1/3 + 2 2/3 = 5 3/3");
// Comparing big numbers and decimals keeps the < = > keys; fractions keep 3rd grade's keys.
assert.equal(factOf("○45312,45231").sym, ">");
assert.equal(factOf("○0.5,0.45").sym, ">");
assert.equal(factOf("○0.7,0.70").sym, "=");
// Prime or composite: half each, within 100, answered P or C (an A or B answer), hitting for the number.
{
  const ps = pool("fourth").filter((f) => f.op === "P").map((f) => factOf(f.key));
  assert.ok(ps.length >= 40 && ps.every((f) => f.n >= 2 && f.n <= 100 && "PC".includes(f.sym) && f.ans === f.n));
  assert.equal(ps.filter((f) => f.sym === "P").length * 2, ps.length);
  assert.equal(factOf("P91").sym, "C", "91 = 7 × 13");
  assert.equal(factOf("P97").sym, "P");
}
// Money with a decimal point: dollars then two-digit cents ($4.05), keys of their own ("D…"), so
// no Mines dollar fact ("$20,5,1") changes.
{
  const m = factOf("D3.25+1.40");
  assert.deepEqual(m.slots, [4, 65]);
  assert.equal(m.ans, 465);
  assert.equal(fourthLine(m, String).join(""), "$3.25 + $1.40 = $4.65");
  assert.equal(fourthLine(factOf("D5.00-0.95"), String).join(""), "$5.00 − $0.95 = $4.05");
  assert.deepEqual(factOf("D5.00-0.95").slotDigits, [0, 2], "cents typed as two digits");
  assert.equal(factOf("D7.09:c").ans, 709);
  assert.ok(pool("fourth").filter((f) => f.op === "D").every((f) => f.key[0] === "D"));
  const { pool: p2 } = await import("../js/learn.js");
  assert.ok(p2("coins").filter((f) => f.key[0] === "$").every((f) => !f.key.includes(".")), "the Mines' dollar keys are untouched");
}
console.log("✓ 4th grade facts");

// The standard algorithm's hint, before answering, says how to start with the ones and writes no
// digit of the answer (it's typed ones first, so even the ones digit would give it away).
{
  const { hintFor } = await import("../js/hints.js");
  for (const p of [{ op: "+", x: 32957, y: 16603, ans: 49560 }, { op: "-", x: 52031, y: 18467, ans: 33564 }, { op: "+", x: 20342, y: 23774, ans: 44116 }]) {
    const f = Object.assign({ key: `${p.op}${p.x},${p.y}`, band: "fourth" }, p), h = hintFor(f, false), w = hintFor(f, true);
    assert.ok(h && /^Start with the ones/.test(h.say || ""), `${p.x} ${p.op} ${p.y}: the hint starts with the ones`);
    const ansDigits = String(p.ans).split("").reverse();
    const row = (h.model || "").match(/y="80"[^>]*>([^<]*)</g) || [];
    assert.ok(row.every((t) => />\?</.test(t)), `${p.x} ${p.op} ${p.y}: no answer digit drawn before answering`);
    assert.ok(!(h.say || "").includes(String(p.ans)), "the answer isn't said");
    assert.ok(new RegExp(`= ${p.ans}`).test(w.say), "worked, it ends with the answer");
    assert.ok(ansDigits.length > 0);
  }
}
