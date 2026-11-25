// Draws the social card (social.png at the repo root, 1200 × 630), the picture a link to the game
// shows in Messages, Slack and the like: the Counting Cellar's wall, the title and a few of the
// game's monsters, all from the game's own art and colors (monsters.js, styles.css).
// Run: node design/social/make.mjs   (needs Playwright and the network, for the Google Fonts)
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { MON, defs } from "../../js/monsters.js";

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, "..", "..");
const W = 1200, H = 630;
const mon = (name, x, y, size, flip) => {
  const m = MON.find((t) => t.n === name);
  return `<g transform="translate(${x} ${y}) scale(${(flip ? -1 : 1) * size / 200} ${size / 200})${flip ? " translate(-200 0)" : ""}">${m.d(m.c)}</g>`;
};
// Stands a monster of this size on the floor line (the art's feet are at y 188 of 200).
const floor = (size) => 520 - 188 * size / 200;
// The Cellar's wall (styles.css --wall-cellar), as on the Home Screen icon (design/icon/make.mjs).
let bricks = "";
const h = 70, bw = 140, gap = 6;
for (let r = 0; r * h < H; r++) for (let x = r % 2 ? -bw / 2 : 0; x < W; x += bw)
  bricks += `<rect x="${x + gap / 2}" y="${r * h + gap / 2}" width="${bw - gap}" height="${h - gap}" fill="#3a2620"/><rect x="${x + 12}" y="${r * h + 10}" width="${bw * 0.45}" height="7" fill="#fff" opacity=".06"/>`;
const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Bungee&family=Nunito:wght@800;900&display=swap" rel="stylesheet">
<style>
  body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:#21140f}
  svg.bg{position:absolute;inset:0}
  .text{position:absolute;left:70px;top:150px;width:560px;color:#f3efe4}
  h1{font:400 112px/1 Bungee,sans-serif;margin:0;color:#ffc93c;text-shadow:0 6px 0 #0c171c}
  h1 b{color:#ff5a4e;font-weight:400}
  p{font:900 36px/1.25 Nunito,sans-serif;margin:26px 0 0;text-shadow:0 3px 0 #0c171c}
  .sub{font-weight:800;font-size:27px;color:#e6c9a8;margin-top:14px}
</style></head><body>
<svg class="bg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#21140f"/>${bricks}
  <defs><radialGradient id="glow" cx=".72" cy=".55" r=".6"><stop offset="0" stop-color="#ffc93c" stop-opacity=".38"/><stop offset=".55" stop-color="#ff5a4e" stop-opacity=".1"/><stop offset="1" stop-color="#120c0a" stop-opacity=".7"/></radialGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${defs}
  ${mon("Minustaur", 600, floor(210), 210)}
  ${mon("Timesaur", 975, floor(210), 210)}
  ${mon("Plusquito", 765, floor(290), 290)}
</svg>
<div class="text"><h1>Sum<b>geon</b></h1>
<p>Your answer is your attack.</p>
<p class="sub">A math dungeon crawler for kids</p></div>
</body></html>`;
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: join(root, "social.png") });
await browser.close();
console.log("wrote social.png");
