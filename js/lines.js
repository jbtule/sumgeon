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
export function monsterName(m) { return m.n + "!"; }
export function monsterCleared(m) { return m.n + " " + m.quip; }
export function monsterWon(m) { return m.n + " won this round."; }
export function heroName(h) { return h.n + "!"; }
export function heroJoins(h) { return h.n + " joins your team!"; }
export function wingCleared(w) { return "You cleared " + w.name + "!"; }
export function wingOpened(w) { return w.name + " is open!"; }
// "Depth two!", said as a run starts below depth 1. Recorded to depth 20.
export var DEPTH_MAX_SPOKEN = 20;
export function depthLine(d) { return "Depth " + spoken(d) + "!"; }

// [{ kind, text }], each once.
export function spokenLines() {
  var out = [];
  Object.keys(PHRASE).forEach(function (k) { out.push({ kind: "p", text: PHRASE[k] }); });
  // The monster and hero lines also go in one audio sprite, "names" (scripts/audio/build.mjs).
  var S = "names";
  MON.concat(allLooks()).forEach(function (m) {
    out.push({ kind: "m", text: monsterName(m), sprite: S });
    if (!m.boss) out.push({ kind: "p", text: monsterCleared(m), sprite: S }); // beating the boss is the win, said as PHRASE.win
    out.push({ kind: "p", text: monsterWon(m), sprite: S });
  });
  HEROES.forEach(function (h) {
    out.push({ kind: "m", text: heroName(h), sprite: S });
    out.push({ kind: "m", text: monsterName(cursedMonster(h.d)), sprite: S });
    out.push({ kind: "p", text: heroJoins(h), sprite: S });
  });
  for (var d = 2; d <= DEPTH_MAX_SPOKEN; d++) out.push({ kind: "p", text: depthLine(d) });
  WINGS.forEach(function (w, i) {
    out.push({ kind: "p", text: wingCleared(w) });
    if (i) out.push({ kind: "p", text: wingOpened(w) });
  });
  facts().forEach(function (f) {
    out.push({ kind: "q", text: spokenProblem(f) });
    out.push({ kind: "q", text: spokenFact(f) });
    // Missing-number problems (Quizard): "three plus what is seven", hiding either number.
    out.push({ kind: "q", text: spokenMissing(missingOf(f, "x")) });
    out.push({ kind: "q", text: spokenMissing(missingOf(f, "y")) });
  });
  // Coins (Trollar): "two dimes and three pennies. How many cents?", and the answer; and the
  // two-digit problems (Haberhasher): "thirty-eight plus twenty-five", and "… is sixty-three".
  var both = [];
  twoDigitFacts().forEach(function (f) {
    both.push(f);
    if (f.op === "+" && f.x !== f.y) both.push({ op: "+", x: f.y, y: f.x, ans: f.ans }); // either order can come up
  });
  // The Balance Hall: "Compare three plus four and eight.", "three plus four is less than eight".
  coinFacts().concat(both, balanceFacts()).forEach(function (f) {
    out.push({ kind: "q", text: spokenProblem(f) });
    out.push({ kind: "q", text: spokenFact(f) });
  });
  var seen = {};
  return out.filter(function (l) { var k = l.kind + ":" + l.text; if (seen[k]) return false; seen[k] = true; return true; });
}
