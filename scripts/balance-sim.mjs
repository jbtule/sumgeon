// Balance check, not a test: simulates players through each grade stratum with the game's own
// learning rules and its path (DESIGN.md §4.3): the window of new steps (learn.js openSteps),
// chapters opened by the mega boss every 5 depths, each floor's monster drawn from the open steps
// (wings.js runFloors), choose with each monster's kinds, operation and open levels, the review
// steps, placement, skipping ahead along the path, and real fights (monster HP by depth and floor,
// the boss powering up, crits after 3 in a row). A simulated player wins every run and goes deeper
// each time, as a kid would. It prints how many runs it takes to learn 60% of the stratum's
// priority steps (which, with the boss beaten, opens the next one), when each chapter's first step
// joins, and how many steps are open at most. Target: a fluent player well inside the second
// chapter; a learner never skips, and never has more than three new steps.
// Run: node scripts/balance-sim.mjs [stratum]
import { BANDS, choose, factOf, record, probeKey, tierOf, skipTo, SKIP_PROBES, SKIP_WINDOW, MAX_LEAP, fluentTime, monsterHP, RECENT, drawHit, openLevels, reachOf, chaptersOf, reviewFacts, placeReviews, stepShare, JOIN_AT } from "../js/learn.js";
import { WINGS, depthHP, depthScale, runFloors, bandOf, learnedShare, OPEN_AT, PATHS, stepsOpen, stepMonsters, bossStage, BOSS_HP, MEGA_EVERY } from "../js/wings.js";
import { asks } from "../js/traits.js";

