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
assert.match(h("×", 8, 7).say, /^Break apart: 7 × 5 \+ 7 × 3/);
assert.match(h("×", 9, 7).say, /minus one group/);
assert.ok(!/finger/.test(h("×", 9, 7).say), "the finger trick isn't taught");
assert.match(h("÷", 32, 8).say, /^Think multiplication: 8 × \? = 32/);

// Every fact in every band: a drawing, a grown-ups line, and no answer before answering;
// the worked example after a miss ends with the answer.
for (const band of Object.keys(BANDS)) {
  for (const p of pool(band)) {
    const f = factOf(p.key, () => 0.9), before = hintFor(f, false), after = hintFor(f, true);
    assert.ok(before.model.startsWith("<svg") && before.grownups, p.key);
    assert.ok(before.say.endsWith("= ?"), `${p.key}: ${before.say}`);
    assert.ok(after.say.endsWith("= " + f.ans), `${p.key}: ${after.say}`);
    assert.ok(!/NaN|undefined|-\d/.test(before.say.replace(/ − /g, " ")), `${p.key}: ${before.say}`);
  }
}
console.log("✓ hints");

// The help page's strategies: each sample problem gets the hint it's named for.
import { STRATEGIES } from "../js/hints.js";
const opening = { "Ten-frame": /^Put together/, "Draw and cross out": /^Take away/, "10 and some more": /^10 and some more/, "Make 10": /^Make 10/,
  "Doubles plus one": /^Doubles plus one/, "Think addition": /^Think addition/, "Arrays": /rows of/, "Break apart": /^Break apart/,
  "Nines as tens": /minus one group/, "Think multiplication": /^Think multiplication/ };
assert.equal(STRATEGIES.length, Object.keys(opening).length);
for (const s of STRATEGIES) {
  const h = hintFor(s.f, true);
  assert.match(h.say, opening[s.title], s.title);
  assert.ok(h.grownups && h.say.endsWith("= " + s.f.ans), s.title);
}
console.log("✓ hint strategies");
