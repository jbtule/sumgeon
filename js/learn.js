// The learning engine (DESIGN.md §5): bands and their levels, per-fact mastery records, and
// choosing each problem on purpose. No DOM: runs in Node for the tests.
//
// A fact record: { b: box 0–4, n: times seen, c: right, ms: average answer time, t: last seen }.
//   Right and unhinted moves a fact up a box (two when fast, from box 1 on); a miss sends it to
//   box 0; a hinted answer changes nothing, so mastery needs solves without help.
import { facts } from "./problems.js";
import { coinFacts, coinFactOf, COIN_LEVELS } from "./coins.js";
import { twoDigitFacts, twoLevel } from "./twodigit.js";
import { balanceFacts, balanceFactOf, inSet, moreFacts, moreFactOf, MORE_LEVELS, compare1000Facts } from "./balance.js";
import { hiddenFactOf, kinderHidden, firstHidden } from "./missing.js";
import { timesTens, fractionFacts, fractionFactOf, roundFacts, roundFactOf, rectFacts, rectFactOf, fracCompareFacts } from "./third.js";
import { threeFacts, threeFactOf, sumFacts, SUM_LEVELS } from "./three.js";
import { arrayFacts, arrayFactOf, ARRAY_LEVELS } from "./arrays.js";
import { clockFacts, clockFactOf, TIME_LEVELS } from "./clock.js";
import { patternFacts, patternFactOf, oddEvenFactOf, PATTERN_GAME_LEVELS } from "./patterns.js";
import { tfFacts, tfFactOf } from "./truefalse.js";
import { lineFacts, lineFactOf } from "./numberline.js";
import { pvFacts, pvFactOf, PV_GAME_LEVELS } from "./placevalue.js";
import { dollarFacts, dollarFactOf, DOLLAR_GAME_LEVELS } from "./dollars.js";
import { shapeFacts, shapeFactOf, SHAPE_STRANDS, isDrawKey } from "./shapes.js";
import { flashFacts, flashFactOf, FLASH_LEVELS } from "./flash.js";
import { asks as asksOf } from "./traits.js";
import { bigCompareFacts, roundFacts4, addSub4, times10s, timesOne, timesTwo, divideOne, remFacts, remFactOf, exprFacts, exprFact, factorFacts, factorFactOf,
  equivFacts4, fracCompare4, fracOpFacts, fracTimesFacts, fracOpFact, decimalFacts, decFact, decCompareFacts, unitFacts, unitFact, rect4Facts,
  primeFacts, primeFactOf, moneyFacts, moneyFact } from "./fourth.js";
import { angleFacts, shapeAngleFacts, angleFact } from "./angles.js";

// One band per grade, K to 3rd (DESIGN.md §2, §4.1), each the facts of one stratum, with its
// levels in the order the school teaches them (Missouri Learning Standards and the school's
// curriculum guides). Which levels are open comes from the stratum's path (wings.js PATHS, DESIGN.md
// §4.3): its steps are these levels, opened a few at a time (openSteps, below).
// Strands are small bands a stratum gives one monster (Trollar's coins, Chompers' "which is
// more?" in the Cellar), asked on its floor, with their own levels. A band's levels are in its
// path's order, so skipping ahead (tiers) climbs the path.
const plain = (f) => !f.blank;
const within = (n) => (f) => plain(f) && ((f.op === "+" && f.ans <= n) || (f.op === "-" && f.x <= n));
const teen = (f) => plain(f) && ((f.op === "+" && (f.x === 10 || f.y === 10) && f.ans <= 20) || (f.op === "-" && f.x > 10 && f.x <= 20 && f.ans === 10));
// A double or near double (8 + 8, 7 + 8; 16 − 8, 15 − 7): Doublet's, 1st grade.
const nearDouble = (f) => plain(f) && ((f.op === "+" && Math.abs(f.x - f.y) <= 1) || (f.op === "-" && Math.abs(f.x - 2 * f.y) <= 1));
// Crossing 10: the ones make more than a ten (8 + 5, 13 + 9), or taking away needs to break one
// (13 − 4, 20 − 1). 9 + 1 and 13 + 7 only reach it.
const crosses = (f) => (f.op === "+" ? (f.x % 10) + (f.y % 10) > 10 : f.x > 10 && f.y % 10 > f.x % 10);
const times = (set) => (f) => f.op === "×" && (set.includes(f.x) || set.includes(f.y)) && f.x <= 10 && f.y <= 10;
const divide = (set) => (f) => f.op === "÷" && set.includes(f.y) && f.ans <= 10;
const tens = (f) => f.op === "×" && Math.max(f.x, f.y) >= 20;
const big = (f) => (f.op === "×" && (f.x > 10 || f.y > 10)) || (f.op === "÷" && (f.y > 10 || f.ans > 10));
const is = (op) => (f) => f.op === op;
const any = (...tests) => (f) => tests.some((t) => t(f));
const hidden = (f) => !!f.blank;
// A set of batch 2's facts (true or false, the number line, place value): its set's id.
const inTF = (...sets) => (f) => (f.op === "✓" || f.op === "✎") && sets.includes(f.set);
const onLine = (...sets) => (f) => f.op === "↔" && sets.includes(f.set);

