// True or false (js/truefalse.js, the prototype page): about half true, the false ones off by 1
// or 2, every form, fix it's answers, and the words.
import assert from "node:assert/strict";
import { TF_LEVELS, tfProblem, tfSvg, tiltOf, tfHint, spokenTF, spokenTFAnswer, tfWorked, isTrue, eqText, eqValue, trueEquation, falsify, fixParts, eqWords } from "../js/truefalse.js";

let seed = 9; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
const allNums = (e) => e.l.concat(e.r);
const forms = new Set();
for (const lv of TF_LEVELS) {
  let trues = 0, n = 0;
  for (let i = 0; i < 600; i++) {
    const p = tfProblem(lv.id, rnd), e = p.eq;
    assert.ok(allNums(e).every((v) => Number.isInteger(v) && v >= 0 && v <= lv.max), `${eqText(e)} within ${lv.max}`);
    if (p.kind === "tf") {
      n++; forms.add(e.form);
      assert.equal(p.ans, isTrue(e) ? "T" : "F");
      if (p.ans === "T") trues++;
      else { const [a, b] = eqValue(e); assert.ok([1, 2].includes(Math.abs(a - b)), `${eqText(e)} off by 1 or 2`); }
      assert.equal(spokenTF(p), `${eqWords(e)}. True or false?`);
      assert.ok(tfHint(p, false).say.startsWith("Work out each side"));
      assert.ok(tfHint(p, true).say.endsWith(isTrue(e) ? "True." : "False."));
      assert.equal(spokenTFAnswer(p), tfWorked(e));
    } else {
      const fixed = { ...e, [e.fix]: e[e.fix].slice(0, -1).concat(p.ans) };
      assert.ok(!isTrue(e), "fix it starts false");
      assert.ok(isTrue(fixed), `${eqText(e)}: ${p.ans} makes it true`);
      assert.ok([1, 2].includes(Math.abs(e[e.fix][e[e.fix].length - 1] - p.ans)), "off by 1 or 2");
      assert.equal(fixParts(p).filter((x) => x === null).length, 1, "one □");
      assert.ok(spokenTF(p).startsWith("Fix it! ") && /what/i.test(spokenTF(p)));
      assert.ok(!new RegExp(`(is|=) ${p.ans}\\b`).test(tfHint(p, false).say.replace(/is \d+\. /, "")), `the hint before answering: ${tfHint(p, false).say}`);
    }
    for (const opt of [{}, { hint: true }, { hint: true, worked: true }]) assert.ok(!/NaN|undefined/.test(tfSvg(p, opt)));
  }
  if (n) assert.ok(trues / n > 0.4 && trues / n < 0.6, `${lv.id}: about half true (${trues} of ${n})`);
}
for (const f of ["a + b = c", "c = a + b", "c = c", "a + b = c + d", "a − b = c", "c = a − b"]) assert.ok(forms.has(f), `the form ${f} comes up`);
// The scale is level until the hint, then tips toward the heavier side (level when true).
const f42 = { kind: "tf", eq: { l: [4, 2], lop: "+", r: [7], fix: "r" }, ans: "F" };
assert.ok(tfSvg(f42).includes("rotate(0 "));
assert.ok(tfSvg(f42, { hint: true }).includes("rotate(8 "), "tips right, toward 7");
assert.ok(tfSvg({ kind: "tf", eq: { l: [4, 2], lop: "+", r: [6], fix: "r" }, ans: "T" }, { hint: true }).includes("rotate(0 "));
// Words.
assert.equal(spokenTF(f42), "Four plus two equals seven. True or false?");
assert.equal(tfWorked(f42.eq), "4 + 2 is 6, not 7. False.");
assert.equal(tfWorked({ l: [8], r: [5, 3], rop: "+" }), "5 + 3 is 8. True.");
assert.equal(tfWorked({ l: [5, 1], lop: "+", r: [2, 4], rop: "+" }), "5 + 1 is 6 and 2 + 4 is 6. True.");
assert.equal(tfWorked({ l: [6], r: [6] }), "6 is 6. True.");
assert.equal(spokenTF({ kind: "fix", eq: { l: [4, 2], lop: "+", r: [7], fix: "r" }, ans: 6 }), "Fix it! Four plus two equals what?");
assert.equal(tfHint({ kind: "fix", eq: { l: [4, 2], lop: "+", r: [7], fix: "r" }, ans: 6 }, true).say, "4 + 2 is 6.");
const t = trueEquation(10, rnd), f = falsify(t, 10, rnd);
assert.ok(isTrue(t) && (f === null || !isTrue(f)));
// After answering the scale shows what's true: true or false, level when true and tipped when
// false; fix it, level with the right number in, tipped with a wrong one. A swing animates from
// where it was to there, ending at the same tilt.
const fix = { kind: "fix", eq: { l: [4, 2], lop: "+", r: [7], fix: "r" }, ans: 6 };
assert.ok(tfSvg(f42, { done: true }).includes("rotate(8 ") && tfSvg({ kind: "tf", eq: { l: [4, 2], lop: "+", r: [6] }, ans: "T" }, { done: true }).includes("rotate(0 "));
assert.ok(tfSvg(fix).includes("rotate(8 "), "fix it starts tipped");
assert.ok(tfSvg(fix, { value: 6 }).includes("rotate(0 "), "the right number levels it");
assert.ok(tfSvg(fix, { value: 9 }).includes("rotate(12 "), "a wrong one tips it by its own imbalance");
const swing = tfSvg(fix, { value: 6, from: 8 }).match(/values="([^"]+)"/)[1].split(";");
assert.equal(swing[0], "8 150 96");
assert.equal(swing[swing.length - 1], "0 150 96");
assert.equal(tiltOf(fix.eq), 8);
console.log("✓ true or false: half true, forms, off by 1 or 2, fix it, words, the scale after answering");
