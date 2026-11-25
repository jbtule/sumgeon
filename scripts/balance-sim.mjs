// Balance check, not a test: simulates players through the Counting Cellar with the game's own
// learning rules (placement, skipping ahead and its growing leaps, fluent time) and real fights
// (monster HP by depth, crits after 3 in a row), and prints how many runs it takes to learn 60%
// (which, with the boss beaten, opens the next strata). Target: about 5 for a fluent player; a
// learner should never skip. Run: node scripts/balance-sim.mjs
import { BANDS, pool, choose, factOf, record, probeKey, tierOf, skipTo, SKIP_PROBES, SKIP_WINDOW, MAX_LEAP, fluentTime, learned, monsterHP } from "../js/learn.js";
import { MON as MONSTERS } from "../js/monsters.js";
import { depthHP, depthScale } from "../js/wings.js";
const band = "sprout", B = BANDS.sprout.fluentMs, CAP = 0.6;
const M = (n) => MONSTERS.find((m) => m.n === n);
// The Cellar's floors: the coin floor (Trollar) asks coins, not Sprout facts, so it's skipped
// here; it doesn't touch Sprout's skip tally. The rescue floor is a cursed digit (mixed, 4 hits).
const FLOORS = [M("Plusquito"), M("Minustaur"), { n: "rescue", op: "mix", hits: 4 }, M("Quizard"), null, M("Make-Ten Golem")];
function trial(seed, { slip = 0.05, think = [1.2, 2.6], tap = [0.5, 0.9], missing = 1.0 } = {}) {
  let s = seed; const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const recs = {}, f = { fluent: 0, cool: 0, hist: [], on: false, leap: 1 };
  let now = 0, recent = [], avoid = [], run = 0;
  const share = () => pool(band).filter((x) => learned(recs[x.key])).length / pool(band).length;
  while (run < 30) {
    run++;
    let streak = 0;
    FLOORS.forEach((m, i) => {
      if (!m) return;
      let hp = Math.round(monsterHP(m, band, recs) * depthScale(i, FLOORS.length) * depthHP(run));
      while (hp > 0) {
        const op = m.op === "mix" ? null : m.op;
        const probe = f.on && f.cool <= 0 ? probeKey(band, recs, rnd, recent, avoid, f.leap) : null;
        const key = probe || choose(band, recs, { now, rnd, recent, op, avoidAns: avoid, depth: run });
        const fact = factOf(key, rnd), digits = String(fact.ans).length;
        const ms = 1000 * (think[0] + rnd() * (think[1] - think[0]) + (m.blank ? missing : 0) + digits * (tap[0] + rnd() * (tap[1] - tap[0])) + 0.3);
        const ok = rnd() > slip, limit = fluentTime(B, fact.ans), fluent = ok && ms < limit;
        recs[key] = record(recs[key], { ok, ms, hinted: false, now, fluentMs: limit });
        if (probe) {
          f.hist = [fluent].concat(f.hist).slice(0, SKIP_WINDOW);
          if (fluent && f.hist.filter(Boolean).length >= SKIP_PROBES) { skipTo(band, recs, tierOf(band, key), now, B); f.hist = []; f.leap = Math.min(MAX_LEAP, f.leap * 2); }
          else if (f.hist.filter((x) => !x).length >= 2) { f.cool = 3; f.hist = []; f.on = false; f.leap = 1; }
        }
        f.fluent = fluent ? f.fluent + 1 : 0; if (f.fluent >= 2) f.on = true; f.cool--;
        recent = [key].concat(recent).slice(0, 3); avoid = [fact.op + " " + fact.ans].concat(avoid).slice(0, 2);
        now += 7000;
        if (ok) { streak++; const blankHit = m.blank ? Math.max(1, fact.ans / 2) : fact.ans; hp -= Math.max(1, blankHit) * (streak >= 3 ? 2 : 1) * 1.1; }
        else { streak = 0; hp -= 0; }
      }
    });
    if (share() >= CAP) return run;
  }
  return 99;
}
const runs = Array.from({ length: 40 }, (_, i) => trial(i * 7919 + 1)).sort((a, b) => a - b);
console.log("runs to open the next strata over 40 players: median", runs[20], "range", runs[0], "-", runs[39]);
const slow = Array.from({ length: 40 }, (_, i) => trial(i * 7919 + 1, { think: [1.8, 3.2], slip: 0.08 })).sort((a, b) => a - b);
console.log("a slower, sloppier fluent player: median", slow[20], "range", slow[0], "-", slow[39]);
const learner = Array.from({ length: 20 }, (_, i) => trial(i * 7919 + 1, { think: [3, 9], slip: 0.2 })).sort((a, b) => a - b);
console.log("a learner (3–9 s to think, 20% wrong): median", learner[10], "range", learner[0], "-", learner[19], "(99 = not within 30 runs)");
const mixed = Array.from({ length: 20 }, (_, i) => trial(i * 7919 + 1, { think: [2, 5], slip: 0.12 })).sort((a, b) => a - b);
console.log("a kid fluent on some facts (2–5 s, 12% wrong): median", mixed[10], "range", mixed[0], "-", mixed[19]);
