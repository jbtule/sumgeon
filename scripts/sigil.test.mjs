// Sigils (js/sigil.js): every built-in template reads as its digit, its mirror reads as the same
// digit reversed, messy copies still read right, and a scribble isn't clear.
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { read, judge, ACCEPT, cloud, TEMPLATES, SHAPES_FOR_TESTS, mirror } from "../js/sigil.js";
import { HANDWRITING } from "../js/handwriting.js";

const CAN_REVERSE = new Set([1, 2, 3, 4, 5, 6, 7, 9]);
// SIGIL_SEED=<n> runs the random parts with another seed (for the rate across seeds); the check
// runs the fixed one.
const SEED = Number(process.env.SIGIL_SEED) || 12345;
let seed = SEED;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
// A messy copy: tilted, stretched and wobbly, the way a kid's finger draws.
function messy(strokes, rot, stretch, jit) {
  const a = (rnd() - 0.5) * rot * Math.PI / 180, sx = 1 + (rnd() - 0.5) * stretch, sy = 1 + (rnd() - 0.5) * stretch;
  return strokes.map((s) => s.map(([x, y]) => {
    const X = (x - 50) * sx, Y = (y - 50) * sy;
    return [50 + X * Math.cos(a) - Y * Math.sin(a) + (rnd() - 0.5) * jit, 50 + X * Math.sin(a) + Y * Math.cos(a) + (rnd() - 0.5) * jit];
  }));
}

// Every template reads as itself, clearly.
for (const sh of SHAPES_FOR_TESTS) {
  const r = read(sh.strokes);
  assert.equal(r.digit, sh.digit, `${sh.digit} ${sh.name}`);
  assert.equal(r.reversed, false, `${sh.digit} ${sh.name} isn't reversed`);
  assert.ok(r.clear, `${sh.digit} ${sh.name} is clear (fit ${r.fit.toFixed(2)}, margin ${r.margin.toFixed(2)})`);
}
// Its mirror reads as the same digit, reversed (0, 8 and a plain 1 look the same mirrored).
for (const sh of SHAPES_FOR_TESTS) {
  const r = read(mirror(sh.strokes));
  assert.equal(r.digit, sh.digit, `mirrored ${sh.digit} ${sh.name}`);
  assert.equal(r.reversed, CAN_REVERSE.has(sh.digit) && !sh.symmetric, `mirrored ${sh.digit} ${sh.name} reversed?`);
}
assert.ok(TEMPLATES.length >= 35, "several templates per digit, and their mirrors");

// Messy copies (±12° tilt, 25% stretch, a 6-point wobble), 10 of each shape, both ways round:
// all but a handful right, and none read as a different digit with confidence.
let right = 0, total = 0, confidentlyWrong = 0;
for (const sh of SHAPES_FOR_TESTS) for (let k = 0; k < 10; k++) for (const back of [false, true]) {
  if (back && (!CAN_REVERSE.has(sh.digit) || sh.symmetric)) continue;
  const r = read(messy(back ? mirror(sh.strokes) : sh.strokes, 12, 0.25, 6));
  total++;
  if (r.digit === sh.digit && r.reversed === back) right++;
  else if (r.digit !== sh.digit && r.clear) confidentlyWrong++;
}
assert.ok(right / total >= 0.98, `messy shapes read right: ${right}/${total}`);
assert.equal(confidentlyWrong, 0, "a messy shape is never confidently read as another digit");

// Real drawings (scripts/sigil-fixtures.json): recordings from the spell check's Record mode,
// added by scripts/drawings-to-fixtures.mjs, and "shot-" ones, an adult's ordinary handwriting on
// an iPhone traced from screenshots of the spell check (pixel points along each stroke).
// - None is ever read clearly as another digit (a wrong answer costs a heart). Unclear ("try
//   again") is counted, not failed: kids' recordings will have some.
// - Each screenshot reads as its digit, clearly and the right way round, and its mirror as that
//   digit backwards (or just the digit, for an 8).
const FIXTURES_FILE = new URL("./sigil-fixtures.json", import.meta.url);
const FIXTURES = existsSync(FIXTURES_FILE) ? JSON.parse(readFileSync(FIXTURES_FILE, "utf8")).fixtures : [];
const how = (r) => `${r.digit}${r.reversed ? " backwards" : ""}${r.clear ? "" : " (unclear)"}, fit ${r.fit.toFixed(2)}, margin ${r.margin.toFixed(2)}, ${r.name}`;
const real = { n: 0, right: 0, unclear: 0 };
for (const f of FIXTURES) {
  const r = read(f.strokes);
  real.n++;
  assert.ok(!r.clear || r.digit === f.digit, `the real ${f.digit} ${f.id} (${f.who}) isn't read clearly as another digit (got ${how(r)})`);
  if (!r.clear) real.unclear++; else real.right++;
  if (!f.id.startsWith("shot-")) continue;
  const m = read(mirror(f.strokes));
  assert.ok(r.digit === f.digit && !r.reversed && r.clear, `the real ${f.id} reads as a clear ${f.digit} (got ${how(r)})`);
  assert.ok(m.digit === f.digit && m.reversed === CAN_REVERSE.has(f.digit) && m.clear, `the real ${f.id} mirrored (got ${how(m)})`);
}

