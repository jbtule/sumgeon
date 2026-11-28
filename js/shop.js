// Trollar's shop (DESIGN.md §6.3): prices, the stock and paying. No DOM, so it runs in Node for the
// tests; app.js shows it (shopCard), chest.js draws the stall, lines.js has what's said.
//
// It sells the four items, always in stock, and a rotating handful of clothing the player doesn't
// own (STOCK pieces, new after each run, never the special ones). Prices are in cents. A K player's
// are single coins (a nickel, a dime, a quarter); older players' are like 35¢ or 60¢, and clothing
// uses each piece's price hint (clothes.js).
//
// Paying is the math: the purse is the wallet as the fewest bills and coins (loot.js fewest), and
// the player taps them onto the counter, one at a time, until there's enough. The game never pays:
// Buy only works with enough on the counter. Too much gives change back as the fewest coins. The
// wallet stays cents: the coins shown are always derived from it.
import { ITEMS, fewest } from "./loot.js";
import { clothesById, findable } from "./clothes.js";

export const ITEM_PRICE = { pie: 35, shield: 45, totem: 60, magnet: 50 };
export const K_ITEM_PRICE = { pie: 5, shield: 10, totem: 10, magnet: 25 };
export const K_CLOTHING_PRICE = 25;
// K prices for a kindergartner (grade 0, or no grade picked yet).
export const kPrices = (grade) => grade == null || grade === 0;
// A thing for sale: { kind: "item" | "clothing", id }. Its price in cents.
export function priceOf(thing, k) {
  if (thing.kind === "item") return (k ? K_ITEM_PRICE : ITEM_PRICE)[thing.id];
  const p = clothesById[thing.id];
  if (!p || p.tier === "special" || p.price == null) return null;
  return k ? K_CLOTHING_PRICE : p.price;
}
// Every price a player can see: for the tests and the recorded price lines.
export function allPrices() {
  const out = [];
  for (const k of [true, false]) {
    ITEMS.forEach((i) => out.push({ kind: "item", id: i.id, k, c: priceOf({ kind: "item", id: i.id }, k) }));
    findable().forEach((p) => out.push({ kind: "clothing", id: p.id, k, c: priceOf({ kind: "clothing", id: p.id }, k) }));
  }
  return out;
}

/* ---------- the stock ---------- */
export const STOCK = 4;
// Saved per player as shop: { stock: [piece ids] }.
export function freshShop(saved) {
  const s = saved && typeof saved === "object" ? saved : {};
  return { stock: Array.isArray(s.stock) ? s.stock.filter((id) => clothesById[id] && clothesById[id].tier !== "special").slice(0, STOCK) : [] };
}
// A new handful of clothing (after each run): STOCK pieces the player doesn't own, picked at
// random, unlike the last handful when there are enough others.
export function restock(owned, rnd, prev) {
  const r = rnd || Math.random, left = findable().filter((p) => !(owned || []).includes(p.id)).map((p) => p.id);
  const fresh = left.filter((id) => !(prev || []).includes(id)), from = fresh.length >= STOCK ? fresh : left.slice();
  const out = [];
  while (out.length < STOCK && from.length) out.push(from.splice(Math.floor(r() * from.length), 1)[0]);
  // Topped up from the last handful when there weren't enough new ones.
  const rest = left.filter((id) => !out.includes(id));
  while (out.length < STOCK && rest.length) out.push(rest.splice(Math.floor(r() * rest.length), 1)[0]);
  return out;
}
// What's on sale now: the four items, then the stock's pieces not owned yet (one bought is sold
// out until the next run's handful).
export function forSale(shop, owned) {
  return ITEMS.map((i) => ({ kind: "item", id: i.id }))
    .concat(shop.stock.filter((id) => !(owned || []).includes(id)).map((id) => ({ kind: "clothing", id })));
}

/* ---------- paying ----------
   Money as tokens: b ($1 bill), q, d, n, p. A purse or a counter is { b, q, d, n, p } counts. */
