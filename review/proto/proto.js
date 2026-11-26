// The prototype page (review/proto/): new kinds of problem to try on a phone before they're in the
// game, laid out like the game's problem area: the monster's box with the picture, the problem,
// the number pad and Hit! (or the spell pad, to draw), a 💡 hint, and Next. Nothing is saved or
// learned; the only thing kept (in localStorage, "sumgeon:proto") is which kind and level were
// picked and the clock's look. The voice is the device's (speechSynthesis), since these lines
// aren't recorded yet.
//
// Each kind is an entry in TYPES: its levels, its monster, how to make a problem, draw it, hint it
// and say it. An answer is one or more slots typed in order (dollars and cents are two), or a
// drawing (shapes).
import { NEW_MON, MON as GAME_MON, svg } from "../../js/monsters.js";
import { CLOCK_LEVELS, clockProblem, clockLine, clockQuestion, spokenClock, spokenTime, clockSvg, clockHint, digital } from "../../js/clock.js";
import { PATTERN_LEVELS, patternProblem, spokenPattern, spokenPatternAnswer, patternSvg, patternHint, ODD_LEVELS, isOddEven, oddEvenProblem, oddEvenSvg, oddEvenHint, spokenOddEven } from "../../js/patterns.js";
import { TF_LEVELS, tfProblem, tfSvg, tfHint, spokenTF, fixParts, eqWords } from "../../js/truefalse.js";
import { LINE_LEVELS, lineProblem, lineSvg, lineHint, spokenLine, spokenLineAnswer } from "../../js/numberline.js";
import { DOLLAR_LEVELS, dollarProblem, dollarSvg, dollarHint, spokenDollars, sayMoney } from "../../js/dollars.js";
import { SHAPE_LEVELS, shapeLevel, isDraw, countProblem, countSvg, countHint, spokenCount, spokenDraw, readShape, judgeShape, cleanShape, article, CORNERS, COUNT_LINE } from "../../js/shapes.js";

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const monster = (n) => NEW_MON.find((m) => m.n === n) || GAME_MON.find((m) => m.n === n);
const pick = (list, rnd) => list[Math.floor(rnd() * list.length)];

