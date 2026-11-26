// Monster traits: each rule, and that every monster on a Wing has its badge (but Plusquito).
import assert from "node:assert/strict";
import { TRAITS, traitOf, charged, prefers, hitBy, atHalf } from "../js/traits.js";
import { MON } from "../js/monsters.js";
import { WINGS, cursedMonster } from "../js/wings.js";
import { choose, pool } from "../js/learn.js";

const mon = (n) => MON.find((m) => m.n === n);
for (const w of WINGS) for (const n of w.pool.concat([w.boss])) {
  if (n === "Plusquito") assert.equal(traitOf(mon(n)), null, "Plusquito is the tutorial monster");
  else assert.ok(traitOf(mon(n)), `${n} has a trait`);
}
for (const t of Object.values(TRAITS)) assert.ok(t.text.split(" ").length <= 10 && t.icon && t.name);

// Minustaur charges every 4th problem.
assert.deepEqual([0, 1, 2, 3, 4, 7].map((n) => charged(mon("Minustaur"), n)), [false, false, false, true, false, true]);
assert.equal(charged(mon("Plusquito"), 3), false);

// Hits.
assert.equal(hitBy(mon("Timesaur"), 8, "8", false).mult, 0.5);
assert.equal(hitBy(mon("Timesaur"), 12, "12", false).mult, 1);
assert.equal(hitBy(mon("Make-Ten Golem"), 10, "10", false).mult, 2);
assert.equal(hitBy(mon("Make-Ten Golem"), 9, "9", false).mult, 1);
assert.equal(hitBy(mon("Sigma Rex"), 6, "6", false).mult, 1, "Sigma Rex isn't armored until half HP");
assert.equal(hitBy(mon("Sigma Rex"), 6, "6", true).mult, 0.5);
assert.equal(hitBy(cursedMonster(5), 15, "15", false).mult, 2, "Lucky Number");
assert.equal(hitBy(cursedMonster(5), 12, "12", false).mult, 1);
assert.match(traitOf(cursedMonster(3)).text, /a 3 hit double/);

// Half HP.
assert.equal(atHalf(mon("Divvy")).split, true);
assert.ok(atHalf(mon("Sigma Rex")).note);
assert.equal(atHalf(mon("Timesaur")), null);

// Starbot asks ×5 and ×10 facts more often.
const like = prefers(mon("Starbot"));
assert.equal(like("×5,7"), true); assert.equal(like("×3,4"), false); assert.equal(like("÷10,5"), true);
const recs = Object.fromEntries(pool("third").map((p) => [p.key, { b: 3, n: 3, c: 3, ms: 2000, t: 0 }]));
let s = 1; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
let hits = 0;
for (let i = 0; i < 1000; i++) if (like(choose("third", recs, { now: 1e12, rnd, op: "×", like }))) hits++;
assert.ok(hits > 650, `Starbot asked ×5/×10 facts ${hits} times in 1000`);
// The Centipede (a stand-in boss): 100 or more hits double.
assert.equal(hitBy(mon("The Centipede"), 120, "120", false).mult, 2);
assert.equal(hitBy(mon("The Centipede"), 99, "99", false).mult, 1);
// What each monster asks at all: comparing for Chompers, balancing for the Twins, the Hall's
// whole mix for Judo Judy, never either for the arithmetic monsters; Quizard balances too.
import { asks, flipOf } from "../js/traits.js";
import { factOf, keyOf, record as recordAnswer } from "../js/learn.js";
import { missingOf } from "../js/missing.js";
import { balanceFacts } from "../js/balance.js";
assert.ok(asks(mon("Chompers"))("○") && asks(mon("Chompers"))("more") && !asks(mon("Chompers"))("+"));
assert.ok(asks(mon("Equal Twins"))("=") && !asks(mon("Equal Twins"))("○"));
assert.ok(["+", "-", "○", "="].every((op) => asks(mon("Judo Judy"))(op)), "Judo Judy asks the Hall's whole mix");
assert.equal(mon("The Unknown"), undefined, "The Unknown is retired");

