// 3rd grade past the tables (DESIGN.md §4.1, the Tables Tower): × tens (4 × 30), fractions as a
// hidden whole number (1/2 = □/4), rounding to the nearest 10 and 100, and the area and perimeter
// of a drawn rectangle. Every answer is a whole number typed on the number pad, so nothing needs
// new keys. Each set is a fixed sample, so 70% of a level can be learned and every problem is
// recorded. No DOM: runs in Node for the tests.

// A fixed shuffle (a small LCG), so the samples never change between builds.
function sample(list, n, seed) {
  let s = seed;
  const r = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}

/* ---------- × tens (3.NBT.A.3) ----------
   A one-digit number times a multiple of 10 from 20 to 90: 4 × 30 is 4 × 3 tens, 12 tens, 120.
   Plain × facts, keyed like the tables ("×4,30"). */
export function timesTens() {
  const all = [];
  for (let a = 2; a <= 9; a++) for (let t = 2; t <= 9; t++) all.push({ op: "×", x: a, y: t * 10, ans: a * t * 10, q: a + " × " + t * 10 });
  return sample(all, 32, 3301);
}

/* ---------- fractions (3.NF.A) ----------
   A fraction equal to another with a number hidden: 1/2 = □/4 (2), 2/4 = □/2 (1), and wholes,
   1 = □/4 (4). The answer and the damage are the hidden numerator. Key "/a,b,d" is a/b = □/d,
   with b = 1 for a whole number. Denominators 2, 3, 4, 6 and 8, as 3rd grade uses. */
export function fractionFact(a, b, d) {
  const ans = (a * d) / b;
  return { op: "/", a, b, d, ans, q: (b === 1 ? a : a + "/" + b) + " = □/" + d, key: "/" + a + "," + b + "," + d };
}
export function fractionFactOf(key) {
  const [a, b, d] = key.slice(1).split(",").map(Number);
  return fractionFact(a, b, d);
}
export function fractionFacts() {
  const out = [];
  // Wholes: how many fourths make 1? 2?
  for (const d of [2, 3, 4, 6, 8]) out.push(fractionFact(1, 1, d));
  for (const d of [2, 3, 4]) out.push(fractionFact(2, 1, d));
  // Equal fractions, both ways: 1/2 = □/4 and 2/4 = □/2.
  const pairs = [[2, 4], [2, 6], [2, 8], [3, 6], [4, 8]];
  for (const [b, d] of pairs) for (let a = 1; a < b; a++) { out.push(fractionFact(a, b, d)); out.push(fractionFact((a * d) / b, d, b)); }
  return out;
}
// "one half", "three fourths", "two", for the voice.
// (4th grade adds fifths, ninths, tenths, twelfths and hundredths: fourth.js.)
const UNIT = { 2: ["half", "halves"], 3: ["third", "thirds"], 4: ["fourth", "fourths"], 5: ["fifth", "fifths"], 6: ["sixth", "sixths"], 8: ["eighth", "eighths"],
  9: ["ninth", "ninths"], 10: ["tenth", "tenths"], 12: ["twelfth", "twelfths"], 100: ["hundredth", "hundredths"] };
export function fractionWords(n, d, spoken) {
  if (d === 1) return spoken(n);
  return spoken(n) + " " + UNIT[d][n === 1 ? 0 : 1];
}
export const unitName = (d) => UNIT[d][1];

/* ---------- rounding (3.NBT.A.1) ----------
   Round a number to the nearest 10 or 100: 47 ≈ □ (50). Halfway rounds up. Key "≈47,10". */
export function roundFact(n, to) {
  const ans = Math.floor((n + to / 2) / to) * to;
  return { op: "≈", n, to, ans, q: n + " ≈ □", key: "≈" + n + "," + to };
}
export function roundFactOf(key) {
  const [n, to] = key.slice(1).split(",").map(Number);
  return roundFact(n, to);
}
export function roundFacts() {
  const tens = [], hundreds = [];
  for (let n = 11; n <= 99; n++) if (n % 10) tens.push(roundFact(n, 10));
  for (let n = 101; n <= 999; n++) if (n % 100 && n % 10) hundreds.push(roundFact(n, 100));
  // A few halfway numbers on purpose (45, 350), since that's the rule to learn.
  const halves = [roundFact(45, 10), roundFact(65, 10), roundFact(250, 100), roundFact(750, 100)];
  const keys = new Set(halves.map((f) => f.key));
  return halves.concat(sample(tens, 20, 4421).filter((f) => !keys.has(f.key)), sample(hundreds, 20, 5531).filter((f) => !keys.has(f.key)));
}

