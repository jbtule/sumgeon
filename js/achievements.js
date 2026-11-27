// Achievements (DESIGN.md §14): worked out from saved progress, and kept once earned (nothing is
// ever taken away, and there are no streaks to lose). Patterned on sound-box-crosswords'
// achievements.js: catalog(state) lists them, award() records the newly met ones as { id: time }.
// No DOM, runs in Node; app.js shows them (the cards before the next descent, and the 🏆 sheet).
//
// state = {
//   facts: the player's fact records ({ key: { b, … } }, learn.js)
//   wings: the player's stratum progress ({ [wingId]: { megas, legend, … } }, wings.js)
// }
//
// Built (this PR): the stratum ones (§14.2: each stratum's Champion and Legend, Champion of
// Champions and Legend of Legends), shown ahead with their progress, and the mastery ones (§14.3),
// secret until earned. Still to come: the learning tracks (§14.4) and the surprises (§14.5), which
// count things the game will save in state.counts (a hook: catalog ignores it for now), and the
// share card.
import { BANDS, pool, topBox, chaptersOf } from "./learn.js";
import { WINGS, PATHS, megasOf, legendShare, legendFacts } from "./wings.js";
import { isDrawKey } from "./shapes.js";
import { spoken } from "./problems.js";

/* ---------- rewards ----------
   Every achievement has a fixed reward: coins (cents, into the wallet), items ({ id: count }) and
   for the stratum ones a special clothing piece (clothes.js, never found or bought). A reward
   must never change once released: merge.js credits it from the ids earned (rewardsOf), so a
   linked player's wallet counts each achievement's coins once, whichever devices awarded it. */
const ITEM_NAMES = { pie: "a pie", shield: "a shield", totem: "a Times Two Totem", magnet: "a Hero Magnet" };
const TABLES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
// The stratum ones' names on screen, without "The" ("Counting Cellar Champion").
const SHORT = Object.fromEntries(WINGS.map((w) => [w.id, w.name.replace(/^The /, "")]));

/* ---------- the mastery ones (§14.3): each kind's facts ----------
   "Every fact of that kind at box 4" (learn.js topBox). A kind is one set of fact keys, or, for
   the kinds with a strand in several strata (coins, time, patterns, shapes), any one stratum's
   strand: a kindergartner can master the Cellar's coins, a 3rd grader the Tower's clocks. Drawn
   shapes are left out (a drawing needs a touch screen), as for the Legend. */
const levelKeys = (band, name, test = () => true) => {
  const L = BANDS[band].levels.findIndex((l) => l.name === name);
  if (L < 0) throw new Error(`achievements: ${band} has no level "${name}"`);
  return pool(band).filter((f) => f.level === L && test(f.key)).map((f) => f.key);
};
const nums = (key) => key.replace(/^[^0-9]+/, "").split(",").map(Number);
// The tables: × facts up to 12 × 12 (not × tens), turnarounds sharing a key.
const tableKeys = (n) => pool("third").filter((f) => f.op === "×" && /^×\d+,\d+$/.test(f.key) && nums(f.key).every((x) => x <= 12) && nums(f.key).includes(n)).map((f) => f.key);
const bonds = (test) => levelKeys("kinder", "Make 10 and number bonds", (k) => test(nums(k)[0] + nums(k)[1]));
const strand = (band, test = () => true) => pool(band).filter((f) => !isDrawKey(f.key) && test(f)).map((f) => f.key);
const thirdKeys = (...names) => names.flatMap((n) => levelKeys("third", n));

