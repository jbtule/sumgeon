// What comes next (Slimelipsis, DESIGN.md §4.1): skip counting, as a row of slimes with numbers
// on them and one holding □. A prototype for the review page (review/proto/); nothing in the game
// reads it yet, and it has no fact keys. No DOM: the drawings are SVG strings, so the tests run in
// Node.
//
// Missouri Learning Standards: K counts to 100 by 1s and 10s and counts on from a number; 1st
// counts to 120 and by 5s; 2nd skip counts by 2s, 5s, 10s and 100s within 1000.
import { spoken } from "./problems.js";

const DK = "#0c171c", GOLD = "#ffc93c", CORAL = "#ff5a4e";
export const SLIME = "#3fd6d0";

// The levels, in teaching order: step (negative counts back), where the numbers start, the
// biggest number shown, and the stratum Slimelipsis visits for it.
export const PATTERN_LEVELS = [
  { id: "ones", name: "By 1s", grade: "K", step: 1, stratum: "cellar" },
  { id: "tens", name: "By 10s", grade: "K", step: 10, stratum: "cellar" },
  { id: "back", name: "Back by 1s", grade: "K–1st", step: -1, stratum: "cellar" },
  { id: "to120", name: "By 1s to 120", grade: "1st", step: 1, stratum: "hall" },
  { id: "fives", name: "By 5s", grade: "1st", step: 5, stratum: "hall" },
  { id: "twos", name: "By 2s", grade: "2nd", step: 2, stratum: "mines" },
  { id: "hundreds", name: "By 100s", grade: "2nd", step: 100, stratum: "mines" },
  { id: "middle", name: "Middle □", grade: "1st–2nd", step: 0, stratum: "mines" }
];
export const patternLevel = (id) => PATTERN_LEVELS.find((l) => l.id === id) || PATTERN_LEVELS[0];

// The first number of every row a level can show, and how many numbers it shows before the □
// (3 in K; 4 after, but 3 when they reach three digits, so the row still fits a phone).
// - ones: from 1 to 17 (the □ is at most 20).
// - tens: 10, 20 … from a ten, to 100.
// - back: from 10 down, or from 20 down (the K and 1st grade standards), to no lower than 1.
// - to120: 1st grade's counting past 100: from 95 to 116, often across a ten (38, 39, 40).
// - fives: 5 to 100; twos: even numbers to 50; hundreds: 100 to 1000.
const range = (a, b, by = 1) => { const out = []; for (let n = a; n <= b; n += by) out.push(n); return out; };
function rowsOf(id) {
  if (id === "ones") return range(1, 17).map((a) => ({ a, step: 1, shown: 3 }));
  if (id === "tens") return range(10, 70, 10).map((a) => ({ a, step: 10, shown: 3 }));
  if (id === "back") return range(4, 20).map((a) => ({ a, step: -1, shown: 3 }));
  if (id === "to120") return range(95, 117).map((a) => ({ a, step: 1, shown: 3 }));
  if (id === "fives") return range(5, 80, 5).map((a) => ({ a, step: 5, shown: 4 }));
  if (id === "twos") return range(2, 42, 2).map((a) => ({ a, step: 2, shown: 4 }));
  if (id === "hundreds") return range(100, 700, 100).map((a) => ({ a, step: 100, shown: 3 }));
  return [];
}
// Every row a level can ask: { level, step, nums (with the answer in place), blank (its index),
// ans }. "middle" hides the 2nd or 3rd of four numbers, from the 2s, 5s, 10s and 100s.
export function allPatterns(id) {
  if (id === "middle") {
    const out = [];
    for (const lv of ["twos", "fives", "tens", "hundreds"]) {
      for (const r of rowsOf(lv)) {
        const nums = range(0, 3).map((i) => r.a + i * r.step);
        if (nums[3] > 1000) continue;
        for (const blank of [1, 2]) out.push({ level: id, step: r.step, nums, blank, ans: nums[blank] });
      }
    }
    return out;
  }
  return rowsOf(id).map((r) => {
    const nums = range(0, r.shown).map((i) => r.a + i * r.step);
    return { level: id, step: r.step, nums, blank: r.shown, ans: nums[r.shown] };
  });
}
// One problem at random. For to120, half the rows end on a new ten (38, 39, 40), where counting
// on is hardest.
export function patternProblem(id, rnd = Math.random) {
  let list = allPatterns(id);
  if (id === "to120" && rnd() < 0.5) list = list.filter((p) => p.ans % 10 === 0);
  return list[Math.floor(rnd() * list.length)];
}

