// 4th grade (DESIGN.md §4.4, the Fraction Forge): the school's 4th grade guide, in its order.
// Fixed samples with stable keys, so 70% of a level can be learned and every problem is recorded.
// Answers are whole numbers typed on the pad: big numbers (with commas from 10,000 on screen),
// a remainder or a mixed number in two slots (the quotient, then the remainder; the whole, then
// the numerator), and fractions and decimals with a whole number hidden (3/4 = □/8, 0.47 = □/100).
// No decimal key: that waits for 5th grade. No DOM: runs in Node for the tests.
import { fractionFact, fracCompareFact, roundFact, rectFact, fractionWords, unitName } from "./third.js";
import { spoken } from "./problems.js";

// A fixed shuffle (a small LCG), so the samples never change between builds.
function seeded(seed) { let s = seed; return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648; }
function sample(list, n, seed) {
  const r = seeded(seed), a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}
const cap = (t) => t[0].toUpperCase() + t.slice(1);
// A number with commas, from 10,000 (45,312), as the guide writes them. Four digits stay plain.
export const commas = (n) => (Math.abs(n) >= 10000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : String(n));
// Every number of five digits or more in a line of text, with commas: for the screen only (the
// hints and spoken lines keep plain digits).
export const bigText = (t) => String(t).replace(/\d{5,}/g, (d) => commas(Number(d)));
const plain = (op, x, y, set) => ({ op, x, y, ans: { "+": x + y, "-": x - y, "×": x * y, "÷": x / y }[op], q: x + " " + (op === "-" ? "−" : op) + " " + y, set });
const tag = (f, set) => Object.assign(f, { set });

/* ---------- numbers to a million (4.NBT) ---------- */
// Comparing to a million: two five- or six-digit numbers, decided by a different place each time
// (some with digits turned round, two the same). Chompers bites off the thousands: a comparison
// hits for the bigger number's thousands (45 for 45,312), as the guide's big numbers would
// otherwise end every fight in one bite. Key "○45312,45231", the numbers as shown.
export function bigCompareFact(l, r) {
  const a = Number(l), b = Number(r), sym = a < b ? "<" : a > b ? ">" : "=";
  return { op: "○", l: String(a), r: String(b), sym, ans: Math.floor(Math.max(a, b) / 1000), q: a + " □ " + b, key: "○" + a + "," + b, big: true };
}
export const isBigCompare = (key) => /^○\d{4,},\d{4,}$/.test(String(key));
export function bigCompareFactOf(key) { const [l, r] = key.slice(1).split(","); return bigCompareFact(l, r); }
let cmpCache = null;
export function bigCompareFacts() {
  if (cmpCache) return cmpCache;
  const r = seeded(4401), d = (a, b) => a + Math.floor(r() * (b - a + 1)), out = [], seen = new Set();
  const add = (x, y) => { const f = bigCompareFact(String(x), String(y)); if (seen.has(f.key) || seen.has("○" + y + "," + x)) return false; seen.add(f.key); out.push(tag(f, "cmp1m")); return true; };
  // The place that decides: 0 the hundred thousands … 5 the ones; a five-digit number has no
  // hundred thousands.
  for (const [digits, place, n] of [[6, 0, 3], [6, 1, 3], [5, 1, 3], [6, 2, 3], [5, 2, 3], [5, 3, 2], [6, 4, 2], [5, 5, 1]]) {
    let k = 0;
    while (k < n) {
      const a = Array.from({ length: digits }, (_, i) => (i ? d(0, 9) : d(1, 9)));
      const b = a.slice(), at = place - (6 - digits);
      if (at < 0) continue;
      b[at] = (a[at] + d(1, 8)) % 10;
      if (!at && !b[0]) continue;
      if (add(Number(a.join("")), Number(b.join("")))) k++;
    }
  }
  // Digits turned round (45,312 and 45,132), and the same number twice.
  add(45312, 45132); add(708215, 780215);
  add(36504, 36504); add(250175, 250175);
  return (cmpCache = out);
}

// Rounding to any place (4.NBT): four-digit numbers to the nearest 10, 100 and 1000, and five-digit
// ones to the nearest 1000 and 10,000. A few halfway on purpose. 3rd grade's rounding (third.js
// roundFact), the same keys ("≈4672,100").
let roundCache = null;
export function roundFacts4() {
  if (roundCache) return roundCache;
  const r = seeded(4421), d = (a, b) => a + Math.floor(r() * (b - a + 1)), out = [], seen = new Set();
  const add = (n, to) => { if (n % to === 0) return; const f = roundFact(n, to); if (seen.has(f.key)) return; seen.add(f.key); out.push(tag(f, "round4")); };
  for (const [to, lo, hi, n] of [[10, 1001, 9999, 6], [100, 1001, 9999, 8], [1000, 1001, 9999, 8], [1000, 10001, 99999, 4], [10000, 10001, 99999, 4]]) for (let i = 0; i < n; i++) add(d(lo, hi), to);
  // Halfway rounds up.
  [[4650, 100], [7500, 1000], [3285, 10], [45000, 10000]].forEach(([n, to]) => add(n, to));
  return (roundCache = out);
}

