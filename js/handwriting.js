// School-style handwriting: the digits 0–9 the way K–1 manuscript teaches them, as plain strokes
// for a page to draw (no font): a 1 that's one straight line, an open 4, a 9 with a straight stem.
// Fonts have quirks kids copy (Bungee's 1 has a long flag and a base, and its 4 is a squared U).
// Used by the game, to show how to write a digit after a spell that was hard to read (app.js),
// and by the spell check's Record prompt (review/spell/spell.js). No DOM: runs in Node.
//
// Each digit is a list of strokes in the order they're written, each [[x, y], ...] in a 100 × 100
// box (y down), about 60 wide and centered.

// Points along an ellipse: center, radii, from and to angles in degrees (0 is right, 90 down).
function arc(cx, cy, rx, ry, a0, a1, steps = 24) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const a = (a0 + (a1 - a0) * i / steps) * Math.PI / 180;
    out.push([Math.round((cx + rx * Math.cos(a)) * 10) / 10, Math.round((cy + ry * Math.sin(a)) * 10) / 10]);
  }
  return out;
}

export const HANDWRITING = [
  // 0: start at the top, around to the left and back up.
  [arc(50, 50, 28, 44, -90, -450, 32)],
  // 1: straight down.
  [[[50, 6], [50, 94]]],
  // 2: over the top, slide down to the left, across the bottom.
  [arc(50, 30, 25, 23, -170, 20, 18).concat([[25, 94], [77, 94]])],
  // 3: around the top to the middle, around the bottom.
  [arc(48, 28, 24, 21, -150, 90, 18).concat(arc(48, 72, 27, 22, -90, 150, 18))],
  // 4: down and across, then a straight line down through the bar (an open 4).
  [[[34, 6], [26, 60], [80, 60]], [[64, 6], [64, 94]]],
  // 5: down, around the belly, then the hat.
  [[[32, 8], [30, 44]].concat(arc(49, 66, 26, 25, -130, 150, 18)), [[32, 8], [74, 8]]],
  // 6: curve down from the top right, then around the loop.
  [[[70, 10], [52, 6], [36, 16], [27, 36], [24, 58]].concat(arc(49, 70, 25, 24, 180, 540, 24))],
  // 7: across the top, then a slanted line down.
  [[[24, 8], [76, 8], [42, 94]]],
  // 8: an S from the top right, then back up to close it.
  [arc(50, 28, 21, 20, -20, -270, 18).concat(arc(50, 72, 25, 22, -90, 270, 26), arc(50, 28, 21, 20, 90, -20, 10))],
  // 9: a round head, then a straight stem down its right side.
  [arc(48, 28, 23, 21, -10, -370, 24), [[71, 24], [71, 94]]]
];

// A digit as an SVG path ("M x y L ..."), scaled to size (a box size × size), for a page to draw.
export function handwritingPath(d, size = 100) {
  const k = size / 100, n = (v) => Math.round(v * k * 10) / 10;
  return HANDWRITING[d].map((s) => "M" + s.map(([x, y]) => `${n(x)} ${n(y)}`).join(" L")).join(" ");
}
