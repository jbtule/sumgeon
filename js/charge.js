// The Super Charge (DESIGN.md §5.5): a floor can mix answers that differ by orders of magnitude
// (the Fraction Forge's 4 ÷ 1 = 4 and 45,000 ≈ 50,000), and since an answer is its damage, a 4
// would do nothing to the monster and a 50,000 would end it in one hit. So each problem's hit is
// put on the floor's scale, announced as the problem appears: a problem whose level answers far
// below the floor's typical answer is Super Charged (×N), one whose level answers far above it
// finds the monster braced (÷N). The scale comes from the problem's level (learn.js levelTypical:
// the median answer of its level's facts) and the numbers the problem shows (shownMax: 47,385 +
// 38,906 is braced as a 47,385 at least, though its level's middle is smaller), never from this
// problem's own answer, so the badge says nothing about the answer the problem itself doesn't show.
// A brace comes sooner than a charge (BRACE_AT, 3×): a big answer is what could end a fight in one
// hit, and a one-shot from full HP should take help, a Hero Moment or an item (oneHit).
// No DOM: runs in Node (scripts/charge.test.mjs; how often: scripts/charge-sim.mjs).

// The friendly multipliers: 2, 5, 10, 20, 50, 100 … 100,000 (the voice reads them all).
export const FRIENDLY = [2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
// A charge (or a brace) only when the scales are at least ten times apart (an order of magnitude),
// so N is always 10 or more: closer, the answers already hit near enough alike (a 2 and a 9 in the
// Cellar, a sum within 20 and a two-digit sum in the Hall), and a ×2 would read as a crit. At 3 it
// charged a quarter of a fluent player's problems in the Hall, and at 5 an eighth
// (CHARGE_AT=3 node scripts/charge-sim.mjs).
export const CHARGE_AT = 10;
// A brace from 3 times the floor's typical hit (÷2, ÷5, ÷10 …): a 5-digit sum on a floor of
// 4-digit ones hit for one and a half times the monster's HP (Margot-Rythm in the Forge, depth 10,
// 2026-11-28). A ÷2 can't read as a crit, and the voice says only "The monster braces!".
export const BRACE_AT = 3;

// The friendly number nearest a ratio, on a log scale (3.2 and up is 5, 7.1 and up is 10).
export function friendly(r) {
  let best = FRIENDLY[0];
  for (const n of FRIENDLY) if (Math.abs(Math.log(n / r)) < Math.abs(Math.log(best / r))) best = n;
  return best;
}
// The charge for a problem from its scale (problemScale: its level's typical answer, or the
// biggest number it shows) and the floor's typical hit: { up: N } (Super Charge, ×N, at CHARGE_AT
// apart), { down: N } (the monster braces, ÷N, at BRACE_AT), or null.
// No braces in the Counting Cellar or the Balance Hall (decided 2026-11-28): kindergarten and 1st
// grade never see a ÷, and with no one-shot without help (oneHit) they aren't needed there.
export const NO_BRACE = ["cellar", "hall"];
export const chargeIn = (wingId, c) => (c && c.down && NO_BRACE.includes(wingId) ? null : c);
export function chargeFor(scale, floorTypical, at = CHARGE_AT, braceAt = BRACE_AT) {
  if (!(scale > 0 && floorTypical > 0)) return null;
  const r = floorTypical / scale;
  if (r >= at) return { up: friendly(r) };
  if (1 / r >= braceAt) return { down: friendly(1 / r) };
  return null;
}
// A problem's scale: its level's typical answer (learn.js levelTypical), or the biggest number it
// shows when that's bigger.
export function problemScale(levelTypical, p) { return Math.max(levelTypical || 0, shownMax(p)); }
// The biggest number a problem shows on screen that its hit goes with (0 when none does): the
// numbers added or taken away (not the hidden one of a □ problem: 8 + □ = 15 shows 8 and 15), the
// numbers added up, the number rounded, the numbers compared (a million's in thousands, as it hits:
// fourth.js), a pattern's numbers, an equation's. Never a product's or a quotient's numbers (× and
// ÷, remainders, factors, multi-step), whose answer isn't on screen and mustn't be hinted at, and
// nothing for the kinds whose hit isn't one of their numbers (place value's tens in 380, units,
// fractions, decimals, coins, time, shapes): their level's typical answer stands.
const numsIn = (s) => (String(s || "").replace(/(\d),(?=\d{3})/g, "$1").replace(/\d+\/\d+|\d*\.\d+/g, " ").match(/\d+/g) || []).map(Number);
export function shownMax(p) {
  if (!p) return 0;
  const most = (xs) => Math.max(0, ...xs.filter((x) => Number.isFinite(x)));
  switch (p.op) {
    case "+": case "-":
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return 0;
      return p.blank ? most([p.blank === "x" ? p.y : p.x, p.fact && p.fact.ans]) : most([p.x, p.y]);
    case "Σ": return most(p.nums || numsIn(p.q));
    case "≈": return most(numsIn(p.q).slice(0, 1));
    case "○": {
      if (p.dec || !/^\d+$/.test(String(p.l)) || !/^\d+$/.test(String(p.r))) return 0;
      return Math.max(+p.l, +p.r) / (p.big ? 1000 : 1);
    }
    case "…": case "=": case "✓": case "✎": return most(numsIn(p.q));
    default: return 0;
  }
}
// An answer's hit with its charge, before crits, power hits, traits, the totem and Hero Moments.
export function chargedHit(ans, c) {
  if (!c) return ans;
  if (c.up) return ans * c.up;
  if (c.down) return ans / c.down;
  return ans;
}
// One hit's damage on a regular monster (not a boss: Boss Guard), at hp of its full max: from full
// HP it leaves at least 1, unless a Hero Moment or an item is in the hit (helped). A one-shot
// takes help (the principle, 2026-11-28); a crit, a trait or a charge alone can't.
export function oneHit(dmg, hp, max, helped) { return !helped && hp >= max && dmg >= hp ? Math.max(0, hp - 1) : dmg; }
// The badge by the problem, and the pop's prefix.
export function chargeBadge(c) { return !c ? "" : c.up ? "⚡ Super charge ×" + c.up.toLocaleString("en-US") : "🛡️ Braced ÷" + c.down.toLocaleString("en-US"); }
export function chargePop(c) { return !c ? "" : c.up ? "×" + c.up.toLocaleString("en-US") + "! " : "÷" + c.down.toLocaleString("en-US") + "! "; }
