// Tests for js/achievements.js (DESIGN.md §14): the catalog, awarding, the rewards and what the
// cards say. Run by `npm run check`, or alone: node scripts/achievements.test.mjs
import assert from "node:assert/strict";
import { catalog, award, MASTERY, rewardOf, rewardsOf, spokenLines, cardLines, freshAchievements, unseen, megasNeeded, ACHIEVEMENT_IDS, achievementOf, NEW_LINE, SECRET_LINE,
  TRACKS, trackCounts, isComeback, dayNumber, keepDays, notePracticeDay, DAYS_KEPT, holidaysOn, hitSurprises, noteEvent, EVENT_IDS, quipHero } from "../js/achievements.js";
import { QUIPS } from "../js/moments.js";
import { fluentLimit } from "../js/progress.js";
import { pool, BANDS } from "../js/learn.js";
import { WINGS, PATHS, legendFacts } from "../js/wings.js";
import { clothesById, CLOTHES } from "../js/clothes.js";
import { ITEMS } from "../js/loot.js";
import { spokenLines as allLines, spriteFor, ALWAYS } from "../js/lines.js";

const top = (keys) => Object.fromEntries(keys.map((k) => [k, { b: 4, n: 6, c: 6, ms: 2000, t: 1 }]));
const ids = new Set(ACHIEVEMENT_IDS);
assert.equal(ids.size, ACHIEVEMENT_IDS.length, "ids are unique");

// Each mastery kind's facts: never empty, every key a real fact of some band, no key twice.
const allKeys = new Set(Object.keys(BANDS).flatMap((b) => pool(b).map((f) => f.key)));
for (const a of MASTERY) {
  assert.ok(a.sets.length >= 1, a.id);
  for (const s of a.sets) {
    assert.ok(s.length > 0, `${a.id} has an empty set`);
    assert.equal(new Set(s).size, s.length, `${a.id}: a key twice`);
    for (const k of s) assert.ok(allKeys.has(k), `${a.id}: ${k} isn't a fact`);
    assert.ok(!s.some((k) => k.startsWith("◇draw:")), `${a.id}: drawn shapes need a touch screen`);
  }
}
// A table holds its own table's facts: × 7 has 7 × 7 and 3 × 7, not 3 × 4 or 7 × 30.
const t7 = MASTERY.find((a) => a.id === "master:table7").sets[0];
assert.ok(t7.includes("×7,7") && t7.includes("×3,7") && t7.includes("×7,12") && !t7.includes("×3,4") && !t7.some((k) => /,[2-9]0$/.test(k)));
assert.ok(MASTERY.find((a) => a.id === "master:make10").sets[0].every((k) => { const [x, y] = k.slice(2).split(",").map(Number); return x + y === 10; }));
assert.deepEqual([...MASTERY.find((a) => a.id === "master:doubles").sets[0]].sort(), ["+6,6", "+7,7", "+8,8", "+9,9", "-12,6", "-14,7", "-16,8", "-18,9"]);
for (let n = 0; n <= 12; n++) assert.ok(ids.has("master:table" + n));

// Rewards: coins under a dollar, real items, and the special pieces only from the stratum ones,
// every special piece given by exactly one achievement.
const pieces = [];
for (const id of ACHIEVEMENT_IDS) {
  const r = rewardOf(id);
  assert.ok(r.cents >= 0 && r.cents < 100, id);
  for (const k of Object.keys(r.items)) assert.ok(ITEMS.some((i) => i.id === k), `${id}: ${k}`);
  assert.ok(r.cents || Object.keys(r.items).length, `${id} gives coins or an item`);
  if (r.piece) { assert.equal(clothesById[r.piece].tier, "special", id); pieces.push(r.piece); }
}
assert.deepEqual(pieces.sort(), CLOTHES.filter((p) => p.tier === "special").map((p) => p.id).sort());
assert.deepEqual(rewardsOf(["champion:cellar", "master:make10", "master:bonds", "master:table3", "master:table4"]), { cents: 50, items: { pie: 1, shield: 1, totem: 2 } });

