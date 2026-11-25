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

// Whether a fact can hide a number and still have one answer: not with a zero in × or ÷
// (0 × □ = 0 is true for every □), and only the recorded facts (problems.js facts: within 20 and
// the tables), whose "what" lines are recorded.
export function canHide(f) {
  if ((f.op === "×" || f.op === "÷") && (f.x === 0 || f.y === 0)) return false;
  if (f.op === "+" || f.op === "-") return Math.max(f.x, f.y, f.ans) <= 20;
  return f.op === "×" ? Math.max(f.x, f.y) <= 12 : f.op === "÷" && f.y <= 12 && f.ans <= 12;
}

/* ---------- missing-number facts of their own ----------
   Some skills are a missing number by nature: make-10 partners (7 + □ = 10), number bonds
   (4 + □ = 6: 6 is 4 and some more), teen numbers as 10 and some more (10 + □ = 14), and 1st
   grade's unknown addends (8 + □ = 13, 13 − □ = 5). They get their own key, "□" and the fact's
   numbers in order with the second one hidden ("□+7,3"), so they're learned apart from 7 + 3, and
   always asked with the □. */
export function hiddenFact(op, x, y) {
  const ans = op === "+" ? x + y : x - y;
  const p = missingOf({ op, x, y, ans, q: x + " " + SYM[op] + " " + y }, "y");
  p.key = "□" + op + x + "," + y;
  return p;
}
export function hiddenFactOf(key) {
  const [x, y] = key.slice(2).split(",").map(Number);
  return hiddenFact(key[1], x, y);
}
// Kindergarten: make-10 partners (7 + □ = 10), number bonds of 5 to 9 (4 + □ = 6), and the teen
// numbers as 10 and some more (10 + □ = 14).
export function kinderHidden() {
  const out = [];
  for (let x = 1; x <= 9; x++) out.push(hiddenFact("+", x, 10 - x));
  for (let w = 5; w <= 9; w++) for (let a = 1; a < w; a++) out.push(hiddenFact("+", a, w - a));
  for (let n = 1; n <= 9; n++) out.push(hiddenFact("+", 10, n));
  return out;
}
// 1st grade (1.RA.A.4, the unknown addend): a fixed sample of sums and differences within 20
// that cross 10, with the second number hidden (8 + □ = 13, 13 − □ = 5).
export function firstHidden() {
  const all = [];
  for (let x = 2; x <= 9; x++) for (let y = 2; y <= 9; y++) if (x + y > 10) all.push(hiddenFact("+", x, y));
  for (let x = 11; x <= 18; x++) for (let y = 2; y <= 9; y++) if (y > x % 10 && x - y < 10) all.push(hiddenFact("-", x, y));
  let s = 9029;
  const r = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  return all.slice(0, 24);
}
