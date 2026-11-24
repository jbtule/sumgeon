// Monster traits (DESIGN.md §3): one simple rule each that changes how you do the math, never
// anything unfair, shown as a badge on the nameplate and explained in five words or so. No DOM:
// runs in Node for the tests. Plusquito, the tutorial monster, has none.

export const TRAITS = {
  "Minustaur": { icon: "⚡", name: "Charge", text: "Every 4th problem is charged: a miss costs 2 hearts" },
  "Timesaur": { icon: "🛡️", name: "Armor", text: "Hits under 10 do half damage" },
  "Divvy": { icon: "✂️", name: "Split", text: "Splits in two at half HP" },
  "Starbot": { icon: "⭐", name: "Stripes", text: "Loves the ×5 and ×10 tables" },
  "Make-Ten Golem": { icon: "🧱", name: "Crack", text: "Answers of 10 or more hit double" },
  "Sigma Rex": { icon: "👑", name: "Second wind", text: "Armors up at half HP" }
};

// A monster's trait, or null. Cursed digits have Lucky Number (DESIGN.md §6.6).
export function traitOf(m) {
  if (m.cursed != null) return { icon: "🍀", name: "Lucky Number", text: `Answers with a ${m.cursed} hit double` };
  return TRAITS[m.n] || null;
}

// Whether this problem is charged (Minustaur): every 4th on the floor. n counts from 0.
export function charged(m, n) { return m.n === "Minustaur" && n % 4 === 3; }

// Facts a monster asks more often (Starbot: anything with a 5 or 10), as a test on a fact key.
export function prefers(m) {
  if (m.n !== "Starbot") return null;
  return (key) => { const [a, b] = key.slice(1).split(",").map(Number); return [a, b].some((n) => n === 5 || n === 10); };
}

// How a hit lands. ans: the answer; typed: what was typed; low: the monster is at half HP or less.
// Returns { mult, note } where note says why, for the message under the monster.
export function hitBy(m, ans, typed, low) {
  if (m.cursed != null && String(typed).includes(String(m.cursed))) return { mult: 2, note: `Lucky ${m.cursed}! Double damage` };
  if (m.n === "Make-Ten Golem" && ans >= 10) return { mult: 2, note: "Crack! Double damage" };
  if (m.n === "Timesaur" && ans < 10) return { mult: 0.5, note: "Armor! Half damage" };
  if (m.n === "Sigma Rex" && low && ans < 10) return { mult: 0.5, note: "Armor! Half damage" };
  return { mult: 1, note: "" };
}

// What happens the first time a monster drops to half HP: a note, and whether its art splits.
export function atHalf(m) {
  if (m.n === "Divvy") return { note: "Divvy splits in two!", split: true };
  if (m.n === "Sigma Rex") return { note: "Sigma Rex gets a second wind! Armor up.", split: false };
  return null;
}
