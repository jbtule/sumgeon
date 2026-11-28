// The Super Charge (js/charge.js, learn.js levelTypical and floorTypical): a problem's hit put on
// the floor's scale, from its level's typical answer, never its own.
import assert from "node:assert/strict";
import { FRIENDLY, CHARGE_AT, BRACE_AT, friendly, chargeFor, chargedHit, chargeBadge, chargePop, shownMax, problemScale, oneHit } from "../js/charge.js";
import { pool, levelTypical, floorTypical, typicalHit, hpOf, monsterHP, openLevels, factOf, BANDS } from "../js/learn.js";
import { missingOf } from "../js/missing.js";
import { stackOf } from "../js/twodigit.js";
import { WINGS, PATHS, bandOf, stepMonsters } from "../js/wings.js";
import { MON } from "../js/monsters.js";
import { PHRASE, chargeLine, chargeLines, spokenLines } from "../js/lines.js";

// Friendly numbers, nearest on a log scale.
assert.deepEqual(FRIENDLY.slice(0, 6), [2, 5, 10, 20, 50, 100]);
assert.equal(friendly(3), 2); assert.equal(friendly(4), 5); assert.equal(friendly(7.2), 10); assert.equal(friendly(14), 10);
assert.equal(friendly(15), 20); assert.equal(friendly(160), 200); assert.equal(friendly(1e9), 100000);
// Up only when the scales are CHARGE_AT apart; braced sooner, at BRACE_AT (÷2, ÷5, ÷10 …).
assert.equal(BRACE_AT, 3);
assert.equal(chargeFor(10, 10), null);
assert.equal(chargeFor(10, 10 * (CHARGE_AT - 0.01)), null);
assert.equal(chargeFor(10 * (BRACE_AT - 0.01), 10), null);
assert.deepEqual(chargeFor(30, 10), { down: 2 });
assert.deepEqual(chargeFor(40, 10), { down: 5 });
assert.deepEqual(chargeFor(80, 10), { down: 10 });
for (let r = BRACE_AT; r < 1e6; r *= 1.13) assert.ok(chargeFor(r, 1).down >= 2, "never below ÷2");
assert.deepEqual(chargeFor(4, 400), { up: 100 });
assert.deepEqual(chargeFor(7750, 80), { down: 100 });
assert.deepEqual(chargeFor(5, 80), { up: 20 });
assert.equal(chargeFor(0, 10), null); assert.equal(chargeFor(5, 0), null); assert.equal(chargeFor(null, 10), null);
for (let r = CHARGE_AT; r < 1e6; r *= 1.37) { assert.ok(chargeFor(1, r).up >= 5, "never a ×2: it would read as a crit"); assert.ok(chargeFor(r, 1).down >= 5); }
// The hit: the answer times the charge, or divided by the brace.
assert.equal(chargedHit(4, { up: 100 }), 400);
assert.equal(chargedHit(50000, { down: 1000 }), 50);
assert.equal(chargedHit(7, null), 7);
assert.equal(chargeBadge({ up: 1000 }), "⚡ Super charge ×1,000");
assert.equal(chargeBadge({ down: 10 }), "🛡️ Braced ÷10");
assert.equal(chargePop({ up: 100 }), "×100! ");
assert.equal(chargeBadge(null), "");

// The numbers a problem shows (shownMax), every kind of problem in every band: only a number on
// screen (a million compared hits in thousands), never one of × or ÷ (a product's numbers), and
// never a □ problem's hidden number.
const shownNums = (p) => (String(p.q || "").replace(/(\d),(?=\d{3})/g, "$1").match(/\d+/g) || []).map(Number);
const NEVER = new Set(["×", "÷", "R", "F", "E", "ƒ", "d", "/", "u", "D", "#", "¢", "$", "⌚", "◇", "∠", "▭", "▦", "↔", "⁙", "◐", "P"]);
const checkShown = (p, what) => {
  const v = shownMax(p);
  assert.ok(Number.isFinite(v) && v >= 0, `${what}: ${v}`);
  if (NEVER.has(p.op)) assert.equal(v, 0, `${what}: ${p.op} shows nothing it hits with`);
  if (v > 0) assert.ok(shownNums(p).includes(p.big ? v * 1000 : v), `${what}: ${v} is on screen (${p.q})`);
  return v;
};
const kinds = {};
for (const band of Object.keys(BANDS)) for (const f of pool(band)) {
  const p = factOf(f.key, Math.random), v = checkShown(p, band + " " + f.key);
  (kinds[p.op] = kinds[p.op] || []).push(v);
  if (p.op === "+" || p.op === "-") {
    if (!p.blank) { assert.equal(v, Math.max(p.x, p.y), `${f.key}: the numbers added or taken away`); checkShown(stackOf(p, true), "stacked " + f.key); }
    if (!p.blank && p.x <= 20 && p.y <= 20) for (const b of ["x", "y"]) { const q = missingOf(p, b); checkShown(q, b + " hidden " + f.key); assert.ok(shownMax(q) === Math.max(b === "x" ? p.y : p.x, p.ans), `${f.key}, ${b} hidden: the other number and the total`); }
  }
  if (p.op === "×" || p.op === "÷") assert.equal(problemScale(7, p), 7, `${f.key}: × and ÷ keep their level's scale`);
}
for (const op of ["+", "-", "Σ", "≈", "○", "…", "=", "✓", "✎"]) assert.ok(kinds[op] && kinds[op].some((v) => v > 0), `${op}: shows its numbers`);
assert.equal(shownMax(factOf("+27118,39351")), 39351);
assert.equal(shownMax(factOf("≈45000,10000")), 45000);
assert.equal(shownMax(missingOf(factOf("-13,6"), "x")), 7, "□ − 6 = 7 shows 6 and 7, not the 13");
assert.equal(shownMax(null), 0);
assert.equal(problemScale(5378, factOf("+27118,39351")), 39351);
assert.equal(problemScale(5378, factOf("+1314,1323")), 5378);

