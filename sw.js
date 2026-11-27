// Sumgeon's service worker: offline play (CLAUDE.md "Offline"). Registered by app.js with scope
// "./", so /sumgeon/ when deployed. A classic script, so every browser that has service workers
// runs it; scripts/offline.test.mjs loads it in Node to test route().
//
// - The game's shell (index.html and every file it loads, all stamped ?v=<sha>) is precached for
//   each deployed version: scripts/stamp.mjs fills in VERSION and SHELL below. A new deploy is a
//   new sw.js, so the browser installs it, precaches the new shell whole, takes over and deletes
//   the old versions' shells. The page is network-first, so it's always the newest online (and
//   checkUpdate's ?v= reload works as before); offline it's the cached shell of this version,
//   whose files are all in the same cache, so a shell is never half old.
// - The voice's sprites (sumgeon-voice) are cache-first: a sprite's address is its content's hash,
//   so it never changes. speech.js saves them all in the background (saveVoice) and prunes the
//   ones an update dropped; whatever the game fetches is kept too.
// - audio.json is network-first, with the copy last fetched kept for offline.
// - A line asked for on its own (speech.js: a Range request for its bytes in a sprite not loaded)
//   is answered from the saved sprite when there is one, cut to the range (206), so it plays
//   offline; otherwise it goes to the network as it is. Other ranged requests, and any single
//   clip (_audio/a/, the audio host's /a/: no longer deployed, but an older page may ask), are
//   left to the browser.
// - Dev mode (VERSION "dev": the dev server serves this file as it is): network-first for
//   everything, the cache only a fallback when the network is gone, so an edit is never stale.
var VERSION = "dev";
var SHELL = [];

var DEV = VERSION === "dev";
var SHELL_CACHE = "sumgeon-shell-" + VERSION, DATA_CACHE = "sumgeon-data", VOICE_CACHE = "sumgeon-voice", DEV_CACHE = "sumgeon-dev";

// What to do with a request: "page" (the game's index.html), "shell" (a stamped file), "data"
// (audio.json), "voice" (a sprite), "line" (a range of a sprite: one line), "dev" (anything else
// of the site in dev mode), or null (left to the browser). url: a URL; scope: the worker's scope
// URL; dev: dev mode; ranged: the request has a Range header.
function route(url, mode, scope, dev, ranged) {
  var sprite = /\/s\/[0-9a-f]+\.mp3$/.test(url.pathname); // the audio host's, or the dev server's _audio/s/
  if (ranged) return sprite ? "line" : null;
  if (sprite) return "voice";
  var base = new URL(scope);
  if (url.origin !== base.origin || url.pathname.indexOf(base.pathname) !== 0) return null;
  var rel = url.pathname.slice(base.pathname.length);
  if (rel === "version.json" || /^_audio\//.test(rel)) return null; // the update check; single clips
  if (rel === "audio.json") return "data";
  if (rel === "" || rel === "index.html") return "page";
  if (dev) return "dev";
  if (mode === "navigate") return null; // the grown-up pages: online only
  return url.searchParams.has("v") ? "shell" : null;
}
// A request's cache key in dev mode and for audio.json: its address without the stamp, so a
// file is kept once however often it changes.
function plain(url) {
  var u = new URL(url);
  u.searchParams.delete("v"); u.searchParams.delete("t");
  u.hash = "";
  return u.toString();
}

function put(name, key, res) {
  return caches.open(name).then(function (c) { return c.put(key, res); }).catch(function () { /* full: still play */ });
}
function match(name, key) {
  return caches.open(name).then(function (c) { return c.match(key); });
}
// Network first; a good answer is kept under key in cache name (when given); the kept copy when
// the network is gone, or after SLOW ms of waiting on a network that's there but barely (a weak
// Wi-Fi), so the game still opens.
var SLOW = 6000;
function networkFirst(req, name, key, fallback) {
  var kept = function () { return (fallback || function () { return match(name, key); })(); };
  var net = fetch(req).then(function (res) {
    if (name && res.ok) return put(name, key, res.clone()).then(function () { return res; });
    return res;
  });
  var slow = new Promise(function (resolve) {
    setTimeout(function () { kept().then(function (hit) { if (hit) resolve(hit); }, function () {}); }, SLOW);
  });
  return Promise.race([net, slow]).catch(function (err) {
    return kept().then(function (hit) { if (hit) return hit; throw err; });
  });
}
// Cache first; a miss is fetched and kept (only a readable answer: an opaque one would count
// hugely against Safari's quota). The answer waits until it's kept, so whoever asked knows.
function cacheFirst(req, name) {
  return match(name, req).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      if (res.ok && res.type !== "opaque") return put(name, req, res.clone()).then(function () { return res; });
      return res;
    });
  });
}

