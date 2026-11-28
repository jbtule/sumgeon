// Measuring length (js/length.js, the prototype page): the facts and their keys, drawings that
// measure true (each thing's ends on the ruler's ticks, units end to end), hints that never give
// the answer before answering, and the words.
import assert from "node:assert/strict";
import { LENGTH_LEVELS, lengthFacts, lengthFactOf, lengthProblem, lengthSvg, lengthHint, lengthLine, lengthRight, spokenLength, spokenLengthAnswer, keysOf, counted, UNITS, X0, W, STICKS, SMALL, BIG, thing } from "../js/length.js";

const facts = lengthFacts();
const num = (s) => Number(s);
const attrs = (s, cls) => [...s.matchAll(new RegExp(`<g class="${cls}"[^>]*data-x0="([\\d.]+)" data-x1="([\\d.]+)"`, "g"))].map((m) => [num(m[1]), num(m[2])]);
const ticks = (s) => [...s.matchAll(/<line x1="([\d.]+)"[^>]*class="tick"/g)].map((m) => num(m[1]));
const hopLabels = (s) => [...s.matchAll(/class="hop">([^<]*)</g)].map((m) => m[1]);
const near = (a, b) => Math.abs(a - b) < 0.02;

// Every level has facts; keys are unique, start with ℓ and find their fact again.
assert.equal(new Set(facts.map((f) => f.key)).size, facts.length, "keys are unique");
for (const lv of LENGTH_LEVELS) assert.ok(facts.some((f) => f.set === lv.id), `${lv.id} has facts`);
assert.deepEqual(Object.fromEntries(LENGTH_LEVELS.map((lv) => [lv.id, facts.filter((f) => f.set === lv.id).length])),
  { compare: 20, order: 16, indirect: 12, cubes: 10, clips: 8, gaps: 16, inches: 10, cm: 14, big: 17, from: 24, which: 16, estimate: 13, diff: 16, addsub: 16, halves: 10, quarters: 10 });
for (const f of facts) {
  assert.ok(f.key.startsWith("ℓ") && f.op === "ℓ", f.key);
  assert.equal(lengthFactOf(f.key), f);
  let seed = 1;
  assert.equal(lengthProblem(f.set, () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)).set, f.set);
}
assert.deepEqual(lengthFactOf("ℓc:pencil8,toothbrush6").ans, "L");
// Two shown together are never two of the sticks (pencil, crayon, marker), and each has its name
// under it; one shown alone has none.
for (const f of facts.filter((f) => f.things)) {
  assert.ok(f.things.filter((t) => STICKS.includes(t.name)).length <= 1, `${f.key}: one stick at most`);
  assert.deepEqual([...lengthSvg(f).matchAll(/class="objlab">([^<]*)</g)].map((m) => m[1]), f.things.map((t) => t.name), `${f.key}: named`);
}
for (const f of facts.filter((f) => !f.things)) assert.ok(!lengthSvg(f).includes('class="objlab"'), `${f.key}: no name for one alone`);
// Every thing draws at the smallest size it's shown (a 1-inch ruler's 32) with real numbers.
for (const n of [...SMALL, ...BIG]) for (const w of [32, 80, 300]) assert.ok(!/NaN|undefined|Infinity/.test(thing(n, X0, X0 + w, 40)), `${n} at ${w}`);
assert.equal(lengthFactOf("ℓnope"), null);

