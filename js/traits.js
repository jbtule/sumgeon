// Monster traits (DESIGN.md §3): one simple rule each that changes how you do the math, never
// anything unfair, shown as a badge on the nameplate and explained in five words or so. No DOM:
// runs in Node for the tests. Plusquito, the tutorial monster, has none, and nor does Polly-Gon.

// A monster's kind: its own name, or for a look (monsters.js LOOKS) the monster it's a look of.
const kind = (m) => m.base || m.n;

export const TRAITS = {
  "Minustaur": { icon: "⚡", name: "Charge", text: "Every 4th problem is charged: a miss costs 2 hearts" },
  "Timesaur": { icon: "🛡️", name: "Armor", text: "Hits under 10 do half damage" },
  "Divvy": { icon: "✂️", name: "Split", text: "Splits in two at half HP" },
  "Quizard": { icon: "❓", name: "Mystery", text: "Hides a number: find the one that's missing" },
  "Trollar": { icon: "🪙", name: "Toll", text: "Pays in coins and bills: count up" },
  "Haberhasher": { icon: "🔢", name: "Tens and ones", text: "Sums to 1000 and place value" },
  "Chompers": { icon: "🐊", name: "Big Bite", text: "Eats the bigger number: that's your hit" },
  "Equal Twins": { icon: "⚖️", name: "Balance", text: "Both sides must match" },
  "Judo Judy": { icon: "🥋", name: "Flip", text: "Flips your sums: same answer" },
  "Starbot": { icon: "⭐", name: "Stripes", text: "Loves the ×5 and ×10 tables" },
  "Make-Ten Golem": { icon: "🔟", name: "Ten Smash", text: "Answers of 10 or more smash it for double" },
  "Sigma Rex": { icon: "👑", name: "Second wind", text: "Armors up at half HP" },
  // A stand-in until the Crystal Mines' boss is drawn (DESIGN.md §4.1, build step 3).
  "The Centipede": { icon: "💯", name: "Hundred Legs", text: "Answers of 100 or more hit double" },
  // The grade strata's new monsters (DESIGN.md §4.1, M5 step 3).
  // Each fits on one line with its icon and name under the monster on an iPhone (about 36 letters).
  "Pipsqueak": { icon: "🎲", name: "Flash", text: "Dots that flash, dice that add" },
  "Doublet": { icon: "👯", name: "Doubles", text: "Only doubles: 8 + 8, 16 − 8" },
  "Triceraplus": { icon: "🦕", name: "Three horns", text: "Add three: find a ten" },
  "Margot-Rythm": { icon: "🔁", name: "Carry the One", text: "Regroup: double hit" },
  "Squaresquatch": { icon: "🟩", name: "Arrays", text: "Add up the equal rows" },
  "Halfling": { icon: "½", name: "Halves", text: "Fractions on a line, equal, compared" },
  // Batch 1 of the strands (time and patterns): each asks only its own strand.
  "Tick-Tockus": { icon: "🕒", name: "Tick Tock", text: "Asks the time" },
  "Slimelipsis": { icon: "🫧", name: "What's Next", text: "Counts in patterns" }
  // Polly-Gon (shapes) has none: it only squawks the shape it wants (app.js pollySquawk).
};

// A fact key's two numbers: "+3,8" and "□+7,7" (7 + □ = 14) give [3, 8] and [7, 7].
const numsOf = (key) => String(key || "").replace(/^□/, "").slice(1).split(",").map(Number);
// A double (8 + 8, 7 + □ = 14) or taking half away (16 − 8, 12 − □ = 6), for Doublet.
export function isDouble(op, key) {
  const [a, b] = numsOf(key);
  if (!(a > 0) || !"+-".includes(String(key).replace(/^□/, "")[0])) return false;
  return (op === "+" && a === b) || (op === "-" && a === 2 * b);
}
// Two numbers that could be dice (1 to 6) being added (3 + 5), for Pipsqueak: "+3,5".
export const isDice = (op, key) => op === "+" && /^\+[1-6],[1-6]$/.test(String(key));

