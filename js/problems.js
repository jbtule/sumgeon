import { coinWords, coinOf, isValue } from "./coins.js";
import { fractionWords, unitName } from "./third.js";
import { spokenClockFact, spokenClockAnswer } from "./clock.js";
import { spokenPatternFact, spokenPatternFactAnswer } from "./patterns.js";
import { spokenTF, spokenTFAnswer } from "./truefalse.js";
import { spokenLine, spokenLineAnswer } from "./numberline.js";
import { spokenPV, spokenPVAnswer } from "./placevalue.js";
import { spokenDollars, spokenDollarAnswer } from "./dollars.js";
import { spokenShape, spokenShapeAnswer } from "./shapes.js";
import { spokenFlash, spokenFlashAnswer } from "./flash.js";
import { spokenFourth, spokenFourthAnswer } from "./fourth.js";
import { spokenAngle, spokenAngleAnswer } from "./angles.js";
import { spokenChart, spokenChartAnswer } from "./charts.js";

// Problem generation and spoken text. No DOM: runs in Node for the tests and, later, the
// audio build (which records the same spoken text the app asks for).

export var DIFF = {
  easy: { add: 10, mul: 5, time: 15, label: "Easy" },
  med: { add: 20, mul: 10, time: 12, label: "Medium" },
  hard: { add: 50, mul: 12, time: 10, label: "Hard" }
};
export var OPS = [["+", "Add"], ["-", "Subtract"], ["×", "Multiply"], ["÷", "Divide"]];

// A whole number from a to b inclusive. `rnd` is Math.random or a seeded stand-in.
export function between(a, b, rnd) { return a + Math.floor((rnd || Math.random)() * (b - a + 1)); }

// One problem: { op, x, y, ans, q } where q is what's shown ("7 + 8").
export function gen(op, diffKey, rnd) {
  var d = DIFF[diffKey] || DIFF.easy, x, y;
  if (op === "+") { x = between(1, d.add, rnd); y = between(1, d.add, rnd); return make(op, x, y, x + y); }
  if (op === "-") { x = between(2, d.add, rnd); y = between(1, x - 1, rnd); return make(op, x, y, x - y); }
  if (op === "×") { x = between(2, d.mul, rnd); y = between(2, d.mul, rnd); return make(op, x, y, x * y); }
  y = between(2, d.mul, rnd); var q = between(1, d.mul, rnd);
  return make("÷", y * q, y, q);
}
function make(op, x, y, ans) {
  return { op: op, x: x, y: y, ans: ans, q: x + " " + (op === "-" ? "−" : op) + " " + y };
}

// Each monster prefers its own operation 70% of the time when it's enabled; mix monsters
// (and everything else) use any enabled operation.
export function pickOp(m, ops, rnd) {
  var r = rnd || Math.random;
  if (m.op !== "mix" && ops.indexOf(m.op) >= 0 && r() < 0.7) return m.op;
  return ops[between(0, ops.length - 1, r)];
}

// Monster HP: the average answer for its problem mix × its hits, so fights last about the
// same number of solves on any difficulty.
export function monsterHP(m, ops, diffKey, rnd) {
  var s = 0, n = 300;
  for (var k = 0; k < n; k++) s += gen(pickOp(m, ops, rnd), diffKey, rnd).ans;
  return Math.max(10, Math.round(s / n * m.hits));
}

/* ---------- spoken text ----------
   One spelling for every number and problem, shared by the app and the audio build, so the
   "kind:text" keys in audio.json always match what the app asks for. */
var ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
var TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

// 56 → "fifty-six", 312 → "three hundred twelve", −3 → "negative three". Whole numbers to 9999.
export function spoken(n) {
  if (n < 0) return "negative " + spoken(-n);
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "");
  if (n < 1000) return ONES[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + spoken(n % 100) : "");
  return spoken(Math.floor(n / 1000)) + " thousand" + (n % 1000 ? " " + spoken(n % 1000) : "");
}
var OP_WORDS = { "+": "plus", "-": "minus", "×": "times", "÷": "divided by" };

// A side of a Balance Hall problem, spoken: "3 + □" → "three plus what".
function spokenSide(side) { return side.split(" + ").map(function (t) { return t === "□" ? "what" : spoken(Number(t)); }).join(" plus "); }
// "3/8" → "three eighths".
function spokenFrac(t) { var nd = t.split("/").map(Number); return fractionWords(nd[0], nd[1], spoken); }
var CMP_WORDS = { "<": "is less than", ">": "is greater than", "=": "is equal to" };

