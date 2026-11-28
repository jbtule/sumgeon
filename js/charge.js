// The Super Charge (DESIGN.md §5.5): a floor can mix answers that differ by orders of magnitude
// (the Fraction Forge's 4 ÷ 1 = 4 and 45,000 ≈ 50,000), and since an answer is its damage, a 4
// would do nothing to the monster and a 50,000 would end it in one hit. So each problem's hit is
// put on the floor's scale, announced as the problem appears: a problem whose level answers far
// below the floor's typical answer is Super Charged (×N), one whose level answers far above it
// finds the monster braced (÷N). The scale comes from the problem's level (learn.js levelTypical:
// the median answer of its level's facts), never from this problem's own answer, so the badge says
// nothing about the answer the problem itself doesn't show.
// No DOM: runs in Node (scripts/charge.test.mjs; how often: scripts/charge-sim.mjs).

// The friendly multipliers: 2, 5, 10, 20, 50, 100 … 100,000 (the voice reads them all).
export const FRIENDLY = [2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
// A charge (or a brace) only when the scales are at least ten times apart (an order of magnitude),
// so N is always 10 or more: closer, the answers already hit near enough alike (a 2 and a 9 in the
// Cellar, a sum within 20 and a two-digit sum in the Hall), and a ×2 would read as a crit. At 3 it
// charged a quarter of a fluent player's problems in the Hall, and at 5 an eighth
// (CHARGE_AT=3 node scripts/charge-sim.mjs).
export const CHARGE_AT = 10;

// The friendly number nearest a ratio, on a log scale (3.2 and up is 5, 7.1 and up is 10).
export function friendly(r) {
  let best = FRIENDLY[0];
  for (const n of FRIENDLY) if (Math.abs(Math.log(n / r)) < Math.abs(Math.log(best / r))) best = n;
  return best;
}
// The charge for a problem from its level's typical answer and the floor's: { up: N } (Super
// Charge, ×N), { down: N } (the monster braces, ÷N), or null.
export function chargeFor(levelTypical, floorTypical, at = CHARGE_AT) {
  if (!(levelTypical > 0 && floorTypical > 0)) return null;
  const r = floorTypical / levelTypical;
  if (r >= at) return { up: friendly(r) };
  if (1 / r >= at) return { down: friendly(1 / r) };
  return null;
}
// An answer's hit with its charge, before crits, power hits, traits, the totem and Hero Moments.
export function chargedHit(ans, c) {
  if (!c) return ans;
  if (c.up) return ans * c.up;
  if (c.down) return ans / c.down;
  return ans;
}
// The badge by the problem, and the pop's prefix.
export function chargeBadge(c) { return !c ? "" : c.up ? "⚡ Super charge ×" + c.up.toLocaleString("en-US") : "🛡️ Braced ÷" + c.down.toLocaleString("en-US"); }
export function chargePop(c) { return !c ? "" : c.up ? "×" + c.up.toLocaleString("en-US") + "! " : "÷" + c.down.toLocaleString("en-US") + "! "; }
