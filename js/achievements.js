// Achievements (DESIGN.md §14): worked out from saved progress, and kept once earned (nothing is
// ever taken away, and there are no streaks to lose). Patterned on sound-box-crosswords'
// achievements.js: catalog(state) lists them, award() records the newly met ones as { id: time }.
// No DOM, runs in Node; app.js shows them (the cards before the next descent, and the 🏆 sheet).
//
// state = {
//   facts:   the player's fact records ({ key: { b, n, ms, … } }, learn.js)
//   wings:   the player's stratum progress ({ [wingId]: { megas, legend, depth, … } }, wings.js)
//   moments: the Hero Moments save (moments.js: heard, for Every Quip)
//   wallet:  the purse, in cents (Piggy Bank)
//   ach:     the achievements save itself ({ earned, days, comebacks }, freshAchievements): the
//            surprises seen in play are recorded straight into earned (noteEvent), the practice
//            days and comebacks are counted there
// }
//
// The stratum ones (§14.2: each stratum's Champion and Legend, Champion of Champions and Legend of
// Legends) are shown ahead with their progress; the mastery ones (§14.3), the learning tracks
// (§14.4) and the surprises (§14.5) are secret until earned (a track's next tier shows its count,
// "12 of 25", once started). The share card is drawn by sharecard.js.
import { BANDS, pool, topBox, chaptersOf } from "./learn.js";
import { WINGS, PATHS, megasOf, legendShare, legendFacts } from "./wings.js";
import { isDrawKey } from "./shapes.js";
import { spoken } from "./problems.js";
import { factState } from "./progress.js";
import { heardOf, QUIPS } from "./moments.js";
import { PLUSHIES } from "./plushie.js";
import { findable } from "./clothes.js";
import { HEROES } from "./heroes.js";

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
const fourthKeys = (...names) => names.flatMap((n) => levelKeys("fourth", n));

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
    sets: [thirdKeys("Area and perimeter")], reward: { items: { magnet: 1 } } },
  // The Fraction Forge's (4th grade, DESIGN.md §4.4).
  { id: "master:multiply", icon: "✖️", title: "Multiplier", say: "Multiplier!", detail: "Every multiplication by one digit and two digits, mastered", sayDetail: "Every big multiplication, mastered.",
    sets: [fourthKeys("Multiply by one digit", "Two-digit × two-digit")], reward: { items: { totem: 1 } } },
  { id: "master:remainders", icon: "👻", title: "Remainder Ranger", say: "Remainder Ranger!", detail: "Every remainder problem, mastered", sayDetail: "Every remainder problem, mastered.",
    sets: [fourthKeys("Remainders")], reward: { cents: 50 } },
  { id: "master:fracsmith", icon: "🔨", title: "Fraction Smith", say: "Fraction Smith!", detail: "Every fraction added, taken away and multiplied, mastered", sayDetail: "Every fraction added, taken away and multiplied, mastered.",
    sets: [fourthKeys("Add and subtract fractions", "A fraction times a whole")], reward: { items: { pie: 1 } } },
  { id: "master:angles", icon: "📐", title: "Angle Ace", say: "Angle Ace!", detail: "Every angle and shape to classify, mastered", sayDetail: "Every angle and shape, mastered.",
    sets: [fourthKeys("Angles", "Classify shapes")], reward: { items: { shield: 1 } } },
  { id: "master:units", icon: "📏", title: "Unit Converter", say: "Unit Converter!", detail: "Every measurement conversion, mastered", sayDetail: "Every measurement conversion, mastered.",
    sets: [fourthKeys("Measurement")], reward: { items: { magnet: 1 } } }
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

