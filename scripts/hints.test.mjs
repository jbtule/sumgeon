// Hints: each kind of fact gets its classroom strategy, and a hint before answering never
// gives the answer away in words.
import assert from "node:assert/strict";
import { hintFor } from "../js/hints.js";
import { BANDS, pool, factOf } from "../js/learn.js";

const h = (op, x, y) => hintFor({ op, x, y, ans: { "+": x + y, "-": x - y, "×": x * y, "÷": x / y }[op] }, false);
assert.match(h("+", 3, 4).say, /^Put together/);
assert.match(h("+", 10, 4).say, /^10 and some more/);
assert.match(h("+", 6, 7).say, /^Doubles plus one: 6 \+ 6 \+ 1/);
assert.match(h("+", 8, 5).say, /^Make 10: 8 \+ 2 \+ 3/);
assert.match(h("-", 7, 3).say, /^Take away 3/);
assert.match(h("-", 12, 8).say, /^Think addition: 8 \+ \? = 12/);
assert.match(h("×", 3, 4).say, /^3 rows of 4/);
assert.match(h("×", 6, 7).say, /^Break apart: 6 × 5 \+ 6 × 2/);
assert.match(h("×", 4, 7).say, /^Double it: 4 × 7 is double 2 × 7\. 14 \+ 14 = \?/);
assert.match(h("×", 7, 8).say, /^Double it: 8 × 7 is double 4 × 7\. 28 \+ 28 = \?/);
assert.match(h("×", 4, 8).say, /^Double it: 8 × 4 is double 4 × 4/);
assert.match(h("×", 3, 7).say, /^3 rows of 7/, "small facts stay as arrays");
assert.match(h("×", 4, 4).say, /^4 rows of 4/);
assert.match(h("×", 9, 4).say, /minus one group/, "nines keep their own strategy");
assert.match(h("×", 8, 12).say, /^Break apart: 8 × 10 \+ 8 × 2 = 80 \+ 16 = \?$/, "past × 10, break apart at 10");
assert.match(h("×", 9, 7).say, /minus one group/);
assert.ok(!/finger/.test(h("×", 9, 7).say), "the finger trick isn't taught");
assert.match(h("÷", 32, 8).say, /^Think multiplication: 8 × \? = 32/);

// Every fact in every band: a drawing, a grown-ups line, and no answer before answering;
// the worked example after a miss ends with the answer.
for (const band of Object.keys(BANDS)) {
  for (const p of pool(band)) {
    const f = factOf(p.key, () => 0.9), before = hintFor(f, false), after = hintFor(f, true);
    assert.ok(before.model.startsWith("<svg") && before.grownups, p.key);
    // A comparison's answer is its symbol: "3 + 4 ? 8" before, "3 + 4 < 8" after.
    assert.ok(before.say.endsWith(f.sym ? f.l + " ? " + f.r : "= ?"), `${p.key}: ${before.say}`);
    assert.ok(after.say.endsWith(f.sym ? f.l + " " + f.sym + " " + f.r : "= " + f.ans), `${p.key}: ${after.say}`);
    assert.ok(!/NaN|undefined|-\d/.test(before.say.replace(/ − /g, " ")), `${p.key}: ${before.say}`);
  }
}
console.log("✓ hints");

// Each kind of fact gets the strategy classrooms use for it (the review of every hint):
assert.match(h("×", 7, 10).say, /^Count by tens: 7 tens\. 7 × 10 = \?$/, "× 10 is tens");
assert.match(hintFor({ op: "×", x: 10, y: 7, ans: 70 }, true).say, /7 tens is 70/);
assert.match(h("×", 12, 12).say, /^Break apart: 12 × 10 \+ 12 × 2 = 120 \+ 24/, "× 12 breaks apart at 10");
assert.match(h("×", 11, 6).say, /^Break apart: 6 × 10 \+ 6 × 1 = 60 \+ 6/, "× 11 breaks apart at 10");
assert.match(h("×", 8, 2).say, /^Doubles: 2 × 8 is 8 \+ 8/, "× 2 is a double");
assert.match(h("+", 8, 8).say, /^Doubles: two rows of 8/, "doubles get the doubles strategy, not make 10");
assert.match(h("-", 14, 4).say, /^14 is 10 and 4\. Take away the 4\./, "1n − n takes away the ones");
assert.match(h("-", 14, 10).say, /^14 is 10 and 4\. Take away the 10\./);
assert.match(h("-", 20, 1).say, /^20 is 10 and 10\. Take away 1 from the 10/, "20 − 1 doesn't count up");
assert.match(h("-", 13, 4).say, /^Count back to 10, then the rest: 13 − 3 = 10\. 10 − 1 = \?$/, "taking a little across 10 counts back");
assert.match(h("-", 13, 9).say, /^Think addition: 9 \+ \? = 13/, "close numbers count up");
assert.match(h("-", 69, 6).say, /^69 is 6 tens and 9 ones\. Take away 6 ones: 9 − 6 = 3\. 60 \+ 3 = \?$/, "two-digit minus one-digit takes away the ones");
assert.match(h("-", 52, 7).say, /^Back to 50, then 5 more: 52 − 2 = 50\. 50 − 5 = \?$/, "crossing a ten goes back to it");
assert.match(h("+", 5, 30).say, /^3 tens and 5 ones\. 30 \+ 5 = \?$/, "no \"5 + 0\"");
assert.match(hintFor({ op: "÷", x: 2, y: 2, ans: 1 }, false).model, /aria-label="1 row of 2"/);

