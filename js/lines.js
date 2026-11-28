// Every line the game says, in one place: app.js takes its words from here, and the audio
// build (scripts/audio/build.mjs) records exactly these. No DOM, runs in Node.
// Kinds: "p" phrase, "m" monster line, "q" problem, "h" a hero's quip, said in its own voice
// (see speech.js).
import { MON, allLooks, bossForm } from "./monsters.js";
import { HEROES } from "./heroes.js";
import { WINGS, PATHS, cursedMonster } from "./wings.js";
import { facts, spokenProblem, spokenFact, spoken } from "./problems.js";
import { missingOf, spokenMissing, canHide } from "./missing.js";
import { coinFacts } from "./coins.js";
import { twoDigitFacts, TWO_LEVELS } from "./twodigit.js";
import { balanceFacts, moreFacts, moreFact, compare1000Facts } from "./balance.js";
import { timesTens, fractionFacts, roundFacts, rectFacts, fracCompareFacts } from "./third.js";
import { threeFacts, sumFacts } from "./three.js";
import { arrayFacts } from "./arrays.js";
import { clockFacts, TIME_LEVELS } from "./clock.js";
import { patternFacts, PATTERN_GAME_LEVELS } from "./patterns.js";
import { tfFacts } from "./truefalse.js";
import { lineFacts } from "./numberline.js";
import { pvFacts } from "./placevalue.js";
import { dollarFacts } from "./dollars.js";
import { shapeFacts, squawkLine } from "./shapes.js";
import { flashFacts, spokenFlash } from "./flash.js";
import { traitOf } from "./traits.js";
import { bigCompareFacts, roundFacts4, addSub4, times10s, timesOne, timesTwo, divideOne, remFacts, exprFacts, factorFacts, equivFacts4, fracCompare4, fracOpFacts, fracTimesFacts, decimalFacts, decCompareFacts, unitFacts, rect4Facts, primeFacts, moneyFacts } from "./fourth.js";
import { angleFacts, shapeAngleFacts } from "./angles.js";
import { FRIENDLY, CHARGE_AT, friendly } from "./charge.js";
import { QUIPS, FINALS, CRIT, TEAM_LINES, TEAM_NUMBERS, CAPTAIN_LINES, captainNames } from "./moments.js";
import { fewest, ITEMS } from "./loot.js";
import { clothesById, findable } from "./clothes.js";
import { PLUSHIES, plushById, heroOfPlush } from "./plushie.js";
import { allPrices, allTotals, MANY } from "./shop.js";
import { coinWords } from "./coins.js";
import { BANDS, pool, factOf, pathBands } from "./learn.js";
import { spokenLines as achievementLines, cardLines } from "./achievements.js";

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
  // A spell or a shape that ran off the pad and couldn't count: no heart lost, draw it again.
  drawEdge: "Try again! Stay inside the box.",
  // A whole time is typed in two slots (Tick-Tockus): the hour, then the minutes.
  nowMinutes: "Now the minutes!",
  // Bills and coins (Trollar) are typed the same way: the dollars, then the cents.
  nowCents: "Now the cents!",
  // 4th grade (the Fraction Forge) the same way: a remainder after the quotient, a mixed
  // number's numerator after its whole (fourth.js).
  nowRemainder: "Now the remainder!",
  nowNumerator: "Now the numerator!",
  // True or false (the Equal Twins): the two big keys, the first couple of times.
  tfHow: "Is it true? Tap True or False!",
  // Prime or composite (4th grade), the first couple of times.
  primeHow: "Only one rectangle? Prime! More than one? Composite!",
  // Drawing a shape (Polly-Gon), the first few times; and when a drawing can't be read twice,
  // a counting problem takes its place.
  drawHow: "Draw the shape with your finger, then tap Cast!",
  countInstead: "Let's count instead!",
  // The dot flash (Pipsqueak): the first time, before "How many dots?" is said by itself.
  flashHow: "Look quick! How many dots?",
  // A new fact's 💡 pulses after a while with nothing typed (app.js hintNudge); the first 3 times.
  hintNudge: "Stuck? Tap the light bulb!",
  // An answer typed ones first (a stacked problem, or anything on Margot-Rythm's floor), the first 3 times.
  onesFirst: "Start with the ones!",
  // Marking regrouping on stacked problems with three-digit numbers or bigger (twodigit.js markable), the first time each.
  carryHow: "Tap above a column to carry a one!",
  regroupHow: "Tap a digit to regroup it!",
  // A tap on a 0 that has nothing to give yet (regrouping goes one place at a time), the first 2 times.
  regroupEmpty: "Nothing to regroup yet. Look to the left!",
  // Pipsqueak's dice sums: read as they appear and by 🔊 (a pre-reader can't read the dots as
  // "3 + 5"); the first 2 times, how.
  diceAll: "How many dots in all?",
  diceHow: "Count the dots on both dice!",
  deeper: "Go deeper for tougher monsters, or play again!",
  paused: "Paused. Tap the big button to keep fighting.",
  // A run the app lost in the background, offered on the start screen (app.js keepGoing).
  keepGoing: "Keep going? Tap the big button!",
  exitSure: "Tap again to leave the dungeon.",
  // Events: a charged problem (Minustaur), a miss on one, the curse's cracks, a floor cleared.
  charged: "Lightning problem!",
  chargedMiss: "Lightning! You lost two hearts.",
  // Quarterjack's fourth down (every 4th problem on its floor): a right answer is a touchdown.
  fourthDown: "Fourth down!",
  // The Super Charge (charge.js): a problem whose answers run far bigger than the floor's finds
  // the monster braced; the first Super Charge ever, why (chargeLine says each one).
  braced: "The monster braces!",
  // A boss's Guard held a big hit back (app.js BOSS_GUARD), the first 2 times.
  guarded: "Guarded! A boss takes at least three hits.",
  // A monster taken from full HP to nothing in one hit, said first with an echo (app.js).
  banish: "Insta-banish!",
  chargeHow: "Small numbers get a super charge to hit big monsters!",
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
  // Chapters and mega bosses (DESIGN.md §4.3, §14.2): in the descent and as a mega boss arrives;
  // the boss powering up on the two depths before; Mega Judy's big throw (⚡ Black Belt) and a miss
  // on one; and a mega boss beaten opening the next chapter.
  megaAhead: "Mega boss ahead!",
  stronger: "I'm getting stronger!",
  bigThrow: "Big throw!",
  bigThrowMiss: "Big throw! You lost two hearts.",
  chapter: "A new chapter is open!",
  // The Legend boss (DESIGN.md §14.2): in the descent and as it arrives, and on its win card.
  legendAwaits: "A legend awaits!",
  legend: "Legend!",
  win: "You cleared the Sumgeon!"
};
// Names spelled the way the voice should say them. The screen keeps the real spelling.
//   "Twodini" (a Houdini pun) is too-DEE-nee; Kokoro reads it TOO-dih-nee, and "Toodini" comes
//   out right (checked with its espeak phonemes).
//   "Jr." and "Mr." are said in full, not letter by letter.
//   "Plusington" (Kokoro: PLOOS-ington) is "Plussington"; "Chompette" (chum-PET) is
//   "Chomp-ette"; "Nine-ja" is "Nineja" (NINE-juh, ending like "ninja"; "Nine-jah" was NINE-JAH, espeak nˈaɪndʒˈɑː, and "Nine-ja" alone nine-YAH).
//   Sevenstein's "Six, seven" gets pauses for its sing-song, in his monster line and his quip.
//   The quips' other names and puns read right as written ("Bon appe-eight" is bahn uh-PEH-EIGHT,
//   "Zeroic" zee-ROH-ic, "Abraca-double", "Four-ward"; checked with Kokoro's espeak phonemes).
var SAY_AS = [[/\bTwodini\b/g, "Toodini"], [/\bJr\./g, "Junior"], [/\bMr\./g, "Mister"],
  [/\bPlusington\b/g, "Plussington"], [/\bChompette\b/g, "Chomp-ette"], [/\bNine-ja\b/g, "Nineja"],
  [/Six, seven, gone\./g, "Six... seven! Gone."], [/^Six, seven!$/g, "Six... seven!"],
  [/\bBon appe-eight!/g, "Bon appa-eight!"],
  // Insta-banish: Kokoro says "in-STAH-banish"; "Inst a" is IN-stuh (espeak: ˈɪnst ə bˈænɪʃ).
  [/\bInsta-banish\b/g, "Inst a banish"],
  // Margot-Rythm rhymes with "algorithm": MAR-go-rith-um, the t silent, and so is plain "Margot"
  // in its looks' names (Glitchy Margot).
  [/\bMargot-Rythm\b/g, "Margo-rithm"], [/\bMargot\b/g, "Margo"],
  // Triceraplus is stressed like triceratops, try-SAIR-uh-plus. Kokoro reads "Triceraplus" as
  // try-ser-AP-lus and "Tricera-plus" as TRY-ser-uh-PLUS; "Trisaira-plus" is tɹaɪsˈeɪɹəplˈʌs (and
  // SAY-ruh and SAIR-uh sound alike in American English). Its looks Triceracool and Tricera-tot
  // the same way.
  // "bows" (bending, the bosses' and Doublet's beaten lines) is BOZE to Kokoro, as in bow and arrow;
  // "bowse" is baʊz, rhyming with cows.
  [/\bbows\b/g, "bowse"],
  [/\bTriceraplus\b/g, "Trisaira-plus"], [/\bTriceracool\b/g, "Trisaira-cool"], [/\bTricera-tot\b/g, "Trisaira-tot"],
  // The plushie Tricerafluff, the same way.
  [/\bTricerafluff\b/g, "Trisaira-fluff"]];
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
  "Halves": "Fractions! Find the one that's the same size.",
  "Tick Tock": "What time is it? Read the clock!",
  "What's Next": "What comes next? Count the pattern!",
  "Fourth Down": "Every fourth problem, a right answer scores a touchdown!",
  "On the Dot": "Answers that end in zero hit double!",
  "Leftovers": "Leftovers! The remainder hits too.",
  "Heavy Metal": "A thousand or more hits double!"
};
// A mega boss's second trait (traits.js mega), said after its name the first times you meet it.
export var TRAIT2_LINE = {
  "Make-Ten Golem": "Halfway down, this boss puts on armor!",
  "Judo Judy": "Big throws! Every fourth problem, a miss costs two hearts.",
  "The Centipede": "Halfway down, it curls up! Answers under twenty do half damage.",
  "Sigma Rex": "Watch out! It flips your times facts. Same answer!",
  "The Denominator": "Overload! Every fourth problem, a miss costs two hearts."
};
export function trait2Line(m) { return (m && m.trait2 && TRAIT2_LINE[m.base || m.n]) || null; }
// Polly-Gon's squawk before each problem (shapes.js squawkLine): "Squawk! Polly
// want a triangle!", in its monster sprite.
export function squawk(p) { return squawkLine(p); }
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
  touchdown: "Touchdown!",
  half: "Half damage!",
  split: "Split in two!",
  second: "Second wind!",
  curl: "Curled up!"
};
export function wingCleared(w) { return "You cleared " + w.name + "!"; }
// A monster arriving as its step of the path opens (DESIGN.md §4.3), said on the floor-cleared or
// end card: "A new monster appears in the Mines: Squaresquatch!" One per monster per stratum it
// arrives in, in the monster's own sprite.
var SHORT = { cellar: "the Cellar", hall: "the Hall", mines: "the Mines", tower: "the Tower", forge: "the Forge" };
export function newMonsterLine(m, w) { return sayAs("A new monster appears in " + SHORT[w.id] + ": " + (m.base || m.n) + "!"); }
// Every monster that arrives with a step, per stratum: [{ m, w }].
export function arrivals() {
  var out = [];
  WINGS.forEach(function (w) {
    var seen = {};
    PATHS[w.id].forEach(function (s) { s.monsters.forEach(function (n) { if (!seen[n]) { seen[n] = 1; out.push({ m: MON.find(function (x) { return x.n === n; }), w: w }); } }); });
  });
  return out;
}
export function wingOpened(w) { return w.name + " is open!"; }
// The stratum, said as you enter it (after "Now entering the Sumgeon!", before the depth): "The
// Balance Hall stratum!", so the word is heard. Its own clip, so the depths stay one line each.
export function wingEnter(w) { return w.name + " stratum!"; }
// A spell drawn backwards (sigil.js): "Your three is facing backwards. It faces this way." The
// screen adds an arrow. For the digits whose mirror image looks different.
export var REVERSIBLE = [1, 2, 3, 4, 5, 6, 7, 9];
export function reversedLine(d) { return "Your " + spoken(d) + " is facing backwards. It faces this way."; }
// A spell that was right but hard to read (sigil.js judge): "Here's how to write a four.", as
// the school-style digit (handwriting.js) is drawn over it. For every digit.
export function howToWriteLine(d) { return "Here's how to write " + aDigit(d) + "."; }
// "Depth two!", said as a run starts below depth 1. Recorded to depth 100, in one audio sprite
// ("depths"), so a deep run's line plays at once from memory.
export var DEPTH_MAX_SPOKEN = 100;
export function depthLine(d) { return "Depth " + spoken(d) + "!"; }
// "Super charge, times one hundred!", as a Super Charged problem appears (charge.js), the first few
// times for each N; recorded for every N a charge can be (chargeLines).
export function chargeLine(n) { return "Super charge, times " + spoken(n) + "!"; }
export function chargeLines() { var least = friendly(CHARGE_AT); return FRIENDLY.filter(function (n) { return n >= least; }); }

