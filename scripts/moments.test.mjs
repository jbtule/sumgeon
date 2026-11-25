// Hero Moments (DESIGN.md §8.4): when they happen (moments.js decide), the quip decks, and the
// rarity simulator landing near one moment every 2–3 floors with a typical team.
import assert from "node:assert/strict";
import { QUIPS, FINAL, FINALS, CRIT, CHANCE, BUILD, REST, PER_FLOOR, freshState, freshRun, decide, drawQuip, heroesIn, heardOf, joined, simulate, seeded } from "../js/moments.js";
import { HEROES } from "../js/heroes.js";
import { OWN_KEYS } from "../js/store.js";

assert.deepEqual([CHANCE, BUILD, REST, PER_FLOOR], [0.08, 0.04, 6, 2]);
assert.deepEqual(Object.keys(QUIPS).map(Number), HEROES.map((h) => h.d), "every hero has quips");
assert.ok(OWN_KEYS.includes("moments"), "the saved state is a listed player key");

const team = { captain: 5, rescued: [5, 0, 1] };
// A hit: right answer, unhinted, on the team's digits, not the first fight.
const hit = (o) => Object.assign({ typed: "15", team, hinted: false, spell: null, first: false, floor: 0, n: 1, bossFinish: false, critStart: false, always: false }, o);
const yes = () => 0, no = () => 0.999; // rnd: a sure roll, a sure miss

// Who's in the answer.
assert.deepEqual(heroesIn("15", team), [1, 5]);
assert.deepEqual(heroesIn("55", team), [5]);
assert.deepEqual(heroesIn("23", team), []);

// Only on a qualifying hit.
for (const o of [{ hinted: true }, { first: true }, { spell: "backwards" }, { spell: "show" }, { typed: "23" }]) {
  assert.equal(decide(freshState(), freshRun(), hit(o), yes), null, JSON.stringify(o));
}
assert.ok(decide(freshState(), freshRun(), hit({ spell: "good" }), yes), "a spell's good hit can be a moment");

// The chance: 8%, plus 4% for each qualifying hit that rolled without one, back to 8% after.
{
  const s = freshState(), r = freshRun();
  const at = (p) => () => p; // a roll of exactly p
  assert.equal(decide(s, r, hit({ n: 1 }), at(0.08)), null, "8%: a roll of .08 misses");
  assert.equal(s.dry, 1);
  assert.equal(decide(s, r, hit({ n: 2 }), at(0.119)) !== null, true, "12% after one miss");
  assert.equal(s.dry, 0, "back to 8%");
  // A long dry spell builds up: no more than ~23 qualifying hits without a moment.
  const s2 = freshState(), r2 = freshRun();
  let n = 0;
  while (!decide(s2, r2, hit({ n: ++n, floor: n }), at(0.99))) assert.ok(n < 30);
  assert.equal(n, 24, "8% + 4% × 23 reaches 100%");
}

// A rest of REST problems after a moment, and at most PER_FLOOR a floor.
{
  const s = freshState(), r = freshRun();
  assert.ok(decide(s, r, hit({ n: 1 }), yes));
  for (let n = 2; n <= 1 + REST; n++) assert.equal(decide(s, r, hit({ n }), yes), null, `problem ${n} rests`);
  assert.equal(s.dry, 0, "rested hits don't build the chance");
  assert.ok(decide(s, r, hit({ n: 2 + REST }), yes), "after the rest, another");
  assert.equal(decide(s, r, hit({ n: 30 }), yes), null, "two on this floor already");
  assert.ok(decide(s, r, hit({ n: 31, floor: 1 }), yes), "a new floor");
}

// A different hero from last time, when the answer has more than one.
{
  const s = freshState(), r = freshRun();
  let last = null;
  for (let i = 0; i < 20; i++) {
    const mo = decide(s, r, hit({ n: i * 10, floor: i }), Math.random);
    if (!mo) continue;
    if (last != null) assert.notEqual(mo.hero, last, "never the same hero twice running when there's a choice");
    last = mo.hero;
  }
  assert.ok(last != null);
  // With only one hero in the answer, it's that one.
  const mo = decide(s, freshRun(), hit({ typed: "5", n: 1 }), yes);
  assert.equal(mo.hero, 5);
}