const MAX_RUNS = 40;
function trial(wing, seed, { slip = 0.05, think = [1.2, 2.6], tap = [0.5, 0.9], missing = 1.0 } = {}) {
  let s = seed; const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const recs = {}, flows = {}, flowOf = (bk) => flows[bk] || (flows[bk] = { fluent: 0, cool: 0, hist: [], on: false, leap: 1 });
  const path = PATHS[wing.id], prog = { [wing.id]: { boss: 0, best: 0, megas: 0, steps: 0 } }, p = prog[wing.id];
  const chapterAt = {}, out = { run: 99, chapters: chapterAt, maxNew: 0 };
  let now = 0, recent = [], avoid = [], run = 0;
  const keep = () => { const o = stepsOpen(wing, prog, recs); if (o.joined > p.steps) out.maxNew = Math.max(out.maxNew, o.window.length); p.steps = Math.max(p.steps, o.joined);
    for (const i of o.open) { const c = path[i].chapter; if (!(c in chapterAt)) chapterAt[c] = run; } return o; };
  while (run < MAX_RUNS) {
    run++;
    let streak = 0;
    const depth = run, avail = stepMonsters(path, keep().open, !p.best);
    const floors = runFloors(wing, { captain: 5, rescued: [] }, rnd, depth, avail);
    floors.forEach((m, i) => {
      const bk = bandOf(wing, m), B = BANDS[bk].fluentMs, f = flowOf(bk), kinds = asks(m), ch = Math.min(chaptersOf(path), 1 + p.megas);
      const lv = () => openLevels(path, keep().open, bk), reviews = bk === wing.band ? reviewFacts(path, bk) : null;
      let hp = Math.round(monsterHP(m, bk, recs, lv().levels) * depthScale(i, floors.length) * depthHP(depth) * (m.boss ? BOSS_HP[bossStage(depth)] : 1));
      for (let guard = 0; hp > 0 && guard < 80; guard++) {
        const op = m.op === "mix" || bk !== wing.band ? null : m.op;
        const probe = f.on && f.cool <= 0 ? probeKey(bk, recs, rnd, recent, avoid, f.leap, kinds, reachOf(path, ch, bk)) : null;
        const o = lv(), key = probe || choose(bk, recs, { now, rnd, recent, op, asks: kinds, avoidAns: avoid, depth, open: o.levels, review: o.review, reviews });
        const fact = factOf(key, rnd), digits = String(fact.ans).length, hid = m.blank || fact.blank;
        const ms = 1000 * (think[0] + rnd() * (think[1] - think[0]) + (hid ? missing : 0) + digits * (tap[0] + rnd() * (tap[1] - tap[0])) + 0.3);
        const ok = rnd() > slip, limit = fluentTime(B, fact.sym || fact.ans), fluent = ok && ms < limit;
        recs[key] = record(recs[key], { ok, ms, hinted: false, now, fluentMs: limit });
        if (probe) {
          f.hist = [fluent].concat(f.hist).slice(0, SKIP_WINDOW);
          if (fluent && f.hist.filter(Boolean).length >= SKIP_PROBES) { skipTo(bk, recs, tierOf(bk, key), now, B); if (bk === wing.band) placeReviews(path, recs, now, B); f.hist = []; f.leap = Math.min(MAX_LEAP, f.leap * 2); }
          else if (f.hist.filter((x) => !x).length >= 2) { f.cool = 3; f.hist = []; f.on = false; f.leap = 1; }
        }
        f.fluent = fluent ? f.fluent + 1 : 0; if (f.fluent >= 2) f.on = true; f.cool--;
        recent = [key].concat(recent).slice(0, RECENT); avoid = [fact.op + " " + fact.ans].concat(avoid).slice(0, 2);
        now += 7000;
        keep();
        // (A drawn shape hits for its strand's typical answer.)
        if (ok) { streak++; const hit = fact.draw ? drawHit(bk) : m.blank && !fact.blank && "+-×÷".includes(fact.op) ? Math.max(1, Math.min(fact.x, fact.y)) : fact.ans; hp -= Math.max(1, hit) * (streak >= 3 ? 2 : 1) * 1.1; }
        else streak = 0;
      }
    });
    // The run's won: the boss beaten, a mega boss every 5 depths opening the next chapter.
    p.boss++; p.best = 6;
    if (depth % MEGA_EVERY === 0) p.megas = Math.max(p.megas, depth / MEGA_EVERY);
    keep();
    if (out.run === 99 && learnedShare(wing, recs) >= OPEN_AT) out.run = run;
  }
  return out;
}
const PLAYERS = {
  "fluent": {},
  "slower, sloppier fluent": { think: [1.8, 3.2], slip: 0.08 },
  "fluent on some (2–5 s, 12% wrong)": { think: [2, 5], slip: 0.12 },
  "learner (3–9 s, 20% wrong)": { think: [3, 9], slip: 0.2 }
};
const only = process.argv[2];
const med = (xs) => { const s = xs.slice().sort((a, b) => a - b); return s[s.length >> 1]; };
for (const wing of WINGS.filter((w) => !only || w.id === only)) {
  const path = PATHS[wing.id];
  console.log(`\n${wing.name} (${BANDS[wing.band].label}: ${path.length} steps in ${chaptersOf(path)} chapters)`);
  for (const [name, o] of Object.entries(PLAYERS)) {
    const n = name.startsWith("learner") || name.startsWith("fluent on") ? 20 : 40;
    const runs = Array.from({ length: n }, (_, i) => trial(wing, i * 7919 + 1, o)), r = runs.map((x) => x.run).sort((a, b) => a - b);
    const ch = [...Array(chaptersOf(path))].map((_, c) => { const at = runs.map((x) => x.chapters[c + 1] ?? 99); return `ch${c + 1} run ${med(at) === 99 ? "never" : med(at)}`; }).join(", ");
    console.log(`  ${name}: 60% priority in median ${r[n >> 1] === 99 ? "never" : r[n >> 1]} runs, range ${r[0]}–${r[n - 1] === 99 ? "never" : r[n - 1]} (99 = not within ${MAX_RUNS}); chapters joined: ${ch}; new steps when one joins, at most ${Math.max(...runs.map((x) => x.maxNew))}`);
  }
}
