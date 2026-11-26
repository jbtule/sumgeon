// Dollars (2nd grade, 2.GM.D.12 in the Missouri Learning Standards: dollar bills, and bills with
// coins, using $ and ¢), in the game (Trollar's coin strand in the Mines) and on the review page
// (review/proto/). No DOM: runs in Node.
//
// The bills are drawn stylized, to stay well inside the US rules on illustrations of currency
// (31 CFR 411, 18 U.S.C. 504): the front only, in one green tint and an outline, never near real
// size (on a phone a bill here is about 100 px wide, far under 75% of a real one), and no text but
// the numerals: no serial numbers, seals, signatures or Treasury lettering. The portraits: the
// coins' own traces (js/coins.js, from public-domain US Mint photos) for Washington on the $1 (the
// quarter's) and Lincoln on the $5 (the penny's), and for Hamilton ($10) and Jackson ($20) line
// drawings made by hand over the Bureau of Engraving and Printing's engraved portraits (public
// domain, on Wikimedia Commons), in the same style: ink outlines, no tones (DRAWN below;
// design/bills/README.md has how).
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
  // The portrait in its oval.
  s += `<clipPath id="${id}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${G.band}" stroke="${G.ink}" stroke-width="1.5"/>`;
  // The coins' busts are filled line shapes in a 200 box; the drawn ones are strokes in the same box.
  const k = (ry * 2.3) / 200, at = `transform="translate(${f1(cx - 100 * k)} ${f1(cy - 110 * k)}) scale(${k.toFixed(3)})"`;
  const bust = PORTRAIT[v], d = DRAWN[v];
  s += `<g clip-path="url(#${id})">`;
  if (bust) s += `<path ${at} d="${BUSTS[bust]}" fill="${G.ink}"/>`;
  else s += `<g ${at} fill="none" stroke="${G.ink}" stroke-linecap="round" stroke-linejoin="round"><path d="${d.line}" stroke-width="3.4"/><path d="${d.fine}" stroke-width="2.2"/></g>`;
  s += `</g>`;
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
      // Before answering, only the first bills' totals (countedOf), then "?" under the last.
      const label = k < countedOf(p.bills.length, opt.worked) ? "$" + run[k] : k === p.bills.length - 1 ? "$?" : "";
      if (opt.hint && label) s += `<text x="${f1(x + BILL.w / 2)}" y="${f1(y + BILL.h + 13)}" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="13" fill="${GOLD}">${label}</text>`;
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
      const vals = coinValues(p.coins), run2 = runningTotals(vals), upto = countedOf(vals.length, opt.worked);
      const said = opt.worked ? run2.join(", ") : run2.slice(0, upto).concat(vals.length > 1 ? "… ?" : "?").join(", ");
      coinsPart += `<text x="${W / 2}" y="${f1(y + 6)}" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="13" fill="${GOLD}">${said}¢</text>`;
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
// The answer as shown: "$26", "$3 and 25¢" (a game fact keeps its two answers in slots).
export const moneyText = (p) => { const a = p.slots || p.ans; return p.kind === "bills" ? `$${a}` : `$${a[0]} and ${a[1]}¢`; };

// The hint: count on from the biggest bill, then the coins as cents. Before answering it counts
// only part of the way (countedOf: the first of 2 or 3, half of more), then "…" and "?", so the
// last step is never the answer; worked, every total.
export const countedOf = (n, worked) => (worked ? n : n <= 1 ? 0 : n <= 3 ? 1 : Math.floor(n / 2));
export function dollarHint(p, worked) {
  const run = runningTotals(p.bills), end = (list) => (worked ? list.join(", ") : list.slice(0, countedOf(list.length, false)).concat(list.length > 1 ? "… ?" : "?").join(", "));
  let say = `Count on from the biggest bill: ${end(run)} dollars.`;
  if (p.coins) say += ` Then the coins: ${end(runningTotals(coinValues(p.coins)))} cents.`;
  return { say };
}

