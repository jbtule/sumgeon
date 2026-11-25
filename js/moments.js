// Hero Moments (DESIGN.md §8.4): now and then a hero in your answer gets a slow-motion close-up
// and a quip before it strikes. This is when it happens and what it says; the show itself is
// slowmo.js. No DOM: runs in Node for the tests and the review page's rarity simulator.
//
// A moment's saved state, per player (store.js "moments"):
//   { decks: { digit: [quips left, in order] }, heard: { digit: [quips heard] },
//     debut: [digits freed and not yet seen in a moment], dry: qualifying hits since the last
//     moment that rolled and missed, last: the hero of the last moment }
// A run's state (not saved): { last: the problem number of the last moment, floor, onFloor,
//   }.
import { pool, monsterHP } from "./learn.js";
import { WINGS, runFloors, depthScale } from "./wings.js";

// The chance on a qualifying hit: CHANCE, plus BUILD for each one that rolled without a moment,
// back to CHANCE after one. None in the REST problems after a moment, at most PER_FLOOR a floor.
export const CHANCE = 0.08, BUILD = 0.04, REST = 6, PER_FLOOR = 2;

// Math-obsessed, in each hero's character. Played from a shuffled deck per hero, so none repeats
// until all have been heard. The voice says them as written, through lines.js SAY_AS.
export const QUIPS = {
  0: ["Zeroic, so heroic!", "Zero to hero!", "Times zero? You're done!", "Nothing can stop me. Literally nothing!"],
  1: ["One and done!", "Times one? Still me!", "I'm number one. Literally!"],
  2: ["Abraca-double!", "Now you see two, now you don't!", "Twice the trick!"],
  3: ["X marks the three!", "Third time's the charm!", "Treasure comes in threes!"],
  4: ["Four-ward, charge!", "Two squared, never cornered!", "Four sides, all defended!"],
  5: ["Up top!", "Count by fives, fight by fives!", "Halfway to ten, all the way to victory!"],
  6: ["Elementary, my dear divisor!", "One plus two plus three. A perfect six!", "I've deduced your weak factor!"],
  7: ["It's alive! And it's prime!", "Lucky seven stomp!", "Six, seven!"],
  8: ["Bon appe-eight!", "Two cubed, served hot!", "Order up: one sizzling eight!"],
  9: ["Nine lives, zero mercy!", "Three threes, one strike!", "Now you see nine…"]
};
// The big moments: a boss's finishing blow, and a moment on the hit that turns crits on.
export const FINAL = "Final answer!", CRIT = "Critical math!";

export function freshState(saved) {
  const s = saved || {};
  return { decks: Object.assign({}, s.decks), heard: Object.assign({}, s.heard), debut: (s.debut || []).slice(), dry: s.dry || 0, last: s.last == null ? null : s.last };
}
export function freshRun() { return { last: null, floor: null, onFloor: 0, }; }

// A freed hero's first answer after joining the team is always a moment (their debut).
export function joined(state, d) { if (!state.debut.includes(d)) state.debut.push(d); }

// The heroes on the team whose digit is in the answer, each once, in the answer's order.
export function heroesIn(typed, team) {
  const on = (d) => d === team.captain || (team.rescued || []).includes(d);
  return [...new Set([...String(typed)].map(Number))].filter((d) => Number.isInteger(d) && on(d));
}
// "Quips: 3 of 4": how many of a hero's quips this player has heard.
export function heardOf(state, d) {
  const h = new Set((state.heard || {})[d] || []);
  return { heard: QUIPS[d].filter((q) => h.has(q)).length, of: QUIPS[d].length };
}

// The next quip from hero d's deck, reshuffled when it runs out (never starting with the one
// just heard).
export function drawQuip(state, d, rnd) {
  const r = rnd || Math.random;
  let deck = (state.decks[d] || []).filter((q) => QUIPS[d].includes(q));
  if (!deck.length) {
    deck = QUIPS[d].slice();
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    const heard = state.heard[d] || [], last = heard[heard.length - 1];
    if (deck.length > 1 && deck[0] === last) deck.push(deck.shift());
  }
  const q = deck.shift();
  state.decks[d] = deck;
  state.heard[d] = (state.heard[d] || []).filter((x) => x !== q).concat([q]);
  return q;
}