export const BANDS = {
  // The Counting Cellar.
  kinder: {
    label: "Kindergarten", grade: 0, hearts: 7, fluentMs: 4000,
    facts: () => facts().concat(kinderHidden()),
    levels: [
      { name: "Within 5, with zero", has: within(5) },
      { name: "Within 10", has: within(10) },
      { name: "Make 10 and number bonds", has: (f) => hidden(f) && f.fact.ans <= 10 },
      { name: "10 and some more", has: any(teen, (f) => hidden(f) && f.x === 10) }
    ]
  },
  // The Balance Hall, in the order of its path (wings.js PATHS): within 20, crossing 10, doubles,
  // the equal sign, comparing, then tens.
  first: {
    label: "1st grade", grade: 1, hearts: 7, fluentMs: 4000,
    facts: () => facts().concat(balanceFacts(), firstHidden(), twoDigitFacts(), tfFacts()),
    levels: [
      // Within 10 and 10 and some more (10 + 6, 16 − 6) are the Cellar's: here, the rest of the
      // teens (13 + 4, 17 − 5; a teen take away a teen, 17 − 12, is left out to keep the level short).
      { name: "Within 20, not crossing 10", has: (f) => within(20)(f) && !within(10)(f) && !teen(f) && !crosses(f) && !(f.op === "-" && f.y > 10) },
      { name: "Crossing 10", has: (f) => within(20)(f) && crosses(f) && !nearDouble(f) },
      // Doubles and near doubles (Doublet, 1.RA.B.1): 8 + 8, 16 − 8, 7 + 8, 15 − 7.
      { name: "Doubles and near doubles", has: (f) => within(20)(f) && crosses(f) && nearDouble(f) },
      // The equal sign (1.OA.D.7): true or false and fix it (the Equal Twins), balancing both
      // sides, and missing numbers (Quizard).
      { name: "The equal sign", has: any(hidden, inSet("The other side"), inSet("Balance both sides"), inTF("tf10", "tf20", "fix10", "fix20")) },
      // Comparing with < = > (Chompers, 1.NBT.B.3): to 10, sums, then two-digit numbers.
      { name: "Compare with < = >", has: any(inSet("Compare to 10"), inSet("Compare sums"), inSet("Compare to 100")) },
      { name: "Add and subtract tens", has: twoLevel("Add tens", "Subtract tens", "10 more", "10 less", "Add tens to a number") },
      // Two-digit plus one-digit, then two-digit plus two-digit (1.NBT.C.4), without regrouping and
      // then with it: moved here from the Mines' first levels (DESIGN.md §4.3, the Hall's step 9).
      // The same facts and keys, so what's learned here counts in the Mines, which keeps them for
      // 2nd grade's fluency within 100.
      { name: "Add two-digit numbers", has: twoLevel("Add ones", "Add tens and ones") },
      { name: "Add two-digit numbers, regrouping", has: twoLevel("Add and regroup") }
    ]
  },
  // The Crystal Mines: two-digit ± within 100, adding and subtracting mixed, then regrouping,
  // then place value to 1000 with base-ten blocks (Haberhasher), then 10 and 100 more or less
  // within 1000, then adding and subtracting within 1000 (2.NBT.B.7: adding without regrouping,
  // then with it, then subtracting the same way): the school's order (two-digit work, then
  // three-digit numbers, then three-digit work).
  second: {
    label: "2nd grade", grade: 2, hearts: 5, fluentMs: 6000, facts: () => twoDigitFacts().concat(pvFacts()),
    levels: [
      { name: "Add and subtract, no regrouping", has: twoLevel("Add ones", "Add tens and ones", "Subtract, no regrouping") },
      { name: "Add and subtract, regrouping", has: twoLevel("Add and regroup", "Subtract and regroup") },
      ...PV_GAME_LEVELS.map((l) => ({ name: l.name, has: (f) => f.op === "#" && l.sets.includes(f.set) })),
      { name: "10 and 100 more or less", has: twoLevel("10 more, 10 less to 1000", "100 more, 100 less") },
      { name: "Add within 1000", has: twoLevel("Add within 1000") },
      { name: "Add within 1000, regrouping", has: twoLevel("Add and regroup within 1000") },
      { name: "Subtract within 1000", has: twoLevel("Subtract within 1000") },
      { name: "Subtract within 1000, regrouping", has: twoLevel("Subtract and regroup within 1000") }
    ]
  },
  // The Tables Tower: × and ÷ only, in the school's order (all of × before ÷, confirmed by the
  // class), then the rest of 3rd grade, as its path goes.
  third: {
    label: "3rd grade", grade: 3, hearts: 5, fluentMs: 4000,
    facts: () => facts().concat(timesTens(), fractionFacts(), roundFacts(), rectFacts(), lineFacts(), fracCompareFacts()),
    levels: [
      { name: "× 0, 1, 2, 5 and 10", has: times([0, 1, 2, 5, 10]) },
      { name: "× 3, 4 and 6", has: times([3, 4, 6]) },
      { name: "× 7, 8 and 9", has: times([7, 8, 9]) },
      { name: "÷ 1, 2, 5 and 10", has: divide([1, 2, 5, 10]) },
      { name: "÷ 3, 4 and 6", has: divide([3, 4, 6]) },
      { name: "÷ 7, 8 and 9", has: divide([7, 8, 9]) },
      { name: "× tens", has: tens },
      { name: "Rounding", has: is("≈") },
      // Fractions (3.NF.A): on a number line first (where's the dot, how many equal parts;
      // Halfling), then equal fractions, with the line from 0 to 2 (past 1, and 4/4 = 1) as
      // whole numbers as fractions.
      { name: "Fractions on a number line", has: onLine("where", "parts") },
      { name: "Equal fractions", has: any(is("/"), onLine("past1")) },
      // Comparing fractions (3.NF.A.3d, a priority standard): Chompers visiting the Tower, and
      // Halfling, on the < = > keys. The Tower's only comparisons.
      { name: "Compare fractions", has: is("○") },
      { name: "Area and perimeter", has: is("▭") },
      { name: "× and ÷ 11 and 12", has: big }
    ]
  },
  // The Fraction Forge (DESIGN.md §4.4): 4th grade, in the order of the school's 4th grade guide:
  // numbers to a million (comparing, rounding, adding and subtracting), multiplying and dividing,
  // multi-step problems and factors, fractions, decimals, then geometry and measurement. Fixed
  // samples (fourth.js, angles.js); every answer a whole number, a remainder or a mixed number in
  // two slots. Its answers are long and worked in steps: fluent at 8 s (and a second a digit).
  fourth: {
    label: "4th grade", grade: 4, hearts: 5, fluentMs: 8000,
    facts: () => bigCompareFacts().concat(roundFacts4(), addSub4(), times10s(), timesOne(), timesTwo(), divideOne(), remFacts(), exprFacts(), factorFacts(),
      equivFacts4(), fracCompare4(), fracOpFacts(), fracTimesFacts(), decimalFacts(), decCompareFacts(), angleFacts(), shapeAngleFacts(), rect4Facts(), unitFacts(), primeFacts(), moneyFacts()),
    levels: [
      ["Compare to a million", "cmp1m"], ["Round to any place", "round4"], ["Add and subtract to a million", "addsub4"],
      ["× 10, 100 and 1000", "x10"], ["Multiply by one digit", "x1"], ["Two-digit × two-digit", "x2"],
      ["Divide by one digit", "div1"], ["Remainders", "rem"], ["Multi-step and variables", "expr"], ["Factors and multiples", "factors"], ["Prime or composite", "prime"],
      ["Equivalent fractions", "equiv4"], ["Compare fractions", "cmpfrac"], ["Add and subtract fractions", "fracops"], ["A fraction times a whole", "fractimes"],
      ["Tenths and hundredths", "dec"], ["Compare decimals", "cmpdec"],
      ["Angles", "angles"], ["Classify shapes", "classify"], ["Area and perimeter", "rect4"], ["Measurement", "units"], ["Money with a decimal point", "money4"]
    ].map(([name, set]) => ({ name, has: (f) => f.set === set }))
  },
  // Coins in the Cellar (K): find the coin, and what each is worth.
  coinsK: { label: "Coins", strand: true, hearts: 7, fluentMs: 5000, facts: coinFacts, levels: COIN_LEVELS.slice(0, 2) },
  // Coin values in the Hall (1st grade, 1.GM.C.9: each coin's worth): Trollar visits with the
  // Cellar's "each coin" (the same keys, so what was learned there counts here).
  coinsH: { label: "Coin values", strand: true, hearts: 7, fluentMs: 5000, facts: coinFacts, levels: [COIN_LEVELS[1]] },
  // Counting coins in the Mines (2nd grade; 1st grade's counting comes along).
  // Then dollars (2.GM.D.12): bills alone, then bills and coins, typed as dollars and cents.
  coins: { label: "Counting coins", strand: true, hearts: 5, fluentMs: 5000, facts: () => coinFacts().concat(dollarFacts()),
    levels: COIN_LEVELS.slice(2).map((l) => ({ name: l.name, has: (f) => f.op === "¢" && !f.find && !COIN_LEVELS[1].has(f) && l.has(f) }))
      .concat(DOLLAR_GAME_LEVELS.map((l) => ({ name: l.name, has: (f) => f.op === "$" && f.set === l.set }))) },
  // The dot flash (K.NS.B.8): Pipsqueak in the Cellar. How many dots at a glance, on dice and
  // five-frames to 3, then to 5, then dominoes and small groups; then his dice sums (3 + 5 as two
  // dice: the band's facts, the same keys, within 10), the numbers after the dots, as the K
  // guide's subitizing leads into adding. A strand (like which is more), so it doesn't hold up
  // the Cellar's 60% and nobody's open levels change; fluent at 5 s.
  flashK: { label: "Dot flash", strand: true, hearts: 7, fluentMs: 5000,
    facts: () => flashFacts().concat(facts().filter((f) => f.op === "+" && f.x >= 1 && f.x <= 6 && f.y >= 1 && f.y <= 6 && f.ans <= 10)),
    levels: FLASH_LEVELS.map((l) => ({ name: l.name, has: (f) => l.keys.includes(f.key) })).concat([{ name: "Dice sums", has: is("+") }]) },
  // Which is more (K): Chompers in the Cellar.
  more: { label: "Which is more", strand: true, hearts: 7, fluentMs: 4000, facts: moreFacts, levels: MORE_LEVELS },
  // Three numbers (1st grade): Triceraplus in the Hall, 4 + 3 + 6 with a ten to find. A second more
  // than the Hall's time, for reading three numbers.
  three: { label: "Three numbers", strand: true, hearts: 7, fluentMs: 5000, facts: threeFacts, levels: [{ name: "Three numbers", has: is("Σ") }] },
  // Comparing three-digit numbers (2nd grade, 2.NBT.A.4): Chompers in the Mines, "345 ○ 354".
  cmpM: { label: "Compare to 1000", strand: true, hearts: 5, fluentMs: 6000, facts: compare1000Facts, levels: [{ name: "Compare three-digit numbers", has: is("○") }] },
  // Adding up to four two-digit numbers (2nd grade, 2.NBT.B.7): Triceraplus visiting the Mines,
  // three numbers, then four. Reading and adding four numbers takes a while: 9 s.
  sumsM: { label: "Up to four numbers", strand: true, hearts: 5, fluentMs: 9000, facts: sumFacts, levels: SUM_LEVELS.map((l) => ({ name: l.name, has: (f) => f.op === "Σ" && f.set === l.n })) },
  // 3rd grade's fluency adding and subtracting within 1000 (3.NBT.A.2): Margot-Rythm visiting the
  // Tables Tower, which is otherwise × and ÷ only. The Mines' three-digit facts (the same keys,
  // so what was learned there counts here), adding, then subtracting.
  addT: { label: "Add and subtract to 1000", strand: true, hearts: 5, fluentMs: 6000, facts: twoDigitFacts,
    levels: [{ name: "Add within 1000", has: twoLevel("Add within 1000", "Add and regroup within 1000") }, { name: "Subtract within 1000", has: twoLevel("Subtract within 1000", "Subtract and regroup within 1000") }] },
  // Arrays (2nd grade): Squaresquatch in the Mines, rows of dots added as equal rows.
  arrays: { label: "Arrays", strand: true, hearts: 5, fluentMs: 6000, facts: arrayFacts, levels: ARRAY_LEVELS },
  // Telling time (Tick-Tockus, js/clock.js), a strand in each stratum it visits: hours and half
  // hours in the Hall (1st grade), 5 minutes in the Mines (2nd), the minute and elapsed time in
  // the Tower (3rd). Reading a clock takes longer than a sum, so a second or more extra.
  timeH: { label: "Time: hours", strand: true, hearts: 7, fluentMs: 6000, facts: clockFacts, levels: levelsOf(TIME_LEVELS, "hall") },
  timeM: { label: "Time: 5 minutes", strand: true, hearts: 5, fluentMs: 7000, facts: clockFacts, levels: levelsOf(TIME_LEVELS, "mines") },
  timeT: { label: "Time: minutes", strand: true, hearts: 5, fluentMs: 8000, facts: clockFacts, levels: levelsOf(TIME_LEVELS, "tower") },
  // What comes next (Slimelipsis, js/patterns.js): counting on and back in the Cellar (K), to 120
  // and by 5s in the Hall (1st), by 2s and 100s, what's missing, and odd and even in the Mines (2nd).
  patK: { label: "Patterns: count on", strand: true, hearts: 7, fluentMs: 5000, facts: patternFacts, levels: levelsOf(PATTERN_GAME_LEVELS, "cellar", ["ones", "back", "tens"]) },
  patH: { label: "Patterns: to 120", strand: true, hearts: 7, fluentMs: 5000, facts: patternFacts, levels: levelsOf(PATTERN_GAME_LEVELS, "hall") },
  // Patterns from a rule (4th grade, 4.RA.C): Slimelipsis visiting the Fraction Forge.
  patF: { label: "Patterns: rules", strand: true, hearts: 5, fluentMs: 6000, facts: patternFacts, levels: levelsOf(PATTERN_GAME_LEVELS, "forge") },
  patM: { label: "Patterns: skip counting", strand: true, hearts: 5, fluentMs: 6000, facts: patternFacts, levels: levelsOf(PATTERN_GAME_LEVELS, "mines", ["hundreds", "middle", "twos", "oddeven20", "oddeven100"]) },
  // Shapes (Polly-Gon, js/shapes.js), a strand in each stratum: drawing and naming circles,
  // squares, triangles, rectangles and hexagons, their sides and corners, in the Cellar (K);
  // sides and corners whatever the shape, then halves and fourths, in the Hall (1st); sides,
  // corners and a cube's faces, equal shares, and rows and columns of squares in the Mines (2nd);
  // quadrilaterals and unit fractions in the Tower (3rd, strict: its square and rectangle are told
  // apart more closely). Drawing a shape takes longer than tapping a number: 6 s (7 s in the
  // Mines, where the squares in all are counted by rows).
  shapesK: { label: "Shapes", strand: true, hearts: 7, fluentMs: 6000, facts: shapeFacts, levels: shapeLevels("shapesK") },
  shapesH: { label: "Shapes: halves and fourths", strand: true, hearts: 7, fluentMs: 6000, facts: shapeFacts, levels: shapeLevels("shapesH") },
  shapesM: { label: "Shapes: equal shares", strand: true, hearts: 5, fluentMs: 7000, facts: shapeFacts, levels: shapeLevels("shapesM") },
  shapesT: { label: "Shapes: quadrilaterals", strand: true, hearts: 5, fluentMs: 6000, strict: true, facts: shapeFacts, levels: shapeLevels("shapesT") }
};
// A shape strand's levels (shapes.js SHAPE_STRANDS), each holding its keys.
function shapeLevels(strand) { return SHAPE_STRANDS[strand].map((l) => ({ name: l.name, has: (f) => l.keys.includes(f.key) })); }
// What a drawn shape hits for (app.js; shapes.js): the strand's typical answer, the mean of its
// counting facts' answers (4 in the Cellar and the Hall, 6 in the Mines, 5 in the Tower), so a
// drawing is neither a weak nor a big hit and a fight lasts the same; a shape's sides would make a
// circle (none) a wasted turn and a hexagon worth twice a triangle.
const hitCache = {};
export function drawHit(bandKey) {
  if (hitCache[bandKey]) return hitCache[bandKey];
  const counts = pool(bandKey).filter((f) => !isDrawKey(f.key));
  return (hitCache[bandKey] = Math.max(1, Math.round(counts.reduce((t, f) => t + f.ans, 0) / (counts.length || 1))));
}
// A strand's levels from a module's level list (TIME_LEVELS, PATTERN_GAME_LEVELS): the ones for
// one stratum, each holding the facts of its set; in `order` (their ids) when the path takes them
// in another order than the list.
function levelsOf(list, stratum, order) {
  const ls = list.filter((l) => l.stratum === stratum);
  if (order) ls.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  return ls.map((l) => ({ name: l.name, has: (f) => f.set === l.id }));
}
// A tier counts as known for skipping ahead (frontier) at this share learned.
export const TIER_KNOWN = 0.7;
const BOX_MAX = 4;
// Review spacing by box: a box-3 fact comes back after 10 minutes, box 4 after a day.
const DUE_MS = { 3: 10 * 60e3, 4: 24 * 3600e3 };

