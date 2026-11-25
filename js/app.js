// Everything on screen: the game loop, the menu and players, and the attack animations.
// Problems, monsters, saving, sound and speech live in their own modules.
import { MON, svg, LOOKS, lookOf } from "./monsters.js";
import { spokenProblem, spokenFact } from "./problems.js";
import { BANDS, choose, factOf, record as recordAnswer, helpFor, openLevel, monsterHP, probeKey, tierOf, skipTo, SKIP_PROBES, SKIP_WINDOW, MAX_LEAP, fluentTime, spellKey } from "./learn.js";
import { hintFor, STRATEGIES } from "./hints.js";
import { openStore, displayName } from "./store.js";
import { PHRASE, monsterName, monsterCleared, monsterWon, heroJoins, heroCursed, heroRescue, heroAlmost, heroHelps, traitLine, BARK, wingCleared, wingOpened, depthLine, DEPTH_MAX_SPOKEN, reversedLine, howToWriteLine, quipLine } from "./lines.js";
import { WINGS, wingOf, runFloors, openWings, toOpen, floorStars, wingStars, depthScale, depthHP, deepest, MAP_DEPTHS } from "./wings.js";
import { missingOf, pickBlank, filled, spokenMissing, MISSING_SHARE } from "./missing.js";
import { coinsSvg, pileOf, coinOf } from "./coins.js";
import { read as readSigil, judge as judgeSigil } from "./sigil.js";
import { HANDWRITING } from "./handwriting.js";
import { traitOf, charged, prefers, hitBy, atHalf } from "./traits.js";
import { roster, mastery, meet, beat } from "./bestiary.js";
import { HEROES, CHALK, heroSvg, freePick, pickHero, curseCaptain, crackCurse, CURSE_HITS, resetTeam } from "./heroes.js";
import * as sfx from "./sfx.js";
import { say, stopSpeech, setVoice, speaking, cutOff } from "./speech.js";
import { freshState as freshMoments, freshRun, decide as decideMoment, joined, heardOf, nameLine } from "./moments.js";
import { playMoment } from "./slowmo.js";
import { playDescent, descending } from "./descent.js";

const $ = (id) => document.getElementById(id);
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// Fit the phone layout to the height Safari really shows. With iOS Safari's floating toolbar,
// 100dvh can include the strip behind it, which hid the number pad when the game wasn't on the
// Home Screen; visualViewport.height is what's visible. Re-measured when the toolbar or the
// orientation changes. styles.css uses it as --app-h.
function fitToScreen() {
  const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  document.documentElement.style.setProperty("--app-h", Math.round(h) + "px");
  if (layoutProbe) layoutProbe();
}
let layoutProbe = null;
fitToScreen();
addEventListener("resize", fitToScreen);
if (window.visualViewport) window.visualViewport.addEventListener("resize", fitToScreen);
addEventListener("orientationchange", () => setTimeout(fitToScreen, 300));

// ?layout shows what the phone reports, for fixing layout on a real device: the window and
// visible heights, 100dvh, the safe-area insets, where the number pad ends, and whether it's
// running from the Home Screen.
if (new URLSearchParams(location.search).has("layout")) {
  const box = document.createElement("pre");
  box.style.cssText = "position:fixed;left:4px;top:4px;z-index:99;margin:0;padding:6px 8px;font:12px/1.35 ui-monospace,monospace;background:#000d;color:#7fdc8a;border-radius:8px;pointer-events:none;white-space:pre";
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;left:0;top:0;width:1px;height:100dvh;visibility:hidden;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)";
  document.body.append(box, probe);
  layoutProbe = () => {
    const cs = getComputedStyle(probe), pad = document.getElementById("pad").getBoundingClientRect();
    const vv = window.visualViewport;
    box.textContent = [
      `innerHeight      ${innerHeight}`,
      `visualViewport   ${vv ? Math.round(vv.height) + " (top " + Math.round(vv.offsetTop) + ")" : "none"}`,
      `100dvh           ${Math.round(probe.getBoundingClientRect().height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom))}`,
      `safe-area top    ${cs.paddingTop}`,
      `safe-area bottom ${cs.paddingBottom}`,
      `--app-h          ${document.documentElement.style.getPropertyValue("--app-h")}`,
      `pad bottom       ${Math.round(pad.bottom)}`,
      `home screen      ${navigator.standalone || matchMedia("(display-mode: standalone)").matches}`,
      `body / .game     ${Math.round(document.body.getBoundingClientRect().height)} / ${Math.round(document.querySelector(".game").getBoundingClientRect().height)}`,
      `rows             ${getComputedStyle(document.querySelector(".game")).gridTemplateRows.replace(/px/g, "").split(" ").map((n) => Math.round(n)).join(" ")}`,
      ...["header", ".mhead", ".stage", "#mon", "#hint", ".probrow", "#ans", "#pad", ".you"].map((sel) => {
        const el = document.querySelector(sel), r = el.getBoundingClientRect();
        return `${sel.padEnd(16)} ${el.hidden ? "hidden" : Math.round(r.top) + "–" + Math.round(r.bottom) + " (" + Math.round(r.height) + ")"}`;
      })
    ].join("\n");
  };
  setTimeout(layoutProbe, 500);
  addEventListener("click", () => setTimeout(layoutProbe, 400));
}
// ?audio shows what Safari reports about the sound effects (Web Audio), with a button to test
// one, for fixing sound on a real device. The voice uses an <audio> element instead.
if (new URLSearchParams(location.search).has("audio")) {
  const box = document.createElement("div");
  box.style.cssText = "position:fixed;left:4px;top:4px;z-index:99;padding:6px 8px;font:12px/1.35 ui-monospace,monospace;background:#000d;color:#7fdc8a;border-radius:8px;white-space:pre";
  const out = document.createElement("div"), test = document.createElement("button");
  test.textContent = "Test sound"; test.style.cssText = "margin-top:6px;font:inherit;padding:4px 10px";
  test.onclick = () => { sfx.cleared(); setTimeout(show, 300); };
  box.append(out, test); document.body.append(box);
  const show = () => {
    const s = sfx.status();
    out.textContent = [`context   ${s.state}`, `rate      ${s.rate}`, `sfx on    ${s.on}`, `played    ${s.played}`, `gestures  ${s.gestures}`, `session   ${(navigator.audioSession || {}).type || "n/a"}`, `error     ${s.error || "none"}`,
      `browser   ${navigator.userAgent.replace(/.*(Version\/[\d.]+).*(Safari)\/[\d.]+.*/, "$2 $1").slice(0, 40)}`].join("\n");
  };
  show(); setInterval(show, 1000);
}
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// localStorage can be missing or throw (private browsing); then progress lasts this visit only.
function safeStorage() {
  try { const ls = window.localStorage; ls.getItem("sumgeon:"); return ls; } catch (e) {
    const m = new Map();
    return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k),
      key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; } };
  }
}
const store = openStore(safeStorage());
store.upgrade();

/* ---------- the player ---------- */
// team: { captain: digit or null, color: chalk color, rescued: [digits] } (DESIGN.md §6.6).
// progress: { [wingId]: { boss: wins, best: floors } }.
// seen: the Bestiary, { [monster]: { met, beaten } }.
let PID, st, recs, team, progress, seen;
const band = () => BANDS[st.band] || BANDS.sprout;
const wingFor = (b) => WINGS.find((w) => w.band === b) || WINGS[0];
const wing = () => wingFor(st.band);
// A floor's art: a cursed digit is its hero, darkened (DESIGN.md §6.6).
const cracksOf = (d) => (team.cracks || {})[d] || 0;
const monsterArt = (m, cls) => (m.cursed != null ? heroSvg(HEROES[m.cursed], { cursed: true, cls, cracks: cracksOf(m.cursed) }) : svg(m, cls));
// The dungeon's version, while we're before release. Bump it when a balance change (how fast heroes are freed, how strata
// open) means saved runs should start over: each player's dungeon progress then resets the next
// time they load, keeping what they've learned, their hero and their settings.
// After release, a bump would wipe kids' real progress, so it should stop changing then.
//   2 (2026-11-25): breaking a curse takes three wins.
//   3 (2026-11-25): placement, skipping ahead and the "all fast" star. Also resets what's
//      been learned (LEARNING_RESETS), since it changes how learning is counted.
//   4 (2026-11-25): fluent time scales with digits (4 s + 1 s a digit), skipping tolerates a
//      slip. Resets learning too: facts counted slow under 3 s weren't slow.
const DUNGEON_VERSION = 4, DUNGEON_KEYS = ["wings", "bestiary", "best"], LEARNING_RESETS = [3, 4];
function upgradeDungeon(id) {
  const p = store.player(id), had = p.get("dungeon", null);
  if (had === DUNGEON_VERSION) return;
  // A brand-new player has nothing to reset.
  if (had !== null || p.get("wings", null) || p.get("bestiary", null)) {
    p.set("heroes", resetTeam(Object.assign({ captain: null, color: CHALK[0], rescued: [] }, p.get("heroes", {}))));
    DUNGEON_KEYS.forEach((k) => p.clear(k));
    // Versions that change how learning counts reset it too, so everyone starts fresh.
    if (LEARNING_RESETS.some((v) => v > (had || 1))) p.clear("facts");
  }
  p.set("dungeon", DUNGEON_VERSION);
}
function loadPlayer() {
  PID = store.active();
  upgradeDungeon(PID);
  st = store.settings(PID);
  recs = store.player(PID).get("facts", {}) || {};
  team = Object.assign({ captain: null, color: CHALK[0], rescued: [] }, store.player(PID).get("heroes", {}));
  progress = store.player(PID).get("wings", {}) || {};
  seen = store.player(PID).get("bestiary", {}) || {};
  MS = freshMoments(store.player(PID).get("moments", null));
  // A captain picked before heroes could change stays on the team.
  if (team.captain != null && !team.rescued.includes(team.captain)) { team.rescued.push(team.captain); saveTeam(); }
  // The band a player started in opens its Wing from the start (DESIGN.md §4).
  if (!st.start) { st.start = st.band; saveSettings(); }
  if (!openWings(progress, recs, st.start).includes(wingFor(st.band).id)) { st.band = WINGS[0].band; saveSettings(); }
  sfx.setSfx(st.sfx);
  setVoice(st.voice);
  whoUI(); captainUI();
}
function saveTeam() { store.player(PID).set("heroes", team); }
// The voice explains a thing only the first time or first few (`times`): true while it still
// should, counting this time. Saved per player as told: { tag: count }.
function once(tag, times = 1) {
  const told = store.player(PID).get("told", {}) || {};
  if ((told[tag] || 0) >= times) return false;
  told[tag] = (told[tag] || 0) + 1;
  store.player(PID).set("told", told);
  return true;
}
// The voice's live check (speech.js): a line about problem p plays only while p is still being worked on.
const asked = (p) => () => G.cur === p && !G.busy;
const hasCaptain = () => team.captain != null;
// The dungeon has no progress yet (nothing played in any stratum): any hero can start.
const fresh = () => !Object.keys(progress || {}).length;
// A digit fights as its hero once it has joined: the captain, or a rescued digit.
const onTeam = (d) => d === team.captain || team.rescued.includes(d);
const heroArt = (d, cls) => heroSvg(HEROES[d], { color: d === team.captain ? team.color : null, cls });
// The captain beside the hearts, and in "Playing as".
function captainUI() {
  const c = $("captainMini");
  c.innerHTML = hasCaptain() ? heroArt(team.captain) : "";
  c.setAttribute("aria-label", hasCaptain() ? `Your captain, ${HEROES[team.captain].n}` : "You");
  c.classList.toggle("none", !hasCaptain());
}
function saveSettings() { store.player(PID).set("settings", st); }

