// Tests for the sync service (sync/src) with each player's Durable Object kept in memory, and the
// game's side (js/sync.js, js/seal.js) against it. Patterned on sound-box-crosswords'.
// Run by `npm run check`, or alone: node --test scripts/sync.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { handle, MAX_BYTES, networkOf, looksRandom, NET_PER_MINUTE, PART } from "../sync/src/api.js";
import { Profile, memoryStore, Limiter, memoryLimiterStore, NEW_PER_NETWORK, NEW_PER_DAY, Space, memorySpaceStore, BLOCK, SPACE_BYTES, KEEP_DAYS } from "../sync/src/profile.js";
import { newKey, keysFor, seal, unseal, linkFor, keyFromLink, isKey } from "../js/seal.js";
import { pack, walletOf, RECORD_VERSION } from "../js/merge.js";
import { syncPlayer, remoteVersion, SYNC_URL } from "../js/sync.js";
import { DUNGEON_VERSION } from "../js/store.js";
import { bigRecord } from "./sync-size.mjs";

const SITE = "https://tools.tuley.name";
const HOST = "https://sumgeon-sync.asset-data.stream";
const TOKEN = "T".repeat(43);
// A Durable Object's storage, for its alarm: set, read, and cleared when it goes off (expire).
const fakeStorage = (sql) => ({ sql, at: null, async setAlarm(t) { this.at = t; }, async getAlarm() { return this.at; } });
async function expire(profile) {
  if (profile.storage) profile.storage.at = null;
  const now = profile.now;
  profile.now = () => Date.now() + (KEEP_DAYS + 1) * 86400000;
  try { await profile.alarm(); } finally { profile.now = now; }
}
function service() {
  const profiles = new Map(), limiters = new Map(), space = new Space({ store: memorySpaceStore() });
  const alarmAt = (id) => profiles.get(id).storage.at;
  const env = {
    PROFILE: {
      idFromName: (name) => name,
      get: (id) => {
        if (!profiles.has(id)) profiles.set(id, new Profile({ name: id, store: memoryStore(), storage: fakeStorage() }, env));
        return { fetch: (req) => profiles.get(id).fetch(req) };
      }
    },
    SPACE: { idFromName: (name) => name, get: () => ({ fetch: (url, init) => space.fetch(new Request(url, init)) }) },
    LIMITER: {
      idFromName: (name) => name,
      get: (id) => {
        if (!limiters.has(id)) limiters.set(id, new Limiter({ store: memoryLimiterStore() }));
        return { fetch: (url, init) => limiters.get(id).fetch(new Request(url, init)) };
      }
    }
  };
  // Every request counted, for checking how few a sync sends.
  const log = [];
  const call = (path, init = {}) => {
    log.push((init.method || "GET") + " " + path);
    return handle(new Request(HOST + path, { ...init, headers: { origin: SITE, "x-write-token": TOKEN, ...init.headers } }), env);
  };
  return { call, profiles, limiters, space, alarmAt, log, env };
}
const put = (call, lookup, base, body, token = TOKEN, ip) =>
  call(`/v1/p/${lookup}`, { method: "PUT", headers: { "x-base-version": String(base), "x-write-token": token, ...(ip ? { "cf-connecting-ip": ip } : {}) }, body });
const get = (call, lookup, token = TOKEN, more = {}) => call(`/v1/p/${lookup}`, { headers: { "x-write-token": token, ...more } });

/* ---------- the service ---------- */

