// Chests, money and items (js/loot.js, DESIGN.md §6.3).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chestAfter, CHEST_SHARE, lockKey, lockOf, lockable, contents, moneyFor, fewest, ONE_COIN, CELLAR_BOSS, ITEMS, freshItems, countOf, gain, putInSlot, clearSlot, useSlot, eatPie, arm, blockMiss, totemMult, magnetSpent, SLOTS, freshWardrobe, addPiece, putOn, wearOf, ownedFor, unowned } from "../js/loot.js";
import { CLOTHES, clothesById, findable } from "../js/clothes.js";
import { pool, learned } from "../js/learn.js";
import { seeded, decide, freshState, freshRun } from "../js/moments.js";
import { WINGS, runFloors } from "../js/wings.js";
import { openStore, OWN_KEYS } from "../js/store.js";
import { walletSvg, walletMini, chestSvg } from "../js/chest.js";

const r = seeded(7);

// Chests: about 1 floor in 3, every boss, never the rescue floor.
{
  let n = 0, regular = 0;
  for (const w of WINGS) for (let k = 0; k < 400; k++) {
    for (const m of runFloors(w, { captain: 5, rescued: [5] }, r, 1)) {
      const c = chestAfter(m, r);
      if (m.boss) assert.ok(c, "every boss has a chest");
      else if (m.cursed != null) assert.ok(!c, "never the rescue floor");
      else { regular++; if (c) n++; }
    }
  }
  const share = n / regular;
  assert.ok(Math.abs(share - CHEST_SHARE) < 0.03, `about 1 floor in 3 has a chest (${share.toFixed(3)})`);
  assert.equal(chestAfter({ n: "x", cursed: 3 }, () => 0), false);
  assert.equal(chestAfter({ n: "x", boss: true }, () => 0.99), true);
}

// Locks: a learned fact from the stratum's band, one that reads as a line of text; not the one
// that just jammed. With nothing learned, the band's easiest.
for (const b of ["kinder", "first", "second", "third"]) {
  const p = pool(b), recs = {};
  p.filter((f) => lockable(f.key)).forEach((f, i) => { if (i % 5 === 0) recs[f.key] = { b: 3, n: 1, c: 1, ms: 900, t: 0 }; });
  for (let k = 0; k < 200; k++) {
    const key = lockKey(b, recs, { rnd: r });
    assert.ok(learned(recs[key]), `${b}: a lock holds a learned fact (${key})`);
    assert.ok(lockable(key) && p.some((f) => f.key === key));
    const f = lockOf(key, r);
    assert.ok(f.q && !"¢▭▦".includes(f.op), "no pile, rectangle or array on a lock");
  }
  const one = Object.keys(recs)[0], only = { [one]: recs[one], [Object.keys(recs)[1]]: recs[Object.keys(recs)[1]] };
  for (let k = 0; k < 20; k++) assert.notEqual(lockKey(b, only, { rnd: r, not: one }), one, "the second lock is another fact");
  const fresh = lockKey(b, {}, { rnd: r });
  assert.equal(p.find((f) => f.key === fresh).level, 0, "nothing learned yet: the easiest level");
}
assert.ok(!lockable("¢0,1,0,0") && !lockable("▭a4,3") && lockable("+3,4") && lockable("○3+4,8") && lockable("□+7,3"));

// A missed lock costs nothing: app.js's chestSubmit touches no hearts, streak or star.
{
  const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
  const body = app.slice(app.indexOf("function chestSubmit"), app.indexOf("function takeLoot"));
  assert.ok(!/G\.hearts|G\.streak|floorLost|floorSlow|G\.hp/.test(body), "a lock never costs a heart, the streak or a star");
  assert.ok(/G\.retry/.test(body) && /recordAnswer/.test(body), "a lock records the fact, and a jam sends it to the retry queue");
}

