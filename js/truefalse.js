// True or false for the Equal Twins (1st grade, 1.OA.D.7: the equal sign means the same amount;
// decide whether equations are true or false). A prototype for the review page (review/proto/);
// nothing in the game reads it yet. No DOM: runs in Node.
//
// No ✓/✗ buttons (a 50/50 pick invites guessing): the answer is a number typed.
// - How many are true? 3 or 4 equations on little balance scales; type how many are true. Never
//   all true or all false. (Read aloud, 5 equations ran past 15 seconds, so it's 3 or 4.)
// - Fix it: one false equation, its wrong number struck through and a □; type the number that
//   makes it true.
// Forms the standard asks for: the answer on either side (3 + 4 = 7, 7 = 3 + 4), the same number
// both sides (6 = 6), sums on both sides (5 + 1 = 2 + 4), and taking away (8 − 3 = 5). A false one
// is off by 1 or 2.
import { spoken } from "./problems.js";

const DK = "#0c171c", GOLD = "#ffc93c", CORAL = "#ff5a4e", INK = "#f3efe4", MUTED = "#a9bec1", TEAL = "#8eeae4";
const f1 = (n) => Math.round(n * 10) / 10;

export const TF_LEVELS = [
  { id: "count10", name: "How many true? to 10", grade: "1st", max: 10 },
  { id: "count20", name: "How many true? to 20", grade: "1st", max: 20 },
  { id: "fix10", name: "Fix it, to 10", grade: "1st", max: 10 },
  { id: "fix20", name: "Fix it, to 20", grade: "1st", max: 20 }
];
const level = (id) => TF_LEVELS.find((l) => l.id === id) || TF_LEVELS[0];
const r = (rnd, a, b) => a + Math.floor(rnd() * (b - a + 1));

// An equation: { l: [terms], lop, r: [terms], rop, fix: which side holds the number a false one
// changes ("l" or "r") }. Terms are numbers; an op is "+" or "−" between two terms.
export const sideValue = (terms, op) => (terms.length === 1 ? terms[0] : op === "−" ? terms[0] - terms[1] : terms[0] + terms[1]);
export const eqValue = (e) => [sideValue(e.l, e.lop), sideValue(e.r, e.rop)];
export const isTrue = (e) => { const [a, b] = eqValue(e); return a === b; };
export const eqText = (e) => `${e.l.join(` ${e.lop || "+"} `)} = ${e.r.join(` ${e.rop || "+"} `)}`;

// A true equation in one of the forms, all numbers up to max.
export function trueEquation(max, rnd) {
  for (;;) {
    const form = r(rnd, 0, 4);
    if (form === 0) { const a = r(rnd, 0, max - 1), b = r(rnd, 1, max - a); return { l: [a, b], lop: "+", r: [a + b], fix: "r", form: "a + b = c" }; }
    if (form === 1) { const a = r(rnd, 1, max - 1), b = r(rnd, 1, max - a); return { l: [a + b], r: [a, b], rop: "+", fix: "l", form: "c = a + b" }; }
    if (form === 2) { const c = r(rnd, 1, max); return { l: [c], r: [c], fix: "r", form: "c = c" }; }
    if (form === 3) {
      const t = r(rnd, 3, max), a = r(rnd, 1, t - 1), c = r(rnd, 1, t - 1);
      if (a === c || a === t - c) continue;
      return { l: [a, t - a], lop: "+", r: [c, t - c], rop: "+", fix: "r", form: "a + b = c + d" };
    }
    const a = r(rnd, 2, max), b = r(rnd, 1, a - 1);
    return rnd() < 0.5 ? { l: [a, b], lop: "−", r: [a - b], fix: "r", form: "a − b = c" } : { l: [a - b], r: [a, b], rop: "−", fix: "l", form: "c = a − b" };
  }
}
// The same equation made false: the number on its fix side (the last one there) off by 1 or 2,
// staying a whole number up to max.
export function falsify(e, max, rnd) {
  for (let tries = 0; tries < 20; tries++) {
    const off = (rnd() < 0.5 ? 1 : 2) * (rnd() < 0.5 ? -1 : 1), side = e[e.fix].slice(), i = side.length - 1, v = side[i] + off;
    if (v < 0 || v > max) continue;
    side[i] = v;
    const f = { ...e, [e.fix]: side, was: e[e.fix][i], off };
    if (!isTrue(f)) return f;
  }
  return null;
}

