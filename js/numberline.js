// Fractions on a number line, for Halfling (3rd grade, 3.NF.A.2: a fraction as a point on the
// number line, 0 to 1 split into b equal parts). A prototype for the review page
// (review/proto/); nothing in the game reads it yet. No DOM: runs in Node.
//
// Answers are whole numbers typed, as in the Tower's other fractions (1/2 = □/4):
// - where: a dot on a tick, "□/4": the denominator shown, type the numerator.
// - parts: how many equal parts from 0 to 1: type the denominator (3.NF.A.2a).
// - past 1: the line runs 0 to 2, with fractions past 1 (5/4) and whole numbers as fractions
//   (4/4 at the 1).
import { fractionWords } from "./third.js";
import { spoken } from "./problems.js";

const DK = "#0c171c", GOLD = "#ffc93c", INK = "#f3efe4", MUTED = "#a9bec1", CORAL = "#ff5a4e";
const f1 = (n) => Math.round(n * 100) / 100;

export const LINE_LEVELS = [
  { id: "where", name: "Where's the dot? 0 to 1", grade: "3rd" },
  { id: "parts", name: "How many equal parts?", grade: "3rd" },
  { id: "past1", name: "Where's the dot? 0 to 2", grade: "3rd" }
];
export const DENOMS = [2, 3, 4, 6, 8];
const pick = (list, rnd) => list[Math.floor(rnd() * list.length)];
// A problem: { kind, d, n (the dot's numerator), wholes (1 or 2), ans }.
export function lineProblem(id, rnd = Math.random) {
  if (id === "parts") { const d = pick(DENOMS, rnd); return { kind: "parts", d, n: 1 + Math.floor(rnd() * (d - 1)), wholes: 1, ans: d }; }
  if (id === "past1") {
    // Fractions past 1, and now and then a whole number as a fraction (4/4 at the 1, 8/4 at the 2).
    const d = pick([2, 3, 4], rnd), r = rnd();
    const n = r < 0.2 ? d * (rnd() < 0.5 ? 1 : 2) : d + 1 + Math.floor(rnd() * (d - 1));
    return { kind: "where", d, n, wholes: 2, ans: n };
  }
  const d = pick(DENOMS, rnd), n = 1 + Math.floor(rnd() * (d - 1));
  return { kind: "where", d, n, wholes: 1, ans: n };
}
export const spokenLine = (p) => (p.kind === "parts" ? "How many equal parts from zero to one?" : `Where is the dot? What ${fractionWords(2, p.d, spoken).replace(/^two /, "")}?`);
export const sayFraction = (n, d) => fractionWords(n, d, spoken);
export const spokenLineAnswer = (p) => (p.kind === "parts" ? `${cap(spoken(p.d))} equal parts.` : `It's ${sayFraction(p.n, p.d)}.`);
const cap = (t) => t[0].toUpperCase() + t.slice(1);

