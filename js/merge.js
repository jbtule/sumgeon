// No DOM. Combining two copies of one player's saved progress, for syncing a linked player
// between devices (sync.js; DESIGN.md §15.4). Patterned on sound-box-crosswords' merge.js.
//
// The app keeps saving plain values (a fact's n = 5, wallet = 120). A sync record keeps every
// tally per device ({ a: 3, b: 2 }), so two copies combine by taking each device's larger share,
// and syncing twice never counts anything twice. A device works out its own share as its total
// less the other devices' shares in the last record it merged (`base`), so the app doesn't change.
//
//   toRecord(data, base, me)  the player's saved data (OWN_KEYS, by key) → a record (base: the
//                             last merged record or null; me: this device's id)
//   merge(a, b)               two records → one; order doesn't matter, and merging a record with
//                             itself (or merging the same one twice) changes nothing
//   fromRecord(rec, data)     a record → saved data (data: this device's own, to keep the order
//                             of lists the record holds as sets)
//
// How each saved key combines:
//   settings     each setting on its own, the latest edit wins (an edit counter, never the clock)
//   facts        n and c (seen, right) are per-device tallies; b (box), ms (average time), t
//                (last seen) and the rest come from the copy with the latest t, so the most
//                recent practice wins
//   wings        per stratum: boss wins are a tally; best, depth, megas, steps and each floor's
//                and depth's stars only grow; the runs each step waited (waits) only grow;
//                legend (when beaten) keeps the earliest; unlocked stays; legendOpen stays until
//                the Legend is beaten
//   bestiary     met keeps the earliest; beaten is a tally
//   best         only grows
//   heroes       captain, color, each digit on the team and each curse's cracks: the latest edit
//                wins (a hero can leave the team: losing curses the captain)
//   moments      heard quips, captains' first moments and heroes picked only grow; each deck,
//                each debut waiting, dry and last: the latest edit wins
//   spells       backwards counts and casts are tallies; the learned handwriting stays on each
//                device (see SPELL_TEMPLATES below)
//   told         how many times each thing was explained: the larger
//   wallet       a ledger (below), so coins are never made or lost by syncing
//   items        each item a ledger like the wallet; the quick-use slots: the latest edit wins
//   wardrobe     pieces owned and plushies owned only grow; what each hero wears: the latest edit wins
//   shop         the stock on sale: the latest edit wins
//   achievements earned ones only grow, each keeping its earliest time; seen (shown on a card)
//                only grows. Their rewards (achievements.js rewardOf) are credited to the wallet
//                and the items by the achievements earned, not by the device that awarded them
//                (below), so an achievement two devices both awarded pays once. The surprises seen
//                in play are in earned too. The practice days are a set (a union, cut to the
//                earliest DAYS_KEPT); the comebacks a tally per device
//   dungeon      the dungeon version (DUNGEON_VERSION): a record from before a bump gives way
//                to one after it, for what the bump resets (DUNGEON_KEYS and heroes; facts too
//                across LEARNING_RESETS), as upgradeDungeon resets them on a device
// Not synced: the run in progress (it lives only in the page), names (the device's own), and
// the link itself (link, syncBase).
//
// The wallet (and each item): per device, coins earned (e) and spent (s), both only growing, and
// f, the overspend forgiven. A device's own change since base goes to e when it's up and s when
// it's down, so every coin found is counted once, by the device that found it, and every coin
// spent once. The wallet is sum(e) − sum(s) + f. Two devices spending the same coins while
// apart would take it below zero; f is then raised just enough to bring it back to zero
// (merge takes the larger f, so two devices forgiving the same overspend forgive it once).
// Nothing is ever duplicated beyond that overspend, and nothing earned is ever lost.
//
// Achievements' rewards: a device that awards an achievement adds its coins and items to its own
// wallet and inventory at once. In the record they're kept apart, as the earnings of a device of
// their own, REWARDS ("★"), whose share is always worked out from the achievements earned
// (rewardsOf): never more, never less. So a device's own change since base leaves them out, and
// two devices awarding the same achievement while apart are paid for it once when they merge.
//
// "Latest" for edits is an edit counter, [n, device]: one more than the highest in the base,
// the device id breaking ties, never the device's clock, which may be wrong. A fact's "latest"
// is its last-seen time, since that is the practice itself; ties go to the larger copy.
import { DUNGEON_VERSION, DUNGEON_KEYS, LEARNING_RESETS } from "./store.js";
import { rewardsOf, freshAchievements, keepDays } from "./achievements.js";

