// The Hero Moments review page: pick a hero, a quip and a monster (in any stratum's colors and
// wall) and play the moment exactly as the game does (js/slowmo.js, the same sounds and the same
// recorded quip through js/speech.js). Replay, Play all, Step through the frames, ½× or 1×, and
// reduced motion. Flags like the listen check's: a moment that plays to the end unflagged counts
// as fine, ⚑ flags it with tags and a note, and Report copies the flags or opens a GitHub issue.
// And a rarity simulator: runs of answers through the real trigger rule (js/moments.js).
//
// Marks live in localStorage ("sumgeon:moments"), keyed by hero and quip: { s: "ok" | "bad",
// tags, note, t }.
import { HEROES } from "../../js/heroes.js";
import { MON, svg } from "../../js/monsters.js";
import { QUIPS, FINALS, CRIT, TEAM_LINES, TEAM_NUMBERS, CAPTAIN_LINES, captainNames, simulate } from "../../js/moments.js";
import { playMoment, PHASES } from "../../js/slowmo.js";
import { quipLine, monsterCleared } from "../../js/lines.js";
import { say, stopSpeech, speaking, cutOff } from "../../js/speech.js";
import * as sfx from "../../js/sfx.js";

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const STORE = "sumgeon:moments";
const TAGS = ["Wording", "Voice", "Timing", "Art"];

