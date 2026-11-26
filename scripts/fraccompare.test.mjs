// Comparing fractions (3rd grade, 3.NF.A.3d): the facts, their keys, the comparisons right, who
// asks them, the hint (never the symbol before answering), and the voice.
import assert from "node:assert/strict";
import { fracCompareFacts, fracCompareFact } from "../js/third.js";
import { BANDS, pool, factOf } from "../js/learn.js";
import { asks } from "../js/traits.js";
import { MON } from "../js/monsters.js";
import { WINGS, bandOf } from "../js/wings.js";
import { hintFor } from "../js/hints.js";
import { spokenProblem, spokenFact } from "../js/problems.js";
import { chompPose } from "../js/chomp.js";

const fs = fracCompareFacts();
assert.equal(fs.length, 24);
assert.equal(new Set(fs.map((f) => f.key)).size, 24, "keys are unique");
// Never both orders of the same pair.
assert.ok(fs.every((f) => !fs.some((g) => g.l === f.r && g.r === f.l)));
const nd = (t) => t.split("/").map(Number);
for (const f of fs) {
  const [a, b] = nd(f.l), [c, d] = nd(f.r);
  // Denominators 2, 3, 4, 6, 8, and a proper fraction on each side.
  assert.ok([b, d].every((x) => [2, 3, 4, 6, 8].includes(x)) && a < b && c < d, f.key);
  // The same denominator, the same numerator, or equal fractions.
  assert.equal(f.frac, b === d ? "den" : a === c ? "num" : "eq", f.key);
  if (f.frac === "eq") assert.equal(a * d, c * b, f.key);
  // The symbol is right, checked by the values.
  const lv = a / b, rv = c / d;
  assert.equal(f.sym, Math.abs(lv - rv) < 1e-9 ? "=" : lv < rv ? "<" : ">", f.key);
  // It hits for the bigger fraction's numerator (its pieces).
  assert.equal(f.ans, f.sym === "<" ? c : f.sym === ">" ? a : Math.max(a, c), f.key);
  // The key round-trips through the learning engine.
  assert.deepEqual(factOf(f.key), fracCompareFact(f.l, f.r));
  assert.equal(f.key, "○" + f.l + "," + f.r);
}
const count = (k) => fs.filter((f) => f.frac === k).length;
assert.deepEqual([count("den"), count("num"), count("eq")], [10, 10, 4]);
assert.ok(fs.some((f) => f.sym === "<") && fs.some((f) => f.sym === ">") && fs.some((f) => f.sym === "="));
console.log("✓ comparing fractions: facts, keys and answers");

// In the Tower's band, its own level after Equal fractions, and the Tower's only comparisons.
const levels = BANDS.third.levels.map((l) => l.name);
assert.equal(levels.indexOf("Compare fractions"), levels.indexOf("Equal fractions") + 1);
const inBand = pool("third").filter((p) => p.op === "○");
assert.equal(inBand.length, 24);
assert.ok(inBand.every((p) => p.level === levels.indexOf("Compare fractions")));
// Chompers visits the Tower (its pool) and asks them from the band; Halfling asks them too; the
// Tower's others never compare.
const tower = WINGS.find((w) => w.id === "tower"), mon = (n) => MON.find((m) => m.n === n);
assert.ok(tower.pool.includes("Chompers") && !tower.floors.includes("Chompers"));
assert.equal(bandOf(tower, mon("Chompers")), "third");
for (const n of ["Chompers", "Halfling"]) assert.ok(asks(mon(n))("○", fs[0].key), n);
for (const n of ["Timesaur", "Divvy", "Starbot", "Sigma Rex", "Tick-Tockus", "Margot-Rythm"]) assert.ok(!asks(mon(n))("○", fs[0].key), n);
console.log("✓ comparing fractions: the Tower's band, asked by Chompers and Halfling");

// Chompers eats the bigger side: < opens to the right, > to the left, = is a happy bounce.
const pose = (f) => chompPose(f.sym, f.sym);
assert.equal(pose(fracCompareFact("3/8", "5/8")).eat, "right");
assert.equal(pose(fracCompareFact("2/3", "2/6")).eat, "left");
assert.equal(pose(fracCompareFact("2/4", "1/2")).act, "bounce");

// The hint: two fraction bars, the rule in the classroom's words, and no symbol before answering.
for (const f of fs) {
  const b = hintFor(f, false), w = hintFor(f, true);
  assert.ok(b.model.startsWith("<svg") && b.grownups, f.key);
  assert.ok(b.say.endsWith(`${f.l} ? ${f.r}`) && !/[<>=]|&[lg]t;/.test(b.say + b.model.replace(/<[^>]*>/g, "")), `${f.key}: ${b.say}`);
  assert.ok(w.say.endsWith(`${f.l} ${f.sym} ${f.r}`), `${f.key}: ${w.say}`);
  // Each bar shaded by its numerator: as many filled pieces as both numerators.
  const shaded = (b.model.match(/<rect [^>]*fill="var\(--(gold|coral)\)"/g) || []).length;
  assert.equal(shaded, nd(f.l)[0] + nd(f.r)[0], f.key);
}
assert.equal(hintFor(fracCompareFact("3/8", "5/8"), false).say, "Same size pieces: more pieces is more. 3/8 ? 5/8");
assert.equal(hintFor(fracCompareFact("2/3", "2/6"), false).say, "Same number of pieces: bigger pieces is more. 2/3 ? 2/6");
assert.equal(hintFor(fracCompareFact("2/4", "1/2"), true).say, "Line up the bars. Which shades more? 2/4 = 1/2");
console.log("✓ comparing fractions: hints");

// Spoken as a teacher says them.
assert.equal(spokenProblem(fracCompareFact("3/8", "5/8")), "Compare three eighths and five eighths.");
assert.equal(spokenFact(fracCompareFact("2/3", "2/6")), "two thirds is greater than two sixths");
assert.equal(spokenFact(fracCompareFact("2/4", "1/2")), "two fourths is equal to one half");
console.log("✓ comparing fractions: spoken");
