// Monster art and data: every monster draws, and the roster matches the rules in CLAUDE.md.
import assert from "node:assert/strict";
import { MON, NEW_MON, RETIRED, ANCHOR, LOOKS, svg, allLooks, BOSS_FORMS, bossForm, goldify, GOLDS, DK } from "../js/monsters.js";
import { WINGS } from "../js/wings.js";
import { TRAITS, traitOf } from "../js/traits.js";
import { spokenLines, monsterName, monsterCleared, monsterWon } from "../js/lines.js";

assert.equal(new Set(MON.map((m) => m.n)).size, MON.length, "every monster has its own name");
assert.deepEqual(MON.filter((m) => m.boss).map((m) => m.n).sort(), ["Judo Judy", "Make-Ten Golem", "Sigma Rex", "The Centipede"], "one boss per Wing");
for (const m of MON) {
  assert.ok(["+", "-", "×", "÷", "¢", "○", "=", "Σ", "▦", "/", "⌚", "…", "◇", "mix"].includes(m.op), m.n);
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
// The six new monsters in the game (M5 step 3): in MON with a symbol, a stratum for the gallery,
// anchors and four looks each; batch 1's two (time and patterns), and Polly-Gon (shapes). NEW_MON
// is empty until the next ones are drawn.
const SIX = ["Pipsqueak", "Doublet", "Triceraplus", "Margot-Rythm", "Squaresquatch", "Halfling", "Tick-Tockus", "Slimelipsis", "Polly-Gon"];
assert.deepEqual(NEW_MON.map((m) => m.n), []);
for (const n of SIX) {
  const m = MON.find((x) => x.n === n);
  assert.ok(m && m.sym && m.stratum && !m.trait && !m.boss, `${n} is in the game, its trait in traits.js`);
  assert.equal(LOOKS[n].length, 4, `${n} has four looks`);
  for (const [name, kit, who] of LOOKS[n]) {
    assert.ok(name && kit.length && kit.every((k) => KIT.includes(k)) && [undefined, "he", "she"].includes(who), `${n}: ${name}`);
    const s = svg({ ...m, n: name, base: n, look: kit });
    assert.ok(!/NaN|undefined/.test(s) && !/<text\b/.test(s), `${name} draws`);
  }
  assert.ok(!/\b(she|her|hers|he|him|his|its|they|their)\b/i.test(m.quip), `${n}'s beaten line uses no pronoun`);
}
assert.equal(new Set(Object.values(LOOKS).flat().map((l) => l[0])).size, Object.values(LOOKS).flat().length, "every look has its own name");
// Tick-Tockus is the clock: it shows the time it's given (m.at), its hands where they belong,
// and its looks keep the face clear: only things on the case (the top, the bottom, all round).
{
  const tt = MON.find((m) => m.n === "Tick-Tockus");
  assert.ok(svg(tt).includes('class="clock"') === false && svg(tt).includes("rotate("), "the clock's hands are drawn");
  assert.notEqual(svg({ ...tt, at: { h: 3, m: 0 } }), svg({ ...tt, at: { h: 9, m: 45 } }), "it shows the time asked");
  const FACE = ["lashes", "blush", "mustache", "glasses", "monocle", "sunglasses", "eyepatch", "lids", "spiral", "headband"];
  for (const [name, kit] of LOOKS["Tick-Tockus"]) assert.ok(!kit.some((k) => FACE.includes(k)), `${name} keeps the clock's face clear`);
}
// Retired monsters: out of every Wing, still drawable for the gallery.
assert.deepEqual(RETIRED.map((m) => m.n), ["The Unknown"]);
for (const m of RETIRED) {
  assert.ok(m.retired && !MON.some((x) => x.n === m.n), `${m.n} is out of the game`);
  assert.ok(!WINGS.some((w) => w.pool.includes(m.n) || w.boss === m.n || w.floors.includes(m.n)), `${m.n} is in no Wing`);
  const s = svg(m);
  assert.ok(s.startsWith("<svg") && s.endsWith("</svg>") && !/NaN|undefined/.test(s), m.n);
  assert.ok(m.trait && m.sym && m.stratum, `${m.n} keeps what the gallery shows`);
}
// Boss forms (DESIGN.md §14.2): every boss has a mega form (crowned, with a second trait) and a
// Legend form (in gold, with the same second trait), each drawing with real numbers and no text,
// with a name of its own, and its name, beaten and won lines recorded in the "bosses" sprite.
{
  const bosses = MON.filter((m) => m.boss), forms = bosses.flatMap((m) => ["mega", "legend"].map((f) => bossForm(m, f)));
  assert.deepEqual(Object.keys(BOSS_FORMS).sort(), bosses.map((m) => m.n).sort(), "every boss has its forms");
  const all = [...MON, ...NEW_MON, ...RETIRED, ...allLooks(), ...forms].map((m) => m.n);
  assert.equal(new Set(all).size, all.length, "every form has its own name");
  const lines = new Map(spokenLines().map((l) => [l.kind + ":" + l.text, l]));
  for (const f of forms) {
    const boss = MON.find((m) => m.n === f.base);
    assert.ok(f && f.boss && ["mega", "legend"].includes(f.form) && f.n !== boss.n && f.quip, `${f.n} is a form of ${boss.n}`);
    const s = svg(f);
    assert.ok(s.startsWith("<svg") && s.endsWith("</svg>") && s.includes(`aria-label="${f.n}"`), f.n);
    assert.ok(!/NaN|undefined|Infinity/.test(s), `${f.n} draws with real numbers`);
    assert.ok(!/<text\b/.test(s), `${f.n} uses shapes, not fonts`);
    assert.ok(s.includes(DK), `${f.n} keeps its dark outlines`);
    assert.deepEqual(traitOf(f), traitOf(boss), `${f.n} keeps ${boss.n}'s trait`);
    if (f.form === "mega") {
      assert.ok(/^(Mega|The Mega)/.test(f.n), `${f.n} says it's the mega form`);
      const t = f.trait2;
      assert.ok(t && t.icon && t.name && t.text && t.name !== traitOf(boss).name, `${f.n} has a second trait`);
      // Another boss's trait keeps its icon; a new one has a name of its own.
      const same = Object.values(TRAITS).find((x) => x.name === t.name);
      assert.ok(!same || same.icon === t.icon, `${f.n}: ${t.name}`);
    } else {
      // The Legend fights with its mega form's second trait (DESIGN.md §14.2).
      assert.ok(/^Golden /.test(f.n), `${f.n} is the golden form`);
      assert.deepEqual(f.trait2, bossForm(boss, "mega").trait2, `${f.n} keeps its mega trait`);
      assert.ok(s.includes('id="bf-gold"') && s.includes("url(#bf-gold)"), `${f.n} is in gold`);
      // Gold only: no color of the boss's own is left but the outlines and eye whites.
      const left = [...new Set(goldify(boss.d(boss.c)).match(/#[0-9a-f]{6}\b/gi) || [])].filter((c) => c.toLowerCase() !== DK && c.toLowerCase() !== "#ffffff");
      assert.ok(left.every((c) => GOLDS.includes(c.toLowerCase())), `${f.n}: only golds (${left})`);
    }
    for (const id of ["m:" + monsterName(f), "p:" + monsterCleared(f), "p:" + monsterWon(f)]) {
      const l = lines.get(id);
      assert.ok(l && l.sprite === "bosses" && l.group === "Boss forms", `${id} is recorded in the bosses sprite`);
    }
    assert.ok(!/\b(she|her|hers|he|him|his)\b/i.test(f.quip), `${f.n}'s beaten line uses no he or she`);
  }
  assert.equal(new Set(forms.map((f) => f.n)).size, 8);
  assert.equal(bossForm(MON.find((m) => m.n === "Plusquito"), "mega"), null, "only bosses have forms");
}
console.log("✓ monsters");
