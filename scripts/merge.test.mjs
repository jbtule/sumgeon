// Tests for js/merge.js (combining two copies of a linked player's progress; DESIGN.md §15.4).
// Run by `npm run check`, or alone: node --test scripts/merge.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { toRecord, merge, adopt, fromRecord, canon, pack, unpack, walletOf, RECORD_VERSION, SYNCED_KEYS, LOCAL_KEYS } from "../js/merge.js";
import { OWN_KEYS, DUNGEON_VERSION } from "../js/store.js";
import { rewardOf, noteEvent, placeOldSurprises, freshAchievements } from "../js/achievements.js";
import { purseOf, empty as emptyCounter, TOKENS, enough, putDown, payMany } from "../js/shop.js";
import { busyRecord, busyPlayer, DEVICES } from "./sync-size.mjs";

const clone = (x) => JSON.parse(JSON.stringify(x));
const empty = () => ({
  settings: { band: "kinder", sfx: true, voice: true }, facts: {}, heroes: { captain: 2, color: "#ffc93c", rescued: [2], cracks: {} },
  wings: {}, bestiary: {}, dungeon: DUNGEON_VERSION, spells: { templates: {}, reversed: {}, cast: 0 }, told: {},
  moments: { decks: {}, heard: {}, debut: [], dry: 0, last: null, captains: [], named: [2] },
  wallet: 0, items: { have: {}, slots: [null, null, null] }, wardrobe: { owned: [], wear: {} }, shop: { stock: [] }
});
// A device: its saved data and the last record it merged.
const device = (id, data = empty(), base = null) => ({ id, data, base });
// One sync, as sync.js does it: this device's record merged with the server's, kept as the base.
function sync(dev, server) {
  const mine = toRecord(dev.data, dev.base, dev.id), rec = merge(dev.base ? mine : adopt(mine, server), server);
  dev.data = fromRecord(rec, dev.data);
  dev.base = rec;
  return rec;
}
const now = 29916667 * 60000; // on a whole minute, as the record keeps times
function answer(dev, key, { ok = true, ms = 2000, t = now, b } = {}) {
  const f = dev.data.facts[key] = dev.data.facts[key] || { b: 0, n: 0, c: 0, ms: 0, t: 0 };
  f.n++; if (ok) f.c++; f.ms = ms; f.t = t; f.b = b ?? (ok ? Math.min(4, f.b + 1) : 0);
}

test("every saved key is synced or kept on the device on purpose", () => {
  assert.deepEqual([...SYNCED_KEYS, ...LOCAL_KEYS].sort(), [...OWN_KEYS].sort());
});

// The record's shape, so a change to it can't go out without a new RECORD_VERSION: older apps
// would drop what they don't know when they merge and save it back.
const SHAPE = {
  1: ["best", "bestiary", "dungeon", "facts", "items", "moments", "owned", "reg", "spells", "told", "v", "wallet", "wings"],
  2: ["ach", "best", "bestiary", "dungeon", "facts", "items", "moments", "owned", "reg", "spells", "told", "v", "wallet", "wings"],
  3: ["ach", "best", "bestiary", "dungeon", "facts", "items", "moments", "owned", "reg", "spells", "told", "v", "wallet", "wings"],
  4: ["ach", "best", "bestiary", "dungeon", "facts", "items", "moments", "owned", "plush", "reg", "spells", "told", "v", "wallet", "wings"],
  // 5: the same keys; ach.e holds the stratum secrets' ids ("surprise:zero@cellar").
  5: ["ach", "best", "bestiary", "dungeon", "facts", "items", "moments", "owned", "plush", "reg", "spells", "told", "v", "wallet", "wings"]
};
// Inside the record's achievements, by version (3 added the practice days and comebacks).
const ACH_SHAPE = { 2: ["e", "s"], 3: ["c", "d", "e", "s"], 4: ["c", "d", "e", "s"], 5: ["c", "d", "e", "s"] };
test("the record's shape matches its version", () => {
  const rec = busyRecord();
  assert.equal(rec.v, RECORD_VERSION);
  assert.deepEqual(Object.keys(rec).sort(), SHAPE[RECORD_VERSION], "the record's keys changed: bump RECORD_VERSION and add its SHAPE");
  assert.deepEqual(Object.keys(rec.ach).sort(), ACH_SHAPE[RECORD_VERSION], "the record's achievements changed: bump RECORD_VERSION");
});

