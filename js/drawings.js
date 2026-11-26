// Recorded drawings: real kids' handwriting from the spell check's Record mode (review/spell/), shared
// as a zip, to test the spell reader (js/sigil.js) on. No DOM: the page draws the PNGs, and
// scripts/drawings-to-fixtures.mjs turns a shared zip into test fixtures.
//
// A recording:
//   { id, digit, round, who, whoId, strokes: [[{ x, y, t }, ...], ...], width, height, dpr,
//     pointer, ua, at, read: { builtin, player } }
//   - x, y: CSS px from the canvas's top left (0.1 px); width, height: the canvas in CSS px.
//   - t: ms since the drawing's first touch (so the gaps between strokes are kept too).
//   - who: the player's name as shown ("Player 2" when blank), or "Someone else"; whoId: their
//     player id on that device, or null.
//   - read: what js/sigil.js made of it at the time, { digit, reversed, clear, fit, margin, name }:
//     builtin with the built-in templates only, player with the player's learned handwriting
//     too (null for "Someone else" or a player with none).

export const FORMAT = 1;
export const STORE = "sumgeon:drawings";
export const SOMEONE = "Someone else";

// The read, without the point cloud and alternatives.
export function summary(r) {
  if (!r) return null;
  const n = (x) => Math.round(x * 1000) / 1000;
  return { digit: r.digit, reversed: r.reversed, clear: r.clear, fit: n(r.fit), margin: n(r.margin), name: r.name };
}

// File names: "3-maya-2.png" (the second 3 Maya drew), and the zip's own name by date.
export function slug(who) {
  return String(who || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "someone";
}
export function pngNames(recordings) {
  const seen = {};
  return recordings.map((r) => { const k = r.digit + "-" + slug(r.who); seen[k] = (seen[k] || 0) + 1; return `${k}-${seen[k]}.png`; });
}
export function zipName(date = new Date()) {
  const p = (x) => String(x).padStart(2, "0");
  return `sumgeon-drawings-${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}.zip`;
}

export function drawingsJSON(recordings, sha, date = new Date()) {
  return JSON.stringify({ format: FORMAT, app: "sumgeon", build: sha || "dev", exported: date.toISOString(), recordings }, null, 1);
}

export const README = `Sumgeon spell drawings
======================

Digits drawn on the Sumgeon spell check page (Record mode), to test the spell reader
(js/sigil.js) on real handwriting.

drawings.json  every drawing: the digit asked for, the exact strokes (x, y in CSS px from the
               canvas's top left, t in ms since the drawing's first touch), the canvas size,
               the device, who drew it, and what the reader made of it at the time.
*.png          each drawing, white on dark: <digit>-<who>-<n>.png.

To turn this into test fixtures: node scripts/drawings-to-fixtures.mjs <this zip>
`;

// A recording as a test fixture: the digit and the strokes as [[x, y], ...] per stroke. Names
// stay out of the repo: who is a label (from labelOf), not the name.
export function toFixture(r, who) {
  const n = (x) => Math.round(x * 10) / 10;
  const b = r.read && r.read.builtin;
  return { id: r.id, digit: r.digit, who, width: n(r.width), height: n(r.height), pointer: r.pointer || null,
    strokes: r.strokes.map((s) => s.map((p) => [n(p.x), n(p.y)])),
    read: b ? { digit: b.digit, reversed: b.reversed, clear: b.clear } : null };
}
