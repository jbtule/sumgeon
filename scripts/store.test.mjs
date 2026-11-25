// Saved data: the storage upgrade, players, and the remove rules (Sound Box's).
import assert from "node:assert/strict";
import { openStore, displayName, OWN_KEYS, DEFAULT_SETTINGS } from "../js/store.js";

function fakeStorage(init) {
  const m = new Map(Object.entries(init || {}));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k),
    key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; }, map: m };
}

// A fresh device: one default player.
{
  const ls = fakeStorage(), s = openStore(ls);
  s.upgrade();
  assert.deepEqual(s.profiles(), [{ id: "default", name: "" }]);
  assert.equal(s.active(), "default");
  assert.deepEqual(s.settings("default"), DEFAULT_SETTINGS);
  assert.equal(JSON.parse(ls.getItem("sumgeon:storage")), 2);
}

// The prototype's save moves into the default player, and the old key goes.
{
  const ls = fakeStorage({ sumgeon: JSON.stringify({ ops: ["×", "÷"], diff: "hard", timer: true, best: 4 }) }), s = openStore(ls);
  s.upgrade();
  const st = s.settings("default");
  assert.deepEqual(st.ops, ["×", "÷"]); assert.equal(st.diff, "hard"); assert.equal(st.timer, true); assert.equal(st.sfx, true);
  assert.equal(st.band, "third", "a player who practiced × or ÷ starts in 3rd grade");
  assert.equal(s.player("default").get("best", 0), 4);
  assert.equal(ls.getItem("sumgeon"), null);
  // Running it again changes nothing.
  const before = JSON.stringify([...ls.map]);
  s.upgrade();
  assert.equal(JSON.stringify([...ls.map]), before);
}

// A move cut short (settings written, old key still there) finishes without overwriting.
{
  const ls = fakeStorage({ sumgeon: JSON.stringify({ diff: "hard", best: 2 }), "sumgeon:@default:settings": JSON.stringify({ diff: "med" }) }), s = openStore(ls);
  s.upgrade();
  assert.equal(s.settings("default").diff, "med");
  assert.equal(s.player("default").get("best", 0), 2);
  assert.equal(ls.getItem("sumgeon"), null);
}

// Players: add, rename, switch, and Remove only on a shared device and never the one playing.
{
  const ls = fakeStorage(), s = openStore(ls);
  s.upgrade();
  assert.equal(s.canRemove("default"), false, "the only player can't be removed");
  const kid = s.addProfile("  Sam  ");
  assert.equal(s.profiles()[1].name, "Sam");
  s.player(kid).set("best", 3);
  assert.equal(s.canRemove("default"), false, "never the one playing");
  assert.equal(s.canRemove(kid), true);
  s.setActive(kid);
  assert.equal(s.active(), kid);
  s.setActive("nobody");
  assert.equal(s.active(), kid, "can't switch to a player that doesn't exist");
  assert.equal(displayName(s.profiles(), "default"), "Player 1");
  s.rename("default", "Ada");
  assert.equal(displayName(s.profiles(), "default"), "Ada");
  assert.equal(s.removeProfile(kid), false);
  s.setActive("default");
  assert.equal(s.removeProfile(kid), true);
  assert.equal(s.profiles().length, 1);
  assert.equal([...ls.map.keys()].some((k) => k.startsWith("sumgeon:@" + kid + ":")), false, "everything under the prefix is gone");
}

// Only listed keys can be saved per player.
{
  const s = openStore(fakeStorage());
  assert.throws(() => s.player("default").set("secret", 1), /unlisted/);
  for (const k of OWN_KEYS) s.player("default").set(k, 1);
}

// Storage that throws (private browsing) never breaks the game.
{
  const bad = { getItem() { throw new Error("no"); }, setItem() { throw new Error("no"); }, removeItem() { throw new Error("no"); }, key() { throw new Error("no"); }, get length() { throw new Error("no"); } };
  const s = openStore(bad);
  s.upgrade();
  assert.deepEqual(s.settings("default"), DEFAULT_SETTINGS);
}
// clear() drops one of a player's keys.
{
  const ls = fakeStorage({}), st = openStore(ls), p = st.player("default");
  p.set("wings", { cellar: { boss: 1 } }); p.clear("wings");
  assert.equal(p.get("wings", null), null);
  assert.throws(() => p.clear("nope"), /unlisted player key/);
}
console.log("✓ store");