for (const f of facts) {
  const plain = lengthSvg(f), hint = lengthSvg(f, { hint: true }), worked = lengthSvg(f, { hint: true, worked: true });
  for (const s of [plain, hint, worked]) assert.ok(!/NaN|undefined|Infinity/.test(s), `${f.key}: real numbers`);
  assert.deepEqual(hopLabels(plain), [], `${f.key}: no counting without the hint`);
  const ans = [].concat(f.ans);
  const before = lengthHint(f, false).say, after = lengthHint(f, true).say;
  assert.ok(before && after && before !== after, `${f.key}: a hint and a worked hint`);
  assert.ok(spokenLength(f).endsWith("?") && spokenLengthAnswer(f).length > 4, f.key);
  assert.equal(lengthLine(f).filter((x) => x === null).length, ans.length, `${f.key}: a slot per answer`);
  assert.ok(lengthRight(f, ans.map(String)), `${f.key}: its answer is right`);
  const things = attrs(plain, "obj");

  if (f.kind === "compare" || f.kind === "order") {
    // Lined up at the left, each as long as its length (the same unit for all).
    assert.ok(things.every(([a]) => near(a, X0)), `${f.key}: lined up`);
    const u = (things[0][1] - things[0][0]) / f.things[0].len;
    things.forEach(([a, b], i) => assert.ok(near(b - a, f.things[i].len * u), `${f.key}: thing ${i} is its length`));
    const [a, b] = f.things;
    if (f.kind === "compare") assert.equal(f.ans, a.len > b.len ? "L" : "S");
    else {
      const lens = f.things.map((t) => t.len), best = f.most === "longest" ? Math.max(...lens) : Math.min(...lens);
      assert.equal(f.ans, f.things[f.ask].len === best ? "Y" : "N", f.key);
      assert.equal(new Set(lens).size, 3, "no ties");
    }
  }
  if (f.kind === "indirect") {
    const strings = attrs(plain, "string");
    assert.equal(strings.length, 2);
    assert.ok(near(strings[0][1] - strings[0][0], strings[1][1] - strings[1][0]), "the same string both times");
    assert.ok(near(strings[0][0], things[0][0]) && near(strings[1][0], things[1][0]), "each lined up with its thing");
    assert.notEqual(things[0][0], things[1][0], "the two things aren't lined up with each other");
    const [a, b] = f.things;
    assert.ok((a.len - f.string) * (b.len - f.string) < 0, `${f.key}: the string is between them`);
    assert.equal(f.ans, a.len > b.len ? "L" : "S");
  }
  if (f.kind === "units" || f.kind === "gaps") {
    const units = attrs(plain, "unit"), [[x0, x1]] = things, u = units[0][1] - units[0][0];
    if (f.kind === "units") {
      // End to end from the thing's left end to its right, no gaps, no overlaps.
      assert.equal(units.length, f.len);
      assert.ok(near(units[0][0], x0) && near(units[units.length - 1][1], x1), `${f.key}: from end to end`);
      units.slice(1).forEach(([a], i) => assert.ok(near(a, units[i][1]), `${f.key}: no gap or overlap`));
      assert.equal(f.ans, f.len);
      // The hint counts about half the units before answering; worked, all of them.
      const hl = hopLabels(hint);
      assert.deepEqual(hl, Array.from({ length: counted(f.len) }, (_, k) => String(k + 1)).concat("?"), `${f.key}: counted partway`);
      assert.ok(!hl.includes(String(f.len)) && !new RegExp(`\\b${f.len}\\b`).test(before), `${f.key}: ${before}`);
      assert.deepEqual(hopLabels(worked), Array.from({ length: f.len }, (_, k) => String(k + 1)));
    } else {
      const gaps = units.slice(1).map(([a], i) => a - units[i][1]);
      const flaw = units[0][0] > x0 + 0.5 ? "start" : gaps.some((g) => g > 0.5) ? "gap" : gaps.some((g) => g < -0.5) ? "overlap" : "ok";
      assert.equal(flaw, f.flaw, `${f.key}: drawn ${flaw}`);
      if (f.flaw === "ok") assert.ok(near(units[units.length - 1][1], x1), `${f.key}: right is right to the end`);
      assert.equal(f.ans, f.flaw === "ok" ? "Y" : "N");
      assert.ok(u > 0);
    }
  }
  if (f.kind === "ruler" || f.kind === "frac" || f.kind === "which" || f.kind === "diff") {
    // The ruler: a tick at every whole unit, evenly, from X0 to X0 + W; the thing from its start's
    // tick to its end's.
    const t = ticks(plain), units = t.length - 1, u = W / units;
    assert.ok(near(t[0], X0) && near(t[units], X0 + W), `${f.key}: the ruler's ends`);
    t.slice(1).forEach((x, i) => assert.ok(near(x - t[i], u), `${f.key}: even ticks`));
    assert.ok(plain.includes(`>${UNITS[f.unit].many}<`), `${f.key}: the ruler says its units`);
    if (f.kind === "diff") {
      things.forEach(([a, b], i) => assert.ok(near(a, X0) && near(b, X0 + f.things[i].len * u), `${f.key}: thing ${i} from 0`));
      const [a, b] = f.things, lo = Math.min(a.len, b.len), hi = Math.max(a.len, b.len);
      assert.equal(f.ans, hi - lo);
      assert.ok(f.ans !== lo && f.ans !== hi, `${f.key}: the answer isn't one of the lengths`);
      const hl = hopLabels(hint);
      assert.ok(!hl.includes(String(f.ans)) && hl[hl.length - 1] === "?", `${f.key}: ${hl}`);
      assert.ok(!new RegExp(`(^|[^\\d])${f.ans}([^\\d]|$)`).test(before.replace(new RegExp(`\\b(${lo}|${hi})\\b`, "g"), "")), `${f.key}: ${before}`);
      assert.ok(after.includes(`${hi} − ${lo} = ${f.ans}`));
    } else {
      const [[a, b]] = things;
      assert.ok(near(a, X0 + f.start * u) && near(b, X0 + (f.start + f.len) * u), `${f.key}: on the ticks`);
    }
    if (f.kind === "ruler") {
      assert.equal(f.ans, f.len);
      assert.ok(f.start + f.len <= UNITS[f.unit].max, `${f.key}: fits the ruler`);
      if (f.start) assert.ok(f.len !== f.start, `${f.key}: the answer isn't where it starts`);
      // Hops from the start, about half counted, the last "?"; the words stop short too.
      const hl = hopLabels(hint);
      assert.deepEqual(hl, Array.from({ length: counted(f.len) }, (_, k) => String(k + 1)).concat("?"), `${f.key}: ${hl}`);
      assert.deepEqual(hopLabels(worked), Array.from({ length: f.len }, (_, k) => String(k + 1)));
      const shown = f.start ? [f.start, f.start + f.len] : [0];
      assert.ok(!new RegExp(`(^|[^\\d])${f.len}([^\\d/]|$)`).test(before.replace(new RegExp(`\\b(${shown.join("|")})\\b`, "g"), "")), `${f.key}: ${before}`);
      assert.ok(new RegExp(`\\b${f.len} ${UNITS[f.unit].ab}\\b`).test(after), `${f.key}: ${after}`);
    }
    if (f.kind === "frac") {
      assert.deepEqual(f.ans, [f.whole, f.num]);
      assert.ok(f.whole >= 1 && f.num > 0 && f.num < f.den);
      // Every 1/den has a tick (the small ones), each whole a labeled tick.
      const all = [...plain.matchAll(/<line x1="([\d.]+)" y1="\d+" x2="[\d.]+" y2="\d+" stroke="#0c171c" stroke-width="(?:2.6|1.6)"/g)].length;
      assert.equal(all, 6 * f.den + 1, `${f.key}: a tick every 1/${f.den}`);
      const hl = hopLabels(hint);
      assert.equal(hl[hl.length - 1], "?");
      if (f.den === 2) assert.ok(!hl.includes(`${f.whole}½`) && !before.includes(`${f.whole}½`), `${f.key}: ${before}`);
      else assert.ok(!hl.includes(String(f.num)) && !before.includes(`${f.num}/4`) && !new RegExp(`\\b${f.whole}\\b`).test(before.replace(/4 parts|past it: 1, …|[\d?]*\/4/g, "")), `${f.key}: ${before}`);
      assert.ok(lengthRight(f, [String(f.whole), String(f.num)]) && !lengthRight(f, [String(f.whole), ""]) && !lengthRight(f, [String(f.whole + 1), String(f.num)]));
    }
    if (f.kind === "which") {
      assert.equal(f.ans, UNITS[f.to] && ["M", "F"].includes(f.ans) ? f.ans : null);
      const SIZE = { cm: 1, in: 2.54, ft: 30.48, yd: 91.44, m: 100 };
      assert.equal(f.ans, SIZE[f.to] < SIZE[f.unit] ? "M" : "F", f.key);
      assert.ok(!/^(More|Fewer)\b/.test(before));
    }
  }
  if (f.kind === "estimate") {
    // One unit shown, no ruler; the hint lays down a couple of copies, never all of them.
    assert.equal(ticks(plain).length, 0, "no ruler");
    assert.ok(plain.includes(`= 1 ${UNITS[f.unit].ab}`));
    const n = hopLabels(hint).filter((x) => /^\d+$/.test(x)).length;
    assert.ok(n < f.len && n <= 2, `${f.key}: ${n} laid before answering`);
    assert.equal(hopLabels(worked).filter((x) => /^\d+$/.test(x)).length, f.len);
    assert.ok(!new RegExp(`\\b${f.len}\\b`).test(before.replace(/\b1 (in|cm)\b/, "")), before);
    const tol = f.unit === "cm" ? 2 : 1;
    assert.ok(lengthRight(f, [String(f.len + tol)]) && lengthRight(f, [String(f.len - tol)]) && !lengthRight(f, [String(f.len + tol + 1)]), `${f.key}: close is right`);
  }
  if (f.kind === "addsub") {
    assert.equal(f.ans, f.sign === "+" ? f.a + f.b : f.a - f.b);
    assert.ok(f.ans !== f.a && f.ans !== f.b && f.a <= 20 && (f.sign === "−" || f.ans <= 20), f.key);
    assert.ok(before.endsWith("= ?") && !before.includes(String(f.ans)) || before === `${f.a} ${f.sign} ${f.b} = ?`, before);
    assert.ok(!hint.includes(`>${f.ans}<`) && !plain.includes(`>${f.ans} ${UNITS[f.unit].ab}<`), `${f.key}: no answer drawn`);
    assert.ok(worked.includes(`>${f.ans}<`));
  }
  // The two-key kinds: the words before answering never say which.
  if (keysOf(f)) {
    assert.ok(keysOf(f).some(([k]) => k === f.ans), f.key);
    if (f.kind === "compare" || f.kind === "indirect") assert.ok(!/longer|shorter/i.test(before), `${f.key}: ${before}`);
    if (f.kind === "order" || f.kind === "gaps") assert.ok(!/^(Yes|No)\b/.test(before));
    assert.ok(!before.includes(spokenLengthAnswer(f)));
  }
}

