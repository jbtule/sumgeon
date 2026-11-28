// The plushies: soft toys of the game's monsters, collected like clothing (DESIGN.md §6.3). Ten in
// all (PLUSHIES), each one hero's favorite (FAVORITE): a hero standing on the start scene whose
// favorite the player owns has it at their feet (app.js drawScene, descent.js surfaceHTML), and
// Monsters & Heroes shows it on the hero's card. They come from chests, rarely, and Trollar's shop
// (loot.js contents, shop.js restock); everyone owns Pluffy, the first, from the start.
//
// Pluffy, the plus plushie, came first: a soft stuffed + (not Plusquito, the + monster), so every
// plushie has its plush tells instead of a creature's: puffy, slightly uneven stuffing, a stitched
// seam just inside each edge, button eyes, a sewn smile, rosy cheeks, felt specks, and a striped
// tag sewn into a seam (never a red cross, which reads as first aid). Toys never move on their
// own, only squish when squeezed. No voice: they squeak (sfx.squeak).
// Drawn in the house style (a dark outline, a color, a sheen), in a 120 × 120 box, and made to
// read from 26 px up. No DOM, so the check can run it in Node.
//
// CANDIDATES are every monster tried as a plushie (the gallery shows them all, marked picked or
// not, and why); PLUSHIES are the ten picked.
import { DK, defs } from "./monsters.js";

const W = "#f3efe4", CORAL = "#ff5a4e", PINK = "#ff8fa3", BUTTON = "#2b2440", GOLD = "#ffc93c";

/* ---------- the plush kit ---------- */
const FELT = `<pattern id="plushFelt" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".9" fill="#fff" opacity=".22"/><circle cx="6.5" cy="6" r=".8" fill="${DK}" opacity=".08"/></pattern>`;
// A part of a body: its shapes (SVG elements without fills) and the point its seam shrinks toward.
const part = (s, cx, cy, k = 0.82) => ({ s, cx, cy, k });
// The seam: the part a size in, stitched (dashed) in thread a shade darker, with a light thread.
function seam(p, dark) {
  const t = `translate(${p.cx} ${p.cy}) scale(${p.k}) translate(${-p.cx} ${-p.cy})`, w = (n) => +(n / p.k).toFixed(2);
  return `<g transform="${t}" fill="none" stroke-linecap="round"><g stroke="${dark}" stroke-width="${w(2.6)}" stroke-dasharray="${w(4.5)} ${w(3.5)}">${p.s}</g>`
    + `<g stroke="#fff" stroke-width="${w(1.2)}" stroke-dasharray="${w(4.5)} ${w(3.5)}" opacity=".5">${p.s}</g></g>`;
}
// Stuffed parts in one color: outline, fill, felt, sheen, then each part's seam.
function stuffed(parts, c, dark) {
  const all = parts.map((p) => p.s).join("");
  return `<g fill="${DK}" stroke="${DK}" stroke-width="8" stroke-linejoin="round">${all}</g><g fill="${c}">${all}</g>`
    + `<g fill="url(#plushFelt)">${all}</g><g fill="url(#sh)">${all}</g>` + parts.map((p) => seam(p, dark)).join("");
}
// A felt patch sewn on: flat, a thin outline, a running stitch.
const patch = (s, c, stitch = W) => `<g fill="${c}" stroke="${DK}" stroke-width="2.2" stroke-linejoin="round">${s}</g>`
  + `<g fill="none" stroke="${stitch}" stroke-width="1" stroke-dasharray="2 2" opacity=".7">${s}</g>`;
