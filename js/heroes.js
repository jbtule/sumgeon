// The digit heroes (DESIGN.md §6.6): 0–9 as heroes, drawn like the monsters (shapes only, a dark
// outline, a color, a sheen). Each is its digit as a thick stroke, with eyes and a class accessory.
// No DOM, so the check can run it in Node.
import { DK, eye, defs, solid, line, foot, ds, MON } from "./monsters.js";

const W = "#f3efe4", GOLD = "#ffc93c", CORAL = "#ff5a4e";
const sevenstein = MON.find((m) => m.n === "Sevenstein");

export const HEROES = [
  { d: 0, n: "Zeroic", cls: "Superhero", move: "Flies in fist-first", c: "#ffc93c",
    draw: (c) => solid(`<path d="M66 64 L26 180 Q100 162 174 180 L134 64Z"/>`, CORAL) + foot(82, 180) + foot(118, 180)
      + line(`<ellipse cx="100" cy="100" rx="46" ry="66"/>`, c, 30)
      + `<path d="M74 36 Q100 26 126 36 L124 48 Q100 40 76 48Z" fill="${CORAL}" stroke="${DK}" stroke-width="3" stroke-linejoin="round"/>`
      + eye(89, 41, 7) + eye(111, 41, 7)
      + `<path d="M100 150 l5 10 l11 1 l-8 7 l3 11 l-11 -6 l-11 6 l3 -11 l-8 -7 l11 -1z" fill="${CORAL}" stroke="${DK}" stroke-width="2.5" stroke-linejoin="round"/>` },
  { d: 1, n: "Onesie", cls: "Pajama hero", move: "Pillow bonk", c: "#8ab4ff",
    draw: (c) => solid(`<rect x="134" y="96" width="50" height="38" rx="14" transform="rotate(-12 159 115)"/>`, W)
      + solid(`<ellipse cx="88" cy="174" rx="22" ry="12"/><ellipse cx="128" cy="174" rx="22" ry="12"/>`, c)
      + line(`<path d="M78 62 L108 40 V164"/>`, c, 34)
      + solid(`<path d="M90 40 L128 4 L134 44Z"/>`, c) + `<circle cx="128" cy="4" r="8" fill="${W}" stroke="${DK}" stroke-width="3"/>`
      + eye(100, 74, 7) + eye(117, 74, 7) + `<path d="M102 90 Q109 96 116 90" ${ds} stroke-width="3"/>`
      + `<path d="M98 120 h20 M98 136 h20" stroke="${W}" stroke-width="3" stroke-linecap="round" opacity=".7"/>` },
  { d: 2, n: "Twodini", cls: "Magician", move: "The damage pops out of a top hat", c: "#b18cff",
    draw: (c) => foot(70, 176) + foot(140, 176)
      + line(`<path d="M50 72 Q50 30 100 30 Q150 30 150 72 Q150 106 54 168 H154"/>`, c, 30)
      + solid(`<rect x="70" y="-10" width="48" height="34" rx="4"/><rect x="58" y="18" width="72" height="10" rx="5"/>`, "#2b2440")
      + `<rect x="70" y="10" width="48" height="6" fill="${CORAL}"/>`
      + eye(90, 38, 7) + eye(112, 36, 7)
      + line(`<path d="M164 128 L188 100"/>`, DK, 4) + `<circle cx="190" cy="98" r="5" fill="${W}" stroke="${DK}" stroke-width="2"/>`
      + `<path d="M178 76 l3 7 l7 1 l-5 5 l1 7 l-6 -4 l-6 4 l1 -7 l-5 -5 l7 -1z" fill="${GOLD}" stroke="${DK}" stroke-width="2"/>` },
  { d: 3, n: "Threasure Hunter", cls: "Explorer", move: "Lantern flash", c: "#e6b36a",
    draw: (c) => foot(70, 172) + foot(120, 176)
      + line(`<path d="M56 50 Q100 20 138 50 Q148 88 102 98 Q154 108 144 150 Q120 186 56 162"/>`, c, 30)
      + solid(`<path d="M58 28 Q98 -18 138 28Z"/><ellipse cx="98" cy="28" rx="54" ry="8"/>`, "#c9a66b")
      + `<path d="M62 24 Q98 14 134 24" stroke="${CORAL}" stroke-width="5" fill="none"/>`
      + eye(92, 46, 7) + eye(114, 46, 7)
      + `<path d="M168 96 V112" ${ds}/>` + `<circle cx="168" cy="132" r="22" fill="${GOLD}" opacity=".35"/>`
      + solid(`<rect x="156" y="112" width="24" height="32" rx="6"/>`, GOLD) },
  { d: 4, n: "Sir Fourtress", cls: "Knight", move: "Shield bash", c: "#9fb6c9",
    draw: (c) => foot(118, 182) + foot(146, 182)
      + line(`<path d="M128 176 V36 L48 128 H164"/>`, c, 30)
      + solid(`<path d="M128 8 Q150 -16 162 6 Q146 2 140 18Z"/>`, CORAL)
      + solid(`<path d="M104 18 Q128 0 152 18 V54 Q128 66 104 54Z"/>`, "#c3d1dc")
      + `<rect x="110" y="34" width="36" height="10" rx="5" fill="${DK}"/>` + `<circle cx="120" cy="39" r="3" fill="${W}"/><circle cx="136" cy="39" r="3" fill="${W}"/>`
      + solid(`<path d="M24 120 H64 V142 Q64 166 44 176 Q24 166 24 142Z"/>`, CORAL)
      + `<path d="M44 128 V166 M30 144 H58" stroke="${GOLD}" stroke-width="5" stroke-linecap="round"/>` },
  { d: 5, n: "High Five", cls: "Sporty hero", move: "A giant high five", c: "#ff8a3d",
    draw: (c) => foot(72, 176) + foot(118, 178)
      + line(`<path d="M146 34 H68 L60 94 Q106 72 140 102 Q160 142 120 166 Q86 180 56 160"/>`, c, 30)
      + `<path d="M58 30 H156" stroke="${W}" stroke-width="8" stroke-linecap="round"/><path d="M60 30 H154" stroke="${CORAL}" stroke-width="4" stroke-linecap="round"/>`
      + eye(92, 42, 7) + eye(114, 42, 7)
      + solid(`<rect x="160" y="40" width="30" height="34" rx="12"/><rect x="160" y="14" width="7" height="30" rx="3.5"/><rect x="169" y="8" width="7" height="34" rx="3.5"/><rect x="178" y="10" width="7" height="32" rx="3.5"/><rect x="187" y="18" width="6" height="28" rx="3"/><rect x="148" y="46" width="18" height="8" rx="4" transform="rotate(-30 157 50)"/>`, "#ffd2a8") },
  { d: 6, n: "Sixlock Holmes", cls: "Detective", move: "Spots the weak point", c: "#5fd0c4",
    draw: (c) => foot(80, 180) + foot(122, 180)
      + line(`<path d="M138 42 Q112 22 84 40 Q52 70 56 124 Q60 172 102 172 Q146 170 146 128 Q144 92 102 92 Q72 92 58 118"/>`, c, 30)
      + solid(`<path d="M72 34 Q104 0 136 30 L144 38 Q104 28 66 42Z"/>`, "#a0784a")
      + `<path d="M80 26 Q104 14 128 26" stroke="#7a5630" stroke-width="3" fill="none"/>`
      + eye(90, 96, 7) + eye(112, 93, 7)
      + `<path d="M168 120 L190 150" stroke="#7a5630" stroke-width="7" stroke-linecap="round"/>`
      + `<circle cx="160" cy="104" r="20" fill="#bfe8ff" fill-opacity=".55" stroke="${DK}" stroke-width="5"/><circle cx="160" cy="104" r="20" fill="none" stroke="${GOLD}" stroke-width="3"/>` },
  { d: 7, n: "Sevenstein", cls: "Gentle giant", move: "Big stomp", c: sevenstein.c,
    draw: (c) => sevenstein.d(c) },
  { d: 8, n: "Chef Eight", cls: "Chef", move: "Serves the damage on a sizzling platter", c: "#ff9ec9",
    draw: (c) => foot(84, 182) + foot(116, 182)
      + line(`<circle cx="100" cy="66" r="30"/><circle cx="100" cy="134" r="38"/>`, c, 24)
      + solid(`<rect x="72" y="18" width="56" height="16" rx="4"/><circle cx="80" cy="10" r="15"/><circle cx="100" cy="2" r="17"/><circle cx="120" cy="10" r="15"/>`, W)
      + eye(89, 58, 8) + eye(111, 58, 8)
      + `<path d="M91 76 Q100 84 109 76" ${ds} stroke-width="3"/>`
      + line(`<path d="M150 150 L176 112"/>`, "#c3d1dc", 5) + solid(`<ellipse cx="180" cy="104" rx="10" ry="14" transform="rotate(35 180 104)"/>`, "#c3d1dc") },
  { d: 9, n: "Nine-ja", cls: "Ninja", move: "Vanishes, then strikes from behind", c: "#4a5a8a",
    draw: (c) => foot(84, 180) + foot(120, 178)
      + `<path d="M58 60 Q30 54 14 72 M58 66 Q34 76 22 96" stroke="${CORAL}" stroke-width="7" stroke-linecap="round" fill="none"/>`
      + line(`<path d="M144 84 Q144 40 102 40 Q60 40 60 84 Q62 122 102 122 Q140 122 144 84 V124 Q140 174 72 170"/>`, c, 30)
      + `<path d="M58 58 Q102 46 146 58 L146 70 Q102 58 58 70Z" fill="${CORAL}" stroke="${DK}" stroke-width="3" stroke-linejoin="round"/>`
      + `<path d="M74 80 Q102 72 130 80 L128 94 Q102 88 76 94Z" fill="${DK}"/>`
      + `<path d="M84 86 l10 -3 l2 4 l-10 2z M120 86 l-10 -3 l-2 4 l10 2z" fill="${W}"/>` }
];

