// The learning engine: keys, records, levels opening, and how problems are chosen.
import assert from "node:assert/strict";
import { BANDS, pool, keyOf, factOf, record, openLevel, helpFor, choose, monsterHP, learned, mastered, RECENT, notRecent, spellKey } from "../js/learn.js";
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
assert.deepEqual(names("second"), ["Add and subtract, no regrouping", "Add and subtract, regrouping", "Hundreds, tens and ones", "Tens in a number", "10 and 100 more or less"]);
assert.deepEqual(names("third"), ["× 0, 1, 2, 5 and 10", "÷ 1, 2, 5 and 10", "× 3, 4 and 6", "÷ 3, 4 and 6", "× 7, 8 and 9", "÷ 7, 8 and 9", "× tens", "Fractions on a number line", "Equal fractions", "Rounding", "Area and perimeter", "× and ÷ 11 and 12"]);
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
// True or false (the Equal Twins, batch 2): to 10 from the start, to 20 with crossing 10, and
// fixing a false one with the missing numbers.
assert.deepEqual([0, 1, 2, 3].map((L) => at("first", L).filter((f) => f.op === "✓").length), [24, 24, 0, 0], "true or false: to 10, then to 20");
assert.deepEqual([0, 1, 2, 3].map((L) => at("first", L).filter((f) => f.op === "✎").length), [0, 0, 32, 0], "fix it with the missing numbers");
assert.ok(at("first", 2).some((f) => f.blank) && at("first", 3).some((f) => f.ans > 20));
// 2nd: two-digit and three-digit + and −. 3rd: × and ÷ only (and fractions, rounding, area).
assert.ok(pool("second").every((p) => (p.op === "+" || p.op === "-" || p.op === "#") && factOf(p.key).ans > 0), "the Mines are + and −, and place value");
assert.ok(pool("second").filter((p) => p.op !== "#").every((p) => { const f = factOf(p.key); return Math.max(f.x, f.y) > 20 || f.ans > 20; }), "past 20");
// Place value (batch 2) after the two-digit work and before the three-digit work.
assert.deepEqual([0, 1, 2, 3, 4].map((L) => at("second", L).filter((f) => f.op === "#").length), [0, 0, 40, 36, 0], "place value before 10 and 100 more or less");
assert.ok(at("second", 2).every((f) => f.kind === "blocks" || f.kind === "expanded") && at("second", 3).every((f) => f.kind === "tens" || f.kind === "odd"));
assert.ok(pool("third").every((p) => "×÷/≈▭↔".includes(p.op)), "the Tower is × and ÷, no + or −");
// The number line (batch 2) before equal fractions, its 0 to 2 line with them.
assert.ok(at("third", 7).every((f) => f.op === "↔" && f.wholes === 1) && at("third", 7).length === 23, "where's the dot, and equal parts");
assert.ok(at("third", 8).some((f) => f.op === "/") && at("third", 8).filter((f) => f.op === "↔").length === 12 && at("third", 8).filter((f) => f.op === "↔").every((f) => f.wholes === 2), "past 1 with equal fractions");
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
  for (let i = 0; i < 400; i++) if ("/↔".includes(choose("third", r, { now: 1e12, rnd: s, op: "×", asks: asks(MON[3]) })[0])) fr++;
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

// No repeats within a fight: the last RECENT problems stay out of the way while there are others
// (a missed fact still comes back, through retry). Played as a learner who's seen the first
// level: mostly learning facts, which used to come back every 4th problem.
{
  for (const band of ["kinder", "first", "third"]) {
    const recs = {};
    for (const f of pool(band).filter((f) => f.level === 0)) recs[f.key] = { b: 0, n: 1, c: 0, ms: 5000, t: 0 };
    let recent = [], seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const fight = [];
    for (let i = 0; i < 12; i++) {
      const k = choose(band, recs, { now: 1, rnd, recent });
      fight.push(k); recent = [k].concat(recent).slice(0, RECENT);
    }
    assert.equal(new Set(fight).size, fight.length, `${band}: no repeats in 12 problems (${fight.join(" ")})`);
  }
  // A small set falls back to the last 3, then to anything.
  const few = [{ key: "a" }, { key: "b" }, { key: "c" }, { key: "d" }];
  assert.deepEqual(notRecent(few, ["a", "b", "c", "d"]).map((f) => f.key), ["d"]);
  assert.deepEqual(notRecent(few.slice(0, 2), ["a", "b"]).map((f) => f.key), ["a", "b"]);
}

