// The voice's ranged fetches in a real browser (Chromium, muted, device speech stubbed), run by
// hand: it needs Playwright (NODE_PATH) and a local build (scripts/audio/build.mjs: _audio/s and
// an audio.json whose sprite URLs are pointed at "/_audio/s/…"), with the dev server running:
//   node scripts/dev-server.mjs 8797 & NODE_PATH=… node scripts/voice-range-browser.mjs 8797
// A (no service worker, no Cache API, so nothing saved): a line whose sprite isn't loaded is
//   fetched with a Range header, gets a 206, and decodes; a hero quip the same way; offline, the
//   device voice, no crash. A5: with ranged fetches refused, the whole sprite instead.
// B (worker and caches): offline, a saved sprite's line decodes with no network; the worker
//   answers a ranged request from the cache (206).
// C: the listen check plays a line from a ranged fetch.
import { createRequire } from "node:module";
// Playwright through NODE_PATH, as scripts/offline-browser.mjs loads it.
const { chromium } = createRequire(import.meta.url)("playwright");
const port = process.argv[2] || 8797, base = `http://127.0.0.1:${port}/`;
const browser = await chromium.launch({ args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"] });
const fail = (m) => { console.log("FAIL:", m); process.exitCode = 1; };
const init = () => (noCache) => {
  window.__spoken = [];
  const s = window.speechSynthesis;
  if (s) s.speak = (u) => { window.__spoken.push(u.text); setTimeout(() => u.onend && u.onend(), 10); };
  window.__decoded = 0;
  const d = AudioContext.prototype.decodeAudioData;
  AudioContext.prototype.decodeAudioData = function (b, ok, no) { return d.call(this, b, (buf) => { window.__decoded++; ok && ok(buf); }, no); };
  if (noCache) Object.defineProperty(window, "caches", { value: undefined, configurable: true });
};
async function open(opts, noCache) {
  const ctx = await browser.newContext(opts);
  await ctx.addInitScript(`(${init().toString()})(${!!noCache})`);
  const page = await ctx.newPage(), ranged = [];
  page.on("response", async (r) => {
    const range = await r.request().headerValue("range").catch(() => null);
    if (/\/_audio\/s\//.test(r.url()) && range) ranged.push({ url: r.url().replace(base, ""), range, status: r.status(), fromSW: r.fromServiceWorker() });
  });
  await page.goto(base);
  await page.waitForTimeout(1500);
  await page.mouse.click(5, 5); // the first tap: makes the audio context
  await page.waitForTimeout(800);
  const speechUrl = await page.evaluate(() => performance.getEntriesByType("resource").map((e) => e.name).find((n) => /\/js\/speech\.js/.test(n)));
  const sayLine = (kind, text) => page.evaluate(async ([u, kind, text]) => {
    const m = await import(u), before = window.__decoded, spoken = window.__spoken.length;
    await m.say(kind, text, true);
    await new Promise((r) => setTimeout(r, 300));
    return { decoded: window.__decoded - before, deviceVoice: window.__spoken.length - spoken };
  }, [speechUrl, kind, text]);
  return { ctx, page, ranged, sayLine };
}
const audio = await (await fetch(base + "audio.json")).json();
const purse = audio.sprites.find((s) => s.name === "purse.1");
const ids = Object.keys(purse.lines);

// A.
{
  const { ctx, ranged, sayLine } = await open({ serviceWorkers: "block" }, true);
  const [o, l] = purse.lines["p:One dollar and one cent!"];
  let n = ranged.length, r = await sayLine("p", "One dollar and one cent!");
  const mine = ranged.slice(n);
  console.log("A1 purse line, sprite not loaded:", JSON.stringify(r), JSON.stringify(mine));
  if (!(r.decoded === 1 && r.deviceVoice === 0 && mine.length === 1 && mine[0].status === 206 && mine[0].range === `bytes=${o}-${o + l - 1}`)) fail("ranged line");
  n = ranged.length; r = await sayLine("p", "One dollar and one cent!");
  console.log("A2 said again (decoded kept):", JSON.stringify(r), ranged.length - n, "ranged");
  n = ranged.length; r = await sayLine("h", "Zeroic, so heroic!");
  console.log("A3 quip (playHero):", JSON.stringify(r), ranged.length - n, "ranged");
  if (r.deviceVoice) fail("quip fell to the device voice");
  await ctx.setOffline(true);
  r = await sayLine("p", "One dollar!");
  console.log("A4 offline, nothing saved:", JSON.stringify(r));
  if (r.deviceVoice !== 1) fail("offline should use the device voice");
  await ctx.close();
}
// A5: a browser whose ranged fetch fails (as a CORS preflight answered 405 would): the whole
// sprite is fetched instead and the line still plays.
{
  const { ctx, page, sayLine } = await open({ serviceWorkers: "block" }, true);
  const seen = [];
  await page.route("**/_audio/s/*.mp3", (route) => { const h = route.request().headers().range; seen.push(h || "whole"); return h ? route.abort("accessdenied") : route.continue(); });
  const r = await sayLine("p", "One dollar and two cents!");
  const r2 = await sayLine("p", "One dollar and three cents!");
  console.log("A5 ranges refused:", JSON.stringify(r), JSON.stringify(r2), JSON.stringify(seen));
  if (!(r.deviceVoice === 0 && r2.deviceVoice === 0 && seen[0] !== "whole" && seen[1] === "whole" && seen[2] === "whole")) fail("whole-sprite fallback");
  await ctx.close();
}
// B.
{
  const { ctx, page, ranged, sayLine } = await open({}, false);
  await page.evaluate((u) => caches.open("sumgeon-voice").then((c) => c.add(u)), purse.url);
  await ctx.setOffline(true);
  const id = ids[5], n = ranged.length, r = await sayLine("p", id.slice(2));
  console.log("B1 offline, saved sprite:", id, JSON.stringify(r), ranged.length - n, "ranged fetches");
  if (!(r.decoded === 1 && r.deviceVoice === 0)) fail("offline saved line");
  const controlled = await page.evaluate(() => !!navigator.serviceWorker.controller);
  const [off, len] = purse.lines[ids[7]];
  const sw = await page.evaluate(async ([u, off, len]) => {
    const res = await fetch(u, { headers: { Range: `bytes=${off}-${off + len - 1}` } });
    return { status: res.status, range: res.headers.get("content-range"), bytes: (await res.arrayBuffer()).byteLength };
  }, [purse.url, off, len]).catch((e) => ({ error: String(e) }));
  console.log("B2 worker controls:", controlled, "offline ranged fetch:", JSON.stringify(sw));
  if (!(controlled && sw.status === 206 && sw.bytes === len)) fail("worker range");
  await ctx.close();
}
// C.
{
  const ctx = await browser.newContext({ serviceWorkers: "block" });
  const lp = await ctx.newPage(), lr = [];
  // Locally the listen check asks the live audio.json first: give it the local one.
  await lp.route("https://tools.tuley.name/sumgeon/audio.json", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(audio) }));
  lp.on("response", async (res) => { const h = await res.request().headerValue("range").catch(() => null); if (h && /\/s\//.test(res.url())) lr.push({ status: res.status(), range: h }); });
  await lp.goto(base + "review/listen/");
  await lp.waitForSelector(".group");
  await lp.click('.group[data-g="Shop"]');
  await lp.click("#play");
  await lp.waitForTimeout(3000);
  const st = await lp.evaluate(() => ({ text: document.getElementById("text").textContent, count: document.getElementById("count").textContent, status: document.getElementById("status").textContent }));
  console.log("C listen check:", JSON.stringify(st), JSON.stringify(lr.slice(0, 4)));
  if (!(lr.length >= 1 && lr.every((x) => x.status === 206))) fail("listen check range");
  await ctx.close();
}
await browser.close();
console.log(process.exitCode ? "failed" : "all passed");