// A button eye: four holes and a shine.
const button = (x, y, r = 8.5) => { const k = r / 8.5;
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${BUTTON}" stroke="${DK}" stroke-width="${(2.5 * k).toFixed(2)}"/>`
    + `<circle cx="${x}" cy="${y}" r="${(5.6 * k).toFixed(2)}" fill="none" stroke="#5b4f80" stroke-width="${(1.6 * k).toFixed(2)}"/>`
    + `<circle cx="${x - 2 * k}" cy="${y - 0.5 * k}" r="${(1.3 * k).toFixed(2)}" fill="${W}" opacity=".85"/><circle cx="${x + 2 * k}" cy="${y - 0.5 * k}" r="${(1.3 * k).toFixed(2)}" fill="${W}" opacity=".85"/>`
    + `<circle cx="${x - 3.6 * k}" cy="${y - 4 * k}" r="${(1.6 * k).toFixed(2)}" fill="#fff" opacity=".55"/>`; };
const eyes = (x1, x2, y, r) => button(x1, y, r) + button(x2, y, r);
// A smile sewn in thread, w wide, with little end stitches.
const smile = (x, y, w = 18, d = 0.5) => `<path d="M${x - w / 2} ${y} Q${x} ${y + w * d} ${x + w / 2} ${y}" fill="none" stroke="${DK}" stroke-width="3" stroke-linecap="round"/>`
  + `<path d="M${x - w / 2} ${y} l-1.6 -2.6 M${x + w / 2} ${y} l1.6 -2.6" stroke="${DK}" stroke-width="2.2" stroke-linecap="round"/>`;
const cheeks = (x1, x2, y, rx = 6.5) => `<ellipse cx="${x1}" cy="${y}" rx="${rx}" ry="${rx * 0.65}" fill="${PINK}" opacity=".7"/><ellipse cx="${x2}" cy="${y}" rx="${rx}" ry="${rx * 0.65}" fill="${PINK}" opacity=".7"/>`;
// The tag, sewn into a seam: a cream label with a coral stripe, at (x, y) turned a degrees.
const tag = (x, y, a = 0) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-5 0 L5 0 L6 17 L-6 17Z" fill="${W}" stroke="${DK}" stroke-width="3" stroke-linejoin="round"/>`
  + `<path d="M-3.5 7 H3.5 M-3.8 11.5 H3.8" stroke="${CORAL}" stroke-width="1.8" stroke-linecap="round"/></g>`;
const shade = (s, dark) => `<path d="${s}" fill="${dark}" opacity=".45"/>`;

/* ---------- the candidates ---------- */
// Pluffy's body: a + with puffy arms, their sides bulging a little and their ends domed, the inner
// corners rounded like stuffing pulling at a seam. Not quite even, so it looks sewn by hand.
const PLUS = "M41 32 Q39 16 47 10 Q60 4 73 10 Q81 16 79 32 Q79 41 88 41 Q104 39 111 46 Q117 60 111 75 Q104 81 88 79 "
  + "Q80 79 80 89 Q82 104 74 110 Q60 117 46 110 Q38 104 40 89 Q40 79 31 79 Q16 81 10 74 Q4 60 10 46 Q16 39 32 41 Q41 41 41 32Z";
const heart = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M0 0 C-10 -7 -10 -15 -5 -16 C-2 -16.5 0 -14 0 -12.5 C0 -14 2 -16.5 5 -16 C10 -15 10 -7 0 0Z" fill="${CORAL}" stroke="${DK}" stroke-width="2.4" stroke-linejoin="round"/>`
  + `<path d="M0 -3.5 C-7 -8.5 -7 -13.5 -4 -13.6 M4 -13.6 C7 -13.5 7 -8.5 0 -3.5" fill="none" stroke="${W}" stroke-width="1.1" stroke-dasharray="2 2" opacity=".75"/></g>`;