// What the voice says: "Two, four, six. What comes next?"; "Two, blank, six, eight. What's
// missing?"
export function spokenPattern(p) {
  const words = p.nums.map((n, i) => (i === p.blank ? "blank" : spoken(n)));
  if (p.blank === p.nums.length - 1) return cap(words.slice(0, -1).join(", ")) + ". What comes next?";
  return cap(words.join(", ")) + ". What's missing?";
}
// Said after a miss: "Eight comes next." / "Six is missing."
export function spokenPatternAnswer(p) {
  return cap(spoken(p.ans)) + (p.blank === p.nums.length - 1 ? " comes next." : " is missing.");
}
const cap = (t) => t[0].toUpperCase() + t.slice(1);
// The row as text: "2, 4, 6, □".
export const patternText = (p) => p.nums.map((n, i) => (i === p.blank ? "□" : n)).join(", ");

/* ---------- the drawing ---------- */
// Each slime is BLOB wide in the drawing, GAP apart, with HOP of room above it for the hint's
// hops (always there, so opening the hint doesn't move the row). A number's font size shrinks with
// its digits so it stays inside its slime: Bungee's digits are about DIGIT_EM wide, and a slime's
// belly is INNER wide.
export const BLOB = 84, GAP = 12, HOP = 46, BLOB_H = 82, INNER = 66, DIGIT_EM = 0.78;
export const fontFor = (n) => Math.min(40, Math.floor(INNER / (String(n).length * DIGIT_EM)));
export const textWidth = (n) => String(n).length * DIGIT_EM * fontFor(n);
export const rowWidth = (count) => count * BLOB + (count - 1) * GAP;
const f1 = (n) => Math.round(n * 10) / 10;

// One slime, standing on (x, y): Slimelipsis's drippy dome, wider, with a face on its head.
function slime(x, y, fill, opt = {}) {
  // The dome's path is about 58 wide and 52 tall.
  const sx = BLOB / 58, sy = BLOB_H / 52;
  const d = `M-26 -2 C-34 -24 -20 -50 0 -50 C20 -50 34 -24 26 -2 Q18 4 10 1 Q0 5 -10 1 Q-18 4 -26 -2Z`;
  const shape = `<path transform="translate(${x} ${y}) scale(${f1(sx)} ${f1(sy)})" d="${d}"/>`;
  // The stroke is in the shape's own units, which are scaled about 1.55×.
  if (opt.empty) return `<g fill="#0c171cdd" stroke="${GOLD}" stroke-width="2.4" stroke-dasharray="4.5 4" stroke-linejoin="round" class="pb-blank">${shape}</g>`;
  return `<g fill="${DK}" stroke="${DK}" stroke-width="6" stroke-linejoin="round">${shape}</g><g fill="${fill}">${shape}</g><g fill="url(#pbsh)">${shape}</g>`;
}
const eyes = (x, y) => [-9, 9].map((dx) => `<circle cx="${x + dx}" cy="${y}" r="5.5" fill="#fff" stroke="${DK}" stroke-width="2.5"/><circle cx="${x + dx + 1}" cy="${y + 0.8}" r="2.4" fill="${DK}"/>`).join("");

