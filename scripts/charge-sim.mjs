// How often the Super Charge (js/charge.js) comes up, not a test: plays each stratum's path the way
// scripts/balance-sim.mjs does (the window, chapters, each floor's monster from the open steps,
// choose with its kinds and open levels, the review steps, placement and skipping ahead), a player
// winning every run and going deeper each time, and counts the problems that are Super Charged
// (×N) or find the monster braced (÷N), with the floor's typical hit taken as the floor starts,
// as app.js does. Target: almost never from kindergarten to 3rd grade; mostly in the Forge.
// Run: node scripts/charge-sim.mjs [stratum] [runs] (CHARGE_AT=<n> tries another threshold)
import { BANDS, choose, factOf, record, probeKey, tierOf, skipTo, SKIP_PROBES, SKIP_WINDOW, MAX_LEAP, fluentTime, monsterHP, RECENT, drawHit, openLevels, reachOf, chaptersOf, reviewFacts, placeReviews, floorTypical, levelTypical } from "../js/learn.js";
import { WINGS, depthHP, depthScale, runFloors, bandOf, PATHS, stepsOpen, stepMonsters, bossStage, BOSS_HP, MEGA_EVERY } from "../js/wings.js";
import { asks } from "../js/traits.js";
import { chargeFor, chargedHit, CHARGE_AT } from "../js/charge.js";

const RUNS = Number(process.argv[3]) || 20, AT = Number(process.env.CHARGE_AT) || CHARGE_AT;
function trial(wing, seed, { slip = 0.05, think = [1.2, 2.6], tap = [0.5, 0.9] } = {}) {
  let s = seed; const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const recs = {}, flows = {}, flowOf = (bk) => flows[bk] || (flows[bk] = { fluent: 0, cool: 0, hist: [], on: false, leap: 1 });
  const path = PATHS[wing.id], prog = { [wing.id]: { boss: 0, best: 0, megas: 0, steps: 0 } }, p = prog[wing.id];
  const out = { n: 0, up: 0, down: 0, ups: {}, downs: {}, where: {} };
  let now = 0, recent = [], avoid = [];
  const keep = () => { const o = stepsOpen(wing, prog, recs); p.steps = Math.max(p.steps, o.joined); return o; };
  for (let run = 1; run <= RUNS; run++) {
    let streak = 0;
    const depth = run, floors = runFloors(wing, { captain: 5, rescued: [] }, rnd, depth, stepMonsters(path, keep().open, !p.best));
    floors.forEach((m, i) => {
      const bk = bandOf(wing, m), B = BANDS[bk].fluentMs, f = flowOf(bk), kinds = asks(m), ch = Math.min(chaptersOf(path), 1 + p.megas);
      const lv = () => openLevels(path, keep().open, bk), reviews = bk === wing.band ? reviewFacts(path, bk) : null;
      let hp = Math.round(monsterHP(m, bk, recs, lv().levels) * depthScale(i, floors.length) * depthHP(depth) * (m.boss ? BOSS_HP[bossStage(depth)] : 1));
      const typical = floorTypical(m, bk, recs, lv().levels);
      for (let guard = 0; hp > 0 && guard < 80; guard++) {
        const op = m.op === "mix" || bk !== wing.band ? null : m.op;
        const probe = f.on && f.cool <= 0 ? probeKey(bk, recs, rnd, recent, avoid, f.leap, kinds, reachOf(path, ch, bk)) : null;
        const o = lv(), key = probe || choose(bk, recs, { now, rnd, recent, op, asks: kinds, avoidAns: avoid, depth, open: o.levels, review: o.review, reviews });
        const fact = factOf(key, rnd), c = chargeFor(levelTypical(bk, key, m), typical, AT);
        out.n++;
        if (c && c.up) { out.up++; out.ups[c.up] = (out.ups[c.up] || 0) + 1; }
        if (c && c.down) { out.down++; out.downs[c.down] = (out.downs[c.down] || 0) + 1; }
        if (c) { const w = (m.base || m.n) + " " + (c.up ? "×" + c.up : "÷" + c.down) + " " + key.replace(/\d+/g, "n"); out.where[w] = (out.where[w] || 0) + 1; }
        const ms = 1000 * (think[0] + rnd() * (think[1] - think[0]) + String(fact.ans).length * (tap[0] + rnd() * (tap[1] - tap[0])) + 0.3);
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
        if (ok) { streak++; const hit = fact.draw ? drawHit(bk) : m.blank && !fact.blank && "+-×÷".includes(fact.op) ? Math.max(1, Math.min(fact.x, fact.y)) : fact.ans; hp -= Math.max(1, chargedHit(hit, c)) * (streak >= 3 ? 2 : 1); }
        else streak = 0;
      }
    });
    p.boss++; p.best = 6;
    if (depth % MEGA_EVERY === 0) p.megas = Math.max(p.megas, depth / MEGA_EVERY);
    keep();
  }
  return out;
}
const PLAYERS = { fluent: {}, "learner (3–9 s, 20% wrong)": { think: [3, 9], slip: 0.2 } };
const pct = (a, n) => (100 * a / n).toFixed(1) + "%";
const list = (o) => Object.entries(o).sort((a, b) => Number(a[0]) - Number(b[0])).map(([k, v]) => k + ":" + v).join(" ") || "none";
for (const wing of WINGS.filter((w) => !process.argv[2] || w.id === process.argv[2])) {
  console.log(`\n${wing.name} (${RUNS} runs, depths 1–${RUNS})`);
  for (const [name, o] of Object.entries(PLAYERS)) {
    const all = { n: 0, up: 0, down: 0, ups: {}, downs: {}, where: {} };
    for (let t = 0; t < 5; t++) {
      const r = trial(wing, t * 7919 + 1, o);
      all.n += r.n; all.up += r.up; all.down += r.down;
      for (const k of ["ups", "downs", "where"]) for (const [x, v] of Object.entries(r[k])) all[k][x] = (all[k][x] || 0) + v;
    }
    console.log(`  ${name}: ${all.n} problems, super charged ${pct(all.up, all.n)} (×${list(all.ups)}), braced ${pct(all.down, all.n)} (÷${list(all.downs)})`);
    const top = Object.entries(all.where).sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (top.length) console.log("    most: " + top.map(([w, v]) => `${w} (${v})`).join(", "));
  }
}
