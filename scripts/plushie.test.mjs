// The plushies (js/plushie.js): each draws cleanly and has a name; ten picked, each one hero's
// favorite; found in chests (rarely, never twice) and sold by Trollar (loot.js, shop.js); everyone
// has Pluffy; and on the start scene's surface (descent.js surfaceHTML) each sits at its hero's
// feet, inside the screen, even with a full team.
import assert from "node:assert/strict";
import { plushSvg, PLUSH, PLUSH_HEART, PLUSHIES, CANDIDATES, FAVORITE, favoriteOf, heroOfPlush, plushById, isPlush } from "../js/plushie.js";
import { contents, freshWardrobe, addPlush, hasPlush, plushLeft, PLUSH_SHARE } from "../js/loot.js";
import { freshShop, restock, forSale, priceOf, allPrices, STOCK, PLUSH_STOCK, K_PLUSH_PRICE } from "../js/shop.js";
import { findable } from "../js/clothes.js";

// descent.js loads sfx.js, which listens for taps: a stand-in document and window for Node.
globalThis.document = globalThis.document || { addEventListener() {}, removeEventListener() {} };
globalThis.addEventListener = globalThis.addEventListener || (() => {});
globalThis.window = globalThis.window || globalThis;
const { surfaceHTML } = await import("../js/descent.js");