// The kinds of problem a monster asks at all, as a test on a fact's operation and key: the
// comparing monsters only compare (and the Equal Twins only balance), and the others never do,
// since a < = > problem is no use to Plusquito. Quizard asks balancing too: it's a missing number.
// The specialists ask only their own: Pipsqueak dice sums, Doublet doubles, Triceraplus three
// numbers (Σ, its strand in the Hall), Halfling fractions. No one else adds three numbers.
export function asks(m) {
  const k = kind(m);
  if (k === "Chompers") return (op) => op === "○" || op === "more";
  // The Equal Twins balance, and say whether an equation is true (and fix a false one).
  if (k === "Equal Twins") return (op) => op === "=" || op === "✓" || op === "✎";
  // Judo Judy, the Hall's boss, asks the Hall's whole mix: adding (and flipping it), taking
  // away, comparing, balancing and missing numbers.
  if (k === "Judo Judy") return () => true;
  // Pipsqueak: the dot flash (how many at a glance, ⁙) and dice sums, its strand in the Cellar.
  if (k === "Pipsqueak") return (op, key) => op === "⁙" || isDice(op, key);
  if (k === "Doublet") return isDouble;
  if (k === "Triceraplus") return (op) => op === "Σ";
  // Halfling: fractions, on the number line too, and comparing them (the Tower's only comparisons).
  if (k === "Halfling") return (op) => op === "/" || op === "↔" || op === "○";
  // Margot-Rythm (Carry the One, always stacked) asks only the Mines' sums and differences, not
  // its place value.
  if (k === "Margot-Rythm") return (op) => op === "+" || op === "-";
  // Tick-Tockus tells time, Slimelipsis counts in patterns (and odd and even): their strands'.
  if (k === "Tick-Tockus") return (op) => op === "⌚";
  if (k === "Slimelipsis") return (op) => op === "…" || op === "◐";
  // Polly-Gon: shapes, drawn and counted (its strand in each stratum).
  if (k === "Polly-Gon") return (op) => op === "◇";
  // True or false and fix it are the Equal Twins' (and Judo Judy's, who asks the Hall's whole mix).
  if (k === "Quizard") return (op) => !"○Σ⌚…◐✓✎◇⁙".includes(op);
  return (op) => !"○=Σ⌚…◐✓✎◇⁙".includes(op);
}

// A monster's trait, or null. Cursed digits have Lucky Number (DESIGN.md §6.6). A boss's forms
// (monsters.js bossForm) keep the boss's own; a mega boss adds its second, trait2.
export function traitOf(m) {
  if (m.cursed != null) return { icon: "🍀", name: "Lucky Number", text: `Answers with a ${m.cursed} hit double` };
  return TRAITS[kind(m)] || null;
}
// A mega boss (DESIGN.md §4.3, §14.2), whose second trait (m.trait2) is on: each one's rule below.
//   Mega-Ten Golem, 👑 Second wind: armors up at half HP, as Sigma Rex does (hits under 10 do half).
//   Mega Judy, ⚡ Black Belt: every 4th problem is a big throw, a miss costs 2 hearts (as
//     Minustaur's charge).
//   The Megapede, 🐛 Curl Up: at half HP it curls into a ring, and hits under 20 do half damage.
//   Mega Sigma Rex, 🥋 Flip: flips times facts (3 × 8 is thrown to show 8 × 3), as Judo Judy flips
//     sums.
// The Legend (DESIGN.md §14.2) fights with the same second trait.
export const mega = (m) => !!m && (m.form === "mega" || m.form === "legend") && !!m.trait2;

// Flip (Judo Judy): an addition of two numbers with the smaller first (3 + 8) is thrown, so it
// shows the bigger first (8 + 3). The turnaround has the same answer and the same fact record
// (learn.js keyOf: turnarounds share a key). Returns the flipped problem, or null for anything
// else: doubles, a hidden number (□), comparing, balancing, taking away.
// Mega Sigma Rex flips times facts the same way (3 × 8 shows 8 × 3).
export function flipOf(m, p) {
  const op = kind(m) === "Judo Judy" ? "+" : kind(m) === "Sigma Rex" && mega(m) ? "×" : null;
  if (!op || !p || p.op !== op || p.blank || p.sym || p.fact) return null;
  if (!Number.isInteger(p.x) || !Number.isInteger(p.y) || p.x >= p.y) return null;
  return Object.assign({}, p, { x: p.y, y: p.x, q: p.y + " " + op + " " + p.x, flipped: true });
}

