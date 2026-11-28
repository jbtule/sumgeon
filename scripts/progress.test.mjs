// Settings → Progress (DESIGN.md §9, js/progress.js): the data the tab shows.
import assert from "node:assert/strict";
import { stepRows, stepLabel, stratumSummary, strataOrder, gridOf, gridsFor, GRIDS, kindsFor, kindOf, needsWork, factState, factText, factLabel, factDetail, fluentLimit, ago, DONE_AT, inAnyGrid, openFacts } from "../js/progress.js";
import { WINGS, PATHS, MEGA_EVERY, OPEN_AT, priorityFacts, legendFacts } from "../js/wings.js";
import { BANDS, pool, stepFacts, keyOf, JOIN_AT } from "../js/learn.js";

const cellar = WINGS[0], tower = WINGS[3], NOW = 1_800_000_000_000;
const rec = (b, extra = {}) => Object.assign({ b, n: 3, c: 3, ms: 1500, t: NOW - 3600e3 }, extra);

// A fact's state: not seen, learning (box 0–2), learned (3), mastered (4), and fluent from the
// band's fluent time (4 s in K, plus a second for each extra digit).
{
  assert.equal(factState(undefined, "+3,4").state, "new");
  assert.equal(factState({ b: 0, n: 0 }, "+3,4").state, "new");
  for (const b of [0, 1, 2]) assert.equal(factState(rec(b), "+3,4").state, "learning");
  assert.equal(factState(rec(3), "+3,4").state, "learned");
  assert.equal(factState(rec(4), "+3,4").state, "mastered");
  assert.equal(fluentLimit("+3,4"), 4000);
  assert.equal(fluentLimit("+4,8"), 5000); // 12: two digits to tap
  assert.ok(factState(rec(3, { ms: 3000 }), "+3,4").fluent);
  assert.ok(!factState(rec(3, { ms: 4500 }), "+3,4").fluent);
  assert.ok(!factState(rec(2, { ms: 1000 }), "+3,4").fluent, "a fact still being learned isn't fluent");
}

// Turnarounds share a key, so both cells of the addition and times grids show the same record.
{
  const recs = { "×7,8": rec(4), "+3,4": rec(1) };
  const times = gridOf("times", recs), add = gridOf("add", recs);
  const at = (g, r, c) => g.rows.find((x) => x.row === r).cells[g.cols.indexOf(c)];
  assert.equal(at(times, 7, 8).key, "×7,8");
  assert.equal(at(times, 8, 7).key, "×7,8");
  assert.equal(at(times, 8, 7).state, "mastered");
  assert.equal(at(times, 7, 8).text, "7 × 8");
  assert.equal(at(times, 8, 7).text, "8 × 7");
  assert.equal(at(add, 4, 3).state, "learning");
  assert.equal(at(add, 3, 4).state, "learning");
  assert.match(at(times, 8, 7).label, /^8 times 7: mastered/);
  // The grid's totals count each key once.
  assert.equal(times.mastered, 1);
  assert.equal(times.rows.length, 13);
  assert.equal(times.cols.length, 13);
  // Subtraction and division are laid out by what's taken away (the divisor) and the answer.
  const sub = gridOf("sub", { "-13,4": rec(3) }), div = gridOf("divide", { "÷56,8": rec(3) });
  assert.equal(at(sub, 4, 9).key, "-13,4");
  assert.equal(at(sub, 4, 9).state, "learned");
  assert.equal(at(div, 8, 7).key, "÷56,8");
  assert.equal(at(div, 8, 7).text, "56 ÷ 8");
  // Cells with no such fact (0 + 9 isn't asked; nothing is divided by 0) are empty.
  assert.equal(at(add, 0, 9), null);
  assert.ok(!div.rows.some((r) => r.row === 0));
  // Every key a grid shows is a fact some band asks, and is its key (keyOf) as the game records it.
  const asked = new Set(Object.keys(BANDS).flatMap((b) => pool(b).map((f) => f.key)));
  for (const g of GRIDS) for (const r of gridOf(g.id, {}).rows) for (const c of r.cells) if (c) assert.ok(asked.has(c.key), c.key);
  assert.equal(keyOf({ op: "×", x: 8, y: 7 }), "×7,8");
  // The whole times table and all the facts within 10 are on the grids.
  for (let a = 0; a <= 12; a++) for (let b = 0; b <= 12; b++) { const k = keyOf({ op: "×", x: a, y: b }); if (asked.has(k)) assert.ok(inAnyGrid(k), k); }
}

// The grids shown: addition and subtraction for a K player; all four with the Tower open (or a
// × fact seen).
{
  assert.deepEqual(gridsFor(["cellar"], {}), ["add", "sub"]);
  assert.deepEqual(gridsFor(["cellar", "hall", "mines", "tower"], {}), ["add", "sub", "times", "divide"]);
  assert.deepEqual(gridsFor(["cellar"], { "×3,4": rec(1) }), ["add", "sub", "times"]);
}