/* ---------- the kinds ---------- */
// slot(i) draws answer slot i (a glowing ?, filling as it's typed); st is the problem's state.
const TYPES = {
  clock: {
    icon: "🕒", label: "Time", mon: "Tick-Tockus", big: true, levels: CLOCK_LEVELS,
    problem: (lv, rnd) => clockProblem(lv.id, rnd),
    picture: (p, st) => clockSvg(p.h, p.m, { numbers: view.numbers, hands: view.hands, hint: st.hint && st.hint.layer, reach: reach() }),
    line: (p, slot) => clockLine(p).map((part) => (part === null ? slot(0) : esc(part))).join(""),
    question: clockQuestion,
    shown: (p) => (p.ask === "minutes" ? String(p.ans).padStart(2, "0") : p.ans),
    hint: clockHint, spoken: spokenClock, missed: (p) => spokenTime(p.h, p.m), answer: (p) => digital(p.h, p.m)
  },
  pattern: {
    icon: "🫧", label: "Patterns", mon: "Slimelipsis", big: true, levels: [...PATTERN_LEVELS, ...ODD_LEVELS],
    problem: (lv, rnd) => (isOddEven(lv.id) ? oddEvenProblem(lv.id, rnd) : patternProblem(lv.id, rnd)),
    picture: (p, st) => (p.kind === "oddeven" ? oddEvenSvg(p, { hint: !!st.hint, worked: st.hint && st.worked })
      : patternSvg(p, { typed: st.typed[0], state: st.done, hops: st.hint && st.hint.hops })),
    line: (p, slot) => (p.kind === "oddeven" ? `${cap(p.ask)} numbers: ${slot(0)}` : p.blank === p.nums.length - 1 ? "What comes next?" : "What's missing?"), words: true,
    hint: (p, worked) => (p.kind === "oddeven" ? oddEvenHint(p, worked) : patternHint(p, worked)),
    spoken: (p) => (p.kind === "oddeven" ? spokenOddEven(p) : spokenPattern(p)),
    missed: (p) => (p.kind === "oddeven" ? `It's ${p.ans}.` : spokenPatternAnswer(p)), answer: (p) => p.ans
  },
  shape: {
    icon: "🔷", label: "Shapes", mon: null, monLabel: "Shape monster (to design)", levels: SHAPE_LEVELS, stratum: () => "hall",
    draw: (lv) => isDraw(lv.id),
    problem: (lv, rnd) => (isDraw(lv.id) ? { draw: true, shape: pick(lv.shapes, rnd), strict: !!lv.strict, ans: null } : countProblem(lv.id, rnd)),
    picture: (p, st) => (p.draw ? `<div class="pp-ask">Draw ${article(p.shape)}<b>${p.shape}</b></div>` : countSvg(p, { hint: !!st.hint, worked: st.hint && st.worked })),
    line: (p, slot) => (p.draw ? "Draw it, then tap Cast!" : `${COUNT_LINE[p.kind]}: ${slot(0)}`), words: true,
    hint: (p, worked) => (p.draw ? { say: `${cap(article(p.shape))}${p.shape} has ${CORNERS[p.shape] ? `${CORNERS[p.shape]} sides and ${CORNERS[p.shape]} corners` : "no corners: it's round all the way"}.` } : countHint(p, worked)),
    spoken: (p) => (p.draw ? spokenDraw(p.shape) : spokenCount(p)),
    missed: (p) => `It's ${p.ans}.`, answer: (p) => p.ans
  },
  truefalse: {
    icon: "⚖️", label: "True or false", mon: "Equal Twins", levels: TF_LEVELS, stratum: () => "hall",
    problem: (lv, rnd) => tfProblem(lv.id, rnd),
    picture: (p, st) => tfSvg(p, { hint: !!st.hint, worked: st.hint && st.worked }),
    // Fix it: the false equation, its wrong number struck through, then the □.
    line: (p, slot) => (p.kind === "count" ? `True ones: ${slot(0)}`
      : fixParts(p).map((x) => (x === null ? `<s>${p.eq[p.eq.fix][p.eq[p.eq.fix].length - 1]}</s>${slot(0)}` : esc(x))).join("")),
    words: (p) => p.kind === "count",
    hint: tfHint, spoken: spokenTF,
    missed: (p) => (p.kind === "count" ? `${p.ans} ${p.ans === 1 ? "is" : "are"} true.` : eqWords({ ...p.eq, [p.eq.fix]: p.eq[p.eq.fix].slice(0, -1).concat(p.ans) }) + "."),
    answer: (p) => p.ans
  },
  numberline: {
    icon: "½", label: "Number line", mon: "Halfling", levels: LINE_LEVELS, stratum: () => "tower",
    problem: (lv, rnd) => lineProblem(lv.id, rnd),
    picture: (p, st) => lineSvg(p, { hint: !!st.hint, worked: st.hint && st.worked }),
    // "□/4", stacked like the Tower's fractions; or "Equal parts: □".
    line: (p, slot) => (p.kind === "parts" ? `Equal parts: ${slot(0)}` : `<span class="frac"><span>${slot(0)}</span><span>${p.d}</span></span>`),
    words: (p) => p.kind === "parts",
    hint: lineHint, spoken: spokenLine, missed: spokenLineAnswer,
    answer: (p) => (p.kind === "parts" ? p.d : `${p.n}/${p.d}`)
  },
  dollars: {
    icon: "💵", label: "Dollars", mon: "Trollar", levels: DOLLAR_LEVELS,
    problem: (lv, rnd) => dollarProblem(lv.id, rnd),
    picture: (p, st) => dollarSvg(p, { hint: !!st.hint, worked: st.worked }),
    // Dollars and cents are two slots, typed in order: "$□ and □¢" (or "$□.□□" to compare).
    line: (p, slot) => (p.kind === "bills" ? `$${slot(0)}` : view.money === "dot" ? `$${slot(0)}.${slot(1)}` : `$${slot(0)} <small>and</small> ${slot(1)}¢`),
    shown: (p, i) => (p.kind === "bills" ? p.ans : i === 1 && view.money === "dot" ? String(p.ans[1]).padStart(2, "0") : p.ans[i]),
    nextLabel: "Cents ›",
    hint: dollarHint, spoken: spokenDollars,
    missed: (p) => (p.kind === "bills" ? sayMoney(p.ans) : sayMoney(p.ans[0], p.ans[1])),
    answer: (p) => (p.kind === "bills" ? `$${p.ans}` : view.money === "dot" ? `$${p.ans[0]}.${String(p.ans[1]).padStart(2, "0")}` : `$${p.ans[0]} and ${p.ans[1]}¢`)
  }
};
const cap = (t) => t[0].toUpperCase() + t.slice(1);

