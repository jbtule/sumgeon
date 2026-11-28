// Measuring length, for Rulerpillar: in the game since batch 3 (learn.js lengthK, lengthH,
// lengthM; the game's form of a fact is gameFact, below), and on the review page (review/proto/).
// No DOM: runs in Node. DESIGN.md §4.6 has the plan per grade.
//
// The object is always drawn against what measures it, so the answer comes from looking:
// - K (K.GM.A.2): two things lined up at one end, "Is the pencil longer or shorter than the
//   crayon?", answered on two big keys, Longer and Shorter (as true or false is).
// - 1st (1.GM.B.5–7, a priority standard): is it the longest (or shortest) of three? (Yes/No);
//   two things compared with a string (indirectly); how many cubes or paper clips long, laid end
//   to end; and were they laid the right way (no gaps, no overlaps, from the end)? (Yes/No).
// - 2nd (2.GM.B.4–7, 2.GM.C.8–9; the first two priority standards): a ruler in inches or
//   centimeters, a tape in feet or meters, from 0 and (inches and centimeters) not from 0;
//   more or fewer of a smaller unit; estimating with one unit shown; how much longer; adding and
//   subtracting lengths as a bar, the number line as the hint.
// - 3rd: nothing for now. The half and quarter inch (the Common Core's 3.MD.B.4; the school's 3rd
//   grade guide doesn't ask for them) were tried here and taken out (decided 2026-11-27); they
//   could come back with the 4th grade stratum.
// Every answer is a typed whole number (or two), or one of two keys. Facts are fixed samples
// (lengthFacts), each with its own key.
import { spoken } from "./problems.js";

const DK = "#0c171c", GOLD = "#ffc93c", CORAL = "#ff5a4e", INK = "#f3efe4", MUTED = "#a9bec1", TEAL = "#8eeae4";
const f1 = (n) => Math.round(n * 100) / 100;
const cap = (t) => t[0].toUpperCase() + t.slice(1);

/* ---------- the levels ---------- */
export const LENGTH_LEVELS = [
  { id: "compare", name: "Longer or shorter?", grade: "K", stratum: "cellar" },
  { id: "order", name: "The longest? The shortest?", grade: "1st", stratum: "hall" },
  { id: "indirect", name: "Compare with a string", grade: "1st", stratum: "hall" },
  { id: "cubes", name: "How many cubes long?", grade: "1st", stratum: "hall" },
  { id: "clips", name: "How many paper clips long?", grade: "1st", stratum: "hall" },
  { id: "gaps", name: "Measured the right way?", grade: "1st", stratum: "hall" },
  { id: "inches", name: "Inches on a ruler", grade: "2nd", stratum: "mines" },
  { id: "cm", name: "Centimeters on a ruler", grade: "2nd", stratum: "mines" },
  { id: "big", name: "Feet and meters", grade: "2nd", stratum: "mines" },
  { id: "from", name: "Not from 0", grade: "2nd", stratum: "mines" },
  { id: "which", name: "More or fewer units?", grade: "2nd", stratum: "mines" },
  { id: "estimate", name: "About how long?", grade: "2nd", stratum: "mines" },
  { id: "diff", name: "How much longer?", grade: "2nd", stratum: "mines" },
  { id: "addsub", name: "Add and subtract lengths", grade: "2nd", stratum: "mines" }
];

/* ---------- units and things ---------- */
// Each unit: its names, its abbreviation, and the ruler or tape that measures it (how many units
// long, and the small ticks per unit).
export const UNITS = {
  in: { one: "inch", many: "inches", ab: "in", tool: "ruler", max: 10, sub: 2 },
  cm: { one: "centimeter", many: "centimeters", ab: "cm", tool: "ruler", max: 15, sub: 2 },
  ft: { one: "foot", many: "feet", ab: "ft", tool: "tape", max: 10, sub: 2 },
  m: { one: "meter", many: "meters", ab: "m", tool: "tape", max: 6, sub: 2 },
  cube: { one: "cube", many: "cubes" },
  clip: { one: "paper clip", many: "paper clips" }
};
// How big each unit is, in inches, for "more or fewer?".
const SIZE = { cm: 0.3937, in: 1, ft: 12, m: 39.37 };
export const unitWord = (u, n) => (n === 1 ? UNITS[u].one : UNITS[u].many);
// The things measured. Small ones for rulers and cubes; big ones for feet and meters.
export const SMALL = ["pencil", "crayon", "toothbrush", "ribbon", "snake", "marker"];
export const BIG = ["sword", "bench", "ladder", "snake"];
// Thin sticks with a tip: drawn as unlike as can be, but never shown two together.
export const STICKS = ["pencil", "crayon", "marker"];
const OTHERS = SMALL.filter((n) => !STICKS.includes(n));
export const PAIRS = SMALL.flatMap((a) => SMALL.filter((b) => b !== a && !(STICKS.includes(a) && STICKS.includes(b))).map((b) => [a, b]));
// Three together: one stick at most.
export const TRIPLES = [...STICKS.flatMap((st) => OTHERS.flatMap((a, i) => OTHERS.slice(i + 1).map((b) => [st, a, b]))), OTHERS];

