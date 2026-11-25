// Hero Moments (DESIGN.md §8.4): now and then a hero in your answer gets a slow-motion close-up
// and a quip before it strikes. This is when it happens and what it says; the show itself is
// slowmo.js. No DOM: runs in Node for the tests and the review page's rarity simulator.
//
// A moment's saved state, per player (store.js "moments"):
//   { decks: { digit: [quips left, in order] }, heard: { digit: [quips heard] },
//     debut: [digits freed and not yet seen in a moment], dry: qualifying hits since the last
//     moment that rolled and missed, last: the hero of the last moment,
//     captains: [captains who've had their first captain's moment],
//     named: [heroes ever picked as captain] }
// A run's state (not saved): { last: the problem number of the last moment, floor, onFloor,
//   }.
import { pool, monsterHP } from "./learn.js";
import { WINGS, runFloors, depthScale, bandOf } from "./wings.js";
import { HEROES } from "./heroes.js";

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
// The big moments: a boss's finishing blow, and a moment on the hit that turns crits on. Every run
// ends with a boss, so its finishing lines are a deck of their own (key "final"), like a hero's.
export const FINALS = ["That's your final answer!", "And that's the sum of it!", "Divided and conquered!", "Subtracted to zero!",
  "Boss solved!", "Equals: victory!", "Proof complete!", "Zero hit points. Math wins!", "Game, set, math!",
  "Problem solved!", "Check your answer: correct!", "That's the bottom line for you!"];
export const FINAL = FINALS[0], CRIT = "Critical math!";
// Team-ups: a moment by chance on an answer with two different team heroes' digits is, half the
// time (TEAMUP), both heroes at once. Their lines are a deck of their own (key "team"), and an
// answer that is exactly one of TEAM_NUMBERS says that number's line instead. No per-pair lines.
export const TEAMUP = 0.5;
export const TEAM_LINES = ["Team-up!", "Tens and ones, together!", "Two digits, one strike!", "Place value power!", "The sum of us!", "Better together!", "Teamwork makes the dream work!"];
// 67 (Sixlock and Sevenstein) says Sevenstein's own "Six, seven!": the same line, the same clip.
export const TEAM_NUMBERS = { 10: "Perfect ten!", 12: "A dozen, done!", 13: "A baker's dozen! Chef Eight would approve!", 25: "Five squared! High five… times five!",
  36: "Six squared! Elementary!", 49: "Seven squared! Sevenstein's not even here!", 64: "Eight squared! Somebody tell Chef Eight!",
  67: "Six, seven!", 81: "Nine squared! Nine-ja must be hiding!" };
// Captain lines, two kinds:
//   In a fight: a solo moment by chance for the hero leading the run is, half the time (CAPTAIN),
//   one of the shared CAPTAIN_LINES (their own deck, key "captain") instead of the hero's quip.
//   A captain's first qualifying hit with their digit is always a moment, with one of them: once
//   per captain (saved as captains), so picking a new captain brings a new one.
//   On picking a captain (app.js wireCaptain), the hero says a name line (captainNames, a deck per
//   hero, key "name<d>") in place of their plain name: "reporting for duty" the first time a hero
//   is ever picked (saved as named).
export const CAPTAIN = 0.5;
export const CAPTAIN_LINES = ["Captain's orders!", "Leading digit, leading the charge!", "The captain always counts!", "First in line, first to strike!", "Power hit, captain style!"];
// "Captain Twodini, reporting for duty!" (the voice says the name through lines.js SAY_AS).
export function captainNames(d) {
  const n = "Captain " + HEROES[d].n;
  return [n + ", reporting for duty!", n + ", at your service!", n + " leads the charge!", "Make way for " + n + "!"];
}
const listOf = (d) => (d === "style" ? STYLES : d === "final" ? FINALS : d === "team" ? TEAM_LINES : d === "captain" ? CAPTAIN_LINES : /^name\d$/.test(d) ? captainNames(+d.slice(4)) : QUIPS[d]);

export function freshState(saved) {
  const s = saved || {};
  return { decks: Object.assign({}, s.decks), heard: Object.assign({}, s.heard), debut: (s.debut || []).slice(), dry: s.dry || 0, last: s.last == null ? null : s.last, captains: (s.captains || []).slice(), named: (s.named || []).slice() };
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
  let deck = (state.decks[d] || []).filter((q) => listOf(d).includes(q));
  if (!deck.length) {
    deck = listOf(d).slice();
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    const heard = state.heard[d] || [], last = heard[heard.length - 1];
    if (deck.length > 1 && deck[0] === last) deck.push(deck.shift());
  }
  const q = deck.shift();
  state.decks[d] = deck;
  state.heard[d] = (state.heard[d] || []).filter((x) => x !== q).concat([q]);
  return q;
}

