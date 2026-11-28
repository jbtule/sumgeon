// The sync service's requests (index.js is the Worker). Built from sound-box-crosswords' sync/,
// as its own Worker (`sumgeon-sync`, at https://sumgeon-sync.asset-data.stream/), so neither app's
// record format or limits can affect the other's. It stores one sealed record per linked player
// (js/seal.js) for the player's devices to fetch and merge; it can't read it, and holds no names
// or accounts. Each player is its own Durable Object (profile.js). Deployed by the sync-deploy job
// in .github/workflows/ci.yml.
//
//   GET /v1/p/<lookup>   the sealed record, its version in X-Version (404: none yet). With
//                        X-Known-Version: the version the device already has, 304 and no body
//                        when it's still the latest, so a sync that finds nothing new is small.
//   PUT /v1/p/<lookup>   save, with X-Base-Version: the version it was merged from (0 for a first
//                        save); 409 { version } if another device saved since: fetch, merge, and
//                        try again; 429 if the network has made too many new players today; 507 if
//                        the service is full (SPACE_BYTES); 413 over MAX_BYTES
//   Every request carries X-Write-Token (from the link key: only the player's devices have it),
//   reads too, and comes from the game's own pages (Origin), so the service can't be used to
//   keep or hand out other things.
//   Any of them: 503 { error: "busy" } (Retry-After: 60) when the network has sent more than
//   NET_PER_MINUTE requests this minute (the NET_LIMIT binding, wrangler.jsonc).
//
// It shares the Cloudflare account's free-plan quotas with Sound Box's sync service, so its
// limits are low and the game syncs lazily (CLAUDE.md "Linking and sync").
// It refuses anything that isn't a sealed record of a sensible size, and a player no device has
// saved in 90 days is deleted (profile.js): devices keep their own copies and send them again.

// The biggest realistic player (every fact of every band, K to 4th, seen over three school years
// on two devices) seals to about 36.6 KB (scripts/sync-size.mjs bigRecord; it was 24 KB before
// the Fraction Forge's 599 4th grade facts, and 32.4 KB before batch 3's 212 chart facts); a
// school year on two devices to about 11.5 KB. 44 KB is the smallest whole size that keeps the
// test's 15% of room (scripts/sync.test.mjs: 43 KB would be about 40 bytes short), still three
// 16 KB blocks, without letting the service hold much else. (Every fact seen at random times on three devices, more
// than anyone will play, is over it: that player stays on each device and shows "too big to sync".)
export const MAX_BYTES = 44 * 1024;
const MIN_BYTES = 1 + 12 + 16; // format byte, IV, GCM tag
const ORIGINS = [/^https:\/\/tools\.tuley\.name$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
const LOOKUP = /^[A-Za-z0-9_-]{43}$/;
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
// The one record a player keeps (profile.js keeps records by name, as Sound Box's keeps grades).
export const PART = "p";
// The NET_LIMIT binding's limit (set in wrangler.jsonc; here for the docs and tests). A device
// sends one or two requests a sync and syncs a few times an hour at most; a family of devices on
// one network is far under it.
export const NET_PER_MINUTE = 60;

// Over this network's requests for the minute? Approximate (counted per Cloudflare location). It
// only makes the service less useful to scripts, so anything going wrong here lets the request
// through: no binding (tests, local), an error, or an answer that isn't a clear "no".
async function overLimit(env, request) {
  if (!env || !env.NET_LIMIT) return false;
  try {
    const r = await env.NET_LIMIT.limit({ key: networkOf(request.headers.get("cf-connecting-ip")) });
    return !!r && r.success === false;
  } catch (e) {
    return false;
  }
}

// Encrypted bytes look random: each of the 256 byte values about equally often. A chi-square
// test on the sealed part, with a bar random data fails about once in 10^17 tries, refuses
// anything that isn't encrypted, including many compressed formats. It's a speed bump, not a
// guarantee: encrypted data can't be told apart by design, and the 10 MB cap (profile.js) is
// the real bound. Under 1 KB there's too little to judge, and too little to matter.
export function looksRandom(bytes) {
  const n = bytes.length;
  if (n < 1024) return true;
  const count = new Uint32Array(256);
  for (const b of bytes) count[b]++;
  const e = n / 256;
  let x = 0;
  for (const k of count) x += (k - e) * (k - e) / e;
  return x < 255 + 12 * Math.sqrt(510);
}

// The network a request came from, for counting new players: the IPv4 address, or an IPv6
// address's first 64 bits (one home or phone gets a whole /64 and can pick any address in it).
export function networkOf(ip) {
  if (!ip) return "unknown";
  if (!ip.includes(":")) return ip;
  const [head, tail = ""] = ip.split("::");
  const a = head ? head.split(":") : [], b = tail ? tail.split(":") : [];
  const groups = ip.includes("::") ? [...a, ...Array(8 - a.length - b.length).fill("0"), ...b] : a;
  return groups.slice(0, 4).map((g) => parseInt(g || "0", 16).toString(16)).join(":") + "::/64";
}

function cors(origin) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, PUT, OPTIONS",
    "access-control-allow-headers": "content-type, x-base-version, x-known-version, x-write-token",
    "access-control-expose-headers": "x-version",
    "access-control-max-age": "86400",
    vary: "origin"
  };
}
const reply = (status, value, origin) =>
  new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json", ...PLAIN_HEADERS, ...(origin ? cors(origin) : {}) } });