// Ordinary handwriting varies: tilt (±8°), slant (±12°), stretch (±15% each way) and a smooth
// wobble (3% of its size). Variants of each screenshot and every shape, both ways round: none
// is ever read clearly as another digit (a wrong answer, a lost heart); a few are unclear
// ("try again", which costs nothing).
function vary(strokes) {
  const xs = strokes.flat().map((p) => p[0]), ys = strokes.flat().map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const a = (rnd() - 0.5) * 16 * Math.PI / 180, k = Math.tan((rnd() - 0.5) * 24 * Math.PI / 180);
  const sx = 1 + (rnd() - 0.5) * 0.3, sy = 1 + (rnd() - 0.5) * 0.3, w = 0.03 * size;
  const p1 = rnd() * 6.28, p2 = rnd() * 6.28, f1 = 2 + rnd() * 3, f2 = 2 + rnd() * 3;
  return strokes.map((s) => s.map(([x, y]) => {
    const Y = (y - cy) * sy, X = (x - cx) * sx - k * Y;
    return [X * Math.cos(a) - Y * Math.sin(a) + w * Math.sin(p1 + f1 * 6 * (y - cy) / size),
      X * Math.sin(a) + Y * Math.cos(a) + w * Math.sin(p2 + f2 * 6 * (x - cx) / size)];
  }));
}
// Seeded afresh here, so adding a shape doesn't reshuffle the screenshots' variants.
seed = SEED;
const safety = { n: 0, right: 0, unclear: 0, wrong: [] };
const drawings = FIXTURES.filter((f) => f.id.startsWith("shot-")).map((f) => ({ digit: f.digit, strokes: f.strokes, symmetric: false, count: 40 }))
  .concat(SHAPES_FOR_TESTS.map((sh) => ({ ...sh, count: 15 })));
for (const d of drawings) for (let k = 0; k < d.count; k++) for (const back of [false, true]) {
  if (back && (!CAN_REVERSE.has(d.digit) || d.symmetric)) continue;
  const r = read(vary(back ? mirror(d.strokes) : d.strokes));
  safety.n++;
  if (!r.clear) safety.unclear++;
  else if (r.digit !== d.digit) safety.wrong.push(`${d.digit}${back ? " backwards" : ""} read as ${r.digit}`);
  else if (r.reversed === back) safety.right++;
}
assert.deepEqual(safety.wrong, [], "handwriting variants are never read clearly as another digit");
assert.ok(safety.right / safety.n >= 0.9, `handwriting variants read clearly and right: ${safety.right}/${safety.n}`);

// Real drawings that were misread. A 4 with a high crossbar and a long stem (traced from a phone,
// in pixels, two strokes) read as a 9; and a 9 with a small head and long tail must stay a 9.
const dense = (st) => st.map((pts) => pts.flatMap((p, i) => i ? Array.from({ length: 12 }, (_, k) => [pts[i - 1][0] + (p[0] - pts[i - 1][0]) * (k + 1) / 12, pts[i - 1][1] + (p[1] - pts[i - 1][1]) * (k + 1) / 12]) : [p]));
const tall4 = read(dense([[[315, 580], [275, 602], [272, 700], [290, 855], [585, 855], [690, 820]], [[555, 565], [545, 630], [600, 1000], [645, 1265]]]));
assert.ok(tall4.digit === 4 && tall4.clear, `a high-bar 4 reads as a clear 4 (got ${tall4.digit})`);
const ring = (cx, cy, r) => Array.from({ length: 21 }, (_, i) => [cx + r * Math.cos(i * Math.PI / 10), cy + r * Math.sin(i * Math.PI / 10)]);
const small9 = read(dense([ring(50, 22, 17).concat([[67, 22], [68, 95]])]));
assert.ok(small9.digit === 9 && small9.clear, `a small-headed 9 reads as a clear 9 (got ${small9.digit})`);

