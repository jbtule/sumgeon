// Place value (js/placevalue.js, the prototype page): every answer, the blocks drawn match the
// numbers, hints stop at "?", and the words.
import assert from "node:assert/strict";
import { PV_LEVELS, pvProblem, pvSvg, pvLine, pvHint, spokenPV, spokenPVAnswer, blockCounts } from "../js/placevalue.js";

let seed = 4; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
let zeros = 0;
for (const lv of PV_LEVELS) {
  for (let i = 0; i < 400; i++) {
    const p = pvProblem(lv.id, rnd);
    if (p.kind === "tens") assert.equal(p.ans, p.h * 10 + p.t, "tens in the number");
    else assert.equal(p.ans, p.h * 100 + p.t * 10 + p.o);
    if (p.kind === "odd") assert.ok(p.t >= 10, "an odd split has 10 or more tens");
    if (p.kind === "odd" && p.form === "tens") assert.ok(p.h === 0 && p.t <= 39);
    if (p.kind === "blocks" && (p.t === 0 || p.o === 0)) zeros++;
    // The picture draws exactly the blocks of the numbers.
    assert.deepEqual(blockCounts(pvSvg(p)), { flats: p.h, rods: p.t, cubes: p.o }, `${lv.id} ${p.h} ${p.t} ${p.o}`);
    // The tens hint breaks the flats into rods: all the tens drawn as rods.
    if (p.kind === "tens") assert.deepEqual(blockCounts(pvSvg(p, { hint: true })), { flats: 0, rods: p.ans, cubes: 0 });
    // Before answering, no hint (words or drawing labels) gives the answer.
    const before = pvHint(p, false).say, after = pvHint(p, true).say;
    assert.ok(before.endsWith("?") && !new RegExp(`= ${p.ans}\\b`).test(before), before);
    assert.ok(after.includes(String(p.ans)), after);
    const labels = [...pvSvg(p, { hint: true }).matchAll(/>([^<]+)<\/text>/g)].map((m) => m[1]);
    assert.ok(!labels.some((t) => t === String(p.ans) || t === `${p.ans} tens`), `labels ${labels}`);
    assert.equal(pvLine(p).filter((x) => x === null).length, 1);
    for (const opt of [{}, { hint: true }, { hint: true, worked: true }]) assert.ok(!/NaN|undefined/.test(pvSvg(p, opt)));
  }
}
assert.ok(zeros > 20, "zeros come up");
// Words.
assert.equal(spokenPV({ kind: "blocks", h: 3, t: 4, o: 5 }), "Three hundreds, four tens and five ones. What number?");
assert.equal(spokenPV({ kind: "blocks", h: 3, t: 0, o: 5 }), "Three hundreds and five ones. What number?");
assert.equal(spokenPV({ kind: "tens", h: 1, t: 2 }), "How many tens in one hundred twenty?");
assert.equal(spokenPV({ kind: "odd", form: "tens", h: 0, t: 34, o: 3 }), "Thirty-four tens and three ones is what number?");
assert.equal(spokenPV({ kind: "odd", form: "hundred", h: 1, t: 14, o: 5 }), "One hundred, fourteen tens and five ones is what number?");
assert.equal(spokenPV({ kind: "expanded", h: 2, t: 4, o: 5 }), "Two hundred plus forty plus five equals what?");
assert.equal(spokenPVAnswer({ kind: "tens", ans: 12 }), "Twelve tens.");
assert.deepEqual(pvLine({ kind: "odd", form: "tens", t: 34, o: 3 }), ["34 tens and 3 ones = ", null]);
assert.equal(pvHint({ kind: "odd", form: "tens", h: 0, t: 34, o: 3, ans: 343 }, false).say, "Every 10 tens make a hundred. How many hundreds in 34 tens? Then the rest. 34 tens, 3 ones = ?");
assert.equal(pvHint({ kind: "tens", h: 1, t: 2, ans: 12 }, true).say, "1 hundred is 10 tens. 10 + 2 = 12 tens");
console.log("✓ place value: answers, blocks, hints, words");
