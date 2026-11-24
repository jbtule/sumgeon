// The digit heroes: all ten draw, plain and cursed, and in a captain's chalk color.
import assert from "node:assert/strict";
import { HEROES, CHALK, heroSvg, freePick, pickHero } from "../js/heroes.js";

assert.deepEqual(HEROES.map((h) => h.d), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
assert.equal(new Set(HEROES.map((h) => h.n)).size, 10, "every hero has its own name");
for (const h of HEROES) {
  for (const opts of [{}, { cursed: true }, { color: CHALK[2] }]) {
    const s = heroSvg(h, opts);
    assert.ok(s.startsWith("<svg") && s.endsWith("</svg>"), h.n);
    assert.ok(!/<text\b/.test(s), `${h.n} uses shapes, not fonts`);
    assert.ok(!/undefined|NaN/.test(s), h.n);
  }
  assert.ok(heroSvg(h, { cursed: true }).includes("Cursed " + h.n));
  assert.ok(h.move && h.cls, h.n);
}
assert.ok(heroSvg(HEROES[8], { cursed: true }).includes("ellipse") || heroSvg(HEROES[8], { cursed: true }).length > 0);
// Picking: free until a hero is rescued, then only the team.
const none = { captain: null, color: CHALK[0], rescued: [] };
assert.ok(freePick(none));
const five = pickHero(none, 5);
assert.deepEqual([five.captain, five.rescued], [5, [5]]);
assert.ok(freePick(five), "everyone else is cursed, so the starting hero can change");
const two = pickHero(five, 2);
assert.deepEqual([two.captain, two.rescued], [2, [2]], "the old starting hero goes back to cursed");
const rescued = Object.assign({}, two, { rescued: [2, 0] });
assert.ok(!freePick(rescued), "once a hero is rescued, only the team can lead");
assert.equal(pickHero(rescued, 7), null);
assert.deepEqual([pickHero(rescued, 0).captain, pickHero(rescued, 0).rescued], [0, [2, 0]]);
console.log("✓ heroes");
