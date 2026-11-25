// The spell check: draw a digit and see what the game's spell reader (js/sigil.js) makes of it,
// with or without a player's learned handwriting, plus each player's backwards counts. A tool
// for grown-ups trying it with a kid before anything gets tuned.
//
// Record (#record): a kid draws 0 to 9 in order, a big digit at a time, and each drawing is
// kept on this device (localStorage "sumgeon:drawings", as the listen check keeps its marks)
// until a grown-up shares them as a zip: real handwriting to test the reader on (js/drawings.js
// has the format, scripts/drawings-to-fixtures.mjs turns a zip into test fixtures). The page
// says nothing, and shows no read while recording, so a kid isn't put off by a wrong guess.
import { read, CLEAR } from "../js/sigil.js";
import { openStore, displayName } from "../js/store.js";
import { zip } from "../js/zip.js";
import { STORE, SOMEONE, summary, pngNames, zipName, drawingsJSON, README } from "../js/drawings.js";

const $ = (id) => document.getElementById(id);
let ls = null;
try { ls = window.localStorage; } catch (e) { /* no storage: built-in templates only */ }
const store = ls ? openStore(ls) : null;
const players = store ? store.profiles() : [];
const spellsOf = (id) => (store ? store.player(id).get("spells", {}) : {}) || {};
const round1 = (x) => Math.round(x * 10) / 10;

// Players to read with: none (built-in templates only), or each player's learned handwriting.
$("player").innerHTML = `<option value="">Built-in only</option>` + players.map((p) => `<option value="${p.id}">${esc(displayName(players, p.id))}'s too</option>`).join("");
if (store) $("player").value = store.active();
function personal(id) {
  if (!id) return [];
  return Object.entries(spellsOf(id).templates || {}).flatMap(([d, list]) => list.map((points) => ({ digit: Number(d), points })));
}
const plain = (strokes) => strokes.map((s) => s.map((p) => [p.x, p.y]));

/* ---------- a drawing pad ---------- */
// Strokes are kept as { x, y, t }: CSS px from the top left, ms since the drawing's first touch.
// One finger at a time (a resting palm or second finger is ignored), with every coalesced point.
function makePad(c, onStroke) {
  const pad = { strokes: [], pointer: null };
  let cur = null, pid = null, t0 = 0;
  const pt = (e) => { const r = c.getBoundingClientRect(); return { x: round1(e.clientX - r.left), y: round1(e.clientY - r.top), t: Math.max(0, Math.round(e.timeStamp - t0)) }; };
  c.onpointerdown = (e) => {
    if (cur) return;
    e.preventDefault(); try { c.setPointerCapture(e.pointerId); } catch (err) { /* a pointer that already ended */ }
    if (!pad.strokes.length) { t0 = e.timeStamp; pad.pointer = e.pointerType || null; }
    pid = e.pointerId; cur = [pt(e)]; pad.strokes.push(cur); pad.paint();
  };
  c.onpointermove = (e) => {
    if (!cur || e.pointerId !== pid) return;
    const evs = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
    for (const ev of evs.length ? evs : [e]) cur.push(pt(ev));
    pad.paint();
  };
  c.onpointerup = c.onpointercancel = (e) => { if (cur && e.pointerId === pid) { cur = null; pid = null; onStroke(); } };
  pad.clear = () => { pad.strokes = []; cur = null; pid = null; pad.paint(); };
  pad.paint = () => {
    const r = c.getBoundingClientRect(), dpr = devicePixelRatio || 1;
    if (!r.width) return;
    c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
    const g = c.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.lineCap = g.lineJoin = "round"; g.lineWidth = 8; g.strokeStyle = "#fff1b8"; g.shadowColor = "#ffc93c"; g.shadowBlur = 16;
    for (const s of pad.strokes) { g.beginPath(); s.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); if (s.length === 1) g.lineTo(s[0].x + 0.5, s[0].y); g.stroke(); }
  };
  return pad;
}

/* ---------- Try it ---------- */
const tryPad = makePad($("pad"), show);
$("clear").onclick = () => { tryPad.clear(); $("result").innerHTML = `<div class="verdict">Draw a digit</div>`; };
$("player").onchange = () => { if (tryPad.strokes.length) show(); };

