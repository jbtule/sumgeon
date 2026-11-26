// The dot flash (K, K.NS.B.8): facts and keys, the strand's levels, Pipsqueak, the drawing
// (shown, hidden, grouped), hints that never give the count early, and the voice.
import assert from "node:assert/strict";
import { flashFacts, flashFactOf, flashSvg, flashHint, FLASH_LEVELS, FLASH_DOTS_MS, spokenFlashAnswer } from "../js/flash.js";
import { BANDS, pool, factOf } from "../js/learn.js";
import { asks, flashOf, isDice } from "../js/traits.js";
import { MON } from "../js/monsters.js";
import { WINGS, bandOf } from "../js/wings.js";
import { hintFor } from "../js/hints.js";
import { spokenProblem, spokenFact } from "../js/problems.js";
import { PHRASE, spokenLines } from "../js/lines.js";

const fs = flashFacts();
assert.equal(fs.length, 22);
assert.equal(new Set(fs.map((f) => f.key)).size, fs.length);
for (const f of fs) {
  // 1 to 5 dots, the groups adding up to the count, and the key round-trips.
  assert.ok(f.ans >= 1 && f.ans <= 5 && f.groups.reduce((t, n) => t + n, 0) === f.ans, f.key);
  assert.deepEqual(factOf(f.key), f);
  assert.equal(f.op, "⁙");
  // Every group is smaller than the count (so the hint never says it), except a lone dot.
  assert.ok(f.ans === 1 || f.groups.every((n) => n < f.ans), f.key);
}
assert.deepEqual(["⁙d4", "⁙f3", "⁙o3,2", "⁙s2,2,1"].map((k) => [flashFactOf(k).ans, flashFactOf(k).groups]), [[4, [2, 2]], [3, [2, 1]], [5, [3, 2]], [5, [2, 2, 1]]]);
assert.ok(FLASH_DOTS_MS >= 1000 && FLASH_DOTS_MS <= 2000, "a brief look");
// Dice and five-frames to 3, then to 5, then any way.
assert.ok(FLASH_LEVELS[0].keys.every((k) => /^⁙[df]/.test(k) && flashFactOf(k).ans <= 3));
assert.ok(FLASH_LEVELS[1].keys.every((k) => /^⁙[df]/.test(k) && flashFactOf(k).ans > 3));
assert.ok(FLASH_LEVELS[2].keys.every((k) => /^⁙[os]/.test(k)));
console.log("✓ dot flash: facts and keys");

// Pipsqueak's strand in the Cellar: the flash, then his dice sums (the band's keys, within 10).
const cellar = WINGS.find((w) => w.id === "cellar"), mon = (n) => MON.find((m) => m.n === n);
assert.equal(bandOf(cellar, mon("Pipsqueak")), "flashK");
const B = BANDS.flashK;
assert.ok(B.strand && B.unlock === 0.5);
assert.deepEqual(B.levels.map((l) => l.name), ["How many dots? To 3", "How many dots? To 5", "Dots any way", "Dice sums"]);
const p = pool("flashK"), sums = p.filter((f) => f.level === 3);
assert.equal(p.filter((f) => f.op === "⁙").length, 22);
assert.ok(sums.length === 19 && sums.every((f) => isDice(f.op, f.key) && f.ans <= 10), "dice sums within 10");
assert.ok(sums.every((f) => pool("kinder").some((k) => k.key === f.key)), "the same keys as the band's");
assert.ok(p.every((f) => asks(mon("Pipsqueak"))(f.op, f.key)), "Pipsqueak asks all of it");
for (const n of ["Plusquito", "Minustaur", "Chompers", "Make-Ten Golem", "Quizard", "Trollar"]) assert.ok(!asks(mon(n))("⁙", "⁙d4"), n);
// A flash fact isn't a dice sum: it stays dots, not two dice.
assert.equal(flashOf(mon("Pipsqueak"), factOf("⁙d4")), null);
assert.ok(flashOf(mon("Pipsqueak"), factOf("+3,5", () => 0)).dice);
// Not the Cellar's band: no one's open levels change.
assert.ok(!pool("kinder").some((f) => f.op === "⁙"));
console.log("✓ dot flash: Pipsqueak's strand");

// The drawing: the dots, then face down (no dots at all), then grouped by color.
for (const f of fs) {
  const shown = flashSvg(f), hidden = flashSvg(f, { hidden: true }), grouped = flashSvg(f, { hint: true });
  const dots = (s) => (s.match(/<circle /g) || []).length;
  assert.equal(dots(shown), f.ans, f.key);
  assert.equal(dots(hidden), 0, f.key);
  assert.ok(dots(grouped) >= f.ans, f.key);
  // Nothing in the drawing or its label says the count.
  for (const s of [shown, hidden, grouped]) assert.ok(!/\d/.test((s.match(/aria-label="([^"]*)"/) || [])[1]) && !new RegExp(`>${f.ans}<`).test(s), f.key);
  // Grouped, each group its own color.
  const colors = new Set([...grouped.matchAll(/<circle [^>]*fill="(#[0-9a-f]+)"/g)].map((m) => m[1]));
  assert.equal(colors.size, f.kind === "o" ? 2 : f.groups.length, f.key);
}
console.log("✓ dot flash: the drawing");

// Hints: the groups, never the count, before answering; the count after.
for (const f of fs) {
  const b = hintFor(f, false), w = hintFor(f, true);
  assert.ok(b.model.startsWith("<svg") && b.grownups, f.key);
  assert.ok(!new RegExp(`\\b${f.ans}\\b`).test(b.say) && b.say.endsWith("?"), `${f.key}: ${b.say}`);
  assert.ok(new RegExp(`\\b${f.ans}\\b`).test(w.say), `${f.key}: ${w.say}`);
}
assert.equal(flashHint(flashFactOf("⁙d4"), false).say, "2 and 2 make ?");
assert.equal(flashHint(flashFactOf("⁙d4"), true).say, "2 and 2 make 4.");
assert.equal(flashHint(flashFactOf("⁙d1"), false).say, "Touch the dot. How many?");
console.log("✓ dot flash: hints");

// The voice: "How many dots?" (the first time, "Look quick! How many dots?"), and the groups after a miss.
assert.equal(spokenProblem(flashFactOf("⁙f3")), "How many dots?");
assert.equal(PHRASE.flashHow, "Look quick! How many dots?");
assert.equal(spokenFact(flashFactOf("⁙d4")), "Two and two make four.");
assert.equal(spokenFlashAnswer(flashFactOf("⁙d1")), "One dot.");
assert.equal(spokenFact(flashFactOf("⁙s2,2,1")), "Two and two and one make five.");
const lines = spokenLines(), said = (t) => lines.some((l) => l.text === t);
assert.ok(said("How many dots?") && said(PHRASE.flashHow) && fs.every((f) => said(spokenFact(f))));
assert.ok(lines.filter((l) => l.group === "Dot flash").length === 1 + new Set(fs.map(spokenFact)).size);
console.log("✓ dot flash: spoken");