/* ---------- the learning tracks (§14.4): secret, counting up once started ----------
   Each tier is an achievement of its own ("fluent:25"), earned when the track's count reaches it.
   The counts:
   - fluent: facts known by heart, counted from the fact records (progress.js factState: learned,
     box 3+, and answered on average inside the fact's fluent time). Counted, not tallied: the
     records already sync (merge.js), a fact counts once however often it's answered, and a fact
     placed by skipping ahead without being answered doesn't count (it has no time).
   - comeback: a missed fact later right, unhinted (isComeback: its record still at box 0 after a
     miss). A tally in the achievements save (comebacks), synced per device (merge.js).
   - days: local dates with an answer (dayNumber), never a streak. The set of days (the earliest
     DAYS_KEPT: the top tier needs no more), synced as a union.
   - deep: the deepest depth opened in any stratum (wings[id].depth: where the next descent goes,
     so its card plays just before diving there).
   Rewards are items (a kindergartner may not have met money yet), a whole set at the top. */
const EVERY = { pie: 1, shield: 1, totem: 1, magnet: 1 };
const TIER_ITEMS = [{ pie: 1 }, { shield: 1 }, { totem: 1 }, { magnet: 1 }];
const Cap = (t) => t[0].toUpperCase() + t.slice(1);
export const TRACKS = {
  fluent: { tiers: [[25, "🔋", "Charged Up"], [100, "⚡", "Quick Spark"], [250, "🌩️", "Thunderclap"], [500, "🌪️", "Whirlwind"], [1000, "☄️", "Lightning Legend"]],
    detail: (n) => `${n} facts known by heart: right, quick and without a hint`, sayDetail: (n) => `${Cap(spoken(n))} facts, known by heart!`,
    progress: "Facts known by heart", rewards: [...TIER_ITEMS, EVERY] },
  comeback: { tiers: [[1, "🌧️", "Through the Rain"], [5, "🌦️", "Clearing Up"], [10, "🌈", "Rainbow After"], [25, "☀️", "Sunny Side"], [50, "🦅", "Soaring"]],
    detail: (n) => (n === 1 ? "A missed fact, later right on your own" : `${n} missed facts, later right on your own`),
    sayDetail: (n) => (n === 1 ? "A missed fact, later right on your own!" : `${Cap(spoken(n))} missed facts, later right on your own!`),
    progress: "Comebacks", rewards: [...TIER_ITEMS, EVERY] },
  days: { tiers: [[1, "🕯️", "First Torch"], [3, "🗝️", "Key Finder"], [7, "🚪", "Door Opener"], [14, "🪜", "Deeper Down"], [30, "🏰", "Castle Keeper"], [60, "🐉", "Dragon's Den"], [100, "👑", "Dungeon Royalty"]],
    detail: (n) => (n === 1 ? "Your first day of practice" : `${n} days of practice, any days at all`),
    sayDetail: (n) => (n === 1 ? "Your first day of practice!" : `${Cap(spoken(n))} days of practice!`),
    progress: "Days of practice", rewards: [...TIER_ITEMS, { pie: 1, shield: 1 }, { totem: 1, magnet: 1 }, EVERY] },
  deep: { tiers: [[10, "🔦", "Cave Crawler"], [25, "⛏️", "Deep Delver"], [50, "🦇", "Bat Cave"], [100, "🌋", "Core Explorer"]],
    detail: (n) => `Reached depth ${n}`, sayDetail: (n) => `You reached depth ${spoken(n)}!`,
    progress: "Deepest depth", rewards: [{ shield: 1 }, { totem: 1 }, { magnet: 1 }, EVERY] }
};
export const DAYS_KEPT = 100;
const TRACK = Object.entries(TRACKS).flatMap(([track, t]) => t.tiers.map(([n, icon, title], i) => ({
  id: `${track}:${n}`, kind: "track", track, tier: i, goal: n, icon, title, say: title + "!", detail: t.detail(n), sayDetail: t.sayDetail(n), reward: { items: t.rewards[i] } })));
