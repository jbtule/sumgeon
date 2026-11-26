// The Bestiary (DESIGN.md §6.2): every Wing's monsters, which ones a player has met and beaten,
// and a mastery ring per monster for how much of its kind of math is learned. No DOM.
import { MON } from "./monsters.js";
import { WINGS, bandOf } from "./wings.js";
import { pool, learned } from "./learn.js";
import { asks } from "./traits.js";

// [{ wing, m }] in Wing order: each Wing's pool, then its boss. A monster in more than one Wing
// (Chompers, Trollar, Minustaur) is listed once, in the first.
export function roster() {
  const out = [], seen = new Set();
  for (const w of WINGS) for (const n of w.pool.concat([w.boss])) if (!seen.has(n)) { seen.add(n); out.push({ wing: w, m: MON.find((x) => x.n === n) }); }
  return out;
}

// The share (0–1) of a monster's facts learned: the facts it asks in its Wing's band (traits.js
// asks: Doublet's doubles, Halfling's fractions), of its operation when it has one, or every fact
// there for a monster that mixes or prefers none.
export function mastery(m, wing, recs) {
  // A monster with its own strand there (Trollar's coins) is measured on that strand.
  const p = pool(bandOf(wing, m)), k = asks(m), its = p.filter((f) => k(f.op, f.key)), mine = its.filter((f) => f.op === m.op);
  const facts = mine.length ? mine : its.length ? its : p;
  return facts.filter((f) => learned(recs[f.key])).length / facts.length;
}

// Records that a monster was met or beaten: seen = { [name]: { met: time, beaten: count } }.
export function meet(seen, m, now) {
  if (m.cursed != null) return seen;
  if (!seen[m.n]) seen[m.n] = { met: now, beaten: 0 };
  // A look (Minustaur's Mom) also counts as meeting its monster (Minustaur).
  if (m.base && !seen[m.base]) seen[m.base] = { met: now, beaten: 0 };
  return seen;
}
export function beat(seen, m, now) {
  if (m.cursed != null) return seen;
  meet(seen, m, now);
  seen[m.n].beaten = (seen[m.n].beaten || 0) + 1;
  if (m.base) seen[m.base].beaten = (seen[m.base].beaten || 0) + 1;
  return seen;
}