// Nothing earned yet: nothing met; the stratum ones are shown ahead, the mastery ones are secret.
const none = catalog({ facts: {}, wings: {} });
assert.equal(none.length, ACHIEVEMENT_IDS.length);
assert.ok(none.every((a) => !a.met));
const AHEAD = ["champion", "legend", "grand"];
assert.ok(none.filter((a) => AHEAD.includes(a.kind)).every((a) => !a.secret && a.progress));
assert.ok(none.filter((a) => !AHEAD.includes(a.kind)).every((a) => a.secret));
assert.ok(none.filter((a) => a.kind === "track").every((a) => !a.started && a.progress));
assert.deepEqual(award({ facts: {}, wings: {} }, {}, 1), []);

// Champion: the mega boss that opens the last chapter (the Cellar has 2 chapters: 1 mega boss).
assert.equal(megasNeeded("cellar"), 1);
for (const w of WINGS) assert.ok(megasNeeded(w.id) >= 1 && megasNeeded(w.id) === Math.max(...PATHS[w.id].map((s) => s.chapter)) - 1);
let earned = {};
const wings = { cellar: { megas: 1 }, hall: { megas: 1 } };
let got = award({ facts: {}, wings }, earned, 100);
assert.deepEqual(got.map((a) => a.id), ["champion:cellar"]);
assert.equal(earned["champion:cellar"], 100);
// Awarded once: again, nothing new.
assert.deepEqual(award({ facts: {}, wings }, earned, 200), []);
assert.equal(earned["champion:cellar"], 100);
// Legend: the Legend beaten (wings.js beatLegend saves when).
wings.cellar.legend = 5;
assert.deepEqual(award({ facts: {}, wings }, earned, 300).map((a) => a.id), ["legend:cellar"]);
// The grand ones: every stratum.
const all = Object.fromEntries(WINGS.map((w) => [w.id, { megas: megasNeeded(w.id), legend: 9 }]));
assert.deepEqual(award({ facts: {}, wings: all }, earned, 400).map((a) => a.id).sort(),
  ["champion:hall", "champion:mines", "champion:tower", "grand:champion", "grand:legend", "legend:hall", "legend:mines", "legend:tower"]);
// The Legend's progress: the share of its facts mastered.
const halfCellar = legendFacts(WINGS[0]).slice(0, Math.floor(legendFacts(WINGS[0]).length / 2)).map((f) => f.key);
assert.match(catalog({ facts: top(halfCellar), wings: {} }).find((a) => a.id === "legend:cellar").progress, /^(49|50)% of its facts mastered$/);

// Mastery: every fact of the kind at box 4; box 3 isn't enough. Any one stratum's strand counts.
const make10 = MASTERY.find((a) => a.id === "master:make10").sets[0];
earned = {};
const facts = top(make10);
facts[make10[0]].b = 3;
assert.deepEqual(award({ facts, wings: {} }, earned, 1), []);
facts[make10[0]].b = 4;
got = award({ facts, wings: {} }, earned, 2);
assert.deepEqual(got.map((a) => a.id), ["master:make10"]);
assert.ok(got[0].secret);
// Never taken away: a miss sends a fact back to box 0, and it stays earned.
facts[make10[0]].b = 0;
assert.deepEqual(award({ facts, wings: {} }, earned, 3), []);
assert.equal(earned["master:make10"], 2);
const timeT = MASTERY.find((a) => a.id === "master:time").sets[2];
assert.deepEqual(award({ facts: top(timeT), wings: {} }, {}, 1).map((a) => a.id), ["master:time", "fluent:25"], "and 80 clocks known by heart");

// Saved data, cleaned: unknown ids and seen ones never earned are dropped; unseen in catalog order.
const ach = freshAchievements({ earned: { "master:make10": 5, "champion:cellar": 7, "nope": 3, "master:bonds": "x" }, seen: ["master:make10", "legend:hall"], days: [9, 3, 9, "x"], comebacks: -2 });
assert.deepEqual(ach, { earned: { "master:make10": 5, "champion:cellar": 7 }, seen: ["master:make10"], days: [3, 9], comebacks: 0 });
assert.deepEqual(freshAchievements(null), { earned: {}, seen: [], days: [], comebacks: 0 });
ach.earned["master:bonds"] = 9;
assert.deepEqual(unseen(ach), ["champion:cellar", "master:bonds"]);

