// Chests, money and items (DESIGN.md §6.3): the rules, no DOM, so they run in Node for the tests.
// app.js shows them; lines.js has what the voice says about them.
//
// A chest comes about 1 floor in 3 after the floor's monster is beaten, and after every boss; never
// on the rescue floor. Its lock is a learned fact from the stratum's band, answered on the number
// pad (or < = >). Right: it opens. Wrong: the lock jams, the fact goes to the retry queue, and a
// second lock is tried; a second miss leaves it shut. A missed lock costs nothing.
// Inside, one thing: money about half the time, an item about a third, otherwise (for now) money.
import { pool, factOf, learned, notRecent } from "./learn.js";

export const CHEST_SHARE = 1 / 3, LOCKS = 2;
// m: the floor's monster. A boss always has one; the rescue floor (a cursed hero) never does.
export function chestAfter(m, rnd) {
  if (m.boss) return true;
  if (m.cursed != null) return false;
  return (rnd || Math.random)() < CHEST_SHARE;
}

// The kinds of fact a lock can hold: ones that read as one line of text (no coin pile, rectangle
// or array to draw). The key's first character says the kind (learn.js keyOf).
const LOCKABLE = "+-×÷□○=MΣ/≈";
export const lockable = (key) => LOCKABLE.includes(key[0]);
// A lock's fact key: a learned one (box 3+) from the band, not one asked lately (recent), not
// `not` (the lock that just jammed). With none learned yet, one answered right before; with none
// of those, the band's easiest.
export function lockKey(bandKey, recs, opts = {}) {
  const rnd = opts.rnd || Math.random, skip = (opts.recent || []).concat(opts.not ? [opts.not] : []);
  const all = pool(bandKey).filter((f) => lockable(f.key) && f.key !== opts.not);
  const pickFrom = (list) => { const fresh = notRecent(list, skip); const l = fresh.length ? fresh : list; return l[Math.floor(rnd() * l.length)].key; };
  const known = all.filter((f) => learned(recs[f.key]));
  if (known.length) return pickFrom(known);
  const right = all.filter((f) => recs[f.key] && recs[f.key].c > 0);
  if (right.length) return pickFrom(right);
  const easy = all.filter((f) => f.level === 0);
  return pickFrom(easy.length ? easy : all);
}
export const lockOf = (key, rnd) => factOf(key, rnd);

// What's inside: "money" or an item, one of ITEMS' ids. Clothing (DESIGN.md §6.3, later) is the
// rest: when it's built, CLOTHING_READY turns on and a clothing pick goes here; until then it's money.
export const MONEY_SHARE = 0.5, ITEM_SHARE = 1 / 3, CLOTHING_READY = false;
export function contents(rnd) {
  const r = rnd || Math.random, roll = r();
  if (roll < MONEY_SHARE) return { kind: "money" };
  if (roll < MONEY_SHARE + ITEM_SHARE) return { kind: "item", item: ITEMS[Math.floor(r() * ITEMS.length)].id };
  // The clothing hook: a piece you don't have yet, once clothing is built.
  return CLOTHING_READY ? { kind: "clothing" } : { kind: "money" };
}

/* ---------- money ----------
   Saved per player in cents (wallet), never lost. Found as a small pile of coins: the Cellar's
   chests hold one coin (K names the coins), its boss's two; the Hall's, the Mines' and the Tower's
   a few mixed coins, more from a boss. Always the fewest coins for the amount, so the count read
   aloud is the one a kid would make. */
export const ONE_COIN = [1, 5, 10, 25];
export const CELLAR_BOSS = [15, 20, 30, 35, 50]; // two coins each: a dime and a nickel, two dimes ...
export const MONEY = {
  cellar: { coins: ONE_COIN, boss: CELLAR_BOSS },
  hall: { min: 2, max: 50, bossMin: 40, bossMax: 99 },
  mines: { min: 6, max: 75, bossMin: 50, bossMax: 99 },
  tower: { min: 6, max: 75, bossMin: 50, bossMax: 99 }
};
// Cents found in a chest in wing `wingId` (a boss's when boss).
export function moneyFor(wingId, boss, rnd) {
  const r = rnd || Math.random, m = MONEY[wingId] || MONEY.mines;
  if (m.coins) { const list = boss ? m.boss : m.coins; return list[Math.floor(r() * list.length)]; }
  const lo = boss ? m.bossMin : m.min, hi = boss ? m.bossMax : m.max;
  return lo + Math.floor(r() * (hi - lo + 1));
}
// The fewest coins (and $1 bills past a dollar) for an amount: { bills, q, d, n, p }.
export function fewest(cents) {
  let c = Math.max(0, Math.round(cents));
  const out = { bills: Math.floor(c / 100) }; c %= 100;
  out.q = Math.floor(c / 25); c %= 25;
  out.d = Math.floor(c / 10); c %= 10;
  out.n = Math.floor(c / 5); out.p = c % 5;
  return out;
}