/* ---------- the game's facts (Trollar's counting strand in the Mines, learn.js BANDS.coins) ----------
   Fixed samples, so 70% of a level can be learned and every problem is recorded. Keys:
   - "$20,5,1": how many dollars? (the bills, biggest first).
   - "$10,1+0,1,0,2": bills and coins (quarters, dimes, nickels, pennies), typed in two slots:
     the dollars, then the cents ("$□ and □¢"). Never as a decimal ($3.25 is 4th grade).
   A fact: { op: "$", set, kind, bills, coins?, ans, slots?, key, q }. Bills alone: the answer and
   the damage are the dollars. Bills and coins: slots [dollars, cents], and the damage is the cents,
   the last slot typed (as a whole time hits for its minutes). */
export function dollarFact(bills, coins) {
  const dollars = bills.reduce((t, b) => t + b, 0), b = bills.slice().sort((x, y) => y - x);
  if (!coins) return { op: "$", set: "bills", kind: "bills", bills: b, ans: dollars, key: "$" + b.join(","), q: "$□" };
  const cents = COINS.reduce((t, c) => t + coins[c.k] * c.v, 0);
  return { op: "$", set: "mixed", kind: "mixed", bills: b, coins: { ...coins }, slots: [dollars, cents], ans: cents,
    key: "$" + b.join(",") + "+" + [coins.q, coins.d, coins.n, coins.p].join(","), q: "$□ and □¢" };
}
export function dollarFactOf(key) {
  const [b, c] = key.slice(1).split("+"), bills = b.split(",").map(Number);
  if (!c) return dollarFact(bills);
  const [q, d, n, p] = c.split(",").map(Number);
  return dollarFact(bills, { q, d, n, p });
}
// The levels the game asks, after counting coins (COIN_LEVELS).
export const DOLLAR_GAME_LEVELS = [
  { name: "Dollar bills", set: "bills" },
  { name: "Bills and coins", set: "mixed" }
];
function seeded(seed) { let s = seed; return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648; }
let factCache = null;
export function dollarFacts() {
  if (factCache) return factCache;
  const out = [], seen = new Set();
  for (const lv of DOLLAR_LEVELS) {
    const rnd = seeded(lv.id === "bills" ? 515 : 616);
    for (let n = 0, guard = 0; n < 24 && guard < 5000; guard++) {
      const p = dollarProblem(lv.id, rnd), f = dollarFact(p.bills, p.coins);
      if (seen.has(f.key)) continue;
      seen.add(f.key); out.push(f); n++;
    }
  }
  return (factCache = out);
}
// The line on screen, in parts (null for each slot): "$□", "$□ and □¢".
export const dollarLine = (f) => (f.kind === "bills" ? ["$", null] : ["$", null, " and ", null, "¢"]);
// Said after a miss: "Twenty-six dollars.", "Eleven dollars and twenty cents."
export const spokenDollarAnswer = (f) => (f.kind === "bills" ? sayMoney(f.ans) : sayMoney(f.slots[0], f.slots[1]));

