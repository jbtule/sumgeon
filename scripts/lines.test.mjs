// Every line the game says is in the audio plan, and app.js only says lines from js/lines.js.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spokenLines, PHRASE, monsterName, monsterCleared, monsterWon, heroCursed, heroPower, heroRescue, heroAlmost, heroHelps, traitLine, TRAIT_LINE, BARK } from "../js/lines.js";
import { facts, spokenProblem, spokenFact } from "../js/problems.js";
import { MON, allLooks } from "../js/monsters.js";
import { HEROES } from "../js/heroes.js";
import { TRAITS, traitOf } from "../js/traits.js";
import { cursedMonster } from "../js/wings.js";
import { planClips } from "./audio/build.mjs";

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

// Keys are stable and unique.
const plan = planClips();
assert.equal(new Set(plan.map((c) => c.key)).size, plan.length);

// app.js says only lines from lines.js: every say() takes a PHRASE, a lines.js helper, or a problem.
const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const HELPERS = ["heroName", "heroJoins", "heroCursed", "heroPower", "heroRescue", "heroAlmost", "heroHelps", "traitLine"].join("|");
for (const [call] of app.matchAll(/say\([^)]*\)/g)) {
  assert.match(call, new RegExp(String.raw`say\("(p|m|q)", (PHRASE\.\w+|BARK\.\w+|BARK\[\w+\]|monsterName\(m\)|monsterCleared\(m\)|monsterWon\(m\)|(${HELPERS})\((HEROES\[[\w.]+\]|\w+)\)|wingCleared\(\w+(\(\))?\)|wingOpened\(\w+\)|depthLine\(G\.depth\)|reversedLine\(\w+\)|howToWriteLine\(\w+\)|spokenProblem\(G\.cur\)|spokenFact\(said\)|spokenMissing\(G\.cur\))`), `${call} says a line that isn't in js/lines.js`);
}
// Every PHRASE is said somewhere (PHRASE.win is older: a win says wingCleared instead).
for (const k of Object.keys(PHRASE).filter((k) => k !== "win")) assert.ok(app.includes("PHRASE." + k), `PHRASE.${k} is recorded but never said`);
for (const k of Object.keys(BARK)) assert.ok(app.includes(`"${k}"`) || app.includes("BARK." + k), `BARK.${k} is recorded but never said`);
console.log(`✓ lines (${plan.length} lines)`);
