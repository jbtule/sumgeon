// Monster art and data: every monster draws, and the roster matches the rules in CLAUDE.md.
import assert from "node:assert/strict";
import { MON, NEW_MON, RETIRED, ANCHOR, LOOKS, svg } from "../js/monsters.js";
import { WINGS } from "../js/wings.js";

assert.equal(new Set(MON.map((m) => m.n)).size, MON.length, "every monster has its own name");
assert.deepEqual(MON.filter((m) => m.boss).map((m) => m.n).sort(), ["Judo Judy", "Make-Ten Golem", "Sigma Rex", "The Centipede"], "one boss per Wing");
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
// Judo Judy, the Balance Hall's boss: drawn with real numbers, anchored, a boss with no looks.
const judy = MON.find((m) => m.n === "Judo Judy");
assert.ok(judy && judy.boss && judy.op === "+" && judy.sym === "⇄", "Judo Judy is a boss of turnarounds");
assert.ok(!/NaN|undefined/.test(svg(judy)), "Judo Judy draws with real numbers");
const ja = ANCHOR["Judo Judy"];
assert.ok(ja && ja.eyes.length === 2 && ja.mouth && ja.top && ja.neck && ja.ground, "Judo Judy has anchors");
assert.ok(!LOOKS["Judo Judy"], "bosses have no looks");
assert.ok(!/\b(she|her|hers|he|him|his)\b/i.test(judy.quip), "Judo Judy's lines use the name, never a pronoun");
// Retired monsters: out of every Wing, still drawable for the gallery.
assert.deepEqual(RETIRED.map((m) => m.n), ["The Unknown"]);
for (const m of RETIRED) {
  assert.ok(m.retired && !MON.some((x) => x.n === m.n), `${m.n} is out of the game`);
  assert.ok(!WINGS.some((w) => w.pool.includes(m.n) || w.boss === m.n || w.floors.includes(m.n)), `${m.n} is in no Wing`);
  const s = svg(m);
  assert.ok(s.startsWith("<svg") && s.endsWith("</svg>") && !/NaN|undefined/.test(s), m.n);
  assert.ok(m.trait && m.sym && m.stratum, `${m.n} keeps what the gallery shows`);
}
console.log("✓ monsters");