// Batch 1: time (Tick-Tockus) and patterns (Slimelipsis) as strands, a fixed sample per level in
// the school's order, every key its own fact and back.
import { clockFacts, clockFactOf } from "../js/clock.js";
import { patternFacts } from "../js/patterns.js";
{
  const levels = (b) => BANDS[b].levels.map((l) => l.name);
  const sizes = (b) => BANDS[b].levels.map((_, i) => pool(b).filter((f) => f.level === i).length);
  assert.deepEqual(levels("timeH"), ["Hours", "Half hours"]);
  assert.deepEqual(levels("timeM"), ["5 minutes", "What time is it? (5 minutes)"]);
  assert.deepEqual(levels("timeT"), ["To the minute", "How long? In the hour", "Minutes later, in the hour", "How long? Across the hour", "Minutes later, across the hour"]);
  assert.deepEqual(levels("patK"), ["Count on by 1s", "Count by 10s", "Count back by 1s"]);
  assert.deepEqual(levels("patH"), ["Count on to 120", "Count by 5s"]);
  assert.deepEqual(levels("patM"), ["Count by 2s", "Count by 100s", "What's missing? By 2s, 5s, 10s, 100s", "Odd and even to 20", "Odd and even to 100"]);
  assert.deepEqual([sizes("timeH"), sizes("timeM"), sizes("timeT")], [[12, 36], [33, 20], [20, 16, 16, 16, 16]]);
  assert.deepEqual([sizes("patK"), sizes("patH"), sizes("patM")], [[17, 7, 17], [23, 16], [21, 7, 30, 16, 16]]);
  for (const b of ["timeH", "timeM", "timeT", "patK", "patH", "patM"]) {
    assert.ok(BANDS[b].strand && BANDS[b].unlock === 0.5, b);
    for (const f of pool(b)) {
      const g = factOf(f.key, () => 0.5);
      assert.equal(g.key, f.key, `${b}: ${f.key} round-trips`);
      assert.ok(Number.isInteger(g.ans) && g.ans >= 0, `${f.key}: a whole number to type`);
      assert.ok(/^[⌚…◐]/.test(f.key), f.key);
    }
  }
  // Keys: the hour, half past, the whole time (two slots), minutes past, how long, minutes later.
  const t = (k) => factOf(k);
  assert.deepEqual([t("⌚h3").ans, t("⌚h3:30").ans, t("⌚t3:30").slots, t("⌚m3:35").ans, t("⌚e3:10,3:45").ans, t("⌚a3:15,20").ans, t("⌚a3:50,25").slots],
    [3, 3, [3, 30], 35, 35, 35, [4, 15]]);
  assert.deepEqual([t("…2,4,6,□").ans, t("…2,□,6,8").ans, t("…10,9,8,□").ans, t("◐e3,8,11,14,6").ans, t("◐o3,8,11,14,6").ans], [8, 4, 7, 3, 2]);
  assert.equal(new Set(clockFacts().map((f) => f.key)).size, clockFacts().length, "each time once");
  assert.equal(new Set(patternFacts().map((f) => f.key)).size, patternFacts().length, "each row once");
  // A whole time's damage is its minutes, or the hour on the hour.
  assert.deepEqual([clockFactOf("⌚t4:25").ans, clockFactOf("⌚t4:00").ans], [25, 4]);
  // Nothing a band already has: the strands' keys are their own.
  for (const b of ["kinder", "first", "second", "third"]) assert.ok(!pool(b).some((f) => /^[⌚…◐]/.test(f.key)), b);
}

// Spells never repeat lately: not one of the fight's recent problems or the last spells, and with
// nothing else left, no spell (the Mines' only learned one-digit answer was cast fight after fight).
{
  const one = pool("second").find((f) => f.op === "-" && f.ans >= 0 && f.ans <= 9);
  const recs = { [one.key]: { b: 3, n: 1, c: 1, ms: 3000, t: 0 } };
  assert.equal(spellKey("second", recs, { recent: [], op: "-" }), one.key);
  assert.equal(spellKey("second", recs, { recent: [one.key], op: "-" }), null, "a recent problem isn't cast");
  assert.equal(spellKey("second", recs, { recent: [], spells: [one.key], op: "-" }), null, "nor a recent spell");
}