const SPEAKER = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
const GEAR = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/><circle cx="12" cy="12" r="6.5"/></svg>';
$("sayProb").innerHTML = SPEAKER;
$("sayProb").onclick = () => {
  if (!G.cur) return;
  if (G.cur.fact) say("q", spokenMissing(G.cur), true);
  else say("q", spokenProblem(G.cur), true);
};

function whoUI() {
  const list = store.profiles(), w = $("who");
  w.hidden = list.length < 2;
  w.innerHTML = `Playing as ${hasCaptain() ? `<span class="who-cap">${heroArt(team.captain)}</span>` : ""}<b>${esc(displayName(list, PID))}</b>`;
}

/* ---------- the run ---------- */
// retry: missed facts waiting to come back ({ key, after: problems to go }); recent: the last few
// keys, so a fact doesn't repeat right away; hinted: a hint is open for this problem.
let G = { floor: 0, hearts: 5, hp: 0, max: 0, streak: 0, solved: 0, tries: 0, cur: null, input: "", busy: true, running: false,
  retry: [], recent: [], hinted: false, t0: 0, next: false };

function heartsUI(cracking) {
  const h = $("hearts");
  h.innerHTML = "";
  const max = band().hearts;
  for (let i = 0; i < max; i++) {
    const s = document.createElement("span");
    s.textContent = "♥";
    if (i === cracking) s.className = "crack";
    else if (i >= G.hearts) s.className = "gone";
    h.appendChild(s);
  }
  h.setAttribute("aria-label", `${G.hearts} of ${max} hearts`);
}
function hpUI() { $("hpBar").style.width = Math.max(0, G.hp / G.max * 100) + "%"; $("hpTxt").textContent = `${Math.max(0, G.hp)} / ${G.max} HP`; }

// The streak flame: shows once crits are on (3 in a row) and grows at 5 and 10.
const FLAME = '<svg viewBox="0 0 24 30" aria-hidden="true"><path d="M12 1c1 7 8 10 8 18a8 8 0 0 1-16 0c0-4 2-6 4-8 0 3 1 5 3 5-1-5 1-10 1-15z" fill="#ff5a4e" stroke="#0c171c" stroke-width="2" stroke-linejoin="round"/><path d="M12 13c1 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 1 1 2 2 2-.5-2 0-4 0-6z" fill="#ffc93c"/></svg>';
function streakUI() {
  const f = $("flame");
  if (G.streak < 3) { f.hidden = true; return; }
  f.hidden = false;
  f.className = "flame" + (G.streak >= 10 ? " s3" : G.streak >= 5 ? " s2" : "");
  f.innerHTML = FLAME + `<span>${G.streak} in a row</span>`;
  f.setAttribute("aria-label", `${G.streak} in a row, critical hits`);
}
function setMsg(t, c = "") { const m = $("msg"); m.textContent = t; m.className = "msg " + c; }
function ansUI() {
  $("ans").textContent = G.input;
  // A missing-number problem fills its □ as you type.
  if ($("blank")) { $("blank").textContent = G.input || "?"; $("blank").classList.toggle("typed", !!G.input); }
}
// The problem as shown: "3 + 4 =", or with a glowing □ for a missing number ("3 + □ = 7").
function probUI() {
  const p = G.cur, box = $("prob");
  if (p.blank || p.sym || p.op === "=") box.innerHTML = esc(p.q).replace("□", '<span class="blank" id="blank">?</span>');
  // "How many quarters?": the pile, then "quarters = ?" with a □ that fills as you type, as a
  // missing number does, under the pile (styles.css .game.find), so it fits a phone.
  else if (p.op === "¢" && p.find) box.innerHTML = coinsSvg(p.pile) + `<span class="find">${coinOf(p.find).names} = <span class="blank" id="blank">?</span></span>`;
  else if (p.op === "¢") box.innerHTML = coinsSvg(p.pile) + " =";
  else box.textContent = p.q + " =";
  document.querySelector(".game").classList.toggle("missing", !!p.blank || !!p.sym || p.op === "=" || !!p.find);
  padUI(p.spell ? "spell" : p.sym ? "cmp" : "num");
  document.querySelector(".game").classList.toggle("cents", p.op === "¢" && !p.find);
  document.querySelector(".game").classList.toggle("find", !!p.find);
}
// The facts a monster asks: its own strand (Trollar's coins) or the player's band.
const strandOf = (m) => m.strand || st.band;
// A problem with its answer, for the miss message and the Oops card: "3 + 4 = 7", "3 + 4 = 7"
// for 3 + □ = 7, and "10 + 5 + 1 = 16¢" for coins (just "16¢" for one coin, "2 dimes" for
// finding them).
function shownFact(p, ans) {
  if (p.sym) return p.q.replace("□", typeof ans === "string" && ans.startsWith("<b>") ? `<b>${esc(p.sym)}</b>` : p.sym);
  if (p.blank || p.op === "=") return filled(p, ans);
  if (p.op === "¢" && p.find) return `${ans} ${p.ans === 1 ? coinOf(p.find).name : p.q}`;
  if (p.op === "¢") return (p.q.includes("+") ? p.q + " = " : "") + ans + "¢";
  return `${esc(p.q)} = ${ans}`;
}
// The fact whose hint helps: for 3 + □ = 7 that's 7 − 3.
const hintFact = () => G.cur.inverse || G.cur;

