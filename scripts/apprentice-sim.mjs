// Balance check, not a test: simulates 3rd graders through the Tables Tower (Apprentice) with the
// game's own learning rules (choose, placement, skipping ahead, fluent time) and real fights
// (monster HP by depth and floor, crits after 3 in a row), and prints how many runs it takes to
// open × 2, 5 and 10, then ÷ 2, 5 and 10, × 3 and 4, and × 6–9, and how much ± within 20 is
// still asked. Goal: × 2, 5 and 10 within the first run or two even when ± within 20 is shaky.
// Run: node scripts/apprentice-sim.mjs
import { BANDS, pool, choose, factOf, record, probeKey, tierOf, skipTo, SKIP_PROBES, SKIP_WINDOW, MAX_LEAP, fluentTime, learned, monsterHP, openLevel } from "../js/learn.js";
import { MON as MONSTERS } from "../js/monsters.js";
import { depthHP, depthScale } from "../js/wings.js";
const band = "apprentice", B = BANDS.apprentice.fluentMs;
const M = (n) => MONSTERS.find((m) => m.n === n);
const fivesTens = (key) => key.slice(1).split(",").map(Number).some((n) => n === 5 || n === 10);
// The Tower's floors. Haberhasher asks the two-digit strand, not Apprentice facts, so it's
// skipped here (null); the rescue floor is a cursed digit (mixed, 4 hits); the pool floor is
// one of the Tower's Apprentice monsters.
const POOL = [M("Timesaur"), M("Divvy"), M("Starbot")];
const floors = (rnd) => [M("Timesaur"), M("Divvy"), { n: "rescue", op: "mix", hits: 4 }, M("Starbot"), null, POOL[Math.floor(rnd() * POOL.length)], M("Sigma Rex")];

// A player: how long each fact takes to think of, and how often it's wrong. A fact the player is
// still learning gets quicker and surer each time it's answered right (practice works).
const isPM = (f) => f.op === "+" || f.op === "-";
const teen = (f) => (f.op === "+" && f.ans > 10) || (f.op === "-" && f.x > 10);
const easyTimes = (f) => (f.op === "×" || f.op === "÷") && [2, 5, 10].includes(f.op === "×" ? Math.min(f.x, f.y) : f.y) && f.ans <= 100;
const FLUENT = { think: [1.2, 2.6], slip: 0.05 }, SHAKY = { think: [3, 8], slip: 0.2 }, LEARNING = { think: [3, 7], slip: 0.15 };
export const PLAYERS = {
  // A 3rd grader who knows × 2, 5 and 10 and ± within 10, but is shaky on teen ± facts.
  "fluent × 2, 5, 10, shaky ± within 20": (f) => isPM(f) ? (teen(f) ? SHAKY : FLUENT) : easyTimes(f) ? FLUENT : LEARNING,
  "fluent on everything": () => FLUENT,
  "a learner (3–9 s, 20% wrong)": () => ({ think: [3, 9], slip: 0.2 })
};