/* ---------- what's picked ---------- */
const STORE = "sumgeon:proto";
// The clock's numbers default to school-style handwriting (an open 4, a 1 that's one line), as on
// a classroom clock; "bungee" is the game's font. Its hands are straight arrows by default;
// "tentacle" tries Tick-Tockus's tentacles as hands.
// Money reads "$□ and □¢" by default (2nd grade writes $ and ¢ apart; decimals come in 4th);
// "dot" tries "$□.□□".
const view = { type: "clock", clock: "hours", pattern: "ones", shape: "drawK", dollars: "bills", numbers: "hand", hands: "arrow", money: "and" };
try { Object.assign(view, JSON.parse(localStorage.getItem(STORE)) || {}); } catch (e) { /* defaults */ }
if (!TYPES[view.type]) view.type = "clock";
const keep = () => { try { localStorage.setItem(STORE, JSON.stringify(view)); } catch (e) { /* this visit only */ } };
// ?type=pattern&level=twos&numbers=hand opens straight to one (for screenshots and links).
const q = new URLSearchParams(location.search);
if (TYPES[q.get("type")]) view.type = q.get("type");
if (q.get("level")) view[view.type] = q.get("level");
if (q.get("numbers")) view.numbers = q.get("numbers") === "hand" ? "hand" : "bungee";
if (q.get("hands")) view.hands = q.get("hands") === "tentacle" ? "tentacle" : "arrow";
if (q.get("money")) view.money = q.get("money") === "dot" ? "dot" : "and";
// ?seed=<n> makes the problems the same each time (for screenshots).
let seed = Number(q.get("seed")) || 0;
const rnd = seed ? () => ((seed = (seed * 9301 + 49297) % 233280) / 233280) : Math.random;
const T = () => TYPES[view.type];
const level = () => T().levels.find((l) => l.id === view[view.type]) || T().levels[0];

// The problem now: { p, typed: [one string per slot], at: the slot being typed, done: null |
// "right" | "wrong", hint: null | "hint" | "worked", note: words after a drawing is read }.
let S = null;

/* ---------- the voice ---------- */
const synth = window.speechSynthesis;
function say(text) {
  if (!synth) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  synth.speak(u);
}

/* ---------- drawing ---------- */
function drawChrome() {
  const t = T(), lv = level(), stratum = t.stratum ? t.stratum(lv) : lv.stratum || "hall";
  document.body.dataset.stratum = stratum;
  $("box").style.setProperty("--wall", `var(--wall-${stratum})`);
  const m = t.mon && monster(t.mon);
  // The clock is Tick-Tockus itself, so it isn't drawn small too; a kind with no monster drawn yet
  // shows a placeholder name.
  $("mon").innerHTML = m && !t.big ? svg(m) : "";
  $("mon").hidden = !m || t.big;
  $("mName").textContent = m ? m.n : t.monLabel;
  $("mName").classList.toggle("placeholder", !m);
  $("types").innerHTML = Object.entries(TYPES).map(([id, x]) => `<button type="button" data-type="${id}" aria-pressed="${id === view.type}" aria-label="${x.label}" title="${x.label}">${x.icon}</button>`).join("");
  $("level").innerHTML = t.levels.map((l) => `<option value="${l.id}"${l.id === lv.id ? " selected" : ""}>${esc(l.name)} · ${l.grade}</option>`).join("");
  $("tools").hidden = view.type !== "clock" && view.type !== "dollars";
  for (const id of ["numStyle", "handStyle"]) $(id).hidden = view.type !== "clock";
  $("moneyStyle").hidden = view.type !== "dollars";
  $("moneyStyle").textContent = view.money === "dot" ? "$3.25" : "$3 and 25¢";
  $("numStyle").textContent = view.numbers === "hand" ? "Handwritten" : "Bungee";
  $("handStyle").textContent = view.hands === "tentacle" ? "Tentacles" : "Arrows";
}
// How far Tick-Tockus's tentacles can reach past the case, in the clock's drawing units, from the
// room the picture has beside and under the clock (its size comes from the CSS).
function reach() {
  const pic = $("pic"), cs = getComputedStyle(pic);
  const w = pic.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const h = pic.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const s = Math.min(pic.clientWidth / 1.36, h), unit = s / 240;
  if (!(unit > 0)) return undefined;
  return { side: ((w - s) / 2 + 4) / unit, below: ((h - s) / 2 + 4) / unit };
}