// Hamilton and Jackson, drawn by hand over the engravings (design/bills/README.md): strokes in the
// coins' 200 box, line for the outlines, fine for the details.
export const DRAWN = {
  10: {
    line: "M124 59 C127 65 129 72 130 78 C131 82 131 85 132 89 C134 94 137 97 137 100 C136 103 133 104 131 104 C130 106 130 107 131 109 C129 110 128 111 128 112 C130 113 131 115 130 117 C129 119 129 120 130 122 C131 126 130 129 127 131 C124 134 120 135 116 136 M88 103 C92 116 100 128 110 134 C112 135 114 136 116 136 M86 89 C80 87 76 92 78 97 C79 101 83 104 88 103 M124 59 Q127.9 53 122 49 Q121.5 41.5 114 41 Q110.9 33.6 103 35 Q97.4 29.5 91 34 Q84.2 30.1 79 36 Q71.1 34.6 68 42 Q60.5 42.5 60 50 Q52.7 52.4 54 60 Q47.3 63.8 50 71 C49 80 50 90 54 98 C58 103 62 106 66 108 M124 60 Q119.5 63.5 116 59 Q113.8 64.6 108 63 Q108.9 69.1 103 71 Q104 77.4 98 80 Q97.1 86 91 86 Q90.6 90.9 86 89 M80 102 C76 105 72 107 66 108 L64 116 M56 100 C50 96 46 100 49 104 C52 106 55 103 56 100 C58 96 63 96 62 101 C61 104 58 104 56 100 M55 103 C52 116 48 128 44 140 M57 103 C56 116 54 128 52 140 M64 116 C82 127 100 136 113 141 C115 144 115 147 113 150 M113 150 C118 154 120 158 122 164 C124 170 128 176 132 184 M30 160 C40 142 52 126 64 116 C80 138 100 152 110 160 C116 172 124 186 136 198 M98 177a3 3 0 1 0 6 0a3 3 0 1 0 -6 0",
    fine: "M116 80 C119 78 123 78 127 80 M119 84 C121 82 124 82 126 84 C124 85 121 85 119 84 M122 111 C124 112 126 112 128 112 M83 92 C81 95 82 98 85 99 M70 50 C74 46 80 48 79 53 C78 56 74 56 74 53 M92 42 C97 39 103 42 101 47 C100 50 96 49 97 46 M62 66 C66 62 72 64 71 69 C70 72 66 72 66 69 M78 64 C82 60 88 62 87 67 C86 70 82 70 82 67 M58 82 C60 88 62 94 66 98 M110 160 C112 170 114 182 116 196"
  },
  20: {
    line: "M83 70 C82 80 82 92 85 101 C88 110 93 117 100 121 C104 123 108 123 112 121 C118 116 122 108 125 100 C127 93 128 86 128 78 M82 96 Q74 97 70 92 Q65 89 66 85 Q63.6 79.5 66 74 Q64.1 68.3 67 63 Q66.8 57.1 71 53 Q72.7 47.4 78 45 Q81.2 40 87 39 Q91.3 35.2 97 36 C98 31 102 28 108 28 C105 30 104 32 104 35 Q109 33.7 113 37 Q118.1 36.9 121 41 Q125.7 42.3 127 47 Q131.1 49.9 131 55 Q134.7 57.6 134 62 C137 64 139 68 138 71 C134 72 131 75 130 80 M92 80 C96 78 101 78 105 80 M112 80 C116 78 120 78 124 80 M108 88 C108 92 107 95 107 98 C109 100 113 100 115 98 M89 112 C88 116 88 120 90 124 C96 128 104 130 112 128 C116 126 120 124 122 120 C122 117 123 114 122 111 M90 124 C93 122 95 120 97 118 M122 120 C119 120 117 119 115 117 M90 124 C80 128 66 134 56 142 C50 148 46 154 42 162 M122 120 C126 116 130 110 132 106 C134 114 140 122 150 130 C156 136 162 142 168 150 M132 108 C122 118 110 128 100 134 C94 140 90 144 86 150 C82 160 80 170 80 190",
    fine: "M90 64 C88 56 84 51 78 50 M100 61 C100 52 96 46 90 44 M108 61 C110 52 114 47 120 46 M118 64 C122 58 126 56 130 57 M72 66 C71 74 72 82 76 88 M95 85 C97 83.5 101 83.5 103 85 M113 85 C115 83.5 119 83.5 121 85 M98.2 86.2a0.8 0.8 0 1 0 1.6 0a0.8 0.8 0 1 0 -1.6 0M116.2 86.2a0.8 0.8 0 1 0 1.6 0a0.8 0.8 0 1 0 -1.6 0 M104 109 C107 108 111 108 115 109 M103 100 C101 102 101 104 102 106 M119 100 C121 102 121 104 120 106 M89 137 C92 140 94 143 95 146 M120 140 C128 150 134 160 140 172 M104 150 C112 160 118 170 122 186 M64 150 C66 162 66 176 64 190"
  }
};