/* ---------- the drawing ---------- */
// Everything is drawn 360 wide (the number line's width); the ruler or row of units runs from
// X0, W long.
export const X0 = 20, W = 320;
const lab = (x, y, t, o = {}) => `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${o.anchor || "middle"}" font-family="${o.font || "Nunito, sans-serif"}" font-weight="900" font-size="${o.size || 13}" fill="${o.fill || INK}" class="${o.cls || "lab"}">${t}</text>`;
const sheen = (x, y, w, h, r = 4) => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h / 2)}" rx="${r}" fill="#fff" opacity=".22"/>`;
// A thing lying from x0 to x1, its middle at y, h tall. Its two ends are exactly x0 and x1 (the
// test reads them from data-x0 and data-x1), so it measures true. Each has a silhouette and color
// of its own, so nobody takes the crayon for the pencil at a phone's size: the pencil yellow and
// faceted, with a pink eraser, a metal band and a sharpened cone; the crayon one bright red, a
// paper wrapper with zigzag edges, a stepped tip; the marker uncapped, its blue cap posted on the
// back, a big blue label and a blue felt tip; the toothbrush pink, its bristles standing up; the
// ribbon wavy, forked at both ends; the
// snake a face with a forked tongue; the sword with its crossguard; the ladder with its rungs; the bench on legs.
export function thing(name, x0, x1, y, h = 20) {
  const w = x1 - x0, t = y - h / 2, o = `stroke="${DK}" stroke-width="3" stroke-linejoin="round"`;
  const P = (pts) => pts.map(([a, b], i) => `${i ? "L" : "M"}${f1(a)} ${f1(b)}`).join(" ") + " Z";
  let s = "";
  if (name === "pencil") {
    const er = Math.min(10, w * 0.14), band = Math.min(7, w * 0.1), cone = Math.min(17, w * 0.28), b0 = x0 + er, b1 = b0 + band, c0 = x1 - cone;
    s = `<rect x="${f1(x0 + 1.5)}" y="${f1(t + 1)}" width="${f1(er + 3)}" height="${h - 2}" rx="5" fill="#ff8fb1" ${o}/>`
      + `<rect x="${f1(b1)}" y="${f1(t)}" width="${f1(c0 - b1)}" height="${h}" fill="#ffd23c" ${o}/>`
      // The hexagon's facets: a light top face and a dark bottom one.
      + `<rect x="${f1(b1 + 1.5)}" y="${f1(t + 1.5)}" width="${f1(Math.max(0, c0 - b1 - 3))}" height="${f1(h * 0.27)}" fill="#ffe98a"/>`
      + `<rect x="${f1(b1 + 1.5)}" y="${f1(t + h * 0.7)}" width="${f1(Math.max(0, c0 - b1 - 3))}" height="${f1(h * 0.3 - 1.5)}" fill="#e3a900"/>`
      + `<rect x="${f1(b0)}" y="${f1(t - 0.5)}" width="${f1(band + 1.5)}" height="${h + 1}" fill="#c9d3d6" ${o}/>`
      + `<path d="M${f1(b0 + band * 0.4)} ${f1(t + 2)} V${f1(t + h - 2)} M${f1(b0 + band * 0.75)} ${f1(t + 2)} V${f1(t + h - 2)}" stroke="#7d8b90" stroke-width="1.3"/>`
      + `<path d="${P([[c0, t], [x1 - 1.5, y], [c0, t + h]])}" fill="#f2c58a" ${o}/>`
      + `<path d="${P([[x1 - cone * 0.36, y - h * 0.18], [x1 - 1.5, y], [x1 - cone * 0.36, y + h * 0.18]])}" fill="${DK}"/>`;
  } else if (name === "crayon") {
    // A little chunkier than the pencil, one bright red all over.
    const hh = h * 1.15, tt = y - hh / 2, tip = Math.min(16, w * 0.26), body1 = x1 - tip, wr0 = x0 + Math.min(16, w * 0.2), wr1 = body1 - Math.min(6, w * 0.06);
    const zig = (x, dir) => Array.from({ length: 5 }, (_, k) => [x + (k % 2 ? 3 * dir : 0), tt - 1 + (k * (hh + 2)) / 4]);
    const bands = [wr0 + 5, wr1 - 5].filter(() => wr1 - wr0 > 20).map((x) => `M${f1(x)} ${f1(tt + 2)} q3 ${f1(hh * 0.25)} 0 ${f1(hh * 0.5)} q-3 ${f1(hh * 0.25)} 0 ${f1(hh * 0.5 - 4)}`).join(" ");
    s = `<path d="${P([[body1, tt + 2], [body1 + tip * 0.35, tt + 4], [x1 - 1.5, y - 2], [x1 - 1.5, y + 2], [body1 + tip * 0.35, tt + hh - 4], [body1, tt + hh - 2]])}" fill="#ff3b30" ${o}/>`
      + `<rect x="${f1(x0 + 1.5)}" y="${f1(tt)}" width="${f1(body1 - x0)}" height="${f1(hh)}" rx="3" fill="#ff3b30" ${o}/>`
      // The paper wrapper, zigzag-edged at both ends, with black wavy bands and a white label.
      + `<path d="${P([...zig(wr0, -1), ...zig(wr1, 1).reverse()])}" fill="#d0101c" ${o}/>`
      + (bands ? `<path d="${bands}" fill="none" stroke="${DK}" stroke-width="2"/>` : "")
      + (wr1 - wr0 > 30 ? `<ellipse cx="${f1((wr0 + wr1) / 2)}" cy="${f1(y)}" rx="${f1(Math.min(14, (wr1 - wr0) * 0.25))}" ry="${f1(hh * 0.22)}" fill="#fff" opacity=".9"/>` : "")
      + `<rect x="${f1(x0 + 3)}" y="${f1(tt + 2)}" width="${f1(Math.max(0, wr0 - x0 - 5))}" height="${f1(hh * 0.22)}" rx="2" fill="#fff" opacity=".4"/>`;
  } else if (name === "marker") {
    // A kids' marker, uncapped: its cap posted on the back end, a body with a big blue label, a
    // grey cone and a blue felt tip (the ink's color) at the front.
    const INKC = "#2f6bff", DARKC = "#1c47b8", hh = h * 1.2, tt = y - hh / 2, capL = Math.min(w * 0.24, 26), cone = Math.min(w * 0.14, 12), tip = Math.min(w * 0.11, 10);
    const b0 = x0 + capL - 3, b1 = x1 - cone - tip, lab0 = b0 + (b1 - b0) * 0.22, lab1 = b0 + (b1 - b0) * 0.82;
    s = `<rect x="${f1(b0)}" y="${f1(tt)}" width="${f1(b1 - b0)}" height="${f1(hh)}" rx="4" fill="${INK}" ${o}/>`
      + `<rect x="${f1(lab0)}" y="${f1(tt + 1.5)}" width="${f1(lab1 - lab0)}" height="${f1(hh - 3)}" fill="${INKC}"/>`
      + `<path d="M${f1(lab0)} ${f1(tt)} V${f1(tt + hh)} M${f1(lab1)} ${f1(tt)} V${f1(tt + hh)}" stroke="${DK}" stroke-width="2"/>`
      + (lab1 - lab0 > 24 ? `<path d="M${f1(lab0 + 6)} ${f1(y)} H${f1(lab1 - 6)}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>` : "")
      + `<rect x="${f1(b0)}" y="${f1(tt)}" width="${f1(b1 - b0)}" height="${f1(hh)}" rx="4" fill="none" ${o}/>`
      + `<path d="M${f1(x1 - tip - 2)} ${f1(y - 5)} L${f1(x1 - 4)} ${f1(y - 2)} Q${f1(x1 - 1.5)} ${f1(y)} ${f1(x1 - 4)} ${f1(y + 2)} L${f1(x1 - tip - 2)} ${f1(y + 5)} Z" fill="${INKC}" ${o} stroke-width="2.4"/>`
      + `<path d="${P([[b1, tt + 2], [x1 - tip, y - 5], [x1 - tip, y + 5], [b1, tt + hh - 2]])}" fill="#c9d3d6" ${o}/>`
      // The cap, posted on the back, a little fatter, with its clip.
      + `<rect x="${f1(x0 + 1.5)}" y="${f1(tt - 2)}" width="${f1(capL)}" height="${f1(hh + 4)}" rx="6" fill="${INKC}" ${o}/>`
      + `<rect x="${f1(x0 + capL * 0.25)}" y="${f1(tt - 5)}" width="${f1(capL * 0.75)}" height="5" rx="2.5" fill="${DARKC}" ${o} stroke-width="2"/>`
      + sheen(x0 + 3, tt, capL - 4, hh, 3);
  } else if (name === "toothbrush") {
    // A toothbrush: a pink handle, a thin neck, and the head at the front with its white and
    // blue bristles standing up (above it, never past its end, so it measures true).
    const head = Math.min(w * 0.36, 40), neck = Math.min(w * 0.1, 10), h0 = x1 - head, hy = y + 2, hd = h * 0.42;
    const tufts = Math.max(3, Math.floor((head - 4) / 4.4));
    s = `<path d="M${f1(x0 + 1.5)} ${f1(hy)} Q${f1(x0 + 1.5)} ${f1(hy - h * 0.34)} ${f1(x0 + 8)} ${f1(hy - h * 0.34)} L${f1(h0 - neck)} ${f1(hy - h * 0.22)} L${f1(h0)} ${f1(hy - hd / 2)} L${f1(h0)} ${f1(hy + hd / 2)} L${f1(h0 - neck)} ${f1(hy + h * 0.22)} L${f1(x0 + 8)} ${f1(hy + h * 0.34)} Q${f1(x0 + 1.5)} ${f1(hy + h * 0.34)} ${f1(x0 + 1.5)} ${f1(hy)} Z" fill="#ff5fa2" ${o}/>`
      + `<rect x="${f1(x0 + Math.min(10, w * 0.1))}" y="${f1(hy - h * 0.12)}" width="${f1(Math.max(0, (h0 - neck - x0) * 0.45))}" height="${f1(h * 0.24)}" rx="${f1(h * 0.12)}" fill="#fff" opacity=".55"/>`
      + Array.from({ length: tufts }, (_, k) => { const tx = h0 + 3 + (k * (head - 7)) / (tufts - 1 || 1); return `<rect x="${f1(tx - 2.4)}" y="${f1(hy - hd / 2 - h * 0.72)}" width="4.8" height="${f1(h * 0.76)}" rx="1.5" fill="${k % 3 === 1 ? "#5fb8ff" : "#fff"}" stroke="${DK}" stroke-width="1.4"/>`; }).join("")
      + `<rect x="${f1(h0)}" y="${f1(hy - hd / 2)}" width="${f1(head - 1.5)}" height="${f1(hd)}" rx="${f1(hd / 2)}" fill="#ff5fa2" ${o}/>`;
  } else if (name === "ribbon") {
    // Wavy, both ends cut in a fork.
    const bt = h * 0.6, n = Math.min(8, w * 0.15), a = 3.2, per = 46;
    const wave = (x) => y + a * Math.sin(((x - x0) / per) * 2 * Math.PI);
    const xs = []; for (let x = x0 + 1.5; x < x1 - 1.5; x += 4) xs.push(x); xs.push(x1 - 1.5);
    const top = xs.map((x) => [x, wave(x) - bt / 2]), bot = xs.map((x) => [x, wave(x) + bt / 2]).reverse();
    s = `<path d="${P([...top, [x1 - 1.5 - n, wave(x1)], ...bot, [x0 + 1.5 + n, wave(x0)]])}" fill="#b45cff" ${o}/>`
      + `<path d="${xs.filter((x) => x > x0 + n + 2 && x < x1 - n - 2).map((x, i) => `${i ? "L" : "M"}${f1(x)} ${f1(wave(x) - bt * 0.22)}`).join(" ")}" fill="none" stroke="#fff" stroke-width="2.4" opacity=".4" stroke-linecap="round"/>`;
  } else if (name === "snake") {
    const head = Math.min(h * 1.15, w * 0.35), hx = x1 - head / 2 - 1.5, bt = h * 0.7;
    s = `<path d="M${f1(x0 + 1.5)} ${f1(y + 2)} Q${f1(x0 + 14)} ${f1(y - bt / 2)} ${f1(x0 + 24)} ${f1(y - bt / 2)} H${f1(hx)} V${f1(y + bt / 2)} H${f1(x0 + 24)} Q${f1(x0 + 14)} ${f1(y + bt / 2)} ${f1(x0 + 1.5)} ${f1(y + 2)} Z" fill="#4fcf72" ${o}/>`
      + Array.from({ length: Math.max(0, Math.floor((hx - head / 2 - x0 - 22) / 14)) }, (_, i) => { const cx = x0 + 26 + i * 14; return `<path d="${P([[cx - 4, y], [cx, y - bt * 0.3], [cx + 4, y], [cx, y + bt * 0.3]])}" fill="#23854a"/>`; }).join("")
      // The forked tongue hangs from the front of the mouth (never past the nose, so it measures true).
      + `<path d="M${f1(x1 - head * 0.3)} ${f1(y + h * 0.35)} v7 l-3 4 M${f1(x1 - head * 0.3)} ${f1(y + h * 0.35 + 7)} l3 4" fill="none" stroke="${CORAL}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<ellipse cx="${f1(hx)}" cy="${f1(y)}" rx="${f1(head / 2)}" ry="${f1(h / 2)}" fill="#4fcf72" ${o}/>`
      + `<circle cx="${f1(hx + head * 0.05)}" cy="${f1(y - h * 0.17)}" r="${f1(h * 0.19)}" fill="#fff" stroke="${DK}" stroke-width="2"/><circle cx="${f1(hx + head * 0.11)}" cy="${f1(y - h * 0.17)}" r="${f1(h * 0.09)}" fill="${DK}"/>`
      + `<path d="M${f1(hx - head * 0.05)} ${f1(y + h * 0.2)} Q${f1(hx + head * 0.2)} ${f1(y + h * 0.32)} ${f1(x1 - head * 0.12)} ${f1(y + h * 0.12)}" fill="none" stroke="${DK}" stroke-width="2" stroke-linecap="round"/>`;
  } else if (name === "sword") {
    // A sword lying flat: a round pommel at the back, a wrapped grip, a gold crossguard, and a
    // silver blade to its point at the front.
    const pr = Math.min(h * 0.3, w * 0.07), grip = Math.min(w * 0.16, 22), gx = x0 + 2 * pr + grip, tip = Math.min(16, w * 0.16), bh = h * 0.5;
    s = `<path d="${P([[gx, y - bh / 2], [x1 - tip, y - bh / 2], [x1 - 1.5, y], [x1 - tip, y + bh / 2], [gx, y + bh / 2]])}" fill="#dfe8ec" ${o}/>`
      + `<path d="M${f1(gx + 4)} ${f1(y)} H${f1(x1 - tip - 2)}" stroke="#9aaab0" stroke-width="2" stroke-linecap="round"/>`
      + `<path d="M${f1(gx + 4)} ${f1(y - bh / 2 + 2.5)} H${f1(x1 - tip - 4)}" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>`
      + `<rect x="${f1(x0 + 2 * pr - 1)}" y="${f1(y - h * 0.2)}" width="${f1(grip + 2)}" height="${f1(h * 0.4)}" rx="2" fill="#8a4b22" ${o}/>`
      + `<path d="${Array.from({ length: Math.max(1, Math.floor(grip / 5)) }, (_, k) => `M${f1(x0 + 2 * pr + 3 + k * 5)} ${f1(y - h * 0.18)} l3 ${f1(h * 0.36)}`).join(" ")}" stroke="#5c2f12" stroke-width="1.6"/>`
      + `<rect x="${f1(gx - 3)}" y="${f1(y - h * 0.8)}" width="7" height="${f1(h * 1.6)}" rx="3" fill="${GOLD}" ${o}/>`
      + `<circle cx="${f1(x0 + 1.5 + pr)}" cy="${f1(y)}" r="${f1(pr)}" fill="${GOLD}" ${o}/>`;
  } else if (name === "ladder") {
    // A ladder lying flat, seen from above: two wooden rails, end to end, and its rungs.
    const hh = h * 1.4, ra = y - hh / 2, rb = y + hh / 2, n = Math.max(2, Math.round((w - 10) / 22));
    const rungs = Array.from({ length: n }, (_, k) => x0 + 7 + (k * (w - 14)) / (n - 1));
    s = rungs.map((x) => `<rect x="${f1(x - 2.5)}" y="${f1(ra)}" width="5" height="${f1(hh)}" rx="1.5" fill="#c98a4a" ${o} stroke-width="2"/>`).join("")
      + [ra, rb].map((ry) => `<rect x="${f1(x0 + 1.5)}" y="${f1(ry - 3.5)}" width="${f1(w - 3)}" height="7" rx="3" fill="#a8672f" ${o}/>`).join("")
      + `<path d="M${f1(x0 + 4)} ${f1(ra - 1.5)} H${f1(x1 - 4)} M${f1(x0 + 4)} ${f1(rb - 1.5)} H${f1(x1 - 4)}" stroke="#e2ad74" stroke-width="1.6" stroke-linecap="round"/>`;
  } else {
    // bench: a seat on two legs.
    s = `<path d="M${f1(x0 + w * 0.12)} ${f1(t + 8)} v${f1(h - 6)} M${f1(x1 - w * 0.12)} ${f1(t + 8)} v${f1(h - 6)}" stroke="${DK}" stroke-width="7" stroke-linecap="round"/><path d="M${f1(x0 + w * 0.12)} ${f1(t + 8)} v${f1(h - 6)} M${f1(x1 - w * 0.12)} ${f1(t + 8)} v${f1(h - 6)}" stroke="#9c6a2c" stroke-width="3" stroke-linecap="round"/>`
      + `<rect x="${f1(x0 + 1.5)}" y="${f1(t)}" width="${f1(w - 3)}" height="10" rx="3" fill="#c98a4a" ${o}/>` + sheen(x0 + 3, t + 1, w - 6, 8, 2);
  }
  return `<g class="obj" data-name="${name}" data-x0="${f1(x0)}" data-x1="${f1(x1)}">${s}</g>`;
}
// Its name in small words under its left end, when two or more are shown: the drawing and the
// voice tell a pre-reader which is which; a grown-up can read it.
const nameTag = (name, x0, y) => lab(x0 + 5, y + 24, name, { anchor: "start", size: 11, fill: MUTED, cls: "objlab" });
// A connecting cube (alternating colors, with a nub) or a paper clip, from x to x + u.
const CUBES = ["#ff5a4e", "#4f8bff", "#ffc93c", "#4fcf72"];
function unitPiece(kind, x, u, y, i) {
  if (kind === "cube") {
    const s = u - 1;
    return `<g class="unit" data-x0="${f1(x)}" data-x1="${f1(x + u)}"><rect x="${f1(x + 0.5)}" y="${f1(y - s / 2)}" width="${f1(s)}" height="${f1(s)}" rx="3" fill="${CUBES[i % 4]}" stroke="${DK}" stroke-width="2.5"/>${sheen(x + 3, y - s / 2 + 2, s - 5, s - 6, 2)}<rect x="${f1(x + u * 0.3)}" y="${f1(y - s / 2 - 4)}" width="${f1(u * 0.4)}" height="5" rx="1.5" fill="${CUBES[i % 4]}" stroke="${DK}" stroke-width="2"/></g>`;
  }
  // A paper clip: two nested loops, u long.
  const h = 16, a = x + 1.5, b = x + u - 1.5;
  return `<g class="unit" data-x0="${f1(x)}" data-x1="${f1(x + u)}"><path d="M${f1(b - 9)} ${f1(y + h / 2)} H${f1(a + h / 2)} A${h / 2} ${h / 2} 0 0 1 ${f1(a + h / 2)} ${f1(y - h / 2)} H${f1(b - h / 2)} A${h / 2} ${h / 2} 0 0 1 ${f1(b - h / 2)} ${f1(y + h / 2)} M${f1(b - h / 2)} ${f1(y + h / 2)} H${f1(a + h / 2 + 5)} A3.5 3.5 0 0 1 ${f1(a + h / 2 + 5)} ${f1(y - 2)} H${f1(b - 9)}" fill="none" stroke="${DK}" stroke-width="5" stroke-linecap="round"/><path d="M${f1(b - 9)} ${f1(y + h / 2)} H${f1(a + h / 2)} A${h / 2} ${h / 2} 0 0 1 ${f1(a + h / 2)} ${f1(y - h / 2)} H${f1(b - h / 2)} A${h / 2} ${h / 2} 0 0 1 ${f1(b - h / 2)} ${f1(y + h / 2)} M${f1(b - h / 2)} ${f1(y + h / 2)} H${f1(a + h / 2 + 5)} A3.5 3.5 0 0 1 ${f1(a + h / 2 + 5)} ${f1(y - 2)} H${f1(b - 9)}" fill="none" stroke="#d5e0e3" stroke-width="2.4" stroke-linecap="round"/></g>`;
}
// A ruler (wood) or a tape (yellow), units long from X0, top edge at y: a tick at each unit
// (labeled), smaller ones at each 1/sub. Its units' abbreviation sits at its right end.
export const RULER_H = 40;
export function ruler(unit, units, sub, y, opt = {}) {
  const u = W / units, tape = UNITS[unit] && UNITS[unit].tool === "tape";
  let s = `<rect x="${X0 - 12}" y="${y}" width="${W + 24}" height="${RULER_H}" rx="${tape ? 3 : 6}" fill="${tape ? "#ffd84d" : "#e8c48a"}" stroke="${DK}" stroke-width="3"/>`
    + `<rect x="${X0 - 9}" y="${y + 3}" width="${W + 18}" height="7" rx="3" fill="#fff" opacity=".25"/>`;
  for (let k = 0; k <= units * sub; k++) {
    const x = X0 + (u * k) / sub, whole = k % sub === 0, half = sub % 2 === 0 && k % (sub / 2) === 0;
    const len = whole ? 16 : half && sub > 2 ? 11 : 8;
    s += `<line x1="${f1(x)}" y1="${y}" x2="${f1(x)}" y2="${y + len}" stroke="${DK}" stroke-width="${whole ? 2.6 : 1.6}"${whole ? ' class="tick"' : ""}/>`;
    if (whole && (!opt.only || opt.only.includes(k / sub))) s += lab(x, y + 33, k / sub, { font: "Bungee, sans-serif", size: units > 12 ? 11 : 13, fill: DK });
  }
  // Its unit, in words, under its right end.
  if (opt.unitLabel !== false) s += lab(X0 + W + 12, y + RULER_H + 14, UNITS[unit].many, { size: 11, fill: MUTED, cls: "unitlab", anchor: "end" });
  return s;
}
// Dashed lines from a thing's ends down to the ruler (how a worksheet lines them up).
const guide = (x, y1, y2, color = MUTED) => `<path d="M${f1(x)} ${f1(y1)} V${f1(y2)}" stroke="${color}" stroke-width="2" stroke-dasharray="4 4"/>`;
// Hops from tick a to tick b (units), along y (arcs over it), labeled with labels[i] (or none).
function hops(xs, y, labels, opt = {}) {
  let s = "";
  for (let i = 1; i < xs.length; i++) {
    const a = xs[i - 1], b = xs[i], m = (a + b) / 2, label = labels[i - 1], last = i === xs.length - 1;
    const color = last ? GOLD : TEAL, lift = Math.min(22, Math.abs(b - a) * 0.6 + 6);
    s += `<path d="M${f1(a + 1)} ${f1(y)} Q${f1(m)} ${f1(y - lift)} ${f1(b - 1)} ${f1(y)}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"${label == null ? ' opacity=".5"' : ""}/>`;
    if (label != null) s += lab(m, y - lift - 2, label, { size: opt.size || 12, fill: color, cls: "hop" });
  }
  return s;
}
// How many hops a hint counts before answering: about half (none for 1 or 2); worked, all.
export const counted = (n, worked) => (worked ? n : n <= 2 ? 0 : Math.floor(n / 2));
const countLabels = (n, worked, fmt = (k) => k) => Array.from({ length: n }, (_, i) => (i < counted(n, worked) ? fmt(i + 1) : i === n - 1 ? (worked ? fmt(n) : "?") : null));