/* ---------- area and perimeter (3.MD.C–D) ----------
   A rectangle drawn with its sides labeled: its area (count the squares, or rows × columns) or
   its perimeter (all four sides). Key "▭a4,3" or "▭p4,3": the kind, the width and the height. */
// 4th grade (fourth.js) adds a missing side: from the area, "▭s48,6" (the area is 48, one side 6,
// so the other is 8), or from the perimeter, "▭q30,6" (the other is 9). w is the side to find.
export function rectFact(kind, w, h) {
  if (kind === "s") return { op: "▭", kind, w, h, ans: w, area: w * h, q: "Side = □", key: "▭s" + w * h + "," + h };
  if (kind === "q") return { op: "▭", kind, w, h, ans: w, per: 2 * (w + h), q: "Side = □", key: "▭q" + 2 * (w + h) + "," + h };
  const ans = kind === "a" ? w * h : 2 * (w + h);
  return { op: "▭", kind, w, h, ans, q: (kind === "a" ? "Area" : "Perimeter") + " = □", key: "▭" + kind + w + "," + h };
}
export function rectFactOf(key) {
  const [a, b] = key.slice(2).split(",").map(Number);
  if (key[1] === "s") return rectFact("s", a / b, b);
  if (key[1] === "q") return rectFact("q", a / 2 - b, b);
  return rectFact(key[1], a, b);
}
export function rectFacts() {
  const area = [], per = [];
  for (let w = 2; w <= 7; w++) for (let h = 2; h <= w; h++) area.push(rectFact("a", w, h));
  for (let w = 2; w <= 9; w++) for (let h = 1; h <= w; h++) per.push(rectFact("p", w, h));
  return sample(area, 16, 6661).concat(sample(per, 16, 7771));
}
// The rectangle, drawn: unit squares for area (to count), the sides labeled for both. The
// problem shows it with "Area = □"; the hint draws it again.
// For a perimeter all four sides are labeled; opt.grid draws the squares on a perimeter too.
export function rectSvg(f, opt) {
  opt = opt || {};
  // 4th grade's rectangles are bigger and use the formula: past 9 a side (or a side to find) no
  // squares to count, drawn to fit rather than to scale. A missing side is labeled "?" (the
  // number once worked), with the area or perimeter written inside.
  const per = f.kind === "p" || f.kind === "q", miss = f.kind === "s" || f.kind === "q", formula = miss || Math.max(f.w, f.h) > 9;
  const u = Math.min(22, Math.floor(150 / Math.max(f.w, f.h)));
  const W = formula ? 150 : f.w * u, H = formula ? Math.round(30 + 60 * Math.min(1, f.h / f.w)) : f.h * u, x0 = 26, y0 = per ? 22 : 6, ink = "var(--ink, #f3efe4)";
  let s = `<rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="#ffc93c33" stroke="${ink}" stroke-width="3"/>`;
  if (miss) {
    const lab = (x, y, t, c, size) => `<text x="${x}" y="${y}" text-anchor="middle" fill="${c}" font-family="Nunito,sans-serif" font-size="${size || 15}" font-weight="900">${t}</text>`;
    const wl = opt.worked ? f.w : "?", coral = "var(--coral, #ff5a4e)";
    s += lab(x0 + W / 2, y0 + H / 2 + 5, f.kind === "s" ? "Area " + f.area : "Perimeter " + f.per, "var(--gold, #ffc93c)", 14);
    s += lab(x0 + W / 2, y0 + H + 18, wl, coral) + lab(x0 - 13, y0 + H / 2 + 5, f.h, ink);
    if (per) s += lab(x0 + W / 2, y0 - 7, wl, coral) + lab(x0 + W + 13, y0 + H / 2 + 5, f.h, ink);
    const vw = x0 + W + (per ? 26 : 8), vh = y0 + H + 24;
    return `<svg class="rectfig" viewBox="0 0 ${vw} ${vh}" width="${Math.round(vw * 1.2)}" height="${Math.round(vh * 1.2)}" role="img" aria-label="a rectangle with a side to find">${s}</svg>`;
  }
  if (!formula && (!per || opt.grid)) {
    for (let i = 1; i < f.w; i++) s += `<line x1="${x0 + i * u}" y1="${y0}" x2="${x0 + i * u}" y2="${y0 + H}" stroke="${ink}" stroke-opacity=".45" stroke-width="1.5"/>`;
    for (let i = 1; i < f.h; i++) s += `<line x1="${x0}" y1="${y0 + i * u}" x2="${x0 + W}" y2="${y0 + i * u}" stroke="${ink}" stroke-opacity=".45" stroke-width="1.5"/>`;
  }
  const label = (x, y, t) => `<text x="${x}" y="${y}" text-anchor="middle" fill="${ink}" font-family="Nunito,sans-serif" font-size="15" font-weight="900">${t}</text>`;
  s += label(x0 + W / 2, y0 + H + 18, f.w) + label(x0 - 13, y0 + H / 2 + 5, f.h);
  if (per) s += label(x0 + W / 2, y0 - 7, f.w) + label(x0 + W + 13, y0 + H / 2 + 5, f.h);
  const vw = x0 + W + (per ? 26 : 8), vh = y0 + H + 24;
  return `<svg class="rectfig" viewBox="0 0 ${vw} ${vh}" width="${Math.round(vw * 1.2)}" height="${Math.round(vh * 1.2)}" role="img" aria-label="a rectangle ${f.w} by ${f.h}">${s}</svg>`;
}

