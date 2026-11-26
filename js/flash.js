// The dot flash (kindergarten, K.NS.B.8: how many, without counting, up to 5 in the common
// patterns; the K guide's subitizing: dot cards, dice, five-frames, dominoes). Pipsqueak's strand
// in the Counting Cellar (learn.js BANDS.flashK). The dots show for a moment (FLASH_DOTS_MS),
// then hide, and the kid types how many. A brief look, not a test of speed: "Show me again"
// peeks once (it counts as a hint), and the hint (or a miss) brings the dots back, grouped
// ("2 and 2 make ?"). No DOM: runs in Node for the tests.
//
// A fact: { op: "⁙", kind, groups, ans, key, q }. kind is the arrangement:
//   "d" a die's face (⁙d4), "f" a five-frame (⁙f3), "o" a domino, its two halves (⁙o3,2),
//   "s" a few small groups scattered on a card (⁙s2,2,1).
// groups: the parts the hint shows (a die's 4 is 2 and 2, its 5 the corners and the middle).
import { spoken } from "./problems.js";

export const FLASH_DOTS_MS = 1500;
// The groups each arrangement is seen as.
const DIE_GROUPS = { 1: [1], 2: [1, 1], 3: [2, 1], 4: [2, 2], 5: [4, 1] };
const FRAME_GROUPS = { 1: [1], 2: [1, 1], 3: [2, 1], 4: [2, 2], 5: [2, 2, 1] };
export function flashFact(kind, nums) {
  const groups = kind === "d" ? DIE_GROUPS[nums[0]] : kind === "f" ? FRAME_GROUPS[nums[0]] : nums.slice();
  const ans = groups.reduce((t, n) => t + n, 0);
  return { op: "⁙", kind, groups, n: kind === "d" || kind === "f" ? nums[0] : null, ans, key: "⁙" + kind + nums.join(","), q: "Dots = □" };
}
export function flashFactOf(key) { return flashFact(key[1], key.slice(2).split(",").map(Number)); }
// The levels (learn.js BANDS.flashK): dice and five-frames to 3, then to 5, then dots any way
// (dominoes and scattered groups). Pipsqueak's dice sums come after (learn.js).
export const FLASH_LEVELS = [
  { name: "How many dots? To 3", keys: ["⁙d1", "⁙d2", "⁙d3", "⁙f1", "⁙f2", "⁙f3"] },
  { name: "How many dots? To 5", keys: ["⁙d4", "⁙d5", "⁙f4", "⁙f5"] },
  { name: "Dots any way", keys: ["⁙o1,1", "⁙o2,1", "⁙o3,1", "⁙o2,2", "⁙o4,1", "⁙o3,2", "⁙s2,1", "⁙s1,1,1", "⁙s2,2", "⁙s3,1", "⁙s3,2", "⁙s2,2,1"] }
];
let cache = null;
export function flashFacts() { return cache || (cache = FLASH_LEVELS.flatMap((l) => l.keys.map(flashFactOf))); }

// Spoken: the same question every time ("How many dots?"; app.js says "Look quick! How many
// dots?" the first time), and after a miss the groups: "Two and two make four." or "One dot."
export const spokenFlash = () => "How many dots?";
const cap = (t) => t[0].toUpperCase() + t.slice(1);
export function spokenFlashAnswer(f) {
  if (f.groups.length === 1) return cap(spoken(f.ans)) + (f.ans === 1 ? " dot." : " dots.");
  return cap(f.groups.map(spoken).join(" and ")) + " make " + spoken(f.ans) + ".";
}
// The hint's words: the groups, "2 and 2 make ?" (worked, the count). Never the count before
// answering: a single dot is "Touch the dot. How many?".
export function flashHint(f, worked) {
  if (f.groups.length === 1) return { say: worked ? `${f.ans} dot.` : "Touch the dot. How many?" };
  return { say: `${f.groups.join(" and ")} make ${worked ? f.ans : "?"}${worked ? "." : ""}` };
}

/* ---------- the drawing ----------
   One card, 200 × 100: a die (white, dark pips), a five-frame (5 boxes, gold counters), a
   domino (two white halves, dark pips) or a dark card with small groups of gold dots. With the
   hint (opt.hint) the dots come back colored by group (gold, coral, teal), each group ringed
   when it stands apart. opt.hidden: the card face down (the dots hidden), with a "?" on it. */
