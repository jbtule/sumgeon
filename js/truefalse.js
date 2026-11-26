// True or false for the Equal Twins (1st grade, 1.OA.D.7: the equal sign means the same amount;
// decide whether equations are true or false), in the game (the Equal Twins' problems in the
// Balance Hall, learn.js BANDS.first) and on the review page (review/proto/). No DOM: runs in Node.
//
// - True or false? One equation on a balance scale, answered on two big keys, True ✓ and False ✗,
//   in the number pad's place (as the comparing keys are); about half are true.
// - Fix it: one false equation, its wrong number struck through and a □; type the number that
//   makes it true.
// Forms the standard asks for: the answer on either side (3 + 4 = 7, 7 = 3 + 4), the same number
// both sides (6 = 6), sums on both sides (5 + 1 = 2 + 4), and taking away (8 − 3 = 5). A false one
// is off by 1 or 2.
import { spoken } from "./problems.js";

const DK = "#0c171c", GOLD = "#ffc93c", CORAL = "#ff5a4e", INK = "#f3efe4", MUTED = "#a9bec1", TEAL = "#8eeae4";
const f1 = (n) => Math.round(n * 10) / 10;

export const TF_LEVELS = [
  { id: "tf10", name: "True or false? to 10", grade: "1st", max: 10 },
  { id: "tf20", name: "True or false? to 20", grade: "1st", max: 20 },
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
// - tf: { kind: "tf", eq, ans: "T" or "F" }, about half of each.
// - fix: { kind: "fix", eq (false), ans: the number that makes it true }.
export function tfProblem(id, rnd = Math.random) {
  const lv = level(id);
  for (;;) {
    const e = trueEquation(lv.max, rnd);
    if (id.startsWith("fix")) {
      if (e.form === "c = c") continue;
      const f = falsify(e, lv.max, rnd);
      if (f) return { kind: "fix", max: lv.max, eq: f, ans: f.was };
      continue;
    }
    if (rnd() < 0.5) return { kind: "tf", max: lv.max, eq: e, ans: "T" };
    const f = falsify(e, lv.max, rnd);
    if (f) return { kind: "tf", max: lv.max, eq: f, ans: "F" };
  }
}

// Spoken: the equation read out, since a pre-reader can't read it. "Four plus two equals seven.
// True or false?"; "Fix it! Four plus two equals what?"
const WORD = { "+": "plus", "−": "minus" };
const sideWords = (terms, op) => terms.map((t) => spoken(t)).join(` ${WORD[op || "+"]} `);
export const eqWords = (e) => cap(`${sideWords(e.l, e.lop)} equals ${sideWords(e.r, e.rop)}`);
const cap = (t) => t[0].toUpperCase() + t.slice(1);
// The fix side with its last number as "what".
const fixSideWords = (terms, op) => terms.map((t, i) => (i === terms.length - 1 ? "what" : spoken(t))).join(` ${WORD[op || "+"]} `);
export function spokenTF(p) {
  if (p.kind === "fix") {
    const e = p.eq, l = e.fix === "l" ? fixSideWords(e.l, e.lop) : sideWords(e.l, e.lop), rr = e.fix === "r" ? fixSideWords(e.r, e.rop) : sideWords(e.r, e.rop);
    return `Fix it! ${cap(l)} equals ${rr}?`;
  }
  return `${eqWords(p.eq)}. True or false?`;
}
// Said after a miss, in words: "Four plus two is six, not seven. False."; "Four plus three equals
// seven."
export const spokenTFAnswer = (p) => (p.kind === "fix" ? eqWords(fixed(p)) + "." : tfWorkedWords(p.eq));
export function tfWorkedWords(e) {
  const [a, b] = eqValue(e), L = sideWords(e.l, e.lop), R = sideWords(e.r, e.rop), t = a === b, A = spoken(a), B = spoken(b);
  if (e.l.length > 1 && e.r.length > 1) return `${cap(L)} is ${A} and ${R} is ${B}. ${t ? "True" : "False"}.`;
  if (e.l.length > 1) return t ? `${cap(L)} is ${A}. True.` : `${cap(L)} is ${A}, not ${B}. False.`;
  if (e.r.length > 1) return t ? `${cap(R)} is ${B}. True.` : `${cap(R)} is ${B}, not ${A}. False.`;
  return t ? `${cap(A)} is ${B}. True.` : `${cap(A)} is not ${B}. False.`;
}
const fixed = (p) => ({ ...p.eq, [p.eq.fix]: p.eq[p.eq.fix].slice(0, -1).concat(p.ans) });

/* ---------- the drawing ---------- */
// One big balance scale: the equation over the beam (tf), the pans holding each side's dots when
// the hint is open (or always, for fix it). True or false stays level until it's answered (or the
// worked hint), so the hint never gives the answer away: its dots are there to count. Fix it is
// always tipped, since it's false. Worked, a true one glows gold.
// How far the scale tips toward the heavier side, in degrees (0 when it balances).
export const tiltOf = (e) => { const [a, b] = eqValue(e); return Math.sign(b - a) * Math.min(12, 5 + Math.abs(a - b) * 3); };
// opt.value: fix it, the number in the slot (the scale weighs that); opt.done: true or false,
// answered, so the scale shows what's true (level when true, tipped when false); opt.from: the
// tilt the scale swings from, to its new tilt with a little wobble to rest (the page leaves it out
// with reduced motion).
export function tfSvg(p, opt = {}) {
  const e = p.kind === "fix" && opt.value != null ? { ...p.eq, [p.eq.fix]: p.eq[p.eq.fix].slice(0, -1).concat(opt.value) } : p.kind === "fix" && opt.worked ? fixed(p) : p.eq, [a, b] = eqValue(e);
  const W = 300, cx = W / 2, beamY = 96, showDots = p.kind === "fix" || opt.hint || opt.done;
  const tip = p.kind === "fix" || opt.done || (opt.hint && opt.worked), tilt = tip ? tiltOf(e) : 0, truth = p.sym || p.ans;
  // The swing, as an SVG animation of the beam's turn: from, past the new tilt and back, to rest.
  const turn = (deg) => `${f1(deg)} ${cx} ${beamY}`;
  const swing = opt.from != null ? `<animateTransform attributeName="transform" type="rotate" dur="1.1s" fill="freeze" calcMode="spline" keyTimes="0;0.55;0.75;0.9;1" keySplines="0.3 0 0.4 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1" values="${(() => { const dir = Math.sign(tilt - opt.from) || 1; return [opt.from, tilt + 4 * dir, tilt - 2 * dir, tilt + 0.7 * dir, tilt]; })().map(turn).join(";")}"/>` : "";
  const dots = (px, v, color) => Array.from({ length: v }, (_, k) => `<circle cx="${f1(px - 36 + (k % 5) * 18)}" cy="${f1(beamY + 2 - Math.floor(k / 5) * 15)}" r="6.5" fill="${color}" stroke="${DK}" stroke-width="1.5"/>`).join("");
  let s = "";
  if (p.kind === "tf" && opt.worked) s += `<rect x="4" y="4" width="${W - 8}" height="${beamY + 72}" rx="18" fill="${truth === "T" ? GOLD : CORAL}" opacity=".14" stroke="${truth === "T" ? GOLD : CORAL}" stroke-width="3"/>`;
  // opt.bare: no equation over the beam (the game writes it on the line under the scale, bigger).
  if (p.kind === "tf" && !opt.bare) s += `<text x="${cx}" y="34" dy=".36em" text-anchor="middle" font-family="Bungee, sans-serif" font-size="${Math.min(32, Math.floor(280 / (eqText(e).length * 0.62)))}" fill="${INK}">${eqText(e)}</text>`;
  s += `<path d="M${cx} ${beamY} L${cx - 18} ${beamY + 66} H${cx + 18} Z" fill="${MUTED}" stroke="${DK}" stroke-width="3" stroke-linejoin="round"/>`;
  const pan = (px) => `<path d="M${px - 50} ${beamY + 14} Q${px} ${beamY + 36} ${px + 50} ${beamY + 14} Z" fill="${TEAL}" stroke="${DK}" stroke-width="3" stroke-linejoin="round"/>`;
  // The beam turns about the post's top.
  s += `<g transform="rotate(${tilt} ${cx} ${beamY})">${swing}<line x1="20" y1="${beamY}" x2="${W - 20}" y2="${beamY}" stroke="${DK}" stroke-width="10" stroke-linecap="round"/><line x1="20" y1="${beamY}" x2="${W - 20}" y2="${beamY}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>${pan(70)}${pan(W - 70)}`
    + (showDots ? dots(70, a, GOLD) + dots(W - 70, b, p.kind === "fix" && a !== b ? CORAL : GOLD) : "") + `</g>`;
  s += `<circle cx="${cx}" cy="${beamY}" r="7" fill="${GOLD}" stroke="${DK}" stroke-width="2.5"/>`;
  // Each side's amount under its pan, once it's answered (or worked): before that, a number under
  // a pan could be the answer.
  if (showDots && (opt.done || opt.worked)) s += [[70, a], [W - 70, b]].map(([x, v]) => `<text x="${x}" y="${beamY + 62}" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="16" fill="${INK}">${v}</text>`).join("");
  const top = p.kind === "tf" && !opt.bare ? 0 : beamY - 74;
  return `<svg viewBox="0 ${top} ${W} ${beamY + 74 - top}" class="tf" role="img" aria-label="${eqText(e)}">${s}</svg>`;
}
// The line on screen for fix it: the false equation with its wrong number struck through, then
// the slot (the page fills slot as the answer box).
export function fixParts(p) {
  const e = p.eq, side = (terms, op, open) => terms.map((t, i) => (open && i === terms.length - 1 ? null : String(t))).reduce((out, t, i) => out.concat(i ? [` ${op || "+"} `, t] : [t]), []);
  return [...side(e.l, e.lop, e.fix === "l"), " = ", ...side(e.r, e.rop, e.fix === "r")];
}
// "4 + 2 is 6, not 7. False."; "4 + 2 is 6, and 6 is 6. True."; "5 + 1 is 6 and 2 + 4 is 6. True."
export function tfWorked(e) {
  const [a, b] = eqValue(e), L = e.l.join(` ${e.lop || "+"} `), R = e.r.join(` ${e.rop || "+"} `);
  const t = a === b;
  if (e.l.length > 1 && e.r.length > 1) return `${L} is ${a} and ${R} is ${b}. ${t ? "True" : "False"}.`;
  if (e.l.length > 1) return t ? `${L} is ${a}. True.` : `${L} is ${a}, not ${b}. False.`;
  if (e.r.length > 1) return t ? `${R} is ${b}. True.` : `${R} is ${b}, not ${a}. False.`;
  return t ? `${a} is ${b}. True.` : `${a} is not ${b}. False.`;
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
  return { say: worked ? tfWorked(p.eq) : "Work out each side. Same on both sides? It balances." };
}

/* ---------- the game's facts (the Equal Twins, learn.js BANDS.first) ----------
   Fixed samples, so 70% of a level can be learned and every problem is recorded. Keys:
   - "✓4+2=7": true or false? (the equation as shown, "-" for −).
   - "✎4+2=7": fix it: the same false equation, its wrong number the last on its fix side (the side
     with one number when the other has two; the right side when both have two).
   A fact: { op: "✓", set, kind: "tf", eq, sym: "T" or "F", ans, key, q } or { op: "✎", set,
   kind: "fix", eq, ans, key, q }. True or false is answered with its symbol (sym, as a comparison
   is); it hits for the bigger side's value (ans: the equation's total when it's true), as Chompers
   hits for the bigger number. Fix it's answer and damage are the number that makes it true. */
const compact = (e) => `${e.l.join(e.lop === "−" ? "-" : "+")}=${e.r.join(e.rop === "−" ? "-" : "+")}`;
const fixSide = (e) => (e.l.length === 1 && e.r.length > 1 ? "l" : "r");
export function tfFact(set, e) {
  const [a, b] = eqValue(e);
  return { op: "✓", set, kind: "tf", eq: { ...e, fix: fixSide(e) }, sym: a === b ? "T" : "F", ans: Math.max(a, b, 1), key: "✓" + compact(e), q: eqText(e) };
}
// A fix-it fact from a false equation; its fix side is worked out from its shape.
export function fixFact(set, e) {
  const fix = fixSide(e), other = fix === "l" ? sideValue(e.r, e.rop) : sideValue(e.l, e.lop), side = e[fix];
  const ans = side.length === 1 ? other : (fix === "l" ? e.lop : e.rop) === "−" ? side[0] - other : other - side[0];
  return { op: "✎", set, kind: "fix", eq: { ...e, fix }, ans, key: "✎" + compact(e), q: eqText(e) };
}
const parseSide = (t) => ({ terms: t.split(/[+-]/).map(Number), op: t.includes("-") ? "−" : t.includes("+") ? "+" : null });
// To 20: some number in it (or a side's value) past 10.
const past10 = (e) => Math.max(...e.l, ...e.r, ...eqValue(e)) > 10;
export function tfFactOf(key) {
  const [l, r] = key.slice(1).split("=").map(parseSide), e = { l: l.terms, r: r.terms };
  if (l.op) e.lop = l.op;
  if (r.op) e.rop = r.op;
  if (key[0] === "✎") return fixFact(past10(e) ? "fix20" : "fix10", e);
  return tfFact(past10(e) ? "tf20" : "tf10", e);
}
// A fixed shuffle (a small LCG, as three.js), so a sample never changes between builds.
function seeded(seed) { let s = seed; return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648; }
// Each level's size: true or false (half true), then fix it.
export const TF_SIZES = { tf10: 24, tf20: 24, fix10: 16, fix20: 16 };
let factCache = null;
export function tfFacts() {
  if (factCache) return factCache;
  const out = [], seen = new Set();
  for (const lv of TF_LEVELS) {
    const rnd = seeded({ tf10: 101, tf20: 202, fix10: 303, fix20: 404 }[lv.id]), want = TF_SIZES[lv.id], fix = lv.id.startsWith("fix");
    let trues = 0, n = 0;
    for (let guard = 0; n < want && guard < 20000; guard++) {
      const e = trueEquation(lv.max, rnd);
      if (past10(e) !== lv.max > 10) continue;
      if (fix && e.form === "c = c") continue;
      // Half of true or false is true; every fix it is false.
      const asTrue = !fix && (n - trues >= want / 2 || (trues < want / 2 && rnd() < 0.5));
      const f = asTrue ? e : falsify(e, lv.max, rnd);
      if (!f || past10(f) !== lv.max > 10) continue;
      const fact = fix ? fixFact(lv.id, f) : tfFact(lv.id, f);
      if (seen.has(fact.key)) continue;
      seen.add(fact.key); out.push(fact); n++;
      if (asTrue) trues++;
    }
  }
  return (factCache = out);
}