// The record's format. Every device merges and saves records back, and an older app would drop
// what it doesn't know, so a change here needs a new version (older apps then leave the record
// alone until they update: NewerRecord in sync.js) and its shape in SHAPE in the test.
// 2 (2026-11-27): achievements (ach), and their rewards in the wallet and items (REWARDS).
// 3 (2026-11-27): the achievements' practice days (ach.d) and comebacks (ach.c).
// 4 (2026-11-27): the plushies owned (plush), from the wardrobe's plush.
// 5 (2026-11-28): the stratum secrets: a surprise earned in each stratum ("surprise:zero@cellar")
//    in ach.e, each paying its reward (achievements.js rewardsOf). The shape is the same, but an
//    older app would drop those ids and pay for them once, so it waits for its update.
export const RECORD_VERSION = 5;
// The keys a record carries (store.js OWN_KEYS minus the device's own). The test checks every
// saved key is here or in LOCAL_KEYS.
export const SYNCED_KEYS = ["settings", "best", "facts", "heroes", "wings", "bestiary", "dungeon", "spells", "told", "moments", "wallet", "items", "wardrobe", "shop", "achievements"];
// Saved per player but never synced: the link itself, which is this device's own, and the run in
// progress (app.js saveRun), this device's game.
export const LOCAL_KEYS = ["link", "syncBase", "run"];
// The learned handwriting (spells.templates) stays on each device: three drawings of each digit
// are about 30 KB, more than all the rest together, and handwriting on one screen isn't the
// same as on another.
export const SPELL_TEMPLATES = false;

const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const obj = (o) => (o && typeof o === "object" && !Array.isArray(o) ? o : {});
const arr = (a) => (Array.isArray(a) ? a : []);
const keys = (...os) => [...new Set(os.flatMap((o) => Object.keys(obj(o))))].sort();
const num = (v) => (typeof v === "number" && isFinite(v) ? v : 0);
// JSON with keys in order, to compare values whatever order their keys were written in.
export function canon(v) {
  if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
  if (v && typeof v === "object") return "{" + Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
  return v === undefined ? "null" : JSON.stringify(v);
}
const same = (a, b) => canon(a) === canon(b);
const sortU = (a) => [...new Set(a)].sort((x, y) => (String(x) < String(y) ? -1 : String(x) > String(y) ? 1 : 0));

/* ---------- tallies: { device: count } ---------- */
const sum = (g) => Object.values(obj(g)).reduce((n, v) => n + num(v), 0);
// This device's share: its total less what the others had, as of the last merge.
function tally(total, base, me) {
  const out = {};
  let others = 0;
  for (const d of Object.keys(obj(base))) if (d !== me && num(base[d])) { out[d] = num(base[d]); others += out[d]; }
  const mine = Math.max(0, num(total) - others);
  if (mine) out[me] = mine;
  return out;
}
function maxEach(a, b) {
  const out = {};
  for (const d of keys(a, b)) { const v = Math.max(num(obj(a)[d]), num(obj(b)[d])); if (v) out[d] = v; }
  return out;
}
const tallyMap = (totals, base, me) => {
  const out = {};
  for (const k of keys(totals, base)) { const g = tally(obj(totals)[k], obj(base)[k], me); if (Object.keys(g).length) out[k] = g; }
  return out;
};
const mergeTallyMap = (a, b) => {
  const out = {};
  for (const k of keys(a, b)) { const g = maxEach(obj(a)[k], obj(b)[k]); if (Object.keys(g).length) out[k] = g; }
  return out;
};
const totalsOf = (m) => Object.fromEntries(Object.keys(obj(m)).map((k) => [k, sum(m[k])]));