// What hero d says on being picked as captain: "reporting for duty" the first time they're ever
// picked, then their name deck (which counts that first line as heard, so a new deck doesn't
// open with it).
// The styles rotate across all picks, whichever hero (a shared deck of the four, key "style"), so
// tapping through heroes doesn't say "reporting for duty" every time. The very first captain a
// player ever picks reports for duty.
const STYLES = ["0", "1", "2", "3"];
export function nameLine(state, d, rnd) {
  state.named = state.named || [];
  const first = !state.named.length;
  if (!state.named.includes(d)) state.named.push(d);
  const i = first ? 0 : +drawQuip(state, "style", rnd);
  if (first) state.heard.style = ["0"];
  const q = captainNames(d)[i], k = "name" + d;
  state.heard[k] = (state.heard[k] || []).filter((x) => x !== q).concat([q]);
  return q;
}

// Whether this answer gets a moment, and whose. hit:
//   typed: the digits that fly; team: { captain, rescued }; hinted; spell: null, "good",
//   "backwards" or "show" (a poor match); first: the player's first fight; floor: which floor of
//   the run; n: this problem's number in the run; bossFinish: it finishes a boss; critStart: this
//   hit turns crits on (the third in a row); always: ?moments (every qualifying hit); teamup:
//   ?teamup (a moment by chance with two heroes in the answer is always a team-up).
// Only for a right answer (the caller asks only then). Returns null, or
//   { hero, quip, why: "boss" | "debut" | "captain" | "chance" }, and updates state and run. A team-up adds
//   partner, the second hero: hero is on the left (the tens) and partner on the right, in the
//   answer's digit order.
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
  // A captain's first moment: their first qualifying hit with their digit, once per captain.
  else if (hit.team.captain != null && heroes.includes(hit.team.captain) && !state.captains.includes(hit.team.captain)) { hero = hit.team.captain; why = "captain"; }
  else {
    if (!heroes.length) return null;
    if (!hit.always) {
      if (run.last != null && hit.n - run.last <= REST) return null;
      if (run.onFloor >= PER_FLOOR) return null;
      if (r() >= CHANCE + BUILD * state.dry) { state.dry++; return null; }
    }
    hero = pick(heroes); why = "chance";
    // A team-up, half the time, when the answer has two different team heroes (a double like 33
    // has one). With three or more, the one picked and another; left to right as in the answer.
    // It's the same moment, so the rarity rules above are unchanged.
    if (heroes.length > 1 && (hit.teamup || r() < TEAMUP)) {
      const others = heroes.filter((d) => d !== hero), other = others[Math.floor(r() * others.length)];
      const [left, right] = heroes.filter((d) => d === hero || d === other);
      const quip = TEAM_NUMBERS[Number(hit.typed)] || (hit.critStart ? CRIT : drawQuip(state, "team", r));
      state.dry = 0; state.last = hero;
      run.last = hit.n; run.onFloor++;
      return { hero: left, partner: right, quip, why };
    }
  }
  state.debut = state.debut.filter((d) => d !== hero);
  let quip;
  if (why === "boss") quip = drawQuip(state, "final", r);
  else if (why === "captain") { quip = drawQuip(state, "captain", r); state.captains.push(hero); }
  else if (hit.critStart && why === "chance") quip = CRIT;
  else if (why === "chance" && hero === hit.team.captain && r() < CAPTAIN) quip = drawQuip(state, "captain", r);
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
  const out = { runs: o.runs, floors: 0, problems: 0, moments: 0, perRun: [], why: { boss: 0, debut: 0, captain: 0, chance: 0 }, teamups: 0, captainLines: 0, heroes: {}, quips: {} };
  for (let k = 0; k < o.runs; k++) {
    const run = freshRun(), floors = runFloors(w, o.team, r, 1);
    let n = 0, streak = 0, got = 0;
    floors.forEach((m, i) => {
      const bk = bandOf(w, m), facts = pool(bk), recs = recsFor(bk);
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
        // The captain's power hit; rescued heroes add their bonus only in a moment (app.js), which
        // is rare enough to leave out here.
        const dmg = Math.max(1, Math.round(ans * (crit ? 2 : 1) * (ds.includes(o.team.captain) ? 1.5 : 1)));
        const mo = decide(state, run, { typed, team: o.team, hinted, spell: null, first: false, floor: i, n, bossFinish: !!m.boss && hp - dmg <= 0, critStart: streak === 3 && !hinted }, r);
        hp -= dmg;
        if (mo) {
          got++; out.moments++; out.why[mo.why]++;
          out.heroes[mo.hero] = (out.heroes[mo.hero] || 0) + 1;
          if (mo.partner != null) { out.teamups++; out.heroes[mo.partner] = (out.heroes[mo.partner] || 0) + 1; }
          out.quips[mo.quip] = (out.quips[mo.quip] || 0) + 1;
          if (mo.partner == null && CAPTAIN_LINES.includes(mo.quip)) out.captainLines++;
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
