// Paths (DESIGN.md §4.3): each stratum's steps, the window of new steps, and chapters.
import assert from "node:assert/strict";
import { BANDS, pool, openSteps, openLevels, reachOf, stepFacts, stepShare, chaptersOf, WINDOW, JOIN_AT, choose, probeKey } from "../js/learn.js";
import { WINGS, PATHS, chapterOf, megasOf, stepsOpen, stepMonsters, runFloors } from "../js/wings.js";
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
console.log(`✓ paths (${Object.entries(PATHS).map(([id, p]) => `${id} ${p.length} steps in ${chaptersOf(p)} chapters`).join(", ")})`);