// The voice reads "pennies" as "PEN-iz", close to "penne's"; spelled "penny's" it says
// "PEN-eez" (checked with Kokoro's phonemizer). Only the spoken coin lines use it.
function sayPennies(t) { return t.replace(/\bpennies\b/g, "penny's"); }

// "seven plus eight"; for coins, "two dimes and three pennies. How many cents?", "How many
// dimes?" (find the coin) or "How many cents?" (one coin: the voice doesn't name it).
export function spokenProblem(p) {
  // 4th grade (fourth.js, angles.js): remainders, two steps and n, factors, fractions worked on,
  // decimals, measurement, a side to find, angles and shapes.
  if (p.op === "∠") return spokenAngle(p);
  const four = spokenFourth(p);
  if (four) return four;
  // Time (Tick-Tockus): "What time is it? How many minutes past three?"; patterns (Slimelipsis):
  // "Two, four, six. What comes next?", "How many even numbers?".
  if (p.op === "⌚") return spokenClockFact(p);
  if (p.op === "▥") return spokenChart(p);
  if (p.op === "…" || p.op === "◐") return spokenPatternFact(p);
  // True or false (the Equal Twins): "Four plus two equals seven. True or false?", "Fix it! Four
  // plus two equals what?"; the number line (Halfling): "Where is the dot? What fourths?"; place
  // value (Haberhasher): "Three hundreds, four tens and five ones. What number?"; dollars
  // (Trollar): "How many dollars?", "How much money? Dollars, then cents."
  if (p.op === "✓" || p.op === "✎") return spokenTF(p);
  if (p.op === "↔") return spokenLine(p);
  if (p.op === "#") return spokenPV(p);
  if (p.op === "$") return spokenDollars(p);
  // Shapes (Polly-Gon): "Draw a triangle!", "How many sides does this hexagon have?"
  if (p.op === "◇") return spokenShape(p);
  // The dot flash (Pipsqueak): "How many dots?"
  if (p.op === "⁙") return spokenFlash(p);
  // Which is more (K): "Which is more, seven or four?"
  if (p.op === "more") return "Which is more, " + spoken(p.x) + " or " + spoken(p.y) + "?";
  // Fractions: "one half equals what fourths"; "one equals what fourths".
  if (p.op === "/") return fractionWords(p.a, p.b, spoken) + " equals what " + unitName(p.d);
  // Three numbers (Triceraplus): "four plus three plus six"; in the Mines up to four two-digit
  // ones, "twenty-three plus fourteen plus thirty-one plus twelve".
  if (p.op === "Σ") return (p.nums || [p.a, p.b, p.c]).map(spoken).join(" plus ");
  // An array (Squaresquatch): "Three rows of five. How many in all?"
  if (p.op === "▦") return capital(spoken(p.r)) + " rows of " + spoken(p.c) + ". How many in all?";
  if (p.op === "≈") return "Round " + spoken(p.n) + " to the nearest " + spoken(p.to).replace("one ", "") + ".";
  if (p.op === "▭") return "What is the " + (p.kind === "a" ? "area" : "perimeter") + " of a " + spoken(p.w) + " by " + spoken(p.h) + " rectangle?";
  // Comparing fractions (the Tower): "Compare three eighths and five eighths."
  if (p.op === "○" && p.frac) return "Compare " + spokenFrac(p.l) + " and " + spokenFrac(p.r) + ".";
  if (p.op === "○") return "Compare " + spokenSide(p.l) + " and " + spokenSide(p.r) + ".";
  if (p.op === "=") return spokenSide(p.l) + " equals " + spokenSide(p.r);
  if (p.op === "¢" && p.find) return sayPennies("How many " + coinOf(p.find).names + "?");
  if (p.op === "¢" && isValue(p)) return "How many cents?";
  if (p.op === "¢") return sayPennies(coinWords(p.coins) + ". How many cents?");
  return spoken(p.x) + " " + OP_WORDS[p.op] + " " + spoken(p.y);
}
// "seven plus eight is fifteen" (said after a miss, with the right answer); for coins, "two dimes
// and three pennies make twenty-three cents", "There are two dimes.", and for one coin the K
// guide's words: "This is a dime. A dime is small and silver. It's worth ten cents."
export function spokenFact(p) {
  if (p.op === "∠") return spokenAngleAnswer(p);
  const four = spokenFourthAnswer(p);
  if (four) return four;
  if (p.op === "⌚") return spokenClockAnswer(p);
  if (p.op === "▥") return spokenChartAnswer(p);
  if (p.op === "…" || p.op === "◐") return spokenPatternFactAnswer(p);
  if (p.op === "✓" || p.op === "✎") return spokenTFAnswer(p);
  if (p.op === "↔") return spokenLineAnswer(p);
  if (p.op === "#") return spokenPVAnswer(p);
  if (p.op === "$") return spokenDollarAnswer(p);
  if (p.op === "◇") return spokenShapeAnswer(p);
  if (p.op === "⁙") return spokenFlashAnswer(p);
  if (p.op === "more") return capital(spoken(p.ans)) + " is more than " + spoken(Math.min(p.x, p.y)) + ".";
  if (p.op === "/") return fractionWords(p.a, p.b, spoken) + " equals " + fractionWords(p.ans, p.d, spoken);
  if (p.op === "▦") return capital(spoken(p.r)) + " rows of " + spoken(p.c) + " make " + spoken(p.ans) + ".";
  if (p.op === "≈") return capital(spoken(p.n)) + " rounds to " + spoken(p.ans) + ".";
  if (p.op === "▭") return "A " + spoken(p.w) + " by " + spoken(p.h) + " rectangle has " + (p.kind === "a" ? "an area" : "a perimeter") + " of " + spoken(p.ans) + ".";
  if (p.op === "○" && p.frac) return spokenFrac(p.l) + " " + CMP_WORDS[p.sym] + " " + spokenFrac(p.r);
  if (p.op === "○") return spokenSide(p.l) + " " + CMP_WORDS[p.sym] + " " + spokenSide(p.r);
  if (p.op === "=") return spokenSide(p.l.replace("□", p.ans)) + " equals " + spokenSide(p.r.replace("□", p.ans));
  if (p.op === "¢" && p.find) return sayPennies((p.ans === 1 ? "There is one " + coinOf(p.find).name : "There are " + spoken(p.ans) + " " + coinOf(p.find).names) + ".");
  if (p.op === "¢" && isValue(p)) return coinLine(coinOf(Object.keys(p.coins).find(function (k) { return p.coins[k]; })));
  if (p.op === "¢") return sayPennies(coinWords(p.coins) + (coinCount(p.coins) > 1 ? " make " : " is ") + spoken(p.ans) + (p.ans === 1 ? " cent" : " cents"));
  return spokenProblem(p) + " is " + spoken(p.ans);
}
function capital(t) { return t[0].toUpperCase() + t.slice(1); }
// "This is a dime. A dime is small and silver. It's worth ten cents."
export function coinLine(t) {
  return "This is a " + t.name + ". A " + t.name + " is " + t.look + ". It's worth " + spoken(t.v) + (t.v === 1 ? " cent." : " cents.");
}
function coinCount(c) { return c.q + c.d + c.n + c.p; }

