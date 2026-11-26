// Trollar's shop (js/shop.js, DESIGN.md §6.3): prices, stock, paying and change.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ITEM_PRICE, K_ITEM_PRICE, K_CLOTHING_PRICE, kPrices, priceOf, allPrices, STOCK, freshShop, restock, forSale, TOKENS, valueOf, empty, total, count, purseOf, purseFor, left, canAfford, putDown, takeBack, enough, pay } from "../js/shop.js";
import { ITEMS, fewest } from "../js/loot.js";
import { CLOTHES, clothesById, findable } from "../js/clothes.js";
import { seeded } from "../js/moments.js";
import { spokenLines, SHOP, priceLine, changeLine, clothingName, GROUPS, ALWAYS } from "../js/lines.js";

const r = seeded(11);
// Fisher–Yates with the seeded r: the same order in every JavaScript engine. (A sort with a random
// comparator depends on the engine's sort, so CI's Node and a Mac's counted different results.)
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Prices: a K player's are single coins (a nickel, a dime or a quarter); older players' are like
// 35¢ or 60¢, clothing at each piece's price hint. Special pieces are never sold.
const ONE_COIN = [5, 10, 25];
for (const i of ITEMS) {
  assert.ok(ONE_COIN.includes(K_ITEM_PRICE[i.id]), `K ${i.id} is one coin`);
  assert.ok(ITEM_PRICE[i.id] >= 30 && ITEM_PRICE[i.id] < 100, `${i.id} costs ${ITEM_PRICE[i.id]}`);
}
assert.ok(ONE_COIN.includes(K_CLOTHING_PRICE));
assert.ok(new Set(Object.values(K_ITEM_PRICE)).size === 3, "K prices use a nickel, a dime and a quarter");
for (const p of CLOTHES) {
  if (p.tier === "special") { assert.equal(priceOf({ kind: "clothing", id: p.id }, false), null, `${p.id} is never sold`); continue; }
  assert.equal(priceOf({ kind: "clothing", id: p.id }, false), p.price);
  assert.equal(priceOf({ kind: "clothing", id: p.id }, true), K_CLOTHING_PRICE);
  // Clothing takes saving up: more than any item for an older player.
  assert.ok(p.price >= 25 && p.price < 100);
}
assert.ok(kPrices(0) && kPrices(null) && !kPrices(1) && !kPrices(3));
for (const t of allPrices()) {
  assert.ok(t.c > 0 && t.c < 100, "every price is under a dollar");
  if (t.k) { const f = fewest(t.c); assert.equal(f.q + f.d + f.n + f.p, 1, `K price ${t.c} is one coin`); }
}

// Stock: STOCK pieces the player doesn't own, never special ones; new after each run; the items
// always for sale; a piece bought is sold out until the next handful.
{
  const owned = [];
  let prev = [];
  for (let run = 0; run < 200; run++) {
    const s = restock(owned, r, prev);
    assert.equal(new Set(s).size, s.length, "no piece twice");
    assert.equal(s.length, Math.min(STOCK, findable().length - owned.length));
    for (const id of s) { assert.ok(clothesById[id].tier !== "special", "never a special piece"); assert.ok(!owned.includes(id), "never one owned"); }
    if (findable().length - owned.length >= 2 * STOCK) assert.ok(!s.some((id) => prev.includes(id)), "a new handful after each run");
    const shop = freshShop({ stock: s });
    const sale = forSale(shop, owned);
    assert.deepEqual(sale.filter((t) => t.kind === "item").map((t) => t.id), ITEMS.map((i) => i.id), "the items are always in stock");
    if (run % 3 === 0 && s.length) owned.push(s[0]); // bought one
    assert.ok(!forSale(shop, owned).some((t) => t.kind === "clothing" && owned.includes(t.id)), "bought: sold out");
    prev = s;
  }
  const all = findable().map((p) => p.id);
  assert.deepEqual(restock(all, r, []), [], "nothing left to sell once every piece is owned");
  assert.deepEqual(freshShop({ stock: ["badge-cellar", "partyhat", "nope"] }).stock, ["partyhat"], "special and unknown pieces never load");
}

