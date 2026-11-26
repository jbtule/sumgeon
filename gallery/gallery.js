// The monster gallery (gallery/, a grown-up page like the listen check): every monster drawn big,
// the new ones (NEW_MON, not in the game yet) first, then the game's own (MON), then the heroes
// for comparison, then the retired ones (RETIRED, out of the game). Each can be shown on its stratum's wall, every wall, or plain, and at the small
// sizes the game uses, to judge contrast and readability. Flags like the moments page's: ⚑ marks
// a drawing with tags and a note, and Report copies the flags or opens a GitHub issue.
// Marks live in localStorage ("sumgeon:gallery"), keyed by name: { s: "bad", tags, note, t }.
import { MON, NEW_MON, RETIRED, svg } from "../js/monsters.js";
import { HEROES, heroSvg } from "../js/heroes.js";
import { TRAITS } from "../js/traits.js";

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const STORE = "sumgeon:gallery";
const TAGS = ["Symbol", "Creature", "Color", "Small size", "Style", "Too scary", "Quip"];
const WALLS = { cellar: "The Counting Cellar", hall: "The Balance Hall", mines: "The Crystal Mines", tower: "The Tables Tower", plain: "Plain" };
const ALL_WALLS = ["cellar", "hall", "mines", "tower"];
const SHORT = { cellar: "Cellar", hall: "Hall", mines: "Mines", tower: "Tower" };

// The game's own monsters: their symbol and their strata in the grade plan (DESIGN.md §4.1).
// Kept here rather than read from wings.js, which is being restructured.
const OLD = {
  Plusquito: ["+", "cellar"], Minustaur: ["−", "cellar"], Trollar: ["$", "cellar, mines"], "Make-Ten Golem": ["10", "cellar"],
  Quizard: ["?", "hall"], Chompers: ["< >", "hall, cellar"], "Equal Twins": ["=", "hall"], "Judo Judy": ["⇄", "hall"],
  Haberhasher: ["#", "mines"], Timesaur: ["×", "tower"], Divvy: ["÷", "tower"], Starbot: ["*", "tower"], "Sigma Rex": ["Σ", "tower"],
  Sevenstein: ["7", "cursed"], Octoloop: ["8", "cursed"]
};
const strataOf = (m) => (m.stratum || (OLD[m.n] || [])[1] || "plain").split(", ");
const homeWall = (m) => strataOf(m).find((s) => WALLS[s]) || "plain";
const NEW_NAMES = new Set(NEW_MON.map((m) => m.n));
const traitOf = (m) => m.trait || TRAITS[m.n] || (OLD[m.n] && OLD[m.n][1] === "cursed" ? { icon: "🍀", name: "Lucky Number", text: `A cursed digit: answers with a ${OLD[m.n][0]} hit double` } : null);

