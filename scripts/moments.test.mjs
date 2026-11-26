// Hero Moments (DESIGN.md §8.4): when they happen (moments.js decide), the quip decks, and the
// rarity simulator landing near one moment every 2–3 floors with a typical team.
import assert from "node:assert/strict";
import { QUIPS, FINAL, FINALS, CRIT, CHANCE, BUILD, REST, PER_FLOOR, TEAMUP, TEAM_LINES, TEAM_NUMBERS, CAPTAIN, CAPTAIN_LINES, captainNames, nameLine, freshState, freshRun, decide, drawQuip, heroesIn, heardOf, joined, simulate, seeded } from "../js/moments.js";
import { HEROES } from "../js/heroes.js";
import { OWN_KEYS } from "../js/store.js";

assert.deepEqual([CHANCE, BUILD, REST, PER_FLOOR], [0.08, 0.04, 6, 2]);
assert.deepEqual(Object.keys(QUIPS).map(Number), HEROES.map((h) => h.d), "every hero has quips");
assert.ok(OWN_KEYS.includes("moments"), "the saved state is a listed player key");

const team = { captain: 5, rescued: [5, 0, 1] };
// A player whose captains (5 here, 1 in the big team below) have had their first captain's moment.
const st = () => freshState({ captains: [5, 1] });
// A hit: right answer, unhinted, on the team's digits, not the first fight.
const hit = (o) => Object.assign({ typed: "15", team, hinted: false, spell: null, first: false, floor: 0, n: 1, bossFinish: false, critStart: false, always: false }, o);
const yes = () => 0, no = () => 0.999; // rnd: a sure roll, a sure miss

// Who's in the answer.
assert.deepEqual(heroesIn("15", team), [1, 5]);
assert.deepEqual(heroesIn("55", team), [5]);
assert.deepEqual(heroesIn("23", team), []);

// Only on a qualifying hit.
for (const o of [{ hinted: true }, { first: true }, { spell: "backwards" }, { spell: "show" }, { typed: "23" }]) {
  assert.equal(decide(st(), freshRun(), hit(o), yes), null, JSON.stringify(o));
}
assert.ok(decide(st(), freshRun(), hit({ spell: "good" }), yes), "a spell's good hit can be a moment");

// The chance: 8%, plus 4% for each qualifying hit that rolled without one, back to 8% after.
{
  const s = st(), r = freshRun();
  const at = (p) => () => p; // a roll of exactly p
  assert.equal(decide(s, r, hit({ n: 1 }), at(0.08)), null, "8%: a roll of .08 misses");
  assert.equal(s.dry, 1);
  assert.equal(decide(s, r, hit({ n: 2 }), at(0.119)) !== null, true, "12% after one miss");
  assert.equal(s.dry, 0, "back to 8%");
  // A long dry spell builds up: no more than ~23 qualifying hits without a moment.
  const s2 = st(), r2 = freshRun();
  let n = 0;
  while (!decide(s2, r2, hit({ n: ++n, floor: n }), at(0.99))) assert.ok(n < 30);
  assert.equal(n, 24, "8% + 4% × 23 reaches 100%");
}

// A rest of REST problems after a moment, and at most PER_FLOOR a floor.
{
  const s = st(), r = freshRun();
  assert.ok(decide(s, r, hit({ n: 1 }), yes));
  for (let n = 2; n <= 1 + REST; n++) assert.equal(decide(s, r, hit({ n }), yes), null, `problem ${n} rests`);
  assert.equal(s.dry, 0, "rested hits don't build the chance");
  assert.ok(decide(s, r, hit({ n: 2 + REST }), yes), "after the rest, another");
  assert.equal(decide(s, r, hit({ n: 30 }), yes), null, "two on this floor already");
  assert.ok(decide(s, r, hit({ n: 31, floor: 1 }), yes), "a new floor");
}