test("save and fetch a sealed record; a stale save gets 409; a known version gets 304", async () => {
  const { call } = service();
  const keys = await keysFor(newKey()), tok = keys.writeToken;
  assert.equal((await get(call, keys.lookup, tok)).status, 404);
  let res = await put(call, keys.lookup, 0, await seal(keys, PART, { n: 1 }), tok);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { version: 1 });
  res = await get(call, keys.lookup, tok);
  assert.equal(res.headers.get("x-version"), "1");
  assert.equal(res.headers.get("access-control-allow-origin"), SITE);
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.deepEqual(await unseal(keys, PART, new Uint8Array(await res.arrayBuffer())), { n: 1 });
  // Another device saved from version 0 too: refused, told the current version.
  res = await put(call, keys.lookup, 0, await seal(keys, PART, { n: 2 }), tok);
  assert.equal(res.status, 409);
  assert.deepEqual(await res.json(), { version: 1 });
  assert.equal((await put(call, keys.lookup, 1, await seal(keys, PART, { n: 2 }), tok)).status, 200);
  // A device that already has version 2: nothing to send.
  res = await get(call, keys.lookup, tok, { "x-known-version": "2" });
  assert.equal(res.status, 304);
  assert.equal((await res.arrayBuffer()).byteLength, 0);
  assert.equal((await get(call, keys.lookup, tok, { "x-known-version": "1" })).status, 200);
});

test("refuses other sites, bad paths, and anything that isn't a sealed record", async () => {
  const { call } = service();
  const lookup = (await keysFor(newKey())).lookup;
  const ok = await seal(await keysFor(newKey()), PART, {});
  assert.equal((await call(`/v1/p/${lookup}`, { headers: { origin: "https://example.com" } })).status, 403);
  assert.equal((await call(`/v1/p/${lookup}`, { headers: { origin: "https://sound-box.example" } })).status, 403);
  assert.equal((await call(`/v1/p/${lookup}`, { headers: { origin: "http://localhost:8000" } })).status, 404);
  assert.equal((await call(`/v1/p/short`)).status, 404);
  assert.equal((await call(`/v1/p/${lookup}/g3`)).status, 404, "one record a player: no parts");
  assert.equal((await call(`/other`)).status, 404);
  assert.equal((await put(call, lookup, 0, new TextEncoder().encode("hello, this is not sealed at all"))).status, 400);
  assert.equal((await put(call, lookup, 0, new Uint8Array(MAX_BYTES + 1).fill(1))).status, 413);
  assert.equal((await call(`/v1/p/${lookup}`, { method: "PUT", body: ok })).status, 400); // no base version
  assert.equal((await call(`/v1/p/${lookup}`, { method: "DELETE" })).status, 405);
  const pre = await call(`/v1/p/${lookup}`, { method: "OPTIONS", headers: { "access-control-request-method": "PUT" } });
  assert.equal(pre.status, 204);
  assert.match(pre.headers.get("access-control-allow-headers"), /x-base-version/);
  assert.match(pre.headers.get("access-control-allow-headers"), /x-known-version/);
  // Plain text and files are refused; random bytes of the same size aren't.
  const text = new TextEncoder().encode("x".repeat(4000));
  const fake = new Uint8Array(13 + text.length); fake[0] = 1; fake.set(text, 13);
  assert.equal((await put(call, lookup, 0, fake)).status, 400);
  assert.ok(!looksRandom(text));
  assert.ok(looksRandom(crypto.getRandomValues(new Uint8Array(4000))));
});

test("only the player's own devices can read or save: the token", async () => {
  const { call, profiles } = service();
  const keys = await keysFor(newKey()), other = await keysFor(newKey());
  const rec = await seal(keys, PART, { n: 1 });
  assert.equal((await put(call, keys.lookup, 0, rec, keys.writeToken)).status, 200);
  assert.equal((await put(call, keys.lookup, 1, rec, other.writeToken)).status, 403);
  assert.equal((await put(call, keys.lookup, 1, rec, "")).status, 400);
  assert.equal((await get(call, keys.lookup, other.writeToken)).status, 403);
  assert.equal((await get(call, keys.lookup, "")).status, 400);
  assert.equal((await get(call, keys.lookup, keys.writeToken)).headers.get("x-version"), "1");
  assert.notEqual(profiles.get(keys.lookup).store.owner(), keys.writeToken, "the server keeps a hash, not the token");
});

test("replies never show as a page, and no Origin gets nothing", async () => {
  const { call } = service();
  const keys = await keysFor(newKey());
  await put(call, keys.lookup, 0, await seal(keys, PART, {}), keys.writeToken);
  assert.equal((await handle(new Request(`${HOST}/v1/p/${keys.lookup}`, { headers: { "x-write-token": keys.writeToken } }), {})).status, 403);
  for (const res of [await get(call, keys.lookup, keys.writeToken), await call(`/v1/p/short`)]) {
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.equal(res.headers.get("content-disposition"), "attachment");
    assert.equal(res.headers.get("cache-control"), "no-store");
  }
});

