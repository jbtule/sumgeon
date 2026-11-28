// Endless (DESIGN.md §6.4): a stratum whose Legend is beaten keeps going, asking the facts already
// learned there (learn.js endlessKey): only the stratum's seen facts, never new ones, every kind
// mixed, weighted to the struggled and the due ones, no repeats, a miss coming back as learning,
// and each monster's own kinds.
import assert from "node:assert/strict";
import { WINGS, PATHS, bandOf } from "../js/wings.js";
import { endlessKey, pathFacts, record, RECENT, BANDS, ENDLESS_LEARNING } from "../js/learn.js";
import { MON } from "../js/monsters.js";
import { asks } from "../js/traits.js";
import { isDrawKey } from "../js/shapes.js";

let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const NOW = 100 * 24 * 3600e3, HOUR = 3600e3;
// Every fact of the path at box 4, answered a few hours ago (not due yet), all alike.
const mastered = (path) => Object.fromEntries(pathFacts(path).map((f) => [f.key, { b: 4, n: 4, c: 4, ms: 2000, t: NOW - HOUR }]));
// A fight's run of problems: the recent keys and answers kept as app.js keeps them.
function fight(path, band, recs, n, opts = {}) {
  const recent = [], out = [];
  let avoidAns = [];
  for (let i = 0; i < n; i++) {
    const key = endlessKey(path, band, recs, Object.assign({ now: NOW, rnd, recent, avoidAns }, opts));
    if (key == null) return out;
    const f = pathFacts(path).find((x) => x.key === key);
    out.push(f);
    recent.unshift(key); recent.length = Math.min(recent.length, RECENT);
    avoidAns = [f.op + " " + f.ans].concat(avoidAns).slice(0, 2);
  }
  return out;
}
const monsterOf = (w, name) => MON.find((m) => m.n === name);

