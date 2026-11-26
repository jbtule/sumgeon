// Clothing for the heroes (js/clothes.js, DESIGN.md §6.3, §14.2): every piece draws on every
// hero, the pieces are well formed, the special ones exist for each stratum, and an outfit holds
// one piece per spot.
import assert from "node:assert/strict";
import { CLOTHES, SPOTS, STRATA, HERO_ANCHOR, clothesById, findable, outfit, wearSvg, pieceSvg } from "../js/clothes.js";
import { HEROES, heroSvg, dressed } from "../js/heroes.js";

const clean = (s, what) => {
  assert.ok(s.startsWith("<svg") && s.endsWith("</svg>"), what);
  assert.ok(!/<text\b/.test(s), `${what}: shapes, not fonts`);
  assert.ok(!/undefined|NaN|null|\[object/.test(s), `${what}: ${(s.match(/.{30}(undefined|NaN|null|\[object).{10}/) || [])[0]}`);
};

// The pieces: a unique id, a name the voice can say, a spot, a tier, a draw function.
assert.deepEqual(SPOTS, ["head", "face", "neck"]);
assert.equal(new Set(CLOTHES.map((p) => p.id)).size, CLOTHES.length, "every piece has its own id");
assert.equal(new Set(CLOTHES.map((p) => p.name)).size, CLOTHES.length, "every piece has its own name");
for (const p of CLOTHES) {
  assert.match(p.id, /^[a-z][a-z-]*$/, p.id);
  assert.ok(p.name && p.say === p.name + "!", p.id);
  assert.ok(p.say.split(" ").length <= 12, `${p.id}: a short line`);
  assert.ok(SPOTS.includes(p.spot), `${p.id}: spot`);
  assert.ok(["common", "fancy", "special"].includes(p.tier), `${p.id}: tier`);
  assert.equal(typeof p.draw, "function", p.id);
  if (p.tier === "special") assert.equal(p.price, null, `${p.id}: special pieces aren't sold`);
  else assert.ok(Number.isInteger(p.price) && p.price > 0 && p.price < 100, `${p.id}: a price under a dollar`);
  if (p.back) assert.ok(p.spot === "neck" && p.cape, `${p.id}: only capes go behind`);
  clean(pieceSvg(p.id), `${p.id} alone`);
}
for (const s of SPOTS) assert.ok(CLOTHES.some((p) => p.spot === s && p.tier !== "special"), `something findable for the ${s}`);
assert.ok(findable().every((p) => p.tier !== "special"));
// The approved set.
for (const id of ["partyhat", "tophat", "crown", "wizardhat", "piratehat", "beanie", "cowboyhat", "chefhat", "headband", "flowercrown", "propellercap", "bunnyears",
  "glasses", "sunglasses", "starglasses", "monocle", "eyepatch", "mask", "mustache", "bowtie", "scarf", "medal", "necktie", "bandana", "cape"]) assert.ok(clothesById[id], id);
// The special pieces, from achievements only: per stratum a champion badge and a Legend crown,
// and the Champion of Champions cape.
assert.deepEqual(STRATA.map((s) => s.id), ["cellar", "hall", "mines", "tower"]);
for (const s of STRATA) {
  const badge = clothesById["badge-" + s.id], crown = clothesById["legend-" + s.id];
  assert.ok(badge && badge.tier === "special" && badge.spot === "neck" && badge.stratum === s.id, "badge " + s.id);
  assert.ok(crown && crown.tier === "special" && crown.spot === "head" && crown.stratum === s.id, "Legend crown " + s.id);
  assert.ok(pieceSvg(badge.id).includes(s.c) && pieceSvg(crown.id).includes(s.c), `${s.id}: in the stratum's color`);
}
const champ = clothesById.champcape;
assert.ok(champ && champ.tier === "special" && champ.spot === "neck" && champ.cape);
assert.equal(CLOTHES.filter((p) => p.tier === "special").length, 2 * STRATA.length + 1);

// Every piece on every hero, plain, in a chalk color and cursed.
assert.equal(HERO_ANCHOR.length, 10);
for (const h of HEROES) {
  const a = HERO_ANCHOR[h.d];
  assert.ok(a.top && a.eyes.length === 2 && a.mouth && a.neck && a.ground > a.neck[1], `anchors for ${h.n}`);
  for (const p of CLOTHES) {
    for (const o of [{}, { color: "#ff7ac8" }, { cursed: true }]) clean(heroSvg(h, Object.assign({ wear: { [p.spot]: p.id } }, o)), `${p.id} on ${h.n}`);
    const s = dressed(h.d, { [p.spot]: p.id });
    assert.notEqual(s, heroSvg(h), `${p.id} shows on ${h.n}`);
  }
  // A full outfit, and nothing worn draws the hero as before.
  clean(dressed(h.d, { head: "wizardhat", face: "starglasses", neck: "cape" }), `an outfit on ${h.n}`);
  assert.equal(dressed(h.d, {}), heroSvg(h), `${h.n} undressed`);
  assert.equal(dressed(h.d, null), heroSvg(h));
}
// One piece per spot: a piece named in the wrong spot, or an unknown id, isn't worn.
assert.deepEqual(Object.keys(outfit({ head: "partyhat", face: "bowtie", neck: "nope" })), ["head"]);
assert.equal(dressed(5, { face: "crown" }), heroSvg(HEROES[5]));
// A head piece replaces the hero's own hat (Twodini's top hat), a face piece Zeroic's mask, and a
// cape Zeroic's cape; other neck pieces leave his cape on.
assert.deepEqual(wearSvg(2, { head: "beanie" }).off, { hat: true, mask: false, cape: false });
assert.ok(!dressed(2, { head: "beanie" }).includes("#2b2440"), "Twodini's own top hat comes off");
assert.deepEqual(wearSvg(0, { face: "glasses", neck: "bowtie" }).off, { hat: false, mask: true, cape: false });
assert.ok(wearSvg(0, { neck: "champcape" }).off.cape && wearSvg(0, { neck: "champcape" }).back);
// The cursed Octoloop (8) wears nothing.
assert.equal(heroSvg(HEROES[8], { cursed: true, wear: { head: "crown" } }), heroSvg(HEROES[8], { cursed: true }));
console.log(`✓ clothes: ${CLOTHES.length} pieces on all ten heroes`);