test("facts: seen and right add up per device; box and time come from the latest practice", () => {
  const a = device("a"), b = device("b");
  answer(a, "+3,4", { t: now }); answer(a, "+3,4", { t: now + 60000 });
  answer(b, "+3,4", { ok: false, t: now + 120000, ms: 5000 });
  let server = sync(a, null);
  server = sync(b, server);
  server = sync(a, server);
  for (const d of [a, b]) {
    const f = d.data.facts["+3,4"];
    assert.equal(f.n, 3); assert.equal(f.c, 2);
    assert.equal(f.b, 0, "b's miss was the latest");
    assert.equal(f.ms, 5000);
    assert.equal(f.t, now + 120000);
  }
  // More practice after syncing adds on top, and syncing again counts nothing twice.
  answer(a, "+3,4", { t: now + 180000, b: 1 });
  for (let i = 0; i < 3; i++) { server = sync(a, server); server = sync(b, server); }
  assert.equal(b.data.facts["+3,4"].n, 4);
  assert.equal(b.data.facts["+3,4"].b, 1);
  // Times are kept to the minute, averages to ten milliseconds.
  answer(a, "+1,1", { t: now + 61234, ms: 1234 });
  server = sync(a, server);
  assert.equal(a.data.facts["+1,1"].t, now + 60000);
  assert.equal(a.data.facts["+1,1"].ms, 1200);
});

test("settings: the latest edit wins, by the edit counter, not the clock", () => {
  const a = device("a"), b = device("b");
  let server = sync(a, null);
  server = sync(b, server);
  a.data.settings.voice = false;
  server = sync(a, server);
  b.data.settings.sfx = false; // a different setting: both stay
  server = sync(b, server);
  server = sync(a, server);
  for (const d of [a, b]) { assert.equal(d.data.settings.voice, false); assert.equal(d.data.settings.sfx, false); }
  // b changes voice back after seeing a's change: b's is later.
  b.data.settings.voice = true;
  server = sync(b, server); server = sync(a, server);
  assert.equal(a.data.settings.voice, true);
});

test("wings: stars, depths and chapters only grow; boss wins add up; the Legend keeps the earliest", () => {
  const a = device("a"), b = device("b");
  a.data.wings.cellar = { boss: 2, best: 5, stars: [3, 1, 2], depth: 3, depthStars: { 1: 9, 2: 6 }, megas: 0, steps: 4 };
  b.data.wings.cellar = { boss: 1, best: 6, stars: [1, 3], depth: 2, depthStars: { 1: 12 }, megas: 1, steps: 3, legendOpen: true };
  b.data.wings.hall = { boss: 0, best: 1, unlocked: true };
  let server = sync(a, null); server = sync(b, server); server = sync(a, server);
  const w = a.data.wings.cellar;
  assert.deepEqual([w.boss, w.best, w.depth, w.megas, w.steps], [3, 6, 3, 1, 4]);
  assert.deepEqual(w.stars, [3, 3, 2]);
  assert.deepEqual(w.depthStars, { 1: 12, 2: 6 });
  assert.equal(w.legendOpen, true);
  assert.equal(a.data.wings.hall.unlocked, true);
  a.data.wings.cellar.legend = now + 5; delete a.data.wings.cellar.legendOpen;
  b.data.wings.cellar.legend = now + 9;
  server = sync(a, server); server = sync(b, server);
  assert.equal(b.data.wings.cellar.legend, now + 5);
  assert.equal(b.data.wings.cellar.legendOpen, undefined, "beaten: no longer just open");
});

test("bestiary: met keeps the earliest, beaten adds up", () => {
  const a = device("a"), b = device("b");
  a.data.bestiary.Plusquito = { met: now + 10, beaten: 2 };
  b.data.bestiary.Plusquito = { met: now, beaten: 1 };
  b.data.bestiary.Minustaur = { met: now, beaten: 0 };
  let server = sync(a, null); server = sync(b, server); server = sync(a, server);
  assert.deepEqual(a.data.bestiary.Plusquito, { met: now, beaten: 3 });
  assert.deepEqual(a.data.bestiary.Minustaur, { met: now, beaten: 0 });
});

