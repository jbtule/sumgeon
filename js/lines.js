// Every line the game says, in one place: app.js takes its words from here, and the audio
// build (scripts/audio/build.mjs) records exactly these. No DOM, runs in Node.
// Kinds: "p" phrase, "m" monster line, "q" problem (see speech.js).
import { MON } from "./monsters.js";
import { facts, spokenProblem, spokenFact } from "./problems.js";

export var PHRASE = {
  // The menu's intro, worded for speaking ("seven times eight", not "7 × 8").
  intro: "Seven glyph monsters guard seven floors. Your answer is your attack: solve seven times eight, and you hit for fifty-six. Three right in a row, and every hit is doubled. A wrong answer costs a heart, and you see the right one.",
  boss: "Boss floor!",
  crits: "Crits on!",
  win: "You cleared the Sumgeon!"
};
export function monsterName(m) { return m.n + "!"; }
export function monsterCleared(m) { return m.n + " " + m.quip; }
export function monsterWon(m) { return m.n + " won this round."; }

// [{ kind, text }], each once.
export function spokenLines() {
  var out = [];
  Object.keys(PHRASE).forEach(function (k) { out.push({ kind: "p", text: PHRASE[k] }); });
  MON.forEach(function (m) {
    out.push({ kind: "m", text: monsterName(m) });
    if (!m.boss) out.push({ kind: "p", text: monsterCleared(m) }); // beating the boss is the win, said as PHRASE.win
    out.push({ kind: "p", text: monsterWon(m) });
  });
  facts().forEach(function (f) {
    out.push({ kind: "q", text: spokenProblem(f) });
    out.push({ kind: "q", text: spokenFact(f) });
  });
  var seen = {};
  return out.filter(function (l) { var k = l.kind + ":" + l.text; if (seen[k]) return false; seen[k] = true; return true; });
}
