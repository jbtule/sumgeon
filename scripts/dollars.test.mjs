// Dollars (js/dollars.js, the prototype page): the answers, the words, and that the bills carry no
// writing but their numerals.
import assert from "node:assert/strict";
import { dollarProblem, dollarSvg, billSvg, dollarHint, spokenDollars, sayMoney, moneyText, runningTotals, BILLS, BILL } from "../js/dollars.js";
import { COINS } from "../js/coins.js";

let seed = 5; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
for (let i = 0; i < 500; i++) {
  for (const id of ["bills", "mixed"]) {
    const p = dollarProblem(id, rnd);
    const dollars = p.bills.reduce((t, b) => t + b, 0);
    assert.deepEqual(p.bills, [...p.bills].sort((a, b) => b - a), "biggest first");
    assert.ok(p.bills.every((b) => BILLS.includes(b)));
    if (id === "bills") {
      assert.equal(p.ans, dollars);
      assert.ok(p.bills.length >= 2 && p.bills.length <= 5 && p.ans <= 60);
    } else {
      const cents = COINS.reduce((t, c) => t + p.coins[c.k] * c.v, 0);
      assert.deepEqual(p.ans, [dollars, cents]);
      assert.ok(cents > 0 && cents < 100, "cents under a dollar");
    }
    // The picture: no writing but numerals (and the hint's running totals in $ and ¢); no words
    // that read like a real bill's.
    for (const opt of [{}, { hint: true }, { hint: true, worked: true }]) {
      const s = dollarSvg(p, opt);
      assert.ok(!/NaN|undefined/.test(s));
      const texts = [...s.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
      assert.ok(texts.every((t) => /^[$\d?,¢ ]+$/.test(t)), `only numerals: ${texts.join(" | ")}`);
      assert.ok(!/UNITED|STATES|AMERICA|DOLLAR|TREASURY|FEDERAL|RESERVE|WE TRUST|SERIES|LEGAL TENDER/i.test(s.replace(/aria-label="[^"]*"/g, "")), "no currency lettering");
    }
    const before = dollarHint(p, false).say, after = dollarHint(p, true).say;
    assert.ok(before.includes("? dollars") && (!p.coins || before.includes("? cents")), `the hint stops short of the answer: ${before}`);
    assert.ok(after.includes(`${[].concat(p.ans)[0]} dollars`), after);
    if (p.coins) assert.ok(after.includes(`${p.ans[1]} cents`), after);
  }
}
// Each bill: its numeral four times, and nothing else written.
for (const v of BILLS) {
  const texts = [...billSvg(v).matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
  assert.deepEqual(texts, [String(v), String(v), String(v), String(v)]);
}
// Never near real size: a real bill is 6.14 in wide (about 590 CSS px); drawn 100 wide here, and
// the page shows at most three across a phone.
assert.ok(BILL.w <= 100 && Math.abs(BILL.w / BILL.h - 2.35) < 0.01);
assert.deepEqual(runningTotals([20, 5, 1]), [20, 25, 26]);
assert.equal(dollarHint({ bills: [20, 5, 1] }, false).say, "Count on from the biggest bill: 20, 25, ? dollars.");
assert.equal(spokenDollars({ kind: "bills" }), "How many dollars?");
assert.equal(sayMoney(2, 25), "Two dollars and twenty-five cents.");
assert.equal(sayMoney(1, 1), "One dollar and one cent.");
assert.equal(sayMoney(26), "Twenty-six dollars.");
assert.equal(moneyText({ kind: "mixed", ans: [3, 25] }), "$3 and 25¢");
console.log("✓ dollars: answers, hints, words and plain bills");