test("heroes: the latest edit wins, so a cursed captain leaves the team everywhere", () => {
  const a = device("a"), b = device("b");
  let server = sync(a, null); server = sync(b, server);
  a.data.heroes.rescued.push(5); a.data.heroes.cracks = { 7: 1 };
  server = sync(a, server); server = sync(b, server);
  assert.deepEqual(b.data.heroes.rescued, [2, 5]);
  assert.deepEqual(b.data.heroes.cracks, { 7: 1 });
  // b loses with captain 2: cursed, off the team.
  b.data.heroes = { ...b.data.heroes, captain: null, rescued: [5], cracks: { 7: 1 } };
  server = sync(b, server); server = sync(a, server);
  assert.equal(a.data.heroes.captain, null);
  assert.deepEqual(a.data.heroes.rescued, [5]);
  assert.equal(a.data.heroes.color, "#ffc93c");
});

test("moments, told, spells and the wardrobe", () => {
  const a = device("a"), b = device("b");
  a.data.moments.heard = { 3: ["Ta-da!"] }; a.data.moments.captains = [2]; a.data.moments.decks = { 3: ["x", "y"] };
  b.data.moments.heard = { 3: ["Hey!"], 4: ["Shields up!"] }; b.data.moments.named = [2, 4];
  a.data.told = { pick: 1, deeper: 3 }; b.data.told = { pick: 2 };
  a.data.spells = { templates: { 3: [[{ x: 0, y: 0, id: 0 }]] }, reversed: { 3: 2 }, cast: 10 };
  b.data.spells = { templates: {}, reversed: { 3: 1, 9: 1 }, cast: 4 };
  a.data.wardrobe = { owned: ["crown"], wear: { 2: { head: "crown" } } };
  b.data.wardrobe = { owned: ["bow"], wear: {} };
  let server = sync(a, null); server = sync(b, server); server = sync(a, server);
  for (const d of [a, b]) {
    assert.deepEqual([...d.data.moments.heard[3]].sort(), ["Hey!", "Ta-da!"]);
    assert.deepEqual(d.data.moments.heard[4], ["Shields up!"]);
    assert.deepEqual(d.data.moments.captains, [2]);
    assert.deepEqual([...d.data.moments.named].sort(), [2, 4]);
    assert.deepEqual(d.data.told, { pick: 2, deeper: 3 });
    assert.deepEqual(d.data.spells.reversed, { 3: 3, 9: 1 });
    assert.equal(d.data.spells.cast, 14);
    assert.deepEqual([...d.data.wardrobe.owned].sort(), ["bow", "crown"]);
    assert.deepEqual(d.data.wardrobe.wear, { 2: { head: "crown" } });
  }
  assert.deepEqual(a.data.moments.decks, { 3: ["x", "y"] });
  // The learned handwriting stays on its device.
  assert.equal(Object.keys(b.data.spells.templates).length, 0);
  assert.equal(Object.keys(a.data.spells.templates).length, 1);
  // Plushies owned only grow: one found on each device, both have both, and Pluffy stays.
  a.data.wardrobe.plush = ["pluffy", "mootaur"];
  b.data.wardrobe.plush = ["pluffy", "chompy"];
  server = sync(a, server); server = sync(b, server); server = sync(a, server);
  for (const d of [a, b]) assert.deepEqual([...d.data.wardrobe.plush].sort(), ["chompy", "mootaur", "pluffy"]);
  // Losing one on a device (an old save) never takes it away.
  b.data.wardrobe.plush = ["pluffy"];
  server = sync(b, server); server = sync(a, server);
  for (const d of [a, b]) assert.deepEqual([...d.data.wardrobe.plush].sort(), ["chompy", "mootaur", "pluffy"]);
  // Taking everything off syncs too.
  b.data.wardrobe.wear = {};
  server = sync(b, server); server = sync(a, server);
  assert.deepEqual(a.data.wardrobe.wear, {});
});