// A problem.
// - count: { kind: "count", eqs (3 or 4), ans: how many are true } with 1 to n − 1 true.
// - fix: { kind: "fix", eq (false), right: the true number, ans: right }.
export function tfProblem(id, rnd = Math.random) {
  const lv = level(id);
  if (id.startsWith("fix")) {
    for (;;) {
      const e = trueEquation(lv.max, rnd);
      if (e.form === "c = c") continue;
      const f = falsify(e, lv.max, rnd);
      if (f) return { kind: "fix", max: lv.max, eq: f, ans: f.was };
    }
  }
  const n = rnd() < 0.5 ? 3 : 4, k = r(rnd, 1, n - 1);
  const eqs = [];
  while (eqs.length < n) {
    const e = trueEquation(lv.max, rnd), want = eqs.filter(isTrue).length < k;
    const q = want ? e : falsify(e, lv.max, rnd);
    if (q && !eqs.some((x) => eqText(x) === eqText(q))) eqs.push(q);
  }
  for (let i = eqs.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [eqs[i], eqs[j]] = [eqs[j], eqs[i]]; }
  return { kind: "count", max: lv.max, eqs, ans: eqs.filter(isTrue).length };
}

// Spoken: each equation read out, since a pre-reader can't read them.
const WORD = { "+": "plus", "−": "minus" };
const sideWords = (terms, op) => terms.map((t) => spoken(t)).join(` ${WORD[op || "+"]} `);
export const eqWords = (e) => cap(`${sideWords(e.l, e.lop)} equals ${sideWords(e.r, e.rop)}`);
const cap = (t) => t[0].toUpperCase() + t.slice(1);
export function spokenTF(p) {
  if (p.kind === "fix") {
    const e = p.eq, l = e.fix === "l" ? fixSideWords(e.l, e.lop) : sideWords(e.l, e.lop), rr = e.fix === "r" ? fixSideWords(e.r, e.rop) : sideWords(e.r, e.rop);
    return `Fix it! ${cap(l)} equals ${rr}?`;
  }
  return p.eqs.map((e) => eqWords(e) + ".").join(" ") + " How many are true?";
}
// The fix side with its last number as "what".
const fixSideWords = (terms, op) => terms.map((t, i) => (i === terms.length - 1 ? "what" : spoken(t))).join(` ${WORD[op || "+"]} `);