test("new players: NEW_PER_NETWORK a day per network, NEW_PER_DAY for everyone; saving existing ones isn't limited", async () => {
  assert.equal(NEW_PER_NETWORK, 3); assert.equal(NEW_PER_DAY, 50);
  const { call, limiters } = service();
  const made = [];
  for (let i = 0; i < NEW_PER_NETWORK; i++) {
    const k = await keysFor(newKey()); made.push(k);
    assert.equal((await put(call, k.lookup, 0, await seal(k, PART, {}), k.writeToken, "203.0.113.7")).status, 200);
  }
  const extra = await keysFor(newKey());
  assert.equal((await put(call, extra.lookup, 0, await seal(extra, PART, {}), extra.writeToken, "203.0.113.7")).status, 429);
  assert.equal((await put(call, extra.lookup, 0, await seal(extra, PART, {}), extra.writeToken, "198.51.100.2")).status, 200);
  const k = made[0];
  assert.equal((await put(call, k.lookup, 1, await seal(k, PART, { more: 1 }), k.writeToken, "203.0.113.7")).status, 200);
  limiters.get("everyone").store.set(new Date().toISOString().slice(0, 10), NEW_PER_DAY);
  const late = await keysFor(newKey());
  assert.equal((await put(call, late.lookup, 0, await seal(late, PART, {}), late.writeToken, "192.0.2.9")).status, 429);
  assert.equal(networkOf("2001:db8:1:2::1"), networkOf("2001:0db8:0001:0002:ffff:1:2:3"));
  assert.notEqual(networkOf("2001:db8:1:2::1"), networkOf("2001:db8:1:3::1"));
});

test("everything stored fits in SPACE_BYTES (10 MB); expiry gives the room back", async () => {
  assert.equal(SPACE_BYTES, 10 * 1024 * 1024);
  const { call, profiles, space } = service();
  const a = await keysFor(newKey());
  assert.equal((await put(call, a.lookup, 0, await seal(a, PART, {}), a.writeToken)).status, 200);
  assert.equal(space.store.total(), 1);
  space.store.setTotal(SPACE_BYTES / BLOCK - 1);
  const b = await keysFor(newKey()), c = await keysFor(newKey());
  assert.equal((await put(call, b.lookup, 0, await seal(b, PART, {}), b.writeToken, "198.51.100.1")).status, 200);
  assert.equal((await put(call, c.lookup, 0, await seal(c, PART, {}), c.writeToken, "198.51.100.2")).status, 507);
  assert.equal((await put(call, a.lookup, 1, await seal(a, PART, { more: 1 }), a.writeToken)).status, 200);
  await expire(profiles.get(b.lookup));
  assert.equal((await put(call, c.lookup, 0, await seal(c, PART, {}), c.writeToken, "198.51.100.2")).status, 200);
});

test("a player no device has saved in 90 days is deleted (reads don't count), and comes back from its devices", async () => {
  const { call, profiles, alarmAt } = service();
  const keys = await keysFor(newKey());
  const a = device("a"); a.data.wallet = 30;
  await syncPlayer(a.opts(client(call), keys));
  const at = alarmAt(keys.lookup);
  assert.ok(at > Date.now() + (KEEP_DAYS - 1) * 86400000);
  await new Promise((r) => setTimeout(r, 5));
  await get(call, keys.lookup, keys.writeToken);
  assert.equal(alarmAt(keys.lookup), at, "a read moved the expiry");
  await expire(profiles.get(keys.lookup));
  assert.equal((await get(call, keys.lookup, keys.writeToken)).status, 404);
  // The device still has everything; its next sync sends it again (its base is gone: 409, merge).
  a.data.wallet += 5;
  assert.equal(await syncPlayer(a.opts(client(call), keys)), "sent");
  const b = device("b");
  await syncPlayer(b.opts(client(call), keys));
  assert.equal(b.data.wallet, 35);
});

