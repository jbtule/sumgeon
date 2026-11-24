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

// "seven plus eight"
export function spokenProblem(p) { return spoken(p.x) + " " + OP_WORDS[p.op] + " " + spoken(p.y); }
// "seven plus eight is fifteen" (said after a miss, with the right answer)
export function spokenFact(p) { return spokenProblem(p) + " is " + spoken(p.ans); }

/* ---------- facts ----------
   The facts that get recorded clips (DESIGN.md §13): sums and differences within 20 and the
   2–12 times tables with their division facts. Bigger problems use the device voice. */
export function facts() {
  var out = [], x, y, q;
  for (x = 1; x <= 19; x++) for (y = 1; x + y <= 20; y++) out.push(make("+", x, y, x + y));
  for (x = 2; x <= 20; x++) for (y = 1; y < x; y++) out.push(make("-", x, y, x - y));
  for (x = 2; x <= 12; x++) for (y = 2; y <= 12; y++) out.push(make("×", x, y, x * y));
  for (y = 2; y <= 12; y++) for (q = 1; q <= 12; q++) out.push(make("÷", y * q, y, q));
  return out;
}
