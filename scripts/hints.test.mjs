// Hints: each kind of fact gets its classroom strategy, and a hint before answering never
// gives the answer away in words.
import assert from "node:assert/strict";
import { hintFor } from "../js/hints.js";
import { BANDS, pool, factOf } from "../js/learn.js";
import { missingOf, canHide } from "../js/missing.js";

const h = (op, x, y) => hintFor({ op, x, y, ans: { "+": x + y, "-": x - y, "×": x * y, "÷": x / y }[op] }, false);
assert.match(h("+", 3, 4).say, /^Put together/);
assert.match(h("+", 10, 4).say, /^10 and some more/);
assert.match(h("+", 6, 7).say, /^Doubles plus one: 6 \+ 6 \+ 1/);
assert.match(h("+", 8, 5).say, /^Make 10: 8 \+ 2 \+ 3/);
assert.match(h("-", 7, 3).say, /^Take away 3/);
assert.match(h("-", 12, 8).say, /^Think addition: count up from 8 to 12\. 12 − 8 = \?$/, "one ? only");
assert.match(h("×", 3, 4).say, /^3 rows of 4/);
assert.match(h("×", 6, 7).say, /^5 × 7 = 35\. One more 7: 35 \+ 7 = \?$/, "× 6 is × 5 and one more group");
assert.match(h("×", 7, 3).say, /^2 × 7 = 14\. One more 7: 14 \+ 7 = \?$/, "× 3 is × 2 and one more group");
assert.match(h("×", 7, 7).say, /^Break apart: 7 × 5 \+ 7 × 2/);
assert.match(h("×", 5, 8).say, /^Count by 5s: 5, 10, … 5 × 8 = \?$/, "× 5 counts by 5s, not double × 4");
assert.match(h("×", 9, 5).say, /^Count by 5s/);
assert.match(h("×", 4, 7).say, /^Double it: 4 × 7 is double 2 × 7\. 14 \+ 14 = \?/);
assert.match(h("×", 7, 8).say, /^Double it: 8 × 7 is double 4 × 7\. 28 \+ 28 = \?/);
assert.match(h("×", 4, 8).say, /^Double it: 8 × 4 is double 4 × 4/);
assert.match(h("×", 3, 4).say, /^3 rows of 4/, "small facts stay as arrays");
assert.match(h("×", 4, 4).say, /^4 rows of 4/);
assert.match(h("×", 9, 4).say, /minus one group/, "nines keep their own strategy");
assert.match(h("×", 8, 12).say, /^Break apart: 8 × 10 \+ 8 × 2 = 80 \+ 16 = \?$/, "past × 10, break apart at 10");
assert.match(h("×", 9, 7).say, /minus one group/);
assert.ok(!/finger/.test(h("×", 9, 7).say), "the finger trick isn't taught");
assert.match(h("÷", 32, 8).say, /^Think multiplication: how many 8s make 32\? 32 ÷ 8 = \?$/, "one ? only");

// Every fact in every band: a drawing, a grown-ups line, and no answer before answering;
// the worked example after a miss ends with the answer.
for (const band of Object.keys(BANDS)) {
  for (const p of pool(band)) {
    const f = factOf(p.key, () => 0.9), before = hintFor(f, false), after = hintFor(f, true);
    assert.ok(before.model.startsWith("<svg") && before.grownups, p.key);
    // A comparison's answer is its symbol: "3 + 4 ? 8" before, "3 + 4 < 8" after.
    assert.ok(before.say.endsWith(f.sym ? f.l + " ? " + f.r : "= ?"), `${p.key}: ${before.say}`);
    assert.ok(after.say.endsWith(f.sym ? f.l + " " + f.sym + " " + f.r : "= " + f.ans), `${p.key}: ${after.say}`);
    assert.ok(!/NaN|undefined|-\d/.test(before.say.replace(/ − /g, " ")), `${p.key}: ${before.say}`);
  }
}
console.log("✓ hints");

