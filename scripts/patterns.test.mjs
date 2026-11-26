// What comes next (Slimelipsis, js/patterns.js, the prototype page): every row's answer, the
// levels' ranges, the words, the hint, and that every number fits in its slime.
import assert from "node:assert/strict";
import { PATTERN_LEVELS, allPatterns, patternProblem, spokenPattern, spokenPatternAnswer, patternText, patternSvg, patternHint, fontFor, textWidth, rowWidth, INNER, BLOB, ODD_LEVELS, oddEvenProblem, oddEvenSvg, oddEvenHint, spokenOddEven } from "../js/patterns.js";

const STEP = { ones: 1, tens: 10, back: -1, back20: -1, to120: 1, fives: 5, twos: 2, hundreds: 100 };
for (const { id } of PATTERN_LEVELS) {
  const all = allPatterns(id);
  assert.ok(all.length >= 7, `${id}: enough rows`);
  const keys = new Set(all.map(patternText));
  assert.equal(keys.size, all.length, `${id}: each row once`);
  for (const p of all) {
    const what = `${id} ${patternText(p)}`;
    // The numbers go up (or down) by one step, and the answer is the hidden one.
    const step = p.nums[1] - p.nums[0];
    p.nums.forEach((n, i) => assert.equal(n, p.nums[0] + i * step, `${what}: one step each`));
    assert.equal(p.ans, p.nums[p.blank], what);
    assert.equal(p.step, step, what);
    if (STEP[id]) assert.equal(step, STEP[id], what);
    // Whole numbers to type, 3 or 4 shown with the □.
    assert.ok(p.nums.every((n) => Number.isInteger(n) && n >= 1), what);
    assert.ok(p.nums.length === 4 || p.nums.length === 5, what);
    if (id === "middle") assert.ok(p.blank > 0 && p.blank < p.nums.length - 1, `${what}: the □ is in the middle`);
    else assert.equal(p.blank, p.nums.length - 1, `${what}: the □ comes last`);
    // Each level's range (the standards').
    const hi = Math.max(...p.nums);
    if (id === "ones" || id === "back") assert.ok(hi <= 20, what);
    if (id === "tens" || id === "fives") assert.ok(hi <= 100, what);
    if (id === "to120") assert.ok(hi <= 120 && hi > 95, what);
    if (id === "twos") assert.ok(hi <= 50 && p.nums.every((n) => n % 2 === 0), what);
    if (id === "hundreds" || id === "middle") assert.ok(hi <= 1000, what);
    if (id === "back") assert.ok(p.nums[0] <= 20 && step === -1, what);
    // 1st grade counts back from 20, four shown, down to ten or past it.
    if (id === "back20") assert.ok(p.nums[0] <= 20 && p.nums[0] >= 11 && p.nums.length === 5 && p.ans <= 16, what);
    // The hint: one hop per gap, labeled with the step; the hop into the □ asks "= ?" until it's
    // worked, and the words finish it.
    const before = patternHint(p, false), after = patternHint(p, true);
    const sign = step < 0 ? "−" : "+", k = Math.abs(step);
    assert.equal(before.hops.labels.length, p.nums.length - 1);
    before.hops.labels.forEach((l, i) => assert.equal(l, i === p.blank - 1 ? `${sign}${k} = ?` : `${sign}${k}`, what));
    assert.ok(after.hops.labels.every((l) => l === `${sign}${k}`), what);
    assert.ok(before.say.endsWith(`${p.nums[p.blank - 1]} ${sign} ${k} = ?`), `${what}: ${before.say}`);
    assert.ok(after.say.endsWith(`= ${p.ans}`), `${what}: ${after.say}`);
    assert.ok(!before.say.includes(`= ${p.ans}`), `${what}: the hint doesn't give the answer`);
    // The drawing.
    for (const opt of [{}, { typed: "12" }, { state: "right" }, { state: "wrong", hops: after.hops }, { hops: before.hops }]) {
      const s = patternSvg(p, opt);
      assert.ok(s.startsWith("<svg") && !/NaN|undefined/.test(s), what);
    }
    // Every number fits in its slime (Bungee's widest digit is about 0.73 em; DIGIT_EM is 0.78),
    // and stays big enough to read: at least 20 in the drawing, which shrinks at most to 0.95 on a
    // 375-wide phone for 4 slimes.
    for (const n of p.nums) {
      assert.ok(textWidth(n) <= INNER, `${what}: ${n} fits (${textWidth(n)} of ${INNER})`);
      assert.ok(fontFor(n) >= 20, `${what}: ${n} is big enough (${fontFor(n)})`);
    }
  }
}
// The row fits an iPhone SE: 375 wide less the gutters is about 343 px; every number keeps at
// least 18 px on screen.
for (const { id } of PATTERN_LEVELS) {
  for (const p of allPatterns(id)) {
    const scale = Math.min(1, 343 / rowWidth(p.nums.length));
    for (const n of p.nums) assert.ok(fontFor(n) * scale >= 18, `${id} ${patternText(p)}: ${n} at ${(fontFor(n) * scale).toFixed(1)} px`);
  }
}
assert.equal(rowWidth(4), 4 * BLOB + 3 * 12);
assert.equal(fontFor(7), 40);
assert.ok(fontFor(1000) < fontFor(100) && fontFor(100) < fontFor(10));
// 1000 shows up (by 100s ends there).
assert.ok(allPatterns("hundreds").some((p) => p.ans === 1000));
assert.ok(allPatterns("to120").some((p) => p.ans === 120) && allPatterns("to120").some((p) => p.ans === 100));

