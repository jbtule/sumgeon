// Mega bosses (DESIGN.md §4.3, §14.2): the boss at each depth of a chapter, and each mega boss's
// second trait at work.
import assert from "node:assert/strict";
import { WINGS, bossStage, bossAt, isMega, BOSS_HP, MEGA_EVERY } from "../js/wings.js";
import { MON, svg, bossForm, BOSS_FORMS } from "../js/monsters.js";
import { traitOf, hitBy, atHalf, charged, flipOf, mega } from "../js/traits.js";
import { contents, moneyFor, ITEMS, CELLAR_BIG, fewest } from "../js/loot.js";
import { trait2Line, PHRASE } from "../js/lines.js";

// Depths 1–2 of each five: the boss; 3–4: powering up; 5: the mega boss. Then again.
assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(bossStage), [0, 0, 1, 2, 3, 0, 0, 1, 2, 3, 0]);
assert.deepEqual([5, 10, 15, 4, 6].map(isMega), [true, true, true, false, false]);
assert.equal(MEGA_EVERY, 5);
assert.ok(BOSS_HP[0] === 1 && BOSS_HP[1] > 1 && BOSS_HP[2] > BOSS_HP[1] && BOSS_HP[3] > BOSS_HP[2], "a little more HP as it powers up, more for the mega boss");
for (const w of WINGS) {
  const b = MON.find((m) => m.n === w.boss), forms = [1, 2, 3, 4, 5].map((d) => bossAt(w, d));
  assert.equal(forms[0], b);
  assert.ok(forms[2].form === "power" && forms[2].stage === 1 && forms[3].stage === 2, `${w.id}: powering up at depths 3 and 4`);
  assert.equal(forms[2].n, b.n, "still itself while it powers up: its name, and its lines");
  assert.ok(!forms[2].trait2 && !mega(forms[2]), "no second trait yet");
  assert.ok(forms[4].form === "mega" && mega(forms[4]) && forms[4].n === BOSS_FORMS[b.n].mega.n, `${w.id}: the mega boss at depth 5`);
  assert.equal(bossAt(w, 10).n, forms[4].n, "and every 5 depths after");
  // Each stage draws, adds to the boss, and only the mega boss wears the crown.
  const art = [b, forms[2], forms[3], forms[4]].map((m) => svg(m));
  assert.ok(art.every((s) => s.startsWith("<svg") && !/undefined|NaN/.test(s)), `${w.id}: every stage draws`);
  assert.ok(art[1].length > art[0].length && art[2].length > art[1].length && art[3].length > art[2].length, `${w.id}: the parts build up (${art.map((s) => s.length)})`);
  // The trait stays the boss's own.
  assert.deepEqual(traitOf(forms[3]), traitOf(b));
  assert.ok(trait2Line(forms[4]) && !trait2Line(forms[3]), "a mega boss explains its second trait");
}
assert.equal(bossForm(MON.find((m) => m.n === "Plusquito"), "power", 1), null, "only bosses power up");

const at = (id, d) => bossAt(WINGS.find((w) => w.id === id), d);
const P = (op, x, y) => ({ op, x, y, ans: op === "+" ? x + y : op === "×" ? x * y : x - y });
// Mega-Ten Golem: Ten Smash still, and 👑 Second wind: at half HP, hits under 10 do half damage.
{
  const g = at("cellar", 5), plain = at("cellar", 1);
  assert.equal(hitBy(g, 12, "12", false).mult, 2, "Ten Smash");
  assert.equal(hitBy(g, 7, "7", false).mult, 1);
  assert.equal(hitBy(g, 7, "7", true).mult, 0.5, "armored at half HP");
  assert.equal(hitBy(plain, 7, "7", true).mult, 1, "the plain Golem never armors up");
  assert.ok(atHalf(g) && !atHalf(plain));
}
// Mega Judy: Flip still, and ⚡ Black Belt: every 4th problem is a big throw (a miss costs 2 hearts).
{
  const j = at("hall", 5), plain = at("hall", 2);
  assert.deepEqual([0, 1, 2, 3, 4, 7].map((n) => charged(j, n)), [false, false, false, true, false, true]);
  assert.ok(![0, 1, 2, 3].some((n) => charged(plain, n)), "the plain Judy throws no big ones");
  assert.equal(flipOf(j, P("+", 3, 8)).q, "8 + 3");
}
// The Megapede: Hundred Legs still, and 🐛 Curl Up: at half HP, hits under 20 do half damage.
{
  const c = at("mines", 5), plain = at("mines", 4);
  assert.equal(hitBy(c, 120, "120", true).mult, 2, "Hundred Legs");
  assert.equal(hitBy(c, 15, "15", false).mult, 1);
  assert.equal(hitBy(c, 15, "15", true).mult, 0.5, "curled up");
  assert.equal(hitBy(c, 25, "25", true).mult, 1);
  assert.equal(hitBy(plain, 15, "15", true).mult, 1);
  assert.ok(atHalf(c).curl && !atHalf(plain));
}
// Mega Sigma Rex: Second wind still, and 🥋 Flip: times facts thrown to show the bigger first.
{
  const r = at("tower", 5), plain = at("tower", 1);
  const f = flipOf(r, P("×", 3, 8));
  assert.deepEqual([f.x, f.y, f.ans, f.q, f.flipped], [8, 3, 24, "8 × 3", true]);
  assert.equal(flipOf(r, P("×", 8, 3)), null, "already bigger first");
  assert.equal(flipOf(r, P("+", 3, 8)), null, "only times facts");
  assert.equal(flipOf(plain, P("×", 3, 8)), null, "the plain Rex doesn't flip");
  assert.equal(hitBy(r, 7, "7", true).mult, 0.5);
}
// The big chest: more coins (still under a dollar, so its line is recorded) or two items.
{
  let s = 9; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const kinds = {};
  for (let i = 0; i < 400; i++) {
    const c = contents(rnd, [], true, true);
    kinds[c.kind] = (kinds[c.kind] || 0) + 1;
    if (c.kind === "items") assert.ok(c.items.length === 2 && c.items[0] !== c.items[1] && c.items.every((id) => ITEMS.some((x) => x.id === id)));
    else assert.equal(c.kind, "money");
  }
  assert.ok(kinds.money > 120 && kinds.items > 120, JSON.stringify(kinds));
  assert.ok([...Array(50)].every(() => contents(rnd, [], false, true).kind === "items"), "two items before money");
  for (const id of ["cellar", "hall", "mines", "tower"]) for (let i = 0; i < 50; i++) { const c = moneyFor(id, true, rnd, true); assert.ok(c > moneyFor(id, false, () => 0, false) && c < 100, `${id}: ${c}`); }
  assert.ok(CELLAR_BIG.every((c) => { const f = fewest(c, false); return f.q + f.d + f.n + f.p === 3; }), "three coins in the Cellar's big chest");
}
assert.ok(PHRASE.megaAhead && PHRASE.stronger && PHRASE.bigThrow && PHRASE.chapter);
console.log("✓ mega bosses");