// Adding and subtracting to a million (4.NBT, fluently): four-digit numbers with regrouping, some
// across zeros, and a few five-digit ones. Stacked half the time, as the guide works them.
let addCache = null;
export function addSub4() {
  if (addCache) return addCache;
  const r = seeded(4431), d = (a, b) => a + Math.floor(r() * (b - a + 1)), out = [], seen = new Set();
  const add = (f) => { const k = f.op === "+" ? "+" + Math.min(f.x, f.y) + "," + Math.max(f.x, f.y) : "-" + f.x + "," + f.y; if (seen.has(k)) return; seen.add(k); out.push(f); };
  for (let i = 0; i < 12; i++) add(plain("+", d(1100, 6999), d(1100, 2999), "addsub4"));
  for (let i = 0; i < 8; i++) { const x = d(3000, 9999), y = d(1001, x - 500); add(plain("-", x, y, "addsub4")); }
  // Across zeros: 5,006 − 2,758; 4,000 − 1,368.
  for (const [x, y] of [[5006, 2758], [4000, 1368], [7030, 2465], [9002, 4517]]) add(plain("-", x, y, "addsub4"));
  for (let i = 0; i < 4; i++) add(plain("+", d(12000, 59999), d(10001, 39999), "addsub4"));
  for (let i = 0; i < 4; i++) { const x = d(30000, 99999), y = d(10001, x - 5000); add(plain("-", x, y, "addsub4")); }
  return (addCache = out);
}

/* ---------- multiplying (4.NBT.A.6) ---------- */
// × 10, 100 and 1000: a one-digit number times tens, hundreds or thousands (6 × 300, 8 × 2000),
// and tens times tens (40 × 70). Keys like the tables' ("×6,300").
let x10Cache = null;
export function times10s() {
  if (x10Cache) return x10Cache;
  const all = [];
  for (let a = 2; a <= 9; a++) for (const t of [100, 1000]) all.push(plain("×", a, t, "x10"));
  for (let a = 2; a <= 9; a++) for (let t = 2; t <= 9; t++) { all.push(plain("×", a, t * 100, "x10")); all.push(plain("×", a, t * 1000, "x10")); }
  for (let a = 2; a <= 9; a++) for (let b = a; b <= 9; b++) all.push(plain("×", a * 10, b * 10, "x10"));
  return (x10Cache = sample(all, 26, 4441));
}
// A one-digit number times two, three and four digits (243 × 6, 1,526 × 4), never a ten or a
// hundred (those are the level before).
let x1Cache = null;
export function timesOne() {
  if (x1Cache) return x1Cache;
  const r = seeded(4451), d = (a, b) => a + Math.floor(r() * (b - a + 1)), out = [], seen = new Set();
  const add = (n, a) => { if (n % 10 === 0) return; const k = a + "," + n; if (seen.has(k)) return; seen.add(k); out.push(r() < 0.5 ? plain("×", n, a, "x1") : plain("×", a, n, "x1")); };
  for (const [lo, hi, n] of [[13, 98, 10], [102, 989, 12], [1012, 2499, 8]]) for (let i = 0; i < n; i++) add(d(lo, hi), d(3, 9));
  return (x1Cache = out);
}
// Two-digit times two-digit (27 × 23), neither a multiple of 10.
let x2Cache = null;
export function timesTwo() {
  if (x2Cache) return x2Cache;
  const r = seeded(4461), d = (a, b) => a + Math.floor(r() * (b - a + 1)), out = [], seen = new Set();
  while (out.length < 24) {
    const a = d(11, 49), b = d(11, 39);
    if (a % 10 === 0 || b % 10 === 0 || a === b || Math.max(a, b) < 13) continue;
    const k = Math.min(a, b) + "," + Math.max(a, b);
    if (seen.has(k)) continue;
    seen.add(k); out.push(plain("×", a, b, "x2"));
  }
  return (x2Cache = out);
}

/* ---------- dividing (4.NBT.A.7) ---------- */
// Dividing by one digit, coming out even: two-, three- and four-digit dividends (84 ÷ 4, 936 ÷ 3,
// 1,248 ÷ 6), each quotient past 10.
let divCache = null;
export function divideOne() {
  if (divCache) return divCache;
  const r = seeded(4471), d = (a, b) => a + Math.floor(r() * (b - a + 1)), out = [], seen = new Set();
  for (const [lo, hi, n] of [[11, 33, 8], [21, 199, 10], [120, 999, 6]]) {
    let k = 0;
    while (k < n) {
      const y = d(2, 9), q = d(lo, hi), x = q * y;
      if (x < 40 || x > 9999 || seen.has(x + "," + y)) continue;
      seen.add(x + "," + y); out.push(plain("÷", x, y, "div1")); k++;
    }
  }
  return (divCache = out);
}
// Remainders: 29 ÷ 4 = □ R □, the quotient, then the remainder (two slots). It hits for the
// quotient (Boomainder adds the remainder: Leftovers). Key "R29,4".
export function remFact(x, y) {
  const q = Math.floor(x / y), rem = x % y;
  return { op: "R", x, y, quo: q, rem, ans: q, slots: [q, rem], slotNames: ["Quotient", "Remainder"], slotMax: [String(q).length + 1, 1], slotSay: "nowRemainder",
    parts: [x + " ÷ " + y + " = ", null, " R ", null], q: x + " ÷ " + y + " = □ R □", key: "R" + x + "," + y };
}
export function remFactOf(key) { const [x, y] = key.slice(1).split(",").map(Number); return remFact(x, y); }
let remCache = null;
export function remFacts() {
  if (remCache) return remCache;
  const r = seeded(4481), d = (a, b) => a + Math.floor(r() * (b - a + 1)), out = [], seen = new Set();
  for (const [lo, hi, n] of [[10, 59, 14], [60, 499, 12], [500, 2999, 4]]) {
    let k = 0;
    while (k < n) {
      const y = d(2, 9), x = d(lo, hi);
      if (x % y === 0 || Math.floor(x / y) < 2 || seen.has(x + "," + y)) continue;
      seen.add(x + "," + y); out.push(tag(remFact(x, y), "rem")); k++;
    }
  }
  return (remCache = out);
}