// Random rows come from the level's set; to120 often lands on a new ten.
let r = 1; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
for (const { id } of PATTERN_LEVELS) {
  const keys = new Set(allPatterns(id).map(patternText));
  for (let i = 0; i < 100; i++) assert.ok(keys.has(patternText(patternProblem(id, rnd))), id);
}
const tens = Array.from({ length: 200 }, () => patternProblem("to120", rnd)).filter((p) => p.ans % 10 === 0).length;
assert.ok(tens > 80, `to120 lands on a ten often (${tens} of 200)`);

// The words.
const twos = { nums: [2, 4, 6, 8], blank: 3, ans: 8, step: 2 };
assert.equal(spokenPattern(twos), "Two, four, six. What comes next?");
assert.equal(spokenPatternAnswer(twos), "Eight comes next.");
assert.equal(patternText(twos), "2, 4, 6, □");
const mid = { nums: [2, 4, 6, 8], blank: 1, ans: 4, step: 2 };
assert.equal(spokenPattern(mid), "Two, blank, six, eight. What's missing?");
assert.equal(spokenPatternAnswer(mid), "Four is missing.");
assert.equal(patternHint(twos, false).say, "Each slime is 2 more. 6 + 2 = ?");
assert.equal(patternHint({ nums: [10, 9, 8, 7], blank: 3, ans: 7, step: -1 }, true).say, "Each slime is 1 less. 8 − 1 = 7");
assert.deepEqual(patternHint(mid, false).hops.labels, ["+2 = ?", "+2", "+2"]);

// Odd and even: the count is right, varies, and is never all of them.
for (const lv of ODD_LEVELS) {
  const answers = new Set(), share = [];
  for (let i = 0; i < 600; i++) {
    const p = oddEvenProblem(lv.id, rnd);
    const want = p.ask === "even" ? 0 : 1;
    assert.equal(p.ans, p.nums.filter((n) => n % 2 === want).length, `${lv.id}: the count`);
    assert.ok(p.nums.length >= 5 && p.nums.length <= 8);
    assert.ok(p.ans < p.nums.length, `${lv.id}: never all of them (${p.nums}, ${p.ask})`);
    assert.equal(new Set(p.nums).size, p.nums.length, "different numbers");
    assert.ok(p.nums.every((n) => n >= 1 && n <= lv.max));
    answers.add(p.ans); share.push(p.ans / p.nums.length);
    for (const opt of [{}, { hint: true }, { hint: true, worked: true }]) {
      const s = oddEvenSvg(p, opt);
      assert.ok(!/NaN|undefined/.test(s));
      // Worked, exactly the asked kind are numbered.
      if (opt.worked) assert.equal((s.match(/font-size="15" fill="#0c171c">\d+</g) || []).length, p.ans);
    }
    assert.ok(!/\d+ (even|odd) number/.test(oddEvenHint(p, false).say), "the hint before answering is the rule, not the count");
    assert.ok(oddEvenHint(p, true).say.includes(`${p.ans} ${p.ask}`));
  }
  assert.ok(answers.has(0) && answers.has(1) && answers.size >= 6, `${lv.id}: counts vary (${[...answers]})`);
  const far = share.filter((x) => x < 0.3 || x > 0.7).length / share.length;
  assert.ok(far > 0.25, `${lv.id}: often not about half (${far.toFixed(2)})`);
}
assert.equal(spokenOddEven({ ask: "even" }), "How many even numbers?");

console.log("✓ patterns: rows, answers, hints and sizes; odd and even");