export const CANDIDATES = [
  { id: "pluffy", name: "Pluffy", of: "Plusquito", c: "#7ad7e6", dark: "#3fa9bb",
    d: (c, k) => tag(94, 80, -22) + stuffed([part(`<path d="${PLUS}"/>`, 60, 60, 0.84)], c, k)
      + shade("M46 110 Q60 117 74 110 Q72 102 60 103 Q48 102 46 110Z M10 74 Q16 81 31 79 Q24 72 13 71Z M111 75 Q104 81 88 79 Q96 72 108 71Z", k)
      + heart(60, 104) + cheeks(42, 78, 70) + eyes(48, 72, 57) + smile(60, 70) },
  { id: "mootaur", name: "Mootaur", of: "Minustaur", c: "#4f8dff", dark: "#2f62c4",
    d: (c, k) => stuffed([part(`<path d="M30 46 Q10 32 16 10 Q30 24 42 40Z"/>`, 26, 32, 0.7), part(`<path d="M90 46 Q110 32 104 10 Q90 24 78 40Z"/>`, 94, 32, 0.7)], W, "#c9bd9c")
      + stuffed([part(`<rect x="28" y="70" width="20" height="34" rx="10"/>`, 38, 87, 0.7), part(`<rect x="72" y="70" width="20" height="34" rx="10"/>`, 82, 87, 0.7)], "#3a6fd6", "#24499a")
      + patch(`<ellipse cx="38" cy="103" rx="11" ry="5"/><ellipse cx="82" cy="103" rx="11" ry="5"/>`, "#4a3b33")
      + tag(108, 66, -14) + stuffed([part(`<rect x="4" y="36" width="112" height="44" rx="22"/>`, 60, 58, 0.86)], c, k)
      + cheeks(34, 86, 64, 6) + eyes(46, 74, 54, 7.5) + smile(60, 64, 14)
      + `<circle cx="60" cy="74" r="5" fill="none" stroke="${DK}" stroke-width="5"/><circle cx="60" cy="74" r="5" fill="none" stroke="${GOLD}" stroke-width="2.6"/>` },
  { id: "chompy", name: "Chompy", of: "Chompers", c: "#6cc24a", dark: "#3f8f2a",
    d: (c, k) => {
      const jaw = (a) => `<rect x="0" y="-15" width="104" height="30" rx="15" transform="translate(10 60) rotate(${a})"/>`;
      const teeth = (a, up) => `<g transform="translate(10 60) rotate(${a})" fill="${W}" stroke="${DK}" stroke-width="2.2" stroke-linejoin="round">${[38, 58, 78].map((x) => `<path d="M${x} ${up ? -12 : 12} l5 ${up ? -10 : 10} l5 ${up ? 10 : -10}Z"/>`).join("")}</g>`;
      return tag(14, 66, 20) + teeth(-24, false) + teeth(24, true)
        + stuffed([part(jaw(24), 58, 80, 0.8)], "#58a93a", "#32761f")
        + patch(`<path d="M30 74 Q56 92 96 100 Q70 84 44 70Z"/>`, "#d8ef9a", "#6c8f2a")
        + stuffed([part(jaw(-24), 58, 40, 0.8)], c, k)
        + `<g transform="translate(10 60) rotate(-24)"><circle cx="96" cy="-6" r="2.6" fill="${DK}"/><circle cx="96" cy="5" r="2.6" fill="${DK}"/></g>`
        + cheeks(22, 22, 72, 6) + button(32, 44, 7.5) + button(50, 36, 7.5);
    } },
  { id: "squeakers", name: "Squeakers", of: "Pipsqueak", c: "#f6f3ea", dark: "#c9c0aa",
    d: (c, k) => `<path d="M100 92 q16 4 14 -12 q-2 -10 8 -12" fill="none" stroke="${DK}" stroke-width="4" stroke-linecap="round"/>`
      + stuffed([part(`<circle cx="32" cy="26" r="14"/>`, 32, 26, 0.7), part(`<circle cx="88" cy="26" r="14"/>`, 88, 26, 0.7)], c, k)
      + `<circle cx="32" cy="26" r="7" fill="#ffc6de"/><circle cx="88" cy="26" r="7" fill="#ffc6de"/>`
      + tag(20, 96, 26) + stuffed([part(`<rect x="14" y="26" width="92" height="88" rx="24"/>`, 60, 70, 0.86)], c, k)
      + patch(`<circle cx="60" cy="70" r="5.5"/><circle cx="36" cy="94" r="5.5"/><circle cx="84" cy="94" r="5.5"/>`, BUTTON, "#8b80b0")
      + cheeks(34, 86, 70, 6) + eyes(40, 80, 50, 9) + smile(60, 84, 14) },
  { id: "squishy", name: "Squishy", of: "Slimelipsis", c: "#3fd6d0", dark: "#23a5a0",
    d: (c, k) => tag(104, 86, -16) + stuffed([part(`<path d="M10 104 Q6 70 22 44 Q38 14 60 14 Q82 14 98 44 Q114 70 110 104 Q98 114 85 105 Q72 114 60 105 Q48 114 35 105 Q22 114 10 104Z"/>`, 60, 64, 0.84)], c, k)
      + `<path d="M34 32 Q40 24 48 22" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>`
      + patch(`<path d="M84 34 Q90 44 86 52 Q80 56 78 48 Q78 40 84 34Z"/>`, "#8eeae4", "#23a5a0")
      + cheeks(36, 84, 74) + eyes(46, 74, 60) + smile(60, 76) },
  { id: "ticktock", name: "Tick-Tock", of: "Tick-Tockus", c: "#e8679f", dark: "#b23f72",
    d: (c, k) => {
      const t = (a, r1, r2) => { const s = Math.sin(a), q = -Math.cos(a); return `M${(60 + s * r1).toFixed(1)} ${(64 + q * r1).toFixed(1)} L${(60 + s * r2).toFixed(1)} ${(64 + q * r2).toFixed(1)}`; };
      return stuffed([part(`<path d="M14 96 Q2 108 10 116 Q18 114 26 100Z M106 96 Q118 108 110 116 Q102 114 94 100Z M44 102 Q40 118 50 118 Q56 112 54 102Z M76 102 Q80 118 70 118 Q64 112 66 102Z"/>`, 60, 108, 0.7)], c, k)
        + stuffed([part(`<path d="M22 32 Q18 12 40 8 Q46 22 36 32Z"/>`, 32, 22, 0.7), part(`<path d="M98 32 Q102 12 80 8 Q74 22 84 32Z"/>`, 88, 22, 0.7)], GOLD, "#c9952a")
        + tag(100, 86, -30) + stuffed([part(`<circle cx="60" cy="64" r="46"/>`, 60, 64, 0.88)], c, k)
        + patch(`<circle cx="60" cy="64" r="34"/>`, W, "#b9ad8c")
        + `<path d="${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => t(i * Math.PI / 6, 28, i % 3 ? 30 : 31.5)).join(" ")}" stroke="${DK}" stroke-width="${2.4}" stroke-linecap="round"/>`
        + `<path d="${t(-Math.PI / 3, 0, 14)} ${t(Math.PI / 3, 0, 20)}" stroke="${CORAL}" stroke-width="4" stroke-linecap="round"/><circle cx="60" cy="64" r="3.4" fill="${DK}"/>`
        + cheeks(38, 82, 66, 5) + eyes(46, 74, 54, 7) + smile(60, 78, 12);
    } },
  { id: "pillowgon", name: "Pillow-Gon", of: "Polly-Gon", c: "#3fcf62", dark: "#279a43",
    d: (c, k) => stuffed([part(`<path d="M24 64 Q4 66 4 92 Q20 96 34 84Z"/>`, 20, 80, 0.7), part(`<path d="M96 64 Q116 66 116 92 Q100 96 86 84Z"/>`, 100, 80, 0.7)], "#3d8bff", "#2a64c0")
      + stuffed([part(`<path d="M50 104 L60 120 L70 104Z"/>`, 60, 110, 0.6)], GOLD, "#c9952a")
      + tag(86, 102, -20) + stuffed([part(`<path d="M60 44 L90 60 Q94 62 94 66 L94 98 Q94 102 90 104 L60 118 L30 104 Q26 102 26 98 L26 66 Q26 62 30 60Z"/>`, 60, 81, 0.84)], c, k)
      + stuffed([part(`<path d="M50 14 L48 2 L58 10Z M62 12 L70 0 L70 14Z"/>`, 60, 8, 0.5)], GOLD, "#c9952a")
      + stuffed([part(`<circle cx="60" cy="36" r="25"/>`, 60, 36, 0.84)], "#ff4f5e", "#c02f3d")
      + cheeks(42, 78, 44, 5) + eyes(50, 70, 32, 7.5)
      + `<path d="M53 44 H67 L60 56Z" fill="${GOLD}" stroke="${DK}" stroke-width="2.6" stroke-linejoin="round"/>`
      + heart(60, 92, 0.75) },
  { id: "snugsquatch", name: "Snugsquatch", of: "Squaresquatch", c: "#7f9cff", dark: "#5a6fd0",
    d: (c, k) => {
      const x0 = 16, y0 = 18, x1 = 104, y1 = 100, n = 6, t = 6, w = (x1 - x0) / n, h = (y1 - y0) / n, p = [];
      for (let i = 0; i < n; i++) p.push(`Q${x0 + i * w + w / 2} ${y0 - t} ${x0 + (i + 1) * w} ${y0}`);
      for (let i = 0; i < n; i++) p.push(`Q${x1 + t} ${y0 + i * h + h / 2} ${x1} ${y0 + (i + 1) * h}`);
      for (let i = 0; i < n; i++) p.push(`Q${x1 - i * w - w / 2} ${y1 + t} ${x1 - (i + 1) * w} ${y1}`);
      for (let i = 0; i < n; i++) p.push(`Q${x0 - t} ${y1 - i * h - h / 2} ${x0} ${y1 - (i + 1) * h}`);
      return stuffed([part(`<ellipse cx="38" cy="106" rx="18" ry="11"/>`, 38, 106, 0.6), part(`<ellipse cx="82" cy="106" rx="18" ry="11"/>`, 82, 106, 0.6)], "#5a6fd0", "#3e4f9e")
        + tag(104, 82, -18) + stuffed([part(`<path d="M${x0} ${y0} ${p.join(" ")}Z"/>`, 60, 59, 0.84)], c, k)
        + patch(`<rect x="46" y="70" width="28" height="22" rx="8"/>`, "#b8c8ff", "#5a6fd0")
        + `<path d="M36 36 Q44 30 52 34 M68 34 Q76 30 84 36" fill="none" stroke="${DK}" stroke-width="3" stroke-linecap="round"/>`
        + cheeks(34, 86, 58) + eyes(46, 74, 46, 8) + `<ellipse cx="60" cy="56" rx="5" ry="3.4" fill="${DK}"/>` + smile(60, 62, 14);
    } },
  { id: "tricerafluff", name: "Tricerafluff", of: "Triceraplus", c: "#ff9a4a", dark: "#d06a22",
    d: (c, k) => {
      const plus = (x, y, a, b, r) => `<rect x="${x - b / 2}" y="${y - a}" width="${b}" height="${2 * a}" rx="${r}"/><rect x="${x - a}" y="${y - b / 2}" width="${2 * a}" height="${b}" rx="${r}"/>`;
      return stuffed([part(`<path d="M86 74 Q118 72 116 52 Q122 74 104 92Z"/>`, 104, 76, 0.6)], c, k)
        + stuffed([part(`<rect x="62" y="88" width="14" height="24" rx="7"/>`, 69, 100, 0.6), part(`<rect x="88" y="88" width="14" height="24" rx="7"/>`, 95, 100, 0.6)], "#e7813a", "#b45a1a")
        + stuffed([part(`<ellipse cx="80" cy="82" rx="30" ry="20"/>`, 80, 82, 0.8)], c, k)
        + stuffed([part(plus(18, 30, 10, 9, 4), 18, 30, 0.5), part(plus(42, 16, 10, 9, 4), 42, 16, 0.5), part(plus(66, 30, 10, 9, 4), 66, 30, 0.5)], W, "#c9bd9c")
        + tag(30, 96, 14) + stuffed([part(plus(42, 62, 34, 32, 14), 42, 62, 0.8)], c, k)
        + cheeks(26, 58, 70, 5) + eyes(32, 52, 56, 7.5) + smile(42, 70, 12);
    } },
  { id: "evenstevens", name: "Even Stevens", of: "Equal Twins", c: "#ff7ac8", dark: "#c84a95",
    d: (c, k) => tag(108, 86, -20) + stuffed([part(`<rect x="8" y="68" width="104" height="38" rx="19"/>`, 60, 87, 0.86)], "#8ab4ff", "#5a82d0")
      + stuffed([part(`<rect x="8" y="22" width="104" height="38" rx="19"/>`, 60, 41, 0.86)], c, k)
      + `<path d="M86 20 l12 -10 l2 14z M86 20 l-12 -10 l-2 14z" fill="${GOLD}" stroke="${DK}" stroke-width="2.6" stroke-linejoin="round"/>`
      + eyes(48, 72, 38, 6.5) + smile(60, 48, 10) + eyes(48, 72, 84, 6.5) + smile(60, 94, 10) + cheeks(34, 86, 46, 5) + cheeks(34, 86, 92, 5) },
  { id: "divvydoo", name: "Divvy Doo", of: "Divvy", c: "#45d6e6", dark: "#23a3b4",
    d: (c, k) => tag(106, 72, -20) + stuffed([part(`<circle cx="60" cy="100" r="16"/>`, 60, 100, 0.7)], c, k)
      + stuffed([part(`<rect x="6" y="56" width="108" height="24" rx="12"/>`, 60, 68, 0.84)], c, k)
      + stuffed([part(`<circle cx="60" cy="28" r="24"/>`, 60, 28, 0.82)], c, k)
      + cheeks(44, 76, 34, 5) + eyes(50, 70, 24, 7) + smile(60, 36, 10) },
  { id: "doubles", name: "Doubles", of: "Doublet", c: "#ffd84d", dark: "#c9a52a",
    d: (c, k) => { const one = (x) => part(`<rect x="${x - 12}" y="24" width="24" height="84" rx="12"/><rect x="${x - 26}" y="52" width="52" height="24" rx="12"/>`, x, 66, 0.8);
      return tag(106, 84, -18) + stuffed([one(32), one(88)], c, k)
        + eyes(26, 38, 42, 5) + smile(32, 52, 8) + eyes(82, 94, 42, 5) + smile(88, 52, 8)
        + `<path d="M32 86 l-7 -4 v8z M32 86 l7 -4 v8z M88 86 l-7 -4 v8z M88 86 l7 -4 v8z" fill="${CORAL}" stroke="${DK}" stroke-width="2" stroke-linejoin="round"/>`; } },
  { id: "halfpint", name: "Half-Pint", of: "Halfling", c: "#a47dff", dark: "#7652d6",
    d: (c, k) => stuffed([part(`<path d="M34 112 Q34 92 60 90 Q86 92 86 104 Q86 112 70 112Z"/>`, 60, 102, 0.7)], c, k)
      + stuffed([part(`<rect x="6" y="66" width="108" height="18" rx="9"/>`, 60, 75, 0.8)], "#6b4bc4", "#4a2f96")
      + tag(100, 84, -14) + stuffed([part(`<path d="M42 30 L64 12 Q74 8 74 20 L74 58 Q74 64 64 64 Q54 64 54 58 L54 34 L48 38 Q38 42 42 30Z"/>`, 62, 38, 0.8)], c, k)
      + eyes(57, 69, 40, 5) + smile(63, 52, 8) },
  { id: "trolly", name: "Trolly", of: "Trollar", c: "#7cc47f", dark: "#4f8f52",
    d: (c, k) => stuffed([part(`<rect x="54" y="4" width="12" height="112" rx="6"/>`, 60, 60, 0.6)], "#4f8f52", "#356b38")
      + patch(`<path d="M40 16 Q44 0 52 10 Q56 -2 62 8 Q68 -2 72 10 Q78 2 80 16 Z"/>`, "#ff7ac8", "#c84a95")
      + tag(36, 98, 18) + stuffed([part(`<path d="M96 40 Q90 14 60 14 Q22 14 20 60 Q22 106 60 106 Q90 106 96 80 L76 76 Q72 86 60 86 Q42 86 40 60 Q42 34 60 34 Q72 34 76 44Z"/>`, 58, 60, 0.86)], c, k)
      + eyes(40, 56, 26, 6) + smile(48, 36, 9) },
  { id: "timesy", name: "Timesy", of: "Timesaur", c: "#ffb22e", dark: "#c98418",
    d: (c, k) => tag(60, 98, 0) + `<g transform="rotate(45 60 60) translate(60 60) scale(.92) translate(-60 -60)">` + stuffed([part(`<path d="${PLUS}"/>`, 60, 60, 0.84)], c, k) + `</g>`
      + cheeks(44, 76, 70, 5.5) + eyes(50, 70, 56, 7.5) + `<path d="M50 70 l4 5 l4 -5 l4 5 l4 -5 l4 5" fill="none" stroke="${DK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>` },
  { id: "pebbles", name: "Pebbles", of: "Make-Ten Golem", c: "#b9c4c7", dark: "#7e8b8e", boss: true,
    d: (c, k) => stuffed([part(`<rect x="26" y="98" width="22" height="18" rx="7"/>`, 37, 107, 0.6), part(`<rect x="72" y="98" width="22" height="18" rx="7"/>`, 83, 107, 0.6)], "#97a3a6", "#6b7679")
      + tag(106, 88, -14) + stuffed([part(`<rect x="14" y="48" width="92" height="56" rx="16"/>`, 60, 76, 0.86)], c, k)
      + stuffed([part(`<rect x="34" y="8" width="52" height="42" rx="14"/>`, 60, 29, 0.8)], c, k)
      + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => patch(`<rect x="${27 + (i % 5) * 14}" y="${60 + Math.floor(i / 5) * 19}" width="10" height="14" rx="3"/>`, i < 7 ? "#dfe6e8" : GOLD, "#7e8b8e")).join("")
      + eyes(50, 70, 26, 6.5) + smile(60, 38, 10) }
];