// Every other kind the open strata ask is in exactly one list, and none is on a grid too.
{
  const all = WINGS.map((w) => w.id), kinds = kindsFor(all, {}), listed = kinds.flatMap((k) => k.keys);
  assert.equal(new Set(listed).size, listed.length);
  for (const key of openFacts(all)) assert.ok(inAnyGrid(key) !== listed.includes(key), key);
  assert.ok(!kinds.some((k) => k.id === "other"), "every kind has a name");
  assert.equal(kindOf("+4,13"), "teens");
  assert.equal(kindOf("+9,23"), "two");
  assert.equal(kindOf("+264,619"), "three");
  assert.equal(kindOf("¢?q:1,0,2,2"), "coins");
  assert.equal(kindOf("○1/4,1/3"), "fractions");
  assert.equal(kindOf("○25,26"), "compare");
  // Shares: learned counts box 3 and 4; mastered box 4.
  const coins = kindsFor(["cellar"], { "¢?q:1,0,2,2": rec(3), "¢t0,1,0,0": rec(4), "¢0,1,0,0": rec(1) }).find((k) => k.id === "coins");
  assert.equal(coins.learned, 2);
  assert.equal(coins.mastered, 1);
  assert.equal(coins.seen, 3);
  // A K player's lists are the Cellar's: no times tens, no fractions.
  const k = kindsFor(["cellar"], {}).map((x) => x.id);
  assert.ok(k.includes("coins") && k.includes("more") && !k.includes("fractions") && !k.includes("tens"), k.join());
}

// Every fact reads as written, with its answer.
{
  assert.equal(factText("×7,8").text, "7 × 8 = 56");
  assert.equal(factLabel("×7,8"), "7 × 8");
  assert.equal(factText("-13,4").text, "13 − 4 = 9");
  assert.equal(factText("□+7,3").text, "7 + 3 = 10");
  assert.equal(factText("○4+3,6").text, "4 + 3 > 6");
  assert.equal(factText("≈45,10").text, "45 ≈ 50 (nearest 10)");
  for (const b of Object.keys(BANDS)) for (const f of pool(b)) {
    const t = factText(f.key).text;
    assert.ok(t && !t.includes("□") && !t.includes("undefined") && !t.includes("NaN"), `${f.key}: ${t}`);
  }
}

// Step states along a path: learned (70% of its facts learned), now (open), later (not yet).
{
  const fresh = stepRows(cellar, {}, {});
  assert.equal(fresh.length, PATHS.cellar.length);
  assert.ok(fresh.every((r) => r.share === 0 && r.seen === 0));
  // The first chapter's steps are open at the start (two ongoing and three new: the window);
  // chapter 2's aren't.
  assert.deepEqual(fresh.map((r) => r.state), ["now", "now", "now", "now", "now", "later", "later", "later", "later"]);
  assert.ok(fresh[0].ongoing && fresh[0].priority && !fresh[2].priority);
  // Learn all of "Add and take away within 5": learned, with its share and counts.
  const recs = {};
  for (const f of stepFacts(PATHS.cellar[1])) recs[f.key] = rec(3);
  const rows = stepRows(cellar, {}, recs);
  assert.equal(rows[1].state, "learned");
  assert.equal(rows[1].share, 1);
  assert.equal(rows[1].learned, rows[1].total);
  assert.equal(rows[1].mastered, 0);
  // Just under DONE_AT is still in progress.
  const fs = stepFacts(PATHS.cellar[3]), part = {};
  fs.slice(0, Math.ceil(fs.length * DONE_AT) - 1).forEach((f) => { part[f.key] = rec(3); });
  assert.equal(stepRows(cellar, {}, part)[3].state, "now");
  // Chapter 2 opens with the mega boss beaten: its steps join as the window makes room.
  const ch2 = {};
  for (const i of [0, 1, 2, 3, 4]) for (const f of stepFacts(PATHS.cellar[i])) ch2[f.key] = rec(3);
  assert.equal(stepRows(cellar, {}, ch2)[5].state, "later", "chapter 1 still");
  assert.equal(stepRows(cellar, { cellar: { megas: 1 } }, ch2)[5].state, "now");
  assert.ok(JOIN_AT < DONE_AT);
  // The Hall's review step is open from the start, and marked.
  const hall = stepRows(WINGS[1], {}, {});
  assert.ok(hall[0].review && hall[0].state === "now");
  // The words: an open step is "Up next" until it's been asked, then "Up now".
  assert.ok(fresh.filter((r) => r.state === "now").every((r) => stepLabel(r) === "Up next"), "a new player's open steps are up next");
  const asked = {};
  asked[stepFacts(PATHS.cellar[3])[0].key] = rec(1);
  assert.equal(stepLabel(stepRows(cellar, {}, asked)[3]), "Up now", "asked once: up now");
  assert.deepEqual([stepLabel(rows[1]), stepLabel(fresh[6])], ["Learned ✓", "Not started"]);
}