// Flip (Judo Judy): + with the smaller number first is thrown to the bigger first. Same answer,
// same fact key (turnarounds share one), so the fact's record is the same either way.
const judy = mon("Judo Judy");
assert.deepEqual(traitOf(judy), { icon: "🥋", name: "Flip", text: "Flips your sums: same answer" });
const three8 = factOf("+3,8", () => 0.9); // not turned around: 3 + 8
assert.equal(three8.q, "3 + 8");
const thrown = flipOf(judy, three8);
assert.ok(thrown && thrown.flipped);
assert.deepEqual([thrown.x, thrown.y, thrown.q, thrown.ans], [8, 3, "8 + 3", 11], "8 + 3, the same answer");
assert.equal(thrown.key, three8.key);
assert.equal(keyOf(thrown), keyOf(three8), "the turnaround shares the fact's key");
assert.equal(three8.q, "3 + 8", "the original problem isn't changed");
assert.equal(flipOf(judy, factOf("+3,8", () => 0)), null, "already the bigger first (8 + 3)");
assert.equal(flipOf(judy, factOf("+4,4", () => 0)), null, "a double has nothing to flip");
assert.equal(flipOf(judy, factOf("-8,3", () => 0)), null, "taking away doesn't turn around");
assert.equal(flipOf(judy, missingOf(three8, "x")), null, "a hidden number stays where it is");
for (const f of balanceFacts().slice(0, 40)) assert.equal(flipOf(judy, f), null, "comparing and balancing stay as they are");
// Two-digit sums in the Hall (add tens, 10 more): 20 + 34 is thrown to 34 + 20.
assert.equal(flipOf(judy, { op: "+", x: 20, y: 34, ans: 54, q: "20 + 34" }).q, "34 + 20");
for (const n of ["Plusquito", "Make-Ten Golem", "Equal Twins"]) assert.equal(flipOf(mon(n), three8), null, `${n} doesn't flip`);
// An answer on the flipped problem lands on the same record.
const recs2 = {};
recs2[thrown.key] = recordAnswer(recs2[thrown.key], { ok: true, ms: 1500, hinted: false, now: 1, fluentMs: 4000 });
assert.ok(recs2["+3,8"] && recs2["+3,8"].n === 1, "the flipped answer counts for +3,8");
// Judy's hits are plain.
assert.equal(hitBy(judy, 11, "11", false).mult, 1);
assert.ok(asks(mon("Quizard"))("=") && asks(mon("Quizard"))("+") && !asks(mon("Quizard"))("○"));
for (const n of ["Plusquito", "Minustaur", "Timesaur", "Haberhasher"]) assert.ok(asks(mon(n))("+") && !asks(mon(n))("○") && !asks(mon(n))("="), n);
console.log("✓ traits");

