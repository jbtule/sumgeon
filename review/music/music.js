// The background music review page: each stratum's ambience (js/music.js) with Play and Stop
// (a gentle fade), a volume slider starting at the level proposed for the game, and "Voice over
// it": a recorded game line (js/speech.js say(), the device voice where there's no recording)
// with the music ducked under it. One stratum plays at a time. Marks like the other review
// pages': ✓ Sounds good or ⚑ Something's wrong (tags and a note), kept on this device
// ("sumgeon:music": { [stratum]: { s: "ok" | "bad", tags, note, level, seed, t } }), and Report
// copies them, with the levels chosen, or opens a GitHub issue.
//
// Everything plays on the game's one Web Audio context (sfx.js makes it on the first tap).
import { MUSIC, IDS, DEFAULT_LEVEL, start } from "../../js/music.js";
import { PHRASE } from "../../js/lines.js";
import { say, stopSpeech } from "../../js/speech.js";
import * as sfx from "../../js/sfx.js";

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const STORE = "sumgeon:music";
const TAGS = ["Too loud", "Too quiet", "Too busy", "Annoying after a while", "Wrong mood", "Clicks or glitches", "Duck too much", "Duck too little"];
// Recorded lines the game says mid-fight, taken in turn.
const LINES = [PHRASE.hitHow, PHRASE.crits, PHRASE.heart, PHRASE.nextBoss, PHRASE.enter, PHRASE.skip];
const EVENT_NAMES = { drift: "the drone breathes", drip: "a drip", box: "music box", air: "the air moves", chord: "chord", echo: "an echoing note", hum: "the hum shifts", shimmer: "shimmer", chime: "crystal chimes", gust: "a gust", pulse: "pulse", bell: "a distant bell" };