/* ---------- multi-step problems and factors (4.RA) ---------- */
// Two steps, left to right (6 × 4 + 5, 48 ÷ 6 − 3), and an unknown as a letter (n − 15 = 27,
// 4 × n = 36), "n = □". Key "E6×4+5", "En-15=27" (the problem as written, - for −).
const SIGN = { "+": "+", "-": "−", "×": "×", "÷": "÷" };
const apply = (a, op, b) => ({ "+": a + b, "-": a - b, "×": a * b, "÷": a / b })[op];
export function exprFact(key) {
  const t = key.slice(1);
  if (t[0] === "n" || /×n=|n÷/.test(t)) {
    // n + a = b, n − a = b, a × n = b, n ÷ a = b.
    let m = t.match(/^n([+\-÷])(\d+)=(\d+)$/), kind, a, b, ans;
    if (m) { kind = m[1]; a = +m[2]; b = +m[3]; ans = { "+": b - a, "-": b + a, "÷": b * a }[kind]; }
    else { m = t.match(/^(\d+)×n=(\d+)$/); kind = "×"; a = +m[1]; b = +m[2]; ans = b / a; }
    const eq = kind === "×" ? `${a} × n = ${b}` : `n ${SIGN[kind]} ${a} = ${b}`;
    return { op: "E", kind: "n", vop: kind, a, b, ans, eq, parts: [eq + ",  n = ", null], q: eq, key };
  }
  const m = t.match(/^(\d+)([×÷])(\d+)([+\-])(\d+)$/), a = +m[1], o1 = m[2], b = +m[3], o2 = m[4], c = +m[5];
  const first = apply(a, o1, b), ans = apply(first, o2, c), q = `${a} ${SIGN[o1]} ${b} ${SIGN[o2]} ${c}`;
  return { op: "E", kind: "two", a, o1, b, o2, c, first, ans, q, parts: [q + " = ", null], key };
}
let exprCache = null;
export function exprFacts() {
  if (exprCache) return exprCache;
  const r = seeded(4491), d = (a, b) => a + Math.floor(r() * (b - a + 1)), keys = new Set();
  const add = (k) => keys.add("E" + k);
  while (keys.size < 8) add(`${d(3, 9)}×${d(3, 9)}+${d(2, 19)}`);
  while (keys.size < 14) { const a = d(3, 9), b = d(3, 9); add(`${a}×${b}-${d(2, Math.min(19, a * b - 2))}`); }
  while (keys.size < 18) { const b = d(3, 9), q = d(3, 9); add(`${b * q}÷${b}${r() < 0.5 ? "+" : "-"}${d(1, q - 1)}`); }
  while (keys.size < 24) { const a = d(11, 49), b = d(a + 5, 99); add(r() < 0.5 ? `n+${a}=${b}` : `n-${a}=${d(11, 60)}`); }
  while (keys.size < 30) { const a = d(3, 9), n = d(4, 12); add(r() < 0.5 ? `${a}×n=${a * n}` : `n÷${a}=${n}`); }
  return (exprCache = [...keys].map((k) => tag(exprFact(k), "expr")));
}
// Factor pairs within 100 (4.RA.B): 72 = 8 × □, 96 = 4 × □ (24, past the tables). Key "F72,8".
export function factorFact(n, a) {
  return { op: "F", n, a, ans: n / a, q: `${n} = ${a} × □`, parts: [`${n} = ${a} × `, null], key: "F" + n + "," + a };
}
export function factorFactOf(key) { const [n, a] = key.slice(1).split(",").map(Number); return factorFact(n, a); }
export function factorFacts() {
  const pairs = [[72, 8], [96, 4], [84, 7], [90, 6], [100, 4], [64, 8], [78, 3], [56, 4], [91, 7], [75, 5], [98, 2], [60, 4], [81, 9], [52, 4], [88, 8], [70, 5]];
  return pairs.map(([n, a]) => tag(factorFact(n, a), "factors"));
}

