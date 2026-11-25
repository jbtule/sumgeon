// Turns drawings shared from the spell check's Record mode (spell/) into test fixtures for the
// spell reader (js/sigil.js):
//   node scripts/drawings-to-fixtures.mjs <sumgeon-drawings-….zip | drawings.json> ... [--out <file>]
// Writes (or adds to) scripts/sigil-fixtures.json:
//   { format: 1, fixtures: [{ id, digit, who, width, height, pointer, strokes: [[[x, y], ...], ...],
//     read: { digit, reversed, clear } }] }
// strokes is one array of [x, y] per stroke, in CSS px on a width × height canvas, ready for
// sigil.js read(). read is what the built-in templates made of it when it was drawn.
// A recording already in the file (by id) isn't added twice. Names stay out of the repo: who is a
// plain label, drawer-1, drawer-2, … in the order people first appear.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { unzip } from "../js/zip.js";
import { toFixture, FORMAT } from "../js/drawings.js";

const args = process.argv.slice(2);
let out = fileURLToPath(new URL("sigil-fixtures.json", import.meta.url));
const oi = args.indexOf("--out");
if (oi >= 0) { out = args[oi + 1]; args.splice(oi, 2); }
if (!args.length) {
  console.error("usage: node scripts/drawings-to-fixtures.mjs <drawings zip or json> ... [--out <file>]");
  process.exit(1);
}

function recordingsOf(path) {
  const bytes = readFileSync(path);
  let json = bytes;
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    const f = unzip(new Uint8Array(bytes)).find((e) => e.name === "drawings.json");
    if (!f) throw new Error(`${path} has no drawings.json`);
    json = f.data;
  }
  const d = JSON.parse(new TextDecoder().decode(json));
  if (d.format !== FORMAT) throw new Error(`${path}: drawings format ${d.format}, expected ${FORMAT}`);
  return d.recordings;
}
const file = existsSync(out) ? JSON.parse(readFileSync(out, "utf8")) : { format: 1, fixtures: [] };
// Each person in this import gets the next plain label (drawer-1, drawer-2, …), numbered on from
// the labels already in the file. Not a hash of the name: a short hash of a first name could be
// guessed by trying names.
let next = Math.max(0, ...file.fixtures.map((f) => Number((/^drawer-(\d+)$/.exec(f.who) || [])[1]) || 0)) + 1;
const labels = new Map();
const labelOf = (who) => { const k = String(who); if (!labels.has(k)) labels.set(k, "drawer-" + next++); return labels.get(k); };
const have = new Set(file.fixtures.map((f) => f.id));
let added = 0;
for (const path of args) {
  for (const r of recordingsOf(path)) {
    if (have.has(r.id) || !r.strokes || !r.strokes.length) continue;
    file.fixtures.push(toFixture(r, labelOf(r.who))); have.add(r.id); added++;
  }
}
file.fixtures.sort((a, b) => a.digit - b.digit || a.who.localeCompare(b.who));
writeFileSync(out, JSON.stringify({ format: 1, fixtures: file.fixtures }).replace(/\{"id"/g, '\n{"id"') + "\n");
console.log(`✓ ${added} new drawing${added === 1 ? "" : "s"}, ${file.fixtures.length} in ${out}`);