// The whole picture for a problem. opt.hint draws the hint on it; opt.worked, the worked one.
export function lengthSvg(p, opt = {}) {
  p = own(p);
  const h = !!opt.hint, wk = !!opt.worked;
  let s = "", H = 120;
  if (p.kind === "compare" || p.kind === "order") {
    // Lined up at the left, one under the other, 26 a unit.
    const u = 26, rows = p.things, gap = 48;
    H = 24 + (rows.length - 1) * gap + 30;
    if (h) s += guide(X0, 6, H - 6, TEAL);
    // The one asked about ("Is the pencil the longest?"): a gold outline round its row and its name in
    // gold, so a pre-reader sees which (it says nothing about the answer: any row can be asked).
    if (p.kind === "order") { const t = rows[p.ask], y = 24 + p.ask * gap; s += `<rect x="${X0 - 10}" y="${y - 18}" width="${t.len * u + 20}" height="44" rx="12" fill="none" stroke="${GOLD}" stroke-width="3" class="asked"/>`; }
    rows.forEach((t, i) => { s += thing(t.name, X0, X0 + t.len * u, 24 + i * gap) + (p.kind === "order" && i === p.ask ? lab(X0 + 5, 24 + i * gap + 24, t.name, { anchor: "start", size: 11, fill: GOLD, cls: "objlab" }) : nameTag(t.name, X0, 24 + i * gap)); });
    // The hint: the other end of the one asked about (compare: the second, the one it's held to).
    if (h) { const ref = p.kind === "compare" ? rows[1] : rows[p.ask]; s += guide(X0 + ref.len * u, 6, H - 6, GOLD); }
    if (wk && p.kind === "compare") s += ringEnd(X0 + rows[0].len * u, 24, rows[0].len > rows[1].len);
  } else if (p.kind === "indirect") {
    // The two things apart (one up and left, one down and right), each with the same string under
    // it, lined up at its left end.
    const u = 24, [a, b] = p.things, ax = X0, bx = X0 + 60, sl = p.string * u;
    s += thing(a.name, ax, ax + a.len * u, 26) + nameTag(a.name, ax, 26) + stringAt(ax, ax + sl, 60) + thing(b.name, bx, bx + b.len * u, 98) + nameTag(b.name, bx, 98) + stringAt(bx, bx + sl, 132);
    if (h) s += guide(ax + sl, 10, 68, GOLD) + guide(bx + sl, 82, 140, GOLD);
    H = 146;
  } else if (p.kind === "units" || p.kind === "gaps") {
    // The thing, and the cubes or clips under it, from its left end (or, gaps, laid wrong).
    const u = p.unit === "cube" ? 28 : 32, x1 = X0 + p.len * u;
    s += thing(p.name, X0, x1, 30) + guide(X0, 14, 82) + guide(x1, 14, 82);
    const xs = unitXs(p, u);
    xs.forEach((x, i) => { s += unitPiece(p.unit, x, u, 64, i); });
    if (h && p.kind === "units") xs.forEach((x, i) => { const l = countLabels(xs.length, wk)[i]; if (l != null) s += lab(x + u / 2, 98, l, { size: 15, fill: l === "?" ? GOLD : TEAL, cls: "hop" }); });
    if (wk && p.kind === "gaps" && p.flaw !== "ok") s += flawRing(p, u, xs);
    H = 104;
  } else if (p.kind === "ruler" || p.kind === "which") {
    const U = UNITS[p.unit], units = U.max, sub = U.sub, u = W / units;
    const a = X0 + p.start * u, b = X0 + (p.start + p.len) * u, y = 62;
    s += thing(p.name, a, b, y, p.unit === "ft" || p.unit === "m" ? 22 : 20) + guide(a, y + 10, 86) + guide(b, y + 10, 86);
    s += ruler(p.unit, units, sub, 86);
    if (h && p.kind === "ruler") {
      const n = p.len, xs = Array.from({ length: n + 1 }, (_, k) => a + k * u);
      s += hops(xs, 46, countLabels(n, wk), { size: n > 10 ? 10 : 12 });
    }
    if (p.kind === "which") s += chips(p, h);
    H = 144 + (p.kind === "which" ? 30 : 0);
  } else if (p.kind === "estimate") {
    // The thing, no ruler; one unit shown under it, at its true size; the hint lays copies along.
    const u = W / UNITS[p.unit].max, x1 = X0 + p.len * u;
    s += thing(p.name, X0, x1, 34) + oneUnit(p.unit, X0, u, 96);
    if (h) {
      const upto = wk ? p.len : Math.min(2, p.len - 1);
      for (let k = 0; k < upto; k++) s += `<rect x="${f1(X0 + k * u + 1)}" y="46" width="${f1(u - 2)}" height="8" rx="3" fill="${TEAL}" opacity=".6" stroke="${DK}" stroke-width="1.5"/>` + lab(X0 + k * u + u / 2, 70, k + 1, { size: 11, fill: TEAL, cls: "hop" });
      if (!wk) s += lab(X0 + upto * u + u / 2, 56, "…", { size: 14, fill: TEAL, cls: "hop" });
    }
    H = 112;
  } else if (p.kind === "diff") {
    const U = UNITS[p.unit], u = W / U.max, [a, b] = p.things, y1 = 48, y2 = 88, ry = 120;
    s += thing(a.name, X0, X0 + a.len * u, y1) + nameTag(a.name, X0, y1) + thing(b.name, X0, X0 + b.len * u, y2) + nameTag(b.name, X0, y2);
    s += guide(X0 + a.len * u, y1 + 10, ry) + guide(X0 + b.len * u, y2 + 10, ry) + ruler(p.unit, U.max, U.sub, ry);
    if (h) {
      const lo = Math.min(a.len, b.len), n = Math.abs(a.len - b.len), xs = Array.from({ length: n + 1 }, (_, k) => X0 + (lo + k) * u);
      s += hops(xs, 30, countLabels(n, wk));
    }
    H = 178;
  } else if (p.kind === "addsub") {
    s += barSvg(p, h, wk);
    H = h ? 150 : 84;
  }
  return `<svg viewBox="0 0 360 ${H}" class="len" role="img" aria-label="${esc(ariaOf(p))}">${s}</svg>`;
}
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const stringAt = (x0, x1, y) => `<g class="string" data-x0="${f1(x0)}" data-x1="${f1(x1)}"><path d="M${f1(x0 + 2)} ${y} H${f1(x1 - 2)}" stroke="${DK}" stroke-width="7" stroke-linecap="round"/><path d="M${f1(x0 + 2)} ${y} H${f1(x1 - 2)}" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-dasharray="7 3"/></g>`;
const ringEnd = (x, y, gold) => `<circle cx="${f1(x)}" cy="${y}" r="15" fill="none" stroke="${gold ? GOLD : CORAL}" stroke-width="3"/>`;
// Where each cube or clip starts: end to end from the thing's left end; for a flawed row, a gap,
// an overlap, or starting in from the end.
function unitXs(p, u) {
  const n = p.kind === "units" ? p.len : p.count, xs = [];
  let x = X0 + (p.flaw === "start" ? u * 0.6 : 0);
  for (let i = 0; i < n; i++) {
    xs.push(x);
    x += u;
    if (i === p.at && p.flaw === "gap") x += u * 0.55;
    if (i === p.at && p.flaw === "overlap") x -= u * 0.45;
  }
  return xs;
}
function flawRing(p, u, xs) {
  const x = p.flaw === "start" ? X0 + u * 0.3 : xs[p.at] + u;
  return `<ellipse cx="${f1(x)}" cy="64" rx="16" ry="20" fill="none" stroke="${CORAL}" stroke-width="3"/>`;
}
// One unit, drawn at its size with its name: a 1-inch or 1-centimeter piece of ruler.
function oneUnit(unit, x, u, y) {
  return `<rect x="${f1(x)}" y="${y - 8}" width="${f1(u)}" height="16" rx="3" fill="#e8c48a" stroke="${DK}" stroke-width="2.5"/>`
    + `<path d="M${f1(x)} ${y - 8} v8 M${f1(x + u)} ${y - 8} v8" stroke="${DK}" stroke-width="2"/>`
    + lab(x + u + 8, y + 5, `= 1 ${UNITS[unit].ab}`, { anchor: "start", size: 14, fill: GOLD, cls: "unitlab" });
}
// More or fewer: the two units side by side at their true sizes (a centimeter beside an inch, a
// foot beside a yard), so "smaller unit, more of them" is there to see.
function chips(p, hint) {
  const ratio = SIZE[p.to] / SIZE[p.unit], u = W / UNITS[p.unit].max, a = u, b = Math.min(150, u * ratio);
  const one = (x, w, unit, color) => `<rect x="${f1(x)}" y="152" width="${f1(Math.max(w, 3))}" height="12" rx="2" fill="${color}" stroke="${DK}" stroke-width="2"/>` + lab(x + Math.max(w, 3) + 5, 163, `1 ${UNITS[unit].ab}`, { anchor: "start", size: 12, fill: color, cls: "unitlab" });
  return one(X0, a, p.unit, "#e8c48a") + one(X0 + a + 52, b, p.to, hint ? GOLD : TEAL);
}
// Adding and subtracting lengths: a bar of two pieces end to end (each labeled), or a whole with a
// piece cut off; the hint is the number line, jumping on (or back) to "?".
function barSvg(p, hint, worked) {
  const u = W / 20, ab = UNITS[p.unit].ab;
  let s = "";
  const piece = (x0, x1, color, text, y = 40, dash) => `<rect x="${f1(x0)}" y="${y - 12}" width="${f1(x1 - x0)}" height="24" rx="4" fill="${color}" stroke="${DK}" stroke-width="3"${dash ? ' stroke-dasharray="6 4"' : ""}/>` + lab((x0 + x1) / 2, y - 18, text, { size: 14, fill: INK });
  if (p.sign === "+") {
    s += piece(X0, X0 + p.a * u, "#c879ff", `${p.a} ${ab}`) + piece(X0 + p.a * u, X0 + (p.a + p.b) * u, "#6aa8ff", `${p.b} ${ab}`);
    s += brace(X0, X0 + (p.a + p.b) * u, 64, worked ? `${p.a + p.b} ${ab}` : "?");
  } else {
    s += piece(X0, X0 + p.ans * u, "#d9a35f", worked ? `${p.ans} ${ab}` : "?") + piece(X0 + p.ans * u, X0 + p.a * u, "#d9a35f", `${p.b} ${ab}`, 40, true);
    s += `<path d="M${f1(X0 + p.ans * u)} 22 V58" stroke="${CORAL}" stroke-width="3" stroke-dasharray="4 3"/>` + brace(X0, X0 + p.a * u, 64, `${p.a} ${ab}`);
  }
  if (hint) {
    // The number line: 0 to 20, a tick each; 0 and the first number labeled; the jump to "?".
    const y = 124;
    s += `<line x1="${X0 - 6}" y1="${y}" x2="${X0 + W + 6}" y2="${y}" stroke="${DK}" stroke-width="8" stroke-linecap="round"/><line x1="${X0 - 6}" y1="${y}" x2="${X0 + W + 6}" y2="${y}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    for (let k = 0; k <= 20; k++) s += `<line x1="${f1(X0 + k * u)}" y1="${y - (k % 5 ? 5 : 8)}" x2="${f1(X0 + k * u)}" y2="${y + (k % 5 ? 5 : 8)}" stroke="${INK}" stroke-width="${k % 5 ? 1.5 : 2.5}"/>`;
    const from = p.sign === "+" ? p.a : p.a, to = p.sign === "+" ? p.a + p.b : p.ans;
    s += lab(X0, y + 22, 0, { size: 14 }) + lab(X0 + from * u, y + 22, from, { size: 14, fill: TEAL });
    if (p.sign === "+") s += hops([X0, X0 + p.a * u], y - 4, [`+${p.a}`]).replaceAll(GOLD, TEAL);
    s += hops([X0 + from * u, X0 + to * u], y - 4, [`${p.sign === "+" ? "+" : "−"}${p.b}`]);
    s += lab(X0 + to * u, y + 22, worked ? to : "?", { size: 14, fill: GOLD });
  }
  return s;
}
const brace = (x0, x1, y, text) => `<path d="M${f1(x0 + 2)} ${y - 6} V${y} H${f1(x1 - 2)} V${y - 6}" fill="none" stroke="${MUTED}" stroke-width="2.5" stroke-linejoin="round"/>` + lab((x0 + x1) / 2, y + 16, text, { size: 14, fill: text === "?" ? GOLD : INK });

/* ---------- words ---------- */
const the = (n) => `the ${n}`;
export function ariaOf(p) {
  p = own(p);
  if (p.kind === "compare" || p.kind === "order") return `${p.things.map((t) => t.name).join(", ")}, lined up at one end`;
  if (p.kind === "indirect") return `a ${p.things[0].name} and a ${p.things[1].name}, each with a string`;
  if (p.kind === "units" || p.kind === "gaps") return `a ${p.name} with ${UNITS[p.unit].many} under it`;
  if (p.kind === "addsub") return "two lengths";
  if (p.kind === "diff") return `a ${p.things[0].name} and a ${p.things[1].name} on a ruler`;
  return `a ${p.name} ${p.kind === "estimate" ? "and one unit" : "on a ruler"}`;
}
const say = (n) => spoken(n);
const unitSaid = (u, n) => `${say(n)} ${unitWord(u, n)}`;
// What the voice says as the problem appears (a pre-reader can't read "How many inches long?").
export function spokenLength(p) {
  p = own(p);
  const [a, b] = p.things || [];
  switch (p.kind) {
    case "compare": return `Is the ${a.name} longer or shorter than the ${b.name}?`;
    case "order": return `Is the ${p.things[p.ask].name} the ${p.most}?`;
    case "indirect": return `Use the string. Is the ${a.name} longer or shorter than the ${b.name}?`;
    case "units": return `How many ${UNITS[p.unit].many} long is the ${p.name}?`;
    case "gaps": return `Are the ${UNITS[p.unit].many} laid the right way to measure?`;
    case "ruler": return `How many ${UNITS[p.unit].many} long is the ${p.name}?`;
    case "which": return `The ${p.name} is ${unitSaid(p.unit, p.len)} long. In ${UNITS[p.to].many}, is that more or fewer?`;
    case "estimate": return `About how many ${UNITS[p.unit].many} long is the ${p.name}?`;
    case "diff": return `How much longer is the ${a.len > b.len ? a.name : b.name} than the ${a.len > b.len ? b.name : a.name}?`;
    case "addsub": return p.sign === "+"
      ? `One ribbon is ${unitSaid(p.unit, p.a)}. Another is ${unitSaid(p.unit, p.b)}. End to end, how long are they?`
      : `A ribbon is ${unitSaid(p.unit, p.a)} long. ${cap(unitSaid(p.unit, p.b))} is cut off. How long is the rest?`;
  }
  return "";
}
// After a miss: the answer, said whole.
export function spokenLengthAnswer(p) {
  p = own(p);
  const [a, b] = p.things || [];
  switch (p.kind) {
    case "compare": return `The ${a.name} is ${p.ans === "L" ? "longer" : "shorter"} than the ${b.name}.`;
    case "order": { const most = p.things.reduce((x, y) => ((p.most === "longest" ? y.len > x.len : y.len < x.len) ? y : x)); return p.ans === "Y" ? `Yes! The ${most.name} is the ${p.most}.` : `No. The ${most.name} is the ${p.most}.`; }
    case "indirect": return `The ${a.name} is ${p.ans === "L" ? "longer" : "shorter"} than the string, and the ${b.name} is ${p.ans === "L" ? "shorter" : "longer"}. So the ${a.name} is ${p.ans === "L" ? "longer" : "shorter"}.`;
    case "units": return `The ${p.name} is ${say(p.len)} ${unitWord(p.unit, p.len)} long.`;
    case "gaps": return { ok: "Yes! End to end, no gaps, no overlaps.", gap: "No. There's a gap.", overlap: "No. They overlap.", start: "No. They don't start at the end." }[p.flaw];
    case "ruler": return `The ${p.name} is ${unitSaid(p.unit, p.len)} long.`;
    case "which": return p.ans === "M" ? `More. ${cap(UNITS[p.to].many)} are smaller, so it takes more of them.` : `Fewer. ${cap(UNITS[p.to].many)} are bigger, so it takes fewer of them.`;
    case "estimate": return `About ${unitSaid(p.unit, p.len)}.`;
    case "diff": return `${cap(unitSaid(p.unit, p.ans))} longer.`;
    case "addsub": return `${cap(unitSaid(p.unit, p.ans))}.`;
  }
  return "";
}

/* ---------- hints ---------- */
// The hint's words; the drawing is on the picture (lengthSvg with opt.hint). Before answering
// they never give the answer: a count stops partway, a subtraction ends "= ?".
export function lengthHint(p, worked) {
  p = own(p);
  const [a, b] = p.things || [];
  const ab = UNITS[p.unit] && UNITS[p.unit].ab;
  const count = (n, fmt = (k) => k) => Array.from({ length: counted(n, worked) }, (_, i) => fmt(i + 1)).join(", ");
  switch (p.kind) {
    case "compare": return { say: worked ? `The ends line up. The ${a.name} ${a.len > b.len ? "goes past" : "stops before"} the ${b.name}'s end: it's ${a.len > b.len ? "longer" : "shorter"}.` : `The ends line up. Look at the other ends. Does the ${a.name} go past the ${b.name}?` };
    case "order": {
      const t = p.things[p.ask];
      if (worked) return { say: `Line up the ends. ${p.ans === "Y" ? `Nothing goes ${p.most === "longest" ? "past" : "less far than"} the ${t.name}.` : `The ${t.name} isn't the ${p.most}.`}` };
      return { say: p.most === "longest" ? `Line up the ends. Does anything go past the ${t.name}?` : `Line up the ends. Does anything stop before the ${t.name}?` };
    }
    case "indirect": return { say: worked ? spokenLengthAnswer(p) : `The string is the same both times. Does the ${a.name} go past the string? Does the ${b.name}?` };
    case "units": return { say: worked ? `${count(p.len)}. ${p.len} ${UNITS[p.unit].many} long.` : `Count the ${UNITS[p.unit].many}: ${counted(p.len) ? count(p.len) + ", … " : ""}How many?` };
    case "gaps": return { say: worked ? spokenLengthAnswer(p) : `Start at the end. No gaps, no overlaps. Check each one.` };
    case "ruler":
      if (p.start) return { say: worked ? `It starts at ${p.start} and ends at ${p.start + p.len}. ${p.start + p.len} − ${p.start} = ${p.len} ${ab}.` : `It starts at ${p.start}, not 0. Count the jumps from ${p.start}, or ${p.start + p.len} − ${p.start} = ?` };
      return { say: worked ? `Start at 0. Count the ${UNITS[p.unit].many}: ${count(p.len)}. ${p.len} ${ab}.` : `Start at 0. Count the ${UNITS[p.unit].many}: ${counted(p.len) ? count(p.len) + ", … " : ""}?` };
    case "which": return { say: worked ? spokenLengthAnswer(p) : `Look at 1 ${UNITS[p.unit].ab} and 1 ${UNITS[p.to].ab}. Smaller units: do you need more of them, or fewer?` };
    case "estimate": return { say: worked ? `About ${p.len} of them fit: about ${p.len} ${ab}.` : `That's 1 ${ab}. How many would fit along it? 1, 2, …` };
    case "diff": {
      const lo = Math.min(a.len, b.len), hi = Math.max(a.len, b.len), n = hi - lo;
      return { say: worked ? `${hi} − ${lo} = ${n}. ${n} ${ab} longer.` : `Count on from ${lo} to ${hi}${counted(n) ? `: ${count(n)}, …` : ""}, or ${hi} − ${lo} = ?` };
    }
    case "addsub": return { say: p.sign === "+" ? `${p.a} + ${p.b} = ${worked ? p.ans : "?"}${worked ? ` ${ab}` : ""}` : `${p.a} − ${p.b} = ${worked ? p.ans : "?"}${worked ? ` ${ab}` : ""}` };
  }
  return { say: "" };
}

