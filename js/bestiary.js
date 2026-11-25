// The Bestiary (DESIGN.md §6.2): every Wing's monsters, which ones a player has met and beaten,
// and a mastery ring per monster for how much of its kind of math is learned. No DOM.
import { MON } from "./monsters.js";
import { WINGS } from "./wings.js";
import { pool, learned } from "./learn.js";

// [{ wing, m }] in Wing order: each Wing's pool, then its boss.
export function roster() {
  const out = [];
  for (const w of WINGS) for (const n of w.pool.concat([w.boss])) out.push({ wing: w, m: MON.find((x) => x.n === n) });
  return out;
}

// The share (0–1) of a monster's facts learned: its operation's facts in its Wing's band, or every
// fact there for a monster that mixes or prefers none.
export function mastery(m, wing, recs) {
  // A monster with its own strand (Trollar's coins) is measured on that strand.
  const p = pool(m.strand || wing.band), mine = p.filter((f) => f.op === m.op);
  const facts = mine.length ? mine : p;
  return facts.filter((f) => learned(recs[f.key])).length / facts.length;
}

// Records that a monster was met or beaten: seen = { [name]: { met: time, beaten: count } }.
export function meet(seen, m, now) {
  if (m.cursed != null) return seen;
  if (!seen[m.n]) seen[m.n] = { met: now, beaten: 0 };
  return seen;
}
export function beat(seen, m, now) {
  if (m.cursed != null) return seen;
  meet(seen, m, now);
  seen[m.n].beaten = (seen[m.n].beaten || 0) + 1;
  return seen;
}