// Paying: from every wallet, for every price. The purse is the wallet as the fewest bills and
// coins. A kid taps coins on (biggest first, smallest first, or at random) until there's enough;
// the counter total is the coins on it; Buy only works with enough; change is total − price as the
// fewest coins; the wallet loses exactly the price.
{
  const prices = [...new Set(allPrices().map((t) => t.c))];
  const orders = [TOKENS.map((t) => t.k), TOKENS.map((t) => t.k).reverse(), null];
  let buys = 0, exact = 0;
  for (let w = 0; w <= 600; w++) for (const c of prices) for (const order of orders) {
    const purse = purseOf(w);
    assert.equal(total(purse), w, "the purse is the wallet");
    const f = fewest(w);
    assert.deepEqual(purse, { b: f.bills, q: f.q, d: f.d, n: f.n, p: f.p });
    assert.deepEqual(purseFor(w, null), purse);
    assert.deepEqual(purseFor(w + 1, purse), purseOf(w + 1), "a visit's purse is kept only while it adds up");
    const counter = empty();
    assert.equal(pay(purse, counter, c).ok, false, "never pays for you: nothing down");
    if (!canAfford(w, c)) { assert.ok(w < c); continue; }
    // Tap coins down until enough.
    let guard = 0;
    while (!enough(counter, c) && guard++ < 100) {
      const l = left(purse, counter), ks = (order || shuffle(TOKENS.map((t) => t.k))).filter((k) => l[k] > 0);
      const before = total(counter);
      assert.equal(pay(purse, counter, c).ok, false, "never pays while short");
      assert.ok(putDown(purse, counter, ks[0], c));
      assert.equal(total(counter), before + valueOf(ks[0]), "the counter adds the coin");
    }
    assert.ok(enough(counter, c), `${w}¢ can pay ${c}¢`);
    // With enough down, no more coins go on (one coin may take it over: that's change).
    for (const k of TOKENS.map((t) => t.k)) assert.equal(putDown(purse, counter, k, c), false, "enough: no more coins");
    // Taking one back and putting it down again.
    const k0 = TOKENS.find((t) => counter[t.k] > 0).k;
    assert.ok(takeBack(counter, k0)); assert.equal(takeBack(empty(), "q"), false);
    if (!enough(counter, c)) assert.ok(putDown(purse, counter, k0, c)); else counter[k0]++;
    const t = total(counter), res = pay(purse, counter, c);
    assert.ok(res.ok);
    assert.equal(res.wallet, w - c, "the wallet loses the price");
    assert.equal(res.change, t - c);
    assert.ok(res.change < 100, "change is always under a dollar");
    assert.equal(total(res.changeCoins), res.change);
    const ff = fewest(res.change);
    assert.equal(count(res.changeCoins), ff.q + ff.d + ff.n + ff.p, "change as the fewest coins");
    assert.equal(res.exact, res.change === 0);
    // The purse after: what was left, plus the change, adding up to the new wallet.
    assert.equal(total(res.purse), w - c);
    for (const x of TOKENS) assert.equal(res.purse[x.k], purse[x.k] - counter[x.k] + res.changeCoins[x.k]);
    assert.deepEqual(purseFor(res.wallet, res.purse), res.purse, "the visit keeps the change as given");
    // Coins the purse doesn't have can't be paid with.
    const fake = Object.assign(empty(), { b: purse.b + 1 });
    assert.equal(pay(purse, fake, c).ok, false, "only coins from the purse");
    buys++; if (res.exact) exact++;
  }
  assert.ok(buys > 10000 && exact > 500, `${buys} buys, ${exact} exact`); // about 1,000 exact: enough to cover it
}

// The lines: every price, change and clothing name recorded, short, in small sprites loaded always.
{
  const lines = spokenLines(), ids = new Set(lines.map((l) => l.kind + ":" + l.text));
  const words = (t) => t.split(/\s+/).length;
  for (const t of Object.values(SHOP)) assert.ok(ids.has("p:" + t) && words(t) <= 12, t);
  for (const t of allPrices()) assert.ok(ids.has("p:" + priceLine(t, t.c)), priceLine(t, t.c));
  for (let c = 1; c < 100; c++) assert.ok(ids.has("p:" + changeLine(c)));
  for (const p of findable()) assert.ok(ids.has("p:" + clothingName(p.id)), clothingName(p.id));
  assert.equal(priceLine({ kind: "item", id: "pie" }, 35), "The pie costs thirty-five cents.");
  assert.equal(priceLine({ kind: "clothing", id: "sunglasses" }, 45), "The sunglasses cost forty-five cents.");
  assert.equal(changeLine(10), "Here's ten cents back!");
  assert.equal(clothingName("partyhat"), "A party hat!");
  assert.equal(clothingName("eyepatch"), "An eye patch!");
  assert.equal(clothingName("bunnyears"), "Bunny ears!");
  assert.ok(GROUPS.includes("Shop") && GROUPS.includes("Clothing"));
  for (const l of lines.filter((l) => l.group === "Shop" || l.group === "Clothing")) assert.ok(ALWAYS.includes(l.file.replace(/\.\d+$/, "")), `${l.text} is loaded on the start screen`);
  const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
  for (const k of Object.keys(SHOP)) assert.ok(app.includes("SHOP." + k), `SHOP.${k} is recorded but never said`);
  assert.ok(/if \(!r\.ok\) return; \/\/ never pays for you/.test(app), "Buy pays only with enough down");
}
console.log("✓ shop: prices, stock, paying and change");
