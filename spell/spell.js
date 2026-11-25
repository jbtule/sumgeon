// The spell check: draw a digit and see what the game's spell reader (js/sigil.js) makes of it,
// with or without a player's learned handwriting, plus each player's backwards counts. A tool
// for grown-ups trying it with a kid before anything gets tuned.
import { read, CLEAR } from "../js/sigil.js";
import { openStore, displayName } from "../js/store.js";

const $ = (id) => document.getElementById(id);
let ls = null;
try { ls = window.localStorage; } catch (e) { /* no storage: built-in templates only */ }
const store = ls ? openStore(ls) : null;
const players = store ? store.profiles() : [];
const spellsOf = (id) => (store ? store.player(id).get("spells", {}) : {}) || {};

// Players to read with: none (built-in templates only), or each player's learned handwriting.
$("player").innerHTML = `<option value="">Built-in only</option>` + players.map((p) => `<option value="${p.id}">${esc(displayName(players, p.id))}'s too</option>`).join("");
if (store) $("player").value = store.active();
function personal() {
  const id = $("player").value;
  if (!id) return [];
  return Object.entries(spellsOf(id).templates || {}).flatMap(([d, list]) => list.map((points) => ({ digit: Number(d), points })));
}

/* ---------- drawing ---------- */
const c = $("pad");
let strokes = [], drawing = null;
const point = (e) => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
c.onpointerdown = (e) => { e.preventDefault(); c.setPointerCapture(e.pointerId); drawing = [point(e)]; strokes.push(drawing); paint(); };
c.onpointermove = (e) => { if (drawing) { drawing.push(point(e)); paint(); } };
c.onpointerup = c.onpointercancel = () => { if (drawing) { drawing = null; show(); } };
$("clear").onclick = () => { strokes = []; paint(); $("result").innerHTML = `<div class="verdict">Draw a digit</div>`; };
$("player").onchange = () => { if (strokes.length) show(); };
function paint() {
  const r = c.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
  const g = c.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.lineCap = g.lineJoin = "round"; g.lineWidth = 8; g.strokeStyle = "#fff1b8"; g.shadowColor = "#ffc93c"; g.shadowBlur = 16;
  for (const s of strokes) { g.beginPath(); s.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); if (s.length === 1) g.lineTo(s[0][0] + 0.5, s[0][1]); g.stroke(); }
}

// The read, after each stroke.
function show() {
  const r = read(strokes, personal());
  if (!r) return;
  const pct = (x) => Math.round(x * 100) + "%";
  $("result").innerHTML = `
    <div class="big${r.reversed ? " rev" : ""}">${r.digit}</div>
    <div class="verdict ${r.clear ? "ok" : "bad"}">${r.clear ? (r.reversed ? `A ${r.digit}, backwards` : `A ${r.digit}`) : "Not clear: the spell would fail"}</div>
    <div class="row">Fit <b>${pct(r.fit)}</b></div><div class="row">Ahead of the next digit by <b>${pct(r.margin)}</b></div>
    <div class="row">Matched <b>${esc(r.name)}</b></div>
    <div class="alts">Next best: ${r.others.map((o) => `${o.digit} (${pct(o.fit)})`).join(", ")}</div>
    <div class="alts">Clear means fit ≥ ${pct(CLEAR.fit)} and ahead by ≥ ${pct(CLEAR.margin)}.</div>`;
}

/* ---------- backwards counts ---------- */
const REV = [1, 2, 3, 4, 5, 6, 7, 9];
$("reversals").innerHTML = players.length ? `<table><tr><th>Player</th>${REV.map((d) => `<th>${d}</th>`).join("")}<th>Right spells</th></tr>
  ${players.map((p) => { const s = spellsOf(p.id), rv = s.reversed || {};
    return `<tr><td>${esc(displayName(players, p.id))}</td>${REV.map((d) => `<td>${rv[d] || 0}</td>`).join("")}<td>${s.cast || 0}</td></tr>`; }).join("")}</table>`
  : `<p class="sub">No players on this device yet.</p>`;
function esc(t) { return String(t).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]); }
paint();
