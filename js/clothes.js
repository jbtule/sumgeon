// Clothing for the digit heroes (DESIGN.md §6.3 "Clothing", §14.2): hats, glasses, bows and the
// like, one piece per spot (head, face, neck), drawn over a hero at its anchors in the house style
// (a dark outline, a color, a sheen). Art only for now: nothing in the game wears them yet (the
// clothing bag and the wardrobe come later). heroSvg(h, { wear }) in heroes.js draws a hero
// wearing them. No DOM, so the check can run it in Node.
import { DK, defs } from "./monsters.js";

const W = "#f3efe4", GOLD = "#ffc93c", GOLD2 = "#e0a222", CORAL = "#ff5a4e", PINK = "#ff7ac8", BLUE = "#8ab4ff", TEAL = "#45d6e6";
const n = (v) => Math.round(v * 10) / 10;

// The house style at clothing size: an outline (w wide), the color, the sheen.
const fill = (s, c, w = 6) => `<g fill="${DK}" stroke="${DK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round">${s}</g><g fill="${c}">${s}</g><g fill="url(#sh)">${s}</g>`;
// A thick colored line with a dark edge (frames, straps, ribbons).
const rim = (s, c, w = 4) => `<g fill="none" stroke="${DK}" stroke-width="${w + 4}" stroke-linecap="round" stroke-linejoin="round">${s}</g><g fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${s}</g>`;
const at = (x, y, s, inner, rot = 0) => `<g transform="translate(${n(x)} ${n(y)})${rot ? ` rotate(${n(rot)})` : ""}${s !== 1 ? ` scale(${n(s * 100) / 100})` : ""}">${inner}</g>`;
const star = (x, y, r, c, k = .45) => {
  const p = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * k : r; p.push(`${n(x + q * Math.cos(a))} ${n(y + q * Math.sin(a))}`); }
  return `<path d="M${p.join(" L")}Z" fill="${c}" stroke="${DK}" stroke-width="2" stroke-linejoin="round"/>`;
};
const circ = (x, y, r) => `M${n(x - r)} ${n(y)} a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0 a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0Z`;

/* ---------- where each hero's features are ----------
   In the hero's own drawing (heroSvg's viewBox, -10 -24 220 234), like the monsters' ANCHOR:
   - top: where a hat's brim sits, just inside the top of the head's stroke, so it seats on it;
     s scales head pieces to the head's width (a 1 is narrow, a 0 is wide).
   - eyes: [x, y, r] each; face pieces line up on them, turned to their slant.
   - mouth: where a mustache goes.
   - neck: where a bow tie sits, just under the face; ns scales neck pieces.
   - ground: where the feet are, for a cape's hem.
   Digits have no neck, so "neck" is under the face, on the stroke where there's one (the 1's stem,
   the 4's stem, between the 8's loops, the 9's chin), or at the bottom edge of the top stroke. */
export const HERO_ANCHOR = [
  /* 0 Zeroic */ { top: [100, 25], s: 1, eyes: [[89, 41, 7], [111, 41, 7]], mouth: [100, 50], neck: [100, 58], ns: .95, ground: 182 },
  /* 1 Onesie */ { top: [109, 27], s: .78, eyes: [[100, 74, 7], [117, 74, 7]], mouth: [109, 86], neck: [109, 104], ns: .85, ground: 180 },
  /* 2 Twodini */ { top: [100, 22], s: .9, eyes: [[90, 38, 7], [112, 36, 7]], mouth: [101, 49], neck: [101, 56], ns: .9, ground: 178 },
  /* 3 Threasure Hunter */ { top: [98, 24], s: .95, eyes: [[92, 46, 7], [114, 46, 7]], mouth: [103, 55], neck: [101, 60], ns: .9, ground: 178 },
  /* 4 Sir Fourtress (the helmet's visor) */ { top: [128, 16], s: .8, eyes: [[120, 39, 5], [136, 39, 5]], mouth: [128, 52], neck: [128, 70], ns: .85, ground: 184 },
  /* 5 High Five */ { top: [104, 23], s: .95, eyes: [[92, 42, 7], [114, 42, 7]], mouth: [103, 52], neck: [103, 58], ns: .9, ground: 180 },
  /* 6 Sixlock Holmes (the eyes are on the 6's loop) */ { top: [106, 22], s: .9, eyes: [[90, 96, 7], [112, 93, 7]], mouth: [101, 106], neck: [101, 113], ns: .85, ground: 184 },
  /* 7 Sevenstein */ { top: [92, 28], s: 1, eyes: [[76, 42, 8], [104, 42, 8]], mouth: [90, 58], neck: [90, 66], ns: 1, ground: 186 },
  /* 8 Chef Eight */ { top: [100, 25], s: .8, eyes: [[89, 58, 8], [111, 58, 8]], mouth: [100, 76], neck: [100, 98], ns: .9, ground: 186 },
  /* 9 Nine-ja (eyes in the mask) */ { top: [102, 26], s: .95, eyes: [[89, 86, 6], [115, 86, 6]], mouth: [102, 104], neck: [102, 128], ns: .9, ground: 182 }
];

