// Everything on screen: the game loop, the menu and players, and the attack animations.
// Problems, monsters, saving, sound and speech live in their own modules.
import { MON, svg, LOOKS, lookOf, allLooks, CHOMP_SHUT, bossForm } from "./monsters.js";
import { chompPose, morePose, mouthOf, SNAP, FLIP_MS, SNAP_MS, EAT_MS } from "./chomp.js";
import { spokenProblem, spokenFact } from "./problems.js";
import { BANDS, choose, factOf, record as recordAnswer, helpFor, monsterHP, probeKey, tierOf, skipTo, SKIP_PROBES, SKIP_WINDOW, MAX_LEAP, fluentTime, spellKey, RECENT, pool, drawHit, openLevels, reachOf, chaptersOf, pathBands, reviewFacts, placeReviews, examKey, examFacts, examRound, hpOf, endlessKey } from "./learn.js";
import { countSvg, readShape, judgeShape, cleanFor, isDrawKey, SHAPE_LINE, SHAPE_CODE, article } from "./shapes.js";
import { hintFor, STRATEGIES } from "./hints.js";
import { openStore, displayName, DUNGEON_VERSION, DUNGEON_KEYS, LEARNING_RESETS } from "./store.js";
import { PHRASE, monsterName, monsterCleared, monsterWon, heroJoins, heroCursed, heroRescue, heroAlmost, heroHelps, traitLine, BARK, wingCleared, wingOpened, wingEnter, depthLine, DEPTH_MAX_SPOKEN, reversedLine, howToWriteLine, quipLine, squawk, trait2Line, newMonsterLine } from "./lines.js";
import { WINGS, wingOf, runFloors, bossAt, cursedMonster, openWings, toOpen, floorStars, wingStars, depthScale, depthHP, deepest, MAP_DEPTHS, GRADES, gradeLabel, gradeName, withGrade, bandOf, gradeBand, OLD_BANDS, PATHS, chapterOf, stepsOpen, bossStage, isMega, BOSS_HP, MEGA_EVERY, megasOf, stepMonsters, legendDue, openLegend, beatLegend, legendBeaten, legendProgress, LEGEND_HP } from "./wings.js";
import { missingOf, pickBlank, filled, spokenMissing, MISSING_SHARE, canHide } from "./missing.js";
import { rectSvg } from "./third.js";
import { arraySvg } from "./arrays.js";
import { flashSvg, FLASH_DOTS_MS } from "./flash.js";
import { clockSvg, clockFactLine, clockFactHint, clockAnswer, elapsedSvg } from "./clock.js";
import { patternSvg, oddEvenSvg, patternFactHint } from "./patterns.js";
import { tfSvg, tiltOf, fixParts } from "./truefalse.js";
import { lineSvg } from "./numberline.js";
import { pvSvg, pvLine } from "./placevalue.js";
import { dollarSvg, dollarLine, moneyText } from "./dollars.js";
import { coinsSvg, pileOf, coinOf } from "./coins.js";
import { stackOf } from "./twodigit.js";
import { read as readSigil, judge as judgeSigil, offEdge } from "./sigil.js";
import { HANDWRITING } from "./handwriting.js";
import { traitOf, charged, prefers, hitBy, atHalf, asks, flipOf, flashOf, dieSvg, mega } from "./traits.js";
import { roster, mastery, meet, beat, renamed, RENAMED } from "./bestiary.js";
import { HEROES, CHALK, heroSvg, freePick, pickHero, curseCaptain, crackCurse, CURSE_HITS, resetTeam } from "./heroes.js";
import * as sfx from "./sfx.js";
import { say, stopSpeech, setVoice, speaking, cutOff, needSprites, spriteStatus, saveVoice, offlineStatus, onTalk, isTalking } from "./speech.js";
import { start as startMusic, DEFAULT_LEVEL as MUSIC_LEVEL } from "./music.js";
import { byLevel, offlineLine } from "./offline.js";
import { freshState as freshMoments, freshRun, decide as decideMoment, joined, heardOf, nameLine } from "./moments.js";
import { playMoment } from "./slowmo.js";
import { playDescent, descending, skipDescent, surfaceHTML } from "./descent.js";
import { plushSvg, plushById, favoriteOf, heroOfPlush, PLUSH_HEART } from "./plushie.js";
import { chestAfter, lockKey, lockOf, contents, moneyFor, fewest, setBills, ITEMS, itemOf, SLOTS, freshItems, countOf, gain, putInSlot, clearSlot, useSlot, eatPie, arm, blockMiss, totemMult, magnetSpent, freshWardrobe, addPiece, wearOf, putOn, ownedFor, unowned, billsOn, addPlush, hasPlush, plushLeft } from "./loot.js";
import { kPrices, priceOf, MANY, manyOK, howMany, mostFor, sumText, moneyText as moneyAmt, timesOK, payMany, freshShop, restock, forSale, TOKENS, valueOf, empty as emptyCounter, total as counterTotal, left as purseLeft, purseFor, putDown, takeBack, enough, canAfford } from "./shop.js";
import { CLOTHES, SPOTS, clothesById, pieceSvg } from "./clothes.js";
import { LOOT, askLine, itemName, itemWhat, itemUse, moneyLine, purseLine, ALWAYS, runSprites, SHOP, clothingName, priceLine, changeLine, manyLine, affordLine, plushName, plushFavLine } from "./lines.js";
import { stepRows, stratumSummary, strataOrder, gridOf, gridsFor, kindsFor, needsWork, factLabel, factDetail, factState, STATE_WORDS, secs } from "./progress.js";
import { chestSvg, purseSvg, walletSvg, walletMini, stallSvg, priceTag, billSvg, pieSvg } from "./chest.js";
import { newKey, keysFor, isKey, linkFor, keyFromLink } from "./seal.js";
import { syncPlayer, remoteVersion, SYNC_URL } from "./sync.js";
import { SYNCED_KEYS, canon, pack, unpack } from "./merge.js";
import { linkQR } from "./linkqr.js";
import { award as awardAchievements, catalog as achCatalog, freshAchievements, unseen as unseenAchievements, rewardOf, achievementOf, cardLines, ACHIEVEMENT_IDS,
  isComeback, notePracticeDay, holidaysOn, hitSurprises, noteEvent, keepDays, dayNumber } from "./achievements.js";
import { renderCard, shareCard } from "./sharecard.js";
import { installWay, isIPad, safariVersion, iosSteps, ICONS as INSTALL_ICONS } from "./install.js";
import { achievementLine } from "./lines.js";

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
// wallet: money in cents; inv: the items (loot.js freshItems: counts and the 3 quick-use slots).
// ach: achievements (achievements.js), { earned: { id: time }, seen: [ids shown on a card] }.
let PID, st, recs, team, progress, seen, wallet = 0, inv = freshItems(), wardrobe = freshWardrobe(), shop = freshShop(), ach = freshAchievements();
const band = () => BANDS[st.band] || BANDS.kinder;
const wingFor = (b) => WINGS.find((w) => w.band === b) || WINGS[0];
const wing = () => wingFor(st.band);
// A floor's art: a cursed digit is its hero, darkened (DESIGN.md §6.6).
const cracksOf = (d) => (team.cracks || {})[d] || 0;
const monsterArt = (m, cls) => (m.cursed != null ? heroSvg(HEROES[m.cursed], { cursed: true, cls, cracks: cracksOf(m.cursed) }) : svg(m, cls));
// The dungeon's version (DUNGEON_VERSION, its history and what it resets) lives in store.js, so
// merge.js can tell a record from before a bump.
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
  seen = renamed(store.player(PID).get("bestiary", {}) || {});
  MS = freshMoments(store.player(PID).get("moments", null));
  wallet = Math.max(0, Math.floor(Number(store.player(PID).get("wallet", 0)) || 0));
  inv = freshItems(store.player(PID).get("items", null));
  wardrobe = freshWardrobe(store.player(PID).get("wardrobe", null));
  shop = freshShop(store.player(PID).get("shop", null));
  if (WALLET_AT != null) { wallet = WALLET_AT; saveWallet(); }
  // Achievements already met (a player who qualified before they were built, or progress a sync
  // brought) are awarded now, quietly; their cards play before the next descent.
  ach = freshAchievements(store.player(PID).get("achievements", null));
  // Practice days (DESIGN.md §14.4) from before they were counted: each fact's last-seen day is a
  // day that was played (a union, so doing it every time adds nothing twice).
  const had = ach.days.length;
  ach.days = keepDays(ach.days, Object.values(recs).map((f) => (f && f.t > 0 ? dayNumber(f.t) : 0)));
  if (ach.days.length !== had) saveAch();
  checkAchievements();
  // A captain picked before heroes could change stays on the team.
  if (team.captain != null && !team.rescued.includes(team.captain)) { team.rescued.push(team.captain); saveTeam(); }
  // Bands saved before the grade strata (dungeon version 5) become a grade's: a player who picked a
  // grade starts in that grade's stratum, as a new one would.
  if (OLD_BANDS[st.band] || OLD_BANDS[st.start]) {
    const was = OLD_BANDS[st.start] || st.start || OLD_BANDS[st.band] || "kinder";
    st.start = st.grade != null && BANDS[gradeBand(st.grade)].grade > BANDS[was].grade ? gradeBand(st.grade) : was;
    st.band = st.start; saveSettings();
  }
  // The band a player started in opens its Wing from the start (DESIGN.md §4).
  if (!st.start) { st.start = st.band; saveSettings(); }
  if (!openWings(progress, recs, st.start).includes(wingFor(st.band).id)) { st.band = WINGS[0].band; saveSettings(); }
  sfx.setSfx(st.sfx);
  setVoice(st.voice);
  whoUI(); captainUI();
}
function saveTeam() { store.player(PID).set("heroes", team); }
function saveWallet() { store.player(PID).set("wallet", wallet); }
function saveItems() { store.player(PID).set("items", inv); }
function saveWardrobe() { store.player(PID).set("wardrobe", wardrobe); }
function saveShop() { store.player(PID).set("shop", shop); }
function saveAch() { store.player(PID).set("achievements", ach); }
// What achievements.js works them out from.
const achState = () => ({ facts: recs, wings: progress, moments: MS, wallet, ach });
// Achievements newly met (achievements.js award), recorded quietly with their rewards (coins into
// the wallet, items into the inventory, a special piece into the wardrobe), never interrupting a
// fight: their cards play before the next descent (achievementCards). Checked as the player loads,
// after each answer and lock, after a chest's coins, and at a run's end.
function checkAchievements() {
  const got = awardAchievements(achState(), ach.earned, Date.now());
  payAchievements(got.map((a) => a.id));
  return got;
}
function payAchievements(ids) {
  if (!ids.length) return;
  for (const id of ids) {
    const r = rewardOf(id);
    wallet += r.cents;
    for (const [k, n] of Object.entries(r.items)) gain(inv, k, n);
    if (r.piece) addPiece(wardrobe, r.piece);
  }
  saveAch(); saveWallet(); saveItems(); saveWardrobe();
  if (G.running) slotsUI(); // the first item found shows the slots
}
// Surprises seen in play (DESIGN.md §14.5: a hit, a payment, a floor cleared a certain way),
// recorded as they happen, just as quietly; ?achievements test runs record nothing.
function surprise(...ids) {
  if (LEGEND_TEST) return; // ?legend's practice run saves nothing
  payAchievements(ids.filter((id) => noteEvent(ach.earned, id, Date.now())));
}
// ?wallet=<cents> sets the wallet, for testing the shop.
const WALLET_AT = new URLSearchParams(location.search).has("wallet") ? Math.max(0, Math.floor(Number(new URLSearchParams(location.search).get("wallet"))) || 0) : null;
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
// A team hero as drawn everywhere: the captain in your chalk color, each in their outfit (the
// wardrobe, DESIGN.md §6.3).
const dressOf = (d) => wearOf(wardrobe, d);
const heroArt = (d, cls) => heroSvg(HEROES[d], { color: d === team.captain ? team.color : null, cls, wear: dressOf(d) });
// The captain beside the hearts, and in "Playing as".
function captainUI() {
  const c = $("captainMini");
  c.innerHTML = hasCaptain() ? heroArt(team.captain) : "";
  c.setAttribute("aria-label", hasCaptain() ? `Your captain, ${HEROES[team.captain].n}` : "You");
  c.classList.toggle("none", !hasCaptain());
}
function saveSettings() { store.player(PID).set("settings", st); }

// The share symbol Apple uses (a box open at the top, an arrow rising out of it), drawn in
// currentColor, in place of the 📤 emoji, which reads as an inbox tray.
const SHARE_ICON = '<svg class="share-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 9.5H6.8a1.8 1.8 0 0 0-1.8 1.8v8.4a1.8 1.8 0 0 0 1.8 1.8h10.4a1.8 1.8 0 0 0 1.8-1.8v-8.4a1.8 1.8 0 0 0-1.8-1.8h-1.7"/><path d="M12 14.5V2.8M8.2 6.4 12 2.6l3.8 3.8"/></svg>';
const SPEAKER = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
const GEAR = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/><circle cx="12" cy="12" r="6.5"/></svg>';
$("sayProb").innerHTML = SPEAKER;
$("sayProb").onclick = () => {
  if (!G.cur) return;
  // Pipsqueak's dice are read as dots to count, not as the sum they stand for.
  if (G.cur.dice) say("p", PHRASE.diceAll, true);
  else if (G.cur.fact) say("q", spokenMissing(G.cur), true);
  else say("q", spokenProblem(G.cur), true);
  // A spell or a shape to draw: what to do, every time it's asked for.
  if (G.cur.spell) say("p", PHRASE.spellHow);
  else if (G.cur.draw) say("p", PHRASE.drawHow);
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
  retry: [], recent: [], hinted: false, t0: 0, next: false,
  // Items (loot.js): fx: the Shield, Totem and Magnet armed.
  fx: {}, chest: null };

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
/* ---------- items in a fight (loot.js, DESIGN.md §6.3) ----------
   Three quick-use slots by the hearts, each holding one item. Tap one to use it (not while busy;
   mid-problem is fine). Each item is one use: the slot empties and stays empty; it never refills
   by itself. An empty slot is a dim outline with a "+" that opens 🎒 Items (as pausing to it
   does), the only place slots are filled. An armed Shield, Totem or Magnet shows by the problem
   until it's used (the Totem as a gold ×2). Hidden for a player with no items. */
