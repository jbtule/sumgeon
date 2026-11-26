// Telling time (Tick-Tockus, js/clock.js, the prototype page): the hands, the problems and their
// answers, the words, the drawing and the hint.
import assert from "node:assert/strict";
import { ELAPSED_LEVELS, inHour, readTime, elapsedProblem, elapsedSvg, elapsedHint, elapsedStops, elapsedLine, spokenElapsed, spokenElapsedAnswer, timeWords, CLOCK_LEVELS, handAngles, clockProblem, allClockProblems, clockQuestion, clockLine, spokenClock, spokenTime, digital, clockSvg, clockHint, clockPoint, CLOCK } from "../js/clock.js";

// The hands, for every minute of the day: the minute hand moves 6° a minute, the hour hand 30° an
// hour and half a degree a minute, so it's halfway between two numbers at :30.
for (let h = 1; h <= 12; h++) {
  for (let m = 0; m < 60; m++) {
    const { hour, minute } = handAngles(h, m);
    assert.equal(minute, m * 6, `${digital(h, m)}: the minute hand`);
    assert.equal(hour, (h % 12) * 30 + m / 2, `${digital(h, m)}: the hour hand`);
    assert.ok(hour >= 0 && hour < 360 && minute >= 0 && minute < 360);
    // The hour hand sits between this hour's number and the next, never past it.
    const from = (h % 12) * 30;
    assert.ok(hour >= from && hour < from + 30, `${digital(h, m)}: the hour hand is between ${h} and ${h % 12 + 1}`);
  }
}
assert.deepEqual(handAngles(12, 0), { hour: 0, minute: 0 });
assert.deepEqual(handAngles(3, 0), { hour: 90, minute: 0 });
assert.deepEqual(handAngles(3, 30), { hour: 105, minute: 180 }, "half past 3: halfway to the 4");
assert.deepEqual(handAngles(6, 15), { hour: 187.5, minute: 90 });
assert.deepEqual(handAngles(9, 45), { hour: 292.5, minute: 270 });
assert.deepEqual(handAngles(12, 30), { hour: 15, minute: 180 });
// Points on the face: the 12 straight up, the 3 to the right.
assert.deepEqual(clockPoint(0, 100), [CLOCK.c, CLOCK.c - 100]);
assert.deepEqual(clockPoint(90, 100), [CLOCK.c + 100, CLOCK.c]);