// A fresh run through the current Wing: its floors, with this player's rescue floor.
// The dive, down the side of the monster's box: every depth of this stratum from the top, the
// ones cleared filled in, this run's depth marked, and two still below. It scrolls, and opens
// with this run's depth in the middle. Dots on phones; with numbers on wider screens.
// A depth's score: the most stars earned in one run at it, of the most a run can earn.
const depthScore = (w, n) => ({ got: ((progress[w.id] || {}).depthStars || {})[n] || 0, max: wingStars(w, progress).max });
function diveUI() {
  const d = G.depth, w = wing(), last = Math.max(MAP_DEPTHS, d + 2), rows = [];
  for (let n = 1; n <= last; n++) {
    const sc = depthScore(w, n), score = sc.got ? `<small>★${sc.got}</small>` : "";
    rows.push(`<li class="${n < d ? "done" : n === d ? "now" : ""}" data-n="${n}" data-score="${sc.got}" data-max="${sc.max}"><i></i><span>${n}</span>${score}</li>`);
  }
  const box = $("dive");
  box.innerHTML = rows.join("");
  box.setAttribute("aria-label", `Depth ${d} of your dive into ${wing().name}`);
  requestAnimationFrame(() => { const now = box.querySelector(".now"); if (now) box.scrollTop = now.offsetTop - box.clientHeight / 2 + now.offsetHeight / 2; });
}
// Tapping a depth on the dive (on phones, where the scores don't fit) shows its score in a bubble.
$("dive").addEventListener("click", (e) => {
  const li = e.target.closest("li"), tip = $("diveTip");
  if (!li) return;
  const n = +li.dataset.n, got = +li.dataset.score;
  tip.textContent = got ? `Depth ${n}: ★ ${got} of ${li.dataset.max}` : n < G.depth ? `Depth ${n}: cleared` : n === G.depth ? `Depth ${n}: you're here` : `Depth ${n}: not yet`;
  const r = li.getBoundingClientRect();
  tip.style.left = Math.round(r.right + 6) + "px"; tip.style.top = Math.round(r.top + r.height / 2) + "px";
  tip.hidden = false; clearTimeout(tip.t); tip.t = setTimeout(() => (tip.hidden = true), 1800);
});
// depth: how deep into this Wing (wings.js); the deepest reached when not given.
function newRun(depth) {
  document.body.dataset.stratum = wing().id; // its wall and colors (styles.css)
  G.depth = depth || deepest(wing(), progress); G.floors = runFloors(wing(), team, null, G.depth);
  diveUI();
  // The room darkens as you go deeper: 8% per depth, up to 48% at depth 7.
  document.querySelector(".game").style.setProperty("--murk", Math.min(0.48, 0.08 * (G.depth - 1)).toFixed(2));
}
// Bosses roar every so often while you're working on a problem: a growl, and they rear up and
// shake while the room flickers. Never during an attack, a card, a hint or the pause.
let roarTimer = null;
function roarSoon() {
  clearTimeout(roarTimer);
  const m = G.floors && G.floors[G.floor];
  if (!m || !m.boss) return;
  roarTimer = setTimeout(() => {
    if (!G.running) return; // the run is over: no more roars until the next boss
    if (!G.busy && !G.next && !G.paused && $("ov").hidden && G.hp > 0 && G.floors[G.floor] === m) {
      sfx.roar();
      if (!reduced()) { restartAnim($("mon"), "roar"); restartAnim($("arena"), "rumble"); setTimeout(() => { $("mon").classList.remove("roar"); $("arena").classList.remove("rumble"); }, 1300); }
    }
    roarSoon();
  }, 9000 + Math.random() * 6000);
}
function loadMonster(i, quiet) {
  const m = G.floors[i];
  G.floor = i;
  roarSoon();
  // Deeper floors are tougher: about 80% of the usual HP on floor 1, up to 130% for the boss.
  G.max = G.hp = Math.round(monsterHP(m, strandOf(m), recs) * depthScale(i, G.floors.length) * depthHP(G.depth));
  const el = $("mon");
  el.className = "mon";
  el.innerHTML = monsterArt(m);
  $("mName").textContent = m.n;
  $("mName").classList.toggle("long", m.n.length > 13); // a long look name (Professor Minustaur) shrinks to fit
  // The trait badge, and what it does under the monster as it arrives.
  const t = traitOf(m), badge = $("trait");
  badge.hidden = !t;
  if (t) { badge.textContent = `${t.icon} ${t.name}`; badge.title = t.text; }
  G.onFloor = 0; G.halved = false; G.floorLost = 0; G.floorStreak = 0; G.floorSlow = false; G.barked = {};
  if (!quiet) setMsg(t ? `${t.icon} ${t.name}: ${t.text}` : "Your answer is your attack.");
  $("floorLbl").textContent = (G.depth > 1 ? `Depth ${G.depth} · ` : "") + (m.boss ? "Boss floor" : m.cursed != null ? "Rescue floor" : `Floor ${i + 1} / ${G.floors.length}`);
  hpUI(); heartsUI(); streakUI();
  if (quiet) return;
  meet(seen, m, Date.now()); store.player(PID).set("bestiary", seen);
  sfx.appear(m.boss);
  if (m.boss) say("p", PHRASE.boss);
  say("m", monsterName(m));
  // The rescue floor says who you're freeing; a trait says what it does, the first times you meet it.
  if (m.cursed != null) say("p", heroRescue(HEROES[m.cursed]));
  if (t && once("trait:" + t.name, 2)) say("p", traitLine(m));
}
// The next problem, chosen by the learning engine (learn.js): a missed fact when it's due back,
// otherwise learning, review or new facts, with the monster's operation preferred.
function newProblem() {
  G.next = false;
  G.retry.forEach((r) => r.after--);
  const due = G.retry.find((r) => r.after <= 0);
  if (due) G.retry.splice(G.retry.indexOf(due), 1);
  const m = G.floors[G.floor];
  // Skipping ahead: while you answer fluently, each problem is a probe from a tier above.
  // And not the same kind of problem with the same answer as the last two, when there's a choice.
  const bk = strandOf(m), f = flowOf(bk), avoidAns = G.recentAns || [], op = m.op === "mix" || m.strand ? null : m.op;
  // Spell casting: about 1 problem in 6 is drawn as a sigil instead of typed (touch screens;
  // ?spells for every one): a fact already learned with a one-digit answer. It's picked before
  // probing, since a fluent player is probing nearly every problem and would never get one.
  const spellTurn = !due && !m.blank && canSpell() && (SPELLS_ALWAYS || Math.random() < SPELL_SHARE);
  const spell = spellTurn ? spellKey(bk, recs, { recent: G.recent, avoidAns, op }) : null;
  const probe = !due && !spell && f.on && f.cool <= 0 ? probeKey(bk, recs, null, G.recent, avoidAns, f.leap) : null;
  const key = spell || probe || choose(bk, recs, { now: Date.now(), recent: G.recent, retry: due ? due.key : null, op, like: prefers(m), depth: G.depth, avoidAns,
    // The captain's digit: held back in the first fight, then about a third of problems lean to it
    // until the captain's first moment has happened (captainLean).
    digit: team.captain, digitShare: captainLean() ? CAPTAIN_BIAS : 0, avoidDigitShare: firstFight() ? CAPTAIN_HOLD : 0 });
  // Charge (Minustaur): every 4th problem on the floor, a miss costs 2 hearts.
  G.charged = charged(m, G.onFloor++);
  $("charge").hidden = !G.charged;
  if (G.charged) { sfx.charge(); say("p", PHRASE.charged, false, () => G.charged && !G.busy); }
  G.cur = factOf(key);
  G.cur.probe = !!probe;
  G.recentAns = [G.cur.op + " " + G.cur.ans].concat(G.recentAns || []).slice(0, 2);
  // Quizard hides a number in every problem; other monsters sometimes do, for facts in review.
  const rec = recs[key];
  // (Not for a strand's facts: coins can't hide a number, and two-digit ones aren't recorded that way.)
  if (!spell && !m.strand && "+-×÷".includes(G.cur.op) && (m.blank || (rec && rec.b >= 3 && Math.random() < MISSING_SHARE))) G.cur = missingOf(G.cur, pickBlank());
  // ?spells makes every one-digit problem a spell, for testing.
  const digit = !G.cur.sym && Number.isInteger(G.cur.ans) && G.cur.ans >= 0 && G.cur.ans <= 9;
  G.cur.spell = !!spell || (SPELLS_ALWAYS && canSpell() && !probe && digit);
  G.spellFails = 0;
  // Coins lie as they fall: sides at random (a single coin shows the side asked), a pile shuffled.
  if (G.cur.op === "¢") G.cur.pile = pileOf(G.cur, Math.random);
  G.recent = [key].concat(G.recent).slice(0, 3);
  G.input = ""; G.busy = false; G.hinted = false; G.t0 = performance.now();
  probUI();
  // Coins ("How many dimes?") and comparisons can't be read off the screen by a pre-reader, so
  // the voice reads them, after the monster's name. Skipped if it's answered first.
  if (G.cur.op === "¢" || G.cur.op === "○") say("q", spokenProblem(G.cur), false, asked(G.cur));
  // The first comparison: how the < = > keys work.
  if (G.cur.op === "○" && once("compare")) { say("p", PHRASE.cmpHow, false, asked(G.cur)); say("p", PHRASE.cmpSame, false, asked(G.cur)); }
  if (G.cur.spell) {
    setMsg("Cast a spell! Draw the answer.", "good"); say("p", PHRASE.spell);
    if (once("spell", 3)) say("p", PHRASE.spellHow, false, asked(G.cur)); // the first few spells
  }
  ansUI();
  if ($("msg").classList.contains("bad")) setMsg("Your answer is your attack.");
  showHelp(helpFor(recs[key]));
}
function pop(t, crit) {
  const s = document.createElement("span");
  s.className = "pop" + (crit ? " crit" : "");
  s.textContent = t;
  $("fx").appendChild(s);
  setTimeout(() => s.remove(), 950);
}
function restartAnim(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

/* ---------- the attack: the answer flies at the monster ---------- */
function centerOf(el) { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }

// Your answer summons its digits (DESIGN.md §6.6): each digit lifts out of the answer box and
// arcs into the monster, one after another, leaving chalk dust. A digit on your team flies as
// its hero; the others fly as plain chalk numbers. Resolves when the last one lands. With
// reduced motion they land at once.
function fly(text, crit) {
  if (reduced()) return Promise.resolve();
  // From the answer box, or from the □ when the problem has one (the answer box hides then).
  const from = $("blank") && $("blank").offsetParent ? $("blank") : $("ans");
  const layer = $("fly"), a = centerOf(from), b = centerOf($("mon")), n = text.length;
  return Promise.all([...text].map((ch, i) => new Promise((done) => {
    const d = Number(ch), s = document.createElement("span");
    if (onTeam(d)) { s.className = "shot hero"; s.innerHTML = heroArt(d); }
    else { s.className = "shot" + (crit ? " crit" : ""); s.textContent = ch; }
    layer.appendChild(s);
    const w = s.offsetWidth, h = s.offsetHeight, spread = (i - (n - 1) / 2) * 44;
    const p0 = { x: a.x + spread - w / 2, y: a.y - h / 2 }, p1 = { x: b.x + spread * 0.4 - w / 2, y: b.y - h / 2 };
    const c = { x: (p0.x + p1.x) / 2 + (p1.x - p0.x) * 0.15, y: Math.min(p0.y, p1.y) - 90 };
    const frames = [];
    for (let k = 0; k <= 10; k++) {
      const t = k / 10, u = 1 - t;
      const x = u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, y = u * u * p0.y + 2 * u * t * c.y + t * t * p1.y;
      frames.push({ transform: `translate(${x}px,${y}px) scale(${1 + 0.35 * Math.sin(Math.PI * t) - 0.25 * t}) rotate(${t * (onTeam(d) ? 360 : 18)}deg)` });
    }
    const anim = s.animate(frames, { duration: 360, delay: i * 110, easing: "ease-in", fill: "backwards" });
    let dust = null;
    setTimeout(() => {
      dust = setInterval(() => {
        const r = s.getBoundingClientRect(), p = document.createElement("span");
        p.className = "dust";
        layer.appendChild(p);
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        p.animate([{ transform: `translate(${x}px,${y}px) scale(1)`, opacity: 0.7 }, { transform: `translate(${x}px,${y + 10}px) scale(.2)`, opacity: 0 }], { duration: 420 }).onfinish = () => p.remove();
      }, 30);
    }, i * 110);
    anim.onfinish = () => { clearInterval(dust); s.remove(); done(); };
  })));
}

// The captain's digit in the answer is a power hit, +50% (rescued heroes: momentBoost, below).
function heroBonus(typed) {
  const power = hasCaptain() && [...typed].map(Number).includes(team.captain);
  return { mult: power ? 1.5 : 1, power };
}
// Rescued heroes hit harder only in a Hero Moment (settled 2026-11-25; they used to add 10% to
// every answer with their digit, which nobody noticed): +25% for each rescued hero in the moment
// (a team-up can have two). The captain's power hit is separate and unchanged.
const MOMENT_BOOST = 0.25;
function momentBoost(mo) {
  if (!mo) return 0;
  return [mo.hero, mo.partner].filter((d) => d != null && d !== team.captain && team.rescued.includes(d)).length;
}
/* ---------- Hero Moments (DESIGN.md §8.4) ----------
   Now and then a hero in a right answer gets a slow-motion close-up and a quip before it strikes
   (when: moments.js decide; the show: slowmo.js). Never in a player's first fight; always on a
   freed hero's debut and on the blow that finishes a boss. ?moments makes every qualifying hit
   one, for testing; ?teamup does too, and makes every one with two heroes' digits a team-up.
   Input waits until it's over (G.busy stays set through the hit). */
const TEAMUP_ALWAYS = new URLSearchParams(location.search).has("teamup"), MOMENTS_ALWAYS = TEAMUP_ALWAYS || new URLSearchParams(location.search).has("moments");
let MS = freshMoments(), MR = freshRun();
function momentFor(typed, critStart, bossFinish) {
  const sp = G.cur.spell ? (G.cur.reversed ? "backwards" : G.cur.howTo ? "show" : "good") : null;
  const first = firstFight(); // nothing beaten yet: the first fight
  const mo = decideMoment(MS, MR, { typed, team, hinted: G.hinted, spell: sp, first, floor: G.floor, n: G.tries, bossFinish, critStart, always: MOMENTS_ALWAYS, teamup: TEAMUP_ALWAYS });
  if (mo) store.player(PID).set("moments", MS);
  return mo;
}
// Plays it: the hero (or a team-up's two) takes the slow-motion turn, and the answer's other
// digits fly at the snap. Resolves at the hit.
function heroMoment(mo, typed, crit) {
  let rest = typed.replace(String(mo.hero), "");
  if (mo.partner != null) rest = rest.replace(String(mo.partner), "");
  const from = $("blank") && $("blank").offsetParent ? $("blank") : $("ans");
  const colorOf = (d) => (d === team.captain ? team.color : null);
  return playMoment({ hero: mo.hero, partner: mo.partner, color: colorOf(mo.hero), partnerColor: mo.partner != null ? colorOf(mo.partner) : null, quip: mo.quip,
    before: () => speaking() ? cutOff(sfx.scratch, sfx.SCRATCH_AT, sfx.SCRATCH) : null,
    speak: () => say("h", quipLine(mo.quip), true), from, to: $("mon"), room: document.querySelector(".game"),
    reduced: reduced(), onSnap: () => { if (rest) fly(rest, crit); } });
}
// Chalk sparks bursting from the monster on impact.
function burst(crit) {
  if (reduced()) return;
  const c = centerOf($("mon")), layer = $("fly"), n = crit ? 16 : 10;
  for (let i = 0; i < n; i++) {
    const p = document.createElement("span");
    p.className = "spark" + (crit ? (i % 2 ? " c" : "") : (i % 3 ? "" : " w"));
    layer.appendChild(p);
    const ang = Math.random() * Math.PI * 2, d = 40 + Math.random() * (crit ? 90 : 60);
    p.animate([
      { transform: `translate(${c.x}px,${c.y}px) scale(1)`, opacity: 1 },
      { transform: `translate(${c.x + Math.cos(ang) * d}px,${c.y + Math.sin(ang) * d}px) scale(.3)`, opacity: 0 }
    ], { duration: 450 + Math.random() * 250, easing: "cubic-bezier(.2,.8,.4,1)" }).onfinish = () => p.remove();
  }
}

/* ---------- hints (DESIGN.md §5.3) ----------
   A new fact shows its model by itself; a fact being learned gets a 💡 button; a fact in review
   gets nothing. After a miss, the worked example stays up until "Got it". A hinted answer still
   hits, but doesn't build the streak or count toward mastery. */
// A new fact's hint waits a moment (NEW_HINT_MS), so a player who already knows it can answer
// first and get the credit (placement, learn.js record); until then 💡 offers it.
const NEW_HINT_MS = 3500;
let hintTimer = null;
function showHelp(mode) {
  clearTimeout(hintTimer);
  $("hintBtn").hidden = mode === "none";
  $("hint").hidden = true;
  // Not if they've started typing (or drawing a spell): they aren't stuck, and the hint opening
  // would move things under their fingers.
  if (mode === "show") { const cur = G.cur; hintTimer = setTimeout(() => { if (G.cur === cur && !G.busy && !G.hinted && G.input === "" && !(typeof strokes !== "undefined" && strokes.length)) openHint(); }, NEW_HINT_MS); }
}
function openHint() {
  const h = hintFor(hintFact(), false), box = $("hint");
  box.innerHTML = `<div class="model">${h.model}</div><p class="hsay">${esc(h.say)}</p>`;
  box.hidden = false;
  $("hintBtn").hidden = true;
  G.hinted = true;
}
// After a miss: the worked example as a card over the game, "Oops!" and the right answer with
// the drawing, until "Got it" (or Enter, on the focused button).
function openWorked() {
  const h = hintFor(hintFact(), true);
  $("hint").hidden = true; $("hintBtn").hidden = true;
  show(`<div class="worked"><h2>Oops!</h2>
    <p class="worked-fact">${shownFact(G.cur, `<b>${G.cur.ans}</b>`)}</p>
    <div class="model">${h.model}</div><p class="hsay">${esc(h.say)}</p>
    <div class="btns"><button class="big" type="button" id="gotIt">Got it</button></div></div>`, "float");
  $("gotIt").onclick = nextAfterMiss;
}
$("hintBtn").onclick = () => { if (!G.busy) openHint(); };

// Saves the answer to the fact's record; says so when it opens a new level.
// Returns what to say about it: a skip ahead, a new level, or nothing. A drawn answer (a spell)
// is writing practice: it changes no record, timing, placement, skipping or the "all fast" star.
function learnFrom(ok) {
  if (G.cur.spell) return null;
  const bk = strandOf(G.floors[G.floor]), b = BANDS[bk], key = G.cur.key, ms = performance.now() - G.t0;
  // Fluent: right, unhinted and quick, with a second more for each extra digit to tap.
  const limit = fluentTime(b.fluentMs, G.cur.sym || G.cur.ans);
  const before = openLevel(bk, recs), fluent = ok && !G.hinted && ms < limit, f = flowOf(bk);
  recs[key] = recordAnswer(recs[key], { ok, ms, hinted: G.hinted, now: Date.now(), fluentMs: limit });
  // Skipping ahead: SKIP_PROBES fluent of the last SKIP_WINDOW probes, and everything below the
  // probe's tier is known. Two slips in that window pause probing for a few problems.
  let skipped = 0;
  if (G.cur.probe) {
    f.hist = [fluent].concat(f.hist).slice(0, SKIP_WINDOW);
    if (fluent && f.hist.filter(Boolean).length >= SKIP_PROBES) { skipped = skipTo(bk, recs, tierOf(bk, key), Date.now(), b.fluentMs); f.hist = []; f.leap = Math.min(MAX_LEAP, f.leap * 2); }
    else if (f.hist.filter((x) => !x).length >= 2) { f.cool = 3; f.hist = []; f.on = false; f.leap = 1; }
  }
  f.fluent = fluent ? f.fluent + 1 : 0;
  if (f.fluent >= 2) f.on = true; // probing starts after two fluent answers, and keeps going
  if (!fluent) G.floorSlow = true; // the "all fast" star (wings.js floorStars)
  f.cool--;
  store.player(PID).set("facts", recs);
  if (skipped) { say("p", PHRASE.skip); return "Skipping ahead! You already know these."; }
  const after = openLevel(bk, recs);
  if (after > before) { say("p", BARK.level); return `New level: ${b.levels[after].name}!`; }
  return null;
}

function submit() {
  if (G.next) return nextAfterMiss();
  if (G.busy || G.input === "") return;
  G.tries++;
  // A comparison's answer is its symbol (<, = or >); everything else is a number.
  if (G.cur.sym ? G.input === G.cur.sym : Number(G.input) === G.cur.ans) {
    G.busy = true; G.solved++;
    if (!G.hinted) G.streak++;
    G.floorStreak = Math.max(G.floorStreak, G.streak);
    // A comparison hits with the bigger number (Chompers eats it), so its digits are what fly.
    const typed = G.cur.sym ? String(G.cur.ans) : G.input, crit = G.streak >= 3, bonus = heroBonus(typed), m = G.floors[G.floor];
    // The monster's trait: Lucky Number, Ten Smash, Armor (traits.js).
    const trait = hitBy(m, G.cur.ans, typed, G.halved);
    // A spell drawn backwards fizzles at half damage.
    let dmg = Math.max(1, Math.round(G.cur.ans * (crit ? 2 : 1) * trait.mult * bonus.mult * (G.cur.reversed ? 0.5 : 1)));
    const level = learnFrom(true);
    G.input = ""; ansUI();
    $("hint").hidden = true; $("hintBtn").hidden = true;
    sfx.launch(G.streak);
    const critsNow = G.streak === 3 && !G.hinted;
    if (critsNow) say("p", PHRASE.crits);
    // Now and then a Hero Moment: a slow-motion close-up and a quip before the hit (moments.js).
    // A rescued hero in it adds MOMENT_BOOST (momentBoost).
    const mo = momentFor(typed, critsNow, !!m.boss && G.hp - dmg <= 0), boost = momentBoost(mo);
    if (boost) dmg = Math.round(dmg * (1 + MOMENT_BOOST * boost));
    const momentName = mo ? HEROES[mo.hero].n + (mo.partner != null ? " & " + HEROES[mo.partner].n : "") : "";
    (mo ? heroMoment(mo, typed, crit) : fly(typed, crit)).then(() => {
      if (!mo) sfx.impact(crit); // a moment lands with its own, bigger impact and shake
      burst(crit);
      G.hp -= dmg;
      pop((boost ? "Hero! " : bonus.power ? "Power! " : crit ? "Crit! " : "") + "−" + dmg, crit || bonus.power || !!boost);
      restartAnim($("mon"), "hit");
      if (crit && !mo) restartAnim($("arena"), "shake");
      setMsg(G.cur.reversed ? `Your ${G.cur.ans} is facing backwards. It faces this way → Half damage: ${dmg}` : G.cur.howTo ? `Here's how to write it. Hit for ${dmg}!` : level ? level : trait.note ? `${trait.note}: ${dmg}!` : boost ? `${momentName} hero hit for ${dmg}!` : bonus.power ? `${HEROES[team.captain].n} power hit for ${dmg}!` : crit ? `Critical hit for ${dmg}!` : `Hit for ${dmg}!`, "good");
      hpUI(); streakUI();
      // Half HP: Divvy splits in two, Sigma Rex armors up (traits.js).
      const half = !G.halved && G.hp > 0 && G.hp <= G.max / 2 ? atHalf(m) : null;
      if (!G.halved && G.hp <= G.max / 2) G.halved = true;
      if (half) {
        setMsg(half.note, "good");
        if (half.split) { $("mon").innerHTML = `<div class="split">${monsterArt(m)}${monsterArt(m)}</div>`; }
      }
      // One short bark for what this hit did, at most: the half-HP change, the trait, or a power
      // hit, each once a floor. None when something else was just said (a new level, skipping
      // ahead, a backwards spell, or "Critical hits!", unless it's the half-HP change, which only
      // happens once).
      const bark = half ? (half.split ? "split" : "second") : trait.mult > 1 ? "double" : trait.mult < 1 ? "half" : bonus.power ? "power" : null;
      if (bark && !level && (half || !critsNow) && !G.cur.reversed && !G.cur.howTo && !G.barked[bark]) { G.barked[bark] = true; say("p", BARK[bark]); }
      if (G.hp <= 0) { setTimeout(() => { $("mon").className = "mon dead"; }, 300); setTimeout(cleared, 1100); }
      else setTimeout(newProblem, level ? 1200 : 450);
    });
  } else miss("Oops!");
}

// A wrong answer: the monster lunges, a heart cracks off, the right answer is shown
// and said with the worked example, and the fact comes back 2–4 problems later.
function miss(why) {
  G.busy = true; G.streak = 0;
  // A charged problem (Minustaur) costs 2 hearts.
  const cost = G.charged ? 2 : 1;
  G.hearts = Math.max(0, G.hearts - cost);
  G.floorLost += cost;
  const lost = G.hearts;
  learnFrom(false);
  // after counts down at each new problem, so 3–5 means 2–4 other problems in between.
  G.retry = G.retry.filter((r) => r.key !== G.cur.key).concat([{ key: G.cur.key, after: 3 + Math.floor(Math.random() * 3) }]);
  if (cost > 1) sfx.thunder(); else sfx.miss(); // a charged miss is a thunder strike
  restartAnim($("mon"), "lunge");
  streakUI();
  setMsg(`${why} ${shownFact(G.cur, G.cur.ans)}${cost > 1 ? " ⚡ −2 hearts" : ""}`, "bad");
  say("p", PHRASE.oops, true);
  // The whole fact, said out loud: "three plus four is seven".
  const said = G.cur.fact || G.cur;
  say("q", spokenFact(said));
  if (cost > 1) say("p", PHRASE.chargedMiss);
  setTimeout(() => {
    sfx.crack();
    heartsUI(lost);
    restartAnim($("arena"), "hurt");
    setTimeout(() => $("arena").classList.remove("hurt"), 450);
    setTimeout(() => heartsUI(), 720);
  }, reduced() ? 0 : 220);
  if (G.hearts <= 0) { setTimeout(() => end(false), 1700); return; }
  // The worked example stays until "Got it" (or Enter), so there's time to look.
  setTimeout(() => { G.next = true; openWorked(); }, 600);
}
function nextAfterMiss() {
  if (!G.next) return;
  G.next = false;
  hide();
  newProblem();
}

// Floors cleared this run; the Wing's best is kept per player.
function record() {
  const f = G.floor + (G.hp <= 0 ? 1 : 0), p = progress[wing().id] || (progress[wing().id] = { boss: 0, best: 0 });
  if (f > p.best) p.best = f;
  store.player(PID).set("wings", progress);
  return f;
}
// This floor's stars (wings.js floorStars), saved as the floor's best, shown as a row.
function earnStars() {
  const got = floorStars(G.floorLost, !G.floorSlow), n = got.filter(Boolean).length;
  const p = progress[wing().id] || (progress[wing().id] = { boss: 0, best: 0 });
  p.stars = p.stars || [];
  if (n > (p.stars[G.floor] || 0)) p.stars[G.floor] = n;
  // This run's stars, and the best run at this depth (the dive's score for it).
  G.runStars = (G.runStars || 0) + n;
  p.depthStars = p.depthStars || {};
  if (G.runStars > (p.depthStars[G.depth] || 0)) p.depthStars[G.depth] = G.runStars;
  store.player(PID).set("wings", progress);
  const labels = ["Cleared", "No hearts lost", "All fast"];
  return `<div class="stars" aria-label="${n} of 3 stars">${got.map((on, i) => `<span class="star${on ? " on" : ""}" style="--i:${i}"><b>★</b><small>${labels[i]}</small></span>`).join("")}</div>`;
}
function cleared() {
  const m = G.floors[G.floor];
  if (G.floor === G.floors.length - 1) return end(true);
  const stars = earnStars();
  beat(seen, m, Date.now()); store.player(PID).set("bestiary", seen);
  const healed = G.hearts < band().hearts;
  if (healed) G.hearts++;
  record();
  sfx.victory(); // a floor cleared gets the fanfare (the user liked it better than the jingle)
  const nx = G.floors[G.floor + 1];
  const next = `<div class="cardmon">${monsterArt(nx)}</div>
  <p>Next down the stairs: <strong>${nx.n}</strong>${nx.boss ? ", the boss" : ""}.${healed ? " You found a heart (+1)." : ""}</p>`;
  if (m.cursed != null && !crackCurse(team, m.cursed).freed) {
    // The curse cracks (heroes.js crackCurse): it takes CURSE_HITS wins to break.
    const h = HEROES[m.cursed], r = crackCurse(team, m.cursed);
    Object.assign(team, r.team); saveTeam();
    say("p", PHRASE.crack);
    if (CURSE_HITS - r.cracks === 1) say("p", heroAlmost(h)); else say("p", PHRASE.crackTwo);
    show(`<h2>The curse is cracking!</h2>
    <div class="cardmon rescued">${heroSvg(h, { cursed: true, cracks: r.cracks })}</div>
    <p><strong>${r.cracks} of ${CURSE_HITS}</strong> cracks in the curse on ${h.n}. Beat it ${CURSE_HITS - r.cracks === 1 ? "once more" : `${CURSE_HITS - r.cracks} more times`} to set ${h.n} free.</p>
    ${stars}
    ${next.replace('class="cardmon"', 'class="cardmon small"')}
    <div class="btns"><button class="big" id="next">Floor ${G.floor + 2}</button></div>`, "float");
  } else if (m.cursed != null) {
    // A rescue: the last crack breaks the curse and the hero joins the team.
    const h = HEROES[m.cursed];
    Object.assign(team, crackCurse(team, m.cursed).team); saveTeam();
    joined(MS, h.d); store.player(PID).set("moments", MS); // their first answer on the team is a Hero Moment
    say("p", heroJoins(h));
    say("p", heroHelps(h));
    show(`<h2>${h.n} is free!</h2>
    <div class="cardmon rescued">${heroSvg(h)}</div>
    <p><strong>${h.n} joins your team.</strong> When your answer has a ${h.d}, ${h.n} jumps in and hits harder.</p>
    ${stars}
    ${next.replace('class="cardmon"', 'class="cardmon small"')}
    <div class="btns"><button class="big" id="next">Floor ${G.floor + 2}</button></div>`, "float");
  } else {
    say("p", monsterCleared(m));
    show(`<h2>${m.n} ${m.quip}</h2>
  ${stars}
  ${next}
  <div class="btns"><button class="big" id="next">Floor ${G.floor + 2}</button></div>`, "float");
  }
  if (healed) say("p", PHRASE.heart);
  if (nx.boss) say("p", PHRASE.nextBoss);
  $("next").onclick = () => { hide(); loadMonster(G.floor + 1); newProblem(); };
}
function end(win) {
  G.running = false;
  const w = wing(), before = openWings(progress, recs, st.start);
  if (win) { progress[w.id] = progress[w.id] || { boss: 0, best: 0 }; progress[w.id].boss++; }
  const stars = win ? earnStars() : "";
  if (win) { beat(seen, G.floors[G.floor], Date.now()); store.player(PID).set("bestiary", seen); }
  const f = record(), acc = G.tries ? Math.round(G.solved / G.tries * 100) : 0, m = G.floors[G.floor];
  // Strata this run opened (the Cellar can open the Hall and the Tower at once), easiest first.
  const openedAll = WINGS.filter((x) => !before.includes(x.id) && openWings(progress, recs, st.start).includes(x.id)), opened = openedAll[0];
  // Losing all your hearts curses the hero who led the run (heroes.js curseCaptain): rescue them
  // again on a rescue floor, and pick someone else to lead.
  const fallen = !win && hasCaptain() ? HEROES[team.captain] : null;
  // A stratum cleared: the fanfare for now; it's meant to get something really big (DESIGN.md §8.3).
  if (win) { sfx.victory(); say("p", wingCleared(w)); } else say("p", monsterWon(m));
  if (fallen) say("p", heroCursed(fallen));
  if (opened) { say("p", PHRASE.unlocked); openedAll.forEach((x) => say("p", wingOpened(x))); }
  // What the win card offers, the first few wins (a new stratum's own offer says it otherwise).
  else if (win && once("deeper", 3)) say("p", PHRASE.deeper);
  if (fallen) { Object.assign(team, curseCaptain(team)); saveTeam(); captainUI(); whoUI(); }
  const cursedLine = !fallen ? "" : `<div class="fallen"><div class="cardmon small">${heroSvg(fallen, { cursed: true })}</div>
    <p><strong>${esc(fallen.n)} was cursed!</strong> ${team.rescued.length ? "Pick who leads next, and" : "Pick a new hero to start again, and"} rescue ${esc(fallen.n)} on a rescue floor.</p></div>`;
  // A win opens the next depth of this Wing: "Go deeper" goes there, "Play again" replays this one.
  const depth = G.depth;
  if (win) { progress[w.id].depth = Math.max(deepest(w, progress), depth + 1); store.player(PID).set("wings", progress); }
  const deeper = win;
  const left = opened ? `<div class="unlocked" role="status"><b>🔓 New stratum unlocked!</b><span>${openedAll.map((x) => esc(x.name)).join(" and ")} ${openedAll.length > 1 ? "are" : "is"} open.</span></div>` : win ? nextWingHint() : "";
  pickOpen = false;
  show(`<h2>${win ? wingCleared(w) : `${m.n} won this round`}</h2>
  ${win || fallen ? "" : `<div class="cardmon">${monsterArt(m)}</div>`}
  <p>${win ? `${m.n} is beaten. <strong>Depth ${depth + 1}</strong> is open below: tougher monsters, new floors.` : "Every miss shows the right answer, so the next run goes deeper."}</p>
  ${cursedLine}
  ${stars}
  ${left}
  <div class="stats"><div><b>${f}</b><small>floors cleared</small></div><div><b>${G.solved}</b><small>solved</small></div><div><b>${acc}%</b><small>accuracy</small></div></div>
  <p>Best run: <strong>${progress[w.id].best} of ${G.floors.length} floors</strong></p>
  ${captainHTML("Next run")}
  <div class="btns${deeper || opened ? " deeper" : ""}"><p class="warn" id="warn" role="status"></p><button class="big alt" id="set">Menu</button><button class="big${deeper || opened ? " alt" : ""}" id="again">${win ? "Play again" : "Try again"}</button>${deeper ? `<button class="big${opened ? " alt" : ""}" id="deeper">Go deeper</button>` : ""}${opened ? `<button class="big" id="nextStratum">Enter ${esc(opened.name.replace(/^The /, "the "))}</button>` : ""}</div>`);
  wireCaptain();
  const ready = () => {
    if (hasCaptain()) return true;
    $("warn").textContent = freePick(team, fresh()) ? "Pick your hero first." : "Pick who leads first."; $("captain").scrollIntoView({ block: "center", behavior: "smooth" });
    say("p", PHRASE.heroFirst, true);
    return false;
  };
  $("again").onclick = () => { if (ready()) start(depth); };
  if (deeper) $("deeper").onclick = () => { if (ready()) descend(depth + 1, "deeper"); };
  // A newly opened stratum, from its first depth.
  if (opened) $("nextStratum").onclick = () => { if (!ready()) return; st.band = opened.band; saveSettings(); start(1); };
  $("set").onclick = () => openMenu();
}
// A card over the game. It opens at the top, and its main button gets focus (Enter presses it)
// without scrolling down to it. kind "page" (the menu, Settings, the book, a run's end) fills a
// phone's screen with its buttons docked at the bottom; "float" (a floor cleared, a miss) floats
// over the game.
function show(h, kind = "page") {
  G.busy = true; $("card").innerHTML = h; $("card").className = "card " + kind;
  $("ov").className = "ov " + kind; $("ov").hidden = false; $("ov").scrollTop = 0;
  // The main button is the last one in the row (Menu, then Play again).
  const bs = $("card").querySelectorAll(".btns button.big"), b = bs[bs.length - 1] || $("card").querySelector("button.big");
  if (b) b.focus({ preventScroll: true });
}
function hide() { $("ov").hidden = true; }

/* ---------- pausing ----------
   ⏸ by the hearts (or Escape) pauses mid-problem: Keep fighting, Monsters & Heroes,
   Settings, or Exit to
   the start screen (a second tap confirms, since it ends the run). */
function pause() {
  const justPaused = !G.paused; // not coming back from Settings or the book
  if (justPaused) {
    if (!G.running || G.busy || G.next) return;
    G.paused = { at: performance.now() };
  }
  stopSpeech();
  if (justPaused && once("pause", 3)) say("p", PHRASE.paused);
  show(`<h2>Paused</h2>
  <p>Floor ${G.floor + 1} of ${G.floors.length}: <strong>${esc(G.floors[G.floor].n)}</strong></p>
  <div class="pause-btns"><button class="small" type="button" id="pBook">📖 Monsters &amp; Heroes</button><button class="small" type="button" id="pSettings">⚙ Settings</button><button class="small danger" type="button" id="pExit">Exit the dungeon</button></div>
  <div class="btns"><button class="big" id="resume">Keep fighting</button></div>`, "float");
  $("resume").onclick = resume;
  $("pBook").onclick = bookPage;
  $("pSettings").onclick = () => settings(true);
  $("pExit").onclick = () => {
    const b = $("pExit");
    if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "Exit? This run ends"; say("p", PHRASE.exitSure, true); return; }
    G.paused = null; G.running = false; record();
    newRun(); loadMonster(0, true);
    menu();
  };
}
// Back to the same problem. The pause doesn't count toward the answer time.
function resume() {
  const p = G.paused; if (!p) return;
  G.paused = null; hide(); G.busy = false;
  G.t0 += performance.now() - p.at;
}
$("pauseBtn").onclick = pause;

