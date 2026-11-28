// The Super Charge (js/charge.js, learn.js levelTypical and floorTypical): a problem's hit put on
// the floor's scale, from its level's typical answer, never its own.
import assert from "node:assert/strict";
import { FRIENDLY, CHARGE_AT, friendly, chargeFor, chargedHit, chargeBadge, chargePop } from "../js/charge.js";
import { pool, levelTypical, floorTypical, typicalHit, hpOf, monsterHP, openLevels, BANDS } from "../js/learn.js";
import { WINGS, PATHS, bandOf, stepMonsters } from "../js/wings.js";
import { MON } from "../js/monsters.js";
import { PHRASE, chargeLine, chargeLines, spokenLines } from "../js/lines.js";

// Friendly numbers, nearest on a log scale.
assert.deepEqual(FRIENDLY.slice(0, 6), [2, 5, 10, 20, 50, 100]);
assert.equal(friendly(3), 2); assert.equal(friendly(4), 5); assert.equal(friendly(7.2), 10); assert.equal(friendly(14), 10);
assert.equal(friendly(15), 20); assert.equal(friendly(160), 200); assert.equal(friendly(1e9), 100000);
// Up, down, or nothing, only when the scales are CHARGE_AT apart.
assert.equal(chargeFor(10, 10), null);
assert.equal(chargeFor(10, 10 * (CHARGE_AT - 0.01)), null);
assert.equal(chargeFor(10 * (CHARGE_AT - 0.01), 10), null);
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
// Kindergarten never: every monster of the Cellar, with any one step or all of them open.
{
  const w = WINGS.find((x) => x.id === "cellar"), path = PATHS.cellar;
  const opens = path.map((_, i) => [i]).concat([path.map((_, i) => i)]);
  for (const open of opens) for (const name of stepMonsters(path, open, false).concat([w.boss])) {
    const m = MON.find((x) => x.n === name), bk = bandOf(w, m), lv = openLevels(path, open, bk).levels, t = floorTypical(m, bk, {}, lv);
    for (const f of pool(bk).filter((x) => lv.includes(x.level))) assert.equal(chargeFor(levelTypical(bk, f.key, m), t), null, `${name}: ${f.key}`);
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
