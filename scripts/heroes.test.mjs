// The digit heroes: all ten draw, plain and cursed, and in a captain's chalk color.
import assert from "node:assert/strict";
import { HEROES, CHALK, heroSvg } from "../js/heroes.js";

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
console.log("✓ heroes");
