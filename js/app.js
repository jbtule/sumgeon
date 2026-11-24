// Everything on screen: the game loop, the menu and players, and the attack animations.
// Problems, monsters, saving, sound and speech live in their own modules.
import { MON, svg } from "./monsters.js";
import { spokenProblem, spokenFact } from "./problems.js";
import { BANDS, choose, factOf, record as recordAnswer, helpFor, openLevel, monsterHP } from "./learn.js";
import { hintFor } from "./hints.js";
import { openStore, displayName } from "./store.js";
import { PHRASE, monsterName, monsterCleared, monsterWon, heroName, heroJoins, wingCleared, wingOpened } from "./lines.js";
import { WINGS, wingOf, runFloors, openWings, toOpen } from "./wings.js";
import { HEROES, CHALK, heroSvg } from "./heroes.js";
import * as sfx from "./sfx.js";
import { say, stopSpeech, setVoice } from "./speech.js";

const $ = (id) => document.getElementById(id);
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
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
let PID, st, recs, team, progress;
const band = () => BANDS[st.band] || BANDS.sprout;
const wingFor = (b) => WINGS.find((w) => w.band === b) || WINGS[0];
const wing = () => wingFor(st.band);
// A floor's art: a cursed digit is its hero, darkened (DESIGN.md §6.6).
const monsterArt = (m, cls) => (m.cursed != null ? heroSvg(HEROES[m.cursed], { cursed: true, cls }) : svg(m, cls));
function loadPlayer() {
  PID = store.active();
  st = store.settings(PID);
  recs = store.player(PID).get("facts", {}) || {};
  team = Object.assign({ captain: null, color: CHALK[0], rescued: [] }, store.player(PID).get("heroes", {}));
  progress = store.player(PID).get("wings", {}) || {};
  // A captain picked before heroes could change stays on the team.
  if (team.captain != null && !team.rescued.includes(team.captain)) { team.rescued.push(team.captain); saveTeam(); }
  // The band a player started in opens its Wing from the start (DESIGN.md §4).
  if (!st.start) { st.start = st.band; saveSettings(); }
  if (!openWings(progress, recs, st.start).includes(wingFor(st.band).id)) { st.band = WINGS[0].band; saveSettings(); }
  sfx.setSfx(st.sfx);
  setVoice(st.voice);
  soundUI(); whoUI(); captainUI();
}
function saveTeam() { store.player(PID).set("heroes", team); }
const hasCaptain = () => team.captain != null;
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
const MUTED = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
function soundUI() {
  const on = st.sfx || st.voice, b = $("soundBtn");
  b.innerHTML = on ? SPEAKER : MUTED;
  b.setAttribute("aria-pressed", on ? "true" : "false");
  b.setAttribute("aria-label", on ? "Sound on" : "Sound off");
}
// The header speaker mutes everything, or brings both back.
$("soundBtn").onclick = () => {
  const on = !(st.sfx || st.voice);
  st.sfx = st.voice = on;
  sfx.setSfx(on); setVoice(on); saveSettings(); soundUI();
};
$("sayProb").innerHTML = SPEAKER;
$("sayProb").onclick = () => { if (G.cur) say("q", spokenProblem(G.cur), true); };

function whoUI() {
  const list = store.profiles(), w = $("who");
  w.hidden = list.length < 2;
  w.innerHTML = `Playing as ${hasCaptain() ? `<span class="who-cap">${heroArt(team.captain)}</span>` : ""}<b>${esc(displayName(list, PID))}</b>`;
}
$("who").onclick = () => { openMenu(); settings(); };
$("menuBtn").onclick = () => openMenu();

/* ---------- the run ---------- */
// retry: missed facts waiting to come back ({ key, after: problems to go }); recent: the last few
// keys, so a fact doesn't repeat right away; hinted: a hint is open for this problem.
let G = { floor: 0, hearts: 5, hp: 0, max: 0, streak: 0, solved: 0, tries: 0, cur: null, input: "", busy: true, tEnd: 0, running: false,
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
  f.setAttribute("aria-label", `${G.streak} in a row, crits on`);
}
function setMsg(t, c = "") { const m = $("msg"); m.textContent = t; m.className = "msg " + c; }
function ansUI() { $("ans").textContent = G.input; }

