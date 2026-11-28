// Every line the game says is in the audio plan, and app.js only says lines from js/lines.js.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spokenLines, PHRASE, monsterName, monsterCleared, monsterWon, heroCursed, heroRescue, heroAlmost, heroHelps, traitLine, TRAIT_LINE, BARK } from "../js/lines.js";
import { facts, spokenProblem, spokenFact } from "../js/problems.js";
import { MON, allLooks } from "../js/monsters.js";
import { HEROES } from "../js/heroes.js";
import { TRAITS, traitOf } from "../js/traits.js";
import { cursedMonster } from "../js/wings.js";
import { planClips, keyFor } from "./audio/build.mjs";
import { GROUPS, quipLine } from "../js/lines.js";
import { QUIPS, FINAL, FINALS, CRIT, TEAM_LINES, TEAM_NUMBERS, CAPTAIN_LINES, captainNames } from "../js/moments.js";
import { createHash } from "node:crypto";
import { flipOf } from "../js/traits.js";
import { pool, factOf } from "../js/learn.js";
import { LOOT, itemName, itemWhat, itemUse, moneyLine, purseLine, PURSE_MAX_SPOKEN } from "../js/lines.js";
import { ITEMS, MONEY, moneyFor } from "../js/loot.js";
const app0 = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");

const ids = new Set(spokenLines().map((l) => l.kind + ":" + l.text));
for (const t of Object.values(PHRASE)) assert.ok(ids.has("p:" + t), t);
for (const m of MON) {
  assert.ok(ids.has("m:" + monsterName(m)));
  assert.ok(ids.has("p:" + monsterWon(m)));
  if (!m.boss) assert.ok(ids.has("p:" + monsterCleared(m)));
}
const fs = facts();
assert.equal(fs.length, 713, "within 20, the zero facts, and the 0–12 tables");
for (const f of fs) { assert.ok(ids.has("q:" + spokenProblem(f))); assert.ok(ids.has("q:" + spokenFact(f))); }
assert.ok(ids.has("q:seven plus eight is fifteen"));
assert.ok(ids.has("q:three plus what is seven") && ids.has("q:what times four is twenty"), "missing-number problems are recorded");
assert.ok(!Object.values(PHRASE).some((t) => /[×÷<>=□]/.test(t)), "spoken text has no symbols the voice would misread");

// Instructions for a pre-reader: every phrase and hero line is short (about 12 words at most).
const words = (t) => t.split(/\s+/).length;
for (const t of Object.values(PHRASE)) assert.ok(words(t) <= 12, `too long to say to a kindergartner: ${t}`);
for (const h of HEROES) for (const t of [heroCursed(h)]) { assert.ok(ids.has("p:" + t), t); assert.ok(words(t) <= 12, t); }
assert.ok(ids.has("p:Oh no! Toodini was cursed! Pick a new hero."), "hero names are said as SAY_AS spells them");
// Per-hero lines go in the "names" sprite with the names they follow.
const names = spokenLines().filter((l) => l.sprite === "names").map((l) => l.text);
assert.ok(names.includes(heroCursed(HEROES[2])));
assert.ok(spokenLines().every((l) => l.group), "every line has a listen-check group");