/* ---------- ledgers: the wallet and each item ---------- */
// { e: { device: earned }, s: { device: spent }, f: forgiven }
const balance = (l) => sum(obj(l).e) - sum(obj(l).s) + num(obj(l).f);
function settle(l) {
  const e = obj(l.e), s = obj(l.s), f = Math.max(num(l.f), sum(s) - sum(e));
  const out = {};
  if (Object.keys(e).length) out.e = e;
  if (Object.keys(s).length) out.s = s;
  if (f > 0) out.f = f;
  return out;
}
function ledger(total, base, me) {
  const b = obj(base), delta = Math.max(0, Math.floor(num(total))) - balance(b);
  const e = { ...obj(b.e) }, s = { ...obj(b.s) };
  if (delta > 0) e[me] = num(e[me]) + delta;
  if (delta < 0) s[me] = num(s[me]) - delta;
  return settle({ e, s, f: b.f });
}
const mergeLedger = (a, b) => settle({ e: maxEach(obj(a).e, obj(b).e), s: maxEach(obj(a).s, obj(b).s), f: Math.max(num(obj(a).f), num(obj(b).f)) });
// The achievements' rewards in a ledger: REWARDS's earnings set to what the earned ones pay.
export const REWARDS = "★";
function withRewards(l, n) {
  const out = { ...obj(l), e: { ...obj(obj(l).e) } };
  if (n > 0) out.e[REWARDS] = n; else delete out.e[REWARDS];
  return out;
}
const mergeLedgers = (a, b) => {
  const out = {};
  for (const k of keys(a, b)) { const l = mergeLedger(obj(a)[k], obj(b)[k]); if (Object.keys(l).length) out[k] = l; }
  return out;
};

/* ---------- registers: the latest edit wins ---------- */
// { name: { v, r: [counter, device] } }; a value that's gone is null.
const later = (a, b) => (a[0] !== b[0] ? a[0] > b[0] : String(a[1]) > String(b[1]));
const pick = (a, b) => (!a ? b : !b ? a : later(b.r, a.r) ? b : later(a.r, b.r) ? a : canon(b.v) > canon(a.v) ? b : a);
const topRev = (regs) => Object.values(obj(regs)).reduce((n, e) => Math.max(n, num(e && e.r && e.r[0])), 0);
// The registers a player's data holds, by name.
const HERO_DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
function registersOf(d) {
  const out = {};
  const s = obj(d.settings);
  for (const k of Object.keys(s)) out["settings." + k] = s[k];
  const h = obj(d.heroes);
  if (own(h, "captain")) out["heroes.captain"] = h.captain;
  if (own(h, "color")) out["heroes.color"] = h.color;
  if (d.heroes) {
    for (const n of HERO_DIGITS) {
      out["heroes.rescued." + n] = arr(h.rescued).includes(n);
      out["heroes.cracks." + n] = num(obj(h.cracks)[n]);
    }
  }
  const m = obj(d.moments);
  for (const k of Object.keys(obj(m.decks))) out["moments.decks." + k] = m.decks[k];
  if (d.moments) {
    for (const n of HERO_DIGITS) out["moments.debut." + n] = arr(m.debut).includes(n);
    out["moments.dry"] = num(m.dry);
    out["moments.last"] = m.last == null ? null : m.last;
  }
  // Every hero's outfit, even an empty one (null), so taking everything off syncs too.
  if (d.wardrobe) for (const n of HERO_DIGITS) out["wardrobe.wear." + n] = obj(obj(d.wardrobe).wear)[n] || null;
  if (d.items) out["items.slots"] = arr(obj(d.items).slots);
  if (d.shop) out["shop.stock"] = arr(obj(d.shop).stock);
  if (SPELL_TEMPLATES) for (const n of Object.keys(obj(obj(d.spells).templates))) out["spells.templates." + n] = d.spells.templates[n];
  return out;
}
// A record's registers from this device's: unchanged ones keep their edit, changed ones get a
// new one. A register the base had and this device doesn't is left as it was (the device just
// hasn't got that part of the data, e.g. a deck not drawn from yet). A device's first record (no
// base: just linked) counts as no edit at all (0), so a player arriving on a device takes the
// linked player's settings, outfits and slots rather than this device's defaults.
function registers(d, base, me) {
  const now = registersOf(d), b = obj(base), rev = [base ? topRev(b) + 1 : 0, me], out = {};
  for (const k of keys(now, b)) {
    if (!own(now, k)) { out[k] = b[k]; continue; }
    const v = now[k] === undefined ? null : now[k];
    out[k] = b[k] && same(b[k].v, v) ? b[k] : { v, r: rev };
  }
  return out;
}
const mergeRegisters = (a, b) => Object.fromEntries(keys(a, b).map((k) => [k, pick(obj(a)[k], obj(b)[k])]));
const isDungeonReg = (k) => k.startsWith("heroes.");