// The bosses' mega and Legend forms, as monsters (monsters.js bossForm): Mega-Ten Golem, Golden
// Golem, and so on. Drawn and recorded, not in the game yet (DESIGN.md §14.2).
export function bossForms() {
  return MON.filter(function (m) { return m.boss; }).flatMap(function (m) { return [bossForm(m, "mega"), bossForm(m, "legend")]; }).filter(Boolean);
}

// The groups the listen check (review/listen/) plays lines in.
// Chests, money and items (loot.js, DESIGN.md §6.3). In their own audio sprite, "loot", with the
// money found in chests (moneyLine, under a dollar).
export var LOOT = {
  chest: "A treasure chest!",
  chestHow: "Answer the lock to open it!",
  chestOpen: "The lock popped open!",
  chestJam: "The lock jammed!",
  chestAgain: "Try another lock!",
  chestShut: "Still locked. Maybe next time!",
  // After a mega boss (DESIGN.md §4.3): a big chest, with more coins or two items.
  bigChest: "A big treasure chest!",
  purseEmpty: "Your purse is empty. Open chests to find coins!",
  itemsEmpty: "No items yet. Open chests to find some!",
  itemsHow: "Tap an item to put it in a slot.",
  itemsClear: "Tap a slot to take it out.",
  heartsFull: "Your hearts are full!",
  shieldBlock: "Your shield blocked it!"
};
// Each item: its name (found, or tapped on the inventory card), what it does (the first time it's
// found or used, and on the inventory card), and what's said when it's used.
export var ITEM_LINE = {
  pie: { name: "A pie!", what: "Pie heals one heart!", use: "Yum! One heart back!" },
  shield: { name: "A shield!", what: "The shield blocks one miss!", use: "Shield up!" },
  totem: { name: "A Times Two Totem!", what: "The totem makes your next hit double!", use: "Double power!" },
  magnet: { name: "A Hero Magnet!", what: "The magnet calls a hero on your next hit!", use: "Hero Magnet on!" }
};
export function itemName(id) { return ITEM_LINE[id].name; }
export function itemWhat(id) { return ITEM_LINE[id].what; }
export function itemUse(id) { return ITEM_LINE[id].use; }
// Money, counted the fewest coins: "Two dimes and three pennies. Twenty-three cents!" (found in a
// chest, and the purse under a dollar). "pennies" is said "penny's", as in the coin problems.
function capital(t) { return t[0].toUpperCase() + t.slice(1); }
function cents(c) { return spoken(c) + (c === 1 ? " cent" : " cents"); }
export function moneyLine(c) {
  return capital(coinWords(fewest(c)).replace(/\bpennies\b/g, "penny's")) + ". " + capital(cents(c)) + "!";
}
// The purse, said aloud: the coins under a dollar (moneyLine), the total past it ("Two dollars and
// five cents!"). Recorded to PURSE_MAX_SPOKEN; more than that is said by the device voice.
export var PURSE_MAX_SPOKEN = 500;
export function purseLine(c) {
  if (c < 100) return moneyLine(c);
  var b = Math.floor(c / 100), r = c % 100;
  return capital(spoken(b)) + (b === 1 ? " dollar" : " dollars") + (r ? " and " + cents(r) : "") + "!";
}

