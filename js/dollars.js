// Dollars (2nd grade, 2.MD.C.8: dollar bills, and bills with coins, using $ and ¢): a prototype
// for the review page (review/proto/); nothing in the game reads it yet. No DOM: runs in Node.
//
// The bills are drawn stylized, to stay well inside the US rules on illustrations of currency
// (31 CFR 411, 18 U.S.C. 504): the front only, in one green tint and an outline, never near real
// size (on a phone a bill here is about 100 px wide, far under 75% of a real one), and no text but
// the numerals: no serial numbers, seals, signatures or Treasury lettering. The portraits are the
// coins' own traces (js/coins.js, from public-domain US Mint photos): Washington on the $1 (the
// quarter's) and Lincoln on the $5 (the penny's). Hamilton ($10) and Jackson ($20) have no trace
// yet, so they show a plain stand-in bust until theirs are traced.
import { BUSTS, COINS, coinOf, coinsSvg, coinWords } from "./coins.js";
import { spoken } from "./problems.js";

const DK = "#0c171c", GOLD = "#ffc93c";
// One green tint, in three strengths, and the ink.
const G = { paper: "#cfe6c4", band: "#a9cf9a", ink: "#3f6b3a" };
export const BILLS = [20, 10, 5, 1];
const PORTRAIT = { 1: "q", 5: "p" };
const f1 = (n) => Math.round(n * 10) / 10;

// A bill, w wide (its height is w ÷ 2.35, a real bill's shape), at (x, y).
export const BILL = { w: 100, h: f1(100 / 2.35) };
export function billSvg(v, x = 0, y = 0, opt = {}) {
  const { w, h } = BILL, id = `b${v}${Math.round(x)}${Math.round(y)}`;
  const cx = x + w / 2, cy = y + h / 2, rx = 15, ry = 17;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${G.paper}" stroke="${DK}" stroke-width="2.5"/>`;
  s += `<rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" rx="2" fill="none" stroke="${G.ink}" stroke-width="1.2"/>`;
  // Light bands each side of the portrait.
  s += `<rect x="${x + 6}" y="${cy - 4}" width="${w / 2 - rx - 10}" height="8" rx="4" fill="${G.band}"/><rect x="${cx + rx + 4}" y="${cy - 4}" width="${w / 2 - rx - 10}" height="8" rx="4" fill="${G.band}"/>`;
  // The portrait in its oval: a coin's traced bust, or a plain stand-in.
  s += `<clipPath id="${id}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${G.band}" stroke="${G.ink}" stroke-width="1.5"/>`;
  const bust = PORTRAIT[v];
  if (bust) {
    const k = (ry * 2.3) / 200;
    s += `<g clip-path="url(#${id})"><path transform="translate(${f1(cx - 100 * k)} ${f1(cy - 110 * k)}) scale(${k.toFixed(3)})" d="${BUSTS[bust]}" fill="${G.ink}"/></g>`;
  } else {
    s += `<g clip-path="url(#${id})" fill="${G.ink}"><circle cx="${cx}" cy="${cy - 4}" r="6.5"/><path d="M${cx - 13} ${cy + 18}C${cx - 12} ${cy + 6} ${cx - 6} ${cy + 3} ${cx} ${cy + 3}C${cx + 6} ${cy + 3} ${cx + 12} ${cy + 6} ${cx + 13} ${cy + 18}Z"/></g>`;
  }
  // The numerals, in the corners (and nothing else written on it).
  const num = (nx, ny, size) => `<text x="${f1(nx)}" y="${f1(ny)}" dy=".36em" text-anchor="middle" font-family="Bungee, sans-serif" font-size="${size}" fill="${G.ink}">${v}</text>`;
  s += num(x + 13, y + 12, 9) + num(x + w - 13, y + 12, 9) + num(x + 13, y + h - 12, 9) + num(x + w - 13, y + h - 12, 9);
  if (opt.ring) s += `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="5" fill="none" stroke="${GOLD}" stroke-width="3"/>`;
  return s;
}

// A problem.
// - bills: 2 to 5 bills, biggest first, up to $60: "How many dollars?" { bills, ans }.
// - mixed: 1 to 3 bills and 1 to 4 coins: { bills, coins, ans: [dollars, cents] }.
export const DOLLAR_LEVELS = [
  { id: "bills", name: "Dollar bills", grade: "2nd", stratum: "mines" },
  { id: "mixed", name: "Bills and coins", grade: "2nd", stratum: "mines" }
];
export function dollarProblem(id, rnd = Math.random) {
  for (;;) {
    const n = id === "bills" ? 2 + Math.floor(rnd() * 4) : 1 + Math.floor(rnd() * 3);
    const bills = Array.from({ length: n }, () => BILLS[Math.floor(rnd() * BILLS.length)]).sort((a, b) => b - a);
    const dollars = bills.reduce((t, b) => t + b, 0);
    if (dollars > 60 || new Set(bills).size === 1 && n > 3) continue;
    if (id === "bills") return { kind: "bills", bills, ans: dollars };
    const coins = { q: 0, d: 0, n: 0, p: 0 }, m = 1 + Math.floor(rnd() * 4);
    for (let i = 0; i < m; i++) coins[COINS[Math.floor(rnd() * 4)].k]++;
    const cents = COINS.reduce((t, c) => t + coins[c.k] * c.v, 0);
    if (cents >= 100) continue;
    return { kind: "mixed", bills, coins, ans: [dollars, cents] };
  }
}
// The coins biggest first, as a list of values.
const coinValues = (coins) => COINS.flatMap((c) => Array.from({ length: coins[c.k] }, () => c.v));
// Running totals, biggest first: 20, 25, 26.
export const runningTotals = (vals) => vals.map((_, i) => vals.slice(0, i + 1).reduce((t, v) => t + v, 0));

