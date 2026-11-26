// The Crystal Mines' wall (--wall-mines in styles.css), drawn as one tiling SVG tile.
//   node design/walls/mines.mjs          writes it into styles.css (the toned-down wall, shipped)
//   node design/walls/mines.mjs full     the full-strength version, to compare
//   node design/walls/mines.mjs soft x.svg   also saves the tile as an SVG
// A shape that crosses an edge is drawn again a tile over (its box says where), so it tiles
// without seams.
import { readFileSync, writeFileSync } from "node:fs";
const W = 224, H = 208, KX = W / 192, KY = H / 192;
const out = [];
const r1 = (n) => Math.round(n * 10) / 10;
const wrap = (svg, [x0, y0, x1, y1]) => {
  const xs = [0, x0 < 0 ? W : null, x1 > W ? -W : null].filter((v) => v !== null);
  const ys = [0, y0 < 0 ? H : null, y1 > H ? -H : null].filter((v) => v !== null);
  for (const dx of xs) for (const dy of ys) out.push(dx || dy ? `<g transform='translate(${dx} ${dy})'>${svg}</g>` : svg);
};
const boxOf = (pts, pad = 2) => [Math.min(...pts.map((p) => p[0])) - pad, Math.min(...pts.map((p) => p[1])) - pad, Math.max(...pts.map((p) => p[0])) + pad, Math.max(...pts.map((p) => p[1])) + pad];
const poly = (pts, fill) => wrap(`<path d='M${pts.map((p) => p.join(" ")).join("L")}Z' fill='${fill}'/>`, boxOf(pts));
const line = (pts, stroke, w) => wrap(`<path d='M${pts.map((p) => p.join(" ")).join("L")}' stroke='${stroke}' stroke-width='${w}' fill='none' stroke-linecap='round' stroke-linejoin='round'/>`, boxOf(pts));

// Chromostereopsis: on a dark ground, saturated red seems nearer than blue. The rock is deep blue
// and indigo, so it recedes; the crystals are crimson, magenta and warm violet, so they seem to
// jut out. The shipped wall tones both down (calm behind a fight); "full" is the strong version.
// Crimson and magenta, not orange-red, so the crystals never look like the coral buttons.
const FULL = process.argv[2] === "full";
const [ROCK, HI, LO, CRACK] = FULL ? ["#171b48", "#1c2156", "#13173d", "#0a0c27"] : ["#1b1e3c", "#202447", "#171a34", "#0d0f24"];
const MID = FULL ? "#1a1e50" : "#1e2140", EDGE = "#ffffff0c";
out.push(`<rect width='${W}' height='${H}' fill='${ROCK}'/>`);
// The rock face: chiseled slabs, a shade lighter or darker, each with a lit top edge.
const SLABS = [
  [[[14, 18], [70, 12], [84, 46], [52, 70], [18, 58]], HI],
  [[[96, 22], [150, 16], [170, 52], [128, 74], [90, 56]], LO],
  [[[150, 90], [196, 84], [206, 128], [176, 150], [140, 128]], HI],
  [[[20, 96], [64, 88], [80, 128], [44, 152], [12, 136]], LO],
  [[[86, 140], [132, 134], [150, 176], [110, 202], [78, 180]], HI],
  [[[60, 78], [92, 70], [118, 94], [100, 120], [70, 112]], MID],
];
SLABS.forEach(([p0, c]) => { const pts = p0.map(([x, y]) => [Math.round(x * KX), Math.round(y * KY)]); poly(pts, c); line([pts[pts.length - 1], pts[0], pts[1]], EDGE, 1.5); });
// Cracks, the seams between the slabs.
[
  [[84, 46], [92, 70]], [[128, 74], [140, 96], [150, 90]], [[44, 152], [60, 170], [78, 180]], [[18, 58], [14, 82], [20, 96]],
  [[170, 52], [188, 60], [196, 84]], [[110, 202], [112, 214]], [[64, 88], [60, 78]], [[118, 94], [140, 104]],
].forEach((p) => line(p.map(([x, y]) => [Math.round(x * KX), Math.round(y * KY)]), CRACK, 1.4));
// Pits.
[[26, 22, 1.6], [120, 46, 1.2], [168, 112, 1.5], [52, 120, 1.3], [104, 168, 1.6], [8, 176, 1.4]].map(([x, y, r]) => [Math.round(x * KX), Math.round(y * KY), r]).forEach(([x, y, r]) => wrap(`<circle cx='${x}' cy='${y}' r='${r}' fill='${CRACK}'/>`, [x - r, y - r, x + r, y + r]));

