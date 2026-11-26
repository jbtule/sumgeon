// Shapes (js/shapes.js, the prototype page): reading drawn shapes, and the counting problems.
import assert from "node:assert/strict";
import { SHAPE_TEMPLATES, readShape, judgeShape, countCorners, polygon, closed, sides, countProblem, countSvg, countHint, spokenCount, spokenDraw, irregular, convexTurns, aspectOf, DRAW_LEVELS, cleanShape } from "../js/shapes.js";

const fam = (s) => (s === "square" || s === "rectangle" ? "quad" : s);
let seed = 11; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
const turn = (strokes, deg) => { const a = deg * Math.PI / 180; return strokes.map((s) => s.map(([x, y]) => [50 + (x - 50) * Math.cos(a) - (y - 50) * Math.sin(a), 50 + (x - 50) * Math.sin(a) + (y - 50) * Math.cos(a)])); };
const shear = (strokes, k) => strokes.map((s) => s.map(([x, y]) => [x + k * (y - 50), y]));
// A hand's wobble: each segment split up and jittered a little.
const wobble = (strokes, amp) => strokes.map((s) => {
  const out = [];
  for (let i = 0; i < s.length - 1; i++) for (let k = 0; k < 8; k++) { const t = k / 8; out.push([s[i][0] + (s[i + 1][0] - s[i][0]) * t + (rnd() - 0.5) * amp, s[i][1] + (s[i + 1][1] - s[i][1]) * t + (rnd() - 0.5) * amp]); }
  out.push(s[s.length - 1]);
  return out;
});

// Every template reads clearly as itself.
for (const t of SHAPE_TEMPLATES) {
  const r = readShape(t.strokes);
  assert.ok(r.clear && fam(r.shape) === t.family, `${t.name} reads as ${r.shape} (clear ${r.clear}, fit ${r.fit.toFixed(2)}, margin ${r.margin.toFixed(2)})`);
}
// Turned 15° more and slanted, a template reads as itself or unclear, never clearly as another.
let unclear = 0, total = 0;
for (const t of SHAPE_TEMPLATES) {
  for (const v of [turn(t.strokes, 15), turn(t.strokes, -15), shear(t.strokes, 0.15), shear(t.strokes, -0.15), wobble(t.strokes, 3)]) {
    const r = readShape(v); total++;
    if (!r.clear) { unclear++; continue; }
    // A sheared square is a rhombus, and a sheared rectangle a parallelogram near one: those may
    // read as a rhombus. Otherwise a clear read is the template's own family.
    const ok = fam(r.shape) === t.family || (t.family === "quad" && r.shape === "rhombus");
    assert.ok(ok, `${t.name}, varied, reads clearly as ${r.shape}`);
  }
}
assert.ok(unclear / total < 0.2, `most varied templates still read (${unclear} of ${total} unclear)`);