const clean = (s, what) => {
  assert.ok(s.startsWith("<svg") && s.endsWith("</svg>"), what);
  assert.ok(!/<text\b/.test(s), `${what}: shapes, not fonts`);
  assert.ok(!/undefined|NaN|null|\[object/.test(s), `${what}: ${(s.match(/.{30}(undefined|NaN|null|\[object).{10}/) || [])[0]}`);
};
// Every candidate tried draws, plain, unlabelled and as a silhouette.
for (const p of CANDIDATES) {
  clean(plushSvg(p.id), p.name);
  clean(plushSvg(p.id, { label: false }), p.name + ", unlabelled");
  clean(plushSvg(p.id, { shadow: true }), p.name + ", a silhouette");
  assert.match(plushSvg(p.id), new RegExp(`aria-label="${p.name}"`));
  assert.ok(p.of && p.why, `${p.name}: which monster it is, and why it was or wasn't picked`);
}
assert.match(plushSvg("pluffy", { label: false }), /aria-hidden="true"/);
assert.equal(new Set(CANDIDATES.map((p) => p.name)).size, CANDIDATES.length, "names are unique");
clean(PLUSH_HEART.replace(/^<svg/, "<svg"), "the heart");

// Ten picked, Pluffy first (the plus plushie everyone had), each one hero's favorite.
assert.equal(PLUSHIES.length, 10);
assert.equal(PLUSH.name, "Pluffy");
assert.equal(PLUSHIES[0], PLUSH);
assert.equal(FAVORITE[1], "pluffy", "Pluffy is Onesie's");
assert.deepEqual(Object.keys(FAVORITE).map(Number), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
assert.deepEqual(new Set(Object.values(FAVORITE)), new Set(PLUSHIES.map((p) => p.id)), "every plushie is one hero's favorite");
for (let d = 0; d <= 9; d++) assert.equal(heroOfPlush(favoriteOf(d).id), d);
for (const p of CANDIDATES) assert.equal(isPlush(p.id), PLUSHIES.includes(p), p.name);
assert.ok(PLUSHIES.every((p) => p.picked) && CANDIDATES.filter((p) => !p.picked).every((p) => !isPlush(p.id)));

// Saved: everyone has Pluffy; only plushies load, each once.
{
  const w = freshWardrobe();
  assert.deepEqual(w.plush, ["pluffy"], "everyone has Pluffy");
  assert.deepEqual(freshWardrobe({ plush: ["mootaur", "mootaur", "nope", "divvydoo"] }).plush, ["pluffy", "mootaur"], "unknown, unpicked and repeated ones dropped");
  assert.ok(addPlush(w, "chompy") && hasPlush(w, "chompy"));
  assert.equal(addPlush(w, "chompy"), false, "a plushie is never had twice");
  assert.equal(addPlush(w, "timesy"), false, "only the ten");
}

// Chests: a rare prize (about PLUSH_SHARE of chests), one not owned, none twice until all are
// found; never in a big chest; only when the owned list is given (so the old callers are unchanged).
{
  let seed = 7; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const w = freshWardrobe(), N = 20000;
  let n = 0, found = 0;
  for (let k = 0; k < N; k++) {
    const c = contents(r, [], true, false, w.plush);
    if (c.kind !== "plush") continue;
    n++;
    assert.ok(!hasPlush(w, c.plush), "never one already owned");
    if (found < 3) { addPlush(w, c.plush); found++; }
  }
  assert.ok(Math.abs(n / N - PLUSH_SHARE) < 0.015, `rare: about ${PLUSH_SHARE} of chests (${n} of ${N})`);
  for (let k = 0; k < 3000; k++) assert.notEqual(contents(r, [], true, false).kind, "plush", "none without the owned list");
  for (let k = 0; k < 3000; k++) assert.notEqual(contents(r, [], true, true, w.plush).kind, "plush", "none in a big chest");
  const all = freshWardrobe({ plush: PLUSHIES.map((p) => p.id) });
  assert.equal(plushLeft(all.plush).length, 0);
  for (let k = 0; k < 3000; k++) assert.notEqual(contents(r, [], true, false, all.plush).kind, "plush", "every one owned: none");
  // Before money a chest can hold one too.
  let early = 0;
  for (let k = 0; k < 3000; k++) if (contents(r, [], false, false, ["pluffy"]).kind === "plush") early++;
  assert.ok(early > 50, `before money too (${early})`);
}

// Trollar: a plushie in each handful (one not owned, unlike the last when there are others), a
// quarter for a K player and its own price under a dollar for older ones; sold out once bought.
{
  let seed = 11; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  assert.equal(priceOf({ kind: "plush", id: "pluffy" }, false), null, "Pluffy isn't sold: everyone has it");
  for (const p of PLUSHIES.slice(1)) {
    assert.equal(priceOf({ kind: "plush", id: p.id }, true), K_PLUSH_PRICE);
    const c = priceOf({ kind: "plush", id: p.id }, false);
    assert.ok(c >= 75 && c < 100, `${p.name}: ${c}¢`);
    assert.ok(allPrices().some((t) => t.kind === "plush" && t.id === p.id && t.c === c), "its price line is recorded");
  }
  let prev = [], owned = ["pluffy"];
  for (let i = 0; i < 30; i++) {
    const s = restock([], r, prev, owned), plush = s.filter(isPlush);
    assert.equal(plush.length, PLUSH_STOCK);
    assert.equal(s.filter((id) => findable().some((p) => p.id === id)).length, STOCK, "the clothing handful is unchanged");
    assert.ok(!plush.some((id) => owned.includes(id)) && !plush.some((id) => prev.includes(id)), "not owned, and new");
    assert.deepEqual(freshShop({ stock: s }).stock, s, "saved and loaded");
    const sale = forSale(freshShop({ stock: s }), [], owned);
    assert.ok(sale.some((t) => t.kind === "plush" && t.id === plush[0]));
    assert.ok(!forSale(freshShop({ stock: s }), [], owned.concat(plush)).some((t) => t.kind === "plush"), "bought: sold out");
    prev = s;
  }
  assert.equal(restock([], r, [], PLUSHIES.map((p) => p.id)).filter(isPlush).length, 0, "nothing left to sell once every one is owned");
  assert.equal(restock([], r, []).filter(isPlush).length, 0, "without the owned list, clothing only");
  assert.deepEqual(freshShop({ stock: ["partyhat", "pluffy", "divvydoo", "chompy", "mootaur"] }).stock, ["partyhat", "chompy"], "only plushies on sale load, one at most");
}

// On the surface: each hero carrying a plushie has it at their feet, inside the screen and on the
// grass, with a full team at an iPhone SE's widths and wider; none without; one by the door with
// nobody picked.
{
  const hero = (role, id) => ({ svg: "<svg></svg>", role, plush: id ? plushSvg(id) : "", plushId: id || "" });
  assert.ok(!surfaceHTML({ W: 375, H: 667, hz: 150, heroes: [hero("cap")] }).includes("d-plush"));
  for (const W of [320, 375, 390, 768, 1280]) {
    for (const n of [0, 1, 4, 9]) {
      const heroes = n ? [hero("cap", "pluffy")].concat(PLUSHIES.slice(1, n + 1).map((p) => hero("team", p.id))) : [];
      const html = surfaceHTML({ W, H: 700, hz: 160, heroes, plush: plushSvg() });
      const toys = [...html.matchAll(/class="d-plush"(?: data-plush="(\w*)")? style="left:(-?\d+)px;top:(-?\d+)px;width:(\d+)px/g)];
      assert.equal(toys.length, n ? heroes.length : 1, `${W} px, ${n} with the captain: one plushie each`);
      for (const [, id, l, t, w] of toys) {
        const left = +l, top = +t, wd = +w;
        assert.ok(left >= -wd / 3 && left + wd <= W + wd / 3 && top > 40 && top < 175 && wd >= 12, `${id || "Pluffy"} in view at ${W} px: ${left}, ${top}, ${wd}`);
      }
      if (n) assert.deepEqual(toys.map((m) => m[1]), heroes.map((h) => h.plushId), "each by its own hero");
    }
  }
}
// Every plushie's name and whose favorite it is are recorded, in the "loot" sprite.
{
  const { spokenLines, plushName, plushFavLine, spriteFor } = await import("../js/lines.js");
  const lines = spokenLines();
  for (const p of PLUSHIES) for (const t of [plushName(p.id), plushFavLine(p.id)]) {
    const l = lines.find((x) => x.text === t);
    assert.ok(l && spriteFor(l) === "loot", t);
  }
  assert.equal(plushName("evenstevens"), "An Even Stevens plushie!");
  assert.equal(plushFavLine("evenstevens"), "It's Toodini's favorite!");
}
console.log("plushie: ok");
