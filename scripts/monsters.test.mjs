// Monster art and data: every monster draws, and the roster matches the rules in CLAUDE.md.
import assert from "node:assert/strict";
import { MON, NEW_MON, ANCHOR, svg } from "../js/monsters.js";

assert.equal(new Set(MON.map((m) => m.n)).size, MON.length, "every monster has its own name");
assert.deepEqual(MON.filter((m) => m.boss).map((m) => m.n).sort(), ["Make-Ten Golem", "Sigma Rex", "The Centipede", "The Unknown"], "one boss per Wing");
for (const m of MON) {
  assert.ok(["+", "-", "×", "÷", "¢", "○", "=", "mix"].includes(m.op), m.n);
  assert.ok(m.hits >= 3 && m.quip && m.c, m.n);
  const s = svg(m);
  assert.ok(s.startsWith("<svg") && s.endsWith("</svg>"), m.n);
  assert.ok(s.includes(`aria-label="${m.n}"`), m.n);
  assert.ok(!/<text\b/.test(s), `${m.n} uses shapes, not fonts`);
}
// The new monsters, drawn but not in the game yet: the same checks, numbers that are numbers,
// and anchors so looks can dress them later.
const KIT = ["crown", "bow", "lashes", "blush", "mustache", "glasses", "monocle", "sunglasses", "eyepatch", "bandana", "tophat", "nightcap", "headband", "lids", "spiral", "sparkles", "scarf", "bowtie", "medal", "mini"];
assert.equal(new Set([...MON, ...NEW_MON].map((m) => m.n)).size, MON.length + NEW_MON.length, "new monsters have their own names");
for (const m of NEW_MON) {
  assert.ok(m.sym && m.stratum && m.trait && m.trait.icon && m.trait.name && m.trait.text, m.n);
  assert.ok(m.hits >= 3 && m.quip && /^#[0-9a-f]{6}$/.test(m.c), m.n);
  const s = svg(m);
  assert.ok(s.startsWith("<svg") && s.endsWith("</svg>") && s.includes(`aria-label="${m.n}"`), m.n);
  assert.ok(!/<text\b/.test(s), `${m.n} uses shapes, not fonts`);
  assert.ok(!/NaN|undefined/.test(s), `${m.n} draws with real numbers`);
  const a = ANCHOR[m.n];
  assert.ok(a && a.eyes.length && a.mouth && a.top && a.neck && a.ground, `${m.n} has anchors for looks`);
  assert.ok(!/NaN|undefined/.test(svg({ ...m, base: m.n, look: KIT })), `${m.n} can wear every look`);
}
assert.equal(new Set(NEW_MON.map((m) => m.c)).size, NEW_MON.length, "each new monster has its own color");
console.log("✓ monsters");