// The line: W wide in the drawing, from 0 to wholes, a tick at every 1/d, 0, 1 (and 2) labeled.
export const LINE = { x0: 24, w: 312, y: 70 };
export const tickX = (p, k) => LINE.x0 + (LINE.w * k) / (p.d * p.wholes);
// A fraction label, stacked: numerator over a bar over the denominator.
function frac(x, y, top, bottom, color, size = 13) {
  return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="${size}" fill="${color}" class="lab">${top}</text>`
    + `<line x1="${f1(x - 7)}" y1="${f1(y + 3)}" x2="${f1(x + 7)}" y2="${f1(y + 3)}" stroke="${color}" stroke-width="1.8"/>`
    + `<text x="${f1(x)}" y="${f1(y + 15)}" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="${size}" fill="${color}" class="lab">${bottom}</text>`;
}
// opt.hint: where, hops from 0 along each tick to the dot, each labeled (1/4, 2/4 …) and the
// last "?/4" until worked; parts, each part numbered (the last "?").
export function lineSvg(p, opt = {}) {
  const { x0, w, y } = LINE, total = p.d * p.wholes;
  let s = "";
  // Parts, shaded one by one in the hint (for "how many parts").
  if (opt.hint && p.kind === "parts") {
    for (let k = 0; k < total; k++) {
      const a = tickX(p, k), b = tickX(p, k + 1), last = k === total - 1 && !opt.worked;
      s += `<rect x="${f1(a + 2)}" y="${y - 12}" width="${f1(b - a - 4)}" height="24" rx="6" fill="${k % 2 ? CORAL : GOLD}" opacity=".35"/>`;
      s += `<text x="${f1((a + b) / 2)}" y="${y - 22}" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="15" fill="${GOLD}" class="lab">${last ? "?" : k + 1}</text>`;
    }
  }
  // The chalk line, with an end cap each side.
  s += `<line x1="${x0 - 12}" y1="${y}" x2="${x0 + w + 12}" y2="${y}" stroke="${DK}" stroke-width="11" stroke-linecap="round"/><line x1="${x0 - 12}" y1="${y}" x2="${x0 + w + 12}" y2="${y}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
  for (let k = 0; k <= total; k++) {
    const x = tickX(p, k), whole = k % p.d === 0;
    s += `<line x1="${f1(x)}" y1="${y - (whole ? 16 : 11)}" x2="${f1(x)}" y2="${y + (whole ? 16 : 11)}" stroke="${DK}" stroke-width="${whole ? 7 : 5}" stroke-linecap="round" class="tick"/><line x1="${f1(x)}" y1="${y - (whole ? 14 : 9)}" x2="${f1(x)}" y2="${y + (whole ? 14 : 9)}" stroke="${INK}" stroke-width="${whole ? 3.5 : 2.5}" stroke-linecap="round"/>`;
    if (whole) s += `<text x="${f1(x)}" y="${y + 36}" text-anchor="middle" font-family="Bungee, sans-serif" font-size="18" fill="${INK}" class="lab">${k / p.d}</text>`;
  }
  // Hops from 0 to the dot.
  if (opt.hint && p.kind === "where") {
    for (let k = 1; k <= p.n; k++) {
      const a = tickX(p, k - 1), b = tickX(p, k), m = (a + b) / 2, last = k === p.n;
      s += `<path d="M${f1(a + 2)} ${y - 8} Q${f1(m)} ${y - 30} ${f1(b - 2)} ${y - 8}" fill="none" stroke="${last ? GOLD : "#8eeae4"}" stroke-width="2.5" stroke-linecap="round"/>`;
      s += frac(m, y - 52, last && !opt.worked ? "?" : k, p.d, last ? GOLD : "#8eeae4", total > 8 ? 11 : 13);
    }
  }
  // The dot, on its tick.
  if (p.kind === "where") {
    const x = tickX(p, p.n);
    s += `<circle cx="${f1(x)}" cy="${y}" r="10" fill="${GOLD}" stroke="${DK}" stroke-width="3"/><circle cx="${f1(x - 3)}" cy="${y - 3}" r="3" fill="#fff" opacity=".7"/>`;
  }
  return `<svg viewBox="0 0 ${x0 * 2 + w} ${y + 46}" class="nl" role="img" aria-label="a number line from 0 to ${p.wholes} in ${p.kind === "parts" ? "equal parts" : `${p.d * p.wholes} parts, a dot on one`}">${s}</svg>`;
}
export function lineHint(p, worked) {
  if (p.kind === "parts") return { say: `Count the parts from 0 to 1: ${Array.from({ length: p.d }, (_, i) => i + 1).slice(0, worked ? p.d : p.d - 1).join(", ")}${worked ? `. ${p.d} equal parts.` : ", ?"}` };
  const unit = `1/${p.d}`;
  return { say: `Each jump is ${unit}. Count the jumps from 0 to the dot: ${worked ? `${p.n}/${p.d}` : `?/${p.d}`}` + (worked && p.n % p.d === 0 ? ` = ${p.n / p.d}` : "") };
}
