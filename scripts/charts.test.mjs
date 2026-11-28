// Reading charts (Graphzilla, js/charts.js, the prototype page): fixed facts whose keys round-trip,
// answers that are whole numbers, clean drawings that fit, hints that never give the answer before
// it's answered, and spoken lines a pre-reader can follow.
import assert from "node:assert/strict";
import { CHART_LEVELS, chartFacts, chartFactOf, chartProblem, chartSvg, chartHint, chartLine, chartQuestion, spokenChart, spokenChartAnswer, platesOf, OBJECTS, W, H, lenLabel, lenWords, shownOf } from "../js/charts.js";
import { MON, LOOKS, svg } from "../js/monsters.js";
import { traitOf, asks } from "../js/traits.js";
import { BANDS, pool } from "../js/learn.js";
import { WINGS, PATHS } from "../js/wings.js";
import { spoken } from "../js/problems.js";

const facts = chartFacts();
const factOfKey = (k) => chartFactOf(k);
const labels = (s) => [...s.matchAll(/class="lab">([^<]*)</g)].map((m) => m[1]);
const nums = (t) => (String(t).match(/\d+/g) || []).map(Number);
const words = (t) => t.split(/\s+/).filter(Boolean).length;
const minus = (a, b) => { const left = b.slice(); return a.filter((x) => { const i = left.indexOf(x); if (i < 0) return true; left.splice(i, 1); return false; }); };

// Every level has its facts, each key once, and each key is the whole problem.
assert.equal(new Set(facts.map((f) => f.key)).size, facts.length, "each fact once");
for (const lv of CHART_LEVELS) {
  const mine = facts.filter((f) => f.set === lv.id);
  assert.ok(mine.length >= 10, `${lv.id}: enough facts (${mine.length})`);
  assert.ok(["1st", "2nd", "3rd", "4th", "5th"].includes(lv.grade) && lv.stratum, lv.id);
  for (let i = 0; i < 20; i++) assert.equal(chartProblem(lv.id).set, lv.id);
}
assert.ok(facts.every((f) => CHART_LEVELS.some((l) => l.id === f.set)), "every fact is in a level");
for (const f of facts) {
  const b = chartFactOf(f.key);
  assert.equal(b.key, f.key, "the key round-trips");
  assert.deepEqual(b, f, `${f.key}: the same fact`);
  assert.ok(f.key.startsWith("▥") && f.op === "▥");
  assert.ok(Number.isInteger(f.ans) && f.ans >= 1, `${f.key}: a whole number to type (${f.ans})`);
}

// The grades' charts (Missouri's data standards).
const of = (id) => facts.filter((f) => f.set === id);
for (const f of [...of("tally"), ...of("pic1")]) {
  assert.equal(f.cats.length, 3, "1st grade: three things");
  assert.ok(f.cats.reduce((s, c) => s + c[1], 0) <= 20, "1st grade: within 20");
  assert.ok(["n", "m", "f", "a"].includes(f.ask.k));
}
for (const f of [...of("pic2"), ...of("bar2")]) assert.ok(f.cats.length === 4 && f.scale === 1 && f.cats.every((c) => c[1] <= 9), "2nd grade: four things, scale 1");
for (const f of [...of("spic3"), ...of("sbar3")]) {
  assert.ok([2, 5].includes(f.scale), "3rd grade: scaled by 2s or 5s");
  // Bars end on a line of the axis; pictures are whole or half.
  if (f.form === "B" || f.scale === 5) assert.ok(f.cats.every((c) => c[1] % f.scale === 0));
}
assert.ok(!chartFacts().some((f) => f.form === "L" && f.den > 1), "no line plots in halves or fourths (left out for now)");
for (const f of of("graph4")) assert.equal(f.scale, 10);
for (const f of [...of("plot4"), ...of("freq4")]) assert.ok(["mo", "ra", "at", "to"].includes(f.ask.k), "4th grade: mode and range");
for (const f of facts.filter((f) => f.ask.k === "mo")) {
  // One mode.
  const counts = f.form === "F" ? f.rows.map((r) => r[1]) : [...new Set(f.vals)].map((v) => f.vals.filter((x) => x === v).length);
  assert.equal(counts.filter((c) => c === Math.max(...counts)).length, 1, `${f.key}: one mode`);
}
for (const f of of("med5")) { assert.equal(f.vals.length % 2, 1, "an odd count, so the median is one of them"); assert.equal(f.ans, [...f.vals].sort((a, b) => a - b)[(f.vals.length - 1) / 2]); }
for (const f of of("line5")) assert.ok(f.vals.length === 6 && f.vals.every((v) => v % f.scale === 0), "5th grade line graphs");
// Every question kind comes up.
for (const k of ["n", "m", "f", "t", "a", "at", "mo", "ra", "me", "to", "v", "c"]) assert.ok(facts.some((f) => f.ask.k === k), k);

