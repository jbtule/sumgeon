// The Hero Moments review page: pick a hero, a quip and a monster (in any stratum's colors and
// wall) and play the moment exactly as the game does (js/slowmo.js, the same sounds and the same
// recorded quip through js/speech.js). Replay, Play all, Step through the frames, ½× or 1×, and
// reduced motion. Flags like the listen check's: a moment that plays to the end unflagged counts
// as fine, ⚑ flags it with tags and a note, and Report copies the flags or opens a GitHub issue.
// And a rarity simulator: runs of answers through the real trigger rule (js/moments.js).
//
// Marks live in localStorage ("sumgeon:moments"), keyed by hero and quip: { s: "ok" | "bad",
// tags, note, t }.
import { HEROES } from "../js/heroes.js";
import { MON, svg } from "../js/monsters.js";
import { QUIPS, FINALS, CRIT, simulate } from "../js/moments.js";
import { playMoment, PHASES } from "../js/slowmo.js";
import { quipLine } from "../js/lines.js";
import { say, stopSpeech } from "../js/speech.js";
import * as sfx from "../js/sfx.js";

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const STORE = "sumgeon:moments";
const TAGS = ["Wording", "Voice", "Timing", "Art"];

let marks = {};
try { marks = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { marks = {}; }
function save() { try { localStorage.setItem(STORE, JSON.stringify(marks)); } catch (e) { /* this visit only */ } reportUI(); }
const keyOf = (m) => m.hero + "|" + m.quip;

// Every moment Play all runs through: each hero's quips. (The two big ones are in each hero's Quip list.)
const ALL = HEROES.flatMap((h) => QUIPS[h.d].map((q) => ({ hero: h.d, quip: q })));

/* ---------- picking ---------- */
const opts = { speed: 1, reduced: false, step: false };
$("hero").innerHTML = HEROES.map((h) => `<option value="${h.d}">${h.d} · ${esc(h.n)}</option>`).join("");
$("monster").innerHTML = MON.map((m, i) => `<option value="${i}">${esc(m.n)}${m.boss ? " (boss)" : ""}</option>`).join("");
function quipOptions() {
  const d = +$("hero").value;
  $("quip").innerHTML = QUIPS[d].concat(FINALS, [CRIT]).map((q) => `<option>${esc(q)}</option>`).join("");
}
function scene() {
  const m = MON[+$("monster").value], s = $("stratum").value, d = +$("hero").value;
  document.body.dataset.stratum = s === "plain" ? "" : s;
  $("stage").style.setProperty("--wall", `var(--wall-${s})`);
  $("mName").textContent = m.n;
  $("mon").innerHTML = svg(m);
  // A problem whose answer has the hero's digit.
  const ans = d === 0 ? 10 : d + 10, x = Math.max(1, ans - 7);
  $("prob").textContent = `${x} + ${ans - x} =`;
  $("ans").textContent = String(ans);
  $("what").textContent = `${HEROES[d].n}: "${$("quip").value}"`;
}
$("hero").onchange = () => { quipOptions(); scene(); };
["quip", "monster", "stratum"].forEach((id) => ($(id).onchange = scene));
document.querySelectorAll("[data-speed]").forEach((b) => (b.onclick = () => { opts.speed = +b.dataset.speed; pressed("[data-speed]", b); }));
document.querySelectorAll("[data-reduced]").forEach((b) => (b.onclick = () => { opts.reduced = b.dataset.reduced === "1"; pressed("[data-reduced]", b); }));
document.querySelectorAll("[data-step]").forEach((b) => (b.onclick = () => { opts.step = b.dataset.step === "1"; pressed("[data-step]", b); }));
function pressed(sel, on) { document.querySelectorAll(sel).forEach((b) => b.setAttribute("aria-pressed", String(b === on))); }

/* ---------- playing ---------- */
let playing = false, allQueue = null, nextGate = null, current = null;
// Plays the picked moment. Resolves true when it ran to the end.
async function play() {
  if (playing) return false;
  playing = true; $("play").disabled = true; $("phase").textContent = "";
  const d = +$("hero").value, quip = $("quip").value, m = { hero: d, quip };
  current = m;
  const gate = opts.step ? (p) => new Promise((go) => { $("phase").textContent = `Next: ${p}`; $("next").hidden = false; nextGate = () => { $("next").hidden = true; nextGate = null; go(); }; }) : null;
  try {
    await playMoment({
      hero: d, color: null, quip, speed: opts.speed, reduced: opts.reduced, gate,
      speak: () => say("h", quipLine(quip), true),
      from: $("ans"), to: $("mon"), room: $("stage"),
      onPhase: (p) => { $("phase").textContent = `${PHASES.indexOf(p) + 1}. ${p}`; }
    });
    // The hit, as the game shows it: the damage number and the monster's flinch.
    const n = +$("ans").textContent, pop = document.createElement("span");
    pop.className = "dmg"; pop.textContent = "−" + n;
    $("stage").appendChild(pop); setTimeout(() => pop.remove(), 950);
    $("mon").classList.remove("hit"); void $("mon").offsetWidth; $("mon").classList.add("hit");
    await new Promise((r) => setTimeout(r, 700 / opts.speed));
  } finally {
    playing = false; $("play").disabled = false; $("next").hidden = true;
  }
  if (current === m && !marks[keyOf(m)]) { marks[keyOf(m)] = { s: "ok", t: Date.now() }; save(); }
  remember(m);
  return true;
}
// iPhone only lets a page start audio inside a tap. On this page the Replay tap is often the
// first one, and the moment's first sound comes a beat later, outside it, so the effects stayed
// silent (the quip, an audio element, still played). A tick inside the tap wakes the effects.
const wake = () => sfx.tick();
$("play").onclick = () => { wake(); play(); };
$("next").onclick = () => { wake(); if (nextGate) nextGate(); };
// The sound effects' state, for checking on a device: the audio context, effects played, errors.
setInterval(() => { const a = sfx.status(); $("sound").textContent = `Sound effects: ${a.state || "not started"} · ${a.played} played${a.error ? " · " + a.error : ""}`; }, 500);

// Play all: every hero's quips, one after another, with a short gap.
$("playAll").onclick = async () => {
  wake();
  if (playing || allQueue) return;
  allQueue = ALL.slice();
  $("playAll").hidden = true; $("stopAll").hidden = false;
  while (allQueue && allQueue.length) {
    const m = allQueue.shift();
    $("hero").value = String(m.hero); quipOptions(); $("quip").value = m.quip; scene();
    await play();
    if (!allQueue) break;
    await new Promise((r) => setTimeout(r, 600));
    if (flagging) await new Promise((r) => (afterFlag = r));
  }
  stopAll();
};
function stopAll() { allQueue = null; $("playAll").hidden = false; $("stopAll").hidden = true; }
$("stopAll").onclick = () => { stopAll(); stopSpeech(); };

/* ---------- the moments played ---------- */
let recent = [];
function remember(m) { recent = [m].concat(recent.filter((x) => keyOf(x) !== keyOf(m))).slice(0, 10); recentUI(); }
function recentUI() {
  $("recent").innerHTML = recent.map((m, i) => {
    const k = marks[keyOf(m)] || {}, cls = k.s === "bad" ? "bad" : k.s === "ok" ? "ok" : "";
    return `<li class="${cls}"><span class="mark">${k.s === "bad" ? "✗" : k.s === "ok" ? "✓" : "·"}</span>
      <span>${esc(HEROES[m.hero].n)}: "${esc(m.quip)}"${k.s === "bad" && (k.tags || k.note) ? `<span class="note">${esc([...(k.tags || []), k.note].filter(Boolean).join(" · "))}</span>` : ""}</span>
      <span><button type="button" data-i="${i}" data-act="${k.s === "bad" ? "ok" : "flag"}" aria-label="${k.s === "bad" ? "Mark fine" : "Flag"}">${k.s === "bad" ? "✓" : "⚑"}</button></span></li>`;
  }).join("");
}
$("recent").onclick = (e) => {
  const b = e.target.closest("button"); if (!b) return;
  const m = recent[+b.dataset.i];
  if (b.dataset.act === "flag") flag(m);
  else { marks[keyOf(m)] = { s: "ok", t: Date.now() }; save(); recentUI(); }
};

/* ---------- flagging ---------- */
let flagging = false, flagFor = null, afterFlag = null;
function flag(m) {
  flagging = true; flagFor = m || current || { hero: +$("hero").value, quip: $("quip").value };
  const k = marks[keyOf(flagFor)] || {};
  $("flagWhat").textContent = `What's wrong with ${HEROES[flagFor.hero].n}'s "${flagFor.quip}"?`;
  $("tags").innerHTML = TAGS.map((t) => `<button type="button" aria-pressed="${(k.tags || []).includes(t)}">${t}</button>`).join("");
  $("tags").querySelectorAll("button").forEach((b) => (b.onclick = () => b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"))));
  $("note").value = k.s === "bad" ? k.note || "" : "";
  $("flagform").hidden = false; $("note").focus();
}
function closeFlag(saveIt) {
  if (saveIt && flagFor) {
    const tags = [...$("tags").querySelectorAll('button[aria-pressed="true"]')].map((b) => b.textContent);
    marks[keyOf(flagFor)] = { s: "bad", tags, note: $("note").value.trim(), t: Date.now() };
    save(); remember(flagFor);
  }
  $("flagform").hidden = true; flagging = false; flagFor = null;
  if (afterFlag) { const go = afterFlag; afterFlag = null; go(); }
}
$("flag").onclick = () => flag();
$("saveFlag").onclick = () => closeFlag(true);
$("cancelFlag").onclick = () => closeFlag(false);

/* ---------- reporting ---------- */
function report() {
  const bad = Object.entries(marks).filter(([, m]) => m.s === "bad");
  return bad.map(([k, m]) => {
    const [d, quip] = [k.slice(0, k.indexOf("|")), k.slice(k.indexOf("|") + 1)];
    return `- ${HEROES[+d] ? HEROES[+d].n : d}: "${quip}"${m.tags && m.tags.length ? " — " + m.tags.join(", ") : ""}${m.note ? ": " + m.note : ""}`;
  }).join("\n");
}
function reportUI() {
  const n = Object.values(marks).filter((m) => m.s === "bad").length;
  $("copyBtn").textContent = n ? `Copy ${n} issue${n > 1 ? "s" : ""}` : "No issues yet";
  $("copyBtn").disabled = $("issueBtn").disabled = !n;
}
$("copyBtn").onclick = () => {
  const r = report();
  if (!r) { $("status").textContent = "No issues flagged."; return; }
  const manual = () => { const t = $("reportText"); t.value = r; t.hidden = false; t.focus(); t.select(); $("status").textContent = "Select it and copy:"; };
  if (!navigator.clipboard) return manual();
  navigator.clipboard.writeText(r).then(() => { $("status").textContent = "Copied."; $("reportText").hidden = true; }, manual);
};
$("issueBtn").onclick = () => {
  const r = report();
  if (!r) { $("status").textContent = "No issues flagged."; return; }
  const body = "Hero Moments flagged on the review page:\n\n" + r;
  window.open("https://github.com/jbtule/sumgeon/issues/new?title=" + encodeURIComponent("Hero Moments: to fix") + "&body=" + encodeURIComponent(body.slice(0, 6000)), "_blank", "noopener");
};

/* ---------- rarity ---------- */
$("simCaptain").innerHTML = HEROES.map((h) => `<option value="${h.d}"${h.d === 5 ? " selected" : ""}>${h.d} · ${esc(h.n)}</option>`).join("");
$("simTeam").innerHTML = HEROES.map((h) => `<label><input type="checkbox" value="${h.d}"${h.d === 0 || h.d === 1 ? " checked" : ""}> ${h.d}</label>`).join("");
function bars(rows, total) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return `<div class="bars">${rows.map(([label, n]) => `<div class="row"><span title="${esc(label)}">${esc(label)}</span><i style="width:${(n / max * 100).toFixed(1)}%"></i><span>${total ? Math.round(n / total * 100) + "%" : n}</span></div>`).join("")}</div>`;
}
$("simRun").onclick = () => {
  const captain = +$("simCaptain").value;
  const rescued = [captain].concat([...$("simTeam").querySelectorAll("input:checked")].map((i) => +i.value).filter((d) => d !== captain));
  const s = simulate({ runs: Math.max(10, Math.min(5000, +$("simRuns").value || 300)), wing: $("simWing").value, team: { captain, rescued }, accuracy: Math.max(0.1, Math.min(1, (+$("simAcc").value || 90) / 100)), seed: Date.now() % 100000 });
  const dist = {};
  s.perRun.forEach((n) => (dist[n] = (dist[n] || 0) + 1));
  const quips = Object.entries(s.quips).sort((a, b) => b[1] - a[1]);
  $("simOut").innerHTML = `<div class="stats">
      <div><b>${s.floorsPerMoment.toFixed(2)}</b><small>floors per moment</small></div>
      <div><b>${s.perFloor.toFixed(2)}</b><small>moments per floor</small></div>
      <div><b>${s.meanPerRun.toFixed(2)}</b><small>moments per run</small></div>
      <div><b>${(s.problems / s.floors).toFixed(1)}</b><small>problems per floor</small></div>
    </div>
    <p class="sub">Why: ${s.why.boss} boss finishes, ${s.why.chance} by chance (one every ${s.chanceFloorsPer.toFixed(1)} floors), over ${s.runs} runs and ${s.floors} floors.</p>
    <h2>Moments per run</h2>${bars(Object.keys(dist).map(Number).sort((a, b) => a - b).map((n) => [`${n} moment${n === 1 ? "" : "s"}`, dist[n]]), s.runs)}
    <h2>Heroes</h2>${bars(HEROES.filter((h) => s.heroes[h.d]).map((h) => [h.n, s.heroes[h.d]]), s.moments)}
    <h2>Quips</h2>${bars(quips, s.moments)}`;
};

quipOptions(); scene(); reportUI();