/* ---------- facts: { key: [b, ms, t, { device: [n, c] }, rest] } ---------- */
// rest: the record's other fields ({ placed: 1 }), when it has any. In the record t is in whole
// minutes and ms in tenths of a second, which is all the learning engine needs (a review is due 10
// minutes or a day after; fluent is 4 s or more), and it keeps a busy player's record small (pack
// below). The device gets them back rounded the same way.
const FACT_OWN = ["b", "n", "c", "ms", "t"];
const toMin = (t) => Math.round(num(t) / 60000), toMs100 = (ms) => Math.round(num(ms) / 100) * 100;
function factRecord(f, base, me) {
  const bt = obj(base && base[3]);
  const g = (i) => Object.fromEntries(Object.keys(bt).map((dev) => [dev, num(bt[dev][i])]));
  const n = tally(f.n, g(0), me), c = tally(f.c, g(1), me), t = {};
  for (const dev of keys(n, c)) t[dev] = [num(n[dev]), num(c[dev])];
  const rest = Object.fromEntries(Object.keys(f).filter((k) => !FACT_OWN.includes(k)).sort().map((k) => [k, f[k]]));
  const out = [num(f.b), toMs100(f.ms), toMin(f.t), t];
  if (Object.keys(rest).length) out.push(rest);
  return out;
}
function mergeFact(a, b) {
  if (!a || !b) return a || b;
  const ta = obj(a[3]), tb = obj(b[3]), t = {};
  for (const dev of keys(ta, tb)) {
    const x = arr(ta[dev]), y = arr(tb[dev]);
    t[dev] = [Math.max(num(x[0]), num(y[0])), Math.max(num(x[1]), num(y[1]))];
  }
  // The latest practice wins box and time; a tie goes to the larger, so either order agrees.
  const pa = [a[0], a[1], a[2], a[4] || null], pb = [b[0], b[1], b[2], b[4] || null];
  const win = a[2] !== b[2] ? (a[2] > b[2] ? pa : pb) : canon(pa) >= canon(pb) ? pa : pb;
  const out = [win[0], win[1], win[2], t];
  if (win[3]) out.push(win[3]);
  return out;
}
const mergeFacts = (a, b) => Object.fromEntries(keys(a, b).map((k) => [k, mergeFact(obj(a)[k], obj(b)[k])]));
function factOut(r) {
  const t = obj(r[3]), f = { b: num(r[0]), n: 0, c: 0, ms: num(r[1]), t: num(r[2]) * 60000 };
  for (const dev of Object.keys(t)) { f.n += num(t[dev][0]); f.c += num(t[dev][1]); }
  return Object.assign(f, obj(r[4]));
}

