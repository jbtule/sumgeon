// Adding three numbers (1st grade, 1.OA.A.2 and 1.OA.B.3; Triceraplus in the Balance Hall):
// 4 + 3 + 6, where two of the numbers make a ten, so the classroom strategy works: find the ten
// first, then add the rest (4 + 6 = 10, 10 + 3 = 13). Sums 11 to 19. A fixed sample, so 70% of it
// can be learned and every problem is recorded. Key "Σ4,3,6": the three numbers in the order
// shown. No DOM: runs in Node for the tests.

export function threeFact(a, b, c) {
  const ans = a + b + c;
  return { op: "Σ", a, b, c, ans, q: a + " + " + b + " + " + c, key: "Σ" + a + "," + b + "," + c };
}
export function threeFactOf(key) {
  const [a, b, c] = key.slice(1).split(",").map(Number);
  return threeFact(a, b, c);
}
// The two numbers that make the ten, and the one left over: { ten: [a, b], rest }.
export function tenOf(f) {
  const n = [f.a, f.b, f.c];
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (n[i] + n[j] === 10) return { ten: [n[i], n[j]], rest: n[3 - i - j] };
  return null;
}

let cache = null;
export function threeFacts() {
  if (cache) return cache;
  const all = [];
  // A make-ten pair (1 and 9 … 5 and 5) and one more number, 1 to 9: the pair first (4 + 6 + 3),
  // split (4 + 3 + 6) or last (3 + 4 + 6).
  for (let a = 1; a <= 5; a++) for (let n = 1; n <= 9; n++) {
    const b = 10 - a;
    for (const [x, y, z] of [[a, b, n], [a, n, b], [n, a, b]]) all.push(threeFact(x, y, z));
  }
  // A fixed shuffle (a small LCG), so the sample never changes between builds.
  let s = 4241;
  const r = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  const seen = new Set();
  cache = all.filter((f) => !seen.has(f.key) && seen.add(f.key)).slice(0, 20);
  return cache;
}
