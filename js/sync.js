// No DOM. One sync of a linked player with the sync service (sync/; DESIGN.md §15), patterned on
// sound-box-crosswords' sync.js: fetch the server's sealed record, merge this device's data into
// it (merge.js), save it back from the version it was fetched at, then hand back what to keep
// here. Used by app.js; `fetch` is passed in so the tests can use the service directly.
//
// Lazy on purpose: the service shares the Cloudflare account's free-plan quotas with Sound Box's,
// and a sync that's late or skipped is no harm (every device keeps its own copy and plays
// offline). So a sync is at most two requests, and usually one:
//   - nothing new here: GET with the version this device already has, answered 304 with no body
//     when nothing is new there either;
//   - something new here: PUT straight from that version;
//   - the first sync on this device, or the other side moved on (a 409, or a 200 to the GET):
//     GET, merge, PUT.
// A save refused as out of date once more is left for the next sync, never retried in a loop.
// When to sync is app.js's (`syncSoon`, `syncDue`): at launch, coming back after a while, and
// at the end of a run.
import { seal, unseal } from "./seal.js";
import { toRecord, merge, adopt, fromRecord, canon, pack, unpack, RECORD_VERSION } from "./merge.js";
import { DUNGEON_VERSION } from "./store.js";

export const SYNC_URL = "https://sumgeon-sync.asset-data.stream";
// The one record a player keeps (sync/src/api.js PART).
const PART = "p";

// A record saved by a newer version of the game, in a format this one doesn't know all of (or
// after a dungeon bump this one hasn't had): merging and saving it back would drop what it doesn't
// know, so the player isn't synced until this device updates (checkUpdate does, at the next start
// screen).
export class NewerRecord extends Error {
  constructor(v) { super("sync: record " + v + " is newer than this game"); this.newer = true; }
}

// A failed reply as an error, marked with what it means for when to try again:
//   busy (503 "busy": too many requests from this network this minute), limited (429: too many new
//   players today), full (507), big (413): leave it for a day; anything else: next time.
async function failure(res) {
  if (res.status === 503) {
    let body = null;
    try { body = await res.clone().json(); } catch (e) { /* not JSON */ }
    if (body && body.error === "busy") return Object.assign(new Error("sync: the sync service is busy"), { busy: true });
  }
  if (res.status === 429) return Object.assign(new Error("sync: too many new players from this network today"), { limited: true });
  if (res.status === 507) return Object.assign(new Error("sync: the sync service is full"), { full: true });
  if (res.status === 413) return Object.assign(new Error("sync: this player's progress is too big to sync"), { big: true });
  return new Error("sync: " + res.status);
}

// Whether anything is saved for this link (Receive asks before linking): the version, or 0.
export async function remoteVersion({ fetch, url = SYNC_URL, keys }) {
  const res = await fetch(`${url}/v1/p/${keys.lookup}`, { cache: "no-store", headers: { "x-write-token": keys.writeToken } });
  if (res.status === 404) return 0;
  if (!res.ok) throw await failure(res);
  return Number(res.headers.get("x-version")) || 0;
}

// read(): the player's saved data now (called again at the end, since play may go on while this
// waits on the network); base: { version, rec }, the last record merged here and the server's
// version of it, or null; me: this device's id. apply(data, base) is given the data to keep and
// the next base. Returns "same" (nothing new either way), "sent", "got" or "both"; throws if the
// service can't be reached or turns it away, or the record won't open.
export async function syncPlayer({ fetch, url = SYNC_URL, keys, me, read, base, apply }) {
  const at = `${url}/v1/p/${keys.lookup}`;
  const headers = (more) => ({ "x-write-token": keys.writeToken, ...more });
  const mine = toRecord(read(), base && base.rec, me);
  const changed = !base || canon(mine) !== canon(base.rec);

  async function get(known) {
    const res = await fetch(at, { cache: "no-store", headers: headers(known ? { "x-known-version": String(known) } : {}) });
    if (res.status === 304) return { version: known, rec: null, same: true };
    if (res.status === 404) return { version: 0, rec: null };
    if (res.status !== 200) throw await failure(res);
    const version = Number(res.headers.get("x-version"));
    const rec = unpack(await unseal(keys, PART, new Uint8Array(await res.arrayBuffer())));
    if (rec && (rec.v > RECORD_VERSION || (rec.dungeon || 0) > DUNGEON_VERSION)) throw new NewerRecord(rec.v + "/" + rec.dungeon);
    return { version, rec };
  }
  // Saves rec from version: the new version, or 0 when another device saved first (409).
  async function put(rec, version) {
    const res = await fetch(at, {
      method: "PUT",
      headers: headers({ "content-type": "application/octet-stream", "x-base-version": String(version) }),
      body: await seal(keys, PART, pack(rec))
    });
    if (res.status === 409) return 0;
    if (!res.ok) throw await failure(res);
    return (await res.json()).version;
  }
  // Keeps the result here, with anything played meanwhile added on top (its change since `mine`).
  // On this device's first sync (no base: just linked) the linked player's settings, hero and the
  // rest of what goes by the latest edit win over this device's (adopt), here as in the merge.
  function keep(rec, next) {
    const now = read(), played = toRecord(now, mine, me);
    apply(fromRecord(merge(rec, base ? played : adopt(played, rec)), now), next);
  }

  // Nothing new here: is anything new there?
  if (!changed) {
    const got = await get(base.version);
    if (got.same) return "same";
    const merged = merge(mine, got.rec);
    if (canon(merged) === canon(got.rec)) { keep(merged, { version: got.version, rec: got.rec }); return "got"; }
    const v = await put(merged, got.version);
    keep(merged, v ? { version: v, rec: merged } : { version: got.version, rec: got.rec });
    return "both";
  }
  // Something new here, and the server's copy as of base: save straight away.
  if (base && base.version) {
    const v = await put(mine, base.version);
    if (v) { keep(mine, { version: v, rec: mine }); return "sent"; }
  }
  // The first sync here, or another device saved meanwhile: fetch, merge and save once more.
  const got = await get(0);
  const merged = merge(base ? mine : adopt(mine, got.rec), got.rec);
  if (got.rec && canon(merged) === canon(got.rec)) { keep(merged, { version: got.version, rec: got.rec }); return "got"; }
  const v = await put(merged, got.version);
  // Out of date again: keep what was fetched here, and send ours next time.
  keep(merged, v ? { version: v, rec: merged } : got.rec ? { version: got.version, rec: got.rec } : base);
  if (!v) throw Object.assign(new Error("sync: another device is saving; next time"), { later: true });
  return got.rec ? "both" : "sent";
}
