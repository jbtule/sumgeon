// The learning engine: keys, records, levels opening, and how problems are chosen.
import assert from "node:assert/strict";
import { BANDS, pool, keyOf, factOf, record, openLevel, helpFor, choose, monsterHP, learned, mastered } from "../js/learn.js";
import { MON } from "../js/monsters.js";
import { facts, spokenProblem, spokenFact } from "../js/problems.js";
import { spokenLines, askLine } from "../js/lines.js";
import { asks } from "../js/traits.js";

// Keys: turnarounds share for + and ×, not for − and ÷.
assert.equal(keyOf({ op: "+", x: 4, y: 3 }), "+3,4");
assert.equal(keyOf({ op: "×", x: 8, y: 7 }), "×7,8");
assert.equal(keyOf({ op: "-", x: 9, y: 5 }), "-9,5");
const f = factOf("+3,4", () => 0.9);
assert.deepEqual([f.x, f.y, f.ans, f.q], [3, 4, 7, "3 + 4"]);
assert.equal(factOf("+3,4", () => 0.1).q, "4 + 3");
assert.equal(factOf("÷56,8").ans, 7);

// Every fact the bands ask is one of the recorded ones, asked and answered, so every problem has
// the recorded voice.
const lines = new Set(spokenLines().map((l) => l.text));
for (const band of Object.keys(BANDS)) {
  for (const p of pool(band)) for (const r of [0.1, 0.9]) {
    const f = factOf(p.key, () => r);
    assert.ok(lines.has(askLine(f)), `${p.key}: ${askLine(f)}`);
    assert.ok(lines.has(spokenFact(f.fact || f)), `${p.key}: ${spokenFact(f.fact || f)}`);
  }
}
// Each stratum asks only its grade's facts (DESIGN.md §4.1), its levels in the school's order.
const names = (b) => BANDS[b].levels.map((l) => l.name);
const at = (b, L) => pool(b).filter((p) => p.level === L).map((p) => factOf(p.key, () => 0.9));
assert.deepEqual(names("kinder"), ["Within 5, with zero", "Within 10", "Make 10 and number bonds", "10 and some more"]);
assert.deepEqual(names("first"), ["Within 20, not crossing 10", "Crossing 10", "Missing numbers and the equal sign", "Add and subtract tens"]);
assert.deepEqual(names("second"), ["Add and subtract, no regrouping", "Add and subtract, regrouping", "10 and 100 more or less"]);
assert.deepEqual(names("third"), ["× 0, 1, 2, 5 and 10", "÷ 1, 2, 5 and 10", "× 3, 4 and 6", "÷ 3, 4 and 6", "× 7, 8 and 9", "÷ 7, 8 and 9", "× tens", "Fractions", "Rounding", "Area and perimeter", "× and ÷ 11 and 12"]);
// K: + and − to 20, with zero, make 10 and number bonds as □ problems.
assert.ok(pool("kinder").every((p) => (p.op === "+" || p.op === "-") && factOf(p.key).ans <= 20), "the Cellar is + and − to 20");
assert.ok(at("kinder", 0).every((f) => Math.max(f.x, f.y, f.ans) <= 5), "within 5");
for (const k of ["+0,4", "-4,0", "-4,4"]) assert.equal(pool("kinder").find((p) => p.key === k).level, 0, `${k}: zero is in the first level`);
assert.ok(at("kinder", 2).every((f) => f.blank === "y" && f.fact.ans <= 10), "make 10 and bonds hide a number");
assert.equal(at("kinder", 2).filter((f) => f.fact.ans === 10).length, 9, "every make-10 partner, 1 + □ to 9 + □");
assert.deepEqual([factOf("□+7,3").q, factOf("□+7,3").ans], ["7 + □ = 10", 3]);
assert.ok(at("kinder", 3).every((f) => f.x === 10 || f.y === 10 || f.ans === 10), "teens as 10 and some more");
// 1st: within 20 past 10, comparing and balancing, □ facts, and ± tens; no × or ÷, nothing past 100.
assert.ok(pool("first").every((p) => !"×÷¢".includes(p.op) && factOf(p.key).ans <= 100), "the Hall has no × or ÷");
assert.ok(at("first", 0).filter((f) => "+-".includes(f.op)).every((f) => (f.op === "+" ? f.ans > 10 && (f.x % 10) + (f.y % 10) <= 10 : f.x > 10 && f.y % 10 <= f.x % 10)), "not crossing 10");
assert.ok(at("first", 1).filter((f) => "+-".includes(f.op)).every((f) => (f.op === "+" ? (f.x % 10) + (f.y % 10) > 10 : f.y % 10 > f.x % 10)), "crossing 10");
assert.ok(at("first", 0).some((f) => f.op === "○") && at("first", 0).some((f) => f.op === "="), "comparing and balancing from the start");
assert.ok(at("first", 2).some((f) => f.blank) && at("first", 3).some((f) => f.ans > 20));
// 2nd: two-digit and three-digit + and −. 3rd: × and ÷ only (and fractions, rounding, area).
assert.ok(pool("second").every((p) => (p.op === "+" || p.op === "-") && factOf(p.key).ans > 0), "the Mines are + and −");
assert.ok(pool("second").every((p) => { const f = factOf(p.key); return Math.max(f.x, f.y) > 20 || f.ans > 20; }), "past 20");
assert.ok(pool("third").every((p) => "×÷/≈▭".includes(p.op)), "the Tower is × and ÷, no + or −");
assert.ok(at("third", 0).some((f) => f.x === 0 || f.y === 0) && at("third", 0).some((f) => f.x === 1 || f.y === 1), "× 0 and × 1 come first");
assert.ok(pool("third").some((p) => p.key === "×11,12" && p.level === BANDS.third.levels.length - 1), "11s and 12s at the bottom");
assert.ok(pool("third").some((p) => p.key === "÷0,5") && !pool("third").some((p) => /^÷\d+,0$/.test(p.key)), "0 ÷ 5, never ÷ 0");
// No two strata share a fact (but the Cellar's within 10, which the Hall builds on, isn't the Hall's).
const owner = {};
for (const b of ["kinder", "first", "second", "third"]) for (const p of pool(b)) { assert.ok(!owner[p.key], `${p.key} in ${owner[p.key]} and ${b}`); owner[p.key] = b; }