const DK = "#0c171c", WHITE = "#f6f3ea", GOLD = "#ffc93c", COLORS = ["#ffc93c", "#ff5a4e", "#8eeae4"];
const PIPS = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [0, 2], [2, 0], [2, 2]], 5: [[0, 0], [0, 2], [2, 0], [2, 2], [1, 1]] };
const r1 = (n) => Math.round(n * 10) / 10;
// Which group each dot is in, in order: groups [2, 2] → [0, 0, 1, 1].
const groupOf = (groups) => groups.flatMap((n, g) => Array(n).fill(g));
// Pips on a square face at (x, y), side s, for n dots, colored by group when hinted.
function pips(x, y, s, n, color, hintGroups) {
  const g = hintGroups ? groupOf(hintGroups) : null, step = s * 0.29, r = s * 0.095;
  return PIPS[n].map(([c, rw], i) => `<circle cx="${r1(x + s / 2 + (c - 1) * step)}" cy="${r1(y + s / 2 + (rw - 1) * step)}" r="${r1(r)}" fill="${g ? COLORS[g[i]] : color}" stroke="${DK}" stroke-width="${g ? 2 : 0}"/>`).join("");
}
// Small groups scattered: where each group's middle sits, and its dots around it.
const SPOTS = { 1: [[100, 50]], 2: [[58, 40], [142, 62]], 3: [[42, 36], [104, 68], [160, 32]] };
const CLUSTER = { 1: [[0, 0]], 2: [[-9, -7], [9, 7]], 3: [[0, -11], [-11, 8], [11, 8]] };
export function flashSvg(f, opt = {}) {
  const hint = !!opt.hint && !opt.hidden;
  let s = "", label = "dots";
  if (opt.hidden) {
    // Face down: the card's outline only, with a "?".
    const box = f.kind === "d" ? [52, 2, 96, 96] : f.kind === "f" ? [8, 26, 184, 48] : f.kind === "o" ? [12, 6, 176, 88] : [4, 4, 192, 92];
    s = `<rect x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}" rx="12" fill="var(--panel, #1a313a)" stroke="${DK}" stroke-width="4"/><rect x="${box[0] + 6}" y="${box[1] + 6}" width="${box[2] - 12}" height="${box[3] - 12}" rx="8" fill="none" stroke="${GOLD}" stroke-opacity=".35" stroke-width="2" stroke-dasharray="6 5"/>`
      + `<text x="100" y="${box[1] + box[3] / 2 + 13}" text-anchor="middle" font-family="Bungee, sans-serif" font-size="36" fill="${GOLD}" fill-opacity=".6">?</text>`;
    label = "the dots, hidden";
  } else if (f.kind === "d") {
    s = `<rect x="52" y="2" width="96" height="96" rx="16" fill="${WHITE}" stroke="${DK}" stroke-width="4"/>` + pips(52, 2, 96, f.n, DK, hint ? f.groups : null);
    label = "a die";
  } else if (f.kind === "f") {
    const g = groupOf(f.groups);
    s = `<rect x="8" y="26" width="184" height="48" rx="6" fill="${WHITE}" stroke="${DK}" stroke-width="4"/>`;
    for (let i = 1; i < 5; i++) s += `<line x1="${8 + i * 36.8}" y1="26" x2="${8 + i * 36.8}" y2="74" stroke="${DK}" stroke-width="3"/>`;
    for (let i = 0; i < f.n; i++) s += `<circle cx="${r1(26.4 + i * 36.8)}" cy="50" r="13" fill="${hint ? COLORS[g[i]] : GOLD}" stroke="${DK}" stroke-width="2.5"/>`;
    // The hint rings each group of two in the frame.
    if (hint) {
      let at = 0;
      f.groups.forEach((n) => { if (f.groups.length > 1) s += `<rect x="${r1(10 + at * 36.8)}" y="30" width="${r1(n * 36.8 - 4)}" height="40" rx="14" fill="none" stroke="${DK}" stroke-width="3" stroke-dasharray="5 3"/>`; at += n; });
    }
    label = "a five-frame";
  } else if (f.kind === "o") {
    s = `<rect x="12" y="6" width="176" height="88" rx="12" fill="${WHITE}" stroke="${DK}" stroke-width="4"/><line x1="100" y1="14" x2="100" y2="86" stroke="${DK}" stroke-width="3"/>`
      // Each half its own group: the left gold, the right coral.
      + pips(16, 6, 88, f.groups[0], DK, hint ? [f.groups[0]] : null) + pips(96, 6, 88, f.groups[1], DK, hint ? [0, f.groups[1]] : null);
    label = "a domino";
  } else {
    s = `<rect x="4" y="4" width="192" height="92" rx="12" fill="#12242b" stroke="${DK}" stroke-width="4"/>`;
    const spots = SPOTS[f.groups.length];
    f.groups.forEach((n, gi) => {
      const [cx, cy] = spots[gi];
      if (hint) s += `<circle cx="${cx}" cy="${cy}" r="${n === 1 ? 16 : 24}" fill="none" stroke="${COLORS[gi]}" stroke-width="2.5" stroke-dasharray="5 3"/>`;
      CLUSTER[n].forEach(([dx, dy]) => { s += `<circle cx="${cx + dx}" cy="${cy + dy}" r="8.5" fill="${hint ? COLORS[gi] : GOLD}" stroke="${DK}" stroke-width="2"/>`; });
    });
    label = "dots in small groups";
  }
  return `<svg class="dots" viewBox="0 0 200 100" role="img" aria-label="${label}">${s}</svg>`;
}
