// The digit heroes: all ten draw, plain and cursed, and in a captain's chalk color.
import assert from "node:assert/strict";
import { HEROES, CHALK, heroSvg, freePick, pickHero, curseCaptain, crackCurse, CURSE_HITS } from "../js/heroes.js";

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
// Picking, and losing a run: the hero who led it is cursed.
const none = { captain: null, color: CHALK[0], rescued: [] };
assert.ok(freePick(none));
const five = pickHero(none, 5);
assert.deepEqual([five.captain, five.rescued], [5, [5]]);
assert.ok(!freePick(five));
assert.equal(pickHero(five, 2), null, "with a team, only the team can lead");
const team = Object.assign({}, five, { rescued: [5, 0, 1] });
const lost = curseCaptain(team);
assert.deepEqual([lost.captain, lost.rescued], [null, [0, 1]], "the captain is cursed and leaves the team");
assert.ok(!freePick(lost), "the rest of the team can still lead");
assert.equal(pickHero(lost, 5), null, "a cursed hero can't lead until rescued");
assert.equal(pickHero(lost, 0).captain, 0);
const alone = curseCaptain(five);
assert.deepEqual([alone.captain, alone.rescued], [null, []]);
assert.ok(freePick(alone), "a player whose only hero was cursed picks any of the ten");
assert.deepEqual(pickHero(alone, 9).rescued, [9]);
assert.deepEqual([pickHero(alone, 5).captain, pickHero(alone, 5).rescued], [5, [5]], "including the same hero again");
// Breaking a curse takes CURSE_HITS wins: cracks, then free.
assert.equal(CURSE_HITS, 3);
let t = { captain: 5, color: CHALK[0], rescued: [5] }, r;
r = crackCurse(t, 0); assert.deepEqual([r.cracks, r.freed, r.team.rescued], [1, false, [5]]); t = r.team;
r = crackCurse(t, 0); assert.deepEqual([r.cracks, r.freed], [2, false]); t = r.team;
r = crackCurse(t, 0); assert.deepEqual([r.cracks, r.freed, r.team.rescued], [3, true, [5, 0]]);
assert.equal(r.team.cracks[0], undefined, "a broken curse leaves no cracks behind");
// A hero cursed again after losing starts a fresh curse.
assert.equal(curseCaptain({ captain: 0, color: CHALK[0], rescued: [0], cracks: { 0: 2 } }).cracks[0], undefined);
assert.ok(heroSvg(HEROES[2], { cursed: true, cracks: 2 }).includes("#fff6c8"), "cracks show on the cursed hero");
console.log("✓ heroes");