// Each kind of fact gets the strategy classrooms use for it (the review of every hint):
assert.match(h("×", 7, 10).say, /^Count by tens: 7 tens\. 7 × 10 = \?$/, "× 10 is tens");
assert.match(hintFor({ op: "×", x: 10, y: 7, ans: 70 }, true).say, /7 tens is 70/);
assert.match(h("×", 12, 12).say, /^Break apart: 12 × 10 \+ 12 × 2 = 120 \+ 24/, "× 12 breaks apart at 10");
assert.match(h("×", 11, 6).say, /^Break apart: 6 × 10 \+ 6 × 1 = 60 \+ 6/, "× 11 breaks apart at 10");
assert.match(h("×", 8, 2).say, /^Doubles: 2 × 8 is 8 \+ 8/, "× 2 is a double");
assert.match(h("+", 8, 8).say, /^Doubles: two rows of 8/, "doubles get the doubles strategy, not make 10");
assert.match(h("-", 14, 4).say, /^14 is 10 and 4\. Take away the 4\./, "1n − n takes away the ones");
assert.match(h("-", 14, 10).say, /^14 is a full ten and some more\. Take away the ten\. 14 − 10 = \?$/, "doesn't say the 4 it leaves");
assert.match(h("-", 20, 1).say, /^20 is 10 and 10\. Take 1 from the 10: 10 − 1 = 9\. 10 \+ 9 = \?$/, "20 − 1 doesn't count up");
assert.match(h("-", 13, 4).say, /^Back to 10, then back 1 more: 13 − 3 = 10\. 10 − 1 = \?$/, "taking a little across 10 counts back");
assert.match(h("-", 16, 8).say, /^Doubles: 8 \+ 8 = 16, so 16 − 8 = \?$/, "doubles subtract too");
assert.match(h("-", 13, 9).say, /^Think addition: count up from 9 to 13\. 13 − 9 = \?$/, "close numbers count up");
assert.match(h("-", 69, 6).say, /^Cross out 6 ones\. 69 − 6 = \?$/, "two-digit minus one-digit takes away the ones");
assert.match(h("-", 52, 7).say, /^Back to 50, then back 5 more: 52 − 2 = 50\. 50 − 5 = \?$/, "crossing a ten goes back to it");
assert.match(h("+", 5, 30).say, /^3 tens and 5 ones\. 30 \+ 5 = \?$/, "no \"5 + 0\"");
assert.match(hintFor({ op: "÷", x: 2, y: 2, ans: 1 }, false).model, /aria-label="2 in groups of 2"/);

// Every fact in every band, before and after answering: × 10, 11 and 12 never break apart at 5,
// doubles get the doubles strategy, nothing adds a 0, and every worked equation is true.
const sym = { "+": "+", "−": "-", "×": "*", "÷": "/" };
const value = (e) => Function(`return (${e.replace(/[+−×÷]/g, (c) => sym[c])})`)();
const chain = /[\dX]+(?: [+−×÷] [\dX]+)*(?: = [\dX]+(?: [+−×÷] [\dX]+)*)+/g;
// Each "a = b = c" in the words must be true. The □ (and a "?" standing alone, before answering)
// is the answer, so it's filled in: a hint that states a false equation, like "3 + □ = 7" for
// □ + 4 = 7, fails. A comparison's "?" is its symbol, so its chains just skip it.
function checkEquations(say, label, f) {
  const filled = f && !f.sym ? say.replace(/□|(?<=^|[\s(])\?(?=$|[\s.,)])/g, String(f.ans)) : say.replace(/[?□]/g, "X");
  for (const m of filled.matchAll(chain)) {
    const parts = m[0].split(" = ").filter((p) => !p.includes("X")).map(value);
    assert.ok(parts.every((v) => v === parts[0]), `${label}: ${m[0]} in "${say}"`);
  }
}
assert.throws(() => checkEquations("7 is 3 and how many more? 3 + □ = 7, □ = ?", "the old □ + 4 = 7 hint", { ans: 3 }));

