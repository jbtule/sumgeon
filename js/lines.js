// Every line the game says, in one place: app.js takes its words from here, and the audio
// build (scripts/audio/build.mjs) records exactly these. No DOM, runs in Node.
// Kinds: "p" phrase, "m" monster line, "q" problem, "h" a hero's quip, said in its own voice
// (see speech.js).
import { MON, allLooks } from "./monsters.js";
import { HEROES } from "./heroes.js";
import { WINGS, cursedMonster } from "./wings.js";
import { facts, spokenProblem, spokenFact, spoken } from "./problems.js";
import { missingOf, spokenMissing } from "./missing.js";
import { coinFacts } from "./coins.js";
import { twoDigitFacts } from "./twodigit.js";
import { balanceFacts } from "./balance.js";
import { traitOf } from "./traits.js";
import { QUIPS, FINALS, CRIT } from "./moments.js";

export var PHRASE = {
  enter: "Now entering the Sumgeon!",
  // Instructions for a player who can't read yet (app.js says each where it's needed, and the
  // ones that explain only the first time or first few: app.js `once`). Short and kid-simple.
  hitHow: "Tap your answer, then tap Hit!",
  pickHero: "Pick your hero!",
  heroFirst: "Tap a hero first!",
  goIn: "Tap Enter to go in!",
  cmpHow: "Tap the sign whose mouth opens to the greater side!",
  cmpSame: "Both sides the same? Tap equal!",
  spellHow: "Draw your answer with your finger, then tap Cast!",
  spellAgain: "Try again!",
  spellPad: "Use the numbers this time.",
  deeper: "Go deeper for tougher monsters, or play again!",
  paused: "Paused. Tap the big button to keep fighting.",
  exitSure: "Tap again to leave the dungeon.",
  // Events: a charged problem (Minustaur), a miss on one, the curse's cracks, a floor cleared.
  charged: "Lightning problem!",
  chargedMiss: "Lightning! You lost two hearts.",
  crackTwo: "Two more to go!",
  heart: "You found a heart!",
  nextBoss: "Next: the boss!",
  boss: "Boss floor!",
  crits: "Critical hits!",
  oops: "Oops!",
  crack: "The curse is cracking!",
  skip: "You already know these. Skipping ahead!",
  unlocked: "New stratum unlocked!",
  spell: "Cast a spell!",
  spellFail: "Incantation failed!",
  win: "You cleared the Sumgeon!"
};
// Names spelled the way the voice should say them. The screen keeps the real spelling.
//   "Twodini" (a Houdini pun) is too-DEE-nee; Kokoro reads it TOO-dih-nee, and "Toodini" comes
//   out right (checked with its espeak phonemes).
//   "Jr." and "Mr." are said in full, not letter by letter.
//   "Plusington" (Kokoro: PLOOS-ington) is "Plussington"; "Chompette" (chum-PET) is
//   "Chomp-ette"; "Nine-ja" (nine-ya) is "Nine-jah".
//   Sevenstein's "Six, seven" gets pauses for its sing-song, in his monster line and his quip.
//   The quips' other names and puns read right as written ("Bon appe-eight" is bahn uh-PEH-EIGHT,
//   "Zeroic" zee-ROH-ic, "Abraca-double", "Four-ward"; checked with Kokoro's espeak phonemes).
var SAY_AS = [[/\bTwodini\b/g, "Toodini"], [/\bJr\./g, "Junior"], [/\bMr\./g, "Mister"],
  [/\bPlusington\b/g, "Plussington"], [/\bChompette\b/g, "Chomp-ette"], [/\bNine-ja\b/g, "Nine-jah"],
  [/Six, seven, gone\./g, "Six... seven! Gone."], [/^Six, seven!$/g, "Six... seven!"],
  [/\bBon appe-eight!/g, "Bon appa-eight!"]];