// A different hero from last time, when the answer has more than one.
{
  const s = st(), r = freshRun();
  let last = null;
  for (let i = 0; i < 40; i++) {
    const mo = decide(s, r, hit({ n: i * 10, floor: i }), Math.random);
    if (!mo) continue;
    // A team-up has both heroes; a solo moment is never the hero picked last time.
    if (last != null && mo.partner == null) assert.notEqual(mo.hero, last, "never the same hero twice running when there's a choice");
    last = s.last;
  }
  assert.ok(last != null);
  // With only one hero in the answer, it's that one.
  const mo = decide(s, freshRun(), hit({ typed: "5", n: 1 }), yes);
  assert.equal(mo.hero, 5);
}

// Always: a freed hero's debut, and the blow that finishes a boss, past the rest, the cap and the roll.
{
  const s = st(), r = freshRun();
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
  const s = st(), r = freshRun();
  assert.equal(decide(s, r, hit({ n: 1, critStart: true }), yes).quip, CRIT);
  assert.notEqual(decide(s, r, hit({ n: 10, floor: 1 }), yes).quip, CRIT);
  joined(s, 1);
  assert.notEqual(decide(s, r, hit({ n: 11, floor: 1, critStart: true }), no).quip, CRIT, "a debut says the hero's own quip");
}

// ?moments: every qualifying hit.
{
  const s = st(), r = freshRun();
  for (let n = 1; n <= 5; n++) assert.ok(decide(s, r, hit({ n, always: true }), no));
  assert.equal(decide(s, r, hit({ n: 6, always: true, typed: "23" }), no), null, "still only with a hero in the answer");
}

// The deck: no quip repeats until all have been heard, and a new deck never starts with the last.
{
  const s = st(), r = seeded(7);
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
  assert.deepEqual(heardOf(st(), 0), { heard: 0, of: 4 });
  // It survives saving (JSON) and a quip that's since been reworded drops out.
  const saved = JSON.parse(JSON.stringify(s));
  saved.decks[1] = ["One and done!", "An old quip"];
  const back = freshState(saved);
  assert.equal(drawQuip(back, 1, r), "One and done!");
  assert.ok(QUIPS[1].includes(drawQuip(back, 1, r)));
}