/* ---------- facts ----------
   The facts that get recorded clips (DESIGN.md §13): sums and differences within 20, the zero
   facts within 5 (4 + 0, 4 − 0, 4 − 4), the 0–12 times tables with their division facts (0 × 7,
   1 × 7, 7 ÷ 1, 0 ÷ 7, never ÷ 0). Bigger problems have their own sets (twodigit.js, third.js). */
export function facts() {
  var out = [], x, y, q;
  for (x = 1; x <= 19; x++) for (y = 1; x + y <= 20; y++) out.push(make("+", x, y, x + y));
  for (x = 2; x <= 20; x++) for (y = 1; y < x; y++) out.push(make("-", x, y, x - y));
  for (x = 2; x <= 12; x++) for (y = 2; y <= 12; y++) out.push(make("×", x, y, x * y));
  for (y = 2; y <= 12; y++) for (q = 1; q <= 12; q++) out.push(make("÷", y * q, y, q));
  // Zero within 5 (kindergarten): 4 + 0, 0 + 4, 4 − 0 and 4 − 4.
  for (x = 1; x <= 5; x++) out.push(make("+", x, 0, x), make("+", 0, x, x), make("-", x, 0, x), make("-", x, x, 0));
  // × 0 and × 1, and their ÷ (3rd grade): 0 × 7, 1 × 7, 7 ÷ 1, 0 ÷ 7.
  out.push(make("×", 0, 0, 0), make("×", 1, 1, 1));
  for (x = 1; x <= 10; x++) out.push(make("×", 0, x, 0), make("×", x, 0, 0), make("÷", x, 1, x), make("÷", 0, x, 0));
  for (x = 2; x <= 10; x++) out.push(make("×", 1, x, x), make("×", x, 1, x));
  return out;
}