// The grade strata's new monsters (M5 step 3): each trait, and what each asks.
import { isDouble, isDice, regroups, flashOf, dieSvg } from "../js/traits.js";
import { pool as poolOf, monsterHP } from "../js/learn.js";
import { threeFacts, tenOf } from "../js/three.js";
import { arrayFacts } from "../js/arrays.js";
import { lookOf, LOOKS } from "../js/monsters.js";
{
  const look = (n) => lookOf(mon(n), 1); // the first look asks and hits as its monster does
  for (const n of ["Pipsqueak", "Doublet", "Triceraplus", "Margot-Rythm", "Squaresquatch", "Halfling"]) {
    assert.ok(traitOf(mon(n)) && traitOf(look(n)) === traitOf(mon(n)), `${n} has a trait, and so do its looks`);
    assert.ok(traitOf(mon(n)).text.length <= 40, `${n}'s trait fits on a line on an iPhone: ${traitOf(mon(n)).text}`);
  }
  // What a monster asks, over a whole band: the facts it can get there at all.
  const asked = (n, band) => poolOf(band).filter((f) => asks(mon(n))(f.op, f.key));

  // Pipsqueak (Cellar): sums of two dice-sized numbers, 1 to 6, and nothing else.
  const pip = asked("Pipsqueak", "kinder");
  assert.ok(pip.length === 19 && pip.every((f) => f.op === "+" && /^\+[1-6],[1-6]$/.test(f.key)), "Pipsqueak asks dice sums");
  assert.ok(pip.some((f) => f.level === 0), "there are dice sums from the first level");
  assert.ok(isDice("+", "+3,5") && !isDice("+", "+0,4") && !isDice("+", "+4,7") && !isDice("-", "-5,3") && !isDice("+", "□+3,7"));
  // Flash: a dice sum comes as dice; anything else, or anyone else, as it is.
  const pq = mon("Pipsqueak"), p35 = factOf("+3,5", () => 0.9), shown = flashOf(pq, p35);
  assert.ok(shown && shown.dice && shown.x === 3 && shown.y === 5 && shown.ans === 8 && shown.key === "+3,5", "the same problem, as dice");
  assert.equal(flashOf(look("Pipsqueak"), p35).dice, true, "a look flashes dice too");
  assert.equal(flashOf(mon("Plusquito"), p35), null);
  assert.equal(flashOf(pq, missingOf(p35, "x")), null, "a hidden number isn't a die");
  assert.equal(flashOf(pq, factOf("+0,4", () => 0)), null, "no die shows zero");
  assert.equal(p35.dice, undefined, "the original problem isn't changed");
  for (let n = 1; n <= 6; n++) assert.equal((dieSvg(n).match(/<circle/g) || []).length, n, `a die showing ${n} has ${n} pips`);
  assert.equal(hitBy(pq, 8, "8", false, shown).mult, 1, "Flash doesn't change damage");

  // Doublet (Hall): doubles and taking half away, from every kind the Hall has them in.
  const dbl = asked("Doublet", "first").map((f) => f.key);
  for (const k of ["+6,6", "+9,9", "-16,8", "+40,40", "□+7,7", "□-12,6"]) assert.ok(dbl.includes(k), `Doublet asks ${k}`);
  assert.ok(dbl.every((k) => isDouble(k.replace("□", "")[0], k)), "Doublet asks only doubles");
  assert.ok(!isDouble("+", "+6,7") && !isDouble("-", "-15,7") && !isDouble("○", "○x") && !isDouble("+", "Σ4,6,4"));
  // With only the first level open (no doubles in it), Doublet asks the doubles of the lowest level that has them.
  const dRecs = {};
  for (let i = 0; i < 200; i++) assert.ok(isDouble(...(() => { const k = choose("first", dRecs, { now: 0, rnd: Math.random, asks: asks(mon("Doublet")), open: [0] }); return [poolOf("first").find((f) => f.key === k).op, k]; })()));

  // Triceraplus (Hall): its own strand of three numbers, two of them making ten; no one else adds three.
  const tri = asked("Triceraplus", "three");
  assert.equal(tri.length, 20);
  assert.ok(tri.every((f) => f.op === "Σ") && !poolOf("first").some((f) => f.op === "Σ"), "a strand, not the Hall's band");
  for (const f of threeFacts()) { const t = tenOf(f); assert.ok(t && t.ten[0] + t.ten[1] === 10 && f.ans === 10 + t.rest && f.ans > 10 && f.ans < 20, f.q); }
  for (const n of ["Quizard", "Equal Twins", "Chompers", "Doublet", "Minustaur", "Plusquito"]) assert.ok(!asks(mon(n))("Σ", "Σ4,6,3"), `${n} doesn't add three numbers`);
  assert.deepEqual([factOf("Σ4,6,3").q, factOf("Σ4,6,3").ans], ["4 + 6 + 3", 13]);
  assert.ok(monsterHP(mon("Triceraplus"), "three", {}) >= 30, "Triceraplus's HP is from its own sums");

  // Margot-Rythm (Mines): regrouping hits double, in any place; nothing else changes.
  const mg = mon("Margot-Rythm"), P = (op, x, y) => ({ op, x, y, ans: op === "+" ? x + y : x - y });
  assert.deepEqual([P("+", 27, 15), P("-", 52, 28), P("+", 395, 10), P("-", 405, 10), P("+", 38, 25)].map(regroups), [true, true, true, true, true]);
  assert.deepEqual([P("+", 23, 15), P("-", 58, 28), P("+", 345, 100), P("-", 345, 10), P("+", 30, 40)].map(regroups), [false, false, false, false, false]);
  assert.deepEqual(hitBy(mg, 42, "42", false, P("+", 27, 15)), { mult: 2, note: "Regrouped! Double damage" });
  assert.equal(hitBy(mg, 38, "38", false, P("+", 23, 15)).mult, 1);
  assert.equal(hitBy(look("Margot-Rythm"), 42, "42", false, P("+", 27, 15)).mult, 2, "a look carries the one too");
  assert.equal(hitBy(mon("Haberhasher"), 42, "42", false, P("+", 27, 15)).mult, 1, "only Margot-Rythm");
  assert.equal(hitBy(mg, 42, "42", false).mult, 1, "no problem, no double");
  // It asks the Mines' + and −, and the regrouping level has both kinds.
  assert.ok(asked("Margot-Rythm", "second").length === poolOf("second").filter((f) => f.op !== "#").length, "not place value");
  const regroupLevel = poolOf("second").filter((f) => f.level === 1).map((f) => factOf(f.key, () => 0.9));
  assert.ok(regroupLevel.every(regroups), "every fact in the regrouping level regroups");

  // Squaresquatch (Mines): its own strand of arrays, 2 to 5 rows of 2 to 5.
  const arr = poolOf("arrays");
  assert.equal(arr.length, 16);
  assert.ok(arr.every((f) => f.op === "▦") && asks(mon("Squaresquatch"))("▦", "▦3,5"));
  assert.deepEqual([factOf("▦3,5").q, factOf("▦3,5").ans], ["5 + 5 + 5 = □", 15]);
  assert.deepEqual(arrayFacts().map((f) => f.ans).sort((a, b) => a - b).slice(0, 2), [4, 6]);
  assert.ok(!poolOf("third").some((f) => f.key[0] === "▦"), "arrays aren't the Tower's times tables");

  // Halfling (Tower): fractions only, even before the fractions levels are open: the number line
  // first (batch 2), as the school teaches it.
  const hf = asked("Halfling", "third");
  assert.ok(hf.length === 24 + 35 + 24 && hf.every((f) => "/↔".includes(f.op) || (f.op === "○" && f.key.includes("/"))));
  // Chompers visiting the Tower compares fractions, and only them.
  const cf = asked("Chompers", "third");
  assert.ok(cf.length === 24 && cf.every((f) => f.op === "○" && f.key.includes("/")));
  for (let i = 0; i < 100; i++) assert.equal(choose("third", {}, { now: 0, asks: asks(mon("Halfling")), open: [8, 9, 10] })[0], "↔", "fractions on a number line first");
  assert.ok(asks(mon("Halfling"))("/", "/1,2,4") && !asks(mon("Halfling"))("×", "×3,4"));
  assert.ok(LOOKS.Halfling.length === 4);

  // Batch 1: Tick-Tockus asks only the time and Slimelipsis only its patterns (and odd and even),
  // and no one else asks either.
  const tt = mon("Tick-Tockus"), sl = mon("Slimelipsis");
  assert.deepEqual([traitOf(tt).name, traitOf(sl).name], ["Tick Tock", "What's Next"]);
  for (const b of ["timeH", "timeM", "timeT"]) assert.equal(asked("Tick-Tockus", b).length, poolOf(b).length, b);
  for (const b of ["patK", "patH", "patM"]) assert.equal(asked("Slimelipsis", b).length, poolOf(b).length, b);
  assert.ok(asks(tt)("⌚", "⌚h3") && !asks(tt)("+", "+3,4") && !asks(tt)("…", "…2,4,6,□"));
  assert.ok(asks(sl)("…", "…2,4,6,□") && asks(sl)("◐", "◐e2,3,5,7,8") && !asks(sl)("⌚", "⌚h3"));
  for (const n of ["Plusquito", "Quizard", "Haberhasher", "Timesaur", "Chompers", "Make-Ten Golem"]) {
    assert.ok(!asks(mon(n))("⌚", "⌚h3") && !asks(mon(n))("…", "…2,4,6,□") && !asks(mon(n))("◐", "◐e2,3,5,7,8"), `${n} never tells time or counts patterns`);
  }
  assert.ok(asks(look("Tick-Tockus"))("⌚", "⌚h3") && asks(look("Slimelipsis"))("◐", "◐e2,3,5,7,8"), "a look asks what its monster does");
  assert.equal(hitBy(tt, 30, "30", false, factOf("⌚t3:30")).mult, 1, "no damage rule: the trait is what it asks");

  // Batch 2: the Equal Twins say whether an equation is true (and fix it), and only they (and
  // Judo Judy, the Hall's whole mix) do; Margot-Rythm asks the Mines' + and −, not place value,
  // which Haberhasher asks; Trollar's dollars are his strand's; Halfling's number line.
  const tw = mon("Equal Twins");
  assert.ok(asks(tw)("✓", "✓4+2=7") && asks(tw)("✎", "✎4+2=7") && asks(tw)("=", "=3+4,□+5") && !asks(tw)("+", "+3,4"));
  assert.ok(asks(mon("Judo Judy"))("✓", "✓4+2=7"));
  for (const n of ["Plusquito", "Quizard", "Chompers", "Doublet", "Triceraplus", "Haberhasher"]) assert.ok(!asks(mon(n))("✓", "✓4+2=7") && !asks(mon(n))("✎", "✎4+2=7"), `${n} never asks true or false`);
  assert.ok(asks(mon("Haberhasher"))("#", "#b345") && !asks(mon("Margot-Rythm"))("#", "#b345") && asks(mon("Margot-Rythm"))("+", "+38,25"));
  assert.ok(asks(mon("Trollar"))("$", "$20,5,1"));
  assert.ok(poolOf("coins").some((f) => f.op === "$") && !poolOf("coinsK").some((f) => f.op === "$"), "dollars are the Mines' coins strand");
  assert.ok(asked("Equal Twins", "first").every((f) => "=✓✎".includes(f.op)));
  assert.ok(asked("Haberhasher", "second").every((f) => "+-#".includes(f.op)));
}
console.log("✓ new monsters' traits");
