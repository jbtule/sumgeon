// Two-digit addition and subtraction within 100 (2nd grade, 2.NBT): a strand like coins, asked by
// Haberhasher in the Tables Tower. There are thousands of such problems, so each level is a fixed
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
  { name: "Subtract tens", op: "-", test: (x, y) => !ones(x) && !ones(y), n: 99 },
  { name: "Subtract, no regrouping", op: "-", test: (x, y) => ones(y) && ones(x) > ones(y), n: 24 },
  { name: "Subtract and regroup", op: "-", test: (x, y) => ones(y) && ones(x) < ones(y), n: 30 },
  // 1st grade (1.NBT.C.4–5): 10 more and 10 less than a number, and adding tens to a number.
  { name: "10 more", op: "+", test: (x, y) => x === 10 && ones(y) && y > 10 && y < 90, n: 16 },
  { name: "10 less", op: "-", test: (x, y) => y === 10 && ones(x) > 0, n: 16 },
  { name: "Add tens to a number", op: "+", test: (x, y) => x + y < 100 && ((!ones(x) && x >= 20 && ones(y) && y > 10) || (!ones(y) && y >= 20 && ones(x) && x > 10)), n: 20 },
  // 2nd grade (2.NBT.B.8): 10 more or less, and 100 more or less, within 1000. Made apart from
  // the others (candidates only goes to 100).
  { name: "10 more, 10 less to 1000", big: 10, n: 24 },
  { name: "100 more, 100 less", big: 100, n: 24 }
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

let cache = null;
// Every two-digit fact, once, tagged with its level (lv).
export function twoDigitFacts() {
  if (cache) return cache;
  cache = [];
  TWO_LEVELS.forEach((l, i) => {
    const all = l.big ? hundreds(l.big) : candidates(l.test, l.op);
    for (const f of sample(all, Math.min(l.n, all.length), 7919 + i * 104729)) cache.push(Object.assign(f, { lv: i }));
  });
  return cache;
}