// Records.
const fast = { ok: true, ms: 1500, hinted: false, now: 1, fluentMs: 3000 };
// Placement: a new fact answered right, fast and unhinted is already known.
assert.equal(record(undefined, fast).b, 3, "a new fact answered fast is learned at once");
assert.equal(record(undefined, { ...fast, hinted: true }).b, 0, "but not with a hint");
let r = record(undefined, { ...fast, ms: 5000 });
assert.deepEqual([r.b, r.n, r.c], [1, 1, 1], "a slow first right answer is box 1");
r = record(r, fast);
assert.equal(r.b, 3, "fast from box 1 on moves two boxes");
r = record(r, { ...fast, ms: 5000 });
assert.equal(r.b, 4, "slow moves one");
assert.equal(record(r, { ...fast, ok: false }).b, 0, "a miss is back to box 0");
assert.equal(record({ b: 1, n: 1, c: 1, ms: 2000, t: 0 }, { ...fast, hinted: true }).b, 1, "a hinted answer doesn't move it");
assert.equal(learned({ b: 3 }), true);
assert.equal(mastered({ b: 4, ms: 2000 }, 3000), true);
assert.equal(mastered({ b: 4, ms: 4000 }, 3000), false, "mastered needs fluent, not just right");

// Help fades: shown for a new fact, a button while learning, none in review.
assert.equal(helpFor(undefined), "show");
assert.equal(helpFor({ n: 2, b: 1 }), "button");
assert.equal(helpFor({ n: 5, b: 3 }), "none");

// Levels open at 70% learned, in order.
const recs = {};
assert.equal(openLevel("kinder", recs), 0);
const first = pool("kinder").filter((p) => p.level === 0);
first.slice(0, Math.ceil(first.length * 0.7)).forEach((p) => (recs[p.key] = { b: 3, n: 3, c: 3, ms: 2000, t: 0 }));
assert.equal(openLevel("kinder", recs), 1);
{
  assert.equal(openLevel("third", {}), 0, "a new 3rd grader starts with × 0, 1, 2, 5 and 10");
  const r = {}, times = pool("third").filter((p) => p.level === 0);
  times.slice(0, Math.ceil(times.length * 0.7) - 1).forEach((p) => (r[p.key] = { b: 3, n: 3, c: 3, ms: 2000, t: 0 }));
  assert.equal(openLevel("third", r), 0, "÷ waits for 70% of × 0, 1, 2, 5 and 10");
  r[times[times.length - 1].key] = { b: 3, n: 3, c: 3, ms: 2000, t: 0 };
  assert.equal(openLevel("third", r), 1);
}
// A new level of another kind still arrives under a monster with its own operation: fractions,
// with Timesaur (×) on the floor.
{
  const r = {};
  pool("third").filter((p) => p.level < 7).forEach((p) => (r[p.key] = { b: 3, n: 3, c: 3, ms: 2000, t: 1e12 }));
  const s = (() => { let x = 5; return () => ((x = (x * 16807) % 2147483647) / 2147483647); })();
  let fr = 0;
  for (let i = 0; i < 400; i++) if (choose("third", r, { now: 1e12, rnd: s, op: "×", asks: asks(MON[3]) })[0] === "/") fr++;
  assert.ok(fr > 40, `fractions come up under Timesaur: ${fr} of 400`);
}