/* ---------- the learning tracks (§14.4) ---------- */
assert.deepEqual(Object.fromEntries(Object.entries(TRACKS).map(([k, t]) => [k, t.tiers.map((x) => x[0])])),
  { fluent: [25, 100, 250, 500, 1000], comeback: [1, 5, 10, 25, 50], days: [1, 3, 7, 14, 30, 60, 100], deep: [10, 25, 50, 100] });
// Fluent: counted from the records, learned and quick on average; slow, hinted-only or skipped
// facts (no time) don't count.
const keys30 = pool("kinder").slice(0, 30).map((f) => f.key);
const fluentFacts = Object.fromEntries(keys30.map((k, i) => [k, { b: i < 26 ? 3 : 2, n: 3, c: 3, ms: i === 0 ? fluentLimit(k) + 1 : 1500, t: 1 }]));
fluentFacts[keys30[1]].ms = 0; // placed by skipping ahead: never timed
assert.equal(trackCounts({ facts: fluentFacts }).fluent, 24);
assert.deepEqual(award({ facts: fluentFacts, wings: {} }, {}, 1).map((a) => a.id), []);
fluentFacts[keys30[26]].b = 3;
assert.deepEqual(award({ facts: fluentFacts, wings: {} }, {}, 1).map((a) => a.id), ["fluent:25"]);
// The next tier shows its count once started: "Facts known by heart: 25 of 100".
const fl100 = catalog({ facts: fluentFacts, wings: {} }).find((a) => a.id === "fluent:100");
assert.ok(fl100.secret && fl100.started && !fl100.met);
assert.equal(fl100.progress, "Facts known by heart: 25 of 100");
// Comebacks: a fact at box 0 after a miss, right without a hint.
assert.ok(isComeback({ b: 0, n: 2, c: 1 }, true, false));
assert.ok(!isComeback({ b: 0, n: 2, c: 1 }, true, true), "hinted");
assert.ok(!isComeback({ b: 0, n: 2, c: 1 }, false, false), "wrong again");
assert.ok(!isComeback({ b: 1, n: 3, c: 2 }, true, false), "already back up");
assert.ok(!isComeback(undefined, true, false) && !isComeback({ b: 0, n: 1, c: 1 }, true, false), "new, or never missed");
const cb = catalog({ ach: { comebacks: 12 } });
assert.deepEqual(cb.filter((a) => a.track === "comeback" && a.met).map((a) => a.id), ["comeback:1", "comeback:5", "comeback:10"]);
assert.equal(cb.find((a) => a.id === "comeback:25").progress, "Comebacks: 12 of 25");
// Practice days: local dates, each once, never a streak; the earliest hundred kept.
const t0 = new Date(2026, 10, 27, 9).getTime();
assert.equal(dayNumber(t0), dayNumber(new Date(2026, 10, 27, 23, 59).getTime()));
assert.equal(dayNumber(new Date(2026, 10, 28, 0, 1).getTime()) - dayNumber(t0), 1);
const days = freshAchievements({});
assert.ok(notePracticeDay(days, t0)); assert.ok(!notePracticeDay(days, t0 + 3600000));
assert.ok(notePracticeDay(days, t0 + 9 * 864e5)); // days apart still count
assert.equal(catalog({ ach: days }).filter((a) => a.track === "days" && a.met).length, 1);
assert.deepEqual(keepDays([5, 3], [3, 1]), [1, 3, 5]);
assert.equal(keepDays(Array.from({ length: 150 }, (_, i) => 150 - i)).length, DAYS_KEPT);
assert.ok(catalog({ ach: { days: keepDays(Array.from({ length: 100 }, (_, i) => i + 1)) } }).find((a) => a.id === "days:100").met);
// Deep Delver (the depth track): the deepest depth opened anywhere.
assert.deepEqual(catalog({ wings: { cellar: { depth: 4 }, hall: { depth: 26 } } }).filter((a) => a.track === "deep" && a.met).map((a) => a.id), ["deep:10", "deep:25"]);