// Every fact in every band, before and after answering: × 10, 11 and 12 never break apart at 5,
// doubles get the doubles strategy, nothing adds a 0, and every worked equation is true.
const sym = { "+": "+", "−": "-", "×": "*", "÷": "/" };
const value = (e) => Function(`return (${e.replace(/[+−×÷]/g, (c) => sym[c])})`)();
const chain = /[\dX]+(?: [+−×÷] [\dX]+)*(?: = [\dX]+(?: [+−×÷] [\dX]+)*)+/g;
function checkEquations(say, label) {
  for (const m of say.replace(/[?□]/g, "X").matchAll(chain)) {
    const parts = m[0].split(" = ").filter((p) => !p.includes("X")).map(value);
    assert.ok(parts.every((v) => v === parts[0]), `${label}: ${m[0]} in "${say}"`);
  }
}
let checked = 0;
for (const band of Object.keys(BANDS)) {
  for (const p of pool(band)) {
    for (const flip of [0.1, 0.9]) {
      const f = factOf(p.key, () => flip);
      for (const worked of [false, true]) {
        const say = hintFor(f, worked).say, label = `${p.key}${worked ? " worked" : ""}`;
        checkEquations(say, label);
        checked++;
        if (f.op === "×" && Math.max(f.x, f.y) >= 10) assert.ok(!/× 5 \+/.test(say), `${label}: ${say}`);
        if (f.op === "+" && f.x === f.y && f.ans > 10 && f.ans < 20) assert.match(say, /^Doubles:/, label);
        if (f.op === "×" && Math.min(f.x, f.y) === 2 && Math.max(f.x, f.y) < 10) assert.match(say, /^Doubles:/, label);
        assert.ok(!/ \+ 0\b|\b0 \+ /.test(say), `${label}: ${say}`);
      }
    }
  }
}
assert.ok(checked > 3000);
console.log("✓ hint strategies by fact");

// The help page's strategies: each sample problem gets the hint it's named for.
import { STRATEGIES } from "../js/hints.js";
const opening = { "Ten-frame": /^Put together/, "Draw and cross out": /^Take away/, "10 and some more": /^10 and some more/, "Make 10": /^Make 10/,
  "Doubles plus one": /^Doubles plus one/, "Think addition": /^Think addition/, "Arrays": /rows of/, "Compare": /^3 \+ 4 is 7\. Line them up/, "Balance": /^Both sides are the same\. 3 \+ 4 = 7, so □ \+ 5 = 7\. 7 − 5 = /, "Doubling": /^Double it/, "Break apart": /^Break apart/,
  "Nines as tens": /minus one group/, "Naming coins": /^A quarter is big and silver\. Quarters = 2$/, "What each coin is worth": /^A dime is small and silver\. It's worth 10¢\./, "Counting coins": /^Count on from the biggest coin/, "Tens and ones": /^Tens and ones: 30 \+ 20 = 50, 8 \+ 5 = 13\. 50 \+ 13 = 63$/, "Count up by tens": /^Think addition: count up from 28 to 52\. 2 \+ 20 \+ 2 = 24$/,
  "Doubles": /^Doubles: two rows of 8\. 5 \+ 5 = 10, and 3 \+ 3 = 6\. 10 \+ 6 = 16$/, "Take away from 10 and some more": /^15 is 10 and 5\. Take away 3 from the 5: 5 − 3 = 2\. 10 \+ 2 = 12$/,
  "Count back through 10": /^Count back to 10, then the rest: 13 − 3 = 10\. 10 − 1 = 9$/, "Times 2 as doubles": /^Doubles: 2 × 8 is 8 \+ 8 = 16$/,
  "Times 10 as tens": /^Count by tens: 7 tens is 70\. 7 × 10 = 70$/, "Elevens and twelves": /^Break apart: 6 × 10 \+ 6 × 2 = 60 \+ 12 = 72$/,
  "Take away tens and ones": /^Take away the tens, then the ones: 60 − 20 = 40, 9 − 6 = 3\. 40 \+ 3 = 43$/, "Back to a ten": /^Back to 50, then 5 more: 52 − 2 = 50\. 50 − 5 = 45$/, "Think multiplication": /^Think multiplication/ };
assert.equal(STRATEGIES.length, Object.keys(opening).length);
for (const s of STRATEGIES) {
  const h = hintFor(s.f, true);
  assert.match(h.say, opening[s.title], s.title);
  assert.ok(h.grownups && h.say.endsWith(s.f.sym ? s.f.l + " " + s.f.sym + " " + s.f.r : "= " + s.f.ans), s.title);
}
console.log("✓ hint strategies");