/* ---------- wings: per stratum ---------- */
// Numbers that only grow, lists of numbers that only grow (each floor's best stars), maps that
// only grow (each depth's best stars, the runs each path step waited for its monsters), the boss
// wins (a tally), the Legend (earliest), flags.
const W_MAX = ["best", "depth", "megas", "steps"], W_FLAGS = ["unlocked", "legendOpen"];
function maxList(a, b) {
  const x = arr(a), y = arr(b), out = [];
  for (let i = 0; i < Math.max(x.length, y.length); i++) out.push(Math.max(num(x[i]), num(y[i])));
  return out;
}
const maxMap = (a, b) => Object.fromEntries(keys(a, b).map((k) => [k, Math.max(num(obj(a)[k]), num(obj(b)[k]))]));
const earliest = (a, b) => (num(a) && num(b) ? Math.min(a, b) : num(a) || num(b) || 0);
function wingRecord(p, base, me) {
  const b = obj(base), out = {};
  for (const k of W_MAX) { const v = Math.max(num(p[k]), num(b[k])); if (v) out[k] = v; }
  const boss = tally(p.boss, b.boss, me);
  if (Object.keys(boss).length) out.boss = boss;
  if (arr(p.stars).length || arr(b.stars).length) out.stars = maxList(p.stars, b.stars);
  if (Object.keys(obj(p.depthStars)).length || Object.keys(obj(b.depthStars)).length) out.depthStars = maxMap(p.depthStars, b.depthStars);
  if (Object.keys(obj(p.waits)).length || Object.keys(obj(b.waits)).length) out.waits = maxMap(p.waits, b.waits);
  const legend = earliest(p.legend, b.legend);
  if (legend) out.legend = legend;
  for (const k of W_FLAGS) if (p[k] || b[k]) out[k] = true;
  if (out.legend) delete out.legendOpen;
  // Anything newer this version doesn't know: kept as this device has it.
  for (const k of Object.keys(p)) if (!own(out, k) && ![...W_MAX, ...W_FLAGS, "boss", "stars", "depthStars", "waits", "legend"].includes(k)) out[k] = p[k];
  return out;
}
function mergeWing(a, b) {
  if (!a || !b) return a || b;
  const out = {};
  for (const k of W_MAX) { const v = Math.max(num(a[k]), num(b[k])); if (v) out[k] = v; }
  const boss = maxEach(a.boss, b.boss);
  if (Object.keys(boss).length) out.boss = boss;
  if (a.stars || b.stars) out.stars = maxList(a.stars, b.stars);
  if (a.depthStars || b.depthStars) out.depthStars = maxMap(a.depthStars, b.depthStars);
  if (a.waits || b.waits) out.waits = maxMap(a.waits, b.waits);
  const legend = earliest(a.legend, b.legend);
  if (legend) out.legend = legend;
  for (const k of W_FLAGS) if (a[k] || b[k]) out[k] = true;
  if (out.legend) delete out.legendOpen;
  for (const k of keys(a, b)) if (!own(out, k) && ![...W_MAX, ...W_FLAGS, "boss", "stars", "depthStars", "waits", "legend"].includes(k)) out[k] = canon(a[k]) >= canon(b[k]) ? a[k] : b[k];
  return out;
}
function wingOut(r) {
  const out = { ...r, boss: sum(r.boss), best: num(r.best) };
  return out;
}

/* ---------- a whole player ---------- */
// What part of a record goes with the dungeon version: what upgradeDungeon resets.
function learningReset(from, to) { return LEARNING_RESETS.some((v) => v > from && v <= to); }

export function toRecord(data, base, me) {
  const d = obj(data), dungeon = num(d.dungeon) || DUNGEON_VERSION;
  let b = obj(base);
  // The base was from before a dungeon bump this device has made since: what the bump reset
  // starts over rather than taking the others' old shares back.
  if (base && num(b.dungeon) !== dungeon) {
    const keep = { ...b, dungeon };
    for (const k of DUNGEON_KEYS) delete keep[k];
    keep.reg = Object.fromEntries(Object.entries(obj(b.reg)).filter(([k]) => !isDungeonReg(k)));
    if (learningReset(num(b.dungeon), dungeon)) delete keep.facts;
    b = keep;
  }
  const facts = {};
  for (const k of keys(d.facts, b.facts)) {
    const f = obj(d.facts)[k];
    facts[k] = f ? factRecord(f, obj(b.facts)[k], me) : b.facts[k];
  }
  const wings = {};
  for (const k of keys(d.wings, b.wings)) wings[k] = wingRecord(obj(obj(d.wings)[k]), obj(b.wings)[k], me);
  const bestiary = {};
  for (const k of keys(d.bestiary, b.bestiary)) {
    const s = obj(obj(d.bestiary)[k]), bs = obj(obj(b.bestiary)[k]), e = {};
    const met = earliest(s.met, bs.met);
    if (met) e.met = met;
    const beaten = tally(s.beaten, bs.beaten, me);
    if (Object.keys(beaten).length) e.beaten = beaten;
    bestiary[k] = e;
  }
  const m = obj(d.moments), bm = obj(b.moments);
  const heard = {};
  for (const k of keys(m.heard, bm.heard)) heard[k] = sortU([...arr(obj(m.heard)[k]), ...arr(obj(bm.heard)[k])]);
  const sp = obj(d.spells), bsp = obj(b.spells);
  const ach = achRecord(d.achievements, b.ach, me), paid = rewardsOf(Object.keys(ach.e));
  const items = {};
  const have = obj(obj(d.items).have);
  for (const k of keys(have, b.items, paid.items)) { const l = ledger(have[k], withRewards(obj(b.items)[k], num(paid.items[k])), me); if (Object.keys(l).length) items[k] = l; }
  const best = Math.max(num(d.best), num(b.best));
  return {
    v: RECORD_VERSION,
    dungeon,
    reg: registers(d, b.reg, me),
    facts,
    wings,
    bestiary,
    ...(best ? { best } : {}),
    told: maxMap(d.told, b.told),
    moments: { heard, captains: sortU([...arr(m.captains), ...arr(bm.captains)]), named: sortU([...arr(m.named), ...arr(bm.named)]) },
    spells: { reversed: tallyMap(sp.reversed, bsp.reversed, me), cast: tally(sp.cast, bsp.cast, me) },
    wallet: ledger(d.wallet, withRewards(b.wallet, paid.cents), me),
    items,
    owned: sortU([...arr(obj(d.wardrobe).owned), ...arr(b.owned)]),
    plush: sortU([...arr(obj(d.wardrobe).plush), ...arr(b.plush)]),
    ach
  };
}
// Achievements in a record: { e: { id: earliest time }, s: [ids seen], d: [practice days],
// c: { device: comebacks } } (d and c only when there are any).
function achRecord(saved, base, me) {
  const a = freshAchievements(saved), b = obj(base), e = {};
  for (const k of keys(a.earned, b.e)) { const t = earliest(a.earned[k], obj(b.e)[k]); if (t) e[k] = t; }
  return achExtras({ e, s: sortU([...a.seen, ...arr(b.s)].filter((k) => e[k])) }, keepDays(a.days, arr(b.d)), tally(a.comebacks, b.c, me));
}
function mergeAch(a, b) {
  const e = {};
  for (const k of keys(obj(a).e, obj(b).e)) { const t = earliest(obj(obj(a).e)[k], obj(obj(b).e)[k]); if (t) e[k] = t; }
  return achExtras({ e, s: sortU([...arr(obj(a).s), ...arr(obj(b).s)].filter((k) => e[k])) }, keepDays(arr(obj(a).d), arr(obj(b).d)), maxEach(obj(a).c, obj(b).c));
}
function achExtras(out, d, c) {
  if (d.length) out.d = d;
  if (Object.keys(c).length) out.c = c;
  return out;
}

