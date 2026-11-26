// The Bestiary: the roster, mastery rings, and meeting and beating monsters.
import assert from "node:assert/strict";
import { roster, mastery, meet, beat } from "../js/bestiary.js";
import { pool } from "../js/learn.js";
import { WINGS, cursedMonster } from "../js/wings.js";

const r = roster();
assert.deepEqual(r.map((x) => x.m.n), ["Plusquito", "Minustaur", "Chompers", "Trollar", "Make-Ten Golem", "Quizard", "Equal Twins", "Judo Judy", "Haberhasher", "The Centipede", "Timesaur", "Divvy", "Starbot", "Sigma Rex"]);
assert.ok(r.every((x) => x.m && x.wing));
assert.equal(new Set(r.map((x) => x.m.n)).size, r.length, "a monster in two strata is listed once, in the first");

const plus = r[0], recs = {};
assert.equal(mastery(plus.m, plus.wing, recs), 0);
pool("kinder").filter((f) => f.op === "+").forEach((f) => (recs[f.key] = { b: 3, n: 3, c: 3, ms: 2000, t: 0 }));
assert.equal(mastery(plus.m, plus.wing, recs), 1, "every + fact learned fills Plusquito's ring");
assert.equal(mastery(r[1].m, r[1].wing, recs), 0, "Minustaur's ring is subtraction");
const golem = r[4];
// Chompers is listed in the Cellar, measured on its "which is more?" strand there.
assert.equal(mastery(r[2].m, r[2].wing, recs), 0);
assert.ok(mastery(golem.m, golem.wing, recs) > 0 && mastery(golem.m, golem.wing, recs) <= 1);

const seen = {};
meet(seen, plus.m, 5);
assert.deepEqual(seen.Plusquito, { met: 5, beaten: 0 });
beat(seen, plus.m, 6); beat(seen, plus.m, 7);
assert.equal(seen.Plusquito.beaten, 2);
assert.equal(seen.Plusquito.met, 5, "first met stays");
beat(seen, r[1].m, 8);
assert.equal(seen.Minustaur.beaten, 1, "beating counts as meeting");
meet(seen, cursedMonster(3), 9);
assert.equal(Object.keys(seen).length, 2, "cursed digits belong on the Heroes page, not here");
// A retired monster (The Unknown, the Hall's old boss) saved in a player's bestiary is kept but not
// listed: the roster comes from the Wings, so Monsters & Heroes never looks it up.
assert.ok(!r.some((x) => x.m.n === "The Unknown"), "The Unknown is retired");
const saved = { "The Unknown": { met: 1, beaten: 2 } };
beat(saved, r.find((x) => x.m.n === "Judo Judy").m, 3);
assert.deepEqual(Object.keys(saved), ["The Unknown", "Judo Judy"]);
console.log("✓ bestiary");