/* ---------- the surprises (§14.5) ---------- */
const hit = (o) => hitSurprises(Object.assign({ ans: 7, typed: "7", dmg: 7, hpLeft: 5, team: [2] }, o));
assert.deepEqual(hit({}), []);
assert.deepEqual(hit({ hpLeft: 0 }), ["surprise:zero"]);
assert.deepEqual(hit({ hpLeft: -3 }), [], "overkill isn't exactly zero");
assert.deepEqual(hit({ ans: 44, typed: "44" }), ["surprise:palindrome"]);
assert.deepEqual(hit({ ans: 121, typed: "121" }), ["surprise:palindrome"]);
assert.deepEqual(hit({ ans: 7, typed: "7" }), [], "one digit isn't a palindrome");
assert.deepEqual(hit({ ans: null, typed: "44" }), [], "a comparison or a time isn't typed as a number");
assert.deepEqual(hit({ dmg: 100 }), ["surprise:triple"]);
assert.deepEqual(hit({ ans: 55, typed: "55", team: [5] }), ["surprise:palindrome", "surprise:double"]);
assert.deepEqual(hit({ ans: 505, typed: "505", team: [5] }), ["surprise:palindrome", "surprise:double"], "505: two 5s, but 0 isn't on the team");
assert.deepEqual(hit({ ans: 505, typed: "505", team: [5, 0] }), ["surprise:palindrome", "surprise:double", "surprise:allhands"]);
assert.deepEqual(hit({ ans: 25, typed: "25", team: [2, 5] }), [], "two heroes, not two of one");
assert.deepEqual(hit({ ans: 123, typed: "123", team: [1, 2, 3] }), ["surprise:allhands"]);
assert.deepEqual(hit({ ans: 12, typed: "12", team: [1, 2] }), [], "All Hands needs three digits");
// Recorded straight into earned, once; only the ones seen in play.
const ev = {};
assert.ok(noteEvent(ev, "surprise:zero", 5)); assert.ok(!noteEvent(ev, "surprise:zero", 9)); assert.equal(ev["surprise:zero"], 5);
assert.ok(!noteEvent(ev, "surprise:piggy", 5) && !noteEvent(ev, "fluent:25", 5), "worked out from the state, not noted");
assert.ok(catalog({ ach: { earned: ev } }).find((a) => a.id === "surprise:zero").met);
for (const id of ["surprise:zero", "surprise:palindrome", "surprise:triple", "surprise:double", "surprise:allhands", "surprise:seven", "surprise:iceboss", "surprise:lastheart", "surprise:exact", "holiday:thanksgiving", "holiday:winter", "holiday:summer"])
  assert.ok(EVENT_IDS.includes(id), id);
// Piggy Bank and Every Quip from the state.
assert.deepEqual(award({ wallet: 99 }, {}, 1), []);
assert.deepEqual(award({ wallet: 100 }, {}, 1).map((a) => a.id), ["surprise:piggy"]);
assert.equal(quipHero({ moments: { heard: { 7: QUIPS[7].slice(0, 2) } } }), null);
const allSeven = { moments: { heard: { 7: QUIPS[7].slice() } } };
assert.equal(quipHero(allSeven), 7);
assert.deepEqual(award(allSeven, {}, 1).map((a) => a.id), ["surprise:quips"]);
assert.deepEqual(catalog(allSeven).find((a) => a.id === "surprise:quips").figure, { hero: 7 });
// The holidays, Sound Box's dates: Thanksgiving weekend (2026: Thursday Nov 26 to Sunday Nov 29),
// winter break, summer.
assert.deepEqual(holidaysOn(new Date(2026, 10, 25)), []);
assert.deepEqual(holidaysOn(new Date(2026, 10, 26)), ["holiday:thanksgiving"]);
assert.deepEqual(holidaysOn(new Date(2026, 10, 29)), ["holiday:thanksgiving"]);
assert.deepEqual(holidaysOn(new Date(2026, 10, 30)), []);
assert.deepEqual(holidaysOn(new Date(2025, 10, 27)), ["holiday:thanksgiving"]);
assert.deepEqual(holidaysOn(new Date(2026, 11, 24)), ["holiday:winter"]);
assert.deepEqual(holidaysOn(new Date(2027, 0, 1)), ["holiday:winter"]);
assert.deepEqual(holidaysOn(new Date(2027, 0, 2)), []);
assert.deepEqual(holidaysOn(new Date(2027, 5, 1)), ["holiday:summer"]);
assert.deepEqual(holidaysOn(new Date(2027, 7, 15)), []);
// Rewards for the tracks and surprises are items, never coins (a kindergartner may not have met
// money, and coins paid mid-shop would upset the purse laid out for the visit).
for (const a of none.filter((x) => x.kind === "track" || x.kind === "surprise")) assert.ok(!rewardOf(a.id).cents && Object.keys(rewardOf(a.id).items).length, a.id);
// The rewards are fixed forever (merge.js pays from them): a change here is a change to every
// linked player's wallet.
assert.deepEqual(rewardsOf(none.filter((x) => x.kind === "track").map((a) => a.id)).items, { pie: 8, shield: 9, totem: 9, magnet: 9 });
assert.deepEqual(rewardsOf(none.filter((x) => x.kind === "surprise").map((a) => a.id)).items, { pie: 3, shield: 5, totem: 3, magnet: 3 });