test("the biggest realistic player's record seals under MAX_BYTES, with room", async () => {
  const keys = await keysFor(newKey());
  const sealed = await seal(keys, PART, pack(bigRecord()));
  assert.ok(sealed.length < MAX_BYTES * 0.85, `the biggest realistic record sealed to ${sealed.length} bytes, near MAX_BYTES (${MAX_BYTES}): raise it in sync/src/api.js`);
  assert.ok(looksRandom(sealed.subarray(13)));
});

// The per-network request limit (NET_LIMIT binding, wrangler.jsonc): a fake that counts per key.
function limited(limit = NET_PER_MINUTE, behave) {
  const counts = new Map(), gets = { n: 0 };
  const env = {
    PROFILE: { idFromName: (n) => n, get: () => { gets.n++; return { fetch: async () => new Response(JSON.stringify({ version: 0 }), { status: 404 }) }; } },
    NET_LIMIT: { limit: async ({ key }) => {
      if (behave) return behave(key);
      const n = (counts.get(key) || 0) + 1; counts.set(key, n);
      return { success: n <= limit };
    } }
  };
  const call = (path, init = {}) => handle(new Request(HOST + path, { ...init, headers: { origin: SITE, "x-write-token": TOKEN, ...init.headers } }), env);
  return { call, counts, gets };
}
const LOOKUP = "L".repeat(43);

test("a network over NET_PER_MINUTE gets 503 busy, before any player is touched", async () => {
  assert.equal(NET_PER_MINUTE, 60);
  const { call, gets } = limited(3);
  const ip = { "cf-connecting-ip": "203.0.113.5" };
  for (let i = 0; i < 3; i++) assert.equal((await call(`/v1/p/${LOOKUP}`, { headers: ip })).status, 404);
  const res = await call(`/v1/p/${LOOKUP}`, { headers: ip });
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { error: "busy" });
  assert.equal(res.headers.get("retry-after"), "60");
  assert.equal(gets.n, 3);
  assert.equal((await call(`/v1/p/${LOOKUP}`, { headers: { "cf-connecting-ip": "198.51.100.7" } })).status, 404);
  // The limit never stops a request when it can't answer clearly.
  for (const behave of [() => { throw new Error("down"); }, () => ({}), () => undefined]) {
    assert.equal((await limited(0, behave).call(`/v1/p/${LOOKUP}`)).status, 404);
  }
});

test("wrangler.jsonc matches: its own name and domain, not on workers.dev, NET_LIMIT as documented", async () => {
  const { readFileSync } = await import("node:fs");
  const text = readFileSync(new URL("../sync/wrangler.jsonc", import.meta.url), "utf8").replace(/^\s*\/\/.*$/gm, "");
  const w = JSON.parse(text);
  assert.equal(w.name, "sumgeon-sync");
  assert.equal(w.workers_dev, false);
  assert.deepEqual(w.routes, [{ pattern: "sumgeon-sync.asset-data.stream", custom_domain: true }]);
  assert.equal(w.ratelimits[0].simple.limit, NET_PER_MINUTE);
  assert.notEqual(w.ratelimits[0].namespace_id, "1001", "Sound Box's namespace");
  assert.equal(SYNC_URL, HOST);
});

/* ---------- the game's side: seal.js and sync.js ---------- */

test("link keys and links", async () => {
  const key = newKey();
  assert.ok(isKey(key)); assert.equal(key.length, 43);
  const link = linkFor("https://tools.tuley.name/sumgeon/#old", key);
  assert.equal(link, "https://tools.tuley.name/sumgeon/#link=" + key);
  assert.equal(keyFromLink(link), key);
  assert.equal(keyFromLink("look: " + link + " ok"), key);
  assert.equal(keyFromLink("https://x/#link=short"), null);
  const k1 = await keysFor(key), k2 = await keysFor(key);
  assert.equal(k1.lookup, k2.lookup);
  assert.notEqual(k1.lookup, k1.writeToken);
  // A record sealed for one player won't open for another.
  const sealed = await seal(k1, PART, { a: 1 });
  await assert.rejects(unseal(await keysFor(newKey()), PART, sealed));
  assert.deepEqual(await unseal(k2, PART, sealed), { a: 1 });
});