// The picture: the bills in a row (wrapping to a second row past 3), and the coins under them.
// opt.hint: a running total under each bill (and each coin), the last "?" until worked.
export function dollarSvg(p, opt = {}) {
  const per = 3, gap = 8, rows = Math.ceil(p.bills.length / per), lab = opt.hint ? 16 : 0;
  const W = per * BILL.w + (per - 1) * gap;
  let s = "", y = 0;
  const run = runningTotals(p.bills);
  for (let r = 0; r < rows; r++) {
    const row = p.bills.slice(r * per, r * per + per), x0 = (W - (row.length * BILL.w + (row.length - 1) * gap)) / 2;
    row.forEach((v, i) => {
      const k = r * per + i, x = x0 + i * (BILL.w + gap);
      s += billSvg(v, x, y);
      if (opt.hint) s += `<text x="${f1(x + BILL.w / 2)}" y="${f1(y + BILL.h + 13)}" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="13" fill="${GOLD}">${k === p.bills.length - 1 && !opt.worked ? "$?" : "$" + run[k]}</text>`;
    });
    y += BILL.h + gap + lab;
  }
  let coinsPart = "";
  if (p.coins) {
    const c = coinsSvg(p.coins, opt.hint ? { labels: true } : {});
    const [, cw, ch] = c.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).map(Number);
    const k = Math.min(1.25, W / cw), inner = c.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
    coinsPart = `<g transform="translate(${f1((W - cw * k) / 2)} ${f1(y + 4)}) scale(${k})">${inner}</g>`;
    // Under each coin, the hint counts on in cents.
    y += ch * k + 8;
    if (opt.hint) {
      const vals = coinValues(p.coins), run2 = runningTotals(vals);
      coinsPart += `<text x="${W / 2}" y="${f1(y + 6)}" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="13" fill="${GOLD}">${vals.length > 1 ? run2.slice(0, -1).join(", ") + ", " : ""}${opt.worked ? run2[run2.length - 1] : "?"}¢</text>`;
      y += 16;
    }
  }
  return `<svg viewBox="-4 -4 ${W + 8} ${f1(y + 4)}" class="money" role="img" aria-label="${moneyWords(p)}">${s}${coinsPart}</svg>`;
}
// "two twenty-dollar bills and a five-dollar bill"
const BILL_WORD = { 20: "twenty-dollar bill", 10: "ten-dollar bill", 5: "five-dollar bill", 1: "one-dollar bill" };
export function moneyWords(p) {
  const parts = BILLS.filter((b) => p.bills.includes(b)).map((b) => { const n = p.bills.filter((x) => x === b).length; return n === 1 ? "a " + BILL_WORD[b] : spoken(n) + " " + BILL_WORD[b] + "s"; });
  const list = parts.length > 1 ? parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1] : parts[0];
  return p.coins ? list + ", and " + coinWords(p.coins) : list;
}

// What the voice says, and the answer said after a miss: "Two dollars and twenty-five cents."
export const spokenDollars = (p) => (p.kind === "bills" ? "How many dollars?" : "How much money? Dollars, then cents.");
export function sayMoney(d, c) {
  const ds = d === 1 ? "one dollar" : spoken(d) + " dollars";
  if (c == null) return cap(ds) + ".";
  return cap(ds) + " and " + (c === 1 ? "one cent" : spoken(c) + " cents") + ".";
}
const cap = (t) => t[0].toUpperCase() + t.slice(1);
export const moneyText = (p) => (p.kind === "bills" ? `$${p.ans}` : `$${p.ans[0]} and ${p.ans[1]}¢`);

// The hint: count on from the biggest bill, then the coins as cents.
export function dollarHint(p, worked) {
  const run = runningTotals(p.bills), end = (list) => (worked ? list.join(", ") : list.slice(0, -1).concat("?").join(", "));
  let say = `Count on from the biggest bill: ${end(run)} dollars.`;
  if (p.coins) say += ` Then the coins: ${end(runningTotals(coinValues(p.coins)))} cents.`;
  return { say };
}
