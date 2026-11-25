// Every line the game says, in one place: app.js takes its words from here, and the audio
// build (scripts/audio/build.mjs) records exactly these. No DOM, runs in Node.
// Kinds: "p" phrase, "m" monster line, "q" problem (see speech.js).
import { MON, allLooks } from "./monsters.js";
import { HEROES } from "./heroes.js";
import { WINGS, cursedMonster } from "./wings.js";
import { facts, spokenProblem, spokenFact, spoken } from "./problems.js";
import { missingOf, spokenMissing } from "./missing.js";
import { coinFacts } from "./coins.js";
import { twoDigitFacts } from "./twodigit.js";
import { balanceFacts } from "./balance.js";

export var PHRASE = {
  // The menu's intro, worded for speaking ("seven times eight", not "7 × 8").
  intro: "Seven glyph monsters guard seven floors. Your answer is your attack: solve seven times eight, and you hit for fifty-six. Three right in a row, and every hit is doubled. A wrong answer costs a heart, and you see the right one.",
  enter: "Now entering the Sumgeon!",
  boss: "Boss floor!",
  crits: "Critical hits!",
  oops: "Oops!",
  win: "You cleared the Sumgeon!"
};
// Names spelled the way the voice should say them. The screen keeps the real spelling.
//   "Twodini" (a Houdini pun) is too-DEE-nee; Kokoro reads it TOO-dih-nee, and "Toodini" comes
//   out right (checked with its espeak phonemes).
//   "Jr." and "Mr." are said in full, not letter by letter.
var SAY_AS = [[/\bTwodini\b/g, "Toodini"], [/\bJr\./g, "Junior"], [/\bMr\./g, "Mister"]];
function sayAs(t) { return SAY_AS.reduce(function (s, r) { return s.replace(r[0], r[1]); }, t); }
export function monsterName(m) { return sayAs(m.n + "!"); }
export function monsterCleared(m) { return sayAs(m.n + " " + m.quip); }
export function monsterWon(m) { return sayAs(m.n + " won this round."); }
export function heroName(h) { return sayAs(h.n + "!"); }
export function heroJoins(h) { return sayAs(h.n + " joins your team!"); }
export function wingCleared(w) { return "You cleared " + w.name + "!"; }
export function wingOpened(w) { return w.name + " is open!"; }
// "Depth two!", said as a run starts below depth 1. Recorded to depth 20.
export var DEPTH_MAX_SPOKEN = 20;
export function depthLine(d) { return "Depth " + spoken(d) + "!"; }

// [{ kind, text }], each once.
// The groups the listen check (listen/) plays lines in.
export var GROUPS = ["Phrases", "Monsters & heroes", "Add & subtract", "Times & divide", "Missing numbers", "Coins", "Two-digit", "Balance Hall"];

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
  });
  for (var d = 2; d <= DEPTH_MAX_SPOKEN; d++) add("p", depthLine(d), "Phrases");
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
  var seen = {};
  return out.filter(function (l) { var k = l.kind + ":" + l.text; if (seen[k]) return false; seen[k] = true; return true; });
}

