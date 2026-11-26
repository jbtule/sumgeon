// Chompers acting out the symbol picked (🐊 Big Bite). No DOM, so it runs in Node.
// Chompers' mouth is the < or > symbol: "<" opens to the right side ("3 < 8": toward the 8), ">"
// to the left side, and "=" is the mouth shut flat, two level jaws. A tap on a key turns him to
// the picked way (app.js chompTurn); Hit! plays the act (chompAct).

// Which way the mouth opens for a symbol: "right", "left", "shut" (=), or null (none picked).
export const mouthOf = (sym) => (sym === "<" ? "right" : sym === ">" ? "left" : sym === "=" ? "shut" : null);

// What Chompers does when the answer goes in: picked is the symbol tapped (or null: nothing he
// can face, a "which is more" answer that's neither number), correct the right one.
// - mouth: the pose for the pick; flip: drawn mirrored (the mouth opens left).
// - act: "chomp" (right: he eats the bigger side), "bounce" (right "=": a happy closed-mouth
//   bounce), or "clack" (wrong: a sad empty-jaw clack).
// - bite: the side he snaps at ("left"/"right"), or null (shut, or no pick).
// - eat: the side eaten, the bigger number, only on a right chomp.
// - settle: the pose he ends in, facing the right way (after a miss he turns to it).
export function chompPose(picked, correct) {
  const mouth = mouthOf(picked), right = picked != null && picked === correct;
  const bite = mouth === "left" || mouth === "right" ? mouth : null;
  return {
    mouth, flip: mouth === "left", right, bite,
    act: right ? (mouth === "shut" ? "bounce" : "chomp") : "clack",
    eat: right ? bite : null,
    settle: mouthOf(correct)
  };
}

// The symbol a comparison's answer is, from its two sides' values.
export const symOf = (l, r) => (l < r ? "<" : l > r ? ">" : "=");

// "Which is more" (the Cellar, "7 or 4", typed on the number pad): the typed number as the
// symbol it picks. Typing the left number turns the mouth to the left (">"), the right one to
// the right ("<"); anything else picks nothing (null).
export function morePick(x, y, typed) {
  const n = Number(typed);
  return n === x ? ">" : n === y ? "<" : null;
}
// The pose for a "which is more" answer.
export const morePose = (x, y, typed) => chompPose(morePick(x, y, typed), symOf(x, y));

// The jaw for each frame of a snap, from open (1) to closed (0): open, half, shut, half, shut.
export const SNAP = [0.45, 0, 0.5, 0];
export const FLIP_MS = 170, SNAP_MS = 55, EAT_MS = 260;