// A scribble isn't clear, and nothing drawn reads as nothing.
const scribble = [Array.from({ length: 40 }, (_, i) => [50 + 40 * Math.sin(i * 1.7), 50 + 40 * Math.cos(i * 2.3)])];
assert.equal(read(scribble).clear, false, "a scribble isn't read clearly");
assert.equal(read([]), null);
assert.equal(read([[[10, 10]]]), null, "a single dot is nothing");

// Kids' drawings (drawer-2, a kindergartner, and drawer-3): each reads at least as well as when
// it was recorded (f.read: a clear right read stays clear and right), and knowing the answer,
// the game hits with every one. Only drawer-2's squared-U 4 is a poor match: it hits but shows
// how to write a 4 and isn't learned (the game teaches the school 4 rather than keep his shape).
const kids = FIXTURES.filter((f) => f.who !== "drawer-1");
const judged = { n: 0, good: 0, show: 0 };
for (const f of kids) {
  const r = read(f.strokes), j = judge(r, f.digit);
  if (f.read.clear && f.read.digit === f.digit && !f.read.reversed) assert.ok(r.clear && r.digit === f.digit && !r.reversed, `the real ${f.digit} ${f.id} (${f.who}) still reads clearly (got ${how(r)})`);
  assert.ok(j.outcome === "hit" || j.outcome === "show", `knowing the answer, the real ${f.digit} ${f.id} (${f.who}) hits (got ${j.outcome}, ${how(r)})`);
  judged.n++; judged[j.outcome === "hit" ? "good" : "show"]++;
}
const u4 = kids.find((f) => f.who === "drawer-2" && f.digit === 4);
if (u4) {
  const j = judge(read(u4.strokes), 4);
  assert.ok(j.outcome === "show" && !j.learn, "the squared-U 4 hits, shows how to write a 4, and isn't learned");
}
// The answer-aware rule on every real drawing and every handwriting variant above, with every
// answer: a clear read is wrong for any other answer, never accepted; an unclear one is never
// wrong. Drawings accepted for an answer they aren't are counted (the gap rule), not failed.
const other = { n: 0, accepted: 0 };
for (const f of FIXTURES) {
  const r = read(f.strokes);
  for (let d = 0; d <= 9; d++) {
    if (d === f.digit) continue;
    const j = judge(r, d);
    other.n++;
    if (r.clear) assert.ok(j.outcome === "wrong" || (r.digit === d && j.outcome === "backwards"), `a clear ${how(r)} isn't accepted as ${d}`);
    else { assert.notEqual(j.outcome, "wrong", "only a clear read is wrong"); if (j.outcome === "hit" || j.outcome === "show") other.accepted++; }
  }
}
// The built-ins alone read a drawing clearly as another digit: it may hit (a personal template
// matched), but it's never learned.
const clear7 = read([[[20, 8], [80, 8], [40, 95]]]);
assert.equal(judge({ ...clear7, clear: false, digit: 1, reversed: false, fit: 0.9, margin: 0.5, forward: { 1: 0.9, 7: 0.9 } }, 1, clear7).learn, false, "never learn what the built-ins read clearly as another digit");
assert.equal(judge(null, 3).outcome, "retry");
assert.ok(ACCEPT.floor < ACCEPT.good);
// The school-style digits (handwriting.js, shown to copy) read clearly as themselves.
HANDWRITING.forEach((st, d) => { const r = read(st); assert.ok(r.digit === d && r.clear && !r.reversed && judge(r, d).outcome === "hit", `handwriting ${d} (got ${how(r)})`); });

// A personal template (the player's own 7) is used.
const odd7 = [[[20, 30], [80, 10], [30, 95]]];
assert.equal(read(odd7, [{ digit: 7, points: cloud(odd7) }]).digit, 7);
// Fast enough for a phone: a read in Node stays well under 30 ms.
const t0 = performance.now();
for (const f of FIXTURES) for (let k = 0; k < 5; k++) read(f.strokes);
const ms = (performance.now() - t0) / (FIXTURES.length * 5);
assert.ok(ms < 30, `a read takes ${ms.toFixed(1)} ms`);
console.log(`✓ sigils (${TEMPLATES.length} templates, messy ${right}/${total}, real drawings ${real.right}/${real.n} clear, ${real.unclear} unclear; handwriting variants ${safety.right}/${safety.n} right, ${(safety.unclear / safety.n * 100).toFixed(1)}% unclear, 0 wrong; kids' drawings hit ${judged.good + judged.show}/${judged.n} knowing the answer (${judged.show} showing how to write it); other answers accepted ${other.accepted}/${other.n}; ${ms.toFixed(1)} ms a read)`);