// Clean shapes, as one stroke and as one stroke per side, at any size, read right; so do wobbly ones.
const CLEAN = {
  circle: () => [polygon(40).concat([polygon(40)[0]]).map(([x, y]) => [x * 3, y * 3])],
  triangle: () => polygon(3), square: () => [[0, 0], [200, 0], [200, 200], [0, 200]], rectangle: () => [[0, 0], [300, 0], [300, 140], [0, 140]],
  tallRectangle: () => [[0, 0], [90, 0], [90, 200], [0, 200]], rightTriangle: () => [[0, 0], [0, 100], [120, 100]],
  pentagon: () => polygon(5), hexagon: () => polygon(6), rhombus: () => [[50, 0], [85, 60], [50, 120], [15, 60]]
};
const as = { tallRectangle: "rectangle", rightTriangle: "triangle" };
for (const [name, make] of Object.entries(CLEAN)) {
  const shape = as[name] || name, strict = shape === "rhombus";
  const ways = name === "circle" ? [make()] : [closed(make()), sides(make()), wobble(closed(make()).map((s) => s.map(([x, y]) => [x / 2, y / 2])), 3), wobble(sides(make()), 4)];
  for (const st of ways) {
    const r = readShape(st, { strict });
    assert.ok(r.clear && r.shape === shape, `${name} reads as ${r.shape} (clear ${r.clear})`);
    assert.equal(judgeShape(r, shape, strict).outcome, "hit", name);
    // Asked for anything else, it's wrong (the shapes it doesn't also count as).
    for (const other of ["circle", "triangle", "pentagon", "hexagon"]) if (other !== shape) assert.equal(judgeShape(r, other, false).outcome, "wrong", `${name} asked as ${other}`);
  }
}
// A square drawn as four separate lines, in any order, reads.
const sq = [[0, 0], [100, 0], [100, 100], [0, 100]];
assert.equal(readShape([[sq[2], sq[3]], [sq[0], sq[1]], [sq[3], sq[0]], [sq[1], sq[2]]]).shape, "square");
// Square or rectangle, by the aspect: K–2 tells them apart; 3rd grade lets a square be a
// rectangle or a rhombus (a square is both).
const rect = readShape(closed(CLEAN.rectangle())), square = readShape(closed(sq));
assert.equal(judgeShape(square, "rectangle", false).outcome, "wrong");
assert.equal(judgeShape(rect, "square", false).outcome, "wrong");
assert.equal(judgeShape(square, "rectangle", true).outcome, "hit");
assert.equal(judgeShape(square, "rhombus", true).outcome, "hit");
assert.equal(judgeShape(rect, "square", true).outcome, "wrong");
// Nearly square (1.3): not sure which, so asked for either it counts and shows the clean shape.
const nearly = readShape(closed([[0, 0], [130, 0], [130, 100], [0, 100]]));
assert.ok(!nearly.clear);
for (const s of ["square", "rectangle"]) assert.equal(judgeShape(nearly, s, false).outcome, "show", `nearly square, asked ${s}`);
// A tilted rectangle is still long: the aspect is measured at the best turn.
assert.ok(Math.abs(aspectOf(turn([[[0, 30], [100, 30], [100, 70], [0, 70]]], 30)[0]) - 2.5) < 0.1);
// A scribble reads as nothing clear, and is "try again".
const scribble = [Array.from({ length: 60 }, () => [rnd() * 100, rnd() * 100])];
assert.ok(!readShape(scribble).clear);
for (const s of ["circle", "triangle", "square"]) assert.notEqual(judgeShape(readShape(scribble), s).outcome, "hit");
assert.equal(judgeShape(null, "circle").outcome, "retry");
// Corners: 0 for a circle, and the polygons', drawn either way.
assert.equal(countCorners(CLEAN.circle()), 0);
for (const n of [3, 4, 5, 6]) { assert.equal(countCorners(closed(polygon(n))), n, `${n} corners, one stroke`); assert.equal(countCorners(sides(polygon(n))), n, `${n} corners, by sides`); }
// The clean shape fits the drawing's box.
const box = { x: 10, y: 20, w: 200, h: 100 }, cs = cleanShape(rect, "rectangle", box).flat();
assert.ok(cs.every(([x, y]) => x >= 9.9 && x <= 210.1 && y >= 19.9 && y <= 120.1));
assert.equal(spokenDraw("triangle"), "Draw a triangle!");
assert.equal(spokenDraw("oval"), "Draw an oval!");
assert.deepEqual(DRAW_LEVELS.map((l) => l.grade), ["K", "2nd", "3rd"]);

// Counting problems: the answers.
for (let i = 0; i < 300; i++) {
  for (const kind of ["sides", "corners", "faces", "parts", "squares"]) {
    const p = countProblem(kind, rnd);
    if (kind === "sides" || kind === "corners") {
      assert.equal(p.ans, p.pts.length);
      assert.ok(p.ans >= 3 && p.ans <= 6);
      assert.ok(convexTurns(p.pts).every((t) => t >= 25), "every corner a clear turn");
    }
    if (kind === "faces") assert.equal(p.ans, p.solid === "cube" ? 6 : 5);
    if (kind === "parts") assert.ok(p.ans === p.n && p.n >= 2 && p.n <= 4);
    if (kind === "squares") {
      assert.equal(p.ans, p.rows * p.cols);
      // Before answering the hint counts on only partway (to the halfway row, or the first row
      // with 2 or 3 rows): no number in the drawing or the words reaches the answer, and the
      // last counted row is at most half the rows. Worked: every row, "4 + 4 + 4 = 12".
      const before = countSvg(p, { hint: true }), nums = [...before.matchAll(/>(\d+)<\/text>/g)].map((m) => Number(m[1]));
      assert.ok(nums.every((n) => n < p.ans), `${p.rows} × ${p.cols}: the hint shows ${nums}`);
      assert.ok(Math.max(...nums) <= Math.max(p.cols, Math.floor(p.rows / 2) * p.cols));
      assert.ok(!new RegExp(`\\b${p.ans}\\b`).test(countHint(p, false).say), countHint(p, false).say);
      assert.equal(countHint(p, true).say, `${Array(p.rows).fill(p.cols).join(" + ")} = ${p.ans}`);
      assert.ok([...countSvg(p, { hint: true, worked: true }).matchAll(/>(\d+)<\/text>/g)].some((m) => Number(m[1]) === p.ans));
    }
    for (const opt of [{}, { hint: true }, { hint: true, worked: true }]) assert.ok(!/NaN|undefined/.test(countSvg(p, opt)), kind);
    const before = countHint(p, false).say, after = countHint(p, true).say;
    assert.ok(before.endsWith("?"), `${kind}: the hint stops at ?: ${before}`);
    assert.ok(after.includes(String(p.ans)), `${kind}: worked, it says ${p.ans}: ${after}`);
    assert.ok(spokenCount(p).endsWith("?"));
  }
}
// Irregular polygons are irregular: not every side the same.
const ir = irregular(5, rnd), len = ir.map((p, i) => Math.hypot(p[0] - ir[(i + 1) % 5][0], p[1] - ir[(i + 1) % 5][1]));
assert.ok(Math.max(...len) - Math.min(...len) > 5);

console.log("✓ shapes: templates, drawings, judging and counting");