// What the voice says.
assert.equal(spokenLength(lengthFactOf("ℓc:pencil8,toothbrush6")), "Is the pencil longer or shorter than the toothbrush?");
assert.equal(spokenLengthAnswer(lengthFactOf("ℓc:pencil8,toothbrush6")), "The pencil is longer than the toothbrush.");
const inch = facts.find((f) => f.key === "ℓin:toothbrush1-6");
assert.equal(spokenLength(inch), "How many inches long is the toothbrush?");
assert.equal(spokenLengthAnswer(inch), "The toothbrush is five inches long.");
assert.equal(lengthHint(inch, false).say, "It starts at 1, not 0. Count the jumps from 1, or 6 − 1 = ?");
const q = facts.find((f) => f.set === "quarters" && f.num === 3);
assert.match(spokenLengthAnswer(q), /^[A-Z][a-z]+ and three quarters inches\.$/);
assert.equal(spokenLength(q), `How long is the ${q.name}, to the nearest quarter inch?`);
assert.equal(spokenLengthAnswer(facts.find((f) => f.kind === "units" && f.len === 1) || { kind: "units", name: "pencil", unit: "cube", len: 1 }), "The pencil is one cube long.");
// Every level's words are short enough to hear (a pre-reader can't read them).
for (const f of facts) assert.ok(spokenLength(f).split(" ").length <= 18, spokenLength(f));
console.log("✓ length: facts, true rulers, hints that stop short, words");