// Contents: money about half, an item about a third, clothing the rest: always a piece not owned
// (never a special one), and money once every piece is owned.
{
  const t = { money: 0, item: 0, clothing: 0 }, items = {};
  for (let k = 0; k < 6000; k++) { const c = contents(r); t[c.kind]++; if (c.item) items[c.item] = (items[c.item] || 0) + 1; }
  assert.ok(Math.abs(t.item / 6000 - 1 / 3) < 0.03, `items about a third (${t.item})`);
  assert.ok(Math.abs(t.clothing / 6000 - 1 / 6) < 0.03, `clothing about a sixth (${t.clothing})`);
  assert.equal(Object.keys(items).length, ITEMS.length, "every item turns up");
  // Chests give clothing until the bag is full, each piece once; then money in its place.
  const w = freshWardrobe();
  let n = 0;
  while (unowned(w.owned).length && n < 20000) {
    n++;
    const c = contents(r, w.owned);
    if (c.kind !== "clothing") continue;
    const p = clothesById[c.piece];
    assert.ok(p && p.tier !== "special", `a findable piece (${c.piece})`);
    assert.ok(!w.owned.includes(c.piece), "never one already owned");
    assert.ok(addPiece(w, c.piece));
  }
  assert.equal(w.owned.length, findable().length, "every findable piece, in time");
  assert.ok(!CLOTHES.some((p) => p.tier === "special" && w.owned.includes(p.id)), "never a special piece");
  for (let k = 0; k < 2000; k++) assert.notEqual(contents(r, w.owned).kind, "clothing", "with every piece owned, money instead");
  const all = { money: 0, item: 0 };
  for (let k = 0; k < 3000; k++) all[contents(r, w.owned).kind]++;
  assert.ok(Math.abs(all.money / 3000 - 2 / 3) < 0.04, `money takes clothing's share (${all.money})`);
}

