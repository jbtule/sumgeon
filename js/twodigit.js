// Two-digit addition and subtraction: 1st grade's tens (the Balance Hall: 40 + 30, 10 more, 34 + 20)
// and 2nd grade's within 100 and 10 or 100 more within 1000 (the Crystal Mines, Haberhasher; the
// bands pick sets with twoLevel, learn.js BANDS). There are thousands of such problems, so each level is a fixed
// sample of them; that keeps mastery (70% of a level learned) reachable, and every problem gets
// a recorded voice. No DOM: runs in Node for the tests.

const SYM = { "+": "+", "-": "−" };
const make = (op, x, y) => ({ op, x, y, ans: op === "+" ? x + y : x - y, q: x + " " + SYM[op] + " " + y });

// A fixed shuffle (a small LCG), so the sample never changes between builds.
function sample(list, n, seed) {
  let s = seed;
  const r = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}
const ones = (n) => n % 10;
// Everything here is past 20, so none of it overlaps the within-20 facts.
function candidates(test, op) {
  const out = [];
  for (let x = 1; x <= 100; x++) for (let y = 1; y <= 99; y++) {
    if (op === "+" && (x > y || x + y > 100 || x + y <= 20)) continue; // + once per turnaround
    if (op === "-" && (y >= x || x <= 20)) continue;
    if (test(x, y)) out.push(make(op, x, y));
  }
  return out;
}

export const TWO_LEVELS = [
  { name: "Add tens", op: "+", test: (x, y) => !ones(x) && !ones(y), n: 99 },
  { name: "Add ones", op: "+", test: (x, y) => x < 10 && ones(x) + ones(y) < 10 && y > 10, n: 24 },
  { name: "Add tens and ones", op: "+", test: (x, y) => x > 10 && ones(x) && ones(y) && ones(x) + ones(y) < 10, n: 24 },
  { name: "Add and regroup", op: "+", test: (x, y) => ones(x) + ones(y) >= 10 && ones(x) && ones(y), n: 30 },
  { name: "Subtract tens", op: "-", test: (x, y) => !ones(x) && !ones(y), n: 24 }, // (a subset of the 44 it had: the same shuffle, cut shorter)
  { name: "Subtract, no regrouping", op: "-", test: (x, y) => ones(y) && ones(x) > ones(y), n: 24 },
  { name: "Subtract and regroup", op: "-", test: (x, y) => ones(y) && ones(x) < ones(y), n: 30 },
  // 1st grade (1.NBT.C.4–5): 10 more and 10 less than a number, and adding tens to a number.
  { name: "10 more", op: "+", test: (x, y) => x === 10 && ones(y) && y > 10 && y < 90, n: 16 },
  { name: "10 less", op: "-", test: (x, y) => y === 10 && ones(x) > 0, n: 16 },
  { name: "Add tens to a number", op: "+", test: (x, y) => x + y < 100 && ((!ones(x) && x >= 20 && ones(y) && y > 10) || (!ones(y) && y >= 20 && ones(x) && x > 10)), n: 20 },
  // 2nd grade (2.NBT.B.8): 10 more or less, and 100 more or less, within 1000. Made apart from
  // the others (candidates only goes to 100).
  { name: "10 more, 10 less to 1000", big: 10, n: 24 },
  { name: "100 more, 100 less", big: 100, n: 24 },
  // 2nd grade (2.NBT.B.7), after place value, and 3rd grade's fluency (3.NBT.A.2): adding and
  // subtracting within 1000, without regrouping, then with it (the ones, the tens, or both; and
  // taking away across a zero, 403 − 158). Made apart from the others too (threeDigit), each with
  // the school guides' own examples in it (287 + 359 = 646, 821 − 511 = 310).
  { name: "Add within 1000", three: "add", n: 20, keep: [] },
  { name: "Add and regroup within 1000", three: "addR", n: 24, keep: [[287, 359]] },
  { name: "Subtract within 1000", three: "sub", n: 20, keep: [[821, 511]] },
  { name: "Subtract and regroup within 1000", three: "subR", n: 24, keep: [[403, 158]] }
].map((l, i) => Object.assign(l, { has: (f) => f.lv === i }));
// The levels by name, for the bands that ask them (learn.js BANDS).
export const twoLevel = (...names) => (f) => names.some((n) => TWO_LEVELS[f.lv] && TWO_LEVELS[f.lv].name === n);

// Three-digit numbers with step (10 or 100) added or taken away, staying from 100 to 999.
function hundreds(step) {
  const out = [];
  for (let x = 101; x <= 999; x++) {
    if (x + step <= 999) out.push(make("+", step, x));
    if (x - step >= 100) out.push(make("-", x, step));
  }
  return out;
}

