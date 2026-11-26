// Telling time (Tick-Tockus, DESIGN.md §4.1): an analog clock and its problems. A prototype for
// the review page (review/proto/); nothing in the game reads it yet, and it has no fact keys.
// No DOM: the drawings are SVG strings, so the tests run in Node.
//
// Missouri Learning Standards: 1st grade tells time to the hour and half hour, 2nd grade to the
// nearest 5 minutes, 3rd grade to the minute. Every answer is a whole number on the number pad:
// the hour, or the minutes past it.
//
// The look (picked on the review page, 2026-11-25): the clock is Tick-Tockus itself, its
// tentacles behind the case; school-style handwritten numbers (an open 4, a 1 that's one line, as
// on a classroom clock) and straight arrow hands, coral short and blue long. opt.numbers "bungee"
// and opt.hands "tentacle" are kept only for comparing (the page's ?numbers=bungee, ?hands=tentacle).
import { spoken } from "./problems.js";
import { HANDWRITING } from "./handwriting.js";

const DK = "#0c171c", CREAM = "#f3efe4", GOLD = "#ffc93c";
// The clock's own colors: Tick-Tockus's pink rim, a coral short (hour) hand and a blue long
// (minute) hand, as on a classroom clock. The hint's words name them by length, not color.
export const CLOCK_COLORS = { rim: "#e8679f", hour: "#ff5a4e", minute: "#2f86e0" };

// The levels, in teaching order, with the grade and the stratum Tick-Tockus visits for it.
export const CLOCK_LEVELS = [
  { id: "hours", name: "Hours", grade: "1st", stratum: "hall" },
  { id: "half", name: "Half hours", grade: "1st", stratum: "hall" },
  { id: "five", name: "5 minutes", grade: "2nd", stratum: "mines" },
  { id: "minute", name: "The minute", grade: "3rd", stratum: "tower" }
];
export const clockLevel = (id) => CLOCK_LEVELS.find((l) => l.id === id) || CLOCK_LEVELS[0];

// Where the hands point, in degrees clockwise from the 12. The hour hand moves as the minutes
// pass: half a degree a minute, so it's halfway between two numbers at :30.
export function handAngles(h, m) {
  return { hour: (h % 12) * 30 + m * 0.5, minute: m * 6 };
}

const pick = (list, rnd) => list[Math.floor(rnd() * list.length)];
const hours = () => Array.from({ length: 12 }, (_, i) => i + 1);
const nextHour = (h) => h % 12 + 1;

// A problem: { level, h, m, ask: "hour" | "minutes", ans }. rnd is Math.random or a seeded one.
// - hours: the time on the hour, "What hour is it?" (the hour).
// - half: half past, asking the minutes (30) or the hour ("half past what?"), and some on the
//   hour so :00 and :30 are told apart.
// - five: 5 to 55 minutes past ("How many minutes past three?").
// - minute: any minute but the fives (37), so it isn't the 5-minute level again.
export function clockProblem(level, rnd = Math.random) {
  const h = pick(hours(), rnd);
  if (level === "hours") return { level, h, m: 0, ask: "hour", ans: h };
  if (level === "half") {
    const r = rnd();
    if (r < 0.2) return { level, h, m: 0, ask: "hour", ans: h };
    return r < 0.6 ? { level, h, m: 30, ask: "hour", ans: h } : { level, h, m: 30, ask: "minutes", ans: 30 };
  }
  if (level === "five") { const m = 5 * (1 + Math.floor(rnd() * 11)); return { level, h, m, ask: "minutes", ans: m }; }
  const ms = Array.from({ length: 59 }, (_, i) => i + 1).filter((m) => m % 5);
  const m = pick(ms, rnd);
  return { level: "minute", h, m, ask: "minutes", ans: m };
}

// Every problem a level can ask, for the tests.
export function allClockProblems(level) {
  const out = [];
  for (const h of hours()) {
    if (level === "hours") out.push({ level, h, m: 0, ask: "hour", ans: h });
    else if (level === "half") out.push({ level, h, m: 0, ask: "hour", ans: h }, { level, h, m: 30, ask: "hour", ans: h }, { level, h, m: 30, ask: "minutes", ans: 30 });
    else if (level === "five") for (let m = 5; m < 60; m += 5) out.push({ level, h, m, ask: "minutes", ans: m });
    else for (let m = 1; m < 60; m++) if (m % 5) out.push({ level, h, m, ask: "minutes", ans: m });
  }
  return out;
}