function client(call) {
  return (url, init = {}) => call(new URL(url).pathname, { method: init.method, headers: init.headers, body: init.body });
}
const empty = () => ({ settings: { band: "kinder", sfx: true }, facts: {}, wings: {}, bestiary: {}, dungeon: DUNGEON_VERSION, wallet: 0, items: { have: {}, slots: [null, null, null] }, wardrobe: { owned: [], wear: {} } });
function device(id) {
  const dev = { id, data: empty(), base: null };
  dev.opts = (fetch, keys) => ({
    fetch, url: HOST, keys, me: id,
    read: () => JSON.parse(JSON.stringify(dev.data)), base: dev.base,
    apply: (data, base) => { dev.data = data; dev.base = base; }
  });
  return dev;
}
const t0 = 29916667 * 60000;
function play(dev, key, ok = true, t = t0) {
  const f = dev.data.facts[key] = dev.data.facts[key] || { b: 0, n: 0, c: 0, ms: 0, t: 0 };
  f.n++; if (ok) f.c++; f.t = t; f.ms = 2000; f.b = ok ? Math.min(4, f.b + 1) : 0;
}

test("syncPlayer: two devices share progress; a sync with nothing new is one small request", async () => {
  const { call, log } = service();
  const keys = await keysFor(newKey());
  const a = device("a"), b = device("b");
  play(a, "+1,2"); play(a, "+1,2"); a.data.wallet = 25;
  assert.equal(await syncPlayer(a.opts(client(call), keys)), "sent");
  play(b, "+1,2", false, t0 + 60000); b.data.wallet = 10;
  await syncPlayer(b.opts(client(call), keys));
  await syncPlayer(a.opts(client(call), keys));
  for (const d of [a, b]) {
    assert.deepEqual([d.data.facts["+1,2"].n, d.data.facts["+1,2"].c, d.data.facts["+1,2"].b], [3, 2, 0]);
    assert.equal(d.data.wallet, 35);
  }
  // Nothing new on either side: one GET, answered 304.
  log.length = 0;
  assert.equal(await syncPlayer(b.opts(client(call), keys)), "same");
  assert.deepEqual(log, ["GET /v1/p/" + keys.lookup]);
  // Something new here, nothing there: one PUT.
  log.length = 0;
  play(b, "+2,2");
  assert.equal(await syncPlayer(b.opts(client(call), keys)), "sent");
  assert.deepEqual(log, ["PUT /v1/p/" + keys.lookup]);
});

test("syncPlayer: a device's first sync takes the linked player's settings, and adds its own progress", async () => {
  const { call } = service();
  const keys = await keysFor(newKey());
  const a = device("a"), z = device("0");
  a.data.settings = { band: "third", sfx: false }; a.data.wallet = 30; play(a, "×3,4");
  await syncPlayer(a.opts(client(call), keys));
  // "0" sorts before "a", so without adopting, a tie of first edits would go either way.
  z.data.settings = { band: "kinder", sfx: true }; z.data.wallet = 5; play(z, "+1,1");
  await syncPlayer(z.opts(client(call), keys));
  await syncPlayer(a.opts(client(call), keys));
  for (const d of [a, z]) {
    assert.deepEqual(d.data.settings, { band: "third", sfx: false });
    assert.equal(d.data.wallet, 35);
    assert.deepEqual(Object.keys(d.data.facts).sort(), ["+1,1", "×3,4"]);
  }
  // From then on, an edit on either side wins as usual.
  z.data.settings.sfx = true;
  await syncPlayer(z.opts(client(call), keys));
  await syncPlayer(a.opts(client(call), keys));
  assert.equal(a.data.settings.sfx, true);
});

