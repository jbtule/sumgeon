// The art for chests and money (DESIGN.md §6.3), in the house style (monsters.js solid and line:
// a dark outline, a fill, a white sheen). No DOM: SVG strings, so it runs in Node.
// The padlock with its problem is HTML over the chest (app.js), so any problem fits in it.
import { DK, solid, line, MON } from "./monsters.js";
import { coinsSvg, COINS } from "./coins.js";
import { fewest } from "./loot.js";

// Its own sheen gradient (id "shc"), so it never depends on another drawing's <defs> on the page.
const DEFS = `<defs><linearGradient id="shc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
const sheen = (s) => s.replace(/url\(#sh\)/g, "url(#shc)");
const WOOD = "#a8642a", LID = "#bd7838", BAND = "#ffc93c", INSIDE = "#3a1f0e";

// A treasure chest: shut (state "locked" or "jammed") or open ("open"), 200 × 180.
export function chestSvg(state) {
  const open = state === "open";
  let s = `<ellipse cx="100" cy="166" rx="86" ry="9" fill="#0005"/>`;
  if (open) {
    // The lid thrown back, its inside showing; a glow rising out of the chest.
    s += sheen(solid(`<path d="M30 82 L40 26 Q100 6 160 26 L170 82 Z"/>`, LID));
    s += `<path d="M44 76 L52 34 Q100 18 148 34 L156 76 Z" fill="${INSIDE}" opacity=".55"/>`;
    s += sheen(line(`<path d="M60 30 L54 80M140 30 L146 80"/>`, BAND, 7));
    s += `<ellipse cx="100" cy="84" rx="70" ry="12" fill="#ffe9a0" opacity=".9"/><ellipse cx="100" cy="80" rx="58" ry="26" fill="#fff6c8" opacity=".35"/>`;
  }
  s += sheen(solid(`<rect x="24" y="82" width="152" height="74" rx="8"/>`, WOOD));
  // Boards on the front, and the gold bands.
  s += `<path d="M30 107H170M30 131H170" stroke="${DK}" stroke-width="2.5" opacity=".35"/>`;
  s += sheen(line(`<path d="M56 86V152M144 86V152"/>`, BAND, 8));
  if (!open) {
    s += sheen(solid(`<path d="M24 86 V60 Q24 30 100 30 Q176 30 176 60 V86 Z"/>`, LID));
    s += sheen(line(`<path d="M56 34V84M144 34V84"/>`, BAND, 8));
    s += sheen(line(`<path d="M28 86H172"/>`, BAND, 7));
  } else s += sheen(line(`<path d="M28 86H172"/>`, BAND, 7));
  // The hasp the padlock hangs from.
  s += sheen(solid(`<rect x="88" y="76" width="24" height="22" rx="5"/>`, BAND));
  return `<svg class="chest-art${open ? " open" : ""}" viewBox="0 0 200 180" aria-hidden="true">${DEFS}${s}</svg>`;
}

// The Pie item (loot.js): a whole pie in its tin, a golden crimped crust, with a bold π cut into
// the top crust the way bakers cut vents, the cherry filling showing through. Drawn to read at a
// quick-use slot's size (about 32 px). 100 × 80.
export function pieSvg() {
  const tin = sheen(solid(`<path d="M6 44 L15 68 Q50 78 85 68 L94 44 Z"/>`, "#9aa8ae"));
  const crust = sheen(solid(`<ellipse cx="50" cy="42" rx="45" ry="23"/>`, "#e9a94f"))
    + `<ellipse cx="50" cy="42" rx="39" ry="18.5" fill="none" stroke="#f8d38a" stroke-width="7" stroke-dasharray="5 5"/>`
    + `<ellipse cx="50" cy="42" rx="39" ry="18.5" fill="none" stroke="#b9722c" stroke-width="1.5" opacity=".6"/>`;
  // The π: a top bar and two legs (the right one curling out), cut deep, filling showing.
  const pi = `<path d="M31 35 Q50 30 69 34 M42 35 Q42 46 36 51 M58 35 Q57 47 59 50 Q61 52 64 50"/>`;
  const vent = `<g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="${DK}" stroke-width="11">${pi}</g><g stroke="#b3263a" stroke-width="6">${pi}</g></g>`;
  return `<svg class="pie-art" viewBox="0 0 100 80" role="img" aria-label="Pie">${DEFS}${tin}${crust}${vent}</svg>`;
}

// A coin purse (the start and pause screens' button): a round pouch with a clasp.
export function purseSvg() {
  const s = sheen(solid(`<path d="M14 30 Q12 58 40 60 Q68 58 66 30 Q64 20 40 20 Q16 20 14 30 Z"/>`, "#c0533f"))
    + sheen(line(`<path d="M22 22 Q22 10 34 12M58 22 Q58 10 46 12"/>`, BAND, 5))
    + `<circle cx="34" cy="12" r="4" fill="${BAND}" stroke="${DK}" stroke-width="2.5"/><circle cx="46" cy="12" r="4" fill="${BAND}" stroke="${DK}" stroke-width="2.5"/>`
    + `<path d="M22 36 Q40 44 58 36" fill="none" stroke="${DK}" stroke-width="2.5" opacity=".4"/>`;
  return `<svg class="purse-art" viewBox="0 0 80 66" aria-hidden="true">${DEFS}${s}</svg>`;
}

// A $1 bill, drawn simply: green paper, a frame, an oval portrait spot and "1" in the corners.
export function billSvg(label) {
  return `<svg class="bill" viewBox="0 0 120 56" aria-hidden="true"><rect x="3" y="3" width="114" height="50" rx="5" fill="#9fcf8c" stroke="${DK}" stroke-width="3"/>
    <rect x="10" y="9" width="100" height="38" rx="3" fill="none" stroke="#3f7a3a" stroke-width="2"/>
    <ellipse cx="60" cy="28" rx="14" ry="16" fill="#cfe8c2" stroke="#3f7a3a" stroke-width="2"/>
    <text x="17" y="24" font-family="Bungee,sans-serif" font-size="13" fill="#2c5a29">1</text><text x="96" y="44" font-family="Bungee,sans-serif" font-size="13" fill="#2c5a29">1</text>
    ${label ? `<text x="60" y="35" text-anchor="middle" font-family="Bungee,sans-serif" font-size="20" fill="#2c5a29">${label}</text>` : ""}</svg>`;
}

// The wallet as money, never just a number: the fewest $1 bills and coins (quarters, dimes,
// nickels, pennies). Up to 5 bills are drawn; more show as one bill marked "$7".
export const BILLS_DRAWN = 5;
export function walletSvg(cents) {
  const f = fewest(cents), coins = { q: f.q, d: f.d, n: f.n, p: f.p };
  let bills = "";
  if (f.bills > BILLS_DRAWN) bills = `<div class="bills one">${billSvg("$" + f.bills)}</div>`;
  else if (f.bills) bills = `<div class="bills">${Array.from({ length: f.bills }, () => billSvg()).join("")}</div>`;
  const rest = f.q + f.d + f.n + f.p ? `<div class="wcoins">${coinsSvg(coins)}</div>` : "";
  return bills + rest;
}
// The purse button's little summary: one coin (or bill) of each kind there is, with how many.
export function walletMini(cents) {
  const f = fewest(cents), out = [];
  if (f.bills) out.push(`<span class="wm">${billSvg()}<b>${f.bills}</b></span>`);
  COINS.forEach((t) => { if (f[t.k]) out.push(`<span class="wm">${coinsSvg([{ k: t.k }])}<b>${f[t.k]}</b></span>`); });
  return out.join("");
}

/* ---------- Trollar's shop (DESIGN.md §6.3, shop.js) ---------- */
// Trollar's stall by the Sumgeon's door (the start scene, descent.js surfaceHTML): a striped
// awning on two posts, Trollar behind a wooden counter with a gold ¢ sign. 200 × 210.
export function stallSvg() {
  const troll = MON.find((m) => m.n === "Trollar");
  const post = sheen(solid(`<rect x="16" y="36" width="13" height="166" rx="4"/><rect x="171" y="36" width="13" height="166" rx="4"/>`, "#8a5a2e"));
  // Trollar, smaller, standing behind the counter: his head and the top of his S show over it.
  const him = `<g transform="translate(46 54) scale(.54)">${sheen(troll.d(troll.c))}</g>`;
  const counter = sheen(solid(`<rect x="10" y="136" width="180" height="64" rx="6"/>`, WOOD))
    + `<path d="M14 158H186M14 180H186" stroke="${DK}" stroke-width="2.5" opacity=".35"/>`
    + sheen(solid(`<rect x="2" y="126" width="196" height="14" rx="5"/>`, LID))
    + sheen(solid(`<circle cx="100" cy="170" r="17"/>`, BAND))
    + `<text x="100" y="179" text-anchor="middle" font-family="Bungee,sans-serif" font-size="24" fill="${DK}">¢</text>`
    // A few coins on the counter.
    + `<ellipse cx="150" cy="126" rx="10" ry="4" fill="#c9d3d8" stroke="${DK}" stroke-width="2.5"/><ellipse cx="160" cy="121" rx="9" ry="3.6" fill="#d08347" stroke="${DK}" stroke-width="2.5"/>`;
  // The awning: stripes in coral and chalk, each with a scalloped bottom edge.
  let awn = sheen(solid(`<rect x="0" y="10" width="200" height="14" rx="6"/>`, "#c8343a"));
  for (let i = 0; i < 8; i++) {
    const x = i * 25;
    awn += sheen(solid(`<path d="M${x} 20 H${x + 25} V48 Q${x + 12.5} 66 ${x} 48 Z"/>`, i % 2 ? "#f3efe4" : "#ff5a4e"));
  }
  return `<svg class="stall-art" viewBox="-6 -4 212 220" aria-hidden="true">${DEFS}<ellipse cx="100" cy="204" rx="104" ry="9" fill="#0005"/>${post}${him}${counter}${awn}</svg>`;
}
// A price as money: the fewest coins (or a bill) for it, small, over "35¢".
export function priceTag(c) {
  const f = fewest(c), coins = { q: f.q, d: f.d, n: f.n, p: f.p };
  const bills = f.bills ? Array.from({ length: f.bills }, () => billSvg()).join("") : "";
  return `<span class="ptag"><span class="pcoins">${bills}${f.q + f.d + f.n + f.p ? coinsSvg(coins) : ""}</span><b>${c}¢</b></span>`;
}