// Always: a freed hero's debut, and the blow that finishes a boss, past the rest, the cap and the roll.
{
  const s = freshState(), r = freshRun();
  assert.ok(decide(s, r, hit({ n: 1 }), yes));
  joined(s, 0);
  assert.equal(decide(s, r, hit({ typed: "12", n: 2 }), no), null, "no 0 in the answer: not yet");
  const debut = decide(s, r, hit({ typed: "10", n: 3 }), no);
  assert.deepEqual([debut.hero, debut.why], [0, "debut"], "Zeroic's debut, in the rest and against the roll");
  assert.ok(QUIPS[0].includes(debut.quip));
  assert.equal(decide(s, r, hit({ typed: "10", n: 4 }), no), null, "a debut happens once");
  const boss = decide(s, r, hit({ typed: "23", n: 5, bossFinish: true }), no);
  assert.deepEqual([boss.hero, boss.why], [5, "boss"], "no hero in the answer: the captain finishes the boss");
  assert.ok(FINALS.includes(boss.quip), "a boss finish says one of the finishing lines");
  assert.equal(decide(s, r, hit({ typed: "23", n: 6, bossFinish: true, hinted: true }), no), null, "but not a hinted one");
}

// "Critical math!" for a moment on the hit that turns crits on; the deck otherwise.
{
  const s = freshState(), r = freshRun();
  assert.equal(decide(s, r, hit({ n: 1, critStart: true }), yes).quip, CRIT);
  assert.notEqual(decide(s, r, hit({ n: 10, floor: 1 }), yes).quip, CRIT);
  joined(s, 1);
  assert.notEqual(decide(s, r, hit({ n: 11, floor: 1, critStart: true }), no).quip, CRIT, "a debut says the hero's own quip");
}

// ?moments: every qualifying hit.
{
  const s = freshState(), r = freshRun();
  for (let n = 1; n <= 5; n++) assert.ok(decide(s, r, hit({ n, always: true }), no));
  assert.equal(decide(s, r, hit({ n: 6, always: true, typed: "23" }), no), null, "still only with a hero in the answer");
}

// The deck: no quip repeats until all have been heard, and a new deck never starts with the last.
{
  const s = freshState(), r = seeded(7);
  for (const d of Object.keys(QUIPS)) {
    let prev = null;
    for (let round = 0; round < 5; round++) {
      const got = QUIPS[d].map(() => drawQuip(s, d, r));
      assert.deepEqual(got.slice().sort(), QUIPS[d].slice().sort(), `hero ${d}: each quip once per deck`);
      if (prev) assert.notEqual(got[0], prev, `hero ${d}: no repeat across decks`);
      prev = got[got.length - 1];
    }
    assert.deepEqual(heardOf(s, d), { heard: QUIPS[d].length, of: QUIPS[d].length });
  }
  assert.deepEqual(heardOf(freshState(), 0), { heard: 0, of: 4 });
  // It survives saving (JSON) and a quip that's since been reworded drops out.
  const saved = JSON.parse(JSON.stringify(s));
  saved.decks[1] = ["One and done!", "An old quip"];
  const back = freshState(saved);
  assert.equal(drawQuip(back, 1, r), "One and done!");
  assert.ok(QUIPS[1].includes(drawQuip(back, 1, r)));
}

// The simulator: with a typical team (captain and two rescued), about one moment every 2–3
// floors, in every Wing.
for (const wing of ["cellar", "hall", "tower"]) {
  const sim = simulate({ runs: 300, wing, team, seed: 3 });
  assert.ok(sim.floorsPerMoment >= 2 && sim.floorsPerMoment <= 3.5, `${wing}: one moment every ${sim.floorsPerMoment.toFixed(2)} floors`);
  assert.ok(sim.perRun.every((n) => n <= 2 * 7), "never more than 2 a floor");
  assert.ok(sim.heroes[5] && sim.heroes[0] && sim.heroes[1], "every hero on the team gets moments");
}
const sim = simulate({ runs: 300, wing: "cellar", team, seed: 3 });
console.log(`✓ moments (Cellar, captain + 2: ${sim.meanPerRun.toFixed(2)} a run, one every ${sim.floorsPerMoment.toFixed(2)} floors; ${sim.why.boss} boss finishes, ${sim.why.chance} by chance)`);