// The counts the tracks need, from the state.
export function trackCounts(state) {
  const s = state || {}, facts = s.facts || {}, wings = s.wings || {}, a = s.ach || {};
  let fluent = 0;
  for (const k of Object.keys(facts)) if (factState(facts[k], k).fluent) fluent++;
  return {
    fluent,
    comeback: Math.max(0, Math.floor(Number(a.comebacks) || 0)),
    days: Array.isArray(a.days) ? a.days.length : 0,
    deep: Math.max(0, ...Object.values(wings).map((p) => Math.floor(Number((p || {}).depth) || 0)))
  };
}
// A comeback: a fact whose record shows a miss not yet made up (box 0, fewer right than seen),
// now answered right without a hint. `rec` is the record before this answer.
export const isComeback = (rec, ok, hinted) => !!(ok && !hinted && rec && rec.n > 0 && !rec.b && (rec.c || 0) < rec.n);
// A local date as a whole number of days (1970-01-01 is 0), for the practice days.
export function dayNumber(t) { const d = new Date(t); return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); }
// The practice days kept: unique, in order, the earliest DAYS_KEPT (so the union of two copies,
// cut to these, is the same whichever order they merge in, and merging again changes nothing).
export function keepDays(...lists) {
  return [...new Set(lists.flat().filter((d) => Number.isInteger(d) && d > 0))].sort((x, y) => x - y).slice(0, DAYS_KEPT);
}
// Records the day of `now` as a practice day; true when it's a new one.
export function notePracticeDay(ach, now) {
  const d = dayNumber(now);
  if (ach.days.includes(d) || ach.days.length >= DAYS_KEPT) return false;
  ach.days = keepDays(ach.days, [d]);
  return true;
}

/* ---------- the surprises (§14.5): secret ----------
   Most happen in play and can't be worked out from progress later (a hit, a payment), so app.js
   records them straight into earned as they happen (noteEvent), quietly; their cards wait for the
   next descent like the rest. Piggy Bank and Every Quip are worked out from the state (test).
   Rewards are items, since a kindergartner can hit most of them before meeting money (and coins
   paid mid-shop would upset the purse laid out for the visit).
   figure: who's on the card and the share card (a hero's digit, or a monster's name); without
   one, the captain. */