// The row. opt.typed: what's been typed into the □ ("" shows "?"); opt.state: "right" or "wrong"
// once answered (the □ shows the answer); opt.hops: the hint's hops ({ labels: [one per gap],
// strong: the gaps into and out of the □ }).
export function patternSvg(p, opt = {}) {
  const n = p.nums.length, W = rowWidth(n), base = HOP + BLOB_H;
  let s = `<defs><linearGradient id="pbsh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
  const cx = (i) => i * (BLOB + GAP) + BLOB / 2;
  // The sticky trail under them.
  s += `<path d="M6 ${base + 4} Q${W / 4} ${base + 12} ${W / 2} ${base + 4} T${W - 6} ${base + 4}" fill="none" stroke="${DK}" stroke-width="12" stroke-linecap="round"/><path d="M6 ${base + 4} Q${W / 4} ${base + 12} ${W / 2} ${base + 4} T${W - 6} ${base + 4}" fill="none" stroke="#8eeae4" stroke-width="5" stroke-linecap="round"/>`;
  p.nums.forEach((num, i) => {
    const x = cx(i), mid = base - BLOB_H * 0.36;
    if (i === p.blank) {
      const shown = opt.state ? String(p.ans) : opt.typed ? opt.typed : "?";
      const color = opt.state === "wrong" ? CORAL : GOLD;
      s += opt.state === "right" ? slime(x, base, GOLD) + eyes(x, base - BLOB_H * 0.74) : slime(x, base, null, { empty: true });
      const size = shown === "?" ? 44 : fontFor(shown);
      s += `<text x="${x}" y="${f1(mid)}" dy=".36em" text-anchor="middle" font-family="Bungee, sans-serif" font-size="${size}" fill="${opt.state === "right" ? DK : color}">${shown}</text>`;
      return;
    }
    s += slime(x, base, SLIME) + eyes(x, base - BLOB_H * 0.74);
    s += `<text x="${x}" y="${f1(mid)}" dy=".36em" text-anchor="middle" font-family="Bungee, sans-serif" font-size="${fontFor(num)}" fill="${DK}">${num}</text>`;
  });
  // The hint's hops, slime to slime: an arc with an arrowhead and its label ("+2", "+2 = ?").
  if (opt.hops) {
    opt.hops.labels.forEach((label, i) => {
      const x0 = cx(i), x1 = cx(i + 1), m = (x0 + x1) / 2, y = HOP - 2, strong = opt.hops.strong.includes(i);
      const col = strong ? GOLD : "#8eeae4";
      // The arrowhead lies along the arc where it lands: two short barbs 30° either side of it.
      const ex = x1 - 8, ey = y + 6, a = Math.atan2(ey - (y - 30), ex - m), barb = (t) => `${f1(ex - 10 * Math.cos(a + t))} ${f1(ey - 10 * Math.sin(a + t))}`;
      s += `<path d="M${x0 + 8} ${ey} Q${m} ${y - 30} ${ex} ${ey}" fill="none" stroke="${col}" stroke-width="3.5" stroke-linecap="round"/>`
        + `<path d="M${barb(0.5)} L${ex} ${ey} L${barb(-0.5)}" fill="none" stroke="${col}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`
        + `<text x="${m}" y="${y - 18}" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="${label.length > 6 ? 15 : 18}" fill="${col}">${label}</text>`;
    });
  }
  return `<svg viewBox="0 0 ${W} ${base + 16}" class="pattern" role="img" aria-label="${opt.label || patternText(p)}">${s}</svg>`;
}

// The hint: { hops, say }. Every hop is labeled with the step ("+2", or "−1" counting back); the
// hop into the □ says "+2 = ?" until it's worked, when the words finish it.
export function patternHint(p, worked) {
  const step = p.nums[1] - p.nums[0], k = Math.abs(step), sign = step < 0 ? "−" : "+";
  const into = p.blank - 1, from = p.nums[p.blank - 1];
  const labels = p.nums.slice(1).map((_, i) => (i === into && !worked ? `${sign}${k} = ?` : `${sign}${k}`));
  const strong = [into];
  const more = step < 0 ? `${k} less` : `${k} more`;
  const sum = `${from} ${sign} ${k} = ${worked ? p.ans : "?"}`;
  return { hops: { labels, strong }, say: `Each slime is ${more}. ${sum}` };
}