test("the wallet: coins found on two devices add up, and syncing never makes or loses any", () => {
  const a = device("a"), b = device("b");
  a.data.wallet = 50;
  let server = sync(a, null);
  server = sync(b, server);
  assert.equal(b.data.wallet, 50);
  b.data.wallet += 30; // b finds 30
  a.data.wallet -= 20; // a spends 20
  server = sync(a, server); server = sync(b, server); server = sync(a, server);
  assert.equal(a.data.wallet, 60); assert.equal(b.data.wallet, 60);
  // Syncing again and again, in any order, changes nothing.
  for (let i = 0; i < 4; i++) { server = sync(i % 2 ? a : b, server); }
  assert.equal(a.data.wallet, 60); assert.equal(b.data.wallet, 60);
  assert.equal(walletOf(server), 60);
});

test("the wallet: the same coins spent on two devices while apart never go below zero, and later finds count", () => {
  const a = device("a"), b = device("b");
  a.data.wallet = 40;
  let server = sync(a, null); server = sync(b, server);
  a.data.wallet -= 40; b.data.wallet -= 40; // both spend it all, apart
  server = sync(a, server); server = sync(b, server); server = sync(a, server);
  assert.equal(a.data.wallet, 0); assert.equal(b.data.wallet, 0);
  a.data.wallet += 15;
  server = sync(a, server); server = sync(b, server);
  assert.equal(b.data.wallet, 15, "found after the overspend: not swallowed by it");
});

test("items: each item is a ledger like the wallet; the slots go by the latest edit", () => {
  const a = device("a"), b = device("b");
  a.data.items = { have: { shield: 2, pie: 1 }, slots: ["shield", null, null] };
  let server = sync(a, null); server = sync(b, server);
  assert.deepEqual(b.data.items.have, { shield: 2, pie: 1 });
  b.data.items.have.pie = 0; // b eats the pie
  a.data.items.have.shield = 3; // a finds a shield
  server = sync(b, server); server = sync(a, server); server = sync(b, server);
  for (const d of [a, b]) assert.deepEqual(d.data.items.have, { shield: 3 });
  assert.deepEqual(b.data.items.slots, ["shield", null, null]);
});

// Buying more than one item at Trollar's shop (shop.js payMany), as app.js does it: the wallet
// loses price × n, and n of the item are gained in one go.
function buyMany(dev, id, price, n) {
  const purse = purseOf(dev.data.wallet), counter = emptyCounter();
  for (const t of TOKENS) while (counter[t.k] < purse[t.k] && !enough(counter, price * n)) putDown(purse, counter, t.k, price * n);
  const r = payMany(purse, counter, price, n, { kind: "item", id });
  assert.ok(r.ok);
  dev.data.wallet = r.wallet;
  dev.data.items.have[id] = (dev.data.items.have[id] || 0) + r.n;
  return r;
}
test("the shop: buying 3 at once spends exactly 3 × the price and adds exactly 3, and syncing neither doubles nor loses any", () => {
  const a = device("a"), b = device("b");
  a.data.wallet = 250; a.data.items.have = { pie: 1 };
  let server = sync(a, null); server = sync(b, server);
  const r = buyMany(a, "pie", 35, 3); // $1.05 for three pies
  assert.equal(r.n, 3); assert.equal(a.data.wallet, 145); assert.equal(a.data.items.have.pie, 4);
  b.data.wallet += 20; // b finds 20¢ meanwhile
  buyMany(b, "shield", 45, 2); // and b buys two shields: 90¢
  b.data.items.have.pie -= 1; // and b eats a pie
  for (let i = 0; i < 6; i++) server = sync(i % 2 ? b : a, server);
  for (const d of [a, b]) {
    assert.equal(d.data.wallet, 250 - 105 + 20 - 90, "each purchase spent once");
    assert.deepEqual(d.data.items.have, { pie: 3, shield: 2 }, "each purchase's items counted once");
  }
  assert.equal(walletOf(server), 75);
  // Syncing the same records again, in any order, changes nothing.
  const ra = toRecord(a.data, a.base, "a"), rb = toRecord(b.data, b.base, "b");
  assert.equal(walletOf(merge(ra, rb)), 75); assert.equal(walletOf(merge(rb, merge(ra, rb))), 75);
});