// Every problem a band can ask: its facts, both ways round, and (Quizard's, and 15% of reviews)
// with either number hidden.
function* problems(band) {
  for (const p of pool(band)) for (const flip of [0.1, 0.9]) {
    const f = factOf(p.key, () => flip);
    yield [f, p.key];
    if (!f.blank && "+-×÷".includes(f.op) && canHide(f)) for (const blank of ["x", "y"]) yield [missingOf(f, blank), `${p.key} ${blank}□`];
  }
}
let checked = 0, hidden = 0;
for (const band of Object.keys(BANDS)) {
  for (const [f, key] of problems(band)) {
    if (f.blank) hidden++;
    for (const worked of [false, true]) {
      const say = hintFor(f, worked).say, label = `${band} ${key}${worked ? " worked" : ""}`;
      checkEquations(say, label, f);
      checked++;
      if (f.blank) continue;
      if (f.op === "×" && Math.max(f.x, f.y) >= 10) assert.ok(!/× 5 \+/.test(say), `${label}: ${say}`);
      if (f.op === "+" && f.x === f.y && f.ans > 10 && f.ans < 20) assert.match(say, /^Doubles:/, label);
      if (f.op === "×" && Math.min(f.x, f.y) === 2 && Math.max(f.x, f.y) < 10) assert.match(say, /^Doubles:/, label);
      if (f.x !== 0 && f.y !== 0) assert.ok(!/ \+ 0\b|\b0 \+ /.test(say), `${label}: ${say}`);
    }
  }
}
assert.ok(checked > 6000 && hidden > 1000, `${checked} ${hidden}`);
console.log("✓ hint strategies by fact, and every equation in them is true");

// Before answering, nothing shows the answer: not the words, the drawing's text (number line
// stops and hops, running counts, labels) or its label for screen readers. The problem's own
// numbers may show (8 − 4 = 4 shows the 4 taken away). Two kinds show it on purpose: one coin's
// hint shows all four values to pick from, and rounding names the two tens to choose between.
const numbersIn = (t) => (t.match(/\d+/g) || []).map(Number);
function shown(h) {
  const svgText = [...h.model.matchAll(/<text[^>]*>(.*?)<\/text>/g)].map((m) => m[1].replace(/<[^>]*>/g, " "));
  const aria = (h.model.match(/aria-label="([^"]*)"/) || [])[1] || "";
  return [h.say, aria, ...svgText].join(" | ");
}
let quiet = 0;
for (const band of Object.keys(BANDS)) {
  for (const [f, key] of problems(band)) {
    if (f.op === "≈" || (f.op === "¢" && f.q === String(f.ans))) continue;
    // A comparison's answer is its symbol (its ans is the damage, the bigger number).
    if (f.sym) { const hb = hintFor(f, false); assert.ok(!/[<>]|&[lg]t;/.test(hb.say + hb.model.replace(/<[^>]*>/g, "")), `${key}: ${hb.say}`); continue; }
    const known = new Set(numbersIn((f.blank ? [f.q] : [f.q, f.l, f.r, f.x, f.y]).filter((v) => v != null).join(" ")));
    // and so are their digits and tens (73 is 7 tens and 3 ones).
    for (const n of [...known]) if (n >= 10) for (const part of [n % 10, Math.floor(n / 10) % 10, n - (n % 10), Math.floor(n / 10)]) known.add(part);
    // 10 is every + and − strategy's landmark (make 10, 11 is 10 and 1, back to 10), so it may show.
    if (known.has(f.ans) || (f.ans === 10 && "+-".includes(f.op))) continue;
    const text = shown(hintFor(f, false));
    assert.ok(!numbersIn(text).includes(f.ans), `${band} ${key}: ${f.q || f.x + f.op + f.y} = ${f.ans} shows in "${text}"`);
    quiet++;
  }
}
assert.ok(quiet > 3000, String(quiet));
console.log("✓ no hint shows the answer before answering");

