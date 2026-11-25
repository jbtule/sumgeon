// Every line the game says, in one place: app.js takes its words from here, and the audio
// build (scripts/audio/build.mjs) records exactly these. No DOM, runs in Node.
// Kinds: "p" phrase, "m" monster line, "q" problem (see speech.js).
import { MON } from "./monsters.js";
import { HEROES } from "./heroes.js";
import { WINGS, cursedMonster } from "./wings.js";
import { facts, spokenProblem, spokenFact } from "./problems.js";
import { missingOf, spokenMissing } from "./missing.js";

export var PHRASE = {
  // The menu's intro, worded for speaking ("seven times eight", not "7 × 8").
  intro: "Seven glyph monsters guard seven floors. Your answer is your attack: solve seven times eight, and you hit for fifty-six. Three right in a row, and every hit is doubled. A wrong answer costs a heart, and you see the right one.",
  boss: "Boss floor!",
  crits: "Crits on!",
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

// [{ kind, text }], each once.
export function spokenLines() {
  var out = [];
  Object.keys(PHRASE).forEach(function (k) { out.push({ kind: "p", text: PHRASE[k] }); });
  MON.forEach(function (m) {
    out.push({ kind: "m", text: monsterName(m) });
    if (!m.boss) out.push({ kind: "p", text: monsterCleared(m) }); // beating the boss is the win, said as PHRASE.win
    out.push({ kind: "p", text: monsterWon(m) });
  });
  HEROES.forEach(function (h) {
    out.push({ kind: "m", text: heroName(h) });
    out.push({ kind: "m", text: monsterName(cursedMonster(h.d)) });
    out.push({ kind: "p", text: heroJoins(h) });
  });
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
  var seen = {};
  return out.filter(function (l) { var k = l.kind + ":" + l.text; if (seen[k]) return false; seen[k] = true; return true; });
}