/* ---------- the menu: players and settings ---------- */
function openMenu() {
  G.busy = true;
  stopSpeech();
  menu();
}
function chip(type, name, value, checked, label, id) {
  return `<label class="chip"><input type="${type}" name="${name}" value="${value}"${id ? ` id="${id}"` : ""} ${checked ? "checked" : ""}><span>${label}</span></label>`;
}
function playersHTML() {
  const list = store.profiles();
  const rows = list.map((p, i) => `<li class="prow${p.id === PID ? " me" : ""}" data-id="${esc(p.id)}">
    <input type="text" maxlength="24" value="${esc(p.name)}" placeholder="Player ${i + 1}" aria-label="Player ${i + 1}'s name (optional)">
    ${p.id === PID ? '<span class="now">Playing</span>' : '<button class="small" type="button" data-act="play">Play</button>'}
    ${store.canRemove(p.id) ? '<button class="small danger" type="button" data-act="remove" aria-label="Remove">✕</button>' : ""}
  </li>`).join("");
  return `<ul class="players">${rows}
  <li class="prow"><input type="text" id="newName" maxlength="24" placeholder="New player (name optional)" aria-label="New player's name (optional)"><button class="small" type="button" id="addPlayer">+ Add</button></li></ul>`;
}
// "Level 2 of 4: Within 10", from the player's own fact records.
function levelLine() {
  const L = openLevel(st.band, recs);
  return `Level ${L + 1} of ${band().levels.length}: ${band().levels[L].name}`;
}
// A stratum's depths on the map, as a shaft going down: depths cleared (filled), the deepest
// reached ("you are here"), and the ones still below. It starts at MAP_DEPTHS rows and grows as
// you go deeper; a long run of cleared depths folds into one row.
function depthTrack(w, d) {
  const last = Math.max(MAP_DEPTHS, d + 1), rows = [];
  let first = 1;
  if (last > 8) { first = last - 6; rows.push(`<li class="done fold"><i></i>Depths 1–${first - 1} cleared</li>`); }
  for (let n = first; n <= last; n++) {
    const sc = depthScore(w, n), score = sc.got ? ` <small>★ ${sc.got} of ${sc.max}</small>` : "";
    rows.push(n < d ? `<li class="done"><i></i>Depth ${n}${score}</li>` : n === d ? `<li class="here"><i></i>Depth ${n}${score} <em>${d === 1 && !(progress[w.id] || {}).best ? "start here" : "you are here"}</em></li>` : `<li><i></i>Depth ${n}</li>`);
  }
  return `<ol class="shaft" aria-label="Deepest: depth ${d}">${rows.join("")}</ol>`;
}
// The depth map: the strata (wings.js WINGS) as rock layers under the surface, each in its own
// texture, open or locked (and what opens it), with the deepest depth reached on the side.
function wingsHTML() {
  const open = openWings(progress, recs, st.start);
  return WINGS.map((w) => {
    const b = BANDS[w.band], isOpen = open.includes(w.id), here = w.band === st.band, p = progress[w.id] || {};
    let note;
    const ws = wingStars(w, progress);
    if (isOpen) note = (p.boss ? `Cleared ${p.boss}×` : p.best ? `Best: ${p.best} of ${w.floors.length + 1} floors` : "Not tried yet") + (ws.got ? ` · ★ ${ws.got} of ${ws.max}` : "");
    else { const t = toOpen(w, progress, recs); note = `🔒 Beat ${t.prev.boss}${t.boss ? " ✓" : ""} and learn ${Math.round(t.need * 100)}% of ${t.prev.name.replace(/^The /, "the ")} (now ${Math.round(t.share * 100)}%)`; }
    const d = deepest(w, progress);
    return `<label class="wing ${w.id}${here ? " here" : ""}${isOpen ? "" : " locked"}"><input type="radio" name="wing" value="${w.id}" ${here ? "checked" : ""} ${isOpen ? "" : "disabled"}>
      <span><b>${w.name}</b><small>${b.label} · ${b.grades}</small><em>${note}</em>${here ? `<em class="level" id="levelLine">${levelLine()}</em>` : ""}
      ${isOpen ? depthTrack(w, d) : ""}</span></label>`;
  }).join("");
}
// The start screen, top to bottom: the title (with ⚙ Settings), your hero, the Wings, and
// "Enter the dungeon" docked at the bottom. Monsters & Heroes is on the pause screen. Players, chalk color and sounds are in
// Settings, as in Sound Box. Names are optional.
function menu() {
  G.onMenu = true;
  // With no hero yet, the first tap here asks for one out loud (below), once per player a visit.
  if (!hasCaptain() && G.askedFor !== PID) G.askHero = true;
  if (updateReady && !G.running) { reloadForUpdate(); return; } // a new version is waiting
  const list = store.profiles();
  show(`<div class="cardhead logo-head"><h2 class="logo">Sum<b>geon</b></h2><button class="icon-btn" id="openSettings" type="button" aria-label="Settings">${GEAR}</button></div>
  <p class="tag"><strong>Your answer is your attack.</strong> Get it right and your digits fly at the monster.</p>
  ${list.length > 1 ? `<p class="playing">Playing as <b>${esc(displayName(list, PID))}</b> <button class="link" type="button" id="switchPlayer">Switch</button></p>` : ""}
  ${captainHTML()}
  <div class="grp"><span>Pick a stratum</span><div class="wings strata"><div class="surface" aria-hidden="true"></div>${wingsHTML()}</div></div>
  <div class="btns"><p class="warn" id="warn" role="status"></p><button class="big" id="go">Enter the dungeon</button></div>`);
  const card = $("card");
  // A different Wing is a fresh dungeon: its own facts and hearts.
  card.querySelectorAll("input[name=wing]").forEach((i) => i.onchange = () => {
    st.band = wingOf(i.value).band; saveSettings();
    G.running = false; newRun(); loadMonster(0, true);
    menu();
  });
  wireCaptain();
  $("openSettings").onclick = () => settings();
  if ($("switchPlayer")) $("switchPlayer").onclick = () => settings();
  $("go").onclick = () => {
    if (!hasCaptain()) { $("warn").textContent = freePick(team, fresh()) ? "Pick your hero first." : "Pick who leads first."; $("captain").scrollIntoView({ block: "center", behavior: "smooth" }); say("p", PHRASE.heroFirst, true); return; }
    descend(null, "enter");
  };
}
// Double-tapping a stratum on the start screen enters it: the first tap picks it (and redraws the
// card), a second tap on the same stratum soon after is Enter.
let lastWingTap = null;
document.addEventListener("click", (e) => {
  const w = e.target.closest && e.target.closest("label.wing");
  if (!w || !G.onMenu || w.classList.contains("locked") || e.target.closest("button")) { lastWingTap = null; return; }
  const id = w.querySelector("input[name=wing]").value, now = performance.now();
  if (lastWingTap && lastWingTap.id === id && now - lastWingTap.t < 450) { lastWingTap = null; $("go").click(); return; }
  lastWingTap = { id, t: now };
}, true);
// "Pick your hero!": speech can only start in a tap, so it waits for the first tap on the start
// screen (not one on a hero, which says that hero's name instead).
document.addEventListener("pointerdown", (e) => {
  if (!G.askHero) return;
  G.askHero = false; G.askedFor = PID;
  if (G.onMenu && !hasCaptain() && !$("ov").hidden && !e.target.closest(".hpick")) say("p", PHRASE.pickHero);
}, true);

