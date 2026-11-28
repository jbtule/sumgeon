// Balance check, not a test: simulates players through each grade stratum with the game's own
// learning rules and its path (DESIGN.md §4.3): the window of new steps (learn.js openSteps),
// chapters opened by the mega boss every 5 depths, each floor's monster drawn from the open steps
// (wings.js runFloors, the new steps' monsters favored), a step whose monsters keep missing its
// runs stuck and out of the window (learn.js waitRun), choose with each monster's kinds, operation and open levels, the review
// steps, placement, skipping ahead along the path, and real fights (monster HP by depth and floor,
// the boss powering up, crits after 3 in a row). A simulated player wins every run and goes deeper
// each time, as a kid would. It prints how many runs it takes to learn 60% of the stratum's
// priority steps (which, with the boss beaten, opens the next one), when each chapter's first step
// joins and when all its new steps have, how many steps are open at most (and with stuck ones),
// and how many steps got stuck. Target: a fluent player well inside the second chapter; a learner
// never skips, and never has more than three new steps in the window.
// Long written work (a 5-digit sum in columns, 27 × 23, 936 ÷ 3) takes longer than a fact from
// memory, so each answer adds the work it takes (workS), scaled to the player's speed; --flat
// leaves it out (the model before 2026-11-28). It also prints, for each stratum, how late the
// path's steps start (the runs from a step joining to its first problem) and the share of the
// priority steps learned by run 10.
// Run: node scripts/balance-sim.mjs [stratum] [--flat] [--steps] [--watch=<step name>] [--no-favor] [--no-unstick]
import { BANDS, choose, factOf, record, probeKey, tierOf, skipTo, SKIP_PROBES, SKIP_WINDOW, MAX_LEAP, fluentTime, fluentFor, monsterHP, RECENT, drawHit, openLevels, reachOf, chaptersOf, reviewFacts, placeReviews, stepShare, stepSeen, stepFacts, JOIN_AT, waitFrom, waitRun, STUCK_RUNS } from "../js/learn.js";
import { WINGS, depthHP, depthScale, runFloors, bandOf, learnedShare, OPEN_AT, PATHS, stepsOpen, stepMonsters, newMonsters, bossStage, BOSS_HP, MEGA_EVERY } from "../js/wings.js";
import { asks } from "../js/traits.js";