// The chalk colors a player can pick for their captain.
export const CHALK = ["#ffc93c", "#ff5a4e", "#8ab4ff", "#8fe06a", "#ff7ac8", "#45d6e6", "#ff8a3d", "#b18cff"];

// A hero as SVG. color: the player's chalk color (captains); cursed: the dark, glitchy look of a
// digit the operators have cursed (DESIGN.md §6.6).
// The 8's cursed form is Octoloop, the monster from the prototype (the curse twisted the chef
// into a tentacled loop); the others are their hero, darkened.
const octoloop = MON.find((m) => m.n === "Octoloop");
export function heroSvg(h, opts) {
  const o = opts || {}, c = o.color || h.c, cls = o.cls || "";
  let body = o.cursed && h.d === 8 ? octoloop.d(octoloop.c) : h.draw(c);
  if (o.cursed) {
    body = `<g filter="url(#curse${h.d})">${body}</g>`
      + `<path d="M60 20 l14 22 l-8 10 l16 24 M150 60 l-12 20 l10 12 l-14 26" stroke="#c38bff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>`;
    // The curse cracking (o.cracks of CURSE_HITS): gold light breaking through, one crack each.
    const CRACKS = ["M100 10 l-10 30 l14 14 l-12 34 l10 20 l-8 30", "M40 110 l26 6 l10 -12 l26 10 l14 -8 l30 6 l20 -10"];
    for (let i = 0; i < Math.min(o.cracks || 0, CRACKS.length); i++) {
      body += `<path d="${CRACKS[i]}" stroke="#ffc93c" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".35"/>`
        + `<path d="${CRACKS[i]}" stroke="#fff6c8" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
  }
  const curse = o.cursed ? `<filter id="curse${h.d}"><feColorMatrix type="matrix" values=".25 .2 .2 0 .08  .1 .15 .1 0 0  .35 .25 .4 0 .14  0 0 0 1 0"/></filter>` : "";
  return `<svg viewBox="-10 -24 220 234" class="${cls}" role="img" aria-label="${o.cursed ? "Cursed " : ""}${h.n}">${defs}<defs>${curse}</defs>${body}</svg>`;
}
export const heroOf = (d) => HEROES[d];

// Picking a captain. With no hero on the team (a new player, or one whose only hero was cursed),
// any of the ten can start; otherwise only heroes on the team can lead.
export function freePick(team) {
  return team.rescued.length === 0;
}
// The team after picking digit d, or null when d can't be picked.
export function pickHero(team, d) {
  if (freePick(team)) return Object.assign({}, team, { captain: d, rescued: [d] });
  if (!team.rescued.includes(d)) return null;
  return Object.assign({}, team, { captain: d });
}
// Breaking a curse takes CURSE_HITS wins over the cursed hero: each one cracks it (saved as
// team.cracks[digit]), and the last frees them. Returns { team, cracks, freed }.
export const CURSE_HITS = 3;
export function crackCurse(team, d) {
  const cracks = ((team.cracks || {})[d] || 0) + 1, freed = cracks >= CURSE_HITS;
  const left = Object.assign({}, team.cracks || {});
  if (freed) delete left[d]; else left[d] = cracks;
  const rescued = freed && !team.rescued.includes(d) ? team.rescued.concat([d]) : team.rescued;
  return { team: Object.assign({}, team, { cracks: left, rescued }), cracks, freed };
}

// Starting the dungeon over (Settings): only your own hero stays on the team, curse cracks and
// all. Your chalk color stays too.
export function resetTeam(team) {
  return { captain: team.captain, color: team.color, rescued: team.captain == null ? [] : [team.captain], cracks: {} };
}

// Losing all your hearts curses the hero who led the run: it leaves the team (to be rescued again
// on a rescue floor) and someone else has to be picked to lead.
export function curseCaptain(team) {
  if (team.captain == null) return team;
  const cracks = Object.assign({}, team.cracks || {});
  delete cracks[team.captain]; // a fresh curse
  return Object.assign({}, team, { captain: null, rescued: team.rescued.filter((d) => d !== team.captain), cracks });
}