// The wardrobe: owned pieces, worn one per spot by a hero, kept per hero.
{
  const w = freshWardrobe({ owned: ["partyhat", "glasses", "bowtie", "partyhat", "nope"], wear: { 3: { head: "partyhat", face: "crown", neck: "tophat" }, 5: { head: "cape" } } });
  assert.deepEqual(w.owned, ["partyhat", "glasses", "bowtie"], "unknown ids and repeats dropped");
  assert.deepEqual(w.wear, { 3: { head: "partyhat" } }, "only owned pieces, each in its own spot");
  assert.equal(addPiece(w, "partyhat"), false, "a piece is never had twice");
  assert.ok(putOn(w, 3, "glasses") && putOn(w, 3, "bowtie"));
  assert.deepEqual(wearOf(w, 3), { head: "partyhat", face: "glasses", neck: "bowtie" });
  assert.equal(putOn(w, 3, "tophat"), false, "only owned pieces can be worn");
  assert.ok(putOn(w, 7, "partyhat"), "two heroes can wear the same piece");
  assert.ok(putOn(w, 3, null, "face"));
  assert.deepEqual(wearOf(w, 3), { head: "partyhat", neck: "bowtie" }, "none takes a spot off");
  assert.deepEqual(ownedFor(w, "head").map((p) => p.id), ["partyhat"]);
  assert.deepEqual(wearOf(w, null), {});
  // Saved and loaded through store.js (OWN_KEYS).
  assert.ok(OWN_KEYS.includes("wardrobe") && OWN_KEYS.includes("shop"));
  const m = new Map(), ls = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; } };
  const s = openStore(ls); s.upgrade();
  s.player("default").set("wardrobe", w);
  assert.deepEqual(freshWardrobe(s.player("default").get("wardrobe", null)), w, "the wardrobe saves and loads");
  // The game draws every team hero in their outfit.
  const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
  assert.ok(/const heroArt = [^\n]*wear: dressOf\(d\)/.test(app), "heroArt dresses the hero");
  assert.ok(/wear: dressOf\(mo\.hero\)/.test(app), "Hero Moments wear the outfit");
  assert.ok(/svg: heroSvg\(HEROES\[d\], Object\.assign\(\{ wear: dressOf\(d\) \}/.test(app), "the start scene and the descent wear it");
}

// Money per stratum: the Cellar one coin (its boss two), the others a few mixed coins, more from a boss.
{
  const coins = (c) => { const f = fewest(c); return f.q + f.d + f.n + f.p; };
  for (let k = 0; k < 500; k++) {
    const c = moneyFor("cellar", false, r), b = moneyFor("cellar", true, r);
    assert.ok(ONE_COIN.includes(c) && coins(c) === 1, `the Cellar: one coin (${c})`);
    assert.ok(CELLAR_BOSS.includes(b) && coins(b) === 2, `the Cellar's boss: two coins (${b})`);
    for (const w of ["hall", "mines", "tower"]) {
      const m = moneyFor(w, false, r), mb = moneyFor(w, true, r);
      assert.ok(m >= 2 && m <= 75, `${w}: ${m}`);
      assert.ok(mb >= 40 && mb <= 99, `${w} boss: ${mb}`);
    }
  }
  const avg = (w, boss) => { let s = 0; for (let k = 0; k < 2000; k++) s += moneyFor(w, boss, r); return s / 2000; };
  for (const w of ["cellar", "hall", "mines", "tower"]) assert.ok(avg(w, true) > avg(w, false), `${w}: a boss chest holds more`);
  assert.ok(avg("mines", false) > avg("cellar", false));
}

// The fewest coins: quarters, dimes, nickels, pennies, and $1 bills past a dollar.
assert.deepEqual(fewest(0), { bills: 0, q: 0, d: 0, n: 0, p: 0 });
assert.deepEqual(fewest(23), { bills: 0, q: 0, d: 2, n: 0, p: 3 });
assert.deepEqual(fewest(99), { bills: 0, q: 3, d: 2, n: 0, p: 4 });
assert.deepEqual(fewest(41), { bills: 0, q: 1, d: 1, n: 1, p: 1 });
assert.deepEqual(fewest(30), { bills: 0, q: 1, d: 0, n: 1, p: 0 });
assert.deepEqual(fewest(277), { bills: 2, q: 3, d: 0, n: 0, p: 2 });
for (let c = 0; c < 1000; c++) {
  const f = fewest(c);
  assert.equal(f.bills * 100 + f.q * 25 + f.d * 10 + f.n * 5 + f.p, c);
  assert.ok(f.q <= 3 && f.d <= 2 && f.n <= 1 && f.p <= 4 && !(f.d === 2 && f.n === 1), `${c}: the fewest`);
}
// The purse draws it, never just a number: bills and coins.
assert.ok(walletSvg(277).includes('class="bill"') && walletSvg(277).includes('class="coins'));
assert.ok(walletSvg(1200).includes("$12"), "lots of bills: one bill marked $12");
assert.equal(walletMini(0), "");
assert.ok(chestSvg("locked").includes("<svg") && chestSvg("open").includes("open"));

// Items: the inventory and the slots.
{
  const inv = freshItems({ have: { pie: 2, shield: 1, bogus: 3, totem: -1 }, slots: ["pie", "nope", null, "magnet"] });
  assert.deepEqual(inv, { have: { pie: 2, shield: 1 }, slots: ["pie", null, null] }, "a saved inventory is cleaned up");
  assert.equal(freshItems(null).slots.length, SLOTS);
  // Tapping an item fills the next empty slot; a second copy only if there's one to fill it.
  assert.equal(putInSlot(inv, "shield"), 1);
  assert.equal(putInSlot(inv, "shield"), -1, "one shield, one slot");
  assert.equal(putInSlot(inv, "pie"), 2, "two pies can fill two slots");
  assert.equal(putInSlot(inv, "totem"), -1, "none to put in");
  gain(inv, "totem");
  assert.equal(putInSlot(inv, "totem"), 2, "all full: the oldest slot makes room");
  assert.deepEqual(inv.slots, ["shield", "pie", "totem"]);
  clearSlot(inv, 0);
  assert.deepEqual(inv.slots, [null, "pie", "totem"]);

  // Each item is one use: a used slot empties and stays empty. No refill, even with more in the
  // inventory; only the inventory card fills it again.
  const v = freshItems({ have: { pie: 2 }, slots: ["pie", null, null] });
  assert.equal(useSlot(v, 0), "pie");
  assert.equal(countOf(v, "pie"), 1, "it comes out of the inventory");
  assert.deepEqual(v.slots, [null, null, null], "the used slot is empty");
  assert.equal(useSlot(v, 0), null, "an empty slot has nothing to use");
  // The next floor (app.js loadMonster) and a reload change nothing: still empty.
  assert.deepEqual(freshItems(JSON.parse(JSON.stringify(v))).slots, [null, null, null], "no refill");
  const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
  const load = app.slice(app.indexOf("function loadMonster"), app.indexOf("function newProblem"));
  assert.ok(!/inv\.slots|putInSlot|refill/.test(load), "a new floor doesn't touch the slots");
  assert.ok(!/putInSlot/.test(app.slice(app.indexOf("function takeLoot"), app.indexOf("function lootRowHTML"))), "an item found in a chest isn't slotted by itself");
  assert.equal(putInSlot(v, "pie"), 0, "the inventory card fills it again");
  // Two slots of one pie: a saved inventory keeps only one.
  assert.deepEqual(freshItems({ have: { pie: 1 }, slots: ["pie", "pie", null] }).slots, ["pie", null, null]);
}

// Item effects.
{
  assert.deepEqual(eatPie(3, 5), { hearts: 4, used: true });
  assert.deepEqual(eatPie(5, 5), { hearts: 5, used: false }, "the Pie caps at the band's hearts, and isn't used up");
  assert.deepEqual(eatPie(7, 7), { hearts: 7, used: false });
  const fx = {};
  assert.equal(blockMiss(fx, 1), 1, "no shield: the miss costs its hearts");
  assert.ok(arm(fx, "shield") && !arm(fx, "shield"), "one Shield up at a time");
  assert.equal(blockMiss(fx, 2), 0, "the Shield blocks a miss, even a charged one");
  assert.equal(blockMiss(fx, 1), 1, "... exactly one");
  arm(fx, "totem");
  assert.equal(totemMult(fx), 2, "the Totem doubles the next hit");
  assert.equal(totemMult(fx), 1, "... once");
  arm(fx, "magnet");
  assert.equal(magnetSpent(fx, null), false, "no moment yet: the Magnet waits");
  assert.ok(fx.magnet);
  assert.equal(magnetSpent(fx, { hero: 5 }), true);
  assert.ok(!fx.magnet);
  // The Magnet forces a moment through moments.js (always): with chance at zero, a hit with a
  // team hero's digit is a moment only with it.
  const team = { captain: 5, rescued: [5, 3] }, hit = { typed: "13", team, hinted: false, first: false, floor: 1, n: 4, bossFinish: false, critStart: false };
  const S = freshState(); S.captains = [5];
  const never = () => 0.999;
  assert.equal(decide(S, freshRun(), hit, never), null, "without the Magnet, no moment this time");
  const mo = decide(S, freshRun(), Object.assign({}, hit, { always: true }), never);
  assert.ok(mo && mo.hero === 3, "with the Magnet, a Hero Moment");
  assert.equal(decide(freshState(), freshRun(), Object.assign({}, hit, { typed: "24", always: true }), never), null, "no team digit: it waits");
}

// Saving goes through store.js: wallet and items are listed per-player keys, and survive a
// dungeon reset (app.js clears only DUNGEON_KEYS).
{
  assert.ok(OWN_KEYS.includes("wallet") && OWN_KEYS.includes("items"));
  const m = new Map(), ls = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; } };
  const s = openStore(ls); s.upgrade();
  const p = s.player("default");
  p.set("wallet", 123); p.set("items", { have: { pie: 1 }, slots: ["pie", null, null] });
  assert.equal(p.get("wallet", 0), 123);
  assert.deepEqual(freshItems(p.get("items", null)).have, { pie: 1 });
  const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
  assert.ok(/DUNGEON_KEYS = \["wings", "bestiary", "best"\]/.test(app), "a dungeon reset keeps the wallet and items");
}
console.log("✓ loot");
