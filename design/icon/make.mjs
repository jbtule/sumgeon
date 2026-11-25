// Draws the app icon as flat SVG layers for Apple's Icon Composer, which adds the glass,
// highlights, shadows and corner mask itself:  node design/icon/make.mjs
// Plusquito, the first monster you meet, in front of the Counting Cellar's brick wall, lit by
// torchlight. Writes, back to front: 1-wall.svg, 2-plusquito.svg, plus icon-all-layers.svg (both,
// for previewing) and the site's favicon.svg. Colors and art are the game's (styles.css, monsters.js).
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MON, defs } from "../../js/monsters.js";

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, "..", "..");
const W = 1024;
// The game's art repeats an attribute now and then (fine in HTML, not in an SVG file): keep the last.
const tidy = (s) => s.replace(/<[a-zA-Z][^>]*>/g, (tag) => {
  const seen = new Map();
  for (const [, k, v] of tag.matchAll(/\s([\w:-]+)="([^"]*)"/g)) { seen.delete(k); seen.set(k, v); }
  const name = tag.match(/^<([\w:-]+)/)[1], end = tag.endsWith("/>") ? "/>" : ">";
  return `<${name}${[...seen].map(([k, v]) => ` ${k}="${v}"`).join("")}${end}`;
});
const svg = (body, w = W) => tidy(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${w}" width="${w}" height="${w}">\n${body}\n</svg>`) + "\n";

// The Cellar's wall (styles.css --wall-cellar): brick #3a2620, mortar #21140f, a light top edge on
// each brick. Full bleed (Icon Composer masks it), with a warm glow behind the monster.
function wall(w, rows) {
  const h = w / rows, bw = h * 2, m = h * 0.08;
  let s = `<rect width="${w}" height="${w}" fill="#21140f"/>`;
  for (let r = 0; r < rows; r++) for (let x = r % 2 ? -bw / 2 : 0; x < w; x += bw) {
    s += `<rect x="${x + m / 2}" y="${r * h + m / 2}" width="${bw - m}" height="${h - m}" fill="#3a2620"/>`;
    s += `<rect x="${x + m * 2}" y="${r * h + m * 1.6}" width="${bw * 0.45}" height="${m * 1.2}" fill="#ffffff" opacity=".06"/>`;
  }
  s += `<defs><radialGradient id="glow" cx=".5" cy=".55" r=".55"><stop offset="0" stop-color="#ffc93c" stop-opacity=".42"/><stop offset=".6" stop-color="#ff5a4e" stop-opacity=".12"/><stop offset="1" stop-color="#120c0a" stop-opacity=".55"/></radialGradient></defs>`;
  return s + `<rect width="${w}" height="${w}" fill="url(#glow)"/>`;
}
// Plusquito (monsters.js), drawn in a 200 × 200 box; scaled to fill most of the icon.
const P = MON.find((m) => m.n === "Plusquito");
const monster = (w, size) => `${defs}<g transform="translate(${(w - size) / 2} ${(w - size) / 2 + size * 0.02}) scale(${size / 200})">${P.d(P.c)}</g>`;

const layers = { "1-wall.svg": wall(W, 7), "2-plusquito.svg": monster(W, 820) };
for (const [f, body] of Object.entries(layers)) writeFileSync(join(here, f), svg(body));
writeFileSync(join(here, "icon-all-layers.svg"), svg(Object.values(layers).join("\n")));
// The browser tab's icon: the same, rounded, with fewer bricks so it reads at 16 px.
writeFileSync(join(root, "favicon.svg"), svg(`<clipPath id="r"><rect width="64" height="64" rx="14"/></clipPath><g clip-path="url(#r)">${wall(64, 4)}${monster(64, 60)}</g>`, 64));
console.log("wrote 1-wall.svg, 2-plusquito.svg, icon-all-layers.svg, favicon.svg");