// Team-ups: a chance moment with two different team heroes in the answer is a team-up half the time.
{
  assert.equal(TEAMUP, 0.5);
  const big = { captain: 1, rescued: [1, 2, 3, 4, 5, 6, 7, 8, 9, 0] };
  // The split: about half of the moments on two-hero answers, over many seeded rolls.
  const r = seeded(11);
  let teams = 0, all = 0;
  for (let i = 0; i < 4000; i++) {
    const mo = decide(st(), freshRun(), hit({ typed: "15", always: true }), r);
    all++; if (mo.partner != null) teams++;
  }
  assert.ok(Math.abs(teams / all - 0.5) < 0.03, `team-ups ${(teams / all * 100).toFixed(1)}% of two-hero moments`);
  // A roll under TEAMUP is a team-up, at or over is solo; the moment itself was rolled the same way.
  const rolls = (...xs) => { let i = 0; return () => xs[Math.min(i++, xs.length - 1)]; };
  assert.ok(decide(st(), freshRun(), hit({ typed: "15" }), rolls(0, 0, 0.49, 0)).partner != null);
  assert.equal(decide(st(), freshRun(), hit({ typed: "15" }), rolls(0, 0, 0.5, 0)).partner, undefined);
  // It doesn't add moments: a missed roll is still no moment.
  assert.equal(decide(st(), freshRun(), hit({ typed: "15", teamup: true }), no), null);
  // ?teamup: always a team-up when there are two heroes.
  for (let i = 0; i < 20; i++) assert.ok(decide(st(), freshRun(), hit({ typed: "15", always: true, teamup: true }), Math.random).partner != null);
  // Doubles stay solo: 33 has one hero.
  for (let i = 0; i < 20; i++) assert.equal(decide(st(), freshRun(), hit({ typed: "33", team: big, always: true, teamup: true }), Math.random).partner, undefined);
  // Left and right in the answer's order: the tens on the left, whichever hero was picked.
  for (const typed of ["15", "51", "10", "64", "98"]) {
    for (let i = 0; i < 10; i++) {
      const mo = decide(st(), freshRun(), hit({ typed, team: big, always: true, teamup: true }), Math.random);
      assert.deepEqual([mo.hero, mo.partner], [+typed[0], +typed[1]], typed);
    }
  }
  // Three or more digits: two different heroes, still left to right.
  for (let i = 0; i < 30; i++) {
    const mo = decide(st(), freshRun(), hit({ typed: "123", team: big, always: true, teamup: true }), Math.random);
    assert.notEqual(mo.hero, mo.partner);
    assert.ok("123".indexOf(mo.hero) < "123".indexOf(mo.partner), `${mo.hero} then ${mo.partner}`);
  }
  // Debuts and boss finishes stay solo.
  {
    const s = st(); joined(s, 0);
    const d = decide(s, freshRun(), hit({ typed: "10", teamup: true }), yes);
    assert.deepEqual([d.why, d.partner], ["debut", undefined]);
    const b = decide(st(), freshRun(), hit({ typed: "15", bossFinish: true, teamup: true }), yes);
    assert.deepEqual([b.why, b.partner], ["boss", undefined]);
    assert.ok(FINALS.includes(b.quip));
  }
  // A number's own line wins for exactly that number, even on the crit hit; others draw the deck.
  for (const [n, line] of Object.entries(TEAM_NUMBERS)) {
    const mo = decide(st(), freshRun(), hit({ typed: n, team: big, always: true, teamup: true, critStart: true }), Math.random);
    assert.deepEqual([mo.quip, mo.hero, mo.partner], [line, +n[0], +n[1]], n);
  }
  assert.ok(TEAM_LINES.includes(decide(st(), freshRun(), hit({ typed: "15", always: true, teamup: true }), Math.random).quip));
  assert.equal(decide(st(), freshRun(), hit({ typed: "15", always: true, teamup: true, critStart: true }), Math.random).quip, CRIT);
  // The team deck: each line once per deck, never the same line twice running across decks,
  // and the heroes' own decks untouched.
  const s = st(), rr = freshRun();
  const got = [];
  for (let i = 0; i < TEAM_LINES.length * 4; i++) got.push(decide(s, rr, hit({ typed: "15", n: i, floor: i, always: true, teamup: true }), seeded(100 + i)).quip);
  const L = TEAM_LINES.length;
  for (let k = 0; k < 4; k++) assert.deepEqual(got.slice(k * L, k * L + L).sort(), TEAM_LINES.slice().sort(), `deck ${k}`);
  for (let i = 1; i < got.length; i++) assert.notEqual(got[i], got[i - 1], "no team line twice running");
  assert.deepEqual(Object.keys(s.decks), ["team"]);
  // 67 says Sevenstein's own "Six, seven!", which is in his deck too: the two decks don't mix.
  assert.ok(TEAM_NUMBERS[67] === "Six, seven!" && QUIPS[7].includes("Six, seven!") && !TEAM_LINES.includes("Six, seven!"));
  const s7 = st();
  const solo = QUIPS[7].map(() => drawQuip(s7, 7, seeded(5)));
  assert.deepEqual(solo.slice().sort(), QUIPS[7].slice().sort(), "Sevenstein's deck is whole");
  const t67 = decide(s7, freshRun(), hit({ typed: "67", team: big, always: true, teamup: true }), Math.random);
  assert.deepEqual([t67.hero, t67.partner, t67.quip], [6, 7, "Six, seven!"]);
  assert.equal(s7.decks.team, undefined, "a number's line doesn't touch the team deck");
}

