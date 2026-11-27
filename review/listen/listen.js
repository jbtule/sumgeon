// The listen check: plays the recorded voice a group at a time (lines.js GROUPS), one line after
// another, so a grown-up can listen straight through and flag only what's wrong. A line that
// plays to the end without a flag counts as OK. Patterned on sound-box-crosswords' listen/, with
// continuous play instead of marking each clip.
//
// Marks live in localStorage ("sumgeon:listen"), keyed by the clip's key: { s: "ok" | "bad",
// tags, note, t }. A re-recorded line has a new key, so it shows up as unheard again.
import { spokenLines, GROUPS } from "../../js/lines.js";
import { linesOf, rangeHeader, rangeBytes } from "../../js/ranges.js";

const $ = (id) => document.getElementById(id);
const STORE = "sumgeon:listen";
const TAGS = ["Wrong word", "Wrong stress", "Mispronounced", "Cut off", "Glitch or noise", "Too fast or slow"];
const GAP_MS = 500;

let marks = {};
try { marks = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { marks = {}; }
function save() { try { localStorage.setItem(STORE, JSON.stringify(marks)); } catch (e) { /* this visit only */ } if (typeof reportUI === "function") reportUI(); }

// The lines, each with its clip key and where it is in its sprite, from audio.json: the site's
// own, or when run locally (where any audio.json is a leftover from a local build) the live one.
// Only the sprites are deployed, so a line is fetched on its own with a Range request (ranges.js),
// its bytes exactly its clip, and played in the <audio> element. The audio host lets only the
// site read them (CORS), so run locally against the live host, nothing plays: use the site's
// listen check, or a local recording (CLAUDE.md "To hear new clips locally").
const LINES = spokenLines();
let base = "", clips = {}, spots = {};
async function loadAudio() {
  const live = "https://tools.tuley.name/sumgeon/audio.json", local = /^(localhost|127\.|\[::1\])/.test(location.hostname);
  for (const url of local ? [live, "../../audio.json"] : ["../audio.json", live]) {
    try { const r = await fetch(url, { cache: "no-store" }); if (r.ok) { const m = await r.json(); base = m.base || ""; clips = m.clips; spots = linesOf(m.sprites); return; } } catch (e) { /* try the next */ }
  }
}
// A line's audio as an object URL: its range of its sprite (or its single clip, when audio.json
// still names them). The last few are kept, and the next line is fetched ahead.
const urls = new Map();
function srcOf(l) {
  const id = l.kind + ":" + l.text;
  if (urls.has(id)) return urls.get(id);
  const where = spots[id];
  const p = where
    ? fetch(where.url, { headers: { Range: rangeHeader(where.off, where.len) } })
      .then((r) => (r.ok ? r.arrayBuffer().then((b) => rangeBytes(r.status, b, where.off, where.len)) : null))
      .catch(() => null)
      .then((b) => (b ? URL.createObjectURL(new Blob([b], { type: "audio/mpeg" })) : base ? base + keyOf(l) + ".mp3" : Promise.reject(new Error("can't fetch " + id))))
    : base ? Promise.resolve(base + keyOf(l) + ".mp3") : Promise.reject(new Error("not in a sprite: " + id));
  p.catch(() => urls.delete(id));
  urls.set(id, p);
  if (urls.size > 12) {
    const [old, op] = urls.entries().next().value;
    urls.delete(old);
    op.then((u) => { if (u.startsWith("blob:")) URL.revokeObjectURL(u); }, () => {});
  }
  return p;
}
// Plays a line in the shared element; then() runs once it has started (or failed to).
let playToken = 0;
function playLine(l, onended) {
  const my = ++playToken;
  audio.onended = null;
  return srcOf(l).then((u) => {
    if (my !== playToken) return false;
    audio.onended = onended || null;
    audio.src = u;
    return audio.play().then(() => true);
  }).catch(() => { if (my === playToken) $("status").textContent = "Couldn't play that line here (see the note at the top of listen.js)."; return false; });
}
// iOS lets an element play only from a tap; the line arrives after a fetch, so the element is
// unlocked on the first tap with a moment of silence.
const SILENCE = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";
function unlockAudio() {
  document.removeEventListener("pointerdown", unlockAudio, true);
  document.removeEventListener("keydown", unlockAudio, true);
  if (audio.src) return;
  audio.src = SILENCE;
  audio.play().catch(() => {});
}
document.addEventListener("pointerdown", unlockAudio, true);
document.addEventListener("keydown", unlockAudio, true);
const keyOf = (l) => clips[l.kind + ":" + l.text];
const markOf = (l) => marks[keyOf(l)];
const KIND = { p: "Phrase", m: "Name", q: "Problem" };

/* ---------- the groups ---------- */
function counts(group) {
  const ls = LINES.filter((l) => l.group === group && keyOf(l));
  const ok = ls.filter((l) => (markOf(l) || {}).s === "ok").length, bad = ls.filter((l) => (markOf(l) || {}).s === "bad").length;
  return { all: ls.length, ok, bad, new: ls.length - ok - bad, missing: LINES.filter((l) => l.group === group && !keyOf(l)).length };
}
// The report buttons say how many lines are flagged, and wait until there's one.
function reportUI() {
  const n = LINES.filter((l) => (markOf(l) || {}).s === "bad").length;
  $("copyBtn").textContent = n ? `Copy ${n} issue${n > 1 ? "s" : ""}` : "No issues yet";
  $("copyBtn").disabled = $("issueBtn").disabled = !n;
}
function home() {
  $("player").hidden = true; $("home").hidden = false; stop(); reportUI();
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
function stop() { playing = false; inGap = false; clearTimeout(gapTimer); playToken++; audio.pause(); audio.onended = null; }

// Plays the current line; when it ends without a flag it's OK, and the next one follows.
function playCurrent() {
  const l = list[at];
  if (!l) { playing = false; show(); return; }
  clearTimeout(gapTimer); inGap = false;
  playLine(l, () => {
    if (!marks[keyOf(l)]) { marks[keyOf(l)] = { s: "ok", t: Date.now() }; save(); }
    remember(l);
    if (!playing) return;
    if (at < list.length - 1) { at++; show(); inGap = true; gapTimer = setTimeout(playCurrent, GAP_MS); }
    else { playing = false; show(); }
  }).then((ok) => { if (!ok && playing) { playing = false; show(); } });
  if (list[at + 1]) srcOf(list[at + 1]).catch(() => {}); // ready for the gap
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
$("again").onclick = () => { playing = false; clearTimeout(gapTimer); const l = list[at]; playLine(l, () => remember(l)); show(); };
$("prev").onclick = () => { if (at > 0) at--; const was = playing; stop(); if (was) { playing = true; playCurrent(); } else show(); };
// The line to flag: the one playing, or (in the gap after it) the one that just ended.
// In the short gap after a line, that's the line you just heard.
$("flag").onclick = () => flag(inGap && recent.length ? recent[0] : list[at]);
$("saveFlag").onclick = () => closeFlag(true);
$("cancelFlag").onclick = () => closeFlag(false);
$("recent").onclick = (e) => {
  const b = e.target.closest("button"); if (!b) return;
  const l = recent[+b.dataset.i];
  if (b.dataset.act === "play") { stop(); playLine(l); show(); }
  else if (b.dataset.act === "flag") flag(l);
  else { marks[keyOf(l)] = { s: "ok", t: Date.now() }; save(); recentUI(); show(); }
};
$("copyBtn").onclick = () => {
  const r = report();
  if (!r) { $("status").textContent = "No issues flagged."; return; }
  // If the browser won't copy, show the text to select and copy by hand.
  const manual = () => { const t = $("reportText"); t.value = r; t.hidden = false; t.focus(); t.select(); $("status").textContent = "Select it and copy:"; };
  if (!navigator.clipboard) return manual();
  navigator.clipboard.writeText(r).then(() => { $("status").textContent = "Copied."; $("reportText").hidden = true; }, manual);
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
