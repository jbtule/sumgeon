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
// Square or rectangle, by the aspect. A square is a rectangle (and a rhombus), so it counts for
// either in every grade (3rd grade says so; the K and 1st grade guides don't set them apart);
// a long rectangle is never a square. A quadrilateral is any of them.
const rect = readShape(closed(CLEAN.rectangle())), square = readShape(closed(sq));
for (const strict of [false, true]) {
  assert.equal(judgeShape(square, "rectangle", strict).outcome, "hit");
  assert.equal(judgeShape(square, "rhombus", strict).outcome, "hit");
  assert.equal(judgeShape(rect, "square", strict).outcome, "wrong");
  for (const r of [square, rect]) assert.equal(judgeShape(r, "quadrilateral", strict).outcome, "hit");
  for (const s of ["triangle", "circle", "hexagon"]) assert.equal(judgeShape(rect, s, strict).outcome, "wrong");
}
// Nearly square (1.3): not sure which, so asked for a square it counts and shows the clean shape;
// asked for a rectangle, either one answers, so it's a hit.
const nearly = readShape(closed([[0, 0], [130, 0], [130, 100], [0, 100]]));
assert.ok(!nearly.clear);
assert.equal(judgeShape(nearly, "square", false).outcome, "show");
assert.equal(judgeShape(nearly, "rectangle", false).outcome, "hit");
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

