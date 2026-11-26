// Chompers acting out the symbol picked (js/chomp.js): which way his mouth opens for each
// symbol, what he does for each pick against each right answer, "which is more", and his art in
// each pose (monsters.js chompersArt), for every look.
import assert from "node:assert/strict";
import { chompPose, mouthOf, symOf, morePick, morePose, SNAP, FLIP_MS, SNAP_MS, EAT_MS } from "../js/chomp.js";
import { MON, LOOKS, lookOf, svg, CHOMP_SHUT } from "../js/monsters.js";
import { compareFact, balanceFacts, moreFacts } from "../js/balance.js";

// The mouth: < opens to the right side (3 < 8, toward the 8), > to the left, = shut.
assert.equal(mouthOf("<"), "right");
assert.equal(mouthOf(">"), "left");
assert.equal(mouthOf("="), "shut");
assert.equal(mouthOf(""), null);

// Every pick against every right answer.
const SYMS = ["<", "=", ">"];
for (const correct of SYMS) for (const picked of SYMS) {
  const p = chompPose(picked, correct), right = picked === correct;
  assert.equal(p.right, right);
  assert.equal(p.mouth, mouthOf(picked), "he turns to the picked way, right or wrong");
  assert.equal(p.flip, picked === ">", "drawn mirrored only for >");
  assert.equal(p.settle, mouthOf(correct), "he ends facing the right way");
  assert.equal(p.bite, picked === "=" ? null : mouthOf(picked), "he snaps the way his mouth opens");
  if (right) {
    assert.equal(p.act, picked === "=" ? "bounce" : "chomp");
    assert.equal(p.eat, picked === "=" ? null : mouthOf(picked), "a right chomp eats the bigger side");
  } else {
    assert.equal(p.act, "clack");
    assert.equal(p.eat, null, "a wrong pick eats nothing");
  }
}
assert.deepEqual(chompPose("<", "<"), { mouth: "right", flip: false, right: true, bite: "right", act: "chomp", eat: "right", settle: "right" });
assert.deepEqual(chompPose(">", "<"), { mouth: "left", flip: true, right: false, bite: "left", act: "clack", eat: null, settle: "right" });
assert.deepEqual(chompPose("=", ">"), { mouth: "shut", flip: false, right: false, bite: null, act: "clack", eat: null, settle: "left" });
assert.deepEqual(chompPose("=", "="), { mouth: "shut", flip: false, right: true, bite: null, act: "bounce", eat: null, settle: "shut" });
assert.equal(chompPose(null, "<").act, "clack");

// On every real comparison, a right chomp eats the side whose value is bigger, and a wrong one
// snaps at the other side (or at nothing).
const val = (t) => t.split(" + ").reduce((s, x) => s + Number(x), 0);
const compares = balanceFacts().filter((f) => f.op === "○");
assert.ok(compares.length > 20);
for (const f of compares) {
  const l = val(f.l), r = val(f.r);
  assert.equal(symOf(l, r), f.sym, f.key);
  const p = chompPose(f.sym, f.sym);
  if (l === r) assert.equal(p.act, "bounce", f.key);
  else assert.equal(p.eat, l > r ? "left" : "right", `${f.key}: he eats ${Math.max(l, r)}`);
  for (const w of SYMS.filter((s) => s !== f.sym)) {
    const q = chompPose(w, f.sym);
    assert.ok(!q.right && q.eat === null, f.key);
    if (q.bite) assert.ok(l === r || q.bite === (l > r ? "right" : "left"), `${f.key}: a wrong ${w} snaps at the smaller side`);
  }
}
assert.equal(compareFact("3 + 4", "8").sym, "<");

// Which is more ("7 or 4", typed): typing a side's number turns him to it; the bigger is right.
for (const f of moreFacts()) for (const [x, y] of [[f.x, f.y], [f.y, f.x]]) {
  const big = Math.max(x, y), small = Math.min(x, y);
  const p = morePose(x, y, String(big));
  assert.ok(p.right && p.act === "chomp", `${x} or ${y}`);
  assert.equal(p.eat, x > y ? "left" : "right", `${x} or ${y}: he eats the ${big}`);
  const q = morePose(x, y, String(small));
  assert.ok(!q.right && q.act === "clack" && q.bite === (x < y ? "left" : "right") && q.settle === p.mouth, `${x} or ${y}: typing ${small}`);
  const n = morePose(x, y, "11");
  assert.ok(!n.right && n.mouth === null && n.bite === null && n.settle === p.mouth, "a number that's neither: a clack at nothing");
}
assert.equal(morePick(7, 4, "7"), ">");
assert.equal(morePick(7, 4, "4"), "<");

// Quick: the snap and the flip together stay well under 0.6 s.
assert.ok(SNAP.length * SNAP_MS + FLIP_MS <= 450 && EAT_MS <= 300);
assert.equal(SNAP.at(-1), 0, "the snap ends shut");

// The art: every pose draws, for Chompers and every look; shut ("=") has no teeth; the head's
// extras ride on the top jaw, the neck's stay put; nothing has text (the drawing is mirrored).
const ch = MON.find((m) => m.n === "Chompers");
for (const m of [ch].concat(LOOKS.Chompers.map((_, i) => lookOf(ch, i + 1)))) {
  for (const jaw of [undefined, { o: 1 }, { o: 0.5 }, { o: 0 }, CHOMP_SHUT, { o: 0, gap: 10 }]) {
    const s = svg(Object.assign({}, m, { jaw }));
    assert.ok(s.startsWith("<svg") && !/NaN|undefined/.test(s), `${m.n} ${JSON.stringify(jaw)}`);
    assert.ok(!/<text/.test(s), `${m.n}: no text, so it mirrors`);
    assert.equal(/#f3efe4" stroke="#0c171c" stroke-width="2.5"/.test(s), !jaw || jaw.o == null || jaw.o > 0.3, `${m.n}: teeth only while open`);
  }
}
const chompette = lookOf(ch, 2);
assert.equal(chompette.n, "Chompette");
const shut = svg(Object.assign({}, chompette, { jaw: CHOMP_SHUT }));
// The bow (pink) is drawn inside the top jaw's group, so it moves with the head.
const topJaw = shut.lastIndexOf('<g transform="translate(0 -24)');
assert.ok(topJaw > 0 && shut.indexOf("#ff7ac8", topJaw) > topJaw, "Chompette's bow rides on the top jaw");
const king = svg(lookOf(ch, 1)), medal = king.lastIndexOf('fill="#ffc93c" stroke="#0c171c" stroke-width="3"');
assert.ok(medal > king.lastIndexOf("</g>"), "the King's medal stays on the neck, outside the jaw");
// The default pose is the drawing as before: open, facing right.
assert.equal(svg(ch), svg(Object.assign({}, ch, { jaw: { o: 1 } })));

console.log("✓ Chompers' flip and chomp");