// [{ id, icon, title, say (the title as said), detail, sayDetail, sets: [[keys]], reward }]
const plural = (n) => (n === 6 ? "sixes" : spoken(n) + "s"); // "the sevens", "the twelves"
export const MASTERY = [
  ...TABLES.map((n) => ({ id: "master:table" + n, icon: "🧮", title: `Table Master: the ${n}s`, say: `Table Master: the ${plural(n)}!`,
    detail: `Every × ${n} fact mastered`, sayDetail: `Every times ${spoken(n)} fact, mastered.`, sets: [tableKeys(n)], reward: { items: { totem: 1 } } })),
  { id: "master:make10", icon: "🔟", title: "Make-Ten Master", say: "Make-Ten Master!", detail: "Every way to make 10, mastered", sayDetail: "Every way to make ten, mastered.",
    sets: [bonds((t) => t === 10)], reward: { items: { pie: 1 } } },
  { id: "master:doubles", icon: "👯", title: "Doubles Master", say: "Doubles Master!", detail: "Every double, like 8 + 8 and 16 − 8, mastered", sayDetail: "Every double, mastered.",
    sets: [levelKeys("first", "Doubles and near doubles", (k) => { const [a, b] = nums(k); return k[0] === "+" ? a === b : a === 2 * b; })], reward: { items: { totem: 1 } } },
  { id: "master:bonds", icon: "🔗", title: "Number Bonds", say: "Number Bonds!", detail: "Every number bond of 2 to 9, mastered", sayDetail: "Every number bond, mastered.",
    sets: [bonds((t) => t < 10)], reward: { items: { shield: 1 } } },
  { id: "master:coins", icon: "🪙", title: "Coin Counter", say: "Coin Counter!", detail: "Every coin problem in a stratum, mastered", sayDetail: "Every coin problem in a stratum, mastered.",
    sets: [strand("coinsK"), strand("coins", (f) => f.op === "¢")], reward: { cents: 50 } },
  { id: "master:time", icon: "🕒", title: "Time Teller", say: "Time Teller!", detail: "Every clock in a stratum, mastered", sayDetail: "Every clock in a stratum, mastered.",
    sets: [strand("timeH"), strand("timeM"), strand("timeT")], reward: { cents: 50 } },
  { id: "master:patterns", icon: "🫧", title: "Pattern Finder", say: "Pattern Finder!", detail: "Every pattern in a stratum, mastered", sayDetail: "Every pattern in a stratum, mastered.",
    sets: [strand("patK"), strand("patH"), strand("patM")], reward: { items: { magnet: 1 } } },
  { id: "master:shapes", icon: "🔷", title: "Shape Spotter", say: "Shape Spotter!", detail: "Every shape question in a stratum, mastered", sayDetail: "Every shape question in a stratum, mastered.",
    sets: [strand("shapesK"), strand("shapesH"), strand("shapesM"), strand("shapesT")], reward: { items: { shield: 1 } } },
  { id: "master:fractions", icon: "½", title: "Fraction Finder", say: "Fraction Finder!", detail: "Every fraction, mastered", sayDetail: "Every fraction, mastered.",
    sets: [thirdKeys("Fractions on a number line", "Equal fractions", "Compare fractions")], reward: { items: { pie: 1 } } },
  { id: "master:rounding", icon: "🎯", title: "Rounder", say: "Rounder!", detail: "Every rounding problem, mastered", sayDetail: "Every rounding problem, mastered.",
    sets: [thirdKeys("Rounding")], reward: { cents: 50 } },
  { id: "master:area", icon: "▭", title: "Area Ace", say: "Area Ace!", detail: "Every area and perimeter problem, mastered", sayDetail: "Every area and perimeter problem, mastered.",
    sets: [thirdKeys("Area and perimeter")], reward: { items: { magnet: 1 } } }
];