/* ---------- fractions (4.NF) ---------- */
// Equivalent fractions (4.NF.A.2), denominators 2, 3, 4, 5, 6, 8, 10, 12 and 100: 3/4 = □/8,
// 2/5 = □/10, 8/12 = □/3 (both ways, multiplying and dividing the top and bottom by the same
// number). 3rd grade's fraction facts, the same keys ("/3,4,8").
export function equivFacts4() {
  const pairs = [[2, 10], [5, 10], [3, 12], [4, 12], [6, 12], [2, 12], [10, 100], [3, 9], [5, 100]];
  const out = [], seen = new Set(), add = (a, b, d) => { const f = fractionFact(a, b, d); if (Number.isInteger(f.ans) && !seen.has(f.key)) { seen.add(f.key); out.push(tag(f, "equiv4")); } };
  for (const [b, d] of pairs) for (let a = 1; a < b; a++) { add(a, b, d); add((a * d) / b, d, b); }
  return sample(out, 30, 4501);
}
// Comparing fractions (4.NF.A.3), with unlike denominators: make the bottoms the same (2/3 ○ 3/4
// is 8/12 ○ 9/12), or compare to 1/2 (5/8 ○ 1/2), and a few equal (3/5 ○ 6/10). 3rd grade's
// comparing (third.js fracCompareFact), the same keys and the < = > keys.
export function fracCompare4() {
  const pairs = [["2/3", "3/4"], ["5/8", "1/2"], ["3/5", "6/10"], ["7/12", "2/3"], ["4/10", "1/2"], ["3/4", "5/6"], ["2/5", "1/2"], ["5/6", "7/8"],
    ["3/10", "1/4"], ["1/3", "2/5"], ["7/10", "3/4"], ["5/12", "1/2"], ["2/3", "5/8"], ["4/5", "3/4"], ["9/12", "3/4"], ["3/8", "1/3"],
    ["6/10", "1/2"], ["2/4", "5/10"], ["1/6", "2/10"], ["7/8", "9/10"], ["4/6", "8/12"], ["1/5", "3/10"], ["5/6", "3/4"], ["3/12", "1/3"]];
  const r = seeded(4511);
  return pairs.map(([a, b]) => tag(r() < 0.5 ? fracCompareFact(a, b) : fracCompareFact(b, a), "cmpfrac"));
}
// Adding and subtracting fractions (4.NF.B.6): like denominators (3/8 + 2/8 = □/8, 7/10 − 4/10),
// a fraction as unit fractions (5/8 = 1/8 + 2/8 + □/8), and mixed numbers (2 1/8 + 3/8 = □ □/8,
// 3 1/3 + 2 2/3 = □ □/3: not simplified, as the guide writes 5 3/3). A fraction times a whole
// (4.NF.B.8): 3 × 2/5 = □/5. Tenths and hundredths added (3/10 + 4/100 = □/100). The numerator
// is typed (the denominator stays: same size pieces), a mixed number's whole and numerator in two
// slots. It hits for the numerator, its pieces. Keys "ƒ3/8+2/8", "ƒ2 1/8+3/8", "ƒ3×2/5".
const mixed = (w, n, d) => (w ? w + " " : "") + n + "/" + d;
const readMixed = (t) => { const m = t.match(/^(?:(\d+) )?(\d+)\/(\d+)$/); return { w: +(m[1] || 0), n: +m[2], d: +m[3] }; };
export function fracOpFact(key) {
  const t = key.slice(1);
  let m = t.match(/^(\d+)×(\d+)\/(\d+)$/);
  if (m) { const k = +m[1], n = +m[2], d = +m[3]; return { op: "ƒ", kind: "times", k, n, d, ans: k * n, q: `${k} × ${n}/${d} = □/${d}`, parts: [`${k} × ${n}/${d} = `, null, `/${d}`], key }; }
  m = t.match(/^(\d+)\/(\d+)=(\d+)\/\d+\+(\d+)\/\d+$/);
  if (m) { const n = +m[1], d = +m[2], a = +m[3], b = +m[4]; return { op: "ƒ", kind: "split", n, d, a, b, ans: n - a - b, q: `${n}/${d} = ${a}/${d} + ${b}/${d} + □/${d}`, parts: [`${n}/${d} = ${a}/${d} + ${b}/${d} + `, null, `/${d}`], key }; }
  m = t.match(/^(\d+)\/10\+(\d+)\/100$/);
  if (m) { const a = +m[1], b = +m[2]; return { op: "ƒ", kind: "tenths", a, b, d: 100, ans: 10 * a + b, q: `${a}/10 + ${b}/100 = □/100`, parts: [`${a}/10 + ${b}/100 = `, null, "/100"], key }; }
  m = t.match(/^(.+?)([+\-])(.+)$/);
  const L = readMixed(m[1]), R = readMixed(m[3]), sub = m[2] === "-", d = L.d;
  const num = sub ? L.n - R.n : L.n + R.n, whole = sub ? L.w - R.w : L.w + R.w, qt = `${m[1]} ${sub ? "−" : "+"} ${m[3]}`;
  if (!L.w && !R.w) return { op: "ƒ", kind: sub ? "sub" : "add", l: L, r: R, d, ans: num, q: `${qt} = □/${d}`, parts: [`${qt} = `, null, `/${d}`], key };
  // A mixed number: the whole, then the numerator, in two slots (as a whole time is typed).
  return { op: "ƒ", kind: sub ? "msub" : "madd", l: L, r: R, d, whole, num, ans: num, slots: [whole, num], slotNames: ["Whole", "Numerator"], slotMax: [2, 2], slotSay: "nowNumerator",
    q: `${qt} = □ □/${d}`, parts: [`${qt} = `, null, " ", null, `/${d}`], key };
}
let opCache = null;
export function fracOpFacts() {
  if (opCache) return opCache;
  const r = seeded(4521), d = (a, b) => a + Math.floor(r() * (b - a + 1)), keys = new Set(), D = [3, 4, 5, 6, 8, 10, 12];
  const pick = () => D[d(0, D.length - 1)];
  // Like denominators, adding and taking away (the sum at most 1 whole).
  while (keys.size < 10) { const den = pick(), a = d(1, den - 2), b = d(1, den - a); keys.add(`ƒ${a}/${den}+${b}/${den}`); }
  while (keys.size < 18) { const den = pick(), a = d(2, den), b = d(1, a - 1); keys.add(`ƒ${a}/${den}-${b}/${den}`); }
  // A fraction as a sum of smaller ones: 5/8 = 1/8 + 2/8 + □/8.
  while (keys.size < 22) { const den = [5, 6, 8, 10][d(0, 3)], n = d(4, den), a = d(1, n - 3), b = d(1, n - a - 1); keys.add(`ƒ${n}/${den}=${a}/${den}+${b}/${den}`); }
  // Mixed numbers: adding (the pieces may make a whole, 3 1/3 + 2 2/3 = 5 3/3, never more), then
  // taking away (never borrowing a whole).
  while (keys.size < 30) { const den = [3, 4, 5, 6, 8][d(0, 4)], a = d(1, den - 1), b = d(1, den - a), w = d(1, 4); keys.add(`ƒ${w} ${a}/${den}+${r() < 0.5 ? d(1, 3) + " " : ""}${b}/${den}`); }
  while (keys.size < 36) { const den = [3, 4, 5, 6, 8][d(0, 4)], a = d(2, den - 1), b = d(1, a - 1), w = d(2, 5); keys.add(`ƒ${w} ${a}/${den}-${d(1, w - 1)} ${b}/${den}`); }
  return (opCache = [...keys].map((k) => tag(fracOpFact(k), "fracops")));
}
export function fracTimesFacts() {
  const r = seeded(4531), d = (a, b) => a + Math.floor(r() * (b - a + 1)), keys = new Set();
  while (keys.size < 16) { const den = [3, 4, 5, 6, 8, 10, 12][d(0, 6)]; keys.add(`ƒ${d(2, 6)}×${d(1, den - 1)}/${den}`); }
  return [...keys].map((k) => tag(fracOpFact(k), "fractimes"));
}

