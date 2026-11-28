// Paths (DESIGN.md §4.3): each stratum's steps, the window of new steps, and chapters.
import assert from "node:assert/strict";
import { BANDS, pool, openSteps, openLevels, reachOf, stepFacts, stepShare, chaptersOf, WINDOW, JOIN_AT, choose, probeKey, reviewFacts, placeReviews, STUCK_RUNS, STUCK_SEEN, waitFrom, waitRun } from "../js/learn.js";
import { WINGS, PATHS, chapterOf, megasOf, stepsOpen, stepMonsters, newMonsters, runFloors, openWings, NEW_WEIGHT } from "../js/wings.js";
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
  assert.deepEqual(o.window.map((i) => cellar[i].name), ["Add and take away within 5", "Within 10", "Make 10"]); // Coins come last in K (chapter 2)
  assert.deepEqual(o.open.map((i) => cellar[i].name), ["How many, and which is more, to 5", "Add and take away within 5", "Count on, count back", "Within 10", "Make 10"], "the ongoing steps open from the start");
  // The next step joins once the oldest new one is JOIN_AT learned, and not before.
  const r = {}, s1 = stepFacts(cellar[1]);
  s1.slice(0, Math.ceil(s1.length * JOIN_AT) - 1).forEach((f) => (r[f.key] = learnedRec));
  // (Chapter 2's ongoing step, Rulerpillar's longer or shorter, opens with it.)
  const ten = cellar.findIndex((s) => s.name === "10 and some more"), len = cellar.findIndex((s) => s.name === "Longer or shorter");
  assert.equal(openSteps(cellar, r, 2).open.length, 6, "not yet");
  assert.ok(openSteps(cellar, r, 2).open.includes(len) && !openSteps(cellar, r, 1).open.includes(len), "an ongoing step opens with its chapter");
  r[s1[s1.length - 1].key] = learnedRec;
  assert.ok(openSteps(cellar, r, 2).open.includes(ten), "10 and some more joins");
  // ...but only in its chapter: chapter 1 stops before it.
  assert.ok(!openSteps(cellar, r, 1).open.includes(ten), "a step past the chapter never opens");
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
  assert.deepEqual(openLevels(tower, o.open, "addT"), { levels: [0, 1], review: [0, 1], steps: [] }, "adding within 1000 is the Tower's review (never new: no steps to take new facts from)");
  assert.equal(reachOf(tower, 1, "third"), 5, "chapter 1 reaches division");
  // Probes go no further than the chapter: a fluent player skips ahead to division, not to fractions.
  const r = Object.fromEntries(pool("third").filter((f) => f.level <= 4).map((f) => [f.key, learnedRec]));
  for (let i = 0; i < 50; i++) { const k = probeKey("third", r, Math.random, [], [], 4, null, reachOf(tower, 1, "third")); assert.ok(!k || pool("third").find((f) => f.key === k).level <= 5, k); }
  assert.ok(probeKey("third", r, Math.random, [], [], 4, null, reachOf(tower, 2, "third")), "a later chapter reaches further");
  // A review step asks only facts already seen once there are enough of them (REVIEW_MIN). With
  // fewer, it practises the rest of its level too, so one seen fact isn't asked over and over
  // (on the iPhone, a 3rd grader got 266 + 302 every time).
  const seen = { "+321,406": { b: 1, n: 1, c: 1, ms: 9000, t: 0 } };
  // Seeded, with the recent problems kept out as the game does (so it's the same every run).
  let sd = 9; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const asked1 = new Set(); let rec = [];
  for (let i = 0; i < 40; i++) { const k = choose("addT", seen, { now: 1, rnd, recent: rec, open: [0, 1], review: [0, 1] }); asked1.add(k); rec = [k].concat(rec).slice(0, 12); }
  assert.ok(asked1.size > 5, "a thin review practises its level");
  const many = Object.fromEntries(pool("addT").slice(0, 12).map((f) => [f.key, { b: 3, n: 2, c: 2, ms: 3000, t: 0 }]));
  for (let i = 0; i < 40; i++) assert.ok(many[choose("addT", many, { now: 1e12, rnd, open: [0, 1], review: [0, 1] })], "with enough seen, only seen facts");
}
// Chapters: 1 + the mega bosses beaten, saved; everyone starts at chapter 1 (dungeon version 6
// started runs over), however deep the saved depth.
{
  const [c] = WINGS;
  assert.equal(chapterOf(c, {}), 1);
  assert.equal(chapterOf(c, { cellar: { depth: 7 } }), 1, "no chapter from depth alone");
  assert.equal(chapterOf(c, { cellar: { depth: 7, megas: 1 } }), 2);
  assert.equal(chapterOf(c, { cellar: { megas: 9 } }), chaptersOf(cellar), "past the last chapter, it stays the last");
  assert.equal(megasOf({ depth: 11 }), 0);
  assert.equal(stepsOpen(c, { cellar: { steps: 4, megas: 1 } }, {}).joined, 4, "what joined stays open");
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
  // A new K player meets them in the path's order on a first run, newest first after that (Make 10's
  // Plusquito, the window's newest step); Polly-Gon and Trollar (chapter 2: shapes, and coins, which
  // K learns near the end of the year) not at all yet.
  const open = openSteps(cellar, {}, 1).open, avail = stepMonsters(cellar, open);
  assert.deepEqual(stepMonsters(cellar, open, true), ["Pipsqueak", "Chompers", "Plusquito", "Minustaur", "Slimelipsis"]);
  assert.deepEqual(avail, ["Plusquito", "Minustaur", "Pipsqueak", "Chompers", "Slimelipsis"]);
  assert.deepEqual(runFloors(WINGS[0], { captain: 5, rescued: [] }, () => 0, 1, avail).map((m) => m.n), ["Plusquito", "Minustaur", "Cursed Zeroic", "Pipsqueak", "Chompers", "Make-Ten Golem"]);
  assert.ok(!avail.includes("Polly-Gon") && !avail.includes("Trollar"));
}
// The kids' saves after the reset (dungeon version 6): runs start over at chapter 1, but what's
// been learned is kept, so the open steps follow from it, and the steps they already know join and
// are done at once.
{
  const [c] = WINGS;
  const recs = {};
  for (const f of pool("kinder").filter((f) => f.level <= 2)) recs[f.key] = learnedRec; // within 5, within 10, make 10
  // Chapter 1: within 5, within 10 and make 10 learned, so nothing is new (coins wait for chapter 2,
  // as K learns them near the end of the year); after the first mega boss, chapter 2's three.
  assert.deepEqual(stepsOpen(c, {}, recs).window.map((i) => PATHS.cellar[i].name), []);
  assert.deepEqual(stepsOpen(c, { cellar: { megas: 1 } }, recs).window.map((i) => PATHS.cellar[i].name), ["10 and some more", "Shapes", "Coins"]);
  // A stratum opened stays open once saved as unlocked, even after a miss.
  assert.ok(openWings({ cellar: { boss: 1 }, hall: { unlocked: true } }, {}, "kinder").includes("hall"));
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
// A step can't hold its place in the window for ever (learn.js waitRun, STUCK_RUNS). Saved by
// name, so each path's window steps have names of their own.
for (const [id, path] of Object.entries(PATHS)) {
  const names = path.filter((s) => !s.ongoing && !s.review).map((s) => s.name);
  assert.equal(new Set(names).size, names.length, `${id}: step names are unique`);
}
{
  // The Hall at chapter 3, as a player saw it: chapter 1 and the equal sign learned, and three new
  // steps in the window: comparing (Chompers only), tens and two-digit adding.
  const hall = PATHS.hall, at = (n) => hall.findIndex((s) => s.name === n), r = {};
  for (const s of hall) if (s.chapter === 1 || s.name === "The equal sign") for (const f of stepFacts(s)) r[f.key] = learnedRec;
  const cmp = at("Compare with < = >"), tens = at("Add and subtract tens"), two = at("Add two-digit numbers"), shapes = at("Shapes");
  const o = openSteps(hall, r, 3);
  assert.deepEqual(o.window, [cmp, tens, two], "comparing holds a place");
  assert.ok(!o.open.includes(shapes) && o.stuck.length === 0, "chapter 3 waits");
  assert.deepEqual(openSteps(hall, r, 3, 0, { [hall[cmp].name]: STUCK_RUNS - 1 }).window, [cmp, tens, two], "not yet stuck");
  const u = openSteps(hall, r, 3, 0, { [hall[cmp].name]: STUCK_RUNS });
  assert.deepEqual(u.window, [tens, two, shapes], "stuck: it stops counting, and the next step joins");
  assert.deepEqual(u.stuck, [cmp], "the stuck step is listed");
  assert.ok(u.open.includes(cmp), "and stays open");
  assert.equal(u.joined, o.joined + 1);
  assert.ok(newMonsters(hall, u).includes("Chompers") && newMonsters(hall, u).includes("Polly-Gon"), "a stuck step's monsters still come up more");
  // Once it's JOIN_AT learned it's simply done, stuck or not.
  const r2 = Object.assign({}, r);
  for (const f of stepFacts(hall[cmp])) r2[f.key] = learnedRec;
  const d = openSteps(hall, r2, 3, 0, { [hall[cmp].name]: STUCK_RUNS });
  assert.deepEqual(d.stuck, [], "learned: not stuck");
  // A step that has had its chances (STUCK_SEEN of its facts seen) isn't stuck, however long its
  // monster has been away: it's being learned, slowly, and keeps its place.
  const r3 = Object.assign({}, r), cf = stepFacts(hall[cmp]);
  cf.slice(0, Math.ceil(cf.length * STUCK_SEEN)).forEach((f) => (r3[f.key] = { b: 1, n: 2, c: 1, ms: 3000, t: 0 }));
  assert.deepEqual(openSteps(hall, r3, 3, 0, { [hall[cmp].name]: STUCK_RUNS + 5 }).window, [cmp, tens, two], "practised: not stuck");
  cf.slice(1, Math.ceil(cf.length * STUCK_SEEN)).forEach((f) => delete r3[f.key]);
  assert.deepEqual(openSteps(hall, r3, 3, 0, { [hall[cmp].name]: STUCK_RUNS }).stuck, [cmp], "one fact seen: still hardly had a chance");
  // The window never holds more than WINDOW that count, and a stuck one never closes.
  assert.ok(u.window.length <= WINDOW);
  // waitRun: a new step none of whose monsters came up in the run has waited a run; one whose
  // monster came, or one learned since, hasn't.
  const from = waitFrom(hall, o.window);
  assert.deepEqual(from, [hall[cmp].name, hall[tens].name, hall[two].name]);
  const met = ["Quizard", "Equal Twins", "Cursed Onesie", "Plusquito", "Triceraplus", "Judo Judy"];
  const w = waitRun(hall, from, met, r, { [hall[cmp].name]: 1 });
  assert.deepEqual(w, { [hall[cmp].name]: 2, [hall[tens].name]: 1 }, "no Chompers, no Haberhasher: comparing and tens waited; Plusquito asks two-digit adding");
  assert.deepEqual(waitRun(hall, from, met, r2, {}), { [hall[tens].name]: 1 }, "a learned step never waits");
  assert.deepEqual(waitRun(hall, from, met.concat("Chompers", "Haberhasher"), r, {}), {}, "all their monsters came");
  // In the saved progress, through stepsOpen.
  assert.deepEqual(stepsOpen(WINGS.find((x) => x.id === "hall"), { hall: { megas: 2, waits: { [hall[cmp].name]: STUCK_RUNS } } }, r).stuck, [cmp]);
}
// Deeper floors draw the new steps' monsters NEW_WEIGHT times as often (runFloors' favor), with the
// variety rules kept, the rescue floor and the boss untouched, and depth 1 as it was.
{
  const hall = WINGS.find((w) => w.id === "hall"), path = PATHS.hall, team = { captain: 5, rescued: [] };
  const avail = stepMonsters(path, path.map((_, i) => i)), favor = ["Chompers"];
  // (mulberry32: a seeded generator good enough for counting)
  let seed = 11; const rnd = () => { let t = (seed = (seed + 0x6d2b79f5) | 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // Counted on the first floor (each floor's draw is weighted; a monster can't come twice in a run,
  // so over a whole run it's less than double).
  const count = (fav) => {
    let n = 0, runs = 0;
    for (let t = 0; t < 10000; t++) {
      const fl = runFloors(hall, team, rnd, 3, avail, false, fav), names = fl.map((m) => m.base || m.n);
      assert.ok(fl[2].cursed != null, "the rescue floor");
      assert.ok(fl[fl.length - 1].boss, "the boss");
      const drawn = names.slice(0, -1).filter((_, i) => i !== 2);
      assert.equal(new Set(drawn).size, drawn.length, "none twice in a run while there are others");
      n += drawn[0] === "Chompers"; runs += drawn.includes("Chompers");
    }
    return [n, runs];
  };
  const [plain, plainRuns] = count(null), [more, moreRuns] = count(favor);
  assert.ok(more > plain * 1.6 && more < plain * 2.2, `Chompers weighs ${NEW_WEIGHT} to the others' 1 on a floor (2/15 against 1/14 of the Hall's 14): ${plain} → ${more}`);
  assert.ok(moreRuns > plainRuns * 1.3, `and in more runs: ${plainRuns} → ${moreRuns}`);
  // Without favor the draw is exactly as before (an even draw), and depth 1 ignores it.
  assert.deepEqual(runFloors(hall, team, () => 0.5, 3, avail, false, []).map((m) => m.n), runFloors(hall, team, () => 0.5, 3, avail).map((m) => m.n));
  assert.deepEqual(runFloors(hall, team, () => 0.5, 1, avail, false, favor).map((m) => m.n), runFloors(hall, team, () => 0.5, 1, avail).map((m) => m.n));
}
console.log(`✓ paths (${Object.entries(PATHS).map(([id, p]) => `${id} ${p.length} steps in ${chaptersOf(p)} chapters`).join(", ")})`);
