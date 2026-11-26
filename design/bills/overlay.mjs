// Draws a bill portrait's strokes (DRAWN in js/dollars.js) over its engraving, with a grid in the
// portrait's units, for redrawing them by hand (see README.md):
//   NODE_PATH=<playwright> node design/bills/overlay.mjs <image> <x,y,height> <10|20> <out.png>
// x, y and height are the part of the image (in its pixels) that maps to the portrait box's
// y 23..197, the part the bill's oval shows; the grid lines are every 10 units.
import fs from "node:fs";
import { createRequire } from "node:module";
import { DRAWN } from "../../js/dollars.js";

const require = createRequire(process.env.NODE_PATH ? process.env.NODE_PATH + "/" : import.meta.url);
const { chromium } = require("playwright");
const [image, crop, bill, out] = process.argv.slice(2);
const [x0, y0, hh] = crop.split(",").map(Number), s = 174 / hh;
const d = DRAWN[bill];
let grid = "";
for (let v = 20; v <= 180; v += 10) {
  const c = v % 50 ? "#f0f" : "#f00";
  grid += `<line x1="${v}" y1="20" x2="${v}" y2="200" stroke="${c}" stroke-width=".25"/><line x1="20" y1="${v}" x2="180" y2="${v}" stroke="${c}" stroke-width=".25"/>`;
  grid += `<text x="${v}" y="22" font-size="3" fill="red">${v}</text><text x="20.5" y="${v}" font-size="3" fill="red">${v}</text>`;
}
const b64 = fs.readFileSync(image).toString("base64");
const html = `<body style="margin:0"><svg width="1000" height="1125" viewBox="20 20 160 180">
<image href="data:image/jpeg;base64,${b64}" x="${23 - x0 * s}" y="${23 - y0 * s}" width="${960 * s}" opacity=".55"/>${grid}
<g fill="none" stroke="#0a0" stroke-linecap="round" stroke-linejoin="round"><path d="${d.line}" stroke-width="2"/><path d="${d.fine}" stroke-width="1.3"/></g>
<ellipse cx="100" cy="110" rx="${(15 / 17) * 87}" ry="87" fill="none" stroke="#00f" stroke-width=".5"/></svg></body>`;
const browser = await chromium.launch({ args: ["--mute-audio"] });
const page = await browser.newPage({ viewport: { width: 1000, height: 1125 } });
await page.setContent(html);
await page.screenshot({ path: out });
await browser.close();