// The face's frame: the middle of the eyes, their slant, half the distance between them, and the
// eye size, so a face piece is drawn once, level, with the eyes at (−e, 0) and (e, 0).
function face(a) {
  const [l, r] = a.eyes, cx = (l[0] + r[0]) / 2, cy = (l[1] + r[1]) / 2;
  return { cx, cy, rot: Math.atan2(r[1] - l[1], r[0] - l[0]) * 180 / Math.PI, e: Math.hypot(r[0] - l[0], r[1] - l[1]) / 2, r: (l[2] + r[2]) / 2 };
}
const onFace = (a, f) => { const F = face(a); return at(F.cx, F.cy, 1, f(F), F.rot); };
// Head pieces are drawn a size up from the neck and face pieces: they read from across the room.
const HAT = 1.2;
const onHead = (a, inner) => at(a.top[0], a.top[1], HAT * (a.s || 1), inner);
const onNeck = (a, inner) => at(a.neck[0], a.neck[1], a.ns || 1, inner);

/* ---------- the pieces ----------
   Head pieces are drawn with the brim's middle at (0, 0) and up as −y, at most about 44 tall, so
   a hat fits the hero's box. Neck pieces have the neck at (0, 0). */

// The golden Legend crowns and the champion badges come in each stratum's colors.
export const STRATA = [
  { id: "cellar", name: "Counting Cellar", c: "#b97a4a", dark: "#6e4127" },
  { id: "hall", name: "Balance Hall", c: "#5f86c8", dark: "#33497a" },
  { id: "mines", name: "Crystal Mines", c: "#9a5cff", dark: "#56309a" },
  { id: "tower", name: "Tables Tower", c: "#97a5aa", dark: "#566468" }
];
// Each stratum's emblem on its badge: the Cellar's +, the Hall's =, a Mines crystal, the Tower's ×.
const EMBLEM = {
  cellar: `<path d="M0 -6 V6 M-6 0 H6" stroke="${DK}" stroke-width="7" stroke-linecap="round"/><path d="M0 -6 V6 M-6 0 H6" stroke="${W}" stroke-width="3.5" stroke-linecap="round"/>`,
  hall: `<path d="M-6 -3 H6 M-6 3.5 H6" stroke="${DK}" stroke-width="6.5" stroke-linecap="round"/><path d="M-6 -3 H6 M-6 3.5 H6" stroke="${W}" stroke-width="3" stroke-linecap="round"/>`,
  mines: `<path d="M0 -8 L6 -2 L0 8 L-6 -2Z" fill="#ff7ad9" stroke="${DK}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-6 -2 H6" stroke="${DK}" stroke-width="1.5"/>`,
  tower: `<path d="M-5 -5 L5 5 M5 -5 L-5 5" stroke="${DK}" stroke-width="7" stroke-linecap="round"/><path d="M-5 -5 L5 5 M5 -5 L-5 5" stroke="${W}" stroke-width="3.5" stroke-linecap="round"/>`
};

