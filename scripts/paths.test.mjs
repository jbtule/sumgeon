// Paths (DESIGN.md §4.3): each stratum's steps, the window of new steps, and chapters.
import assert from "node:assert/strict";
import { BANDS, pool, openSteps, openLevels, reachOf, stepFacts, stepShare, chaptersOf, WINDOW, JOIN_AT, choose, probeKey, reviewFacts, placeReviews } from "../js/learn.js";
import { WINGS, PATHS, chapterOf, megasOf, stepsOpen, stepMonsters, runFloors, openWings, upgradeProgress } from "../js/wings.js";
import { MON } from "../js/monsters.js";

const learnedRec = { b: 3, n: 1, c: 1, ms: 1000, t: 0 };
// Every level of every band is in exactly one step (review steps repeat an earlier stratum's).
{
  const where = {};
  for (const [id, path] of Object.entries(PATHS)) for (const s of path) for (const [b, L] of s.parts) {
    if (s.review) continue;
    const k = b + ":" + L;
    assert.ok(!where[k], `${k} is in ${where[k]} and ${id}: ${s.name}`);
    where[k] = id + ": " + s.name;
  }
  for (const b of Object.keys(BANDS)) BANDS[b].levels.forEach((l, L) => {
    // A band asked only as a review step (Margot-Rythm's in the Tower) counts its review step.
    const reviewed = Object.values(PATHS).some((p) => p.some((s) => s.review && s.parts.some(([x, y]) => x === b && y === L)));
    assert.ok(where[b + ":" + L] || reviewed, `${b} "${l.name}" is in no step`);
  });
  // Review steps repeat levels another stratum teaches (or a band only reviewed), never a level of
  // their own stratum.
  for (const path of Object.values(PATHS)) for (const s of path.filter((s) => s.review)) assert.ok(!s.priority && !s.ongoing, s.name);
}
// A band's levels come in its path's order, so skipping ahead (tiers, in level order) climbs the
// path; and each path's chapters go in order, 3 or 4 new steps each.
for (const [id, path] of Object.entries(PATHS)) {
  const last = {};
  path.forEach((s) => { if (s.review) return; for (const [b, L] of s.parts) { assert.ok(L > (last[b] ?? -1), `${id}: ${b} level ${L} comes after ${last[b]}`); last[b] = L; } });
  assert.ok(path.every((s, i) => !i || s.chapter >= path[i - 1].chapter), `${id}: chapters in order`);
  for (let c = 1; c <= chaptersOf(path); c++) {
    const n = path.filter((s) => s.chapter === c && !s.ongoing && !s.review).length;
    assert.ok(n >= 3 && n <= 4, `${id} chapter ${c}: ${n} new steps`);
  }
  assert.ok(path.every((s) => s.monsters.length && s.monsters.every((n) => MON.some((m) => m.n === n))), `${id}: every step has its monsters`);
  assert.ok(path.every((s) => stepFacts(s).length > 0), `${id}: every step has facts`);
}

