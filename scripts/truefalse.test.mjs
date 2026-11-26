// True or false (js/truefalse.js, the prototype page): the answers, never all or none true, the
// false ones off by 1 or 2, and the words.
import assert from "node:assert/strict";
import { TF_LEVELS, tfProblem, tfSvg, tfHint, spokenTF, isTrue, eqText, eqValue, trueEquation, falsify, fixParts, eqWords } from "../js/truefalse.js";

let seed = 9; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
const allNums = (e) => e.l.concat(e.r);
const forms = new Set();
for (const lv of TF_LEVELS) {
  for (let i = 0; i < 400; i++) {
    const p = tfProblem(lv.id, rnd);
    if (p.kind === "count") {
      assert.ok(p.eqs.length === 3 || p.eqs.length === 4);
      assert.equal(p.ans, p.eqs.filter(isTrue).length);
      assert.ok(p.ans >= 1 && p.ans < p.eqs.length, `${lv.id}: never all or none true (${p.eqs.map(eqText)})`);
      assert.equal(new Set(p.eqs.map(eqText)).size, p.eqs.length, "no equation twice");
      for (const e of p.eqs) {
        forms.add(e.form);
        assert.ok(allNums(e).every((n) => Number.isInteger(n) && n >= 0 && n <= lv.max), `${eqText(e)} within ${lv.max}`);
        // A false one is off by 1 or 2.
        if (!isTrue(e)) { const [a, b] = eqValue(e); assert.ok(Math.abs(a - b) === 1 || Math.abs(a - b) === 2, `${eqText(e)} off by 1 or 2`); }
      }
      // The spoken problem reads every equation, then asks.
      const said = spokenTF(p);
      assert.ok(said.endsWith("How many are true?"));
      assert.equal(said.split(" equals ").length - 1, p.eqs.length);
      assert.ok(said.split(" ").length <= 44, `not too long to hear: ${said}`);
      assert.ok(tfHint(p, true).say.includes(`${p.ans} ${p.ans === 1 ? "is" : "are"} true`));
      assert.ok(!/\d+ (is|are) true/.test(tfHint(p, false).say));
    } else {
      const e = p.eq, fixed = { ...e, [e.fix]: e[e.fix].slice(0, -1).concat(p.ans) };
      assert.ok(!isTrue(e), "fix it starts false");
      assert.ok(isTrue(fixed), `${eqText(e)}: ${p.ans} makes it true`);
      assert.ok([1, 2].includes(Math.abs(e[e.fix][e[e.fix].length - 1] - p.ans)), "off by 1 or 2");
      assert.equal(fixParts(p).filter((x) => x === null).length, 1, "one □");
      assert.ok(spokenTF(p).startsWith("Fix it! ") && /what/i.test(spokenTF(p)));
      assert.ok(!new RegExp(`(is|=) ${p.ans}\\b`).test(tfHint(p, false).say.replace(/is \d+\. /, "")), `the hint before answering: ${tfHint(p, false).say}`);
    }
    for (const opt of [{}, { hint: true }, { hint: true, worked: true }]) assert.ok(!/NaN|undefined/.test(tfSvg(p, opt)));
  }
}
for (const f of ["a + b = c", "c = a + b", "c = c", "a + b = c + d", "a − b = c", "c = a − b"]) assert.ok(forms.has(f), `the form ${f} comes up`);
// A worked count drawing numbers exactly the true ones.
const p = tfProblem("count10", rnd);
assert.equal((tfSvg(p, { hint: true, worked: true }).match(/font-size="14" fill="#0c171c">\d</g) || []).length, p.ans);
// Words.
assert.equal(eqWords({ l: [3, 4], lop: "+", r: [7] }), "Three plus four equals seven");
assert.equal(spokenTF({ kind: "fix", eq: { l: [4, 2], lop: "+", r: [7], fix: "r" }, ans: 6 }), "Fix it! Four plus two equals what?");
assert.equal(tfHint({ kind: "fix", eq: { l: [4, 2], lop: "+", r: [7], fix: "r" }, ans: 6 }, true).say, "4 + 2 is 6.");
const t = trueEquation(10, rnd), f = falsify(t, 10, rnd);
assert.ok(isTrue(t) && (f === null || !isTrue(f)));
console.log("✓ true or false: answers, forms, off by 1 or 2, words");
