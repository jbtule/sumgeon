// Coins (Trollar): the facts, their levels, the drawing and the spoken lines.
import assert from "node:assert/strict";
import { coinFacts, coinFact, coinsSvg, coinWords, COIN_LEVELS } from "../js/coins.js";
import { pool, factOf, openLevel, choose } from "../js/learn.js";
import { spokenProblem, spokenFact } from "../js/problems.js";
import { hintFor } from "../js/hints.js";

const fs = coinFacts();
assert.equal(new Set(fs.map((f) => f.key)).size, fs.length, "each coin fact once");
const dimeNickel3 = coinFact({ q: 0, d: 1, n: 1, p: 3 });
assert.deepEqual([dimeNickel3.ans, dimeNickel3.q, dimeNickel3.key], [18, "10 + 5 + 1 + 1 + 1", "¢0,1,1,3"]);
assert.deepEqual(factOf("¢1,0,0,2"), coinFact({ q: 1, d: 0, n: 0, p: 2 }));
// Levels open in teaching order: pennies first.
const p = pool("coins");
assert.equal(p.length, fs.length);
assert.deepEqual(COIN_LEVELS.map((_, i) => p.filter((f) => f.level === i).length), [5, 4, 9, 29, 47]);
assert.equal(openLevel("coins", {}), 0);
assert.match(choose("coins", {}, { now: 0, rnd: () => 0.5 }), /^¢0,0,0,[2-6]$/, "a new player counts pennies");
// Half the pennies learned opens "Each coin" (strands open at 50%, not 70%).
const recs = {};
p.filter((f) => f.level === 0).slice(0, 3).forEach((f) => (recs[f.key] = { b: 3, n: 2, c: 2, ms: 2000, t: 0 }));
assert.equal(openLevel("coins", recs), 1);
// Drawing and words.
const s = coinsSvg(dimeNickel3.coins);
assert.ok(s.startsWith("<svg") && (s.match(/<circle/g) || []).length >= 5 && !/undefined|NaN/.test(s));
assert.equal(coinWords({ q: 0, d: 2, n: 0, p: 3 }), "two dimes and three pennies");
assert.equal(spokenProblem(dimeNickel3), "one dime, one nickel and three pennies. How many cents?");
assert.equal(spokenFact(dimeNickel3), "one dime, one nickel and three pennies make eighteen cents");
assert.equal(spokenFact(coinFact({ q: 0, d: 0, n: 0, p: 1 })), "one penny is one cent");
// Hints: values before, the count-on after.
assert.equal(hintFor(dimeNickel3, false).say, "Count on from the biggest coin: 10 + 5 + 1 + 1 + 1 = ?");
assert.equal(hintFor(dimeNickel3, true).say, "Count on from the biggest coin: 10, 15, 16, 17, 18. 10 + 5 + 1 + 1 + 1 = 18");
assert.match(hintFor(coinFact({ q: 0, d: 1, n: 0, p: 0 }), false).say, /^Penny 1¢, nickel 5¢, dime 10¢, quarter 25¢\. This coin = \?$/);
console.log("✓ coins");