// Choosing: a fresh player only gets the first level; the retry comes back first.
const seq = (() => { let s = 1; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
for (let i = 0; i < 200; i++) {
  const k = choose("kinder", {}, { now: 0, rnd: seq });
  assert.equal(pool("kinder").find((p) => p.key === k).level, 0);
}
assert.equal(choose("kinder", {}, { now: 0, retry: "+2,3" }), "+2,3");
// Recent facts don't repeat right away.
for (let i = 0; i < 100; i++) assert.notEqual(choose("kinder", {}, { now: 0, rnd: seq, recent: ["+1,1"] }), "+1,1");
// With learning facts around, most picks are learning facts (about 60%), and box 0 comes up most.
const mixed = {};
pool("kinder").filter((p) => p.level === 0).forEach((p, i) => (mixed[p.key] = { b: i % 2 ? 0 : 2, n: 2, c: 1, ms: 2500, t: 0 }));
let learningPicks = 0, box0 = 0;
for (let i = 0; i < 1000; i++) {
  const k = choose("kinder", mixed, { now: 1, rnd: seq });
  if (mixed[k] && mixed[k].b <= 2) { learningPicks++; if (mixed[k].b === 0) box0++; }
}
assert.ok(learningPicks > 900, `all open facts are learning, so all picks are: ${learningPicks}`);
assert.ok(box0 > learningPicks / 2, `box 0 is favored: ${box0} of ${learningPicks}`);

// The monster's own operation comes first when it has facts here.
let minus = 0;
for (let i = 0; i < 1000; i++) if (choose("kinder", {}, { now: 0, rnd: seq, op: "-" })[0] === "-") minus++;
assert.ok(minus > 700, `Minustaur asks subtraction ${minus} times in 1000`);

// HP scales with what's being asked.
assert.ok(monsterHP(MON[0], "kinder", {}) >= 10);
assert.ok(monsterHP(MON[3], "third", {}) < monsterHP(MON[3], "third", Object.fromEntries(pool("third").map((p) => [p.key, { b: 4, n: 5, c: 5, ms: 1000, t: 0 }]))),
  "HP grows as bigger facts open");
// Variety: not the same kind of problem with the same answer as the last couple.
{
  const recs = {};
  pool("kinder").filter((f) => f.level <= 2).forEach((f) => (recs[f.key] = { b: 3, n: 3, c: 3, ms: 900, t: 0 }));
  let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const asked = [];
  for (let i = 0; i < 30; i++) {
    const f = factOf(choose("kinder", recs, { now: 1, rnd, recent: [], op: "-", avoidAns: asked.slice(-2) }));
    asked.push(f.op + " " + f.ans);
  }
  for (let i = 2; i < asked.length; i++) assert.ok(asked[i] !== asked[i - 1] && asked[i] !== asked[i - 2], `${asked[i]} again at ${i}: ${asked.join(",")}`);
  // A different kind of problem with the same answer is fine.
  assert.ok(pool("kinder").some((f) => f.op === "+" && f.ans === 10 && f.level <= 2), "3 + 7 is still allowed after 17 − 7");
}
console.log(`✓ learn (K ${pool("kinder").length} facts, 1st ${pool("first").length}, 2nd ${pool("second").length}, 3rd ${pool("third").length})`);

// The captain's digit at depth 1 (app.js CAPTAIN_BIAS): answers with it come up more often, and
// not at all differently with no share.
{
  let seed = 1; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const share = (o) => { let n = 0; for (let i = 0; i < 3000; i++) if (String(factOf(choose("kinder", {}, { now: 0, rnd, recent: [], ...o })).ans).includes("3")) n++; return n / 3000; };
  const plain = share({}), biased = share({ digit: 3, digitShare: 0.35 }), off = share({ digit: 3, digitShare: 0 });
  assert.ok(biased > plain + 0.15, `the captain's digit comes up more (${plain.toFixed(2)} → ${biased.toFixed(2)})`);
  assert.ok(Math.abs(off - plain) < 0.05, "no share, no bias");
  const held = share({ digit: 3, avoidDigitShare: 0.85 });
  assert.ok(held < plain / 3, `the first fight holds the captain's digit back (${plain.toFixed(2)} → ${held.toFixed(2)})`);
}