const SURPRISE = [
  { id: "surprise:zero", icon: "🎯", title: "Exactly Zero", detail: "A finishing hit that left the monster at exactly 0 HP", sayDetail: "Your last hit left exactly zero!", reward: { items: { totem: 1 } } },
  { id: "surprise:palindrome", icon: "🪞", title: "Palindrome", say: "Pal-in-drome!" /* Kokoro: PAY-lin-drome as spelled */, detail: "An answer that reads the same backward, like 121 or 44", sayDetail: "Your answer reads the same backward!", reward: { items: { shield: 1 } } },
  { id: "surprise:triple", icon: "💯", title: "Triple Digits", detail: "A single hit of 100 or more", sayDetail: "One hit of a hundred or more!", reward: { items: { totem: 1 } } },
  { id: "surprise:double", icon: "👀", title: "Seeing Double", detail: "Two of the same hero in one answer, like 55 or 77", sayDetail: "Two of the same hero in one answer!", reward: { items: { magnet: 1 } } },
  { id: "surprise:allhands", icon: "🎆", title: "All Hands", detail: "An answer of 3 or more digits, every digit a hero on your team", sayDetail: "Every digit in your answer was a hero!", reward: { items: { magnet: 1 } } },
  { id: "surprise:seven", icon: "7️⃣", title: "Lucky Seven", detail: "Freed Sevenstein with a 7 in the winning hit", sayDetail: "You freed Sevenstein with a seven!", figure: { hero: 7 }, reward: { items: { shield: 1 } } },
  { id: "surprise:iceboss", icon: "🧊", title: "Ice Cold Boss", detail: "Beat a boss without losing a heart on its floor", sayDetail: "You beat a boss without losing a heart!", reward: { items: { shield: 1 } } },
  { id: "surprise:lastheart", icon: "♻️", title: "Never Gave Up", detail: "Cleared a floor on your last heart", sayDetail: "You cleared a floor on your last heart!", reward: { items: { pie: 1 } } },
  { id: "surprise:exact", icon: "🪙", title: "Exact Change", detail: "Paid Trollar the exact amount, no change back", sayDetail: "You paid Trollar the exact amount!", figure: { monster: "Trollar" }, reward: { items: { pie: 1 } } },
  { id: "surprise:piggy", icon: "🐷", title: "Piggy Bank", detail: "A whole dollar in your purse at once", sayDetail: "A whole dollar in your purse!", figure: { monster: "Trollar" }, test: (s) => (Number(s.wallet) || 0) >= 100, reward: { items: { shield: 1 } } },
  // Quip Fan: one hero's quips all heard (its id predates the name: it was "Every Quip" until
  // 2026-11-27), earned once for each hero (HERO_SURPRISES, below). Every Quip: all ten heroes'
  // quips, a long goal that counts up on the sheet.
  { id: "surprise:quips", icon: "💬", title: "Quip Fan", detail: "Heard every one of a hero's quips", sayDetail: "You heard every one of a hero's quips!", test: (s) => quipHero(s) != null, reward: { items: { magnet: 1 } } },
  { id: "surprise:allquips", icon: "🎙️", title: "Every Quip", detail: "Heard every quip of all ten heroes", sayDetail: "You heard every quip of every hero!", test: (s) => quipHeroes(s).length >= Object.keys(QUIPS).length, reward: { items: EVERY } },
  // Snuggle Squad: every one of the ten plushies collected (wardrobe.plush), counting up on the
  // sheet once a second one comes (everyone has Pluffy).
  { id: "surprise:plushies", icon: "🧸", title: "Snuggle Squad", detail: "Collected all ten monster plushies", sayDetail: "Every plushie is home! The heroes want a pillow fight!", test: (s) => plushiesOf(s) >= PLUSHIES.length, reward: { items: EVERY } },
  // Laundry Day: every findable piece of clothing owned (wardrobe.owned; never the special ones
  // achievements give), counting up on the sheet once one is owned.
  { id: "surprise:clothes", icon: "🧺", title: "Laundry Day", detail: "Collected every piece of clothing", sayDetail: "You collected every piece! Now who's doing the laundry?", test: (s) => clothesOf(s) >= findable().length, reward: { items: EVERY } },
  // Holidays (holidaysOn, Sound Box's dates): an answer on one of these days, any year.
  { id: "holiday:thanksgiving", icon: "🦃", title: "Gobble Gobble", detail: "Fought monsters between bites of turkey", sayDetail: "Fought monsters between bites of turkey!", reward: { items: { pie: 1 } } },
  { id: "holiday:winter", icon: "⛄", title: "Snow Much Fun", detail: "Did math over winter break, snow or no snow", sayDetail: "Math over winter break, snow or no snow!", reward: { items: { shield: 1 } } },
  { id: "holiday:summer", icon: "🏖️", title: "Summer Sums", detail: "Did math in the summer sun", sayDetail: "Math in the summer sun!", reward: { items: { totem: 1 } } }
].map((a) => Object.assign({ kind: "surprise", say: a.title + "!" }, a));
/* ---------- the stratum secrets: the surprises seen in play, once in each stratum ----------
   The surprises that happen in a fight or at Trollar's stall can be earned once in every stratum:
   "Exactly Zero in the Counting Cellar", then again in the Balance Hall. Each stratum's copy has
   its own id, "surprise:zero@cellar" (the stratum is the run's, or for Exact Change the one picked
   at the stall), and pays the surprise's reward again. The surprise's own id ("surprise:zero")
   stays as the achievement as a whole: earned with its first stratum, so the ids earned before
   strata were counted keep their meaning. Those have no stratum: placeOldSurprises puts each in
   the stratum the player most likely earned it in (their start), once, on load. Piggy Bank, the
   quips and the holidays aren't tied to a stratum (Quip Fan is earned once for each hero instead,
   below). */