// One key per fact. Turnarounds share a key for + and × (3 + 4 is 4 + 3); − and ÷ don't. Facts
// that carry a key of their own (coins, comparing, balancing, □ facts, fractions, rounding,
// rectangles) keep it.
export function keyOf(f) {
  if (f.key && !"+-×÷".includes(f.key[0])) return f.key;
  if (f.op === "+" || f.op === "×") return f.op + Math.min(f.x, f.y) + "," + Math.max(f.x, f.y);
  return f.op + f.x + "," + f.y;
}
// A problem for a key, turned around half the time for + and ×.
export function factOf(key, rnd) {
  const own = { "¢": coinFactOf, "○": balanceFactOf, "=": balanceFactOf, "□": hiddenFactOf, "M": moreFactOf, "/": fractionFactOf, "≈": roundFactOf, "▭": rectFactOf, "Σ": threeFactOf, "▦": arrayFactOf, "⌚": clockFactOf, "…": patternFactOf, "◐": oddEvenFactOf, "✓": tfFactOf, "✎": tfFactOf, "↔": lineFactOf, "#": pvFactOf, "$": dollarFactOf, "◇": shapeFactOf, "⁙": flashFactOf,
    "R": remFactOf, "E": exprFact, "F": factorFactOf, "ƒ": fracOpFact, "d": decFact, "u": unitFact, "∠": angleFact, "P": primeFactOf, "D": moneyFact }[key[0]];
  if (own) return own(key, rnd);
  const op = key[0], [a, b] = key.slice(1).split(",").map(Number);
  const flip = (op === "+" || op === "×") && (rnd || Math.random)() < 0.5;
  const x = flip ? b : a, y = flip ? a : b;
  const ans = { "+": x + y, "-": x - y, "×": x * y, "÷": x / y }[op];
  return { op, x, y, ans, q: x + " " + (op === "-" ? "−" : op) + " " + y, key };
}

