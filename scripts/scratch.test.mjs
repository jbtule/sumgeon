// The scratch pad's ✏️ (learn.js scratchable): 4th grade's paper-work problems, any + or − of
// numbers of 10 or more that regroups, and sums of several numbers of 10 or more; never a one-digit
// fact, nor a + or − that doesn't regroup.
import assert from "node:assert/strict";
import { BANDS, SCRATCH_SETS, scratchable, keyOf, pool, factOf } from "../js/learn.js";
import { regroups } from "../js/traits.js";

const forge = BANDS.fourth.facts();
for (const set of SCRATCH_SETS) assert.ok(forge.some((f) => f.set === set), `no 4th grade facts in set ${set}`);
// Every fact of the Forge's paper-work sets.
for (const f of forge) if (SCRATCH_SETS.includes(f.set)) assert.ok(scratchable(keyOf(f)), `${keyOf(f)} (${f.set})`);
assert.ok(scratchable("÷1288,8"));
// Regrouping + and − of numbers of 10 or more: yes; without regrouping, or a one-digit number: no.
assert.ok(scratchable("+15,27"));
assert.ok(scratchable("-52,28"));
assert.ok(scratchable("+287,359"));
assert.ok(!scratchable("+14,23"));
assert.ok(!scratchable("-69,26"));
assert.ok(!scratchable("+7,8"));
assert.ok(!scratchable("-15,7"));
assert.ok(!scratchable("×7,8"));
assert.ok(!scratchable("÷56,8"));
// Several two-digit numbers (Triceraplus in the Mines), but not three one-digit ones.
assert.ok(scratchable("Σ23,14,31"));
assert.ok(!scratchable("Σ4,6,3"));
// Every band: what it says agrees with the rule.
for (const b of Object.keys(BANDS)) for (const f of pool(b)) {
  const p = factOf(f.key);
  const want = (p.op === "+" || p.op === "-") && Math.min(p.x, p.y) >= 10 ? regroups(p) : p.op === "Σ" ? p.nums.every((n) => n >= 10) : b === "fourth" && forge.some((g) => keyOf(g) === f.key && SCRATCH_SETS.includes(g.set));
  if (b === "fourth" && scratchable(f.key) && !want) continue; // a paper-work set's own fact
  assert.equal(scratchable(f.key), want, `${b}: ${f.key}`);
}
// The Mines have some, the Cellar none.
assert.ok(pool("second").some((f) => scratchable(f.key)));
assert.ok(!pool("kinder").some((f) => scratchable(f.key)));
assert.ok(!scratchable(""));
assert.ok(!scratchable(undefined));
console.log("scratch ok");
