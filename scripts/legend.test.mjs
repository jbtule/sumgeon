// The Legend boss (DESIGN.md §14.2): when it's due (every priority fact mastered), the final exam's
// choice of facts (every kind, mixed, weighted to the ones that took longest, none twice), and
// what's saved.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { WINGS, PATHS, bossAt, runFloors, legendFacts, legendShare, legendReady, legendDue, legendBeaten, openLegend, beatLegend, priorityFacts, LEGEND_HP, BOSS_HP } from "../js/wings.js";
import { examFacts, examKey, examRound, struggle, topBox, hpOf, BANDS } from "../js/learn.js";
import { MON, bossForm } from "../js/monsters.js";
import { traitOf, mega, hitBy, charged, flipOf } from "../js/traits.js";
import { isDrawKey } from "../js/shapes.js";
import { PHRASE, spokenLines, spriteFor } from "../js/lines.js";
import { openStore } from "../js/store.js";

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const mastered = (w) => Object.fromEntries(legendFacts(w).map((f) => [f.key, { b: 4, n: 4, c: 4, ms: 2000, t: 1 }]));

// When it's due: every priority fact (drawn shapes aside) at box 4, and only those.
for (const w of WINGS) {
  const fs = legendFacts(w), path = PATHS[w.id];
  assert.ok(fs.length > 50, `${w.id}: ${fs.length} facts to master`);
  assert.ok(fs.every((f) => !isDrawKey(f.key)), "a drawing needs a touch screen, so it isn't required");
  assert.ok(priorityFacts(w).some((f) => isDrawKey(f.key)) === fs.length < priorityFacts(w).length);
  // Only priority steps, never review steps (an earlier grade's) or the rest (time, patterns…).
  const prio = new Set(path.filter((s) => s.priority && !s.review).flatMap((s) => s.parts.map(([b, L]) => b + ":" + L)));
  assert.ok(fs.every((f) => prio.has(f.band + ":" + f.level)), `${w.id}: priority steps only`);
  const recs = mastered(w);
  assert.equal(legendShare(w, recs), 1);
  assert.ok(legendReady(w, recs) && legendDue(w, {}, recs));
  // One fact a box short (box 3, learned but not mastered): not yet.
  const short = Object.assign({}, recs, { [fs[fs.length >> 1].key]: { b: 3, n: 3, c: 3, ms: 2000, t: 1 } });
  assert.ok(!legendReady(w, short) && !legendDue(w, {}, short), `${w.id}: every fact, not most`);
  assert.ok(legendShare(w, short) > 0.99 && legendShare(w, short) < 1);
  assert.ok(!legendDue(w, {}, {}), "nothing learned: no Legend");
  assert.ok(legendDue(w, {}, {}, true), "?legend treats the stratum as mastered");
  // The other steps' facts don't hold it up.
  const others = path.filter((s) => !s.priority && !s.review);
  if (others.length) assert.ok(legendReady(w, recs), "time, patterns and the like aren't needed");
  assert.ok(topBox({ b: 4 }) && !topBox({ b: 3 }) && !topBox(null));
}

// The boss at any depth becomes its golden form when the Legend is due, with its trait and its
// mega trait, and the mega boss's HP.
for (const w of WINGS) {
  const b = MON.find((m) => m.n === w.boss);
  for (const d of [1, 3, 5, 7, 10]) {
    const L = bossAt(w, d, true);
    assert.equal(L.form, "legend"); assert.equal(L.n, bossForm(b, "legend").n); assert.ok(L.boss);
    assert.deepEqual(traitOf(L), traitOf(b), "the boss's own trait");
    assert.ok(mega(L) && L.trait2 && L.trait2.name === bossForm(b, "mega").trait2.name, "and its mega trait");
  }
  const floors = runFloors(w, { captain: 0, rescued: [1, 2, 3, 4, 5, 6, 7, 8, 9] }, rnd, 2, null, true);
  assert.equal(floors[floors.length - 1].form, "legend", "the run ends with it");
  assert.notEqual(runFloors(w, { captain: 0, rescued: [] }, rnd, 2, null, false).at(-1).form, "legend");
}
assert.equal(LEGEND_HP, BOSS_HP[3], "as much HP as a mega boss");
{
  const at = (id) => bossAt(WINGS.find((w) => w.id === id), 1, true);
  assert.equal(hitBy(at("cellar"), 7, "7", true).mult, 0.5, "Golden Golem armors up at half HP (Second wind)");
  assert.equal(hitBy(at("cellar"), 12, "12", false).mult, 2, "and smashes tens");
  assert.ok(charged(at("hall"), 3), "Golden Judy's big throws");
  assert.equal(hitBy(at("mines"), 15, "15", true).mult, 0.5, "Golden Centipede curls up");
  assert.equal(flipOf(at("tower"), { op: "×", x: 3, y: 8, ans: 24, q: "3 × 8" }).q, "8 × 3", "Golden Sigma Rex flips times facts");
}