/* ---------- odd and even (2.OA.C.3) ---------- */
// A group of 5 to 8 slimes, each holding a number, and "How many even numbers?" (or odd). The
// answer is the count, typed. The count is spread out (from none up to all but one), so it isn't
// always about half, and it's never all of them.
export const ODD_LEVELS = [
  { id: "oddeven20", name: "Odd & even to 20", grade: "2nd", stratum: "mines", max: 20 },
  { id: "oddeven100", name: "Odd & even to 100", grade: "2nd", stratum: "mines", max: 100 }
];
export const isOddEven = (id) => ODD_LEVELS.some((l) => l.id === id);
const isEven = (n) => n % 2 === 0;
export function oddEvenProblem(id, rnd = Math.random) {
  const lv = ODD_LEVELS.find((l) => l.id === id) || ODD_LEVELS[0];
  const n = 5 + Math.floor(rnd() * 4), ask = rnd() < 0.5 ? "even" : "odd";
  // How many of the asked kind: 0 to n − 1, the ends a little less often than the middle.
  const k = Math.min(n - 1, Math.floor(rnd() * n * 0.6 + rnd() * n * 0.5));
  const pool = (want) => Array.from({ length: lv.max }, (_, i) => i + 1).filter((v) => isEven(v) === want);
  const take = (list, m) => { const out = [], src = list.slice(); for (let i = 0; i < m && src.length; i++) out.push(src.splice(Math.floor(rnd() * src.length), 1)[0]); return out; };
  const nums = take(pool(ask === "even"), k).concat(take(pool(ask !== "even"), n - k));
  for (let i = nums.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [nums[i], nums[j]] = [nums[j], nums[i]]; }
  return { level: lv.id, kind: "oddeven", ask, nums, max: lv.max, ans: nums.filter((v) => isEven(v) === (ask === "even")).length };
}
export const spokenOddEven = (p) => `How many ${p.ask} numbers?`;
// The slimes in rows of up to 4. Under each, room for the hint (the same room shown or not, so
// opening it doesn't move them): for numbers to 20, the number's dots in pairs (two rows), a dot
// left over glowing coral; past 20, the ones digit, since a number is odd or even as its ones are.
// Worked, the asked kind glow gold and are numbered 1, 2, 3 ….
export const ODD_ROW = 4;
export function oddEvenSvg(p, opt = {}) {
  const per = opt.perRow || ODD_ROW, n = p.nums.length, rows = Math.ceil(n / per), under = 30, rowH = BLOB_H + under + 12;
  const W = rowWidth(Math.min(per, n));
  let s = `<defs><linearGradient id="pbsh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
  let count = 0;
  p.nums.forEach((num, i) => {
    const r = Math.floor(i / per), inRow = Math.min(per, n - r * per), c = i % per;
    const x0 = (W - rowWidth(inRow)) / 2, x = x0 + c * (BLOB + GAP) + BLOB / 2, base = r * rowH + BLOB_H + 4;
    const asked = isEven(num) === (p.ask === "even"), glow = opt.worked && asked;
    if (glow) s += `<ellipse cx="${x}" cy="${base - BLOB_H * 0.45}" rx="${BLOB * 0.62}" ry="${BLOB_H * 0.62}" fill="${GOLD}" opacity=".35"/>`;
    s += slime(x, base, glow ? GOLD : SLIME) + eyes(x, base - BLOB_H * 0.74);
    s += `<text x="${x}" y="${f1(base - BLOB_H * 0.36)}" dy=".36em" text-anchor="middle" font-family="Bungee, sans-serif" font-size="${fontFor(num)}" fill="${DK}">${num}</text>`;
    if (opt.hint) {
      const y = base + 10;
      if (p.max <= 20) {
        // Pairs: columns of two dots; one left over sits alone, coral.
        const pairs = Math.floor(num / 2), odd = num % 2, cols = pairs + odd, step = Math.min(11, (BLOB + GAP - 4) / Math.max(1, cols));
        const dx0 = x - (cols - 1) * step / 2, rad = Math.min(4, step * 0.4);
        for (let k = 0; k < pairs; k++) s += `<circle cx="${f1(dx0 + k * step)}" cy="${y - 1}" r="${f1(rad)}" fill="#8eeae4"/><circle cx="${f1(dx0 + k * step)}" cy="${y + 9}" r="${f1(rad)}" fill="#8eeae4"/>`;
        if (odd) s += `<circle cx="${f1(dx0 + pairs * step)}" cy="${y + 4}" r="${f1(rad + 0.8)}" fill="${CORAL}"/>`;
      } else {
        // The ones digit, in a little box: even ones in the slime's color, odd ones coral.
        const ones = num % 10;
        s += `<rect x="${x - 11}" y="${y - 7}" width="22" height="20" rx="5" fill="${DK}" stroke="${isEven(ones) ? "#8eeae4" : CORAL}" stroke-width="2"/><text x="${x}" y="${y + 3}" dy=".36em" text-anchor="middle" font-family="Bungee, sans-serif" font-size="13" fill="${isEven(ones) ? "#8eeae4" : CORAL}">${ones}</text>`;
      }
    }
    if (glow) { count++; s += `<circle cx="${x + BLOB * 0.38}" cy="${base - BLOB_H * 0.85}" r="12" fill="${GOLD}" stroke="${DK}" stroke-width="2.5"/><text x="${x + BLOB * 0.38}" y="${base - BLOB_H * 0.85}" dy=".36em" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="15" fill="${DK}">${count}</text>`; }
  });
  // A worked row's gold glow reaches past the end slimes, so it gets room at the sides.
  const pad = opt.worked ? Math.ceil(BLOB * 0.12) + 6 : 6;
  return `<svg viewBox="${-pad} -10 ${W + 2 * pad} ${rows * rowH + 4}" class="pattern" role="img" aria-label="${p.nums.join(", ")}">${s}</svg>`;
}
export const spokenOddEvenAnswer = (p) => (p.ans ? cap(spoken(p.ans)) + (p.ans === 1 ? " number is " : " numbers are ") + p.ask + "." : `None of them are ${p.ask}.`);
export function oddEvenHint(p, worked) {
  const kind = p.ask, rule = p.max <= 20 ? "Pair up the dots. A dot left over means odd." : "Look at the ones. Even numbers end in 0, 2, 4, 6 or 8.";
  if (!worked) return { say: rule };
  const list = Array.from({ length: p.ans }, (_, i) => i + 1);
  return { say: p.ans ? `The ${kind} ones: ${list.join(", ")}. ${p.ans} ${kind} number${p.ans === 1 ? "" : "s"}.` : `None of them is ${kind}. 0 ${kind} numbers.` };
}

