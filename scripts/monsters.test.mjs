// Monster art and data: every monster draws, and the roster matches the rules in CLAUDE.md.
import assert from "node:assert/strict";
import { MON, svg } from "../js/monsters.js";

assert.equal(new Set(MON.map((m) => m.n)).size, MON.length, "every monster has its own name");
assert.deepEqual(MON.filter((m) => m.boss).map((m) => m.n).sort(), ["Make-Ten Golem", "Sigma Rex", "The Unknown"], "one boss per Wing");
for (const m of MON) {
  assert.ok(["+", "-", "×", "÷", "¢", "○", "=", "mix"].includes(m.op), m.n);
  assert.ok(m.hits >= 3 && m.quip && m.c, m.n);
  const s = svg(m);
  assert.ok(s.startsWith("<svg") && s.endsWith("</svg>"), m.n);
  assert.ok(s.includes(`aria-label="${m.n}"`), m.n);
  assert.ok(!/<text\b/.test(s), `${m.n} uses shapes, not fonts`);
}
console.log("✓ monsters");