// The read, after each stroke.
function show() {
  const r = read(plain(tryPad.strokes), personal($("player").value));
  if (!r) return;
  const pct = (x) => Math.round(x * 100) + "%";
  $("result").innerHTML = `
    <div class="big${r.reversed ? " rev" : ""}">${r.digit}</div>
    <div class="verdict ${r.clear ? "ok" : "bad"}">${r.clear ? (r.reversed ? `A ${r.digit}, backwards` : `A ${r.digit}`) : "Not clear: the spell would fail"}</div>
    <div class="row">Fit <b>${pct(r.fit)}</b></div><div class="row">Ahead of the next digit by <b>${pct(r.margin)}</b></div>
    <div class="row">Matched <b>${esc(r.name)}</b></div>
    <div class="alts">Next best: ${r.others.map((o) => `${o.digit} (${pct(o.fit)})`).join(", ")}</div>
    <div class="alts">Clear means fit ≥ ${pct(CLEAR.fit)} and ahead by ≥ ${pct(CLEAR.margin)} (${pct(CLEAR.reversed)} when backwards).</div>`;
}

/* ---------- backwards counts ---------- */
const REV = [1, 2, 3, 4, 5, 6, 7, 9];
$("reversals").innerHTML = players.length ? `<table><tr><th>Player</th>${REV.map((d) => `<th>${d}</th>`).join("")}<th>Right spells</th></tr>
  ${players.map((p) => { const s = spellsOf(p.id), rv = s.reversed || {};
    return `<tr><td>${esc(displayName(players, p.id))}</td>${REV.map((d) => `<td>${rv[d] || 0}</td>`).join("")}<td>${s.cast || 0}</td></tr>`; }).join("")}</table>`
  : `<p class="sub">No players on this device yet.</p>`;

/* ---------- Record ---------- */
// Saved: { recordings: [...], who: player id or "" for someone else, at: { [who]: { i, round } } }
// (how far each one got, so a kid can stop and carry on).
let saved = { recordings: [], who: store ? store.active() : "", at: {} };
try { saved = Object.assign(saved, JSON.parse(ls.getItem(STORE)) || {}); } catch (e) { /* a fresh start */ }
function persist() {
  try { ls.setItem(STORE, JSON.stringify(saved)); return true; } catch (e) { return false; }
}
const OTHER = "~other";
const whoKey = () => saved.who || OTHER;
const whoName = () => (saved.who ? displayName(players, saved.who) || SOMEONE : SOMEONE);
const progress = () => saved.at[whoKey()] || (saved.at[whoKey()] = { i: 0, round: 1 });

$("who").innerHTML = players.map((p) => `<option value="${p.id}">${esc(displayName(players, p.id))}</option>`).join("") + `<option value="${OTHER}">${SOMEONE}</option>`;
if (saved.who && !players.some((p) => p.id === saved.who)) saved.who = "";
$("who").value = whoKey();
$("who").onchange = () => { saved.who = $("who").value === OTHER ? "" : $("who").value; persist(); recPad.clear(); recUI(); };

const recPad = makePad($("rpad"), () => { $("next").disabled = !recPad.strokes.length; });
$("redo").onclick = () => { recPad.clear(); $("next").disabled = true; };
$("skip").onclick = () => advance();
$("next").onclick = () => {
  if (!recPad.strokes.length) return;
  const r = $("rpad").getBoundingClientRect(), strokes = plain(recPad.strokes), mine = personal(saved.who);
  const p = progress();
  saved.recordings.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    digit: p.i, round: p.round, who: whoName(), whoId: saved.who || null,
    strokes: recPad.strokes, width: round1(r.width), height: round1(r.height), dpr: devicePixelRatio || 1,
    pointer: recPad.pointer, ua: navigator.userAgent, at: new Date().toISOString(),
    read: { builtin: summary(read(strokes, [])), player: mine.length ? summary(read(strokes, mine)) : null }
  });
  if (!persist()) { saved.recordings.pop(); message("This device's storage is full. Share the drawings, then delete them to make room."); return; }
  advance();
};
$("again").onclick = () => { const p = progress(); p.i = 0; p.round++; persist(); recUI(); };
function advance() { progress().i++; persist(); recPad.clear(); recUI(); }