// Not Exact Change: Trollar's shop is on the surface, outside every stratum.
export const STRATUM_SURPRISES = ["surprise:zero", "surprise:palindrome", "surprise:triple", "surprise:double", "surprise:allhands", "surprise:seven", "surprise:iceboss", "surprise:lastheart"];
// "in the Counting Cellar": the stratum's part of the title, said and shown the same way.
export const whereIn = (wingId) => "in " + WINGS.find((w) => w.id === wingId).name.replace(/^The /, "the ");
// The id of a surprise in a stratum, and the other way round.
export const inStratum = (id, wingId) => `${id}@${wingId}`;
// A hero's copy (below) has the hero's digit where a stratum's has the stratum: { id, hero }.
export const surpriseOf = (id) => {
  const i = String(id).indexOf("@");
  if (i < 0) return null;
  const at = id.slice(i + 1);
  return /^\d$/.test(at) ? { id: id.slice(0, i), hero: Number(at) } : { id: id.slice(0, i), wing: at };
};
const SURPRISE_IN = SURPRISE.filter((a) => STRATUM_SURPRISES.includes(a.id)).flatMap((a) => WINGS.map((w) => Object.assign({}, a, {
  id: inStratum(a.id, w.id), of: a.id, wing: w.id, name: a.title, where: whereIn(w.id),
  title: `${a.title} ${whereIn(w.id)}`, say: `${a.say.replace(/!$/, "")} ${whereIn(w.id)}!` })));
/* ---------- the hero secrets: Quip Fan, once for each hero ----------
   Quip Fan is earned again for every hero whose quips have all been heard: "Quip Fan: Twodini",
   id "surprise:quips@2" (the hero's digit), each paying Quip Fan's reward again. As with the
   stratum secrets, "surprise:quips" stays as the achievement as a whole, earned with the first
   hero; a save from before had no hero's copy, and placeOldQuips puts it on one, once, on load.
   Worked out from the state (moments.heard), so award() earns each hero's copy as its last quip
   is heard, and on load for heroes already done. Every Quip stays one achievement: all ten. */