function sayAs(t) { return SAY_AS.reduce(function (s, r) { return s.replace(r[0], r[1]); }, t); }
// A Hero Moment's quip (moments.js), as the voice says it.
export function quipLine(q) { return sayAs(q); }
export function monsterName(m) { return sayAs(m.n + "!"); }
export function monsterCleared(m) { return sayAs(m.n + " " + m.quip); }
export function monsterWon(m) { return sayAs(m.n + " won this round."); }
export function heroName(h) { return sayAs(h.n + "!"); }
export function heroJoins(h) { return sayAs(h.n + " joins your team!"); }
// Losing all your hearts curses the hero who led the run: "Oh no! Twodini was cursed! Pick a new hero."
export function heroCursed(h) { return sayAs("Oh no! " + h.n + " was cursed! Pick a new hero."); }
// What a hero does, said after their name when picked: "Your twos hit harder."
export function heroPower(h) { return "Your " + (h.d === 6 ? "sixes" : spoken(h.d) + "s") + " hit harder."; }
// "a two", "an eight".
function aDigit(d) { return (d === 8 ? "an " : "a ") + spoken(d); }
// The rescue floor, after "Cursed Twodini!": "Beat the curse to set Twodini free!"
export function heroRescue(h) { return sayAs("Beat the curse to set " + h.n + " free!"); }
// The curse's second crack (heroes.js CURSE_HITS is 3): "One more, and Twodini is free!"
export function heroAlmost(h) { return sayAs("One more, and " + h.n + " is free!"); }
// A hero freed: what they do now. "Answers with a two bring Twodini in to help!"
export function heroHelps(h) { return sayAs("Answers with " + aDigit(h.d) + " bring " + h.n + " in to help!"); }

// What each monster trait (traits.js) means, said after the monster's name the first times you
// meet it. Cursed digits (Lucky Number) say their digit: "Answers with a four hit double!"
export var TRAIT_LINE = {
  "Charge": "Watch out for lightning! A miss costs two hearts.",
  "Armor": "Armor! Answers under ten do half damage.",
  "Split": "Halfway down, this monster splits in two!",
  "Mystery": "Find the missing number!",
  "Toll": "Count the coins to pay the toll!",
  "Tens and ones": "Big numbers! Think tens and ones.",
  "Big Bite": "The bigger number is your hit!",
  "Balance": "Make both sides the same!",
  "Shapeshift": "This boss switches between compare and balance!",
  "Stripes": "Lots of fives and tens!",
  "Ten Smash": "Ten or more smashes for double!",
  "Second wind": "Halfway down, this boss puts on armor!"
};
export function luckyLine(d) { return "Answers with " + aDigit(d) + " hit double!"; }
// The line for monster m's trait, or null (Plusquito has none).
export function traitLine(m) {
  var t = traitOf(m);
  if (!t) return null;
  return m.cursed != null ? luckyLine(m.cursed) : TRAIT_LINE[t.name];
}
// One short bark when a hit does something special (app.js says at most one per hit).
export var BARK = {
  level: "New level!",
  power: "Power hit!",
  double: "Double damage!",
  half: "Half damage!",
  split: "Split in two!",
  second: "Second wind!"
};
export function wingCleared(w) { return "You cleared " + w.name + "!"; }
export function wingOpened(w) { return w.name + " is open!"; }
// A spell drawn backwards (sigil.js): "Your three is facing backwards. It faces this way." The
// screen adds an arrow. For the digits whose mirror image looks different.
export var REVERSIBLE = [1, 2, 3, 4, 5, 6, 7, 9];
export function reversedLine(d) { return "Your " + spoken(d) + " is facing backwards. It faces this way."; }
// A spell that was right but hard to read (sigil.js judge): "Here's how to write a four.", as
// the school-style digit (handwriting.js) is drawn over it. For every digit.
export function howToWriteLine(d) { return "Here's how to write " + aDigit(d) + "."; }
// "Depth two!", said as a run starts below depth 1. Recorded to depth 20.
export var DEPTH_MAX_SPOKEN = 20;
export function depthLine(d) { return "Depth " + spoken(d) + "!"; }

// [{ kind, text }], each once.
// The groups the listen check (listen/) plays lines in.
export var GROUPS = ["Phrases", "Monsters & heroes", "Add & subtract", "Times & divide", "Missing numbers", "Coins", "Two-digit", "Balance Hall", "Hero quips"];

