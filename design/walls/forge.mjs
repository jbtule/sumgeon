// The Fraction Forge's wall (DESIGN.md §4.4): dark iron plates in staggered rows, rivets at their
// corners, and thin amber seams between them that glow faintly, toned down to stay calm behind a
// fight. Amber, never coral-red, so a seam never reads as a button.
// node design/walls/forge.mjs [full] [out.svg]: writes --wall-forge into styles.css ("full" draws
// the seams brighter, to compare).
import { readFileSync, writeFileSync } from "node:fs";

const FULL = process.argv[2] === "full";
const W = 120, H = 80, ROW = 40, PLATE = 60;
const IRON = "#24201e", IRON2 = "#2b2623", EDGE = "#171412", SEAM = FULL ? "#ffa53a" : "#d9822b", SEAM_A = FULL ? 0.55 : 0.28;
const out = [`<rect width='${W}' height='${H}' fill='${EDGE}'/>`];
// One plate: x, y, w, h, a slightly lighter top edge, a darker bottom edge, rivets in its corners.
const plate = (x, y, w, h, fill) => {
  out.push(`<rect x='${x + 1.5}' y='${y + 1.5}' width='${w - 3}' height='${h - 3}' rx='2' fill='${fill}'/>`);
  out.push(`<rect x='${x + 1.5}' y='${y + 1.5}' width='${w - 3}' height='2' fill='#ffffff' opacity='.05'/>`);
  out.push(`<rect x='${x + 1.5}' y='${y + h - 3.5}' width='${w - 3}' height='2' fill='#000' opacity='.18'/>`);
  for (const [rx, ry] of [[x + 6, y + 6], [x + w - 6, y + 6], [x + 6, y + h - 6], [x + w - 6, y + h - 6]]) {
    out.push(`<circle cx='${rx}' cy='${ry}' r='1.8' fill='#3a3431'/><circle cx='${rx - 0.5}' cy='${ry - 0.5}' r='.7' fill='#5a524d'/>`);
  }
};
// Two rows, the second offset by half a plate (wrapping round the tile's edges).
plate(0, 0, PLATE, ROW, IRON); plate(PLATE, 0, PLATE, ROW, IRON2);
plate(-PLATE / 2, ROW, PLATE, ROW, IRON2); plate(PLATE / 2, ROW, PLATE, ROW, IRON); plate(PLATE * 1.5, ROW, PLATE, ROW, IRON2);
// The seams' faint ember glow: thin amber lines along the joins.
const seam = (d) => out.push(`<path d='${d}' stroke='${SEAM}' stroke-width='1' opacity='${SEAM_A}'/>`);
seam(`M0 ${ROW}H${W}M0 0.5H${W}`); seam(`M${PLATE} 0V${ROW}`); seam(`M${PLATE / 2} ${ROW}V${H}M${PLATE * 1.5} ${ROW}V${H}`);
// A warmer glow where a seam is brightest, here and there.
out.push(`<circle cx='${PLATE}' cy='${ROW}' r='5' fill='${SEAM}' opacity='${SEAM_A * 0.35}'/>`);

const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}'>${out.join("")}</svg>`;
if (process.argv[3]) writeFileSync(process.argv[3], svg + "\n");
const url = `url("data:image/svg+xml,${svg.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const css = new URL("../../styles.css", import.meta.url);
const was = readFileSync(css, "utf8"), now = was.replace(/--wall-forge:url\("[^"]*"\)/, () => `--wall-forge:${url}`);
if (now === was) console.log("styles.css already has this wall"); else { writeFileSync(css, now); console.log("wrote --wall-forge into styles.css"); }
