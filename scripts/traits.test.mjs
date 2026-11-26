// Monster traits: each rule, and that every monster on a Wing has its badge (but Plusquito).
import assert from "node:assert/strict";
import { TRAITS, traitOf, charged, prefers, hitBy, atHalf } from "../js/traits.js";
import { MON } from "../js/monsters.js";
import { WINGS, cursedMonster } from "../js/wings.js";
import { choose, pool } from "../js/learn.js";

const mon = (n) => MON.find((m) => m.n === n);
for (const w of WINGS) for (const n of w.pool.concat([w.boss])) {
  if (n === "Plusquito") assert.equal(traitOf(mon(n)), null, "Plusquito is the tutorial monster");
  else assert.ok(traitOf(mon(n)), `${n} has a trait`);
}
for (const t of Object.values(TRAITS)) assert.ok(t.text.split(" ").length <= 10 && t.icon && t.name);

// Minustaur charges every 4th problem.
assert.deepEqual([0, 1, 2, 3, 4, 7].map((n) => charged(mon("Minustaur"), n)), [false, false, false, true, false, true]);
assert.equal(charged(mon("Plusquito"), 3), false);

// Hits.
assert.equal(hitBy(mon("Timesaur"), 8, "8", false).mult, 0.5);
assert.equal(hitBy(mon("Timesaur"), 12, "12", false).mult, 1);
assert.equal(hitBy(mon("Make-Ten Golem"), 10, "10", false).mult, 2);
assert.equal(hitBy(mon("Make-Ten Golem"), 9, "9", false).mult, 1);
assert.equal(hitBy(mon("Sigma Rex"), 6, "6", false).mult, 1, "Sigma Rex isn't armored until half HP");
assert.equal(hitBy(mon("Sigma Rex"), 6, "6", true).mult, 0.5);
assert.equal(hitBy(cursedMonster(5), 15, "15", false).mult, 2, "Lucky Number");
assert.equal(hitBy(cursedMonster(5), 12, "12", false).mult, 1);
assert.match(traitOf(cursedMonster(3)).text, /a 3 hit double/);

// Half HP.
assert.equal(atHalf(mon("Divvy")).split, true);
assert.ok(atHalf(mon("Sigma Rex")).note);
assert.equal(atHalf(mon("Timesaur")), null);

// Starbot asks ×5 and ×10 facts more often.
const like = prefers(mon("Starbot"));
assert.equal(like("×5,7"), true); assert.equal(like("×3,4"), false); assert.equal(like("÷10,5"), true);
const recs = Object.fromEntries(pool("third").map((p) => [p.key, { b: 3, n: 3, c: 3, ms: 2000, t: 0 }]));
let s = 1; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
let hits = 0;
for (let i = 0; i < 1000; i++) if (like(choose("third", recs, { now: 1e12, rnd, op: "×", like }))) hits++;
assert.ok(hits > 650, `Starbot asked ×5/×10 facts ${hits} times in 1000`);
// The Centipede (a stand-in boss): 100 or more hits double.
assert.equal(hitBy(mon("The Centipede"), 120, "120", false).mult, 2);
assert.equal(hitBy(mon("The Centipede"), 99, "99", false).mult, 1);
// What each monster asks at all: comparing for Chompers, balancing for the Twins, both for The
// Unknown, never either for the arithmetic monsters; Quizard balances too.
import { asks } from "../js/traits.js";
assert.ok(asks(mon("Chompers"))("○") && asks(mon("Chompers"))("more") && !asks(mon("Chompers"))("+"));
assert.ok(asks(mon("Equal Twins"))("=") && !asks(mon("Equal Twins"))("○"));
assert.ok(asks(mon("The Unknown"))("=") && asks(mon("The Unknown"))("○"));
assert.ok(asks(mon("Quizard"))("=") && asks(mon("Quizard"))("+") && !asks(mon("Quizard"))("○"));
for (const n of ["Plusquito", "Minustaur", "Timesaur", "Haberhasher"]) assert.ok(asks(mon(n))("+") && !asks(mon(n))("○") && !asks(mon(n))("="), n);
console.log("✓ traits");