// Settings, in tabs: Players (names optional), Game (chalk color, sounds as on/off switches) and
// About (how the hints work, and credits). All save as they change.
function toggle(id, title, sub, on) {
  return `<label class="switch-row"><span><b>${title}</b>${sub ? `<small>${sub}</small>` : ""}</span>
    <input type="checkbox" role="switch" id="${id}" ${on ? "checked" : ""}><i aria-hidden="true"></i></label>`;
}
// From the pause screen (paused: true) it leaves out Players, since switching would end the run,
// opens on Game, and Done goes back to the pause screen. From the start screen it opens on
// Players. `tab` opens another tab (About, coming back from "How the hints work").
function settings(paused, tab) {
  G.onMenu = false; // an update waits until the start screen
  const tabs = [
    ...(paused ? [] : [{ id: "players", icon: "👥", label: "Players" }]),
    { id: "game", icon: "🎨", label: "Game" },
    { id: "about", icon: "ℹ️", label: "About" },
  ];
  const on = tabs.some((t) => t.id === tab) ? tab : tabs[0].id;
  const panel = (id, html) => `<div class="tabpanel" role="tabpanel" id="tp-${id}" aria-labelledby="tab-${id}" tabindex="0"${id === on ? "" : " hidden"}>${html}</div>`;
  show(`<div class="cardhead"><h2>Settings</h2></div>
  <div class="tabs" role="tablist" aria-label="Settings">${tabs.map((t) => `<button type="button" role="tab" id="tab-${t.id}" aria-controls="tp-${t.id}" aria-selected="${t.id === on}" tabindex="${t.id === on ? 0 : -1}"><span aria-hidden="true">${t.icon}</span>${t.label}</button>`).join("")}</div>
  ${paused ? "" : panel("players", `<div class="grp"><span>Players</span><div id="players">${playersHTML()}</div></div>`)}
  ${panel("game", `<div class="grp"><span>Chalk color</span><div class="swatches" id="swatches">${swatchesHTML()}</div></div>
  <div class="grp"><span>Sounds</span><div class="list">
    ${toggle("sfxOn", "Sound effects", "", st.sfx)}
    ${toggle("voiceOn", "Voice", "Reads monsters and answers aloud", st.voice)}
  </div></div>`)}
  ${panel("about", aboutHTML())}
  <div class="btns"><button class="big" id="done">Done</button></div>`);
  wireTabs();
  $("openHelp").onclick = () => { helpFrom = !!paused; helpPage(); };
  $("sfxOn").onchange = () => { st.sfx = $("sfxOn").checked; sfx.setSfx(st.sfx); saveSettings(); };
  $("voiceOn").onchange = () => { st.voice = $("voiceOn").checked; setVoice(st.voice); saveSettings(); };
  wireSwatches();
  if (!paused) wirePlayers();
  $("done").onclick = paused ? pause : menu;
}
// Tabs (the WAI-ARIA tabs pattern): a tap, or ←/→/Home/End on the tab row, picks a tab and shows
// its panel.
function wireTabs() {
  const tabs = [...$("card").querySelectorAll("[role=tab]")];
  const pick = (t) => tabs.forEach((x) => {
    const sel = x === t;
    x.setAttribute("aria-selected", sel); x.tabIndex = sel ? 0 : -1;
    $(x.getAttribute("aria-controls")).hidden = !sel;
  });
  tabs.forEach((t, i) => {
    t.onclick = () => pick(t);
    t.onkeydown = (e) => {
      const n = tabs.length, j = { ArrowRight: i + 1, ArrowLeft: i + n - 1, Home: 0, End: n - 1 }[e.key];
      if (j === undefined) return;
      e.preventDefault(); e.stopPropagation(); pick(tabs[j % n]); tabs[j % n].focus();
    };
  });
}
// Settings → About: the grown-ups' page on the hints, then the credits (README's License
// section) and the footer's badges.
function aboutHTML() {
  const a = (href, text) => `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
  return `<div class="grp"><span>For grown-ups</span><div class="list">
    <button class="list-link" type="button" id="openHelp"><span><b>How the hints work</b><small>How Sumgeon teaches, strategy by strategy</small></span><i aria-hidden="true">›</i></button>
  </div></div>
  <div class="grp"><span>Credits</span><div class="credits">
    <p><b>Sumgeon</b> by James Tuley.<br>Copyright © 2026 James Tuley. Licensed under the ${a("https://github.com/jbtule/sumgeon/blob/main/LICENSE.md", "PolyForm Noncommercial License 1.0.0")}.</p>
    <ul>
      <li><b>Fonts:</b> ${a("https://fonts.google.com/specimen/Bungee", "Bungee")} and ${a("https://fonts.google.com/specimen/Nunito", "Nunito")} from Google Fonts (SIL Open Font License 1.1).</li>
      <li><b>Voice:</b> recorded with ${a("https://huggingface.co/hexgrad/Kokoro-82M", "Kokoro-82M")} (Apache License 2.0).</li>
      <li><b>Coins:</b> the portraits are traced from public-domain photos of US Mint coins on Wikimedia Commons. The coin backs are drawn for the game.</li>
    </ul>
  </div></div>
  ${badgesCopy()}`;
}

// The footer's badges (deployed version, license), repeated in Settings → About, since phones hide the footer.
function badgesCopy() {
  const f = document.querySelector("footer.badges");
  if (!f) return "";
  const c = f.cloneNode(true);
  c.querySelectorAll("[id]").forEach((e) => e.removeAttribute("id"));
  return c.outerHTML;
}
// Monsters & Heroes (DESIGN.md §6.2, §6.6): every Wing's monsters, met or not, with their trait
// and a mastery ring for their kind of math (gold once it's full); and the ten heroes, rescued or
// still cursed.
function bookPage() {
  G.onMenu = false; // an update waits until the start screen
  const ring = (share) => {
    const c = 2 * Math.PI * 46;
    return `<svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="none" stroke="var(--line)" stroke-width="7"/>
      ${share > 0 ? `<circle cx="50" cy="50" r="46" fill="none" stroke="var(--gold)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(share * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 50 50)"/>` : ""}</svg>`;
  };
  let lastWing = null, beasts = "";
  for (const { wing: w, m } of roster()) {
    if (w !== lastWing) { if (lastWing) beasts += "</div>"; beasts += `<h3 class="book-wing">${esc(w.name)}</h3><div class="beasts">`; lastWing = w; }
    const s = seen[m.n], t = traitOf(m), share = mastery(m, w, recs), gold = s && share >= 1;
    beasts += s
      ? `<section class="beast${gold ? " gold" : ""}"><div class="beast-art">${ring(share)}${svg(m)}</div>
          <b>${esc(m.n)}</b>${m.boss ? '<small class="boss-tag">Boss</small>' : ""}
          ${t ? `<span class="trait">${t.icon} ${esc(t.name)}</span><small>${esc(t.text)}</small>` : "<small>No tricks: a good first fight</small>"}
          <small>Beaten ${s.beaten || 0}× · Learned ${Math.round(share * 100)}%</small>${looksRow(m)}</section>`
      : `<section class="beast unmet"><div class="beast-art silhouette">${svg(m)}</div><b>???</b><small>Not met yet</small></section>`;
  }
  beasts += "</div>";
  const heroes = HEROES.map((h) => onTeam(h.d)
    ? `<section class="hero-card${h.d === team.captain ? " captain-card" : ""}">${heroSvg(h, { color: h.d === team.captain ? team.color : null })}
        <b>${esc(h.n)}</b><small>${esc(h.cls)}</small><small>${esc(h.move)}</small>${quipsHeard(h.d)}${h.d === team.captain ? '<small class="cap-tag">Your hero</small>' : ""}</section>`
    : `<section class="hero-card unmet">${heroSvg(h, { cursed: true, cracks: cracksOf(h.d) })}<b>???</b><small>${cracksOf(h.d) ? `Curse cracked ${cracksOf(h.d)} of ${CURSE_HITS}` : "Still cursed"}</small></section>`).join("");
  const freed = HEROES.filter((h) => onTeam(h.d)).length, met = roster().filter((x) => seen[x.m.n]).length;
  show(`<div class="cardhead"><h2>Monsters &amp; Heroes</h2></div>
  <h3 class="book-title">Monsters <small>${met} of ${roster().length} met</small></h3>
  <p>The ring shows how much of each monster's math you've learned. Fill it to give the monster a gold outline.</p>
  ${beasts}
  <h3 class="book-title">Heroes <small>${freed} of 10 on your team</small></h3>
  <div class="hero-grid">${heroes}</div>
  <div class="btns"><button class="big" id="bookBack">Back</button></div>`);
  // Back to the pause screen mid-run, or to the start screen.
  $("bookBack").onclick = () => G.paused ? pause() : menu();
}
// A hero's quips heard in Hero Moments (moments.js), "Quips: 1 of 3", gold when all are.
function quipsHeard(d) {
  const q = heardOf(MS, d);
  return `<small class="quips${q.heard === q.of ? " all" : ""}">Quips: ${q.heard} of ${q.of}</small>`;
}
// A monster's looks (monsters.js LOOKS) on its card: the ones met, and silhouettes for the rest.
function looksRow(m) {
  if (!LOOKS[m.n]) return "";
  const all = [0, 1, 2, 3, 4].map((i) => lookOf(m, i)), found = all.filter((l) => seen[l.n]).length;
  return `<div class="looks" aria-label="${found} of ${all.length} looks found">${all.map((l) => seen[l.n]
    ? `<span title="${esc(l.n)}">${svg(l)}</span>` : `<span class="silhouette" title="Not met yet">${svg(l)}</span>`).join("")}</div>
    <small>Looks found: ${found} of ${all.length}</small>`;
}
// "How the hints work": how Sumgeon teaches, and each strategy with the game's own drawing and
// a plain explanation, for grown-ups who learned math another way (DESIGN.md §5.3).
let helpFrom = false;
function helpPage() {
  const cards = STRATEGIES.map((s) => {
    const h = hintFor(s.f, true);
    return `<section class="strat"><div class="strat-head"><b>${esc(s.title)}</b><small>${esc(s.grade)}</small></div>
      <div class="model">${h.model}</div><p class="hsay">${esc(h.say)}</p><p class="why">${esc(h.grownups)}</p></section>`;
  }).join("");
  show(`<div class="cardhead"><h2>How the hints work</h2></div>
  <p>Sumgeon teaches the way classrooms do now. A hint draws the strategy and leaves the last step to the player, so they work it out rather than copy it.</p>
  <ul class="how">
    <li><strong>New facts</strong> show their hint by themselves. While a fact is being learned, 💡 shows it on a tap. Once it's learned, the hint goes away.</li>
    <li><strong>After a miss</strong>, the worked example stays up until "Got it", and that fact comes back 2–4 problems later.</li>
    <li><strong>A hinted answer</strong> still hits the monster, but doesn't count toward learning the fact or building a streak.</li>
    <li><strong>Strata open by mastery</strong>, not grade: beat a stratum's boss and learn 60% of its facts to open the ones below. Each win also opens a deeper, tougher depth of the same stratum.</li>
  </ul>
  <h3 class="strats-title">The strategies</h3>
  <div class="strats">${cards}</div>
  <div class="btns"><button class="big" id="back">Back to Settings</button></div>`);
  $("back").onclick = () => settings(helpFrom, "about");
}
function swatchesHTML() {
  return CHALK.map((c) => `<button type="button" class="swatch${c === team.color ? " on" : ""}" data-c="${c}" style="--sw:${c}" aria-pressed="${c === team.color}" aria-label="Chalk color ${c}"></button>`).join("");
}
function wireSwatches() {
  $("swatches").querySelectorAll(".swatch").forEach((b) => b.onclick = () => {
    team.color = b.dataset.c; saveTeam(); captainUI(); whoUI();
    $("swatches").innerHTML = swatchesHTML(); wireSwatches();
  });
}

// Choosing a hero, on the start screen and after a run ends. With a hero picked, it's one line
// (the hero, big, and "Change"); "Change" opens the grid. With nobody on the team (a new player, or
// one whose only hero was cursed), any of the ten (heroes.js freePick); otherwise anyone on the
// team (the rest show cursed).
let pickOpen = false;
function captainHTML(label) {
  const first = !hasCaptain();
  if (!first && !pickOpen) {
    const h = HEROES[team.captain];
    return `<div class="grp" id="captain"><span>${label || "Your hero"}</span>
      <div class="cap-row"><div class="cap-art">${heroSvg(h, { color: team.color })}</div>
        <div class="cap-text"><b>${esc(h.n)}</b><small>Power hits on ${h.d}s</small></div>
        <button class="small" type="button" id="changeHero">Change</button></div></div>`;
  }
  const any = freePick(team, fresh());
  const heroes = HEROES.map((h) => {
    const can = any || onTeam(h.d), on = h.d === team.captain;
    return `<button type="button" class="hpick${on ? " on" : ""}" data-d="${h.d}" ${can ? "" : "disabled"} aria-pressed="${on}" aria-label="${can ? h.n : "Cursed, not rescued yet"}">
      ${heroSvg(h, { color: on ? team.color : null, cursed: !can })}<small>${can ? h.n : "???"}</small></button>`;
  }).join("");
  const title = !first ? label || "Your hero" : any ? "Pick your hero" : "Pick who leads next";
  return `<div class="grp" id="captain"><span>${title}</span>
    ${first && any ? '<p class="level">When your answer has your hero\'s digit, it\'s a power hit! Rescue more heroes on the way down.</p>' : ""}
    <div class="heroes">${heroes}</div></div>`;
}
function wireCaptain() {
  const box = $("captain"), label = box.firstElementChild.textContent;
  const custom = ["Pick your hero", "Pick who leads next", "Your hero"].includes(label) ? "" : label;
  const redraw = () => { const n = $("captain"); n.outerHTML = captainHTML(custom); wireCaptain(); };
  if ($("changeHero")) $("changeHero").onclick = () => { pickOpen = true; redraw(); };
  box.querySelectorAll(".hpick:not([disabled])").forEach((b) => b.onclick = () => {
    const next = pickHero(team, Number(b.dataset.d), fresh());
    if (!next) return;
    Object.assign(team, next);
    saveTeam();
    // The hero's name line in the quip voice (moments.js nameLine: "Captain Twodini, reporting
    // for duty!" the first time they're picked, then their deck). Nothing after it: the user found
    // "Your twos hit harder." and "Tap Enter to go in!" too much on top of it.
    const mo = { quip: nameLine(MS, team.captain) };
    store.player(PID).set("moments", MS);
    say("h", quipLine(mo.quip), true, null, PICK_FX);
    captainUI(); whoUI();
    if ($("warn")) $("warn").textContent = "";
    pickOpen = false; redraw();
  });
}

function wirePlayers() {
  const box = $("players");
  box.querySelectorAll(".players .prow").forEach((row) => {
    const id = row.dataset.id;
    row.querySelector("input").onchange = (e) => { store.rename(id, e.target.value); whoUI(); };
    const play = row.querySelector("[data-act=play]");
    if (play) play.onclick = () => switchTo(id);
    const rm = row.querySelector("[data-act=remove]");
    // A second tap confirms, as in Sound Box. From this device only.
    if (rm) rm.onclick = () => {
      if (rm.dataset.sure !== "1") { rm.dataset.sure = "1"; rm.textContent = "Remove?"; return; }
      store.removeProfile(id);
      refreshPlayers();
    };
  });
  const add = () => { const id = store.addProfile($("newName").value); switchTo(id); };
  $("addPlayer").onclick = add;
  $("newName").onkeydown = (e) => { if (e.key === "Enter") add(); };
}
function refreshPlayers() { $("players").innerHTML = playersHTML(); wirePlayers(); whoUI(); }
// Another player's turn: their own settings, best run and a fresh dungeon.
function switchTo(id) {
  store.setActive(id);
  loadPlayer();
  G.running = false;
  newRun();
  loadMonster(0, true);
  menu();
}

// After a win, what's left to open the Wings that come after this one, if they're still locked.
function nextWingHint() {
  const open = openWings(progress, recs, st.start), next = WINGS.filter((x) => x.after === wing().id && !open.includes(x.id));
  if (!next.length) return "";
  const t = toOpen(next[0], progress, recs);
  return `<p>To open <strong>${next.map((x) => x.name).join("</strong> and <strong>")}</strong>, learn ${Math.round(t.need * 100)}% of the facts here. You're at ${Math.round(t.share * 100)}%.</p>`;
}
// The descent (descent.js): "Enter the dungeon" (mode "enter") and "Go deeper" ("deeper") first
// drop down through the strata to the depth, then start the run, exactly as without it. The
// opening lines start on the tap (speech has to start in a tap on iOS), so start() doesn't say
// them again. The start card falls away as it begins.
function descend(depth, mode) {
  if (descending()) return;
  const d = depth || deepest(wing(), progress), enter = mode === "enter";
  G.onMenu = false; // no update reload, no stratum double-tap, mid-descent
  stopSpeech(); openingLines(enter, d);
  const ov = $("ov");
  ov.classList.add("leaving");
  const fell = setTimeout(() => { ov.classList.remove("leaving"); hide(); }, reduced() ? 0 : 450);
  playDescent({ wing: wing(), depth: d, mode, reduced: reduced(), title: enter ? PHRASE.enter : `Depth ${d}`, sub: enter ? `${wing().name} · Depth ${d}` : wing().name },
    () => { clearTimeout(fell); ov.classList.remove("leaving"); start(d, enter, true); });
}
// What's said as a run begins: "Now entering the Sumgeon!" (from the start screen), then the depth.
function openingLines(enter, d) {
  if (enter) say("p", PHRASE.enter, false, null, ENTER_FX);
  if (d > 1 && d <= DEPTH_MAX_SPOKEN) say("p", depthLine(d));
}
// enter: from the start screen's "Enter the dungeon", which says so first. voiced: the descent
// already said the opening lines.
function start(depth, enter, voiced) {
  G.onMenu = false;
  hide();
  newRun(depth);
  Object.assign(G, { hearts: band().hearts, streak: 0, solved: 0, tries: 0, running: true, retry: [], recent: [], next: false, paused: null, runStars: 0 });
  MR = freshRun();
  if (!voiced) { stopSpeech(); openingLines(enter, G.depth); }
  loadMonster(0);
  // The player's first fight: how to attack, before the first problem is read (until they answer).
  if (once("hit")) say("p", PHRASE.hitHow, false, () => !G.tries && G.running);
  newProblem();
}