// Three-digit + and − (the levels with `three`): how a pair regroups, by place.
const dig = (n, p) => Math.floor(n / p) % 10;
export function regroupsAt(op, x, y) {
  if (op === "+") return { ones: dig(x, 1) + dig(y, 1) >= 10, tens: dig(x, 10) + dig(y, 10) + (dig(x, 1) + dig(y, 1) >= 10 ? 1 : 0) >= 10 };
  const ones = dig(x, 1) < dig(y, 1);
  return { ones, tens: dig(x, 10) - (ones ? 1 : 0) < dig(y, 10), zero: ones && dig(x, 10) === 0 };
}
// A level's facts, drawn with a fixed seed: three-digit numbers (no whole hundreds, so there's
// work in every place), the other a two- or three-digit number (not 10 or 100: those are the
// 10-and-100-more levels), and the answer within 1000. Each kind of regrouping gets its share:
// the ones, the tens or both, and for subtracting a few across a zero.
const QUOTA = {
  add: [["none2", 5], ["none", 15]],
  addR: [["ones", 8], ["tens", 8], ["both", 8]],
  sub: [["none2", 5], ["none", 15]],
  subR: [["ones", 7], ["tens", 7], ["both", 6], ["zero", 4]]
};
function kindOf(op, x, y) {
  const r = regroupsAt(op, x, y);
  if (r.zero) return "zero";
  if (r.ones && r.tens) return "both";
  if (r.ones) return "ones";
  if (r.tens) return "tens";
  return y < 100 ? "none2" : "none";
}
function threeDigit(level, seed) {
  const op = level.three.startsWith("add") ? "+" : "-", out = [], seen = new Set(), left = Object.fromEntries(QUOTA[level.three]);
  const add = (x, y) => {
    const f = make(op, x, y), k = op + Math.min(x, y) + "," + Math.max(x, y);
    if (seen.has(k)) return;
    seen.add(k); out.push(f); left[kindOf(op, x, y)]--;
  };
  level.keep.forEach(([x, y]) => add(x, y));
  let s = seed;
  const r = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let guard = 0; out.length < level.n && guard < 200000; guard++) {
    const x = 101 + Math.floor(r() * 899), y = 11 + Math.floor(r() * 889);
    if (x % 100 === 0 || y % 100 === 0 || y % 10 === 0 && y < 100) continue;
    if (op === "+" ? x + y > 999 || x < y : x - y < 20 || y > x) continue;
    // Not a whole hundred for an answer either (995 − 395): it's the next level's 10 and 100.
    if ((op === "+" ? x + y : x - y) % 100 === 0) continue;
    const k = kindOf(op, x, y);
    // Subtracting across a zero only in its own share (403 − 158), and only where it regroups.
    if (!(left[k] > 0)) continue;
    add(x, y);
  }
  return out;
}

let cache = null;
// Every two-digit fact, once, tagged with its level (lv).
export function twoDigitFacts() {
  if (cache) return cache;
  cache = [];
  TWO_LEVELS.forEach((l, i) => {
    if (l.three) { for (const f of threeDigit(l, 7919 + i * 104729)) cache.push(Object.assign(f, { lv: i })); return; }
    const all = l.big ? hundreds(l.big) : candidates(l.test, l.op);
    for (const f of sample(all, Math.min(l.n, all.length), 7919 + i * 104729)) cache.push(Object.assign(f, { lv: i }));
  });
  return cache;
}

/* ---------- stacked in columns ----------
   Two- and three-digit + and − are sometimes shown stacked (ones under ones, a line, the answer
   under it), as 2nd grade writes them: STACK_SHARE of the time, STACK_SHARE3 for three-digit
   numbers and for adding up to four two-digit numbers (Triceraplus in the Mines, four rows), and
   always on Margot-Rythm's floor (her art is a stacked sum with a carried 1). The same fact, key
   and record: only a flag on the problem (stacked), like Judo Judy's flipped. The hint stays the
   place-value strategy (tens and ones, then together), not the carrying algorithm, which waits
   for 4th grade. */