/* ---------- answers ---------- */
// Two-key kinds (as true or false is): the keys and their words.
export const KEYS = {
  LS: [["L", "Longer"], ["S", "Shorter"]],
  YN: [["Y", "Yes"], ["N", "No"]],
  MF: [["M", "More"], ["F", "Fewer"]]
};
export const keysOf = (p) => (p.kind === "compare" || p.kind === "indirect" ? KEYS.LS : p.kind === "order" || p.kind === "gaps" ? KEYS.YN : p.kind === "which" ? KEYS.MF : null);
// Is the typed answer right? (An estimate is right within 1 inch or 2 centimeters.)
export function lengthRight(p, typed) {
  p = own(p);
  const ans = [].concat(p.ans);
  if (p.kind === "estimate") return Math.abs(Number(typed[0]) - p.len) <= (p.unit === "cm" ? 2 : 1);
  return ans.every((x, i) => (typeof x === "string" ? typed[i] === x : typed[i] !== "" && Number(typed[i]) === x));
}
// The problem line under the picture: its parts, null for the answer slot (in order).
export function lengthLine(p) {
  const ab = UNITS[p.unit] && UNITS[p.unit].ab;
  switch (p.kind) {
    case "compare": case "indirect": return [`The ${p.things[0].name} is `, null];
    case "order": return [`The ${p.things[p.ask].name}, the ${p.most}? `, null];
    case "gaps": return ["Measured right? ", null];
    case "units": return [null, ` ${UNITS[p.unit].many}`];
    case "which": return ["In " + UNITS[p.to].many + ": ", null];
    case "estimate": return ["About ", null, ` ${ab}`];
    case "diff": return [null, ` ${ab} longer`];
    case "addsub": return [p.sign === "+" ? "In all: " : "Left: ", null, ` ${ab}`];
    default: return [null, ` ${ab}`];
  }
}