// Flash (Pipsqueak): a sum of two dice-sized numbers (3 + 5) comes as two dice, which turn into
// the numbers after FLASH_MS (app.js). Returns the problem marked dice, or null.
export const FLASH_MS = 2500;
export function flashOf(m, p) {
  if (kind(m) !== "Pipsqueak" || !p || p.op !== "+" || p.blank || p.sym || p.fact) return null;
  if (!(p.x >= 1 && p.x <= 6 && p.y >= 1 && p.y <= 6)) return null;
  return Object.assign({}, p, { dice: true });
}
// A die showing n (1 to 6): a white rounded square with its pips, as an inline SVG string.
const PIPS = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] };
export function dieSvg(n) {
  const pips = (PIPS[n] || []).map(([c, r]) => `<circle cx="${12 + c * 13}" cy="${12 + r * 13}" r="4.6" fill="#0c171c"/>`).join("");
  return `<svg class="die" viewBox="0 0 50 50" role="img" aria-label="${n}"><rect x="2" y="2" width="46" height="46" rx="9" fill="#f6f3ea" stroke="#0c171c" stroke-width="3"/>${pips}</svg>`;
}

// Whether this problem is charged (Minustaur; Mega Judy's big throw, ⚡ Black Belt): every 4th on
// the floor, a miss costing 2 hearts. n counts from 0.
export function charged(m, n) { return (kind(m) === "Minustaur" || (kind(m) === "Judo Judy" && mega(m))) && n % 4 === 3; }

// Facts a monster asks more often (Starbot: anything with a 5 or 10), as a test on a fact key.
export function prefers(m) {
  if (kind(m) !== "Starbot") return null;
  return (key) => { const [a, b] = key.slice(1).split(",").map(Number); return [a, b].some((n) => n === 5 || n === 10); };
}

// Whether a sum or difference needs regrouping in any place (27 + 15 carries a ten; 52 − 28
// breaks one; 395 + 10 carries into the hundreds): the digits don't simply add or take away.
const digitSum = (n) => String(n).split("").reduce((t, d) => t + Number(d), 0);
export function regroups(p) {
  if (!p || !Number.isInteger(p.x) || !Number.isInteger(p.y) || p.x < 0 || p.y < 0) return false;
  if (p.op === "+") return digitSum(p.x) + digitSum(p.y) !== digitSum(p.x + p.y);
  if (p.op === "-") return p.x >= p.y && digitSum(p.x - p.y) + digitSum(p.y) !== digitSum(p.x);
  return false;
}

// How a hit lands. ans: the answer; typed: what was typed; low: the monster is at half HP or less;
// p: the problem (Margot-Rythm looks at its numbers).
// Returns { mult, note } where note says why, for the message under the monster.
// A boss in any of its forms (powering up, mega) keeps its trait; a mega boss adds its second.
export function hitBy(m, ans, typed, low, p) {
  const k = kind(m);
  if (m.cursed != null && String(typed).includes(String(m.cursed))) return { mult: 2, note: `Lucky ${m.cursed}! Double damage` };
  if (k === "Make-Ten Golem" && ans >= 10) return { mult: 2, note: "Ten Smash! Double damage" };
  if (k === "The Centipede" && ans >= 100) return { mult: 2, note: "Hundred Legs! Double damage" };
  if (k === "Margot-Rythm" && regroups(p)) return { mult: 2, note: "Regrouped! Double damage" };
  if (k === "Timesaur" && ans < 10) return { mult: 0.5, note: "Armor! Half damage" };
  if ((k === "Sigma Rex" || (k === "Make-Ten Golem" && mega(m))) && low && ans < 10) return { mult: 0.5, note: "Armor! Half damage" };
  if (k === "The Centipede" && mega(m) && low && ans < 20) return { mult: 0.5, note: "Curled up! Half damage" };
  return { mult: 1, note: "" };
}

// What happens the first time a monster drops to half HP: a note, and whether its art splits.
export function atHalf(m) {
  if (kind(m) === "Divvy") return { note: m.n + " splits in two!", split: true };
  if (kind(m) === "Sigma Rex" || (kind(m) === "Make-Ten Golem" && mega(m))) return { note: m.n + " gets a second wind! Armor up.", split: false };
  if (kind(m) === "The Centipede" && mega(m)) return { note: m.n + " curls up! Hits under 20 do half damage.", split: false, curl: true };
  return null;
}
