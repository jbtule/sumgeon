// The zip writer the spell check shares drawings with (js/zip.js), the drawing names and
// fixtures (js/drawings.js), and the fixture script reading a zip back.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, zip, unzip } from "../js/zip.js";
import { pngNames, slug, zipName, toFixture, drawingsJSON, README } from "../js/drawings.js";

// CRC-32 check values.
assert.equal(crc32(""), 0);
assert.equal(crc32("123456789"), 0xcbf43926);
assert.equal(crc32("The quick brown fox jumps over the lazy dog"), 0x414fa339);

// The structure: local headers, central directory, end record, and the offsets between them.
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 255, 1, 2]);
const files = [{ name: "drawings.json", data: '{"a":1}' }, { name: "3-zoë-1.png", data: png }, { name: "empty.txt", data: "" }];
const bytes = zip(files, new Date(2026, 10, 25, 14, 30, 10));
const v = new DataView(bytes.buffer);
assert.equal(v.getUint32(0, true), 0x04034b50, "starts with a local header");
assert.equal(v.getUint16(8, true), 0, "stored, no compression");
assert.equal(v.getUint16(6, true) & 0x0800, 0x0800, "names are UTF-8");
assert.equal(v.getUint32(14, true), crc32('{"a":1}'));
const end = bytes.length - 22;
assert.equal(v.getUint32(end, true), 0x06054b50, "ends with the end record");
assert.equal(v.getUint16(end + 10, true), 3);
assert.equal(v.getUint32(v.getUint32(end + 16, true), true), 0x02014b50, "the end record points at the central directory");
assert.equal(v.getUint16(12, true), (46 << 9) | (11 << 5) | 25, "DOS date");
assert.equal(v.getUint16(10, true), (14 << 11) | (30 << 5) | 5, "DOS time");

// Round trip.
const back = unzip(bytes);
assert.deepEqual(back.map((f) => f.name), ["drawings.json", "3-zoë-1.png", "empty.txt"]);
assert.equal(new TextDecoder().decode(back[0].data), '{"a":1}');
assert.deepEqual([...back[1].data], [...png]);
assert.equal(back[2].data.length, 0);
const bad = bytes.slice(); bad[30 + "drawings.json".length] ^= 1;
assert.throws(() => unzip(bad), /CRC/);

// And the system's unzip agrees, where there is one.
const dir = mkdtempSync(join(tmpdir(), "sumgeon-zip-"));
try {
  writeFileSync(join(dir, "t.zip"), bytes);
  let unz = true;
  try { execFileSync("unzip", ["-v"], { stdio: "pipe" }); } catch (e) { unz = false; }
  if (unz) {
    const t = execFileSync("unzip", ["-t", join(dir, "t.zip")], { encoding: "utf8" });
    assert.match(t, /No errors detected/);
    assert.equal(execFileSync("unzip", ["-p", join(dir, "t.zip"), "drawings.json"], { encoding: "utf8" }), '{"a":1}');
  }

  // Names.
  assert.equal(slug("Zoë Q."), "zoe-q");
  assert.equal(slug(""), "someone");
  assert.equal(slug("Someone else"), "someone-else");
  assert.deepEqual(pngNames([{ digit: 3, who: "Maya" }, { digit: 3, who: "Maya" }, { digit: 4, who: "Maya" }, { digit: 3, who: "Ben" }]),
    ["3-maya-1.png", "3-maya-2.png", "4-maya-1.png", "3-ben-1.png"]);
  assert.equal(zipName(new Date(2026, 0, 5)), "sumgeon-drawings-2026-01-05.zip");

  // A fixture: [x, y] per point, a label for who, the built-in read.
  const rec = { id: "r1", digit: 7, round: 1, who: "Maya", whoId: "default", width: 358.4, height: 358.4, dpr: 3, pointer: "touch", ua: "x", at: "2026-11-25T00:00:00Z",
    strokes: [[{ x: 10.04, y: 20.06, t: 0 }, { x: 30, y: 20, t: 16 }], [{ x: 30, y: 20, t: 400 }, { x: 15, y: 60, t: 420 }]],
    read: { builtin: { digit: 7, reversed: false, clear: true, fit: 0.8, margin: 0.4, name: "7" }, player: null } };
  assert.deepEqual(toFixture(rec, "kid-1"), { id: "r1", digit: 7, who: "kid-1", width: 358.4, height: 358.4, pointer: "touch",
    strokes: [[[10, 20.1], [30, 20]], [[30, 20], [15, 60]]], read: { digit: 7, reversed: false, clear: true } });

  // The fixture script reads a shared zip, keeps names out, and doesn't add a drawing twice.
  const shared = zip([{ name: "drawings.json", data: drawingsJSON([rec, { ...rec, id: "r2", digit: 2 }], "abc1234") }, { name: "README.txt", data: README }]);
  writeFileSync(join(dir, "d.zip"), shared);
  const script = fileURLToPath(new URL("drawings-to-fixtures.mjs", import.meta.url)), out = join(dir, "fx.json");
  execFileSync(process.execPath, [script, join(dir, "d.zip"), "--out", out], { stdio: "pipe" });
  execFileSync(process.execPath, [script, join(dir, "d.zip"), "--out", out], { stdio: "pipe" });
  const fx = JSON.parse(readFileSync(out, "utf8"));
  assert.deepEqual(fx.fixtures.map((f) => [f.id, f.digit]), [["r2", 2], ["r1", 7]]);
  assert.match(fx.fixtures[0].who, /^drawer-\d+$/);
  assert.ok(!readFileSync(out, "utf8").includes("Maya"), "names stay out of the fixtures");
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log("✓ zip and drawings");