let marks = {};
try { marks = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { marks = {}; }
function save() { try { localStorage.setItem(STORE, JSON.stringify(marks)); } catch (e) { /* this visit only */ } reportUI(); IDS.forEach(markUI); }

const level = Object.fromEntries(IDS.map((id) => [id, marks[id] && marks[id].level != null ? marks[id].level : DEFAULT_LEVEL]));
let now = null, startedAt = 0, lastEvent = "", lineAt = 0, talking = false;

$("cards").innerHTML = IDS.map((id) => `
  <section class="mcard d-layer ${id}" id="card-${id}" aria-label="${esc(MUSIC[id].name)}">
    <div class="mtop"><div class="wallchip" aria-hidden="true"></div>
      <div><h2>${esc(MUSIC[id].name)}</h2><p class="about">${esc(MUSIC[id].about)}</p></div></div>
    <div class="ctl">
      <button class="small go" type="button" data-play="${id}">▶ Play</button>
      <button class="small" type="button" data-voice="${id}">🗣 Voice over it</button>
      <label class="vol">Volume <input type="range" min="0" max="100" step="1" value="${Math.round(level[id] * 100)}" data-vol="${id}" aria-label="${esc(MUSIC[id].name)} volume"><output id="vol-${id}">${Math.round(level[id] * 100)}%</output></label>
    </div>
    <div class="now" id="now-${id}"></div>
    <div class="mark"><button class="small" type="button" data-ok="${id}">✓ Sounds good</button><button class="small flag" type="button" data-flag="${id}">⚑ Something's wrong</button><span class="state" id="state-${id}"></span></div>
    <div class="flagform" id="form-${id}" hidden>
      <p>What's wrong with ${esc(MUSIC[id].name)}?</p>
      <div class="tags">${TAGS.map((t) => `<button type="button" aria-pressed="false">${esc(t)}</button>`).join("")}</div>
      <textarea placeholder="What's wrong? (optional: when, what you heard)"></textarea>
      <div class="formbtns"><button class="small" type="button" data-cancel="${id}">Cancel</button><button class="small" type="button" data-save="${id}">Save</button></div>
    </div>
  </section>`).join("");

/* ---------- playing ---------- */
const seed = () => Math.max(1, Math.floor(+$("seed").value || 1));
function ctxOrSay() {
  const c = sfx.audioContext();
  if (!c) { $("sound").textContent = "No Web Audio on this browser."; return null; }
  if (c.state !== "running") c.resume();
  return c;
}
function stopNow(fade) {
  if (!now) return;
  const h = now;
  now = null;
  h.stop(fade == null ? 1500 : fade);
  document.querySelectorAll(".mcard").forEach((c) => c.classList.remove("playing"));
  document.querySelectorAll("[data-play]").forEach((b) => { b.textContent = "▶ Play"; b.classList.add("go"); b.classList.remove("on"); });
}
function play(id) {
  const c = ctxOrSay();
  if (!c) return null;
  stopNow();
  lastEvent = "";
  now = start(c, id, c.destination, {
    seed: seed(), level: level[id], fadeIn: 2500,
    onEvent: (ev, t) => { if (ev.kind !== "pulse") setTimeout(() => { if (now && now.id === id) lastEvent = EVENT_NAMES[ev.kind] + (ev.chord ? " " + ev.chord : ""); }, Math.max(0, (t - c.currentTime) * 1000)); }
  });
  startedAt = c.currentTime;
  $("card-" + id).classList.add("playing");
  const b = document.querySelector(`[data-play="${id}"]`);
  b.textContent = "■ Stop"; b.classList.remove("go"); b.classList.add("on");
  return now;
}
document.querySelectorAll("[data-play]").forEach((b) => (b.onclick = () => {
  const id = b.dataset.play;
  if (now && now.id === id) stopNow(); else play(id);
}));
document.querySelectorAll("[data-vol]").forEach((r) => (r.oninput = () => {
  const id = r.dataset.vol;
  level[id] = +r.value / 100;
  $("vol-" + id).textContent = r.value + "%";
  if (now && now.id === id) now.setLevel(level[id]);
}));
// A recorded line over the music, ducked under it. Starts the music first if it isn't playing,
// and lets it fade in, so you hear it before and after.
document.querySelectorAll("[data-voice]").forEach((b) => (b.onclick = async () => {
  const id = b.dataset.voice;
  if (talking) return;
  talking = true; b.disabled = true;
  try {
    if (!now || now.id !== id) { if (!play(id)) return; await new Promise((r) => setTimeout(r, 3000)); }
    const h = now, line = LINES[lineAt++ % LINES.length];
    h.duck(true);
    await new Promise((r) => setTimeout(r, 250));
    await say("p", line, true);
    await new Promise((r) => setTimeout(r, 300));
    h.duck(false);
  } finally { talking = false; b.disabled = false; }
}));
$("stopAll").onclick = () => { stopNow(); stopSpeech(); };
$("reseed").onclick = () => { $("seed").value = String(seed() + 1); if (now) play(now.id); };
$("seed").onchange = () => { if (now) play(now.id); };

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
setInterval(() => {
  const c = sfx.audioContext();
  IDS.forEach((id) => { $("now-" + id).innerHTML = now && now.id === id && c ? `Playing ${clock(c.currentTime - startedAt)} · variation ${now.seed}${lastEvent ? ` · <b>${esc(lastEvent)}</b>` : ""}` : ""; });
  const a = sfx.status();
  $("sound").textContent = `Sound: ${a.state || "not started"}${a.error ? " · " + a.error : ""}`;
}, 250);

/* ---------- marks ---------- */
function markUI(id) {
  const k = marks[id], s = $("state-" + id);
  s.className = "state" + (k ? " " + k.s : "");
  s.textContent = !k ? "" : k.s === "ok" ? `Sounds good at ${Math.round(k.level * 100)}%` : `Flagged${k.tags && k.tags.length ? ": " + k.tags.join(", ") : ""}`;
}
document.querySelectorAll("[data-ok]").forEach((b) => (b.onclick = () => {
  const id = b.dataset.ok;
  marks[id] = { s: "ok", level: level[id], seed: seed(), t: Date.now() };
  $("form-" + id).hidden = true; save();
}));
document.querySelectorAll("[data-flag]").forEach((b) => (b.onclick = () => {
  const id = b.dataset.flag, f = $("form-" + id), k = marks[id] || {};
  f.querySelectorAll(".tags button").forEach((t) => {
    t.setAttribute("aria-pressed", String(k.s === "bad" && (k.tags || []).includes(t.textContent)));
    t.onclick = () => t.setAttribute("aria-pressed", String(t.getAttribute("aria-pressed") !== "true"));
  });
  f.querySelector("textarea").value = k.s === "bad" ? k.note || "" : "";
  f.hidden = false; f.querySelector("textarea").focus();
}));
document.querySelectorAll("[data-cancel]").forEach((b) => (b.onclick = () => ($("form-" + b.dataset.cancel).hidden = true)));
document.querySelectorAll("[data-save]").forEach((b) => (b.onclick = () => {
  const id = b.dataset.save, f = $("form-" + id);
  const tags = [...f.querySelectorAll('.tags button[aria-pressed="true"]')].map((t) => t.textContent);
  marks[id] = { s: "bad", tags, note: f.querySelector("textarea").value.trim(), level: level[id], seed: seed(), t: Date.now() };
  f.hidden = true; save();
}));

/* ---------- reporting ---------- */
function report() {
  return IDS.filter((id) => marks[id]).map((id) => {
    const m = marks[id], at = ` (volume ${Math.round(m.level * 100)}%, variation ${m.seed})`;
    return m.s === "ok" ? `- ✓ ${MUSIC[id].name}: sounds good${at}` : `- ⚑ ${MUSIC[id].name}${at}${m.tags && m.tags.length ? " — " + m.tags.join(", ") : ""}${m.note ? ": " + m.note : ""}`;
  }).join("\n");
}
function reportUI() {
  const n = IDS.filter((id) => marks[id]).length;
  $("copyBtn").textContent = n ? `Copy ${n} mark${n > 1 ? "s" : ""}` : "No marks yet";
  $("copyBtn").disabled = $("issueBtn").disabled = !n;
}
$("copyBtn").onclick = () => {
  const r = report();
  if (!r) { $("status").textContent = "Nothing marked."; return; }
  const manual = () => { const t = $("reportText"); t.value = r; t.hidden = false; t.focus(); t.select(); $("status").textContent = "Select it and copy:"; };
  if (!navigator.clipboard) return manual();
  navigator.clipboard.writeText(r).then(() => { $("status").textContent = "Copied."; $("reportText").hidden = true; }, manual);
};
$("issueBtn").onclick = () => {
  const r = report();
  if (!r) { $("status").textContent = "Nothing marked."; return; }
  const body = "Background music marked on the review page (review/music/):\n\n" + r;
  window.open("https://github.com/jbtule/sumgeon/issues/new?title=" + encodeURIComponent("Background music: review") + "&body=" + encodeURIComponent(body.slice(0, 6000)), "_blank", "noopener");
};

reportUI(); IDS.forEach(markUI);
