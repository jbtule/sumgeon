// Every line the game says is in the audio plan, and app.js only says lines from js/lines.js.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spokenLines, PHRASE, monsterName, monsterCleared, monsterWon } from "../js/lines.js";
import { facts, spokenProblem, spokenFact } from "../js/problems.js";
import { MON } from "../js/monsters.js";
import { planClips } from "./audio/build.mjs";

const ids = new Set(spokenLines().map((l) => l.kind + ":" + l.text));
for (const t of Object.values(PHRASE)) assert.ok(ids.has("p:" + t), t);
for (const m of MON) {
  assert.ok(ids.has("m:" + monsterName(m)));
  assert.ok(ids.has("p:" + monsterWon(m)));
  if (!m.boss) assert.ok(ids.has("p:" + monsterCleared(m)));
}
const fs = facts();
assert.equal(fs.length, 633);
for (const f of fs) { assert.ok(ids.has("q:" + spokenProblem(f))); assert.ok(ids.has("q:" + spokenFact(f))); }
assert.ok(ids.has("q:seven plus eight is fifteen"));
assert.ok(!PHRASE.intro.includes("×"), "spoken text has no symbols the voice would misread");

// Keys are stable and unique.
const plan = planClips();
assert.equal(new Set(plan.map((c) => c.key)).size, plan.length);

// app.js says only lines from lines.js: every say() takes a PHRASE, a lines.js helper, or a problem.
const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
for (const [call] of app.matchAll(/say\([^)]*\)/g)) {
  assert.match(call, /say\("(p|m|q)", (PHRASE\.\w+|monsterName\(m\)|monsterCleared\(m\)|monsterWon\(m\)|heroName\(HEROES\[[\w.]+\]\)|heroName\(\w+\)|heroJoins\(\w+\)|wingCleared\(\w+(\(\))?\)|wingOpened\(\w+\)|spokenProblem\(G\.cur\)|spokenFact\(G\.cur\))/, `${call} says a line that isn't in js/lines.js`);
}
console.log(`✓ lines (${plan.length} lines)`);