// The question on screen, in words for a grown-up or a reader.
export function clockQuestion(p) {
  if (p.ask === "hour") return p.m === 30 ? "Half past what?" : "What hour is it?";
  return `How many minutes past ${p.h}?`;
}
// The problem line, in parts: text, with null where the answer goes ("□ o'clock", "half past □",
// "3:□"). Reading the digital form under the clock is the 1st grade standard too.
export function clockLine(p) {
  if (p.ask === "hour") return p.m === 30 ? ["half past ", null] : [null, " o'clock"];
  return [`${p.h}:`, null];
}
// What the voice says. The time is always asked first, like the classroom's "What time is it?".
export function spokenClock(p) {
  if (p.ask === "hour") return p.m === 30 ? "What time is it? Half past what?" : "What hour is it?";
  return `What time is it? How many minutes past ${spoken(p.h)}?`;
}
// Said after a miss: "It's three o'clock.", "It's half past three.", "It's three thirty-seven."
export function spokenTime(h, m) {
  if (!m) return `It's ${spoken(h)} o'clock.`;
  if (m === 30) return `It's half past ${spoken(h)}.`;
  return `It's ${spoken(h)} ${m < 10 ? "oh " + spoken(m) : spoken(m)}.`;
}
// The time as a clock shows it: "3:05".
export const digital = (h, m) => `${h}:${String(m).padStart(2, "0")}`;

/* ---------- the drawing ---------- */
// A 240 × 240 box: the center, the rim (Tick-Tockus's pink, its middle at RIM), the cream face,
// the minute ticks, the numbers, and the hands. The 5s labels of the hint sit on the rim.
export const CLOCK = { size: 240, c: 120, rim: 104, face: 93, num: 66, hourLen: 52, minLen: 84 };
const f1 = (n) => Math.round(n * 10) / 10;
// A point at angle a (degrees clockwise from the 12) and radius r.
export function clockPoint(a, r) {
  const t = (a - 90) * Math.PI / 180;
  return [f1(CLOCK.c + r * Math.cos(t)), f1(CLOCK.c + r * Math.sin(t))];
}