// Every problem of every level: the answer is the hour or the minutes, a whole number to type.
const levels = CLOCK_LEVELS.map((l) => l.id);
assert.deepEqual(levels, ["hours", "half", "five", "minute"], "in teaching order: 1st, 1st, 2nd, 3rd");
for (const id of levels) {
  const all = allClockProblems(id);
  assert.ok(all.length >= 12, id);
  for (const p of all) {
    assert.ok(p.h >= 1 && p.h <= 12 && p.m >= 0 && p.m < 60, `${id} ${digital(p.h, p.m)}`);
    assert.equal(p.ans, p.ask === "hour" ? p.h : p.m, `${id} ${digital(p.h, p.m)}: the answer`);
    assert.ok(Number.isInteger(p.ans) && p.ans > 0, `${id}: a whole number to type`);
    if (id === "hours") assert.equal(p.m, 0);
    if (id === "half") assert.ok(p.m === 0 || p.m === 30);
    if (id === "five") assert.ok(p.m % 5 === 0 && p.m > 0 && p.ask === "minutes");
    if (id === "minute") assert.ok(p.m % 5 !== 0 && p.ask === "minutes", "to the minute: never a five");
    // The problem line has exactly one slot for the answer, and the hint never shows it before
    // answering.
    assert.equal(clockLine(p).filter((x) => x === null).length, 1);
    const before = clockHint(p, false), after = clockHint(p, true);
    if (p.ask === "minutes") {
      assert.ok(!new RegExp(`\\b${p.ans}\\b`).test(before.say), `${id} ${digital(p.h, p.m)}: the hint before answering doesn't say ${p.ans}: ${before.say}`);
      assert.equal(before.layer.ask, "?", "the minute hand's label is ? before answering");
      assert.ok(new RegExp(`\\b${p.ans}\\b`).test(after.say), `${id}: the worked hint says ${p.ans}: ${after.say}`);
      // The count by 5s stops short of the answer before answering.
      assert.ok(before.layer.fives < p.m, `${id} ${digital(p.h, p.m)}`);
    } else {
      assert.ok(!before.layer.ring || !before.layer.ring.includes(p.h) || before.layer.ring.length > 1, "the hour isn't ringed alone before answering");
      assert.deepEqual(after.layer.ring, [p.h], "worked, the hour is ringed");
      assert.ok(after.say.includes(`${p.h}`));
    }
    // The drawing: an SVG with the clock's label, and the hint's labels drawn on it.
    const s = clockSvg(p.h, p.m, { hint: before.layer });
    assert.ok(s.startsWith("<svg") && s.includes(`A clock showing ${digital(p.h, p.m)}`));
    for (const style of ["bungee", "hand"]) assert.ok(!/NaN|undefined/.test(clockSvg(p.h, p.m, { numbers: style, hint: after.layer })), `${id} ${digital(p.h, p.m)} ${style}`);
  }
}
// Tick-Tockus: the tentacles stay inside the room they're given (beside and under the 240-wide
// drawing), and the tentacle hands draw at every time.
const nums = (s) => [...s.matchAll(/-?\d+(\.\d+)?/g)].map((m) => Number(m[0]));
for (const reach of [{ side: 18, below: 12 }, { side: 40, below: 20 }, { side: 80, below: 60 }, undefined]) {
  const s = clockSvg(3, 0, { reach }), side = reach ? reach.side : 60, below = reach ? reach.below : 36;
  const paths = [...s.matchAll(/<path d="(M[^"]*Z)"/g)].map((m) => nums(m[1]));
  const xs = paths.flatMap((p) => p.filter((_, i) => i % 2 === 0)), ys = paths.flatMap((p) => p.filter((_, i) => i % 2 === 1));
  assert.ok(Math.min(...xs) >= -side - 1 && Math.max(...xs) <= CLOCK.size + side + 1, `tentacles inside the sides (${JSON.stringify(reach)})`);
  assert.ok(Math.max(...ys) <= CLOCK.size + below + 1, `tentacles inside the room below (${JSON.stringify(reach)})`);
}
assert.ok(!clockSvg(3, 0, { monster: false }).includes("#ffd0e3"), "a plain clock has no tentacles");
for (let m = 0; m < 60; m++) assert.ok(!/NaN|undefined/.test(clockSvg(7, m, { hands: "tentacle", hint: { glow: "minute" } })), `tentacle hands at 7:${m}`);

// Random problems come from the level's set.
let r = 1; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
for (const id of levels) {
  const keys = new Set(allClockProblems(id).map((p) => JSON.stringify(p)));
  for (let i = 0; i < 200; i++) assert.ok(keys.has(JSON.stringify(clockProblem(id, rnd))), id);
}
// The half-hour level asks both ways and keeps some on the hour.
const halves = Array.from({ length: 400 }, () => clockProblem("half", rnd));
assert.ok(halves.some((p) => p.m === 30 && p.ask === "hour") && halves.some((p) => p.ask === "minutes") && halves.some((p) => p.m === 0));

