// Tests for js/merge.js (combining two copies of a linked player's progress; DESIGN.md §15.4).
// Run by `npm run check`, or alone: node --test scripts/merge.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { toRecord, merge, adopt, fromRecord, canon, pack, unpack, walletOf, RECORD_VERSION, SYNCED_KEYS, LOCAL_KEYS } from "../js/merge.js";
import { OWN_KEYS, DUNGEON_VERSION } from "../js/store.js";
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
  1: ["best", "bestiary", "dungeon", "facts", "items", "moments", "owned", "reg", "spells", "told", "v", "wallet", "wings"]
};
test("the record's shape matches its version", () => {
  const rec = busyRecord();
  assert.equal(rec.v, RECORD_VERSION);
  assert.deepEqual(Object.keys(rec).sort(), SHAPE[RECORD_VERSION], "the record's keys changed: bump RECORD_VERSION and add its SHAPE");
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