// Answer slot i: a glowing "?" that fills as it's typed (the one being typed glows), gold when
// right, coral when wrong.
function slot(i) {
  const t = T(), shown = t.shown ? t.shown(S.p, i) : [].concat(S.p.ans)[i];
  const typed = S.typed[i], cls = S.done ? S.done : typed ? "typed" : "", now = !S.done && i === S.at && S.typed.length > 1 ? " now" : "";
  return `<span class="blank ${cls}${now}">${S.done ? shown : typed || "?"}</span>`;
}
function hintNow() { return S.hint ? T().hint(S.p, S.hint === "worked") : null; }
function draw() {
  const t = T(), p = S.p, worked = S.hint === "worked", hint = hintNow();
  const st = { typed: S.typed, done: S.done, hint, worked };
  $("pic").innerHTML = t.picture(p, st);
  $("prob").className = "prob" + ((typeof t.words === "function" ? t.words(p) : t.words) ? " words" : "");
  $("prob").innerHTML = t.line(p, slot);
  if (t.question) $("prob").setAttribute("aria-label", t.question(p)); else $("prob").removeAttribute("aria-label");
  // The line under the box: ✓ Right!, or Oops with the answer and the worked hint, or the hint.
  // An equation in the words doesn't break across lines ("50 + 2 = ?").
  const words = hint ? esc(hint.say.replace(/ ([=+−]) /g, " $1 ")) : "";
  const head = S.note ? `<b>${S.note}</b>` : S.done === "right" ? `<b><span class="tick">✓</span>Right!</b>` : S.done === "wrong" ? `<b>Oops! It's ${esc(t.answer(p))}.</b>` : "";
  $("hint").hidden = !hint && !head;
  $("hint").className = "pp-hint" + (worked || S.done === "wrong" ? " worked" : S.done === "right" ? " good" : "");
  $("hint").innerHTML = head + words;
  $("said").textContent = t.spoken(p);
  padUI(p.draw ? "spell" : "num");
  const go = $("pad").querySelector('[data-k="go"]');
  go.textContent = S.done ? "Next ›" : p.draw ? "Cast!" : S.at < S.typed.length - 1 ? t.nextLabel || "Next ›" : "Hit!";
  go.classList.toggle("next", !!S.done);
  go.setAttribute("aria-label", S.done ? "Next problem" : p.draw ? "Cast the drawing" : "Attack");
  document.querySelector(".pp").classList.toggle("drawing", !!p.draw);
  // Again now the hint line has settled the room left, so the tentacles fit it.
  if (view.type === "clock") $("pic").innerHTML = t.picture(p, st);
  if (p.draw) paint();
}
let resized = 0;
addEventListener("resize", () => { clearTimeout(resized); resized = setTimeout(() => S && draw(), 100); });