let marks = {};
try { marks = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { marks = {}; }
function save() { try { localStorage.setItem(STORE, JSON.stringify(marks)); } catch (e) { /* this visit only */ } reportUI(); }
// A moment's key: its hero (a team-up's "1+5": tens hero, then ones hero) and its quip.
const keyOf = (m) => (m.partner != null ? m.hero + "+" + m.partner : m.hero) + "|" + m.quip;
const nameOf = (m) => HEROES[m.hero].n + (m.partner != null ? " & " + HEROES[m.partner].n : "");
// A team-up line's own number ("Perfect ten!" is 10), or undefined.
const NUMBER_OF = Object.fromEntries(Object.entries(TEAM_NUMBERS).map(([n, q]) => [q, +n]));

// Every line Play all runs through: each hero's quips, then the boss-finishing lines and
// "Critical math!", said by the heroes in turn; then the team-ups: each general line with a
// sample pair, and each number's line with its own digits (64 is Sixlock and Sir Fourtress); then
// the captain lines: the five shared ones (a fight's) with sample heroes, and each hero's four
// name lines (said on picking a captain).
const PAIRS = [[1, 5], [2, 4], [3, 7], [4, 2], [6, 8], [9, 3]];
const ALL = HEROES.flatMap((h) => QUIPS[h.d].map((q) => ({ hero: h.d, quip: q })))
  .concat(FINALS.concat([CRIT]).map((q, i) => ({ hero: i % 10, quip: q })))
  .concat(TEAM_LINES.map((q, i) => ({ hero: PAIRS[i % PAIRS.length][0], partner: PAIRS[i % PAIRS.length][1], quip: q })))
  .concat(Object.entries(TEAM_NUMBERS).map(([n, q]) => ({ hero: +n[0], partner: +n[1], quip: q })))
  .concat(CAPTAIN_LINES.map((q, i) => ({ hero: [5, 2, 4, 9, 0][i % 5], quip: q })))
  .concat(HEROES.flatMap((h) => captainNames(h.d).map((q) => ({ hero: h.d, quip: q }))));

/* ---------- picking ---------- */
const opts = { speed: 1, reduced: false, step: false };
$("hero").innerHTML = HEROES.map((h) => `<option value="${h.d}">${h.d} · ${esc(h.n)}</option>`).join("");
$("monster").innerHTML = MON.map((m, i) => `<option value="${i}">${esc(m.n)}${m.boss ? " (boss)" : ""}</option>`).join("");
// Team-up with: None, or any other hero (on the right, the ones).
function partnerOptions() {
  const d = +$("hero").value, was = $("partner").value;
  $("partner").innerHTML = `<option value="">None</option>` + HEROES.filter((h) => h.d !== d).map((h) => `<option value="${h.d}">${h.d} · ${esc(h.n)}</option>`).join("");
  $("partner").value = was !== "" && +was !== d ? was : "";
}
const partnerOf = () => ($("partner").value === "" ? null : +$("partner").value);
// The hero's quips and the big ones; then the team-up lines (a number's line shows its number);
// then the Captain lines: the hero's name lines (on picking a captain) and the shared ones (in a fight).
// A team-up option's value starts "T|", since a line can be in both ("Six, seven!" is
// Sevenstein's and 67's).
function quipOptions() {
  const d = +$("hero").value, was = $("quip").value, opt = (pre) => (q) => `<option value="${pre}${esc(q)}">${esc(q)}${pre && NUMBER_OF[q] ? ` (${NUMBER_OF[q]})` : ""}</option>`;
  $("quip").innerHTML = `<optgroup label="${esc(HEROES[d].n)}">${QUIPS[d].concat(FINALS, [CRIT]).map(opt("")).join("")}</optgroup>` +
    `<optgroup label="Team-ups">${TEAM_LINES.concat(Object.values(TEAM_NUMBERS)).map(opt("T|")).join("")}</optgroup>` +
    `<optgroup label="Captain">${captainNames(d).concat(CAPTAIN_LINES).map(opt("")).join("")}</optgroup>`;
  if ([...$("quip").options].some((o) => o.value === was)) $("quip").value = was;
}
const quipOf = () => $("quip").value.replace(/^T\|/, "");
const isTeamOption = () => $("quip").value.startsWith("T|");
// Picks a quip: a team-up's from the Team-ups list, a solo one from the hero's.
function setQuip(q, team) { $("quip").value = (team ? "T|" : "") + q; if (!$("quip").value) $("quip").value = (team ? "" : "T|") + q; }
// The answer shown: the hero's digit, or a team-up's two digits in order (tens, then ones), or a
// number line's own number.
function answerFor(d, p, quip) {
  if (p == null) return d === 0 ? 10 : d + 10;
  const n = NUMBER_OF[quip];
  if (n && Math.floor(n / 10) === d && n % 10 === p) return n;
  return d === 0 ? Number(`${p === 1 ? 2 : 1}0${p}`) : d * 10 + p; // Zeroic can't lead: 105
}
function scene() {
  const m = MON[+$("monster").value], s = $("stratum").value, d = +$("hero").value, p = partnerOf(), quip = quipOf();
  document.body.dataset.stratum = s === "plain" ? "" : s;
  $("stage").style.setProperty("--wall", `var(--wall-${s})`);
  $("mName").textContent = m.n;
  $("mon").innerHTML = svg(m);
  // A problem whose answer has the hero's digit (or both heroes', in order).
  const ans = answerFor(d, p, quip), x = Math.max(1, Math.round(ans * 0.4));
  $("prob").textContent = `${x} + ${ans - x} =`;
  $("ans").textContent = String(ans);
  $("what").textContent = `${nameOf({ hero: d, partner: p })}: "${quip}"`;
}
// Picking a team-up line: a number's line brings its own digits; a general line with no partner
// picks one.
function teamFor() {
  if (!isTeamOption()) return;
  const q = quipOf(), n = NUMBER_OF[q];
  if (n) {
    const a = Math.floor(n / 10), b = n % 10;
    if (+$("hero").value !== a || partnerOf() !== b) { $("hero").value = String(a); partnerOptions(); quipOptions(); setQuip(q, true); $("partner").value = String(b); }
  } else if (partnerOf() == null) $("partner").value = String((+$("hero").value + 4) % 10 || 1);
}
$("hero").onchange = () => { partnerOptions(); quipOptions(); scene(); };
$("quip").onchange = () => { teamFor(); scene(); };
["partner", "monster", "stratum"].forEach((id) => ($(id).onchange = scene));
document.querySelectorAll("[data-speed]").forEach((b) => (b.onclick = () => { opts.speed = +b.dataset.speed; pressed("[data-speed]", b); }));
document.querySelectorAll("[data-reduced]").forEach((b) => (b.onclick = () => { opts.reduced = b.dataset.reduced === "1"; pressed("[data-reduced]", b); }));
document.querySelectorAll("[data-step]").forEach((b) => (b.onclick = () => { opts.step = b.dataset.step === "1"; pressed("[data-step]", b); }));
function pressed(sel, on) { document.querySelectorAll(sel).forEach((b) => b.setAttribute("aria-pressed", String(b === on))); }

/* ---------- playing ---------- */
let playing = false, nextGate = null, current = null;
// Plays the picked moment. Resolves true when it ran to the end.
async function play() {
  if (playing) return false;
  playing = true; $("play").disabled = true; $("phase").textContent = "";
  const d = +$("hero").value, p = partnerOf(), quip = quipOf(), m = p == null ? { hero: d, quip } : { hero: d, partner: p, quip };
  current = m;
  const gate = opts.step ? (p) => new Promise((go) => { $("phase").textContent = `Next: ${p}`; $("next").hidden = false; nextGate = () => { $("next").hidden = true; nextGate = null; go(); }; }) : null;
  try {
    await playMoment({
      hero: d, partner: p, color: null, quip, speed: opts.speed, reduced: opts.reduced, gate,
      before: () => speaking() ? cutOff(sfx.scratch, sfx.SCRATCH_AT, sfx.SCRATCH) : null,
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
// "Talking over": the voice starts a line just before the moment, so the quip has to cut it off
// with the record scratch (sfx.SCRATCH_AT; try ?scratch=<ms> to move it).
let talkOver = false;
document.querySelectorAll("[data-talk]").forEach((b) => (b.onclick = () => { talkOver = b.dataset.talk === "1"; pressed("[data-talk]", b); }));
// The voice gets a second and a half in before the moment cuts it off.
// The sound board: every effect on its own, with what it's meant to be (sfx.js).
const SOUNDS = [
  ["Hero Moment", [
    ["Record scratch", "The voice is cut off before a moment", () => sfx.scratch()],
    ["Tape slowdown", "Time dragging to slow motion", () => sfx.tapeStop(0.6)],
    ["Heartbeat", "The freeze, under the quip", () => sfx.heartbeat()],
    ["Reverse swell", "Building into the snap", () => sfx.swell(0.45)],
    ["Whip", "The hero whips into the monster", () => sfx.whip()],
    ["Slam", "A moment's hit", () => sfx.slam()],
    ["Big slam", "A team-up's hit", () => sfx.slam(true)]]],
  ["Hero moves (at a moment's hit)", HEROES.map((h) => [h.n, h.move, () => sfx.move(h.d)])],
  ["Monsters", [
    ["Lightning crackle", "Minustaur: a charged problem appears", () => sfx.charge()],
    ["Thunder strike", "Minustaur: a charged miss (2 hearts)", () => sfx.thunder()],
    ["Lightning zap", "Minustaur: a charged problem answered right", () => sfx.zap()],
    ["Boss roar", "Every 9–15 s of a boss fight", () => sfx.roar()],
    ["Monster appears", "A new floor's monster", () => sfx.appear(false)],
    ["Boss appears", "The boss floor", () => sfx.appear(true)]]],
  ["The descent", [
    ["Falling", "Enter the dungeon: down through the strata", () => sfx.fall(1.4)],
    ["Whoomp", "Landing in the stratum", () => sfx.whoomp()]]],
  ["The fight", [
    ["Key tap", "Each number-pad key", () => sfx.tick()],
    ["Launch", "Your digits fly", () => sfx.launch(1)],
    ["Launch, on a streak", "Digits fly with a streak going", () => sfx.launch(5)],
    ["Hit", "An ordinary hit", () => sfx.impact(false)],
    ["Critical hit", "A hit with crits on", () => sfx.impact(true)],
    ["Miss", "A wrong answer", () => sfx.miss()],
    ["Crack", "A failed spell, a heart lost", () => sfx.crack()],
    ["Floor cleared", "A monster beaten (and, for now, the stratum cleared)", () => sfx.victory()],
    ["Old floor jingle", "No longer used", () => sfx.cleared()]]],
  ["Chests and items", [
    ["Chest opens", "A chest's lock answered right: the lock pops, the lid opens", () => sfx.chestOpen()],
    ["Lock jams", "A chest's lock answered wrong", () => sfx.clunk()],
    ["Coins", "Money into your purse", () => sfx.coins(4)],
    ["Shield clang", "The Shield blocks a miss", () => sfx.clang()],
    ["Item used", "A slot tapped: Pie, Shield, Totem or Magnet", () => sfx.powerUp()]]]
];
$("sounds").innerHTML = SOUNDS.map(([group, list], g) => `<h3>${esc(group)}</h3>` + list.map(([n, what], i) =>
  `<div class="snd"><button type="button" data-snd="${g}:${i}" aria-label="Play ${esc(n)}">▶</button><span><b>${esc(n)}</b><small>${esc(what)}</small></span></div>`).join("")).join("");
$("sounds").onclick = (e) => { const b = e.target.closest("[data-snd]"); if (!b) return; const [g, i] = b.dataset.snd.split(":").map(Number); SOUNDS[g][1][i][2](); };

const talk = () => { if (!talkOver) return Promise.resolve(); say("p", monsterCleared(MON[0])); return new Promise((r) => setTimeout(r, 1500)); };
$("play").onclick = () => { if (playing) return; wake(); talk().then(play); };
$("next").onclick = () => { wake(); if (nextGate) nextGate(); };
// The sound effects' state, for checking on a device: the audio context, effects played, errors.
setInterval(() => { const a = sfx.status(); $("sound").textContent = `Sound effects: ${a.state || "not started"} · ${a.played} played${a.error ? " · " + a.error : ""}`; }, 500);

// Play all: every line (ALL, team-ups last), one after another, with a short gap. Pause stops after the moment
// playing, and Resume carries on from the next one; Restart goes back to the first. Where it got
// to is kept on this device. Space pauses or resumes.
const POS_KEY = "sumgeon:moments:pos";
let pos = 0, runningAll = false;
try { pos = Math.min(ALL.length, Math.max(0, +localStorage.getItem(POS_KEY) || 0)); } catch (e) { /* no storage */ }
const keepPos = () => { try { localStorage.setItem(POS_KEY, String(pos)); } catch (e) { /* no storage */ } };
function allButtons() {
  const started = pos > 0 && pos < ALL.length;
  $("playAll").hidden = runningAll; $("stopAll").hidden = !runningAll; $("restartAll").hidden = runningAll || !started;
  $("playAll").textContent = started ? `▶ Resume (${pos + 1} of ${ALL.length})` : "▶ Play all";
}
async function playAll() {
  if (playing || runningAll) return;
  if (pos >= ALL.length) pos = 0;
  runningAll = true; allButtons();
  while (runningAll && pos < ALL.length) {
    const m = ALL[pos++]; keepPos();
    $("hero").value = String(m.hero); partnerOptions(); $("partner").value = m.partner == null ? "" : String(m.partner);
    quipOptions(); setQuip(m.quip, m.partner != null); scene();
    await play();
    if (!runningAll) break;
    await new Promise((r) => setTimeout(r, 600));
    if (flagging) await new Promise((r) => (afterFlag = r));
  }
  if (pos >= ALL.length) { pos = 0; keepPos(); }
  runningAll = false; allButtons();
}
function stopAll() { runningAll = false; allButtons(); }
$("playAll").onclick = () => { wake(); playAll(); };
$("stopAll").onclick = () => { stopAll(); stopSpeech(); };
$("restartAll").onclick = () => { wake(); pos = 0; keepPos(); playAll(); };
document.addEventListener("keydown", (e) => {
  if (e.code !== "Space" || e.repeat || flagging || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  e.preventDefault();
  if (runningAll) { stopAll(); stopSpeech(); } else { wake(); playAll(); }
});
allButtons();

/* ---------- the moments played ---------- */
let recent = [];
function remember(m) { recent = [m].concat(recent.filter((x) => keyOf(x) !== keyOf(m))).slice(0, 10); recentUI(); }
function recentUI() {
  $("recent").innerHTML = recent.map((m, i) => {
    const k = marks[keyOf(m)] || {}, cls = k.s === "bad" ? "bad" : k.s === "ok" ? "ok" : "";
    return `<li class="${cls}"><span class="mark">${k.s === "bad" ? "✗" : k.s === "ok" ? "✓" : "·"}</span>
      <span>${esc(nameOf(m))}: "${esc(m.quip)}"${k.s === "bad" && (k.tags || k.note) ? `<span class="note">${esc([...(k.tags || []), k.note].filter(Boolean).join(" · "))}</span>` : ""}</span>
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
  flagging = true; flagFor = m || current || (partnerOf() == null ? { hero: +$("hero").value, quip: quipOf() } : { hero: +$("hero").value, partner: partnerOf(), quip: quipOf() });
  const k = marks[keyOf(flagFor)] || {};
  $("flagWhat").textContent = `What's wrong with ${nameOf(flagFor)}'s "${flagFor.quip}"?`;
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
    const [who, quip] = [k.slice(0, k.indexOf("|")), k.slice(k.indexOf("|") + 1)];
    const ds = who.split("+").map(Number), name = ds.every((d) => HEROES[d]) ? ds.map((d) => HEROES[d].n).join(" & ") : who;
    return `- ${name}: "${quip}"${m.tags && m.tags.length ? " — " + m.tags.join(", ") : ""}${m.note ? ": " + m.note : ""}`;
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
    <p class="sub">Why: ${s.why.boss} boss finishes, ${s.why.captain} a captain's first, ${s.why.chance} by chance (one every ${s.chanceFloorsPer.toFixed(1)} floors; ${s.teamups} of them team-ups, ${s.why.chance ? Math.round(s.teamups / s.why.chance * 100) : 0}%; ${s.captainLines} captain lines, ${s.why.chance ? Math.round(s.captainLines / s.why.chance * 100) : 0}%), over ${s.runs} runs and ${s.floors} floors.</p>
    <h2>Moments per run</h2>${bars(Object.keys(dist).map(Number).sort((a, b) => a - b).map((n) => [`${n} moment${n === 1 ? "" : "s"}`, dist[n]]), s.runs)}
    <h2>Heroes</h2>${bars(HEROES.filter((h) => s.heroes[h.d]).map((h) => [h.n, s.heroes[h.d]]), s.moments)}
    <h2>Quips</h2>${bars(quips, s.moments)}`;
};

partnerOptions(); quipOptions(); scene(); reportUI();