/* ---------- decimals (4.NF.C) ----------
   Tenths and hundredths as fractions, with a whole number hidden: 0.7 = □/10, 0.47 = □/100,
   0.7 = □/100 (seventy hundredths), 7/10 = □/100, and 3/10 + 4/100 = □/100. Key "d0.47/100". */
export function decFact(key) {
  const [dec, den] = key.slice(1).split("/"), d = Number(den), ans = Math.round(Number(dec) * d);
  return { op: "d", dec, d, ans, q: `${dec} = □/${d}`, parts: [`${dec} = `, null, `/${d}`], key };
}
// "zero point four seven", digit by digit after the point.
export const decWords = (t) => { const [w, f] = String(t).split("."); return spoken(Number(w)) + " point " + f.split("").map((c) => spoken(Number(c))).join(" "); };
export function decimalFacts() {
  const out = [];
  for (const n of [3, 7, 1, 9, 6, 4]) out.push(decFact(`d0.${n}/10`));
  for (const n of [47, 25, 8, 63, 5, 91]) out.push(decFact(`d0.${String(n).padStart(2, "0")}/100`));
  for (const n of [7, 4, 9, 2]) out.push(decFact(`d0.${n}/100`));
  for (const n of [7, 3, 9, 1]) out.push(fractionFact(n, 10, 100));
  for (const [a, b] of [[3, 4], [6, 2], [5, 9], [1, 7]]) out.push(fracOpFact(`ƒ${a}/10+${b}/100`));
  return out.map((f) => tag(f, "dec"));
}
// Comparing decimals (4.NF.C.7): 0.5 ○ 0.45, < = >. It hits for the bigger one in hundredths (50),
// as a fraction hits for its pieces. Key "○0.5,0.45".
export function decCompareFact(l, r) {
  const a = Math.round(Number(l) * 100), b = Math.round(Number(r) * 100), sym = a < b ? "<" : a > b ? ">" : "=";
  return { op: "○", l, r, sym, ans: Math.max(a, b), q: l + " □ " + r, key: "○" + l + "," + r, dec: true };
}
export const isDecCompare = (key) => /^○\d*\.\d+,/.test(String(key));
export function decCompareFactOf(key) { const [l, r] = key.slice(1).split(","); return decCompareFact(l, r); }
export function decCompareFacts() {
  const pairs = [["0.5", "0.45"], ["0.3", "0.35"], ["0.7", "0.70"], ["0.62", "0.6"], ["0.09", "0.1"], ["0.8", "0.18"], ["0.4", "0.04"], ["0.25", "0.52"],
    ["0.9", "0.89"], ["0.33", "0.3"], ["0.1", "0.10"], ["0.56", "0.65"], ["0.2", "0.19"], ["0.74", "0.7"], ["0.06", "0.6"], ["0.5", "0.50"]];
  return pairs.map(([a, b]) => tag(decCompareFact(a, b), "cmpdec"));
}