// The level's typical answer, never the problem's own: every fact in a level gets the same scale.
for (const band of Object.keys(BANDS)) {
  const byLevel = {};
  for (const f of pool(band)) (byLevel[f.level] = byLevel[f.level] || new Set()).add(levelTypical(band, f.key, {}));
  for (const [lv, s] of Object.entries(byLevel)) assert.equal(s.size, 1, `${band} level ${lv}: one typical answer for all its facts`);
}
assert.equal(levelTypical("fourth", "nope"), null);
// A review from another band (the Tables Tower's ÷ 1 in the Forge) takes its own band's level.
assert.equal(levelTypical("fourth", "÷4,1", {}), levelTypical("third", "÷4,1", {}));
// The floor's typical hit is what monster HP is built on.
const den = MON.find((m) => m.n === "The Denominator"), forgeAll = openLevels(PATHS.forge, PATHS.forge.map((_, i) => i), "fourth").levels;
assert.equal(monsterHP(den, "fourth", {}, forgeAll), Math.max(10, Math.round(floorTypical(den, "fourth", {}, forgeAll) * den.hits)));
assert.equal(hpOf(den, [{ key: "+3,4", op: "+", ans: 7 }], "fourth"), Math.max(10, Math.round(typicalHit(den, [{ key: "+3,4", op: "+", ans: 7 }], "fourth") * den.hits)));

// The Forge, with everything open: a small answer is Super Charged, a giant one braced.
{
  const t = floorTypical(den, "fourth", {}, forgeAll);
  assert.ok(chargeFor(levelTypical("fourth", "÷4,1", den), t).up >= 10, "4 ÷ 1 is charged on the Forge's boss");
  assert.ok(chargeFor(levelTypical("fourth", "≈45000,10000", den), t).down >= 10, "rounding to 50,000 finds the monster braced");
}
// The Forge's Margot-Rythm (depth 10, 2026-11-28: one 5-digit sum ended 71,431 HP): her floor
// is mostly that level, so its level isn't far from the floor's typical hit, but a big sum shows
// how big it is and is braced.
{
  const mg = MON.find((m) => m.n === "Margot-Rythm"), t = floorTypical(mg, "fourth", {}, forgeAll);
  for (const key of ["+27118,39351", "-79215,28333"]) assert.ok(chargeFor(problemScale(levelTypical("fourth", key, mg), factOf(key)), t).down >= 5, key + " is braced");
  assert.equal(chargeFor(levelTypical("fourth", "+27118,39351", mg), t), null, "its level alone wasn't");
}
// No one-shot without help (oneHit): from full HP a regular monster keeps 1 HP, unless a Hero
// Moment or an item is in the hit; below full HP, or helped, the hit is what it is.
assert.equal(oneHit(500, 100, 100, false), 99);
assert.equal(oneHit(100, 100, 100, false), 99);
assert.equal(oneHit(99, 100, 100, false), 99);
assert.equal(oneHit(500, 100, 100, true), 500);
assert.equal(oneHit(500, 60, 100, false), 500);
// Kindergarten: never a Super Charge, and at most a little brace (÷2 or ÷5: counting on by 10s
// beside counting by 1s), with every monster of the Cellar and any one step or all of them open.
{
  const w = WINGS.find((x) => x.id === "cellar"), path = PATHS.cellar;
  const opens = path.map((_, i) => [i]).concat([path.map((_, i) => i)]);
  for (const open of opens) for (const name of stepMonsters(path, open, false).concat([w.boss])) {
    const m = MON.find((x) => x.n === name), bk = bandOf(w, m), lv = openLevels(path, open, bk).levels, t = floorTypical(m, bk, {}, lv);
    for (const f of pool(bk).filter((x) => lv.includes(x.level))) { const c = chargeFor(problemScale(levelTypical(bk, f.key, m), factOf(f.key)), t); assert.ok(!c || (!c.up && c.down <= 5), `${name}: ${f.key} ${JSON.stringify(c)}`); }
  }
}

// The voice: "Super charge, times one hundred!" for each N a charge can be, "The monster braces!",
// and the first-time explanation, short and recorded.
assert.equal(chargeLine(100), "Super charge, times one hundred!");
assert.equal(chargeLine(1000), "Super charge, times one thousand!");
const said = new Set(spokenLines().map((l) => l.kind + ":" + l.text));
for (const n of chargeLines()) assert.ok(said.has("p:" + chargeLine(n)), `recorded: ${chargeLine(n)}`);
assert.ok(chargeLines().includes(friendly(CHARGE_AT)) && chargeLines().includes(100000), "every N a charge can be");
assert.ok(said.has("p:" + PHRASE.braced) && said.has("p:" + PHRASE.chargeHow));
assert.ok(PHRASE.chargeHow.split(/\s+/).length <= 12);
{
  const ls = spokenLines(), file = (t) => ls.find((l) => l.kind === "p" && l.text === t).file;
  assert.match(file(chargeLine(100)), /^phrases-fight/);
  assert.match(file(PHRASE.chargeHow), /^phrases-explain/);
}
console.log("charge ok");
