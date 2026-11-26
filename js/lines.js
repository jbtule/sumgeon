// Every line the game says, in one place: app.js takes its words from here, and the audio
// build (scripts/audio/build.mjs) records exactly these. No DOM, runs in Node.
// Kinds: "p" phrase, "m" monster line, "q" problem, "h" a hero's quip, said in its own voice
// (see speech.js).
import { MON, allLooks } from "./monsters.js";
import { HEROES } from "./heroes.js";
import { WINGS, cursedMonster } from "./wings.js";
import { facts, spokenProblem, spokenFact, spoken } from "./problems.js";
import { missingOf, spokenMissing, canHide } from "./missing.js";
import { coinFacts } from "./coins.js";
import { twoDigitFacts } from "./twodigit.js";
import { balanceFacts, moreFacts, moreFact } from "./balance.js";
import { timesTens, fractionFacts, roundFacts, rectFacts } from "./third.js";
import { threeFacts } from "./three.js";
import { arrayFacts } from "./arrays.js";
import { traitOf } from "./traits.js";
import { QUIPS, FINALS, CRIT, TEAM_LINES, TEAM_NUMBERS, CAPTAIN_LINES, captainNames } from "./moments.js";

export var PHRASE = {
  enter: "Now entering the Sumgeon!",
  // Instructions for a player who can't read yet (app.js says each where it's needed, and the
  // ones that explain only the first time or first few: app.js `once`). Short and kid-simple.
  hitHow: "Tap your answer, then tap Hit!",
  pickGrade: "What grade are you in?",
  pickHero: "Pick your hero!",
  heroFirst: "Tap a hero first!",
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
  [/\bBon appe-eight!/g, "Bon appa-eight!"],
  // Margot-Rythm rhymes with "algorithm": MAR-go-rith-um, the t silent, and so is plain "Margot"
  // in its looks' names (Glitchy Margot).
  [/\bMargot-Rythm\b/g, "Margo-rithm"], [/\bMargot\b/g, "Margo"],
  // Kokoro reads "Triceraplus" as try-ser-AP-lus; "Tricera-plus" keeps the plus (TRY-ser-uh-plus),
  // and its look Triceracool is "Tricera-cool" the same way.
  [/\bTriceraplus\b/g, "Tricera-plus"], [/\bTriceracool\b/g, "Tricera-cool"]];
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
  "Flip": "Watch out! Judo Judy flips your problem. Same answer!",
  "Stripes": "Lots of fives and tens!",
  "Ten Smash": "Ten or more smashes for double!",
  "Second wind": "Halfway down, this boss puts on armor!",
  "Hundred Legs": "A hundred or more hits double!",
  "Flash": "Count the dots on the dice!",
  "Doubles": "Doubles! Look for two of the same.",
  "Three horns": "Three numbers! Find two that make ten.",
  "Carry the One": "If you have to regroup, you hit double!",
  "Arrays": "Count the rows! Every row is the same.",
  "Halves": "Fractions! Find the one that's the same size."
};
export function luckyLine(d) { return "Answers with " + aDigit(d) + " hit double!"; }
// The line for monster m's trait, or null (Plusquito has none).
export function traitLine(m) {
  var t = traitOf(m);
  if (!t) return null;
  return m.cursed != null ? luckyLine(m.cursed) : TRAIT_LINE[t.name];
}
// What the voice says to ask a problem: "three plus what is seven" for a missing number, or the
// problem itself (problems.js spokenProblem).
export function askLine(p) { return p.fact ? spokenMissing(p) : spokenProblem(p); }
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
// The groups the listen check (review/listen/) plays lines in.
export var GROUPS = ["Phrases", "Monsters & heroes", "Add & subtract", "Times & divide", "Missing numbers", "Which is more", "Coins", "Two-digit", "Balance Hall", "Three numbers", "Arrays", "Fractions", "Rounding", "Area & perimeter", "Hero quips", "Team-ups", "Captain lines"];

// [{ kind, text, group, sprite? }], each once.
export function spokenLines() {
  var out = [];
  function add(kind, text, group, sprite) { var l = { kind: kind, text: text, group: group }; if (sprite) l.sprite = sprite; out.push(l); }
  Object.keys(PHRASE).forEach(function (k) { add("p", PHRASE[k], "Phrases"); });
  // The monster and hero lines also go in one audio sprite, "names" (scripts/audio/build.mjs).
  var S = "names", N = "Monsters & heroes";
  MON.concat(allLooks()).forEach(function (m) {
    add("m", monsterName(m), N, S);
    add("p", monsterCleared(m), N, S); // a boss's is said on the win, before the stratum cleared
    add("p", monsterWon(m), N, S);
  });
  HEROES.forEach(function (h) {
    add("m", heroName(h), N, S);
    add("m", monsterName(cursedMonster(h.d)), N, S);
    add("p", heroJoins(h), N, S);
    add("p", heroCursed(h), N, S);
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
    // Missing-number problems (Quizard): "three plus what is seven", hiding either number. Not
    // for a zero in × or ÷ (0 × □ = 0 has every answer).
    if (!canHide(f)) return;
    add("q", spokenMissing(missingOf(f, "x")), "Missing numbers");
    add("q", spokenMissing(missingOf(f, "y")), "Missing numbers");
  });
  // × tens (3rd grade): "four times thirty", either order.
  timesTens().forEach(function (f) {
    [f, { op: "×", x: f.y, y: f.x, ans: f.ans }].forEach(function (g) { add("q", spokenProblem(g), "Times & divide"); add("q", spokenFact(g), "Times & divide"); });
  });
  // Which is more (K): "Which is more, seven or four?", either order, and "Seven is more than four."
  moreFacts().forEach(function (f) {
    [f, moreFact(f.y, f.x)].forEach(function (g) { add("q", spokenProblem(g), "Which is more"); add("q", spokenFact(g), "Which is more"); });
  });
  // 1st grade's three numbers (Triceraplus), 2nd grade's arrays (Squaresquatch), and 3rd grade's
  // fractions, rounding, and area and perimeter.
  [[threeFacts, "Three numbers"], [arrayFacts, "Arrays"], [fractionFacts, "Fractions"], [roundFacts, "Rounding"], [rectFacts, "Area & perimeter"]].forEach(function (set) {
    set[0]().forEach(function (f) { add("q", spokenProblem(f), set[1]); add("q", spokenFact(f), set[1]); });
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
  // Team-ups (two heroes at once): the general lines, and the lines for their own numbers.
  TEAM_LINES.concat(Object.values(TEAM_NUMBERS)).forEach((q) => add("h", quipLine(q), "Team-ups"));
  // Captain lines, in the quip voice: the shared ones (in fights, moments.js), then each
  // hero's four name lines, said on picking a captain ("Captain Toodini, reporting for duty!").
  CAPTAIN_LINES.forEach((q) => add("h", quipLine(q), "Captain lines"));
  HEROES.forEach((h) => captainNames(h.d).forEach((q) => add("h", quipLine(q), "Captain lines")));
  var seen = {};
  return out.filter(function (l) { var k = l.kind + ":" + l.text; if (seen[k]) return false; seen[k] = true; return true; });
}