// What the cards say: "New achievement!" (or "Secret achievement!"), the title, what it took and
// the reward, each line short enough for a kindergartner, recorded, in the "achievements" sprite,
// which is always loaded.
const words = (t) => t.split(/\s+/).length;
const recorded = new Map(allLines().map((l) => [l.text, l]));
for (const t of spokenLines()) {
  assert.ok(words(t) <= 12, `too long to say to a kindergartner: ${t}`);
  const l = recorded.get(t);
  assert.ok(l && l.group === "Achievements" && spriteFor(l) === "achievements", `${t} isn't recorded with the achievements`);
}
assert.ok(ALWAYS.includes("achievements"));
const said = new Set(spokenLines());
for (const a of catalog({ facts: {}, wings: all })) {
  const lines = cardLines(a);
  assert.equal(lines[0], a.secret ? SECRET_LINE : NEW_LINE);
  assert.ok(lines.length >= 4, `${a.id}: kicker, title, what it took, the reward`);
  assert.equal(lines[0], AHEAD.includes(a.kind) ? NEW_LINE : SECRET_LINE);
  for (const t of lines) assert.ok(said.has(t), `${a.id}: "${t}" isn't recorded`);
  assert.ok(achievementOf(a.id));
}
assert.deepEqual(cardLines(catalog({ facts: {}, wings: {} }).find((a) => a.id === "champion:cellar")),
  ["New achievement!", "Counting Cellar Champion!", "You beat its mightiest mega boss!", "You got a champion badge!", "You got fifty cents!"]);
assert.deepEqual(cardLines(catalog({ facts: {}, wings: {} }).find((a) => a.id === "master:table7")),
  ["Secret achievement!", "Table Master: the sevens!", "Every times seven fact, mastered.", "You got a Times Two Totem!"]);
assert.deepEqual(cardLines(catalog({}).find((a) => a.id === "fluent:250")),
  ["Secret achievement!", "Thunderclap!", "Two hundred fifty facts, known by heart!", "You got a Times Two Totem!"]);
assert.deepEqual(cardLines(catalog({}).find((a) => a.id === "days:100")),
  ["Secret achievement!", "Dungeon Royalty!", "One hundred days of practice!", "You got one of every item!"]);
// Numbers are said as words.
assert.ok(spokenLines().every((t) => !/\d/.test(t)), "numbers in achievement lines are words");

console.log(`✓ achievements (${ACHIEVEMENT_IDS.length})`);

// Quip Fan (one hero's quips) and Every Quip (all ten heroes', counting up).
{
  const { QUIPS } = await import("../js/moments.js");
  const heard = Object.fromEntries(Object.entries(QUIPS).map(([d, qs]) => [d, qs.map((_, i) => i)]));
  const one = { moments: { heard: { 7: heard[7] } } }, all = { moments: { heard } };
  const c1 = catalog(one), c10 = catalog(all);
  assert.equal(c1.find((a) => a.id === "surprise:quips").title, "Quip Fan");
  const e1 = c1.find((a) => a.id === "surprise:allquips");
  assert.ok(!e1.met && e1.started && e1.have === 1 && /1 of 10/.test(e1.progress), JSON.stringify(e1));
  assert.ok(c10.find((a) => a.id === "surprise:allquips").met);
}
