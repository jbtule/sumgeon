// Fractions on a number line (js/numberline.js, the prototype page): answers, even ticks, and
// labels that never show the answer before it's answered.
import assert from "node:assert/strict";
import { LINE_LEVELS, lineProblem, lineSvg, lineHint, spokenLine, spokenLineAnswer, tickX, LINE, DENOMS } from "../js/numberline.js";

let seed = 3; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
const labels = (s) => [...s.matchAll(/class="lab">([^<]*)</g)].map((m) => m[1]);
const ticks = (s) => [...s.matchAll(/<line x1="([\d.]+)"[^>]*class="tick"/g)].map((m) => Number(m[1]));
const seen = new Set();
for (const lv of LINE_LEVELS) {
  for (let i = 0; i < 300; i++) {
    const p = lineProblem(lv.id, rnd);
    seen.add(`${lv.id} ${p.n}/${p.d}`);
    assert.ok(DENOMS.includes(p.d));
    if (p.kind === "parts") assert.equal(p.ans, p.d);
    else assert.equal(p.ans, p.n);
    if (lv.id === "where") assert.ok(p.n >= 1 && p.n < p.d && p.wholes === 1, "0 to 1, strictly between");
    if (lv.id === "past1") assert.ok(p.wholes === 2 && p.n >= p.d && p.n <= 2 * p.d, "0 to 2, from 1 on");
    // Ticks: one per part and evenly spaced, 0 and the last whole at the ends.
    const t = ticks(lineSvg(p));
    assert.equal(t.length, p.d * p.wholes + 1);
    const gaps = t.slice(1).map((x, k) => x - t[k]);
    assert.ok(gaps.every((g) => Math.abs(g - gaps[0]) < 0.02), `${p.n}/${p.d}: even ticks`);
    assert.ok(Math.abs(t[0] - LINE.x0) < 0.01 && Math.abs(t[t.length - 1] - (LINE.x0 + LINE.w)) < 0.01);
    // The answer is never on show before answering: without the hint only the wholes are labeled;
    // with it, the hop to the dot (or the last part) is "?".
    const plain = labels(lineSvg(p));
    assert.deepEqual(plain, Array.from({ length: p.wholes + 1 }, (_, k) => String(k)), "only 0, 1 (and 2)");
    const hint = labels(lineSvg(p, { hint: true }));
    if (p.kind === "where") {
      const tops = hint.slice(p.wholes + 1).filter((_, k) => k % 2 === 0);
      assert.equal(tops.length, p.n, "a hop for each part to the dot");
      assert.equal(tops[tops.length - 1], "?");
      assert.ok(!tops.includes(String(p.n)), "the dot's numerator is hidden");
      assert.equal(labels(lineSvg(p, { hint: true, worked: true })).filter((x) => x === String(p.n)).length >= 1, true);
      assert.ok(lineHint(p, false).say.endsWith(`?/${p.d}`));
      assert.ok(lineHint(p, true).say.includes(`${p.n}/${p.d}`));
    } else {
      // Before answering it counts to halfway (an even count) or just the first part (odd), never
      // to the end; the words say no total. Worked, every part.
      // (The part numbers come first in the drawing, then the 0 and 1 under the line.)
      const parts = labels(lineSvg(p, { hint: true })).filter((x) => /^\d+$/.test(x)).slice(0, -2).map(Number);
      assert.ok(!parts.includes(p.d), `${p.d} parts: the hint doesn't count to ${p.d} (${parts})`);
      assert.equal(Math.max(...parts), p.d % 2 ? 1 : p.d / 2);
      assert.ok(!new RegExp(`\\b${p.d}\\b`).test(lineHint(p, false).say), lineHint(p, false).say);
      assert.equal(labels(lineSvg(p, { hint: true, worked: true })).filter((x) => /^\d+$/.test(x)).slice(0, -2).map(Number).pop(), p.d);
      assert.ok(lineHint(p, true).say.includes(`${p.d} equal parts`));
    }
    assert.ok(!/NaN|undefined/.test(lineSvg(p, { hint: true, worked: true })));
  }
}
// Eighths come up, whole numbers as fractions too (4/4 at the 1).
assert.ok([...seen].some((x) => x.endsWith("/8")));
assert.ok([...seen].some((x) => { const m = x.match(/past1 (\d+)\/(\d+)/); return m && Number(m[1]) % Number(m[2]) === 0; }));
// Eighths on a 375-wide phone: each part over 30 px (the line is drawn LINE.w of 360 units wide).
assert.ok((tickX({ d: 8, wholes: 1 }, 1) - tickX({ d: 8, wholes: 1 }, 0)) * (343 / 360) > 30);
// Words, as the Tower says fractions ("one half equals what fourths").
assert.equal(spokenLine({ kind: "where", d: 4 }), "Where is the dot? What fourths?");
assert.equal(spokenLine({ kind: "where", d: 2 }), "Where is the dot? What halves?");
assert.equal(spokenLineAnswer({ kind: "where", n: 3, d: 4 }), "It's three fourths.");
assert.equal(spokenLineAnswer({ kind: "where", n: 1, d: 8 }), "It's one eighth.");
assert.equal(spokenLine({ kind: "parts" }), "How many equal parts from zero to one?");
console.log("✓ number line: answers, ticks, hidden labels, words");