/* ---------- the stratum ones (§14.2) ---------- */
// Champion: the mega boss that opens the stratum's last chapter beaten (megas, wings.js chapterOf).
export const megasNeeded = (wingId) => chaptersOf(PATHS[wingId]) - 1;
const STRATUM = WINGS.flatMap((w) => [
  { id: "champion:" + w.id, wing: w.id, kind: "champion", icon: "🏆", title: SHORT[w.id] + " Champion", say: SHORT[w.id] + " Champion!",
    detail: `Beat the mega boss that opens the ${SHORT[w.id]}'s last chapter`, sayDetail: "You beat its mightiest mega boss!",
    reward: { cents: 50, piece: "badge-" + w.id } },
  { id: "legend:" + w.id, wing: w.id, kind: "legend", icon: "🌟", title: SHORT[w.id] + " Legend", say: SHORT[w.id] + " Legend!",
    detail: `Mastered every fact, then beat the ${SHORT[w.id]}'s Legend boss`, sayDetail: "Every fact mastered, and the Legend beaten!",
    reward: { cents: 99, piece: "legend-" + w.id } }
]);
const GRAND = [
  { id: "grand:champion", kind: "grand", icon: "👑", title: "Champion of Champions", say: "Champion of Champions!", detail: "Champion of every stratum", sayDetail: "Champion of every stratum!",
    reward: { cents: 99, piece: "champcape" } },
  { id: "grand:legend", kind: "grand", icon: "🌠", title: "Legend of Legends", say: "Legend of Legends!", detail: "Legend of every stratum", sayDetail: "Legend of every stratum!",
    reward: { items: { pie: 2, shield: 2, totem: 2, magnet: 2 } } }
];

const ALL = [...STRATUM, ...GRAND, ...MASTERY];
const byId = Object.fromEntries(ALL.map((a) => [a.id, a]));
// An achievement's fixed reward: { cents, items: { id: n }, piece } (missing parts are 0 or none).
export function rewardOf(id) {
  const r = (byId[id] || {}).reward || {};
  return { cents: r.cents || 0, items: { ...(r.items || {}) }, piece: r.piece || null };
}
// The rewards of a set of earned ids, added up: { cents, items: { id: n } } (merge.js).
export function rewardsOf(ids) {
  const out = { cents: 0, items: {} };
  for (const id of ids) {
    const r = rewardOf(id);
    out.cents += r.cents;
    for (const [k, n] of Object.entries(r.items)) out.items[k] = (out.items[k] || 0) + n;
  }
  return out;
}

/* ---------- the catalog ---------- */
// Every achievement: [{ id, icon, title, detail, goal, have, met, secret, kind, wing?, progress,
// reward, spoken }] in the 🏆 sheet's order: the stratum ones (each stratum's Champion, then
// Legend), the grand ones, then the mastery ones. progress: words for the sheet ("0 of 1 mega
// bosses", "42% mastered"), for the ones shown ahead.
export function catalog(state) {
  const facts = (state && state.facts) || {}, wings = (state && state.wings) || {};
  const out = [];
  for (const a of STRATUM) {
    const p = wings[a.wing] || {}, w = WINGS.find((x) => x.id === a.wing);
    if (a.kind === "champion") {
      const goal = megasNeeded(a.wing), have = Math.min(goal, megasOf(p));
      out.push(entry(a, { goal, have, met: have >= goal, progress: `Mega bosses beaten: ${have} of ${goal}` }));
    } else {
      const met = !!p.legend, share = legendFacts(w).length ? legendShare(w, facts) : 0;
      out.push(entry(a, { goal: 1, have: met ? 1 : 0, met, share: met ? 1 : share, progress: met ? "Legend beaten" : share >= 1 || p.legendOpen ? "The Legend awaits!" : `${Math.floor(share * 100)}% of its facts mastered` }));
    }
  }
  const champs = WINGS.filter((w) => megasOf(wings[w.id]) >= megasNeeded(w.id)).length, legends = WINGS.filter((w) => !!(wings[w.id] || {}).legend).length;
  out.push(entry(GRAND[0], { goal: WINGS.length, have: champs, met: champs >= WINGS.length, progress: `Champion of ${champs} of ${WINGS.length} strata` }));
  out.push(entry(GRAND[1], { goal: WINGS.length, have: legends, met: legends >= WINGS.length, progress: `Legend of ${legends} of ${WINGS.length} strata` }));
  for (const a of MASTERY) {
    // The set closest to done (any one counts).
    let best = null;
    for (const keys of a.sets) {
      const have = keys.filter((k) => topBox(facts[k])).length;
      if (!best || have / keys.length > best.have / best.goal) best = { have, goal: keys.length };
    }
    out.push(entry(a, { goal: best.goal, have: best.have, met: best.have >= best.goal, secret: true }));
  }
  return out;
}
function entry(a, o) {
  return Object.assign({ id: a.id, icon: a.icon, title: a.title, detail: a.detail, kind: a.kind || "mastery", wing: a.wing || null, secret: false, reward: rewardOf(a.id), spoken: spokenParts(a), share: Math.min(1, o.have / o.goal) }, o);
}

