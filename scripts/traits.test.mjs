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
// What each monster asks at all: comparing for Chompers, balancing for the Twins, the Hall's
// whole mix for Judo Judy, never either for the arithmetic monsters; Quizard balances too.
import { asks, flipOf } from "../js/traits.js";
import { factOf, keyOf, record as recordAnswer } from "../js/learn.js";
import { missingOf } from "../js/missing.js";
import { balanceFacts } from "../js/balance.js";
assert.ok(asks(mon("Chompers"))("○") && asks(mon("Chompers"))("more") && !asks(mon("Chompers"))("+"));
assert.ok(asks(mon("Equal Twins"))("=") && !asks(mon("Equal Twins"))("○"));
assert.ok(["+", "-", "○", "="].every((op) => asks(mon("Judo Judy"))(op)), "Judo Judy asks the Hall's whole mix");
assert.equal(mon("The Unknown"), undefined, "The Unknown is retired");

// Flip (Judo Judy): + with the smaller number first is thrown to the bigger first. Same answer,
// same fact key (turnarounds share one), so the fact's record is the same either way.
const judy = mon("Judo Judy");
assert.deepEqual(traitOf(judy), { icon: "🥋", name: "Flip", text: "Flips your sums: same answer" });
const three8 = factOf("+3,8", () => 0.9); // not turned around: 3 + 8
assert.equal(three8.q, "3 + 8");
const thrown = flipOf(judy, three8);
assert.ok(thrown && thrown.flipped);
assert.deepEqual([thrown.x, thrown.y, thrown.q, thrown.ans], [8, 3, "8 + 3", 11], "8 + 3, the same answer");
assert.equal(thrown.key, three8.key);
assert.equal(keyOf(thrown), keyOf(three8), "the turnaround shares the fact's key");
assert.equal(three8.q, "3 + 8", "the original problem isn't changed");
assert.equal(flipOf(judy, factOf("+3,8", () => 0)), null, "already the bigger first (8 + 3)");
assert.equal(flipOf(judy, factOf("+4,4", () => 0)), null, "a double has nothing to flip");
assert.equal(flipOf(judy, factOf("-8,3", () => 0)), null, "taking away doesn't turn around");
assert.equal(flipOf(judy, missingOf(three8, "x")), null, "a hidden number stays where it is");
for (const f of balanceFacts().slice(0, 40)) assert.equal(flipOf(judy, f), null, "comparing and balancing stay as they are");
// Two-digit sums in the Hall (add tens, 10 more): 20 + 34 is thrown to 34 + 20.
assert.equal(flipOf(judy, { op: "+", x: 20, y: 34, ans: 54, q: "20 + 34" }).q, "34 + 20");
for (const n of ["Plusquito", "Make-Ten Golem", "Equal Twins"]) assert.equal(flipOf(mon(n), three8), null, `${n} doesn't flip`);
// An answer on the flipped problem lands on the same record.
const recs2 = {};
recs2[thrown.key] = recordAnswer(recs2[thrown.key], { ok: true, ms: 1500, hinted: false, now: 1, fluentMs: 4000 });
assert.ok(recs2["+3,8"] && recs2["+3,8"].n === 1, "the flipped answer counts for +3,8");
// Judy's hits are plain.
assert.equal(hitBy(judy, 11, "11", false).mult, 1);
assert.ok(asks(mon("Quizard"))("=") && asks(mon("Quizard"))("+") && !asks(mon("Quizard"))("○"));
for (const n of ["Plusquito", "Minustaur", "Timesaur", "Haberhasher"]) assert.ok(asks(mon(n))("+") && !asks(mon(n))("○") && !asks(mon(n))("="), n);
console.log("✓ traits");