// The help page's strategies: each sample problem gets the hint it's named for.
import { STRATEGIES } from "../js/hints.js";
const opening = { "Ten-frame": /^Put together/, "Draw and cross out": /^Take away/, "10 and some more": /^10 and some more/, "Make 10": /^Make 10/,
  "Doubles plus one": /^Doubles plus one/, "Think addition": /^Think addition/, "Arrays": /rows of/, "Count by 5s": /^Count by 5s: 5, 10, … 35\. 5 × 7 = 35$/, "One more group": /^5 × 7 = 35\. One more 7: 35 \+ 7 = 42$/, "The missing number": /^Count up from 7: \+3 to 10, \+5 to 15\. □ = 8$/, "Compare": /^3 \+ 4 is 7\. Line them up\. The mouth opens to the bigger number\. 3 \+ 4 < 8$/, "Balance": /^Both sides are the same\. 3 \+ 4 = 7, so □ \+ 5 = 7\. 7 − 5 = /, "Doubling": /^Double it/, "Break apart": /^Break apart/,
  "Nines as tens": /minus one group/, "Naming coins": /^A quarter is big and silver\. Quarters = 2$/, "What each coin is worth": /^A dime is small and silver\. It's worth 10¢\./, "Counting coins": /^Count on from the biggest coin\. Total = 17$/, "Tens and ones": /^Tens and ones: 30 \+ 20 = 50, 8 \+ 5 = 13\. 50 \+ 13 = 63$/, "Count up by tens": /^Think addition: count up from 28 to 52\. 2 \+ 20 \+ 2 = 24$/,
  "Doubles": /^Doubles: two rows of 8\. 5 \+ 5 = 10, and 3 \+ 3 = 6\. 10 \+ 6 = 16$/, "Take away from 10 and some more": /^Take 3 from the 5: 5 − 3 = 2\. 10 \+ 2 = 12$/,
  "Doubles to subtract": /^Doubles: 8 \+ 8 = 16, so 16 − 8 = 8$/, "Count back through 10": /^Back to 10, then back 1 more: 13 − 3 = 10\. 10 − 1 = 9$/, "Times 2 as doubles": /^Doubles: 2 × 8 is 8 \+ 8 = 16$/,
  "Times 10 as tens": /^Count by tens: 7 tens is 70\. 7 × 10 = 70$/, "Elevens and twelves": /^Break apart: 6 × 10 \+ 6 × 2 = 60 \+ 12 = 72$/,
  "Take away tens and ones": /^Cross out 2 tens and 6 ones\. 69 − 26 = 43$/, "Back to a ten": /^Back to 50, then back 5 more: 52 − 2 = 50\. 50 − 5 = 45$/, "Think multiplication": /^Think multiplication/,
  "Adding zero": /^Adding zero: 4 and none more\. 4 \+ 0 = 4$/, "Which is more": /^Line them up: the longer row is more\. More = 7$/,
  "Make 10 partners": /^How many more make 10\? Count the empty spaces\. 7 \+ □ = 10, □ = 3$/, "Number bonds": /^6 is 4 and how many more\? 4 \+ □ = 6, □ = 2$/,
  "10 and 100 more": /^100 more: the hundreds go up by 1\. 345 \+ 100 = 445$/, "Times zero": /^Zero groups/, "Times tens": /^4 × 3 tens is 12 tens, 120\. 4 × 30 = 120$/,
  "Equal fractions": /^The same amount is shaded\. Count the shaded fourths: □ = 2$/, "Rounding": /^47 is between 40 and 50\. Halfway is 45, and 47 is past halfway, so it rounds up\. □ = 50$/,
  "Area": /^Count the squares, or rows × columns: 3 × 4 = 12$/, "Perimeter": /^Add all four sides: 4 \+ 3 \+ 4 \+ 3 = 14$/,
  "Three numbers: find the ten": /^Find the ten: 4 \+ 6 = 10\. 10 \+ 3 = 13$/, "Arrays as equal rows": /^Add the rows: 5 \+ 5 \+ 5 = 15$/ };
assert.equal(STRATEGIES.length, Object.keys(opening).length);
for (const s of STRATEGIES) {
  const h = hintFor(s.f, true);
  assert.match(h.say, opening[s.title], s.title);
  assert.ok(h.grownups && h.say.endsWith(s.f.sym ? s.f.l + " " + s.f.sym + " " + s.f.r : "= " + s.f.ans), s.title);
}
console.log("✓ hint strategies");