export const HERO_SURPRISES = ["surprise:quips"];
const DIGITS = Object.keys(QUIPS).map(Number);
export const forHero = (id, d) => `${id}@${d}`;
const QUIPS_IN = SURPRISE.filter((a) => HERO_SURPRISES.includes(a.id)).flatMap((a) => DIGITS.map((d) => {
  const n = HEROES[d].n;
  return Object.assign({}, a, {
    id: forHero(a.id, d), of: a.id, hero: d, name: a.title, where: n, figure: { hero: d },
    title: `${a.title}: ${n}`, say: `${a.say.replace(/!$/, "")}: ${n}!`,
    detail: `Heard every one of ${n}'s quips`, sayDetail: `You heard every one of ${n}'s quips!`,
    test: (s) => quipHeroes(s).includes(d)
  });
}));
// The surprises earned once in each stratum or for each hero: their own ids are the whole, with
// no card of their own (their copies have the cards).
const WHOLES = [...STRATUM_SURPRISES, ...HERO_SURPRISES];
// The ids the game pays when they're newly earned (app.js): never a whole, since a whole is only
// ever newly earned with one of its copies (noteEvent, award), which pays (rewardsOf counts the
// two as one). An old save's whole was paid when it was earned.
export const paysFor = (ids) => ids.filter((id) => !WHOLES.includes(id));
// An old save's surprise whole (earned before its copies were counted) is put on its copy `sid`,
// with the same time, and seen if the old one was. Nothing is paid for it: the surprise's reward
// was paid when it was earned, and rewardsOf counts the surprise and its first copy as one.
function placeOld(ach, id, copies, sid) {
  if (!ach.earned[id] || copies.some((c) => ach.earned[c])) return false;
  ach.earned[sid] = ach.earned[id];
  if (ach.seen.includes(id) && !ach.seen.includes(sid)) ach.seen.push(sid);
  return true;
}
// An old save's stratum surprises go in `wingId`'s stratum. Changes `ach`; true if it did.
export function placeOldSurprises(ach, wingId) {
  const w = WINGS.some((x) => x.id === wingId) ? wingId : WINGS[0].id;
  let changed = false;
  for (const id of STRATUM_SURPRISES) if (placeOld(ach, id, WINGS.map((x) => inStratum(id, x.id)), inStratum(id, w))) changed = true;
  return changed;
}
// An old save's Quip Fan goes on the hero whose quips are all heard (the first, by digit:
// quipHero), or, with none now (quips added since), the captain (else Zeroic). Changes `ach`; true
// if it did. Run before award(), so the hero it lands on isn't newly earned (and paid) first.
export function placeOldQuips(ach, state, captain) {
  const qh = quipHero(state), d = qh != null ? qh : DIGITS.includes(captain) ? captain : DIGITS[0];
  let changed = false;
  for (const id of HERO_SURPRISES) if (placeOld(ach, id, DIGITS.map((x) => forHero(id, x)), forHero(id, d))) changed = true;
  return changed;
}
// How many of the plushies the player owns (state.wardrobe.plush).
export function plushiesOf(state) {
  const own = new Set(((state && state.wardrobe) || {}).plush || []);
  return PLUSHIES.filter((p) => own.has(p.id)).length;
}
// How many of the findable clothes the player owns (state.wardrobe.owned).
export function clothesOf(state) {
  const own = new Set(((state && state.wardrobe) || {}).owned || []);
  return findable().filter((p) => own.has(p.id)).length;
}
// The heroes whose quips have all been heard, by digit.
export function quipHeroes(state) {
  const m = (state && state.moments) || {};
  return Object.keys(QUIPS).map(Number).filter((d) => { const h = heardOf({ heard: m.heard || {} }, d); return h.of && h.heard >= h.of; });
}
// The hero whose quips have all been heard (the first, by digit), or null.
export function quipHero(state) { const hs = quipHeroes(state); return hs.length ? hs[0] : null; }
// The holiday surprises a local date falls in (Sound Box's holidaysOn): Thanksgiving weekend (the
// 4th Thursday of November through Sunday), winter break (Dec 24 to Jan 1) and summer (June 1 to
// Aug 14). Returns achievement ids.
export function holidaysOn(d) {
  const m = d.getMonth(), day = d.getDate(), out = [];
  if (m === 10) {
    const thu = 1 + (4 - new Date(d.getFullYear(), 10, 1).getDay() + 7) % 7 + 21; // 4th Thursday
    if (day >= thu && day <= thu + 3) out.push("holiday:thanksgiving");
  }
  if ((m === 11 && day >= 24) || (m === 0 && day === 1)) out.push("holiday:winter");
  if (m === 5 || m === 6 || (m === 7 && day <= 14)) out.push("holiday:summer");
  return out;
}
// The surprises a right answer's hit earns (app.js, as the hit lands):
//   ans:    the answer, when it's a number typed on the pad (null for a symbol, a drawing, a time)
//   typed:  the digits that fly at the monster (heroes on the team fly as their hero)
//   dmg:    the hit's damage; hpLeft: the monster's HP after it (app.js doesn't clamp it at 0)
//   base:   the hit before any bonus (crits, power hits, Hero Moments, traits, the totem): Triple
//           Digits counts that, so it's about the math, not a boosted hit
//   team:   the team's digits (the captain and the rescued heroes)
// Palindromes count from two digits (11, 44, 121): a kindergartner's answers are mostly two digits
// at most, and 44 reads the same both ways just as 121 does.
export function hitSurprises({ ans, typed, dmg, base, hpLeft, team }) {
  const out = [], digits = /^\d+$/.test(String(typed ?? "")) ? String(typed) : "", on = new Set(team || []);
  if (hpLeft === 0) out.push("surprise:zero");
  if (Number.isInteger(ans) && ans >= 10 && String(ans) === [...String(ans)].reverse().join("")) out.push("surprise:palindrome");
  if ((base ?? dmg) >= 100) out.push("surprise:triple");
  const count = {};
  for (const c of digits) count[c] = (count[c] || 0) + 1;
  if (Object.keys(count).some((c) => count[c] >= 2 && on.has(Number(c)))) out.push("surprise:double");
  if (digits.length >= 3 && [...digits].every((c) => on.has(Number(c)))) out.push("surprise:allhands");
  return out;
}
export const EVENT_IDS = SURPRISE.filter((a) => !a.test).map((a) => a.id);
// Records a surprise seen in play in earned ({ id: time }), in `wingId`'s stratum for the stratum
// ones (and the surprise as a whole with its first stratum). Returns the id newly earned (for a
// stratum one, its stratum's copy: its card plays, its reward is paid), or null when it was
// already earned (there).
export function noteEvent(earned, id, now, wingId) {
  if (!EVENT_IDS.includes(id)) return null;
  if (!STRATUM_SURPRISES.includes(id)) {
    if (earned[id]) return null;
    earned[id] = now;
    return id;
  }
  const sid = inStratum(id, WINGS.some((w) => w.id === wingId) ? wingId : WINGS[0].id);
  if (earned[sid]) return null;
  earned[sid] = now;
  if (!earned[id]) earned[id] = now;
  return sid;
}