// Captain lines, in a fight (moments.js decide): the shared lines only, no names.
{
  assert.deepEqual(CAPTAIN_LINES, ["Captain's orders!", "Leading digit, leading the charge!", "The captain always counts!", "First in line, first to strike!", "Power hit, captain style!"]);
  assert.equal(CAPTAIN, 0.5);
  assert.ok(!CAPTAIN_LINES.concat(HEROES.flatMap((h) => captainNames(h.d))).some((q) => /Follow the leader/i.test(q)), "\"Follow the leader!\" was cut");
  // The 50/50: a solo chance moment for the captain is a shared captain line half the time, the
  // hero's own quip otherwise; a rescued hero's moment never is.
  const r = seeded(31);
  let cap = 0, own = 0;
  for (let i = 0; i < 4000; i++) {
    const mo = decide(st(), freshRun(), hit({ typed: "5", always: true }), r);
    if (CAPTAIN_LINES.includes(mo.quip)) cap++; else { assert.ok(QUIPS[5].includes(mo.quip)); own++; }
  }
  assert.ok(Math.abs(cap / (cap + own) - 0.5) < 0.03, `captain lines ${(cap / (cap + own) * 100).toFixed(1)}%`);
  for (let i = 0; i < 200; i++) assert.ok(QUIPS[0].includes(decide(st(), freshRun(), hit({ typed: "0", always: true }), r).quip), "Zeroic isn't captain: his own quips");
  const rolls = (...xs) => { let i = 0; return () => xs[Math.min(i++, xs.length - 1)]; };
  assert.ok(CAPTAIN_LINES.includes(decide(st(), freshRun(), hit({ typed: "5" }), rolls(0, 0, 0.49, 0)).quip), "a roll under CAPTAIN: a captain line");
  assert.ok(QUIPS[5].includes(decide(st(), freshRun(), hit({ typed: "5" }), rolls(0, 0, 0.5, 0)).quip), "at or over: the hero's own");
  // "Critical math!", team-ups and boss finishes keep their own lines.
  assert.equal(decide(st(), freshRun(), hit({ typed: "5", critStart: true }), yes).quip, CRIT);
  assert.ok(TEAM_LINES.includes(decide(st(), freshRun(), hit({ typed: "15", always: true, teamup: true }), Math.random).quip));
  assert.ok(FINALS.includes(decide(st(), freshRun(), hit({ typed: "5", bossFinish: true }), yes).quip));
  // The shared deck (key "captain"): each line once per deck, never twice running.
  const s = st(), got = [];
  for (let i = 0; got.length < 5 * 4; i++) { const mo = decide(s, freshRun(), hit({ typed: "5", always: true }), seeded(200 + i)); if (CAPTAIN_LINES.includes(mo.quip)) got.push(mo.quip); }
  for (let k = 0; k < 4; k++) assert.deepEqual(got.slice(k * 5, k * 5 + 5).sort(), CAPTAIN_LINES.slice().sort(), `captain deck ${k}`);
  for (let i = 1; i < got.length; i++) assert.notEqual(got[i], got[i - 1], "no captain line twice running");
  assert.ok(!got.some((q) => q.includes("High Five")), "no names in a fight");
}

// A captain's first moment: forced, once per captain, with a shared line.
{
  const s = freshState(), r = freshRun();
  assert.equal(decide(s, r, hit({ typed: "15", first: true }), no), null, "not in the first fight");
  assert.equal(decide(s, r, hit({ typed: "23", n: 1 }), no), null, "no 5 in the answer: not yet");
  const c = decide(s, r, hit({ typed: "15", n: 2 }), no);
  assert.deepEqual([c.hero, c.why, c.partner], [5, "captain", undefined], "forced, against the roll, solo");
  assert.ok(CAPTAIN_LINES.includes(c.quip));
  assert.deepEqual(s.captains, [5]);
  assert.deepEqual([r.last, r.onFloor], [2, 1], "it counts for the rest and the floor's cap");
  assert.equal(decide(s, r, hit({ typed: "15", n: 20, floor: 1 }), no), null, "once per captain");
  // A new captain gets one of their own; the old one doesn't again.
  const t3 = { captain: 3, rescued: [5, 0, 1, 3] };
  const c3 = decide(s, freshRun(), hit({ typed: "3", team: t3 }), no);
  assert.deepEqual([c3.hero, c3.why], [3, "captain"]);
  assert.equal(decide(s, freshRun(), hit({ typed: "3", team: t3 }), no), null);
  assert.equal(decide(s, freshRun(), hit({ typed: "5" }), no), null, "back to 5: already had it");
  assert.deepEqual(freshState(JSON.parse(JSON.stringify(s))).captains, [5, 3], "saved");
  // A rescued hero's debut comes first on the same hit; the captain's waits for the next.
  const s2 = freshState(), r2 = freshRun(); joined(s2, 0);
  assert.deepEqual([decide(s2, r2, hit({ typed: "50", n: 1 }), no).why, s2.captains], ["debut", []]);
  assert.equal(decide(s2, r2, hit({ typed: "50", n: 2 }), no).why, "captain");
  // A boss finish comes first too.
  const s3 = freshState();
  assert.equal(decide(s3, freshRun(), hit({ typed: "5", bossFinish: true }), no).why, "boss");
  assert.deepEqual(s3.captains, []);
}

