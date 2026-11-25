// Every line the game says is in the audio plan, and app.js only says lines from js/lines.js.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spokenLines, PHRASE, monsterName, monsterCleared, monsterWon, heroCursed, heroPower, heroRescue, heroAlmost, heroHelps, traitLine, TRAIT_LINE, BARK } from "../js/lines.js";
import { facts, spokenProblem, spokenFact } from "../js/problems.js";
import { MON, allLooks } from "../js/monsters.js";
import { HEROES } from "../js/heroes.js";
import { TRAITS, traitOf } from "../js/traits.js";
import { cursedMonster } from "../js/wings.js";
import { planClips, keyFor } from "./audio/build.mjs";
import { GROUPS, quipLine } from "../js/lines.js";
import { QUIPS, FINAL, FINALS, CRIT, TEAM_LINES, TEAM_NUMBERS } from "../js/moments.js";
import { createHash } from "node:crypto";
const app0 = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");

const ids = new Set(spokenLines().map((l) => l.kind + ":" + l.text));
for (const t of Object.values(PHRASE)) assert.ok(ids.has("p:" + t), t);
for (const m of MON) {
  assert.ok(ids.has("m:" + monsterName(m)));
  assert.ok(ids.has("p:" + monsterWon(m)));
  if (!m.boss) assert.ok(ids.has("p:" + monsterCleared(m)));
}
const fs = facts();
assert.equal(fs.length, 633);
for (const f of fs) { assert.ok(ids.has("q:" + spokenProblem(f))); assert.ok(ids.has("q:" + spokenFact(f))); }
assert.ok(ids.has("q:seven plus eight is fifteen"));
assert.ok(ids.has("q:three plus what is seven") && ids.has("q:what times four is twenty"), "missing-number problems are recorded");
assert.ok(!Object.values(PHRASE).some((t) => /[×÷<>=□]/.test(t)), "spoken text has no symbols the voice would misread");

// Instructions for a pre-reader: every phrase and hero line is short (about 12 words at most).
const words = (t) => t.split(/\s+/).length;
for (const t of Object.values(PHRASE)) assert.ok(words(t) <= 12, `too long to say to a kindergartner: ${t}`);
for (const h of HEROES) for (const t of [heroCursed(h), heroPower(h)]) { assert.ok(ids.has("p:" + t), t); assert.ok(words(t) <= 12, t); }
assert.ok(ids.has("p:Oh no! Toodini was cursed! Pick a new hero."), "hero names are said as SAY_AS spells them");
assert.equal(heroPower(HEROES[6]), "Your sixes hit harder.");
assert.equal(heroPower(HEROES[0]), "Your zeros hit harder.");
// Per-hero lines go in the "names" sprite with the names they follow.
const names = spokenLines().filter((l) => l.sprite === "names").map((l) => l.text);
assert.ok(names.includes(heroPower(HEROES[2])) && names.includes(heroCursed(HEROES[2])));
assert.ok(spokenLines().every((l) => l.group), "every line has a listen-check group");

// Traits, rescues and barks (DESIGN.md §3, §6.6): every trait has a short line, recorded.
for (const k of Object.keys(TRAITS)) assert.ok(TRAITS[k].name in TRAIT_LINE, `no line for ${k}'s trait`);
for (const m of MON.concat(allLooks())) {
  const t = traitLine(m);
  if (m.n === "Plusquito") assert.equal(t, null);
  else if (traitOf(m)) { assert.ok(ids.has("p:" + t), t); assert.ok(words(t) <= 12, t); }
}
assert.equal(traitLine(cursedMonster(8)), "Answers with an eight hit double!");
assert.equal(traitLine(cursedMonster(4)), "Answers with a four hit double!");
for (const h of HEROES) for (const t of [heroRescue(h), heroAlmost(h), heroHelps(h), traitLine(cursedMonster(h.d))]) { assert.ok(ids.has("p:" + t), t); assert.ok(words(t) <= 12, t); }
assert.ok(names.includes(heroHelps(HEROES[2])) && ids.has("p:Answers with a two bring Toodini in to help!"));
for (const t of Object.values(BARK)) { assert.ok(ids.has("p:" + t), t); assert.ok(words(t) <= 3, `a bark is short: ${t}`); }
// Names are said the way the puns need: Twodini as "Toodini" (too-DEE-nee), Jr. as "Junior".
assert.ok(ids.has("m:Toodini!") && ids.has("m:Trollar Junior!") && ids.has("m:Mister Moneybags!"));
assert.ok(![...ids].some((id) => /Twodini|Jr\.|Mr\./.test(id)), "no line says Twodini, Jr. or Mr. as written");
assert.ok(ids.has("m:Sir Plussington!") && ids.has("m:Chomp-ette!") && ids.has("m:Nine-jah!"));
assert.ok(ids.has("p:Minustaur's Mom loses her footing and her horns.") && ids.has("p:King Minus loses his footing and his horns."));
assert.ok(ids.has("p:Sevenstein comes unbolted. Six... seven! Gone."));
// After a spell that was right but hard to read, for every digit (an eight).
assert.ok(ids.has("p:Here's how to write a four.") && ids.has("p:Here's how to write an eight.") && ids.has("p:Here's how to write a zero."));