// An achievement awarded on a device, as app.js does it: recorded, and its reward added at once.
function earn(dev, id, t = now) {
  const ach = dev.data.achievements = dev.data.achievements || { earned: {}, seen: [] };
  if (ach.earned[id]) return;
  ach.earned[id] = t;
  const r = rewardOf(id);
  dev.data.wallet += r.cents;
  for (const [k, n] of Object.entries(r.items)) dev.data.items.have[k] = (dev.data.items.have[k] || 0) + n;
  if (r.piece && !dev.data.wardrobe.owned.includes(r.piece)) dev.data.wardrobe.owned.push(r.piece);
}

test("achievements: earned ones only grow, keep the earliest time, and seen only grows", () => {
  const a = device("a"), b = device("b");
  earn(a, "master:make10", now);
  let server = sync(a, null); server = sync(b, server);
  assert.deepEqual(b.data.achievements.earned, { "master:make10": now });
  earn(b, "master:bonds", now + 60000);
  earn(a, "master:doubles", now + 120000);
  earn(b, "master:doubles", now + 60000); // b earned it too, earlier, while apart
  a.data.achievements.seen.push("master:make10");
  server = sync(a, server); server = sync(b, server); server = sync(a, server);
  for (const d of [a, b]) {
    assert.deepEqual(d.data.achievements.earned, { "master:make10": now, "master:bonds": now + 60000, "master:doubles": now + 60000 });
    assert.deepEqual(d.data.achievements.seen, ["master:make10"]);
  }
  // Never taken away: a record without them doesn't remove them.
  const bare = toRecord(empty(), null, "c");
  assert.ok(merge(server, bare).ach.e["master:make10"]);
});

test("achievements' rewards: paid once, whichever devices awarded them, and spent like any coins", () => {
  const a = device("a"), b = device("b");
  a.data.wallet = 10;
  let server = sync(a, null); server = sync(b, server);
  // Both devices award the Counting Cellar Champion while apart (50¢ and the badge), and the
  // Make-Ten Master (a pie) on a only.
  earn(a, "champion:cellar"); earn(b, "champion:cellar", now + 60000); earn(a, "master:make10");
  assert.equal(a.data.wallet, 60); assert.equal(b.data.wallet, 60);
  server = sync(a, server); server = sync(b, server); server = sync(a, server);
  for (const d of [a, b]) {
    assert.equal(d.data.wallet, 60, "the champion's 50¢ counted once");
    assert.deepEqual(d.data.items.have, { pie: 1 });
    assert.ok(d.data.wardrobe.owned.includes("badge-cellar"));
  }
  // Spending the reward's coins and eating its pie syncs like anything else.
  b.data.wallet -= 55; b.data.items.have = {};
  a.data.wallet += 5; // and a finds a nickel
  for (let i = 0; i < 4; i++) server = sync(i % 2 ? a : b, server);
  for (const d of [a, b]) { assert.equal(d.data.wallet, 10); assert.deepEqual(d.data.items.have, {}); }
  assert.equal(walletOf(server), 10);
  // Merging the records again, in either order, pays nothing more.
  const ra = toRecord(a.data, a.base, "a"), rb = toRecord(b.data, b.base, "b");
  assert.equal(walletOf(merge(ra, rb)), 10); assert.equal(walletOf(merge(rb, merge(ra, rb))), 10);
});

// The achievements' counters, as app.js keeps them: a practice day, and a comeback.
const day = (n) => 20000 + n;
function practise(dev, n) { const a = dev.data.achievements = dev.data.achievements || { earned: {}, seen: [] }; a.days = [...new Set([...(a.days || []), day(n)])].sort((x, y) => x - y); }
function comeback(dev) { const a = dev.data.achievements = dev.data.achievements || { earned: {}, seen: [] }; a.comebacks = (a.comebacks || 0) + 1; }

