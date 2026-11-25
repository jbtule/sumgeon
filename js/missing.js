// Missing-number problems (DESIGN.md §4, Quizard): a fact with one number hidden, such as
// 3 + □ = 7. The answer (and the damage) is the hidden number. They reuse the fact's record, so
// they practice the same facts from the other side. No DOM: runs in Node for the tests.
import { spoken } from "./problems.js";

const SYM = { "+": "+", "-": "−", "×": "×", "÷": "÷" };
const WORD = { "+": "plus", "-": "minus", "×": "times", "÷": "divided by" };

// The share of review facts (box 3+) other monsters ask this way. Quizard asks every one.
export const MISSING_SHARE = 0.15;

// f: a fact from factOf ({ op, x, y, ans, q, key }). blank: "x" or "y", the number to hide.
// Returns { op, x, y, ans: the hidden number, q: "3 + □ = 7", key, blank, fact, inverse },
// where inverse is the fact that works it out (3 + □ = 7 is 7 − 3), for its hint.
export function missingOf(f, blank) {
  const hidden = f[blank];
  const q = (blank === "x" ? "□" : f.x) + " " + SYM[f.op] + " " + (blank === "y" ? "□" : f.y) + " = " + f.ans;
  let inv;
  if (f.op === "+") inv = { op: "-", x: f.ans, y: blank === "x" ? f.y : f.x };
  else if (f.op === "-") inv = blank === "x" ? { op: "+", x: f.ans, y: f.y } : { op: "-", x: f.x, y: f.ans };
  else if (f.op === "×") inv = { op: "÷", x: f.ans, y: blank === "x" ? f.y : f.x };
  else inv = blank === "x" ? { op: "×", x: f.ans, y: f.y } : { op: "÷", x: f.x, y: f.ans };
  inv.ans = hidden;
  return { op: f.op, x: f.x, y: f.y, ans: hidden, q, key: f.key, blank, fact: f, inverse: inv };
}

// Which number to hide, either one at random.
export function pickBlank(rnd) { return (rnd || Math.random)() < 0.5 ? "x" : "y"; }

// The problem with the hidden number filled in: "3 + 4 = 7".
export function filled(p, value) { return p.q.replace("□", String(value)); }

// Spoken, with "what" for the hidden number: "three plus what is seven".
export function spokenMissing(p) {
  const a = p.blank === "x" ? "what" : spoken(p.x), b = p.blank === "y" ? "what" : spoken(p.y);
  return a + " " + WORD[p.op] + " " + b + " is " + spoken(p.fact.ans);
}