// Traits, rescues and barks (DESIGN.md §3, §6.6): every trait has a short line, recorded.
for (const k of Object.keys(TRAITS)) assert.ok(TRAITS[k].name in TRAIT_LINE, `no line for ${k}'s trait`);
for (const m of MON.concat(allLooks())) {
  const t = traitLine(m);
  if (m.n === "Plusquito" || (m.base || m.n) === "Polly-Gon") assert.equal(t, null);
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
assert.ok(ids.has("m:Sir Plussington!") && ids.has("m:Chomp-ette!") && ids.has("m:Nineja!"));
assert.ok(ids.has("p:Minustaur's Mom loses her footing and her horns.") && ids.has("p:King Minus loses his footing and his horns."));
assert.ok(ids.has("p:Sevenstein comes unbolted. Six... seven! Gone."));
// After a spell that was right but hard to read, for every digit (an eight).
assert.ok(ids.has("p:Here's how to write a four.") && ids.has("p:Here's how to write an eight.") && ids.has("p:Here's how to write a zero."));

// Hero Moments' quips (moments.js): every one recorded as kind "h" in the quip voice, in its own
// listen-check group, with "That's your final answer!" and "Critical math!".
for (const d of Object.keys(QUIPS)) for (const q of QUIPS[d]) assert.ok(ids.has("h:" + quipLine(q)), q);
assert.ok(ids.has("h:" + FINAL) && ids.has("h:" + CRIT) && ids.has("h:That's your final answer!") && ids.has("h:Critical math!"));
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
// Captain lines (said on picking a captain): the five shared ones and each hero's four name
// lines, in Bella, in their own group. "Follow the leader!" was cut.
const captainLines = CAPTAIN_LINES.concat(HEROES.flatMap((h) => captainNames(h.d)));
assert.deepEqual([CAPTAIN_LINES.length, captainLines.length], [5, 45]);
for (const q of captainLines) assert.ok(ids.has("h:" + quipLine(q)), `captain line recorded: ${q}`);
assert.ok(ids.has("h:Captain Toodini, reporting for duty!") && ids.has("h:Make way for Captain Nineja!"), "captain names through SAY_AS");
assert.ok(![...ids].some((id) => /Follow the leader/i.test(id)), "no \"Follow the leader!\"");
const capSaid = new Set(captainLines.map(quipLine));
assert.ok(GROUPS.includes("Captain lines") && spokenLines().filter((l) => l.group === "Captain lines").every((l) => l.kind === "h" && capSaid.has(l.text)));
assert.ok(GROUPS.includes("Hero quips") && spokenLines().filter((l) => l.kind === "h" && !capSaid.has(l.text)).every((l) => l.group === (teamLines.map(quipLine).includes(l.text) && !heroQuips.has(l.text) ? "Team-ups" : "Hero quips")));
for (const l of spokenLines().filter((l) => l.kind === "h")) assert.ok(words(l.text) <= 8, `a quip is quick: ${l.text}`);

// Judo Judy, the Balance Hall's boss: the name, the beaten quip (said on the win), the won line
// and the Flip trait's line, all in the names sprite but the trait line. And every problem Judy
// flips (any + in the Hall with the smaller first) is recorded flipped: it's said in that order.
{
  const judy = MON.find((m) => m.n === "Judo Judy");
  for (const t of ["Judo Judy!"]) assert.ok(ids.has("m:" + t) && names.includes(t), t);
  for (const t of ["Judo Judy taps out and bowse.", "Judo Judy won this round."]) assert.ok(ids.has("p:" + t) && names.includes(t), t);
  assert.equal(traitLine(judy), "Watch out! Judo Judy flips your problem. Same answer!");
  assert.ok(ids.has("p:" + traitLine(judy)));
  assert.ok(!ids.has("p:This boss switches between compare and balance!"), "The Unknown's trait line is retired");
  for (const m of MON.filter((x) => x.boss)) assert.ok(ids.has("p:" + monsterCleared(m)), `${m.n}'s beaten line is recorded`);
  const hall = pool("first").map((f) => factOf(f.key, () => 0.9)).filter((p) => p.op === "+");
  let thrown = 0;
  for (const p of hall) {
    const q = flipOf(judy, p);
    if (!q) continue;
    thrown++;
    assert.ok(ids.has("q:" + spokenProblem(q)) && ids.has("q:" + spokenFact(q)), `${q.q} is recorded`);
  }
  assert.ok(thrown > 50, `Judo Judy flips ${thrown} of the Hall's sums`);
}
// The new monsters (M5 step 3): name, beaten and won lines, for each and its looks, in the names
// sprite; their trait lines; Margot-Rythm said like "algorithm" (Margo-rithm), and so is Margot
// in its looks' names; and the new problems, asked and answered.
{
  for (const n of ["Pipsqueak", "Doublet", "Triceraplus", "Margot-Rythm", "Squaresquatch", "Halfling"]) {
    const m = MON.find((x) => x.n === n);
    for (const x of [m].concat(allLooks().filter((l) => l.base === n))) {
      assert.ok(names.includes(monsterName(x)) && names.includes(monsterCleared(x)) && names.includes(monsterWon(x)), x.n);
    }
    assert.ok(ids.has("p:" + traitLine(m)) && words(traitLine(m)) <= 12, traitLine(m));
  }
  assert.ok(ids.has("m:Margo-rithm!") && ids.has("p:Margo-rithm carries the one and shuts down for the night.") && ids.has("m:Glitchy Margo!"));
  assert.ok(![...ids].some((id) => /Margot/.test(id)), "no line says Margot as written");
  assert.ok(ids.has("p:Doublet bowse twice and skips away.") && ![...ids].some((id) => /\bbows\b/.test(id)), "bows, as in bending, is said bowse");
  // Said try-SAIR-uh-plus, stressed like triceratops: "Trisaira-plus" (lines.js SAY_AS).
  assert.ok(ids.has("m:Trisaira-plus!") && ids.has("m:Queen Trisaira-plus!") && ids.has("m:Trisaira-cool!") && ids.has("m:Trisaira-tot!") && ![...ids].some((id) => /Triceraplus|Triceracool|Tricera-/.test(id)), "Triceraplus keeps its plus, stressed like triceratops");
  assert.ok(ids.has("q:three plus four plus six") && ids.has("q:three plus four plus six is thirteen"), "three numbers");
  assert.ok(ids.has("q:Three rows of five. How many in all?") && ids.has("q:Three rows of five make fifteen."), "arrays");
  assert.ok(GROUPS.includes("Three numbers") && GROUPS.includes("Arrays"));
}
// Three-digit numbers (2nd grade, and 3rd grade's fluency): adding and subtracting within 1000
// (both orders of a sum), comparing them, and adding up to four two-digit numbers, asked and
// answered, each in its listen-check group.
{
  const group = (t) => spokenLines().find((l) => l.kind === "q" && l.text === t)?.group;
  for (const [t, g] of [["two hundred eighty-seven plus three hundred fifty-nine", "Three-digit"], ["three hundred fifty-nine plus two hundred eighty-seven is six hundred forty-six", "Three-digit"],
    ["four hundred three minus one hundred fifty-eight is two hundred forty-five", "Three-digit"], ["eight hundred twenty-one minus five hundred eleven", "Three-digit"],
    ["Compare four hundred thirty-six and three hundred fifty-six.", "Compare to 1000"], ["four hundred thirty-six is greater than three hundred fifty-six", "Compare to 1000"],
    ["twenty-nine plus twenty-three plus sixteen plus seventeen", "Up to four numbers"], ["twenty-nine plus twenty-three plus sixteen plus seventeen is eighty-five", "Up to four numbers"]]) {
    assert.ok(ids.has("q:" + t), t);
    assert.equal(group(t), g, t);
  }
  assert.ok(["Three-digit", "Compare to 1000", "Up to four numbers"].every((g) => GROUPS.includes(g)));
}
// Batch 1: Tick-Tockus and Slimelipsis (and their looks) in the names sprite; their trait lines;
// every time and pattern asked and answered, in small sprites by strand, in "Time" and
// "Patterns"; times said the way a teacher says them ("three oh five").
{
  for (const n of ["Tick-Tockus", "Slimelipsis"]) {
    const m = MON.find((x) => x.n === n);
    for (const x of [m].concat(allLooks().filter((l) => l.base === n))) assert.ok(names.includes(monsterName(x)) && names.includes(monsterCleared(x)) && names.includes(monsterWon(x)), x.n);
    assert.ok(ids.has("p:" + traitLine(m)) && words(traitLine(m)) <= 12, traitLine(m));
  }
  const SPR = { "time-h": "timeH", "time-m": "timeM", "time-t": "timeT", "pat-k": "patK", "pat-h": "patH", "pat-m": "patM" };
  const all = spokenLines();
  for (const [sp, band] of Object.entries(SPR)) {
    const inSprite = new Set(all.filter((l) => l.sprite === sp).map((l) => l.text));
    assert.ok(inSprite.size > 30 && inSprite.size < 130, `${sp}: ${inSprite.size} lines, a small sprite`);
    for (const f of pool(band)) {
      const p = factOf(f.key);
      for (const t of [spokenProblem(p), spokenFact(p)]) assert.ok(ids.has("q:" + t), `${f.key}: ${t}`);
    }
  }
  assert.ok(GROUPS.includes("Time") && GROUPS.includes("Patterns"));
  assert.ok(all.filter((l) => l.group === "Time" || l.group === "Patterns").every((l) => l.kind === "q" && l.sprite));
  for (const t of ["What hour is it?", "It's three o'clock.", "What time is it? Half past what?", "It's half past three.", "What time is it?", "It's three thirty.",
    "One, two, three. What comes next?", "Four comes next.", "Two, four, six, eight. What comes next?", "Ten comes next.", "How many even numbers?", "How many odd numbers?"]) assert.ok(ids.has("q:" + t), t);
  assert.ok([...ids].some((id) => /^q:\w[\w -]*, blank, [\w -]+, [\w -]+\. What's missing\?$/.test(id)), "what's missing");
  assert.ok(![...ids].some((id) => /^q:.*\b(\d|undefined|NaN)/.test(id) && /comes next|minutes|o'clock|past|even|odd/.test(id)), "numbers in time and pattern lines are words");
  assert.ok([...ids].some((id) => /^q:It's \w+ oh five\.$/.test(id)), "three oh five, as a teacher says it");
  assert.ok([...ids].some((id) => /^q:It starts at \w+ [\w-]+ and ends at \w+ [\w-]+\. How many minutes\?$/.test(id)) && [...ids].some((id) => /^q:[A-Z][\w-]+ minutes\.$/.test(id)), "how long");
  assert.ok(ids.has("p:Now the minutes!"));
}
// Keys are stable and unique.
const plan = planClips();
assert.equal(new Set(plan.map((c) => c.key)).size, plan.length);
// Quips are said in the second voice, and the voice is part of the key; every other line keeps
// af_heart and the key it had before (so nothing already recorded is recorded again).
assert.deepEqual([...new Set(plan.filter((c) => c.kind === "h").map((c) => c.voice))], ["af_bella"]);
for (const q of teamLines.concat(captainLines)) assert.equal(plan.find((c) => c.id === "h:" + quipLine(q)).voice, "af_bella", `${q} is in Bella's voice`);
assert.deepEqual([...new Set(plan.filter((c) => c.kind !== "h").map((c) => c.voice))], ["af_heart"]);
assert.notEqual(keyFor("h", "Up top!"), keyFor("p", "Up top!"));
assert.equal(keyFor("p", "Oops!"), createHash("sha256").update(JSON.stringify(["kokoro-v1.0", "af_heart", "mp3-64k", "text-v1", 0.95, "p", "Oops!"])).digest("hex").slice(0, 20), "af_heart keys are unchanged");
assert.ok(app0.includes('say("h", quipLine(mo.quip), true)'), "a quip is said in the quip voice, cutting off whatever was being said");
// Picking a captain says a name line (moments.js nameLine) in place of the plain name, then
// what the hero does, as before.
{
  const pick = app0.slice(app0.indexOf("function wireCaptain"), app0.indexOf("function wirePlayers"));
  assert.ok(/nameLine\(MS, team\.captain\)[\s\S]*say\("h", quipLine\(mo\.quip\), true(, null, PICK_FX)?\);/.test(pick) && !/heroPower|PHRASE\.goIn/.test(pick), "a pick says a captain line, and nothing after it");
  assert.ok(!pick.includes("heroName("), "the captain line replaces the spoken name");
}

// app.js says only lines from lines.js: every say() takes a PHRASE, a lines.js helper, or a problem.
const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const HELPERS = ["heroName", "heroJoins", "heroCursed", "heroRescue", "heroAlmost", "heroHelps", "traitLine", "trait2Line", "chargeLine"].join("|");
for (const [call] of app.matchAll(/say\([^)]*\)/g)) {
  assert.match(call, new RegExp(String.raw`say\("(p|m|q|h)", (quipLine\(mo\.quip\)|PHRASE\.\w+|BARK\.\w+|BARK\[\w+\]|monsterName\(m\)|monsterArrives\(m\)|monsterCleared\(m\)|monsterWon\(m\)|(${HELPERS})\((HEROES\[[\w.]+\]|\w+)\)|wingCleared\(\w+(\(\))?\)|wingOpened\(\w+\)|wingEnter\(w\)|depthLine\((G\.depth|d)\)|reversedLine\(\w+\)|howToWriteLine\(\w+\)|spokenProblem\(G\.cur\)|spokenFact\(said\)|squawk\(p\)|spokenMissing\(G\.cur\)|LOOT\.\w+|(itemName|itemWhat|itemUse)\([\w.]+\)|moneyLine\(\w+\)|purseLine\(wallet\)|askLine\(C\.p\)|SHOP\.\w+|clothingName\([\w.]+\)|(plushName|plushFavLine)\([\w.]+\)|priceLine\(t, c\)|manyLine\(t, m, c, dollars\)|affordLine\(most\)|changeLine\(r\.change\)|newMonsterLine\(m, w\)|achievementLine\(a, k\))`), `${call} says a line that isn't in js/lines.js`);
}
// Chests, money and items (DESIGN.md §6.3): every LOOT line and item line is said and recorded,
// short, in the "loot" sprite with the money found in chests; the purse is recorded to $5.
for (const k of Object.keys(LOOT)) {
  assert.ok(app.includes("LOOT." + k), `LOOT.${k} is recorded but never said`);
  assert.ok(ids.has("p:" + LOOT[k]) && words(LOOT[k]) <= 12, LOOT[k]);
}
for (const i of ITEMS) for (const t of [itemName(i.id), itemWhat(i.id), itemUse(i.id)]) assert.ok(ids.has("p:" + t) && words(t) <= 12, t);
assert.equal(moneyLine(23), "Two dimes and three penny's. Twenty-three cents!", "the fewest coins, pennies said as penny's");
assert.equal(moneyLine(1), "One penny. One cent!");
assert.equal(purseLine(77), moneyLine(77), "the purse under a dollar is the same line as money found");
assert.equal(purseLine(100), "One dollar!");
assert.equal(purseLine(205), "Two dollars and five cents!");
{
  const loot = spokenLines().filter((l) => l.sprite === "loot");
  for (let c = 1; c < 100; c++) assert.ok(loot.some((l) => l.text === moneyLine(c)), `money ${c} in the loot sprite`);
  for (const t of Object.values(LOOT)) assert.ok(loot.some((l) => l.text === t), t);
  for (let c = 100; c <= PURSE_MAX_SPOKEN; c++) assert.ok(ids.has("p:" + purseLine(c)), `purse ${c}`);
  assert.ok(GROUPS.includes("Chests & items") && GROUPS.includes("Money"));
  // Every amount a chest can hold is under a dollar, so its line is in the sprite.
  for (const w of Object.keys(MONEY)) for (const boss of [false, true]) for (const r of [0, 0.5, 0.999]) assert.ok(moneyFor(w, boss, () => r) < 100);
}
// Every PHRASE is said somewhere (PHRASE.win is older: a win says wingCleared instead).
for (const k of Object.keys(PHRASE).filter((k) => k !== "win")) assert.ok(app.includes("PHRASE." + k), `PHRASE.${k} is recorded but never said`);
for (const k of Object.keys(BARK)) assert.ok(app.includes(`"${k}"`) || app.includes("BARK." + k), `BARK.${k} is recorded but never said`);
// Hints always take a tap: nothing opens one on a timer; a new fact's 💡 only pulses, and the voice
// says so the first 3 times, from the always-loaded explanations sprite.
assert.ok(!/NEW_HINT_MS/.test(app) && !/setTimeout\([^;]*openHint\(\)/.test(app), "no hint opens by itself");
assert.ok(/once\("hintNudge", 3\)/.test(app), "the nudge's line is said the first 3 times");
assert.ok(PHRASE.hintNudge.split(/\s+/).length <= 12);
{ const l = spokenLines().find((x) => x.kind === "p" && x.text === PHRASE.hintNudge); assert.ok(l && /^phrases-explain/.test(l.file), "the nudge is in the explanations sprite"); }
console.log(`✓ lines (${plan.length} lines)`);
