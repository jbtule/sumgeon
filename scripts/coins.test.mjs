// Coins (Trollar): the facts, their levels, the drawing and the spoken lines.
import assert from "node:assert/strict";
import { coinFacts, coinFact, findFact, pileOf, coinsSvg, coinWords, COIN_LEVELS } from "../js/coins.js";
import { pool, factOf, choose } from "../js/learn.js";
import { spokenProblem, spokenFact } from "../js/problems.js";
import { hintFor } from "../js/hints.js";

const fs = coinFacts();
assert.equal(new Set(fs.map((f) => f.key)).size, fs.length, "each coin fact once");
const dimeNickel3 = coinFact({ q: 0, d: 1, n: 1, p: 3 });
assert.deepEqual([dimeNickel3.ans, dimeNickel3.q, dimeNickel3.key], [18, "10 + 5 + 1 + 1 + 1", "¢0,1,1,3"]);
assert.deepEqual(factOf("¢1,0,0,2"), coinFact({ q: 1, d: 0, n: 0, p: 2 }));
// Find the coin: "How many quarters?" in a mixed pile.
const q2 = findFact("q", { q: 2, d: 1, n: 1, p: 0 });
assert.deepEqual([q2.ans, q2.key], [2, "¢?q:2,1,1,0"]);
assert.deepEqual(factOf(q2.key), q2);
assert.equal(spokenProblem(q2), "How many quarters?");
assert.equal(spokenFact(q2), "There are two quarters.");
assert.equal(spokenFact(findFact("p", { q: 1, d: 1, n: 0, p: 1 })), "There is one penny.");
// One coin, heads or tails: the voice asks its worth without naming it.
const dimeBack = coinFact({ q: 0, d: 1, n: 0, p: 0 }, true);
assert.deepEqual([dimeBack.ans, dimeBack.key, dimeBack.tails], [10, "¢t0,1,0,0", true]);
assert.deepEqual(factOf("¢t0,1,0,0"), dimeBack);
assert.equal(spokenProblem(dimeBack), "How many cents?");
assert.equal(spokenFact(dimeBack), "This is a dime. A dime is small and silver. It's worth ten cents.");
assert.equal(spokenFact(coinFact({ q: 0, d: 0, n: 0, p: 1 })), "This is a penny. A penny is small and brown. It's worth one cent.");
// Finding a coin always means telling it apart: the answer's count differs from the other coins'
// (one dime among twos, or two or three dimes among ones), never all ones.
for (const f of coinFacts().filter((f) => f.find)) {
  const others = Object.keys(f.coins).filter((k) => k !== f.find && f.coins[k]);
  assert.ok(others.every((k) => f.coins[k] !== f.ans), `${f.key}: the asked coin's count stands apart`);
}
// The pile: a single coin shows the side asked; a pile to find coins in is shuffled, sides mixed.
let r = 0; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
assert.deepEqual(pileOf(dimeBack, rnd), [{ k: "d", tails: true }]);
const pile = pileOf(q2, rnd);
assert.equal(pile.filter((c) => c.k === "q").length, 2);
assert.deepEqual(pileOf(dimeNickel3).map((c) => c.k).join(""), "dnppp", "counted biggest first, heads up");
// Levels open in teaching order: find the coin, each coin's worth, then counting.
// The kindergarten coins (find the coin, each coin's worth) are the Cellar's strand; counting
// them is the Mines' (pennies, then nickels, dimes and quarters).
const pk = pool("coinsK"), pc = pool("coins");
// The Mines' strand ends with dollars (dollars.js): bills, then bills and coins.
assert.equal(pk.length + pc.filter((f) => f.op === "¢").length, fs.length, "every coin fact in one strand");
assert.deepEqual([4, 5].map((i) => pc.filter((f) => f.level === i && f.op === "$").length), [24, 24], "then dollars");
assert.ok(pc.every((f) => (f.op === "$") === (f.level >= 4)), "dollars come after counting coins");
assert.deepEqual([0, 1].map((i) => pk.filter((f) => f.level === i).length), [36, 8]);
assert.deepEqual([0, 1, 2, 3].map((i) => pc.filter((f) => f.level === i).length), [5, 9, 29, 47]);
assert.ok(pc.filter((f) => f.op === "¢").every((f) => !factOf(f.key).find && factOf(f.key).q.includes("+")), "the Mines only count coins");
assert.equal(COIN_LEVELS.length, 6);
assert.match(choose("coinsK", {}, { now: 0, rnd: () => 0.5, open: [0] }), /^¢\?[qdnp]:/, "a new player finds coins");
assert.match(choose("coins", {}, { now: 0, rnd: () => 0.5, open: [0] }), /^¢0,0,0,\d$/, "counting starts with pennies");
// Drawing and words.
const s = coinsSvg(dimeNickel3.coins);
assert.ok(s.startsWith("<svg") && (s.match(/<circle/g) || []).length >= 5 && !/undefined|NaN/.test(s));
// Every coin's back draws, and a ring marks the coins to find.
const backs = coinsSvg(["q", "d", "n", "p"].map((k) => ({ k, tails: true })), { labels: true });
assert.ok(!/undefined|NaN/.test(backs) && (backs.match(/<g /g) || []).length === 4);
assert.equal((coinsSvg(pile, { ring: "q" }).match(/#ffc93c/g) || []).length, 2);
assert.match(coinsSvg(pile), /aria-label="two quarters, one dime and one nickel"/);
assert.equal(coinWords({ q: 0, d: 2, n: 0, p: 3 }), "two dimes and three pennies");
assert.equal(spokenProblem(dimeNickel3), "one dime, one nickel and three penny's. How many cents?", "spoken as penny's: PEN-eez, not penne's");
assert.equal(spokenFact(dimeNickel3), "one dime, one nickel and three penny's make eighteen cents");
// Hints: values before, the count-on after.
assert.equal(hintFor(dimeNickel3, false).say, "Count on from the biggest coin. Total = ?");
assert.equal(hintFor(dimeNickel3, true).say, "Count on from the biggest coin. Total = 18");
assert.ok(hintFor(dimeNickel3, false).model.includes(">17<") && !hintFor(dimeNickel3, false).model.includes(">18<"), "the running count, its last \"?\" until worked");
assert.match(hintFor(coinFact({ q: 0, d: 1, n: 0, p: 0 }), false).say, /^Penny 1¢, nickel 5¢, dime 10¢, quarter 25¢\. This coin = \?$/);
assert.equal(hintFor(q2, false).say, "A quarter is big and silver. Look for both sides! Quarters = ?");
assert.equal(hintFor(dimeBack, true).say, "A dime is small and silver. It's worth 10¢. This coin = 10");
console.log("✓ coins");