test("syncPlayer: a 409 is merged and saved once more; never a loop", async () => {
  const { call, log } = service();
  const keys = await keysFor(newKey());
  const a = device("a"), b = device("b");
  await syncPlayer(a.opts(client(call), keys));
  await syncPlayer(b.opts(client(call), keys));
  a.data.wallet = 7; await syncPlayer(a.opts(client(call), keys));
  b.data.wallet = 4; // b's base is out of date now
  log.length = 0;
  assert.equal(await syncPlayer(b.opts(client(call), keys)), "both");
  assert.deepEqual(log.map((l) => l.split(" ")[0]), ["PUT", "GET", "PUT"]);
  assert.equal(b.data.wallet, 11);
  // Another device saves between every GET and PUT: it gives up after one retry, keeping what it
  // fetched, and the next sync gets there.
  b.data.wallet += 1;
  let sneak = 0;
  const racing = async (url, init = {}) => {
    if (init.method === "PUT" && sneak++ < 2) { a.data.wallet += 1; await syncPlayer(a.opts(client(call), keys)); }
    return client(call)(url, init);
  };
  await assert.rejects(syncPlayer(b.opts(racing, keys)), (e) => e.later);
  await syncPlayer(b.opts(client(call), keys));
  await syncPlayer(a.opts(client(call), keys));
  assert.equal(a.data.wallet, 14); assert.equal(b.data.wallet, 14);
});

test("syncPlayer: coins spent or found while it waits on the network are kept, never doubled", async () => {
  const { call } = service();
  const keys = await keysFor(newKey());
  const a = device("a"), b = device("b");
  a.data.wallet = 50;
  await syncPlayer(a.opts(client(call), keys));
  await syncPlayer(b.opts(client(call), keys));
  // a finds 10 and starts syncing; while the save is on its way, a spends 30.
  a.data.wallet += 10;
  let spent = false;
  const slow = async (url, init = {}) => {
    const res = await client(call)(url, init);
    if (init.method === "PUT" && !spent) { spent = true; a.data.wallet -= 30; }
    return res;
  };
  await syncPlayer(a.opts(slow, keys));
  assert.equal(a.data.wallet, 30);
  for (let i = 0; i < 3; i++) { await syncPlayer(a.opts(client(call), keys)); await syncPlayer(b.opts(client(call), keys)); }
  assert.equal(a.data.wallet, 30); assert.equal(b.data.wallet, 30);
  const res = await get(call, keys.lookup, keys.writeToken);
  const { unpack } = await import("../js/merge.js");
  assert.equal(walletOf(unpack(await unseal(keys, PART, new Uint8Array(await res.arrayBuffer())))), 30);
});

test("syncPlayer: a record from a newer game is left alone", async () => {
  const { call } = service();
  const keys = await keysFor(newKey());
  for (const rec of [{ v: RECORD_VERSION + 1, dungeon: DUNGEON_VERSION }, { v: RECORD_VERSION, dungeon: DUNGEON_VERSION + 1 }]) {
    const k = await keysFor(newKey());
    await put(call, k.lookup, 0, await seal(k, PART, rec), k.writeToken);
    const a = device("a"); a.data.wallet = 3;
    const was = JSON.stringify(a.data);
    await assert.rejects(syncPlayer(a.opts(client(call), k)), (e) => e.newer);
    assert.equal(JSON.stringify(a.data), was);
  }
  assert.equal(await remoteVersion({ fetch: client(call), url: HOST, keys }), 0);
});

test("syncPlayer: busy, limited, full, too big and a lost connection are told apart", async () => {
  const keys = await keysFor(newKey());
  const reply = (status, body = {}) => () => Promise.resolve(new Response(JSON.stringify(body), { status }));
  const a = () => { const d = device("a"); d.data.wallet = 1; return d; };
  await assert.rejects(syncPlayer(a().opts(reply(503, { error: "busy" }), keys)), (e) => e.busy);
  const { call } = service();
  const onPut = (status, body) => (url, init = {}) => (init.method === "PUT" ? reply(status, body)() : client(call)(url, init));
  await assert.rejects(syncPlayer(a().opts(onPut(429), keys)), (e) => e.limited);
  await assert.rejects(syncPlayer(a().opts(onPut(507), keys)), (e) => e.full);
  await assert.rejects(syncPlayer(a().opts(onPut(413), keys)), (e) => e.big);
  await assert.rejects(syncPlayer(a().opts(() => Promise.reject(new TypeError("Failed to fetch")), keys)), (e) => !e.busy && !e.limited);
  await assert.rejects(remoteVersion({ fetch: reply(503, { error: "busy" }), url: HOST, keys }), (e) => e.busy);
});