// The band's facts, each once, with the first level that has it: [{ key, op, ans, level }].
const poolCache = {};
export function pool(bandKey) {
  if (poolCache[bandKey]) return poolCache[bandKey];
  const band = BANDS[bandKey], seen = {}, out = [];
  for (const f of (band.facts || facts)()) {
    const key = keyOf(f);
    if (seen[key]) continue;
    const level = band.levels.findIndex((l) => l.has(f));
    if (level < 0) continue;
    seen[key] = true;
    out.push({ key, op: f.op, ans: f.ans, level });
  }
  return (poolCache[bandKey] = out);
}

export function learned(rec) { return !!rec && rec.b >= 3; }
export function mastered(rec, fluentMs) { return !!rec && rec.b >= BOX_MAX && rec.ms > 0 && rec.ms < fluentMs; }

/* ---------- paths, the window and chapters (DESIGN.md §4.3) ----------
   A stratum's path (wings.js PATHS) is its steps in teaching order. A step is a few levels of
   bands or strands ({ parts: [[band, level]] }), so fact keys and records never change, with flags:
   priority (opens the next stratum), ongoing (open from the start and kept open: counting,
   comparing), review (an earlier grade's facts, mixed in as reviews, never new), and the chapter
   it's in. About WINDOW new steps are open at once; the next one joins when one of them (usually
   the oldest) is JOIN_AT learned. A step past the player's chapter never opens: chapters open by
   beating the mega bosses (wings.js). */
export const WINDOW = 3, JOIN_AT = 0.4;
// A step's facts, each key once: [{ key, op, ans, level, band }].
const stepCache = new WeakMap();
export function stepFacts(step) {
  if (stepCache.has(step)) return stepCache.get(step);
  const seen = new Set(), out = [];
  for (const [band, level] of step.parts) for (const f of pool(band)) if (f.level === level && !seen.has(f.key)) { seen.add(f.key); out.push(Object.assign({ band }, f)); }
  stepCache.set(step, out);
  return out;
}
// The share of a step's facts learned (box 3+).
export function stepShare(step, recs) {
  const fs = stepFacts(step);
  return fs.length ? fs.filter((f) => learned(recs[f.key])).length / fs.length : 1;
}
// The steps open to a player: { open: [step indexes], window: [the new steps, oldest first],
// joined: how many of the path's new steps have joined so far }.
// Ongoing and review steps are open from the start. The rest join in order, WINDOW at first; a
// step stops being new once it's JOIN_AT learned, and then the next one joins, so there are never
// more than WINDOW new ones (a step already learned, skipped ahead or placed, joins and is done at
// once). None past `chapter`. `had` (saved): the most that ever joined, so a step stays open after
// a miss takes a fact back out of learned.
export function openSteps(path, recs, chapter = 1, had = 0) {
  const open = [], joined = [], fresh = (i) => stepShare(path[i], recs) < JOIN_AT;
  path.forEach((s, i) => { if ((s.ongoing || s.review) && s.chapter <= chapter) open.push(i); });
  const main = path.map((_, i) => i).filter((i) => !path[i].ongoing && !path[i].review);
  let k = 0;
  while (k < main.length && path[main[k]].chapter <= chapter && (k < had || joined.filter(fresh).length < WINDOW)) { joined.push(main[k]); open.push(main[k]); k++; }
  return { open: open.sort((a, b) => a - b), window: joined.filter(fresh), joined: k };
}
// How many chapters a path has.
export const chaptersOf = (path) => Math.max(...path.map((s) => s.chapter));
// A band's levels open in these steps: { levels: [indexes], review: [the ones open only as a
// review step's, whose facts are never new] }.
export function openLevels(path, open, band) {
  const levels = new Set(), taught = new Set();
  for (const i of open) for (const [b, L] of path[i].parts) if (b === band) { levels.add(L); if (!path[i].review) taught.add(L); }
  return { levels: [...levels].sort((a, b) => a - b), review: [...levels].filter((L) => !taught.has(L)) };
}
// The last level of a band the player's chapter reaches (probes and skipping ahead go no further),
// or -1.
export function reachOf(path, chapter, band) {
  let top = -1;
  for (const s of path) if (s.chapter <= chapter) for (const [b, L] of s.parts) if (b === band) top = Math.max(top, L);
  return top;
}
// A path's review steps' facts from other bands than `band` (the Hall's review of the Cellar for a
// monster asking the Hall's band): choose's opts.reviews, asked only once seen.
export function reviewFacts(path, band) {
  const out = [];
  for (const s of path) if (s.review) for (const f of stepFacts(s)) if (f.band !== band) out.push(f);
  return out;
}
// Review steps for a player who never learned them (a 1st grader new to the game): they're never
// new, so they're placed by skipping ahead instead. When a fluent player skips ahead in the
// stratum's own band, the review steps below the path's first step count as known too (box 3,
// placed), and come back as reviews from then on; a miss sends one back to learning. Returns how
// many were placed.
export function placeReviews(path, recs, now, fluentMs) {
  let n = 0;
  for (const s of path) if (s.review) for (const f of stepFacts(s)) {
    if (recs[f.key] && recs[f.key].n) continue;
    recs[f.key] = { b: 3, n: 1, c: 1, ms: Math.round(fluentMs * 0.8), t: now, placed: 1 };
    n++;
  }
  return n;
}
/* ---------- the Legend boss (DESIGN.md §14.2) ----------
   Each stratum's last test: once its priority steps are mastered (wings.js legendReady), its boss
   comes back golden, and the fight is a final exam (examKey): every kind of problem the path asks,
   mixed, weighted to the facts that took the longest to learn, and no fact twice. */