// The ten picked: the ones that read best as soft, huggable toys at 26, 40 and 72 px (why, for the
// gallery and the PR). The rest stay CANDIDATES only.
export const WHY = {
  pluffy: "The first plushie: a soft + with every plush tell.",
  mootaur: "A round blue bolster with felt horns and a gold nose ring: a cuddly bull at any size.",
  chompy: "The < mouth stays readable, and felt teeth on a soft croc are classic plush.",
  squeakers: "A soft die with mouse ears: a squishy cube is a natural toy, and the pips read at 26 px.",
  squishy: "One fat slime: the simplest silhouette of all, a squish begging to be hugged.",
  ticktock: "A round pink alarm clock with bells and nubby tentacles: like a bedside toy.",
  pillowgon: "A hexagon pillow with a parrot's head: bright, chunky, and reads as Polly-Gon from far off.",
  snugsquatch: "A fuzzy square with a tummy patch: the most teddy-like of them all.",
  tricerafluff: "Every kid's plush dinosaur, with three soft + horns.",
  evenstevens: "Two stacked pillows with faces: clearly the Twins, and soft by nature.",
  divvydoo: "Reads as ÷, but at 26 px it's three blobs, and too close to the Twins' stack.",
  doubles: "Two thin pluses: at 26 px a muddle, and too much like Pluffy beside it.",
  halfpint: "The ½ breaks into thin pieces that don't look stuffed; hard to read small.",
  trolly: "A soft ¢ reads as a letter C, not a creature.",
  timesy: "A turned Pluffy: too much like the first plushie.",
  pebbles: "Sweet, but a soft block with a ten-frame reads as a robot, not a monster."
};
const PICKED = ["pluffy", "mootaur", "chompy", "squeakers", "squishy", "ticktock", "pillowgon", "snugsquatch", "tricerafluff", "evenstevens"];
// Trollar's price for an older player, in cents (shop.js priceOf; a K player pays a quarter). Under
// a dollar, so the price line is recorded and one coin or bill takes the counter over. Pluffy has
// none: everyone has it.
const PRICE = { mootaur: 85, chompy: 90, squeakers: 75, squishy: 75, ticktock: 95, pillowgon: 90, snugsquatch: 95, tricerafluff: 85, evenstevens: 80 };
CANDIDATES.forEach((p) => { p.picked = PICKED.includes(p.id); p.why = WHY[p.id]; if (PRICE[p.id]) p.price = PRICE[p.id]; });
export const PLUSHIES = PICKED.map((id) => CANDIDATES.find((p) => p.id === id));
export const plushById = Object.fromEntries(CANDIDATES.map((p) => [p.id, p]));
export const isPlush = (id) => PLUSHIES.includes(plushById[id]);