let marks = {};
try { marks = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { marks = {}; }
function save() { try { localStorage.setItem(STORE, JSON.stringify(marks)); } catch (e) { /* this visit only */ } reportUI(); }
const view = { wall: "home", small: false };
try { Object.assign(view, JSON.parse(localStorage.getItem(STORE + ":view")) || {}); } catch (e) { /* defaults */ }
const keepView = () => { try { localStorage.setItem(STORE + ":view", JSON.stringify(view)); } catch (e) { /* this visit only */ } };

/* ---------- the cards ---------- */
// One item: { key, name, art: (cls) => svg, isNew, boss, sym, strata, trait, quip, color, sub }.
const monItem = (m) => ({ key: m.n, name: m.n, art: () => svg(m), isNew: NEW_NAMES.has(m.n), boss: m.boss, retired: m.retired, sym: m.sym || (OLD[m.n] || [])[0] || m.op,
  strata: strataOf(m), home: homeWall(m), trait: traitOf(m), quip: `${m.n} ${m.quip}`, color: m.c });
const heroItem = (h) => ({ key: "hero:" + h.n, name: h.n, art: () => heroSvg(h), sym: String(h.d), strata: [], home: "plain",
  trait: { icon: "🦸", name: h.cls, text: h.move }, color: h.c });

function stage(it, wall, three) {
  const small = view.small ? `<div class="g-smalls"><span class="g-s72">${it.art()}</span><span class="g-s26">${it.art()}</span></div>` : "";
  return `<div class="g-stage" style="--wall:var(--wall-${wall})">${three ? `<span class="g-wname">${esc(SHORT[wall])}</span>` : ""}<div class="g-big">${it.art()}</div>${small}</div>`;
}
function card(it) {
  const k = marks[it.key], walls = view.wall === "all" ? ALL_WALLS : [view.wall === "home" ? it.home : view.wall];
  const where = it.strata.map((s) => WALLS[s] || (s === "cursed" ? "Cursed digit (a rescue floor)" : s)).join(", ");
  return `<article class="gcard${k ? " g-bad" : ""}" data-key="${esc(it.key)}">
    <div class="g-stages${walls.length > 1 ? " g-three" : ""}">${walls.map((w) => stage(it, w, walls.length > 1)).join("")}</div>
    <div class="g-info">
      <div class="g-title"><b>${esc(it.name)}</b>${it.isNew ? `<span class="g-new">New</span>` : ""}${it.boss ? `<span class="g-boss">Boss</span>` : ""}${it.retired ? `<span class="g-retired">Retired</span>` : ""}<span class="g-sym" title="Its symbol">${esc(it.sym)}</span></div>
      ${where ? `<div class="g-meta">${esc(where)}</div>` : ""}
      ${it.trait ? `<div class="g-trait">${esc(it.trait.icon)} <b>${esc(it.trait.name)}</b>: ${esc(it.trait.text)}</div>` : `<div class="g-trait g-meta">No trait (the tutorial monster)</div>`}
      ${it.quip ? `<div class="g-quip">"${esc(it.quip)}"</div>` : ""}
      ${k ? `<div class="g-note">⚑ ${esc([...(k.tags || []), k.note].filter(Boolean).join(" · ") || "Flagged")}</div>` : ""}
      <div class="g-row"><span class="g-swatch"><i style="background:${it.color}"></i>${esc(it.color)}</span>
        <span>${k ? `<button type="button" class="flagbtn g-ok" data-act="ok">✓ Fine now</button> ` : ""}<button type="button" class="flagbtn" data-act="flag">⚑ ${k ? "Edit" : "Flag"}</button></span></div>
    </div></article>`;
}
const ITEMS = { newGrid: NEW_MON.map(monItem), oldGrid: MON.map(monItem), heroGrid: HEROES.map(heroItem), retiredGrid: RETIRED.map(monItem) };
const byKey = Object.fromEntries(Object.values(ITEMS).flat().map((it) => [it.key, it]));
function render() {
  for (const [id, items] of Object.entries(ITEMS)) $(id).innerHTML = items.map(card).join("");
  document.querySelectorAll("#walls button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.wall === view.wall)));
  document.querySelectorAll("#sizes button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.small === (view.small ? "1" : "0"))));
}
$("walls").onclick = (e) => { const b = e.target.closest("button"); if (b) { view.wall = b.dataset.wall; keepView(); render(); } };
$("sizes").onclick = (e) => { const b = e.target.closest("button"); if (b) { view.small = b.dataset.small === "1"; keepView(); render(); } };
document.querySelector(".wrap").addEventListener("click", (e) => {
  const b = e.target.closest(".flagbtn"), c = b && b.closest(".gcard");
  if (!c) return;
  const key = c.dataset.key;
  if (b.dataset.act === "ok") { delete marks[key]; save(); render(); } else flag(key);
});

/* ---------- flagging ---------- */
let flagFor = null;
function flag(key) {
  flagFor = key;
  const k = marks[key] || {};
  $("flagWhat").textContent = `What's wrong with ${byKey[key].name}?`;
  $("tags").innerHTML = TAGS.map((t) => `<button type="button" aria-pressed="${(k.tags || []).includes(t)}">${t}</button>`).join("");
  $("tags").querySelectorAll("button").forEach((b) => (b.onclick = () => b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"))));
  $("note").value = k.note || "";
  $("flagform").hidden = false; $("note").focus();
}
function closeFlag(saveIt) {
  if (saveIt && flagFor) {
    const tags = [...$("tags").querySelectorAll('button[aria-pressed="true"]')].map((b) => b.textContent);
    marks[flagFor] = { s: "bad", tags, note: $("note").value.trim(), t: Date.now() };
    save(); render();
  }
  $("flagform").hidden = true; flagFor = null;
}
$("saveFlag").onclick = () => closeFlag(true);
$("cancelFlag").onclick = () => closeFlag(false);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("flagform").hidden) closeFlag(false); });

/* ---------- reporting ---------- */
function report() {
  return Object.entries(marks).filter(([, m]) => m.s === "bad").map(([key, m]) => {
    const it = byKey[key], name = it ? it.name + (it.isNew ? " (new)" : key.startsWith("hero:") ? " (hero)" : "") : key;
    return `- ${name}${m.tags && m.tags.length ? " — " + m.tags.join(", ") : ""}${m.note ? ": " + m.note : ""}`;
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
  const body = "Monster art flagged on the gallery page:\n\n" + r;
  window.open("https://github.com/jbtule/sumgeon/issues/new?title=" + encodeURIComponent("Monster art: to fix") + "&body=" + encodeURIComponent(body.slice(0, 6000)), "_blank", "noopener");
};

render(); reportUI();
