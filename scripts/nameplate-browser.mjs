// The monster's nameplate on phones, in a real browser (Chromium, muted), run by hand: it needs
// Playwright, so it isn't part of the check.
//   node scripts/nameplate-browser.mjs [port] [--all] [--shots <dir>]
// For every stratum's boss in each form (the boss, powering up 1 and 2, the mega boss, the Legend)
// on an iPhone SE and an iPhone 14, it starts a fight and measures the nameplate: the name, trait
// badge, HP bar and HP must share one line (each one's middle inside the others' band), the row
// mustn't overflow, and the HP bar keeps at least 30 px. --all checks every other monster too (a
// floor's monster, ?monster=). --shots saves a picture of each boss form's nameplate. Speech and
// audio are stubbed, so nothing is heard.
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { WINGS } from "../js/wings.js";
import { MON } from "../js/monsters.js";

// Playwright through NODE_PATH, as design/social/make.mjs loads it.
const { chromium } = createRequire(import.meta.url)("playwright");
const root = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2), port = Number(args.find((a) => /^\d+$/.test(a))) || 8968, all = args.includes("--all");
const shots = args.includes("--shots") ? args[args.indexOf("--shots") + 1] : null;
if (shots) mkdirSync(shots, { recursive: true });
const child = spawn(process.execPath, [join(root, "scripts/dev-server.mjs"), String(port)], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 700));

const SIZES = { se: { width: 375, height: 667 }, i14: { width: 390, height: 844 } };
const GRADE = { cellar: 0, hall: 1, mines: 2, tower: 3 };
const FORMS = [["boss", "depth=1"], ["power 1", "depth=3"], ["power 2", "depth=4"], ["mega", "depth=5"], ["legend", "depth=1&legend"]];
function seed(o) {
  const P = "sumgeon:@default:", set = (k, v) => localStorage.setItem(P + k, JSON.stringify(v));
  localStorage.clear();
  localStorage.setItem("sumgeon:storage", "2");
  set("dungeon", 6);
  set("settings", { band: o.band, start: o.band, grade: o.grade, sfx: true, voice: true });
  set("heroes", { captain: 2, color: "#ffc93c", rescued: [2, 5, 7] });
  set("wings", { [o.id]: { boss: 3, best: 6, depth: 5 } });
  set("told", { hit: 1, pause: 3, chest: 3, spell: 3, deeper: 3 });
  set("moments", { captains: [2] });
}
const browser = await chromium.launch({ args: ["--mute-audio"] });
const bad = [];
let checked = 0;
async function check(size, w, query, label, pic) {
  const ctx = await browser.newContext({ viewport: SIZES[size], deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: "block", reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    const noop = () => {};
    try { Object.defineProperty(window, "speechSynthesis", { value: { speak: noop, cancel: noop, pause: noop, resume: noop, getVoices: () => [], speaking: false, pending: false, addEventListener: noop, onvoiceschanged: null } }); } catch (e) { /* fine */ }
    HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
    window.AudioContext = window.webkitAudioContext = undefined;
  });
  await p.goto(`http://localhost:${port}/`);
  await p.evaluate(seed, { id: w.id, band: w.band, grade: GRADE[w.id] });
  await p.goto(`http://localhost:${port}/?${query}`);
  await p.waitForTimeout(600);
  await p.click("#go");
  await p.waitForTimeout(1800);
  const r = await p.evaluate(() => {
    const box = (id) => { const e = document.getElementById(id); if (!e || e.hidden || !e.offsetWidth) return null; const b = e.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, mid: (b.top + b.bottom) / 2, w: b.width }; };
    const row = document.querySelector(".mhead"), parts = { name: box("mName"), trait: box("trait"), bar: box("hpBar")?.w != null ? (() => { const b = document.querySelector(".hp").getBoundingClientRect(); return { top: b.top, bottom: b.bottom, mid: (b.top + b.bottom) / 2, w: b.width }; })() : null, hp: box("hpTxt") };
    return { name: document.getElementById("mName").textContent, parts, overflow: row.scrollWidth - row.clientWidth };
  });
  const ps = Object.entries(r.parts).filter(([, b]) => b);
  const oneLine = ps.every(([, a]) => ps.every(([, b]) => a.mid >= b.top - 1 && a.mid <= b.bottom + 1));
  const ok = oneLine && r.overflow <= 1 && r.parts.bar.w >= 30;
  checked++;
  if (!ok) bad.push(`${size} ${label} (${r.name}): ${!oneLine ? "not on one line " : ""}${r.overflow > 1 ? `overflows ${r.overflow}px ` : ""}${r.parts.bar.w < 30 ? `HP bar ${Math.round(r.parts.bar.w)}px` : ""}`);
  if (pic && shots) { const b = await p.evaluate(() => { const r = document.querySelector(".mhead").getBoundingClientRect(); return { x: 0, y: Math.max(0, r.top - 6), width: innerWidth, height: r.height + 12 }; }); await p.screenshot({ path: join(shots, `nameplate-${size}-${w.id}-${label.replace(/\W+/g, "-")}.png`), clip: b }); }
  await ctx.close();
}
for (const size of Object.keys(SIZES)) for (const w of WINGS) for (const [label, q] of FORMS) await check(size, w, q + "&floor=6", label, true);
if (all) {
  const bosses = new Set(WINGS.map((w) => w.boss));
  for (const size of Object.keys(SIZES)) for (const m of MON.filter((x) => !bosses.has(x.n))) {
    const w = WINGS.find((x) => x.pool.includes(m.n)) || WINGS[0];
    await check(size, w, "monster=" + encodeURIComponent(m.n) + "&floor=1", m.n, false);
  }
}
await browser.close();
child.kill();
console.log(bad.length ? "✗ nameplates:\n  " + bad.join("\n  ") : `✓ nameplates: ${checked} on one line`);
process.exit(bad.length ? 1 : 0);
