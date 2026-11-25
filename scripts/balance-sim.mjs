// Balance check, not a test: simulates players through the Counting Cellar with the game's own
// learning rules (placement, skipping ahead, fluent time) and prints how many runs it takes to
// learn 60% (which, with the boss beaten, opens the next strata). Target: about 5 for a fluent
// player; a learner should never skip. Run: node scripts/balance-sim.mjs
import { BANDS, pool, choose, factOf, record, probeKey, tierOf, skipTo, SKIP_PROBES, SKIP_WINDOW, fluentTime, learned } from "../js/learn.js";
const band = "sprout", B = BANDS.sprout.fluentMs, CAP = 0.6;
function trial(seed, { slip = 0.05, think = [1.2, 2.6], tap = [0.5, 0.9] } = {}) {
  let s = seed; const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const recs = {}, f = { fluent: 0, cool: 0, hist: [], on: false };
  let now = 0, recent = [], avoid = [], run = 0;
  const share = () => pool(band).filter((x) => learned(recs[x.key])).length / pool(band).length;
  while (run < 30) {
    run++;
    const problems = 13 + run; // deeper depths have more HP, so a few more problems
    for (let i = 0; i < problems; i++) {
      const ops = ["+", "-", null]; const op = ops[i % 3];
      const probe = f.on && f.cool <= 0 ? probeKey(band, recs, rnd, recent, avoid) : null;
      const key = probe || choose(band, recs, { now, rnd, recent, op, avoidAns: avoid, depth: run });
      const fact = factOf(key, rnd), digits = String(fact.ans).length;
      const ms = 1000 * (think[0] + rnd() * (think[1] - think[0]) + digits * (tap[0] + rnd() * (tap[1] - tap[0])) + 0.3);
      const ok = rnd() > slip, limit = fluentTime(B, fact.ans), fluent = ok && ms < limit;
      recs[key] = record(recs[key], { ok, ms, hinted: false, now, fluentMs: limit });
      if (probe) {
        f.hist = [fluent].concat(f.hist).slice(0, SKIP_WINDOW);
        if (fluent && f.hist.filter(Boolean).length >= SKIP_PROBES) { skipTo(band, recs, tierOf(band, key), now, B); f.hist = []; }
        else if (f.hist.filter((x) => !x).length >= 2) { f.cool = 3; f.hist = []; f.on = false; }
      }
      f.fluent = fluent ? f.fluent + 1 : 0; if (f.fluent >= 2) f.on = true; f.cool--;
      recent = [key].concat(recent).slice(0, 3); avoid = [fact.op + " " + fact.ans].concat(avoid).slice(0, 2);
      now += 7000;
    }
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