// A fresh run through the current Wing: its floors, with this player's rescue floor.
function newRun() { G.floors = runFloors(wing(), team); }
function loadMonster(i, quiet) {
  const m = G.floors[i];
  G.floor = i;
  G.max = G.hp = monsterHP(m, st.band, recs);
  const el = $("mon");
  el.className = "mon";
  el.innerHTML = monsterArt(m);
  $("mName").textContent = m.n;
  $("floorLbl").textContent = m.boss ? "Boss floor" : m.cursed != null ? "Rescue floor" : `Floor ${i + 1} / ${G.floors.length}`;
  hpUI(); heartsUI(); streakUI();
  if (quiet) return;
  sfx.appear(m.boss);
  if (m.boss) say("p", PHRASE.boss);
  say("m", monsterName(m));
}
// The next problem, chosen by the learning engine (learn.js): a missed fact when it's due back,
// otherwise learning, review or new facts, with the monster's operation preferred.
function newProblem() {
  G.next = false;
  G.retry.forEach((r) => r.after--);
  const due = G.retry.find((r) => r.after <= 0);
  if (due) G.retry.splice(G.retry.indexOf(due), 1);
  const m = G.floors[G.floor];
  const key = choose(st.band, recs, { now: Date.now(), recent: G.recent, retry: due ? due.key : null, op: m.op === "mix" ? null : m.op });
  G.cur = factOf(key);
  G.recent = [key].concat(G.recent).slice(0, 3);
  G.input = ""; G.busy = false; G.hinted = false; G.t0 = performance.now();
  $("prob").textContent = G.cur.q + " =";
  ansUI();
  if ($("msg").classList.contains("bad")) setMsg("Your answer is your attack.");
  showHelp(helpFor(recs[key]));
  $("timer").hidden = !st.timer || G.hinted;
  if (st.timer && !G.hinted) { G.tEnd = performance.now() + band().seconds * 1000; requestAnimationFrame(tick); }
}
function tick() {
  if (!st.timer || G.busy || G.hinted) return;
  const total = band().seconds * 1000, left = G.tEnd - performance.now();
  $("tBar").style.width = Math.max(0, left / total * 100) + "%";
  if (left <= 0) miss("Too slow!"); else requestAnimationFrame(tick);
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
  const layer = $("fly"), a = centerOf($("ans")), b = centerOf($("mon")), n = text.length;
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

// Hero bonuses: each rescued hero summoned adds 10% (up to 30%); the captain's digit in the
// answer is a power hit, +50%. The captain counts for the power hit, not the 10%.
function heroBonus(typed) {
  const digits = [...typed].map(Number);
  const helpers = Math.min(3, digits.filter((d) => d !== team.captain && team.rescued.includes(d)).length);
  const power = hasCaptain() && digits.includes(team.captain);
  return { mult: (1 + helpers * 0.1) * (power ? 1.5 : 1), power, helpers };
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
   hits, but doesn't build the streak or count toward mastery, and the timer stops while it's open. */
function showHelp(mode) {
  $("hintBtn").hidden = mode !== "button";
  if (mode === "show") openHint(false); else $("hint").hidden = true;
}
function openHint(worked) {
  const h = hintFor(G.cur, worked), box = $("hint");
  box.innerHTML = `<div class="model">${h.model}</div><p class="hsay">${esc(h.say)}</p>
    <details class="grown"><summary>For grown-ups</summary><p>${esc(h.grownups)}</p></details>
    ${worked ? '<button class="big" type="button" id="gotIt">Got it</button>' : ""}`;
  box.hidden = false;
  $("hintBtn").hidden = true;
  if (!worked) { G.hinted = true; $("timer").hidden = true; }
  else $("gotIt").onclick = nextAfterMiss;
}
$("hintBtn").onclick = () => { if (!G.busy) openHint(false); };

// Saves the answer to the fact's record; says so when it opens a new level.
function learnFrom(ok) {
  const before = openLevel(st.band, recs), key = G.cur.key;
  recs[key] = recordAnswer(recs[key], { ok, ms: performance.now() - G.t0, hinted: G.hinted, now: Date.now(), fluentMs: band().fluentMs });
  store.player(PID).set("facts", recs);
  const after = openLevel(st.band, recs);
  return after > before ? band().levels[after].name : null;
}

function submit() {
  if (G.next) return nextAfterMiss();
  if (G.busy || G.input === "") return;
  G.tries++;
  if (Number(G.input) === G.cur.ans) {
    G.busy = true; G.solved++;
    if (!G.hinted) G.streak++;
    const typed = G.input, crit = G.streak >= 3, bonus = heroBonus(typed), m = G.floors[G.floor];
    // Lucky Number: a cursed digit takes double from answers with its digit (DESIGN.md §6.6).
    const lucky = m.cursed != null && typed.includes(String(m.cursed));
    const dmg = Math.round(G.cur.ans * (crit ? 2 : 1) * (lucky ? 2 : 1) * bonus.mult);
    const level = learnFrom(true);
    G.input = ""; ansUI();
    $("hint").hidden = true; $("hintBtn").hidden = true;
    sfx.launch(G.streak);
    if (G.streak === 3 && !G.hinted) say("p", PHRASE.crits);
    fly(typed, crit).then(() => {
      sfx.impact(crit); burst(crit);
      G.hp -= dmg;
      pop((bonus.power ? "Power! " : crit ? "Crit! " : "") + "−" + dmg, crit || bonus.power);
      restartAnim($("mon"), "hit");
      if (crit) restartAnim($("arena"), "shake");
      setMsg(level ? `New level: ${level}!` : lucky ? `Lucky ${m.cursed}! Double damage: ${dmg}!` : bonus.power ? `${HEROES[team.captain].n} power hit for ${dmg}!` : crit ? `Critical hit for ${dmg}!` : `Hit for ${dmg}!`, "good");
      hpUI(); streakUI();
      if (G.hp <= 0) { setTimeout(() => { $("mon").className = "mon dead"; }, 300); setTimeout(cleared, 1100); }
      else setTimeout(newProblem, level ? 1200 : 450);
    });
  } else miss("Ouch!");
}

// A wrong answer or timeout: the monster lunges, a heart cracks off, the right answer is shown
// and said with the worked example, and the fact comes back 2–4 problems later.
function miss(why) {
  G.busy = true; G.streak = 0;
  G.hearts--;
  const lost = G.hearts;
  learnFrom(false);
  // after counts down at each new problem, so 3–5 means 2–4 other problems in between.
  G.retry = G.retry.filter((r) => r.key !== G.cur.key).concat([{ key: G.cur.key, after: 3 + Math.floor(Math.random() * 3) }]);
  sfx.miss();
  restartAnim($("mon"), "lunge");
  streakUI();
  setMsg(`${why} ${G.cur.q} = ${G.cur.ans}`, "bad");
  say("q", spokenFact(G.cur), true);
  setTimeout(() => {
    sfx.crack();
    heartsUI(lost);
    restartAnim($("arena"), "hurt");
    setTimeout(() => $("arena").classList.remove("hurt"), 450);
    setTimeout(() => heartsUI(), 720);
  }, reduced() ? 0 : 220);
  if (G.hearts <= 0) { setTimeout(() => end(false), 1700); return; }
  // The worked example stays until "Got it" (or Enter), so there's time to look.
  $("timer").hidden = true;
  setTimeout(() => { openHint(true); G.next = true; const g = $("gotIt"); if (g) g.focus(); }, 500);
}
function nextAfterMiss() {
  if (!G.next) return;
  G.next = false;
  $("hint").hidden = true;
  newProblem();
}

// Floors cleared this run; the Wing's best is kept per player.
function record() {
  const f = G.floor + (G.hp <= 0 ? 1 : 0), p = progress[wing().id] || (progress[wing().id] = { boss: 0, best: 0 });
  if (f > p.best) p.best = f;
  store.player(PID).set("wings", progress);
  return f;
}
function cleared() {
  const m = G.floors[G.floor];
  if (G.floor === G.floors.length - 1) return end(true);
  const healed = G.hearts < band().hearts;
  if (healed) G.hearts++;
  record();
  sfx.cleared();
  const nx = G.floors[G.floor + 1];
  const next = `<div class="cardmon">${monsterArt(nx)}</div>
  <p>Next down the stairs: <strong>${nx.n}</strong>${nx.boss ? ", the boss" : ""}.${healed ? " You found a heart (+1)." : ""}</p>`;
  if (m.cursed != null) {
    // A rescue: the curse breaks and the hero joins the team.
    const h = HEROES[m.cursed];
    if (!team.rescued.includes(h.d)) { team.rescued.push(h.d); saveTeam(); }
    say("p", heroJoins(h));
    show(`<h2>${h.n} is free!</h2>
    <div class="cardmon rescued">${heroSvg(h)}</div>
    <p><strong>${h.n} joins your team.</strong> When your answer has a ${h.d}, ${h.n} jumps in and hits harder.</p>
    ${next.replace('class="cardmon"', 'class="cardmon small"')}
    <div class="btns"><button class="big" id="next">Floor ${G.floor + 2}</button></div>`);
  } else {
    say("p", monsterCleared(m));
    show(`<h2>${m.n} ${m.quip}</h2>
  ${next}
  <div class="btns"><button class="big" id="next">Floor ${G.floor + 2}</button></div>`);
  }
  $("next").onclick = () => { hide(); loadMonster(G.floor + 1); setMsg("Your answer is your attack."); newProblem(); };
}
function end(win) {
  G.running = false;
  const w = wing(), before = openWings(progress, recs, st.start);
  if (win) { progress[w.id] = progress[w.id] || { boss: 0, best: 0 }; progress[w.id].boss++; }
  const f = record(), acc = G.tries ? Math.round(G.solved / G.tries * 100) : 0, m = G.floors[G.floor];
  const opened = WINGS.find((x) => !before.includes(x.id) && openWings(progress, recs, st.start).includes(x.id));
  if (win) { sfx.victory(); say("p", wingCleared(w)); if (opened) say("p", wingOpened(opened)); } else say("p", monsterWon(m));
  const left = !win ? "" : opened ? `<p><strong>${opened.name} is open!</strong> Pick it in the menu.</p>` : nextWingHint();
  show(`<h2>${win ? wingCleared(w) : `${m.n} won this round`}</h2>
  ${win ? "" : `<div class="cardmon">${monsterArt(m)}</div>`}
  <p>${win ? `${m.n} is beaten. Every floor of ${w.name} is yours.` : "Every miss shows the right answer, so the next run goes deeper."}</p>
  ${left}
  <div class="stats"><div><b>${f}</b><small>floors cleared</small></div><div><b>${G.solved}</b><small>solved</small></div><div><b>${acc}%</b><small>accuracy</small></div></div>
  <p>Best run: <strong>${progress[w.id].best} of ${G.floors.length} floors</strong></p>
  ${captainHTML().replace(">Your hero<", ">Your hero for the next run<")}
  <div class="btns"><button class="big" id="again">Play again</button><button class="big alt" id="set">Menu</button></div>`);
  wireCaptain();
  $("again").onclick = start;
  $("set").onclick = () => openMenu();
}
function show(h) { G.busy = true; $("card").innerHTML = h; $("ov").hidden = false; const b = $("card").querySelector("button.big"); if (b) b.focus(); }
function hide() { $("ov").hidden = true; }

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
  const rows = list.map((p, i) => `<li class="prow" data-id="${esc(p.id)}">
    <input type="text" maxlength="24" value="${esc(p.name)}" placeholder="Player ${i + 1}" aria-label="Player ${i + 1}'s name (optional)">
    ${p.id === PID ? '<span class="now">playing now</span>' : '<button class="small" type="button" data-act="play">Play</button>'}
    ${store.canRemove(p.id) ? '<button class="small danger" type="button" data-act="remove">Remove</button>' : ""}
  </li>`).join("");
  return `<ul class="players">${rows}</ul>
  <div class="prow"><input type="text" id="newName" maxlength="24" placeholder="Name (optional)" aria-label="New player's name (optional)"><button class="small" type="button" id="addPlayer">Add a player</button></div>`;
}
// "Level 2 of 4: Within 10", from the player's own fact records.
function levelLine() {
  const L = openLevel(st.band, recs);
  return `Level ${L + 1} of ${band().levels.length}: ${band().levels[L].name}`;
}
// The Wing map: each Wing with its band, open or locked (and what opens it).
function wingsHTML() {
  const open = openWings(progress, recs, st.start);
  return WINGS.map((w) => {
    const b = BANDS[w.band], isOpen = open.includes(w.id), here = w.band === st.band, p = progress[w.id] || {};
    let note;
    if (isOpen) note = p.boss ? `Cleared ${p.boss}×` : p.best ? `Best: ${p.best} of ${w.floors.length + 1} floors` : "Not tried yet";
    else { const t = toOpen(w, progress, recs); note = `🔒 Beat ${t.prev.boss} ${t.boss ? "✓" : ""} · learn ${Math.round(t.need * 100)}% of ${t.prev.name} (${Math.round(t.share * 100)}%)`; }
    return `<label class="wing${here ? " here" : ""}${isOpen ? "" : " locked"}"><input type="radio" name="wing" value="${w.id}" ${here ? "checked" : ""} ${isOpen ? "" : "disabled"}>
      <span><b>${w.name}</b><small>${b.label} · ${b.grades}</small><em>${note}</em></span></label>`;
  }).join("");
}
// The start screen: pick your hero and a Wing, then go. Players, chalk color, the timer and sounds
// are in Settings, as in Sound Box. Names are optional.
function menu() {
  const list = store.profiles();
  show(`<div class="cardhead"><h2>Crawl the Sumgeon</h2><button class="icon-btn" id="sayIntro" type="button" aria-label="Read this aloud">${SPEAKER}</button></div>
  <p>Monsters made of math guard every floor. <strong>Your answer is your attack</strong>: get it right and your digits fly at the monster.</p>
  ${list.length > 1 ? `<p class="playing">Playing as <b>${esc(displayName(list, PID))}</b> <button class="link" type="button" id="switchPlayer">Switch</button></p>` : ""}
  ${captainHTML()}
  <div class="grp"><span>Wings</span><div class="wings">${wingsHTML()}</div>
    <p class="level" id="levelLine">${levelLine()}</p></div>
  <div class="warn" id="warn"></div>
  <div class="btns">${G.running ? '<button class="big alt" id="resume">Keep fighting</button>' : ""}<button class="big" id="go">Enter the dungeon</button></div>
  <button class="link settings-link" type="button" id="openSettings">⚙ Settings</button>`);
  const card = $("card");
  $("sayIntro").onclick = () => say("p", PHRASE.intro, true);
  // A different Wing is a fresh dungeon: its own facts and hearts.
  card.querySelectorAll("input[name=wing]").forEach((i) => i.onchange = () => {
    st.band = wingOf(i.value).band; saveSettings();
    G.running = false; newRun(); loadMonster(0, true);
    menu();
  });
  wireCaptain();
  $("openSettings").onclick = settings;
  if ($("switchPlayer")) $("switchPlayer").onclick = settings;
  $("go").onclick = () => {
    if (!hasCaptain()) { $("warn").textContent = "Pick your hero first."; $("captain").scrollIntoView({ block: "center" }); return; }
    start();
  };
  if ($("resume")) $("resume").onclick = () => { hide(); newProblem(); };
}

// Settings: players (names optional), chalk color, the timer and sounds. All save as they change.
function settings() {
  show(`<div class="cardhead"><h2>Settings</h2></div>
  <div class="grp"><span>Players</span><div id="players">${playersHTML()}</div></div>
  <div class="grp"><span>Chalk color</span><div class="swatches" id="swatches">${swatchesHTML()}</div></div>
  <div class="grp"><span>Pressure</span><div class="chips">${chip("checkbox", "tm", "1", st.timer, "Timer on", "tm")}</div></div>
  <div class="grp"><span>Sounds</span><div class="chips">${chip("checkbox", "sfx", "1", st.sfx, "Sound effects", "sfxOn")}${chip("checkbox", "voice", "1", st.voice, "Voice", "voiceOn")}</div></div>
  <div class="btns"><button class="big" id="done">Done</button></div>
  ${badgesCopy()}`);
  $("tm").onchange = () => { st.timer = $("tm").checked; saveSettings(); };
  $("sfxOn").onchange = () => { st.sfx = $("sfxOn").checked; sfx.setSfx(st.sfx); saveSettings(); soundUI(); };
  $("voiceOn").onchange = () => { st.voice = $("voiceOn").checked; setVoice(st.voice); saveSettings(); soundUI(); };
  wireSwatches();
  wirePlayers();
  $("done").onclick = menu;
}
// The footer's badges (deployed version, license), repeated in Settings, since phones hide the footer.
function badgesCopy() {
  const f = document.querySelector("footer.badges");
  if (!f) return "";
  const c = f.cloneNode(true);
  c.querySelectorAll("[id]").forEach((e) => e.removeAttribute("id"));
  return c.outerHTML;
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

// Choosing a hero, on the start screen and after a run ends: the first time, any of the ten;
// after that, anyone on your team (your heroes and everyone you've rescued; the rest show cursed).
function captainHTML() {
  const first = !hasCaptain();
  const heroes = HEROES.map((h) => {
    const can = first || onTeam(h.d), on = h.d === team.captain;
    return `<button type="button" class="hpick${on ? " on" : ""}" data-d="${h.d}" ${can ? "" : "disabled"} aria-pressed="${on}" aria-label="${can ? h.n : "Cursed, not rescued yet"}">
      ${heroSvg(h, { color: on ? team.color : null, cursed: !can })}<small>${can ? h.n : "???"}</small></button>`;
  }).join("");
  return `<div class="grp" id="captain"><span>${first ? "Pick your hero" : "Your hero"}</span>
    ${first ? '<p class="level">When your answer has your hero\'s digit, it\'s a power hit! Rescue more heroes on the way down.</p>' : ""}
    <div class="heroes">${heroes}</div></div>`;
}
function wireCaptain() {
  const box = $("captain");
  box.querySelectorAll(".hpick:not([disabled])").forEach((b) => b.onclick = () => {
    team.captain = Number(b.dataset.d);
    // The first pick joins the team for good, so it can be picked again later.
    if (!team.rescued.includes(team.captain)) team.rescued.push(team.captain);
    saveTeam();
    say("m", heroName(HEROES[team.captain]), true);
    captainUI(); whoUI();
    if ($("warn")) $("warn").textContent = "";
    box.outerHTML = captainHTML(); wireCaptain();
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
      if (rm.dataset.sure !== "1") { rm.dataset.sure = "1"; rm.textContent = "Remove from this device?"; return; }
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

// After a win, what's left to open the next Wing, if it's still locked.
function nextWingHint() {
  const i = WINGS.indexOf(wing()), nx = WINGS[i + 1];
  if (!nx || openWings(progress, recs, st.start).includes(nx.id)) return "";
  const t = toOpen(nx, progress, recs);
  return `<p>To open <strong>${nx.name}</strong>, learn ${Math.round(t.need * 100)}% of the facts here. You're at ${Math.round(t.share * 100)}%.</p>`;
}
function start() {
  hide();
  newRun();
  Object.assign(G, { hearts: band().hearts, streak: 0, solved: 0, tries: 0, running: true, retry: [], recent: [], next: false });
  stopSpeech();
  loadMonster(0);
  setMsg("Your answer is your attack.");
  newProblem();
}

/* ---------- input ---------- */
function press(k) {
  if (G.next && k === "go") return nextAfterMiss();
  if (G.busy) return;
  if (k === "go") return submit();
  sfx.tick();
  if (k === "del") G.input = G.input.slice(0, -1);
  else if (G.input.length < 4) G.input = (G.input === "0" ? "" : G.input) + k;
  ansUI();
}
$("pad").innerHTML = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0", "go"].map((k) => `<button type="button" data-k="${k}" class="${k === "go" ? "go" : k === "del" ? "del" : ""}" aria-label="${k === "del" ? "Delete" : k === "go" ? "Attack" : k}">${k === "del" ? "⌫" : k === "go" ? "Hit!" : k}</button>`).join("");
$("pad").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) press(b.dataset.k); });
document.addEventListener("keydown", (e) => {
  if (!$("ov").hidden) return;
  if (/^[0-9]$/.test(e.key)) press(e.key);
  else if (e.key === "Backspace") press("del");
  else if (e.key === "Enter") { e.preventDefault(); press("go"); }
});

loadPlayer();
newRun();
loadMonster(0, true);
$("prob").textContent = "7 + 8 =";
menu();
