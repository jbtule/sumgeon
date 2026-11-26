// Dollars (2nd grade, 2.MD.C.8: dollar bills, and bills with coins, using $ and ¢): a prototype
// for the review page (review/proto/); nothing in the game reads it yet. No DOM: runs in Node.
//
// The bills are drawn stylized, to stay well inside the US rules on illustrations of currency
// (31 CFR 411, 18 U.S.C. 504): the front only, in one green tint and an outline, never near real
// size (on a phone a bill here is about 100 px wide, far under 75% of a real one), and no text but
// the numerals: no serial numbers, seals, signatures or Treasury lettering. The portraits: the
// coins' own traces (js/coins.js, from public-domain US Mint photos) for Washington on the $1 (the
// quarter's) and Lincoln on the $5 (the penny's), and for Hamilton ($10) and Jackson ($20) traces
// of the Bureau of Engraving and Printing's engraved portraits (public domain, on Wikimedia
// Commons) simplified into flat tones by design/bills/trace.cjs: the face and hair outlined in ink,
// the coat in a light ink wash, so they read like the coins' line art (TRACED below).
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
  const bust = PORTRAIT[v], t = TRACED[v];
  if (bust) {
    const k = (ry * 2.3) / 200;
    s += `<g clip-path="url(#${id})"><path transform="translate(${f1(cx - 100 * k)} ${f1(cy - 110 * k)}) scale(${k.toFixed(3)})" d="${BUSTS[bust]}" fill="${G.ink}"/></g>`;
  } else {
    // An engraving's trace: its oval fitted to this one (the trace's box is 200 tall, centered).
    const k = Math.min((2 * rx) / t.w, (2 * ry) / t.h) * 1.08;
    s += `<g clip-path="url(#${id})"><g transform="translate(${f1(cx - 100 * k)} ${f1(cy - 100 * k)}) scale(${k.toFixed(3)})"><path d="${t.dark}" fill="${G.ink}" fill-opacity=".5" fill-rule="evenodd"/><path d="${t.light}" fill="none" stroke="${G.ink}" stroke-width="7" stroke-linejoin="round"/></g></g>`;
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

// The engraved portraits, traced (design/bills/trace.cjs; its README has the sources and settings):
// w and h are the engraving's oval in a 200-tall box, light is the face, hair and collar, dark the coat.
const TRACED = {
  10: { w: 160.6, h: 200,
    light: "M100.5 28.2L101.7 28L102.8 28L103.6 28.1L104.2 28.3L104.6 28.6L105.4 29L106.7 29.4L108.4 29.7L110.6 30.1L112.8 30.9L115.1 32.1L117.4 33.7L119.8 35.7L121.9 37.8L123.6 40.1L125 42.5L126.1 45.1L126.9 47.4L127.5 49.6L127.7 51.6L127.7 53.5L127.8 55L128 56.3L128.3 57.3L128.6 58L128.6 58.9L128.1 59.9L127.3 61L126 62.3L125 63.3L124.1 63.9L123.5 64.2L123.2 64.2L122.7 64.5L122 64.9L121.3 65.6L120.3 66.5L119.7 67.3L119.2 67.9L119 68.4L119 68.8L119.3 69.3L119.9 69.9L120.9 70.7L122.2 71.6L123.4 72.3L124.6 72.8L125.7 73L126.8 73L127.8 72.9L128.7 72.7L129.6 72.4L130.3 72.1L131.3 72.5L132.7 73.7L134.4 75.6L136.4 78.4L137.3 80.6L137.1 82.2L135.9 83.3L133.5 83.9L131.7 84.5L130.4 85.2L129.7 86L129.5 87L129.4 87.7L129.5 88.4L129.7 88.9L130.1 89.2L130.4 89.7L130.6 90.2L130.7 90.9L130.7 91.6L130.3 92.2L129.6 92.8L128.5 93.2L127 93.6L126 94L125.3 94.5L125.1 95L125.3 95.5L125.6 95.9L126 96.2L126.6 96.4L127.4 96.4L128.1 96.5L128.7 96.8L129.3 97.2L129.8 97.7L130.3 98.3L130.8 99L131.2 99.6L131.6 100.4L131.8 101.2L132 102.1L132.1 103.1L132.1 104.2L131.7 105.1L130.9 105.7L129.7 106.1L128 106.3L126.6 106.3L125.4 106.3L124.5 106L123.7 105.7L122.7 105.2L121.4 104.7L119.9 104L118.1 103.3L116.3 102.2L114.6 100.9L112.9 99.2L111.2 97.2L110 95.5L109.2 94.1L108.8 93.1L108.8 92.3L108.5 91.5L107.9 90.6L107.1 89.6L106 88.5L105.2 87L104.7 85.2L104.4 83L104.4 80.5L104.1 78.2L103.4 76.3L102.5 74.7L101.2 73.4L99.8 72.3L98.2 71.3L96.5 70.4L94.7 69.7L93.1 68.7L91.6 67.4L90.3 65.9L89.2 64.1L88 62.6L86.8 61.5L85.4 60.8L83.9 60.4L82.6 59.9L81.4 59.3L80.4 58.5L79.5 57.6L78.7 56.6L78.1 55.6L77.6 54.6L77.2 53.5L76.8 52.5L76.3 51.7L75.8 51L75.3 50.5L74.6 50L73.8 49.8L72.8 49.6L71.7 49.6L70.7 49.9L69.8 50.5L69 51.3L68.2 52.4L67.6 53.1L66.9 53.6L66.3 53.7L65.8 53.6L65.6 52.8L65.6 51.4L66.1 49.5L66.8 46.9L67.7 44.5L68.9 42.2L70.3 40.1L72 38L73.7 36.3L75.4 34.7L77.2 33.4L79 32.3L80.6 31.5L81.8 30.9L82.8 30.7L83.6 30.7L84.2 30.7L84.8 30.9L85.2 31.2L85.6 31.6L86.1 31.7L86.9 31.5L87.8 31L88.9 30.3L90.2 29.7L91.7 29.2L93.5 28.9L95.5 28.7L97.4 28.6L99 28.4ZM89.9 101.2L91.9 101L93.6 101L94.9 101L96 101.3L96.7 101.6L98.2 102.7L100.4 104.6L103.3 107.1L106.9 110.4L110.1 113.1L112.9 115.3L115.1 117L117 118.1L118.4 119.2L119.4 120.4L120 121.6L120.2 122.9L120.1 124L119.8 125L119.3 125.9L118.6 126.6L117.9 127.4L117.3 128.2L116.7 129.1L116.1 130L115.5 130.6L114.6 130.9L113.7 130.8L112.6 130.5L110.7 129.2L108.1 126.9L104.7 123.6L100.5 119.4L96.9 115.6L93.8 112L91.4 108.8L89.6 105.8L88.7 103.6L88.8 102.1ZM125.6 128.9L126.2 128.7L126.7 128.7L127.3 128.9L127.8 129.3L128.4 129.8L128.8 130.6L129.1 131.6L129.2 132.8L129.2 134.3L129.7 135.9L130.8 137.5L132.5 139.2L134.7 141.1L136.4 142.7L137.7 144.2L138.5 145.4L138.9 146.5L139.3 147.5L139.9 148.4L140.5 149.3L141.2 150L141.8 150.7L142.2 151.5L142.3 152.2L142.3 152.9L142.6 153.8L143.2 154.9L144 156.2L145.1 157.7L145.7 158.8L145.9 159.5L145.6 159.9L144.9 159.9L144.1 159.6L143.3 159.2L142.4 158.5L141.5 157.6L140.7 156.9L140.1 156.4L139.6 156.2L139.2 156.2L138 155.1L135.8 152.9L132.7 149.6L128.6 145.3L125.5 141.9L123.2 139.6L121.8 138.4L121.3 138.2L120.8 137.9L120.6 137.5L120.4 136.9L120.4 136.1L120.7 135.2L121.3 134.1L122.1 132.8L123.2 131.4L124.1 130.2L125 129.4Z",
    dark: "M72.2 70.5L73.1 70.3L74 70.4L74.8 70.7L75.5 71.2L76.3 71.9L77.3 72.4L78.6 72.8L80.1 73L81.9 73L83.5 73.1L84.9 73.4L86 73.8L87 74.4L87.3 74.9L87.1 75.5L86.4 76L85.1 76.6L83.9 77.3L82.8 78.2L81.8 79.3L80.9 80.6L80.2 81.7L79.8 82.7L79.6 83.6L79.6 84.3L79.5 84.9L79.3 85.5L79 85.9L78.6 86.3L78.4 87L78.2 87.9L78.1 89.1L78.1 90.5L77.9 91.8L77.6 92.9L77 93.8L76.3 94.5L75.8 95.3L75.6 96.3L75.7 97.3L76.1 98.4L76.9 99.7L78.1 101.2L79.7 103L81.7 105L83.3 106.5L84.4 107.5L85.2 108L85.6 108L86.9 109.1L89.1 111.3L92.2 114.6L96.2 119L99.3 122.3L101.5 124.5L102.7 125.5L103.1 125.5L104.5 126.6L107 128.7L110.5 131.8L115.1 136L118.5 139.3L120.8 141.6L121.9 142.9L121.9 143.2L122.9 144.5L124.9 146.7L127.9 149.8L131.9 153.8L134.9 156.9L137 159.1L138 160.4L138 160.8L138.4 161.6L139.3 162.9L140.7 164.6L142.5 166.8L143.9 168.6L144.8 170.1L145.3 171.2L145.3 171.9L144.8 172.9L143.8 174.3L142.2 176L140.2 178L138.4 179.5L136.6 180.5L135 181L133.6 181L132.4 181.3L131.5 181.8L130.8 182.7L130.5 183.8L129.6 184.9L128.1 185.9L126.1 187L123.5 188.1L121.1 189.1L118.7 189.8L116.4 190.3L114.2 190.7L112.5 191.1L111.2 191.4L110.4 191.8L110 192.2L108.6 192.4L106 192.6L102.4 192.7L97.6 192.7L94 192.6L91.4 192.4L90 192.2L89.6 191.8L89.1 191.5L88.3 191.3L87.4 191.2L86.3 191.2L85.4 191.1L84.7 191L84.1 190.7L83.8 190.3L83 190L81.9 189.6L80.5 189.2L78.6 188.9L76.5 188.1L73.9 187L71 185.6L67.7 183.8L64.1 181.3L60.2 178.1L55.9 174.2L51.4 169.6L47.9 166.1L45.7 163.6L44.5 162.2L44.5 161.9L44.3 161.4L44 160.9L43.4 160.2L42.7 159.5L42.2 158.9L41.9 158.4L41.9 158.1L42.1 157.9L42.3 157.9L42.6 158L42.9 158.2L43.2 158.6L43.7 158.9L44.3 159L44.9 159.1L45.6 159.1L46.5 158.8L47.5 158.2L48.6 157.2L49.9 155.9L51 154.4L51.8 152.7L52.4 150.7L52.7 148.5L52.7 146.4L52.4 144.2L51.6 142L50.5 139.8L49.7 138L49.2 136.5L48.9 135.4L48.9 134.7L49.2 133.9L49.7 132.9L50.5 131.9L51.6 130.8L52.5 129.7L53 128.4L53.3 127L53.3 125.5L53.6 124.1L54.2 122.8L55.2 121.4L56.5 120.2L57.5 119.2L58.3 118.6L58.9 118.2L59.3 118.2L59.7 118L60.2 117.6L60.7 116.9L61.2 116L61.5 115.1L61.6 114.3L61.5 113.5L61.1 112.8L60.9 112L60.7 111L60.6 110L60.6 108.9L60.7 108L60.9 107.3L61.1 106.8L61.5 106.4L61.9 105L62.2 102.6L62.6 99.3L63 94.9L63.3 91.5L63.7 89.1L64.1 87.8L64.4 87.4L64.8 86.5L65.1 85L65.5 83L65.9 80.5L66.4 78.2L67.2 76.2L68.1 74.5L69.2 73L70.2 71.9L71.2 71Z" },
  20: { w: 166.7, h: 200,
    light: "M92.9 23.2L94.2 23L95.6 23.1L97 23.3L98.5 23.9L100 24.6L101.3 25.6L102.5 26.7L103.4 28L104.2 29.5L105 30.7L105.8 31.6L106.7 32.1L107.7 32.3L108.3 33L108.6 34.2L108.5 36L108.1 38.3L108.2 40.3L108.8 42.2L109.8 43.9L111.4 45.5L112.7 47L113.8 48.5L114.8 50L115.5 51.5L116.1 53.2L116.5 55.1L116.7 57.2L116.7 59.5L116.3 61.4L115.5 62.9L114.4 64L112.9 64.8L111.7 65.6L111 66.6L110.6 67.6L110.6 68.8L111 70.1L111.7 71.6L112.9 73.3L114.4 75.2L115.5 76.8L116.3 78.1L116.7 79.2L116.7 79.9L116.3 80.8L115.5 81.7L114.4 82.8L112.9 83.9L111.7 85L111 86.2L110.6 87.3L110.6 88.4L110.7 89.4L110.9 90.2L111.2 90.7L111.6 91.1L111.8 92L112 93.6L112.1 95.6L112.1 98.3L111.9 100.6L111.4 102.6L110.7 104.3L109.8 105.6L108.9 106.7L108 107.5L107.2 108.1L106.4 108.5L105.6 108.8L104.6 109L103.6 109.1L102.5 109.1L101.5 109L100.8 108.8L100.2 108.5L99.8 108.1L99 107.9L97.6 107.7L95.8 107.6L93.6 107.6L91.6 107.3L90 106.9L88.7 106.2L87.8 105.2L87.1 104.2L86.6 103.2L86.4 102.1L86.4 100.9L86.5 100L86.6 99.2L86.9 98.7L87.3 98.3L87.6 97.5L87.8 96.4L87.9 94.9L87.9 93L87.7 91.4L87.5 90.2L87 89.3L86.5 88.7L85.4 88.3L83.8 88L81.6 87.9L79 87.9L76.7 87.5L74.7 86.9L73 85.9L71.7 84.6L70.7 83.3L70 82.1L69.7 80.9L69.7 79.7L69.5 78.5L69.1 77.2L68.6 75.8L67.8 74.2L67.2 72.3L66.9 69.8L66.7 66.9L66.7 63.4L66.8 60.8L67 58.9L67.2 57.8L67.6 57.4L67.9 56.6L68.1 55.5L68.2 54L68.2 52.1L68.5 50.3L69 48.6L69.9 47L71 45.5L71.9 44.1L72.4 43L72.7 42L72.7 41.3L73 40.2L73.6 38.9L74.4 37.3L75.6 35.4L76.7 33.8L77.7 32.3L78.7 31.2L79.6 30.2L81 29.2L82.7 28L84.8 26.8L87.2 25.5L89.4 24.4L91.3 23.7Z",
    dark: "M75.9 102L77.9 101.8L79.9 102.3L81.7 103.6L83.3 105.5L84.8 108.1L86.2 110.2L87.3 111.7L88.3 112.7L89 113.1L90.1 113.4L91.4 113.5L93 113.6L94.9 113.6L96.4 113.5L97.5 113.4L98.3 113.1L98.7 112.7L99.6 112.4L101.1 112.2L103.2 112.1L105.9 112.1L108 112L109.8 111.8L111 111.6L111.7 111.2L112.5 110.7L113.1 110.3L113.7 109.8L114.3 109.2L114.9 108.3L115.4 107.2L116 105.8L116.6 104.1L118.1 102.8L120.7 101.9L124.2 101.5L128.8 101.5L132.6 102.3L135.7 103.9L138.2 106.3L139.9 109.6L141.5 112.3L143 114.6L144.4 116.4L145.7 117.7L147.2 118.9L148.8 119.9L150.6 120.8L152.5 121.6L154.6 122.8L157 124.4L159.6 126.4L162.4 128.9L164.6 130.9L166.2 132.5L167.2 133.7L167.6 134.5L167.9 135.6L168.1 137.1L168.2 139L168.2 141.3L167.9 143.6L167.3 145.8L166.5 148.1L165.3 150.4L164 152.7L162.5 154.9L160.8 157.2L158.9 159.5L157.5 161.3L156.5 162.6L156.1 163.4L156.1 163.8L155.3 164.9L153.6 166.7L151.2 169.2L148 172.4L145.5 174.9L143.7 176.5L142.6 177.3L142.2 177.3L141.5 177.7L140.3 178.4L138.8 179.5L136.9 181.1L135.1 182.4L133.4 183.5L131.8 184.5L130.3 185.2L128.7 185.9L127 186.5L125.2 186.9L123.3 187.3L121.6 187.6L120.1 187.8L118.8 187.9L117.6 187.9L116.6 187.8L115.6 187.6L114.8 187.3L114 186.9L113.4 186.7L112.8 186.7L112.3 186.9L111.9 187.3L111.1 187.6L109.8 187.8L108 187.9L105.7 187.9L103.7 188.1L102 188.4L100.6 189L99.4 189.8L97.9 190.3L96 190.7L93.8 190.9L91.1 190.9L89 190.8L87.5 190.6L86.6 190.3L86.2 190L85.4 189.6L84.3 189.2L82.8 188.8L80.9 188.4L79.3 188L77.9 187.4L76.9 186.7L76.1 186L75.3 185.4L74.3 185L73.3 184.8L72.2 184.8L70.5 184.5L68.5 183.7L65.9 182.6L62.9 181.1L59.8 179.1L56.7 176.8L53.5 174L50.3 170.7L47.9 168.2L46.3 166.4L45.5 165.3L45.5 165L44.9 164L43.8 162.5L42 160.4L39.8 157.8L38 155.4L36.6 153.3L35.8 151.5L35.4 150L34.9 148.6L34.4 147.3L33.7 146L33 144.9L32.3 143.6L31.7 142L31.3 140.3L30.9 138.4L30.5 136.9L30.1 135.8L29.7 135L29.4 134.7L29.1 133.9L28.9 132.8L28.8 131.3L28.8 129.4L28.7 127.8L28.5 126.7L28.2 125.9L27.8 125.6L27.7 124.9L27.7 124L27.8 122.7L28.2 121.2L28.7 119.8L29.4 118.6L30.2 117.5L31.2 116.6L32.1 115.8L33.2 115.1L34.3 114.6L35.4 114.2L37 114.6L39.1 115.7L41.7 117.6L44.7 120.3L47.3 122.3L49.3 123.6L50.9 124.2L52.1 124.2L53.5 123.9L55.1 123.2L56.9 122.3L59 120.9L60.9 119.2L62.7 117L64.4 114.4L65.9 111.4L67.3 108.8L68.7 106.7L69.9 105.1L71 104L72.4 103.1L74 102.4ZM86.8 121.5L83.6 124.7L81.1 127.4L79.2 129.5L77.9 131L77.4 131.9L76.4 132.6L75 133.1L73.1 133.3L70.8 133.3L68.9 133.4L67.4 133.6L66.3 133.9L65.5 134.3L64.4 135.1L63 136.3L61.3 138L59.2 140.1L57.5 142L56.3 143.8L55.5 145.5L55.1 147L55.2 148.6L55.8 150.3L56.8 152.1L58.3 154L59.7 155.8L60.8 157.5L61.7 159.1L62.5 160.6L63.1 161.9L63.4 163.1L63.6 164L63.6 164.8L63.9 165.6L64.3 166.4L65.1 167.3L66 168.3L66.8 169L67.5 169.5L68 169.7L68.4 169.7L68.9 169.5L69.6 169L70.4 168.3L71.3 167.3L72.1 165.9L72.8 163.9L73.3 161.4L73.7 158.3L74.3 156L75.1 154.4L76.2 153.5L77.6 153.3L78.6 153.1L79.5 152.8L80.1 152.5L80.5 152.1L81 151.8L81.5 151.6L82.2 151.5L83 151.5L84.4 152.5L86.5 154.4L89.2 157.2L92.6 161L95.5 163.8L98 165.7L100 166.7L101.5 166.7L102.7 166.8L103.7 167L104.4 167.2L104.7 167.6L105.3 167.9L106.1 168.1L107 168.2L108.1 168.2L109.2 168.3L110.1 168.5L111 168.8L111.7 169.1L112.9 169.5L114.4 169.9L116.3 170.3L118.6 170.6L120.6 171.1L122.5 171.7L124.2 172.3L125.8 173.1L127.3 173.7L128.8 174.1L130.3 174.2L131.8 174.2L133.2 173.9L134.6 173.1L135.8 172L136.9 170.5L138.1 169.2L139.2 168.3L140.3 167.6L141.5 167.2L142.7 166.6L143.9 165.8L145.2 164.7L146.5 163.4L147.1 162.1L147 160.8L146.2 159.7L144.7 158.5L143.6 157.3L142.8 156L142.4 154.5L142.4 153L142.3 151.8L142 150.7L141.6 149.9L141 149.3L140.1 149.2L138.9 149.5L137.3 150.2L135.4 151.3L133.5 152.3L131.6 153L129.7 153.6L127.8 154L125.9 154.5L124.1 155.3L122.2 156.3L120.3 157.4L118.7 158L117.3 158L116.3 157.4L115.5 156.3L114.8 155.3L114 154.5L113.3 154L112.5 153.6L111.6 153.3L110.7 153.1L109.7 153L108.5 153L107.4 152.7L106.3 152.2L105.1 151.3L104 150.2L102.8 149.2L101.7 148.5L100.6 147.9L99.4 147.5L98.5 147L97.9 146.4L97.4 145.5L97.3 144.6L96.8 143.5L96.2 142.3L95.3 140.9L94.1 139.4L93.3 138L92.7 136.6L92.4 135.4L92.4 134.3L92.7 133L93.3 131.7L94.1 130.3L95.3 128.8L96.1 127.3L96.7 125.8L97 124.2L97 122.7L96.6 121.4L96 120.1L95 119L93.7 118.1L91.9 118.2L89.6 119.3ZM115.3 130.9L115 131.3L114.2 131.6L113.1 132L111.6 132.4L109.7 132.8L107.9 133.5L106.3 134.5L104.8 135.9L103.5 137.6L102.5 139.1L101.8 140.3L101.5 141.3L101.5 142L101.8 142.9L102.2 143.7L102.9 144.6L103.9 145.5L104.7 146.3L105.4 146.7L105.9 147L106.3 147L106.7 147L107.3 147L108 147L108.7 147L110 146.3L111.8 144.8L114.1 142.7L117 139.9L119.1 137.6L120.5 136L121.2 135L121.2 134.7L120.9 134.1L120.2 133.5L119.2 132.7L117.9 131.7L116.8 131.1L116 130.8Z" }
};