export const STACK_SHARE = 0.25, STACK_SHARE3 = 0.5;
// Can this problem be stacked? A plain + or − past 20 (not a □, a throw, dice or a spell), or
// two-digit numbers added up (23 + 14 + 31 + 12; not the Hall's 4 + 3 + 6).
const sums = (p) => p.op === "Σ" && Array.isArray(p.nums) && Math.max(...p.nums) >= 10;
export const stackable = (p) => !!p && !p.spell && (sums(p) || (p.op === "+" || p.op === "-") && !p.blank && !p.flipped && !p.dice && Number.isInteger(p.x) && Number.isInteger(p.y) && Math.max(p.x, p.y, p.ans) > 20);
// How often a problem is stacked: half the time for three-digit numbers and for sums of several
// numbers, a quarter for two-digit ones.
export const stackShare = (p) => (sums(p) || Math.max(p.x || 0, p.y || 0, p.ans || 0) >= 100 ? STACK_SHARE3 : STACK_SHARE);
// The problem stacked, or as it was: always when `always` (Margot-Rythm, ?stacked) or for numbers
// of 1000 or more (4th grade adds and subtracts them with the standard algorithm, in columns: not
// across one line), else its share.
export const BIG_STACK = 1000;
export function stackOf(p, always, rnd) { return stackable(p) && (always || Math.max(p.x || 0, p.y || 0, p.ans || 0) >= BIG_STACK || (rnd || Math.random)() < stackShare(p)) ? Object.assign({}, p, { stacked: true }) : p; }

/* ---------- marking regrouping on a stacked problem ----------
   On paper a 4th grader marks the standard algorithm's regrouping: a carried 1 above a column, or
   a digit crossed out with one less above it and a 1 in front of the digit to its right. On a
   stacked problem with a number of MARK_AT or more (100: the Mines' and the Tower's three-digit +
   and −, 2nd and 3rd grade's "algorithms based on place value", and 4th grade's big numbers) the
   child can tap those marks in: a scratch mark only, never graded, and it changes no answer,
   damage, timing, record or hint (the hints stay the place-value strategies). Two-digit problems
   have none, and numbers added up (Triceraplus) only when every one is that big. Widening or
   narrowing it is this one constant. */
export const MARK_AT = 100;
export function markable(p) {
  if (!p || !p.stacked) return false;
  if (p.op === "Σ") return Array.isArray(p.nums) && p.nums.every((n) => n >= MARK_AT);
  return (p.op === "+" || p.op === "-") && Math.max(p.x, p.y) >= MARK_AT;
}
// Adding: a carried 1 above column `col` (counted from the right, the ones 0), toggled. Nothing
// carries into the ones, nor past the answer's widest column. Returns the new columns, sorted.
export function toggleCarry(carries, col, width) {
  if (!Number.isInteger(col) || col < 1 || col >= width) return carries.slice();
  return carries.includes(col) ? carries.filter((c) => c !== col) : carries.concat(col).sort((a, b) => a - b);
}
// Subtracting: `gives` lists the top number's columns (from the right) regrouped, each giving a ten
// to the column on its right. A column's value is its digit, plus 10 if the column to its left gave,
// less 1 if it gave: never below 0, so the marks always add up to the top number.
const digitsOf = (top) => [...String(top)].reverse().map(Number);
const valueAt = (ds, gives, c) => ds[c] + (gives.includes(c + 1) ? 10 : 0) - (gives.includes(c) ? 1 : 0);
const sorted = (g) => [...new Set(g)].sort((a, b) => a - b);
// What a tap on column `col` of the top number does, one place at a time, as on paper:
//   "give"    it regroups: one less here, 10 more in the column to its right;
//   "undo"    it had regrouped, and the column to its right hasn't regrouped since, so it's taken back;
//   "empty"   it's at 0 with nothing to give yet (a 0 gives only once it has taken 10 from its left:
//             4000 − 1368 is three taps, the 4, then the hundreds, then the tens);
//   "blocked" it had regrouped, but the column to its right has since regrouped too: undo that first;
//   "none"    the ones, or not a column (nothing to their right).
// Never anything else, so the columns always add up to the top number and none goes below 0.
export function regroupMove(top, gives, col) {
  const ds = digitsOf(top);
  if (!Number.isInteger(col) || col < 1 || col >= ds.length) return "none";
  if (gives.includes(col)) return gives.includes(col - 1) ? "blocked" : "undo";
  return valueAt(ds, gives, col) >= 1 ? "give" : "empty";
}
// The regroups after that tap (the same list when it does nothing).
export function regroup(top, gives, col) {
  const ds = digitsOf(top), g = sorted(gives.filter((c) => Number.isInteger(c) && c >= 1 && c < ds.length));
  const move = regroupMove(top, g, col);
  return move === "give" ? sorted(g.concat(col)) : move === "undo" ? g.filter((c) => c !== col) : g;
}
// How the top number reads with its regroups, column by column from the right: its digit, crossed
// out with its new value above when it gave, or a small 1 in front when it only took a ten (2 reads
// as 12).
export function regroupView(top, gives) {
  const ds = digitsOf(top);
  return ds.map((d, c) => {
    const gave = gives.includes(c), took = gives.includes(c + 1);
    return { d, value: valueAt(ds, gives, c), crossed: gave, above: gave ? String(valueAt(ds, gives, c)) : "", front: took && !gave };
  });
}