// Each hero's favorite plushie, one each, and why (said nowhere; for the docs and the gallery).
export const FAVORITE = {
  0: "chompy",       // Zeroic: a superhero's sidekick, all teeth and loyalty
  1: "pluffy",       // Onesie: a bedtime cuddle, and "plus one"
  2: "evenstevens",  // Twodini: the twins, a magician's two-for-one trick
  3: "pillowgon",    // Threasure Hunter: every treasure hunter needs a parrot
  4: "tricerafluff", // Sir Fourtress: a knight and his (very soft) dragon
  5: "mootaur",      // High Five: the team's bull mascot
  6: "squishy",      // Sixlock Holmes: follows the slime trail; what comes next is a clue
  7: "snugsquatch",  // Sevenstein: two gentle giants
  8: "squeakers",    // Chef Eight: every chef's kitchen has a little mouse
  9: "ticktock"      // Nine-ja: a ninja strikes right on time
};
export const favoriteOf = (d) => plushById[FAVORITE[d]];
export const heroOfPlush = (id) => { const k = Object.keys(FAVORITE).find((d) => FAVORITE[d] === id); return k == null ? null : Number(k); };
// Pluffy, the plushie everyone has (it sat on the start scene before there were others).
export const PLUSH = plushById.pluffy, FIRST = "pluffy";