function recUI() {
  const p = progress(), done = p.i >= 10;
  $("stage").hidden = done; $("done").hidden = !done;
  $("askDigit").textContent = done ? "" : p.i;
  $("count").textContent = done ? "" : `${p.i + 1} of 10${p.round > 1 ? ` · round ${p.round}` : ""}`;
  $("next").disabled = !recPad.strokes.length;
  const n = saved.recordings.length;
  $("savedN").innerHTML = n ? `<b>${n}</b> drawing${n > 1 ? "s" : ""} saved on this device${(() => {
    const by = {}; for (const r of saved.recordings) by[r.who] = (by[r.who] || 0) + 1;
    return ": " + Object.entries(by).map(([w, k]) => `${esc(w)} ${k}`).join(", ");
  })()}.` : "No drawings saved yet.";
  $("share").disabled = $("del").disabled = !n;
  if (!done) requestAnimationFrame(recPad.paint);
}

// Delete with a second tap to confirm.
let armed = null;
function confirmDelete(btn) {
  if (armed !== btn) {
    disarm(); armed = btn; btn.classList.add("armed"); btn.dataset.label = btn.textContent;
    btn.textContent = `Tap again to delete ${saved.recordings.length}`;
    armed.timer = setTimeout(disarm, 4000);
    return;
  }
  disarm();
  saved.recordings = []; saved.at = {}; persist(); message(""); recPad.clear(); recUI();
}
function disarm() { if (armed) { clearTimeout(armed.timer); armed.classList.remove("armed"); armed.textContent = armed.dataset.label; armed = null; } }
$("del").onclick = () => confirmDelete($("del"));
function message(html) { $("shareMsg").innerHTML = html; }

/* ---------- Share as a zip ---------- */
// Each drawing as a PNG, white on dark, drawn on an offscreen canvas. toDataURL is synchronous,
// so the whole zip is built inside the tap and navigator.share still counts as the user's.
function pngOf(r) {
  const S = 256, c = document.createElement("canvas"), k = S / Math.max(r.width, r.height, 1);
  c.width = c.height = S;
  const g = c.getContext("2d");
  g.fillStyle = "#12242b"; g.fillRect(0, 0, S, S);
  g.lineCap = g.lineJoin = "round"; g.lineWidth = 7; g.strokeStyle = "#ffffff";
  for (const s of r.strokes) { g.beginPath(); s.forEach((p, i) => (i ? g.lineTo(p.x * k, p.y * k) : g.moveTo(p.x * k, p.y * k))); if (s.length === 1) g.lineTo(s[0].x * k + 0.5, s[0].y * k); g.stroke(); }
  const b64 = c.toDataURL("image/png").split(",")[1], bin = atob(b64), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function buildZip() {
  const recs = saved.recordings, names = pngNames(recs), sha = $("buildSha").textContent.trim();
  return zip([{ name: "README.txt", data: README }, { name: "drawings.json", data: drawingsJSON(recs, sha) },
    ...recs.map((r, i) => ({ name: names[i], data: pngOf(r) }))]);
}
let lastUrl = null;
$("share").onclick = async () => {
  disarm();
  const n = saved.recordings.length, name = zipName();
  const file = new File([buildZip()], name, { type: "application/zip" });
  if (navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Sumgeon drawings" });
      shared(`Shared ${n} drawing${n > 1 ? "s" : ""}.`);
      return;
    } catch (e) {
      if (e && e.name === "AbortError") return; // closed the share sheet: nothing to do
      // Otherwise (not allowed here, say) fall back to a download.
    }
  }
  if (lastUrl) URL.revokeObjectURL(lastUrl);
  lastUrl = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = lastUrl; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  shared(`Downloaded <a href="${lastUrl}" download="${name}" id="zipLink">${name}</a> (${n} drawing${n > 1 ? "s" : ""}). Tap the name to save it again.`);
};
// After sharing, offer to clear them, never on its own.
function shared(html) {
  message(`${html} Once it's safely received, you can delete them from this device. <button class="small danger" id="delAfter" type="button">Delete recordings</button>`);
  $("delAfter").onclick = () => confirmDelete($("delAfter"));
}

/* ---------- the two views ---------- */
function view(v) {
  document.querySelectorAll(".tabs button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === v)));
  $("tryView").hidden = v !== "try"; $("recView").hidden = v !== "record";
  document.body.classList.toggle("recording", v === "record");
  if (v === "record") recUI(); else requestAnimationFrame(tryPad.paint);
}
document.querySelectorAll(".tabs button").forEach((b) => (b.onclick = () => { history.replaceState(null, "", b.dataset.view === "record" ? "#record" : location.pathname + location.search); view(b.dataset.view); }));
addEventListener("resize", () => { tryPad.paint(); recPad.paint(); });
view(location.hash === "#record" ? "record" : "try");

function esc(t) { return String(t).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]); }
