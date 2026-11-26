// The prototype page (review/proto/): two new kinds of problem to try on a phone before they're
// in the game. Telling time (Tick-Tockus, js/clock.js) and what comes next (Slimelipsis,
// js/patterns.js), laid out like the game's problem area: the monster small in its box, the clock
// or the slimes, the problem, the number pad and Hit!, a 💡 hint, and Next. Nothing is saved or
// learned; the only thing kept (in localStorage, "sumgeon:proto") is which kind, level and clock
// numbers were picked. The voice is the device's (speechSynthesis), since these lines aren't
// recorded yet.
import { NEW_MON, svg } from "../../js/monsters.js";
import { CLOCK_LEVELS, clockLevel, clockProblem, clockLine, clockQuestion, spokenClock, spokenTime, clockSvg, clockHint, digital } from "../../js/clock.js";
import { PATTERN_LEVELS, patternLevel, patternProblem, spokenPattern, spokenPatternAnswer, patternSvg, patternHint } from "../../js/patterns.js";

const $ = (id) => document.getElementById(id);
const STORE = "sumgeon:proto";
const MON = { clock: NEW_MON.find((m) => m.n === "Tick-Tockus"), pattern: NEW_MON.find((m) => m.n === "Slimelipsis") };
// The clock's numbers default to school-style handwriting (an open 4, a 1 that's one line), as on
// a classroom clock; "bungee" is the game's font.
const view = { type: "clock", clock: "hours", pattern: "ones", numbers: "hand" };
try { Object.assign(view, JSON.parse(localStorage.getItem(STORE)) || {}); } catch (e) { /* defaults */ }
const keep = () => { try { localStorage.setItem(STORE, JSON.stringify(view)); } catch (e) { /* this visit only */ } };
// ?type=pattern&level=twos&numbers=hand opens straight to one (for screenshots and links).
const q = new URLSearchParams(location.search);
if (q.get("type")) view.type = q.get("type") === "pattern" ? "pattern" : "clock";
if (q.get("level")) view[view.type] = q.get("level");
if (q.get("numbers")) view.numbers = q.get("numbers") === "hand" ? "hand" : "bungee";
// ?seed=<n> makes the problems the same each time (for screenshots).
let seed = Number(q.get("seed")) || 0;
const rnd = seed ? () => ((seed = (seed * 9301 + 49297) % 233280) / 233280) : Math.random;

// The problem now: { p, typed, done: null | "right" | "wrong", hint: null | "hint" | "worked" }.
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
const spokenNow = () => (view.type === "clock" ? spokenClock(S.p) : spokenPattern(S.p));

/* ---------- drawing ---------- */
const level = () => (view.type === "clock" ? clockLevel(view.clock) : patternLevel(view.pattern));
function drawChrome() {
  const m = MON[view.type], lv = level();
  document.body.dataset.stratum = lv.stratum;
  $("box").style.setProperty("--wall", `var(--wall-${lv.stratum})`);
  $("mon").innerHTML = svg(m);
  $("mName").textContent = m.n;
  for (const b of $("types").querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.type === view.type));
  const levels = view.type === "clock" ? CLOCK_LEVELS : PATTERN_LEVELS;
  $("level").innerHTML = levels.map((l) => `<option value="${l.id}"${l.id === lv.id ? " selected" : ""}>${l.name} · ${l.grade}</option>`).join("");
  $("tools").hidden = view.type !== "clock";
  $("numStyle").textContent = view.numbers === "hand" ? "Handwriting" : "Bungee";
}