// The drawings: clean, inside the chart, every word a label, and nothing given away.
for (const f of facts) {
  const plain = chartSvg(f), hint = chartSvg(f, { hint: true }), worked = chartSvg(f, { hint: true, worked: true });
  for (const s of [plain, hint, worked]) {
    assert.ok(s.startsWith(`<svg viewBox="0 0 ${W} ${H}" class="chart"`) && s.endsWith("</svg>"), f.key);
    assert.ok(!/NaN|undefined|null|Infinity/.test(s), `${f.key}: real numbers`);
    assert.equal((s.match(/<text\b/g) || []).length, (s.match(/class="lab">/g) || []).length, `${f.key}: every <text> is a label`);
    assert.ok(labels(s).every((l) => l.trim() && !/[<>]/.test(l)), `${f.key}: no empty labels`);
    for (const m of s.matchAll(/<text x="([-\d.]+)" y="([-\d.]+)"/g)) assert.ok(+m[1] >= 4 && +m[1] <= W - 4 && +m[2] >= 8 && +m[2] <= H - 4, `${f.key}: a label inside (${m[1]}, ${m[2]})`);
    for (const m of s.matchAll(/translate\(([-\d.]+) ([-\d.]+)\)/g)) assert.ok(+m[1] >= 10 && +m[1] <= W - 10 && +m[2] >= 10 && +m[2] <= H - 10, `${f.key}: a picture inside (${m[1]}, ${m[2]})`);
    // The description never says a number.
    assert.ok(!/\d/.test(s.match(/aria-label="([^"]*)"/)[1]), `${f.key}: the label gives nothing away`);
  }
  // What the hint adds to the chart (labels and words) never shows the answer, except a number the
  // problem itself shows (its line, or a picture's worth).
  const allowed = new Set([...nums(chartLine(f)[0]), ...(f.form === "P" && f.scale > 1 ? [f.scale] : [])]);
  if (!allowed.has(f.ans)) {
    const added = minus(labels(hint), labels(plain));
    assert.ok(!added.includes(String(f.ans)), `${f.key}: the hint's drawing shows ${f.ans} (${added})`);
    const say = chartHint(f, false).say;
    assert.ok(!nums(say).includes(f.ans), `${f.key}: the hint says ${f.ans}: ${say}`);
  }
  // Before answering, something is left to count: a "?" or words to follow.
  const before = chartHint(f, false).say;
  assert.ok(before.length > 10 && words(before) <= 24, `${f.key}: ${before}`);
  // Worked, the answer is there.
  assert.ok(nums(chartHint(f, true).say).includes(f.ans), `${f.key}: the worked hint says ${f.ans}`);
  assert.ok(labels(worked).includes(String(f.ans)) || nums(chartHint(f, true).say).includes(f.ans), f.key);
}
// Counting partway: about half, none of one or two, all when worked.
assert.deepEqual([1, 2, 3, 4, 7, 10].map((n) => shownOf(n, false)), [0, 0, 1, 2, 3, 5]);
assert.equal(shownOf(7, true), 7);

// Spoken: the things in the chart (a pre-reader can't read the labels), then the question in 12
// words or fewer, all in words; the answer after a miss says the number.
const lines = new Set();
for (const f of facts) {
  const t = spokenChart(f), qn = chartQuestion(f);
  lines.add(t);
  assert.ok(t.endsWith(qn) && words(qn) <= 12 && words(t) <= 20, `${f.key}: ${t}`);
  assert.ok(!/\d/.test(t), `${f.key}: said in words: ${t}`);
  if (f.cats) for (const [o] of f.cats) assert.ok(t.includes(OBJECTS[o].many) || t.includes(OBJECTS[o].many[0].toUpperCase() + OBJECTS[o].many.slice(1)), `${f.key}: says ${o}`);
  const a = spokenChartAnswer(f);
  assert.ok(!/\d/.test(a) && a.toLowerCase().includes(spoken(f.ans)), `${f.key}: ${a}`);
  const line = chartLine(f);
  assert.ok(line.length === 2 && line[1] === null && line[0].length <= 34, `${f.key}: ${line[0]}`);
}
assert.ok(lines.size <= facts.length, "one line per fact at most: recordable");
assert.equal(spokenChart(chartFactOf("▥T1:torch5,potion7,key3:m.potion.key")), "Torches, potions, keys. How many more potions than keys?");
assert.equal(spokenChart(chartFactOf("▥P2:torch5,potion7,key3:n.key")), "Each picture is two. Torches, potions, keys. How many keys?");
assert.equal(spokenChart(chartFactOf("▥L2:bone:2-8:2,3,3,5:at.5")), "Bone lengths, in inches. How many bones are two and a half inches long?");
assert.equal(spokenChart(chartFactOf("▥F:potion:1x2,3x4,4x1:mo")), "Potions on each shelf. What is the mode?");
assert.equal(spokenChart(chartFactOf("▥G5:gem:10,15,25,20,30,35:c.2.5")), "Gems found each day. How many more gems on day five than day two?");
assert.deepEqual([chartFactOf("▥T1:torch5,potion7,key3:m.potion.key").ans, chartFactOf("▥B5:torch10,potion25:f.torch.potion").ans, chartFactOf("▥L4:key:4-12:5,6,6,9,10:gt.6").ans, chartFactOf("▥F:gem:1x2,3x4,4x1:ra").ans, chartFactOf("▥G5:gem:10,15,25,20,30,35:c.4.2").ans], [4, 15, 2, 3, 5]);
assert.deepEqual([lenLabel(5, 2), lenLabel(7, 4), lenLabel(8, 4), lenWords(4, 4), lenWords(9, 4)], ["2½", "1¾", "2", "one inch", "two and one fourth inches"]);

// Graphzilla: drawn with shapes, its back plates the chart's data.
const gz = MON.find((m) => m.n === "Graphzilla");
assert.ok(gz && gz.op === "▥" && traitOf(gz).name === "Chart Stomp" && gz.stratum === "hall, mines, tower, forge", "Graphzilla is in the game, in the Hall, the Mines, the Tower and the Forge");
// Batch 3: in the game. Graphzilla asks only charts, and no one else does; a strand in each
// stratum of its grade, opening with the stratum's last chapter, never a priority step (data isn't
// one of the guides' priority standards), and the Pyramid's two levels (5th grade) not yet asked.
for (const m of MON) assert.equal(asks(m)("▥", "▥T1:torch5,potion7,key3:n.key"), m.n === "Graphzilla" || m.n === "Judo Judy", `${m.n} and charts`);
assert.ok(!asks(gz)("+", "+3,4") && !asks(gz)("⌚", "⌚h3"));
const strandOf = { hall: "chartsH", mines: "chartsM", tower: "chartsT", forge: "chartsF" };
for (const [id, b] of Object.entries(strandOf)) {
  const w = WINGS.find((x) => x.id === id), steps = PATHS[id].filter((s) => s.monsters.includes("Graphzilla"));
  assert.equal(w.strands.Graphzilla, b);
  assert.ok(steps.length === 1 && !steps[0].priority && steps[0].ongoing && steps[0].chapter === Math.max(...PATHS[id].map((s) => s.chapter)), `${id}: one step, in the last chapter, not a priority`);
  assert.deepEqual(BANDS[b].levels.map((l) => l.name), CHART_LEVELS.filter((l) => l.stratum === id).map((l) => l.name));
  assert.ok(pool(b).every((f) => CHART_LEVELS.find((l) => l.id === factOfKey(f.key).set).stratum === id));
}
const inGame = new Set(Object.values(strandOf).flatMap((b) => pool(b).map((f) => f.key)));
assert.ok(facts.filter((f) => f.set === "med5" || f.set === "line5").every((f) => !inGame.has(f.key)), "5th grade's charts wait for the Pyramid");
assert.equal(LOOKS.Graphzilla.length, 5);
assert.ok(LOOKS.Graphzilla.some(([n, kit]) => n === "Graph-o-Tron" && kit.includes("visor") && kit.includes("antenna")) && LOOKS.Graphzilla.some(([, kit]) => kit.includes("skyline")), "a robot look and a skyline look");
assert.equal(MON.find((m) => m.n === "Graphzilla").quip, "stomps back down into the depths.");
assert.ok(LOOKS.Graphzilla.every(([, kit]) => !kit.some((k) => ["crown", "tophat", "nightcap", "bandana", "bow"].includes(k))), "its looks keep off its head, so no plate is hidden");
for (const f of facts.slice(0, 60)) {
  const p = platesOf(f);
  assert.ok(p.length >= 1 && p.length <= 4 && p.every((x) => Number.isFinite(x.v) && /^#[0-9a-f]{6}$/i.test(x.c)), f.key);
  const s = svg({ ...gz, plates: p });
  assert.ok(!/NaN|undefined|<text\b/.test(s), `${f.key}: Graphzilla draws`);
}
assert.notEqual(svg({ ...gz, plates: [{ v: 1, c: "#ffc93c" }, { v: 9, c: "#ff5a4e" }] }), svg(gz), "its plates show the data");
console.log(`✓ charts: ${facts.length} facts in ${CHART_LEVELS.length} levels, keys, drawings, hints, words`);