// A device's first sync of a player (just linked, or linked by merging a player it had): the
// linked player's settings, hero, outfits, decks and slots win over this device's, which were
// never edits of that player's. Earned things and tallies still add up as usual.
export function adopt(mine, server) {
  if (!mine || !server) return mine;
  return { ...mine, reg: { ...obj(mine.reg), ...obj(server.reg) } };
}

export function merge(a, b) {
  if (!a || !b) return a || b || null;
  // A record from before a dungeon bump gives way to one after it, for what the bump resets.
  const da = num(a.dungeon), db = num(b.dungeon);
  const hi = da >= db ? a : b, lo = da >= db ? b : a, bumped = da !== db;
  const fromHi = (k, f) => (bumped ? hi[k] : f(a[k], b[k]));
  const reg = mergeRegisters(a.reg, b.reg);
  if (bumped) {
    for (const k of Object.keys(reg)) if (isDungeonReg(k)) { if (obj(hi.reg)[k]) reg[k] = hi.reg[k]; else delete reg[k]; }
  }
  const out = {
    v: RECORD_VERSION,
    dungeon: Math.max(da, db),
    reg,
    facts: bumped && learningReset(num(lo.dungeon), num(hi.dungeon)) ? hi.facts : mergeFacts(a.facts, b.facts),
    wings: fromHi("wings", (x, y) => Object.fromEntries(keys(x, y).map((k) => [k, mergeWing(obj(x)[k], obj(y)[k])]))),
    bestiary: fromHi("bestiary", (x, y) => Object.fromEntries(keys(x, y).map((k) => {
      const s = obj(obj(x)[k]), t = obj(obj(y)[k]), e = {};
      const met = earliest(s.met, t.met);
      if (met) e.met = met;
      const beaten = maxEach(s.beaten, t.beaten);
      if (Object.keys(beaten).length) e.beaten = beaten;
      return [k, e];
    }))),
    told: maxMap(a.told, b.told),
    moments: {
      heard: Object.fromEntries(keys(obj(a.moments).heard, obj(b.moments).heard).map((k) => [k, sortU([...arr(obj(obj(a.moments).heard)[k]), ...arr(obj(obj(b.moments).heard)[k])])])),
      captains: sortU([...arr(obj(a.moments).captains), ...arr(obj(b.moments).captains)]),
      named: sortU([...arr(obj(a.moments).named), ...arr(obj(b.moments).named)])
    },
    spells: { reversed: mergeTallyMap(obj(a.spells).reversed, obj(b.spells).reversed), cast: maxEach(obj(a.spells).cast, obj(b.spells).cast) },
    wallet: null,
    items: null,
    owned: sortU([...arr(a.owned), ...arr(b.owned)]),
    plush: sortU([...arr(a.plush), ...arr(b.plush)]),
    ach: mergeAch(a.ach, b.ach)
  };
  // The rewards are what the achievements earned (on either side) pay, counted once.
  const paid = rewardsOf(Object.keys(out.ach.e));
  out.wallet = settle(withRewards(mergeLedger(a.wallet, b.wallet), paid.cents));
  out.items = mergeLedgers(a.items, b.items);
  for (const k of keys(out.items, paid.items)) { const l = settle(withRewards(out.items[k], num(paid.items[k]))); if (Object.keys(l).length) out.items[k] = l; else delete out.items[k]; }
  const best = bumped ? num(hi.best) : Math.max(num(a.best), num(b.best));
  if (best) out.best = best;
  for (const k of ["wings", "bestiary"]) if (!out[k]) out[k] = {};
  return out;
}