/* ---------- the facts ---------- */
// A fact: { op: "ℓ", set (its level), kind, …, ans, key }. Keys (ℓ for length):
// - "ℓc:pencil7,crayon4": is the pencil (7) longer or shorter than the crayon (4)? (K)
// - "ℓo+1:ribbon6,pencil4,crayon3": is the second one drawn the longest ("-": the shortest)?
// - "ℓi:pencil7,crayon4,5": the pencil and the crayon, each against a string 5 long.
// - "ℓu:cube,pencil7", "ℓu:clip,toothbrush5": how many cubes (paper clips) long?
// - "ℓg:clip,pencil5,gap1": laid right? ok, gap (after the 2nd), overlap1, start.
// - "ℓin:pencil7", "ℓcm:toothbrush12", "ℓft:sword6", "ℓm:ladder4": on a ruler or tape from 0;
//   "ℓin:pencil2-7": from 2 to 7.
// - "ℓw:in>cm:pencil4": 4 inches long; in centimeters, more or fewer?
// - "ℓe:in:pencil6": about how many inches? (one inch shown)
// - "ℓd:in:pencil9,crayon5": how much longer?
// - "ℓ+:cm:8,5", "ℓ−:in:12,5": add and subtract lengths.
const fact = (set, kind, o, key) => ({ op: "ℓ", set, kind, ...o, key: "ℓ" + key });
let cache = null;
export function lengthFacts() {
  if (cache) return cache;
  const out = [];
  // A fixed shuffle, so the samples are the same everywhere.
  let seed = 7;
  const r = (n) => { seed = (seed * 9301 + 49297) % 233280; return Math.floor((seed / 233280) * n); };
  // Two shown together are never two of the sticks (pencil, crayon, marker), so they can't be
  // taken for each other: a stick and something else, or two of the rest.
  const two = (i) => PAIRS[(i * 5) % PAIRS.length];
  // K: 20 pairs, 3 to 11 long, at least 2 apart, half longer.
  for (let i = 0; i < 20; i++) {
    const [x, y] = two(i);
    let a, b;
    do { a = 3 + r(9); b = 3 + r(9); } while (Math.abs(a - b) < 2 || (a > b) !== (i % 2 === 0));
    out.push(fact("compare", "compare", { things: [{ name: x, len: a }, { name: y, len: b }], ans: a > b ? "L" : "S" }, `c:${x}${a},${y}${b}`));
  }
  // 1st, the longest or shortest of three, all lengths at least 2 apart: 16, half yes.
  for (let i = 0; i < 16; i++) {
    const tri = TRIPLES[i % TRIPLES.length], names = [0, 1, 2].map((k) => tri[(k + i) % 3]), most = i % 4 < 2 ? "longest" : "shortest";
    let lens;
    do { lens = [2 + r(10), 2 + r(10), 2 + r(10)]; } while (Math.min(Math.abs(lens[0] - lens[1]), Math.abs(lens[1] - lens[2]), Math.abs(lens[0] - lens[2])) < 2);
    const best = lens.indexOf(most === "longest" ? Math.max(...lens) : Math.min(...lens)), ask = i % 2 === 0 ? best : (best + 1 + r(2)) % 3;
    const things = names.map((name, k) => ({ name, len: lens[k] }));
    out.push(fact("order", "order", { things, ask, most, ans: ask === best ? "Y" : "N" }, `o${most === "longest" ? "+" : "-"}${ask}:${things.map((t) => t.name + t.len).join(",")}`));
  }
  // Indirect: 12, the string between them (2 or more from each).
  for (let i = 0; i < 12; i++) {
    const [x, y] = two(i + 3);
    const s = 5 + r(3), longer = i % 2 === 0, a = longer ? s + 2 + r(3) : s - 2 - r(1), b = longer ? s - 2 - r(1) : s + 2 + r(3);
    out.push(fact("indirect", "indirect", { things: [{ name: x, len: a }, { name: y, len: b }], string: s, ans: longer ? "L" : "S" }, `i:${x}${a},${y}${b},${s}`));
  }
  // Cubes (2 to 11) and paper clips (2 to 9), each length once.
  for (let n = 2; n <= 11; n++) out.push(fact("cubes", "units", { unit: "cube", name: SMALL[n % 6], len: n, ans: n }, `u:cube,${SMALL[n % 6]}${n}`));
  for (let n = 2; n <= 9; n++) out.push(fact("clips", "units", { unit: "clip", name: SMALL[(n + 3) % 6], len: n, ans: n }, `u:clip,${SMALL[(n + 3) % 6]}${n}`));
  // Laid right? 16: 4 right, 4 each with a gap, an overlap, or not from the end.
  ["ok", "gap", "overlap", "start"].forEach((flaw, f) => {
    for (let i = 0; i < 4; i++) {
      const unit = i % 2 ? "clip" : "cube", len = 4 + i + f % 2, name = SMALL[(i + f) % 6], at = flaw === "gap" || flaw === "overlap" ? 1 + (i % 2) : undefined;
      // The count laid: with a gap, one fewer fit under it; with an overlap or not from the end, the same.
      const count = flaw === "gap" ? len - 1 : len;
      out.push(fact("gaps", "gaps", { unit, name, len, count, flaw, at, ans: flaw === "ok" ? "Y" : "N" }, `g:${unit},${name}${len},${flaw}${at != null ? at : ""}`));
    }
  });
  // Rulers from 0: inches 1–10, centimeters 2–15; tapes: feet 2–9, meters 1–5.
  const ruled = (set, unit, lens, names) => lens.forEach((n, i) => { const name = names[i % names.length]; out.push(fact(set, "ruler", { unit, name, start: 0, len: n, ans: n }, `${unit}:${name}${n}`)); });
  ruled("inches", "in", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], SMALL);
  ruled("cm", "cm", [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], SMALL.slice(1).concat(SMALL[0]));
  ruled("big", "ft", [2, 3, 4, 5, 6, 7, 8, 9], BIG);
  ruled("big", "m", [1, 2, 3, 4, 5], BIG.slice(2).concat(BIG));
  // Not from 0: 12 inches, 12 centimeters; never the length the same as where it starts.
  for (let i = 0; i < 24; i++) {
    const unit = i < 12 ? "in" : "cm", max = UNITS[unit].max, name = SMALL[i % 6];
    let st, n;
    do { st = 1 + r(5); n = 2 + r(max - st - 1); } while (n === st || st + n > max);
    const key = `${unit}:${name}${st}-${st + n}`;
    if (out.some((f) => f.key === "ℓ" + key)) { i--; continue; }
    out.push(fact("from", "ruler", { unit, name, start: st, len: n, ans: n }, key));
  }
  // More or fewer: each pair of units both ways, with a length that fits the first's ruler.
  [["in", "cm"], ["cm", "in"], ["ft", "in"], ["m", "ft"], ["ft", "m"], ["m", "cm"]].forEach(([u, to], i) => {
    for (let k = 0; k < 2; k++) {
      const n = Math.min(UNITS[u].max - 1, 2 + i % 3 + k * 2), names = UNITS[u].tool === "tape" ? BIG : SMALL, name = names[(i + k) % names.length];
      out.push(fact("which", "which", { unit: u, to, name, start: 0, len: n, ans: SIZE[to] < SIZE[u] ? "M" : "F" }, `w:${u}>${to}:${name}${n}`));
    }
  });
  // Estimate: inches 3–9, centimeters 4–14.
  [3, 4, 5, 6, 7, 8, 9].forEach((n, i) => out.push(fact("estimate", "estimate", { unit: "in", name: SMALL[i % 6], len: n, ans: n }, `e:in:${SMALL[i % 6]}${n}`)));
  [4, 6, 8, 10, 12, 14].forEach((n, i) => out.push(fact("estimate", "estimate", { unit: "cm", name: SMALL[(i + 2) % 6], len: n, ans: n }, `e:cm:${SMALL[(i + 2) % 6]}${n}`)));
  // How much longer: 16, on inches and centimeters, the difference never one of the lengths.
  for (let i = 0; i < 16; i++) {
    const unit = i % 2 ? "cm" : "in", max = UNITS[unit].max, [x, y] = two(i + 5);
    let a, b;
    do { a = 3 + r(max - 2); b = 1 + r(max - 1); } while (a - b < 2 || a - b === b || b < (unit === "cm" ? 3 : 2));
    const things = i % 4 > 1 ? [{ name: y, len: b }, { name: x, len: a }] : [{ name: x, len: a }, { name: y, len: b }];
    out.push(fact("diff", "diff", { unit, things, ans: a - b }, `d:${unit}:${things.map((t) => t.name + t.len).join(",")}`));
  }
  // Adding and subtracting: 8 each, within 20, the answer never one of the numbers.
  for (let i = 0; i < 16; i++) {
    const unit = ["in", "cm", "ft", "m"][i % 4], plus = i < 8;
    let a, b;
    if (plus) { do { a = 3 + r(12); b = 2 + r(8); } while (a + b > 20 || a === b); out.push(fact("addsub", "addsub", { unit, sign: "+", a, b, ans: a + b }, `+:${unit}:${a},${b}`)); }
    else { do { a = 6 + r(15); b = 2 + r(a - 3); } while (a > 20 || a - b === b || a - b < 2); out.push(fact("addsub", "addsub", { unit, sign: "−", a, b, ans: a - b }, `−:${unit}:${a},${b}`)); }
  }
  return (cache = out);
}
// The damage, for the game (decided 2026-11-27): a count or a reading hits for itself; the
// two-key kinds hit for the longest thing's length, as Chompers hits for the bigger number (the
// string's problem, the longer of the two; more or fewer, the length given; laid right, how many
// fit under it).
export function lengthHit(p) {
  if (p.things) return Math.max(...p.things.map((t) => t.len));
  if (p.kind === "which") return p.len;
  if (p.kind === "gaps") return p.count;
  return [].concat(p.ans)[0];
}
export const lengthFactOf = (key) => lengthFacts().find((f) => f.key === key) || null;
// A problem for the prototype page: a fact of the level, at random.
export function lengthProblem(id, rnd = Math.random) {
  const all = lengthFacts().filter((f) => f.set === id);
  return all[Math.floor(rnd() * all.length)];
}