test("practice days: a union of the days played anywhere, each day once", () => {
  const a = device("a"), b = device("b");
  practise(a, 1); practise(a, 2); practise(b, 2); practise(b, 5);
  let server = sync(a, null); server = sync(b, server); server = sync(a, server);
  for (const d of [a, b]) assert.deepEqual(d.data.achievements.days, [day(1), day(2), day(5)], "the same day on two devices counts once");
  for (let i = 0; i < 3; i++) { server = sync(a, server); server = sync(b, server); }
  assert.deepEqual(a.data.achievements.days, [day(1), day(2), day(5)]);
  // Only the earliest hundred are kept (the top tier needs no more), the same whichever order.
  const x = device("x"), y = device("y");
  for (let i = 0; i < 80; i++) practise(x, 2 * i);
  for (let i = 0; i < 80; i++) practise(y, 2 * i + 1);
  const rx = toRecord(x.data, null, "x"), ry = toRecord(y.data, null, "y");
  assert.equal(merge(rx, ry).ach.d.length, 100);
  assert.deepEqual(merge(rx, ry).ach.d, merge(ry, rx).ach.d);
  assert.deepEqual(merge(rx, ry).ach.d, Array.from({ length: 100 }, (_, i) => day(i)));
});

test("comebacks: a tally per device, never counted twice", () => {
  const a = device("a"), b = device("b");
  comeback(a); comeback(a); comeback(b);
  let server = sync(a, null); server = sync(b, server); server = sync(a, server);
  for (const d of [a, b]) assert.equal(d.data.achievements.comebacks, 3);
  for (let i = 0; i < 3; i++) { server = sync(a, server); server = sync(b, server); }
  assert.equal(a.data.achievements.comebacks, 3);
  comeback(b);
  server = sync(b, server); server = sync(a, server);
  for (const d of [a, b]) assert.equal(d.data.achievements.comebacks, 4);
  // The records merged again, in either order, add nothing.
  const ra = toRecord(a.data, a.base, "a"), rb = toRecord(b.data, b.base, "b");
  assert.deepEqual(merge(ra, rb).ach.c, merge(rb, merge(ra, rb)).ach.c);
});

test("surprises seen in play: earned like any achievement, paid once", () => {
  const a = device("a"), b = device("b");
  let server = sync(a, null); server = sync(b, server);
  earn(a, "surprise:zero", now + 60000); earn(b, "surprise:zero", now); earn(b, "holiday:thanksgiving");
  server = sync(a, server); server = sync(b, server); server = sync(a, server);
  for (const d of [a, b]) {
    assert.equal(d.data.achievements.earned["surprise:zero"], now, "the earliest");
    assert.ok(d.data.achievements.earned["holiday:thanksgiving"]);
    assert.deepEqual(d.data.items.have, { totem: 1, pie: 1 }, "the totem paid once");
  }
});

// The stratum secrets (achievements.js STRATUM_SURPRISES): a surprise earned in each stratum pays
// again, but the surprise as a whole and its first stratum pay once, and an old save's surprise
// (no stratum) placed in its start stratum on one device isn't paid again when it meets the
// other's, in any order.
function earnIn(dev, id, wing, t = now) {
  const ach = dev.data.achievements = dev.data.achievements || { earned: {}, seen: [] };
  const sid = noteEvent(ach.earned, id, t, wing);
  if (!sid) return;
  for (const [k, n] of Object.entries(rewardOf(sid).items)) dev.data.items.have[k] = (dev.data.items.have[k] || 0) + n;
}
test("stratum secrets: each stratum's copy only grows and pays once, an old save's surprise is never paid twice", () => {
  const a = device("a"), b = device("b");
  // An old save: Exactly Zero earned (and paid) before strata were counted, on both devices.
  earn(a, "surprise:zero", now); earn(b, "surprise:zero", now + 5);
  let server = sync(a, null); server = sync(b, server); server = sync(a, server);
  for (const d of [a, b]) assert.deepEqual(d.data.items.have, { totem: 1 });
  // a updates and places it in its start stratum (the Cellar); b hasn't loaded since.
  const fa = freshAchievements(a.data.achievements);
  assert.ok(placeOldSurprises(fa, "cellar"));
  assert.ok(!placeOldSurprises(fa, "hall"), "once only");
  a.data.achievements = fa;
  server = sync(a, server); server = sync(b, server); server = sync(a, server);
  for (const d of [a, b]) {
    assert.ok(d.data.achievements.earned["surprise:zero@cellar"]);
    assert.deepEqual(d.data.items.have, { totem: 1 }, "placing it pays nothing");
  }
  // Then each earns it in another stratum while apart: the Hall on a, the Mines on b, and the
  // Hall again on b (the same stratum's copy: paid once).
  earnIn(a, "surprise:zero", "hall", now + 100); earnIn(b, "surprise:zero", "mines", now + 200); earnIn(b, "surprise:zero", "hall", now + 300);
  server = sync(a, server); server = sync(b, server); server = sync(a, server);
  for (const d of [a, b]) {
    assert.deepEqual(Object.keys(d.data.achievements.earned).filter((k) => k.startsWith("surprise:zero")).sort(), ["surprise:zero", "surprise:zero@cellar", "surprise:zero@hall", "surprise:zero@mines"]);
    assert.equal(d.data.achievements.earned["surprise:zero@hall"], now + 100, "the earliest");
    assert.equal(d.data.achievements.earned["surprise:zero"], now, "the whole keeps its first time");
    assert.deepEqual(d.data.items.have, { totem: 3 }, "one totem for each stratum");
  }
  // A new player: the surprise and its first stratum together pay once.
  const c = device("c");
  earnIn(c, "surprise:palindrome", "tower");
  assert.deepEqual(c.data.items.have, { shield: 1 });
  const rc = sync(c, null);
  assert.deepEqual(Object.keys(rc.ach.e).sort(), ["surprise:palindrome", "surprise:palindrome@tower"]);
  const m1 = merge(rc, server), m2 = merge(server, rc);
  assert.deepEqual(canon(m1), canon(m2), "in either order");
  assert.deepEqual(canon(merge(m1, rc)), canon(m1), "and again changes nothing");
});