/* ---------- packing: the record as it's sealed and sent ---------- */
// The same record, smaller: the facts as one list in the order they were last seen, each with its
// time as minutes after the one before (practice comes in sittings, so most are 0 or a few), its
// average time in tenths of a second, and its tallies as one list lined up with `devs` (the
// devices that have practiced any fact). A busy player's facts are nearly all of a record
// (scripts/sync-size.mjs). unpack(pack(r)) is r.
//   pf: { devs, f: [[key, box, ms / 100, minutes since the last, [n, c per device], rest?], ...] }
// A fact never timed (t 0) comes first, with -1.
export function pack(rec) {
  if (!rec) return rec;
  const fs = obj(rec.facts), devs = keys(...Object.values(fs).map((f) => obj(f[3])));
  const order = Object.keys(fs).sort((a, b) => num(fs[a][2]) - num(fs[b][2]) || (a < b ? -1 : a > b ? 1 : 0));
  const f = [];
  let prev = 0;
  for (const k of order) {
    const x = fs[k], ts = obj(x[3]), flat = [], t = num(x[2]);
    devs.forEach((d) => { const y = arr(ts[d]); flat.push(num(y[0]), num(y[1])); });
    while (flat.length && !flat[flat.length - 1]) flat.pop();
    const e = [k, x[0], num(x[1]) / 100, t ? t - prev : -1, flat];
    if (t) prev = t;
    if (x[4]) e.push(x[4]);
    f.push(e);
  }
  return { ...rec, facts: undefined, pf: { devs, f } };
}
export function unpack(rec) {
  if (!rec || !rec.pf) return rec;
  const { devs, f } = rec.pf, facts = {};
  let prev = 0;
  for (const e of arr(f)) {
    const ts = {};
    devs.forEach((d, i) => { const n = num(e[4][2 * i]), c = num(e[4][2 * i + 1]); if (n || c) ts[d] = [n, c]; });
    const t = e[3] < 0 ? 0 : prev + e[3];
    if (t) prev = t;
    const out = [e[1], Math.round(e[2] * 100), t, ts];
    if (e[5]) out.push(e[5]);
    facts[e[0]] = out;
  }
  const { pf, ...rest } = rec;
  return { ...rest, facts };
}

// A list in this device's order, with what the record adds at the end.
const ordered = (mine, all) => [...arr(mine).filter((x) => all.includes(x)), ...all.filter((x) => !arr(mine).includes(x))];
const unflat = (reg, pre) => Object.fromEntries(Object.keys(obj(reg)).filter((k) => k.startsWith(pre)).map((k) => [k.slice(pre.length), reg[k].v]));