const MAX_RUNS = 40;
const FLAT = process.argv.includes("--flat");
// --no-favor: deeper floors draw every open step's monster evenly; --no-unstick: a new step holds
// its place in the window however long it waits (the rules before 2026-11-28), to compare.
const FAVOR = !process.argv.includes("--no-favor"), UNSTICK = !process.argv.includes("--no-unstick");
// Seconds of written work for a fluent player beyond recalling and tapping: two a column past two
// for + and −, 2.5 a digit for a one-digit × a bigger number, 14 for two-digit × two-digit, three
// a digit of the dividend for a quotient past 10, three for a two-step expression.
const digitsOf = (n) => String(Math.abs(Math.round(n))).length;
export function workS(f) {
  if (FLAT || !f) return 0;
  if ((f.op === "+" || f.op === "-") && typeof f.x === "number" && typeof f.y === "number") return 2 * Math.max(0, digitsOf(Math.max(f.x, f.y)) - 2);
  if (f.op === "×" && typeof f.x === "number" && typeof f.y === "number") {
    const round = (n) => n < 10 || n % 10 === 0;
    if (f.x >= 10 && f.y >= 10 && !round(f.x) && !round(f.y)) return 14;
    const big = Math.max(f.x, f.y), small = Math.min(f.x, f.y);
    return small < 10 && !round(big) ? 2.5 * digitsOf(big) : 0;
  }
  if ((f.op === "÷" || f.op === "R") && (f.quo ?? f.ans) >= 10) return 3 * digitsOf(f.x);
  if (f.op === "E") return 3;
  return 0;
}
function trial(wing, seed, { slip = 0.05, think = [1.2, 2.6], tap = [0.5, 0.9], missing = 1.0 } = {}) {
  let s = seed; const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const recs = {}, flows = {}, flowOf = (bk) => flows[bk] || (flows[bk] = { fluent: 0, cool: 0, hist: [], on: false, leap: 1 });
  const path = PATHS[wing.id], prog = { [wing.id]: { boss: 0, best: 0, megas: 0, steps: 0, waits: {} } }, p = prog[wing.id];
  const chapterAt = {}, out = { run: 99, chapters: chapterAt, maxNew: 0, joinAt: {}, seenAt: {}, at10: 0, at15: 0, stuck: 0, stuckSet: new Set() };
  const speed = (think[0] + think[1]) / 2 / 1.9;
  let now = 0, recent = [], avoid = [], run = 0;
  const keep = () => { const o = stepsOpen(wing, prog, recs); out.maxAll = Math.max(out.maxAll || 0, o.window.length + o.stuck.length); for (const i of o.stuck) out.stuckSet.add(i); out.stuck = out.stuckSet.size; if (o.joined > p.steps) out.maxNew = Math.max(out.maxNew, o.window.length); p.steps = Math.max(p.steps, o.joined);
    for (const i of o.open) { const c = path[i].chapter; if (!(c in chapterAt)) chapterAt[c] = run; if (!(i in out.joinAt)) out.joinAt[i] = run; } return o; };
  const seenNow = () => path.forEach((st, i) => { if (!(i in out.seenAt) && !st.review && stepFacts(st).some((f) => recs[f.key] && recs[f.key].n)) out.seenAt[i] = run; });
  while (run < MAX_RUNS) {
    run++;
    let streak = 0;
    const o0 = keep(), depth = run, avail = stepMonsters(path, o0.open, !p.best), from = waitFrom(path, o0.window);
    const floors = runFloors(wing, { captain: 5, rescued: [] }, rnd, depth, avail, false, FAVOR ? newMonsters(path, o0) : null);
    floors.forEach((m, i) => {
      const bk = bandOf(wing, m), B = BANDS[bk].fluentMs, f = flowOf(bk), kinds = asks(m), ch = Math.min(chaptersOf(path), 1 + p.megas);
      const lv = () => openLevels(path, keep().open, bk), reviews = bk === wing.band ? reviewFacts(path, bk) : null;
      let hp = Math.round(monsterHP(m, bk, recs, lv().levels) * depthScale(i, floors.length) * depthHP(depth) * (m.boss ? BOSS_HP[bossStage(depth)] : 1));
      for (let guard = 0; hp > 0 && guard < 80; guard++) {
        const op = m.op === "mix" || bk !== wing.band ? null : m.op;
        const probe = f.on && f.cool <= 0 ? probeKey(bk, recs, rnd, recent, avoid, f.leap, kinds, reachOf(path, ch, bk)) : null;
        const o = lv(), key = probe || choose(bk, recs, { now, rnd, recent, op, asks: kinds, avoidAns: avoid, depth, open: o.levels, review: o.review, steps: o.steps, reviews });
        const fact = factOf(key, rnd), digits = String(fact.ans).length, hid = m.blank || fact.blank;
        const ms = 1000 * (think[0] + rnd() * (think[1] - think[0]) + (hid ? missing : 0) + speed * workS(fact) + digits * (tap[0] + rnd() * (tap[1] - tap[0])) + 0.3);
        const ok = rnd() > slip, limit = fluentFor(bk, key, fact.sym || fact.ans), fluent = ok && ms < limit;
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
    // The steps in the window whose monsters didn't come up this run waited one more run (learn.js waitRun).
    if (UNSTICK) waitRun(path, from, floors.map((m) => m.base || m.n), recs, p.waits);
    if (depth % MEGA_EVERY === 0) p.megas = Math.max(p.megas, depth / MEGA_EVERY);
    keep(); seenNow();
    if (run === 10) out.at10 = learnedShare(wing, recs);
    if (run === 15) out.at15 = learnedShare(wing, recs);
    // --watch=<step name>: that step's facts seen and learned after each run.
    const wi = WATCH ? path.findIndex((st) => st.name === WATCH) : -1;
    if (wi >= 0) (out.watch ||= []).push([stepSeen(path[wi], recs), stepShare(path[wi], recs)]);
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
const only = process.argv.slice(2).find((a) => !a.startsWith("--"));
const WATCH = (process.argv.find((a) => a.startsWith("--watch=")) || "").slice(8);
const med = (xs) => { const s = xs.slice().sort((a, b) => a - b); return s[s.length >> 1]; };
for (const wing of WINGS.filter((w) => !only || w.id === only)) {
  const path = PATHS[wing.id];
  console.log(`\n${wing.name} (${BANDS[wing.band].label}: ${path.length} steps in ${chaptersOf(path)} chapters)`);
  for (const [name, o] of Object.entries(PLAYERS)) {
    const n = name.startsWith("learner") || name.startsWith("fluent on") ? 20 : 40;
    const runs = Array.from({ length: n }, (_, i) => trial(wing, i * 7919 + 1, o)), r = runs.map((x) => x.run).sort((a, b) => a - b);
    const ch = [...Array(chaptersOf(path))].map((_, c) => { const at = runs.map((x) => x.chapters[c + 1] ?? 99); return `ch${c + 1} run ${med(at) === 99 ? "never" : med(at)}`; }).join(", ");
    // When all of each chapter's steps that take a place in the window (not ongoing or review
    // ones) have joined: a chapter's steps wait on the window.
    const all = [...Array(chaptersOf(path))].map((_, c) => { const mine = path.map((st, i) => i).filter((i) => path[i].chapter === c + 1 && !path[i].ongoing && !path[i].review); if (!mine.length) return null; const at = runs.map((x) => Math.max(...mine.map((i) => x.joinAt[i] ?? 99))); return `ch${c + 1} run ${med(at) === 99 ? "never" : med(at)}`; }).filter(Boolean).join(", ");
    // How late steps start: for each step that joined, the runs until its first problem (a step
    // learned without being asked, by skipping ahead, counts as started when it's placed).
    const lags = runs.flatMap((x) => Object.keys(x.joinAt).filter((i) => !path[i].review).map((i) => (x.seenAt[i] ?? 41) - x.joinAt[i]));
    const late = lags.filter((l) => l >= 2).length, at10 = med(runs.map((x) => x.at10)), at15 = med(runs.map((x) => x.at15));
    console.log(`  ${name}: priority learned at run 10 ${Math.round(at10 * 100)}%, run 15 ${Math.round(at15 * 100)}%; steps started 2+ runs after joining ${Math.round(100 * late / lags.length)}% (worst ${Math.max(...lags) > 40 ? "never" : Math.max(...lags)}); steps stuck (waited ${STUCK_RUNS} runs, hardly seen) ${(runs.reduce((t, x) => t + x.stuck, 0) / n).toFixed(1)} a player`);
    if (WATCH && runs[0].watch) console.log(`    ${WATCH}, seen / learned (median): ` + [5, 10, 15, 20, 25, 30].map((k) => `run ${k} ${Math.round(100 * med(runs.map((x) => x.watch[k - 1][0])))}% / ${Math.round(100 * med(runs.map((x) => x.watch[k - 1][1])))}%`).join(", "));
    // --steps: each step's median run joining and run first asked.
    if (process.argv.includes("--steps")) console.log(path.map((st, i) => st.review ? null : `    ${st.name}: joins run ${med(runs.map((x) => x.joinAt[i] ?? 99))}, first asked run ${med(runs.map((x) => x.seenAt[i] ?? 99))}`).filter(Boolean).join("\n").replace(/run 99/g, "never"));
    console.log(`  ${name}: 60% priority in median ${r[n >> 1] === 99 ? "never" : r[n >> 1]} runs, range ${r[0]}–${r[n - 1] === 99 ? "never" : r[n - 1]} (99 = not within ${MAX_RUNS}); chapters joined: ${ch}; all their new steps joined: ${all}; new steps when one joins, at most ${Math.max(...runs.map((x) => x.maxNew))} (with stuck ones, median most ${med(runs.map((x) => x.maxAll))})`);
  }
}