// A crystal: a prism with a lit face, a shadow face and a glassy edge.
const prism = (dx, ang, w, h, [lit, dark]) => `<g transform='rotate(${ang}) translate(${dx} 0)'><path d='M${-w} 0V${-h}L0 ${r1(-h - w * 1.2)}V0Z' fill='${lit}'/><path d='M0 0V${r1(-h - w * 1.2)}L${w} ${-h}V0Z' fill='${dark}'/><path d='M${-w} ${-h}L0 ${r1(-h - w * 1.2)}' stroke='#ffffff30' stroke-width='.8'/></g>`;
// A cluster juts out of a dark socket in the rock, leaning `tilt` degrees, with a soft glow
// around it and its shadow cast down-right on the rock, so it seems to stand off the wall.
const GLOW = FULL ? "#d81e7a" : "#a03a78", GLOW_A = FULL ? 0.22 : 0.12;
out.splice(1, 0, `<defs><radialGradient id='g'><stop offset='0' stop-color='${GLOW}' stop-opacity='${GLOW_A}'/><stop offset='1' stop-color='${GLOW}' stop-opacity='0'/></radialGradient></defs>`);
const cluster = (x, y, tilt, s, parts, glow) => {
  const R = Math.max(...parts.map((p) => p[3] + p[2] * 1.2)) * s + 6;
  const body = parts.map((p) => prism(...p)).join("");
  const shadow = parts.map((p) => prism(p[0], p[1], p[2], p[3], [CRACK, CRACK])).join("").replace(/<path d='M[^']*' stroke[^>]*>/g, "");
  const sock = `<path d='M-10 1Q0 7 10 1Q0 -2 -10 1Z' fill='${CRACK}'/>`;
  const halo = glow ? `<circle cx='0' cy='-14' r='26' fill='url(#g)'/>` : "";
  wrap(`<g transform='translate(${x} ${y}) rotate(${tilt}) scale(${s})'>${halo}<g transform='translate(3 2)' opacity='.7'>${shadow}</g>${body}${sock}</g>`, [x - Math.max(R, glow ? 40 * s : 0), y - Math.max(R, glow ? 40 * s : 0), x + Math.max(R, glow ? 40 * s : 0), y + Math.max(R, glow ? 40 * s : 0)]);
};
const [V, R1, M, R2] = FULL
  ? [["#9a34c4", "#66208a"], ["#d81e5b", "#96123e"], ["#c8288a", "#8a1662"], ["#e2306a", "#a01848"]]
  : [["#74409a", "#4f2a6c"], ["#a63a62", "#732643"], ["#9a3c7a", "#6a2854"], ["#ae4068", "#782a48"]];
// A big crimson cluster with violet at its feet, a magenta one, one jutting sideways out of a
// crack, and a lone shard.
cluster(158, 150, 4, 1.3, [[-7, -32, 4, 11, V], [8, 28, 3.5, 9, M], [0, -4, 5.5, 22, R1]], true);
cluster(48, 66, -12, 1.15, [[-4, -26, 3.5, 9, V], [4, 12, 4, 15, M]], true);
cluster(206, 52, 62, 1, [[-3, -10, 3.5, 12, R2], [4, 18, 3, 8, M]], false);
cluster(84, 190, 14, 0.9, [[0, 6, 3.5, 10, R2]], false);
// Glints.
const star = (x, y, s, c) => wrap(`<path d='M${x} ${r1(y - s)}L${r1(x + s * 0.25)} ${r1(y - s * 0.25)}L${r1(x + s)} ${y}L${r1(x + s * 0.25)} ${r1(y + s * 0.25)}L${x} ${r1(y + s)}L${r1(x - s * 0.25)} ${r1(y + s * 0.25)}L${r1(x - s)} ${y}L${r1(x - s * 0.25)} ${r1(y - s * 0.25)}Z' fill='${c}'/>`, [x - s, y - s, x + s, y + s]);
star(153, 111, 3.6, "#ffffff3a");
star(50, 44, 2.6, "#ffd6e830");
[[22, 34], [170, 70], [70, 170], [214, 150], [120, 30], [110, 110]].forEach(([x, y]) => wrap(`<circle cx='${x}' cy='${y}' r='.9' fill='#c9c8ff2a'/>`, [x - 1, y - 1, x + 1, y + 1]));

const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}'>${out.join("")}</svg>`;
if (process.argv[3]) writeFileSync(process.argv[3], svg + "\n");
const url = `url("data:image/svg+xml,${svg.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const css = new URL("../../styles.css", import.meta.url);
const was = readFileSync(css, "utf8"), now = was.replace(/--wall-mines:url\("[^"]*"\)/, () => `--wall-mines:${url}`);
if (now === was) console.log("styles.css already has this wall"); else { writeFileSync(css, now); console.log("wrote --wall-mines into styles.css"); }