/* ---------- measurement (4.GM.C.7) ----------
   A bigger unit to a smaller one, within one system, with the guide's conversion tables: length,
   weight, liquid volume, time and money. Key "u3ft:in". */
export const UNITS = {
  "ft:in": [12, "foot", "feet", "inch", "inches", "ft", "in"],
  "yd:ft": [3, "yard", "yards", "foot", "feet", "yd", "ft"],
  "m:cm": [100, "meter", "meters", "centimeter", "centimeters", "m", "cm"],
  "km:m": [1000, "kilometer", "kilometers", "meter", "meters", "km", "m"],
  "cm:mm": [10, "centimeter", "centimeters", "millimeter", "millimeters", "cm", "mm"],
  "kg:g": [1000, "kilogram", "kilograms", "gram", "grams", "kg", "g"],
  "lb:oz": [16, "pound", "pounds", "ounce", "ounces", "lb", "oz"],
  "L:mL": [1000, "liter", "liters", "milliliter", "milliliters", "L", "mL"],
  "gal:qt": [4, "gallon", "gallons", "quart", "quarts", "gal", "qt"],
  "qt:pt": [2, "quart", "quarts", "pint", "pints", "qt", "pt"],
  "hr:min": [60, "hour", "hours", "minute", "minutes", "hr", "min"],
  "min:s": [60, "minute", "minutes", "second", "seconds", "min", "s"],
  "day:hr": [24, "day", "days", "hour", "hours", "days", "hr"],
  "wk:day": [7, "week", "weeks", "day", "days", "wk", "days"],
  "$:¢": [100, "dollar", "dollars", "cent", "cents", "$", "¢"]
};
export function unitFact(key) {
  const m = key.slice(1).match(/^(\d+)(.+):(.+)$/), n = +m[1], pair = m[2] + ":" + m[3], U = UNITS[pair], ans = n * U[0];
  const big = pair === "$:¢" ? "$" + n : `${n} ${U[5]}`, small = pair === "$:¢" ? "¢" : U[6];
  return { op: "u", n, pair, per: U[0], ans, q: `${big} = □ ${small}`.replace("□ ¢", "□¢"), parts: [`${big} = `, null, pair === "$:¢" ? "¢" : " " + small], key };
}
export function unitFacts() {
  const amounts = { "ft:in": [2, 3, 5], "yd:ft": [4, 7], "m:cm": [3, 6], "km:m": [2, 5], "cm:mm": [8, 12], "kg:g": [3, 4], "lb:oz": [2, 5], "L:mL": [2, 6],
    "gal:qt": [3, 6], "qt:pt": [5, 9], "hr:min": [2, 4], "min:s": [3, 5], "day:hr": [2, 3], "wk:day": [3, 6], "$:¢": [4, 7] };
  const out = [];
  for (const [pair, ns] of Object.entries(amounts)) for (const n of ns) out.push(tag(unitFact(`u${n}${pair}`), "units"));
  return out;
}
const unitWords = (n, U, small) => spoken(n) + " " + (small ? (n === 1 ? U[3] : U[4]) : (n === 1 ? U[1] : U[2]));

/* ---------- area and perimeter (4.GM.C.8) ----------
   The formulas, with bigger rectangles (A = l × w, P = l + w + l + w), and a missing side from the
   area or the perimeter. 3rd grade's rectangle facts (third.js rectFact) for area and perimeter;
   "▭s48,6" (the area is 48, one side 6) and "▭q30,6" (the perimeter is 30, one side 6). */
export function rect4Facts() {
  const out = [];
  for (const [w, h] of [[12, 7], [15, 4], [9, 8], [14, 6], [11, 9], [13, 5], [16, 3], [10, 8]]) out.push(rectFact("a", w, h));
  for (const [w, h] of [[15, 8], [24, 6], [12, 9], [18, 5], [30, 10], [27, 4], [16, 11], [20, 7]]) out.push(rectFact("p", w, h));
  for (const [w, h] of [[8, 6], [9, 7], [12, 4], [7, 5], [9, 4], [8, 7], [9, 6], [11, 3]]) out.push(rectFact("s", w, h));
  for (const [w, h] of [[9, 6], [12, 5], [8, 7], [10, 4], [14, 6], [7, 3], [11, 9], [15, 5]]) out.push(rectFact("q", w, h));
  return out.map((f) => tag(f, "rect4"));
}