// On every reply: never cached, never shown as a page (it's data, not a website).
const PLAIN_HEADERS = { "cache-control": "no-store", "x-content-type-options": "nosniff", "content-disposition": "attachment" };

export async function handle(request, env) {
  const origin = request.headers.get("origin");
  const allowed = origin && ORIGINS.some((re) => re.test(origin)) ? origin : null;
  // Only the game's own pages: another site, a link, an <img> or a plain download gets nothing.
  // (A script can fake the header; the token below is what keeps what's stored to its owners.)
  if (!allowed) return reply(403, { error: "origin" }, null);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(allowed) });

  const m = new URL(request.url).pathname.match(/^\/v1\/p\/([^/]+)$/);
  if (!m || !LOOKUP.test(m[1])) return reply(404, { error: "path" }, allowed);
  const lookup = m[1];
  // Every request proves it has the player's key, reads too: what's stored can only be fetched
  // by its own devices, so it can't be handed out as a link.
  if (!TOKEN.test(request.headers.get("x-write-token") || "")) return reply(400, { error: "x-write-token" }, allowed);
  // Counted here: after the cheap checks (junk they refuse isn't counted), before a body is read
  // or any player is touched.
  if (await overLimit(env, request)) {
    const busy = reply(503, { error: "busy" }, allowed);
    busy.headers.set("retry-after", "60");
    return busy;
  }

  let body = null;
  if (request.method === "PUT") {
    if (!/^\d+$/.test(request.headers.get("x-base-version") || "")) return reply(400, { error: "x-base-version" }, allowed);
    if (Number(request.headers.get("content-length") || 0) > MAX_BYTES) return reply(413, { error: "too big" }, allowed);
    body = await request.arrayBuffer();
    const b = new Uint8Array(body);
    if (b.length > MAX_BYTES) return reply(413, { error: "too big" }, allowed);
    if (b.length < MIN_BYTES || b[0] !== 1 || !looksRandom(b.subarray(13))) return reply(400, { error: "not a sealed record" }, allowed);
  } else if (request.method !== "GET") {
    return reply(405, { error: "method" }, allowed);
  }

  const known = request.headers.get("x-known-version");
  const stub = env.PROFILE.get(env.PROFILE.idFromName(lookup));
  const res = await stub.fetch(new Request("https://profile/" + PART, {
    method: request.method,
    headers: {
      "x-write-token": request.headers.get("x-write-token"),
      ...(body ? { "x-base-version": request.headers.get("x-base-version"), "x-network": networkOf(request.headers.get("cf-connecting-ip")) } : {}),
      ...(!body && known && /^\d+$/.test(known) ? { "x-known-version": known } : {})
    },
    body
  }));
  const out = new Response(res.status === 304 ? null : res.body, res);
  for (const [k, v] of Object.entries({ ...PLAIN_HEADERS, ...cors(allowed) })) out.headers.set(k, v);
  return out;
}