// A number on the face, in the Bungee font or in school-style handwriting (js/handwriting.js),
// whose 4 is open and whose 1 is one line. size is the font size; handwriting is drawn as tall as
// Bungee's capitals (about 0.72 of it), its digits side by side with a small gap.
const SPAN = HANDWRITING.map((strokes) => { const xs = strokes.flat().map(([x]) => x); return [Math.min(...xs), Math.max(...xs)]; });
function numeral(n, x, y, style, size) {
  if (style === "bungee") {
    return `<text x="${x}" y="${y}" dy=".36em" text-anchor="middle" font-family="Bungee, sans-serif" font-size="${size}" fill="${DK}">${n}</text>`;
  }
  const ds = String(n).split("").map(Number), k = size * 0.72 / 88, gap = 22;
  const total = ds.reduce((t, d, i) => t + SPAN[d][1] - SPAN[d][0] + (i ? gap : 0), 0);
  let left = -total / 2;
  return ds.map((d) => {
    const ox = x + (left - SPAN[d][0]) * k, oy = y - 50 * k;
    left += SPAN[d][1] - SPAN[d][0] + gap;
    const path = HANDWRITING[d].map((s) => "M" + s.map(([px, py]) => `${f1(ox + px * k)} ${f1(oy + py * k)}`).join(" L")).join(" ");
    return `<path d="${path}" fill="none" stroke="${DK}" stroke-width="${f1(size * 0.16)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join("");
}

// A hand pointing up from the center, then turned to angle a: a tapered bar with an arrow tip,
// outlined in the house style (dark edge, color, white sheen).
function hand(a, len, w, color, glow) {
  const c = CLOCK.c, tail = 12, head = w * 1.7, neck = len - w * 1.9;
  const d = `M${c - w / 2} ${c + tail} L${c - w / 2} ${c - neck} L${c - head / 2} ${c - neck} L${c} ${c - len} L${c + head / 2} ${c - neck} L${c + w / 2} ${c - neck} L${c + w / 2} ${c + tail} Z`;
  return `<g transform="rotate(${f1(a)} ${c} ${c})">`
    + (glow ? `<path d="${d}" fill="none" stroke="${GOLD}" stroke-width="16" stroke-linejoin="round" opacity=".55"/>` : "")
    + `<path d="${d}" fill="${DK}" stroke="${DK}" stroke-width="8" stroke-linejoin="round"/><path d="${d}" fill="${color}"/><path d="${d}" fill="url(#clocksh)"/></g>`;
}
// A tapered band along a centerline (points), w0 wide at the start and w1 at the end, with a
// round end: a tentacle, or a tentacle hand. Returns path markup for solid-style drawing.
function ribbon(pts, w0, w1) {
  const L = [], R = [], n = pts.length - 1;
  pts.forEach(([x, y], i) => {
    const [ax, ay] = pts[Math.max(0, i - 1)], [bx, by] = pts[Math.min(n, i + 1)];
    const len = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / len, ny = (bx - ax) / len, w = (w0 + (w1 - w0) * i / n) / 2;
    L.push(`${f1(x + nx * w)} ${f1(y + ny * w)}`); R.push(`${f1(x - nx * w)} ${f1(y - ny * w)}`);
  });
  const [tx, ty] = pts[n];
  return `<path d="M${L.join(" L")} L${R.reverse().join(" L")} Z"/><circle cx="${f1(tx)}" cy="${f1(ty)}" r="${f1(w1 / 2)}"/>`;
}
const outline = (shape, color, w = 8) => `<g fill="${DK}" stroke="${DK}" stroke-width="${w}" stroke-linejoin="round">${shape}</g><g fill="${color}">${shape}</g><g fill="url(#clocksh)">${shape}</g>`;
// A curling centerline, turtle style: from (x, y) heading h (radians, 0 right, π/2 down), len
// long. The bend k (per unit) eases from k0 to k1 over the last part (from t0), so the tip curls.
function curl(x, y, h, len, k0, k1, t0 = 0.4, n = 36) {
  const pts = [[x, y]], ds = len / n;
  for (let i = 1; i <= n; i++) {
    const t = i / n, e = Math.max(0, (t - t0) / (1 - t0));
    h += (k0 + (k1 - k0) * e * e) * ds;
    x += Math.cos(h) * ds; y += Math.sin(h) * ds;
    pts.push([x, y]);
  }
  return pts;
}
// Tick-Tockus's tentacles: three a side, coming out from behind the bottom of the case (so they
// never cover the face, its numbers or ticks, and the hint's rim labels are drawn over them). One
// hugs the rim up the side, one curls out sideways, one curls down below. reach: how far they can
// go beyond the case, in drawing units, { side, below } (the page measures the room it has); they
// shrink to fit.
export const TENTACLE = "#e8679f";
function tentacles(reach = {}) {
  const side = Math.max(18, Math.min(80, reach.side ?? 60)), below = Math.max(12, Math.min(60, reach.below ?? 36));
  const c = CLOCK.c, rad = (a) => (a - 90) * Math.PI / 180;
  // [angle on the case (clockwise from the 12), how far, bend along, bend at the tip, width]
  const LEFT = [
    // Hugs the rim: out at about 8 o'clock, round the case upward, the tip curling out.
    { a: 236, len: 60 + side * 1.1, k0: 0.008, k1: -0.12, t0: 0.6, w: 18, turn: 0.75 },
    // Out to the side and curling up.
    { a: 214, len: 30 + side * 1.2, k0: 0, k1: 0.11, t0: 0.3, w: 18, turn: 0.55 },
    // Down below, curling out.
    { a: 196, len: 22 + below * 1.2, k0: 0, k1: 0.14, t0: 0.25, w: 16, turn: -0.15 }
  ];
  let s = "";
  for (const t of LEFT) {
    for (const dir of [1, -1]) {
      // Start inside the case so the root is hidden behind it, heading out along the radius (and
      // turned by `turn`, toward the 12 for the one that hugs the rim).
      const a = dir === 1 ? t.a : 360 - t.a, [x0, y0] = clockPoint(a, CLOCK.rim - 14);
      const h = rad(a) + dir * t.turn;
      // Shortened until it stays inside the room it has (its width included).
      let len = t.len, pts;
      for (let i = 0; i < 16; i++) {
        pts = curl(x0, y0, h, len, dir * t.k0, dir * t.k1, t.t0);
        const xs = pts.map(([x]) => x), out = Math.max(-Math.min(...xs), Math.max(...xs) - CLOCK.size), low = Math.max(...pts.map(([, y]) => y)) - CLOCK.size;
        if (out + t.w / 2 <= side && low + t.w / 2 <= below) break;
        len *= 0.9;
      }
      s += outline(ribbon(pts, t.w, 7), TENTACLE, 7);
      // A few suckers on the underside of the outer half.
      s += pts.filter((_, i) => i > 14 && i % 6 === 3).map(([x, y], i, arr) => {
        const k = pts.indexOf(arr[i]), [px, py] = pts[k - 1], [qx, qy] = pts[k + 1] || pts[k];
        const len = Math.hypot(qx - px, qy - py) || 1, off = (t.w - (t.w - 6) * k / pts.length) * 0.22;
        return `<circle cx="${f1(x - dir * (qy - py) / len * off)}" cy="${f1(y + dir * (qx - px) / len * off)}" r="2.6" fill="#ffd0e3" stroke="${DK}" stroke-width="1.2"/>`;
      }).join("");
    }
  }
  return s;
}
// A tentacle hand: from just behind the center to its rounded tip at angle a, tapering, with a
// gentle S-bend in the middle that straightens out before the tip, so the tip lies exactly on the
// radius and points straight along it. A sucker or two near the tip.
function tentacleHand(a, len, w0, w1, color, glow, bend) {
  const c = CLOCK.c, n = 30, tail = 10, pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, y = c + tail - (len + tail - w1 / 2) * t;
    pts.push([c + bend * Math.sin(Math.PI * t) * (1 - t) * (1 - t), y]);
  }
  const shape = ribbon(pts, w0, w1);
  const sucker = (t) => { const [x, y] = pts[Math.round(t * n)]; return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(w1 * 0.22)}" fill="#ffffffb0" stroke="${DK}" stroke-width="1"/>`; };
  return `<g transform="rotate(${f1(a)} ${c} ${c})">`
    + (glow ? `<g fill="none" stroke="${GOLD}" stroke-width="10" stroke-linejoin="round" opacity=".6">${shape}</g>` : "")
    + outline(shape, color, 7) + sucker(0.72) + sucker(0.86) + `</g>`;
}
// A small gold pill on the rim at minute m, holding a label (the hint's count by 5s).
function pill(m, label, strong, out) {
  const [x, y] = clockPoint(m * 6, CLOCK.rim + (out ? 25 : 0)), r = String(label).length > 1 ? 14 : 12;
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${strong ? GOLD : DK}" stroke="${strong ? DK : GOLD}" stroke-width="2.5"/>`
    + `<text x="${x}" y="${y}" dy=".35em" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="${String(label).length > 1 ? 13 : 15}" fill="${strong ? DK : GOLD}">${label}</text>`;
}
// The minute hand's path from minute a (the 12 by default) to minute b, as a wedge of the face.
function sweep(b, a = 0) {
  if (b <= a) return "";
  const c = CLOCK.c, r = CLOCK.face - 2, [x0, y0] = clockPoint(a * 6, r), [x, y] = clockPoint(b * 6, r), big = b - a > 30 ? 1 : 0;
  return `<path d="M${c} ${c} L${x0} ${y0} A${r} ${r} 0 ${big} 1 ${x} ${y} Z" fill="${CLOCK_COLORS.minute}" opacity=".15"/>`
    + `<path d="M${x0} ${y0} A${r} ${r} 0 ${big} 1 ${x} ${y}" fill="none" stroke="${CLOCK_COLORS.minute}" stroke-width="4" stroke-dasharray="2 7" stroke-linecap="round"/>`;
}

// The clock at h:m. opt.numbers: "hand" (default, handwritten) or "bungee"; opt.hint: a hint layer from
// clockHint ({ ring: [hour numbers to ring], glow: "hour", fives: last 5s label, ask: the label
// at the hand, ones: [minute ticks to light] }); opt.label: the aria label. The clock is
// Tick-Tockus: its tentacles reach out past the 240 × 240 drawing (shown with overflow visible) as
// far as opt.reach allows; opt.monster false draws a plain clock. opt.hands: "arrow" or "tentacle".
export function clockSvg(h, m, opt = {}) {
  const { c, rim, face, num } = CLOCK, { hour, minute } = handAngles(h, m), hint = opt.hint || {};
  let s = `<defs><linearGradient id="clocksh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
  // Tick-Tockus's tentacles, behind the case (opt.monster false leaves a plain clock).
  if (opt.monster !== false) s += tentacles(opt.reach);
  // Two little bells on top, like an alarm clock (and Tick-Tockus's ears).
  const bell = (a) => { const [x, y] = clockPoint(a, rim + 4); return `<circle cx="${x}" cy="${y}" r="15"/>`; };
  s += `<g fill="${DK}" stroke="${DK}" stroke-width="9">${bell(-38)}${bell(38)}</g><g fill="${GOLD}">${bell(-38)}${bell(38)}</g><g fill="url(#clocksh)">${bell(-38)}${bell(38)}</g>`;
  // The rim and face.
  s += `<circle cx="${c}" cy="${c}" r="${rim + 8}" fill="${DK}" stroke="${DK}" stroke-width="9"/><circle cx="${c}" cy="${c}" r="${rim + 8}" fill="${CLOCK_COLORS.rim}"/><circle cx="${c}" cy="${c}" r="${rim + 8}" fill="url(#clocksh)"/>`;
  s += `<circle cx="${c}" cy="${c}" r="${face}" fill="${CREAM}" stroke="${DK}" stroke-width="4"/>`;
  if (hint.fives != null || hint.ask) s += sweep(m);
  // Elapsed time's sweep, from one minute to another (hint.from, hint.to).
  if (hint.from != null) s += sweep(hint.to, hint.from);
  // The ticks: a short one each minute, a long one at each number.
  for (let i = 0; i < 60; i++) {
    const big = i % 5 === 0, lit = (hint.ones || []).includes(i);
    const [x0, y0] = clockPoint(i * 6, big || lit ? face - 13 : face - 8), [x1, y1] = clockPoint(i * 6, face - 2);
    s += `<path d="M${x0} ${y0} L${x1} ${y1}" stroke="${lit ? CLOCK_COLORS.hour : DK}" stroke-width="${lit ? 5 : big ? 4 : 2}" stroke-linecap="round"/>`;
  }
  // Ringed numbers (the hour hint) go behind the numbers.
  for (const n of hint.ring || []) { const [x, y] = clockPoint(n * 30, num); s += `<circle cx="${x}" cy="${y}" r="17" fill="${GOLD}" opacity=".55" stroke="${GOLD}" stroke-width="3"/>`; }
  for (let n = 1; n <= 12; n++) { const [x, y] = clockPoint(n * 30, num); s += numeral(n, x, y, opt.numbers, n > 9 && opt.numbers === "bungee" ? 22 : 25); }
  // The hands: the long minute hand under the short hour hand, so the hour is never hidden.
  // opt.hands: "arrow" (straight, an arrow tip) or "tentacle" (tapered, a gentle bend, a round tip
  // on the exact minute).
  if (opt.hands === "tentacle") {
    s += tentacleHand(minute, CLOCK.minLen, 11, 6, CLOCK_COLORS.minute, hint.glow === "minute", 7);
    s += tentacleHand(hour, CLOCK.hourLen, 17, 10, CLOCK_COLORS.hour, hint.glow === "hour", -5);
  } else {
    // A faint earlier time (elapsed time's start), under the hands that tell the time now.
    if (hint.ghost) { const g = handAngles(hint.ghost.h, hint.ghost.m); s += `<g opacity=".3" class="ghost">${hand(g.minute, CLOCK.minLen, 7, CLOCK_COLORS.minute)}${hand(g.hour, CLOCK.hourLen, 12, CLOCK_COLORS.hour)}</g>`; }
    s += hand(minute, CLOCK.minLen, 7, CLOCK_COLORS.minute, hint.glow === "minute");
    s += hand(hour, CLOCK.hourLen, 12, CLOCK_COLORS.hour, hint.glow === "hour");
  }
  s += `<circle cx="${c}" cy="${c}" r="8" fill="${GOLD}" stroke="${DK}" stroke-width="3.5"/>`;
  // The hint's count by 5s, on the rim.
  if (hint.fives != null) for (let k = 5; k <= hint.fives; k += 5) s += pill(k, k, false);
  // The label at the minute hand moves out past the rim when it would sit on a 5s label (37 by
  // 35); the page lets the drawing spill out of its box.
  if (hint.ask) s += pill(m, hint.ask, true, m % 5 !== 0 && hint.fives >= 5);
  // Elapsed time's count by 5s along the sweep (hint.labels: [{ m, text }]), and small gold dots
  // on the 5s still to count (hint.dots: [minutes]).
  for (const d of hint.dots || []) { const [x, y] = clockPoint(d * 6, CLOCK.rim); s += `<circle cx="${x}" cy="${y}" r="4.5" fill="${GOLD}" stroke="${DK}" stroke-width="2"/>`; }
  for (const l of hint.labels || []) s += pill(l.m % 60, l.text, !!l.strong).replace("<text ", '<text class="lab5" ');
  return `<svg viewBox="0 0 ${CLOCK.size} ${CLOCK.size}" class="clock" role="img" aria-label="${opt.label || "A clock showing " + digital(h, m)}">${s}</svg>`;
}

/* ---------- the hint ---------- */
// { layer (for clockSvg's opt.hint), say }. Before answering (worked false) it shows how to read
// the clock without giving the answer; the worked one (after a miss) finishes it.
// - The hour: the short hand glows; worked, the number it points to is ringed.
// - Half past, the hour: the short hand is between two numbers, just past the hour.
// - Minutes: the minute hand's path from the 12, counted by 5s on the rim; to the minute, by 5s
//   to the last five, then the little ticks one at a time.
export function clockHint(p, worked) {
  const { h, m } = p;
  if (p.ask === "hour" && m === 30) {
    return worked
      ? { layer: { glow: "hour", ring: [h] }, say: `The short hand is between ${h} and ${nextHour(h)}. It just passed the ${h}: half past ${h}.` }
      : { layer: { glow: "hour", ring: [h, nextHour(h)] }, say: `The long hand is on the 6: half past. The short hand just passed the hour.` };
  }
  if (p.ask === "hour") {
    return worked
      ? { layer: { glow: "hour", ring: [h] }, say: `The short hand points to the ${h}. It's ${h} o'clock.` }
      : { layer: { glow: "hour" }, say: "The short hand shows the hour. The long hand is on the 12: o'clock!" };
  }
  const five = m - m % 5, ones = m % 5;
  const tick = Array.from({ length: ones }, (_, i) => five + i + 1);
  if (!ones) {
    return worked
      ? { layer: { glow: "minute", fives: m }, say: `Count by 5s from the 12: ${fivesList(m)}. ${m} minutes past ${h}.` }
      : { layer: { glow: "minute", fives: m - 5, ask: "?" }, say: `Count by 5s from the 12 to the long hand: ${fivesList(m - 5)}${m > 5 ? ", " : ""}?` };
  }
  if (worked) return { layer: { glow: "minute", fives: five, ones: tick, ask: m }, say: `By 5s to ${five || "the 12"}, then ${ones} more: ${five} + ${ones} = ${m}.` };
  return { layer: { glow: "minute", fives: five, ones: tick, ask: "?" }, say: five ? `Count by 5s to ${five}, then the little ticks by 1s: ${five} + ${ones} = ?` : "Count the little ticks from the 12 by 1s." };
}
const fivesList = (to) => { const out = []; for (let k = 5; k <= to; k += 5) out.push(k); return out.join(", "); };

/* ---------- elapsed time (3rd grade, 3.GM.B.5–6: elapsed time, adding minutes) ---------- */
// - long: two clocks, the start and the end, "How many minutes?" (under an hour). Level A stays
//   in the hour in 5s; B crosses the hour in 5s; C crosses or not, to the minute.
// - add: "It's 3:15. What time is it 20 minutes later?" A stays in the hour, answered in the
//   "3:□" slot (minutes only); B crosses it, answered "□:□□" in two slots, the hour, then
//   (Hit! reads "Minutes ›") the minutes.
// The hint is 3rd grade's open number line: jumps from the start to a friendly time (the next
// quarter hour, or the hour), then on to the end.
export const ELAPSED_LEVELS = [
  { id: "longA", name: "How long? in the hour", grade: "3rd", stratum: "tower" },
  { id: "longB", name: "How long? across the hour", grade: "3rd", stratum: "tower" },
  { id: "longC", name: "How long? to the minute", grade: "3rd", stratum: "tower" },
  { id: "addA", name: "Minutes later, in the hour", grade: "3rd", stratum: "tower" },
  { id: "addB", name: "Minutes later, across the hour", grade: "3rd", stratum: "tower" }
];
export const isElapsed = (id) => ELAPSED_LEVELS.some((l) => l.id === id);
// Minutes since 12:00, and back.
const toMin = (h, m) => (h % 12) * 60 + m;
export const fromMin = (t) => { const x = ((t % 720) + 720) % 720; return { h: Math.floor(x / 60) || 12, m: x % 60 }; };
export function elapsedProblem(id, rnd = Math.random) {
  const h = 1 + Math.floor(rnd() * 12);
  for (;;) {
    if (id === "longA" || id === "addA") {
      const m0 = 5 * Math.floor(rnd() * 11), d = 5 * (2 + Math.floor(rnd() * 10));
      if (m0 + d > 55) continue;
      return id === "longA" ? { kind: "long", h, m: m0, h2: h, m2: m0 + d, d, ans: d } : { kind: "add", h, m: m0, d, h2: h, m2: m0 + d, ans: m0 + d };
    }
    if (id === "longB" || id === "addB") {
      const m0 = 30 + 5 * Math.floor(rnd() * 6), d = 5 * (1 + Math.floor(rnd() * 11)), end = fromMin(toMin(h, m0) + d);
      if (m0 + d <= 60 || d >= 60) continue;
      return id === "longB" ? { kind: "long", h, m: m0, h2: end.h, m2: end.m, d, ans: d } : { kind: "add", cross: true, h, m: m0, d, h2: end.h, m2: end.m, ans: [end.h, end.m] };
    }
    // To the minute: any start, 6 to 59 minutes, crossing the hour or not.
    const m0 = Math.floor(rnd() * 60), d = 6 + Math.floor(rnd() * 54), end = fromMin(toMin(h, m0) + d);
    if (d % 5 === 0 && m0 % 5 === 0) continue;
    return { kind: "long", h, m: m0, h2: end.h, m2: end.m, d, ans: d };
  }
}
// "three ten", "three o'clock", "three oh five".
export const timeWords = (h, m) => (!m ? `${spoken(h)} o'clock` : `${spoken(h)} ${m < 10 ? "oh " + spoken(m) : spoken(m)}`);
export function spokenElapsed(p) {
  if (p.kind === "long") return `It starts at ${timeWords(p.h, p.m)} and ends at ${timeWords(p.h2, p.m2)}. How many minutes?`;
  return `It's ${timeWords(p.h, p.m)}. What time is it ${spoken(p.d)} minutes later?`;
}
export const spokenElapsedAnswer = (p) => (p.kind === "long" ? `${spoken(p.d)[0].toUpperCase() + spoken(p.d).slice(1)} minutes.` : `It's ${timeWords(p.h2, p.m2)}.`);
// The stops on the open number line, in minutes since 12:00: the start, a friendly time (the
// next quarter hour, and the hour when it's crossed), the end. There are always two jumps or
// more, so the first never shows the whole answer.
export function elapsedStops(p) {
  const a = toMin(p.h, p.m), b = a + p.d, stops = [a];
  const q = Math.ceil((a + 1) / 15) * 15, hour = Math.ceil((a + 1) / 60) * 60;
  if (a % 15 && q < b) stops.push(q);
  if (hour < b && !stops.includes(hour)) stops.push(hour);
  if (stops.length === 1) stops.push(a + 15 < b ? a + 15 : a + 5 < b ? a + 5 : a + 1);
  stops.push(b);
  return stops;
}
const hm = (t) => { const { h, m } = fromMin(t); return digital(h, m); };
// The words: before answering, the first jump and "then to 3:45?" (or "then 20 more?"); worked,
// every jump and the sum.
// Within one hour in 5s (longA, addA) the hint is drawn around the clock instead: the minute
// hand's sweep from the start to the end, counted by 5s on the rim. Before answering only the
// first half of the 5s are labeled (and adding, the sweep stops there too), never the total.
export const inHour = (p) => !p.cross && p.h2 === p.h && p.m % 5 === 0 && p.d % 5 === 0;
const faceNumber = (m) => (m % 60 ? (m % 60) / 5 : 12);
export const sweepCounted = (p, worked) => (worked ? p.d / 5 : Math.max(1, Math.floor(p.d / 10)));
export function sweepLayer(p, worked) {
  const n = p.d / 5, k = sweepCounted(p, worked);
  const labels = Array.from({ length: k }, (_, i) => ({ m: p.m + 5 * (i + 1), text: 5 * (i + 1), strong: worked && i === n - 1 }));
  const dots = Array.from({ length: n - k }, (_, i) => p.m + 5 * (k + i + 1));
  if (p.kind === "add" && !worked) return { from: p.m, to: p.m + 5 * k, labels };
  return { from: p.m, to: p.m + p.d, labels, dots, ghost: { h: p.h, m: p.m } };
}
export function elapsedHint(p, worked) {
  const s = elapsedStops(p), jumps = s.slice(1).map((t, i) => t - s[i]);
  if (inHour(p)) {
    const counts = Array.from({ length: sweepCounted(p, worked) }, (_, i) => 5 * (i + 1)).join(", ");
    if (p.kind === "long") return { say: worked ? `From the ${faceNumber(p.m)} to the ${faceNumber(p.m2)}: ${counts}. ${p.d} minutes.` : `From the ${faceNumber(p.m)} to the ${faceNumber(p.m2)}: ${counts}, … How many minutes?` };
    return { say: worked ? `From the ${faceNumber(p.m)}: ${counts}. The long hand lands on the ${faceNumber(p.m2)}: ${digital(p.h2, p.m2)}.` : `From the ${faceNumber(p.m)}, count ${p.d} minutes by 5s: ${counts}, … Where does the long hand land?` };
  }
  if (p.kind === "long") {
    if (!worked) return { say: `${hm(s[0])} → ${hm(s[1])} is ${jumps[0]}, then to ${hm(s[s.length - 1])}?` };
    return { say: `${s.slice(1).map((t, i) => `${hm(s[i])} → ${hm(t)} is ${jumps[i]}`).join(", ")}. ${jumps.join(" + ")} = ${p.d} minutes.` };
  }
  if (!worked) return { say: `${hm(s[0])} + ${jumps[0]} is ${hm(s[1])}. Then the rest of the ${p.d} minutes: ?` };
  return { say: `${hm(s[0])} + ${jumps.join(" + ")} = ${hm(s[s.length - 1])}.` };
}
// The picture. long: the two clocks side by side with their times under them, an arrow between;
// add: the start clock and its time. With the hint: within the hour, one big clock with the sweep
// (above); across the hour or to the minute, the open number line under them (3.MD.1): a hop for
// each jump, labeled with its minutes, the stops' times under the line; before answering only
// the first hop is labeled, the end time shown (long) or "?" (add), the rest "?".
export function elapsedSvg(p, opt = {}) {
  const W = 300, C = 118, gold = "#ffc93c", ink = "#f3efe4", line = 26;
  const clockAt = (h, m, x) => clockSvg(h, m, { monster: false }).replace('<svg viewBox="0 0 240 240"', `<svg x="${x}" y="0" width="${C}" height="${C}" viewBox="-6 -6 252 252"`);
  const label = (x, t) => `<text x="${x + C / 2}" y="${C + 22}" text-anchor="middle" font-family="Bungee, sans-serif" font-size="20" fill="${ink}">${t}</text>`;
  let s = "";
  // Within the hour, the hint is one big clock: the start's hands faint, the end's solid (adding:
  // the start's, until it's worked), the sweep between counted by 5s on the rim.
  if (opt.hint && inHour(p)) {
    const B = 190, show = p.kind === "add" && !opt.worked ? [p.h, p.m] : [p.h2, p.m2];
    s += clockSvg(show[0], show[1], { monster: false, hint: sweepLayer(p, opt.worked) }).replace('<svg viewBox="0 0 240 240"', `<svg x="${(W - B) / 2}" y="0" width="${B}" height="${B}" viewBox="-14 -14 268 268"`);
    const caption = p.kind === "long" ? `${digital(p.h, p.m)} → ${digital(p.h2, p.m2)}` : `${digital(p.h, p.m)} + ${p.d} min`;
    s += `<text x="${W / 2}" y="${B + 24}" text-anchor="middle" font-family="Bungee, sans-serif" font-size="20" fill="${ink}">${caption}</text>`;
    return `<svg viewBox="0 0 ${W} ${B + 32}" class="elapsed" role="img" aria-label="${caption}">${s}</svg>`;
  }
  if (p.kind === "long") {
    s += clockAt(p.h, p.m, 8) + label(8, digital(p.h, p.m)) + clockAt(p.h2, p.m2, W - C - 8) + label(W - C - 8, digital(p.h2, p.m2));
    s += `<path d="M${W / 2 - 14} ${C / 2} H${W / 2 + 12} M${W / 2 + 4} ${C / 2 - 8} L${W / 2 + 13} ${C / 2} L${W / 2 + 4} ${C / 2 + 8}" fill="none" stroke="${gold}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  } else {
    s += clockAt(p.h, p.m, (W - C) / 2) + label((W - C) / 2, digital(p.h, p.m));
  }
  let H = C + 32;
  if (opt.hint) {
    const st = elapsedStops(p), y = H + 58, x0 = 18, x1 = W - 18, span = st[st.length - 1] - st[0];
    const X = (t) => x0 + (x1 - x0) * (t - st[0]) / span;
    s += `<line x1="${x0 - 6}" y1="${y}" x2="${x1 + 6}" y2="${y}" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
    st.forEach((t, i) => {
      const last = i === st.length - 1, hide = last && p.kind === "add" && !opt.worked;
      s += `<line x1="${X(t)}" y1="${y - 7}" x2="${X(t)}" y2="${y + 7}" stroke="${ink}" stroke-width="2.5"/><text x="${X(t)}" y="${y + 22}" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="12" fill="${ink}" class="stop">${hide ? "?" : hm(t)}</text>`;
      if (i) {
        const a = X(st[i - 1]), b = X(t), m = (a + b) / 2, show = opt.worked || i === 1;
        s += `<path d="M${a + 2} ${y - 6} Q${m} ${y - line - 14} ${b - 2} ${y - 6}" fill="none" stroke="${i === 1 ? gold : "#8eeae4"}" stroke-width="2.5"/>`;
        s += `<text x="${m}" y="${y - line - 10}" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="13" fill="${i === 1 ? gold : "#8eeae4"}" class="jump">${show ? "+" + (t - st[i - 1]) : "?"}</text>`;
      }
    });
    H = y + 30;
  }
  return `<svg viewBox="0 0 ${W} ${H}" class="elapsed" role="img" aria-label="${p.kind === "long" ? `from ${digital(p.h, p.m)} to ${digital(p.h2, p.m2)}` : `${digital(p.h, p.m)}, ${p.d} minutes later`}">${s}</svg>`;
}
// The question on screen, in parts with null for each slot.
export function elapsedLine(p) {
  if (p.kind === "long") return ["Minutes: ", null];
  if (p.cross) return [null, ":", null];
  return [`${p.h2}:`, null];
}
// A whole time is typed in two slots, "□:□□": the hour, then (Hit!, "Minutes ›") the minutes.
// readTime reads them as the page checks them: "7" and "05" (or "5") are 7:05.
export const readTime = (hour, minutes) => ({ h: Number(hour), m: Number(minutes) });