/* ---------- spoken text ---------- */
const OPW = { "+": "plus", "-": "minus", "×": "times", "÷": "divided by" };
// "two and one eighth", "three eighths".
const fracWords = (t) => { const { w, n, d } = typeof t === "string" ? readMixed(t) : t; return (w ? spoken(w) + " and " : "") + fractionWords(n, d, spoken); };
export function spokenFourth(p) {
  if (p.op === "P") return spokenPrime(p);
  if (p.op === "D") return spokenMoney4(p);
  if (p.op === "R") return `${cap(spoken(p.x))} divided by ${spoken(p.y)} is what, remainder what?`;
  if (p.op === "E" && p.kind === "n") return p.vop === "×" ? `${cap(spoken(p.a))} times n equals ${spoken(p.b)}. What is n?` : `n ${OPW[p.vop]} ${spoken(p.a)} equals ${spoken(p.b)}. What is n?`;
  if (p.op === "E") return `${spoken(p.a)} ${OPW[p.o1]} ${spoken(p.b)}, ${OPW[p.o2]} ${spoken(p.c)}`;
  if (p.op === "F") return `${spoken(p.n)} equals ${spoken(p.a)} times what?`;
  if (p.op === "ƒ") {
    if (p.kind === "times") return `${spoken(p.k)} times ${fractionWords(p.n, p.d, spoken)}`;
    if (p.kind === "split") return `${fractionWords(p.n, p.d, spoken)} equals ${fractionWords(p.a, p.d, spoken)} plus ${fractionWords(p.b, p.d, spoken)} plus what ${unitName(p.d)}?`;
    if (p.kind === "tenths") return `${fractionWords(p.a, 10, spoken)} plus ${fractionWords(p.b, 100, spoken)}`;
    return `${fracWords(p.l)} ${p.kind.endsWith("sub") ? "minus" : "plus"} ${fracWords(p.r)}`;
  }
  if (p.op === "d") return `${cap(decWords(p.dec))}. How many ${unitName(p.d)}?`;
  if (p.op === "u") { const U = UNITS[p.pair]; return p.pair === "$:¢" ? `${cap(spoken(p.n))} ${p.n === 1 ? "dollar" : "dollars"}. How many cents?` : `${cap(unitWords(p.n, U))}. How many ${U[4]}?`; }
  if (p.op === "○" && p.dec) return `Compare ${decWords(p.l)} and ${decWords(p.r)}.`;
  if (p.op === "▭" && p.kind === "s") return `The area is ${spoken(p.w * p.h)}. One side is ${spoken(p.h)}. How long is the other side?`;
  if (p.op === "▭" && p.kind === "q") return `The perimeter is ${spoken(2 * (p.w + p.h))}. One side is ${spoken(p.h)}. How long is the other side?`;
  return null;
}
const CMPW = { "<": "is less than", ">": "is greater than", "=": "is equal to" };
export function spokenFourthAnswer(p) {
  if (p.op === "P") return spokenPrimeAnswer(p);
  if (p.op === "D") return spokenMoney4Answer(p);
  if (p.op === "R") return `${cap(spoken(p.x))} divided by ${spoken(p.y)} is ${spoken(p.quo)}, remainder ${spoken(p.rem)}.`;
  if (p.op === "E" && p.kind === "n") return `n is ${spoken(p.ans)}.`;
  if (p.op === "E") return `${spokenFourth(p)}, is ${spoken(p.ans)}`;
  if (p.op === "F") return `${spoken(p.n)} equals ${spoken(p.a)} times ${spoken(p.ans)}`;
  if (p.op === "ƒ") {
    if (p.kind === "times") return `${spokenFourth(p)} is ${fractionWords(p.ans, p.d, spoken)}`;
    if (p.kind === "split") return `${fractionWords(p.n, p.d, spoken)} equals ${fractionWords(p.a, p.d, spoken)} plus ${fractionWords(p.b, p.d, spoken)} plus ${fractionWords(p.ans, p.d, spoken)}`;
    if (p.kind === "tenths") return `${spokenFourth(p)} is ${fractionWords(p.ans, 100, spoken)}`;
    if (p.slots) return `${spokenFourth(p)} is ${fracWords({ w: p.whole, n: p.num, d: p.d })}`;
    return `${spokenFourth(p)} is ${fractionWords(p.ans, p.d, spoken)}`;
  }
  if (p.op === "d") return `${cap(decWords(p.dec))} is ${fractionWords(p.ans, p.d, spoken)}.`;
  if (p.op === "u") { const U = UNITS[p.pair]; return p.pair === "$:¢" ? `${cap(spoken(p.n))} ${p.n === 1 ? "dollar is" : "dollars is"} ${spoken(p.ans)} cents.` : `${cap(unitWords(p.n, U))} ${p.n === 1 ? "is" : "is"} ${unitWords(p.ans, U, true)}.`; }
  if (p.op === "○" && p.dec) return `${decWords(p.l)} ${CMPW[p.sym]} ${decWords(p.r)}`;
  if (p.op === "▭" && (p.kind === "s" || p.kind === "q")) return `The other side is ${spoken(p.ans)}.`;
  return null;
}
// What the Oops card and a miss show, with the answer in place: "29 ÷ 4 = 7 R 1", "2 1/8 + 3/8 = 2 4/8".
export function fourthLine(p, fill) {
  let k = 0;
  // (Money's cents are always two digits: 4.05 dollars.)
  return p.parts.map((x) => { if (x !== null) return x; const i = k++, v = p.slots ? p.slots[i] : p.ans; return fill(p.slotDigits && p.slotDigits[i] ? String(v).padStart(p.slotDigits[i], "0") : v); });
}

/* ---------- prime or composite (4.RA.B) ----------
   A number within 100: is it prime (only 1 × itself) or composite (another factor pair too)? Two
   big keys, Prime and Composite, in the pad's place, as the Equal Twins' true or false: an A or B
   answer, not multiple choice. Its sym is "P" or "C" (as a comparison's); it hits for the number
   itself. Key "P17". */