/* ---------- items ----------
   Every item found goes in the inventory (counts, no limit, kept between runs). Three quick-use
   slots sit by the hearts in a fight: a slot holds one item, filled from the inventory card, and
   each item is one use: using it takes it from the inventory and empties the slot, which stays
   empty until the player fills it again from the inventory card. */
export const ITEMS = [
  { id: "pie", icon: "🥧", name: "Pie" },
  { id: "shield", icon: "🛡️", name: "Shield" },
  { id: "totem", icon: "✖️", name: "Times Two Totem" },
  { id: "magnet", icon: "🧲", name: "Hero Magnet" }
];
export const itemOf = (id) => ITEMS.find((i) => i.id === id);
export const SLOTS = 3;
// The saved inventory: { have: { id: count }, slots: [id or null] × SLOTS }.
export function freshItems(saved) {
  const s = saved && typeof saved === "object" ? saved : {}, have = {};
  ITEMS.forEach((i) => { const n = s.have && s.have[i.id]; if (n > 0) have[i.id] = Math.floor(n); });
  const slots = [];
  // A slot holds one of an item you have: no more slots of an item than you have of it.
  const held = {};
  for (let k = 0; k < SLOTS; k++) {
    const id = Array.isArray(s.slots) ? s.slots[k] : null, ok = !!itemOf(id) && (held[id] || 0) < (have[id] || 0);
    if (ok) held[id] = (held[id] || 0) + 1;
    slots.push(ok ? id : null);
  }
  return { have, slots };
}
export const countOf = (inv, id) => inv.have[id] || 0;
export function gain(inv, id, n = 1) { inv.have[id] = countOf(inv, id) + n; return inv; }
// How many slots hold an item.
const slotted = (inv, id) => inv.slots.filter((s) => s === id).length;
// Tapping an item on the inventory card puts it in the next empty slot (or, with all full, the
// first one is replaced). A second copy of an item goes in another slot only if there's one to
// fill it. Returns the slot it went in, or -1.
export function putInSlot(inv, id) {
  if (!countOf(inv, id) || slotted(inv, id) >= countOf(inv, id)) return -1;
  let k = inv.slots.indexOf(null);
  if (k < 0) { inv.slots = inv.slots.slice(1).concat([null]); k = SLOTS - 1; }
  inv.slots[k] = id;
  return k;
}
export function clearSlot(inv, k) { inv.slots[k] = null; return inv; }
// Using slot k: each item is one use. It comes out of the inventory and the slot empties, and
// stays empty: slots never refill by themselves, only from the inventory card. Returns the item's
// id, or null.
export function useSlot(inv, k) {
  const id = inv.slots[k];
  if (!id || !countOf(inv, id)) return null;
  inv.have[id]--; inv.slots[k] = null;
  return id;
}

// The items' effects, on the run's state fx: { shield, totem, magnet } (each armed or not).
// A Pie heals a heart, up to the band's most; at full hearts it isn't used.
export function eatPie(hearts, max) { return hearts < max ? { hearts: hearts + 1, used: true } : { hearts, used: false }; }
// Arming the Shield, Totem or Magnet; one at a time each, so a second isn't wasted.
export function arm(fx, id) { if (fx[id]) return false; fx[id] = true; return true; }
// A miss with the Shield up: no heart lost (even a charged miss), and the Shield is gone. The fact
// still counts as missed for learning (app.js).
export function blockMiss(fx, cost) { if (!fx.shield) return cost; fx.shield = false; return 0; }
// A right answer with the Totem up hits double, once.
export function totemMult(fx) { if (!fx.totem) return 1; fx.totem = false; return 2; }
// The Magnet: the next right answer with a team hero's digit is a Hero Moment (moments.js decide
// with always); it waits for one, and is spent only when a moment happens.
export function magnetSpent(fx, mo) { if (fx.magnet && mo) { fx.magnet = false; return true; } return false; }