// Mastered, for the Legend: the top box (4). Box 4 already takes right, unhinted answers spread
// over days (a box-3 fact is due again after 10 minutes, box 4 after a day), so a slow but sure
// player still gets there; mastered() above adds fluency, for the stars and achievements.
export const topBox = (rec) => !!rec && rec.b >= BOX_MAX;
// The exam's facts: every fact of the path's own steps (not the review steps, an earlier grade's),
// each key once, with its band and step (an index into the path). Drawn shapes are left out: a
// drawing needs a touch screen, and the exam's shapes are the counting ones.
const examCache = new WeakMap(), pathCache = new WeakMap();
export function examFacts(path) {
  if (examCache.has(path)) return examCache.get(path);
  const out = pathFacts(path).filter((f) => !isDrawKey(f.key));
  examCache.set(path, out);
  return out;
}
// Every fact of the path's own steps (not the review steps), each key once, with its band and
// step, drawn shapes included (Endless asks them on a touch screen, as any run does).
export function pathFacts(path) {
  if (pathCache.has(path)) return pathCache.get(path);
  const seen = new Set(), out = [];
  path.forEach((s, i) => { if (!s.review) for (const f of stepFacts(s)) if (!seen.has(f.key)) { seen.add(f.key); out.push(Object.assign({ step: i }, f)); } });
  pathCache.set(path, out);
  return out;
}
// How long a fact took to learn, from its record: its misses count most (each one sent it back
// to box 0), then answers past the first couple, then how slow it still is against its band's
// fluent time. 0 for a fact placed or known at once.
export function struggle(rec, fluentMs) {
  if (!rec || !rec.n) return 0;
  const misses = Math.max(0, rec.n - rec.c);
  return 2 * misses + 0.25 * Math.max(0, rec.n - 2) + (rec.ms > 0 ? Math.min(3, rec.ms / (fluentMs || 4000)) : 0);
}
// The exam's next fact: { key, band, step }, or null when there's none left. used: the keys asked
// already this fight (never again); steps: the steps asked so far, in order (the next comes from
// the steps asked least, so every kind comes round before any comes twice). Inside a step, a fact
// is picked with weight 0.2 + struggle², so the ones that took longest come up most. Facts never
// seen are left out while there are seen ones (it's an exam, not new learning; ?legend on a fresh
// player has none seen).
export function examKey(path, recs, opts = {}) {
  const rnd = opts.rnd || Math.random, used = new Set(opts.used || []), asked = opts.steps || [];
  const all = examFacts(path).filter((f) => !used.has(f.key) && (!opts.ok || opts.ok(f)));
  const seen = all.filter((f) => recs[f.key] && recs[f.key].n), list = seen.length ? seen : all;
  if (!list.length) return null;
  const w = (f) => { const s = struggle(recs[f.key], BANDS[f.band].fluentMs); return 0.2 + s * s; };
  const times = (i) => asked.filter((x) => x === i).length;
  const steps = [...new Set(list.map((f) => f.step))], least = Math.min(...steps.map(times));
  // Among the steps asked least, the one with the hardest facts more often (by its hardest).
  const pickFrom = (items, weight) => { let r = rnd() * items.reduce((t, x) => t + weight(x), 0); for (const x of items) { r -= weight(x); if (r < 0) return x; } return items[items.length - 1]; };
  // (Not the kind just asked, when there's another: a new round doesn't start with the last one.)
  // And not the same operation as the last problem when there's another (two steps can share
  // one: which is more to 5, then to 10).
  const lastKey = (opts.used || [])[(opts.used || []).length - 1], lastOp = lastKey != null ? (examFacts(path).find((f) => f.key === lastKey) || {}).op : null;
  const fresh = (fs) => { const o = fs.filter((f) => f.op !== lastOp); return o.length ? o : fs; };
  let top = steps.filter((i) => times(i) === least);
  if (top.length > 1) top = top.filter((i) => i !== asked[asked.length - 1]);
  const other = top.filter((i) => list.some((f) => f.step === i && f.op !== lastOp));
  if (other.length) top = other;
  const step = pickFrom(top, (i) => 1 + Math.max(...list.filter((f) => f.step === i).map(w)));
  const f = pickFrom(fresh(list.filter((x) => x.step === step)), w);
  return { key: f.key, band: f.band, step };
}

/* ---------- Endless (DESIGN.md §6.4) ----------
   A stratum whose Legend is beaten keeps going as normal runs, asking the facts already learned
   there so they stay sharp: the path's own facts the player has seen (a strand's for its
   monster), every kind mixed, weighted as the Legend's exam is (struggle) and to the ones due.
   No new facts and no probing or skipping ahead (app.js). A miss sends a fact to box 0 as
   always: it comes back as a retry (app.js), then as learning here, until it's learned again. */