test("a dungeon bump: the newer record's dungeon progress wins, and old shares don't come back", () => {
  const a = device("a"), b = device("b");
  a.data.wings.cellar = { boss: 5, best: 6, depth: 9 };
  a.data.bestiary.Plusquito = { met: now, beaten: 5 };
  let server = sync(a, null); server = sync(b, server);
  // a updates to a newer dungeon: upgradeDungeon resets its runs, keeping learning.
  answer(a, "+1,2");
  a.data.dungeon = DUNGEON_VERSION + 1; a.data.wings = {}; a.data.bestiary = {};
  a.data.heroes = { captain: 2, color: "#ffc93c", rescued: [2], cracks: {} };
  server = sync(a, server);
  assert.equal(server.dungeon, DUNGEON_VERSION + 1);
  assert.deepEqual(server.wings, {});
  assert.deepEqual(server.bestiary, {});
  assert.ok(server.facts["+1,2"], "learning is kept");
  // An old record merged in, in either order, doesn't bring them back.
  const old = toRecord({ ...empty(), wings: { cellar: { boss: 9, depth: 12 } } }, null, "c");
  assert.deepEqual(merge(server, old).wings, {});
  assert.deepEqual(merge(old, server).wings, {});
});

// Records from devices doing all sorts: merging is commutative and idempotent.
function randomDevice(id, seed) {
  let x = seed;
  const rnd = () => ((x = (x * 48271) % 2147483647) / 2147483647);
  const d = device(id);
  for (let i = 0; i < 30; i++) answer(d, "+" + Math.floor(rnd() * 6) + "," + Math.floor(rnd() * 6), { ok: rnd() < 0.7, t: now + Math.floor(rnd() * 1e8), ms: 1000 + Math.floor(rnd() * 5000) });
  d.data.wallet = Math.floor(rnd() * 100);
  d.data.items.have = { shield: Math.floor(rnd() * 3), pie: Math.floor(rnd() * 3) };
  d.data.wings.cellar = { boss: Math.floor(rnd() * 4), best: Math.floor(rnd() * 7), stars: [Math.floor(rnd() * 4)], depth: 1 + Math.floor(rnd() * 5) };
  d.data.bestiary.Plusquito = { met: now + Math.floor(rnd() * 1000), beaten: Math.floor(rnd() * 5) };
  d.data.settings.sfx = rnd() < 0.5;
  d.data.heroes.rescued = [2, ...(rnd() < 0.5 ? [4] : [])];
  d.data.told = { a: Math.floor(rnd() * 3) };
  d.data.moments.heard = { 2: rnd() < 0.5 ? ["a"] : ["b"] };
  d.data.wardrobe = { owned: rnd() < 0.5 ? ["crown"] : ["bow"], wear: rnd() < 0.5 ? { 2: { head: "crown" } } : {} };
  return toRecord(d.data, null, id);
}