function trial(seed, skill, RUNS = 15) {
  let s = seed; const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const recs = {}, f = { fluent: 0, cool: 0, hist: [], on: false, leap: 1 }, practice = {};
  let now = 0, recent = [], avoid = [], retry = [], pm = 0, all = 0;
  const opened = {}, out = { pmShare: [] };
  for (let run = 1; run <= RUNS; run++) {
    let streak = 0, runPM = 0, runAll = 0;
    const fl = floors(rnd);
    fl.forEach((m, i) => {
      if (!m) return;
      let hp = Math.round(monsterHP(m, band, recs) * depthScale(i, fl.length) * depthHP(run));
      while (hp > 0) {
        retry.forEach((r) => r.after--);
        const due = retry.find((r) => r.after <= 0);
        if (due) retry.splice(retry.indexOf(due), 1);
        const op = m.op === "mix" ? null : m.op;
        const probe = !due && f.on && f.cool <= 0 ? probeKey(band, recs, rnd, recent, avoid, f.leap) : null;
        const key = probe || choose(band, recs, { now, rnd, recent, retry: due ? due.key : null, op, like: m.n === "Starbot" ? fivesTens : null, avoidAns: avoid, depth: run });
        const fact = factOf(key, rnd), sk = skill(fact), n = practice[key] || 0;
        // Practice: each right answer takes 15% off the thinking and the slips, down to fluent.
        const k = Math.pow(0.85, n), lo = Math.max(FLUENT.think[0], sk.think[0] * k), hi = Math.max(FLUENT.think[1], sk.think[1] * k);
        const ms = 1000 * (lo + rnd() * (hi - lo) + String(fact.ans).length * (0.5 + rnd() * 0.4) + 0.3);
        const ok = rnd() > Math.max(FLUENT.slip, sk.slip * k), limit = fluentTime(B, fact.ans), fluent = ok && ms < limit;
        if (ok) practice[key] = n + 1;
        const before = openLevel(band, recs);
        recs[key] = record(recs[key], { ok, ms, hinted: false, now, fluentMs: limit });
        if (probe) {
          f.hist = [fluent].concat(f.hist).slice(0, SKIP_WINDOW);
          if (fluent && f.hist.filter(Boolean).length >= SKIP_PROBES) { skipTo(band, recs, tierOf(band, key), now, B); f.hist = []; f.leap = Math.min(MAX_LEAP, f.leap * 2); }
          else if (f.hist.filter((x) => !x).length >= 2) { f.cool = 3; f.hist = []; f.on = false; f.leap = 1; }
        }
        f.fluent = fluent ? f.fluent + 1 : 0; if (f.fluent >= 2) f.on = true; f.cool--;
        if (!ok) retry.push({ key, after: 2 + Math.floor(rnd() * 3) });
        recent = [key].concat(recent).slice(0, 3); avoid = [fact.op + " " + fact.ans].concat(avoid).slice(0, 2);
        now += 7000; runAll++; if (isPM(fact)) runPM++;
        const L = openLevel(band, recs);
        for (let l = before + 1; l <= L; l++) if (!opened[l]) opened[l] = run;
        if (ok) { streak++; hp -= Math.max(1, fact.ans) * (streak >= 3 ? 2 : 1); } else streak = 0;
      }
    });
    out.pmShare.push(runPM / runAll); pm += runPM; all += runAll;
    now += 3600e3 * 20; // a run a day: reviews come due
  }
  for (let l = 1; l <= openLevel(band, {}); l++) opened[l] = opened[l] || 0; // open from the start
  out.opened = opened;
  out.pmLearned = pool(band).filter((x) => x.level === 0 && learned(recs[x.key])).length / pool(band).filter((x) => x.level === 0).length;
  return out;
}

const median = (a) => { const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
const runsTo = (outs, l) => { const r = outs.map((o) => o.opened[l] ?? 99); return `${median(r)} (${Math.min(...r)}–${Math.max(...r)})`; };
const pct = (x) => Math.round(x * 100) + "%";
console.log(`Runs to open each level (median, range over 30 players; 99 = not within 15 runs). Run 1 is the first run; 0 = open from the start.`);
for (const [name, skill] of Object.entries(PLAYERS)) {
  const outs = Array.from({ length: 30 }, (_, i) => trial(i * 7919 + 1, skill));
  const levels = BANDS.apprentice.levels;
  console.log(`\n${name}:`);
  for (const l of [1, 2, 3, 5]) console.log(`  ${levels[l].name}: ${runsTo(outs, l)}`);
  const share = (r) => pct(outs.reduce((t, o) => t + o.pmShare[r], 0) / outs.length);
  console.log(`  ± within 20 asked: ${share(0)} of problems in run 1, ${share(2)} in run 3, ${share(9)} in run 10; learned by run 15: ${pct(outs.reduce((t, o) => t + o.pmLearned, 0) / outs.length)}`);
}
