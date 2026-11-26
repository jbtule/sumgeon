// Offline play (CLAUDE.md "Offline"): the shell sw.js precaches holds every file the game loads,
// the worker's cache rules, and the order the voice's sprites are saved in.
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import vm from "node:vm";
import { STAMPED, shellFiles, stampWorker, stampCss, stampGame, cssFonts } from "./stamping.mjs";
import { byLevel, saveOrder, offlineLine } from "../js/offline.js";
import { ALWAYS, runSprites } from "../js/lines.js";
import { WINGS } from "../js/wings.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const v = "abc1234";

// The shell: the page, every stamped attribute, every module, the manifest's icons and the fonts,
// all stamped, all real files.
const shell = shellFiles(root, v);
assert.equal(shell[0], "./");
for (const attr of STAMPED) assert.ok(shell.includes(attr.match(/"([^"]+)"/)[1] + "?v=" + v), `${attr} is precached`);
for (const f of shell.slice(1)) {
  assert.ok(f.endsWith("?v=" + v), `${f} is stamped`);
  assert.ok(existsSync(join(root, f.replace(/\?v=.*$/, ""))), `${f} exists`);
}
// What the stamped page loads is exactly what's precached (the import map's modules included).
const page = stampGame(readFileSync(join(root, "index.html"), "utf8"), root, v, v);
const loaded = new Set([...page.matchAll(/(?:href|src)="([^"#:]+\?v=[^"]+)"/g)].map((m) => m[1]));
for (const m of Object.values(JSON.parse(page.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports)) loaded.add(m.replace(/^\.\//, ""));
for (const f of loaded) assert.ok(shell.includes(f), `the page loads ${f}, which is precached`);
// The fonts: self-hosted, stamped, and with their licenses.
const css = readFileSync(join(root, "styles.css"), "utf8");
assert.deepEqual(cssFonts(css).sort(), ["fonts/bungee-latin.woff2", "fonts/nunito-latin.woff2"]);
for (const f of cssFonts(css)) assert.ok(stampCss(css, v).includes(`url("${f}?v=${v}")`));
assert.ok(existsSync(join(root, "fonts/Bungee-OFL.txt")) && existsSync(join(root, "fonts/Nunito-OFL.txt")));
assert.ok(!/fonts\.googleapis/.test(readFileSync(join(root, "index.html"), "utf8")), "the game loads no Google Fonts");

// The worker: as the dev server serves it (dev mode) and stamped for a deploy.
function worker(src) {
  const ctx = { URL, Request: class {}, console };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx;
}
const src = readFileSync(join(root, "sw.js"), "utf8");
const dev = worker(src), live = worker(stampWorker(src, root, v));
assert.equal(dev.DEV, true);
assert.equal(live.DEV, false);
assert.equal(live.VERSION, v);
assert.deepEqual([...live.SHELL], shell);
assert.equal(live.SHELL_CACHE, "sumgeon-shell-" + v);

const scope = "https://tools.tuley.name/sumgeon/";
const r = (w, url, mode = "cors", ranged = false) => w.route(new URL(url, scope), mode, scope, w.DEV, ranged);
// Deployed.
assert.equal(r(live, "./", "navigate"), "page");
assert.equal(r(live, "./?v=def5678", "navigate"), "page", "checkUpdate's ?v= reload is the page, network-first");
assert.equal(r(live, "index.html"), "page");
assert.equal(r(live, "version.json?t=1"), null, "the update check always asks the network");
assert.equal(r(live, "audio.json?v=" + v), "data");
assert.equal(r(live, "js/app.js?v=" + v), "shell");
assert.equal(r(live, "fonts/bungee-latin.woff2?v=" + v), "shell");
assert.equal(r(live, "styles.css"), null, "an unstamped file is left to the browser");
assert.equal(r(live, "review/listen/", "navigate"), null, "the grown-up pages are online only");
assert.equal(r(live, "https://sumgeon.asset-data.stream/s/04adb5185118c8c3b755.mp3"), "voice");
assert.equal(r(live, "https://sumgeon.asset-data.stream/a/04adb5185118c8c3b755.mp3"), null, "single clips are left to the browser");
assert.equal(r(live, "https://sumgeon.asset-data.stream/index.json"), null);
assert.equal(r(live, "https://tools.tuley.name/soundbox/app.js?v=1"), null, "other apps on the site are left alone");
assert.equal(r(live, "https://fonts.gstatic.com/x.woff2"), null);
assert.equal(r(live, "js/app.js?v=" + v, "cors", true), null, "byte ranges are left to the browser");
// Dev: everything of the site network-first, the sprites still cache-first, single clips and the update check left alone.
const local = "http://localhost:8791/";
const d = (url, mode = "cors") => dev.route(new URL(url, local), mode, local, true, false);
assert.equal(d("./", "navigate"), "page");
assert.equal(d("js/app.js?v=devabc"), "dev");
assert.equal(d("styles.css"), "dev");
assert.equal(d("review/listen/", "navigate"), "dev");
assert.equal(d("audio.json?v=devabc"), "data");
assert.equal(d("_audio/s/04adb5185118c8c3b755.mp3"), "voice");
assert.equal(d("_audio/a/04adb5185118c8c3b755.mp3"), null);
assert.equal(d("version.json"), null);
assert.equal(dev.plain(local + "js/app.js?v=devabc"), local + "js/app.js", "dev keeps one copy of a file, whatever its stamp");

// The save order: ALWAYS, then this stratum's (monsters, then problems lowest level first), then
// the other open strata's, then everything else; every sprite once.
assert.deepEqual(byLevel(["q-kinder-3-add", "m-plusquito", "q-kinder-1-sub", "q-kinder-1-add", "q-kinder-12-add"]),
  ["m-plusquito", "q-kinder-1-sub", "q-kinder-1-add", "q-kinder-3-add", "q-kinder-12-add"]);
const [cellar, hall] = WINGS;
const sprites = [];
const fams = [...new Set(ALWAYS.concat(...WINGS.map((w) => runSprites(w))))];
fams.slice().reverse().forEach((f, i) => { sprites.push({ name: f, url: `/s/${i}a.mp3` }); if (i % 7 === 0) sprites.push({ name: f + ".2", url: `/s/${i}b.mp3` }); });
sprites.push({ name: "purse", url: "/s/purse.mp3" });
const fam = (u) => sprites.find((s) => s.url === u).name.replace(/\.\d+$/, "");
const plan = ALWAYS.concat(byLevel(runSprites(cellar)), byLevel(runSprites(hall)));
const order = saveOrder(plan, sprites);
assert.equal(order.length, sprites.length, "every sprite is saved");
assert.equal(new Set(order).size, order.length, "each once");
assert.deepEqual([...new Set(order.slice(0, 40).map(fam))].slice(0, ALWAYS.length), ALWAYS, "the always-needed sprites first");
const firstAt = (f) => order.findIndex((u) => fam(u) === f);
const cellarFams = byLevel(runSprites(cellar)).filter((f) => !ALWAYS.includes(f));
for (let i = 1; i < cellarFams.length; i++) assert.ok(firstAt(cellarFams[i - 1]) < firstAt(cellarFams[i]), "the stratum lowest level first");
const hallOnly = runSprites(hall).filter((f) => !cellarFams.includes(f));
assert.ok(Math.max(...cellarFams.map(firstAt)) < Math.min(...hallOnly.map(firstAt)), "then the next open stratum");
assert.equal(order[order.length - 1], sprites.filter((s) => !plan.includes(s.name.replace(/\.\d+$/, ""))).pop().url, "the rest last");
// A family's parts stay together.
const parted = sprites.find((s) => s.name.endsWith(".2"));
assert.equal(order.indexOf(parted.url), order.indexOf(sprites.find((s) => s.name === parted.name.replace(".2", "")).url) + 1);

// Settings → Game's line.
assert.equal(offlineLine({ supported: true, ready: true, total: 146, saved: 146, bytes: 96.7e6, totalBytes: 96.7e6 }), "Offline: ready (all 146 voice files, 97 MB)");
assert.equal(offlineLine({ supported: true, ready: true, total: 146, saved: 12, bytes: 8e6, totalBytes: 96.7e6, saving: true }), "Offline: saving the voice, 12 of 146 files (8 MB of 97 MB)…");
assert.match(offlineLine({ supported: true, ready: true, total: 146, saved: 12, totalBytes: 1, online: false }), /when back online/);
assert.equal(offlineLine({ supported: false }), "Offline: not available on this device");
assert.match(offlineLine({ supported: true, ready: false }), /getting the game ready/);
console.log(`✓ offline: ${shell.length} shell files precached, cache rules, save order of ${order.length} sprites`);