const ALL = [...STRATUM, ...GRAND, ...MASTERY, ...TRACK, ...SURPRISE, ...SURPRISE_IN, ...QUIPS_IN];
const byId = Object.fromEntries(ALL.map((a) => [a.id, a]));
// An achievement's fixed reward: { cents, items: { id: n }, piece } (missing parts are 0 or none).
export function rewardOf(id) {
  const r = (byId[id] || {}).reward || {};
  return { cents: r.cents || 0, items: { ...(r.items || {}) }, piece: r.piece || null };
}
// The rewards of a set of earned ids, added up: { cents, items: { id: n } } (merge.js). A stratum
// surprise pays once for each stratum it's earned in, and Quip Fan once for each hero; the surprise
// as a whole pays only while no copy is earned (an old save, before placeOldSurprises or
// placeOldQuips), so the two never pay twice: max(1 for the surprise, its copies), whatever order
// they were earned or merged in.
export function rewardsOf(ids) {
  const out = { cents: 0, items: {} }, set = new Set(ids);
  const inSome = new Set([...set].map((id) => (surpriseOf(id) || {}).id).filter(Boolean));
  for (const id of set) {
    if (inSome.has(id)) continue;
    const r = rewardOf(id);
    out.cents += r.cents;
    for (const [k, n] of Object.entries(r.items)) out.items[k] = (out.items[k] || 0) + n;
  }
  return out;
}