/* ---------- the game's facts (Slimelipsis's strands, learn.js patK, patH, patM) ----------
   Fixed samples, so 70% of a level can be learned and every problem is recorded. Keys:
   - "…2,4,6,□": the row as shown, the □ where the answer goes ("…2,□,6,8" in the middle).
   - "◐e3,8,11,14,17": how many even (e) or odd (o) numbers among these?
   A fact: { op: "…", set (its level), nums, blank, step, ans, key, q } or { op: "◐", set, ask,
   nums, max, ans, key, q }. */
export function patternFact(set, nums, blank) {
  const shown = nums.map((n, i) => (i === blank ? "□" : n));
  return { op: "…", set, nums, blank, step: nums[1] - nums[0], ans: nums[blank], key: "…" + shown.join(","), q: shown.join(", ") };
}
export function patternFactOf(key) {
  const parts = key.slice(1).split(","), blank = parts.indexOf("□"), known = parts.map((v, i) => (i === blank ? null : Number(v)));
  // The step from two shown numbers next to each other.
  const i = known.findIndex((v, j) => v != null && known[j + 1] != null);
  const step = known[i + 1] - known[i], nums = known.map((v, j) => (v != null ? v : known[i] + (j - i) * step));
  return patternFact(setOf(nums, blank), nums, blank);
}
// Which level a row is in, from its step and where the □ is.
function setOf(nums, blank) {
  const step = nums[1] - nums[0];
  if (blank < nums.length - 1) return "middle";
  if (step === -1) return "back";
  if (step === 1) return Math.max(...nums) > 94 ? "to120" : "ones";
  return { 10: "tens", 5: "fives", 2: "twos", 100: "hundreds" }[step];
}
export function oddEvenFact(set, ask, nums, max) {
  const ans = nums.filter((v) => isEven(v) === (ask === "even")).length;
  return { op: "◐", set, kind: "oddeven", ask, nums, max, ans, key: "◐" + ask[0] + nums.join(","), q: `${cap(ask)} numbers: □` };
}
export function oddEvenFactOf(key) {
  const nums = key.slice(2).split(",").map(Number), max = Math.max(...nums) > 20 ? 100 : 20;
  return oddEvenFact(max > 20 ? "oddeven100" : "oddeven20", key[1] === "e" ? "even" : "odd", nums, max);
}
// The levels, in teaching order, with the stratum each belongs to (learn.js makes one strand per
// stratum from them).
export const PATTERN_GAME_LEVELS = [
  { id: "ones", name: "Count on by 1s", stratum: "cellar" },
  { id: "tens", name: "Count by 10s", stratum: "cellar" },
  { id: "back", name: "Count back by 1s", stratum: "cellar" },
  { id: "to120", name: "Count on to 120", stratum: "hall" },
  { id: "fives", name: "Count by 5s", stratum: "hall" },
  { id: "twos", name: "Count by 2s", stratum: "mines" },
  { id: "hundreds", name: "Count by 100s", stratum: "mines" },
  { id: "middle", name: "What's missing? By 2s, 5s, 10s, 100s", stratum: "mines" },
  { id: "oddeven20", name: "Odd and even to 20", stratum: "mines" },
  { id: "oddeven100", name: "Odd and even to 100", stratum: "mines" }
];
// A fixed shuffle (a small LCG, as three.js), so a sample never changes between builds.
function seeded(seed) { let s = seed; return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648; }
let factCache = null;
export function patternFacts() {
  if (factCache) return factCache;
  const out = [];
  // Every row of the counting levels (the middle one sampled to 30), then 16 groups of each
  // odd and even level.
  for (const id of ["ones", "tens", "back", "to120", "fives", "twos", "hundreds"]) for (const p of allPatterns(id)) out.push(patternFact(id, p.nums, p.blank));
  const r = seeded(4242), mid = allPatterns("middle");
  for (let i = mid.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [mid[i], mid[j]] = [mid[j], mid[i]]; }
  mid.slice(0, 30).forEach((p) => out.push(patternFact("middle", p.nums, p.blank)));
  for (const lv of ODD_LEVELS) {
    const rr = seeded(lv.max === 20 ? 2020 : 1001), seen = new Set();
    while (seen.size < 16) {
      const p = oddEvenProblem(lv.id, rr), f = oddEvenFact(lv.id, p.ask, p.nums, lv.max);
      if (!seen.has(f.key)) { seen.add(f.key); out.push(f); }
    }
  }
  return (factCache = out);
}
// What the voice says, and says after a miss, for either kind.
export const spokenPatternFact = (f) => (f.op === "◐" ? spokenOddEven(f) : spokenPattern(f));
export const spokenPatternFactAnswer = (f) => (f.op === "◐" ? spokenOddEvenAnswer(f) : spokenPatternAnswer(f));
// The hint for either kind: { hops, say } for a row, { say } for odd and even.
export const patternFactHint = (f, worked) => (f.op === "◐" ? oddEvenHint(f, worked) : patternHint(f, worked));