// A plushie as SVG. opts.cls: a class on the svg; opts.label: its name for screen readers (false
// hides it, when it's decoration next to something that says it); opts.shadow: a silhouette (a
// plushie not found yet).
export function plushSvg(id = FIRST, opts = {}) {
  const p = plushById[id] || PLUSH;
  const label = opts.label === false ? `aria-hidden="true"` : `role="img" aria-label="${opts.label || p.name}"`;
  const art = p.d(p.c, p.dark);
  const body = opts.shadow ? `<g filter="url(#plushShadow)" opacity=".85">${art}</g>` : art;
  const shadowDef = opts.shadow ? `<filter id="plushShadow"><feColorMatrix type="matrix" values="0 0 0 0 .12  0 0 0 0 .16  0 0 0 0 .2  0 0 0 1 0"/></filter>` : "";
  return `<svg viewBox="-4 -4 128 128" class="${opts.cls || ""}" ${label}>${defs}<defs>${FELT}${shadowDef}</defs>${body}</svg>`;
}

// A little heart that pops up when a plushie is squeezed.
export const PLUSH_HEART = `<svg viewBox="0 0 24 22" aria-hidden="true"><path d="M12 20 C3 14 1 8 5 4.5 C8 2 11 4 12 6 C13 4 16 2 19 4.5 C23 8 21 14 12 20Z" fill="${CORAL}" stroke="${DK}" stroke-width="2.2" stroke-linejoin="round"/></svg>`;