// Captain name lines, on picking a captain (app.js wireCaptain: nameLine), not in fights.
{
  assert.deepEqual(captainNames(2), ["Captain Twodini, reporting for duty!", "Captain Twodini, at your service!", "Captain Twodini leads the charge!", "Make way for Captain Twodini!"]);
  // The very first captain a player picks: "reporting for duty", whatever the roll.
  const s = freshState(), r = seeded(21);
  assert.equal(nameLine(s, 4, r), "Captain Sir Fourtress, reporting for duty!");
  assert.deepEqual(s.named, [4]);
  // Then the four styles rotate across all picks, whichever hero (key "style"): each style once
  // per deck, never the same style twice running, so tapping through heroes varies.
  const styleOf = (q, d) => captainNames(d).indexOf(q), got = [];
  for (let i = 0; i < 4 * 5; i++) { const d = i % 10; got.push(styleOf(nameLine(s, d, r), d)); }
  for (let k = 0; k < 5; k++) assert.deepEqual(got.slice(k * 4, k * 4 + 4).sort(), [0, 1, 2, 3], `style deck ${k}`);
  for (let i = 1; i < got.length; i++) assert.notEqual(got[i], got[i - 1], "no style twice running");
  assert.notEqual(got[0], 0, "the style just heard (reporting for duty) doesn't open the first deck");
  assert.deepEqual(freshState(JSON.parse(JSON.stringify(s))).named.slice(0, 2), [4, 0], "saved");
  assert.deepEqual([freshState({ decks: {} }).named, freshState({ decks: {} }).captains], [[], []], "an older saved state");
  assert.deepEqual(s.captains, [], "picking isn't a fight's captain moment");
  // Fights never say a name line.
  const m = st(), mr = freshRun(), names = new Set(HEROES.flatMap((h) => captainNames(h.d)));
  for (let i = 0; i < 300; i++) assert.ok(!names.has(decide(m, mr, hit({ typed: String(5 + 10 * (i % 2)), n: i * 10, floor: i, always: true }), Math.random).quip));
}

// The simulator: with a typical team (captain and two rescued), about one moment every 2–3
// floors, in every Wing.
for (const wing of ["cellar", "hall", "mines", "tower"]) {
  const sim = simulate({ runs: 300, wing, team, seed: 3 });
  assert.ok(sim.floorsPerMoment >= 2 && sim.floorsPerMoment <= 3.5, `${wing}: one moment every ${sim.floorsPerMoment.toFixed(2)} floors`);
  assert.ok(sim.perRun.every((n) => n <= 2 * 7), "never more than 2 a floor");
  assert.ok(sim.heroes[5] && sim.heroes[0] && sim.heroes[1], "every hero on the team gets moments");
}
const sim = simulate({ runs: 300, wing: "cellar", team, seed: 3 });
assert.ok(sim.teamups > 0 && sim.teamups < sim.why.chance, "some chance moments are team-ups");
assert.ok(sim.captainLines > 0 && sim.captainLines < sim.why.chance && sim.why.captain === 1, "some are captain lines, and one captain's first");
console.log(`✓ moments (Cellar, captain + 2: ${sim.meanPerRun.toFixed(2)} a run, one every ${sim.floorsPerMoment.toFixed(2)} floors; ${sim.why.boss} boss finishes, ${sim.why.chance} by chance, ${sim.teamups} of them team-ups, ${sim.captainLines} captain lines; ${sim.why.captain} captain's first)`);
