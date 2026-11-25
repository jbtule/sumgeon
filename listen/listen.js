// The listen check: plays the recorded voice a group at a time (lines.js GROUPS), one line after
// another, so a grown-up can listen straight through and flag only what's wrong. A line that
// plays to the end without a flag counts as OK. Patterned on sound-box-crosswords' listen/, with
// continuous play instead of marking each clip.
//
// Marks live in localStorage ("sumgeon:listen"), keyed by the clip's key: { s: "ok" | "bad",
// tags, note, t }. A re-recorded line has a new key, so it shows up as unheard again.
import { spokenLines, GROUPS } from "../js/lines.js";

const $ = (id) => document.getElementById(id);
const STORE = "sumgeon:listen";
const TAGS = ["Wrong word", "Wrong stress", "Mispronounced", "Cut off", "Glitch or noise", "Too fast or slow"];
const GAP_MS = 500;

let marks = {};
try { marks = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { marks = {}; }
function save() { try { localStorage.setItem(STORE, JSON.stringify(marks)); } catch (e) { /* this visit only */ } }

// The lines, each with its clip from audio.json: the site's own, or when run locally (where any
// audio.json is a leftover from a local build) the live one.
const LINES = spokenLines();
let base = "", clips = {};
async function loadAudio() {
  const live = "https://tools.tuley.name/sumgeon/audio.json", local = /^(localhost|127\.|\[::1\])/.test(location.hostname);
  for (const url of local ? [live, "../audio.json"] : ["../audio.json", live]) {
    try { const r = await fetch(url, { cache: "no-store" }); if (r.ok) { const m = await r.json(); base = m.base; clips = m.clips; return; } } catch (e) { /* try the next */ }
  }
}
const keyOf = (l) => clips[l.kind + ":" + l.text];
const markOf = (l) => marks[keyOf(l)];
const KIND = { p: "Phrase", m: "Name", q: "Problem" };

/* ---------- the groups ---------- */
function counts(group) {
  const ls = LINES.filter((l) => l.group === group && keyOf(l));
  const ok = ls.filter((l) => (markOf(l) || {}).s === "ok").length, bad = ls.filter((l) => (markOf(l) || {}).s === "bad").length;
  return { all: ls.length, ok, bad, new: ls.length - ok - bad, missing: LINES.filter((l) => l.group === group && !keyOf(l)).length };
}
function home() {
  $("player").hidden = true; $("home").hidden = false; stop();
  $("groups").innerHTML = GROUPS.map((g) => {
    const c = counts(g);
    return `<button class="group" type="button" data-g="${g}"><b>${g}</b><span class="pills">
      ${c.new ? `<span class="pill new">${c.new} unheard</span>` : ""}${c.bad ? `<span class="pill bad">${c.bad} ✗</span>` : ""}<span class="pill ok">${c.ok} ✓</span>
      ${c.missing ? `<span class="pill">${c.missing} not recorded yet</span>` : ""}</span></button>`;
  }).join("");
  $("groups").querySelectorAll(".group").forEach((b) => (b.onclick = () => open(b.dataset.g)));
}

/* ---------- playing a group ---------- */
let group = null, mode = "new", list = [], at = 0, playing = false, flagging = false, recent = [];
const audio = new Audio();
let gapTimer = null, inGap = false;

function pick() {
  const ls = LINES.filter((l) => l.group === group && keyOf(l));
  if (mode === "new") return ls.filter((l) => !markOf(l));
  if (mode === "bad") return ls.filter((l) => (markOf(l) || {}).s === "bad");
  return ls;
}
function open(g) {
  group = g; $("home").hidden = true; $("player").hidden = false;
  setMode(counts(g).new ? "new" : "all");
}
function setMode(m) {
  mode = m; stop();
  document.querySelectorAll(".mode button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === m)));
  list = pick(); at = 0; show();
}
function show() {
  const l = list[at];
  $("count").textContent = list.length ? `${group} · ${at + 1} of ${list.length}` : group;
  $("text").textContent = l ? l.text : mode === "new" ? "All heard! Nothing unheard in this group." : "Nothing here.";
  $("kind").textContent = l ? KIND[l.kind] + (markOf(l) ? (markOf(l).s === "ok" ? " · ✓ OK" : " · ✗ flagged") : "") : "";
  $("play").textContent = playing ? "Pause" : "Play";
  ["prev", "again", "flag"].forEach((id) => ($(id).disabled = !l));
  $("play").disabled = !l;
}
function stop() { playing = false; inGap = false; clearTimeout(gapTimer); audio.pause(); audio.onended = null; }

// Plays the current line; when it ends without a flag it's OK, and the next one follows.
function playCurrent() {
  const l = list[at];
  if (!l) { playing = false; show(); return; }
  clearTimeout(gapTimer); inGap = false;
  audio.onended = () => {
    if (!marks[keyOf(l)]) { marks[keyOf(l)] = { s: "ok", t: Date.now() }; save(); }
    remember(l);
    if (!playing) return;
    if (at < list.length - 1) { at++; show(); inGap = true; gapTimer = setTimeout(playCurrent, GAP_MS); }
    else { playing = false; show(); }
  };
  audio.src = base + keyOf(l) + ".mp3";
  audio.play().catch(() => { playing = false; show(); });
  show();
}
function remember(l) { recent = [l].concat(recent.filter((x) => x !== l)).slice(0, 8); recentUI(); }
function recentUI() {
  $("recent").innerHTML = recent.map((l, i) => {
    const m = markOf(l) || {}, cls = m.s === "bad" ? "bad" : m.s === "ok" ? "ok" : "";
    return `<li class="${cls}"><span class="mark">${m.s === "bad" ? "✗" : m.s === "ok" ? "✓" : "·"}</span>
      <span>${esc(l.text)}${m.s === "bad" && (m.tags || m.note) ? `<span class="note">${esc([...(m.tags || []), m.note].filter(Boolean).join(" · "))}</span>` : ""}</span>
      <div><button type="button" data-i="${i}" data-act="play" aria-label="Play">▶</button><button type="button" data-i="${i}" data-act="${m.s === "bad" ? "ok" : "flag"}" aria-label="${m.s === "bad" ? "Mark OK" : "Flag"}">${m.s === "bad" ? "✓" : "⚑"}</button></div></li>`;
  }).join("");
}
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* ---------- flagging ---------- */
let flagLine = null;
function flag(l) {
  stop(); flagging = true; flagLine = l;
  const m = markOf(l) || {};
  $("flagWhat").textContent = `What's wrong with "${l.text}"?`;
  $("tags").innerHTML = TAGS.map((t) => `<button type="button" aria-pressed="${(m.tags || []).includes(t)}">${t}</button>`).join("");
  $("tags").querySelectorAll("button").forEach((b) => (b.onclick = () => b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"))));
  $("note").value = m.s === "bad" ? m.note || "" : "";
  $("flagform").hidden = false; show(); $("note").focus();
}
function closeFlag(saveIt) {
  if (saveIt && flagLine) {
    const tags = [...$("tags").querySelectorAll('button[aria-pressed="true"]')].map((b) => b.textContent);
    marks[keyOf(flagLine)] = { s: "bad", tags, note: $("note").value.trim(), t: Date.now() };
    save(); remember(flagLine);
  }
  $("flagform").hidden = true; flagging = false;
  // Carry on with the next line, as if the flagged one had just ended.
  if (saveIt && list[at] === flagLine && at < list.length - 1) at++;
  else if (saveIt && list[at] === flagLine) { show(); return; }
  if (saveIt) { playing = true; playCurrent(); } else show();
}

/* ---------- reporting ---------- */
function report() {
  const bad = LINES.filter((l) => (markOf(l) || {}).s === "bad");
  if (!bad.length) return "";
  return bad.map((l) => { const m = markOf(l); return `- [${l.group}] "${l.text}" (${l.kind}:${keyOf(l)})${m.tags && m.tags.length ? " — " + m.tags.join(", ") : ""}${m.note ? ": " + m.note : ""}`; }).join("\n");
}

/* ---------- wiring ---------- */
$("backHome").onclick = home;
document.querySelectorAll(".mode button").forEach((b) => (b.onclick = () => setMode(b.dataset.mode)));
$("play").onclick = () => { if (playing) { stop(); show(); } else { playing = true; playCurrent(); } };
$("again").onclick = () => { playing = false; clearTimeout(gapTimer); audio.onended = () => remember(list[at]); audio.src = base + keyOf(list[at]) + ".mp3"; audio.play(); show(); };
$("prev").onclick = () => { if (at > 0) at--; const was = playing; stop(); if (was) { playing = true; playCurrent(); } else show(); };
// The line to flag: the one playing, or (in the gap after it) the one that just ended.
// In the short gap after a line, that's the line you just heard.
$("flag").onclick = () => flag(inGap && recent.length ? recent[0] : list[at]);
$("saveFlag").onclick = () => closeFlag(true);
$("cancelFlag").onclick = () => closeFlag(false);
$("recent").onclick = (e) => {
  const b = e.target.closest("button"); if (!b) return;
  const l = recent[+b.dataset.i];
  if (b.dataset.act === "play") { stop(); audio.onended = null; audio.src = base + keyOf(l) + ".mp3"; audio.play(); show(); }
  else if (b.dataset.act === "flag") flag(l);
  else { marks[keyOf(l)] = { s: "ok", t: Date.now() }; save(); recentUI(); show(); }
};
$("copyBtn").onclick = () => {
  const r = report();
  if (!r) { $("status").textContent = "No issues flagged."; return; }
  navigator.clipboard.writeText(r).then(() => ($("status").textContent = "Copied."), () => ($("status").textContent = "Couldn't copy."));
};
$("issueBtn").onclick = () => {
  const r = report();
  if (!r) { $("status").textContent = "No issues flagged."; return; }
  const body = "Lines flagged in the listen check:\n\n" + r;
  window.open("https://github.com/jbtule/sumgeon/issues/new?title=" + encodeURIComponent("Voice: lines to fix") + "&body=" + encodeURIComponent(body.slice(0, 6000)), "_blank", "noopener");
};
// Keys: space plays or pauses, F flags, R replays, ← goes back.
document.addEventListener("keydown", (e) => {
  if ($("player").hidden || flagging || e.target.matches("textarea")) return;
  if (e.key === " ") { e.preventDefault(); $("play").click(); }
  else if (e.key === "f" || e.key === "F") $("flag").click();
  else if (e.key === "r" || e.key === "R") $("again").click();
  else if (e.key === "ArrowLeft") $("prev").click();
});

await loadAudio();
home();