// An item's icon: its emoji, but the Times Two Totem is a gold "×2" (the ✖️ emoji is a thin grey
// cross on the dark slots).
const itemIcon = (id) => (id === "totem" ? '<span class="tot">×2</span>' : id === "pie" ? PIE : itemOf(id).icon);
const PIE = `<span class="pie">${pieSvg()}</span>`; // a drawn pie with a π vented in the crust (chest.js)
function slotsUI() {
  const box = $("slots");
  const any = inv.slots.some(Boolean) || ITEMS.some((i) => countOf(inv, i.id));
  // What's on, by the problem: a gold ×2 (the Totem), 🛡️ and 🧲, until each is used.
  const on = ["totem", "shield", "magnet"].filter((id) => G.fx[id]);
  $("armed").hidden = !on.length;
  $("armed").innerHTML = on.map((id) => `<i class="on-${id}" title="${esc(itemOf(id).name)}">${id === "totem" ? "×2" : itemOf(id).icon}</i>`).join("");
  box.hidden = !any;
  if (!any) return;
  box.innerHTML = inv.slots.map((id, k) => !id
    ? `<button type="button" class="slot empty" data-k="${k}" aria-label="Empty slot: open your items"><span aria-hidden="true">+</span></button>`
    : `<button type="button" class="slot" data-k="${k}" aria-label="Use ${esc(itemOf(id).name)}"><span class="ico" aria-hidden="true">${itemIcon(id)}</span></button>`).join("");
}
function useItem(k) {
  if (!G.running || G.busy || G.paused || G.next || !$("ov").hidden) return;
  const id = inv.slots[k];
  // An empty slot opens 🎒 Items, paused: Done goes straight back to the fight, where it was.
  if (!id) { pause(); if (G.paused) itemsCard(true, false, true); return; }
  if (id === "pie") {
    const r = eatPie(G.hearts, band().hearts);
    if (!r.used) { say("p", LOOT.heartsFull, true); return; }
    G.hearts = r.hearts; heartsUI();
  } else if (G.fx[id]) return; // already on: a second isn't wasted
  useSlot(inv, k); saveItems();
  if (id !== "pie") arm(G.fx, id);
  sfx.powerUp();
  say("p", itemUse(id), true);
  // What it does, the first time it's used.
  if (once("use:" + id)) say("p", itemWhat(id));
  slotsUI();
}
$("slots").addEventListener("click", (e) => { const b = e.target.closest(".slot"); if (b) useItem(Number(b.dataset.k)); });
// Unused armed effects (a Shield never needed) go back in the inventory when a run ends.
function refundArmed() {
  ["shield", "totem", "magnet"].forEach((id) => { if (G.fx[id]) gain(inv, id); });
  G.fx = {};
  saveItems();
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
// Ones first (right to left): a stacked problem anywhere, and on Margot-Rythm's floor every + or −
// answer of two or more columns, written across too, so her floor is all one way (the kids found
// switching confusing). Not a □ problem (typed into its □) or one with slots.
const onMargot = () => { const m = G.floors && G.floors[G.floor]; return !!m && (m.base || m.n) === "Margot-Rythm" && G.hp > 0; };
// Ones first (right to left): only a stacked problem, in columns, as it's worked on paper (on every
// floor; Margot-Rythm's are almost all stacked). Answers written across are typed left to right.
function onesFirst(p) {
  return !!(p && p.stacked);
}
// The typed digits under the line swap places, each sliding (in an arc, the outer ones over the
// top) to its mirror column, glowing, then done(). Reduced motion: a short glow, no slide.
const SWAP_MS = 900;
function flipCells(done) {
  const cells = [...document.querySelectorAll("#blank .scell")].filter((c) => c.textContent);
  if (cells.length < 2 || reduced()) { cells.forEach((c) => c.classList.add("flipglow")); setTimeout(done, reduced() ? 500 : 0); return; }
  const xs = cells.map((c) => c.getBoundingClientRect().left), n = cells.length;
  cells.forEach((c, i) => {
    const dx = xs[n - 1 - i] - xs[i], up = (i < n / 2 ? -1 : 1) * 0.55;
    c.classList.add("flipglow");
    c.animate([{ transform: "translate(0,0)" }, { transform: `translate(${dx / 2}px,${up}em) scale(1.15)` }, { transform: `translate(${dx}px,0)` }],
      { duration: SWAP_MS - 150, easing: "ease-in-out", fill: "forwards", delay: 120 });
  });
  setTimeout(done, SWAP_MS + 120);
}
function ansUI() {
  $("ans").textContent = G.input;
  // A whole time in two slots (Tick-Tockus): the one being typed glows, the one to come waits,
  // and Hit! says which: "Hour ✓", then "Minutes!".
  const go = $("pad").dataset.mode === "num" ? $("pad").querySelector('[data-k="go"]') : null;
  if (G.cur && G.cur.slots && G.slot) {
    G.slot.vals.forEach((v, i) => {
      const b = $("blank" + i);
      if (!b) return;
      b.textContent = v || "?";
      b.classList.toggle("typed", !!v); b.classList.toggle("now", i === G.slot.at); b.classList.toggle("wait", i > G.slot.at && !v);
    });
    // Dollars and cents (Trollar) the same way: "Dollars ✓", then "Cents!".
    const [first, last] = G.cur.op === "$" ? ["Dollars ✓", "Cents!"] : ["Hour ✓", "Minutes!"], what = G.cur.op === "$" ? ["dollars", "cents"] : ["hour", "minutes"];
    if (go) { go.textContent = G.slot.at ? last : first; go.classList.add("longkey"); go.setAttribute("aria-label", G.slot.at ? `Attack with the ${what[1]}` : `The ${what[0]} ${G.cur.op === "$" ? "are" : "is"} done`); }
  } else if (go && go.textContent !== "Hit!") { go.textContent = "Hit!"; go.classList.remove("longkey"); go.setAttribute("aria-label", "Attack"); }
  // The slimes (Slimelipsis): the □ slime fills as you type.
  if (G.cur && G.cur.op === "…") $("prob").innerHTML = slimeRow(G.cur);
  // A missing-number problem fills its □ as you type.
  if (G.cur && G.cur.stacked && $("blank")) { $("blank").innerHTML = stackCells(G.cur, G.input); $("blank").classList.toggle("typed", !!G.input); }
  else if ($("blank")) { $("blank").textContent = G.input || "?"; $("blank").classList.toggle("typed", !!G.input); }
}
// The problem as shown: "3 + 4 =", or with a glowing □ for a missing number ("3 + □ = 7").
const BLANK = '<span class="blank" id="blank">?</span>';
const side = (lr, t) => `<span class="side" data-side="${lr}">${t}</span>`;
// A fraction stacked, numerator over denominator: "1/2" → ½ drawn as two rows.
const stacked = (t) => t.replace(/(\d+|□)\/(\d+)/g, '<span class="frac"><span>$1</span><span>$2</span></span>');
function probUI() {
  const p = G.cur, box = $("prob");
  // Batch 2 (DESIGN.md §4.1): each with its picture over the line, the hint drawn on the picture.
  // True or false (the Equal Twins): the scale with the equation on it, answered on the True and
  // False keys; once answered it swings to the truth (G.tfDone).
  if (p.op === "✓") box.innerHTML = tfSvg(p, Object.assign({ bare: true }, G.tfDone ? { done: true, from: reduced() ? null : 0 } : { hint: G.hinted })) + `<span class="find tfline">${esc(p.q)}</span><span class="tfask">True or false?</span>`;
  // Fix it: the false equation's scale, tipped; its wrong number lifts above its place and the □
  // takes it (fixLine). Right, the number drops in and the scale levels.
  else if (p.op === "✎") box.innerHTML = tfSvg(p, G.fix && G.fix.done ? { value: p.ans, from: reduced() ? null : tiltOf(p.eq) } : { hint: G.hinted }) + `<span class="find fixline">${fixLine(p)}</span>`;
  // The number line (Halfling): "□/4" under it, stacked like the Tower's fractions, or "Equal parts = □".
  else if (p.op === "↔") box.innerHTML = lineSvg(p, { hint: G.hinted }) + `<span class="find">${p.kind === "parts" ? `Equal parts = ${BLANK}` : `<span class="frac"><span>${BLANK}</span><span>${p.d}</span></span>`}</span>`;
  // Place value (Haberhasher): the blocks on their mat, and the question under them.
  else if (p.op === "#") box.innerHTML = pvSvg(p, { hint: G.hinted }) + `<span class="find pvline">${pvLine(p).map((x) => (x === null ? BLANK : esc(x))).join("")}</span>`;
  // Dollars (Trollar): the bills (and coins), and "$□" or "$□ and □¢" in two slots.
  else if (p.op === "$") box.innerHTML = dollarSvg(p, { hint: G.hinted }) + `<span class="find tline">${dollarLine(p).map((x, i, a) => (x !== null ? esc(x) : slotHTML(a.slice(0, i).filter((y) => y === null).length, p))).join("")}</span>`;
  // Shapes (Polly-Gon): "Draw a triangle" over the drawing pad, or the shape to count over its
  // line ("Sides = □", "Each part = 1/□"), the hint drawn on the shape.
  else if (p.op === "◇") box.innerHTML = shapeHTML(p);
  // The dot flash (Pipsqueak): the dots for a moment, then face down with "Show me again" (once),
  // and "Dots = □" under them. The hint (or a miss) brings them back, grouped.
  else if (p.op === "⁙") box.innerHTML = flashHTML(p);
  // A two- or three-digit sum or difference, stacked in columns (G.cur.stacked): ones under ones,
  // a line, and the answer filling in under it, right-aligned.
  else if (p.stacked) box.innerHTML = stackHTML(p);
  // Time (Tick-Tockus): the clock is the monster itself (clockArt), so here only the line: "□
  // o'clock", "3:□", or "□:□□" in two slots. Elapsed time shows its two clocks (or one) over it,
  // and a time asked by another monster (a missed one coming back) a plain clock.
  else if (p.op === "⌚") box.innerHTML = timePicture(p) + `<span class="find tline">${clockFactLine(p).map((x, i, a) => (x !== null ? esc(x) : slotHTML(a.slice(0, i).filter((y) => y === null).length, p))).join("")}</span>`;
  // What comes next (Slimelipsis): the row of slimes, the □ one glowing and filling as you type.
  else if (p.op === "…") box.innerHTML = slimeRow(p);
  // Odd and even: the slimes holding their numbers, and "Even numbers = □" under them.
  else if (p.op === "◐") box.innerHTML = oddEvenSvg(p, { hint: G.hinted, perRow: p.nums.length <= 6 ? p.nums.length : 4 }) + `<span class="find">${p.ask === "even" ? "Even" : "Odd"} numbers = ${BLANK}</span>`;
  // A comparison: each side in its own box, so Chompers can eat the bigger one (chompAct).
  // Fractions (the Tower) stacked, as the Tower shows them: 3/8 ○ 5/8.
  else if (p.sym && p.op === "○") box.innerHTML = `${side("l", p.frac ? stacked(esc(p.l)) : esc(p.l))} ${BLANK} ${side("r", p.frac ? stacked(esc(p.r)) : esc(p.r))}`;
  else if (p.blank || p.sym || p.op === "=") box.innerHTML = esc(p.q).replace("□", BLANK);
  // "7 or 4": which is more (K). The voice asks it; the answer box is the answer.
  else if (p.op === "more") box.innerHTML = `${side("l", p.x)} <small class="or">or</small> ${side("r", p.y)}`;
  // Fractions, stacked, with the glowing □ as the hidden numerator: 1/2 = □/4.
  else if (p.op === "/") box.innerHTML = stacked(esc(p.q)).replace("□", BLANK);
  // Rounding: 47 ≈ □, and to what.
  else if (p.op === "≈") box.innerHTML = esc(p.q).replace("□", BLANK) + `<small class="to">nearest ${p.to}</small>`;
  // A rectangle, drawn: "Area = □".
  else if (p.op === "▭") box.innerHTML = rectSvg(p) + `<span class="find">${esc(p.q).replace("□", BLANK)}</span>`;
  // An array (Squaresquatch), drawn: rows of dots, and "5 + 5 + 5 = □" under them.
  else if (p.op === "▦") box.innerHTML = arraySvg(p) + `<span class="find">${esc(p.q).replace("□", BLANK)}</span>`;
  // Three numbers (Triceraplus), a little smaller so "4 + 6 + 3 =" fits beside the buttons on a small phone.
  // Four two-digit numbers (Triceraplus in the Mines) smaller still, so the line fits an iPhone SE.
  // (Thin spaces round the + signs for four numbers.)
  else if (p.op === "Σ") { const four = p.nums && p.nums.length > 3; box.innerHTML = `<span class="sum3${four ? " sum4" : Math.max(...(p.nums || [0])) >= 10 ? " sum3w" : ""}">${four ? esc(p.q).replace(/ \+ /g, "\u2009+\u2009") : esc(p.q)} =</span>`; }
  // Dice (Pipsqueak's Flash): each number as a die, to count by sight. They stay dice: once the
  // hint is open (G.hinted), each die gets its number in a little gold badge beside it.
  else if (p.dice) { const die = (n) => `<span class="dn${G.hinted ? " told" : ""}" data-n="${n}">${dieSvg(n)}${G.hinted ? `<b class="dnum" aria-hidden="true">${n}</b>` : ""}</span>`; box.innerHTML = `${die(p.x)} + ${die(p.y)} =`; }
  // "How many quarters?": the pile, then "quarters = ?" with a □ that fills as you type, as a
  // missing number does, under the pile (styles.css .game.find), so it fits a phone.
  else if (p.op === "¢" && p.find) box.innerHTML = coinsSvg(p.pile) + `<span class="find">${coinOf(p.find).names} = <span class="blank" id="blank">?</span></span>`;
  else if (p.op === "¢") box.innerHTML = coinsSvg(p.pile) + " =";
  // Flipped by Judo Judy: each number in its own box, so the throw can swap them (judoThrow).
  else if (p.flipped) box.innerHTML = `<span class="jn">${p.x}</span> <span class="jop">${p.op}</span> <span class="jn">${p.y}</span> =`;
  // Three-digit numbers on one line ("287 + 359 ="), a little smaller so it fits an iPhone SE.
  else if ((p.op === "+" || p.op === "-") && Math.max(p.x, p.y) >= 100) box.innerHTML = `<span class="wide3">${esc(p.q)} =</span>`;
  else box.textContent = p.q + " =";
  document.querySelector(".game").classList.toggle("missing", !!p.blank || !!p.sym || p.op === "=" || !!p.find || !!p.stacked || "/≈▭▦⌚…◐✓✎↔#$◇⁙".includes(p.op));
  padUI(p.spell ? "spell" : p.draw ? "draw" : p.op === "✓" ? "tf" : p.sym ? "cmp" : "num");
  document.querySelector(".game").classList.toggle("cents", p.op === "¢" && !p.find);
  document.querySelector(".game").classList.toggle("find", !!p.find || "▭▦⌚◐✓✎↔#$⁙".includes(p.op) || (p.op === "◇" && !p.draw));
  document.querySelector(".game").classList.toggle("shape", p.op === "◇" && !p.draw);
  document.querySelector(".game").classList.toggle("stack", !!p.stacked);
  // A wide picture over its line (batch 2's): on phones the 🔊 and 💡 buttons stack beside it.
  document.querySelector(".game").classList.toggle("pic", "✓✎↔#$⁙".includes(p.op));
  document.querySelector(".game").classList.toggle("slimes", p.op === "…" || p.op === "◐");
  document.querySelector(".game").classList.toggle("hinted", !!G.hinted); // a hint drawn on the picture (iPad keeps it short)
}
// Answer slot i of a problem: one slot is the usual glowing □ (#blank); two (a whole time) are
// #blank0 and #blank1, the hour, then the minutes.
function flashHTML(p) {
  const F = G.flash || {}, hidden = !F.shown && !F.grouped;
  const peek = hidden && !F.peeked ? '<button type="button" class="peek" id="peek">👀 Show me again</button>' : "";
  return `<span class="dotcard${hidden ? " down" : ""}">${flashSvg(p, { hidden, hint: F.grouped })}${peek}</span><span class="find">Dots = ${BLANK}</span>`;
}
const slotHTML = (i, p) => (p.slots ? `<span class="blank tslot${i ? " wait" : " now"}" id="blank${i}">?</span>` : BLANK);
// Fix it's line: the false equation, its wrong number in place for a moment, then (G.fix.swapped)
// crossed out and lifted above its place, small and red, the □ taking its place, so the line
// always reads as one equation. Right, the number settles in and the crossed-out one fades.
function fixLine(p) {
  const wrong = p.eq[p.eq.fix][p.eq[p.eq.fix].length - 1], f = G.fix || {};
  const slot = f.done ? `<span class="blank typed fixin">${p.ans}</span>` : BLANK;
  return fixParts(p).map((x) => (x !== null ? esc(x) : f.swapped ? `<span class="fixslot${f.done ? " settled" : ""}"><s class="was">${wrong}</s>${slot}</span>` : `<span class="fixslot pre">${wrong}</span>`)).join("");
}
// Stacked in columns: each number right-aligned over the other, the sign at the left of the second,
// a line, and the answer's □ under it, right-aligned, as wide as the widest number.
// Adding up to four numbers (Triceraplus in the Mines) stacks them all, the + by the last.
// How many columns a stacked problem has: the widest number or the answer.
const stackWidth = (p) => Math.max(...(p.nums || [p.x, p.y]).map((n) => String(n).length), String(p.ans).length);
// The answer row under the line: one cell per column, filled from the right as digits are typed
// (right to left, ones first, as it's worked on paper), with a blinking cursor in the next column to
// fill. On Margot-Rythm's floor an answer written across is typed the same way (onesFirst), in the
// same cells, so her floor never switches direction.
function stackCells(p, typed) {
  const w = stackWidth(p), t = String(typed || "");
  return Array.from({ length: w }, (_, i) => {
    const fromRight = w - 1 - i, d = fromRight < t.length ? t[t.length - 1 - fromRight] : "";
    const cur = !d && fromRight === t.length;
    return `<span class="scell${d ? " full" : ""}${cur ? " cur" : ""}">${d ? esc(d) : ""}</span>`;
  }).join("");
}
function stackHTML(p) {
  const nums = p.nums || [p.x, p.y], w = stackWidth(p);
  const rows = nums.map((n, i) => `<span class="sop">${i === nums.length - 1 ? (p.op === "-" ? "−" : "+") : ""}</span><span class="snum">${n}</span>`).join("");
  return `<span class="stacked${nums.length > 2 ? " rows" + nums.length : ""}" style="--w:${w}" role="img" aria-label="${esc(p.q)}">${rows}<span class="sbar"></span><span class="sop"></span><span class="snum sans"><span class="blank scells" id="blank" aria-label="Answer, typed from the ones">${stackCells(p, "")}</span></span></span>`;
}
// A shape problem (Polly-Gon): what to draw (the voice says it too; the body flashes it), or the
// shape to count over its line, with the hint drawn on it once it's open.
function shapeHTML(p) {
  if (p.draw) return `<span class="drawask">Draw ${article(p.shape)}<b>${esc(p.shape)}</b></span>`;
  const pic = countSvg(p, { hint: G.hinted });
  if (p.kind === "unit") return pic + `<span class="find">Each part = <span class="frac"><span>1</span><span>${BLANK}</span></span></span>`;
  return pic + `<span class="find">${SHAPE_LINE[p.kind]} = ${BLANK}</span>`;
}
// How often a two- or three-digit + or − is stacked (always on Margot-Rythm's floor: her art is a
// stacked sum with a carried 1). ?stacked stacks every one, for testing.
const STACK_ALWAYS = new URLSearchParams(location.search).has("stacked");
// Is the monster on this floor Tick-Tockus (or one of its looks)? Then the clock is the monster.
const onClock = () => { const m = G.floors && G.floors[G.floor]; return !!m && (m.base || m.n) === "Tick-Tockus"; };
// Tick-Tockus showing the problem's time (elapsed time's start), with the hint's layer on it.
function clockArt(layer) {
  const p = G.cur;
  if (!onClock() || !p || p.op !== "⌚") return;
  $("mon").innerHTML = monsterArt(Object.assign({}, G.floors[G.floor], { at: { h: p.h, m: p.m, layer } }));
}
// The picture over a time problem's line: elapsed time's clocks (with the open number line or
// the sweep once the hint is open), or a plain clock when the monster isn't Tick-Tockus.
function timePicture(p) {
  if (p.kind === "long" || p.kind === "add") return elapsedSvg(p, { hint: G.hinted });
  if (onClock()) return "";
  return clockSvg(p.h, p.m, { monster: false, hint: G.hinted ? clockFactHint(p, false).layer : null, label: "a clock" }).replace('<svg viewBox="0 0 240 240"', '<svg viewBox="-16 -16 272 272"');
}
// The slimes' row (Slimelipsis), with what's typed in the □ and the hint's hops once it's open.
const slimeRow = (p) => patternSvg(p, { typed: G.input, hops: G.hinted ? patternFactHint(p, false).hops : null, label: p.q });
// The facts a monster asks: its strand in this stratum (Trollar's coins) or the stratum's band.
const strandOf = (m) => bandOf(wing(), m);
// The stratum's path (wings.js PATHS, DESIGN.md §4.3): the chapter reached (?chapter=N tries
// another, for testing; not saved), the steps open now, and a band's open levels in them.
const CHAPTER_AT = Number(new URLSearchParams(location.search).get("chapter")) || 0;
const chapterNow = (w = wing()) => (CHAPTER_AT ? Math.min(CHAPTER_AT, chaptersOf(PATHS[w.id])) : chapterOf(w, progress));
const stepsNow = (w = wing()) => stepsOpen(w, progress, recs, chapterNow(w));
const levelsFor = (bk, w = wing()) => openLevels(PATHS[w.id], stepsNow(w).open, bk);
// The Legend boss (DESIGN.md §14.2, wings.js legendDue): once a stratum's priority steps are
// mastered, the next run there ends with its boss's golden form, at any depth, until it's beaten.
// ?legend treats the stratum as mastered, for testing (with ?floor=6 to start at the boss).
const LEGEND_TEST = new URLSearchParams(location.search).has("legend");
// Endless (DESIGN.md §6.4): a stratum whose Legend is beaten keeps going, asking the facts already
// learned there (learn.js endlessKey). ?endless treats the stratum played as Legend-beaten, for
// testing (nothing saved).
const ENDLESS_TEST = new URLSearchParams(location.search).has("endless");
const endlessOn = (w = wing()) => legendBeaten(w, progress) || (ENDLESS_TEST && w.id === wing().id);
const legendNow = (w = wing()) => !(ENDLESS_TEST && w.id === wing().id) && legendDue(w, progress, recs, LEGEND_TEST);
const onLegend = () => { const m = G.floors && G.floors[G.floor]; return !!m && m.form === "legend"; };
// The band the problem on screen is from: the Legend's exam mixes every band and strand of the
// path (G.examBand), every other fight asks the monster's own (strandOf).
const curBand = () => G.examBand || strandOf(G.floors[G.floor]);
// Monsters arriving as their step opens (DESIGN.md §4.3): kept for the next floor-cleared or end
// card ("A new monster appears in the Mines: Squaresquatch!"), and they take a depth-1 floor from
// the next run.
function arrived(before, after) {
  const path = PATHS[wing().id], was = stepMonsters(path, before);
  for (const n of stepMonsters(path, after)) if (!was.includes(n) && !(G.news || []).includes(n)) (G.news ||= []).push(n);
}
// The card's announcement of the monsters that arrived, said aloud; then they've been announced.
function newsHTML() {
  const names = G.news || [], w = wing();
  G.news = [];
  return names.map((n) => {
    const m = MON.find((x) => x.n === n);
    say("p", newMonsterLine(m, w));
    return `<div class="newmon" role="status"><div class="cardmon small">${monsterArt(m)}</div><p><b>A new monster appears!</b>${esc(n)} joins ${esc(wing().name.replace(/^The /, "the "))}.</p></div>`;
  }).join("");
}
// A step that joined stays open: the most that ever joined is saved with the stratum's progress.
function keepSteps(w = wing()) {
  const n = stepsNow(w).joined, p = progress[w.id] || (progress[w.id] = { boss: 0, best: 0 });
  if (n > (p.steps || 0)) { p.steps = n; store.player(PID).set("wings", progress); }
}
// A problem with its answer, for the miss message and the Oops card: "3 + 4 = 7", "3 + 4 = 7"
// for 3 + □ = 7, and "10 + 5 + 1 = 16¢" for coins (just "16¢" for one coin, "2 dimes" for
// finding them).
function shownFact(p, ans) {
  // Time, patterns, and odd and even show their own answers ("3:35", "2, 4, 6, 8", "3 even
  // numbers"), in bold on the Oops card.
  const bold = typeof ans === "string" && ans.startsWith("<b>"), b = (t) => (bold ? `<b>${esc(t)}</b>` : esc(t));
  if (p.op === "⌚") return p.kind === "long" ? `${esc(p.q)}: ${b(clockAnswer(p))}` : p.kind === "add" ? `${esc(p.q)} = ${b(clockAnswer(p))}` : b(clockAnswer(p));
  if (p.op === "…") return p.nums.map((n, i) => (i === p.blank ? b(n) : n)).join(", ");
  if (p.op === "◐") return `${b(p.ans)} ${p.ask} number${p.ans === 1 ? "" : "s"}`;
  // Batch 2: "4 + 2 = 7 is False", fix it filled in ("4 + 2 = 6"), "3/4", "4 equal parts",
  // "34 tens and 3 ones = 343", "$26", "$11 and 37¢".
  if (p.op === "✓") return `${esc(p.q)} is ${b(p.sym === "T" ? "True" : "False")}`;
  if (p.op === "✎") return fixParts(p).map((x) => (x !== null ? esc(x) : b(p.ans))).join("");
  if (p.op === "↔") return p.kind === "parts" ? `${b(p.d)} equal parts` : `${b(p.n)}/${p.d}`;
  if (p.op === "#") return pvLine(p).map((x) => (x !== null ? esc(x) : b(p.ans))).join("");
  if (p.op === "$") return b(moneyText(p));
  // The dot flash: "2 + 2 = 4", or "1 dot".
  if (p.op === "⁙") return p.groups.length > 1 ? `${p.groups.join(" + ")} = ${b(p.ans)}` : `${b(p.ans)} dot`;
  // Shapes: "Here's a triangle." (a drawing), "A hexagon has 6 sides", "Corners = 5",
  // "Each part = 1/4".
  if (p.op === "◇") {
    if (p.draw) return `Here's ${article(p.shape)}${b(p.shape)}.`;
    if (p.kind === "unit") return `Each part = 1/${b(p.ans)}`;
    if (p.shape) return `${esc(article(p.shape).trim().replace(/^a/, "A"))} ${esc(p.shape)} has ${b(p.ans)} ${p.kind}`;
    return `${SHAPE_LINE[p.kind]} = ${b(p.ans)}`;
  }
  if (p.sym) return p.q.replace("□", typeof ans === "string" && ans.startsWith("<b>") ? `<b>${esc(p.sym)}</b>` : p.sym);
  if (p.blank || p.op === "=" || p.op === "/" || p.op === "≈" || p.op === "▦") return filled(p, ans);
  if (p.op === "▭") return p.w + " by " + p.h + ": " + filled(p, ans);
  if (p.op === "more") return `${ans} is more`;
  if (p.op === "¢" && p.find) return `${ans} ${p.ans === 1 ? coinOf(p.find).name : p.q}`;
  if (p.op === "¢") return (p.q.includes("+") ? p.q + " = " : "") + ans + "¢";
  return `${esc(p.q)} = ${ans}`;
}
// The fact whose hint helps: the problem itself (hints.js works out a □ problem's own hint, or
// uses the fact that works it out: 7 − 3 for 3 + □ = 7).
const hintFact = () => G.cur;

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
    rows.push(`<li class="${n < d ? "done" : n === d ? "now" : ""}${isMega(n) ? " mega" : ""}" data-n="${n}" data-score="${sc.got}" data-max="${sc.max}"><i></i><span>${n}</span>${score}</li>`);
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
  // The floors' monsters are the ones whose step is open (DESIGN.md §4.3): the newest steps' at
  // depth 1, any of them deeper.
  // (A first run in the stratum meets them in the path's order.)
  G.depth = depth || deepest(wing(), progress);
  // The Legend, once it's due, ends this run (and every run here until it's beaten: saved).
  const legend = legendNow();
  if (legend && !LEGEND_TEST && !(progress[wing().id] || {}).legendOpen) { openLegend(progress, wing().id); store.player(PID).set("wings", progress); }
  G.floors = runFloors(wing(), team, null, G.depth, stepMonsters(PATHS[wing().id], stepsNow().open, !(progress[wing().id] || {}).best), legend);
  diveUI();
  spritesFor(wing(), legend);
  // The room darkens as you go deeper: 8% per depth, up to 48% at depth 7.
  document.querySelector(".game").style.setProperty("--murk", Math.min(0.48, 0.08 * (G.depth - 1)).toFixed(2));
}
// The voice's audio sprites this stratum can need (lines.js runSprites, speech.js needSprites): the
// ones every stratum needs, its monsters' lines, and its band's and strands' problems up to the
// level after the newest open one (a probe or a skip can reach it). Other strata's are let go.
function spritesFor(w, legend) {
  // Each band's levels as far as the chapter reaches: a probe or a skip can reach any of them.
  // The Legend's exam can ask any of them.
  const upto = {}, ch = chapterNow(w);
  if (!legend) pathBands(PATHS[w.id]).forEach((b) => { upto[b] = reachOf(PATHS[w.id], ch, b); });
  needSprites(ALWAYS.concat(runSprites(w, upto)));
  voicePlan();
}
// The order the whole voice is saved in for offline play (speech.js saveVoice): the sprites every
// stratum needs, this stratum's lowest level first, then the other open strata's in WINGS order;
// the rest of audio.json after them.
function voicePlan() {
  const w = wing(), open = openWings(progress, recs, st.start);
  saveVoice(ALWAYS.concat(byLevel(runSprites(w)), ...WINGS.filter((x) => x !== w && open.includes(x.id)).map((x) => byLevel(runSprites(x)))));
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
    if (!G.busy && !G.next && !G.paused && !document.hidden && $("ov").hidden && G.hp > 0 && G.floors[G.floor] === m) {
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
  // A boss powering up has a little more HP, a mega boss more (wings.js BOSS_HP).
  const stage = m.boss ? bossStage(G.depth) : 0;
  G.max = G.hp = Math.round(monsterHP(m, strandOf(m), recs, levelsFor(strandOf(m)).levels) * depthScale(i, G.floors.length) * depthHP(G.depth) * BOSS_HP[stage]);
  // The Legend's exam (learn.js examKey): its HP from every fact the exam can ask (those seen),
  // as much as a mega boss's, or up to twice that to last about one answer of every kind
  // (examRound); no fact twice, so nothing missed comes back on its floor.
  G.exam = null; G.examBand = null;
  if (m.form === "legend") {
    const path = PATHS[wing().id], all = examFacts(path), seenF = all.filter((f) => recs[f.key] && recs[f.key].n), scale = depthScale(i, G.floors.length) * depthHP(G.depth);
    const megaHP = hpOf(m, seenF.length ? seenF : all, wing().band) * LEGEND_HP;
    G.max = G.hp = Math.round(Math.max(megaHP, Math.min(2 * megaHP, examRound(path, recs))) * scale);
    G.exam = { used: [], steps: [] }; G.retry = [];
  }
  const el = $("mon");
  el.className = "mon";
  el.innerHTML = monsterArt(m);
  G.chomp = G.chompFace = "right"; chompSeq++;
  $("mName").textContent = m.n;
  // The trait badge, and what it does under the monster as it arrives.
  // A mega boss has a second trait (traits.js mega): both icons, and the second one's name.
  const t = traitOf(m), t2 = mega(m) ? m.trait2 : null, badge = $("trait");
  badge.hidden = !t;
  // Two traits (a mega boss, the Legend): the icons, with the second one's name beside them when
  // there's room (styles.css hides it on phones); a tap on the badge says both (traitTap).
  if (t) { badge.innerHTML = t2 ? `<span class="ti">${t.icon}${t2.icon}</span><span class="tn"> ${esc(t2.name)}</span>` : `${t.icon} ${esc(t.name)}`; badge.title = t2 ? `${t.text}. ${t2.text}` : t.text; }
  badge.classList.toggle("two", !!t2);
  G.onFloor = 0; G.halved = false; G.floorLost = 0; G.floorStreak = 0; G.floorSlow = false; G.barked = {};
  if (!quiet) setMsg(m.form === "legend" ? `🌟 A legend awaits! Every kind of problem: ${t.icon} ${t.name} and ${t2.icon} ${t2.name}.` : t2 ? `👑 Mega boss! ${t2.icon} ${t2.name}: ${t2.text}` : m.form === "power" ? `${m.n} is getting stronger!` : t ? `${t.icon} ${t.name}: ${t.text}` : "Your answer is your attack.");
  $("mon").classList.toggle("mega", !!t2 && m.form !== "legend");
  $("mon").classList.toggle("legend", m.form === "legend");
  $("floorLbl").textContent = (G.depth > 1 ? `Depth ${G.depth} · ` : "") + (m.form === "legend" ? "🌟 Legend" : m.boss ? "Boss floor" : m.cursed != null ? "Rescue floor" : `Floor ${i + 1} / ${G.floors.length}`);
  hpUI(); heartsUI(); streakUI(); slotsUI();
  fitName(m);
  if (quiet) return;
  meet(seen, m, Date.now()); store.player(PID).set("bestiary", seen);
  sfx.appear(m.boss);
  // "A legend awaits!" as the Legend arrives (DESIGN.md §14.2), "Mega boss ahead!" as a mega boss
  // does (§4.3), else "Boss floor!".
  if (m.form === "legend") say("p", PHRASE.legendAwaits);
  else if (t2) say("p", PHRASE.megaAhead);
  else if (m.boss) say("p", PHRASE.boss);
  // A cursed hero (the rescue floor) is announced with the quips' light echo (CURSED_FX), then who
  // you're freeing; a trait says what it does, the first times you meet it.
  say("m", monsterName(m), false, null, m.cursed != null ? CURSED_FX : undefined);
  if (m.cursed != null) say("p", heroRescue(HEROES[m.cursed]), false, null, CURSED_FX);
  if (t && once("trait:" + t.name, 2)) say("p", traitLine(m));
  // Powering up on the two depths before a mega boss; a mega boss's second trait, the first times.
  if (m.form === "power") say("p", PHRASE.stronger);
  if (t2 && once("trait2:" + (m.base || m.n), 2)) say("p", trait2Line(m));
}
// A long name (Professor Minustaur), or one that doesn't fit on one line with its trait badge and
// the HP on a phone (Disco Squatch and 🟩 Arrays, Golden Sigma Rex and its two traits), shrinks to
// fit, onto two lines if it must: the HP bar keeps some room and the HP never wraps under it.
const HP_ROOM = 36;
// First smaller (long), then, on a phone where that still doesn't fit, on two lines (wrap).
function fitName(m) {
  const nm = $("mName"), row = nm.parentElement, bar = $("hpBar").parentElement;
  nm.classList.remove("long", "wrap");
  const tight = () => row.clientWidth > 0 && matchMedia("(max-width: 759px)").matches && (row.scrollWidth > row.clientWidth + 1 || bar.offsetTop > nm.offsetTop + nm.offsetHeight / 2 || bar.clientWidth < HP_ROOM);
  if (m.n.length > 13 || nm.scrollWidth > nm.clientWidth + 1 || tight()) nm.classList.add("long");
  if (tight()) nm.classList.add("wrap");
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
  // Drawing a shape (Polly-Gon) needs a touch screen, as spells do: on a mouse or keyboard it's
  // never asked, and the shape strands' counting problems carry on (shapes.js keeps drawing under
  // half of every level, so each can still open the next).
  // The Legend's exam: the next fact from every kind the path asks, the hardest most, none twice
  // (learn.js examKey). It's asked from its own band, with no spells, probes or retries.
  const exam = G.exam ? examKey(PATHS[wing().id], recs, { used: G.exam.used, steps: G.exam.steps }) : null;
  if (exam) { G.exam.used.push(exam.key); G.exam.steps.push(exam.step); }
  G.examBand = exam ? exam.band : null;
  const bk = exam ? exam.band : strandOf(m), f = flowOf(bk), avoidAns = G.recentAns || [], op = m.op === "mix" || bk !== st.band ? null : m.op, kinds = drawable(asks(m));
  // What's open (the path's window, DESIGN.md §4.3): this band's levels in the open steps.
  const lv = levelsFor(bk);
  // Spell casting: about 1 problem in 6 is drawn as a sigil instead of typed (touch screens;
  // ?spells for every one): a fact already learned with a one-digit answer. It's picked before
  // probing, since a fluent player is probing nearly every problem and would never get one.
  const spellTurn = !exam && !due && !m.blank && canSpell() && (SPELLS_ALWAYS || Math.random() < SPELL_SHARE);
  const spell = spellTurn ? spellKey(bk, recs, { recent: G.recent, spells: G.spells, avoidAns, op, asks: kinds, open: lv.levels, review: lv.review }) : null;
  // The last few spells, across runs while the game is open, so the same one isn't cast fight after fight.
  if (spell) G.spells = [spell].concat(G.spells || []).slice(0, SPELL_MEMORY);
  // Endless: no probing or skipping ahead, and the facts come from what's been learned here.
  const endless = !exam && endlessOn();
  const probe = !exam && !endless && !due && !spell && f.on && f.cool <= 0 ? probeKey(bk, recs, null, G.recent, avoidAns, f.leap, kinds, reachOf(PATHS[wing().id], chapterNow(), bk)) : null;
  // ?fact=<key> (URL-encoded, "%E2%8C%9At3%3A30" for ⌚t3:30) makes the first problem that fact, for testing.
  const forced = FACT_AT && !G.solved && !G.tries ? FACT_AT : null;
  // An earlier grade's facts (the path's review steps) are mixed in as reviews for the monsters
  // asking the stratum's own band, once seen.
  const reviews = bk === wing().band ? reviewFacts(PATHS[wing().id], bk) : null;
  // The captain's digit: held back in the first fight, then about a third of problems lean to it
  // until the captain's first moment has happened (captainLean).
  const lean = { digit: team.captain, digitShare: captainLean() ? CAPTAIN_BIAS : 0, avoidDigitShare: firstFight() ? CAPTAIN_HOLD : 0 };
  const key = forced || (exam && exam.key) || spell || probe
    || (endless && endlessKey(PATHS[wing().id], bk, recs, Object.assign({ now: Date.now(), recent: G.recent, retry: due ? due.key : null, asks: kinds, like: prefers(m), avoidAns }, lean)))
    || choose(bk, recs, Object.assign({ now: Date.now(), recent: G.recent, retry: due ? due.key : null, op, asks: kinds, like: prefers(m), depth: G.depth, avoidAns, open: lv.levels, review: lv.review, reviews }, lean));
  // Charge (Minustaur): every 4th problem on the floor, a miss costs 2 hearts.
  G.charged = charged(m, G.onFloor++);
  $("charge").hidden = !G.charged;
  // Mega Judy's big throw (⚡ Black Belt) is charged the same way.
  if (G.charged) { sfx.charge(); if (mega(m)) say("p", PHRASE.bigThrow, false, () => G.charged && !G.busy); else say("p", PHRASE.charged, false, () => G.charged && !G.busy); }
  G.cur = factOf(key);
  // A shape to draw hits for its strand's typical answer (learn.js drawHit). Without a touch screen
  // (a missed one coming back, or ?fact=), a counting problem about it instead.
  if (G.cur.draw) { if (canSpell()) G.cur.ans = drawHit(bk); else G.cur = factOf(countFor(G.cur, bk)); }
  G.cur.probe = !!probe;
  G.recentAns = [G.cur.op + " " + G.cur.ans].concat(G.recentAns || []).slice(0, 2);
  // Quizard hides a number in every problem; other monsters sometimes do, for facts in review.
  const rec = recs[key];
  // (Only the recorded facts within 20 and the tables, without a zero in × or ÷ (missing.js
  // canHide), and not a fact that already has its □.)
  if (!spell && !G.cur.blank && "+-×÷".includes(G.cur.op) && canHide(G.cur) && (m.blank || (rec && rec.b >= 3 && Math.random() < MISSING_SHARE))) G.cur = missingOf(G.cur, pickBlank());
  // ?spells makes every one-digit problem a spell, for testing.
  // (Not shapes: a drawn shape is drawn already, and a count has its picture.)
  const digit = !G.cur.sym && G.cur.op !== "◇" && Number.isInteger(G.cur.ans) && G.cur.ans >= 0 && G.cur.ans <= 9;
  G.cur.spell = !!spell || (SPELLS_ALWAYS && canSpell() && !probe && digit);
  G.spellFails = 0; G.drawFails = 0; G.drawn = null;
  // Coins lie as they fall: sides at random (a single coin shows the side asked), a pile shuffled.
  if (G.cur.op === "¢") G.cur.pile = pileOf(G.cur, Math.random);
  // Flip (Judo Judy): 3 + 8 is thrown so it shows 8 + 3, the same fact (traits.js flipOf). The
  // problem is the flipped one from the start, so the 🔊 button, a miss and the hint all read it.
  const flipped = flipOf(m, G.cur);
  if (flipped) G.cur = flipped;
  // Flash (Pipsqueak): 3 + 5 comes as two dice, to count (traits.js flashOf).
  const dice = flashOf(m, G.cur);
  if (dice) G.cur = dice;
  // Stacked in columns (two- and three-digit + and −, and up to four numbers added): a quarter of
  // the time for two-digit numbers, half for three-digit ones and for adding several (twodigit.js
  // stackShare), always on Margot-Rythm's floor. The same fact and record, only laid out differently.
  G.cur = stackOf(G.cur, STACK_ALWAYS || (m.base || m.n) === "Margot-Rythm");
  G.recent = [key].concat(G.recent).slice(0, RECENT);
  presentProblem(key, !!flipped);
}
// The problem in G.cur, on screen and asked: its picture, pad and voice, and its hint button.
// restored: the same problem brought back after the app was reloaded (keepGoing), elapsed ms
// into its answer time; Judo Judy's throw isn't played again (it's already thrown).
function presentProblem(key, flipped, restored, elapsed) {
  G.input = ""; G.busy = false; G.hinted = false; G.t0 = performance.now() - (elapsed || 0);
  G.slot = G.cur.slots ? { at: 0, vals: ["", ""] } : null;
  G.tfDone = false;
  // The dot flash: shown, then hidden after FLASH_DOTS_MS (flashHide).
  G.flash = G.cur.op === "⁙" ? { shown: true, peeked: false, grouped: false } : null;
  // Fix it: the false equation shows whole for a second, then its wrong number lifts out of the
  // way (at once with reduced motion, or as soon as anything's typed).
  G.fix = G.cur.op === "✎" ? { swapped: reduced(), done: false } : null;
  if (G.fix && !G.fix.swapped) { const cur = G.cur; setTimeout(() => { if (G.cur === cur && G.fix && !G.fix.swapped) fixSwap(); }, FIX_SWAP_MS); }
  probUI();
  clockArt();
  if (onChompers() && G.chomp !== G.chompFace) chompTurn(G.chompFace);
  if (flipped && !restored) judoThrow(G.cur);
  if (G.flash) flashHide(G.cur);
  // Polly-Gon squawks the shape it wants before it's asked.
  pollySquawk(G.cur);
  // Coins ("How many dimes?") and comparisons can't be read off the screen by a pre-reader, so
  // the voice reads them, after the monster's name. Skipped if it's answered first.
  // Time and patterns too: "What time is it?" isn't on the screen, and a row of slimes is read
  // like counting out loud ("Two, four, six. What comes next?").
  // Batch 2's too: an equation to judge, a number line, blocks, and money are read out; and
  // shapes ("Draw a triangle!", "How many sides?").
  // The dot flash: "How many dots?", and the first time "Look quick! How many dots?".
  if (G.cur.op === "⁙" && once("flash")) say("p", PHRASE.flashHow, false, asked(G.cur));
  else if ("¢○⌚…◐✓✎↔#$◇⁙".includes(G.cur.op) || G.cur.op === "more") say("q", spokenProblem(G.cur), false, asked(G.cur));
  // Pipsqueak's dice: "How many dots in all?", and the first 2 times how.
  if (G.cur.dice) { if (once("dice", 2)) say("p", PHRASE.diceHow, false, asked(G.cur)); say("p", PHRASE.diceAll, false, asked(G.cur)); }
  // Drawing a shape: how, the first few times.
  if (G.cur.draw) { setMsg(`Draw ${article(G.cur.shape)}${G.cur.shape}!`, "good"); if (once("draw", 3)) say("p", PHRASE.drawHow, false, asked(G.cur)); }
  // The first true or false problems: how the two big keys work.
  if (G.cur.op === "✓" && once("truefalse", 2)) say("p", PHRASE.tfHow, false, asked(G.cur));
  // The first comparison: how the < = > keys work.
  if (G.cur.op === "○" && once("compare")) { say("p", PHRASE.cmpHow, false, asked(G.cur)); say("p", PHRASE.cmpSame, false, asked(G.cur)); }
  // Typed ones first (a stacked problem, or across on Margot-Rythm's floor): the cursor blinks in the
  // ones column, and the first 3 times it's said.
  if (onesFirst(G.cur) && once("onesFirst", 3)) { setMsg("Start with the ones!", "good"); say("p", PHRASE.onesFirst, false, asked(G.cur)); }
  if (G.cur.spell) {
    setMsg("Cast a spell! Draw the answer.", "good"); say("p", PHRASE.spell);
    if (once("spell", 3)) say("p", PHRASE.spellHow, false, asked(G.cur)); // the first few spells
  }
  ansUI();
  if ($("msg").classList.contains("bad")) setMsg("Your answer is your attack.");
  showHelp(helpFor(recs[key]));
  saveRun("problem");
  // Hidden while busy (an attack, a Hero Moment), the pause waited for the next problem.
  // (Judo Judy's throw keeps it busy a moment: it pauses as the throw lands.)
  if (G.pauseWanted && !G.busy) { G.pauseWanted = false; pause(true); }
}
// Judo Judy's throw (🥋 Flip): the problem comes in as 3 + 8 and the two numbers swap places, the
// smaller one thrown up and over the + while the bigger slides under it, as Judy twists, in
// about half a second. The problem is already 8 + 3 underneath (newProblem), so this only animates
// the swap: the numbers start in each other's places. Answering waits until they land, and the
// answer time starts then. With reduced motion it's just swapped.
const THROW_MS = 520;
function judoThrow(p) {
  const ns = $("prob").querySelectorAll(".jn");
  if (reduced() || ns.length !== 2 || !ns[0].animate) return;
  const [big, small] = ns, dx = small.getBoundingClientRect().left - big.getBoundingClientRect().left;
  G.busy = true;
  sfx.whip();
  restartAnim($("mon"), "throw");
  small.animate([{ transform: `translate(${-dx}px, 0) rotate(0deg)` }, { transform: `translate(${-dx / 2}px, -0.9em) rotate(-180deg)`, offset: 0.5 },
    { transform: "translate(0, 0) rotate(-360deg)" }], { duration: THROW_MS, easing: "ease-in-out" });
  big.animate([{ transform: `translate(${dx}px, 0)` }, { transform: `translate(${dx / 2}px, 0.3em) scale(0.8)`, offset: 0.5 },
    { transform: "none" }], { duration: THROW_MS, easing: "ease-in-out" });
  // The + ducks out of the way as they pass.
  const op = $("prob").querySelector(".jop");
  if (op) op.animate([{ opacity: 1, transform: "none" }, { opacity: 0.2, transform: "scale(0.6)", offset: 0.5 }, { opacity: 1, transform: "none" }], { duration: THROW_MS, easing: "ease-in-out" });
  setTimeout(() => {
    $("mon").classList.remove("throw");
    if (G.cur !== p || G.paused) return;
    G.busy = false; G.t0 = performance.now();
    if (G.pauseWanted) { G.pauseWanted = false; pause(true); } // the app was left mid-throw
  }, THROW_MS);
}
// The dot flash (Pipsqueak): the dots show for FLASH_DOTS_MS, then turn face down. It's a look,
// not a race: the clock isn't touched, "Show me again" peeks once more (a hint: G.hinted), and the
// hint or a miss brings them back for good, grouped.
function flashHide(p) {
  setTimeout(() => {
    if (G.cur !== p || !G.flash || !G.flash.shown || G.flash.grouped) return;
    // Paused (or the app left): the dots wait, and get their whole look again on Keep fighting.
    if (G.paused || document.hidden) { G.flash.held = true; return; }
    G.flash.shown = false; probUI(); ansUI();
  }, FLASH_DOTS_MS);
}
$("prob").addEventListener("click", (e) => {
  if (!e.target.closest("#peek") || !G.flash || G.busy || G.flash.peeked) return;
  sfx.tick();
  Object.assign(G.flash, { peeked: true, shown: true });
  G.hinted = true; // a second look counts as a hint
  probUI(); ansUI();
  flashHide(G.cur);
});
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
  // A good spell's drawing (castSpell, drawingShot) flies itself, from where it was drawn.
  const shot = G.spellShot && text.length === 1 ? G.spellShot : null;
  G.spellShot = null;
  if (shot && $("sigil")) sigilReset(); // it lifts off the pad: the drawing itself leaves
  const layer = $("fly"), a = shot ? { x: shot.x, y: shot.y } : centerOf(from), b = centerOf($("mon")), n = text.length;
  return Promise.all([...text].map((ch, i) => new Promise((done) => {
    const d = Number(ch), s = document.createElement("span");
    if (shot) { const k = Math.min(1, 96 / Math.max(shot.w, shot.h)); s.className = "shot drawn"; s.innerHTML = `<img src="${shot.src}" alt="" width="${Math.round(shot.w * k)}" height="${Math.round(shot.h * k)}">`; }
    else if (onTeam(d)) { s.className = "shot hero"; s.innerHTML = heroArt(d); }
    else { s.className = "shot" + (crit ? " crit" : ""); s.textContent = ch; }
    layer.appendChild(s);
    const w = s.offsetWidth, h = s.offsetHeight, spread = (i - (n - 1) / 2) * 44;
    const p0 = { x: a.x + spread - w / 2, y: a.y - h / 2 }, p1 = { x: b.x + spread * 0.4 - w / 2, y: b.y - h / 2 };
    const c = { x: (p0.x + p1.x) / 2 + (p1.x - p0.x) * 0.15, y: Math.min(p0.y, p1.y) - 90 };
    const frames = [];
    for (let k = 0; k <= 10; k++) {
      const t = k / 10, u = 1 - t;
      const x = u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, y = u * u * p0.y + 2 * u * t * c.y + t * t * p1.y;
      frames.push({ transform: `translate(${x}px,${y}px) scale(${1 + 0.35 * Math.sin(Math.PI * t) - 0.25 * t}) rotate(${t * (shot ? 24 : onTeam(d) ? 360 : 18)}deg)` });
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
  // The Hero Magnet (an item, loot.js): the next qualifying hit with a team hero's digit is a
  // moment; it waits for one.
  const mo = decideMoment(MS, MR, { typed, team, hinted: G.hinted, spell: sp, first, floor: G.floor, n: G.tries, bossFinish, critStart, always: MOMENTS_ALWAYS || !!G.fx.magnet, teamup: TEAMUP_ALWAYS });
  if (magnetSpent(G.fx, mo)) slotsUI();
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
  momentDuck = true; duckMusic(); // the music stays down for the whole moment, not only its quip
  const unduck = () => { momentDuck = false; duckMusic(); };
  return playMoment({ hero: mo.hero, partner: mo.partner, color: colorOf(mo.hero), partnerColor: mo.partner != null ? colorOf(mo.partner) : null, wear: dressOf(mo.hero), partnerWear: mo.partner != null ? dressOf(mo.partner) : null, quip: mo.quip,
    before: () => speaking() ? cutOff(sfx.scratch, sfx.SCRATCH_AT, sfx.SCRATCH) : null,
    speak: () => say("h", quipLine(mo.quip), true), from, to: $("mon"), room: document.querySelector(".game"),
    reduced: reduced(), onSnap: () => { if (rest) fly(rest, crit); } }).then((v) => { unduck(); return v; }, (e) => { unduck(); throw e; });
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
   A hint always takes a tap: a new fact and a fact being learned get a 💡 button; a fact in review
   gets nothing. After a miss, the worked example stays up until "Got it". A hinted answer still
   hits, but doesn't build the streak or count toward mastery. */
// A new fact's 💡 never opens by itself (it used to after 3.5 s, too soon): after NUDGE_MS on the
// problem (answer time, so a pause doesn't count) with nothing typed or drawn, it pulses gently
// (a steady glow with reduced motion), and the first few times the voice says "Stuck? Tap the
// light bulb!". A player who knows it answers first and gets the credit.
const NUDGE_MS = 8000;
let hintTimer = null;
function showHelp(mode) {
  clearTimeout(hintTimer);
  $("hintBtn").hidden = mode === "none";
  $("hintBtn").classList.remove("nudge");
  $("hint").hidden = true;
  if (mode === "show") hintNudge(G.cur);
}
function hintNudge(cur) {
  const left = NUDGE_MS - (performance.now() - G.t0);
  hintTimer = setTimeout(() => {
    if (G.cur !== cur || G.hinted || $("hintBtn").hidden || !G.running) return;
    // Waits out an attack, a card or the pause (G.t0 moves on by the pause), and doesn't nudge
    // while they're typing or drawing: they aren't stuck.
    if (G.busy || G.paused || document.hidden || !$("ov").hidden || G.input !== "" || strokes.length || performance.now() - G.t0 < NUDGE_MS) return hintNudge(cur);
    $("hintBtn").classList.add("nudge");
    if (once("hintNudge", 3)) say("p", PHRASE.hintNudge, false, () => G.cur === cur && !G.busy && !G.hinted);
  }, Math.max(500, left));
}
function openHint() {
  const h = hintFor(hintFact(), false), box = $("hint");
  G.hinted = true;
  // Time and patterns draw the hint on the problem's own picture (Tick-Tockus's clock, the
  // slimes), so only its words open here.
  // (A shape to count too; a shape to draw shows its dots to join in the hint.)
  const inline = "⌚…◐✓✎↔#$⁙".includes(G.cur.op) || (G.cur.op === "◇" && !G.cur.draw);
  if (G.flash) G.flash.grouped = true; // the dots come back, grouped
  if (inline) { probUI(); ansUI(); clockArt(h.layer); }
  else if (G.cur.dice) probUI(); // Pipsqueak's dice get their numbers beside them
  // An equation in their words doesn't break across lines ("35 + 2 = ?").
  box.innerHTML = (inline ? "" : `<div class="model">${h.model}</div>`) + `<p class="hsay">${esc(inline ? h.say.replace(/ ([=+−→]) /g, "\u00a0$1\u00a0") : h.say.replace(/ \? (\S+)$/, "\u00a0?\u00a0$1"))}</p>`; // nor a comparison ("2/3 ? 2/6")
  box.classList.toggle("words", inline);
  box.hidden = false;
  $("hintBtn").hidden = true; $("hintBtn").classList.remove("nudge");
}
// After a miss: the worked example as a card over the game, "Oops!" and the right answer with
// the drawing, until "Got it" (or Enter, on the focused button).
function openWorked() {
  const h = hintFor(hintFact(), true);
  if (G.flash && !G.flash.grouped) { G.flash.grouped = true; probUI(); ansUI(); } // the dots come back
  $("hint").hidden = true; $("hintBtn").hidden = true;
  show(`<div class="worked"><h2>Oops!</h2>
    <p class="worked-fact">${shownFact(G.cur, `<b>${G.cur.ans}</b>`)}</p>
    <div class="model">${h.model}</div><p class="hsay">${esc(h.say)}</p>
    <div class="btns"><button class="big" type="button" id="gotIt">Got it</button></div></div>`, "float");
  $("gotIt").onclick = nextAfterMiss;
}
$("hintBtn").onclick = () => { if (!G.busy) openHint(); };
// A tap on a two-trait badge (a mega boss, the Legend: icons only on phones) says what both do.
$("trait").onclick = () => {
  const m = G.floors && G.floors[G.floor], t = m && traitOf(m), t2 = mega(m) ? m.trait2 : null;
  if (t && t2) setMsg(`${t.icon} ${t.name}: ${t.text}. ${t2.icon} ${t2.name}: ${t2.text}.`);
};

// Saves the answer to the fact's record; says so when it opens a new level.
// Returns what to say about it: a skip ahead, a new level, or nothing. A drawn answer (a spell)
// is writing practice: it changes no record, timing, placement, skipping or the "all fast" star.
function learnFrom(ok) {
  if (G.cur.spell) return null;
  const bk = curBand(), b = BANDS[bk], key = G.cur.key, ms = performance.now() - G.t0;
  // Fluent: right, unhinted and quick, with a second more for each extra digit to tap.
  const limit = fluentTime(b.fluentMs, G.cur.sym || G.cur.ans);
  const before = stepsNow().open, fluent = ok && !G.hinted && ms < limit, f = flowOf(bk);
  // The achievements' counts (DESIGN.md §14.4): a comeback (a missed fact, right on its own), and
  // today as a practice day; and a holiday's surprise (§14.5).
  if (isComeback(recs[key], ok, G.hinted)) { ach.comebacks++; saveAch(); }
  if (notePracticeDay(ach, Date.now())) saveAch();
  surprise(...holidaysOn(new Date()));
  recs[key] = recordAnswer(recs[key], { ok, ms, hinted: G.hinted, now: Date.now(), fluentMs: limit });
  // Skipping ahead: SKIP_PROBES fluent of the last SKIP_WINDOW probes, and everything below the
  // probe's tier is known. Two slips in that window pause probing for a few problems.
  let skipped = 0;
  if (G.cur.probe) {
    f.hist = [fluent].concat(f.hist).slice(0, SKIP_WINDOW);
    if (fluent && f.hist.filter(Boolean).length >= SKIP_PROBES) {
      skipped = skipTo(bk, recs, tierOf(bk, key), Date.now(), b.fluentMs); f.hist = []; f.leap = Math.min(MAX_LEAP, f.leap * 2);
      // Skipping ahead in the stratum's own band places the earlier grade's review steps too.
      if (bk === wing().band) placeReviews(PATHS[wing().id], recs, Date.now(), b.fluentMs);
    }
    else if (f.hist.filter((x) => !x).length >= 2) { f.cool = 3; f.hist = []; f.on = false; f.leap = 1; }
  }
  f.fluent = fluent ? f.fluent + 1 : 0;
  if (f.fluent >= 2) f.on = true; // probing starts after two fluent answers, and keeps going
  if (!fluent) G.floorSlow = true; // the "all fast" star (wings.js floorStars)
  f.cool--;
  store.player(PID).set("facts", recs);
  checkAchievements(); // a kind mastered (DESIGN.md §14.3): recorded quietly, its card waits
  // A step joins the path's window (DESIGN.md §4.3) when the oldest new one is partly learned.
  const after = stepsNow().open, joined = after.filter((i) => !before.includes(i));
  if (joined.length) { keepSteps(); arrived(before, after); }
  if (skipped) { say("p", PHRASE.skip); return "Skipping ahead! You already know these."; }
  if (joined.length) { say("p", BARK.level); return `New level: ${PATHS[wing().id][joined[0]].name}!`; }
  return null;
}

function submit() {
  if (G.next) return nextAfterMiss();
  if (G.busy || G.input === "") return;
  // Ones first, typed the other way round (fast, tens first: 42 comes out 24): the answer's right,
  // only flipped. First the digits visibly swap places under the line ("Ones first! Let's flip
  // it."), then it's answered: it counts as a hinted answer (it hits, but builds no streak and isn't
  // fast), not a miss.
  if (!G.flipping && onesFirst(G.cur) && G.input.length > 1 && G.input !== String(G.cur.ans) && [...G.input].reverse().join("") === String(G.cur.ans)) {
    G.flipping = true; G.busy = true; G.hinted = true;
    setMsg("Ones first! Let's flip it.", "good");
    say("p", PHRASE.onesFirst, true);
    const done = () => { G.input = String(G.cur.ans); ansUI(); G.busy = false; submit(); G.flipping = false; };
    flipCells(done);
    return;
  }
  G.tries++;
  // True or false swings to the truth as it's answered, right or wrong; fix it, answered right,
  // takes the number and levels.
  if (G.cur.op === "✓") { G.tfDone = true; probUI(); }
  // A comparison's answer is its symbol (<, = or >); everything else is a number.
  // A drawn shape was judged as it was cast (castShape).
  const right = G.cur.draw ? G.drawn === "right" : G.cur.slots ? G.slot.vals.every((v, i) => v !== "" && Number(v) === G.cur.slots[i]) : G.cur.sym ? G.input === G.cur.sym : Number(G.input) === G.cur.ans;
  if (right && G.fix) { G.fix.done = true; probUI(); ansUI(); }
  if (right) {
    G.busy = true; G.solved++;
    if (!G.hinted) G.streak++;
    G.floorStreak = Math.max(G.floorStreak, G.streak);
    // A comparison hits with the bigger number (Chompers eats it), so its digits are what fly; a
    // drawn shape, with what it hits for.
    const typed = G.cur.sym || G.cur.draw ? String(G.cur.ans) : G.input, crit = G.streak >= 3, bonus = heroBonus(typed), m = G.floors[G.floor];
    // The monster's trait: Lucky Number, Ten Smash, Armor, Carry the One (traits.js).
    const trait = hitBy(m, G.cur.ans, typed, G.halved, G.cur);
    // A spell drawn backwards fizzles at half damage.
    // The Times Two Totem (an item, loot.js): the next right answer hits double, once.
    const totem = totemMult(G.fx);
    let dmg = Math.max(1, Math.round(G.cur.ans * (crit ? 2 : 1) * trait.mult * bonus.mult * totem * (G.cur.reversed ? 0.5 : 1)));
    if (totem > 1) slotsUI();
    const level = learnFrom(true);
    // Chompers (🐊) acts it out first: he chomps the bigger side (chompAct). A comparison keeps its
    // ○ Chompers until the next problem; a "which is more" answer leaves its box after the chomp.
    const pose = chompFor(G.cur, G.input);
    if (!pose) { G.input = ""; ansUI(); }
    $("hint").hidden = true; $("hintBtn").hidden = true;
    const critsNow = G.streak === 3 && !G.hinted;
    if (critsNow) say("p", PHRASE.crits);
    // Now and then a Hero Moment: a slow-motion close-up and a quip before the hit (moments.js).
    // A rescued hero in it adds MOMENT_BOOST (momentBoost).
    const mo = momentFor(typed, critsNow, !!m.boss && G.hp - dmg <= 0), boost = momentBoost(mo);
    if (boost) dmg = Math.round(dmg * (1 + MOMENT_BOOST * boost));
    const momentName = mo ? HEROES[mo.hero].n + (mo.partner != null ? " & " + HEROES[mo.partner].n : "") : "";
    // The run as it will be once this hit lands, in case the app is closed mid-attack: the next
    // problem, or the monster beaten.
    saveRun(G.hp - dmg <= 0 ? "beaten" : "next", { hp: G.hp - dmg });
    chompAct(pose).then(() => {
      if (pose && G.cur.op === "more") { G.input = ""; ansUI(); }
      sfx.launch(G.streak);
      if (mo) G.spellShot = null; // a Hero Moment plays instead of the throw
      return mo ? heroMoment(mo, typed, crit) : fly(typed, crit);
    }).then(() => {
      if (!mo) sfx.impact(crit); // a moment lands with its own, bigger impact and shake
      if (G.charged) sfx.zap(); // a lightning problem beaten: the lightning thrown back
      burst(crit);
      G.hp -= dmg;
      // Surprises in the hit (achievements.js hitSurprises): exactly 0 HP left, a palindrome, a
      // hit of 100 or more, two of one hero, every digit a hero. Recorded quietly.
      G.lastTyped = typed;
      surprise(...hitSurprises({ ans: G.cur.sym || G.cur.draw || G.cur.slots || G.cur.spell ? null : G.cur.ans, typed, dmg, hpLeft: G.hp, team: [...new Set([team.captain, ...team.rescued])].filter((d) => d != null) }));
      pop((boost ? "Hero! " : bonus.power ? "Power! " : crit ? "Crit! " : "") + "−" + dmg, crit || bonus.power || !!boost);
      restartAnim($("mon"), "hit");
      if (crit && !mo) restartAnim($("arena"), "shake");
      setMsg(totem > 1 ? `Times Two Totem! Double hit for ${dmg}!` : G.cur.reversed ? `Your ${G.cur.ans} is facing backwards. It faces this way → Half damage: ${dmg}` : G.cur.howTo ? `Here's how to write it. Hit for ${dmg}!` : level ? level : trait.note ? `${trait.note}: ${dmg}!` : boost ? `${momentName} hero hit for ${dmg}!` : bonus.power ? `${HEROES[team.captain].n} power hit for ${dmg}!` : crit ? `Critical hit for ${dmg}!` : `Hit for ${dmg}!`, "good");
      hpUI(); streakUI();
      // Half HP: Divvy splits in two, Sigma Rex armors up (traits.js).
      const half = !G.halved && G.hp > 0 && G.hp <= G.max / 2 ? atHalf(m) : null;
      if (!G.halved && G.hp <= G.max / 2) G.halved = true;
      if (half) {
        setMsg(half.note, "good");
        if (half.split) { $("mon").innerHTML = `<div class="split">${monsterArt(m)}${monsterArt(m)}</div>`; }
        if (half.curl) $("mon").classList.add("curled"); // the Megapede curls into a ring (🐛 Curl Up)
      }
      // One short bark for what this hit did, at most: the half-HP change, the trait, or a power
      // hit, each once a floor. None when something else was just said (a new level, skipping
      // ahead, a backwards spell, or "Critical hits!", unless it's the half-HP change, which only
      // happens once).
      const bark = half ? (half.split ? "split" : half.curl ? "curl" : "second") : trait.mult > 1 ? "double" : trait.mult < 1 ? "half" : bonus.power ? "power" : null;
      if (bark && !level && (half || !critsNow) && !G.cur.reversed && !G.cur.howTo && !G.barked[bark]) { G.barked[bark] = true; say("p", BARK[bark]); }
      if (G.hp <= 0) { setTimeout(() => { $("mon").className = "mon dead" + ($("mon").classList.contains("face-l") ? " face-l" : ""); }, 300); setTimeout(cleared, 1100); }
      else setTimeout(newProblem, level ? 1200 : 450);
    });
  } else {
    // Chompers snaps at the picked side, clacks, and turns to the right way, then the usual miss.
    const pose = chompFor(G.cur, G.input);
    // A drawing read clearly as another shape: "That looks like a square!"
    if (G.cur.draw && G.drawRead) return miss(`That looks like ${article(G.drawRead)}${G.drawRead}!`);
    if (!pose) return miss("Oops!");
    G.busy = true;
    chompAct(pose).then(() => miss("Oops!"));
  }
}

// A wrong answer: the monster lunges, a heart cracks off, the right answer is shown
// and said with the worked example, and the fact comes back 2–4 problems later.
function miss(why) {
  G.busy = true; G.streak = 0;
  // A charged problem (Minustaur) costs 2 hearts.
  // The Shield (an item, loot.js) blocks it: no heart lost, even on a charged miss. The fact still
  // counts as missed for learning, and still comes back.
  const charge = G.charged ? 2 : 1, cost = blockMiss(G.fx, charge), blocked = cost === 0;
  G.hearts = Math.max(0, G.hearts - cost);
  G.floorLost += cost;
  const lost = G.hearts;
  learnFrom(false);
  // after counts down at each new problem, so 3–5 means 2–4 other problems in between.
  // (Not in the Legend's exam: no fact twice there. The miss still sends it back to learning.)
  if (!G.exam) G.retry = G.retry.filter((r) => r.key !== G.cur.key).concat([{ key: G.cur.key, after: 3 + Math.floor(Math.random() * 3) }]);
  if (blocked) sfx.clang(); else if (cost > 1) sfx.thunder(); else sfx.miss(); // a charged miss is a thunder strike
  restartAnim($("mon"), "lunge");
  streakUI();
  if (blocked) slotsUI();
  setMsg(`${why} ${shownFact(G.cur, G.cur.ans)}${blocked ? " 🛡️ Blocked!" : cost > 1 ? " ⚡ −2 hearts" : ""}`, "bad");
  say("p", PHRASE.oops, true);
  if (blocked) say("p", LOOT.shieldBlock);
  // The whole fact, said out loud: "three plus four is seven".
  const said = G.cur.fact || G.cur;
  say("q", spokenFact(said));
  if (cost > 1 && mega(G.floors[G.floor])) say("p", PHRASE.bigThrowMiss);
  else if (cost > 1) say("p", PHRASE.chargedMiss);
  if (G.hearts > 0) saveRun("next"); else clearRun(); // a lost run can't be picked up again
  if (blocked) setTimeout(() => { G.next = true; openWorked(); }, 600);
  if (blocked) return;
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
// A floor's monster beaten. First, now and then, a chest (every boss has one; never the rescue
// floor): chestDone is set when it's been opened, or left shut.
function cleared(chestDone) {
  const m = G.floors[G.floor];
  // Surprises in how the floor was won (DESIGN.md §14.5): on the last heart, a boss without a
  // heart lost on its floor, Sevenstein freed with a 7 in the winning hit.
  if (!chestDone) {
    if (G.hearts === 1) surprise("surprise:lastheart");
    if (m.boss && !G.floorLost) surprise("surprise:iceboss");
    if (m.cursed === 7 && crackCurse(team, 7).freed && String(G.lastTyped || "").includes("7")) surprise("surprise:seven");
  }
  if (!chestDone && (chestAfter(m) || (CHEST_ALWAYS !== null && m.cursed == null))) return openChest(m, () => cleared(true));
  if (G.floor === G.floors.length - 1) return end(true);
  const stars = earnStars();
  beat(seen, m, Date.now()); store.player(PID).set("bestiary", seen);
  const healed = G.hearts < band().hearts;
  if (healed) G.hearts++;
  record();
  sfx.victory(); // a floor cleared gets the fanfare (the user liked it better than the jingle)
  const nx = G.floors[G.floor + 1], news = newsHTML();
  const next = `<div class="cardmon">${monsterArt(nx)}</div>
  <p>Next down the stairs: <strong>${nx.n}</strong>${nx.form === "legend" ? ", the 🌟 Legend" : nx.form === "mega" ? ", the 👑 mega boss" : nx.boss ? ", the boss" : ""}.${healed ? " You found a heart (+1)." : ""}</p>`;
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
    ${news}
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
    <div class="cardmon rescued">${heroArt(h.d)}</div>
    <p><strong>${h.n} joins your team.</strong> When your answer has a ${h.d}, ${h.n} jumps in and hits harder.</p>
    ${stars}
    ${news}
    ${next.replace('class="cardmon"', 'class="cardmon small"')}
    <div class="btns"><button class="big" id="next">Floor ${G.floor + 2}</button></div>`, "float");
  } else {
    say("p", monsterCleared(m));
    show(`<h2>${m.n} ${m.quip}</h2>
  ${stars}
  ${news}
  ${next}
  <div class="btns"><button class="big" id="next">Floor ${G.floor + 2}</button></div>`, "float");
  }
  if (healed) say("p", PHRASE.heart);
  if (nx.form === "legend") say("p", PHRASE.legendAwaits);
  else if (nx.form === "mega") say("p", PHRASE.megaAhead);
  else if (nx.boss) say("p", PHRASE.nextBoss);
  saveRun("floor"); // stars, the heart and the curse's cracks are in: next time, the next floor
  $("next").onclick = () => { hide(); loadMonster(G.floor + 1); newProblem(); };
}
function end(win) {
  G.running = false;
  musicNow();
  clearRun();
  refundArmed();
  const w = wing(), before = openWings(progress, recs, st.start), chBefore = chapterNow(w), stepsBefore = stepsNow(w).open;
  if (win) { progress[w.id] = progress[w.id] || { boss: 0, best: 0 }; progress[w.id].boss++; }
  // A mega boss beaten (DESIGN.md §4.3): the next chapter is reached. Counted by the depths whose
  // mega boss is beaten, so beating the same one again doesn't count twice.
  // The Legend at a mega boss's depth counts as that mega boss too.
  const legendWin = win && G.floors[G.floor].form === "legend";
  const megaWin = win && (G.floors[G.floor].form === "mega" || (legendWin && isMega(G.depth)));
  // The Legend beaten (DESIGN.md §14.2): saved per stratum, and a legendBeaten event, the hook for
  // its achievement (achievements.js reads the saved Legend; the event is a hook for more). ?legend's
  // practice run saves nothing.
  if (legendWin && !LEGEND_TEST) {
    beatLegend(progress, w.id, Date.now()); store.player(PID).set("wings", progress);
    document.dispatchEvent(new CustomEvent("legendBeaten", { detail: { wing: w.id, boss: G.floors[G.floor].base, depth: G.depth, player: PID } }));
  }
  if (megaWin) { const p = progress[w.id]; p.megas = Math.max(megasOf(p), Math.floor(G.depth / MEGA_EVERY)); keepSteps(w); }
  const chOpened = chapterNow(w) > chBefore ? chapterNow(w) : 0;
  if (megaWin) arrived(stepsBefore, stepsNow(w).open);
  const news = newsHTML();
  const stars = win ? earnStars() : "";
  if (win) { beat(seen, G.floors[G.floor], Date.now()); store.player(PID).set("bestiary", seen); }
  const f = record(), acc = G.tries ? Math.round(G.solved / G.tries * 100) : 0, m = G.floors[G.floor];
  // Strata this run opened (the Cellar can open the Hall and the Tower at once), easiest first.
  const openedAll = WINGS.filter((x) => !before.includes(x.id) && openWings(progress, recs, st.start).includes(x.id)), opened = openedAll[0];
  // A stratum opened stays open (wings.js openWings).
  if (openedAll.length) { openedAll.forEach((x) => { (progress[x.id] ||= { boss: 0, best: 0 }).unlocked = true; }); store.player(PID).set("wings", progress); }
  // Losing all your hearts curses the hero who led the run (heroes.js curseCaptain): rescue them
  // again on a rescue floor, and pick someone else to lead.
  const fallen = !win && hasCaptain() ? HEROES[team.captain] : null;
  // A stratum cleared: the fanfare for now; it's meant to get something really big (DESIGN.md §8.3).
  // A Legend beaten gets the big fanfare and "Legend!" first.
  if (legendWin) { sfx.legend(); say("p", PHRASE.legend); say("p", monsterCleared(m)); }
  else if (win) { sfx.victory(); say("p", monsterCleared(m)); say("p", wingCleared(w)); } else say("p", monsterWon(m));
  if (fallen) say("p", heroCursed(fallen));
  if (chOpened) say("p", PHRASE.chapter);
  if (opened) { say("p", PHRASE.unlocked); openedAll.forEach((x) => say("p", wingOpened(x))); }
  // What the win card offers, the first few wins (a new stratum's own offer says it otherwise).
  else if (win && once("deeper", 3)) say("p", PHRASE.deeper);
  if (fallen) { Object.assign(team, curseCaptain(team)); saveTeam(); captainUI(); whoUI(); }
  const cursedLine = !fallen ? "" : `<div class="fallen"><div class="cardmon small">${heroSvg(fallen, { cursed: true })}</div>
    <p><strong>${esc(fallen.n)} was cursed!</strong> ${team.rescued.length ? "Pick who leads next, and" : "Pick a new hero to start again, and"} rescue ${esc(fallen.n)} on a rescue floor.</p></div>`;
  // A win opens the next depth of this Wing: "Go deeper" goes there, "Play again" replays this one.
  const depth = G.depth;
  if (win) { progress[w.id].depth = Math.max(deepest(w, progress), depth + 1); store.player(PID).set("wings", progress); }
  // A Champion (the last chapter's mega boss) or a Legend won: recorded now, its card shown before
  // the next descent (DESIGN.md §14.1).
  checkAchievements();
  const deeper = win;
  const chapterNote = chOpened ? `<div class="unlocked chapter" role="status"><b>👑 Chapter ${chOpened} is open!</b><span>New steps join as you learn: ${esc(PATHS[w.id].filter((s) => s.chapter === chOpened && !s.ongoing && !s.review).map((s) => s.name).join(", "))}.</span></div>` : "";
  const left = chapterNote + (opened ? `<div class="unlocked" role="status"><b>🔓 New stratum unlocked!</b><span>${openedAll.map((x) => esc(x.name)).join(" and ")} ${openedAll.length > 1 ? "are" : "is"} open.</span></div>` : win ? nextWingHint() : "");
  pickOpen = false;
  // The Legend's win card: "Legend!", the stratum's name and the golden boss, on its wall.
  const legendHead = legendWin ? `<div class="legend-win" data-stratum="${w.id}"><h2 class="legend-title">🌟 Legend! 🌟</h2><p class="legend-wing">${esc(w.name)}</p>
    <div class="cardmon legend">${monsterArt(m)}</div><p class="legend-note">You mastered every fact here. ${esc(m.n)} bows to you.</p></div>` : "";
  // The card and its buttons, drawn again when the 👕 wardrobe (from the Next run line) comes back.
  const card = () => {
    show(`${legendHead || `<h2>${win ? wingCleared(w) : `${m.n} won this round`}</h2>`}
    ${win || fallen ? "" : `<div class="cardmon">${monsterArt(m)}</div>`}
    <p>${win ? `${esc(m.n)} ${esc(m.quip)} <strong>Depth ${depth + 1}</strong> is open below: tougher monsters, new floors.` : "Every miss shows the right answer, so the next run goes deeper."}</p>
    ${cursedLine}
    ${stars}
    ${left}
    ${news}
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
  };
  G.endCard = card;
  // Achievements earned during the run (recorded quietly, never mid-fight) play now, as the run
  // ends, one card each, then this card: whatever's tapped next (Play again, Try again, Menu, Go
  // deeper), they've been seen. Before, they waited for the next descent, so Play again or Menu
  // didn't show them.
  const pending = achievementQueue();
  if (pending.length) achievementCards(pending, 0, { mode: "end", done: card }); else card();
  syncSoon(); // a linked player syncs at the end of a run
}
// A card over the game. It opens at the top, and its main button gets focus (Enter presses it)
// without scrolling down to it. kind "page" (the menu, Settings, the book, a run's end) fills a
// phone's screen with its buttons docked at the bottom; "float" (a floor cleared, a miss) floats
// over the game.
function show(h, kind = "page") {
  // (A card is a stopping place already: a pause waiting for the next problem isn't needed. autoPause)
  G.busy = true; G.pauseWanted = false; $("card").innerHTML = h; $("card").className = "card " + kind;
  $("ov").className = "ov " + kind; $("ov").hidden = false; $("ov").scrollTop = 0;
  // The main button is the last one in the row (Menu, then Play again).
  const bs = $("card").querySelectorAll(".btns button.big"), b = bs[bs.length - 1] || $("card").querySelector("button.big");
  if (b) b.focus({ preventScroll: true });
  requestAnimationFrame(moreUI);
}
function hide() { $("ov").hidden = true; }
// A card taller than the screen shows a bouncing arrow over its docked buttons while there's more
// below (.card.more), gone once it's scrolled to the end. Checked on scroll, and when the card
// changes size (a tab, a section opening).
function moreUI() {
  const o = $("ov");
  $("card").classList.toggle("more", !o.hidden && o.scrollHeight - o.scrollTop - o.clientHeight > 24);
}
$("ov").addEventListener("scroll", moreUI, { passive: true });
if (window.ResizeObserver) new ResizeObserver(moreUI).observe($("card"));

/* ---------- chests (DESIGN.md §6.3, loot.js) ----------
   After the floor's monster, about 1 floor in 3, and after every boss: a chest with a padlock that
   holds a learned fact, said aloud and answered on the card's own number pad (or < = >). Right:
   the lock pops and the lid opens with a fanfare, and what's inside is yours. Wrong: the lock jams
   (a clunk, the right answer shown and said, the fact to the retry queue) and a second lock is
   tried; a second miss leaves it shut. A lock costs nothing: no heart, no streak, no star. It
   records the fact like any answer, with no damage. */
// ?chest puts a chest after every floor (but the rescue floor), for testing; ?chest=money or
// ?chest=item picks what's inside.
const CHEST_ALWAYS = new URLSearchParams(location.search).get("chest");
function openChest(m, done) {
  G.busy = true;
  // Saved before it opens: a run picked up again goes on to the floor's card, so closing the app
  // mid-chest loses that chest rather than opening it twice.
  saveRun("chested");
  // A mega boss's chest is a big one (DESIGN.md §4.3): more coins, or two items.
  const C = G.chest = { done, boss: !!m.boss, big: m.form === "mega" || m.form === "legend", tries: 0, key: null };
  if (C.big) say("p", LOOT.bigChest, true);
  else say("p", LOOT.chest, true);
  if (once("chest", 3)) say("p", LOOT.chestHow);
  nextLock(C);
}
function nextLock(C) {
  C.key = lockKey(st.band, recs, { recent: G.recent, not: C.key });
  C.p = lockOf(C.key); C.input = ""; C.busy = false;
  chestShow(C, "locked");
  C.t0 = performance.now();
  say("q", askLine(C.p));
}
// The lock's problem: "4 + 3 = ?", or with the glowing ? in place of the □ ("7 + ? = 10").
function lockHTML(p) {
  const B = '<span class="blank" id="lockAns">?</span>';
  let t = p.op === "more" ? `${p.x} <small class="or">or</small> ${p.y}` : p.op === "/" || p.frac ? stacked(esc(p.q)) : esc(p.q);
  if (t.includes("□")) t = t.replace("□", B);
  else t += (p.op === "more" ? "<br>" : " = ") + B;
  if (p.op === "≈") t += `<small class="to">nearest ${p.to}</small>`;
  return t;
}
const CHEST_TITLE = { locked: "A treasure chest!", open: "It's open!", shut: "Still locked" };
function chestShow(C, state, msg) {
  const cmp = !!(C.p && C.p.sym), art = state === "open" ? "open" : "locked";
  const inside = state === "open" ? `<div class="loot-pop">${C.lootHTML}</div>`
    : `<div class="lock${state === "shut" ? " shut" : ""}" id="lock"><div class="lockq">${lockHTML(C.p)}</div></div>`;
  show(`<div class="chest-card c-${state}">
    <h2>${state === "locked" && C.big ? "A big treasure chest!" : CHEST_TITLE[state]}</h2>
    <div class="chest-box${C.big ? " big" : ""}">${chestSvg(art)}${inside}</div>
    <p class="chest-msg" id="chestMsg">${msg || (state === "locked" ? (C.tries ? "Try this lock." : "Answer the lock to open it.") : "")}</p>
    ${state === "locked" ? `<div class="pad chest-pad${cmp ? " cmp" : ""}" id="chestPad">${padKeysHTML(cmp ? "cmp" : "num", "Open!")}</div>`
      : `<div class="btns">${state === "open" && C.piece ? '<button class="big alt" id="chestWear">👕 Put it on</button>' : ""}<button class="big" id="chestNext">Next</button></div>`}</div>`, "float chest");
  if ($("chestPad")) $("chestPad").onclick = (e) => { const b = e.target.closest("button"); if (b) chestPress(b.dataset.k); };
  // Clothing found: put it on the captain now (it shows on the hearts row at once), then Next.
  if ($("chestWear")) $("chestWear").onclick = () => {
    putOn(wardrobe, team.captain, C.piece); saveWardrobe(); captainUI(); sfx.tick();
    const b = $("chestWear"); b.disabled = true; b.textContent = "✓ On!";
  };
  if ($("chestNext")) $("chestNext").onclick = () => { const d = C.done; G.chest = null; d(); };
}
function chestPress(k) {
  const C = G.chest;
  if (!C || C.busy || !C.p) return;
  if (k === "go") return chestSubmit(C);
  const cmp = !!C.p.sym, sym = "<=>".includes(k);
  if (k !== "del" && sym !== cmp) return;
  sfx.tick();
  if (k === "del") C.input = C.input.slice(0, -1);
  else if (sym) C.input = k;
  else if (C.input.length < 4) C.input = (C.input === "0" ? "" : C.input) + k;
  const a = $("lockAns");
  if (a) { a.textContent = C.input || "?"; a.classList.toggle("typed", !!C.input); }
}
function chestSubmit(C) {
  if (C.input === "") return;
  const p = C.p, ok = p.sym ? C.input === p.sym : Number(C.input) === p.ans;
  C.busy = true;
  // Recorded like any answer (learn.js record), with no damage.
  const ms = performance.now() - C.t0, limit = fluentTime(BANDS[st.band].fluentMs, p.sym || p.ans);
  recs[C.key] = recordAnswer(recs[C.key], { ok, ms, hinted: false, now: Date.now(), fluentMs: limit });
  store.player(PID).set("facts", recs);
  checkAchievements();
  if (ok) {
    sfx.chestOpen();
    say("p", LOOT.chestOpen, true);
    if (!reduced()) $("lock").classList.add("pop");
    setTimeout(() => { C.lootHTML = takeLoot(C); chestShow(C, "open", C.lootMsg); }, reduced() ? 0 : 380);
    return;
  }
  // Jammed: the right answer, shown and said, and back in a few problems (the retry queue).
  C.tries++;
  G.retry = G.retry.filter((r) => r.key !== C.key).concat([{ key: C.key, after: 3 + Math.floor(Math.random() * 3) }]);
  sfx.clunk();
  const a = $("lockAns"); if (a) { a.textContent = p.sym || p.ans; a.classList.add("right"); }
  if (!reduced()) restartAnim($("lock"), "jam");
  $("chestMsg").innerHTML = `The lock jammed! ${shownFact(p, p.ans)}`;
  say("p", LOOT.chestJam, true);
  const said = p.fact || p;
  say("q", spokenFact(said));
  setTimeout(() => {
    if (G.chest !== C) return;
    if (C.tries < 2) { say("p", LOOT.chestAgain); nextLock(C); }
    else { say("p", LOOT.chestShut); chestShow(C, "shut", "Maybe next time!"); }
  }, 2200);
}
// What's inside (loot.js contents): money, counted aloud, or an item. Saved at once.
function takeLoot(C) {
  let what = contents(Math.random, wardrobe.owned, moneyOK(), C.big, wardrobe.plush);
  if (CHEST_ALWAYS === "money") what = { kind: "money" };
  if (CHEST_ALWAYS === "item" && what.kind !== "item") what = { kind: "item", item: ITEMS[Math.floor(Math.random() * ITEMS.length)].id };
  if (CHEST_ALWAYS === "clothing" && what.kind !== "clothing") { const l = unowned(wardrobe.owned); if (l.length) what = { kind: "clothing", piece: l[Math.floor(Math.random() * l.length)].id }; }
  if (CHEST_ALWAYS === "plush" && !C.big) { const l = plushLeft(wardrobe.plush); if (l.length) what = { kind: "plush", plush: l[Math.floor(Math.random() * l.length)].id }; }
  if (what.kind === "plush") {
    // A plushie not owned yet (rare, plushie.js): its name, and whose favorite it is; it sits by
    // that hero on the start scene from now on.
    const p = plushById[what.plush];
    addPlush(wardrobe, p.id); saveWardrobe();
    say("p", plushName(p.id)); say("p", plushFavLine(p.id));
    C.lootMsg = `<b class="loot-name">${esc(p.name)}</b>${plushWhose(p.id)}`;
    return `<div class="loot-plush">${plushSvg(p.id)}</div>`;
  }
  if (what.kind === "clothing") {
    // A piece not owned yet, into the bag; shown on the captain, with Put it on beside Next.
    const p = clothesById[what.piece];
    addPiece(wardrobe, p.id); saveWardrobe();
    say("p", clothingName(p.id));
    C.piece = hasCaptain() ? p.id : null;
    C.lootMsg = `<b class="loot-name">${esc(p.name)}</b>${hasCaptain() ? "Put it on?" : "It's in your 👕 wardrobe."}`;
    if (hasCaptain()) say("p", SHOP.putOn);
    const preview = hasCaptain() ? heroSvg(HEROES[team.captain], { color: team.color, wear: Object.assign({}, dressOf(team.captain), { [p.spot]: p.id }) }) : pieceSvg(p.id);
    return `<div class="loot-cloth">${preview}</div>`;
  }
  // A big chest's two items.
  if (what.kind === "items") {
    what.items.forEach((id) => { gain(inv, id); say("p", itemName(id)); if (once("found:" + id)) say("p", itemWhat(id)); });
    saveItems();
    C.lootMsg = `<b class="loot-name">${what.items.map((id) => esc(itemOf(id).name)).join(" and ")}</b>They're in your 🎒 items.`;
    return `<div class="loot-item two">${what.items.map((id) => `<span class="ico" aria-hidden="true">${itemIcon(id)}</span>`).join("")}</div>`;
  }
  if (what.kind === "item") {
    const it = itemOf(what.item);
    gain(inv, it.id);
    saveItems();
    say("p", itemName(it.id));
    if (once("found:" + it.id)) say("p", itemWhat(it.id));
    C.lootMsg = `<b class="loot-name">${esc(it.name)}</b>It's in your 🎒 items.`;
    return `<div class="loot-item"><span class="ico" aria-hidden="true">${itemIcon(it.id)}</span></div>`;
  }
  const c = moneyFor(wing().id, C.boss, Math.random, C.big), f = fewest(c);
  wallet += c; saveWallet();
  checkAchievements(); // a whole dollar in the purse (Piggy Bank)
  sfx.coins(f.q + f.d + f.n + f.p);
  say("p", moneyLine(c));
  C.lootMsg = `<b class="loot-amt">+${c}¢</b>Into your purse!`;
  return `<div class="loot-coins">${coinsSvg({ q: f.q, d: f.d, n: f.n, p: f.p })}</div>`;
}

/* ---------- the purse and the items (DESIGN.md §6.3) ----------
   On the start screen (and the pause screen): the purse, the wallet always as coins (the fewest
   of each, $1 bills past a dollar), and 🎒 Items, where the 3 quick-use slots are set. */
// Money comes once the player has met it: a coin problem answered right (Trollar's find-the-coin
// and each coin in the Cellar, counting coins in the Mines), a grade past kindergarten (1st grade
// learns coin values), or coins already in the purse. Until then a kindergartner's chests hold
// items and clothing, and the purse, the shop and Trollar's stall don't show.
// Trollar's shop (its button and his stall) shows only while there's money in the purse: with
// none, there's nothing to buy with.
const shopOK = () => wallet > 0;
function moneyOK() {
  if (wallet > 0 || (st.grade != null && st.grade >= 1)) return true;
  return Object.keys(recs).some((k) => k[0] === "¢" && recs[k] && recs[k].c > 0);
}
// Bills come in 2nd grade (counting dollar bills and coins), or for a younger player who has
// answered a dollar problem ($ keys) right. Before that the purse, the shop's coins and change are
// coins only (loot.js setBills).
function billsOK() {
  if (st.grade != null && st.grade >= 2) return true;
  return Object.keys(recs).some((k) => k[0] === "$" && recs[k] && recs[k].c > 0);
}
function lootRowHTML() {
  setBills(billsOK());
  const money = moneyOK();
  return `<div class="loot-row${money ? "" : " no-money"}">
    ${money ? `<button type="button" class="small purse-btn" id="openPurse" aria-label="Your purse">${purseSvg()}<span class="wmini">${walletMini(wallet) || "<small>Empty</small>"}</span></button>` : ""}
    <button type="button" class="small items-btn" id="openItems" aria-label="Items"><span aria-hidden="true">🎒</span><span class="imini">${inv.slots.map((id) => `<i>${id ? itemIcon(id) : ""}</i>`).join("")}</span></button>
    ${shopOK() ? `<button type="button" class="small shop-btn" id="openShop" aria-label="Trollar's shop"><span class="shop-mini" aria-hidden="true">${STALL}</span></button>` : ""}
  </div>`;
}

/* ---------- the wardrobe (DESIGN.md §6.3, loot.js) ----------
   The captain, big and dressed, over three rows (head, face, neck), each the pieces owned for that
   spot and "none". Tapping one puts it on the captain at once, and the voice says its name. Only
   the captain is dressed here; a hero keeps their outfit after they stop being captain. From the
   start screen (👕 by the hero) and the pause screen; mid-run it shows on the hearts row at once.
   back: where Done goes (the start screen, the pause screen, or the shop). */
const SPOT_LABEL = { head: "🎩 Head", face: "👓 Face", neck: "🎀 Neck" };
function wardrobeCard(back, quiet) {
  if (!G.paused) G.onMenu = false;
  const d = team.captain, on = dressOf(d), any = wardrobe.owned.length > 0;
  const rows = SPOTS.map((sp) => {
    const list = ownedFor(wardrobe, sp);
    const none = `<button type="button" class="wpiece none${on[sp] ? "" : " on"}" data-spot="${sp}" aria-pressed="${!on[sp]}" aria-label="No ${sp} piece"><span aria-hidden="true">∅</span></button>`;
    return `<div class="wrow"><span class="wspot">${SPOT_LABEL[sp]}</span><div class="wpieces">${none}${list.map((p) =>
      `<button type="button" class="wpiece${on[sp] === p.id ? " on" : ""}" data-id="${p.id}" aria-pressed="${on[sp] === p.id}" aria-label="${esc(p.name)}">${pieceSvg(p.id)}</button>`).join("")}</div></div>`;
  }).join("");
  show(`<div class="cardhead"><h2>👕 Wardrobe</h2></div>
  <div class="wardrobe">
    <div class="wcap">${hasCaptain() ? heroArt(d) : ""}<b>${hasCaptain() ? esc(HEROES[d].n) : ""}</b></div>
    ${any ? `<div class="wrows">${rows}</div>` : `<p class="wempty">No clothes yet. Open chests or visit Trollar's shop!</p>`}
  </div>
  <div class="btns"><button class="big" id="wardDone">Done</button></div>`, G.paused ? "float" : "page");
  const redraw = () => { const top = $("ov").scrollTop; wardrobeCard(back, true); $("ov").scrollTop = top; };
  $("card").querySelectorAll(".wpiece").forEach((b) => b.onclick = () => {
    const id = b.dataset.id || null;
    if (!putOn(wardrobe, d, id, b.dataset.spot)) return;
    saveWardrobe(); sfx.tick();
    if (id) say("p", clothingName(id), true);
    captainUI(); whoUI();
    if (sceneOn()) drawScene();
    redraw();
  });
  $("wardDone").onclick = () => (back ? back() : G.paused ? pause() : menu());
  if (quiet) return;
  if (!any) say("p", SHOP.wardrobeEmpty, true);
  else if (once("wardrobe", 2)) say("p", SHOP.wardrobeHow, true);
}

/* ---------- Trollar's shop (DESIGN.md §6.3, shop.js) ----------
   From the start screen only (the stall in the scene, or 🏪 by the purse), never mid-run. It sells
   the four items, always, and a handful of clothing the player doesn't own (new after each run).
   Tapping a thing says its price; then paying is the math: the purse's coins (the wallet as the
   fewest bills and coins) are tapped onto the counter one at a time, and tapped back off, until
   there's enough, and Buy lights up. The game never pays. Too much: Trollar gives change, as the
   fewest coins, back into the purse. Can't afford it: Trollar says so, with no counter. */
const thingName = (t) => (t.kind === "item" ? itemOf(t.id).name : t.kind === "plush" ? plushById[t.id].name + " plushie" : clothesById[t.id].name);
const thingArt = (t) => (t.kind === "item" ? `<span class="ico" aria-hidden="true">${itemIcon(t.id)}</span>` : t.kind === "plush" ? plushSvg(t.id, { label: false }) : pieceSvg(t.id));
// Whose favorite a plushie is, as written under it: "Chef Eight's favorite!"
const plushWhose = (id) => `${esc(HEROES[heroOfPlush(id)].n)}'s favorite!`;
// One coin (or a $1 bill) as art.
const tokenArt = (k) => (k === "b" ? billSvg() : coinsSvg([{ k }]));
// The coins as a row of single tokens, biggest first: [{ k, i }] for each one.
const tokensOf = (c) => TOKENS.flatMap((t) => Array.from({ length: c[t.k] || 0 }, (_, i) => ({ k: t.k, i })));
function shopRestock() { shop.stock = restock(wardrobe.owned, Math.random, shop.stock, wardrobe.plush); saveShop(); }
function shopCard(view) {
  setBills(billsOK());
  G.onMenu = false;
  // A stock saved before plushies (or none yet) gets a fresh handful.
  if ((!shop.stock.length && unowned(wardrobe.owned).length) || (!shop.stock.some((id) => plushById[id]) && plushLeft(wardrobe.plush).length)) shopRestock();
  const k = kPrices(st.grade), S = G.shopping = G.shopping || {};
  S.purse = purseFor(wallet, S.purse); // this visit's coins (shop.js purseFor)
  const troll = MON.find((m) => m.n === "Trollar");
  const head = (msg) => `<div class="cardhead"><h2>Trollar's shop</h2></div>
  <div class="shop-top"><div class="shop-troll">${svg(troll)}</div><p class="bubble" id="shopSays">${msg}</p></div>`;
  const back = () => { G.shopping = null; menu(); };
  if (!view || view === "stock") {
    const sale = forSale(shop, wardrobe.owned, wardrobe.plush);
    const tiles = sale.map((t, i) => {
      const c = priceOf(t, k), have = t.kind === "item" ? countOf(inv, t.id) : 0;
      return `<button type="button" class="stile${t.kind === "clothing" ? " cloth" : t.kind === "plush" ? " plush" : ""}${wallet < c ? " dear" : ""}" data-i="${i}" aria-label="${esc(thingName(t))}, ${c} cents">
        <span class="sart">${thingArt(t)}${have ? `<b class="shave">${have}</b>` : ""}</span>${priceTag(c)}</button>`;
    }).join("");
    const noClothes = !unowned(wardrobe.owned).length, first = !S.greeted && once("shopHello");
    show(`${head(S.greeted ? "What will it be?" : first ? "Welcome to my shop!" : "Hello again!")}
    <div class="sgrid">${tiles}</div>
    ${noClothes ? `<p class="snote">You have all my clothes!</p>` : ""}
    <div class="shop-wallet">${purseSvg()}<div class="scoins">${tokensOf(S.purse).map((x) => `<span class="stoken">${tokenArt(x.k)}</span>`).join("") || "<small>Empty</small>"}</div><b class="stotal">${moneyAmt(wallet, billsOn())}</b></div>
    <div class="btns"><button class="big" id="shopDone">Done</button></div>`, "page shop");
    if (!S.greeted) {
      S.greeted = true;
      if (first) say("p", SHOP.hello, true); else say("p", SHOP.hi, true);
      if (once("shopPick", 2)) say("p", SHOP.pick);
      if (noClothes && once("allClothes")) say("p", SHOP.allClothes);
    }
    $("card").querySelectorAll(".stile").forEach((b) => b.onclick = () => {
      const t = sale[Number(b.dataset.i)], c = priceOf(t, k);
      sfx.tick();
      if (t.kind === "plush") { say("p", plushName(t.id), true); say("p", priceLine(t, c)); } else say("p", priceLine(t, c), true);
      Object.assign(S, { thing: t, price: c, n: 1, counter: emptyCounter(), paid: null });
      if (!canAfford(wallet, c)) { say("p", SHOP.need); return shopCard("need"); }
      // An item: how many first (1 to MANY); clothing is one each, straight to paying.
      if (manyOK(t)) { if (once("shopMany", 3)) say("p", SHOP.howMany); return shopCard("many"); }
      if (once("shopHow", 3)) say("p", SHOP.how);
      shopCard("pay");
    });
    $("shopDone").onclick = back;
    return;
  }
  const t = S.thing, c = S.price, n = howMany(S.n, t), due = c * n;
  // The total as math, written for the grade (shop.js sumText): repeated addition, or × from 3rd
  // grade; in dollars once bills are shown.
  const dollars = billsOn(), math = (m) => {
    const s = sumText(c, m, { times: timesOK(st.grade), dollars });
    const left = s.times ? `<span>${esc(s.times)}</span>` : s.terms.map((x) => `<span>${x}</span>`).join("<i>+</i>");
    return `<p class="smath" aria-label="${esc(s.text)}">${left}<span class="eq">= <b>${esc(s.total)}</b></span></p>`;
  };
  const many = n > 1 ? `<b class="smult">×${n}</b>` : "";
  const thing = `<div class="sthing${n > 1 ? " many" : ""}"><span class="sart lg">${thingArt(t)}${many}</span><span class="sname"><b>${esc(thingName(t))}</b>${n > 1 ? math(n) : priceTag(c)}</span></div>`;
  const toShop = () => { S.thing = null; shopCard("stock"); };
  if (view === "many") {
    // How many: big 1 to MANY buttons, the item drawn that many times, and the total as math.
    // A count the purse can't pay for stays picked (the math shows why), with Pay off.
    const most = mostFor(wallet, c, t), ok = n <= most;
    const nums = Array.from({ length: MANY }, (_, i) => i + 1).map((m) =>
      `<button type="button" class="snum${m === n ? " on" : ""}${m > most ? " dear" : ""}" data-n="${m}" aria-pressed="${m === n}" aria-label="${m}">${m}</button>`).join("");
    show(`${head(ok ? "How many?" : `You have enough coins for ${most}.`)}
    <div class="sthing"><span class="sart lg">${thingArt(t)}</span><span class="sname"><b>${esc(thingName(t))}</b>${priceTag(c)}</span></div>
    <div class="snums" role="group" aria-label="How many">${nums}</div>
    <div class="scopies n${n}" aria-hidden="true">${Array.from({ length: n }, () => `<span class="scopy"><span class="sart">${thingArt(t)}</span>${k ? priceTag(c) : ""}</span>`).join("")}</div>
    <div class="smathbox${ok ? "" : " short"}">${math(n)}</div>
    <div class="btns"><button class="big alt" id="shopBack">Back</button><button class="big buy" id="shopPay" ${ok ? "" : "disabled"}>Pay</button></div>`, "page shop");
    $("card").querySelectorAll(".snum").forEach((b) => b.onclick = () => {
      const m = Number(b.dataset.n);
      S.n = m; sfx.tick();
      if (m > most) say("p", affordLine(most), true); else say("p", manyLine(t, m, c, dollars), true);
      shopCard("many");
    });
    $("shopBack").onclick = toShop;
    $("shopPay").onclick = () => {
      if (!ok) return;
      S.counter = emptyCounter();
      if (once("shopHow", 3)) say("p", SHOP.how, true);
      shopCard("pay");
    };
    return;
  }
  if (view === "need") {
    show(`${head("You need more coins. Open chests to find some!")}${thing}
    <div class="spurse"><span class="slabel">Your purse</span><div class="scoins">${tokensOf(S.purse).map((x) => `<span class="stoken">${tokenArt(x.k)}</span>`).join("") || "<small>Empty</small>"}</div><b class="stotal">${moneyAmt(wallet, billsOn())}</b></div>
    <div class="btns"><button class="big" id="shopBack">Back</button></div>`, "page shop");
    $("shopBack").onclick = toShop;
    return;
  }
  if (view === "pay") {
    // The counter works against the total (price × how many).
    const on = counterTotal(S.counter), ok = enough(S.counter, due), rest = purseLeft(S.purse, S.counter);
    // The purse as stacks, one per kind, biggest first: tap one to put a coin down.
    const stacks = TOKENS.filter((x) => rest[x.k] > 0 || S.purse[x.k] > 0).map((x) =>
      `<button type="button" class="stack${rest[x.k] ? "" : " gone"}" data-k="${x.k}" ${rest[x.k] ? "" : "disabled"} aria-label="Put down ${x.k === "b" ? "a dollar" : "a " + coinOf(x.k).name}, ${rest[x.k]} left">${tokenArt(x.k)}<b>${rest[x.k] > 1 ? "×" + rest[x.k] : ""}</b></button>`).join("");
    const counter = tokensOf(S.counter).map((x) => `<button type="button" class="ctoken" data-k="${x.k}" aria-label="Take back ${x.k === "b" ? "the dollar" : "a " + coinOf(x.k).name}">${tokenArt(x.k)}</button>`).join("");
    show(`${head(ok ? "That's enough! Tap Buy!" : "Tap coins to pay me!")}${thing}
    <div class="counter${ok ? " ok" : ""}"><div class="ccoins">${counter || '<span class="chint">Tap your coins</span>'}</div><p class="ctotal">You put down <b>${moneyAmt(on, dollars)}</b></p></div>
    <div class="spurse"><span class="slabel">Your purse</span><div class="stacks">${stacks}</div></div>
    <div class="btns"><button class="big alt" id="shopBack">Back</button><button class="big buy" id="shopBuy" ${ok ? "" : "disabled"}>Buy</button></div>`, "page shop");
    $("card").querySelectorAll(".stack:not([disabled])").forEach((b) => b.onclick = () => {
      if (!putDown(S.purse, S.counter, b.dataset.k, due)) { if (enough(S.counter, due)) say("p", SHOP.enough, true); return; }
      sfx.coins(1);
      if (enough(S.counter, due)) say("p", SHOP.enough, true);
      shopCard("pay");
    });
    $("card").querySelectorAll(".ctoken").forEach((b) => b.onclick = () => { if (takeBack(S.counter, b.dataset.k)) { sfx.tick(); shopCard("pay"); } });
    // Back: an item to how many (the coins down go back in the purse), clothing to the shop.
    $("shopBack").onclick = () => (manyOK(t) ? (S.counter = emptyCounter(), shopCard("many")) : toShop());
    $("shopBuy").onclick = () => {
      const r = payMany(S.purse, S.counter, c, n, t);
      if (!r.ok) return; // never pays for you
      wallet = r.wallet; S.purse = r.purse; saveWallet();
      if (t.kind === "item") { gain(inv, t.id, r.n); saveItems(); } else if (t.kind === "plush") { addPlush(wardrobe, t.id); saveWardrobe(); } else { addPiece(wardrobe, t.id); saveWardrobe(); }
      S.paid = r;
      sfx.chestOpen();
      if (r.exact) { say("p", SHOP.exact, true); surprise("surprise:exact"); } else say("p", changeLine(r.change), true);
      say("p", SHOP.thanks);
      if (t.kind === "item") { if (r.n > 1) say("p", SHOP.inItemsMany); else say("p", SHOP.inItems); } else if (t.kind === "plush") say("p", plushFavLine(t.id)); else if (hasCaptain()) say("p", SHOP.putOn);
      shopCard("bought");
    };
    return;
  }
  // Bought: the change going back into the purse (or "Exact change!"), then where it went.
  const r = S.paid, change = r.exact ? `<p class="exact">⭐ Exact change! ⭐</p>`
    : `<div class="change"><span class="slabel">Here's ${r.change}¢ back!</span><div class="ccoins">${tokensOf(r.changeCoins).map((x, i) => `<span class="ctoken back" style="--i:${i}">${tokenArt(x.k)}</span>`).join("")}</div></div>`;
  const cloth = t.kind === "clothing" && hasCaptain();
  show(`${head("Thank you! Come again!")}${thing.replace('class="sthing', 'class="sthing got')}
  ${change}
  <div class="spurse"><span class="slabel">Your purse</span><div class="scoins">${tokensOf(S.purse).map((x) => `<span class="stoken">${tokenArt(x.k)}</span>`).join("") || "<small>Empty</small>"}</div><b class="stotal">${moneyAmt(wallet, billsOn())}</b></div>
  <p class="snote">${t.kind === "item" ? (r.n > 1 ? "They're in your 🎒 items." : "It's in your 🎒 items.") : t.kind === "plush" ? plushWhose(t.id) : cloth ? "Put it on?" : "It's in your 👕 wardrobe."}</p>
  <div class="btns">${cloth ? `<button class="big alt" id="shopBack">Not now</button><button class="big" id="shopWear">👕 Put it on</button>` : `<button class="big" id="shopBack">Back to the shop</button>`}</div>`, "page shop");
  $("shopBack").onclick = toShop;
  if ($("shopWear")) $("shopWear").onclick = () => {
    putOn(wardrobe, team.captain, t.id); saveWardrobe(); captainUI(); whoUI();
    say("p", clothingName(t.id), true);
    wardrobeCard(toShop, true);
  };
}
// fromPause: Back returns to the pause screen; otherwise to the start screen.
function purseCard(fromPause) {
  setBills(billsOK());
  if (!fromPause) G.onMenu = false;
  const dollars = Math.floor(wallet / 100), cents = wallet % 100;
  const total = wallet >= 100 ? `$${dollars}.${String(cents).padStart(2, "0")}` : `${wallet}¢`;
  show(`<div class="cardhead"><h2>Your purse</h2></div>
  <div class="purse-card">${purseSvg()}
    ${wallet ? `<div class="wallet">${walletSvg(wallet)}</div><p class="wtotal">${total}</p>` : "<p>Your purse is empty. Open chests to find coins!</p>"}</div>
  <div class="btns"><button class="big" id="purseBack">Back</button></div>`, fromPause ? "float" : "page");
  if (wallet) say("p", purseLine(wallet), true); else say("p", LOOT.purseEmpty, true);
  $("purseBack").onclick = () => (fromPause ? pause() : menu());
}
// fromSlot: opened by tapping an empty slot mid-fight, so Done goes back to the fight, not the pause screen.
function itemsCard(fromPause, quiet, fromSlot) {
  if (!fromPause) G.onMenu = false;
  const slots = inv.slots.map((id, k) => id
    ? `<button type="button" class="islot" data-k="${k}" aria-label="Slot ${k + 1}: ${esc(itemOf(id).name)}. Tap to take it out."><span class="ico" aria-hidden="true">${itemIcon(id)}</span></button>`
    : `<button type="button" class="islot empty" data-k="${k}" aria-label="Slot ${k + 1}: empty" disabled></button>`).join("");
  const grid = ITEMS.map((it) => {
    const n = countOf(inv, it.id);
    return `<button type="button" class="iitem${n ? "" : " none"}" data-id="${it.id}" aria-label="${esc(it.name)}, ${n}"><span class="ico" aria-hidden="true">${itemIcon(it.id)}</span><b class="n">${n}</b><small>${esc(it.name)}</small></button>`;
  }).join("");
  show(`<div class="cardhead"><h2>🎒 Items</h2></div>
  <div class="grp"><span>Quick-use slots</span><div class="islots">${slots}</div></div>
  <div class="grp"><span>Your items</span><div class="igrid">${grid}</div></div>
  <div class="btns"><button class="big" id="itemsDone">${fromSlot ? "Keep fighting" : "Done"}</button></div>`, fromPause ? "float" : "page");
  const redraw = () => { const top = $("ov").scrollTop; itemsCard(fromPause, true, fromSlot); $("ov").scrollTop = top; };
  // Mid-run (from the pause screen) a slot set fills right away from the inventory.
  const changed = () => saveItems(); // a slot set from the pause screen is there to tap when the fight resumes
  $("card").querySelectorAll(".iitem").forEach((b) => b.onclick = () => {
    const id = b.dataset.id;
    say("p", itemName(id), true); say("p", itemWhat(id));
    const k = putInSlot(inv, id);
    if (k < 0) return;
    sfx.tick(); changed(k);
    if (once("itemsClear")) say("p", LOOT.itemsClear);
    redraw();
  });
  $("card").querySelectorAll(".islot:not(.empty)").forEach((b) => b.onclick = () => { const k = Number(b.dataset.k); clearSlot(inv, k); sfx.tick(); changed(k); redraw(); });
  $("itemsDone").onclick = () => (fromSlot ? resume() : fromPause ? pause() : menu());
  if (!quiet) {
    if (!ITEMS.some((i) => countOf(inv, i.id))) say("p", LOOT.itemsEmpty, true);
    else if (once("itemsHow", 3)) say("p", LOOT.itemsHow, true);
  }
}

/* ---------- pausing ----------
   ⏸ by the hearts (or Escape) pauses mid-problem: Keep fighting, Monsters & Heroes,
   Achievements (the 🏆 sheet: looking only, its Back returns here), Items, Wardrobe, Settings,
   the purse, or Exit to the start screen (a second tap confirms, since it ends the run). */
// auto: the app was left mid-fight (autoPause): the same pause, without its line said to nobody.
function pause(auto) {
  setBills(billsOK());
  const justPaused = !G.paused; // not coming back from Settings or the book
  if (justPaused) {
    if (!G.running || G.busy || G.next) return;
    G.paused = { at: performance.now() };
    saveRun("problem"); // with the answer time so far
    musicNow(MUSIC_PAUSE_FADE);
  }
  stopSpeech();
  if (justPaused && !(auto === true && document.hidden) && once("pause", 3)) say("p", PHRASE.paused);
  show(`<h2>Paused</h2>
  <p>Floor ${G.floor + 1} of ${G.floors.length}: <strong>${esc(G.floors[G.floor].n)}</strong></p>
  <div class="pause-btns"><button class="small" type="button" id="pBook">📖 Monsters &amp; Heroes</button><button class="small" type="button" id="pTrophies">🏆 Achievements</button><button class="small" type="button" id="pItems">🎒 Items</button><button class="small" type="button" id="pWardrobe">👕 Wardrobe</button><button class="small${moneyOK() ? "" : " pwide"}" type="button" id="pSettings">⚙ Settings</button>${moneyOK() ? `<button class="small purse-btn" type="button" id="pPurse" aria-label="Your purse">${purseSvg()}<span class="wmini">${walletMini(wallet)}</span></button>` : ""}<button class="small danger" type="button" id="pExit">Exit the dungeon</button></div>
  <p class="pause-ver" aria-label="Version ${esc(BUILD)}">v ${esc(BUILD)}</p>
  <div class="btns"><button class="big" id="resume">Keep fighting</button></div>`, "float");
  $("resume").onclick = resume;
  $("pBook").onclick = bookPage;
  $("pTrophies").onclick = trophyPage; // the 🏆 sheet; its Back comes back here
  $("pItems").onclick = () => itemsCard(true);
  if ($("pPurse")) $("pPurse").onclick = () => purseCard(true);
  $("pWardrobe").onclick = () => wardrobeCard();
  $("pSettings").onclick = () => settings(true);
  $("pExit").onclick = () => {
    const b = $("pExit");
    if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "Exit? This run ends"; say("p", PHRASE.exitSure, true); return; }
    G.paused = null; G.running = false; clearRun(); record(); refundArmed(); musicNow();
    newRun(); loadMonster(0, true);
    menu();
  };
}
// Back to the same problem. The pause doesn't count toward the answer time.
function resume() {
  const p = G.paused; if (!p) return;
  G.paused = null; hide(); G.busy = false;
  G.t0 += performance.now() - p.at;
  musicNow();
  slotsUI(); // slots set from the pause screen's 🎒 Items
  // The dot flash's dots waited through the pause: their whole look again.
  if (G.flash && G.flash.held) { G.flash.held = false; flashHide(G.cur); }
}
/* ---------- background music ----------
   Each stratum's Accents-only ambience (music.js: the Cellar's drips and music-box notes, the
   Hall's echoing high notes, the Mines' chimes, the Tower's bells), on the one Web Audio context
   (sfx.audioContext), only while a run is being played: not on the start screen, a pause (⏸, or
   Settings and the book from it), the end card, or with the page hidden. musicNow() works out
   whether it should be playing and starts or stops it to match; it's called wherever that can
   change, and once a second besides, as a safety net. A fresh start each time (a new seed), with
   music.js's fade in; a stop fades out. It ducks under every spoken line (speech.js onTalk) and
   for a whole Hero Moment. st.music is its own switch, apart from the sound effects. */
let music = null, musicCtx = null, momentDuck = false;
const MUSIC_FADE_IN = 3000, MUSIC_FADE_OUT = 1200, MUSIC_PAUSE_FADE = 500;
// Music is off for everyone for now (the user, 2026-11-27): nothing plays, and its switch in
// Settings is hidden. Set true to bring it back; each player's own Music setting still applies.
const MUSIC_ON = false;
function musicWanted() {
  return !!(MUSIC_ON && st && st.music !== false && G.running && !G.paused && !G.onMenu && !document.hidden && !descending());
}
function musicNow(fadeMs) {
  const ctx = sfx.audioContext(), want = musicWanted() && ctx && ctx.state !== "closed";
  // Playing on a context that's gone (sfx remade it) or in another stratum: let it go at once.
  if (music && (musicCtx !== ctx || music.id !== wing().id)) stopMusic(0);
  if (!want) { if (music) stopMusic(fadeMs == null ? MUSIC_FADE_OUT : fadeMs); return; }
  if (music) return;
  try {
    music = startMusic(ctx, wing().id, ctx.destination, { accents: true, level: MUSIC_LEVEL, seed: 1 + Math.floor(Math.random() * 1e6), fadeIn: MUSIC_FADE_IN });
    musicCtx = ctx;
    if (isTalking() || momentDuck) music.duck(true);
  } catch (e) { music = null; musicCtx = null; }
}
function stopMusic(fadeMs) {
  const m = music;
  music = null; musicCtx = null;
  if (m) { try { m.stop(fadeMs); } catch (e) { /* its context is closed: nothing left to hear */ } }
}
function duckMusic() { if (music) { try { music.duck(isTalking() || momentDuck); } catch (e) { /* closed */ } } }
onTalk(duckMusic);
// A new context (the first tap, or sfx remade a silent one): the music moves onto it.
sfx.onContext(() => musicNow());
setInterval(() => musicNow(), 1000);
// For ?debug's sumgeonState and the Sound check.
const musicLine = () => {
  const m = musicState();
  return `Music: ${!m.on ? "off" : m.playing ? `playing (${m.id}${m.ducked ? ", ducked" : ""})` : "on, not playing (only in a fight)"}`;
};
const musicState = () => ({ playing: !!music, id: music ? music.id : null, seed: music ? music.seed : null, ducked: isTalking() || momentDuck, on: MUSIC_ON && (!st || st.music !== false) });

/* ---------- leaving the app mid-run ----------
   The page hidden (another app, the Home Screen, the phone locked) mid-fight pauses it as ⏸ does,
   so coming back shows the pause card and Keep fighting picks up the same problem with its time.
   Mid-attack or mid-Hero-Moment it can't pause yet: it pauses as the next problem comes up
   (G.pauseWanted). A card (a floor cleared, the Oops card) is already a stopping place. Nothing
   else runs meanwhile: the roar, the hint's nudge and the dot flash wait for the pause to end. */
function autoPause() {
  settle();
  // Mid-descent: it ends now (the run starts under it) and pauses at its first problem.
  if (descending()) { skipDescent(); G.pauseWanted = true; return; }
  stopMusic(0); // hidden: nothing to hear, and iOS may stop the context under it
  if (!G.running) return;
  stopSpeech();
  if (G.paused) { saveRun(G.stage || "problem"); return; }
  if (!$("ov").hidden) return;
  if (G.busy || G.next) { G.pauseWanted = true; return; }
  pause(true);
}
document.addEventListener("visibilitychange", () => { if (document.hidden) autoPause(); else comeBack(); });
addEventListener("pagehide", autoPause);
addEventListener("pageshow", (e) => { if (e.persisted) comeBack(); });
// Every animation that ends (an entrance, a card opening, a hit, the start card falling away) is
// brought to its end, so nothing is caught half-drawn: iOS freezes them in the background, and an
// iPad came back from the background to a dimmed screen with the monster, the pad and the hearts
// missing. Looping ones (the bob, the stars' twinkle, the 💡 nudge) are left alone.
function settle() {
  try {
    document.getAnimations().forEach((a) => {
      const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
      if (t && isFinite(t.endTime) && a.playState !== "finished") a.finish();
    });
  } catch (e) { /* no Web Animations: nothing to settle */ }
}
// Back in the app: everything settled and drawn again, and a run lands on a clean pause card.
function comeBack() {
  settle();
  if (descending()) return;
  if (G.running) {
    redrawFight();
    if (G.paused) { pause(); return; } // the pause card, drawn fresh
    if ($("ov").hidden && !G.busy && !G.next) { G.pauseWanted = false; pause(true); }
    return;
  }
  // The start screen, drawn fresh (not Settings or the book over it), where it was scrolled to:
  // menu() opens a card at the top, which jumped a scrolled start screen back up on every return.
  if (G.onMenu && !$("ov").hidden && $("go")) {
    const ov = $("ov"), top = ov.scrollTop, inner = $("card").scrollTop;
    menu();
    ov.scrollTop = top; $("card").scrollTop = inner;
  }
}
// The fight's parts as they should be now: the monster, its HP, the hearts, the streak, the
// slots, and the problem and pad.
function redrawFight() {
  const m = G.floors && G.floors[G.floor], el = $("mon");
  // Not while the room waits empty after the descent (start's pause): the run's first monster
  // isn't loaded yet, and drawing one there showed it early, with no nameplate or problem.
  if (!m || $("arena").classList.contains("empty")) return;
  ["hit", "lunge", "roar", "throw", "squawk"].forEach((c) => el.classList.remove(c));
  if (G.hp > 0 && !el.querySelector("svg")) el.innerHTML = monsterArt(m);
  $("arena").classList.remove("hurt", "shake", "rumble");
  hpUI(); heartsUI(); streakUI(); slotsUI();
  if (G.cur && !G.busy) { probUI(); ansUI(); }
}

/* ---------- picking a run up again after a reload ----------
   iOS can reload a Home Screen app that's been in the background a while, which used to lose the
   run. So the run in progress is saved as it goes (saveRun): when each problem comes up, as an
   answer lands (the next problem, or the monster beaten), when a floor is cleared (the next
   floor), and on pausing or leaving the app (the answer time so far). Per player as "run", never
   synced (merge.js LOCAL_KEYS): it's this device's game in progress. A finished, lost or exited
   run clears it, and so does starting a new one. On the start screen, a run saved in the last
   RUN_KEEP_MS is offered as "Keep going?" (keepGoing), at the problem it was on. Anything in it
   that doesn't fit the game as it is now (an update, a dungeon version change) and it's dropped,
   quietly, with its armed items back in the bag. */
const RUN_V = 1, RUN_KEEP_MS = 4 * 3600e3, RUN_STAGES = ["problem", "next", "beaten", "chested", "floor"];
let RUN_KEYS = null; // every fact key the game asks, made when first needed (checkRun)
// A floor's monster by name (a look's own name, a boss's form by its depth), or a cursed digit.
const floorRef = (m) => (m.cursed != null ? { cursed: m.cursed } : m.boss ? { boss: m.n, legend: m.form === "legend" } : { n: m.n });
function floorFrom(ref, w, depth) {
  if (!ref || typeof ref !== "object") return null;
  if (ref.cursed != null) return HEROES[ref.cursed] ? cursedMonster(ref.cursed) : null;
  if (ref.boss) { const b = bossAt(w, depth, !!ref.legend); return b && b.n === ref.boss ? b : null; }
  const n = RENAMED[ref.n] || ref.n; // a run saved before a look was renamed
  return MON.find((x) => x.n === n && !x.boss) || allLooks().find((x) => x.n === n) || null;
}
// stage: "problem" (G.cur being worked on), "next" (answered: a new problem next), "beaten" (the
// monster's HP is gone: its chest and card next), "chested" (its chest has come up: only the card
// next, so a run picked up again never opens the same chest twice) or "floor" (cleared: the next floor). o.hp: the
// HP once the hit that's playing lands.
function saveRun(stage, o = {}) {
  if (!G.running || !G.floors || !PID) return;
  G.stage = stage;
  const working = stage === "problem" && G.cur;
  const s = { v: RUN_V, dungeon: DUNGEON_VERSION, at: Date.now(), stage, wing: wing().id, band: st.band, depth: G.depth,
    floors: G.floors.map(floorRef), floor: G.floor, hp: o.hp != null ? o.hp : G.hp, max: G.max, hearts: G.hearts,
    streak: G.streak, solved: G.solved, tries: G.tries, runStars: G.runStars || 0, retry: G.retry, recent: G.recent, recentAns: G.recentAns || [],
    fx: G.fx || {}, exam: G.exam || null, examBand: G.examBand || null, onFloor: G.onFloor || 0, halved: !!G.halved, floorLost: G.floorLost || 0,
    floorStreak: G.floorStreak || 0, floorSlow: !!G.floorSlow, barked: G.barked || {}, charged: !!G.charged, mr: MR,
    cur: working ? G.cur : null, hinted: working ? !!G.hinted : false,
    elapsed: working ? Math.max(0, Math.round((G.paused ? G.paused.at : performance.now()) - G.t0)) : 0 };
  try { store.player(PID).set("run", JSON.parse(JSON.stringify(s))); } catch (e) { /* not saved: the run still plays */ }
}
function clearRun() { if (PID) store.player(PID).clear("run"); G.stage = null; }
// Dropped: armed items (a Shield never used) go back in the bag, as at a run's end.
function dropRun(s) {
  const fx = s && typeof s === "object" && s.fx && typeof s.fx === "object" ? s.fx : {};
  const back = ["shield", "totem", "magnet"].filter((id) => fx[id]);
  back.forEach((id) => gain(inv, id));
  if (back.length) saveItems();
  clearRun();
}
// The saved run, checked against the game as it is now: { s, floors }, or null (and dropped).
function savedRun() {
  const s = store.player(PID).get("run", null);
  if (!s) return null;
  let ok = null;
  try { ok = checkRun(s); } catch (e) { ok = null; }
  if (!ok) dropRun(s);
  return ok;
}
function checkRun(s) {
  const int = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi, fin = (n) => typeof n === "number" && isFinite(n);
  if (!s || s.v !== RUN_V || s.dungeon !== DUNGEON_VERSION || !RUN_STAGES.includes(s.stage)) return null;
  if (!fin(s.at) || Date.now() - s.at > RUN_KEEP_MS || s.at > Date.now() + 60e3) return null;
  const w = WINGS.find((x) => x.id === s.wing);
  if (!w || w.band !== s.band || !BANDS[s.band] || !openWings(progress, recs, st.start).includes(w.id)) return null;
  if (!int(s.depth, 1, 999) || !Array.isArray(s.floors) || s.floors.length !== w.floors.length + 1) return null;
  const floors = s.floors.map((r) => floorFrom(r, w, s.depth));
  if (floors.some((m) => !m)) return null;
  const last = floors.length - 1;
  if (!int(s.floor, 0, s.stage === "floor" ? last - 1 : last)) return null;
  if (!int(s.hearts, 1, BANDS[s.band].hearts) || !fin(s.hp) || !fin(s.max) || s.max <= 0 || s.hp > s.max) return null;
  if (s.stage === "beaten" || s.stage === "chested" ? s.hp > 0 : s.stage !== "floor" && s.hp <= 0) return null;
  if (![s.streak, s.solved, s.tries, s.runStars, s.onFloor, s.floorLost, s.floorStreak].every((n) => int(n, 0, 1e6))) return null;
  if (!Array.isArray(s.retry) || !Array.isArray(s.recent) || !s.retry.every((r) => r && typeof r.key === "string" && fin(r.after))) return null;
  if (s.stage === "problem") {
    const c = s.cur;
    if (!c || typeof c !== "object" || typeof c.key !== "string" || typeof c.op !== "string" || (!fin(c.ans) && !c.sym && !c.draw)) return null;
    // A fact this version asks (a key from before an update may be gone or mean something else).
    if (!(RUN_KEYS || (RUN_KEYS = new Set(Object.keys(BANDS).flatMap((b) => pool(b).map((x) => x.key))))).has(c.key)) return null;
    const f = factOf(c.key);
    if (!f || f.key !== c.key) return null;
    if ((c.spell || c.draw) && !canSpell()) return null;
  }
  return { s, floors };
}
// "Keep going?": the run as it was saved, without the descent. The problem it was on comes back
// with its answer time so far; a hint that was open opens again.
function keepGoing(R) {
  const s = R.s;
  G.onMenu = false;
  if (st.band !== s.band) { st.band = s.band; saveSettings(); }
  hide(); hideScene(); stopSpeech();
  document.body.dataset.stratum = wing().id;
  G.depth = s.depth; G.floors = R.floors;
  diveUI();
  spritesFor(wing(), legendNow());
  document.querySelector(".game").style.setProperty("--murk", Math.min(0.48, 0.08 * (G.depth - 1)).toFixed(2));
  G.shopping = null;
  Object.assign(G, { hearts: s.hearts, streak: s.streak, solved: s.solved, tries: s.tries, running: true, retry: s.retry, recent: s.recent, recentAns: s.recentAns || [],
    next: false, paused: null, runStars: s.runStars, fx: s.fx && typeof s.fx === "object" ? s.fx : {}, chest: null, news: [], pauseWanted: false });
  MR = Object.assign(freshRun(), s.mr && typeof s.mr === "object" ? s.mr : {});
  if (s.stage === "floor") { loadMonster(s.floor + 1); newProblem(); return; }
  loadMonster(s.floor, true);
  Object.assign(G, { max: s.max, hp: s.hp, onFloor: s.onFloor, halved: s.halved, floorLost: s.floorLost, floorStreak: s.floorStreak, floorSlow: s.floorSlow,
    barked: s.barked && typeof s.barked === "object" ? s.barked : {}, exam: s.exam || null, examBand: s.examBand || null });
  const m = G.floors[G.floor], half = G.halved && G.hp > 0 ? atHalf(m) : null;
  if (half && half.split) $("mon").innerHTML = `<div class="split">${monsterArt(m)}${monsterArt(m)}</div>`;
  if (half && half.curl) $("mon").classList.add("curled");
  hpUI(); heartsUI(); streakUI(); slotsUI();
  say("m", monsterName(m));
  if (s.stage === "beaten" || s.stage === "chested") { const chested = s.stage === "chested"; G.busy = true; $("mon").className = "mon dead"; setTimeout(() => { if (G.running) cleared(chested); }, 600); return; }
  setMsg("Welcome back! Keep fighting.", "good");
  if (s.stage === "next") { newProblem(); return; }
  G.cur = s.cur; G.charged = s.charged; $("charge").hidden = !G.charged;
  G.spellFails = 0; G.drawFails = 0; G.drawn = null;
  presentProblem(s.cur.key, false, true, s.elapsed);
  if (s.hinted && !$("hintBtn").hidden) openHint(); else if (s.hinted) G.hinted = true;
}
$("pauseBtn").onclick = pause;
// Where ⏸ sits: on phones at the right of the hero-and-hearts row (under the thumb); on iPad and
// desktop (760px and wider) at the top right, beside the floor in the header, where pause
// usually is. The same button moves, so its wiring and focus stay.
{
  const wide = matchMedia("(min-width: 760px)"), btn = $("pauseBtn");
  const place = () => { if (wide.matches) document.querySelector(".top .tools").appendChild(btn); else document.querySelector(".you").appendChild(btn); };
  place();
  wide.addEventListener ? wide.addEventListener("change", place) : wide.addListener(place);
}

/* ---------- the menu: players and settings ---------- */
function openMenu() {
  G.busy = true;
  stopSpeech();
  menu();
}
function chip(type, name, value, checked, label, id) {
  return `<label class="chip"><input type="${type}" name="${name}" value="${value}"${id ? ` id="${id}"` : ""} ${checked ? "checked" : ""}><span>${label}</span></label>`;
}
// Settings → Players: one card per player, with their hero, name and grade. Tap a card to play
// as them (the one playing has a gold outline and a ✓). ✎ opens a card to rename it, set the
// grade (the current player's; another player is asked theirs when they first play), or remove it
// (a second tap confirms; never the one playing). "+ Add player" adds a card and opens it.
let editId = null;
function playersHTML() {
  const list = store.profiles();
  const cards = list.map((p, i) => {
    const me = p.id === PID, open = editId === p.id;
    const g = me ? st.grade : store.settings(p.id).grade;
    const h = me ? team : (store.player(p.id).get("heroes", null) || {});
    const hero = h.captain != null ? heroSvg(HEROES[h.captain], { color: h.color || null, wear: wearOf(me ? wardrobe : freshWardrobe(store.player(p.id).get("wardrobe", null)), h.captain) }) : '<span class="pnone" aria-hidden="true">?</span>';
    const name = esc(displayName(list, p.id));
    return `<li class="pcard${me ? " me" : ""}${open ? " open" : ""}" data-id="${esc(p.id)}">
      <div class="phead">
        <button class="pmain" type="button" data-act="play" ${me ? 'aria-current="true"' : ""} aria-label="${me ? `${name}, playing now` : `Play as ${name}`}">
          <span class="pav">${hero}</span>
          <span class="pname"><b>${name}</b><small>${g != null ? gradeName(g) : "Grade not picked yet"}${linkOf(p.id) ? " · 🔗 Linked" : ""}</small></span>
          ${me ? '<span class="pnow" aria-hidden="true">✓</span>' : ""}
        </button>
        <button class="icon-btn pedit${open ? " done" : ""}" type="button" data-act="edit" aria-expanded="${open}" aria-label="${open ? "Done editing" : "Edit"} ${name}">${open ? "Done" : "✎"}</button>
      </div>
      ${open ? `<div class="pform">
        <label>Name <input type="text" maxlength="24" value="${esc(p.name)}" placeholder="Player ${i + 1}" aria-label="Name (optional)"></label>
        ${me ? `<div class="pgrades"><span>Grade</span>${gradesHTML(true)}</div>` : `<p class="pnote">${g != null ? gradeName(g) + ". To change it, play as them." : "They'll be asked their grade when they first play."}</p>`}
        ${store.canRemove(p.id) ? '<button class="small danger" type="button" data-act="remove">Remove player</button>' : ""}
      </div>` : ""}
    </li>`;
  }).join("");
  return `<ul class="pcards">${cards}</ul>
  <button class="small add-player" type="button" id="addPlayer">+ Add player</button>`;
}
// The grade buttons, K to 5: big on the start screen's question, a compact row (mini) in
// Settings → Players. A pre-reader can read them: they're K and digits.
function gradesHTML(mini) {
  return `<div class="grades${mini ? " mini" : ""}" role="group" aria-label="Grade">${GRADES.map((g) => {
    const on = g === st.grade;
    return `<button type="button" class="gpick${on ? " on" : ""}" data-g="${g}" aria-pressed="${on}" aria-label="${gradeName(g)}"><b>${gradeLabel(g)}</b>${mini ? "" : `<small>${g ? "grade" : "kinder"}</small>`}</button>`;
  }).join("")}</div>`;
}
// A grade picked (or changed): its strata open from the start. Only settings change; progress
// and what's been learned stay (wings.js withGrade).
function setGrade(g) {
  const was = st.band;
  st = withGrade(st, g, { first: st.grade == null, fresh: fresh(), progress, recs });
  saveSettings();
  if (st.band !== was) { G.running = false; newRun(); loadMonster(0, true); }
}
function wireGrades(after) {
  $("card").querySelectorAll(".gpick").forEach((b) => b.onclick = () => { setGrade(Number(b.dataset.g)); after(); });
}
// "Chapter 1 of 2: Within 10, Coins", the path's new steps open now (DESIGN.md §4.3), from the
// player's own fact records.
function levelLine() {
  // Endless (a stratum whose Legend is beaten): chapters don't mean much any more.
  if (endlessOn()) return "∞ Endless: mastered facts";
  const w = wing(), path = PATHS[w.id], s = stepsNow(w), now = (s.window.length ? s.window : s.open.slice(-1)).map((i) => path[i].name);
  return `Chapter ${chapterNow(w)} of ${chaptersOf(path)}: ${now.join(", ")}`;
}
// A stratum's depths on the map, as a shaft going down: depths cleared (filled), the deepest
// reached ("you are here"), and the ones still below. It starts at MAP_DEPTHS rows and grows as
// you go deeper; a long run of cleared depths folds into one row.
// Each row has the boss's mark (bossMark): a ring filling in toward the crown across a chapter's
// five depths, and a crown on a mega boss's depth (DESIGN.md §4.3).
function depthTrack(w, d) {
  const last = Math.max(MAP_DEPTHS, d + 1), rows = [];
  let first = 1;
  if (last > 8) { first = last - 6; rows.push(`<li class="done fold"><i></i>Depths 1–${first - 1} cleared</li>`); }
  for (let n = first; n <= last; n++) {
    const sc = depthScore(w, n), score = sc.got ? ` <small>★ ${sc.got} of ${sc.max}</small>` : "", mk = bossMark(n);
    rows.push(n < d ? `<li class="done${isMega(n) ? " mega" : ""}"><i></i>Depth ${n}${mk}${score}</li>` : n === d ? `<li class="here${isMega(n) ? " mega" : ""}"><i></i>Depth ${n}${mk}${score} <em>${d === 1 && !(progress[w.id] || {}).best ? "start here" : "you are here"}</em></li>` : `<li class="${isMega(n) ? "mega" : ""}"><i></i>Depth ${n}${mk}</li>`);
  }
  return `<ol class="shaft" aria-label="Deepest: depth ${d}">${rows.join("")}</ol>`;
}
// The boss's mark on a depth: a crown on a mega boss's depth; on the two depths before it, a ring
// filled a third, then two thirds, as the boss powers up; nothing on the boss's plain depths.
function bossMark(n) {
  const s = bossStage(n);
  if (s === 3) return ` <b class="bmark crown" title="Mega boss" aria-label="Mega boss">👑</b>`;
  return s ? ` <b class="bmark" style="--fill:${s * 33}%" title="The boss is getting stronger" aria-label="The boss is getting stronger"></b>` : "";
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
    // A stratum whose Legend is beaten (DESIGN.md §14.2) gets a gold edge; one whose Legend awaits says so.
    // Its runs are Endless now (DESIGN.md §6.4): the facts already mastered there.
    if (isOpen && endlessOn(w)) note = "🌟 Legend beaten · " + note;
    else if (isOpen && legendNow(w)) note = "🌟 A legend awaits! · " + note;
    // How far along to the Legend: rounded down, so 100% only when it's ready.
    const pct = isOpen && !legendBeaten(w, progress) && !legendNow(w) ? Math.floor(legendProgress(w, recs) * 100) : null;
    const toLegend = pct == null ? "" : `<em class="to-legend">Legendary depths · ${pct}%</em>`;
    return `<label class="wing ${w.id}${here ? " here" : ""}${isOpen ? "" : " locked"}${isOpen && legendBeaten(w, progress) ? " golden" : ""}"><input type="radio" name="wing" value="${w.id}" ${here ? "checked" : ""} ${isOpen ? "" : "disabled"}>
      <span><b>${w.name}${isOpen && endlessOn(w) ? ' <i class="endless-mark" title="Endless" aria-label="Endless">∞</i>' : ""}</b><small>${b.label}</small><em>${note}</em>${here ? `<em class="level" id="levelLine">${levelLine()}</em>` : ""}
      ${isOpen ? depthTrack(w, d) : ""}${toLegend}</span></label>`;
  }).join("");
}
// The start screen, top to bottom: the title (with ⚙ Settings), your hero, the Wings, and
// "Enter the dungeon" docked at the bottom. Monsters & Heroes is on the pause screen. Players, chalk color and sounds are in
// Settings, as in Sound Box. Names are optional.
function menu() {
  G.onMenu = true;
  musicNow();
  // With no hero yet, the first tap here asks for one out loud (below), once per player a visit.
  if ((!hasCaptain() || st.grade == null) && G.askedFor !== PID) G.askHero = true;
  if (updateReady && !G.running) { reloadForUpdate(); return; } // a new version is waiting
  voicePlan();
  const list = store.profiles();
  // The scene-gap is the window onto the start scene (drawScene): the door and your team show
  // there, between the title and the rest of the card.
  const head = `<div class="cardhead logo-head"><h2 class="logo">Sum<b>geon</b></h2>${trophyButton()}<button class="icon-btn book-btn" id="openBook" type="button" aria-label="Monsters and Heroes">📖</button><button class="icon-btn" id="openSettings" type="button" aria-label="Settings">${GEAR}</button></div>
  <div class="scene-gap" aria-hidden="true"></div>
  ${st.grade == null ? "" : `<p class="tag"><strong>Your answer is your attack.</strong> Get it right and your digits fly at the monster.</p>`}
  ${list.length > 1 ? `<p class="playing">Playing as <b>${esc(displayName(list, PID))}</b> <button class="link" type="button" id="switchPlayer">Switch</button></p>` : ""}`;
  // A player with no grade yet is asked once, first (the kid picks: an older grade opens more strata).
  if (st.grade == null) {
    show(`${head}<div class="grp" id="gradeAsk"><span>What grade are you in?</span>${gradesHTML()}</div>
    <div class="a2hs note" id="a2hs" data-kind="note">${installHTML("note")}</div>`, "page scene");
    drawScene();
    wireInstall();
    wireGrades(() => { if (!hasCaptain()) { G.askHero = false; G.askedFor = PID; say("p", PHRASE.pickHero, true); } menu(); });
    $("openSettings").onclick = () => settings();
    $("openBook").onclick = bookPage; // 📖 Monsters & Heroes, also on the pause screen
    $("openTrophies").onclick = () => trophyPage();
    if ($("switchPlayer")) $("switchPlayer").onclick = () => settings();
    return;
  }
  // A run the app lost (iOS reloaded it in the background): "Keep going?" picks it up (keepGoing).
  const kept = !G.running && hasCaptain() ? savedRun() : null;
  G.askKeep = !!kept;
  const keepNote = kept ? `${esc(WINGS.find((x) => x.id === kept.s.wing).name)} · ${kept.s.depth > 1 ? `Depth ${kept.s.depth} · ` : ""}${kept.floors[kept.s.floor + (kept.s.stage === "floor" ? 1 : 0)].boss ? "Boss floor" : `Floor ${kept.s.floor + (kept.s.stage === "floor" ? 2 : 1)} / ${kept.floors.length}`}` : "";
  show(`${head.replace('<div class="scene-gap" aria-hidden="true"></div>', '<div class="scene-gap"><button type="button" class="stall-tap" id="stallTap" tabindex="-1" aria-label="Trollar\'s shop" hidden></button></div>')}
  ${captainHTML()}
  ${lootRowHTML()}
  <div class="grp"><span>Pick a stratum</span><div class="wings strata"><div class="surface" aria-hidden="true"></div>${wingsHTML()}</div></div>
  <div class="menu-foot"><div class="a2hs" id="a2hs" data-kind="link">${installHTML("link")}</div><p class="pause-ver menu-ver" aria-label="Version ${esc(BUILD)}">v ${esc(BUILD)}</p></div>
  <div class="btns${kept ? " keep" : ""}"><p class="warn" id="warn" role="status"></p><button class="big${kept ? " alt" : ""}" id="go">Enter the dungeon</button>${kept ? `<button class="big" id="keepGoing">Keep going?<small>${keepNote}</small></button>` : ""}</div>`, "page scene");
  if (kept) $("keepGoing").onclick = () => keepGoing(kept);
  drawScene();
  const card = $("card");
  // A different Wing is a fresh dungeon: its own facts and hearts.
  card.querySelectorAll("input[name=wing]").forEach((i) => i.onchange = () => {
    st.band = wingOf(i.value).band; saveSettings();
    G.running = false; newRun(); loadMonster(0, true);
    // Redrawing the start screen would scroll it back to the top: keep it where the tap was.
    const ov = $("ov"), top = ov.scrollTop, inner = card.scrollTop;
    menu();
    ov.scrollTop = top; card.scrollTop = inner;
  });
  wireCaptain();
  wireInstall();
  $("openSettings").onclick = () => settings();
  $("openBook").onclick = bookPage; // 📖 Monsters & Heroes, also on the pause screen
  $("openTrophies").onclick = () => trophyPage(); // 🏆 achievements
  if ($("switchPlayer")) $("switchPlayer").onclick = () => settings();
  if ($("openPurse")) $("openPurse").onclick = () => purseCard(false);
  $("openItems").onclick = () => itemsCard(false);
  $("stallTap").onclick = () => { G.shopping = null; shopCard(); };
  if ($("openShop")) $("openShop").onclick = $("stallTap").onclick;
  $("go").onclick = () => {
    if (!hasCaptain()) { $("warn").textContent = freePick(team, fresh()) ? "Pick your hero first." : "Pick who leads first."; $("captain").scrollIntoView({ block: "center", behavior: "smooth" }); say("p", PHRASE.heroFirst, true); return; }
    descend(null, "enter");
  };
}
/* ---------- Add to Home Screen (install.js) ----------
   A quiet suggestion on the start screen, for a grown-up, only where it can be done and isn't yet:
   Chrome and the like fire beforeinstallprompt (kept, and prompt() on the tap); Safari on an
   iPhone or iPad has no install API, so the tap opens the steps. On iPhone and iPad the Home
   Screen app keeps its own progress, apart from Safari's, so the grade question (a new player's
   first screen) says to add it first. Never spoken, never in a fight. "Not now" is the device's
   (store.device "homeHint"), not a player's. */
let installEvt = null;
addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; installRefresh(); });
addEventListener("appinstalled", () => { installEvt = null; installRefresh(); });
function installEnv() {
  const mode = (q) => !!(window.matchMedia && matchMedia(q).matches);
  return { ua: navigator.userAgent, platform: navigator.platform, touch: navigator.maxTouchPoints || 0,
    standalone: mode("(display-mode: standalone)") || mode("(display-mode: fullscreen)") || navigator.standalone === true, prompt: installEvt };
}
const installNow = () => { const w = installWay(installEnv()); return w === "ios" || w === "prompt" ? w : null; };
// kind "link": the start screen's line (with Not now); "note": the grade question's note.
function installHTML(kind) {
  const way = installNow();
  if (!way || store.device.get("homeHint", null) === "later") return "";
  const go = `<button class="link a2hs-go" type="button" data-a2hs><span aria-hidden="true">📲 </span>Add Sumgeon to your Home Screen</button>`;
  if (kind === "link") return `${go}<button class="link a2hs-later" type="button" id="a2hsLater">Not now</button>`;
  const why = way === "ios" ? "On iPhone and iPad, the Home Screen app keeps its own progress, apart from Safari's." : "It opens like an app, and plays offline.";
  return `<p><b>Grown-ups:</b> add Sumgeon to your Home Screen first, and play it from there. ${why}</p>${go}`;
}
function wireInstall() {
  const box = $("a2hs");
  if (!box) return;
  box.querySelectorAll("[data-a2hs]").forEach((b) => b.onclick = installTap);
  if ($("a2hsLater")) $("a2hsLater").onclick = () => { store.device.set("homeHint", "later"); installRefresh(); };
}
// The event can come (or the app be installed) while the start screen is up: redraw just the box.
function installRefresh() {
  const box = $("a2hs");
  if (!box || !G.onMenu) return;
  box.innerHTML = installHTML(box.dataset.kind);
  wireInstall();
}
function installTap() {
  const way = installNow();
  if (way === "prompt") {
    const e = installEvt;
    installEvt = null; // a kept event prompts once
    e.prompt();
    Promise.resolve(e.userChoice).catch(() => {}).then(installRefresh);
    installRefresh();
  } else if (way === "ios") installCard();
}
// The iPhone and iPad steps, with Safari's icons drawn: a float card over the start scene.
function installCard() {
  G.onMenu = false;
  const env = installEnv(), ipad = isIPad(env);
  const steps = iosSteps({ ipad, version: safariVersion(env.ua) }).map((s) =>
    `<li><span class="a2hs-ico">${s.icon ? INSTALL_ICONS[s.icon] : ""}</span><span>${s.html}</span></li>`).join("");
  show(`<div class="cardhead"><h2>Add to Home Screen</h2></div>
  <p class="a2hs-why">Sumgeon then opens like an app, and plays offline. On ${ipad ? "iPad" : "iPhone"}, the Home Screen app keeps its own progress, apart from Safari's.</p>
  <ol class="a2hs-steps">${steps}</ol>
  ${fresh() ? "" : `<p class="a2hs-fine">Played here already? To bring this player along, open ⚙ Settings → Players → <b>Play on another device too</b>.</p>`}
  <div class="btns"><button class="big" id="a2hsBack">Back</button></div>`, "float a2hs-card");
  $("a2hsBack").onclick = menu;
}

// The start scene (DESIGN.md §8.3): while the start screen is up, the fight is hidden and the
// surface (descent.js surfaceHTML) shows behind the card: the night sky, the hill with the
// Sumgeon's door, your captain by it in your chalk color and the rest of your team around them
// (with nobody picked, just the door). The card's scene-gap is its window: the horizon sits
// just above where the card's sheet starts (--sheet), so the team stands on a strip of grass.
// Settings, the book and help opened from here keep it behind them. Entering, the descent starts
// from this same surface (sceneNow), and start() takes it away.
let sceneHz = null;
function sceneHeroes() {
  // A hero whose favorite plushie the player owns has it at their feet (plushie.js FAVORITE).
  const art = (d, role, o) => { const p = favoriteOf(d), h = { svg: heroSvg(HEROES[d], Object.assign({ wear: dressOf(d) }, o)), role };
    if (p && hasPlush(wardrobe, p.id)) Object.assign(h, { plush: plushArt(p.id), plushId: p.id });
    return h; };
  const rest = team.rescued.filter((d) => d !== team.captain).sort((a, b) => a - b).map((d) => art(d, "team"));
  if (hasCaptain()) return [art(team.captain, "cap", { color: team.color }), ...rest];
  return rest; // with nobody picked, just the door
}
function drawScene() {
  const sc = $("scene"), card = $("card"), gap = card.querySelector(".scene-gap");
  document.body.classList.add("on-scene"); sc.hidden = false;
  const H = sc.clientHeight || innerHeight, W = sc.clientWidth || innerWidth;
  if (gap) {
    let next = gap.nextElementSibling;
    while (next && !next.offsetParent) next = next.nextElementSibling; // the tagline is hidden on short phones
    const sheet = (next ? next.offsetTop : gap.offsetTop + gap.offsetHeight) - 14;
    card.style.setProperty("--sheet", sheet + "px");
    sceneHz = card.getBoundingClientRect().top + $("ov").scrollTop + sheet - 16;
  }
  sc.innerHTML = surfaceHTML({ W, H, hz: sceneHz || H * 0.4, heroes: sceneHeroes(), stall: shopOK() ? STALL : "", plush: plushArt("pluffy") });
  // Trollar's stall opens the shop: the scene is under the card, so a see-through button in the
  // card's window (the scene-gap) sits over it. Only on the start screen proper (#stallTap is
  // there), never mid-run.
  overScene($("stallTap"), gap, sc.querySelector(".d-stall"));
  // Each plushie squeaks when tapped (squeezePlush): a tap target over each, the same way. Only on
  // the start screen proper (the stall's target is there too).
  if (gap) gap.querySelectorAll(".plush-tap").forEach((b) => b.remove());
  if (gap && $("stallTap")) sc.querySelectorAll(".d-plush").forEach((toy) => {
    const b = document.createElement("button");
    Object.assign(b, { type: "button", className: "plush-tap", tabIndex: -1, hidden: true });
    const p = plushById[toy.dataset.plush || "pluffy"];
    b.setAttribute("aria-label", p ? p.name : "Plushie");
    b.onclick = () => squeezePlush(toy);
    gap.appendChild(b);
    overScene(b, gap, toy, 6);
  });
}
// A see-through button in the card's window, put over a part of the scene (hidden when too
// little of it shows through the window to tap). pad: extra px around it, for a small one.
function overScene(tap, gap, box, pad = 0) {
  if (!tap || !gap || !box) return;
  const g = gap.getBoundingClientRect(), s = box.getBoundingClientRect();
  const top = Math.max(0, s.top - pad - g.top), bottom = Math.min(g.height, s.bottom + pad - g.top);
  Object.assign(tap.style, { left: Math.round(s.left - pad - g.left) + "px", top: Math.round(top) + "px", width: Math.round(s.width + 2 * pad) + "px", height: Math.max(0, Math.round(bottom - top)) + "px" });
  tap.hidden = bottom - top < 24;
}
// The plushies (plushie.js) sit by their heroes on the start scene. A tap squeezes one: a squeak
// (sfx.squeak, with the sound effects), a squish and a heart popping up. No voice and nothing
// saved: toys to poke at while picking a stratum.
const PLUSH_ART = {};
const plushArt = (id) => (PLUSH_ART[id] = PLUSH_ART[id] || plushSvg(id, { label: false }));
function squeezePlush(toy) {
  sfx.squeak();
  if (!toy) return;
  toy.classList.remove("squeak"); void toy.offsetWidth; toy.classList.add("squeak");
  const heart = document.createElement("i");
  heart.className = "plush-heart";
  heart.style.setProperty("--x", Math.round(Math.random() * 40 - 20) + "px");
  heart.innerHTML = PLUSH_HEART;
  toy.appendChild(heart);
  setTimeout(() => heart.remove(), 1000);
}
const STALL = stallSvg();
const sceneOn = () => !$("scene").hidden;
const sceneNow = () => (sceneOn() ? { hz: sceneHz, heroes: sceneHeroes(), stall: shopOK() ? STALL : "", plush: plushArt("pluffy") } : null);
function hideScene() { $("scene").hidden = true; $("scene").innerHTML = ""; document.body.classList.remove("on-scene"); }
let sceneFrame = 0;
const redrawScene = () => { if (!sceneOn() || descending()) return; cancelAnimationFrame(sceneFrame); sceneFrame = requestAnimationFrame(drawScene); };
addEventListener("resize", redrawScene);
if (window.visualViewport) window.visualViewport.addEventListener("resize", redrawScene);
// Double-tapping a stratum on the start screen enters it: the first tap picks it (and redraws the
// card), a second tap on the same stratum soon after is Enter.
let lastWingTap = null;
document.addEventListener("click", (e) => {
  const w = e.target.closest && e.target.closest("label.wing");
  // A tap on the label also fires a click on its radio input right after: that's the same tap,
  // not a second one (counting it entered the old stratum on a single tap).
  if (e.target.tagName === "INPUT") return;
  if (!w || !G.onMenu || w.classList.contains("locked") || e.target.closest("button")) { lastWingTap = null; return; }
  const id = w.querySelector("input[name=wing]").value, now = performance.now();
  if (lastWingTap && lastWingTap.id === id && now - lastWingTap.t < 450) { lastWingTap = null; $("go").click(); return; }
  lastWingTap = { id, t: now };
}, true);
// "What grade are you in?" (with no grade yet), then "Pick your hero!": speech can only start in a
// tap, so it waits for the first tap on the start screen (not one on a grade or a hero, which say
// their own thing).
document.addEventListener("pointerdown", (e) => {
  if (!G.askHero || e.target.closest(".a2hs")) return; // the grown-up's Add to Home Screen says nothing
  G.askHero = false; G.askedFor = PID;
  if (!G.onMenu || $("ov").hidden || e.target.closest(".hpick, .gpick")) return;
  if (st.grade == null) say("p", PHRASE.pickGrade);
  else if (!hasCaptain()) say("p", PHRASE.pickHero);
}, true);
// "Keep going? Tap the big button!" on the first tap on a start screen offering a saved run (not a
// tap on Keep going itself, nor Enter).
document.addEventListener("pointerdown", (e) => {
  if (!G.askKeep || e.target.closest(".a2hs")) return;
  G.askKeep = false;
  if (!G.onMenu || $("ov").hidden || !$("keepGoing") || e.target.closest("#keepGoing, #go")) return;
  say("p", PHRASE.keepGoing);
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
    ...(paused ? [] : [{ id: "progress", icon: "📈", label: "Progress" }]),
    { id: "about", icon: "ℹ️", label: "About" },
  ];
  const on = tabs.some((t) => t.id === tab) ? tab : tabs[0].id;
  const panel = (id, html) => `<div class="tabpanel" role="tabpanel" id="tp-${id}" aria-labelledby="tab-${id}" tabindex="0"${id === on ? "" : " hidden"}>${html}</div>`;
  show(`<div class="cardhead"><h2>Settings</h2></div>
  <div class="tabs" role="tablist" aria-label="Settings">${tabs.map((t) => `<button type="button" role="tab" id="tab-${t.id}" aria-controls="tp-${t.id}" aria-selected="${t.id === on}" tabindex="${t.id === on ? 0 : -1}"><span aria-hidden="true">${t.icon}</span>${t.label}</button>`).join("")}</div>
  ${paused ? "" : panel("players", `<div class="grp" id="playersGrp"><span>Players</span><div id="players">${playersHTML()}</div></div>
  <div class="grp"><span>Other devices</span><div class="link-box" id="linkBox"></div></div>`)}
  ${panel("game", `<div class="grp"><span>Chalk color</span><div class="swatches" id="swatches">${swatchesHTML()}</div></div>
  <div class="grp"><span>Sounds</span><div class="list">
    ${toggle("sfxOn", "Sound effects", "", st.sfx)}
    ${toggle("voiceOn", "Voice", "Reads monsters and answers aloud", st.voice)}
    ${MUSIC_ON ? toggle("musicOn", "Music", "Quiet sounds of each stratum in a fight", st.music !== false) : ""}
  </div></div>
  <div class="grp"><span>Sound check</span><div class="soundcheck"><pre id="soundState"></pre><button class="small" type="button" id="soundTest">🔊 Test sound</button></div></div>`)}
  ${paused ? "" : panel("progress", progressHTML())}
  ${panel("about", aboutHTML())}
  <div class="btns"><button class="big" id="done">Done</button></div>`);
  wireTabs();
  $("openHelp").onclick = () => { helpFrom = !!paused; helpPage(); };
  $("sfxOn").onchange = () => { st.sfx = $("sfxOn").checked; sfx.setSfx(st.sfx); saveSettings(); };
  $("voiceOn").onchange = () => { st.voice = $("voiceOn").checked; setVoice(st.voice); saveSettings(); };
  if ($("musicOn")) $("musicOn").onchange = () => { st.music = $("musicOn").checked; saveSettings(); musicNow(0); };
  // Sound check (Game tab): what the sound effects' audio reports, as ?audio shows, for the Home
  // Screen app, which has no address bar. Test plays the floor-cleared fanfare.
  // The voice's sprites: how many of those this stratum needs are in, the bytes held, and the lines
  // decoded (speech.js spriteStatus).
  const soundState = () => {
    const a = sfx.status(), v = spriteStatus(), mb = (b) => (b / 1e6).toFixed(1);
    if ($("soundState")) $("soundState").textContent = `Audio: ${a.state}\nPlayed: ${a.played}  Restarted: ${a.remade || 0}\nError: ${a.error || "none"}\nVoice sprites: ${v.loaded} of ${v.wanted} in (${v.listed} in all), ${mb(v.bytes)} MB\nDecoded: ${v.decodedLines} lines, ${mb(v.decodedBytes)} MB\n${musicLine()}\n${offlineLine(offlineStatus())}${storageNote}`;
  };
  // How much the device holds for the game (offline play), when the browser says.
  let storageNote = "";
  try {
    navigator.storage.estimate().then((e) => { storageNote = `\nStorage: ${(e.usage / 1e6).toFixed(0)} MB used`; }).catch(() => {});
    navigator.storage.persisted().then((p) => { storageNote += p ? ", kept for good" : ""; }).catch(() => {});
  } catch (e) { /* not offered */ }
  soundState(); const soundTimer = setInterval(() => { if (!$("soundState")) clearInterval(soundTimer); else soundState(); }, 800);
  $("soundTest").onclick = () => { sfx.restart(sfx.victory); setTimeout(soundState, 300); };
  wireSwatches();
  if (!paused) { wirePlayers(); wireProgress(); showLink(null); }
  $("done").onclick = () => { if (linkView) showLink(null); (paused ? pause : menu)(); };
}
// Tabs (the WAI-ARIA tabs pattern): a tap, or ←/→/Home/End on the tab row, picks a tab and shows
// its panel.
function wireTabs() {
  const tabs = [...$("card").querySelectorAll("[role=tab]")];
  const pick = (t) => { if (t.id !== "tab-players" && linkView === "recv") showLink(null); pickTab(t); };
  const pickTab = (t) => tabs.forEach((x) => {
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
      <li><b>Fonts:</b> ${a("https://fonts.google.com/specimen/Bungee", "Bungee")} and ${a("https://fonts.google.com/specimen/Nunito", "Nunito")} (SIL Open Font License 1.1: ${a("fonts/Bungee-OFL.txt", "Bungee's")}, ${a("fonts/Nunito-OFL.txt", "Nunito's")}), from Google Fonts, served with the game so it plays offline.</li>
      <li><b>Voice:</b> recorded with ${a("https://huggingface.co/hexgrad/Kokoro-82M", "Kokoro-82M")} (Apache License 2.0).</li>
      <li><b>Linking devices:</b> ${a("https://github.com/soldair/node-qrcode", "qrcode")} and ${a("https://github.com/tcort/dijkstrajs", "dijkstrajs")} (MIT: ${a("vendor/qrcode-LICENSE.txt", "license")}, ${a("vendor/dijkstrajs-LICENSE.txt", "license")}) draw the link code; ${a("https://github.com/cozmo/jsQR", "jsQR")} (Apache License 2.0: ${a("vendor/jsqr-LICENSE.txt", "license")}) reads it with the camera.</li>
      <li><b>Coins:</b> the portraits are traced from public-domain photos of US Mint coins on Wikimedia Commons. The coin backs are drawn for the game.</li>
      <li><b>Dollar bills:</b> drawn for the game, with the coins' traced portraits of Washington and Lincoln, and Hamilton and Jackson traced from the Bureau of Engraving and Printing's public-domain engraved portraits on Wikimedia Commons.</li>
    </ul>
  </div></div>
  ${badgesCopy()}`;
}

/* ---------- Settings → Progress (DESIGN.md §9, js/progress.js) ----------
   For a grown-up, about the player playing: where they are on each open stratum's path, what needs
   work, and maps of their facts. Read-only: nothing here changes anything, so it needs no lock.
   Tap a fact (a grid cell or a chip) for its details. Left out of Settings from the pause screen. */
const pct = (x) => Math.round(x * 100) + "%";
// A small bar: learned (box 3+), with mastered (box 4) as its brighter start.
const pgBar = (learnedShare, masteredShare = 0) => `<span class="pg-bar" aria-hidden="true"><i style="width:${(learnedShare * 100).toFixed(1)}%"></i><b style="width:${(masteredShare * 100).toFixed(1)}%"></b></span>`;
// A fact's look: its state's class (and box while learning), ★ when mastered, a dot when fluent.
const factCls = (s) => `s-${s.state}${s.state === "learning" ? " b" + s.box : ""}${s.fluent ? " f" : ""}`;
const factWords = (s) => STATE_WORDS[s.state] + (s.fluent ? ", fluent" : "");
const starIn = (s) => (s.state === "mastered" ? '<span aria-hidden="true">★</span>' : "");
function factChip(key, extra = "") {
  const s = factState(recs[key], key), label = factLabel(key);
  return `<button type="button" class="pg-chip ${factCls(s)}" data-key="${esc(key)}" aria-label="${esc(label)}: ${factWords(s)}${extra ? ", " + esc(extra) : ""}">${starIn(s)}${esc(label)}${extra ? `<small aria-hidden="true">${esc(extra)}</small>` : ""}</button>`;
}
function progressHTML() {
  const openIds = openWings(progress, recs, st.start), cur = wing(), strata = strataOrder(openIds, cur.id);
  // Where they are: each open stratum's path, the one being played first and open.
  const paths = strata.map((w) => {
    const s = stratumSummary(w, progress, recs, openIds), rows = stepRows(w, progress, recs, chapterNow(w));
    const next = !s.next ? "" : s.next.open ? `<li>Next stratum, ${esc(s.next.name)}: open</li>`
      : `<li>Next stratum: ${pct(s.next.share)} of ${pct(s.next.need)} learned${s.next.boss ? ", boss beaten ✓" : ", and beat the boss"}</li>`;
    const legend = { beaten: "Legend: beaten ✓", open: "Legend: open (it waits at the end of the next run)", locked: `Legend: opens when the ★ steps are mastered (${pct(s.legend.share)} now)` }[s.legend.state];
    let lastCh = 0;
    const steps = rows.map((r) => {
      const head = r.chapter !== lastCh ? `<li class="pg-ch">Chapter ${r.chapter}${r.chapter > s.chapter ? " (not open yet)" : ""}</li>` : "";
      lastCh = r.chapter;
      const tags = [r.priority ? '<span class="pg-star" title="Priority standard"><span aria-hidden="true">★</span><span class="sr">priority</span></span>' : "", r.ongoing ? '<span class="pg-tag">ongoing</span>' : "", r.review ? '<span class="pg-tag">review</span>' : ""].join("");
      const state = { learned: "Learned ✓", now: r.seen ? "In progress" : "Up now", later: "Not started" }[r.state];
      return `${head}<li class="pg-step st-${r.state}"><div class="pg-step-top"><b>${esc(r.name)}</b>${tags}<span class="pg-state">${state}</span></div>
        ${pgBar(r.share, r.total ? r.mastered / r.total : 0)}<small>${r.learned} of ${r.total} learned${r.mastered ? ` · ${r.mastered} mastered` : ""}${r.seen && r.state !== "learned" ? ` · ${r.seen} seen` : ""}</small></li>`;
    }).join("");
    const all = rows.filter((r) => !r.review), share = all.reduce((t, r) => t + r.learned, 0) / Math.max(1, all.reduce((t, r) => t + r.total, 0));
    return `<details class="pg-stratum"${w.id === cur.id ? " open" : ""}><summary><b>${esc(w.name)}</b>${w.id === cur.id ? '<span class="pg-tag">playing</span>' : ""}<span class="pg-sum">${pct(share)} learned</span></summary>
      <ul class="pg-facts"><li>Chapter ${s.chapter} of ${s.chapters} · next mega boss at depth ${s.nextMega} (deepest so far: ${s.deepest})</li>${next}<li>${legend}</li></ul>
      <ol class="pg-steps">${steps}</ol></details>`;
  }).join("");
  // Needs work: the most missed and the slow ones.
  const nw = needsWork(recs);
  const missed = nw.missed.length ? nw.missed.map((m) => factChip(m.key, `missed ${m.misses} of ${recs[m.key].n}`)).join("") : '<p class="pg-none">Nothing missed yet.</p>';
  const slow = nw.slow.length ? nw.slow.map((m) => factChip(m.key, secs(m.ms))).join("") : '<p class="pg-none">None: everything learned comes quickly.</p>';
  // Fact maps: the grids for the facts their strata ask (or they've seen), open when the stratum
  // being played asks them; then every other kind as a list.
  const curKeys = new Set(stepRows(cur, progress, recs, chapterNow(cur)).flatMap((r) => r.keys));
  const grids = gridsFor(openIds, recs).map((id) => {
    const g = gridOf(id, recs), openNow = g.rows.some((r) => r.cells.some((c) => c && curKeys.has(c.key)));
    const head = `<tr><th scope="col" class="pg-corner"><span aria-hidden="true">${g.corner}</span><span class="sr">${g.rowHead || "row"} by ${g.colHead || "column"}</span></th>${g.cols.map((c) => `<th scope="col">${c}</th>`).join("")}</tr>`;
    const body = g.rows.map((r) => `<tr><th scope="row">${r.row}</th>${r.cells.map((c) => c
      ? `<td><button type="button" class="pc ${factCls(c)}" data-key="${esc(c.key)}" data-text="${esc(c.text)}" aria-label="${esc(c.label)}" tabindex="-1">${starIn(c)}</button></td>`
      : '<td class="pc-none"></td>').join("")}</tr>`).join("");
    const axes = g.rowHead ? `<p class="pg-axes">Rows: ${g.rowHead}. Columns: the ${g.colHead}.</p>` : "";
    return `<details class="pg-map"${openNow ? " open" : ""}><summary><b>${g.name}</b><span class="pg-sum">${g.learned} of ${g.total} learned</span></summary>${axes}
      <div class="pg-scroll"><table class="pg-grid" data-grid="${id}" style="--n:${g.cols.length + 1}"><caption class="sr">${g.name} facts${g.rowHead ? `, by ${g.rowHead} and ${g.colHead}` : ""}</caption><colgroup><col class="pg-hcol"><col span="${g.cols.length}"></colgroup><thead>${head}</thead><tbody>${body}</tbody></table></div></details>`;
  }).join("");
  const kinds = kindsFor(openIds, recs).map((k) => `<li><button type="button" class="pg-kind" aria-expanded="false" aria-controls="pk-${k.id}" data-kind="${k.id}">
      <span><b>${esc(k.name)}</b><small>${k.learned} of ${k.total} learned${k.mastered ? ` · ${k.mastered} mastered` : ""}</small>${pgBar(k.learned / k.total, k.mastered / k.total)}</span><i aria-hidden="true">›</i></button>
      <div class="pg-chips" id="pk-${k.id}" hidden></div></li>`).join("");
  const legendRow = `<ul class="pg-legend" aria-label="What the colors mean">
      <li><span class="pc s-new" aria-hidden="true"></span>Not seen</li>
      <li><span class="pc s-learning b0" aria-hidden="true"></span><span class="pc s-learning b1" aria-hidden="true"></span><span class="pc s-learning b2" aria-hidden="true"></span>Learning (striped, box 0–2)</li>
      <li><span class="pc s-learned" aria-hidden="true"></span>Learned</li>
      <li><span class="pc s-mastered" aria-hidden="true">★</span>Mastered</li>
      <li><span class="pc s-learned f" aria-hidden="true"></span>Fluent (dot)</li></ul>`;
  return `<p class="pg-intro">How <b>${esc(displayName(store.profiles(), PID))}</b> is doing. Tap any fact for its details.</p>
  <div class="grp"><span>Where they are</span>${paths}</div>
  <div class="grp"><span>Needs work</span>
    <div class="pg-need"><h3>Missed most</h3><div class="pg-chips">${missed}</div></div>
    <div class="pg-need"><h3>Learned, but slow</h3><div class="pg-chips">${slow}</div></div></div>
  <div class="grp"><span>Fact maps</span>${legendRow}${grids}<ul class="pg-kinds">${kinds}</ul></div>
  <div class="pg-pop" id="pgPop" role="dialog" aria-labelledby="pgPopT" hidden></div>`;
}
// Taps on the Progress tab: a fact opens its details; a kind opens its facts; arrow keys move
// around a grid (one cell of each grid is in the tab order).
function wireProgress() {
  const tp = $("tp-progress");
  if (!tp) return;
  tp.querySelectorAll(".pg-grid").forEach((t) => { const b = t.querySelector("button.pc"); if (b) b.tabIndex = 0; });
  let opener = null;
  const closePop = () => { $("pgPop").hidden = true; if (opener && opener.isConnected) opener.focus({ preventScroll: true }); opener = null; };
  const openPop = (btn) => {
    const key = btn.dataset.key, d = factDetail(key, recs[key], Date.now());
    opener = btn;
    const box = d.box == null ? "not seen yet" : `box ${d.box} of 4, ${STATE_WORDS[d.state]}`;
    const shown = btn.dataset.text && btn.dataset.text + " = " !== d.text.slice(0, btn.dataset.text.length + 3) ? `<p class="pg-also">Shown as ${esc(btn.dataset.text)}: turnarounds share one record.</p>` : "";
    $("pgPop").innerHTML = `<button type="button" class="pg-x" id="pgClose" aria-label="Close">×</button>
      <h3 id="pgPopT">${esc(d.text)}</h3>${shown}
      <dl><dt>State</dt><dd><span class="pc ${factCls(d)}" aria-hidden="true">${starIn(d)}</span>${box}${d.fluent ? ", fluent" : ""}</dd>
      <dt>Seen</dt><dd>${d.seen} ${d.seen === 1 ? "time" : "times"}</dd>
      <dt>Right</dt><dd>${d.right} of ${d.seen}</dd>
      <dt>Average time</dt><dd>${d.avg ? `${d.avg} (fluent: under ${d.fluentIn})` : "none yet"}</dd>
      <dt>Last practised</dt><dd>${d.last || "never"}${d.placed ? " (known from skipping ahead)" : ""}</dd></dl>`;
    $("pgPop").hidden = false;
    $("pgClose").onclick = closePop;
    $("pgClose").focus({ preventScroll: true });
  };
  tp.onclick = (e) => {
    const f = e.target.closest("[data-key]");
    if (f && !f.closest("#pgPop")) { openPop(f); return; }
    const k = e.target.closest(".pg-kind");
    if (!k) return;
    const list = $(k.getAttribute("aria-controls")), open = k.getAttribute("aria-expanded") !== "true";
    if (open && !list.innerHTML) list.innerHTML = kindsFor(openWings(progress, recs, st.start), recs).find((x) => x.id === k.dataset.kind).keys.map((key) => factChip(key)).join("");
    k.setAttribute("aria-expanded", open); list.hidden = !open;
  };
  tp.onkeydown = (e) => {
    if (e.key === "Escape" && !$("pgPop").hidden) { e.stopPropagation(); closePop(); return; }
    const b = e.target.closest(".pg-grid button.pc"), step = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }[e.key];
    if (!b || !step) return;
    e.preventDefault();
    const td = b.parentElement, tr = td.parentElement, rows = [...tr.parentElement.children], row = rows.indexOf(tr), col = [...tr.children].indexOf(td);
    // The next cell that way that's a fact.
    for (let r = row + step[0], c = col + step[1]; r >= 0 && r < rows.length && c >= 1 && c < tr.children.length; r += step[0], c += step[1]) {
      const n = rows[r].children[c].querySelector("button.pc");
      if (n) { b.tabIndex = -1; n.tabIndex = 0; n.focus(); return; }
    }
  };
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
/* ---------- achievements (achievements.js, DESIGN.md §14) ----------
   Earned quietly (checkAchievements), shown before the next descent: Enter the dungeon and Go
   deeper first play each unseen achievement's card, one at a time, then the descent starts. The
   stratum ones get the big card (the stratum's wall, a fanfare, the boss and the captain wearing
   the reward). The 🏆 sheet, by 📖 and ⚙ on the start screen, lists them all.
   ?achievements=all (or ?achieve=<id>,<id>) plays those cards before the next descent and shows
   them earned on the sheet, without saving or paying anything, for testing. */
const ACH_TEST = (() => {
  const q = new URLSearchParams(location.search);
  if (q.get("achievements") === "all") return ACHIEVEMENT_IDS.slice();
  const ids = q.getAll("achieve").flatMap((v) => v.split(",")).filter((id) => achievementOf(id));
  return ids.length ? ids : null;
})();
let achTestLeft = ACH_TEST ? ACH_TEST.slice() : [];
const earnedAt = (id) => ach.earned[id] || (ACH_TEST && ACH_TEST.includes(id) ? Date.now() : 0);
const isNewAch = (id) => !!earnedAt(id) && !ach.seen.includes(id);
// The cards to play before this descent: the test aid's once, else the unseen ones.
function achievementQueue() { return achTestLeft.length ? achTestLeft.splice(0) : unseenAchievements(ach); }
function markSeen(id) { if (ach.earned[id] && !ach.seen.includes(id)) { ach.seen.push(id); saveAch(); } }
function trophyButton() {
  const fresh = ACHIEVEMENT_IDS.filter(isNewAch).length;
  return `<button class="icon-btn trophy-btn" id="openTrophies" type="button" aria-label="Achievements${fresh ? `, ${fresh} new` : ""}">🏆${fresh ? '<i class="new-dot" aria-hidden="true"></i>' : ""}</button>`;
}
const STRATUM_BOSS = (id) => MON.find((m) => m.n === wingOf(id).boss);
const ITEM_WORD = { pie: "Pie", shield: "Shield", totem: "Times Two Totem", magnet: "Hero Magnet" };
// What a reward is, in words for the card: "Champion badge · 50¢".
function rewardWords(r) {
  const out = [];
  if (r.piece) out.push(clothesById[r.piece].name);
  const items = Object.entries(r.items);
  if (items.length === ITEMS.length && items.every(([, n]) => n === items[0][1])) out.push(`${items[0][1]} of every item`);
  else for (const [k, n] of items) out.push((n > 1 ? n + " × " : "") + ITEM_WORD[k]);
  if (r.cents) out.push(r.cents + "¢");
  return out.join(" · ");
}
// A reward drawn: the captain wearing the piece (or the piece alone), standing with the card's
// figures (rewardPiece); then the items and the coins, in a row of their own (rewardArt).
function rewardPiece(r) {
  if (!r.piece) return "";
  return hasCaptain()
    ? `<div class="ach-cap">${heroSvg(HEROES[team.captain], { color: team.color, wear: Object.assign({}, dressOf(team.captain), { [clothesById[r.piece].spot]: r.piece }) })}</div>`
    : `<div class="ach-cap">${pieceSvg(r.piece)}</div>`;
}
function rewardArt(r) {
  const items = Object.entries(r.items).flatMap(([k, n]) => Array.from({ length: Math.min(n, 2) }, () => `<span class="ico" aria-hidden="true">${itemIcon(k)}</span>`)).join("");
  const f = r.cents ? fewest(r.cents) : null;
  return (items ? `<div class="ach-items">${items}</div>` : "") + (f ? `<div class="ach-coins">${coinsSvg({ q: f.q, d: f.d, n: f.n, p: f.p })}</div>` : "");
}
// The stratum ones and the grand ones get the big card; the rest (mastery, the tracks, the
// surprises) the small one.
const AHEAD = ["champion", "legend", "grand"];
const isBig = (a) => AHEAD.includes(a.kind);
// The wall behind a card, on screen and in the share picture: its stratum's; none for the grand
// ones (purple to slate); otherwise the stratum being played.
const cardWall = (a) => a.wing || (a.kind === "grand" ? null : wing().id);
// Who's involved, as the game's SVG art, for the card and the share card: a stratum's boss (mega
// for a Champion, golden for a Legend; all four for the grand ones), a surprise's hero or monster
// (Sevenstein, Trollar), or else the captain.
function figuresOf(a) {
  if (isBig(a)) {
    const form = a.kind === "legend" || a.id === "grand:legend" ? "legend" : "mega";
    return (a.wing ? [STRATUM_BOSS(a.wing)] : WINGS.map((w) => STRATUM_BOSS(w.id))).map((m) => svg(bossForm(m, form) || m));
  }
  const f = a.figure;
  if (f && f.hero != null) return [onTeam(f.hero) ? heroArt(f.hero) : heroSvg(HEROES[f.hero])];
  if (f && f.monster) { const m = MON.find((x) => x.n === f.monster); return m ? [svg(m)] : []; }
  return hasCaptain() ? [heroArt(team.captain)] : [];
}
// Share: the PNG is drawn as soon as an earned card opens (before the descent, or from the sheet), because iOS only opens
// the share sheet straight from a tap (no waiting on drawing in between). For grown-ups, so the
// button isn't said aloud.
let shareFor = null, shareBlob = null;
function prepareShare(a) {
  shareFor = a.id; shareBlob = null;
  const btn = $("achShare");
  renderCard({ icon: a.icon, title: a.title, detail: a.detail, secret: a.secret }, earnedAt(a.id) || Date.now(), figuresOf(a), cardWall(a)).then((b) => {
    if (shareFor !== a.id || !btn.isConnected) return; // moved on meanwhile
    shareBlob = b; btn.hidden = false;
  }).catch(() => {}); // no canvas: just no Share button
  btn.onclick = () => { if (shareBlob && shareFor === a.id) shareCard(shareBlob, a.title); };
}
// One achievement's card. from: { mode (the descent waiting: "enter" or "deeper"), done } or
// { sheet: true }.
function achievementCards(ids, i, from) {
  G.onMenu = false; // no update reload while the cards are up
  const id = ids[i], a = achCatalog(achState()).find((x) => x.id === id);
  if (!a) return from.sheet ? trophyPage() : from.done();
  if (!from.test) markSeen(id);
  const r = a.reward, big = isBig(a), last = i >= ids.length - 1;
  const next = from.sheet || !last || from.mode === "end" ? (from.sheet ? "Back" : "Next") : from.mode === "deeper" ? "Go deeper" : "Enter the dungeon";
  // Every card is drawn like its share picture: a wall darkened behind (its stratum's, or the one
  // being played; the grand ones purple to slate), a warm glow, a gold frame, and who's involved
  // standing on a shadow: the stratum's boss (all four for the grand ones) and the captain wearing
  // a piece won; otherwise the captain, or Sevenstein, Trollar, the hero of Every Quip. The items
  // and coins won stand in a row under them.
  const figs = figuresOf(a), wall = cardWall(a);
  // The reward shows when it's earned; looked at again from the 🏆 sheet, it's the achievement and
  // the day it was earned, as on the share picture.
  const piece = from.sheet ? "" : rewardPiece(r), prize = from.sheet ? "" : rewardArt(r);
  const stand = figs.map((f) => `<div class="${big ? "ach-boss" : "ach-cap ach-fig"}">${f}</div>`).join("") + piece;
  const stage = stand || prize ? `<div class="ach-stage${figs.length > 1 ? " four" : ""}">${stand ? `<div class="ach-figs">${stand}</div>` : ""}${prize ? `<div class="ach-prize">${prize}</div>` : ""}</div>` : "";
  const when = from.sheet && earnedAt(id) ? new Date(earnedAt(id)).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "";
  show(`<div class="ach-card${big ? " huge" : ""}${wall ? "" : " grand"}"${wall ? ` data-stratum="${wall}"` : ""}>
    <p class="ach-kicker">${a.secret ? "Secret achievement!" : "New achievement!"}</p>
    <div class="ach-icon" aria-hidden="true">${a.icon}</div>
    <h2 class="ach-title">${esc(a.title)}</h2>
    <p class="ach-detail">${esc(a.detail)}</p>
    ${stage}
    ${from.sheet ? "" : `<p class="ach-got"><span>You got</span> ${esc(rewardWords(r))}</p>`}${when ? `<p class="ach-date">${esc(when)}</p>` : ""}${!from.sheet && ids.length > 1 ? `<p class="ach-count">${i + 1} of ${ids.length}</p>` : ""}</div>
    <div class="btns"><button class="big alt ach-share" id="achShare" type="button" aria-label="Share" title="Share" hidden>${SHARE_ICON}</button><button class="big" id="achNext">${next}</button></div>`, "page ach");
  if (big) sfx.legend(); else sfx.chestOpen();
  // At a run's end, the first card's lines wait for the win or loss lines already said (no cut-off).
  cardLines(a).forEach((_, k) => say("p", achievementLine(a, k), k === 0 && !(from.mode === "end" && i === 0)));
  prepareShare(a); // every card can be shared, the moment it's earned or later from the sheet
  $("achNext").onclick = () => {
    shareFor = shareBlob = null;
    if (from.sheet) return trophyPage();
    if (!last) return achievementCards(ids, i + 1, from);
    from.done();
  };
}
// The 🏆 sheet: the stratum ones with their progress, then the secret ones (??? until earned),
// each list with the earned ones on top, newest first. From the start screen or the pause card.
// Earned ones not yet shown on a card are marked new; tapping an earned one plays its card. A
// track's next tier shows its count once started ("12 of 25"), and its name too once a tier of
// that track is earned (the track is no secret then). The tiers past a track's next one aren't
// listed, so the sheet doesn't fill with ???s.
function trophyPage() {
  G.onMenu = false; // an update waits until the start screen
  const list = achCatalog(achState());
  const date = (t) => new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  // Each track's next tier: the first not earned.
  const nextTier = {};
  for (const a of list) if (a.kind === "track" && !earnedAt(a.id) && !(a.track in nextTier)) nextTier[a.track] = a;
  const bar = (a) => `<span class="ach-bar" aria-hidden="true"><i style="width:${Math.round(a.share * 100)}%"></i></span>`;
  const row = (a) => {
    const t = earnedAt(a.id);
    if (t) return `<button type="button" class="ach-row earned${isNewAch(a.id) ? " new" : ""}${isBig(a) ? " top" : ""}" data-ach="${a.id}">
      <span class="ach-ico" aria-hidden="true">${a.icon}</span><span class="ach-txt"><b>${esc(a.title)}${isNewAch(a.id) ? ' <i class="new-pill">New!</i>' : ""}</b><small>${esc(a.detail)}</small><small class="ach-when">Earned ${date(t)}</small><small class="ach-share-hint">${SHARE_ICON} Tap to see it and share</small></span></button>`;
    // A track lists its earned tiers and its next one; the tiers past that aren't listed yet.
    if (a.kind === "track" && nextTier[a.track] !== a) return "";
    if (a.kind === "track" && a.started) {
      const known = a.tier > 0 && earnedAt(`${a.track}:${list.find((x) => x.track === a.track && x.tier === a.tier - 1).goal}`);
      if (known) return `<div class="ach-row ahead"><span class="ach-ico" aria-hidden="true">${a.icon}</span><span class="ach-txt"><b>${esc(a.title)}</b><small>${esc(a.detail)}</small>
        ${bar(a)}<small class="ach-prog">${esc(a.progress)}</small></span></div>`;
      return `<div class="ach-row secret started"><span class="ach-ico" aria-hidden="true">❓</span><span class="ach-txt"><b>???</b><small>A secret achievement, on its way</small>
        ${bar(a)}<small class="ach-prog">${a.have} of ${a.goal}</small></span></div>`;
    }
    if (a.secret) return `<div class="ach-row secret"><span class="ach-ico" aria-hidden="true">❓</span><span class="ach-txt"><b>???</b><small>A secret achievement</small></span></div>`;
    return `<div class="ach-row ahead"><span class="ach-ico" aria-hidden="true">${a.icon}</span><span class="ach-txt"><b>${esc(a.title)}</b><small>${esc(a.detail)}</small>
      ${bar(a)}<small class="ach-prog">${esc(a.progress)}</small></span></div>`;
  };
  // Each list puts the earned ones first, newest first, then the rest in their own order. The
  // secrets: the tracks first (they count up), then mastery, then the surprises.
  const earnedFirst = (as) => [...as.filter((a) => earnedAt(a.id)).sort((x, y) => earnedAt(y.id) - earnedAt(x.id)), ...as.filter((a) => !earnedAt(a.id))];
  const strata = earnedFirst(list.filter(isBig)), secret = earnedFirst(["track", "mastery", "surprise"].flatMap((k) => list.filter((a) => a.kind === k)));
  const got = list.filter((a) => earnedAt(a.id)).length;
  show(`<div class="cardhead"><h2>🏆 Achievements</h2></div>
  <p class="ach-sum">${got} of ${list.length} earned</p>
  <h3 class="book-title">The strata</h3>
  <div class="ach-list">${strata.map(row).join("")}</div>
  <h3 class="book-title">Secrets <small>${secret.filter((a) => earnedAt(a.id)).length} of ${secret.length} found</small></h3>
  <div class="ach-list">${secret.map(row).join("")}</div>
  <div class="btns"><button class="big" id="achBack">Back</button></div>`);
  $("card").querySelectorAll("[data-ach]").forEach((b) => b.onclick = () => achievementCards([b.dataset.ach], 0, { sheet: true, test: !ach.earned[b.dataset.ach] }));
  $("achBack").onclick = () => G.paused ? pause() : menu(); // mid-run, back to the pause card
}
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
    // A boss whose Legend is beaten shows golden (DESIGN.md §14.2).
    const legendary = m.boss && legendBeaten(w, progress), art = legendary ? bossForm(m, "legend") : m;
    // A met monster opens its looks big (lookView) on a tap, and a boss its forms.
    const opens = s && formsOf(m).length > 1 ? ` tabindex="0" role="button" data-looks="${esc(m.n)}" aria-label="${esc(m.n)}: see its ${m.boss ? "forms" : "looks"}"` : "";
    beasts += s
      ? `<section class="beast${gold ? " gold" : ""}${legendary ? " legendary" : ""}${opens ? " opens" : ""}"${opens}><div class="beast-art">${ring(share)}${svg(art)}</div>
          <b>${esc(m.n)}</b>${m.boss ? '<small class="boss-tag">Boss</small>' : ""}${legendary ? `<small class="legend-tag">🌟 ${esc(art.n)} beaten</small>` : ""}
          ${t ? `<span class="trait">${t.icon} ${esc(t.name)}</span><small>${esc(t.text)}</small>` : "<small>No tricks: a good first fight</small>"}
          <small>Beaten ${s.beaten || 0}× · Learned ${Math.round(share * 100)}%</small>${looksRow(m)}</section>`
      : `<section class="beast unmet"><div class="beast-art silhouette">${svg(m)}</div><b>???</b><small>Not met yet</small></section>`;
  }
  beasts += "</div>";
  const heroes = HEROES.map((h) => onTeam(h.d)
    ? `<section class="hero-card${h.d === team.captain ? " captain-card" : ""}">${heroArt(h.d)}
        <b>${esc(h.n)}</b><small>${esc(h.cls)}</small><small>${esc(h.move)}</small>${quipsHeard(h.d)}${h.d === team.captain ? '<small class="cap-tag">Your hero</small>' : ""}${favHTML(h.d)}</section>`
    : `<section class="hero-card unmet">${heroSvg(h, { cursed: true, cracks: cracksOf(h.d) })}<b>???</b><small>${cracksOf(h.d) ? `Curse cracked ${cracksOf(h.d)} of ${CURSE_HITS}` : "Still cursed"}</small>${favHTML(h.d)}</section>`).join("");
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
  for (const c of document.querySelectorAll("#card [data-looks]")) {
    const open = () => lookView(MON.find((x) => x.n === c.dataset.looks), c);
    c.onclick = open;
    c.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } };
  }
}
// A monster's looks, big, one at a time (a tap on its card in the book): a strip that swipes with
// scroll-snap (iOS Safari's own paging), dots under it, and ← and → for a mouse or keyboard (and
// the arrow keys). Each look: its art, its name and "Found", or a silhouette and "???" until it's
// met. The voice says a found look's name as it comes into view (its recorded name line). A tap on
// the art, ✕ or Escape closes it. It sits over the book's card, so the book keeps its place.
function lookView(m, from) {
  const all = formsOf(m), found = formFound, n = all.length, what = m.boss ? "forms" : "looks";
  const page = (l, i) => found(l)
    ? `<div class="lv-page" role="group" aria-roledescription="look" aria-label="${i + 1} of ${n}: ${esc(l.n)}"><button type="button" class="lv-art" aria-label="Close">${svg(l)}</button><b>${esc(l.n)}</b><small class="lv-found">Found</small></div>`
    : `<div class="lv-page" role="group" aria-roledescription="look" aria-label="${i + 1} of ${n}: not found yet"><button type="button" class="lv-art silhouette" aria-label="Close">${svg(l).replace(/aria-label="[^"]*"/, 'aria-label="A look not found yet"')}</button><b>???</b><small>Not found yet</small></div>`;
  const v = document.createElement("div");
  v.className = "lookview"; v.setAttribute("role", "dialog"); v.setAttribute("aria-modal", "true"); v.setAttribute("aria-label", `${m.n}'s ${what}`);
  v.innerHTML = `<div class="lv-box">
    <div class="lv-head"><h3>${esc(m.n)}</h3><small>${all.filter(found).length} of ${n} ${what} found</small><button type="button" class="icon-btn lv-close" aria-label="Close">✕</button></div>
    <div class="lv-strip" role="region" aria-label="${esc(m.n)}'s ${what}" tabindex="0">${all.map(page).join("")}</div>
    <div class="lv-nav"><button type="button" class="icon-btn lv-prev" aria-label="Previous look">←</button>
      <div class="lv-dots">${all.map((l, i) => `<button type="button" class="lv-dot${found(l) ? " on" : ""}" aria-label="Look ${i + 1}${found(l) ? ": " + esc(l.n) : ""}"></button>`).join("")}</div>
      <button type="button" class="icon-btn lv-next" aria-label="Next look">→</button></div></div>`;
  $("card").appendChild(v);
  const strip = v.querySelector(".lv-strip"), dots = [...v.querySelectorAll(".lv-dot")], prev = v.querySelector(".lv-prev"), next = v.querySelector(".lv-next");
  const current = () => Math.max(0, Math.min(n - 1, Math.round(strip.scrollLeft / (strip.clientWidth || 1))));
  // The look in view: its dot, the arrows, and its name said (only a found one).
  let at = -1, t = 0;
  const sayName = (m) => say("m", monsterName(m), true);
  const showing = () => {
    const i = current();
    if (i === at) return;
    at = i;
    dots.forEach((d, j) => d.setAttribute("aria-current", j === i ? "true" : "false"));
    prev.disabled = i === 0; next.disabled = i === n - 1;
    // Every look's name line is recorded (lines.js names its looks too).
    if (found(all[i])) sayName(all[i]);
  };
  const go = (i) => strip.scrollTo({ left: Math.max(0, Math.min(n - 1, i)) * strip.clientWidth, behavior: reduced() ? "auto" : "smooth" });
  // On scrollend where there is one (the swipe settled), else a moment after scrolling stops.
  strip.addEventListener("scroll", () => { clearTimeout(t); t = setTimeout(showing, 150); }, { passive: true });
  strip.addEventListener("scrollend", () => { clearTimeout(t); showing(); });
  prev.onclick = () => go(current() - 1);
  next.onclick = () => go(current() + 1);
  dots.forEach((d, i) => { d.onclick = () => go(i); });
  const keys = (e) => {
    if (!v.isConnected) return document.removeEventListener("keydown", keys, true);
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); e.stopImmediatePropagation(); go(current() + (e.key === "ArrowLeft" ? -1 : 1)); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); close(); }
  };
  const close = () => { document.removeEventListener("keydown", keys, true); v.remove(); if (from && from.isConnected) from.focus({ preventScroll: true }); };
  document.addEventListener("keydown", keys, true);
  v.querySelector(".lv-close").onclick = close;
  for (const b of v.querySelectorAll(".lv-art")) b.onclick = close;
  showing();
  v.querySelector(".lv-close").focus({ preventScroll: true });
}
// A hero's favorite plushie (plushie.js FAVORITE) on their card: found, with its name, or a
// silhouette and "???" until it's found (in a chest or Trollar's shop).
function favHTML(d) {
  const p = favoriteOf(d), got = hasPlush(wardrobe, p.id);
  return `<div class="hero-fav${got ? "" : " unfound"}"><span class="fav-art">${plushSvg(p.id, got ? { label: `${p.name}, ${HEROES[d].n}'s favorite plushie` } : { shadow: true, label: "A plushie not found yet" })}</span>`
    + `<small><span class="fav-tag">Favorite plushie</span>${got ? esc(p.name) : "???"}</small></div>`;
}
// A hero's quips heard in Hero Moments (moments.js), "Quips: 1 of 3", gold when all are.
function quipsHeard(d) {
  const q = heardOf(MS, d);
  return `<small class="quips${q.heard === q.of ? " all" : ""}">Quips: ${q.heard} of ${q.of}</small>`;
}
// What a card in the book opens: a monster's looks (monsters.js LOOKS), or a boss's forms (the
// boss, its mega form and its golden Legend form, bossForm). Each is found once it's been met
// (saved under its own name). A Legend beaten counts as found even if it was never met by name.
function formsOf(m) {
  if (m.boss) return [m, bossForm(m, "mega"), bossForm(m, "legend")].filter(Boolean);
  return LOOKS[m.n] ? [0, 1, 2, 3, 4].map((i) => lookOf(m, i)) : [];
}
const formFound = (l) => !!seen[l.n] || (l.form === "legend" && WINGS.some((w) => w.boss === l.base && legendBeaten(w, progress)));
// A monster's looks, or a boss's forms, on its card: the ones met, and silhouettes for the rest.
function looksRow(m) {
  const all = formsOf(m);
  if (all.length < 2) return "";
  const found = all.filter(formFound).length, what = m.boss ? "Forms" : "Looks";
  return `<div class="looks" aria-label="${found} of ${all.length} ${what.toLowerCase()} found">${all.map((l) => formFound(l)
    ? `<span title="${esc(l.n)}">${svg(l)}</span>` : `<span class="silhouette" title="Not met yet">${svg(l)}</span>`).join("")}</div>
    <small>${what} found: ${found} of ${all.length}</small>`;
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
      <div class="cap-row"><div class="cap-art">${heroArt(h.d)}</div>
        <div class="cap-text"><b>${esc(h.n)}</b><small>Power hits on ${h.d}s</small></div>
        <button class="small wear-btn" type="button" id="openWardrobe" aria-label="Wardrobe"><span aria-hidden="true">👕</span></button><button class="small" type="button" id="changeHero">Change</button></div></div>`;
  }
  const any = freePick(team, fresh());
  const heroes = HEROES.map((h) => {
    const can = any || onTeam(h.d), on = h.d === team.captain;
    return `<button type="button" class="hpick${on ? " on" : ""}" data-d="${h.d}" ${can ? "" : "disabled"} aria-pressed="${on}" aria-label="${can ? h.n : "Cursed, not rescued yet"}">
      ${heroSvg(h, { color: on ? team.color : null, cursed: !can, wear: can ? dressOf(h.d) : null })}<small>${can ? h.n : "???"}</small></button>`;
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
  // From a run's end card (the "Next run" line), the wardrobe's Done comes back to that card.
  if ($("openWardrobe")) $("openWardrobe").onclick = () => wardrobeCard(custom && G.endCard ? G.endCard : undefined);
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
    if (sceneOn()) drawScene(); // the new captain by the door
    if ($("warn")) $("warn").textContent = "";
    pickOpen = false; redraw();
  });
}

function wirePlayers() {
  const box = $("players");
  box.querySelectorAll(".pcard").forEach((card) => {
    const id = card.dataset.id;
    card.querySelector("[data-act=play]").onclick = () => { if (id !== PID) { editId = null; switchTo(id); } };
    card.querySelector("[data-act=edit]").onclick = () => { editId = editId === id ? null : id; refreshPlayers(); };
    const input = card.querySelector(".pform input");
    if (input) {
      input.onchange = (e) => { store.rename(id, e.target.value); whoUI(); };
      input.onkeydown = (e) => { if (e.key === "Enter") { store.rename(id, e.target.value); editId = null; refreshPlayers(); } };
    }
    const rm = card.querySelector("[data-act=remove]");
    // A second tap confirms, as in Sound Box. From this device only.
    if (rm) rm.onclick = () => {
      if (rm.dataset.sure !== "1") { rm.dataset.sure = "1"; rm.textContent = "Tap again to remove"; return; }
      store.removeProfile(id); editId = null;
      refreshPlayers();
    };
  });
  wireGrades(refreshPlayers);
  // A new card, opened to name it (optional), without switching to it.
  $("addPlayer").onclick = () => {
    const id = store.addProfile("");
    editId = id;
    refreshPlayers();
    const input = $("players").querySelector(`.pcard[data-id="${CSS.escape(id)}"] input`);
    if (input) input.focus();
  };
}
function refreshPlayers() {
  $("players").innerHTML = playersHTML(); wirePlayers(); whoUI();
  // A grade change can open strata: the Progress tab follows.
  if ($("tp-progress")) { $("tp-progress").innerHTML = progressHTML(); wireProgress(); }
}
// Another player's turn: their own settings, best run and a fresh dungeon.
function switchTo(id) {
  store.setActive(id);
  loadPlayer();
  G.running = false;
  newRun();
  loadMonster(0, true);
  menu();
}

/* ---------- linking devices and sync (DESIGN.md §15; CLAUDE.md "Linking and sync") ----------
   Settings → Players, below the player cards, as in Sound Box, one task at a time (linkView):
   Send ("Play on another device too") shows the player's link code (seal.js linkFor: the game's
   address + #link=<key>, also as a QR code, linkqr.js) after saving them to the sync service;
   Receive ("Get a player from another device") scans the code (scan.js, jsQR) or pastes the link,
   then asks "Who is this?": a player on this device (their progress here kept and added to, or
   replaced) or someone new. A linked player syncs (sync.js), lazily, since the service shares the
   Cloudflare account's free plan with Sound Box's: at launch, on coming back after 10 minutes or
   more, and at the end of a run; never during one. Busy or over a limit, it waits until tomorrow.
   Unlinked, nothing goes over the network. The status is only here, never where a kid plays. */
const ME = store.device.get("device", null) || "device";
// Local testing only: ?sync=<address> (remembered) points at `npx wrangler dev` in sync/.
let SYNC_AT = SYNC_URL;
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
  const dev = new URLSearchParams(location.search).get("sync");
  if (dev) store.device.set("devSync", dev);
  SYNC_AT = store.device.get("devSync", null) || SYNC_URL;
}
const SYNC_AGAIN_MS = 10 * 60e3;
const linkOf = (id) => { const l = store.player(id).get("link", null); return l && isKey(l.key) ? l : null; };
const net = (u, o) => fetch(u, o);
let syncing = null, lastSync = 0, linkView = null, incoming = null, stopScan = null;
const syncErr = {};
// A player's saved data, as merge.js reads it. The game saves as it goes, so storage is current
// whenever a run isn't going (and a run's own state never syncs).
function readPlayer(id) {
  const p = store.player(id), d = {};
  for (const k of SYNCED_KEYS) { const v = p.get(k, null); if (v != null) d[k] = v; }
  return d;
}
// What a sync brings, saved. Not mid-run (the next sync brings it), and not once the player is
// unlinked or linked to another key meanwhile. The player playing is reloaded when it changed.
function writePlayer(id, key, data, next) {
  if ((linkOf(id) || {}).key !== key || (id === PID && G.running)) return;
  const p = store.player(id), was = canon(readPlayer(id));
  for (const k of SYNCED_KEYS) if (data[k] !== undefined) p.set(k, data[k]);
  p.set("syncBase", next ? { version: next.version, rec: pack(next.rec) } : null);
  if (id !== PID || canon(readPlayer(id)) === was) return;
  loadPlayer();
  if (G.onMenu && !descending()) { newRun(); loadMonster(0, true); menu(); }
}
async function syncOne(id) {
  const link = linkOf(id);
  if (!link) return;
  const keys = await keysFor(link.key), saved = store.player(id).get("syncBase", null);
  const base = saved && saved.rec ? { version: saved.version, rec: unpack(saved.rec) } : null;
  await syncPlayer({ fetch: net, url: SYNC_AT, keys, me: ME, base, read: () => readPlayer(id), apply: (data, next) => writePlayer(id, link.key, data, next) });
  if (linkOf(id)) store.player(id).set("link", { ...linkOf(id), at: Date.now() });
}
// Midnight tonight: busy or over a limit, the next sync waits until then.
const tomorrow = () => { const d = new Date(); d.setHours(24, 0, 0, 0); return d.getTime(); };
// Every linked player on this device, one after another. force: Send and Receive, which a grown-up
// asked for, go even when waiting for tomorrow.
function syncAll(force) {
  if (syncing) return syncing;
  const linked = store.profiles().filter((p) => linkOf(p.id));
  if (!linked.length || G.running) return Promise.resolve();
  if (!force && Date.now() < store.device.get("syncHold", 0)) return Promise.resolve();
  lastSync = Date.now();
  syncing = (async () => {
    for (const p of linked) {
      try { await syncOne(p.id); delete syncErr[p.id]; } catch (e) {
        const hold = e && (e.busy || e.limited || e.full);
        syncErr[p.id] = hold ? "busy" : e && e.newer ? "newer" : e && e.big ? "big" : "offline";
        if (hold) store.device.set("syncHold", tomorrow());
      }
    }
  })().finally(() => { syncing = null; linkStatusUI(); });
  linkStatusUI();
  return syncing;
}
// At the end of a run, once its last saves are in.
const syncSoon = () => setTimeout(() => syncAll(), 1500);
document.addEventListener("visibilitychange", () => { if (!document.hidden && Date.now() - lastSync >= SYNC_AGAIN_MS) syncAll(); });

function ago(t) {
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : "on " + new Date(t).toLocaleDateString();
}
// The quiet status, for the player playing.
function linkStatusText() {
  const link = linkOf(PID), err = syncErr[PID];
  if (!link) return { on: false, text: "Not linked with another device yet" };
  if (syncing && !err) return { on: true, text: "Linked · syncing…" };
  if (err === "busy") return { on: false, text: "Linked · sync busy. Saved on this device, will sync later" };
  if (err === "newer") return { on: false, text: "Linked · another device has a newer Sumgeon. Saved on this device, will sync once this one updates" };
  if (err === "big") return { on: false, text: "Linked · too big to sync. Saved on this device" };
  if (err) return { on: false, text: "Linked · saved on this device, will sync when online" };
  return { on: true, text: link.at ? "Linked · synced " + ago(link.at) : "Linked · will sync soon" };
}
function linkStatusUI() {
  const el = $("linkStatus");
  if (!el) return;
  const s = linkStatusText();
  el.textContent = s.text; el.classList.toggle("on", s.on);
}
// What Send and Receive say when the service couldn't be reached or turned it away.
const SEND_TROUBLE = {
  busy: "The sync service is busy. Try again later.",
  newer: "Another device has a newer Sumgeon. Close Sumgeon and open it again to update, then try again.",
  big: "This player's progress is too big to sync. It's still saved on this device.",
  offline: "Couldn't reach the sync service. Check the connection, then try again."
};

function linkHTML() {
  const back = '<button class="link back" type="button" data-back>‹ Back</button>';
  if (linkView === "send") return `${back}
    <p class="step">Scan this on the other device</p>
    <p class="pnote" id="sendMsg" role="status">Getting the code ready…</p>
    <button class="small" type="button" id="sendRetry" hidden>Try again</button>
    <div id="sendBox" class="send-box" hidden>
      <div class="link-qr" id="sendQr" role="img" aria-label="Link code"></div>
      <p class="pnote center">On the other device: ⚙ Settings → Players → <b>Get a player from another device</b>.</p>
      <div class="row-btns"><button class="small" type="button" id="sendShare"${typeof navigator.share === "function" ? "" : " hidden"}>Share…</button><button class="small" type="button" id="sendCopy">Copy link</button></div>
      <p class="pnote center fine">Anyone with this code can change this player's progress. Show it only on your own devices.</p>
    </div>`;
  if (linkView === "recv") {
    const installed = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    return `${back}
    ${G.arrivedLink && !installed ? `<div class="arrive"><p class="pnote">This page opened with a link code. If Sumgeon is on your Home Screen, copy the link, then open Sumgeon there: ⚙ Settings → Players → Get a player → Paste link. Or link it right here, if you play in this browser.</p><button class="small" type="button" id="arriveCopy">Copy link</button></div>` : ""}
    <div id="recvScan">
      <p class="step">Scan the code on the other device</p>
      <div class="scan-box" id="scanBox" hidden>
        <div class="scan-view"><video id="scanVideo" playsinline muted aria-label="Camera"></video><div class="scan-got" role="status"><span aria-hidden="true">✓</span>Got it!</div></div>
        <p class="pnote center">Blurry? Hold it a little farther away.</p>
      </div>
      <p class="pnote" id="receiveMsg" role="status"></p>
      <div class="row-btns"><button class="small" type="button" id="scanAgain" hidden>Use the camera</button><button class="small" type="button" id="pasteBtn">Paste link instead</button></div>
    </div>
    <div id="receiveBox" hidden></div>`;
  }
  return `<p class="pnote">Linked devices share a player's progress, through a small server that keeps a sealed copy. Without the code no one can read it, the server included, and it holds no names. Each device keeps its own copy and plays offline.</p>
    <p class="link-status" id="linkStatus" role="status"></p>
    <div class="list">
      <button class="list-link" type="button" id="goSend"><span class="task-ico" aria-hidden="true">📲</span><span><b>Play on another device too</b><small>Show a code for the other device to scan.</small></span><i aria-hidden="true">›</i></button>
      <button class="list-link" type="button" id="goRecv"><span class="task-ico" aria-hidden="true">📥</span><span><b>Get a player from another device</b><small>Scan the code it shows, or paste its link.</small></span><i aria-hidden="true">›</i></button>
    </div>`;
}
// Shows a task (null: the list of tasks), with the player cards hidden while one is open.
function showLink(view) {
  if (linkView === "recv" && view !== "recv") endScan();
  linkView = view;
  if (!view) { incoming = null; G.arrivedLink = null; }
  const box = $("linkBox");
  if (!box) return;
  box.innerHTML = linkHTML();
  $("playersGrp").hidden = !!view;
  box.querySelectorAll("[data-back]").forEach((b) => { b.onclick = () => showLink(null); });
  if (!view) {
    linkStatusUI();
    $("goSend").onclick = () => { showLink("send"); prepareSend(); };
    $("goRecv").onclick = () => { showLink("recv"); startScan(); };
  }
  if (view === "send") {
    $("sendRetry").onclick = prepareSend;
    $("sendShare").onclick = () => navigator.share({ url: G.sendUrl }).catch(() => {});
    $("sendCopy").onclick = () => copyButton($("sendCopy"), G.sendUrl);
  }
  if (view === "recv") {
    $("scanAgain").onclick = startScan;
    $("pasteBtn").onclick = pasteLink;
    if ($("arriveCopy")) $("arriveCopy").onclick = () => copyButton($("arriveCopy"), linkFor(siteURL(), G.arrivedLink));
  }
  $("ov").scrollTop = 0;
}
const siteURL = () => location.origin + location.pathname;
function copyButton(btn, text) {
  const was = btn.textContent;
  Promise.resolve().then(() => navigator.clipboard.writeText(text))
    .then(() => { btn.textContent = "Copied!"; }, () => { btn.textContent = "Couldn't copy"; })
    .then(() => setTimeout(() => { btn.textContent = was; }, 2000));
}
// Send: makes the player's key the first time (that links them), saves them to the service, then
// shows the code. Until they're saved there, a code would bring nothing, so it waits.
async function prepareSend() {
  $("sendBox").hidden = true; $("sendRetry").hidden = true;
  $("sendMsg").textContent = "Getting the code ready…";
  const id = PID;
  let link = linkOf(id);
  if (!link) { link = { key: newKey() }; store.player(id).set("link", link); }
  if (syncing) await syncing;
  await syncAll(true);
  if (linkView !== "send" || !$("sendMsg")) return;
  const err = syncErr[id];
  if (err) { $("sendMsg").textContent = SEND_TROUBLE[err] || SEND_TROUBLE.offline; $("sendRetry").hidden = false; return; }
  G.sendUrl = linkFor(siteURL(), link.key);
  $("sendMsg").textContent = "";
  $("sendBox").hidden = false;
  try {
    const Q = await import("../vendor/qrcode-1.5.4.js");
    if ($("sendQr")) $("sendQr").innerHTML = linkQR(Q, G.sendUrl);
  } catch (e) { if ($("sendQr")) $("sendQr").hidden = true; }
}
// Receive: the camera starts at once; a key can also come from a pasted link, or a link this page
// was opened with. Then one question: who is this?
function endScan() {
  if (stopScan) stopScan();
  stopScan = null;
  if ($("scanBox")) { $("scanBox").hidden = true; $("scanBox").classList.remove("found"); }
}
async function startScan() {
  endScan();
  $("scanBox").hidden = false; $("scanAgain").hidden = true; $("receiveMsg").textContent = "";
  try {
    const { scan } = await import("./scan.js");
    const stop = await scan($("scanVideo"), (text, freeze) => {
      const k = keyFromLink(text);
      if (k) found(k, freeze);
      return !!k;
    });
    if (linkView !== "recv" || incoming || !$("scanBox")) stop(); // left meanwhile
    else stopScan = stop;
  } catch (e) {
    endScan();
    if (!$("scanAgain")) return;
    $("scanAgain").hidden = false;
    $("receiveMsg").textContent = "Couldn't use the camera. Paste the link instead, or allow the camera and try again.";
  }
}
// Found: the frame it was read from stays, the code outlined, with "Got it!", for a moment
// before "Who is this?", so it's plain what happened.
function found(key, freeze) {
  const box = $("scanBox"), still = freeze("#ffc93c");
  still.className = "scan-still"; still.setAttribute("aria-hidden", "true");
  box.querySelector(".scan-view").insertBefore(still, box.querySelector(".scan-got"));
  box.classList.add("found");
  stopScan = null; // the scanner turns the camera off itself
  setTimeout(() => { if (linkView === "recv" && $("receiveBox")) gotKey(key); }, 1100);
}
async function pasteLink() {
  endScan();
  let text = null;
  try { text = await navigator.clipboard.readText(); } catch (e) { text = window.prompt("Paste the link from the other device:"); }
  const k = keyFromLink(text);
  if (k) gotKey(k);
  else { $("scanAgain").hidden = false; $("receiveMsg").textContent = "No link code there. On the other device: ⚙ Settings → Players → Play on another device too → Copy link."; }
}
const hasProgress = (id) => { const d = readPlayer(id); return Object.keys(d.facts || {}).length > 0 || Object.keys(d.wings || {}).length > 0 || (d.wallet || 0) > 0; };
function gotKey(key) {
  endScan();
  const list = store.profiles();
  if (list.some((p) => (linkOf(p.id) || {}).key === key)) {
    $("receiveMsg").textContent = "That player is already on this device.";
    $("scanAgain").hidden = false;
    return;
  }
  incoming = key;
  // A player here who's linked already keeps their own link; the rest can be this one.
  const here = list.filter((p) => !linkOf(p.id));
  const pick = hasProgress(PID) || linkOf(PID) ? "new" : PID;
  const row = (value, art, name, sub) => `<label class="choice"><input type="radio" name="recvWho" value="${esc(value)}"${value === pick ? " checked" : ""}><span class="pav">${art}</span><span class="pname"><b>${name}</b><small>${sub}</small></span></label>`;
  $("recvScan").hidden = true;
  const box = $("receiveBox");
  box.hidden = false;
  box.innerHTML = `<p class="step">Who is this?</p>
    <div class="list choices">${here.map((p) => {
      const h = p.id === PID ? team : (store.player(p.id).get("heroes", null) || {});
      const art = h.captain != null ? heroSvg(HEROES[h.captain], { color: h.color || null }) : '<span class="pnone" aria-hidden="true">?</span>';
      return row(p.id, art, esc(displayName(list, p.id)), "The same player as on this device");
    }).join("")}${row("new", '<span class="pnone" aria-hidden="true">+</span>', "Someone new", "Adds them to this device")}</div>
    <div class="choices-how" id="recvHow" hidden>
      <label class="choice"><input type="radio" name="recvHow" value="merge" checked><span class="pname"><b>Keep both</b><small>Their progress and the progress here add up.</small></span></label>
      <label class="choice"><input type="radio" name="recvHow" value="replace"><span class="pname"><b>Replace</b><small>The progress here goes; theirs takes its place.</small></span></label>
    </div>
    <label class="recv-name" id="recvNameBox" hidden>Their name <input type="text" id="recvName" maxlength="24" placeholder="Optional" autocomplete="off" autocorrect="off" spellcheck="false"></label>
    <p class="pnote" id="recvMsg" role="status"></p>
    <button class="small primary wide" type="button" id="recvGo">Link</button>`;
  const show = () => {
    const who = (box.querySelector("input[name=recvWho]:checked") || {}).value;
    $("recvHow").hidden = !who || who === "new" || !hasProgress(who);
    $("recvNameBox").hidden = who !== "new";
    $("recvMsg").textContent = "";
  };
  box.querySelectorAll("input[name=recvWho]").forEach((r) => { r.onchange = show; });
  show();
  $("recvGo").onclick = () => linkIncoming();
}
async function linkIncoming() {
  const key = incoming, box = $("receiveBox");
  const who = (box.querySelector("input[name=recvWho]:checked") || {}).value;
  const how = (box.querySelector("input[name=recvHow]:checked") || {}).value || "merge";
  if (!who) { $("recvMsg").textContent = "Pick who this is."; return; }
  $("recvGo").disabled = true; $("recvMsg").textContent = "Linking…";
  let saved;
  try {
    if (syncing) await syncing;
    saved = await remoteVersion({ fetch: net, url: SYNC_AT, keys: await keysFor(key) });
  } catch (e) {
    if (!$("recvGo")) return;
    $("recvGo").disabled = false;
    $("recvMsg").textContent = e && e.busy ? SEND_TROUBLE.busy : SEND_TROUBLE.offline;
    return;
  }
  // Nothing saved for it (an old code whose copy expired; a code just shown always has the player
  // saved): linking would bring nothing, and Replace would clear this device.
  if (!saved) {
    if (!$("recvGo")) return;
    $("recvGo").disabled = false;
    $("recvMsg").textContent = "Nothing is saved for that player yet. Open Sumgeon on the other device, show the code again, then scan it.";
    return;
  }
  let target = who;
  if (who === "new") target = store.addProfile($("recvName").value);
  else if (how === "replace" || !hasProgress(who)) store.player(who).wipe(); // theirs takes its place
  else store.player(who).clear("syncBase"); // kept, and merged in at the first sync
  store.player(target).set("link", { key });
  // A first sync is a merge (sync.js adopt): the linked player's settings and hero come along,
  // and what was earned on each device adds up.
  try { await syncOne(target); delete syncErr[target]; } catch (e) { syncErr[target] = e && e.busy ? "busy" : "offline"; } // otherwise it syncs next launch
  showLink(null);
  if (target === PID) { loadPlayer(); G.running = false; newRun(); loadMonster(0, true); menu(); }
  else switchTo(target);
}
// Opened with a link code (#link=…, from the Camera app or a pasted link): out of the address bar
// at once, then Receive opens over the start screen (welcomeLink, at launch).
G.arrivedLink = keyFromLink(location.hash);
if (G.arrivedLink) history.replaceState(null, "", location.pathname + location.search);
function welcomeLink() {
  if (!G.arrivedLink) return;
  const key = G.arrivedLink;
  settings(false, "players");
  showLink("recv");
  gotKey(key);
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
// How long the room shows empty after the descent before the first monster arrives.
const AFTER_DESCENT_MS = 1300;
const FACT_AT = new URLSearchParams(location.search).get("fact");
// ?depth=N enters at that depth (the boss powering up at 3 and 4, a mega boss at 5), for testing.
const DEPTH_AT = Math.max(0, Math.floor(Number(new URLSearchParams(location.search).get("depth"))) || 0);
const FLOOR_AT = Math.max(0, Math.min(6, Number(new URLSearchParams(location.search).get("floor")) || 0)), MONSTER_AT = new URLSearchParams(location.search).get("monster");
function descend(depth, mode) {
  if (descending()) return;
  // Achievements earned since the last descent play first, one card each (DESIGN.md §14.1).
  const cards = achievementQueue();
  if (cards.length) { achievementCards(cards, 0, { mode, done: () => descend(depth, mode) }); return; }
  const d = depth || DEPTH_AT || deepest(wing(), progress), enter = mode === "enter";
  G.onMenu = false; // no update reload, no stratum double-tap, mid-descent
  stopSpeech(); openingLines(enter, d);
  const ov = $("ov");
  ov.classList.add("leaving");
  const fell = setTimeout(() => { ov.classList.remove("leaving"); hide(); }, reduced() ? 0 : 450);
  // A mega boss's depth says so as it lands (DESIGN.md §4.3), and so does the Legend (§14.2).
  playDescent({ wing: wing(), depth: d, mode, reduced: reduced(), scene: enter ? sceneNow() : null, title: enter ? PHRASE.enter : `Depth ${d}`, sub: enter ? `${wing().name} · Depth ${d}` : wing().name, mega: legendNow() ? "🌟 " + PHRASE.legendAwaits : isMega(d) ? "👑 " + PHRASE.megaAhead : "", legend: legendNow(), golden: WINGS.filter((x) => legendBeaten(x, progress)).map((x) => x.id) },
    () => { clearTimeout(fell); ov.classList.remove("leaving"); start(d, enter, true, reduced() ? 300 : AFTER_DESCENT_MS); });
}
// What's said as a run begins: "Now entering the Sumgeon!" (from the start screen), then the depth.
function openingLines(enter, d) {
  if (enter) say("p", PHRASE.enter, false, null, ENTER_FX);
  const w = wing();
  say("p", wingEnter(w), false, null, ENTER_FX); // "The Balance Hall stratum!", echoing like the entrance
  if (d > 1 && d <= DEPTH_MAX_SPOKEN) say("p", depthLine(d), false, null, ENTER_FX); // "Depth two!" echoes like the entrance
  if (legendNow()) say("p", PHRASE.legendAwaits, false, null, ENTER_FX);
  else if (isMega(d)) say("p", PHRASE.megaAhead, false, null, ENTER_FX);
}
// enter: from the start screen's "Enter the dungeon", which says so first. voiced: the descent
// already said the opening lines.
// pause (ms): after the descent, the room shows empty for a moment before the first monster
// arrives (AFTER_DESCENT_MS), so the landing and the monster don't run together.
function start(depth, enter, voiced, pause) {
  G.onMenu = false;
  const old = store.player(PID).get("run", null);
  if (old) dropRun(old); // a run left behind isn't picked up: its armed items go back in the bag
  hide(); hideScene();
  newRun(depth);
  shopRestock(); // Trollar's clothing changes after each run
  G.shopping = null;
  Object.assign(G, { hearts: band().hearts, streak: 0, solved: 0, tries: 0, running: true, retry: [], recent: [], next: false, paused: null, runStars: 0,
    fx: {}, chest: null, news: [] });
  MR = freshRun();
  musicNow();
  if (!voiced) { stopSpeech(); openingLines(enter, G.depth); }
  const go = () => {
    if (!G.running) return;
    // ?monster=Tick-Tockus puts that monster on the first floor (or the ?floor= one); ?floor=4
    // starts on that floor. For testing.
    if (MONSTER_AT) { const m = MON.find((x) => x.n === MONSTER_AT) || allLooks().find((x) => x.n === MONSTER_AT); if (m) G.floors[FLOOR_AT ? FLOOR_AT - 1 : 0] = m; }
    loadMonster(FLOOR_AT ? FLOOR_AT - 1 : 0);
    // The player's first fight: how to attack, before the first problem is read (until they answer).
    if (once("hit")) say("p", PHRASE.hitHow, false, () => !G.tries && G.running);
    newProblem();
  };
  if (!pause) return go();
  // The room shows empty: the nameplate too, which still named the start screen's monster, and
  // the run's own hearts (they showed the last run's until the monster came).
  G.busy = true; $("mon").innerHTML = ""; $("prob").innerHTML = "";
  heartsUI(); streakUI();
  $("arena").classList.add("empty");
  setTimeout(() => { $("arena").classList.remove("empty"); go(); }, pause);
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
  // A short fade to the launch color first (styles.css html.reloading), where the new page fades
  // in from, so the start screen doesn't blink off and on.
  const go = () => location.replace(u.toString());
  if (reduced() || document.hidden) return go();
  document.documentElement.classList.add("reloading");
  setTimeout(go, 160);
  setTimeout(() => document.documentElement.classList.remove("reloading"), 4000); // if the reload never comes
}
function applyUpdate() { if (updateReady && !G.running && G.onMenu) reloadForUpdate(); }
document.addEventListener("visibilitychange", () => { if (!document.hidden) checkUpdate(); });
addEventListener("focus", checkUpdate);
addEventListener("pageshow", checkUpdate);
setInterval(checkUpdate, 15 * 60e3);

/* ---------- offline play ----------
   sw.js keeps the game and its voice for offline play (CLAUDE.md "Offline"). A new version takes
   over as soon as it's installed: every file the page loads is stamped with its version, so an
   open page keeps working, and checkUpdate still reloads at the start screen as above. Locally
   ("dev") the worker is network-first for everything; the page tells it what loaded before it took
   over, so even the first visit works offline. */
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  navigator.serviceWorker.register("sw.js").catch(() => { /* no offline play: the game still works */ });
  if (BUILD === "dev") navigator.serviceWorker.ready.then((reg) => {
    const here = location.origin, urls = [location.href].concat(performance.getEntriesByType("resource").map((e) => e.name).filter((u) => u.startsWith(here)));
    if (reg.active) reg.active.postMessage({ warm: urls });
  }).catch(() => {});
}

/* ---------- no accidental zoom ----------
   Safari zooms on a pinch even with maximum-scale=1, so pinches are stopped here. Double-tap zoom
   is off through touch-action: manipulation in styles.css, which keeps fast taps (1, 1 for 11)
   working. Kids tap fast and rest a second finger on the screen. */
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("touchmove", (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

/* ---------- Chompers acts out the symbol (🐊 Big Bite; poses in chomp.js) ----------
   His mouth is the < or > symbol. A tap on < = > turns him (a quick flip, mirrored on x) so the
   mouth opens to the side the symbol opens to, or shuts it flat for =. The problem line keeps the
   plain symbol. Hit! plays the act: a right answer chomps the bigger side (it shrinks away
   toward him, then its digits fly as usual), a right = is a happy bounce, and
   a wrong one snaps at the picked side, clacks and turns the right way before the miss. "Which
   is more" (the Cellar) turns and chomps when the answer goes in. With reduced motion, only the
   end pose. Input waits (G.busy) through the act, about half a second. */
const onChompers = () => { const m = G.floors && G.floors[G.floor]; return !!m && (m.base || m.n) === "Chompers" && G.hp > 0; };
let chompSeq = 0;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// The pose for the answer typed, or null (not Chompers, or not a comparison).
function chompFor(p, input) {
  if (!onChompers()) return null;
  if (p.op === "○" && p.sym) return chompPose(input, p.sym);
  if (p.op === "more") return morePose(p.x, p.y, input);
  return null;
}
// Draws him with his mouth opening "left" or "right", or "shut" (=, keeping the way he faced),
// its jaws k open (1 open, 0 closed).
function chompDraw(mouth, k = 1) {
  const el = $("mon"), m = G.floors[G.floor], face = mouth === "shut" ? G.chompFace : mouth;
  el.innerHTML = monsterArt(Object.assign({}, m, { jaw: mouth === "shut" ? { o: 0, gap: CHOMP_SHUT.gap * k } : { o: k } }));
  el.classList.toggle("face-l", face === "left");
  G.chomp = mouth; G.chompFace = face;
  return el.querySelector("svg");
}
// Turns him to a pose: squeezed edge-on, the drawing swapped, and out again (FLIP_MS). Opening or
// shutting while facing the same way is a squash instead.
function chompTurn(mouth) {
  if (!onChompers() || !mouth || mouth === G.chomp) return Promise.resolve();
  const seq = ++chompSeq, sv = $("mon").querySelector("svg"), face = mouth === "shut" ? G.chompFace : mouth;
  if (reduced() || !sv || !sv.animate) { chompDraw(mouth); return Promise.resolve(); }
  const s0 = G.chompFace === "left" ? -1 : 1, s1 = face === "left" ? -1 : 1, mid = s0 !== s1 ? "scaleX(0)" : `scale(${s0 * 1.08}, .8)`;
  return sv.animate([{ transform: `scaleX(${s0})` }, { transform: mid }], { duration: FLIP_MS / 2, easing: "ease-in", fill: "forwards" }).finished.then(() => {
    if (seq !== chompSeq || !onChompers()) return;
    return chompDraw(mouth).animate([{ transform: mid }, { transform: `scaleX(${s1})` }], { duration: FLIP_MS / 2, easing: "ease-out" }).finished;
  }).catch(() => {});
}
// The bigger number eaten: it shrinks away toward Chompers.
function eatSide(side) {
  const el = side && $("prob").querySelector(`.side[data-side="${side[0]}"]`);
  if (!el) return Promise.resolve();
  if (reduced() || !el.animate) { el.style.visibility = "hidden"; return Promise.resolve(); }
  const a = centerOf(el), b = centerOf($("mon"));
  return el.animate([{ transform: "none", opacity: 1 }, { transform: `translate(${b.x - a.x}px, ${b.y - a.y}px) scale(0)`, opacity: 0.3 }],
    { duration: EAT_MS, easing: "ease-in", fill: "forwards" }).finished.catch(() => {});
}
// Plays the act for a pose (chomp.js chompPose). Resolves when the hit (or the miss) can go on.
async function chompAct(pose) {
  if (!pose || !onChompers()) return;
  if (reduced()) {
    if (pose.act === "chomp") { sfx.chomp(); eatSide(pose.eat); } else if (pose.act === "bounce") sfx.chomp(true); else sfx.clack();
    chompDraw(pose.right ? pose.mouth : pose.settle || G.chomp);
    return;
  }
  await chompTurn(pose.mouth); // already turned by the tap; "which is more" turns now
  const el = $("mon"), mouth = G.chomp;
  if (pose.act === "bounce") {
    sfx.chomp(true);
    await el.animate([{ transform: "none" }, { transform: "translateY(-12%) scale(1.04, .96)", offset: 0.3 }, { transform: "translateY(0) scale(1.06, .9)", offset: 0.55 },
      { transform: "translateY(-5%)", offset: 0.8 }, { transform: "none" }], { duration: 420, easing: "ease-out" }).finished.catch(() => {});
    return;
  }
  // Snap: the jaws open and shut twice, lunging at the side bitten (or in place).
  const dir = pose.bite === "left" ? -1 : pose.bite === "right" ? 1 : 0, snapMs = SNAP.length * SNAP_MS;
  el.animate([{ transform: "none" }, { transform: `translateX(${dir * 14}%) rotate(${dir * 3}deg)`, offset: 0.35 }, { transform: `translateX(${dir * 10}%)`, offset: 0.75 }, { transform: "none" }],
    { duration: snapMs + 140, easing: "ease-out" });
  const eaten = pose.eat ? eatSide(pose.eat) : Promise.resolve();
  for (let i = 0; i < SNAP.length; i++) {
    chompDraw(mouth, SNAP[i]);
    if (i === 1) { if (pose.act === "chomp") sfx.chomp(); else sfx.clack(); }
    await wait(SNAP_MS);
  }
  chompDraw(mouth, pose.right ? 1 : mouth === "shut" ? 1 : 0.6);
  if (pose.right) { await eaten; await wait(90); return; }
  // Wrong: a sad beat, then he turns the right way as the miss shows the answer.
  await wait(150);
  if (pose.settle === G.chomp) chompDraw(pose.settle); else await chompTurn(pose.settle);
}

/* ---------- input ---------- */
function press(k) {
  if (G.next && k === "go") return nextAfterMiss();
  if (G.busy) return;
  if (G.cur && (G.cur.spell || G.cur.draw)) {
    if (k === "go") return G.cur.draw ? castShape() : castSpell();
    if (k === "clear" || k === "del") { sfx.tick(); sigilReset(); }
    return; // digits wait for the number pad
  }
  if (G.cur && G.cur.slots && G.slot) return slotPress(k);
  // True or false: a tap answers at once, after a brief press on the key (no Hit!, no delete).
  if (G.cur && G.cur.op === "✓") return tfPress(k);
  if (G.fix && !G.fix.swapped && k !== "go") fixSwap();
  if (k === "go") return submit();
  const cmp = !!(G.cur && G.cur.sym), sym = "<=>".includes(k);
  if (k !== "del" && sym !== cmp) return; // digits for numbers, < = > for comparisons
  sfx.tick();
  // Ones first (onesFirst: stacked in columns, or anything on Margot-Rythm's floor): typed right to
  // left, as it's worked on paper. Each digit goes in the next column to the left; delete takes back
  // the last one typed.
  const rtl = onesFirst(G.cur);
  if (k === "del") G.input = rtl ? G.input.slice(1) : G.input.slice(0, -1);
  else if (sym) { G.input = k; chompTurn(mouthOf(k)); }
  else if (rtl) { if (G.input.length < stackWidth(G.cur)) G.input = k + G.input; }
  else if (G.input.length < 4) G.input = (G.input === "0" ? "" : G.input) + k;
  ansUI();
}
// True or false (the Equal Twins): T or F, the key pressed in for a moment while the pad takes no
// more taps, then it's answered.
const TF_PRESS_MS = 160;
function tfPress(k) {
  if (k !== "T" && k !== "F") return;
  sfx.tick();
  G.input = k; G.busy = true;
  const pad = $("pad"), key = pad.querySelector(`[data-k="${k}"]`);
  if (key) key.classList.add("pressed");
  pad.classList.add("locked");
  setTimeout(() => { pad.classList.remove("locked"); if (key) key.classList.remove("pressed"); G.busy = false; submit(); }, TF_PRESS_MS);
}
// Fix it: the wrong number lifts out and the □ takes its place.
const FIX_SWAP_MS = 1000;
function fixSwap() { G.fix.swapped = true; probUI(); ansUI(); }
// A whole time in two slots (Tick-Tockus): digits go in the slot being typed (two at most); Hit!
// ("Hour ✓") moves on to the minutes, delete in an empty slot goes back, and Hit! ("Minutes!")
// answers. The first couple of times, the voice says "Now the minutes!".
function slotPress(k) {
  const s = G.slot, cur = s.vals[s.at];
  if (k === "go") {
    if (s.at === 1) return submit();
    if (!cur) return;
    sfx.tick(); s.at = 1; ansUI();
    if (G.cur.op === "$") { if (once("cents", 2)) say("p", PHRASE.nowCents, false, asked(G.cur)); }
    else if (once("minutes", 2)) say("p", PHRASE.nowMinutes, false, asked(G.cur));
    return;
  }
  if (k !== "del" && !/^[0-9]$/.test(k)) return;
  sfx.tick();
  if (k === "del") { if (cur) s.vals[s.at] = cur.slice(0, -1); else if (s.at) s.at--; }
  else if (cur.length < 2) s.vals[s.at] = (s.at === 0 && cur === "0" ? "" : cur) + k;
  G.input = s.vals.join("");
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
// A cursed hero's arrival on the rescue floor: the quips' light echo, at normal volume.
const CURSED_FX = { gain: 1, echo: 0.1 };
// The share of problems that prefer an answer with the captain's digit until its first moment (learn.js choose).
const CAPTAIN_BIAS = 0.35;
// In the first fight (nothing beaten yet, so no Hero Moments), the share that avoid it instead,
// so the captain's first answer, and its first moment, come in the fight after.
const CAPTAIN_HOLD = 0.85;
const firstFight = () => !Object.values(seen).some((s) => s.beaten > 0);
// The lean toward the captain's digit lasts until that captain's first Hero Moment (moments.js
// saves it in captains), at any depth; a new captain gets it again.
const captainLean = () => hasCaptain() && !firstFight() && !(MS.captains || []).includes(team.captain);
// SPELL_MEMORY: how many of the last spells (across runs) aren't cast again (spellKey in learn.js).
const SPELL_MEMORY = 6;
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
// Did the drawing run off the pad (sigil.js offEdge)? sigilPoint doesn't clamp, so with pointer
// capture a stroke that slides off keeps its points outside the box.
function sigilOffEdge() { const c = $("sigil"); if (!c) return false; const r = c.getBoundingClientRect(); return offEdge(strokes, r.width, r.height); }
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
// After a poor match: the school-style digit (handwriting.js) written glowing over theirs, stroke
// by stroke, as a teacher shows it: each stroke drawn in order at an even speed, a gold pen dot at
// its tip and a breath between strokes, then held a moment. done() runs when it's finished (the
// attack waits for it). With reduced motion it's drawn whole at once.
const WRITE_SPEED = 0.16, WRITE_GAP_MS = 220, WRITE_HOLD_MS = 500; // speed: of the digit's box (100) per ms
function showHowToWrite(d, done) {
  const strokesOf = HANDWRITING[d], len = (s) => s.reduce((t, p, i) => (i ? t + Math.hypot(p[0] - s[i - 1][0], p[1] - s[i - 1][1]) : 0), 0);
  const lens = strokesOf.map(len), durs = lens.map((l) => Math.max(180, l / WRITE_SPEED));
  const total = durs.reduce((t, x) => t + x, 0) + WRITE_GAP_MS * (strokesOf.length - 1);
  // Draws the digit as written up to time t (ms), with the pen at its tip.
  const frame = (t) => paintSigil((g, r) => {
    const k = Math.min(r.width, r.height) * 0.8 / 100, x0 = (r.width - 100 * k) / 2, y0 = (r.height - 100 * k) / 2, X = (x) => x0 + x * k, Y = (y) => y0 + y * k;
    g.shadowColor = "#7fdc8a"; g.shadowBlur = 20; g.strokeStyle = "#e8ffe9"; g.lineWidth = 10;
    let at = t, pen = null;
    strokesOf.forEach((s, n) => {
      if (at <= 0) return;
      const want = Math.min(1, at / durs[n]) * lens[n];
      at -= durs[n] + WRITE_GAP_MS;
      g.beginPath(); g.moveTo(X(s[0][0]), Y(s[0][1]));
      let got = 0, tip = s[0];
      for (let i = 1; i < s.length && got < want; i++) {
        const a = s[i - 1], b = s[i], seg = Math.hypot(b[0] - a[0], b[1] - a[1]), f = Math.min(1, (want - got) / (seg || 1));
        tip = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; g.lineTo(X(tip[0]), Y(tip[1])); got += seg;
      }
      g.stroke();
      if (want < lens[n]) pen = tip;
    });
    if (pen) { g.shadowColor = "#ffc93c"; g.shadowBlur = 14; g.fillStyle = "#ffc93c"; g.beginPath(); g.arc(X(pen[0]), Y(pen[1]), 7, 0, Math.PI * 2); g.fill(); }
  }, 0.35);
  if (reduced()) { frame(Infinity); if (done) setTimeout(done, 600); return; }
  const t0 = performance.now();
  const step = (now) => {
    const t = now - t0;
    frame(t);
    if (t < total) requestAnimationFrame(step);
    else if (done) setTimeout(done, WRITE_HOLD_MS);
  };
  requestAnimationFrame(step);
}
function castSpell() {
  if (G.busy || !strokes.length) return;
  const sp = spellsOf(), mine = Object.entries(sp.templates).flatMap(([d, list]) => list.map((points) => ({ digit: Number(d), points })));
  const ans = G.cur.ans, r = readSigil(strokes, mine), edge = sigilOffEdge();
  let j = judgeSigil(r, ans, undefined, edge);
  // Before learning it, the built-in templates alone: a drawing they read clearly as another
  // digit is never learned (a read takes a few ms, so only then).
  if (j.learn && mine.length) j = judgeSigil(r, ans, readSigil(strokes), edge);
  if (j.outcome === "retry") {
    G.spellFails++;
    sfx.crack();
    say("p", PHRASE.spellFail, true);
    if (G.spellFails >= 2) { G.cur.spell = false; padUI("num"); setMsg("Incantation failed! Use the number pad.", "bad"); say("p", PHRASE.spellPad); }
    else if (j.edge) { setMsg("Stay inside the box! Try again.", "bad"); sigilReset(); say("p", PHRASE.drawEdge); }
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
      setMsg("Here's how to write it.", "good");
      say("p", howToWriteLine(ans));
    } else if (j.learn) {
      // Their handwriting: keep their last 3 good matches of each digit.
      sp.templates[ans] = (sp.templates[ans] || []).concat([r.points.map((p) => ({ x: +p.x.toFixed(3), y: +p.y.toFixed(3), id: p.id }))]).slice(-3);
    }
    store.player(PID).set("spells", sp);
  }
  // A good spell throws the drawing itself at the monster (fly): the kid's own handwriting is the
  // attack. A backwards or poorly matched one throws the plain digit, since its drawing is the
  // one being corrected.
  G.spellShot = j.outcome !== "wrong" && !G.cur.reversed && !G.cur.howTo ? drawingShot() : null;
  // A wrong answer goes in as the digit it was read as.
  G.input = String(j.outcome === "wrong" ? r.digit : ans); ansUI();
  // A poor match is written out stroke by stroke first, and the hit waits for it.
  if (j.outcome === "show") { G.busy = true; showHowToWrite(ans, () => { G.busy = false; submit(); }); return; }
  submit();
}
// The strokes alone (no hint or correction drawn over them), cropped to what was drawn and
// glowing as on the pad, as an image, with where its middle is on screen.
function drawingShot() {
  const c = $("sigil");
  if (!c || !strokes.length) return null;
  const pts = strokes.flat(), pad = 14;
  const x0 = Math.min(...pts.map((p) => p[0])) - pad, y0 = Math.min(...pts.map((p) => p[1])) - pad;
  const w = Math.max(...pts.map((p) => p[0])) - x0 + pad, h = Math.max(...pts.map((p) => p[1])) - y0 + pad;
  const dpr = devicePixelRatio || 1, o = document.createElement("canvas");
  o.width = Math.ceil(w * dpr); o.height = Math.ceil(h * dpr);
  const g = o.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, -x0 * dpr, -y0 * dpr);
  g.lineCap = g.lineJoin = "round"; g.lineWidth = 8; g.strokeStyle = "#fff1b8"; g.shadowColor = "#ffc93c"; g.shadowBlur = 16;
  for (const st of strokes) {
    g.beginPath();
    st.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    if (st.length === 1) g.lineTo(st[0][0] + 0.5, st[0][1]);
    g.stroke();
  }
  const r = c.getBoundingClientRect();
  return { src: o.toDataURL(), w, h, x: r.left + x0 + w / 2, y: r.top + y0 + h / 2 };
}

/* ---------- drawing a shape (Polly-Gon, js/shapes.js) ----------
   "Draw a triangle!" on the spell pad, read with the shape templates and judged knowing the shape
   asked (shapes.js judgeShape), as a spell is. Unlike a spell it's the math here, so it records
   the fact like any answer. Touch screens only (canSpell).
   - Right (a good or a rough match, or a square for "rectangle"): a hit, for the strand's typical
     answer (learn.js drawHit), and a clean shape glows over the drawing.
   - Read clearly as another shape: a miss, "That looks like a square!", with the right shape
     glowing over it and the worked hint on the Oops card.
   - Can't tell: try again, no cost; after two, a counting problem about it instead, the way a
     spell falls back to the number pad. */
const drawable = (kinds) => (canSpell() ? kinds : (o, key) => kinds(o, key) && !isDrawKey(key));
// A counting problem in place of a drawing: the shape's own sides or corners when its strand has
// them open, else any counting problem open there.
function countFor(p, bk) {
  const code = Object.keys(SHAPE_CODE).find((c) => SHAPE_CODE[c] === p.shape), lv = levelsFor(bk).levels;
  const counts = pool(bk).filter((f) => f.op === "◇" && !isDrawKey(f.key)), open = counts.filter((f) => lv.includes(f.level));
  const own = open.filter((f) => f.key === "◇sides:" + code || f.key === "◇corners:" + code);
  const list = own.length ? own : open.length ? open : counts.length ? counts : pool("shapesK").filter((f) => !isDrawKey(f.key));
  return list[Math.floor(Math.random() * list.length)].key;
}
function castShape() {
  if (G.busy || !strokes.length) return;
  const p = G.cur, strict = !!(BANDS[curBand()] || {}).strict;
  const r = readShape(strokes, { strict }), j = judgeShape(r, p.shape, strict, sigilOffEdge());
  if (j.outcome === "retry") {
    G.drawFails++;
    sfx.crack();
    if (G.drawFails >= 2) return drawToCount();
    setMsg(j.edge ? "Stay inside the box! Try again." : "Hmm, I can't tell what that is. Try again!", "bad"); sigilReset();
    if (j.edge) say("p", PHRASE.drawEdge, true);
    else say("p", PHRASE.spellAgain, true);
    return;
  }
  // The clean shape glows over the drawing, theirs dimmed: what they drew when it counts, or the
  // shape asked. A tiny drawing gets it in the middle of the pad.
  const c = $("sigil").getBoundingClientRect(), pts = strokes.flat(), xs = pts.map((v) => v[0]), ys = pts.map((v) => v[1]);
  const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
  const box = w + h > 40 ? { x: Math.min(...xs), y: Math.min(...ys), w, h } : { x: c.width * 0.3, y: c.height * 0.15, w: c.width * 0.4, h: c.height * 0.7 };
  const clean = cleanFor(j.outcome === "wrong" ? null : r, p.shape, box);
  paintSigil((g) => {
    g.shadowColor = "#7fdc8a"; g.shadowBlur = 20; g.strokeStyle = "#e8ffe9"; g.lineWidth = 7;
    for (const s of clean) { g.beginPath(); s.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }
  }, 0.35);
  G.drawn = j.outcome === "wrong" ? "wrong" : "right";
  G.drawRead = j.outcome === "wrong" ? r.shape : null;
  G.input = "◇";
  submit();
}
// Two drawings that couldn't be read: a counting problem takes its place (no heart lost, and the
// drawing's record unchanged).
function drawToCount() {
  const key = countFor(G.cur, curBand());
  G.cur = factOf(key);
  G.recent = [key].concat(G.recent).slice(0, RECENT);
  G.input = ""; G.hinted = false; G.drawn = null; G.t0 = performance.now();
  probUI(); ansUI();
  pollySquawk(G.cur, true);
  setMsg("Let's count instead!", "bad");
  say("p", PHRASE.countInstead, true);
  say("q", spokenProblem(G.cur), false, asked(G.cur));
  showHelp(helpFor(recs[key]));
}

/* ---------- Polly-Gon's squawk ----------
   Before each of its problems, Polly-Gon squawks the shape it wants ("Squawk! Polly want a
   triangle!"). Quiet: just the sound (a counting problem taking a drawing's place). */
const onPolly = () => { const m = G.floors && G.floors[G.floor]; return !!m && (m.base || m.n) === "Polly-Gon" && G.hp > 0; };
function pollySquawk(p, quiet) {
  if (!onPolly() || !p || p.op !== "◇") return;
  sfx.squawk();
  if (!quiet) say("m", squawk(p), false, asked(p));
}

// The number pad, or for a comparison (Chompers) the < = > keys, filling the same space.
// Delete is drawn (a ⌫ from a font came out far smaller than the Bungee digits), sized in em so
// it scales with the pad's digits on every layout.
const DEL_ICON = `<svg class="del-icon" viewBox="0 0 30 22" aria-hidden="true"><path d="M10 2.5h16a2.5 2.5 0 0 1 2.5 2.5v12a2.5 2.5 0 0 1-2.5 2.5H10L1.8 11z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M14 7l8 8M22 7l-8 8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
const KEY_LABEL = { del: [DEL_ICON, "Delete"], go: ["Hit!", "Attack"], "<": ["<", "Less than"], "=": ["=", "Equal to"], ">": [">", "Greater than"] };
// mode: "num", "cmp", "tf" (True and False, two big keys filling the pad), "spell" (the drawing
// pad) or "draw" (the same pad, for a shape: Polly-Gon).
function padUI(mode) {
  const pad = $("pad"), cmp = mode === "cmp", drawn = mode === "spell" || mode === "draw";
  if (pad.dataset.mode === mode) { if (drawn) sigilReset(); return; }
  pad.dataset.mode = mode; pad.classList.toggle("cmp", cmp); pad.classList.toggle("spell", drawn); pad.classList.toggle("tfpad", mode === "tf");
  if (mode === "tf") {
    pad.innerHTML = `<button type="button" data-k="T" class="tfk yes" aria-label="True"><b>✓</b>True</button><button type="button" data-k="F" class="tfk no" aria-label="False"><b>✗</b>False</button>`;
    return;
  }
  if (drawn) {
    const shape = mode === "draw";
    pad.innerHTML = `<canvas id="sigil" class="sigil" aria-label="${shape ? "Draw the shape here" : "Draw the answer here"}"></canvas><button type="button" data-k="clear" class="del" aria-label="Clear the drawing">Clear</button><button type="button" data-k="go" class="go" aria-label="${shape ? "Cast the shape" : "Cast the spell"}">Cast!</button>`;
    sigilSetup();
    return;
  }
  pad.innerHTML = padKeysHTML(mode);
}
// The keys, for the game's pad and a chest's (whose go key says goLabel, "Open!").
function padKeysHTML(mode, goLabel) {
  const keys = mode === "cmp" ? ["<", "=", ">", "del", "go"] : ["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0", "go"];
  return keys.map((k) => { const [t, a] = k === "go" && goLabel ? [goLabel, goLabel] : KEY_LABEL[k] || [k, k];
    return `<button type="button" data-k="${k}" class="${k === "go" ? "go" : k === "del" ? "del" : "<=>".includes(k) ? "sym" : ""}" aria-label="${a}">${t}</button>`; }).join("");
}
padUI("num");
$("pad").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) press(b.dataset.k); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { if (G.paused) { if ($("resume")) resume(); } else if ($("ov").hidden) pause(); return; }
  // A chest's lock takes the keyboard while its pad is up.
  if (G.chest && $("chestPad") && !$("ov").hidden) {
    const k = /^[0-9]$/.test(e.key) || (e.key && "<=>".includes(e.key)) ? e.key : { ",": "<", ".": ">", Backspace: "del", Enter: "go" }[e.key];
    if (k) { e.preventDefault(); chestPress(k); }
    return;
  }
  if (!$("ov").hidden) return;
  if (/^[0-9]$/.test(e.key)) press(e.key);
  else if ("<=>".includes(e.key) && e.key) press(e.key);
  else if (e.key === ",") press("<");
  else if (e.key === ".") press(">");
  else if (e.key === "Backspace") press("del");
  else if (e.key === "Enter") { e.preventDefault(); press("go"); }
  // True or false on a keyboard: T and F.
  else if (/^[tf]$/i.test(e.key)) { if (G.cur && G.cur.op === "✓") press(e.key.toUpperCase()); }
  // ":" after the hour moves on to the minutes, as on a clock.
  else if (e.key === ":") { if (G.cur && G.slot && G.slot.at === 0) press("go"); }
  // ? opens the hint, like tapping 💡, when this problem has one.
  else if (e.key === "?") { if (!$("hintBtn").hidden) { e.preventDefault(); $("hintBtn").click(); } }
});

// ?debug lets a test script read the game's state (window.sumgeonState()): the problem, the floor,
// the open steps. For testing only; nothing reads it otherwise.
if (new URLSearchParams(location.search).has("debug")) window.sumgeonState = () => ({ G, steps: stepsNow(), chapter: chapterNow(), progress, music: musicState(), audio: sfx.status() });

loadPlayer();
newRun();
loadMonster(0, true);
$("prob").textContent = "7 + 8 =";
menu();
// ?enter=3 (testing, for the iOS Simulator, which can't be tapped by a script here): picks grade 3
// and a hero when there are none, then taps Enter the dungeon, as a player would.
{
  const g = new URLSearchParams(location.search).get("enter");
  if (g != null) setTimeout(() => {
    const tap = (sel) => { const b = document.querySelector(sel); if (b) b.click(); };
    tap(`.gpick[data-g="${Number(g) || 0}"]`);
    setTimeout(() => { if (!hasCaptain()) tap(".hpick:not([disabled])"); setTimeout(() => tap("#go"), 300); setTimeout(() => { if (!G.running && !descending()) tap("#go"); }, 1200); }, 300);
  }, 500);
}
welcomeLink();
syncAll(); // a linked player syncs at launch
// The page shows (index.html's "boot") once the start screen is drawn and its fonts are in, or
// after a moment without them. Before, a slow load (or iOS reloading the Home Screen app in the
// background) showed the bare markup: a dimmed, half-drawn fight with an empty card, the footer
// and "7 + 8 =". The scene is drawn again with the fonts in, since its horizon is measured from
// the card's text; a font that arrives later redraws it too.
{
  const booted = () => {
    const h = document.documentElement;
    if (!h.classList.contains("boot")) return;
    if (sceneOn() && !descending()) drawScene();
    h.classList.remove("boot");
    if (!reduced()) { h.classList.add("booted"); setTimeout(() => h.classList.remove("booted"), 300); } // a short fade in from the launch color
  };
  const fonts = document.fonts ? Promise.all(["400 1em Bungee", "600 1em Nunito"].map((f) => document.fonts.load(f))) : Promise.resolve();
  Promise.race([fonts, wait(1200)]).then(booted, booted);
  if (document.fonts) document.fonts.addEventListener("loadingdone", redrawScene);
}