export const TOKENS = [{ k: "b", v: 100 }, { k: "q", v: 25 }, { k: "d", v: 10 }, { k: "n", v: 5 }, { k: "p", v: 1 }];
export const valueOf = (k) => TOKENS.find((t) => t.k === k).v;
export const empty = () => ({ b: 0, q: 0, d: 0, n: 0, p: 0 });
export const total = (c) => TOKENS.reduce((a, t) => a + (c[t.k] || 0) * t.v, 0);
export const count = (c) => TOKENS.reduce((a, t) => a + (c[t.k] || 0), 0);
// The purse: the wallet as the fewest bills and coins. That's how it opens; within one visit to
// the shop the coins stay as they are (the coins given in change stay those coins, so a kid who
// paid a quarter for a nickel's pie sees two dimes come back and stay), and the next visit derives
// them from the cents again.
export function purseOf(cents) { const f = fewest(cents); return { b: f.bills, q: f.q, d: f.d, n: f.n, p: f.p }; }
// A visit's purse, kept only while it still adds up to the wallet; otherwise the fewest coins.
export const purseFor = (cents, kept) => (kept && total(kept) === cents ? kept : purseOf(cents));
// What's left in the purse with the counter's coins out of it.
export function left(purse, counter) {
  const out = empty();
  TOKENS.forEach((t) => { out[t.k] = (purse[t.k] || 0) - (counter[t.k] || 0); });
  return out;
}
export const canAfford = (cents, price) => cents >= price;
// Tapping a coin in the purse puts it on the counter, while the counter is short of the price (one
// coin can take it over: that's change). Returns false when it can't go: none of that coin left,
// or there's already enough.
export function putDown(purse, counter, k, price) {
  if (total(counter) >= price || left(purse, counter)[k] <= 0) return false;
  counter[k] = (counter[k] || 0) + 1;
  return true;
}
// Tapping a coin on the counter takes it back.
export function takeBack(counter, k) { if (!(counter[k] > 0)) return false; counter[k]--; return true; }
export const enough = (counter, price) => total(counter) >= price;
// Buy: only with enough on the counter, from coins the purse has. The wallet loses the price; the
// change (total − price) comes back as the fewest coins, into the purse. exact: no change.
export function pay(purse, counter, price) {
  const t = total(counter), l = left(purse, counter);
  if (t < price || TOKENS.some((x) => l[x.k] < 0)) return { ok: false, wallet: total(purse) };
  const change = t - price, f = fewest(change), changeCoins = { b: f.bills, q: f.q, d: f.d, n: f.n, p: f.p }, after = empty();
  TOKENS.forEach((x) => { after[x.k] = l[x.k] + changeCoins[x.k]; });
  return { ok: true, wallet: total(purse) - price, purse: after, change, changeCoins, exact: change === 0 };
}

/* ---------- buying more than one ----------
   An item can be bought 1 to MANY at once (clothing is one each: a piece is owned once). The total
   is the price times how many, and paying, Buy and change all work against it (pay above takes any
   total, and change stays under a dollar, since one coin or bill takes the counter over). How the
   total is written suits the grade: repeated addition up to 2nd grade ("35¢ + 35¢ + 35¢ = 105¢",
   2.OA.C.4), multiplication from 3rd ("3 × 35¢ = $1.05", 3.OA); in dollars once bills are shown
   (2nd grade, app.js billsOK), in cents before, as the purse is. */
export const MANY = 5;
export const manyOK = (thing) => !!thing && thing.kind === "item";
const capOf = (thing) => (!thing || manyOK(thing) ? MANY : 1);
// The most of a thing the purse pays for, 0 to MANY (1 for clothing).
export function mostFor(cents, price, thing) {
  return price > 0 ? Math.max(0, Math.min(capOf(thing), Math.floor(Math.max(0, cents) / price))) : 0;
}
// How many, kept 1 to MANY (1 for clothing), from anything saved or tapped.
export function howMany(n, thing) {
  const k = Math.floor(Number(n));
  return k >= 1 ? Math.min(capOf(thing), k) : 1;
}
// Money as written: "35¢", or past a dollar "$1.05" with bills shown and "105¢" without.
export function moneyText(c, dollars) {
  if (!dollars || c < 100) return c + "¢";
  return "$" + Math.floor(c / 100) + "." + String(c % 100).padStart(2, "0");
}
// Multiplication from 3rd grade; repeated addition before.
export const timesOK = (grade) => grade != null && grade >= 3;
// The total as math: { terms: ["35¢", …] or null, times: "3 × 35¢" or null, total: "$1.05", text }.
export function sumText(price, n, { times = false, dollars = false } = {}) {
  const k = howMany(n), p = moneyText(price, dollars), t = moneyText(price * k, dollars);
  if (k === 1) return { terms: [p], times: null, total: t, text: p };
  if (times) return { terms: null, times: k + " × " + p, total: t, text: k + " × " + p + " = " + t };
  const terms = Array.from({ length: k }, () => p);
  return { terms, times: null, total: t, text: terms.join(" + ") + " = " + t };
}
// Buy n of a thing: the counter must hold the total, and the wallet loses exactly price × n (app.js
// then gains n items). Clothing is always one.
export function payMany(purse, counter, price, n, thing) {
  const k = howMany(n, thing), r = pay(purse, counter, price * k);
  return r.ok ? Object.assign(r, { n: k, total: price * k }) : r;
}
// Every total a player can see for more than one item (2 to MANY, both price lists): for the tests
// and the recorded lines.
export function allTotals() {
  const out = [];
  for (const k of [true, false]) ITEMS.forEach((i) => {
    const c = priceOf({ kind: "item", id: i.id }, k);
    for (let n = 2; n <= MANY; n++) out.push({ kind: "item", id: i.id, k, n, c, total: c * n });
  });
  return out;
}