// How much more often a fact that's come due is asked, and the share of problems for the facts
// that slipped back to learning (box 0–2) while there are any.
export const ENDLESS_DUE = 3, ENDLESS_LEARNING = 0.5;
// The next fact's key in Endless, or null when the monster has no seen fact of its kind here
// (app.js then falls back to choose). opts: { now, rnd, recent: [keys] (newest first), retry,
// asks, like, avoidAns, digit, digitShare, avoidDigitShare }, as for choose.
export function endlessKey(path, bandKey, recs, opts = {}) {
  if (opts.retry) return opts.retry;
  const rnd = opts.rnd || Math.random, now = opts.now || Date.now(), recent = opts.recent || [];
  const seen = (f) => recs[f.key] && recs[f.key].n;
  let list = pathFacts(path).filter((f) => f.band === bandKey && seen(f) && (!opts.asks || opts.asks(f.op, f.key)));
  if (!list.length) return null;
  list = notRecent(list, recent);
  const varied = list.filter((f) => !(opts.avoidAns || []).includes(f.op + " " + f.ans));
  if (varied.length) list = varied;
  if (opts.like) { const liked = list.filter((f) => opts.like(f.key)); if (liked.length && rnd() < 0.7) list = liked; }
  if (opts.digit != null && opts.digitShare && rnd() < opts.digitShare) { const mine = list.filter((f) => String(f.ans).includes(String(opts.digit))); if (mine.length) list = mine; }
  if (opts.digit != null && opts.avoidDigitShare && rnd() < opts.avoidDigitShare) { const other = list.filter((f) => !String(f.ans).includes(String(opts.digit))); if (other.length) list = other; }
  const pickFrom = (items, weight) => { let r = rnd() * items.reduce((t, x) => t + weight(x), 0); for (const x of items) { r -= weight(x); if (r < 0) return x; } return items[items.length - 1]; };
  // The ones a miss sent back to learning: half the problems while there are any, box 0 most.
  const learning = list.filter((f) => recs[f.key].b <= 2);
  if (learning.length && rnd() < ENDLESS_LEARNING) return pickFrom(learning, (f) => 3 - recs[f.key].b).key;
  // Every kind in turn: the step asked least among the recent problems (not the last one's step,
  // nor its operation, when there's another), the one with the hardest facts more often; inside
  // it, weight 0.2 + struggle², times ENDLESS_DUE for a fact that's come due.
  const due = (r) => r.b >= 3 && now - r.t >= (DUE_MS[Math.min(r.b, BOX_MAX)] || 0);
  const w = (f) => { const r = recs[f.key], s = struggle(r, BANDS[f.band].fluentMs); return (0.2 + s * s) * (due(r) ? ENDLESS_DUE : 1); };
  const stepOf = new Map(pathFacts(path).map((f) => [f.key, f]));
  const last = stepOf.get(recent[0]) || {}, times = (i) => recent.filter((k) => (stepOf.get(k) || {}).step === i).length;
  const steps = [...new Set(list.map((f) => f.step))], least = Math.min(...steps.map(times));
  let top = steps.filter((i) => times(i) === least);
  if (top.length > 1) top = top.filter((i) => i !== last.step);
  const other = top.filter((i) => list.some((f) => f.step === i && f.op !== last.op));
  if (other.length) top = other;
  const step = pickFrom(top, (i) => 1 + Math.max(...list.filter((f) => f.step === i).map(w)));
  let inStep = list.filter((f) => f.step === step);
  const otherOp = inStep.filter((f) => f.op !== last.op);
  if (otherOp.length) inStep = otherOp;
  return pickFrom(inStep, w).key;
}

// The Legend's HP floor: about one answer of every kind (the sum of each step's middle answer,
// of the facts the exam would ask), so one big answer (7 × 50) can't end the exam before it's
// started. app.js takes this, between a mega boss's HP and twice that.
export function examRound(path, recs) {
  const all = examFacts(path), seen = all.filter((f) => recs[f.key] && recs[f.key].n), list = seen.length ? seen : all;
  let sum = 0;
  for (const i of new Set(list.map((f) => f.step))) {
    const a = list.filter((f) => f.step === i && typeof f.ans === "number").map((f) => f.ans).sort((x, y) => x - y);
    if (a.length) sum += a[a.length >> 1];
  }
  return sum;
}

// Every band a path asks.
export const pathBands = (path) => [...new Set(path.flatMap((s) => s.parts.map(([b]) => b)))];
const allLevels = (bandKey) => BANDS[bandKey].levels.map((_, i) => i);

// How much help a fact gets (DESIGN.md §5.3): "show" the model automatically for a new fact,
// a hint "button" while learning, "none" once it's in review.
export function helpFor(rec) {
  if (!rec || !rec.n) return "show";
  return rec.b <= 2 ? "button" : "none";
}

// After an answer. ok: right; ms: time taken; hinted: a hint was open.
// Placement: a fact seen for the first time and answered right, fast and without a hint is one
// the player already knows, so it goes straight to learned (box 3). A fluent player isn't held
// back by facts they know; facts they don't still get the whole climb.
export function record(rec, { ok, ms, hinted, now, fluentMs }) {
  const first = !rec || !rec.n;
  const r = Object.assign({ b: 0, n: 0, c: 0, ms: 0, t: 0 }, rec);
  r.n++; r.t = now;
  if (!ok) { r.b = 0; return r; }
  r.c++;
  if (hinted) return r;
  r.ms = r.ms ? Math.round(r.ms * 0.7 + ms * 0.3) : Math.round(ms);
  if (first && ms < fluentMs) { r.b = 3; return r; }
  r.b = Math.min(BOX_MAX, r.b + (r.b >= 1 && ms < fluentMs ? 2 : 1));
  return r;
}

/* ---------- skipping ahead (fluent players) ----------
   Each band's facts, easiest first, are cut into tiers of about TIER facts that stay inside a
   level. While a player answers fluently, app.js asks a probe from a tier above the first one
   not yet learned (the frontier); SKIP_PROBES fluent probes out of the last SKIP_WINDOW count
   everything below the probe's tier as known (skipTo). The leap grows: probes start one tier
   above the frontier, and each skip in a row doubles how far up they come from (1, 2, 4 tiers,
   up to MAX_LEAP), so a fluent player climbs fast; a slipped window drops it back to 1. The levels go in teaching order, so fluency on a harder tier means the easier ones
   are known. Skipped facts still come back as reviews, and a miss sends them back to learning. */