/* ---------- update checking ----------
   When the game wakes up (back to the tab or the Home Screen app) and every 15 minutes, it asks
   for version.json (written by scripts/stamp.mjs). If a newer version is deployed, it reloads at
   the next safe moment: on the start screen, never during a run. Progress is saved as it goes.
   Locally the badge reads "dev" and there's nothing to check. */
const BUILD = $("buildSha") ? $("buildSha").textContent.trim() : "dev";
let updateReady = false, lastCheck = 0;
async function checkUpdate() {
  if (BUILD === "dev" || updateReady || Date.now() - lastCheck < 5e3) return; // not twice in a moment (focus and wake arrive together)
  lastCheck = Date.now();
  try {
    const r = await fetch("version.json?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) return;
    const v = await r.json();
    // Once per new version: if the page still looks old after reloading for it, don't loop.
    let tried = null;
    try { tried = sessionStorage.getItem("sumgeon:update"); } catch (e) { /* no session storage */ }
    if (v.sha && v.sha !== BUILD && tried !== v.sha) { updateReady = v.sha; applyUpdate(); }
  } catch (e) { /* offline: try again later */ }
}
// Reloads if an update is waiting and the start screen is up. The address gets the new version,
// so the browser can't hand back its cached copy of the old page.
function reloadForUpdate() {
  try { sessionStorage.setItem("sumgeon:update", updateReady); } catch (e) { /* fine */ }
  const u = new URL(location.href);
  u.searchParams.set("v", updateReady);
  location.replace(u.toString());
}
function applyUpdate() { if (updateReady && !G.running && G.onMenu) reloadForUpdate(); }
document.addEventListener("visibilitychange", () => { if (!document.hidden) checkUpdate(); });
addEventListener("focus", checkUpdate);
addEventListener("pageshow", checkUpdate);
setInterval(checkUpdate, 15 * 60e3);

/* ---------- no accidental zoom ----------
   Safari zooms on a pinch even with maximum-scale=1, so pinches are stopped here. Double-tap zoom
   is off through touch-action: manipulation in styles.css, which keeps fast taps (1, 1 for 11)
   working. Kids tap fast and rest a second finger on the screen. */
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("touchmove", (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

/* ---------- input ---------- */
function press(k) {
  if (G.next && k === "go") return nextAfterMiss();
  if (G.busy) return;
  if (G.cur && G.cur.spell) {
    if (k === "go") return castSpell();
    if (k === "clear" || k === "del") { sfx.tick(); sigilReset(); }
    return; // digits wait for the number pad
  }
  if (k === "go") return submit();
  const cmp = !!(G.cur && G.cur.sym), sym = "<=>".includes(k);
  if (k !== "del" && sym !== cmp) return; // digits for numbers, < = > for comparisons
  sfx.tick();
  if (k === "del") G.input = G.input.slice(0, -1);
  else if (sym) G.input = k;
  else if (G.input.length < 4) G.input = (G.input === "0" ? "" : G.input) + k;
  ansUI();
}
/* ---------- spell casting ----------
   Now and then the answer is drawn instead of typed (newProblem): the number pad becomes a
   glowing drawing pad in the same space, and sigil.js reads the drawing knowing the answer
   (judge in sigil.js):
   - A good match for the answer: it hits, and it's saved as one of the player's own templates
     (3 per digit), so it learns their handwriting.
   - A poor match, but closer to the answer than to anything else (or nearly): the math was right,
     so it hits for full damage, but it isn't learned, and the school-style digit (handwriting.js)
     is drawn over theirs: "Here's how to write a four." So an odd shape gets taught, not kept.
   - Right but clearly backwards: half damage, the digit shown the right way round, and "Your 3
     is facing backwards." Each player's reversals are counted per digit (spells.reversed).
   - Read clearly as another digit: a wrong answer, as on the pad. Only a clear read is wrong.
   - Can't read it: "Incantation failed!", no heart lost, try again; after two, the number pad.
   Spells are only on touch screens (any-pointer: coarse): drawing with a mouse isn't writing. */
// Skipping ahead's tally (learnFrom), per player and band, so slow coin probes don't cut short
// a run of fluent sums, and kept from run to run while the game is open.
const flows = {};
function flowOf(bk) { return (flows[PID + ":" + bk] ||= { fluent: 0, cool: 0, hist: [], on: false, leap: 1 }); }
// How lines sound (speech.js say's fx): "Now entering the Sumgeon!" echoes like a cavern; the
// captain line on picking a hero is the quip's boost without its echo.
const ENTER_FX = { gain: 1.3, echo: 0.45, delay: 0.2 }, PICK_FX = { gain: 1.5, echo: 0 };
// The share of problems that prefer an answer with the captain's digit until its first moment (learn.js choose).
const CAPTAIN_BIAS = 0.35;
// In the first fight (nothing beaten yet, so no Hero Moments), the share that avoid it instead,
// so the captain's first answer, and its first moment, come in the fight after.
const CAPTAIN_HOLD = 0.85;
const firstFight = () => !Object.values(seen).some((s) => s.beaten > 0);
// The lean toward the captain's digit lasts until that captain's first Hero Moment (moments.js
// saves it in captains), at any depth; a new captain gets it again.
const captainLean = () => hasCaptain() && !firstFight() && !(MS.captains || []).includes(team.captain);
const SPELL_SHARE = 1 / 6, SPELLS_ALWAYS = new URLSearchParams(location.search).has("spells");
const canSpell = () => SPELLS_ALWAYS || matchMedia("(any-pointer: coarse)").matches;
const spellsOf = () => Object.assign({ templates: {}, reversed: {}, cast: 0 }, store.player(PID).get("spells", {}));
let strokes = [], drawing = null;
function sigilSetup() {
  const c = $("sigil");
  sigilReset();
  c.onpointerdown = (e) => { if (G.busy) return; e.preventDefault(); c.setPointerCapture(e.pointerId); drawing = [sigilPoint(e)]; strokes.push(drawing); paintSigil(); };
  c.onpointermove = (e) => { if (!drawing) return; drawing.push(sigilPoint(e)); paintSigil(); };
  c.onpointerup = c.onpointercancel = () => { drawing = null; };
}
function sigilPoint(e) { const r = $("sigil").getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
function sigilReset() { strokes = []; drawing = null; paintSigil(); }
// The strokes, glowing gold; extra draws more on top (the right way round, after a reversal),
// with the strokes dimmed to dim (0–1) when given.
function paintSigil(extra, dim = 1) {
  const c = $("sigil");
  if (!c) return;
  const r = c.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  if (c.width !== Math.round(r.width * dpr) || c.height !== Math.round(r.height * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
  const g = c.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, r.width, r.height);
  g.lineCap = g.lineJoin = "round"; g.lineWidth = 8; g.strokeStyle = "#fff1b8"; g.shadowColor = "#ffc93c"; g.shadowBlur = 16;
  g.globalAlpha = dim;
  for (const s of strokes) {
    g.beginPath();
    s.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    if (s.length === 1) g.lineTo(s[0][0] + 0.5, s[0][1]);
    g.stroke();
  }
  g.globalAlpha = 1;
  if (extra) extra(g, r);
}
// After a reversal: the digit the right way round, glowing, with an arrow.
function showRightWay(d) {
  paintSigil((g, r) => {
    g.shadowColor = "#7fdc8a"; g.shadowBlur = 20; g.fillStyle = "#e8ffe9";
    g.font = `400 ${Math.round(r.height * 0.72)}px Bungee, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(String(d), r.width * 0.72, r.height * 0.55);
    g.font = `400 ${Math.round(r.height * 0.3)}px Bungee, sans-serif`; g.fillText("→", r.width * 0.9, r.height * 0.55);
  });
}
// After a poor match: the school-style digit (handwriting.js) drawn glowing over theirs.
function showHowToWrite(d) {
  paintSigil((g, r) => {
    const k = Math.min(r.width, r.height) * 0.8 / 100, x0 = (r.width - 100 * k) / 2, y0 = (r.height - 100 * k) / 2;
    g.shadowColor = "#7fdc8a"; g.shadowBlur = 20; g.strokeStyle = "#e8ffe9"; g.lineWidth = 10;
    for (const s of HANDWRITING[d]) {
      g.beginPath();
      s.forEach(([x, y], i) => (i ? g.lineTo(x0 + x * k, y0 + y * k) : g.moveTo(x0 + x * k, y0 + y * k)));
      g.stroke();
    }
  }, 0.35);
}
function castSpell() {
  if (G.busy || !strokes.length) return;
  const sp = spellsOf(), mine = Object.entries(sp.templates).flatMap(([d, list]) => list.map((points) => ({ digit: Number(d), points })));
  const ans = G.cur.ans, r = readSigil(strokes, mine);
  let j = judgeSigil(r, ans);
  // Before learning it, the built-in templates alone: a drawing they read clearly as another
  // digit is never learned (a read takes a few ms, so only then).
  if (j.learn && mine.length) j = judgeSigil(r, ans, readSigil(strokes));
  if (j.outcome === "retry") {
    G.spellFails++;
    sfx.crack();
    say("p", PHRASE.spellFail, true);
    if (G.spellFails >= 2) { G.cur.spell = false; padUI("num"); setMsg("Incantation failed! Use the number pad.", "bad"); say("p", PHRASE.spellPad); }
    else { setMsg("Incantation failed! Try again.", "bad"); sigilReset(); say("p", PHRASE.spellAgain); }
    return;
  }
  if (j.outcome !== "wrong") {
    sp.cast++;
    if (j.outcome === "backwards") {
      G.cur.reversed = true;
      sp.reversed[ans] = (sp.reversed[ans] || 0) + 1;
      showRightWay(ans);
      say("p", reversedLine(ans));
    } else if (j.outcome === "show") {
      G.cur.howTo = true;
      showHowToWrite(ans);
      setMsg("Here's how to write it.", "good");
      say("p", howToWriteLine(ans));
    } else if (j.learn) {
      // Their handwriting: keep their last 3 good matches of each digit.
      sp.templates[ans] = (sp.templates[ans] || []).concat([r.points.map((p) => ({ x: +p.x.toFixed(3), y: +p.y.toFixed(3), id: p.id }))]).slice(-3);
    }
    store.player(PID).set("spells", sp);
  }
  // A wrong answer goes in as the digit it was read as.
  G.input = String(j.outcome === "wrong" ? r.digit : ans); ansUI();
  submit();
}

// The number pad, or for a comparison (Chompers) the < = > keys, filling the same space.
const KEY_LABEL = { del: ["⌫", "Delete"], go: ["Hit!", "Attack"], "<": ["<", "Less than"], "=": ["=", "Equal to"], ">": [">", "Greater than"] };
// mode: "num", "cmp" or "spell" (the drawing pad).
function padUI(mode) {
  const pad = $("pad"), cmp = mode === "cmp";
  if (pad.dataset.mode === mode) { if (mode === "spell") sigilReset(); return; }
  pad.dataset.mode = mode; pad.classList.toggle("cmp", cmp); pad.classList.toggle("spell", mode === "spell");
  if (mode === "spell") {
    pad.innerHTML = `<canvas id="sigil" class="sigil" aria-label="Draw the answer here"></canvas><button type="button" data-k="clear" class="del" aria-label="Clear the drawing">Clear</button><button type="button" data-k="go" class="go" aria-label="Cast the spell">Cast!</button>`;
    sigilSetup();
    return;
  }
  const keys = cmp ? ["<", "=", ">", "del", "go"] : ["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0", "go"];
  pad.innerHTML = keys.map((k) => { const [t, a] = KEY_LABEL[k] || [k, k];
    return `<button type="button" data-k="${k}" class="${k === "go" ? "go" : k === "del" ? "del" : "<=>".includes(k) ? "sym" : ""}" aria-label="${a}">${t}</button>`; }).join("");
}
padUI("num");
$("pad").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) press(b.dataset.k); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { if (G.paused) { if ($("resume")) resume(); } else if ($("ov").hidden) pause(); return; }
  if (!$("ov").hidden) return;
  if (/^[0-9]$/.test(e.key)) press(e.key);
  else if ("<=>".includes(e.key) && e.key) press(e.key);
  else if (e.key === ",") press("<");
  else if (e.key === ".") press(">");
  else if (e.key === "Backspace") press("del");
  else if (e.key === "Enter") { e.preventDefault(); press("go"); }
});

loadPlayer();
newRun();
loadMonster(0, true);
$("prob").textContent = "7 + 8 =";
menu();
