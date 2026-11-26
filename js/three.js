// Adding three numbers (1st grade, 1.OA.A.2 and 1.OA.B.3; Triceraplus in the Balance Hall):
// 4 + 3 + 6, where two of the numbers make a ten, so the classroom strategy works: find the ten
// first, then add the rest (4 + 6 = 10, 10 + 3 = 13). Sums 11 to 19. A fixed sample, so 70% of it
// can be learned and every problem is recorded. Key "Σ4,3,6": the three numbers in the order
// shown. No DOM: runs in Node for the tests.

//
// 2nd grade adds up to four two-digit numbers (2.NBT.B.7; Triceraplus visiting the Crystal Mines):
// 23 + 14 + 31 + 12, the same kind of fact with more numbers (key "Σ23,14,31,12"), in sumFacts.
export function sumFact(nums) {
  const [a, b, c] = nums, ans = nums.reduce((t, n) => t + n, 0);
  return { op: "Σ", nums: nums.slice(), a, b, c, ans, q: nums.join(" + "), key: "Σ" + nums.join(",") };
}
export const threeFact = (a, b, c) => sumFact([a, b, c]);
export function threeFactOf(key) { return sumFact(key.slice(1).split(",").map(Number)); }
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

/* ---------- up to four two-digit numbers (2nd grade, 2.NBT.B.7) ----------
   Triceraplus's strand in the Crystal Mines: three two-digit numbers, then four, each sum under
   100 (the Mines' within 100; the place-value strategy is the point, not big numbers). About half
   have two numbers whose ones make a ten (23 + 17: find the ten), the rest add the tens, then the
   ones. Every number has ones (no 30), so neither strategy adds a 0. A fixed sample, recorded. */
export const SUM_LEVELS = [{ name: "Three two-digit numbers", n: 3 }, { name: "Four two-digit numbers", n: 4 }];
// Two numbers whose ones make 10: [i, j], or null.
export function tenPairOf(nums) {
  for (let i = 0; i < nums.length; i++) for (let j = i + 1; j < nums.length; j++) if ((nums[i] % 10) + (nums[j] % 10) === 10) return [i, j];
  return null;
}
let sumCache = null;
export function sumFacts() {
  if (sumCache) return sumCache;
  let s = 7331;
  const r = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const out = [], seen = new Set();
  for (const lv of SUM_LEVELS) {
    let pair = 0, plain = 0;
    for (let guard = 0; pair + plain < 12 && guard < 100000; guard++) {
      const nums = Array.from({ length: lv.n }, () => 11 + Math.floor(r() * (lv.n === 3 ? 29 : 19)));
      const sum = nums.reduce((t, n) => t + n, 0);
      if (sum >= 100 || nums.some((n) => n % 10 === 0) || new Set(nums).size < nums.length) continue;
      const has = !!tenPairOf(nums);
      if (has ? pair >= 6 : plain >= 6) continue;
      const f = sumFact(nums);
      if (seen.has(f.key)) continue;
      seen.add(f.key); has ? pair++ : plain++;
      out.push(Object.assign(f, { set: lv.n }));
    }
  }
  return (sumCache = out);
}