/* ---------- the catalog ---------- */
// Every achievement: [{ id, icon, title, name, where, of, detail, goal, have, met, secret, kind,
// wing?, hero?, track?, tier?, started?, pages?, unit?, figure?, progress, reward, spoken }] in the 🏆 sheet's order: the stratum ones
// (each stratum's Champion, then Legend), the grand ones, the mastery ones, the tracks, then the
// surprises. kind: "champion", "legend", "grand", "mastery", "track" or "surprise". progress: words
// for the sheet ("Mega bosses beaten: 0 of 1", "Comebacks: 12 of 25"), for the ones shown ahead and
// a started track.
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
  // The tracks: each tier counts up, started once its count is above 0.
  const counts = trackCounts(state);
  for (const a of TRACK) {
    const have = Math.min(a.goal, counts[a.track]);
    out.push(entry(a, { goal: a.goal, have, met: have >= a.goal, secret: true, started: have > 0, progress: `${TRACKS[a.track].progress}: ${counts[a.track]} of ${a.goal}` }));
  }
  const earned = ((state && state.ach) || {}).earned || {};
  for (const a of SURPRISE) {
    const met = a.test ? a.test(state || {}) : !!earned[a.id];
    // A stratum secret or a hero secret: each stratum's (or hero's) copy, earned (when) or not, as
    // the pages of the 🏆 sheet's card of it, and a count: "2 of 5 strata", "4 of 10 heroes".
    const pages = STRATUM_SURPRISES.includes(a.id) ? WINGS.map((w) => ({ wing: w.id, id: inStratum(a.id, w.id), name: SHORT[w.id] }))
      : HERO_SURPRISES.includes(a.id) ? DIGITS.map((d) => ({ hero: d, id: forHero(a.id, d), name: HEROES[d].n })) : null;
    if (pages) {
      for (const p of pages) p.at = earned[p.id] || 0;
      const n = pages.filter((x) => x.at).length, unit = STRATUM_SURPRISES.includes(a.id) ? "strata" : "heroes";
      out.push(entry(a, { goal: 1, have: met ? 1 : 0, met, secret: true, pages, unit, progress: `${n} of ${pages.length} ${unit}`, figure: a.figure || null }));
      continue;
    }
    // Laundry Day counts up once a piece is owned: "Clothes: 14 of 25".
    if (a.id === "surprise:clothes") {
      const n = clothesOf(state), all = findable().length;
      out.push(entry(a, { goal: all, have: n, met: n >= all, secret: true, started: n > 0, progress: `Clothes: ${n} of ${all}` }));
      continue;
    }
    // Snuggle Squad counts up from the second plushie: "Plushies: 4 of 10".
    if (a.id === "surprise:plushies") {
      const n = plushiesOf(state), all = PLUSHIES.length;
      out.push(entry(a, { goal: all, have: n, met: n >= all, secret: true, started: n > 1, progress: `Plushies: ${n} of ${all}` }));
      continue;
    }
    // Every Quip counts up once a hero's quips are all heard: "Heroes heard in full: 3 of 10".
    if (a.id === "surprise:allquips") {
      const n = quipHeroes(state).length, all = Object.keys(QUIPS).length;
      out.push(entry(a, { goal: all, have: n, met: n >= all, secret: true, started: n > 0, progress: `Heroes heard in full: ${n} of ${all}` }));
      continue;
    }
    out.push(entry(a, { goal: 1, have: met ? 1 : 0, met, secret: true, figure: a.figure || null }));
  }
  // Each stratum's copy of the stratum secrets, for its card (the 🏆 sheet shows them on their
  // surprise's card: `of`).
  for (const a of SURPRISE_IN) { const met = !!earned[a.id]; out.push(entry(a, { goal: 1, have: met ? 1 : 0, met, secret: true, figure: a.figure || null })); }
  // Each hero's Quip Fan: met once that hero's quips are all heard (award earns it then).
  for (const a of QUIPS_IN) { const met = a.test(state || {}); out.push(entry(a, { goal: 1, have: met ? 1 : 0, met, secret: true, figure: a.figure })); }
  return out;
}
function entry(a, o) {
  return Object.assign({ id: a.id, icon: a.icon, title: a.title, name: a.name || a.title, where: a.where || null, of: a.of || null, detail: a.detail, kind: a.kind || "mastery", wing: a.wing || null, hero: a.hero ?? null, track: a.track || null, tier: a.tier ?? null, secret: false, reward: rewardOf(a.id), spoken: spokenParts(a), share: Math.min(1, o.have / o.goal) }, o);
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
// The saved achievements, cleaned: { earned: { id: time }, seen: [ids], days: [day numbers,
// dayNumber], comebacks: count }.
export function freshAchievements(saved) {
  const s = saved && typeof saved === "object" ? saved : {}, earned = {};
  for (const [k, t] of Object.entries(s.earned && typeof s.earned === "object" ? s.earned : {})) if (byId[k] && typeof t === "number" && t > 0) earned[k] = t;
  const seen = Array.isArray(s.seen) ? [...new Set(s.seen.filter((k) => earned[k]))] : [];
  return { earned, seen, days: keepDays(Array.isArray(s.days) ? s.days : []), comebacks: Math.max(0, Math.floor(Number(s.comebacks) || 0)) };
}
// The ids that get a card of their own: all but the stratum and hero secrets as a whole (their
// strata's and heroes' copies have the cards).
export const CARD_IDS = ALL.map((a) => a.id).filter((id) => !WHOLES.includes(id));
// The earned ones not yet shown on a card, in the catalog's order (the stratum ones first).
export function unseen(ach) { return CARD_IDS.filter((id) => ach.earned[id] && !ach.seen.includes(id)); }
export const achievementOf = (id) => byId[id] || null;
export const ACHIEVEMENT_IDS = ALL.map((a) => a.id);