export const factorPairs = (n) => { const out = []; for (let a = 1; a * a <= n; a++) if (n % a === 0) out.push([a, n / a]); return out; };
export const isPrime = (n) => n > 1 && factorPairs(n).length === 1;
export function primeFact(n) {
  return { op: "P", n, sym: isPrime(n) ? "P" : "C", ans: n, q: String(n), key: "P" + n };
}
export const primeFactOf = (key) => primeFact(Number(key.slice(1)));
// Half prime, half composite: the primes to 97, and composites with few factor pairs (odd ones like
// 51 = 3 × 17 and 91 = 7 × 13, squares like 49), not only the even ones.
export function primeFacts() {
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
  const comps = [4, 9, 15, 21, 25, 27, 33, 35, 39, 49, 51, 57, 63, 69, 77, 81, 85, 87, 91, 93, 95, 12, 18, 24, 36];
  return primes.concat(comps).map((n) => tag(primeFact(n), "prime"));
}
export const spokenPrime = (p) => "Is " + spoken(p.n) + " prime or composite?";
export const spokenPrimeAnswer = (p) => cap(spoken(p.n)) + " is " + (p.sym === "P" ? "prime." : "composite.");

/* ---------- money with a decimal point (4.GM.C.7) ----------
   Dollars and cents written with the point (3.25 dollars), and the four operations with money:
   adding two amounts, taking away and making change, and an amount in cents. The answer is typed
   in two slots, the dollars then the cents, the cents always two digits (5 cents is 05), or as
   cents. It hits for its value in cents. Keys "D3.25+1.40", "D5.00-3.25", "D3.25:c". The Mines'
   dollars (keys starting with the dollar sign) are unchanged. */
const DOLLAR = String.fromCharCode(36);
export const moneyText4 = (c) => DOLLAR + Math.floor(c / 100) + "." + String(c % 100).padStart(2, "0");
const centsOf = (t) => Math.round(Number(t) * 100);
export function moneyFact(key) {
  const t = key.slice(1);
  if (t.endsWith(":c")) {
    const c = centsOf(t.slice(0, -2));
    return { op: "D", kind: "cents", a: c, ans: c, q: moneyText4(c) + " = □¢", parts: [moneyText4(c) + " = ", null, "¢"], key };
  }
  const m = t.match(/^([\d.]+)([+-])([\d.]+)$/), a = centsOf(m[1]), b = centsOf(m[3]), sub = m[2] === "-", c = sub ? a - b : a + b;
  const lead = moneyText4(a) + (sub ? " − " : " + ") + moneyText4(b) + " = " + DOLLAR;
  return { op: "D", kind: sub ? "change" : "add", a, b, ans: c, slots: [Math.floor(c / 100), c % 100], slotNames: ["Dollars", "Cents"], slotMax: [2, 2], slotDigits: [0, 2], slotSay: "nowCents",
    q: lead + "□.□□", parts: [lead, null, ".", null], key };
}
export function moneyFacts() {
  const keys = [
    // Adding: without and with the cents making a dollar.
    "3.25+1.40", "2.10+4.65", "5.30+2.45", "1.05+3.70", "6.20+1.15", "4.50+2.35",
    "2.75+1.50", "3.60+2.85", "1.95+4.25", "4.45+3.80", "2.65+2.65", "7.40+1.75",
    // Making change from whole dollars, by counting up.
    "5.00-3.25", "10.00-6.40", "5.00-1.85", "2.00-0.65", "10.00-7.15", "20.00-12.50", "5.00-2.60", "10.00-4.35",
    // Taking away, without and with regrouping.
    "6.75-2.50", "8.90-3.45", "7.25-4.60", "9.10-5.35",
    // In cents.
    "3.25:c", "1.05:c", "4.60:c", "7.09:c", "2.50:c", "6.38:c", "9.99:c", "5.75:c"
  ];
  return keys.map((k) => tag(moneyFact("D" + k), "money4"));
}
const dollarsWords = (c) => { const d = Math.floor(c / 100), k = c % 100, ds = d === 1 ? "one dollar" : spoken(d) + " dollars"; return k ? (d ? ds + " and " : "") + (k === 1 ? "one cent" : spoken(k) + " cents") : ds; };
export function spokenMoney4(p) {
  if (p.kind === "cents") return cap(dollarsWords(p.a)) + ". How many cents?";
  if (p.kind === "change") return p.a % 100 === 0 ? "You pay " + dollarsWords(p.a) + " for " + dollarsWords(p.b) + ". How much change?" : cap(dollarsWords(p.a)) + " minus " + dollarsWords(p.b) + ".";
  return cap(dollarsWords(p.a)) + " plus " + dollarsWords(p.b) + ".";
}
export function spokenMoney4Answer(p) {
  if (p.kind === "cents") return cap(dollarsWords(p.a)) + " is " + spoken(p.ans) + " cents.";
  if (p.kind === "change" && p.a % 100 === 0) return "The change is " + dollarsWords(p.ans) + ".";
  return spokenMoney4(p).replace(/\.$/, "") + " is " + dollarsWords(p.ans) + ".";
}
