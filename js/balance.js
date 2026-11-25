// The Balance Hall's problems (DESIGN.md §4): comparing (Chompers) and balancing equations (the
// Equal Twins), K–2nd. A band of its own (learn.js BANDS.balance). No DOM: runs in Node.
//
// A compare fact: { op: "○", l: "3 + 4", r: "8", sym: "<", ans: 8, q: "3 + 4 □ 8", key }. The answer
//   is the symbol (typed with the <, = and > keys); the damage (ans) is the bigger side, since
//   Chompers eats the bigger number.
// A balance fact: { op: "=", l: "3 + 4", r: "□ + 5", ans: 2, q: "3 + 4 = □ + 5", key }. The answer
//   and the damage are the hidden number.

const value = (side) => side.split(" + ").reduce((t, n) => t + Number(n), 0);

export function compareFact(l, r) {
  const lv = value(l), rv = value(r);
  return { op: "○", l, r, sym: lv < rv ? "<" : lv > rv ? ">" : "=", ans: Math.max(lv, rv), q: l + " □ " + r,
    key: "○" + l.replace(/ /g, "") + "," + r.replace(/ /g, "") };
}
export function balanceFact(l, r) {
  const known = value(l.replace("□", "0")), other = r.replace("□", "0"), ans = l.includes("□") ? value(other) - known : known - value(other);
  return { op: "=", l, r, ans, q: l + " = " + r, key: "=" + l.replace(/ /g, "") + "," + r.replace(/ /g, "") };
}
// From a key: "○3+4,8" or "=3+4,□+5".
export function balanceFactOf(key) {
  const [a, b] = key.slice(1).split(",").map((s) => s.split("+").join(" + "));
  return key[0] === "○" ? compareFact(a, b) : balanceFact(a, b);
}

// A fixed shuffle, so the sample never changes between builds.
function sample(list, n, seed) {
  let s = seed;
  const r = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}
// n facts, about a fifth of them equal (=), from pairs [l, r].
function compares(pairs, n, seed) {
  const fs = pairs.map(([l, r]) => compareFact(String(l), String(r)));
  const eq = fs.filter((f) => f.sym === "="), ne = fs.filter((f) => f.sym !== "=");
  const k = Math.min(eq.length, Math.round(n / 5));
  return sample(eq, k, seed).concat(sample(ne, n - k, seed + 1));
}
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// Problem sets, each tagged with its level (lv). Each level has comparing and balancing, so
// Chompers and the Equal Twins both have their own problems from the start.
const SETS = [
  { name: "Compare to 10", make: () => compares(range(1, 10).flatMap((x) => range(1, 10).map((y) => [x, y])), 24, 11) },
  { name: "The other side", make: () => sample(range(2, 10).flatMap((t) => range(1, t - 1).flatMap((y) => [
    balanceFact(String(t), "□ + " + y), balanceFact(String(t), y + " + □"), balanceFact("□ + " + y, String(t))])), 24, 23) },
  { name: "Compare sums", make: () => compares(range(1, 9).flatMap((a) => range(1, 10 - a).flatMap((b) => range(1, 10).map((r) => [a + " + " + b, r]))), 24, 37) },
  { name: "Balance both sides", make: () => sample(range(1, 9).flatMap((a) => range(1, 10 - a).flatMap((b) => range(1, a + b - 1).flatMap((c) => [
    balanceFact(a + " + " + b, "□ + " + c), balanceFact(a + " + " + b, c + " + □")]))), 24, 41) },
  { name: "Compare to 100", make: () => compares(range(10, 99).flatMap((x) => [x, x + 1, x - 1, x + 10, x - 10, x + 9, x - 9, (x % 10) * 10 + Math.floor(x / 10)]
    .filter((y) => y >= 10 && y <= 99 && y !== x || y === x).map((y) => [x, y])), 24, 53) }
];
const SET_LEVEL = [0, 0, 1, 1, 2];
export const BALANCE_LEVELS = ["Compare and balance to 10", "Sums on both sides", "Compare to 100"]
  .map((name, i) => ({ name, has: (f) => f.lv === i }));

let cache = null;
export function balanceFacts() {
  if (cache) return cache;
  cache = [];
  const seen = new Set();
  SETS.forEach((set, i) => set.make().forEach((f) => { if (!seen.has(f.key)) { seen.add(f.key); cache.push(Object.assign(f, { lv: SET_LEVEL[i] })); } }));
  return cache;
}