// The exam's facts: every fact of the path's own steps (not review steps, not drawings).
for (const w of WINGS) {
  const path = PATHS[w.id], fs = examFacts(path);
  assert.equal(new Set(fs.map((f) => f.key)).size, fs.length, "each fact once");
  assert.ok(fs.every((f) => !path[f.step].review && !isDrawKey(f.key)));
  const kinds = new Set(fs.map((f) => f.step)), own = path.map((s, i) => i).filter((i) => !path[i].review);
  assert.deepEqual([...kinds].sort((a, b) => a - b), own, `${w.id}: every kind the path asks`);
}

// The Legend's HP floor: about one answer of every kind (each step's middle answer, summed), so
// the exam lasts at least about a round, even where a mega boss's HP is a single × tens answer.
for (const w of WINGS) {
  const path = PATHS[w.id], fs = examFacts(path), r = examRound(path, {});
  const steps = new Set(fs.map((f) => f.step)).size;
  assert.ok(r >= steps, `${w.id}: every kind counts (${r})`);
  const mid = (a) => a.sort((x, y) => x - y)[a.length >> 1];
  assert.ok(r > mid(fs.map((f) => f.ans)) * steps / 3, `${w.id}: about a round of answers`);
  // Only what was seen, once anything was.
  const one = { [fs[0].key]: { b: 4, n: 2, c: 2, ms: 2000, t: 1 } };
  assert.equal(examRound(path, one), fs[0].ans);
}
{
  const tower = WINGS.find((w) => w.id === "tower"), rex = MON.find((m) => m.n === tower.boss), fs = examFacts(PATHS.tower);
  assert.ok(examRound(PATHS.tower, {}) > hpOf(rex, fs, "third") * LEGEND_HP, "in the Tower the round is the bigger");
}

// Struggle: misses count most, then slowness; a fact known at once has none.
assert.equal(struggle(null, 4000), 0);
assert.ok(struggle({ b: 4, n: 1, c: 1, ms: 0 }, 4000) === 0);
assert.ok(struggle({ b: 4, n: 9, c: 6, ms: 3000 }, 4000) > struggle({ b: 4, n: 5, c: 5, ms: 7000 }, 4000), "misses count more than slowness");
assert.ok(struggle({ b: 4, n: 4, c: 4, ms: 7000 }, 4000) > struggle({ b: 4, n: 4, c: 4, ms: 2000 }, 4000), "slower is harder");

// The exam: mixed (every kind comes round before any comes twice), no fact twice, and weighted to
// the facts that took longest to learn.
for (const w of WINGS) {
  const path = PATHS[w.id], fs = examFacts(path), recs = {};
  // Every fact seen and mastered; a few in each step were hard (missed a lot and slow).
  const hard = new Set();
  for (const f of fs) recs[f.key] = { b: 4, n: 4, c: 4, ms: 0.5 * BANDS[f.band].fluentMs, t: 1 };
  const bySteps = {};
  for (const f of fs) (bySteps[f.step] ||= []).push(f);
  for (const list of Object.values(bySteps)) for (const f of list.slice(0, Math.max(1, list.length >> 4))) { hard.add(f.key); recs[f.key] = { b: 4, n: 12, c: 7, ms: 1.6 * BANDS[f.band].fluentMs, t: 1 }; }
  const steps = Object.keys(bySteps).length;
  let hardShare = 0, shareOfHard = hard.size / fs.length;
  for (let run = 0; run < 40; run++) {
    const used = [], asked = [];
    for (let i = 0; i < steps * 2; i++) {
      const e = examKey(path, recs, { used, steps: asked, rnd });
      assert.ok(e && !used.includes(e.key), "no fact twice");
      assert.ok(fs.some((f) => f.key === e.key && f.band === e.band && f.step === e.step));
      used.push(e.key); asked.push(e.step);
      if (hard.has(e.key)) hardShare++;
    }
    // Mixed: the first round asks every kind once, and so does the second.
    assert.equal(new Set(asked.slice(0, steps)).size, steps, `${w.id}: every kind once before any twice`);
    assert.equal(new Set(asked.slice(steps)).size, steps);
    for (let i = 1; i < asked.length; i++) assert.notEqual(asked[i], asked[i - 1], "never the same kind twice in a row");
  }
  hardShare /= 40 * steps * 2;
  assert.ok(hardShare > 3 * shareOfHard, `${w.id}: the hard facts come up most (${(hardShare * 100).toFixed(0)}% of the exam, ${(shareOfHard * 100).toFixed(0)}% of the facts)`);
  // It runs out rather than repeating.
  const all = [], st = [];
  for (let e; (e = examKey(path, recs, { used: all, steps: st, rnd })); ) { all.push(e.key); st.push(e.step); }
  assert.equal(all.length, fs.length, "every fact once, then none");
}
// Only facts seen are asked while there are any (an exam, not new learning); on a fresh player
// (?legend) anything.
{
  const path = PATHS.cellar, fs = examFacts(path), recs = { [fs[0].key]: { b: 4, n: 3, c: 3, ms: 2000, t: 1 }, [fs[5].key]: { b: 4, n: 3, c: 3, ms: 2000, t: 1 } };
  const a = examKey(path, recs, { rnd }), b = examKey(path, recs, { used: [a.key], steps: [a.step], rnd }), c = examKey(path, recs, { used: [a.key, b.key], rnd });
  assert.deepEqual([a.key, b.key].sort(), [fs[0].key, fs[5].key].sort());
  assert.ok(c && ![a.key, b.key].includes(c.key), "then the rest");
  assert.ok(examKey(path, {}, { rnd }), "a fresh player gets an exam too");
}