// Above each path: the chapter and the next mega boss, the next stratum, the Legend.
{
  const s = stratumSummary(cellar, {}, {}, ["cellar"]);
  assert.equal(s.chapter, 1);
  assert.equal(s.chapters, 2);
  assert.equal(s.nextMega, MEGA_EVERY);
  assert.deepEqual(s.next, { name: "The Balance Hall", open: false, share: 0, need: OPEN_AT, boss: false });
  assert.equal(s.legend.state, "locked");
  const later = stratumSummary(cellar, { cellar: { megas: 1, boss: 2, depth: 7 } }, {}, ["cellar", "hall"]);
  assert.equal(later.chapter, 2);
  assert.equal(later.nextMega, 2 * MEGA_EVERY);
  assert.equal(later.deepest, 7);
  assert.ok(later.next.open && later.next.boss);
  // The next stratum's share is of the priority steps.
  const half = {};
  priorityFacts(cellar).slice(0, Math.floor(priorityFacts(cellar).length / 2)).forEach((f) => { half[f.key] = rec(3); });
  assert.ok(Math.abs(stratumSummary(cellar, {}, half, ["cellar"]).next.share - 0.5) < 0.01);
  // The Legend: open once the priority facts are mastered, beaten once won.
  const all = {};
  for (const f of legendFacts(cellar)) all[f.key] = rec(4);
  assert.equal(stratumSummary(cellar, {}, all, ["cellar"]).legend.state, "open");
  assert.equal(stratumSummary(cellar, {}, all, ["cellar"]).legend.share, 1);
  assert.equal(stratumSummary(cellar, { cellar: { legend: NOW } }, all, ["cellar"]).legend.state, "beaten");
  // The Forge is last: no next stratum.
  assert.equal(stratumSummary(WINGS[4], {}, {}, ["forge"]).next, null);
  assert.equal(stratumSummary(tower, {}, {}, ["tower"]).next.name, "The Fraction Forge");
  // The current stratum comes first.
  assert.deepEqual(strataOrder(["cellar", "hall", "mines"], "hall").map((w) => w.id), ["hall", "cellar", "mines"]);
}

// Needs work: the most missed (by misses, then rate), without the ones since mastered; the
// slowest learned facts over their fluent time.
{
  const recs = {
    "×7,8": { b: 0, n: 6, c: 2, ms: 5000, t: NOW },     // 4 misses
    "×6,7": { b: 1, n: 4, c: 1, ms: 5000, t: NOW },     // 3 misses of 4
    "×6,8": { b: 2, n: 10, c: 7, ms: 3000, t: NOW },    // 3 misses of 10
    "×4,9": { b: 4, n: 9, c: 3, ms: 2000, t: NOW },     // 6 misses, but mastered since
    "×3,9": { b: 3, n: 5, c: 5, ms: 9000, t: NOW },     // learned, slow
    "×3,8": { b: 4, n: 5, c: 5, ms: 6000, t: NOW },     // mastered, a bit slow
    "×2,9": { b: 3, n: 5, c: 5, ms: 2000, t: NOW },     // learned, fluent
    "×2,8": { b: 2, n: 3, c: 3, ms: 9000, t: NOW },     // still learning: not "slow"
    "old": { b: 0, n: 5, c: 0, ms: 0, t: NOW }          // no such fact any more
  };
  const { missed, slow } = needsWork(recs);
  assert.deepEqual(missed.map((m) => m.key), ["×7,8", "×6,7", "×6,8", "×2,8"].filter((k) => recs[k].n > recs[k].c));
  assert.equal(missed[0].misses, 4);
  assert.deepEqual(slow.map((s) => s.key), ["×3,9", "×3,8"]);
  assert.ok(slow[0].over > 1);
  // Up to `limit` each.
  const many = {};
  for (let a = 2; a <= 12; a++) many[keyOf({ op: "×", x: a, y: 7 })] = { b: 0, n: 3, c: 1, ms: 0, t: NOW };
  assert.equal(needsWork(many).missed.length, 8);
  assert.equal(needsWork(many, 3).missed.length, 3);
  assert.deepEqual(needsWork({}), { missed: [], slow: [] });
}

// A fact's details.
{
  const d = factDetail("×7,8", { b: 3, n: 7, c: 5, ms: 3240, t: NOW - 2 * 86400e3 }, NOW);
  assert.equal(d.text, "7 × 8 = 56");
  assert.equal(d.seen, 7);
  assert.equal(d.right, 5);
  assert.equal(d.missed, 2);
  assert.equal(d.avg, "3.2 s");
  assert.equal(d.box, 3);
  assert.equal(d.state, "learned");
  assert.equal(d.last, "2 days ago");
  const none = factDetail("+3,4", undefined, NOW);
  assert.equal(none.state, "new");
  assert.equal(none.last, null);
  assert.equal(none.avg, null);
  assert.equal(ago(30e3), "just now");
  assert.equal(ago(5 * 60e3), "5 minutes ago");
  assert.equal(ago(3 * 3600e3), "3 hours ago");
  assert.equal(ago(30 * 3600e3), "yesterday");
  assert.equal(ago(21 * 86400e3), "3 weeks ago");
}

console.log("✓ progress: step states, grids, needs work, fact details");
