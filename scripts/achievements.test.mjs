// Tests for js/achievements.js (DESIGN.md §14): the catalog, awarding, the rewards and what the
// cards say. Run by `npm run check`, or alone: node scripts/achievements.test.mjs
import assert from "node:assert/strict";
import { catalog, award, MASTERY, rewardOf, rewardsOf, spokenLines, cardLines, freshAchievements, unseen, megasNeeded, ACHIEVEMENT_IDS, achievementOf, NEW_LINE, SECRET_LINE } from "../js/achievements.js";
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
assert.ok(none.filter((a) => a.kind !== "mastery").every((a) => !a.secret && a.progress));
assert.ok(none.filter((a) => a.kind === "mastery").every((a) => a.secret));
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
assert.deepEqual(award({ facts: top(timeT), wings: {} }, {}, 1).map((a) => a.id), ["master:time"]);

// Saved data, cleaned: unknown ids and seen ones never earned are dropped; unseen in catalog order.
const ach = freshAchievements({ earned: { "master:make10": 5, "champion:cellar": 7, "nope": 3, "master:bonds": "x" }, seen: ["master:make10", "legend:hall"] });
assert.deepEqual(ach, { earned: { "master:make10": 5, "champion:cellar": 7 }, seen: ["master:make10"] });
assert.deepEqual(freshAchievements(null), { earned: {}, seen: [] });
ach.earned["master:bonds"] = 9;
assert.deepEqual(unseen(ach), ["champion:cellar", "master:bonds"]);

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
  for (const t of lines) assert.ok(said.has(t), `${a.id}: "${t}" isn't recorded`);
  assert.ok(achievementOf(a.id));
}
assert.deepEqual(cardLines(catalog({ facts: {}, wings: {} }).find((a) => a.id === "champion:cellar")),
  ["New achievement!", "Counting Cellar Champion!", "You beat its mightiest mega boss!", "You got a champion badge!", "You got fifty cents!"]);
assert.deepEqual(cardLines(catalog({ facts: {}, wings: {} }).find((a) => a.id === "master:table7")),
  ["Secret achievement!", "Table Master: the sevens!", "Every times seven fact, mastered.", "You got a Times Two Totem!"]);
// Numbers are said as words.
assert.ok(spokenLines().every((t) => !/\d/.test(t)), "numbers in achievement lines are words");

console.log(`✓ achievements (${ACHIEVEMENT_IDS.length})`);