for (const w of WINGS) {
  const path = PATHS[w.id], all = pathFacts(path), band = w.band;
  const own = all.filter((f) => f.band === band);
  assert.ok(own.length > 30, `${w.id}: its band's facts`);
  // Review steps (an earlier grade's) aren't the stratum's own.
  const reviewKeys = new Set(path.filter((s) => s.review).flatMap((s) => s.parts.map(([b, L]) => b + ":" + L)));
  assert.ok(all.every((f) => !reviewKeys.has(f.band + ":" + f.level)), `${w.id}: no review steps`);

  // Only seen facts: never a new one. Half the band seen, the rest never.
  const recs = {};
  own.forEach((f, i) => { if (i % 2 === 0) recs[f.key] = { b: 4, n: 4, c: 4, ms: 2000, t: NOW - HOUR }; });
  const asked = fight(path, band, recs, 300);
  assert.equal(asked.length, 300);
  assert.ok(asked.every((f) => recs[f.key] && recs[f.key].n), `${w.id}: no new facts`);
  assert.ok(asked.every((f) => f.band === band), `${w.id}: the band asked, not another`);
  // Nothing seen (in this band): null, so app.js falls back to choose.
  assert.equal(endlessKey(path, band, {}, { now: NOW, rnd }), null);

  // No immediate repeats, and nothing within the fight's recent problems while there are others.
  const full = mastered(path), run = fight(path, band, full, 200);
  for (let i = 1; i < run.length; i++) assert.notEqual(run[i].key, run[i - 1].key, `${w.id}: no repeat`);
  for (let i = RECENT; i < run.length; i++) assert.ok(!run.slice(i - RECENT, i).some((f) => f.key === run[i].key), `${w.id}: not within ${RECENT}`);
  // Not the same kind with the same answer as either of the last two.
  for (let i = 2; i < run.length; i++) {
    const a = run[i].op + " " + run[i].ans;
    assert.ok(![run[i - 1], run[i - 2]].some((f) => f.op + " " + f.ans === a), `${w.id}: varied answers`);
  }
  // The kinds mixed: every step of the band comes round, and no step twice in a row while
  // there's another.
  const steps = new Set(own.map((f) => f.step)), got = new Set(run.map((f) => f.step));
  for (const s of steps) assert.ok(got.has(s), `${w.id}: step ${path[s].name || s} asked`);
  if (steps.size > 1) for (let i = 1; i < run.length; i++) assert.notEqual(run[i].step, run[i - 1].step, `${w.id}: kinds mixed`);
  // In the first round of steps, each step once before any twice.
  // (Steps are counted over the recent problems, RECENT of them: the Forge has more steps than
  // that, so its round is the first RECENT.)
  const round = Math.min(steps.size, RECENT), firstRound = run.slice(0, round).map((f) => f.step);
  assert.equal(new Set(firstRound).size, round, `${w.id}: every kind before any twice`);

  // Weighting: a struggled fact (missed a lot, slow) comes up far more often than a plain one of
  // its step; a due one more than one not due.
  const step0 = own.filter((f) => f.step === own[0].step);
  if (step0.length >= 6) {
    const hard = step0[1].key, dueK = step0[3].key, plain = step0[5].key;
    const tally = (r, keys) => { const c = Object.fromEntries(keys.map((k) => [k, 0])); for (let i = 0; i < 6000 * Math.ceil(path.length / 9); i++) { const k = endlessKey(path, band, r, { now: NOW, rnd }); if (k in c) c[k]++; } return c; }; // (more draws for a long path, whose facts come up less each)
    const r2 = mastered(path);
    r2[hard] = { b: 4, n: 14, c: 8, ms: 9000, t: NOW - HOUR };
    const c2 = tally(r2, [hard, plain]);
    assert.ok(c2[hard] > 4 * c2[plain], `${w.id}: struggled ${c2[hard]} vs ${c2[plain]}`);
    const r4 = mastered(path);
    r4[dueK] = { b: 4, n: 4, c: 4, ms: 2000, t: NOW - 2 * 24 * HOUR };
    const c4 = tally(r4, [dueK, plain]);
    assert.ok(c4[dueK] > 1.8 * c4[plain], `${w.id}: due ${c4[dueK]} vs ${c4[plain]}`);
  }

  // A miss: back to box 0 (record), then it comes back as learning, about half the problems
  // while it's the only one, until it's learned again.
  const r3 = mastered(path), missed = own[7].key;
  r3[missed] = record(r3[missed], { ok: false, ms: 3000, now: NOW, fluentMs: BANDS[band].fluentMs });
  assert.equal(r3[missed].b, 0);
  let back = 0;
  for (let i = 0; i < 2000; i++) if (endlessKey(path, band, r3, { now: NOW, rnd }) === missed) back++;
  assert.ok(back > 2000 * ENDLESS_LEARNING * 0.85, `${w.id}: the missed fact comes back (${back})`);
  // Not as the very next problem when there's another (the retry does that, 2–4 later)…
  assert.notEqual(endlessKey(path, band, r3, { now: NOW, rnd, recent: [missed] }), missed);
  // …and a retry due now comes first.
  assert.equal(endlessKey(path, band, r3, { now: NOW, rnd, retry: missed }), missed);
  // Learned again: no longer pulled forward.
  for (const ok of [1, 2]) r3[missed] = record(r3[missed], { ok: true, ms: 1000, now: NOW, fluentMs: BANDS[band].fluentMs });
  assert.ok(r3[missed].b >= 3);
  back = 0;
  for (let i = 0; i < 2000; i++) if (endlessKey(path, band, r3, { now: NOW, rnd }) === missed) back++;
  assert.ok(back < 2000 * 0.2, `${w.id}: learned again (${back})`);

  // Each monster asks its own kinds, from its band or strand here.
  for (const name of new Set(path.flatMap((s) => s.monsters || []))) {
    const m = monsterOf(w, name);
    if (!m) continue;
    const bk = bandOf(w, m), kinds = asks(m);
    const mine = all.filter((f) => f.band === bk && kinds(f.op, f.key));
    const got = fight(path, bk, full, 60, { asks: kinds });
    if (!mine.length) { assert.equal(got.length, 0, `${w.id} ${name}: none of its kind, falls back`); continue; }
    assert.ok(got.length === 60 && got.every((f) => f.band === bk && kinds(f.op, f.key)), `${w.id} ${name}: its own kinds`);
    // A strand's (Trollar's coins, Tick-Tockus's time): its steps mixed too.
    const st = new Set(mine.map((f) => f.step));
    assert.ok(new Set(got.map((f) => f.step)).size === Math.min(st.size, 60), `${w.id} ${name}: every step of its kinds`);
    // Drawn shapes only where the monster's test lets them (app.js drawable: touch screens).
    if (mine.some((f) => isDrawKey(f.key))) {
      const noDraw = (o, k) => kinds(o, k) && !isDrawKey(k);
      assert.ok(fight(path, bk, full, 40, { asks: noDraw }).every((f) => !isDrawKey(f.key)), `${w.id} ${name}: no drawing on a mouse`);
    }
  }
}
console.log("endless: ok");
