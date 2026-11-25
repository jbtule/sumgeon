// The learning engine: keys, records, levels opening, and how problems are chosen.
import assert from "node:assert/strict";
import { BANDS, pool, keyOf, factOf, record, openLevel, helpFor, choose, monsterHP, learned, mastered } from "../js/learn.js";
import { MON } from "../js/monsters.js";
import { facts, spokenProblem } from "../js/problems.js";
import { spokenLines } from "../js/lines.js";

// Keys: turnarounds share for + and ×, not for − and ÷.
assert.equal(keyOf({ op: "+", x: 4, y: 3 }), "+3,4");
assert.equal(keyOf({ op: "×", x: 8, y: 7 }), "×7,8");
assert.equal(keyOf({ op: "-", x: 9, y: 5 }), "-9,5");
const f = factOf("+3,4", () => 0.9);
assert.deepEqual([f.x, f.y, f.ans, f.q], [3, 4, 7, "3 + 4"]);
assert.equal(factOf("+3,4", () => 0.1).q, "4 + 3");
assert.equal(factOf("÷56,8").ans, 7);

// Every fact the bands ask is one of the recorded ones, so every problem has the recorded voice.
const lines = new Set(spokenLines().map((l) => l.text));
for (const band of Object.keys(BANDS)) {
  for (const p of pool(band)) for (const r of [0.1, 0.9]) assert.ok(lines.has(spokenProblem(factOf(p.key, () => r))), p.key);
}
// Sprout's first level is within 5; Apprentice's last holds the 11s and 12s.
assert.ok(pool("sprout").filter((p) => p.level === 0).every((p) => factOf(p.key).ans <= 5 || factOf(p.key).x <= 5));
assert.ok(pool("apprentice").some((p) => p.key === "×11,12" && p.level === BANDS.apprentice.levels.length - 1));
assert.ok(pool("sprout").every((p) => p.op === "+" || p.op === "-"), "Sprout is addition and subtraction");

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

// Levels open at 70% learned.
const recs = {};
assert.equal(openLevel("sprout", recs), 0);
const first = pool("sprout").filter((p) => p.level === 0);
first.slice(0, Math.ceil(first.length * 0.7)).forEach((p) => (recs[p.key] = { b: 3, n: 3, c: 3, ms: 2000, t: 0 }));
assert.equal(openLevel("sprout", recs), 1);

// Apprentice: ± within 20 runs alongside, so × 2, 5 and 10 is open from the start, and the
// × and ÷ levels after it still open in order at 70%.
{
  assert.equal(openLevel("apprentice", {}), 1);
  const r = {}, times = pool("apprentice").filter((p) => p.level === 1);
  times.slice(0, Math.ceil(times.length * 0.7) - 1).forEach((p) => (r[p.key] = { b: 3, n: 3, c: 3, ms: 2000, t: 0 }));
  assert.equal(openLevel("apprentice", r), 1, "÷ waits for 70% of × 2, 5 and 10");
  r[times[times.length - 1].key] = { b: 3, n: 3, c: 3, ms: 2000, t: 0 };
  assert.equal(openLevel("apprentice", r), 2);
  // A fresh player gets both: new ± facts and new × facts, about half each.
  const s = (() => { let x = 3; return () => ((x = (x * 16807) % 2147483647) / 2147483647); })();
  const lv = [0, 0];
  for (let i = 0; i < 400; i++) { const k = choose("apprentice", {}, { now: 0, rnd: s }); lv[pool("apprentice").find((p) => p.key === k).level]++; }
  assert.ok(lv[0] > 120 && lv[1] > 120, `± and × both come up: ${lv}`);
}

// Choosing: a fresh player only gets the first level; the retry comes back first.
const seq = (() => { let s = 1; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
for (let i = 0; i < 200; i++) {
  const k = choose("sprout", {}, { now: 0, rnd: seq });
  assert.equal(pool("sprout").find((p) => p.key === k).level, 0);
}
assert.equal(choose("sprout", {}, { now: 0, retry: "+2,3" }), "+2,3");
// Recent facts don't repeat right away.
for (let i = 0; i < 100; i++) assert.notEqual(choose("sprout", {}, { now: 0, rnd: seq, recent: ["+1,1"] }), "+1,1");
// With learning facts around, most picks are learning facts (about 60%), and box 0 comes up most.
const mixed = {};
pool("sprout").filter((p) => p.level === 0).forEach((p, i) => (mixed[p.key] = { b: i % 2 ? 0 : 2, n: 2, c: 1, ms: 2500, t: 0 }));
let learningPicks = 0, box0 = 0;
for (let i = 0; i < 1000; i++) {
  const k = choose("sprout", mixed, { now: 1, rnd: seq });
  if (mixed[k] && mixed[k].b <= 2) { learningPicks++; if (mixed[k].b === 0) box0++; }
}
assert.ok(learningPicks > 900, `all open facts are learning, so all picks are: ${learningPicks}`);
assert.ok(box0 > learningPicks / 2, `box 0 is favored: ${box0} of ${learningPicks}`);

// The monster's own operation comes first when it has facts here.
let minus = 0;
for (let i = 0; i < 1000; i++) if (choose("sprout", {}, { now: 0, rnd: seq, op: "-" })[0] === "-") minus++;
assert.ok(minus > 700, `Minustaur asks subtraction ${minus} times in 1000`);

// HP scales with what's being asked.
assert.ok(monsterHP(MON[0], "sprout", {}) >= 10);
assert.ok(monsterHP(MON[3], "apprentice", {}) < monsterHP(MON[3], "apprentice", Object.fromEntries(pool("apprentice").map((p) => [p.key, { b: 4, n: 5, c: 5, ms: 1000, t: 0 }]))),
  "HP grows as bigger facts open");
// Variety: not the same kind of problem with the same answer as the last couple.
{
  const recs = {};
  pool("sprout").filter((f) => f.level <= 2).forEach((f) => (recs[f.key] = { b: 3, n: 3, c: 3, ms: 900, t: 0 }));
  let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const asked = [];
  for (let i = 0; i < 30; i++) {
    const f = factOf(choose("sprout", recs, { now: 1, rnd, recent: [], op: "-", avoidAns: asked.slice(-2) }));
    asked.push(f.op + " " + f.ans);
  }
  for (let i = 2; i < asked.length; i++) assert.ok(asked[i] !== asked[i - 1] && asked[i] !== asked[i - 2], `${asked[i]} again at ${i}: ${asked.join(",")}`);
  // A different kind of problem with the same answer is fine.
  assert.ok(pool("sprout").some((f) => f.op === "+" && f.ans === 10 && f.level <= 2), "3 + 7 is still allowed after 17 − 7");
}
console.log(`✓ learn (Sprout ${pool("sprout").length} facts, Apprentice ${pool("apprentice").length})`);

// The captain's digit at depth 1 (app.js CAPTAIN_BIAS): answers with it come up more often, and
// not at all differently with no share.
{
  let seed = 1; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const share = (o) => { let n = 0; for (let i = 0; i < 3000; i++) if (String(factOf(choose("sprout", {}, { now: 0, rnd, recent: [], ...o })).ans).includes("3")) n++; return n / 3000; };
  const plain = share({}), biased = share({ digit: 3, digitShare: 0.35 }), off = share({ digit: 3, digitShare: 0 });
  assert.ok(biased > plain + 0.15, `the captain's digit comes up more (${plain.toFixed(2)} → ${biased.toFixed(2)})`);
  assert.ok(Math.abs(off - plain) < 0.05, "no share, no bias");
}