// Clothing (clothes.js, DESIGN.md §6.3): a piece's name, said when it's found in a chest, bought,
// or tapped in the wardrobe: "A party hat!", "An eye patch!", "Bunny ears!" (no "a" for a pair).
// Only the findable pieces: the special ones come from achievements (their cards say "You got …"). In the "clothes"
// sprite.
var PAIRS = { glasses: true, sunglasses: true, starglasses: true, bunnyears: true };
// How a piece's name is said, where Kokoro says it wrong: "bandana" is ban-DAH-na to it (espeak
// bændˈɑːnə), and "bandanna", the other spelling, ban-DAN-a (bændˈænə).
var PIECE_SAY = { bandana: "Bandanna" };
function pieceWords(id) { var p = clothesById[id], n = PIECE_SAY[id] || p.name; return n[0] + n.slice(1).toLowerCase(); }
export function clothingName(id) {
  var w = pieceWords(id), low = w[0].toLowerCase() + w.slice(1);
  return PAIRS[id] ? w + "!" : (/^[aeiou]/i.test(w) ? "An " : "A ") + low + "!";
}
// Plushies (plushie.js): a plushie's name, said when it's found in a chest or tapped in the shop
// ("A Mootaur plushie!"), and whose favorite it is ("It's High Five's favorite!"). In the "loot"
// sprite; their prices are in "shop" (priceLine).
export function plushName(id) { var n = plushById[id].name; return sayAs((/^[aeiou]/i.test(n) ? "An " : "A ") + n + " plushie!"); }
export function plushFavLine(id) { var d = heroOfPlush(id); return sayAs("It's " + HEROES[d].n + "'s favorite!"); }
// Trollar's shop: what he says, in the "shop" sprite with the prices. Short, for a pre-reader.
export var SHOP = {
  hello: "Welcome to my shop!",
  hi: "Hello again! What will it be?",
  pick: "Tap something to buy it!",
  how: "Tap coins to pay Trollar!",
  need: "You need more coins. Open chests to find some!",
  enough: "That's enough! Tap Buy!",
  exact: "Exact change!",
  thanks: "Thank you! Come again!",
  inItems: "It's in your items!",
  inItemsMany: "They're in your items!",
  howMany: "How many? Tap a number!",
  putOn: "Put it on?",
  allClothes: "You have all my clothes!",
  wardrobeHow: "Tap something to put it on your captain!",
  wardrobeEmpty: "No clothes yet. Open chests or visit Trollar's shop!"
};
// "The pie costs thirty-five cents.", "The sunglasses cost a quarter." is said in cents too, so
// the number matches the tag. thing: { kind: "item" | "clothing", id }.
var ITEM_THE = { pie: "The pie", shield: "The shield", totem: "The Times Two Totem", magnet: "The Hero Magnet" };
export function priceLine(thing, c) {
  var what = thing.kind === "item" ? ITEM_THE[thing.id] : thing.kind === "plush" ? "The " + sayAs(plushById[thing.id].name) + " plushie" : "The " + pieceWords(thing.id).toLowerCase();
  return what + (thing.kind === "clothing" && PAIRS[thing.id] ? " cost " : " costs ") + cents(c) + ".";
}
// More than one item (shop.js MANY): "Three pies cost one hundred five cents.", or in dollars once
// bills are shown ("Three pies cost one dollar and five cents."), as the total is written.
var ITEM_MANY = { pie: "pies", shield: "shields", totem: "totems", magnet: "Hero Magnets" };
function amount(c, dollars) {
  if (!dollars || c < 100) return cents(c);
  var b = Math.floor(c / 100), r = c % 100;
  return spoken(b) + (b === 1 ? " dollar" : " dollars") + (r ? " and " + cents(r) : "");
}
export function manyLine(thing, n, c, dollars) {
  if (n === 1) return priceLine(thing, c);
  return capital(spoken(n)) + " " + ITEM_MANY[thing.id] + " cost " + amount(c * n, dollars) + ".";
}
// A count the purse can't pay for: the most it can ("You have enough coins for two.").
export function affordLine(n) { return "You have enough coins for " + spoken(n) + "."; }
// Change from Trollar: "Here's ten cents back!" (always under a dollar: shop.js pay).
export function changeLine(c) { return "Here's " + cents(c) + " back!"; }
// An achievement card's line k (achievements.js cardLines): "New achievement!", its title, what it
// took and its reward.
export function achievementLine(a, k) { return cardLines(a)[k]; }