/* ---------- the drawing ---------- */
// One scale, its equation over the beam: level, or (opt.tip) tipped toward the heavier side, the
// true ones level; opt.glow: gold (worked, a true one) with its count number.
export const SCALE = { w: 170, h: 92 };
function scale(e, x, y, opt = {}) {
  const [a, b] = eqValue(e), cx = x + SCALE.w / 2, beamY = y + 52;
  const tilt = opt.tip ? Math.sign(b - a) * Math.min(12, 5 + Math.abs(a - b) * 3) : 0;
  let s = "";
  if (opt.glow) s += `<rect x="${x + 2}" y="${y + 2}" width="${SCALE.w - 4}" height="${SCALE.h - 4}" rx="14" fill="${GOLD}" opacity=".18" stroke="${GOLD}" stroke-width="2.5"/>`;
  // The post and its foot.
  s += `<path d="M${cx} ${beamY} L${cx - 13} ${y + 84} H${cx + 13} Z" fill="${MUTED}" stroke="${DK}" stroke-width="2.5" stroke-linejoin="round"/>`;
  // The beam and pans turn together about the post's top.
  const pan = (px) => `<path d="M${px - 26} ${beamY + 12} Q${px} ${beamY + 26} ${px + 26} ${beamY + 12} Z" fill="${TEAL}" stroke="${DK}" stroke-width="2.5" stroke-linejoin="round"/><path d="M${px} ${beamY} V${beamY + 12}" stroke="${DK}" stroke-width="2"/>`;
  s += `<g transform="rotate(${tilt} ${cx} ${beamY})"><line x1="${x + 14}" y1="${beamY}" x2="${x + SCALE.w - 14}" y2="${beamY}" stroke="${DK}" stroke-width="8" stroke-linecap="round"/><line x1="${x + 14}" y1="${beamY}" x2="${x + SCALE.w - 14}" y2="${beamY}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>${pan(x + 34)}${pan(x + SCALE.w - 34)}</g>`;
  s += `<circle cx="${cx}" cy="${beamY}" r="5" fill="${GOLD}" stroke="${DK}" stroke-width="2"/>`;
  // The equation, over the beam, sized to fit the scale.
  const text = eqText(e), size = Math.min(22, Math.floor((SCALE.w - 16) / (text.length * 0.62)));
  s += `<text x="${cx}" y="${y + 22}" dy=".36em" text-anchor="middle" font-family="Bungee, sans-serif" font-size="${size}" fill="${INK}">${text}</text>`;
  if (opt.num) s += `<circle cx="${x + SCALE.w - 12}" cy="${y + 12}" r="11" fill="${GOLD}" stroke="${DK}" stroke-width="2.5"/><text x="${x + SCALE.w - 12}" y="${y + 12}" dy=".36em" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="14" fill="${DK}">${opt.num}</text>`;
  return s;
}
// The picture. count: the scales two to a row. fix: one big scale with dots in the pans (each
// side's amount), tipped as it stands; opt.hint levels it at the right number (worked).
export function tfSvg(p, opt = {}) {
  if (p.kind === "count") {
    const per = 2, gap = 10, rows = Math.ceil(p.eqs.length / per), W = per * SCALE.w + gap;
    let s = "", n = 0;
    p.eqs.forEach((e, i) => {
      const x = (i % per) * (SCALE.w + gap), y = Math.floor(i / per) * (SCALE.h + gap), t = isTrue(e);
      const glow = opt.worked && t;
      if (glow) n++;
      s += scale(e, x, y, { tip: !!opt.hint, glow, num: glow ? n : 0 });
    });
    return `<svg viewBox="-4 -4 ${W + 8} ${rows * (SCALE.h + gap) + 4}" class="tf" role="img" aria-label="${p.eqs.map(eqText).join("; ")}">${s}</svg>`;
  }
  // Fix it: the pans hold dots for each side's amount, tipped toward the heavier side; worked,
  // the right number's dots and the scale level.
  const e = opt.worked ? { ...p.eq, [p.eq.fix]: p.eq[p.eq.fix].slice(0, -1).concat(p.ans) } : p.eq;
  const [a, b] = eqValue(e), W = 300, cx = W / 2, beamY = 70, tilt = Math.sign(b - a) * Math.min(12, 5 + Math.abs(a - b) * 3);
  const dots = (px, v, color) => Array.from({ length: v }, (_, k) => `<circle cx="${f1(px - 36 + (k % 5) * 18)}" cy="${f1(beamY + 2 - Math.floor(k / 5) * 15)}" r="6.5" fill="${color}" stroke="${DK}" stroke-width="1.5"/>`).join("");
  let s = `<path d="M${cx} ${beamY} L${cx - 18} ${beamY + 70} H${cx + 18} Z" fill="${MUTED}" stroke="${DK}" stroke-width="3" stroke-linejoin="round"/>`;
  const pan = (px) => `<path d="M${px - 50} ${beamY + 14} Q${px} ${beamY + 36} ${px + 50} ${beamY + 14} Z" fill="${TEAL}" stroke="${DK}" stroke-width="3" stroke-linejoin="round"/>`;
  s += `<g transform="rotate(${tilt} ${cx} ${beamY})"><line x1="20" y1="${beamY}" x2="${W - 20}" y2="${beamY}" stroke="${DK}" stroke-width="10" stroke-linecap="round"/><line x1="20" y1="${beamY}" x2="${W - 20}" y2="${beamY}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>${pan(70)}${pan(W - 70)}`
    + `<g transform="translate(0 0)">${dots(70, a, GOLD)}${dots(W - 70, b, opt.worked ? GOLD : CORAL)}</g></g>`;
  s += `<circle cx="${cx}" cy="${beamY}" r="7" fill="${GOLD}" stroke="${DK}" stroke-width="2.5"/>`;
  return `<svg viewBox="0 ${beamY - 70} ${W} 160" class="tf" role="img" aria-label="${eqText(e)}">${s}</svg>`;
}
// The line on screen for fix it: the false equation with its wrong number struck through, then
// the slot (the page fills slot as the answer box).
export function fixParts(p) {
  const e = p.eq, side = (terms, op, open) => terms.map((t, i) => (open && i === terms.length - 1 ? null : String(t))).reduce((out, t, i) => out.concat(i ? [` ${op || "+"} `, t] : [t]), []);
  return [...side(e.l, e.lop, e.fix === "l"), " = ", ...side(e.r, e.rop, e.fix === "r")];
}
export function tfHint(p, worked) {
  if (p.kind === "fix") {
    // The side without the □ is worked out ("4 + 2 is 6"); when the □ shares its side with a number
    // (2 + 4 = 5 + □), that number and the □ make the same.
    const e = p.eq, other = e.fix === "r" ? e.l : e.r, op = e.fix === "r" ? e.lop : e.rop, total = sideValue(other, op);
    const open = e[e.fix], fixOp = e.fix === "r" ? e.rop : e.lop;
    if (open.length === 1) return { say: worked ? `${other.join(` ${op} `)} is ${total}.` : `Both sides are the same. ${other.join(` ${op} `)} is ?` };
    return { say: `Both sides are the same: ${other.join(` ${op} `)} is ${total}. ${open[0]} ${fixOp} ? = ${total}${worked ? `, so ? is ${p.ans}` : ""}` };
  }
  return worked
    ? { say: `The true ones balance: ${Array.from({ length: p.ans }, (_, i) => i + 1).join(", ")}. ${p.ans} ${p.ans === 1 ? "is" : "are"} true.` }
    : { say: "A true one balances: both sides are the same. A false one tips." };
}