/* ---------- what a card says ---------- */
export const NEW_LINE = "New achievement!", SECRET_LINE = "Secret achievement!";
const capital = (t) => t[0].toUpperCase() + t.slice(1);
const centsWords = (c) => spoken(c) + (c === 1 ? " cent" : " cents");
// What the reward is, said: "You got the Counting Cellar champion badge!", "You got fifty cents!",
// "You got a Times Two Totem!", "You got two of every item!".
export function rewardLines(id) {
  const r = rewardOf(id), out = [], a = byId[id] || {};
  if (r.piece) out.push(a.kind === "champion" ? "You got a champion badge!" : a.kind === "legend" ? "You got a golden Legend crown!" : "You got the Champion of Champions cape!");
  const items = Object.entries(r.items);
  if (items.length === 4 && items.every(([, n]) => n === items[0][1])) out.push(`You got ${spoken(items[0][1])} of every item!`);
  else for (const [k, n] of items) out.push("You got " + (n === 1 ? ITEM_NAMES[k] : spoken(n) + " " + ITEM_NAMES[k].replace(/^an? /, "") + "s") + "!");
  if (r.cents) out.push(`You got ${centsWords(r.cents)}!`);
  return out;
}
// The lines after "New achievement!" (or "Secret achievement!"): the title, what it took, and the
// reward.
export function spokenParts(a) {
  const x = byId[a.id] || a;
  return [x.say, x.sayDetail, ...rewardLines(x.id)];
}
// What a card says, in order.
export const cardLines = (a) => [a.secret ? SECRET_LINE : NEW_LINE, ...spokenParts(a)];
// Every line a card can say, for the audio build (lines.js puts them in the "achievements"
// sprite). scripts/achievements.test.mjs keeps it in step with catalog().
export function spokenLines() {
  const out = [NEW_LINE, SECRET_LINE];
  for (const a of ALL) out.push(...spokenParts(a));
  return [...new Set(out)];
}

/* ---------- awarding ---------- */
// Records newly met achievements in `earned` ({ id: time }) and returns them (catalog entries).
// Earned ones are never taken away: a met one stays earned whatever happens to the facts after.
export function award(state, earned, now) {
  return catalog(state).filter((a) => {
    if (!a.met || earned[a.id]) return false;
    earned[a.id] = now;
    return true;
  });
}
// The saved achievements ({ earned: { id: time }, seen: [ids] }), cleaned.
export function freshAchievements(saved) {
  const s = saved && typeof saved === "object" ? saved : {}, earned = {};
  for (const [k, t] of Object.entries(s.earned && typeof s.earned === "object" ? s.earned : {})) if (byId[k] && typeof t === "number" && t > 0) earned[k] = t;
  const seen = Array.isArray(s.seen) ? [...new Set(s.seen.filter((k) => earned[k]))] : [];
  return { earned, seen };
}
// The earned ones not yet shown on a card, in the catalog's order (the stratum ones first).
export function unseen(ach) { return ALL.map((a) => a.id).filter((id) => ach.earned[id] && !ach.seen.includes(id)); }
export const achievementOf = (id) => byId[id] || null;
export const ACHIEVEMENT_IDS = ALL.map((a) => a.id);