/* ---------- comparing fractions (3.NF.A.3d; Missouri 3.NF.A.6) ----------
   Two fractions with the same denominator (3/8 ○ 5/8: same size pieces, more pieces is more) or
   the same numerator (2/3 ○ 2/6: same number of pieces, bigger pieces is more), answered on the
   < = > keys as every comparison is: Chompers, visiting the Tables Tower, eats the bigger fraction
   (and Halfling, who asks fractions, asks them too). A few are equal, equal fractions from the
   level before (2/4 ○ 1/2), so = is sometimes the answer. Denominators 2, 3, 4, 6 and 8.
   The fact: { op: "○", l: "3/8", r: "5/8", sym, ans, q: "3/8 □ 5/8", key: "○3/8,5/8", frac: "den",
   "num" or "eq" }. A comparison hits for its bigger number; for fractions that's the bigger
   fraction's numerator, its pieces (as the Tower's other fractions hit for a numerator). */
export function fracCompareFact(l, r) {
  const [ln, ld] = l.split("/").map(Number), [rn, rd] = r.split("/").map(Number), a = ln * rd, b = rn * ld;
  const sym = a < b ? "<" : a > b ? ">" : "=";
  return { op: "○", l, r, sym, ans: sym === "<" ? rn : sym === ">" ? ln : Math.max(ln, rn), q: l + " □ " + r, key: "○" + l + "," + r,
    frac: ld === rd ? "den" : ln === rn ? "num" : "eq" };
}
export const isFracCompare = (key) => String(key)[0] === "○" && String(key).includes("/");
export function fracCompareFactOf(key) {
  const [l, r] = key.slice(1).split(",");
  return fracCompareFact(l, r);
}
let fcCache = null;
export function fracCompareFacts() {
  if (fcCache) return fcCache;
  const D = [2, 3, 4, 6, 8], den = [], num = [];
  // Same denominator: two different numerators under it (1/4 ○ 3/4).
  for (const d of D) for (let a = 1; a < d; a++) for (let b = a + 1; b < d; b++) den.push([a + "/" + d, b + "/" + d]);
  // Same numerator: two different denominators, the numerator less than both (1/2 ○ 1/3, 2/3 ○ 2/6).
  for (let n = 1; n <= 3; n++) for (const d of D) for (const e of D) if (d < e && n < d) num.push([n + "/" + d, n + "/" + e]);
  // A fixed sample, either order (the bigger on the left or the right).
  let s = 6203;
  const r = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const pick = (list, k, seed) => sample(list, k, seed).map(([x, y]) => (r() < 0.5 ? [x, y] : [y, x]));
  // Equal: equal fractions from the level before, so = is the answer now and then.
  const eq = [["2/4", "1/2"], ["1/3", "2/6"], ["3/4", "6/8"], ["4/6", "2/3"]];
  return (fcCache = pick(den, 10, 8807).concat(pick(num, 10, 9901), eq).map(([x, y]) => fracCompareFact(x, y)));
}