/* ---------- in the game (batch 3) ----------
   The game's form of a fact (learn.js, app.js): a two-key answer (Longer/Shorter, Yes/No,
   More/Fewer) moves to sym, as true or false's does, and ans is what it hits for (lengthHit), so
   a monster's HP and the damage are numbers; an estimate is right within near (1 in, 2 cm); and
   every fact carries its line as text in q ("About □ in"), as the game reads a fact's q. The
   functions above take either form (own). */
const own = (p) => (p && p.sym ? Object.assign({}, p, { ans: p.sym }) : p);
export function gameFact(f) {
  const g = Object.assign({}, f);
  if (keysOf(f)) { g.sym = f.ans; g.ans = lengthHit(f); }
  if (f.kind === "estimate") g.near = f.unit === "cm" ? 2 : 1;
  g.q = lengthLine(f).map((x) => (x === null ? "□" : x)).join("");
  return g;
}
let gameCache = null;
export const lengthGameFacts = () => gameCache || (gameCache = lengthFacts().map(gameFact));
export const lengthGameFactOf = (key) => lengthGameFacts().find((f) => f.key === key) || null;
// The word a two-key answer stands for: "L" is "Longer".
export const keyWord = (p, k) => ((keysOf(own(p)) || []).find((x) => x[0] === k) || [null, k])[1];