// In the game (Polly-Gon): fixed samples with keys, in strands per grade (K, 1st, 2nd, 3rd), each
// level in the school's order; every key its own fact and back; drawing under half of each level
// (so a mouse or keyboard, which asks only counting, can still open the next level).
import { shapeFacts, shapeFactOf, SHAPE_STRANDS, isDrawKey, spokenShape, spokenShapeAnswer, squawkLine, drawHintSvg, drawHint, cleanFor, accepts } from "../js/shapes.js";
import { BANDS, pool, factOf, choose, monsterHP, drawHit, JOIN_AT } from "../js/learn.js";
import { asks } from "../js/traits.js";
import { MON } from "../js/monsters.js";
import { hintFor } from "../js/hints.js";
import { spokenProblem, spokenFact } from "../js/problems.js";
{
  const STRANDS = ["shapesK", "shapesH", "shapesM", "shapesT"];
  const levels = (b) => BANDS[b].levels.map((l) => l.name), sizes = (b) => BANDS[b].levels.map((_, i) => pool(b).filter((f) => f.level === i).length);
  assert.deepEqual(STRANDS.map(levels), [
    ["Circles, squares, triangles, rectangles", "Hexagons, sides and corners"],
    ["Sides and corners", "Halves and fourths"],
    ["Sides, corners and faces", "Equal shares", "Rows and columns of squares"],
    ["Quadrilaterals", "Unit fractions"]]);
  assert.deepEqual(STRANDS.map(sizes), [[10, 11], [17, 8], [17, 11, 12], [12, 11]]);
  assert.equal(shapeFacts().length, 64, "each fact once, though strands share some");
  assert.equal(new Set(shapeFacts().map((f) => f.key)).size, shapeFacts().length);
  for (const b of STRANDS) {
    assert.ok(BANDS[b].strand, `${b} is a strand`);
    for (let L = 0; L < BANDS[b].levels.length; L++) {
      const here = pool(b).filter((f) => f.level === L), draws = here.filter((f) => isDrawKey(f.key));
      assert.ok(draws.length / here.length <= 0.4, `${b} level ${L + 1}: ${draws.length} of ${here.length} drawn`);
      // Counting alone (on a mouse or keyboard, nothing is drawn) learns enough of a level for the
      // path's next step to join (learn.js JOIN_AT).
      assert.ok(1 - draws.length / here.length >= JOIN_AT, `${b}: counting alone can open the next step`);
    }
    for (const f of pool(b)) {
      const g = factOf(f.key, () => 0.3);
      assert.equal(g.key, f.key, `${f.key} round-trips`);
      assert.ok(g.op === "◇" && /^◇(draw|sides|corners|faces|parts|squares|unit):/.test(f.key), f.key);
      assert.ok(Number.isInteger(g.ans) && g.ans >= 0, `${f.key}: a whole number`);
      if (!g.draw) assert.ok(g.ans >= 2 && g.ans <= 20, `${f.key}: ${g.ans} to type`);
      // Asked and answered in words, recorded (lines.test checks the plan has them).
      assert.ok(spokenProblem(g) === spokenShape(g) && spokenFact(g) === spokenShapeAnswer(g) && !/\d|undefined/.test(spokenProblem(g) + spokenFact(g)), `${f.key}: ${spokenProblem(g)} / ${spokenFact(g)}`);
      assert.ok(/^Squawk! /.test(squawkLine(g)) && squawkLine(g).split(" ").length <= 6, squawkLine(g));
      // A hint never gives the count away before answering, and says it worked.
      if (!g.draw) {
        const before = hintFor(g, false), after = hintFor(g, true);
        assert.ok(!new RegExp(`\\b${g.ans}\\b`).test(before.say.replace(/1\/\?/, "")), `${f.key}: ${before.say}`);
        assert.ok(![...before.model.matchAll(/>([^<]*)<\/text>/g)].some((m) => m[1] === String(g.ans)), `${f.key}: the drawing doesn't count to ${g.ans}`);
        assert.ok([...after.model.matchAll(/>([^<]*)<\/text>/g)].some((m) => m[1] === String(g.ans) || m[1] === `1/${g.ans}`) || g.kind === "faces", `${f.key}: worked, it counts to ${g.ans}`);
      }
    }
  }
  // The grades: K draws and counts its four shapes then hexagons; 1st adds halves and fourths;
  // 2nd pentagons, a cube's faces, thirds, and squares in rows; 3rd rhombuses, quadrilaterals and
  // unit fractions. Each stratum's own.
  const keys = (b) => pool(b).map((f) => f.key);
  assert.ok(["◇draw:circle", "◇draw:sq", "◇draw:tri", "◇draw:rect", "◇draw:hex", "◇sides:tri", "◇corners:5"].every((k) => keys("shapesK").includes(k)));
  assert.ok(!keys("shapesK").some((k) => /pent|parts|faces|squares|unit|rhom|quad/.test(k)), "K: no pentagons, parts, faces or fractions");
  assert.ok(keys("shapesH").includes("◇parts:circle4") && !keys("shapesH").some((k) => /circle3|rect3|squares|unit|faces/.test(k)), "1st: halves and fourths, not thirds");
  assert.ok(["◇draw:pent", "◇faces:cube", "◇faces:pyramid", "◇parts:circle3", "◇squares:3,4"].every((k) => keys("shapesM").includes(k)));
  assert.ok(["◇draw:quad", "◇draw:rhom", "◇unit:circle8", "◇unit:rect6g"].every((k) => keys("shapesT").includes(k)) && BANDS.shapesT.strict);
  assert.deepEqual(["◇faces:cube", "◇faces:pyramid", "◇squares:3,4", "◇unit:rect6g", "◇parts:rect2x"].map((k) => factOf(k).ans), [6, 5, 12, 6, 2]);
  // A drawing hits for its strand's typical answer: the mean of its counting answers.
  assert.deepEqual(STRANDS.map(drawHit), [4, 4, 6, 5]);
  // Polly-Gon asks only shapes, and nobody else does.
  const polly = MON.find((m) => m.n === "Polly-Gon");
  for (const b of STRANDS) for (const f of pool(b)) assert.ok(asks(polly)(f.op, f.key), f.key);
  for (const m of MON.filter((x) => x !== polly)) assert.ok(!asks(m)("◇", "◇sides:3") || m.n === "Judo Judy", `${m.n} doesn't ask shapes`);
  assert.ok(!asks(polly)("+", "+3,4"));
  // On a mouse or keyboard, drawing is never asked: choose only counting.
  const noDraw = (o, k) => asks(polly)(o, k) && !isDrawKey(k);
  for (let i = 0; i < 200; i++) assert.ok(!isDrawKey(choose("shapesK", {}, { now: 0, rnd: Math.random, asks: noDraw })));
  // Its HP is a fight's worth of its strand's answers, drawings counted at their hit.
  for (const b of STRANDS) { const hp = monsterHP(polly, b, {}); assert.ok(hp >= 10 && hp <= 30, `${b}: ${hp} HP`); }
  // Drawing: the hint joins the dots partway, worked it's the whole shape; the clean shape fits.
  for (const s of ["circle", "triangle", "square", "rectangle", "rhombus", "pentagon", "hexagon", "quadrilateral"]) {
    for (const w of [false, true]) assert.ok(!/NaN|undefined/.test(drawHintSvg(s, w) + drawHint(s, w).say), s);
    for (const r of [null, readShape(closed(polygon(3)))]) {
      const c = cleanFor(r, s, { x: 0, y: 0, w: 200, h: 120 }).flat();
      assert.ok(c.length > 2 && c.every(([x, y]) => x >= -0.1 && x <= 200.1 && y >= -0.1 && y <= 120.1), `clean ${s}`);
    }
  }
  assert.deepEqual([...accepts("quadrilateral")].sort(), ["quadrilateral", "rectangle", "rhombus", "square"]);
  assert.equal(spokenShape(shapeFactOf("◇draw:tri")), "Draw a triangle!");
  assert.equal(spokenShapeAnswer(shapeFactOf("◇unit:circle4")), "Each part is one fourth.");
  assert.equal(spokenShapeAnswer(shapeFactOf("◇parts:rect2x")), "Two equal parts: halves.");
  assert.equal(squawkLine(shapeFactOf("◇draw:hex")), "Squawk! Polly want a hexagon!");
  // Named shapes come turned the ways they're met, and still have their corners.
  for (let i = 0; i < 40; i++) for (const k of ["◇sides:tri", "◇sides:sq", "◇sides:rect", "◇sides:rhom", "◇sides:pent", "◇sides:hex"]) { const g = shapeFactOf(k); assert.equal(g.pts.length, g.ans, k); }
}
console.log("✓ shapes in the game: keys, strands, levels, hints, Polly-Gon");