test("merging: either order gives the same, and merging again changes nothing", () => {
  for (let s = 1; s < 25; s++) {
    const x = randomDevice("a", s), y = randomDevice("b", s + 100), z = randomDevice("c", s + 200);
    const xy = merge(x, y);
    assert.equal(canon(xy), canon(merge(y, x)), "commutative");
    assert.equal(canon(merge(xy, xy)), canon(xy), "idempotent");
    assert.equal(canon(merge(xy, x)), canon(xy), "merging a part again changes nothing");
    assert.equal(canon(merge(merge(xy, z), y)), canon(merge(xy, z)));
    assert.equal(canon(merge(x, x)), canon(x));
  }
});

test("syncing in either order, over and over, ends with the same data everywhere", () => {
  for (let s = 1; s < 10; s++) {
    const devs = ["a", "b", "c"].map((id, i) => {
      const d = device(id);
      d.data = fromRecord(randomDevice(id, s * 7 + i), empty());
      return d;
    });
    let server = null;
    for (let round = 0; round < 3; round++) for (const d of (s % 2 ? devs : [...devs].reverse())) server = sync(d, server);
    // The same everywhere, lists aside (each device keeps its own order, with what it learns of at the end).
    const sorted = (v) => JSON.parse(JSON.stringify(v), (k, x) => (Array.isArray(x) && x.every((y) => typeof y === "string") ? [...x].sort() : x));
    const want = canon(sorted(devs[0].data));
    for (const d of devs) assert.equal(canon(sorted(d.data)), want);
    // The coins: what each found, less what each spent, once each.
    assert.equal(devs[0].data.wallet, walletOf(server));
  }
});

test("packing a record for the wire loses nothing", () => {
  const rec = busyRecord();
  assert.equal(canon(unpack(pack(rec))), canon(rec));
  assert.equal(canon(unpack(JSON.parse(JSON.stringify(pack(rec))))), canon(rec));
  const one = toRecord(busyPlayer(1), null, DEVICES[0]);
  assert.equal(canon(unpack(pack(one))), canon(one));
  assert.equal(pack(null), null);
});

test("a busy player's data comes back from its record as it was (to the minute)", () => {
  const data = busyPlayer(2);
  const back = fromRecord(toRecord(data, null, "a"), data);
  assert.equal(back.wallet, data.wallet);
  assert.deepEqual(back.items.have, data.items.have);
  assert.deepEqual(back.heroes.rescued, data.heroes.rescued);
  assert.equal(back.wings.cellar.boss, data.wings.cellar.boss);
  for (const k of Object.keys(data.facts).slice(0, 50)) {
    assert.equal(back.facts[k].n, data.facts[k].n); assert.equal(back.facts[k].c, data.facts[k].c);
    assert.equal(back.facts[k].b, data.facts[k].b);
    assert.ok(Math.abs(back.facts[k].t - data.facts[k].t) <= 30000);
  }
  // And again: stable.
  assert.equal(canon(fromRecord(toRecord(back, null, "a"), back)), canon(back));
});

test("the run in progress (\"run\") never syncs: a record ignores it, and nothing brings it back", () => {
  assert.ok(LOCAL_KEYS.includes("run") && !SYNCED_KEYS.includes("run"));
  const data = busyPlayer(3), run = { v: 1, stage: "problem", wing: "cellar", floor: 2, hp: 9, hearts: 4, cur: { key: "+3,5", op: "+", ans: 8 } };
  const rec = toRecord({ ...data, run }, null, "a");
  assert.equal(canon(rec), canon(toRecord(data, null, "a")), "the run changes nothing in the record");
  assert.ok(!JSON.stringify(rec).includes('"stage"'));
  assert.equal(fromRecord(rec, { ...data, run }).run, undefined, "a synced record doesn't carry a run");
  // Another device's merge leaves this device's run alone: only SYNCED_KEYS come back.
  const back = fromRecord(merge(rec, toRecord(busyPlayer(4), null, "b")), data);
  assert.ok(Object.keys(back).every((k) => SYNCED_KEYS.includes(k)));
});
