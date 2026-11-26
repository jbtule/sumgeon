// Offline play in a real browser (Chromium, muted), run by hand: it needs Playwright, and the
// local recording (_audio/ and an audio.json pointing at it), so it isn't part of the check.
//   node scripts/offline-browser.mjs [dev|site] [port]
// dev: the dev server (sw.js in dev mode). site: scripts/stamp.mjs builds _site/, served as
// deployed (sw.js precaching this version's shell), with _audio/ beside it.
// It loads the game, taps, waits for the whole voice to be saved, goes offline, reloads, and
// checks the start screen, a fight, and that lines are decoded from saved sprites. Speech is
// stubbed (only speechSynthesis), so nothing is heard.
import { createRequire } from "node:module";
import { spawn, execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync, readFileSync } from "node:fs";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

// Playwright through NODE_PATH, as design/social/make.mjs loads it.
const { chromium } = createRequire(import.meta.url)("playwright");
const root = fileURLToPath(new URL("..", import.meta.url));
const mode = process.argv[2] || "dev", port = Number(process.argv[3]) || 8967;
const base = `http://localhost:${port}/`;
if (!existsSync(join(root, "audio.json"))) { console.error("needs audio.json and _audio/ (a local recording)"); process.exit(1); }

let server, child;
if (mode === "site") {
  execFileSync(process.execPath, [join(root, "scripts/stamp.mjs"), execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim()], { stdio: "inherit" });
  const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".webmanifest": "application/manifest+json" };
  server = createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, base).pathname);
    if (p.endsWith("/")) p += "index.html";
    const f = normalize(join(p.startsWith("/_audio/") ? root : join(root, "_site"), p));
    if (!existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "Content-Type": TYPES[extname(f)] || "application/octet-stream", "Cache-Control": "max-age=600" });
    createReadStream(f).pipe(res);
  }).listen(port);
} else {
  child = spawn(process.execPath, [join(root, "scripts/dev-server.mjs"), String(port)], { stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 600));
}

const sprites = JSON.parse(readFileSync(join(root, "audio.json"), "utf8")).sprites.length;
const browser = await chromium.launch({ args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"] });
const context = await browser.newContext({ viewport: { width: 390, height: 760 }, hasTouch: false });
await context.addInitScript(() => {
  // Speech stubbed; lines decoded from sprites counted (the sound effects are synthesized, so
  // every decode is a voice line).
  const fake = { speak(u) { setTimeout(() => u.onend && u.onend(), 50); }, cancel() {}, getVoices: () => [], speaking: false, addEventListener() {} };
  Object.defineProperty(window, "speechSynthesis", { value: fake });
  window.__decoded = 0;
  const dec = BaseAudioContext.prototype.decodeAudioData;
  BaseAudioContext.prototype.decodeAudioData = function (...a) { window.__decoded++; return dec.apply(this, a); };
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const ok = (cond, what) => { if (!cond) { console.error("✗ " + what); process.exitCode = 1; } else console.log("✓ " + what); };

await page.goto(base);
await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 15000 });
ok(true, "the service worker controls the page");
// A grade, a hero (the first tap starts the voice and its saving).
await page.click(".gpick[data-g='0']");
await page.waitForSelector(".hpick:not([disabled])");
await page.click(".hpick:not([disabled])");
const t0 = Date.now();
const count = () => page.evaluate(async () => (await (await caches.open("sumgeon-voice")).keys()).length);
let n = 0;
while ((n = await count()) < sprites && Date.now() - t0 < 180e3) await page.waitForTimeout(1000);
ok(n === sprites, `the whole voice saved: ${n} of ${sprites} sprites in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
const est = await page.evaluate(async () => (await navigator.storage.estimate()).usage);
console.log(`  storage used: ${(est / 1e6).toFixed(1)} MB`);
// Settings → Game shows it.
await page.click("#openSettings"); await page.click("#tab-game"); await page.waitForTimeout(900);
const line = await page.textContent("#soundState");
ok(/Offline: ready \(all \d+ voice files, \d+ MB\)/.test(line), "Settings → Game: " + line.split("\n").find((l) => l.startsWith("Offline")));
await page.click("#done");

await context.setOffline(true);
await page.reload();
await page.waitForSelector("#go", { timeout: 10000 });
ok(await page.isVisible(".logo"), "offline: the start screen loads");
const font = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check("16px Bungee") && [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family).join(","); });
ok(/Bungee/.test(font || "") && /Nunito/.test(font || ""), "offline: the fonts load (" + font + ")");
const before = await page.evaluate(() => window.__decoded);
await page.click("#go");
await page.waitForTimeout(400); await page.mouse.click(200, 300); // skips the descent
await page.waitForFunction(() => { const p = document.getElementById("prob"); return p && /\S/.test(p.textContent) && !document.body.classList.contains("on-scene"); }, null, { timeout: 15000 });
await page.waitForTimeout(2500);
ok(true, "offline: a fight starts: " + (await page.textContent("#prob")).trim());
await page.keyboard.press("5"); await page.keyboard.press("Enter");
await page.waitForTimeout(3000);
const decoded = await page.evaluate(() => window.__decoded) - before;
ok(decoded > 0, `offline: ${decoded} voice lines decoded from saved sprites`);
ok(!errors.length, "no page errors" + (errors.length ? ": " + errors.join("; ") : ""));

await browser.close();
if (server) server.close();
if (child) child.kill();