// The window: a new player has the first WINDOW new steps open, and the ongoing ones.
const cellar = PATHS.cellar;
{
  const o = openSteps(cellar, {}, 1);
  assert.deepEqual(o.window.map((i) => cellar[i].name), ["Add and take away within 5", "Within 10", "Coins"]);
  assert.deepEqual(o.open.map((i) => cellar[i].name), ["How many, and which is more, to 5", "Add and take away within 5", "Count on, count back", "Within 10", "Coins"], "the ongoing steps open from the start");
  // The next step joins once the oldest new one is JOIN_AT learned, and not before.
  const r = {}, s1 = stepFacts(cellar[1]);
  s1.slice(0, Math.ceil(s1.length * JOIN_AT) - 1).forEach((f) => (r[f.key] = learnedRec));
  assert.equal(openSteps(cellar, r, 2).open.length, 5, "not yet");
  r[s1[s1.length - 1].key] = learnedRec;
  assert.ok(openSteps(cellar, r, 2).open.includes(5), "Make 10 joins");
  // ...but only in its chapter: chapter 1 stops before Make 10.
  assert.ok(!openSteps(cellar, r, 1).open.includes(5), "a step past the chapter never opens");
  assert.equal(stepShare(cellar[1], r) >= JOIN_AT, true);
}
// Never more than WINDOW new steps, whatever's learned, in any stratum; steps open in order.
{
  let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const path of Object.values(PATHS)) for (let t = 0; t < 60; t++) {
    const r = {}, ch = 1 + Math.floor(rnd() * chaptersOf(path)), share = rnd();
    for (const s of path) for (const f of stepFacts(s)) if (rnd() < share * rnd() * 2) r[f.key] = learnedRec;
    const o = openSteps(path, r, ch);
    const fresh = o.open.filter((i) => !path[i].ongoing && !path[i].review && stepShare(path[i], r) < JOIN_AT);
    assert.ok(fresh.length <= WINDOW, `at most ${WINDOW} new steps: ${fresh.map((i) => path[i].name)}`);
    assert.ok(o.window.length <= WINDOW);
    const main = o.open.filter((i) => !path[i].ongoing && !path[i].review);
    assert.deepEqual(main, path.map((_, i) => i).filter((i) => !path[i].ongoing && !path[i].review).slice(0, main.length), "in order");
    assert.ok(o.open.every((i) => path[i].chapter <= ch), "nothing past the chapter");
  }
}
// Saved: the most steps that ever joined stay open, even after a miss takes a fact back out.
{
  const all = Object.fromEntries(stepFacts(cellar[1]).map((f) => [f.key, learnedRec]));
  const before = openSteps(cellar, all, 2);
  assert.ok(before.joined === 4);
  assert.equal(openSteps(cellar, {}, 2, before.joined).joined, 4, "kept open");
  assert.equal(openSteps(cellar, {}, 1, before.joined).joined, 3, "but never past the chapter");
}
// A band's open levels: only the open steps', and a review step's never new.
{
  const tower = PATHS.tower, o = openSteps(tower, {}, 1);
  assert.deepEqual(openLevels(tower, o.open, "third").levels, [0, 1, 2], "all of × first");
  assert.deepEqual(openLevels(tower, o.open, "addT"), { levels: [0, 1], review: [0, 1] }, "adding within 1000 is the Tower's review");
  assert.equal(reachOf(tower, 1, "third"), 5, "chapter 1 reaches division");
  // Probes go no further than the chapter: a fluent player skips ahead to division, not to fractions.
  const r = Object.fromEntries(pool("third").filter((f) => f.level <= 4).map((f) => [f.key, learnedRec]));
  for (let i = 0; i < 50; i++) { const k = probeKey("third", r, Math.random, [], [], 4, null, reachOf(tower, 1, "third")); assert.ok(!k || pool("third").find((f) => f.key === k).level <= 5, k); }
  assert.ok(probeKey("third", r, Math.random, [], [], 4, null, reachOf(tower, 2, "third")), "a later chapter reaches further");
  // A review step's facts are never new: a fresh player's Margot-Rythm asks nothing unseen... but
  // with nothing seen at all there's nothing else to ask, so she asks them (placement places them).
  const seen = { "+321,406": { b: 1, n: 1, c: 1, ms: 9000, t: 0 } };
  for (let i = 0; i < 20; i++) assert.equal(choose("addT", seen, { now: 1, open: [0, 1], review: [0, 1] }), "+321,406");
}
// Chapters: 1 + the mega bosses beaten, saved; progress from before chapters gets one for every 5
// depths reached, so a player at depth 7 has chapter 2.
{
  const [c] = WINGS;
  assert.equal(chapterOf(c, {}), 1);
  assert.equal(chapterOf(c, { cellar: { depth: 5 } }), 1, "depth 5 reached: its mega boss isn't beaten yet");
  assert.equal(chapterOf(c, { cellar: { depth: 7 } }), 2);
  assert.equal(chapterOf(c, { cellar: { depth: 7, megas: 0 } }), 1, "once saved, the count is what's saved");
  assert.equal(chapterOf(c, { cellar: { depth: 40 } }), chaptersOf(cellar), "past the last chapter, it stays the last");
  assert.equal(megasOf({ depth: 11 }), 2);
  assert.equal(stepsOpen(c, { cellar: { depth: 7, steps: 4 } }, {}).joined, 4, "what joined stays open");
}
// Monsters arrive as their step opens: a stratum's pool is exactly its steps' monsters, a run has
// only monsters with an open step (and the boss and the rescue floor), depth 1 the newest steps'
// first, and no monster twice in a row.
{
  for (const w of WINGS) {
    const names = new Set(PATHS[w.id].flatMap((s) => s.monsters));
    assert.deepEqual([...names].sort(), [...w.pool].sort(), `${w.id}: its pool is its steps' monsters`);
  }
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const w of WINGS) {
    const path = PATHS[w.id];
    for (let t = 0; t < 40; t++) {
      const r = {}, share = rnd();
      for (const s of path) for (const f of stepFacts(s)) if (rnd() < share) r[f.key] = learnedRec;
      const o = openSteps(path, r, 1 + Math.floor(rnd() * chaptersOf(path))), avail = stepMonsters(path, o.open);
      for (const depth of [1, 2, 4, 7]) {
        const floors = runFloors(w, { captain: 5, rescued: [] }, rnd, depth, avail);
        assert.ok(floors.every((m) => m.boss || m.cursed != null || avail.includes(m.base || m.n)), `${w.id}: only monsters with an open step (${floors.map((m) => m.n)})`);
        const ns = floors.map((m) => m.base || m.n);
        assert.ok(ns.every((n, i) => !i || n !== ns[i - 1]), `${w.id}: never twice in a row`);
        if (depth === 1) assert.equal(ns[0], avail[0], "the newest step's monster first");
      }
    }
  }
  // A new K player meets them in the path's order on a first run (Plusquito first), newest first
  // after that (Trollar's coins, the window's newest step); Polly-Gon (chapter 2) not at all yet.
  const open = openSteps(cellar, {}, 1).open, avail = stepMonsters(cellar, open);
  assert.deepEqual(stepMonsters(cellar, open, true), ["Pipsqueak", "Chompers", "Plusquito", "Minustaur", "Slimelipsis", "Trollar"]);
  assert.deepEqual(avail, ["Trollar", "Plusquito", "Minustaur", "Pipsqueak", "Chompers", "Slimelipsis"]);
  assert.deepEqual(runFloors(WINGS[0], { captain: 5, rescued: [] }, () => 0, 1, avail).map((m) => m.n), ["Trollar", "Plusquito", "Cursed Zeroic", "Minustaur", "Pipsqueak", "Make-Ten Golem"]);
  assert.ok(!avail.includes("Polly-Gon"));
}
// Existing saves (the kids'): nothing is lost. Strata open stay open, depths reached count as
// chapters, and the open steps follow from what's been learned.
{
  const [c, h, m] = WINGS;
  // A kindergartner at depth 7 who opened the Hall under the old rule (60% of the Cellar's band),
  // though the paths' rule (60% of its priority steps, which include coins and shapes) hasn't.
  const recs = {};
  for (const f of pool("kinder").filter((f) => f.level <= 2)) recs[f.key] = learnedRec; // within 5, within 10, make 10
  const progress = { cellar: { boss: 6, best: 6, depth: 7, stars: [3, 3, 3, 2, 3, 3], depthStars: { 1: 15, 6: 17 } } };
  const keep = JSON.stringify(progress.cellar);
  assert.ok(!openWings({ cellar: { boss: 6, depth: 7 } }, recs, "kinder").includes("hall"), "the paths' rule alone wouldn't open the Hall");
  assert.equal(upgradeProgress(progress, recs), true);
  assert.deepEqual(openWings(progress, recs, "kinder"), ["cellar", "hall"], "the Hall stays open");
  assert.equal(chapterOf(c, progress), 2, "depth 7: chapter 2, not sent back");
  assert.deepEqual(Object.assign({}, progress.cellar, { megas: undefined }), Object.assign(JSON.parse(keep), { megas: undefined }), "nothing else changes");
  assert.equal(upgradeProgress(progress, recs), false, "only once");
  // Her open steps follow from what she's learned: within 5, within 10 and make 10 are learned, so
  // the window has moved on to coins, 10 and some more, and shapes.
  const o = stepsOpen(c, progress, recs);
  assert.deepEqual(o.window.map((i) => PATHS.cellar[i].name), ["Coins", "10 and some more", "Shapes"]);
  // A 3rd grader who played in the Mines keeps it open; a new player has nothing to upgrade.
  const p3 = { tower: { boss: 2, best: 6, depth: 3 }, mines: { best: 2 } };
  assert.equal(upgradeProgress(p3, {}), true);
  assert.ok(p3.mines.unlocked && p3.tower.unlocked && !(p3.hall || {}).unlocked);
  assert.equal(upgradeProgress({}, {}), false);
  // A stratum opened by the paths' rule, then a miss: it stays open once saved as unlocked.
  assert.ok(openWings({ cellar: { boss: 1 }, hall: { unlocked: true } }, {}, "kinder").includes("hall"));
  assert.equal(chapterOf(h, {}), 1); assert.equal(chapterOf(m, { mines: { depth: 12 } }), 3);
}
// Review steps: the Hall reviews the Cellar's facts within 10, the Mines the Hall's within 20, the
// Tower the Mines' adding and subtracting within 1000. Learned ones come back as due reviews to
// the monsters asking the stratum's band; never-seen ones never come as new, and are placed when a
// fluent player skips ahead.
{
  const hall = PATHS.hall, rv = reviewFacts(hall, "first");
  assert.ok(rv.length === pool("kinder").filter((f) => f.level <= 1).length && rv.every((f) => f.band === "kinder"));
  assert.ok(reviewFacts(PATHS.mines, "second").every((f) => f.band === "first" && f.level <= 2));
  assert.ok(PATHS.tower[0].review && PATHS.tower[0].parts.every(([b]) => b === "addT"));
  const open = openLevels(hall, openSteps(hall, {}, 1).open, "first");
  let seed = 5; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  // Never seen: none come up.
  for (let i = 0; i < 200; i++) assert.ok(!rv.some((f) => f.key === choose("first", {}, { now: 1e12, rnd, open: open.levels, review: open.review, reviews: rv })));
  // Learned long ago (due): they come up among the reviews.
  const r = Object.fromEntries(rv.map((f) => [f.key, { b: 4, n: 3, c: 3, ms: 1500, t: 0 }]));
  for (const f of pool("first").filter((f) => f.level === 0)) r[f.key] = { b: 1, n: 1, c: 1, ms: 3000, t: 1e12 };
  let n = 0;
  for (let i = 0; i < 400; i++) if (rv.some((f) => f.key === choose("first", r, { now: 1e12, rnd, open: open.levels, review: open.review, reviews: rv }))) n++;
  assert.ok(n > 40 && n < 250, `the Cellar's facts come back as reviews: ${n} of 400`);
  // A fresh 1st grader skipping ahead: the review step is placed.
  const fresh = { "+1,2": { b: 0, n: 1, c: 0, ms: 9000, t: 0 } };
  const placed = placeReviews(hall, fresh, 5, 4000);
  assert.equal(placed, rv.length - 1, "every unseen one, not one already seen");
  assert.ok(fresh["+3,4"].b === 3 && fresh["+3,4"].placed && fresh["+1,2"].b === 0);
}
console.log(`✓ paths (${Object.entries(PATHS).map(([id, p]) => `${id} ${p.length} steps in ${chaptersOf(p)} chapters`).join(", ")})`);