// [{ kind, text }], each once.
// The groups the listen check (review/listen/) plays lines in.
export var GROUPS = ["Phrases", "Monsters & heroes", "Add & subtract", "Times & divide", "Missing numbers", "Which is more", "Coins", "Two-digit", "Three-digit", "Balance Hall", "Compare to 1000", "Three numbers", "Up to four numbers", "Arrays", "Time", "Patterns", "True or false", "Place value", "Dollars", "Number line", "Shapes", "Fractions", "Compare fractions", "Rounding", "Area & perimeter", "Dot flash", "Big numbers", "Big × and ÷", "Remainders", "Steps & factors", "Fraction work", "Decimals", "Angles & shapes", "Measurement", "Prime or composite", "Hero quips", "Team-ups", "Captain lines", "Boss forms", "Chests & items", "Money", "Shop", "Clothing", "Plushies", "Achievements"];

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
  // The bosses' mega and Legend forms: each one's name, beaten and won lines, in a small sprite
  // of their own, "bosses", since only one form comes up in a run.
  bossForms().forEach(function (m) {
    add("m", monsterName(m), "Boss forms", "bosses");
    add("p", monsterCleared(m), "Boss forms", "bosses");
    add("p", monsterWon(m), "Boss forms", "bosses");
  });
  arrivals().forEach(function (a) { add("p", newMonsterLine(a.m, a.w), N, S); });
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
  Object.keys(TRAIT2_LINE).forEach(function (k) { add("p", TRAIT2_LINE[k], "Phrases"); });
  Object.keys(BARK).forEach(function (k) { add("p", BARK[k], "Phrases"); });
  for (var d = 2; d <= DEPTH_MAX_SPOKEN; d++) add("p", depthLine(d), "Phrases", "depths");
  chargeLines().forEach(function (n) { add("p", chargeLine(n), "Phrases"); });
  REVERSIBLE.forEach(function (n) { add("p", reversedLine(n), "Phrases"); });
  for (var w = 0; w <= 9; w++) add("p", howToWriteLine(w), "Phrases");
  WINGS.forEach(function (w, i) {
    add("p", wingCleared(w), "Phrases");
    if (i) add("p", wingOpened(w), "Phrases");
    add("p", wingEnter(w), "Phrases");
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
  // Time (Tick-Tockus) and patterns (Slimelipsis), asked and answered, each in a small audio
  // sprite for its strand ("time-h", "time-m", "time-t"; "pat-k", "pat-h", "pat-m"), since a
  // fight asks them one after another. A line two strands share is in the first one's.
  var SPRITE_AT = { cellar: "k", hall: "h", mines: "m", tower: "t", forge: "f" };
  var stratumOf = function (list, set) { return list.find(function (l) { return l.id === set; }).stratum; };
  clockFacts().forEach(function (f) { var sp = "time-" + SPRITE_AT[stratumOf(TIME_LEVELS, f.set)]; add("q", spokenProblem(f), "Time", sp); add("q", spokenFact(f), "Time", sp); });
  patternFacts().forEach(function (f) { var sp = "pat-" + SPRITE_AT[stratumOf(PATTERN_GAME_LEVELS, f.set)]; add("q", spokenProblem(f), "Patterns", sp); add("q", spokenFact(f), "Patterns", sp); });
  // Batch 2: true or false and fix it (the Equal Twins), place value (Haberhasher), dollars
  // (Trollar) and the fraction number line (Halfling), asked and answered. Their sprites go by
  // band and level (spriteFor), like every problem's.
  [[tfFacts, "True or false"], [pvFacts, "Place value"], [dollarFacts, "Dollars"], [lineFacts, "Number line"]].forEach(function (set) {
    set[0]().forEach(function (f) { add("q", spokenProblem(f), set[1]); add("q", spokenFact(f), set[1]); });
  });
  // Shapes (Polly-Gon): "Draw a triangle!", "How many sides does this hexagon have?", and what the
  // shape is or how many after a miss; and its squawks, in its monster sprite ("names").
  shapeFacts().forEach(function (f) { add("q", spokenProblem(f), "Shapes"); add("q", spokenFact(f), "Shapes"); add("m", squawk(f), "Shapes", "names"); });
  // The dot flash (Pipsqueak in the Cellar): "How many dots?", and "Two and two make four."
  add("q", spokenFlash(), "Dot flash");
  flashFacts().forEach(function (f) { add("q", spokenFact(f), "Dot flash"); });
  // Coins (Trollar): "two dimes and three pennies. How many cents?", and the answer.
  coinFacts().forEach(function (f) { add("q", spokenProblem(f), "Coins"); add("q", spokenFact(f), "Coins"); });
  // The two-digit problems (Haberhasher): "thirty-eight plus twenty-five", and "… is sixty-three";
  // and adding and subtracting within 1000 (the Mines, and Margot-Rythm in the Tower).
  twoDigitFacts().forEach(function (f) {
    var fs = [f], g3 = TWO_LEVELS[f.lv].three ? "Three-digit" : "Two-digit";
    if (f.op === "+" && f.x !== f.y) fs.push({ op: "+", x: f.y, y: f.x, ans: f.ans }); // either order can come up
    fs.forEach(function (g) { add("q", spokenProblem(g), g3); add("q", spokenFact(g), g3); });
  });
  // Comparing three-digit numbers (Chompers in the Mines): "Compare three hundred forty-five and
  // three hundred fifty-four.", and adding up to four two-digit numbers (Triceraplus there).
  compare1000Facts().forEach(function (f) { add("q", spokenProblem(f), "Compare to 1000"); add("q", spokenFact(f), "Compare to 1000"); });
  // Comparing fractions (Chompers and Halfling in the Tower): "Compare three eighths and five
  // eighths.", "three eighths is less than five eighths".
  fracCompareFacts().forEach(function (f) { add("q", spokenProblem(f), "Compare fractions"); add("q", spokenFact(f), "Compare fractions"); });
  sumFacts().forEach(function (f) { add("q", spokenProblem(f), "Up to four numbers"); add("q", spokenFact(f), "Up to four numbers"); });
  // The Balance Hall: "Compare three plus four and eight.", "three plus four is less than eight".
  balanceFacts().forEach(function (f) { add("q", spokenProblem(f), "Balance Hall"); add("q", spokenFact(f), "Balance Hall"); });
  // 4th grade (the Fraction Forge, fourth.js and angles.js), asked and answered, a sum or a product
  // either way round. Their sprites go by band and level (spriteFor), like every problem's.
  var turn = function (f) { return (f.op === "+" || f.op === "×") && f.x !== f.y ? [f, { op: f.op, x: f.y, y: f.x, ans: f.ans }] : [f]; };
  [[bigCompareFacts, "Big numbers"], [roundFacts4, "Rounding"], [addSub4, "Big numbers"], [times10s, "Big × and ÷"], [timesOne, "Big × and ÷"], [timesTwo, "Big × and ÷"], [divideOne, "Big × and ÷"],
    [remFacts, "Remainders"], [exprFacts, "Steps & factors"], [factorFacts, "Steps & factors"], [equivFacts4, "Fractions"], [fracCompare4, "Compare fractions"], [fracOpFacts, "Fraction work"],
    [fracTimesFacts, "Fraction work"], [decimalFacts, "Decimals"], [decCompareFacts, "Decimals"], [angleFacts, "Angles & shapes"], [shapeAngleFacts, "Angles & shapes"], [rect4Facts, "Area & perimeter"], [unitFacts, "Measurement"], [primeFacts, "Prime or composite"], [moneyFacts, "Money"]].forEach(function (set) {
    set[0]().forEach(function (f) { turn(f).forEach(function (g) { add("q", spokenProblem(g), set[1]); add("q", spokenFact(g), set[1]); }); });
  });
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
  // Chests, money and items, in the "loot" sprite; the purse's dollar amounts as single clips.
  Object.keys(LOOT).forEach(function (k) { add("p", LOOT[k], "Chests & items", "loot"); });
  ITEMS.forEach(function (i) { [itemName, itemWhat, itemUse].forEach(function (f) { add("p", f(i.id), "Chests & items", "loot"); }); });
  for (var c = 1; c < 100; c++) add("p", moneyLine(c), "Money", "loot");
  for (c = 100; c <= PURSE_MAX_SPOKEN; c++) add("p", purseLine(c), "Money");
  // Trollar's shop, in the "shop" sprite: what he says and every price (K's and the older ones');
  // his change, 1–99¢, in "change"; clothing names in "clothes".
  Object.keys(SHOP).forEach(function (k) { add("p", SHOP[k], "Shop", "shop"); });
  allPrices().forEach(function (t) { add("p", priceLine(t, t.c), "Shop", "shop"); });
  for (c = 1; c < 100; c++) add("p", changeLine(c), "Shop", "change");
  // More than one item: each total, in cents and (past a dollar) in dollars; and the most a purse
  // can pay for.
  allTotals().forEach(function (t) { [false, true].forEach(function (d) { add("p", manyLine(t, t.n, t.c, d), "Shop", "shop"); }); });
  for (c = 1; c < MANY; c++) add("p", affordLine(c), "Shop", "shop");
  findable().forEach(function (p) { add("p", clothingName(p.id), "Clothing", "clothes"); });
  // Plushies: each one's name and whose favorite it is, in the "loot" sprite (found in a chest,
  // tapped in the shop or on the start scene's hero card).
  PLUSHIES.forEach(function (p) { add("p", plushName(p.id), "Plushies", "loot"); add("p", plushFavLine(p.id), "Plushies", "loot"); });
  // Achievement cards (achievements.js, DESIGN.md §14): "New achievement!", each one's title,
  // what it took and its reward, in their own sprite, "achievements".
  achievementLines().forEach(function (t) { add("p", t, "Achievements", "achievements"); });
  var seen = {};
  return packSprites(out.filter(function (l) { var k = l.kind + ":" + l.text; if (seen[k]) return false; seen[k] = true; return true; }));
}

/* ---------- audio sprites (DESIGN.md §12 M5) ----------
   Every line is in one small sprite: a file of related lines that speech.js decodes with Web
   Audio when it can be needed. spriteFor(line) names its sprite's family by rule, here only, so
   new lines fall in without a field of their own; a family longer than SPRITE_MAX_S is cut into
   parts ("q-third-1-mul.2"), a fact's lines kept together. A line's `sprite` field (the lines
   added with one: "names", "bosses", "depths", "loot") is where its family starts from; `file`
   is the sprite it's in. */
// About 3.5 minutes of speech a sprite: about 20 MB decoded at 24 kHz, and well under Cloudflare's
// 25 MiB a file as a 64k mp3 (about 1.7 MB). Estimated from the text: about 14 characters a
// second, and the 0.3 s gap between lines (scripts/audio/build.mjs).
export var SPRITE_MAX_S = 210, CHARS_PER_S = 14, SPRITE_GAP_S = 0.3;
export function estSeconds(text) { return text.length / CHARS_PER_S + SPRITE_GAP_S; }
// Loaded whenever the game has a voice (after the first tap), in any stratum. The purse's dollar
// amounts ("purse") and every problem and monster sprite wait for a run that needs them
// (runSprites).
export var ALWAYS = ["phrases-start", "phrases-fight", "phrases-explain", "heroes", "quips", "captains", "bosses", "loot", "money", "depths", "shop", "change", "clothes", "achievements"];
var slug = function (t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); };
var KIND = { "+": "add", "-": "sub", "×": "mul", "÷": "div", "□": "bonds", "○": "cmp", "=": "bal", "¢": "coins", "M": "more", "/": "frac", "≈": "round", "▭": "rect", "Σ": "three", "▦": "arrays", "✓": "tf", "✎": "fix", "↔": "line", "#": "pv", "$": "dollars", "◇": "shapes", "⁙": "flash", "R": "rem", "E": "steps", "F": "factors", "ƒ": "fracops", "d": "dec", "u": "units", "∠": "angles", "P": "prime", "D": "money4" };
var memo = null;
function index() {
  if (memo) return memo;
  var names = {}, phrases = {}, q = {}, uses = {};
  // A monster's lines (and its looks') in a sprite of its own, "m-minustaur", loaded by the strata
  // it's in; the heroes' (and the cursed digits') in "heroes", which every stratum can need.
  MON.concat(allLooks()).forEach(function (m) { [monsterName(m), monsterCleared(m), monsterWon(m)].forEach(function (t) { names[t] = names[t] || "m-" + slug(m.base || m.n); }); });
  arrivals().forEach(function (a) { names[newMonsterLine(a.m, a.w)] = "m-" + slug(a.m.n); });
  HEROES.forEach(function (h) { [heroName(h), monsterName(cursedMonster(h.d)), heroJoins(h), heroCursed(h), heroRescue(h), heroAlmost(h), heroHelps(h)].forEach(function (t) { names[t] = "heroes"; }); });
  // Polly-Gon's squawks are only said on its floor, so they're in its sprite.
  shapeFacts().forEach(function (f) { names[squawk(f)] = "m-polly-gon"; });
  // Phrases by when they're said: the start screen and a run's end, explanations, and the fight.
  [PHRASE.enter, PHRASE.pickGrade, PHRASE.pickHero, PHRASE.keepGoing, PHRASE.heroFirst, PHRASE.deeper, PHRASE.exitSure, PHRASE.unlocked, PHRASE.win, PHRASE.legend]
    .concat(WINGS.map(wingCleared), WINGS.map(wingOpened), WINGS.map(wingEnter)).forEach(function (t) { phrases[t] = "phrases-start"; });
  [PHRASE.hitHow, PHRASE.cmpHow, PHRASE.cmpSame, PHRASE.spellHow, PHRASE.paused, PHRASE.tfHow, PHRASE.drawHow, PHRASE.flashHow, PHRASE.hintNudge, PHRASE.diceHow, PHRASE.onesFirst, PHRASE.carryHow, PHRASE.regroupHow, PHRASE.regroupEmpty, PHRASE.chargeHow, PHRASE.guarded]
    .concat(Object.values(TRAIT_LINE), Object.values(TRAIT2_LINE), HEROES.map(function (h) { return luckyLine(h.d); }), REVERSIBLE.map(reversedLine), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(howToWriteLine))
    .forEach(function (t) { phrases[t] = "phrases-explain"; });
  // Problems: every line a band can say, found from its facts the way the game asks them (both
  // turnarounds; a number hidden for the facts that can hide one), in the first band and level
  // that has it: "q-kinder-2-add", and "q-kinder-2-add-missing" for the same facts with a number
  // hidden (asked of reviews, and all of Quizard's). uses[band][level] = the families it can say.
  Object.keys(BANDS).forEach(function (band) {
    uses[band] = [];
    pool(band).forEach(function (f) {
      var fam = "q-" + band + "-" + (f.level + 1) + "-" + (KIND[f.key[0]] || slug(f.op)), mine = uses[band][f.level] = uses[band][f.level] || {};
      problemLines(f.key).forEach(function (l) {
        var e = q[l[0]] = q[l[0]] || { family: fam + (l[1] ? "-missing" : ""), unit: band + " " + f.key };
        mine[e.family] = true;
      });
    });
  });
  return (memo = { names: names, phrases: phrases, q: q, uses: uses });
}
// The lines a fact can be said with: [text, a missing-number line?].
function problemLines(key) {
  var out = [], seen = {};
  [0, 0.9].forEach(function (r) {
    var v = factOf(key, function () { return r; });
    if (seen[v.q]) return;
    seen[v.q] = true;
    out.push([askLine(v), false], [spokenFact(v.fact || v), false]);
    if (!v.blank && "+-×÷".includes(v.op) && canHide(v)) ["x", "y"].forEach(function (b) { out.push([spokenMissing(missingOf(v, b)), true]); });
  });
  return out;
}
// The family of a line's sprite.
export function spriteFor(l) {
  var I = index();
  if (l.kind === "h") return l.group === "Captain lines" ? "captains" : "quips";
  if (l.sprite === "names") return I.names[l.text] || "names";
  if (l.sprite === "loot") return l.group === "Money" ? "money" : "loot";
  // A problem's lines go by its band and level, even when they were given a sprite name of their
  // own (batch 1's "time-h", "pat-k"…), so a run loads them with the rest of its stratum.
  if (l.kind === "q" && I.q[l.text]) return I.q[l.text].family;
  if (l.sprite) return l.sprite;
  if (l.kind === "q") return "q-" + slug(l.group);
  if (l.group === "Money") return "purse";
  if (l.group === "Phrases") return I.phrases[l.text] || "phrases-fight";
  return slug(l.group);
}
// Gives every line its `file`: its family, or a part of it when the family is too long.
function packSprites(lines) {
  var I = index(), fams = {};
  lines.forEach(function (l) {
    var f = spriteFor(l), fam = fams[f] = fams[f] || { s: 0, units: {}, order: [] };
    var u = l.kind === "q" && I.q[l.text] ? I.q[l.text].unit : l.kind + ":" + l.text;
    if (!fam.units[u]) { fam.units[u] = []; fam.order.push(u); }
    fam.units[u].push(l);
    fam.s += estSeconds(l.text);
  });
  Object.keys(fams).forEach(function (f) {
    var fam = fams[f], parts = Math.ceil(fam.s / SPRITE_MAX_S), per = fam.s / parts, part = 1, at = 0;
    fam.order.forEach(function (u) {
      var s = fam.units[u].reduce(function (a, l) { return a + estSeconds(l.text); }, 0);
      if (part < parts && at + s / 2 > per * part) part++;
      at += s;
      fam.units[u].forEach(function (l) { l.file = parts > 1 ? f + "." + part : f; });
    });
  });
  return lines;
}
// The sprite families a run in a stratum (wings.js WINGS) can need, besides ALWAYS: its monsters'
// lines and the problems of every band its path asks (wings.js PATHS: its band, its strands, and
// the earlier grades' facts it reviews). upto (optional): { band: the last level to load }, so a
// run loads the levels its chapter reaches, not a grade's every fact.
export function runSprites(wing, upto) {
  var I = index(), out = {};
  wing.pool.concat(wing.floors, [wing.boss]).forEach(function (n) { if (n !== "rescue" && n !== "pool") out["m-" + slug(n)] = true; });
  [wing.band].concat(Object.values(wing.strands || {}), pathBands(PATHS[wing.id])).forEach(function (band) {
    var top = upto && upto[band] != null ? upto[band] : Infinity;
    (I.uses[band] || []).forEach(function (fams, level) { if (fams && level <= top) Object.assign(out, fams); });
  });
  return Object.keys(out);
}
// A sprite file's family: "q-third-1-mul.2" is in "q-third-1-mul".
export function familyOf(file) { return file.replace(/\.\d+$/, ""); }