// The grade strata's new kinds of problem (DESIGN.md §4.1, §5.3), in the classroom's models.
import { hiddenFact } from "../js/missing.js";
import { fractionFact, roundFact, rectFact } from "../js/third.js";
import { moreFact } from "../js/balance.js";
{
  const w = (f) => hintFor(f, true), b = (f) => hintFor(f, false);
  // K: zero, make 10 on a ten-frame, number bonds, 10 and some more.
  assert.match(b({ op: "-", x: 4, y: 4, ans: 0 }).say, /^Take away all of them: none are left\. 4 − 4 = \?$/);
  assert.match(b({ op: "-", x: 4, y: 0, ans: 4 }).say, /^Take away none/);
  assert.match(b(hiddenFact("+", 7, 3)).model, /ten-frame: 7 and the empty spaces/);
  assert.match(b(hiddenFact("+", 4, 2)).model, /number bond: 6 is 4 and \?/);
  assert.equal(w(hiddenFact("+", 10, 4)).say, "14 is 10 and some more. 10 + □ = 14, □ = 4");
  assert.match(b(moreFact(3, 8)).model, /3 dots and 8 dots/);
  // 1st grade's □ facts use the fact that works them out: 8 + □ = 13 is 13 − 8.
  assert.equal(b(hiddenFact("+", 8, 5)).say, "Count up from 8: +2 to 10, +3 to 13. □ = ?");
  assert.equal(w(hiddenFact("+", 7, 8)).say, "Count up from 7: +3 to 10, +5 to 15. □ = 8");
  assert.match(b(hiddenFact("+", 7, 8)).model, /count up from 7 to 15/);
  assert.equal(b(hiddenFact("-", 11, 7)).say, "11 − □ = 4 → 11 − 4 = ?", "subtracting starts from the turned fact");
  assert.equal(w(hiddenFact("-", 11, 7)).say, "11 − □ = 4 → 11 − 4 = 7");
  // K number bonds: dots under the known part, and under the hidden one once it's worked out.
  assert.equal((b(hiddenFact("+", 4, 2)).model.match(/r="3.5"/g) || []).length, 4);
  assert.equal((w(hiddenFact("+", 4, 2)).model.match(/r="3.5"/g) || []).length, 6);
  // 3rd: × 0 and × 1, 0 ÷ n, × tens, fractions, rounding (halfway rounds up), area and perimeter.
  assert.match(b({ op: "×", x: 0, y: 7, ans: 0 }).say, /^Zero groups of 7/);
  assert.match(b({ op: "×", x: 0, y: 7, ans: 0 }).model, /aria-label="no groups"/, "0 × 7 is no groups, not 7 empty ones");
  assert.match(b({ op: "×", x: 7, y: 0, ans: 0 }).say, /^7 groups with nothing in them/);
  assert.match(b({ op: "×", x: 7, y: 0, ans: 0 }).model, /aria-label="7 empty groups"/);
  assert.equal(b({ op: "×", x: 1, y: 8, ans: 8 }).say, "1 group: all 8 in it. 1 × 8 = ?", "× 1 isn't doubling");
  assert.match(b({ op: "÷", x: 0, y: 5, ans: 0 }).say, /^Share nothing into 5 groups/);
  assert.equal(b({ op: "÷", x: 7, y: 1, ans: 7 }).say, "1 group: all 7 in it. 7 ÷ 1 = ?");
  assert.equal(b({ op: "÷", x: 0, y: 1, ans: 0 }).say, "Share nothing into 1 group: nothing in each. 0 ÷ 1 = ?", "plurals");
  assert.match(b({ op: "÷", x: 0, y: 1, ans: 0 }).model, /aria-label="1 empty group"/);
  assert.match(b(moreFact(1, 2)).model, /aria-label="1 dot and 2 dots"/);
  assert.match(w({ op: "×", x: 90, y: 7, ans: 630 }).say, /^7 × 9 tens is 63 tens, 630\. 90 × 7 = 630$/);
  assert.match(b(fractionFact(1, 1, 4)).say, /Count the shaded fourths: □ = \?$/);
  assert.match(w(roundFact(45, 10)).say, /45 is halfway, so it rounds up\. □ = 50$/);
  assert.match(w(roundFact(349, 100)).say, /^349 is between 300 and 400\. Halfway is 350, and 349 is before halfway, so it rounds down\. □ = 300$/);
  assert.match(b(rectFact("a", 5, 2)).model, /a rectangle 5 by 2/);
  assert.equal(w(rectFact("p", 5, 2)).say, "Add all four sides: 5 + 2 + 5 + 2 = 14");
  // Hints never show a fraction's answer as a number before answering.
  for (const f of [fractionFact(1, 2, 4), fractionFact(3, 4, 8), fractionFact(2, 1, 3)]) assert.ok(!b(f).say.includes(String(f.ans) + " "), b(f).say);
}
console.log("✓ grade strata hints");

