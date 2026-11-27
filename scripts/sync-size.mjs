// How big a busy player's sync record gets, sealed: every fact of every band seen on three
// devices, every stratum deep with stars, every monster met, every quip deck, the whole wardrobe.
// bigRecord sizes MAX_BYTES (sync/src/api.js); scripts/sync.test.mjs checks it still fits.
// Run alone: node scripts/sync-size.mjs
import { BANDS, pool } from "../js/learn.js";
import { WINGS } from "../js/wings.js";
import { MON } from "../js/monsters.js";
import { QUIPS } from "../js/moments.js";
import { CLOTHES } from "../js/clothes.js";
import { ITEMS } from "../js/loot.js";
import { toRecord, merge, pack } from "../js/merge.js";

export const DEVICES = ["a1b2c3d4", "e5f6g7h8", "i9j0k1l2"];

// A player who has seen every fact there is, many times, on one device (seed: which device).
export function busyPlayer(seed = 1) {
  let x = seed * 7919;
  const rnd = () => ((x = (x * 16807) % 2147483647) / 2147483647);
  const facts = {};
  for (const b of Object.keys(BANDS)) for (const f of pool(b)) {
    const n = 3 + Math.floor(rnd() * 40);
    facts[f.key] = { b: Math.floor(rnd() * 5), n, c: Math.floor(n * (0.6 + rnd() * 0.4)), ms: 900 + Math.floor(rnd() * 9000), t: 1795000000000 + Math.floor(rnd() * 9e9), ...(rnd() < 0.2 ? { placed: 1 } : {}) };
  }
  const wings = {};
  for (const w of WINGS) wings[w.id] = { boss: 40, best: 7, stars: [3, 3, 2, 3, 3, 1, 3], depth: 40, depthStars: Object.fromEntries(Array.from({ length: 40 }, (_, i) => [i + 1, 10 + (i % 9)])), megas: 8, steps: 30, legend: 1795000000000, unlocked: true };
  const bestiary = Object.fromEntries(MON.map((m) => [m.n, { met: 1795000000000 + Math.floor(rnd() * 1e9), beaten: 30 }]));
  const decks = {}, heard = {};
  for (const d of Object.keys(QUIPS)) { decks[d] = QUIPS[d].slice(0, 2); heard[d] = QUIPS[d].slice(); }
  const told = Object.fromEntries(Array.from({ length: 80 }, (_, i) => ["tag" + i, 3]));
  const owned = CLOTHES.map((c) => c.id);
  return {
    settings: { band: "third", start: "kinder", grade: 2, sfx: true, voice: true, ops: ["+", "-"], diff: "easy", timer: false },
    best: 7, facts, wings, bestiary, dungeon: 6,
    heroes: { captain: 3, color: "#ffc93c", rescued: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], cracks: {} },
    spells: { templates: {}, reversed: { 3: 4, 7: 2, 9: 5 }, cast: 300 },
    told,
    moments: { decks, heard, debut: [], dry: 2, last: 4, captains: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], named: [3, 5, 1] },
    wallet: 4321, items: { have: Object.fromEntries(ITEMS.map((i) => [i.id, 7])), slots: [ITEMS[0].id, ITEMS[1].id, null] },
    wardrobe: { owned, wear: { 3: { head: owned[0] } } }, shop: { stock: owned.slice(0, 4) }
  };
}

// A more typical busy player: a school year in two strata on two devices, about 900 facts seen,
// practiced in 120 sittings.
export function yearPlayer(seed = 1) {
  const p = busyPlayer(seed);
  let x = seed * 104729;
  const rnd = () => ((x = (x * 16807) % 2147483647) / 2147483647);
  const facts = {};
  for (const b of ["kinder", "first", "coinsK", "more", "flashK", "timeH", "patK", "shapesK"]) for (const f of pool(b).slice(0, Math.ceil(pool(b).length * 0.9))) {
    const n = 1 + Math.floor(rnd() * 12), sitting = Math.floor(rnd() * 120);
    facts[f.key] = { b: Math.min(4, Math.floor(n / 3)), n, c: Math.max(0, n - Math.floor(rnd() * 3)), ms: 1500 + Math.floor(rnd() * 4000), t: 1795000000000 + sitting * 86400000 + Math.floor(rnd() * 1200000) };
  }
  p.facts = facts;
  return p;
}

// The biggest realistic player: every fact of every band and strand there is (K to 3rd), each seen
// 1 to 20 times over three school years of sittings, on two devices. MAX_BYTES is sized from this.
export function bigPlayer(seed = 1) {
  const p = busyPlayer(seed);
  let x = seed * 104729;
  const rnd = () => ((x = (x * 16807) % 2147483647) / 2147483647);
  const facts = {};
  for (const b of Object.keys(BANDS)) for (const f of pool(b)) {
    const n = 1 + Math.floor(rnd() * 20), sitting = Math.floor(rnd() * 400);
    facts[f.key] = { b: Math.min(4, Math.floor(n / 3)), n, c: Math.max(0, n - Math.floor(rnd() * 4)), ms: 1500 + Math.floor(rnd() * 6000), t: 1795000000000 + sitting * 86400000 + Math.floor(rnd() * 1200000) };
  }
  p.facts = facts;
  return p;
}
export function bigRecord() {
  let rec = null;
  DEVICES.slice(0, 2).forEach((dev, i) => { rec = merge(rec, toRecord(bigPlayer(i + 1), null, dev)); });
  return rec;
}

// The record after three devices have each played everything, every fact many times at random
// times: more than any player will reach (its times don't come in sittings, so they pack poorly).
export function busyRecord() {
  let rec = null;
  DEVICES.forEach((dev, i) => { rec = merge(rec, toRecord(busyPlayer(i + 1), null, dev)); });
  return rec;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { gzipSync } = await import("node:zlib");
  const kb = (n) => (n / 1024).toFixed(1) + " KB";
  const rec = busyRecord(), json = JSON.stringify(pack(rec));
  console.log(`facts: ${Object.keys(rec.facts).length}`);
  console.log(`three devices: JSON ${kb(json.length)}, gzip ${kb(gzipSync(json).length)} (sealing adds 29 bytes)`);
  const one = JSON.stringify(pack(toRecord(busyPlayer(1), null, DEVICES[0])));
  console.log(`one device: JSON ${kb(one.length)}, gzip ${kb(gzipSync(one).length)}`);
  let y = null;
  DEVICES.slice(0, 2).forEach((dev, i) => { y = merge(y, toRecord(yearPlayer(i + 1), null, dev)); });
  const yj = JSON.stringify(pack(y));
  console.log(`a school year (${Object.keys(y.facts).length} facts, two devices): JSON ${kb(yj.length)}, gzip ${kb(gzipSync(yj).length)}`);
  const big = JSON.stringify(pack(bigRecord()));
  console.log(`the biggest realistic player (every fact, three years, two devices): JSON ${kb(big.length)}, gzip ${kb(gzipSync(big).length)}`);
  const { facts, ...rest } = rec;
  console.log(`without facts: gzip ${kb(gzipSync(JSON.stringify(rest)).length)}`);
}
