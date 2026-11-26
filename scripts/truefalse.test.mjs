// True or false (js/truefalse.js, the prototype page): about half true, the false ones off by 1
// or 2, every form, fix it's answers, and the words.
import assert from "node:assert/strict";
import { TF_LEVELS, tfProblem, tfSvg, tiltOf, tfHint, spokenTF, spokenTFAnswer, tfWorked, tfWorkedWords, isTrue, eqText, eqValue, trueEquation, falsify, fixParts, eqWords, tfFacts, tfFactOf, TF_SIZES } from "../js/truefalse.js";

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
      assert.equal(spokenTFAnswer(p), tfWorkedWords(e));
      assert.ok(!/\d/.test(spokenTFAnswer(p)), "said in words");
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
// The scale stays level until it's answered: the hint before answering only puts the dots in the
// pans (no tip and no totals, which would give the answer away); worked, it tips toward the
// heavier side (level when true).
const f42 = { kind: "tf", eq: { l: [4, 2], lop: "+", r: [7], fix: "r" }, ans: "F" };
assert.ok(tfSvg(f42).includes("rotate(0 "));
assert.ok(tfSvg(f42, { hint: true }).includes("rotate(0 ") && tfSvg(f42, { hint: true }).includes("<circle"), "the hint: dots, still level");
assert.ok(!/>[67]<\/text>/.test(tfSvg(f42, { hint: true })), "no totals under the pans before answering");
assert.ok(tfSvg(f42, { hint: true, worked: true }).includes("rotate(8 "), "worked, it tips right, toward 7");
assert.ok(tfSvg({ kind: "tf", eq: { l: [4, 2], lop: "+", r: [6], fix: "r" }, ans: "T" }, { hint: true }).includes("rotate(0 "));
// Words.
assert.equal(spokenTF(f42), "Four plus two equals seven. True or false?");
assert.equal(tfWorked(f42.eq), "4 + 2 is 6, not 7. False.");
assert.equal(tfWorked({ l: [8], r: [5, 3], rop: "+" }), "5 + 3 is 8. True.");
assert.equal(tfWorked({ l: [5, 1], lop: "+", r: [2, 4], rop: "+" }), "5 + 1 is 6 and 2 + 4 is 6. True.");
assert.equal(tfWorked({ l: [6], r: [6] }), "6 is 6. True.");
assert.equal(tfWorkedWords(f42.eq), "Four plus two is six, not seven. False.");
assert.equal(spokenTFAnswer({ kind: "fix", eq: { l: [4, 2], lop: "+", r: [7], fix: "r" }, ans: 6 }), "Four plus two equals six.");
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
// The game's facts (the Equal Twins): fixed samples, half true, keys that read back, the fix side
// from the shape, and damage: the bigger side (a true one's total); fix it, the number.
const tf = tfFacts();
assert.deepEqual(Object.fromEntries(TF_LEVELS.map((l) => [l.id, tf.filter((f) => f.set === l.id).length])), TF_SIZES);
assert.equal(new Set(tf.map((f) => f.key)).size, tf.length);
for (const f of tf) {
  const b = tfFactOf(f.key);
  assert.deepEqual([b.key, b.set, b.ans, b.sym, b.eq.fix], [f.key, f.set, f.ans, f.sym, f.eq.fix], f.key);
  const [a, c] = eqValue(f.eq), max = f.set.endsWith("20") ? 20 : 10;
  assert.ok(f.eq.l.concat(f.eq.r).every((v) => v >= 0 && v <= max), f.key);
  if (f.op === "✓") { assert.equal(f.sym, a === c ? "T" : "F"); assert.equal(f.ans, Math.max(a, c, 1)); }
  else { assert.ok(a !== c && isTrue({ ...f.eq, [f.eq.fix]: f.eq[f.eq.fix].slice(0, -1).concat(f.ans) }), `${f.key}: ${f.ans} fixes it`); }
}
for (const set of ["tf10", "tf20"]) assert.equal(tf.filter((f) => f.set === set && f.sym === "T").length, TF_SIZES[set] / 2, `${set}: half true`);
assert.deepEqual([tfFactOf("✓4+2=7").sym, tfFactOf("✓4+2=7").ans, tfFactOf("✓7=3+4").sym, tfFactOf("✓7=3+4").ans], ["F", 7, "T", 7]);
assert.deepEqual([tfFactOf("✎4+2=7").ans, tfFactOf("✎9=3+4").ans, tfFactOf("✎9=3+4").eq.fix, tfFactOf("✎5+1=2+3").ans, tfFactOf("✎8-3=4").ans], [6, 7, "l", 4, 5]);
console.log("✓ true or false: half true, forms, off by 1 or 2, fix it, words, the scale after answering");