// The hint audit's bugs, each as it was found.
import { compareFact, balanceFact } from "../js/balance.js";
import { coinFact } from "../js/coins.js";
{
  const w = (f) => hintFor(f, true), b = (f) => hintFor(f, false);
  const F = (key, flip) => factOf(key, () => flip);
  // Quizard's "□ first" problems used the hidden number as the shown one: □ + 4 = 7 said
  // "7 is 3 and how many more? 3 + □ = 7" and drew the 3 in the bond.
  const q1 = missingOf(F("+3,4", 0.9), "x"); // □ + 4 = 7
  assert.equal(q1.q, "□ + 4 = 7");
  assert.equal(b(q1).say, "7 is 4 and how many more? □ + 4 = 7, □ = ?");
  assert.equal(w(q1).say, "7 is 4 and how many more? □ + 4 = 7, □ = 3");
  assert.match(b(q1).model, /number bond: 7 is 4 and \?/);
  const q2 = missingOf(F("+3,7", 0.9), "x"); // □ + 7 = 10
  assert.match(b(q2).model, /ten-frame: 7 and the empty spaces/);
  assert.equal((b(q2).model.match(/fill="var\(--gold\)"/g) || []).length, 7, "7 dots, 3 empty spaces");
  assert.equal(b(missingOf(F("+4,10", 0.1), "x")).say, "Count up from 4: +6 to 10, +4 to 14. □ = ?"); // □ + 4 = 14
  assert.equal(w(missingOf(F("+0,4", 0.9), "x")).say, "4 is 4 and how many more? □ + 4 = 4, □ = 0"); // □ + 4 = 4
  assert.equal(w(missingOf(F("-11,7"), "x")).say, "□ − 7 = 4 → 4 + 7 = 11");
  assert.equal(w(missingOf(F("×3,4", 0.9), "x")).say, "□ × 4 = 12 → 12 ÷ 4 = 3");
  assert.equal(w(missingOf(F("÷12,3"), "y")).say, "12 ÷ □ = 4 → 12 ÷ 4 = 3");
  // 100 − 77 and 100 − 20 aren't "10 or 100 less": they're two-digit facts.
  assert.equal(b({ op: "-", x: 100, y: 77, ans: 23 }).say, "Think addition: count up from 77 to 100. 3 + 20 = ?");
  assert.equal(b({ op: "-", x: 100, y: 20, ans: 80 }).say, "10 tens take away 2 tens. 100 − 20 = ?");
  assert.match(b({ op: "-", x: 345, y: 10, ans: 335 }).say, /^10 less: the tens go down by 1/);
  assert.match(b({ op: "+", x: 100, y: 345, ans: 445 }).say, /^100 more: the hundreds go up by 1/);
  for (const band of ["first", "second"]) for (const p of pool(band)) {
    const f = factOf(p.key, () => 0.5);
    if (f.op === "-" && f.x === 100) assert.ok(!/less: the/.test(b(f).say), `${f.q}: ${b(f).say}`);
  }
  // Counting back printed the answer as the number line's last stop (13 − 4 showed 9).
  for (const [x, y, ans] of [[13, 4, 9], [52, 7, 45]]) {
    const before = b({ op: "-", x, y, ans }).model, after = w({ op: "-", x, y, ans }).model;
    assert.ok(!before.includes(`>${ans}<`) && before.includes(">?<"), `${x} − ${y}`);
    assert.ok(after.includes(`>${ans}<`), `${x} − ${y} worked`);
  }
  // Counting up in one hop: the hop is the answer, so it's "+?" (17 − 15).
  assert.ok(b({ op: "-", x: 17, y: 15, ans: 2 }).model.includes(">+?<") && w({ op: "-", x: 17, y: 15, ans: 2 }).model.includes(">+2<"));
  // 30 − 2 says "take 2 from the 10", so the drawing breaks a ten into ones and crosses out 2.
  const t = b({ op: "-", x: 30, y: 2, ans: 28 });
  assert.equal(t.say, "30 is 20 and 10. Take 2 from the 10: 10 − 2 = 8. 20 + 8 = ?");
  assert.match(t.model, /20 and a ten in ones, take away 2/);
  // The 10 and some more facts keep the problem's order.
  assert.equal(b({ op: "+", x: 4, y: 10, ans: 14 }).say, "10 and some more: 4 + 10 = ?");
  assert.equal(b({ op: "+", x: 4, y: 13, ans: 17 }).say, "13 is 10 + 3. 4 + 10 + 3 = ?");
  assert.equal(b({ op: "+", x: 13, y: 4, ans: 17 }).say, "13 is 10 + 3. 10 + 3 + 4 = ?");
  // Comparing: the bigger row ringed in gold (not a drawn mouth, which reads as a "<" or ">");
  // the symbol itself only once worked.
  const cmp = compareFact("3 + 4", "8");
  assert.match(b(cmp).say, /The mouth opens to the bigger number\./);
  assert.match(b(cmp).model, /<rect x="4" y="24" width="[\d.]+" height="20" rx="10" fill="none" stroke="var\(--gold\)"/, "the 8 row, below, is ringed");
  assert.ok(!b(cmp).model.includes("&lt;") && w(cmp).model.includes("&lt;"));
  // Fraction bars are labeled.
  assert.ok(b(fractionFact(1, 2, 4)).model.includes(">1/2<") && b(fractionFact(1, 2, 4)).model.includes(">□/4<"));
  assert.ok(w(fractionFact(1, 2, 4)).model.includes(">2/4<"));
  // Balance pans: each addend starts its own row (3 + 4: 3 dots on the bottom row, 4 above).
  const pans = b(balanceFact("3 + 4", "□ + 5")).model;
  assert.equal((pans.match(/cy="56" r="6"/g) || []).length, 3 + 5, "3 on the bottom row, and the 5 in the other pan");
  assert.equal((pans.match(/cy="41" r="6"/g) || []).length, 4);
  // Coins: the running count under the coins, the last "?" until worked.
  const coins = coinFact({ q: 1, d: 2, n: 1, p: 3 });
  assert.ok(b(coins).model.includes(">52<") && b(coins).model.includes(">?<") && !b(coins).model.includes(">53<"));
  assert.ok(w(coins).model.includes(">53<"));
}
console.log("✓ the hint audit's bugs");

// Tall drawings shrink to nothing on a phone (the hint's drawing gets about 14% of the screen's
// height), so every drawing is short: no taller than 160 units (240 px drawn), and none past 80
// much taller than wide.
for (const band of Object.keys(BANDS)) {
  for (const [f, key] of problems(band)) for (const worked of [false, true]) {
    const m = hintFor(f, worked).model.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    const [vw, vh] = [Number(m[1]), Number(m[2])];
    assert.ok(vh <= 160 && (vh <= 80 || vh <= vw * 1.2), `${band} ${key}: ${vw} × ${vh}`);
  }
}
for (const f of [{ op: "×", x: 80, y: 8, ans: 640 }, { op: "×", x: 12, y: 12, ans: 144 }, { op: "÷", x: 132, y: 12, ans: 11 }, rectFact("a", 7, 6)]) {
  const [, vw, vh] = hintFor(f, false).model.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).map(Number);
  assert.ok(vh <= 100 && vw / vh >= 1.1, `${f.q || f.x + f.op + f.y}: ${vw} × ${vh}`);
}
console.log("✓ hint drawings are wide and short");