test("Receive's check: whether anything is saved for a link", async () => {
  const { call } = service();
  const keys = await keysFor(newKey());
  assert.equal(await remoteVersion({ fetch: client(call), url: HOST, keys }), 0);
  const a = device("a"); a.data.wallet = 2;
  await syncPlayer(a.opts(client(call), keys));
  assert.equal(await remoteVersion({ fetch: client(call), url: HOST, keys }), 1);
});

// The real SQL (sqlStore, limiterStore, spaceStore), on Node's built-in SQLite where there is
// one, shaped like a Durable Object's ctx.storage.sql.
let sqlite = null;
try { sqlite = await import("node:sqlite"); } catch (e) { /* older Node: skipped */ }
function doSql() {
  const db = new sqlite.DatabaseSync(":memory:");
  const blob = (v) => (v instanceof ArrayBuffer ? new Uint8Array(v) : v);
  return {
    db,
    exec(q, ...params) {
      const st = db.prepare(q), rows = /^\s*SELECT/i.test(q) ? st.all(...params.map(blob)) : (st.run(...params.map(blob)), []);
      return { toArray: () => rows };
    }
  };
}
test("the real SQL: players, limits and room", { skip: !sqlite && "node:sqlite isn't available" }, async () => {
  const { limiterStore, spaceStore } = await import("../sync/src/profile.js");
  const sqls = new Map(), sqlFor = (name) => { if (!sqls.has(name)) sqls.set(name, doSql()); return sqls.get(name); };
  const env = {};
  const ns = (make) => {
    const objects = new Map();
    return { objects, idFromName: (n) => n, get: (id) => { if (!objects.has(id)) objects.set(id, make(id)); return { fetch: (u, i) => objects.get(id).fetch(u instanceof Request ? u : new Request(u, i)) }; } };
  };
  env.PROFILE = ns((id) => new Profile({ name: id, storage: fakeStorage(sqlFor(id)) }, env));
  env.LIMITER = ns((id) => new Limiter({ store: limiterStore(sqlFor("limiter:" + id)) }));
  env.SPACE = ns((id) => new Space({ store: spaceStore(sqlFor("space:" + id)) }));
  const call = (path, init = {}) => handle(new Request(HOST + path, { ...init, headers: { origin: SITE, ...init.headers } }), env);
  const k = await keysFor(newKey());
  assert.equal((await get(call, k.lookup, k.writeToken)).status, 404);
  assert.equal(sqlFor(k.lookup).db.prepare("SELECT COUNT(*) AS n FROM sqlite_master").get().n, 0, "a read leaves no tables behind");
  const rec = await seal(k, PART, pack(bigRecord()));
  assert.equal((await put(call, k.lookup, 0, rec, k.writeToken)).status, 200);
  const got = await get(call, k.lookup, k.writeToken);
  assert.equal(got.headers.get("x-version"), "1");
  assert.equal((await got.arrayBuffer()).byteLength, rec.length);
  assert.equal((await get(call, k.lookup, k.writeToken, { "x-known-version": "1" })).status, 304);
  assert.equal((await put(call, k.lookup, 0, rec, k.writeToken)).status, 409);
  const p = env.PROFILE.objects.get(k.lookup);
  assert.equal(p.store.reserved(), Math.ceil(rec.length / BLOCK));
  await expire(p);
  assert.deepEqual(p.store.list(), []);
  assert.equal(env.SPACE.objects.get("everyone").store.total(), 0);
  const lim = new Limiter({ store: limiterStore(sqlFor("limiter-test")) });
  for (let i = 0; i < 3; i++) assert.equal((await lim.fetch(new Request("https://limiter/take?limit=3", { method: "POST" }))).status, 200);
  assert.equal((await lim.fetch(new Request("https://limiter/take?limit=3", { method: "POST" }))).status, 429);
});