// Hero Moments' quips (moments.js): every one recorded as kind "h" in the quip voice, in its own
// listen-check group, with "Final answer!" and "Critical math!".
for (const d of Object.keys(QUIPS)) for (const q of QUIPS[d]) assert.ok(ids.has("h:" + quipLine(q)), q);
assert.ok(ids.has("h:" + FINAL) && ids.has("h:" + CRIT) && ids.has("h:Final answer!") && ids.has("h:Critical math!"));
assert.ok(FINALS.length >= 10 && FINALS.every((q) => ids.has("h:" + quipLine(q))), "every boss-finish line is recorded");
assert.ok(ids.has("h:Six... seven!"), "Sevenstein's quip gets its pauses");
// Team-ups: every general line and every number's line, recorded as kind "h" (so in af_bella),
// in their own group.
const teamLines = TEAM_LINES.concat(Object.values(TEAM_NUMBERS));
assert.equal(teamLines.length, 16);
for (const q of teamLines) assert.ok(ids.has("h:" + quipLine(q)), `team-up line recorded: ${q}`);
assert.ok(GROUPS.includes("Team-ups") && spokenLines().filter((l) => l.group === "Team-ups").every((l) => l.kind === "h"));
// A team line that's also a hero's quip (67's "Six, seven!") is one line, one clip, in Hero quips.
const heroQuips = new Set(Object.values(QUIPS).flat().map(quipLine));
assert.ok(heroQuips.has(quipLine(TEAM_NUMBERS[67])) && spokenLines().filter((l) => l.text === "Six... seven!" && l.kind === "h").length === 1);
assert.ok(GROUPS.includes("Hero quips") && spokenLines().filter((l) => l.kind === "h").every((l) => l.group === (teamLines.map(quipLine).includes(l.text) && !heroQuips.has(l.text) ? "Team-ups" : "Hero quips")));
for (const l of spokenLines().filter((l) => l.kind === "h")) assert.ok(words(l.text) <= 8, `a quip is quick: ${l.text}`);

// Keys are stable and unique.
const plan = planClips();
assert.equal(new Set(plan.map((c) => c.key)).size, plan.length);
// Quips are said in the second voice, and the voice is part of the key; every other line keeps
// af_heart and the key it had before (so nothing already recorded is recorded again).
assert.deepEqual([...new Set(plan.filter((c) => c.kind === "h").map((c) => c.voice))], ["af_bella"]);
for (const q of teamLines) assert.equal(plan.find((c) => c.id === "h:" + quipLine(q)).voice, "af_bella", `${q} is in Bella's voice`);
assert.deepEqual([...new Set(plan.filter((c) => c.kind !== "h").map((c) => c.voice))], ["af_heart"]);
assert.notEqual(keyFor("h", "Up top!"), keyFor("p", "Up top!"));
assert.equal(keyFor("p", "Oops!"), createHash("sha256").update(JSON.stringify(["kokoro-v1.0", "af_heart", "mp3-64k", "text-v1", 0.95, "p", "Oops!"])).digest("hex").slice(0, 20), "af_heart keys are unchanged");
assert.ok(app0.includes('say("h", quipLine(mo.quip), true)'), "a quip is said in the quip voice, cutting off whatever was being said");

// app.js says only lines from lines.js: every say() takes a PHRASE, a lines.js helper, or a problem.
const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const HELPERS = ["heroName", "heroJoins", "heroCursed", "heroPower", "heroRescue", "heroAlmost", "heroHelps", "traitLine"].join("|");
for (const [call] of app.matchAll(/say\([^)]*\)/g)) {
  assert.match(call, new RegExp(String.raw`say\("(p|m|q|h)", (quipLine\(mo\.quip\)|PHRASE\.\w+|BARK\.\w+|BARK\[\w+\]|monsterName\(m\)|monsterCleared\(m\)|monsterWon\(m\)|(${HELPERS})\((HEROES\[[\w.]+\]|\w+)\)|wingCleared\(\w+(\(\))?\)|wingOpened\(\w+\)|depthLine\(G\.depth\)|reversedLine\(\w+\)|howToWriteLine\(\w+\)|spokenProblem\(G\.cur\)|spokenFact\(said\)|spokenMissing\(G\.cur\))`), `${call} says a line that isn't in js/lines.js`);
}
// Every PHRASE is said somewhere (PHRASE.win is older: a win says wingCleared instead).
for (const k of Object.keys(PHRASE).filter((k) => k !== "win")) assert.ok(app.includes("PHRASE." + k), `PHRASE.${k} is recorded but never said`);
for (const k of Object.keys(BARK)) assert.ok(app.includes(`"${k}"`) || app.includes("BARK." + k), `BARK.${k} is recorded but never said`);
console.log(`✓ lines (${plan.length} lines)`);
