// One-shots, not a test: how often one right answer takes a regular monster (not a boss: Boss
// Guard) from full HP to nothing without a Hero Moment or an item, the crit on and the monster's
// trait counted. The principle (2026-11-28): a one-shot from full HP needs help, a Hero Moment or
// an item (the Times Two Totem), never a crit, a trait or a giant answer alone.
// Plays each stratum's path the way scripts/charge-sim.mjs does (a player winning every run and
// going one depth deeper each time, depths 1–15), and for every problem asked on a regular floor
// works out the hit as app.js submit does with the crit on (the Super Charge, the trait), against
// the monster's full HP. The captain's power hit (+50%) is counted apart: it's a hero's.
// Run: node scripts/oneshot-sim.mjs [stratum] [runs]
import { BANDS, choose, factOf, record, probeKey, tierOf, skipTo, SKIP_PROBES, SKIP_WINDOW, MAX_LEAP, fluentFor, monsterHP, RECENT, drawHit, openLevels, reachOf, chaptersOf, reviewFacts, placeReviews, floorTypical, levelTypical } from "../js/learn.js";
import { WINGS, depthHP, depthScale, runFloors, bandOf, PATHS, stepsOpen, stepMonsters, MEGA_EVERY } from "../js/wings.js";
import { asks, hitBy } from "../js/traits.js";
import * as C from "../js/charge.js";

const RUNS = Number(process.argv[3]) || 15, SEEDS = 5;
// The charge as app.js sets it: from the problem's scale (charge.js problemScale, the level's
// typical answer and the numbers it shows), or before that from the level's alone.
const chargeOf = (bk, key, m, fact, typical) => C.problemScale ? C.chargeFor(C.problemScale(levelTypical(bk, key, m), fact), typical) : C.chargeFor(levelTypical(bk, key, m), typical);
// The hit as app.js submit works it out, a crit on, no Hero Moment or item; with cap, what a
// regular monster at full HP can lose to it (charge.js oneHit; before it, nothing held it back).
const hitOf = (base, mult, hp, cap) => { const d = Math.max(1, Math.round(base * mult)); return cap && C.oneHit ? C.oneHit(d, hp, hp, false) : d; };

function trial(wing, seed, { slip = 0.05, think = [1.2, 2.6], tap = [0.5, 0.9] } = {}) {
  let s = seed; const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const recs = {}, flows = {}, flowOf = (bk) => flows[bk] || (flows[bk] = { fluent: 0, cool: 0, hist: [], on: false, leap: 1 });
  const path = PATHS[wing.id], prog = { [wing.id]: { boss: 0, best: 0, megas: 0, steps: 0 } }, p = prog[wing.id];
  const out = { n: 0, one: 0, onePow: 0, capped: 0, where: {} };
  let now = 0, recent = [], avoid = [];
  const keep = () => { const o = stepsOpen(wing, prog, recs); p.steps = Math.max(p.steps, o.joined); return o; };
  for (let run = 1; run <= RUNS; run++) {
    const depth = run, floors = runFloors(wing, { captain: 5, rescued: [] }, rnd, depth, stepMonsters(path, keep().open, !p.best));
    floors.forEach((m, i) => {
      const bk = bandOf(wing, m), B = BANDS[bk].fluentMs, f = flowOf(bk), kinds = asks(m), ch = Math.min(chaptersOf(path), 1 + p.megas);
      const lv = () => openLevels(path, keep().open, bk), reviews = bk === wing.band ? reviewFacts(path, bk) : null;
      const full = Math.round(monsterHP(m, bk, recs, lv().levels) * depthScale(i, floors.length) * depthHP(depth));
      let hp = full;
      const typical = floorTypical(m, bk, recs, lv().levels);
      for (let guard = 0; hp > 0 && guard < 80; guard++) {
        const op = m.op === "mix" || bk !== wing.band ? null : m.op;
        const probe = f.on && f.cool <= 0 ? probeKey(bk, recs, rnd, recent, avoid, f.leap, kinds, reachOf(path, ch, bk)) : null;
        const o = lv(), key = probe || choose(bk, recs, { now, rnd, recent, op, asks: kinds, avoidAns: avoid, depth, open: o.levels, review: o.review, steps: o.steps, reviews });
        const fact = factOf(key, rnd), c = chargeOf(bk, key, m, fact, typical);
        const ans = fact.draw ? drawHit(bk) : m.blank && !fact.blank && "+-×÷".includes(fact.op) ? Math.max(1, Math.min(fact.x, fact.y)) : fact.ans;
        if (!m.boss && Number.isFinite(ans)) {
          const trait = hitBy(m, ans, String(ans), false, fact), base = C.chargedHit(ans, c);
          out.n++;
          if (hitOf(base, 2 * trait.mult, full) >= full) { out.one++; const w = (m.base || m.n) + " d" + depth + " " + key.replace(/\d/g, "n"); out.where[w] = (out.where[w] || 0) + 1; }
          if (hitOf(base, 2 * trait.mult * 1.5, full) >= full) out.onePow++;
          if (hitOf(base, 2 * trait.mult * 1.5, full, true) >= full) out.capped++;
        }
        const ms = 1000 * (think[0] + rnd() * (think[1] - think[0]) + String(fact.ans).length * (tap[0] + rnd() * (tap[1] - tap[0])) + 0.3);
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
        // The fight goes on with ordinary hits (no crit), so the next problems see the HP as it is.
        if (ok) hp -= Math.max(1, C.chargedHit(ans, c));
      }
    });
    p.boss++; p.best = 6;
    if (depth % MEGA_EVERY === 0) p.megas = Math.max(p.megas, depth / MEGA_EVERY);
    keep();
  }
  return out;
}
const PLAYERS = { fluent: {}, learner: { think: [3, 9], slip: 0.2 } };
const pct = (a, n) => (n ? (100 * a / n).toFixed(1) : "0.0") + "%";
console.log(`One right answer from full HP to 0 on a regular floor, depths 1–${RUNS}, ${SEEDS} players each (share of problems)`);
console.log("stratum".padEnd(22) + "player".padEnd(9) + "problems".padStart(9) + "  crit+trait  +power hit  with oneHit");
for (const wing of WINGS.filter((w) => !process.argv[2] || w.id === process.argv[2])) {
  const where = {};
  for (const [name, o] of Object.entries(PLAYERS)) {
    const all = { n: 0, one: 0, onePow: 0, capped: 0 };
    for (let t = 0; t < SEEDS; t++) {
      const r = trial(wing, t * 7919 + 1, o);
      all.n += r.n; all.one += r.one; all.onePow += r.onePow; all.capped += r.capped;
      for (const [w, v] of Object.entries(r.where)) where[w] = (where[w] || 0) + v;
    }
    console.log(wing.name.padEnd(22) + name.padEnd(9) + String(all.n).padStart(9) + pct(all.one, all.n).padStart(12) + pct(all.onePow, all.n).padStart(12) + pct(all.capped, all.n).padStart(13));
  }
  const top = Object.entries(where).sort((a, b) => b[1] - a[1]).slice(0, 4);
  if (top.length) console.log("  most (crit+trait): " + top.map(([w, v]) => `${w} (${v})`).join(", "));
}
