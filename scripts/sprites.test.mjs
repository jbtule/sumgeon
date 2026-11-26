// Every line is in an audio sprite (lines.js spriteFor), each sprite is small, and what a run loads
// (lines.js ALWAYS and runSprites) holds every line a run in that stratum can say.
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { spokenLines, spriteFor, familyOf, estSeconds, runSprites, ALWAYS, SPRITE_MAX_S, monsterName, monsterCleared, monsterWon, askLine } from "../js/lines.js";
import { WINGS, runFloors, bandOf } from "../js/wings.js";
import { BANDS, pool, factOf } from "../js/learn.js";
import { spokenFact } from "../js/problems.js";
import { missingOf, canHide } from "../js/missing.js";
import { flipOf } from "../js/traits.js";
import { MON } from "../js/monsters.js";
import { planClips, planSprites, keyFor, MAX_FILE } from "./audio/build.mjs";

const lines = spokenLines(), fileOf = {};
for (const l of lines) fileOf[l.kind + ":" + l.text] = l.file;

// Every line is in exactly one sprite, and the build makes one sprite of each.
assert.ok(lines.every((l) => typeof l.file === "string" && l.file), "every line has a sprite");
const plan = planClips(), sprites = planSprites(plan);
assert.equal(sprites.reduce((a, s) => a + s.clips.length, 0), plan.length, "the sprites hold every line once");
assert.equal(new Set(sprites.flatMap((s) => s.clips.map((c) => c.id))).size, plan.length);
assert.equal(new Set(sprites.map((s) => s.name)).size, sprites.length);
assert.ok(lines.every((l) => familyOf(l.file) === spriteFor(l)), "a sprite is its family, or a part of it");
// The lines added with a sprite of their own keep its family's name.
assert.ok(lines.filter((l) => l.sprite === "depths").every((l) => l.file === "depths"));
assert.ok(lines.filter((l) => l.sprite === "bosses").every((l) => l.file === "bosses"));
assert.ok(lines.filter((l) => l.sprite === "names").every((l) => /^(m-|heroes)/.test(l.file)));

// No sprite over the limits: about 3.5 minutes of speech (estimated from the text, about 14
// characters a second; a fact's lines are kept together, so a part can run a little over), and
// well under Cloudflare's 25 MiB as an mp3 (64 kbps: 8 KB a second). With the clips recorded
// locally (_audio/a), their real sizes too.
const len = {};
for (const l of lines) len[l.file] = (len[l.file] || 0) + estSeconds(l.text);
const [bigName, bigS] = Object.entries(len).sort((a, b) => b[1] - a[1])[0];
assert.ok(bigS <= SPRITE_MAX_S * 1.1, `${bigName} is about ${Math.round(bigS)} s`);
assert.ok(bigS * 8000 < MAX_FILE / 10);
const clipDir = new URL("../_audio/a/", import.meta.url);
let real = null;
if (existsSync(clipDir)) {
  const bytes = {};
  for (const c of plan) { const f = new URL(c.key + ".mp3", clipDir); if (existsSync(f)) bytes[c.sprite] = (bytes[c.sprite] || 0) + statSync(f).size; }
  real = Object.entries(bytes).sort((a, b) => b[1] - a[1])[0];
  if (real) assert.ok(real[1] < MAX_FILE && real[1] / 8000 <= SPRITE_MAX_S * 1.1, `${real[0]} is ${real[1]} bytes`);
}

// What a run loads holds every recorded line it can say.
const ids = new Set(Object.keys(fileOf));
const always = new Set(ALWAYS);
// Every line that isn't a problem or a monster's is always loaded, but the purse's dollar amounts
// (said when the purse is opened: their clips play).
for (const l of lines) {
  if (l.kind === "q" || /^m-/.test(l.file)) continue;
  assert.ok(always.has(familyOf(l.file)) || familyOf(l.file) === "purse", `${l.text} (${l.file}) isn't loaded`);
}
let rnd = 1;
const seeded = () => { rnd = (rnd * 16807) % 2147483647; return rnd / 2147483647; };
const needs = (have, id, why) => { if (ids.has(id)) assert.ok(have.has(familyOf(fileOf[id])), `${why}: ${id} (${fileOf[id]}) isn't loaded`); };
for (const w of WINGS) {
  const all = new Set(ALWAYS.concat(runSprites(w)));
  // Its monsters, in every look a floor can wear, on any depth.
  for (let depth = 1; depth <= 8; depth++) for (let i = 0; i < 20; i++) {
    for (const m of runFloors(w, { captain: 0, rescued: [1, 2, 3, 4, 5, 6, 7, 8, 9] }, seeded, depth).concat(runFloors(w, { captain: 0, rescued: [] }, seeded, depth))) {
      for (const t of [monsterName(m)]) needs(all, "m:" + t, w.id);
      for (const t of [monsterCleared(m), monsterWon(m)]) needs(all, "p:" + t, w.id);
    }
  }
  // Its band's and strands' problems, as each is asked (either turnaround, thrown by Judo Judy,
  // with a number hidden, or in a chest's lock) and answered; and loading up to a level holds that
  // level's.
  const judy = MON.find((m) => m.n === "Judo Judy");
  const bands = new Set([w.band].concat(w.pool.map((n) => bandOf(w, MON.find((m) => m.n === n)))));
  for (const band of bands) {
    for (const f of pool(band)) {
      const upto = new Set(ALWAYS.concat(runSprites(w, { [band]: f.level })));
      for (const r of [0.1, 0.9]) {
        const p = factOf(f.key, () => r), said = [askLine(p), spokenFact(p.fact || p)];
        const q = flipOf(judy, p);
        if (q) said.push(askLine(q), spokenFact(q));
        if (!p.blank && "+-×÷".includes(p.op) && canHide(p)) for (const b of ["x", "y"]) said.push(askLine(missingOf(p, b)));
        for (const t of said) { needs(all, "q:" + t, `${w.id} ${band} ${f.key}`); needs(upto, "q:" + t, `${w.id} ${band} level ${f.level + 1}`); }
      }
    }
  }
}
// A stratum loads only its own: the Cellar holds none of the Tower's times tables.
assert.ok(!runSprites(WINGS[0]).some((f) => /^q-third/.test(f)) && !runSprites(WINGS[3]).some((f) => /^q-kinder/.test(f)));
assert.ok(runSprites(WINGS[0], { kinder: 0, coinsK: 0, more: 0 }).length < runSprites(WINGS[0]).length, "a run loads only the levels in reach");
assert.ok(Object.keys(BANDS).every((b) => pool(b).length));
assert.equal(keyFor("p", "Oops!").length, 20);
console.log(`✓ sprites (${sprites.length}; the longest, ${bigName}, about ${(bigS / 60).toFixed(1)} min${real ? `; recorded, ${real[0]} at ${(real[1] / 1e6).toFixed(2)} MB` : ""})`);