/* ---------- the pads ---------- */
// The number pad, or the spell pad to draw on (as the game's, app.js padUI("spell")): a glowing
// pad with Clear and Cast in the number pad's place.
function padUI(mode) {
  const pad = $("pad");
  if (pad.dataset.mode === mode) return;
  pad.dataset.mode = mode;
  pad.classList.toggle("spell", mode === "spell");
  if (mode === "spell") {
    pad.innerHTML = `<canvas id="sigil" class="sigil" aria-label="Draw here"></canvas><button type="button" data-k="clear" class="del">Clear</button><button type="button" data-k="go" class="go">Cast!</button>`;
    const c = $("sigil");
    c.onpointerdown = (e) => { if (S.done) return; e.preventDefault(); c.setPointerCapture(e.pointerId); drawing = [point(e)]; strokes.push(drawing); paint(); };
    c.onpointermove = (e) => { if (!drawing) return; drawing.push(point(e)); paint(); };
    c.onpointerup = c.onpointercancel = () => { drawing = null; };
    return;
  }
  pad.innerHTML = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0", "go"].map((k) =>
    `<button type="button" data-k="${k}" class="${k === "go" ? "go" : k === "del" ? "del" : ""}" aria-label="${k === "del" ? "Delete" : k === "go" ? "Attack" : k}">${k === "del" ? "⌫" : k === "go" ? "Hit!" : k}</button>`).join("");
}
let strokes = [], drawing = null, overlay = null;
function point(e) { const r = $("sigil").getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
// The strokes glowing gold; after a read, dimmed under the clean shape (overlay) glowing green.
function paint() {
  const c = $("sigil");
  if (!c) return;
  const r = c.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  if (c.width !== Math.round(r.width * dpr) || c.height !== Math.round(r.height * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
  const g = c.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, r.width, r.height);
  g.lineCap = g.lineJoin = "round"; g.lineWidth = 8; g.strokeStyle = "#fff1b8"; g.shadowColor = "#ffc93c"; g.shadowBlur = 16;
  g.globalAlpha = overlay ? 0.35 : 1;
  const line = (s) => { g.beginPath(); s.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); if (s.length === 1) g.lineTo(s[0][0] + 0.5, s[0][1]); g.stroke(); };
  strokes.forEach(line);
  g.globalAlpha = 1;
  if (overlay) { g.strokeStyle = "#e8ffe9"; g.shadowColor = "#7fdc8a"; g.shadowBlur = 20; g.lineWidth = 7; overlay.forEach(line); }
}
// Cast: read the drawing knowing the shape asked (shapes.js judgeShape), as a spell is read.
function cast() {
  const p = S.p, r = readShape(strokes, { strict: p.strict }), j = judgeShape(r, p.shape, p.strict);
  const pts = strokes.flat(), xs = pts.map((v) => v[0]), ys = pts.map((v) => v[1]);
  const c = $("sigil").getBoundingClientRect();
  // The clean shape goes over the drawing, or in the middle of the pad if the drawing is tiny.
  const box = pts.length > 1 && Math.max(...xs) - Math.min(...xs) + Math.max(...ys) - Math.min(...ys) > 40
    ? { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
    : { x: c.width * 0.3, y: c.height * 0.15, w: c.width * 0.4, h: c.height * 0.7 };
  S.read = r && { shape: r.shape, clear: r.clear, fit: r.fit, margin: r.margin, corners: r.corners, aspect: r.aspect, outcome: j.outcome };
  if (j.outcome === "retry") {
    strokes = []; S.tries = (S.tries || 0) + 1;
    S.note = "Hmm, I can't tell. Try again!";
    say("Try again!");
    draw();
    return;
  }
  // The clean shape: shaped like theirs when it counted, the plain one when it was another shape.
  // A good drawing stays as it is, as a good spell does.
  overlay = j.outcome === "hit" ? null : cleanShape(j.outcome === "wrong" ? null : r, p.shape, box);
  if (j.outcome === "wrong") {
    S.done = "wrong"; S.hint = "hint";
    S.note = `Oops! That looks like ${article(r.shape)}${r.shape}.`;
    say(`Oops! That looks like ${article(r.shape)}${r.shape}. Here's ${article(p.shape)}${p.shape}.`);
  } else {
    S.done = "right";
    S.note = j.outcome === "hit" ? `✓ ${cap(article(p.shape))}${p.shape}!` : `✓ ${cap(article(p.shape))}${p.shape}! Here's a neat one.`;
    say(j.outcome === "hit" ? `${cap(article(p.shape))}${p.shape}!` : `${cap(article(p.shape))}${p.shape}! Here's a neat one.`);
  }
  draw();
}

/* ---------- play ---------- */
let spoke = false; // the voice waits for the first tap (iOS only speaks inside one)
function next(speak) {
  const t = T(), lv = level();
  let p;
  // Not the same problem twice in a row.
  for (let i = 0; i < 8; i++) {
    p = t.problem(lv, rnd);
    if (!S || JSON.stringify(p) !== JSON.stringify(S.p)) break;
  }
  // ?time=3:37 shows that time first (asking the minutes, or the hour on the hour); ?shape=hexagon
  // asks for that shape first.
  const tm = !S && view.type === "clock" && /^(\d{1,2}):(\d\d)$/.exec(q.get("time") || "");
  if (tm) { const h = Number(tm[1]), m = Number(tm[2]); p = { level: lv.id, h, m, ask: m && q.get("ask") !== "hour" ? "minutes" : "hour", ans: m && q.get("ask") !== "hour" ? m : h }; }
  if (!S && p.draw && q.get("shape")) p.shape = q.get("shape");
  // ?frac=5/8 puts the number line's dot there first.
  const fr = !S && view.type === "numberline" && p.kind === "where" && /^(\d+)\/(\d+)$/.exec(q.get("frac") || "");
  if (fr) { p.n = Number(fr[1]); p.d = Number(fr[2]); p.ans = p.n; }
  S = { p, typed: Array.from({ length: [].concat(p.ans).length }, () => ""), at: 0, done: null, hint: null, note: "" };
  strokes = []; drawing = null; overlay = null;
  draw();
  if (speak) say(t.spoken(p));
}
function press(k) {
  if (S.done) { if (k === "go") next(true); return; }
  if (S.p.draw) {
    if (k === "clear") { strokes = []; S.note = ""; draw(); }
    else if (k === "go" && strokes.length) cast();
    return;
  }
  const cur = S.typed[S.at];
  if (/^[0-9]$/.test(k)) { if (cur.length < 4) S.typed[S.at] = (cur === "0" ? "" : cur) + k; }
  else if (k === "del") { if (cur) S.typed[S.at] = cur.slice(0, -1); else if (S.at) S.at--; }
  else if (k === "go") {
    if (!cur) return;
    // More than one slot (dollars, then cents): Hit! moves on to the next one first.
    if (S.at < S.typed.length - 1) { S.at++; draw(); return; }
    const ans = [].concat(S.p.ans);
    if (ans.every((a, i) => Number(S.typed[i]) === a)) { S.done = "right"; S.hint = null; }
    else { S.done = "wrong"; S.hint = "worked"; say("Oops! " + T().missed(S.p)); }
  }
  draw();
}

/* ---------- wiring ---------- */
$("pad").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) press(b.dataset.k); });
document.addEventListener("keydown", (e) => {
  if (e.target.closest && e.target.closest("select")) return;
  if (/^[0-9]$/.test(e.key)) press(e.key);
  else if (e.key === "Backspace") press("del");
  else if (e.key === "Enter") { e.preventDefault(); press("go"); }
  else if (e.key === "?") toggleHint();
});
function toggleHint() {
  if (S.done) return;
  S.hint = S.hint ? null : "hint";
  draw();
}
$("hintBtn").addEventListener("click", toggleHint);
$("sayBtn").addEventListener("click", () => say(T().spoken(S.p)));
$("types").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b || b.dataset.type === view.type) return;
  view.type = b.dataset.type; keep(); drawChrome(); next(spoke);
});
$("level").addEventListener("change", () => { view[view.type] = $("level").value; keep(); drawChrome(); next(spoke); });
$("handStyle").addEventListener("click", () => { view.hands = view.hands === "tentacle" ? "arrow" : "tentacle"; keep(); drawChrome(); draw(); });
$("moneyStyle").addEventListener("click", () => { view.money = view.money === "dot" ? "and" : "dot"; keep(); drawChrome(); draw(); });
$("numStyle").addEventListener("click", () => { view.numbers = view.numbers === "hand" ? "bungee" : "hand"; keep(); drawChrome(); draw(); });
// After the first tap anywhere, new problems are read aloud as they appear, as the game reads coin
// and comparing problems for a pre-reader.
document.addEventListener("pointerdown", () => { spoke = true; }, { once: true, capture: true });
// For checking the reader from a test: the last read.
window.protoState = () => S;

drawChrome();
next(false);