// Saving (wings[id].legend): opened stays open until beaten, even when a miss takes a fact out
// of box 4; beaten, it's done.
{
  const w = WINGS[0], recs = mastered(w), progress = {};
  assert.ok(legendDue(w, progress, recs) && !legendBeaten(w, progress));
  openLegend(progress, w.id);
  assert.equal(progress.cellar.legendOpen, true);
  const slipped = Object.assign({}, recs, { [legendFacts(w)[0].key]: { b: 0, n: 5, c: 4, ms: 2000, t: 2 } });
  assert.ok(legendDue(w, progress, slipped), "lost or slipped, it's there again next run");
  beatLegend(progress, w.id, 1234);
  assert.equal(progress.cellar.legend, 1234); assert.ok(!("legendOpen" in progress.cellar));
  assert.ok(legendBeaten(w, progress) && !legendDue(w, progress, recs) && !legendDue(w, progress, recs, true), "beaten: the usual boss again");
  beatLegend(progress, w.id, 9999);
  assert.equal(progress.cellar.legend, 1234, "the first win's time is kept");
  openLegend(progress, w.id);
  assert.ok(!progress.cellar.legendOpen, "never reopened once beaten");
  // Through the store, as the game saves it.
  const m = new Map(), ls = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; } };
  const s = openStore(ls); s.upgrade();
  s.player("default").set("wings", progress);
  assert.ok(legendBeaten(w, openStore(ls).player("default").get("wings", {})));
}

// The voice: "A legend awaits!" and "Legend!" are recorded, in the phrase sprites.
{
  const lines = spokenLines();
  for (const t of [PHRASE.legendAwaits, PHRASE.legend]) {
    const l = lines.find((x) => x.kind === "p" && x.text === t);
    assert.ok(l && l.file && spriteFor(l).startsWith("phrases-"), t);
  }
}

// The app: the Legend's exam takes the place of the usual choice, no retries on its floor, saved
// with a legendBeaten event; the nameplate's two-trait badge keeps to one line on phones.
{
  const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8"), css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  assert.ok(/examKey\(PATHS\[wing\(\)\.id\], recs/.test(app) && /forced \|\| \(exam && exam\.key\)/.test(app), "the exam picks the Legend's problems");
  assert.ok(/megaHP = hpOf\(m, .*?\) \* LEGEND_HP;\s+G\.max = G\.hp = Math\.round\(Math\.max\(megaHP, Math\.min\(2 \* megaHP, examRound\(path, recs\)\)\)/.test(app), "a mega boss's HP, up to twice that for a round of the exam");
  assert.ok(/if \(!G\.exam\) G\.retry/.test(app), "no fact twice: nothing comes back on the Legend's floor");
  assert.ok(/beatLegend\(progress, w\.id/.test(app) && /new CustomEvent\("legendBeaten"/.test(app), "saved, with the hook for the achievement");
  assert.ok(/<span class="ti">[^`]*<span class="tn">/.test(app), "a two-trait badge: icons, then the name");
  assert.ok(/@media \(max-width: 759px\)\{\.trait\.two \.tn\{display:none\}\}/.test(css), "on phones, just the icons");
}
console.log("✓ legend: when it's due, the exam, saving");