const crown = (gems, band) => {
  const body = `<path d="M-26 4 L-30 -20 L-14 -8 L0 -28 L14 -8 L30 -20 L26 4Z"/>`;
  return fill(body, GOLD) + (band ? `<path d="M-26.5 -3 H26.5 V4 H-26.5Z" fill="${band}" stroke="${DK}" stroke-width="2.5"/>` : "")
    + `<circle cx="-30" cy="-21" r="3.5" fill="${GOLD}" stroke="${DK}" stroke-width="2"/><circle cx="0" cy="-29" r="3.5" fill="${GOLD}" stroke="${DK}" stroke-width="2"/><circle cx="30" cy="-21" r="3.5" fill="${GOLD}" stroke="${DK}" stroke-width="2"/>`
    + gems.map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${DK}" stroke-width="2"/>`).join("");
};
// The Legend crown: taller, five points with pearls, a band and gems in the stratum's color, and
// a glint, so it never reads as the plain crown.
const legendCrown = (st) => {
  const body = `<path d="M-30 6 L-34 -22 L-20 -10 L-11 -32 L0 -14 L11 -32 L20 -10 L34 -22 L30 6Z"/>`;
  return fill(body, GOLD)
    + `<path d="M-31 -3 H31 L30 6 H-30Z" fill="${st.c}" stroke="${DK}" stroke-width="2.5" stroke-linejoin="round"/>`
    + [[-34, -23], [-11, -33], [11, -33], [34, -23]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#fff6c8" stroke="${DK}" stroke-width="2"/>`).join("")
    + star(0, -18, 6, "#fff6c8")
    + [-18, 18].map((x) => `<path d="M${x} -2 l4 3.5 l-4 3.5 l-4 -3.5z" fill="${GOLD}" stroke="${DK}" stroke-width="1.5"/>`).join("")
    + `<path d="M0 -2 l5 3.5 l-5 4 l-5 -4z" fill="#fff6c8" stroke="${DK}" stroke-width="1.5"/>`
    + `<path d="M40 -36 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2z" fill="#fff6c8"/>`;
};
const badge = (st) => {
  const petals = Array.from({ length: 12 }, (_, i) => { const t = i * Math.PI / 6; return `<circle cx="${n(14 * Math.cos(t))}" cy="${n(14 * Math.sin(t))}" r="5"/>`; }).join("");
  return `<g transform="translate(0 12)">`
    + fill(`<path d="M-10 6 L-16 34 L-9 29 L-4 36 L0 10Z"/><path d="M10 6 L16 34 L9 29 L4 36 L0 10Z"/>`, st.c, 5)
    + fill(petals + `<circle r="14"/>`, st.c, 5)
    + `<circle r="11" fill="${GOLD}" stroke="${DK}" stroke-width="2.5"/><circle r="8" fill="${st.dark}"/>` + EMBLEM[st.id] + `</g>`;
};
// A cape, behind the hero: from the shoulders at the neck to just above the ground.
const cape = (a, c, lining, trim) => {
  const ns = a.ns || 1, h = (a.ground - a.neck[1] - 6) / ns;
  const s = `<path d="M-22 -6 Q0 2 22 -6 L50 ${n(h - 6)} Q0 ${n(h + 8)} -50 ${n(h - 6)}Z"/>`;
  return onNeck(a, fill(s, c, 8) + `<path d="M-22 -6 Q0 2 22 -6 L28 8 Q0 18 -28 8Z" fill="${lining}" opacity=".6"/>`
    + (trim ? `<path d="M50 ${n(h - 6)} Q0 ${n(h + 8)} -50 ${n(h - 6)}" stroke="${trim}" stroke-width="6" fill="none" stroke-linecap="round"/>` : ""));
};
// The cape's collar, in front: a band round the neck in the cape's color, with a gold brooch.
const collar = (c) => fill(`<path d="M-25 -8 Q0 4 25 -8 L23 1 Q0 13 -23 1Z"/>`, c, 5) + fill(`<circle cx="0" cy="3" r="6"/>`, GOLD, 4) + `<circle cx="-1.5" cy="1.5" r="2" fill="#fff6c8"/>`;

// Every piece: id, name (what the voice says when it's found: "Party hat!"), spot, tier (common,
// fancy or special: special pieces come only from achievements, never from a chest or the shop),
// a price hint in cents for the shop (special: none), and draw(anchor) → SVG over the hero; a cape
// also has back(anchor), drawn behind. cape: true marks pieces that replace Zeroic's own cape.
const P = (id, name, spot, tier, price, draw, more) => Object.assign({ id, name, say: name + "!", spot, tier, price, draw }, more || {});
export const CLOTHES = [
  /* ----- head ----- */
  P("partyhat", "Party hat", "head", "common", 40, (a) => onHead(a, at(0, 0, 1,
    fill(`<path d="M-19 4 L0 -32 L19 4 Q0 10 -19 4Z"/>`, CORAL)
    + `<circle cx="-6" cy="-3" r="3.5" fill="${GOLD}"/><circle cx="6" cy="-12" r="3.5" fill="${TEAL}"/><circle cx="-2" cy="-20" r="3" fill="${GOLD}"/><circle cx="9" cy="2" r="3" fill="${TEAL}"/>`
    + `<circle cx="0" cy="-33" r="5.5" fill="${GOLD}" stroke="${DK}" stroke-width="2.5"/>`, -10))),
  P("tophat", "Top hat", "head", "fancy", 90, (a) => onHead(a,
    fill(`<rect x="-17" y="-35" width="34" height="35" rx="3"/><ellipse cx="0" cy="0" rx="30" ry="7"/>`, "#2b2440")
    + `<rect x="-17" y="-12" width="34" height="7" fill="${CORAL}"/>`)),
  P("crown", "Crown", "head", "fancy", 99, (a) => onHead(a, crown([[0, -6, 4.5, CORAL], [-15, -3, 3, TEAL], [15, -3, 3, TEAL]]))),
  P("wizardhat", "Wizard hat", "head", "fancy", 85, (a) => onHead(a,
    fill(`<path d="M-22 0 Q-8 -12 -4 -26 Q0 -36 22 -38 Q8 -32 8 -22 Q10 -10 22 0Z"/><ellipse cx="0" cy="1" rx="34" ry="7"/>`, "#6a4ccf")
    + star(-1, -13, 5.5, GOLD) + star(11, -27, 3.2, GOLD) + `<circle cx="-14" cy="-4" r="2" fill="${GOLD}"/>`)),
  P("piratehat", "Pirate hat", "head", "fancy", 80, (a) => onHead(a,
    fill(`<path d="M-40 2 Q-36 -26 -14 -28 Q0 -40 14 -28 Q36 -26 40 2 Q0 -10 -40 2Z"/>`, "#2e2c3a")
    + `<path d="M-37 -2 Q0 -14 37 -2" stroke="${GOLD}" stroke-width="3" fill="none"/>`
    + `<path d="M-7 -12 L7 -4 M7 -12 L-7 -4" stroke="${W}" stroke-width="3" stroke-linecap="round"/><circle cx="0" cy="-21" r="6.5" fill="${W}"/><circle cx="-2.4" cy="-22" r="1.7" fill="${DK}"/><circle cx="2.4" cy="-22" r="1.7" fill="${DK}"/><rect x="-3" y="-16.5" width="6" height="3" rx="1" fill="${W}"/>`)),
  P("beanie", "Beanie", "head", "common", 35, (a) => onHead(a,
    fill(`<path d="M-26 2 Q-28 -30 0 -31 Q28 -30 26 2Z"/>`, TEAL)
    + fill(`<rect x="-28" y="-8" width="56" height="13" rx="5"/>`, "#2a9fb2", 4)
    + `<path d="M-18 -6 V3 M-9 -6 V3 M0 -6 V3 M9 -6 V3 M18 -6 V3" stroke="#1d7f90" stroke-width="2"/>`
    + fill(`<circle cx="0" cy="-33" r="8"/>`, W, 4))),
  P("cowboyhat", "Cowboy hat", "head", "fancy", 75, (a) => onHead(a,
    fill(`<path d="M-19 -2 Q-23 -30 -10 -33 Q0 -27 10 -33 Q23 -30 19 -2Z"/>`, "#b07b45")
    + `<path d="M-20 -8 Q0 -4 20 -8" stroke="#5a3a1c" stroke-width="5" fill="none"/>`
    + fill(`<path d="M-46 -8 Q-42 6 0 6 Q42 6 46 -8 Q30 0 0 -2 Q-30 0 -46 -8Z"/>`, "#b07b45", 5))),
  P("chefhat", "Chef's hat", "head", "common", 45, (a) => onHead(a,
    fill(`<rect x="-19" y="-14" width="38" height="17" rx="4"/><circle cx="-13" cy="-20" r="11"/><circle cx="0" cy="-26" r="13"/><circle cx="13" cy="-20" r="11"/>`, W)
    + `<path d="M-8 -12 V0 M0 -12 V0 M8 -12 V0" stroke="#c9c3b4" stroke-width="2"/>`)),
  P("headband", "Headband", "head", "common", 25, (a) => onHead(a,
    rim(`<path d="M-27 12 Q0 4 27 12"/>`, BLUE, 9) + `<path d="M-26 12 Q0 4 26 12" stroke="${W}" stroke-width="2.5" fill="none"/>`
    + rim(`<path d="M27 12 l12 9 M27 12 l15 0"/>`, BLUE, 5))),
  P("flowercrown", "Flower crown", "head", "fancy", 70, (a) => onHead(a,
    rim(`<path d="M-30 6 Q0 -6 30 6"/>`, "#5fae4a", 3)
    + [[-26, 3, PINK], [-13, -1, W], [0, -3, GOLD], [13, -1, "#c89bff"], [26, 3, PINK]].map(([x, y, c]) =>
      `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((t) => `<circle cx="${n(5 * Math.cos(t * Math.PI / 180))}" cy="${n(5 * Math.sin(t * Math.PI / 180))}" r="4.2" fill="${c}" stroke="${DK}" stroke-width="2"/>`).join("")}<circle r="3" fill="${c === GOLD ? CORAL : GOLD}" stroke="${DK}" stroke-width="1.5"/></g>`).join(""))),
  P("propellercap", "Propeller cap", "head", "fancy", 65, (a) => onHead(a,
    fill(`<path d="M-24 4 Q-25 -26 0 -26 Q25 -26 24 4Z"/>`, GOLD)
    + `<path d="M0 -26 Q-9 -12 -9 3 L-23 3 Q-24 -24 0 -26Z" fill="${CORAL}"/><path d="M0 -26 Q9 -12 9 3 L23 3 Q24 -24 0 -26Z" fill="${BLUE}"/>`
    + fill(`<path d="M16 1 Q36 -2 44 6 Q30 11 16 8Z"/>`, CORAL, 4)
    + `<path d="M0 -26 V-36" stroke="${DK}" stroke-width="3"/>`
    + `<ellipse cx="-10" cy="-37" rx="11" ry="3.5" fill="${CORAL}" stroke="${DK}" stroke-width="2"/><ellipse cx="10" cy="-37" rx="11" ry="3.5" fill="${BLUE}" stroke="${DK}" stroke-width="2"/><circle cx="0" cy="-37" r="3" fill="${GOLD}" stroke="${DK}" stroke-width="2"/>`)),
  P("bunnyears", "Bunny ears", "head", "common", 40, (a) => onHead(a,
    fill(`<ellipse cx="-13" cy="-20" rx="8.5" ry="18" transform="rotate(-16 -13 -2)"/><ellipse cx="13" cy="-20" rx="8.5" ry="18" transform="rotate(16 13 -2)"/>`, W)
    + `<ellipse cx="-13" cy="-20" rx="4" ry="12" transform="rotate(-16 -13 -2)" fill="${PINK}"/><ellipse cx="13" cy="-20" rx="4" ry="12" transform="rotate(16 13 -2)" fill="${PINK}"/>`
    + rim(`<path d="M-26 6 Q0 -6 26 6"/>`, PINK, 4))),

  /* ----- face ----- */
  P("glasses", "Round glasses", "face", "common", 30, (a) => onFace(a, ({ e, r }) =>
    `<circle cx="${-e}" cy="0" r="${r + 5}" fill="#bfe8ff" fill-opacity=".3"/><circle cx="${e}" cy="0" r="${r + 5}" fill="#bfe8ff" fill-opacity=".3"/>`
    + rim(`<circle cx="${-e}" cy="0" r="${r + 5}"/><circle cx="${e}" cy="0" r="${r + 5}"/><path d="M${n(-e + r + 5)} -1 Q0 -5 ${n(e - r - 5)} -1"/><path d="M${n(-e - r - 5)} -2 l-6 -2 M${n(e + r + 5)} -2 l6 -2"/>`, "#8a5a2a", 2.5))),
  P("sunglasses", "Sunglasses", "face", "common", 45, (a) => onFace(a, ({ e, r }) => {
    const lens = (x) => `<path d="M${n(x - r - 6)} ${n(-r + 1)} H${n(x + r + 6)} Q${n(x + r + 6)} ${n(r + 5)} ${x} ${n(r + 5)} Q${n(x - r - 6)} ${n(r + 5)} ${n(x - r - 6)} ${n(-r + 1)}Z"/>`;
    return fill(lens(-e) + lens(e), "#1e2a52", 4) + `<path d="M${n(-e + r + 4)} ${n(-r + 2)} H${n(e - r - 4)}" stroke="${DK}" stroke-width="3.5"/>`
      + `<path d="M${n(-e - r)} ${n(-r + 4)} l5 0 M${n(e - r)} ${n(-r + 4)} l5 0" stroke="#ffffffaa" stroke-width="2.5" stroke-linecap="round"/>`;
  })),
  P("starglasses", "Star glasses", "face", "fancy", 60, (a) => onFace(a, ({ e, r }) => {
    const R = r + 10, pts = (x) => Array.from({ length: 10 }, (_, i) => { const t = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? R * .55 : R; return `${n(x + q * Math.cos(t))} ${n(q * Math.sin(t))}`; }).join(" L");
    const s = (x) => `M${pts(x)}Z` + circ(x, 0, r + 2.5);
    return `<path d="${s(-e)} ${s(e)}" fill="${PINK}" fill-rule="evenodd" stroke="${DK}" stroke-width="2.5" stroke-linejoin="round"/>`
      + `<path d="M${n(-e + r * .55 + 4)} -2 H${n(e - r * .55 - 4)}" stroke="${DK}" stroke-width="3"/>`;
  })),
  P("monocle", "Monocle", "face", "fancy", 55, (a) => onFace(a, ({ e, r }) =>
    `<circle cx="${e}" cy="0" r="${r + 5}" fill="#bfe8ff" fill-opacity=".3"/>` + rim(`<circle cx="${e}" cy="0" r="${r + 5}"/>`, GOLD, 3)
    + `<path d="M${n(e + r + 4)} 4 q8 14 0 28" stroke="${GOLD}" stroke-width="2" fill="none" stroke-dasharray="3 2"/>`)),
  P("eyepatch", "Eye patch", "face", "common", 30, (a) => onFace(a, ({ e, r }) =>
    `<path d="M${n(-e - r - 16)} ${n(-r - 6)} L${n(e + r + 14)} ${n(-r - 12)}" stroke="${DK}" stroke-width="3"/>`
    + `<ellipse cx="${-e}" cy="1" rx="${r + 4}" ry="${r + 3}" fill="${DK}"/><ellipse cx="${-e - 2}" cy="-2" rx="${r * .5}" ry="${r * .3}" fill="#ffffff22"/>`)),
  P("mask", "Hero mask", "face", "fancy", 70, (a) => onFace(a, ({ e, r }) => {
    const x0 = -e - r - 9, x1 = e + r + 9, h = r + 6;
    const band = `M${n(x0)} ${n(-h + 2)} Q0 ${n(-h - 4)} ${n(x1)} ${n(-h + 2)} Q${n(x1 + 2)} ${n(h)} ${n(e)} ${n(h)} Q${n(e * .3)} ${n(h)} 0 ${n(h * .4)} Q${n(-e * .3)} ${n(h)} ${n(-e)} ${n(h)} Q${n(x0 - 2)} ${n(h)} ${n(x0)} ${n(-h + 2)}Z`;
    return `<path d="${band} ${circ(-e, 0, r + 1.5)} ${circ(e, 0, r + 1.5)}" fill="#3f5bd8" fill-rule="evenodd" stroke="${DK}" stroke-width="3" stroke-linejoin="round"/>`
      + `<path d="M${n(x1 - 1)} ${n(-h + 4)} l9 -5 M${n(x1 - 1)} ${n(-h + 6)} l10 3" stroke="#3f5bd8" stroke-width="3.5" stroke-linecap="round"/>`;
  })),
  P("mustache", "Mustache", "face", "common", 35, (a) => {
    const k = 1.25 * a.eyes[0][2] / 7;
    return at(a.mouth[0], a.mouth[1], k, fill(`<path d="M0 -2 Q-6 -7 -14 -4 Q-20 -1 -24 -6 Q-23 6 -11 5 Q-4 4 0 1 Q4 4 11 5 Q23 6 24 -6 Q20 -1 14 -4 Q6 -7 0 -2Z"/>`, "#6b4423", 4));
  }),

  /* ----- neck ----- */
  P("bowtie", "Bow tie", "neck", "common", 35, (a) => onNeck(a,
    fill(`<path d="M0 0 L-17 -10 Q-20 0 -17 10Z M0 0 L17 -10 Q20 0 17 10Z"/>`, CORAL, 5) + fill(`<rect x="-5" y="-5" width="10" height="10" rx="3"/>`, CORAL, 3)
    + `<path d="M-12 -4 L-12 4 M12 -4 L12 4" stroke="#c8343a" stroke-width="2"/>`)),
  P("scarf", "Scarf", "neck", "common", 45, (a) => onNeck(a,
    fill(`<path d="M8 2 L13 30 L24 27 L19 1Z"/>`, TEAL, 5) + `<path d="M13 30 l1 4 M18 29 l1 4 M23 28 l1 4" stroke="${DK}" stroke-width="2"/>`
    + fill(`<path d="M-26 -7 Q0 5 26 -7 L26 3 Q0 15 -26 3Z"/>`, TEAL, 5)
    + `<path d="M-14 -2 L-14 8 M0 1 L0 11 M14 -2 L14 8" stroke="${W}" stroke-width="3" opacity=".8"/>`)),
  P("medal", "Medal", "neck", "fancy", 80, (a) => onNeck(a,
    rim(`<path d="M-12 -6 L0 12 L12 -6"/>`, CORAL, 5) + fill(`<circle cx="0" cy="20" r="11"/>`, GOLD, 4) + star(0, 20, 6.5, "#fff6c8"))),
  P("necktie", "Necktie", "neck", "common", 40, (a) => onNeck(a,
    fill(`<path d="M-7 -5 H7 L5 5 H-5Z"/><path d="M-5 6 H5 L9 30 L0 40 L-9 30Z"/>`, BLUE, 4)
    + `<path d="M-6 14 L7 9 M-8 24 L8 18 M-6 33 L7 28" stroke="${W}" stroke-width="2.5" opacity=".8"/>`)),
  P("bandana", "Bandana", "neck", "common", 30, (a) => onNeck(a,
    fill(`<path d="M-24 -5 Q0 3 24 -5 L2 24 Q0 26 -2 24Z"/>`, CORAL, 5)
    + `<circle cx="-10" cy="2" r="2" fill="${W}"/><circle cx="8" cy="3" r="2" fill="${W}"/><circle cx="0" cy="12" r="2" fill="${W}"/><circle cx="-1" cy="-1" r="1.6" fill="${W}"/>`
    + fill(`<circle cx="-20" cy="-4" r="4"/>`, CORAL, 3))),
  P("cape", "Cape", "neck", "fancy", 95, (a) => onNeck(a, collar("#d8324a")), { cape: true, back: (a) => cape(a, "#d8324a", "#7a1424") }),

  /* ----- special: only from achievements (DESIGN.md §14.2) ----- */
  ...STRATA.map((st) => P("badge-" + st.id, st.name + " Champion badge", "neck", "special", null, (a) => onNeck(a, badge(st)), { stratum: st.id, achievement: "champion" })),
  ...STRATA.map((st) => P("legend-" + st.id, st.name + " Legend crown", "head", "special", null, (a) => onHead(a, legendCrown(st)), { stratum: st.id, achievement: "legend" })),
  P("champcape", "Champion of Champions cape", "neck", "special", null,
    (a) => onNeck(a, fill(`<path d="M-30 -9 Q-16 2 0 -2 Q16 2 30 -9 Q36 4 26 11 Q13 18 0 13 Q-13 18 -26 11 Q-36 4 -30 -9Z"/>`, GOLD, 5)
      + `<path d="M-26 -2 Q-13 7 0 4 Q13 7 26 -2" stroke="${GOLD2}" stroke-width="2.5" fill="none"/>` + star(0, 6, 9, "#fff6c8")),
    { cape: true, achievement: "champions", back: (a) => cape(a, "#6a3fc0", "#3a1f78", GOLD) })
];
export const SPOTS = ["head", "face", "neck"];
export const clothesById = Object.fromEntries(CLOTHES.map((p) => [p.id, p]));
// The pieces that can be found in a chest or bought (everything but the special ones).
export const findable = () => CLOTHES.filter((p) => p.tier !== "special");

// What a hero is wearing, as pieces: { head, face, neck } of ids → the pieces, each only in its
// own spot (an unknown id, or a piece in the wrong spot, is left off).
export function outfit(wear) {
  const o = {};
  for (const s of SPOTS) { const p = wear && clothesById[wear[s]]; if (p && p.spot === s) o[s] = p; }
  return o;
}
// Drawing an outfit on hero d: what goes behind the hero (capes), what goes over it, and which of
// the hero's own things to leave off (off: hat, mask, cape; heroSvg passes it to the hero's draw).
// A head piece replaces the hero's own hat (Twodini's top hat, Chef Eight's toque, High Five's
// sweatband, Sir Fourtress's plume; the helmet stays), a face piece Zeroic's mask (Nine-ja keeps
// the mask his eyes are in), and a cape Zeroic's own cape.
export function wearSvg(d, wear) {
  const a = HERO_ANCHOR[d], o = outfit(wear), back = [], front = [];
  for (const s of ["neck", "head", "face"]) { const p = o[s]; if (!p) continue; if (p.back) back.push(p.back(a)); front.push(p.draw(a)); }
  return { back: back.join(""), front: front.join(""), off: { hat: !!o.head, mask: !!o.face, cape: !!(o.neck && o.neck.cape) } };
}

// A piece on its own (the gallery, and later the clothing bag), drawn on a stand-in head: its
// own square box, no hero.
const ALONE = { top: [50, 74], s: .8, eyes: [[38, 50, 7], [62, 50, 7]], mouth: [50, 60], neck: [50, 22], ns: 1, ground: 98 };
export function pieceSvg(id, cls) {
  const p = clothesById[id];
  if (!p) return "";
  const a = p.spot === "neck" && !p.back ? Object.assign({}, ALONE, { neck: [50, 36], ns: 1.5 }) : p.spot === "face" ? Object.assign({}, ALONE, { eyes: [[34, 50, 9], [66, 50, 9]], mouth: [50, 50] }) : ALONE;
  return `<svg viewBox="0 0 100 100" class="${cls || ""}" role="img" aria-label="${p.name}">${defs}${p.back ? p.back(a) : ""}${p.draw(a)}</svg>`;
}
