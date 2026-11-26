// Balance check, not a test: simulates players through each grade stratum with the game's own
// learning rules (choose with each monster's kinds and operation, placement, skipping ahead and
// its growing leaps, fluent time) and real fights (each floor's monster and strand, monster HP by
// depth and floor, crits after 3 in a row), and prints how many runs it takes to learn 60% of the
// stratum (which, with the boss beaten, opens the next one). Target: about 5 for a fluent player;
// a learner should never skip. Run: node scripts/balance-sim.mjs [stratum]
import { BANDS, pool, choose, factOf, record, probeKey, tierOf, skipTo, SKIP_PROBES, SKIP_WINDOW, MAX_LEAP, fluentTime, learned, monsterHP, openLevel, RECENT, drawHit } from "../js/learn.js";
import { WINGS, depthHP, depthScale, runFloors, bandOf, learnedShare, OPEN_AT } from "../js/wings.js";
import { asks } from "../js/traits.js";

function trial(wing, seed, { slip = 0.05, think = [1.2, 2.6], tap = [0.5, 0.9], missing = 1.0 } = {}) {
  let s = seed; const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const recs = {}, flows = {}, flowOf = (bk) => flows[bk] || (flows[bk] = { fluent: 0, cool: 0, hist: [], on: false, leap: 1 });
  let now = 0, recent = [], avoid = [], run = 0;
  while (run < 30) {
    run++;
    let streak = 0;
    const floors = runFloors(wing, { captain: 5, rescued: [] }, rnd, run);
    floors.forEach((m, i) => {
      const bk = bandOf(wing, m), B = BANDS[bk].fluentMs, f = flowOf(bk), kinds = asks(m);
      let hp = Math.round(monsterHP(m, bk, recs) * depthScale(i, floors.length) * depthHP(run));
      for (let guard = 0; hp > 0 && guard < 80; guard++) {
        const op = m.op === "mix" || bk !== wing.band ? null : m.op;
        const probe = f.on && f.cool <= 0 ? probeKey(bk, recs, rnd, recent, avoid, f.leap, kinds) : null;
        const key = probe || choose(bk, recs, { now, rnd, recent, op, asks: kinds, avoidAns: avoid, depth: run });
        const fact = factOf(key, rnd), digits = String(fact.ans).length, hid = m.blank || fact.blank;
        const ms = 1000 * (think[0] + rnd() * (think[1] - think[0]) + (hid ? missing : 0) + digits * (tap[0] + rnd() * (tap[1] - tap[0])) + 0.3);
        const ok = rnd() > slip, limit = fluentTime(B, fact.sym || fact.ans), fluent = ok && ms < limit;
        recs[key] = record(recs[key], { ok, ms, hinted: false, now, fluentMs: limit });
        if (probe) {
          f.hist = [fluent].concat(f.hist).slice(0, SKIP_WINDOW);
          if (fluent && f.hist.filter(Boolean).length >= SKIP_PROBES) { skipTo(bk, recs, tierOf(bk, key), now, B); f.hist = []; f.leap = Math.min(MAX_LEAP, f.leap * 2); }
          else if (f.hist.filter((x) => !x).length >= 2) { f.cool = 3; f.hist = []; f.on = false; f.leap = 1; }
        }
        f.fluent = fluent ? f.fluent + 1 : 0; if (f.fluent >= 2) f.on = true; f.cool--;
        recent = [key].concat(recent).slice(0, RECENT); avoid = [fact.op + " " + fact.ans].concat(avoid).slice(0, 2);
        now += 7000;
        // (A drawn shape hits for its strand's typical answer.)
        if (ok) { streak++; const hit = fact.draw ? drawHit(bk) : m.blank && !fact.blank && "+-×÷".includes(fact.op) ? Math.max(1, Math.min(fact.x, fact.y)) : fact.ans; hp -= Math.max(1, hit) * (streak >= 3 ? 2 : 1) * 1.1; }
        else streak = 0;
      }
    });
    if (learnedShare(wing, recs) >= OPEN_AT) return { run, level: openLevel(wing.band, recs) };
  }
  return { run: 99, level: openLevel(wing.band, recs) };
}
const PLAYERS = {
  "fluent": {},
  "slower, sloppier fluent": { think: [1.8, 3.2], slip: 0.08 },
  "fluent on some (2–5 s, 12% wrong)": { think: [2, 5], slip: 0.12 },
  "learner (3–9 s, 20% wrong)": { think: [3, 9], slip: 0.2 }
};
const only = process.argv[2];
for (const wing of WINGS.filter((w) => !only || w.id === only)) {
  const sizes = BANDS[wing.band].levels.map((_, L) => pool(wing.band).filter((f) => f.level === L).length);
  console.log(`\n${wing.name} (${BANDS[wing.band].label}: ${pool(wing.band).length} facts, levels ${sizes.join(" / ")})`);
  for (const [name, o] of Object.entries(PLAYERS)) {
    const n = name.startsWith("learner") || name.startsWith("fluent on") ? 20 : 40;
    const runs = Array.from({ length: n }, (_, i) => trial(wing, i * 7919 + 1, o)).sort((a, b) => a.run - b.run);
    const r = runs.map((x) => x.run);
    console.log(`  ${name}: median ${r[n >> 1]} runs, range ${r[0]}–${r[n - 1]}${r[n - 1] === 99 ? " (99 = not within 30 runs)" : ""}`);
  }
}