export const TIER = 20;
// Skipping needs SKIP_PROBES fluent probes out of the last SKIP_WINDOW, so one mis-tap or slow
// answer doesn't undo it; tuned so a fluent player opens the next strata in about five runs
// (scripts/balance-sim.mjs).
export const SKIP_PROBES = 5, SKIP_WINDOW = 6, MAX_LEAP = 4;
// How long a fluent answer may take: the band's time for thinking and one tap, plus a second
// for each extra digit to tap. A two-digit answer gets 4 s in Sprout.
export function fluentTime(bandMs, answer) { return bandMs + 1000 * Math.max(0, String(answer).length - 1); }
// How hard a fact is inside its level: its answer, and a bit more for crossing ten.
function hardness(f) {
  if (!"+-×÷".includes(f.key[0])) return f.ans;
  const [a, b] = String(f.key).slice(1).split(",").map((n) => parseInt(n, 10));
  if (f.op === "+" && a < 10 && b < 10 && a + b > 10) return f.ans + 6;
  if (f.op === "-" && a > 10 && b % 10 > a % 10) return a + 6;
  if (f.op === "÷") return a;
  return f.ans;
}
const tierCache = {};
export function tiers(bandKey) {
  if (tierCache[bandKey]) return tierCache[bandKey];
  const p = pool(bandKey), out = [];
  for (const L of [...new Set(p.map((f) => f.level))].sort((x, y) => x - y)) {
    const fs = p.filter((f) => f.level === L).sort((x, y) => hardness(x) - hardness(y) || (x.key < y.key ? -1 : 1));
    const n = Math.max(1, Math.round(fs.length / TIER));
    for (let i = 0; i < n; i++) out.push(fs.slice(Math.floor(i * fs.length / n), Math.floor((i + 1) * fs.length / n)).map((f) => f.key));
  }
  return (tierCache[bandKey] = out);
}
export const tierOf = (bandKey, key) => tiers(bandKey).findIndex((t) => t.includes(key));
// The first tier not yet mostly learned (TIER_KNOWN of it).
export function frontier(bandKey, recs) {
  const t = tiers(bandKey);
  for (let i = 0; i < t.length; i++) if (t[i].filter((k) => learned(recs[k])).length / t[i].length < TIER_KNOWN) return i;
  return t.length;
}
// How many tiers lie in levels up to `reach` (all of them when it isn't given).
function tiersTo(bandKey, reach) {
  const t = tiers(bandKey);
  if (reach == null) return t.length;
  const lv = (k) => pool(bandKey).find((f) => f.key === k).level;
  let n = 0;
  while (n < t.length && lv(t[n][0]) <= reach) n++;
  return n;
}
// A probe: a fact not learned yet from `leap` tiers above the frontier (1 by default; the top
// tier at most), or null when there's none.
// asks: the kinds of problem the monster asks (traits.js asks), as a test on a fact's operation
// and key.
// How many of the last problems a fight keeps out of the way (app.js G.recent), so the same
// problem doesn't come back within a fight while there are others to ask. A missed fact still
// comes back on purpose (retry). When a monster asks only a few (Doublet's doubles), fewer are
// kept out: the last 3, then none (notRecent).
export const RECENT = 12;
// The ones not among the recent keys: all the recent ones if that leaves any, else not the last
// 3, else anything.
export function notRecent(list, recent, keyOf = (f) => f.key) {
  for (const n of [(recent || []).length, 3, 0]) {
    const r = (recent || []).slice(0, n), left = list.filter((f) => !r.includes(keyOf(f)));
    if (left.length) return left;
  }
  return list;
}
// reach: the last level the player's chapter reaches (reachOf): probes go no further, so skipping
// ahead runs a fluent player along the path, but not past a mega boss.
export function probeKey(bandKey, recs, rnd, recent, avoidAns, leap, asks, reach) {
  const t = tiers(bandKey), fr = frontier(bandKey, recs), n = tiersTo(bandKey, reach);
  if (fr + 1 >= n) return null;
  const i = Math.min(n - 1, fr + Math.max(1, leap || 1));
  const factAt = (k) => pool(bandKey).find((x) => x.key === k) || {};
  const ansOf = (k) => { const f = factAt(k); return f.op + " " + f.ans; };
  let fresh = notRecent(t[i].filter((k) => !learned(recs[k]) && (!asks || asks(factAt(k).op, k))), recent, (k) => k);
  const varied = fresh.filter((k) => !(avoidAns || []).includes(ansOf(k)));
  if (varied.length) fresh = varied;
  return fresh.length ? fresh[Math.floor((rnd || Math.random)() * fresh.length)] : null;
}
// Counts every fact in the tiers below `upto` as known (box 3, placed). Returns how many.
export function skipTo(bandKey, recs, upto, now, fluentMs) {
  const t = tiers(bandKey);
  let n = 0;
  for (let i = 0; i < upto; i++) for (const k of t[i]) {
    if (learned(recs[k])) continue;
    recs[k] = { b: 3, n: 1, c: 1, ms: Math.round(fluentMs * 0.8), t: now, placed: 1 };
    n++;
  }
  return n;
}

// The next fact's key. opts: { now, rnd, recent: [keys] (not again so soon), retry: key due now
// or null, asks: a test on a fact (its operation and key) for the kinds of problem the monster asks at all
// (traits.js asks: Chompers only compares), op: the monster's operation, preferred 70% of the
// time when it has facts here, like: a test on a key for facts the monster asks more often (a
// trait), also 70%; open: the band's open levels (openLevels, every level when not given);
// review: those of them open only as reviews (never new); reviews: facts from other bands'
// review steps (stepFacts: the Hall's review of the Cellar), asked only once seen }.
// About 60% learning facts (seen, box 0–2, weighted to box 0 and the longest unseen), 25%
// review facts that are due, 15% new ones (from the first open level that has any).
export function choose(bandKey, recs, opts) {
  const rnd = opts.rnd || Math.random, now = opts.now, recent = opts.recent || [];
  if (opts.retry) return opts.retry;
  const seen = (f) => recs[f.key] && recs[f.key].n;
  const extra = (opts.reviews || []).filter((f) => seen(f) && (!opts.asks || opts.asks(f.op, f.key)));
  let open = notRecent(asked(bandKey, recs, opts.open, opts.asks, opts.review).concat(extra), recent);
  // Not the same kind of problem with the same answer as the last couple (opts.avoidAns, as
  // "op ans" like "- 10"), when there's anything else: the teen subtraction facts (17 − 7,
  // 15 − 5, 12 − 2) all equal 10 and came up in a row. A different kind (3 + 7) is fine.
  const varied = open.filter((f) => !(opts.avoidAns || []).includes(f.op + " " + f.ans));
  if (varied.length) open = varied;
  // New facts come from everything open when the monster's own operation has none left, so a
  // new level of another kind (fractions, under Timesaur) still arrives.
  const allFresh = open.filter((f) => !recs[f.key] || !recs[f.key].n);
  if (opts.op) {
    const mine = open.filter((f) => f.op === opts.op);
    if (mine.length && rnd() < 0.7) open = mine;
  }
  if (opts.like) {
    const liked = open.filter((f) => opts.like(f.key));
    if (liked.length && rnd() < 0.7) open = liked;
  }
  // The captain's digit (opts.digit), now and then (opts.digitShare): answers with it, when there
  // are any, so the hero's power hits (and their first Hero Moment) come early at depth 1. It only
  // narrows which facts are open; the learning, review and new shares below are unchanged.
  if (opts.digit != null && opts.digitShare && rnd() < opts.digitShare) {
    const mine = open.filter((f) => String(f.ans).includes(String(opts.digit)));
    if (mine.length) open = mine;
  }
  // Or the other way (opts.avoidDigitShare): answers without it, when there are any. The first
  // fight uses this, since it has no Hero Moments: the captain's digit is saved for the fight
  // after, where its first answer is the captain's first moment.
  if (opts.digit != null && opts.avoidDigitShare && rnd() < opts.avoidDigitShare) {
    const other = open.filter((f) => !String(f.ans).includes(String(opts.digit)));
    if (other.length) open = other;
  }
  let fresh = open.filter((f) => !recs[f.key] || !recs[f.key].n);
  if (!fresh.length) fresh = allFresh;
  const learning = open.filter((f) => recs[f.key] && recs[f.key].n && recs[f.key].b <= 2);
  const due = open.filter((f) => { const r = recs[f.key]; return r && r.b >= 3 && now - r.t >= DUE_MS[r.b]; });
  // Deeper in a Wing (opts.depth), more of the newest problems: 15% at depth 1, up to 35%.
  const freshShare = 0.15 + Math.min(0.2, 0.05 * ((opts.depth || 1) - 1));
  const groups = [[learning, 0.6], [due, 0.25], [fresh, freshShare]].filter(([g]) => g.length);
  if (!groups.length) return open[Math.floor(rnd() * open.length)].key; // all learned and not due: anything open
  let roll = rnd() * groups.reduce((s, [, w]) => s + w, 0), pick = groups[0][0];
  for (const [g, w] of groups) { if (roll < w) { pick = g; break; } roll -= w; }
  if (pick === fresh) {
    // From the first level that has new ones: a step's levels, and the window's steps in one band,
    // arrive in the path's order (the variety comes from the monsters, each asking its own kind).
    const first = Math.min(...fresh.map((f) => f.level));
    const top = fresh.filter((f) => f.level === first);
    return top[Math.floor(rnd() * top.length)].key;
  }
  if (pick === learning) {
    // Weighted: box 0 counts 3, box 1 counts 2, box 2 counts 1; then the longest unseen.
    // A little randomness keeps equal facts from always coming in the same order.
    const w = learning.map((f) => ({ f, w: 3 - recs[f.key].b + rnd() * 0.5 }));
    w.sort((a, b) => b.w - a.w || recs[a.f.key].t - recs[b.f.key].t);
    return w[Math.floor(rnd() * Math.min(3, w.length))].f.key;
  }
  due.sort((a, b) => recs[a.key].t - recs[b.key].t);
  return due[0].key;
}