// A Range header's single range in a file of size bytes: { start, end } (inclusive), or null.
// The same rule as js/ranges.js parseRange (a classic script can't import it).
function parseRange(header, size) {
  var m = /^bytes=(\d*)-(\d*)$/.exec(String(header || "").trim());
  if (!m || (m[1] === "" && m[2] === "")) return null;
  var start, end;
  if (m[1] === "") { start = Math.max(0, size - Number(m[2])); end = size - 1; }
  else { start = Number(m[1]); end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1); }
  return start <= end && start < size ? { start: start, end: end } : null;
}
// A saved whole sprite cut to the range asked for: a 206 with that part, or a 416.
function rangeOf(res, header) {
  return res.blob().then(function (blob) {
    var r = parseRange(header, blob.size);
    if (!r) return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + blob.size } });
    return new Response(blob.slice(r.start, r.end + 1), { status: 206, headers: {
      "Content-Type": res.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": "bytes " + r.start + "-" + r.end + "/" + blob.size,
      "Content-Length": String(r.end - r.start + 1)
    } });
  });
}
// One line of a sprite: from the saved sprite when it's there (offline too), else the network.
function line(req) {
  return match(VOICE_CACHE, req.url).then(function (hit) {
    return hit ? rangeOf(hit, req.headers.get("range")) : fetch(req);
  }, function () { return fetch(req); });
}

function handle(req, kind, scope) {
  if (kind === "page") {
    // The page: the newest from the network; offline, this version's shell (or dev's last copy).
    var home = new URL("./", scope).toString();
    return networkFirst(req, DEV ? DEV_CACHE : null, home, function () {
      return match(DEV ? DEV_CACHE : SHELL_CACHE, home).then(function (hit) { return hit || caches.match(home); });
    });
  }
  if (kind === "data") return networkFirst(req, DATA_CACHE, plain(req.url));
  if (kind === "dev") return networkFirst(req, DEV_CACHE, plain(req.url));
  if (kind === "voice") return cacheFirst(req, VOICE_CACHE);
  if (kind === "line") return line(req);
  return cacheFirst(req, SHELL_CACHE); // "shell"
}

if (typeof self !== "undefined" && self.addEventListener) {
  self.addEventListener("install", function (e) {
    e.waitUntil(Promise.all([
      // The whole shell or nothing: a failed file fails the install and the old version stays.
      DEV ? null : caches.open(SHELL_CACHE).then(function (c) { return c.addAll(SHELL.map(function (u) { return new Request(u, { cache: "reload" }); })); }),
      // audio.json, so the voice works offline even if the page fetched it before this worker took over.
      fetch(new Request("audio.json", { cache: "reload" })).then(function (res) { if (res.ok) return put(DATA_CACHE, plain(new URL("audio.json", self.registration.scope)), res); }).catch(function () { /* none locally */ })
    ]).then(function () { return self.skipWaiting(); }));
  });
  self.addEventListener("activate", function (e) {
    e.waitUntil(caches.keys().then(function (names) {
      return Promise.all(names.filter(function (n) {
        return (n.indexOf("sumgeon-shell-") === 0 && n !== SHELL_CACHE) || (!DEV && n === DEV_CACHE);
      }).map(function (n) { return caches.delete(n); }));
    }).then(function () { return self.clients.claim(); }));
  });
  self.addEventListener("fetch", function (e) {
    var req = e.request;
    if (req.method !== "GET") return;
    var kind = route(new URL(req.url), req.mode, self.registration.scope, DEV, req.headers.has("range"));
    if (kind) e.respondWith(handle(req, kind, self.registration.scope));
  });
  // Dev mode: the page lists what it loaded before this worker took over, to keep for offline.
  self.addEventListener("message", function (e) {
    var urls = e.data && e.data.warm;
    if (!DEV || !Array.isArray(urls)) return;
    e.waitUntil(Promise.all(urls.map(function (u) {
      var url = new URL(u), kind = route(url, "", self.registration.scope, true, false);
      if (kind !== "dev" && kind !== "page" && kind !== "data") return null;
      var key = kind === "page" ? new URL("./", self.registration.scope).toString() : plain(u);
      return fetch(u).then(function (res) { if (res.ok) return put(kind === "data" ? DATA_CACHE : DEV_CACHE, key, res); }).catch(function () {});
    })));
  });
}