export function fromRecord(rec, data) {
  const r = obj(rec), d = obj(data), reg = obj(r.reg);
  const settings = {};
  for (const [k, v] of Object.entries(unflat(reg, "settings."))) if (v !== null) settings[k] = v;
  const rescued = unflat(reg, "heroes.rescued."), cracks = unflat(reg, "heroes.cracks.");
  const heroes = {
    ...obj(d.heroes),
    captain: reg["heroes.captain"] ? reg["heroes.captain"].v : obj(d.heroes).captain ?? null,
    rescued: ordered(obj(d.heroes).rescued, HERO_DIGITS.filter((n) => rescued[n])),
    cracks: Object.fromEntries(HERO_DIGITS.filter((n) => num(cracks[n])).map((n) => [n, cracks[n]]))
  };
  if (reg["heroes.color"]) heroes.color = reg["heroes.color"].v;
  const m = obj(d.moments), rm = obj(r.moments), debut = unflat(reg, "moments.debut.");
  const heard = {};
  for (const k of Object.keys(obj(rm.heard))) heard[k] = ordered(obj(m.heard)[k], rm.heard[k]);
  const moments = {
    ...m,
    decks: unflat(reg, "moments.decks."),
    heard,
    debut: ordered(m.debut, HERO_DIGITS.filter((n) => debut[n])),
    dry: reg["moments.dry"] ? num(reg["moments.dry"].v) : num(m.dry),
    last: reg["moments.last"] ? reg["moments.last"].v : m.last ?? null,
    captains: ordered(m.captains, arr(rm.captains)),
    named: ordered(m.named, arr(rm.named))
  };
  const sp = obj(d.spells), rs = obj(r.spells);
  const spells = { templates: SPELL_TEMPLATES ? unflat(reg, "spells.templates.") : obj(sp.templates), reversed: totalsOf(rs.reversed), cast: sum(rs.cast) };
  const have = {};
  for (const k of Object.keys(obj(r.items))) { const n = balance(r.items[k]); if (n > 0) have[k] = n; }
  const wear = unflat(reg, "wardrobe.wear.");
  const out = {
    settings,
    facts: Object.fromEntries(Object.keys(obj(r.facts)).map((k) => [k, factOut(r.facts[k])])),
    heroes,
    wings: Object.fromEntries(Object.keys(obj(r.wings)).map((k) => [k, wingOut(r.wings[k])])),
    bestiary: Object.fromEntries(Object.keys(obj(r.bestiary)).map((k) => [k, { met: num(r.bestiary[k].met), beaten: sum(r.bestiary[k].beaten) }])),
    dungeon: num(r.dungeon) || DUNGEON_VERSION,
    spells,
    told: { ...obj(r.told) },
    moments,
    wallet: Math.max(0, balance(r.wallet)),
    items: { have, slots: reg["items.slots"] ? arr(reg["items.slots"].v) : arr(obj(d.items).slots) },
    wardrobe: { owned: ordered(obj(d.wardrobe).owned, arr(r.owned)), wear: Object.fromEntries(Object.entries(wear).filter(([, v]) => v)), plush: ordered(obj(d.wardrobe).plush, arr(r.plush)) },
    shop: { ...obj(d.shop), stock: reg["shop.stock"] ? arr(reg["shop.stock"].v) : arr(obj(d.shop).stock) },
    achievements: { earned: { ...obj(obj(r.ach).e) }, seen: ordered(obj(d.achievements).seen, arr(obj(r.ach).s)), days: keepDays(arr(obj(r.ach).d)), comebacks: sum(obj(r.ach).c) }
  };
  if (r.best) out.best = r.best;
  // A part neither this device nor the record has stays left out, as it was (a player who hasn't
  // picked a hero has no heroes saved), so it doesn't come back next time as a new edit of
  // defaults that could win over another device's real choice.
  const has = (pre) => d[pre] != null || Object.keys(reg).some((k) => k.startsWith(pre + "."));
  if (!has("heroes")) delete out.heroes;
  if (!has("moments") && !Object.keys(obj(rm.heard)).length && !arr(rm.captains).length && !arr(rm.named).length) delete out.moments;
  if (!has("items") && !Object.keys(have).length) delete out.items;
  if (!has("wardrobe") && !arr(r.owned).length && !arr(r.plush).length) delete out.wardrobe;
  if (!has("shop")) delete out.shop;
  if (d.achievements == null && !Object.keys(obj(obj(r.ach).e)).length && !arr(obj(r.ach).d).length && !sum(obj(r.ach).c)) delete out.achievements;
  if (d.spells == null && !Object.keys(obj(rs.reversed)).length && !sum(rs.cast)) delete out.spells;
  return out;
}

// The wallet a record holds, and each item's count (for the tests and the status).
export const walletOf = (rec) => Math.max(0, balance(obj(rec).wallet));