// The answer slot: a glowing "?" that fills as you type, gold when right, coral when wrong.
function slot() {
  const cls = S.done ? S.done : S.typed ? "typed" : "";
  const text = S.done ? (view.type === "clock" && S.p.ask === "minutes" ? String(S.p.ans).padStart(2, "0") : S.p.ans) : S.typed || "?";
  return `<span class="blank ${cls}">${text}</span>`;
}
function draw() {
  const p = S.p, worked = S.hint === "worked", hint = S.hint ? (view.type === "clock" ? clockHint(p, worked) : patternHint(p, worked)) : null;
  if (view.type === "clock") {
    $("pic").innerHTML = clockSvg(p.h, p.m, { numbers: view.numbers, hint: hint && hint.layer });
    // The problem line: "□ o'clock", "half past □", "3:□" (after a miss, "3:05").
    $("prob").className = "prob";
    $("prob").innerHTML = clockLine(p).map((part) => (part === null ? slot() : esc(part))).join("");
    $("prob").setAttribute("aria-label", clockQuestion(p));
  } else {
    $("pic").innerHTML = patternSvg(p, { typed: S.typed, state: S.done, hops: hint && hint.hops });
    $("prob").className = "prob words";
    $("prob").textContent = p.blank === p.nums.length - 1 ? "What comes next?" : "What's missing?";
    $("prob").removeAttribute("aria-label");
  }
  // The line under the box: ✓ Right!, or Oops with the answer and the worked hint, or the hint.
  // An equation in the words doesn't break across lines ("50 + 2 = ?").
  const words = hint ? esc(hint.say.replace(/ ([=+−]) /g, " $1 ")) : "";
  const head = S.done === "right" ? `<b><span class="tick">✓</span>Right!</b>` : S.done === "wrong" ? `<b>Oops! It's ${view.type === "clock" ? digital(p.h, p.m) : p.ans}.</b>` : "";
  $("hint").hidden = !hint && !head;
  $("hint").className = "pp-hint" + (worked ? " worked" : S.done === "right" ? " good" : "");
  $("hint").innerHTML = head + words;
  $("said").textContent = spokenNow();
  const go = $("pad").querySelector('[data-k="go"]');
  go.textContent = S.done ? "Next ›" : "Hit!";
  go.classList.toggle("next", !!S.done);
  go.setAttribute("aria-label", S.done ? "Next problem" : "Attack");
}
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* ---------- play ---------- */
let spoke = false; // the voice waits for the first tap (iOS only speaks inside one)
function next(speak) {
  const lv = level();
  let p;
  // Not the same problem twice in a row.
  for (let i = 0; i < 8; i++) {
    p = view.type === "clock" ? clockProblem(lv.id, rnd) : patternProblem(lv.id, rnd);
    if (!S || JSON.stringify(p) !== JSON.stringify(S.p)) break;
  }
  // ?time=3:37 shows that time first (asking the minutes, or the hour on the hour).
  const t = !S && view.type === "clock" && /^(\d{1,2}):(\d\d)$/.exec(q.get("time") || "");
  if (t) { const h = Number(t[1]), m = Number(t[2]); p = { level: lv.id, h, m, ask: m && q.get("ask") !== "hour" ? "minutes" : "hour", ans: m && q.get("ask") !== "hour" ? m : h }; }
  S = { p, typed: "", done: null, hint: null };
  draw();
  if (speak) say(spokenNow());
}
function press(k) {
  if (S.done) { if (k === "go") { next(true); } return; }
  if (/^[0-9]$/.test(k)) { if (S.typed.length < 4) S.typed = (S.typed === "0" ? "" : S.typed) + k; }
  else if (k === "del") S.typed = S.typed.slice(0, -1);
  else if (k === "go") {
    if (!S.typed) return;
    if (Number(S.typed) === S.p.ans) {
      S.done = "right"; S.hint = null;
    } else {
      S.done = "wrong"; S.hint = "worked";
      say("Oops! " + (view.type === "clock" ? spokenTime(S.p.h, S.p.m) : spokenPatternAnswer(S.p)));
    }
  }
  draw();
}

/* ---------- wiring ---------- */
$("pad").innerHTML = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0", "go"].map((k) =>
  `<button type="button" data-k="${k}" class="${k === "go" ? "go" : k === "del" ? "del" : ""}" aria-label="${k === "del" ? "Delete" : k === "go" ? "Attack" : k}">${k === "del" ? "⌫" : k === "go" ? "Hit!" : k}</button>`).join("");
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
$("sayBtn").addEventListener("click", () => say(spokenNow()));
$("types").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b || b.dataset.type === view.type) return;
  view.type = b.dataset.type; keep(); drawChrome(); next(spoke);
});
$("level").addEventListener("change", () => { view[view.type] = $("level").value; keep(); drawChrome(); next(spoke); });
$("numStyle").addEventListener("click", () => { view.numbers = view.numbers === "hand" ? "bungee" : "hand"; keep(); drawChrome(); draw(); });
// After the first tap anywhere, new problems are read aloud as they appear, as the game reads coin
// and comparing problems for a pre-reader.
document.addEventListener("pointerdown", () => { spoke = true; }, { once: true, capture: true });

drawChrome();
next(false);