// The words.
const p337 = { level: "minute", h: 3, m: 37, ask: "minutes", ans: 37 };
assert.equal(spokenClock(p337), "What time is it? How many minutes past three?");
assert.equal(clockQuestion(p337), "How many minutes past 3?");
assert.deepEqual(clockLine(p337), ["3:", null]);
assert.equal(spokenClock({ h: 4, m: 0, ask: "hour" }), "What hour is it?");
assert.deepEqual(clockLine({ h: 4, m: 0, ask: "hour" }), [null, " o'clock"]);
assert.equal(spokenClock({ h: 4, m: 30, ask: "hour" }), "What time is it? Half past what?");
assert.deepEqual(clockLine({ h: 4, m: 30, ask: "hour" }), ["half past ", null]);
assert.equal(spokenTime(3, 0), "It's three o'clock.");
assert.equal(spokenTime(3, 30), "It's half past three.");
assert.equal(spokenTime(3, 37), "It's three thirty-seven.");
assert.equal(spokenTime(11, 5), "It's eleven oh five.");
assert.equal(digital(3, 5), "3:05");
// The hints' words.
assert.equal(clockHint({ h: 3, m: 0, ask: "hour" }, true).say, "The short hand points to the 3. It's 3 o'clock.");
assert.equal(clockHint({ h: 2, m: 25, ask: "minutes" }, false).say, "Count by 5s from the 12 to the long hand: 5, 10, 15, 20, ?");
assert.equal(clockHint({ h: 10, m: 37, ask: "minutes" }, true).say, "By 5s to 35, then 2 more: 35 + 2 = 37.");
assert.deepEqual(clockHint({ h: 10, m: 37, ask: "minutes" }, false).layer.ones, [36, 37], "the extra minutes' ticks light up");