// [{ kind, text, group, sprite? }], each once.
export function spokenLines() {
  var out = [];
  function add(kind, text, group, sprite) { var l = { kind: kind, text: text, group: group }; if (sprite) l.sprite = sprite; out.push(l); }
  Object.keys(PHRASE).forEach(function (k) { add("p", PHRASE[k], "Phrases"); });
  // The monster and hero lines also go in one audio sprite, "names" (scripts/audio/build.mjs).
  var S = "names", N = "Monsters & heroes";
  MON.concat(allLooks()).forEach(function (m) {
    add("m", monsterName(m), N, S);
    if (!m.boss) add("p", monsterCleared(m), N, S); // beating the boss is the win, said as PHRASE.win
    add("p", monsterWon(m), N, S);
  });
  HEROES.forEach(function (h) {
    add("m", heroName(h), N, S);
    add("m", monsterName(cursedMonster(h.d)), N, S);
    add("p", heroJoins(h), N, S);
    add("p", heroCursed(h), N, S);
    add("p", heroPower(h), N, S);
    add("p", heroRescue(h), N, S);
    add("p", heroAlmost(h), N, S);
    add("p", heroHelps(h), N, S);
    add("p", luckyLine(h.d), "Phrases");
  });
  Object.keys(TRAIT_LINE).forEach(function (k) { add("p", TRAIT_LINE[k], "Phrases"); });
  Object.keys(BARK).forEach(function (k) { add("p", BARK[k], "Phrases"); });
  for (var d = 2; d <= DEPTH_MAX_SPOKEN; d++) add("p", depthLine(d), "Phrases");
  REVERSIBLE.forEach(function (n) { add("p", reversedLine(n), "Phrases"); });
  for (var w = 0; w <= 9; w++) add("p", howToWriteLine(w), "Phrases");
  WINGS.forEach(function (w, i) {
    add("p", wingCleared(w), "Phrases");
    if (i) add("p", wingOpened(w), "Phrases");
  });
  facts().forEach(function (f) {
    var g = f.op === "+" || f.op === "-" ? "Add & subtract" : "Times & divide";
    add("q", spokenProblem(f), g);
    add("q", spokenFact(f), g);
    // Missing-number problems (Quizard): "three plus what is seven", hiding either number.
    add("q", spokenMissing(missingOf(f, "x")), "Missing numbers");
    add("q", spokenMissing(missingOf(f, "y")), "Missing numbers");
  });
  // Coins (Trollar): "two dimes and three pennies. How many cents?", and the answer.
  coinFacts().forEach(function (f) { add("q", spokenProblem(f), "Coins"); add("q", spokenFact(f), "Coins"); });
  // The two-digit problems (Haberhasher): "thirty-eight plus twenty-five", and "… is sixty-three".
  twoDigitFacts().forEach(function (f) {
    var fs = [f];
    if (f.op === "+" && f.x !== f.y) fs.push({ op: "+", x: f.y, y: f.x, ans: f.ans }); // either order can come up
    fs.forEach(function (g) { add("q", spokenProblem(g), "Two-digit"); add("q", spokenFact(g), "Two-digit"); });
  });
  // The Balance Hall: "Compare three plus four and eight.", "three plus four is less than eight".
  balanceFacts().forEach(function (f) { add("q", spokenProblem(f), "Balance Hall"); add("q", spokenFact(f), "Balance Hall"); });
  // Hero Moments (moments.js): every hero's quips, and the two for the big moments.
  Object.keys(QUIPS).forEach(function (d) { QUIPS[d].forEach(function (q) { add("h", quipLine(q), "Hero quips"); }); });
  FINALS.forEach((q) => add("h", quipLine(q), "Hero quips"));
  add("h", quipLine(CRIT), "Hero quips");
  var seen = {};
  return out.filter(function (l) { var k = l.kind + ":" + l.text; if (seen[k]) return false; seen[k] = true; return true; });
}

