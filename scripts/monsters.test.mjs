// Monster art and data: every monster draws, and the roster matches the rules in CLAUDE.md.
import assert from "node:assert/strict";
import { MON, svg } from "../js/monsters.js";

assert.equal(MON.length, 7);
assert.equal(MON.filter((m) => m.boss).length, 1, "one boss");
assert.ok(MON[MON.length - 1].boss, "the boss is last");
for (const m of MON) {
  assert.ok(["+", "-", "×", "÷", "mix"].includes(m.op), m.n);
  assert.ok(m.hits >= 3 && m.quip && m.c, m.n);
  const s = svg(m);
  assert.ok(s.startsWith("<svg") && s.endsWith("</svg>"), m.n);
  assert.ok(s.includes(`aria-label="${m.n}"`), m.n);
  assert.ok(!/<text\b/.test(s), `${m.n} uses shapes, not fonts`);
}
console.log("✓ monsters");