// Elapsed time: the answers, the hands on both clocks, and hints that never give the answer
// before answering.
const mins = (h, m) => (h % 12) * 60 + m;
const rotations = (s) => [...s.matchAll(/rotate\(([\d.]+) 120 120\)/g)].map((m) => Number(m[1]));
for (const lv of ELAPSED_LEVELS) {
  for (let i = 0; i < 400; i++) {
    const p = elapsedProblem(lv.id, rnd);
    const d = (mins(p.h2, p.m2) - mins(p.h, p.m) + 720) % 720;
    assert.equal(d, p.d, `${lv.id}: ${digital(p.h, p.m)} + ${p.d} is ${digital(p.h2, p.m2)}`);
    assert.ok(p.d >= 6 && p.d < 60, "under an hour");
    if (lv.id === "longA" || lv.id === "addA") assert.ok(p.h2 === p.h && p.m % 5 === 0 && p.d % 5 === 0, "in the hour, in 5s");
    if (lv.id === "longB" || lv.id === "addB") assert.ok(p.h2 !== p.h && p.m2 > 0 && p.d % 5 === 0, "across the hour");
    if (p.kind === "long") assert.equal(p.ans, p.d);
    else if (p.cross) assert.deepEqual(p.ans, [p.h2, p.m2]);
    else assert.equal(p.ans, p.m2);
    // One slot per number: a whole time is two, the hour then the minutes ("□:□□").
    assert.equal(elapsedLine(p).filter((x) => x === null).length, [].concat(p.ans).length);
    if (p.cross) assert.deepEqual(elapsedLine(p), [null, ":", null]);
    // The hands on the clocks drawn: minute, then hour, for each.
    const s = elapsedSvg(p), clocks = p.kind === "long" ? [[p.h, p.m], [p.h2, p.m2]] : [[p.h, p.m]];
    assert.deepEqual(rotations(s), clocks.flatMap(([h, m]) => { const a = handAngles(h, m); return [Math.round(a.minute * 10) / 10, Math.round(a.hour * 10) / 10]; }));
    // The hint: two jumps or more, the first never the whole; before answering only the first hop
    // is labeled and no words give the total (or, adding, the end time).
    const st = elapsedStops(p);
    assert.ok(st.length >= 3 && st[st.length - 1] - st[0] === p.d);
    const before = elapsedHint(p, false).say, after = elapsedHint(p, true).say;
    // (Face numbers, "the 9", and times, "3:45", aren't the answer; strip them before looking.)
    const bare = before.replace(/\d+:\d\d/g, "").replace(/the \d+/g, "").replace(/count \d+ minutes/, "");
    if (p.kind === "long") {
      assert.ok(!new RegExp(`\\b${p.d}\\b`).test(bare), `${before}`);
      assert.ok(after.includes(`${p.d} minutes.`), after);
    } else {
      assert.ok(!before.includes(digital(p.h2, p.m2)) && before.endsWith("?"), before);
      assert.ok(after.endsWith(`${digital(p.h2, p.m2)}.`), after);
    }
    if (inHour(p)) {
      // Within the hour: one big clock, the sweep counted by 5s on the rim, only up to about
      // halfway before answering (adding, the end hand isn't drawn yet); worked, every 5.
      const labs = (o) => [...elapsedSvg(p, o).matchAll(/class="lab5"[^>]*>(\d+)</g)].map((m) => Number(m[1]));
      const n = p.d / 5, b = labs({ hint: true });
      assert.ok(b.length >= 1 && b.length <= n / 2 && !b.includes(p.d), `${p.d} min: labels ${b}`);
      assert.deepEqual(labs({ hint: true, worked: true }), Array.from({ length: n }, (_, i) => 5 * (i + 1)));
      const rot = rotations(elapsedSvg(p, { hint: true }));
      const shown = p.kind === "add" ? handAngles(p.h, p.m) : handAngles(p.h2, p.m2);
      assert.ok(rot.includes(Math.round(shown.minute * 10) / 10), "the solid hands");
      if (p.kind === "add") assert.equal(rot.length, 2, "adding, only the start's hands: the end hand waits");
      if (p.kind === "long") assert.ok(elapsedSvg(p, { hint: true }).includes('class="ghost"'), "the start faint");
    } else {
      const jumps = [...elapsedSvg(p, { hint: true }).matchAll(/class="jump">([^<]*)</g)].map((m) => m[1]);
      assert.equal(jumps.filter((j) => j !== "?").length, 1, "one hop labeled before answering");
      assert.ok(!jumps.includes("+" + p.d));
      if (p.kind === "add") assert.ok(![...elapsedSvg(p, { hint: true }).matchAll(/class="stop">([^<]*)</g)].some((m) => m[1] === digital(p.h2, p.m2)), "the end time is hidden");
    }
    assert.ok(!/NaN|undefined/.test(elapsedSvg(p, { hint: true, worked: true })));
  }
}
assert.equal(spokenElapsed({ kind: "long", h: 3, m: 10, h2: 3, m2: 45, d: 35 }), "It starts at three ten and ends at three forty-five. How many minutes?");
assert.equal(spokenElapsed({ kind: "add", h: 3, m: 15, d: 20 }), "It's three fifteen. What time is it twenty minutes later?");
assert.equal(spokenElapsedAnswer({ kind: "long", d: 35 }), "Thirty-five minutes.");
assert.equal(timeWords(3, 0), "three o'clock");
// Within the hour, around the clock; across it, the open number line.
assert.equal(elapsedHint({ kind: "long", h: 3, m: 10, h2: 3, m2: 45, d: 35 }, false).say, "From the 2 to the 9: 5, 10, 15, … How many minutes?");
assert.equal(elapsedHint({ kind: "long", h: 3, m: 10, h2: 3, m2: 45, d: 35 }, true).say, "From the 2 to the 9: 5, 10, 15, 20, 25, 30, 35. 35 minutes.");
assert.equal(elapsedHint({ kind: "long", h: 2, m: 50, h2: 3, m2: 20, d: 30 }, false).say, "2:50 → 3:00 is 10, then to 3:20?");
assert.equal(elapsedHint({ kind: "long", h: 2, m: 50, h2: 3, m2: 20, d: 30 }, true).say, "2:50 → 3:00 is 10, 3:00 → 3:20 is 20. 10 + 20 = 30 minutes.");
// A whole time in two slots: every h:mm from 1:00 to 12:59 can be entered and reads right, the
// minutes typed with or without their leading zero (1:05, 10:05, 1:20, 12:00).
for (let h = 1; h <= 12; h++) for (let m = 0; m < 60; m++) {
  assert.deepEqual(readTime(String(h), String(m).padStart(2, "0")), { h, m });
  assert.deepEqual(readTime(String(h), String(m)), { h, m });
}
assert.deepEqual(readTime("1", "05"), { h: 1, m: 5 });
assert.deepEqual(readTime("10", "05"), { h: 10, m: 5 });
assert.deepEqual(readTime("12", "00"), { h: 12, m: 0 });

console.log("✓ clock: hands, problems, words and hints; elapsed time");
