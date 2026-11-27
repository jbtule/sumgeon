// A line's bytes in its audio sprite (js/ranges.js): only the sprites are deployed, and a line
// whose sprite isn't loaded is fetched on its own with a Range request. Also the build's side
// (scripts/audio/build.mjs): a sprite joined from clips gives each clip back, byte for byte, which
// is how the build gets the live clips without the single clips deployed; and the host's headers.
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { rangeHeader, rangeBytes, linesOf, parseRange } from "../js/ranges.js";
import { buildSprite, clipsIn, keyFor, headers, planClips, planSprites } from "./audio/build.mjs";

// The Range header: one closed range, inclusive (the CORS-safelisted form).
assert.equal(rangeHeader(11904, 10368), "bytes=11904-22271");
assert.equal(rangeHeader(0, 1), "bytes=0-0");
assert.match(rangeHeader(5, 10), /^bytes=\d+-\d+$/);

// The answer: a 206 of exactly the line, or a whole sprite cut at the line.
const whole = new Uint8Array(100).map((_, i) => i).buffer;
const part = new Uint8Array([20, 21, 22, 23, 24]).buffer;
assert.deepEqual([...new Uint8Array(rangeBytes(206, part, 20, 5))], [20, 21, 22, 23, 24]);
assert.equal(rangeBytes(206, part, 20, 6), null, "a short 206 isn't the line");
assert.deepEqual([...new Uint8Array(rangeBytes(200, whole, 20, 5))], [20, 21, 22, 23, 24], "a server that ignored the range: cut it");
assert.equal(rangeBytes(200, whole, 98, 5), null, "past the end");
assert.equal(rangeBytes(404, whole, 0, 5), null);
assert.equal(rangeBytes(416, null, 0, 5), null);
assert.equal(rangeBytes(206, part, 20, 0), null);
const copy = rangeBytes(206, part, 20, 5);
assert.notEqual(copy, part, "a copy: decodeAudioData detaches what it's given");

// Where each line is, from audio.json's sprites.
const at = linesOf([{ name: "a", url: "/s/a.mp3", lines: { "p:Oops!": [0, 10], "p:Hi": [10, 4] } }, { name: "b", url: "/s/b.mp3", lines: { "q:one": [0, 7] } }]);
assert.deepEqual(at["p:Hi"], { url: "/s/a.mp3", off: 10, len: 4 });
assert.deepEqual(at["q:one"], { url: "/s/b.mp3", off: 0, len: 7 });
assert.deepEqual(linesOf(undefined), {});

// A Range header against a file (the worker answers a saved sprite's range with it).
assert.deepEqual(parseRange("bytes=10-19", 100), { start: 10, end: 19 });
assert.deepEqual(parseRange("bytes=90-", 100), { start: 90, end: 99 });
assert.deepEqual(parseRange("bytes=-10", 100), { start: 90, end: 99 });
assert.deepEqual(parseRange("bytes=95-200", 100), { start: 95, end: 99 }, "clamped to the file");
assert.equal(parseRange("bytes=100-110", 100), null, "past the end");
assert.equal(parseRange("bytes=20-10", 100), null);
assert.equal(parseRange("bytes=0-1,5-6", 100), null, "one range only");
assert.equal(parseRange("items=0-1", 100), null);
assert.equal(parseRange("bytes=-", 100), null);
assert.equal(parseRange(null, 100), null);
// sw.js has its own copy (a classic script): the same answers.
const root = fileURLToPath(new URL("..", import.meta.url));
const ctx = { URL, Request: class {}, console };
vm.createContext(ctx);
vm.runInContext(readFileSync(join(root, "sw.js"), "utf8"), ctx);
for (const h of ["bytes=10-19", "bytes=90-", "bytes=-10", "bytes=95-200", "bytes=100-110", "bytes=20-10", "bytes=0-1,5-6", "x", "bytes=-", ""]) {
  assert.deepEqual(JSON.parse(JSON.stringify(ctx.parseRange(h, 100))), parseRange(h, 100), h);
}

// The build: a sprite joined from clips, and each clip cut back out of it, byte for byte, both by
// its map's keys and (for a sprite from before keys were written) by keyFor and the live index.
const dir = mkdtempSync(join(tmpdir(), "sumgeon-sprite-")), clipDir = join(dir, "clips");
mkdirSync(clipDir);
const sp = { name: "test", key: "t1", clips: [["p", "Oops!"], ["p", "Boss floor!"], ["q", "three plus four"]].map(([kind, text], i) => {
  const key = keyFor(kind, text);
  writeFileSync(join(clipDir, key + ".mp3"), Buffer.alloc(192 * (i + 2), i + 1));
  return { id: kind + ":" + text, key, kind, text };
}) };
const lines = buildSprite(sp, clipDir, dir);
const bytes = readFileSync(join(dir, "s", "t1.mp3")), map = JSON.parse(readFileSync(join(dir, "s", "t1.json"), "utf8"));
assert.deepEqual(map.lines, lines);
assert.deepEqual(Object.values(map.keys), sp.clips.map((c) => c.key), "the map names each line's clip");
const live = new Set(sp.clips.map((c) => c.key));
for (const m of [map, { lines: map.lines }]) {
  const got = clipsIn(m, live);
  assert.equal(got.length, 3);
  for (const c of got) assert.ok(bytes.subarray(c.off, c.off + c.len).equals(readFileSync(join(clipDir, c.key + ".mp3"))), "a clip comes back out whole");
}
// A line whose clip isn't live (re-recorded since, or never deployed) isn't taken from an old sprite.
assert.equal(clipsIn({ lines: map.lines }, new Set([sp.clips[0].key])).length, 1);
// The game's view: each line's range is exactly its clip.
const spots = linesOf([{ name: "test", url: "s/t1.mp3", lines }]);
for (const c of sp.clips) {
  const w = spots[c.id], r = parseRange(rangeHeader(w.off, w.len), bytes.length);
  assert.ok(bytes.subarray(r.start, r.end + 1).equals(readFileSync(join(clipDir, c.key + ".mp3"))));
}
rmSync(dir, { recursive: true, force: true });

// Every planned sprite's lines are distinct ids, so a line's range is never ambiguous.
const planned = planSprites(planClips());
assert.equal(new Set(planned.flatMap((s) => s.clips.map((c) => c.id))).size, planned.reduce((a, s) => a + s.clips.length, 0));

// The host's headers: the sprites cached for good and readable by the game, with Range allowed;
// the single clips only when they're deployed (DEPLOY_CLIPS, the way back).
const h = headers(false);
assert.match(h, /^\/s\/\*\n  Cache-Control: public, max-age=31536000, immutable\n  Access-Control-Allow-Origin: https:\/\/tools\.tuley\.name\n  Access-Control-Allow-Headers: Range\n  Access-Control-Expose-Headers: Content-Range/);
assert.ok(!h.includes("/a/*"), "no single clips");
assert.match(h, /\/index\.json\n  Cache-Control: no-store/);
assert.match(headers(true), /^\/a\/\*\n/);
console.log("✓ ranges: a line's bytes in its sprite, the worker's ranges, and clips cut back out of sprites");