// A fact for a spell (app.js): learned, with a one-digit answer, from the open levels and not
// one of the last few; the monster's operation preferred. Null when there's none.
export function spellKey(bandKey, recs, opts) {
  // Spells are a treat, not practice: never one that's come up lately (the fight's recent
  // problems, and opts.spells, the last few spells across runs). With nothing else left, no
  // spell: a stratum with few one-digit answers (the Mines' 76 − 73) kept casting the same one.
  const rnd = opts.rnd || Math.random, skip = (opts.recent || []).concat(opts.spells || []);
  let ok = asked(bandKey, recs, opts.open, opts.asks, opts.review).filter((f) => "+-×÷".includes(f.key[0]) && f.ans >= 0 && f.ans <= 9 && learned(recs[f.key]) && !skip.includes(f.key));
  const varied = ok.filter((f) => !(opts.avoidAns || []).includes(f.op + " " + f.ans));
  if (varied.length) ok = varied;
  // The monster's operation, when that still leaves a few to vary between.
  const mine = ok.filter((f) => f.op === opts.op);
  if (mine.length >= 3) ok = mine;
  return ok.length ? ok[Math.floor(rnd() * ok.length)].key : null;
}

// Monster HP (DESIGN.md §5.5): the average answer of what this player is actually being asked
// (the open levels, with the monster's operation preferred) × its hits. app.js scales it by depth.
// A few big answers (rounding to 100, 7 × 90) would make every fight long, so each answer counts
// at most 3 times the middle one. levels: the band's open levels (openLevels; all when not given).
export function monsterHP(m, bandKey, recs, levels) {
  return hpOf(m, asked(bandKey, recs, levels, asksOf(m)), bandKey);
}
// The HP from the facts a monster asks (open: [{ key, op, ans }]).
export function hpOf(m, open, bandKey) {
  return Math.max(10, Math.round(typicalHit(m, open, bandKey) * m.hits));
}
// What a hit on this monster is worth, typically: the average of what it asks (open), each answer
// counted at most 3 times the middle one, its operation weighted 70%. Monster HP is this × its
// hits; the Super Charge (charge.js) puts each problem's hit on this scale.
export function typicalHit(m, open, bandKey) {
  const mine = open.filter((f) => f.op === m.op), val = hitValue(m, bandKey);
  const avg = (fs) => { const v = fs.map(val).sort((a, b) => a - b), cap = Math.max(10, 3 * v[v.length >> 1]); return v.reduce((s, x) => s + Math.min(x, cap), 0) / v.length; };
  return mine.length ? avg(mine) * 0.7 + avg(open) * 0.3 : avg(open);
}
// What a fact hits this monster for. A monster that hides a number (m.blank, Quizard) is hit by
// the hidden number: on average, the mean of the fact's two numbers. A drawn shape hits for its
// strand's typical answer (drawHit).
function hitValue(m, bandKey) {
  return (f) => { if (isDrawKey(f.key)) return drawHit(bandKey); if (!m.blank || !"+-×÷".includes(f.key[0])) return f.ans; const [a, b] = f.key.slice(1).split(",").map(Number); return (a + b) / 2; };
}
// The floor's typical hit (typicalHit) from the open levels, as monsterHP counts it.
export function floorTypical(m, bandKey, recs, levels) {
  return typicalHit(m, asked(bandKey, recs, levels, asksOf(m)), bandKey);
}
// A problem's level's typical hit: the median of what its level's facts hit this monster for (a
// strand's level: that kind's), in the band asking it (or, for a review from another band, the
// first band that has the key). Never this problem's own answer, so the Super Charge it sets
// (charge.js) shows nothing about the answer that the problem itself doesn't. Null for an unknown key.
const levelMemo = {}, keyIndex = {};
export function levelTypical(bandKey, key, m) {
  const find = (b) => { if (!keyIndex[b]) keyIndex[b] = new Map(pool(b).map((x) => [x.key, x])); return keyIndex[b].get(key); };
  const band = [bandKey].concat(Object.keys(BANDS)).find((b) => BANDS[b] && find(b));
  if (!band) return null;
  const f = find(band), blank = !!(m && m.blank), id = [band, f.level, blank].join("|");
  if (id in levelMemo) return levelMemo[id];
  const val = hitValue({ blank }, band), v = pool(band).filter((x) => x.level === f.level).map(val).sort((a, b) => a - b);
  const mid = v.length % 2 ? v[v.length >> 1] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
  return (levelMemo[id] = Math.max(1, mid));
}
// The facts open to a monster: the open levels' facts of the kinds it asks (a review level's only
// once seen: never new). With none open (a monster put on a floor for testing, ?monster=), its
// kind from the lowest level that has it; with none at all, everything open.
export const REVIEW_MIN = 8;
function asked(bandKey, recs, levels, asks, review) {
  const lv = new Set(levels || allLevels(bandKey)), rv = new Set(review || []);
  const inLv = pool(bandKey).filter((f) => lv.has(f.level)), seen = (f) => recs[f.key] && recs[f.key].n;
  // A review level asks only facts already seen, unless fewer than REVIEW_MIN of them have been:
  // then the rest of it too, so a review with one learned fact (a 3rd grader's adding within 1000)
  // practises the level instead of asking that one fact over and over.
  const thin = inLv.filter((f) => rv.has(f.level) && seen(f)).length < REVIEW_MIN;
  let open = inLv.filter((f) => !rv.has(f.level) || thin || seen(f));
  if (!open.length) open = pool(bandKey).filter((f) => lv.has(f.level));
  if (!open.length) open = pool(bandKey).filter((f) => f.level === 0);
  if (!asks) return open;
  const mine = open.filter((f) => asks(f.op, f.key));
  if (mine.length) return mine;
  const kind = pool(bandKey).filter((f) => asks(f.op, f.key));
  if (!kind.length) return open;
  const low = Math.min(...kind.map((f) => f.level));
  return kind.filter((f) => f.level === low);
}
