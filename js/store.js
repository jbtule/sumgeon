// Saved data: the device's players and each player's own progress and settings.
// Patterned on sound-box-crosswords (profilePrefix, OWN_KEYS, upgradeStorage).
// No DOM: `ls` is localStorage, or a stand-in in the tests. Every access is wrapped, since
// storage can be missing or full (private browsing), and the game must still run.
//
//   sumgeon:            the device's own: profiles [{ id, name }], profile (who's playing),
//                       storage (version), device (a random id, for linking later)
//   sumgeon:@<id>:      one player's own: OWN_KEYS
//
// Names belong to the device and will never sync.

export var DEVICE = "sumgeon:";
export var STORAGE_VERSION = 2;
// Every key saved per player. Add new ones here (the check fails on a key that isn't listed),
// so Start over, removing a player and (later) sync can't miss one.
// "dungeon": the dungeon version the player's progress was made under (app.js DUNGEON_VERSION).
// "spells": spell casting (app.js): { templates: { digit: [points, ...] } (their handwriting),
// reversed: { digit: count }, cast: count }.
// "told": how many times the voice has explained each thing ({ tag: count }, app.js `once`), so
// an explanation is said the first time or first few, not every time.
// "moments": Hero Moments (moments.js): each hero's quip deck and the quips heard, heroes waiting
// for their debut, and the chance building toward the next moment.
// "wallet": money found in chests, in cents (loot.js), never lost, not even on a loss.
// "items": the inventory (loot.js freshItems): { have: { id: count }, slots: [id or null] × 3 }.
export var OWN_KEYS = ["settings", "best", "facts", "heroes", "wings", "bestiary", "dungeon", "spells", "told", "moments", "wallet", "items", "wardrobe", "shop"];
// band: a grade band, "kinder" to "third" (learn.js BANDS); start: the band opened from the start; grade:
// 0 = K … 5, picked by the player (wings.js withGrade), missing until they pick. ops and diff are the prototype's, kept only to
// pick a band for a player who had them.
export var DEFAULT_SETTINGS = { band: "kinder", ops: ["+", "-"], diff: "easy", timer: false, sfx: true, voice: true };

export function profilePrefix(id) { return DEVICE + "@" + id + ":"; }

export function openStore(ls) {
  function raw(k) { try { return ls.getItem(k); } catch (e) { return null; } }
  function read(k, dflt) {
    var v = raw(k);
    if (v == null) return dflt;
    try { return JSON.parse(v); } catch (e) { return dflt; }
  }
  function write(k, v) { try { ls.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function drop(k) { try { ls.removeItem(k); } catch (e) {} }

  var device = {
    get: function (k, d) { return read(DEVICE + k, d); },
    set: function (k, v) { return write(DEVICE + k, v); }
  };
  function player(id) {
    var pre = profilePrefix(id);
    function own(k) { if (OWN_KEYS.indexOf(k) < 0) throw new Error("store: unlisted player key " + k); return pre + k; }
    return {
      get: function (k, d) { return read(own(k), d); },
      set: function (k, v) { return write(own(k), v); },
      clear: function (k) { drop(own(k)); },
      // Everything under the prefix, including keys from newer versions.
      wipe: function () {
        try {
          var gone = [];
          for (var i = 0; i < ls.length; i++) { var k = ls.key(i); if (k && k.indexOf(pre) === 0) gone.push(k); }
          gone.forEach(drop);
        } catch (e) {}
      }
    };
  }

  // Never empty: with storage unavailable there is still the default player.
  function profiles() {
    var list = device.get("profiles", null);
    return Array.isArray(list) && list.length ? list : [{ id: "default", name: "" }];
  }
  function saveProfiles(list) { device.set("profiles", list); }
  function active() { return device.get("profile", "default"); }

  // Storage version 2 moved the prototype's single `sumgeon` key ({ ops, diff, timer, best })
  // into the default player. New keys are written before the old one is removed, so a move
  // cut short carries on at the next launch. Safe to run every launch.
  function upgrade() {
    if (device.get("storage", 0) < 2) {
      var old = raw("sumgeon");
      if (old != null) {
        var o = {};
        try { o = JSON.parse(old) || {}; } catch (e) {}
        var p = player("default");
        if (p.get("settings", null) == null) {
          var s = Object.assign({}, DEFAULT_SETTINGS);
          if (Array.isArray(o.ops) && o.ops.length) s.ops = o.ops;
          if (s.ops.some(function (x) { return x === "×" || x === "÷"; })) s.band = "third";
          if (o.diff) s.diff = o.diff;
          if (typeof o.timer === "boolean") s.timer = o.timer;
          p.set("settings", s);
        }
        if (p.get("best", null) == null && o.best) p.set("best", o.best);
        drop("sumgeon");
      }
      device.set("storage", STORAGE_VERSION);
    }
    var saved = device.get("profiles", null);
    if (!Array.isArray(saved) || !saved.length) { saveProfiles(profiles()); device.set("profile", "default"); }
    if (!profiles().some(function (p) { return p.id === active(); })) device.set("profile", profiles()[0].id);
    if (!device.get("device", null)) device.set("device", newId());
  }

  function newId() { return Math.random().toString(36).slice(2, 10); }

  return {
    device: device,
    player: player,
    profiles: profiles,
    active: active,
    upgrade: upgrade,
    setActive: function (id) { if (profiles().some(function (p) { return p.id === id; })) device.set("profile", id); },
    rename: function (id, name) {
      saveProfiles(profiles().map(function (p) { return p.id === id ? { id: p.id, name: String(name).trim().slice(0, 24) } : p; }));
    },
    // A new, empty player. Returns its id.
    addProfile: function (name) {
      var id = newId();
      saveProfiles(profiles().concat([{ id: id, name: String(name || "").trim().slice(0, 24) }]));
      return id;
    },
    // As in Sound Box: only on a device with two or more players, never the one playing, and
    // from this device only (other linked devices keep the player).
    canRemove: function (id) { return profiles().length >= 2 && id !== active(); },
    removeProfile: function (id) {
      if (!this.canRemove(id)) return false;
      player(id).wipe();
      saveProfiles(profiles().filter(function (p) { return p.id !== id; }));
      return true;
    },
    settings: function (id) {
      var saved = player(id).get("settings", {}) || {}, s = Object.assign({}, DEFAULT_SETTINGS, saved);
      // Before bands: a player who practiced × or ÷ starts in Apprentice.
      if (!saved.band && Array.isArray(saved.ops) && saved.ops.some(function (o) { return o === "×" || o === "÷"; })) s.band = "third";
      return s;
    }
  };
}

// What a player is called on screen: their name, or "Player 1", "Player 2"... by list order.
export function displayName(list, id) {
  var i = list.findIndex(function (p) { return p.id === id; });
  if (i < 0) return "";
  return list[i].name || "Player " + (i + 1);
}