// Whether this answer gets a moment, and whose. hit:
//   typed: the digits that fly; team: { captain, rescued }; hinted; spell: null, "good",
//   "backwards" or "show" (a poor match); first: the player's first fight; floor: which floor of
//   the run; n: this problem's number in the run; bossFinish: it finishes a boss; critStart: this
//   hit turns crits on (the third in a row); always: ?moments (every qualifying hit).
// Only for a right answer (the caller asks only then). Returns null, or
//   { hero, quip, why: "boss" | "debut" | "chance" }, and updates state and run.
export function decide(state, run, hit, rnd) {
  const r = rnd || Math.random;
  if (hit.floor !== run.floor) { run.floor = hit.floor; run.onFloor = 0; }
  if (hit.hinted || hit.first || hit.spell === "backwards" || hit.spell === "show") return null;
  const heroes = heroesIn(hit.typed, hit.team);
  const pick = (ds) => { const c = ds.length > 1 ? ds.filter((d) => d !== state.last) : ds; return c[Math.floor(r() * c.length)]; };
  let hero, why;
  const debut = heroes.filter((d) => state.debut.includes(d));
  if (hit.bossFinish && (heroes.length || hit.team.captain != null)) { hero = pick(heroes.length ? heroes : [hit.team.captain]); why = "boss"; }
  else if (debut.length) { hero = debut[0]; why = "debut"; }
  else {
    if (!heroes.length) return null;
    if (!hit.always) {
      if (run.last != null && hit.n - run.last <= REST) return null;
      if (run.onFloor >= PER_FLOOR) return null;
      if (r() >= CHANCE + BUILD * state.dry) { state.dry++; return null; }
    }
    hero = pick(heroes); why = "chance";
  }
  state.debut = state.debut.filter((d) => d !== hero);
  let quip;
  if (why === "boss") quip = FINAL;
  else if (hit.critStart && why === "chance") quip = CRIT;
  else quip = drawQuip(state, hero, r);
  state.dry = 0; state.last = hero;
  run.last = hit.n; run.onFloor++;
  return { hero, quip, why };
}

/* ---------- the rarity simulator (the review page, and the test) ----------
   Plays runs of answers through decide: a Wing's real floors and monster HP (everything in its
   band learned), answers drawn from its facts, crits after 3 in a row, hero bonuses. One player
   carries the state from run to run, as in the game. */
export function seeded(seed) { let s = seed >>> 0 || 1; return () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296); }
export function simulate(opts) {
  const o = Object.assign({ runs: 300, wing: "cellar", team: { captain: 5, rescued: [5, 0, 1] }, accuracy: 0.9, hinted: 0.05, seed: 1 }, opts);
  const r = seeded(o.seed), w = WINGS.find((x) => x.id === o.wing) || WINGS[0], state = freshState();
  const all = {}, recsFor = (bk) => all[bk] || (all[bk] = Object.fromEntries(pool(bk).map((f) => [f.key, { b: 3 }])));
  const out = { runs: o.runs, floors: 0, problems: 0, moments: 0, perRun: [], why: { boss: 0, debut: 0, chance: 0 }, heroes: {}, quips: {} };
  for (let k = 0; k < o.runs; k++) {
    const run = freshRun(), floors = runFloors(w, o.team, r, 1);
    let n = 0, streak = 0, got = 0;
    floors.forEach((m, i) => {
      const bk = m.strand || w.band, facts = pool(bk), recs = recsFor(bk);
      let hp = Math.round(monsterHP(m, bk, recs) * depthScale(i, floors.length));
      out.floors++;
      for (let guard = 0; hp > 0 && guard < 200; guard++) {
        n++; out.problems++;
        const mine = facts.filter((f) => f.op === m.op), from = mine.length && r() < 0.7 ? mine : facts;
        const f = from[Math.floor(r() * from.length)];
        const ans = typeof f.ans === "number" ? f.ans : 1 + Math.floor(r() * 20); // a comparison hits for its bigger number
        if (r() >= o.accuracy) { streak = 0; continue; }
        const hinted = r() < o.hinted;
        if (!hinted) streak++;
        const crit = streak >= 3, typed = String(ans), ds = [...typed].map(Number);
        const helpers = Math.min(3, ds.filter((d) => d !== o.team.captain && o.team.rescued.includes(d)).length);
        const dmg = Math.max(1, Math.round(ans * (crit ? 2 : 1) * (1 + helpers * 0.1) * (ds.includes(o.team.captain) ? 1.5 : 1)));
        const mo = decide(state, run, { typed, team: o.team, hinted, spell: null, first: false, floor: i, n, bossFinish: !!m.boss && hp - dmg <= 0, critStart: streak === 3 && !hinted }, r);
        hp -= dmg;
        if (mo) {
          got++; out.moments++; out.why[mo.why]++;
          out.heroes[mo.hero] = (out.heroes[mo.hero] || 0) + 1;
          out.quips[mo.quip] = (out.quips[mo.quip] || 0) + 1;
        }
      }
    });
    out.perRun.push(got);
  }
  out.perFloor = out.moments / out.floors;
  out.floorsPerMoment = out.floors / Math.max(1, out.moments);
  out.meanPerRun = out.moments / o.runs;
  out.chanceFloorsPer = out.floors / Math.max(1, out.why.chance);
  return out;
}
