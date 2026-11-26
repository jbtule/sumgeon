// The art for chests and money (DESIGN.md §6.3), in the house style (monsters.js solid and line:
// a dark outline, a fill, a white sheen). No DOM: SVG strings, so it runs in Node.
// The padlock with its problem is HTML over the chest (app.js), so any problem fits in it.
import { DK, solid, line } from "./monsters.js";
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
