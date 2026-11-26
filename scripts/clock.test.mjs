// Telling time (Tick-Tockus, js/clock.js, the prototype page): the hands, the problems and their
// answers, the words, the drawing and the hint.
import assert from "node:assert/strict";
import { CLOCK_LEVELS, handAngles, clockProblem, allClockProblems, clockQuestion, clockLine, spokenClock, spokenTime, digital, clockSvg, clockHint, clockPoint, CLOCK } from "../js/clock.js";

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

console.log("✓ clock: hands, problems, words and hints");
