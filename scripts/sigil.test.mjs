// Sigils (js/sigil.js): every built-in template reads as its digit, its mirror reads as the same
// digit reversed, messy copies still read right, and a scribble isn't clear.
import assert from "node:assert/strict";
import { read, cloud, TEMPLATES, SHAPES_FOR_TESTS, mirror } from "../js/sigil.js";

const CAN_REVERSE = new Set([1, 2, 3, 4, 5, 6, 7, 9]);
let seed = 12345;
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

// A scribble isn't clear, and nothing drawn reads as nothing.
const scribble = [Array.from({ length: 40 }, (_, i) => [50 + 40 * Math.sin(i * 1.7), 50 + 40 * Math.cos(i * 2.3)])];
assert.equal(read(scribble).clear, false, "a scribble isn't read clearly");
assert.equal(read([]), null);
assert.equal(read([[[10, 10]]]), null, "a single dot is nothing");

// A personal template (the player's own 7) is used.
const odd7 = [[[20, 30], [80, 10], [30, 95]]];
assert.equal(read(odd7, [{ digit: 7, points: cloud(odd7) }]).digit, 7);
console.log(`✓ sigils (${TEMPLATES.length} templates, messy ${right}/${total})`);
