// Builds the recorded voice (Kokoro "af_heart", and "af_bella" for the heroes' quips: VOICE_FOR)
// for every line in js/lines.js, patterned on sound-box-crosswords' scripts/audio/build.mjs, and
// lays out the Cloudflare Pages project sumgeon-audio:
//   ASSET_BASE=https://sumgeon.asset-data.stream/ node scripts/audio/build.mjs
//
// Writes:
//   _clips/<key>.mp3    one clip each, kept here to build from, not deployed (DEPLOY_CLIPS); <key>
//                       hashes everything that affects the sound (model, voice, speed, method,
//                       text), so a clip never changes once made
//   _audio/s/<key>.mp3  an audio sprite: a small group of lines (lines.js `file`, from
//                       spriteFor: every line is in one), their clips' bytes one after another, and
//   _audio/s/<key>.json where each line's clip starts in it and how long it is, in bytes ("lines"),
//                       and its clip key ("keys"). <key> hashes the clips in it.
//   _audio/index.json   every clip key (each one's bytes are in a sprite) and "s-" + sprite key in
//                       this deploy; the next build reads it from the live site to know what
//                       already exists
//   _audio/_headers     long-lived caching, and CORS for the game's ranged fetches
//   audio.json          { voice, clips: { "q:seven plus eight": key, ... }, sprites: [{ name, url,
//                       lines: { "q:seven plus eight": [offset, length] } }] } (and base, the
//                       clips' folder, with DEPLOY_CLIPS), shipped with the game
//                       (scripts/stamp.mjs copies it when it's there)
//
// Only missing clips are recorded. The clips already live are cut back out of the live sprites
// (a line's bytes in a sprite are exactly its clip), so nothing is recorded twice and CI needs no
// cache. With GENERATE=false (CI without the Cloudflare token, which couldn't upload new clips
// anyway) nothing is recorded and audio.json lists only the lines already live: the rest use the
// device voice, line by line.
//   --plan    print the plan and stop (used by the check)
// The step that runs Kokoro is kokoro.sh (Linux). On a Mac, KOKORO=container runs it in
// Apple's `container`, reusing KOKORO_DIR (the model files and a venv) between runs.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, appendFileSync, readdirSync, renameSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { spokenLines } from "../../js/lines.js";

export const MODEL = "kokoro-v1.0";
export const VOICE = "af_heart";
// The speed each kind is said at, and how. "text" says the line as one recording, picked by
// ear over stitching numbers together (the Nov 2026 listen test: every whole clip passed,
// most stitched ones sounded choppy).
export const SPEED = { p: 0.95, m: 0.95, q: 0.95, h: 0.95 };
// h = a hero's quip (Hero Moments): said in its own voice, as Sound Box does for its quips, so a
// quip is never taken for an instruction.
export const VOICE_FOR = { h: "af_bella" };
export const voiceOf = (kind) => VOICE_FOR[kind] ?? VOICE;
export const METHOD = "text-v1";
const ENCODING = "mp3-64k";

const root = fileURLToPath(new URL("../..", import.meta.url));

// The voice is part of the key, so a clip in another voice is another clip (every af_heart
// line keeps its key).
export function keyFor(kind, text) {
  return createHash("sha256").update(JSON.stringify([MODEL, voiceOf(kind), ENCODING, METHOD, SPEED[kind], kind, text])).digest("hex").slice(0, 20);
}

// { id: "kind:text", key, kind, text, voice, speed, sprite } for every line; `sprite` is the
// sprite file it's in (lines.js spriteFor, cut into parts by size: "q-third-1-mul.2").
export function planClips() {
  return spokenLines().map(({ kind, text, file }) => ({ id: kind + ":" + text, key: keyFor(kind, text), kind, text, voice: voiceOf(kind), speed: SPEED[kind], sprite: file }));
}

// Audio sprites: { name, key, clips } for each sprite. The key hashes how sprites are made and
// the clips in it, so a sprite never changes once made either.
//   sprite-v2: the clips' MP3 bytes one after another, with a map of where each starts. Every clip
//   is whole MP3 frames with no header, so a line's bytes are exactly its clip: the game decodes
//   just that line (speech.js), and it sounds the same as the clip, with no timing to line up.
//   (sprite-v1 decoded PCM joined with gaps and re-encoded, decoded whole: 96 KB a second of
//   speech held in memory, over 100 MB a stratum once every line is in a sprite.)
export const SPRITE_METHOD = "sprite-v2: clip bytes joined";
export function planSprites(plan) {
  const groups = {};
  for (const c of plan) if (c.sprite) (groups[c.sprite] = groups[c.sprite] || []).push(c);
  return Object.entries(groups).map(([name, clips]) => ({ name, clips,
    key: createHash("sha256").update(JSON.stringify([SPRITE_METHOD, clips.map((c) => c.key)])).digest("hex").slice(0, 20) }));
}
// Joins a sprite's clips (already in clipDir) into dir/s/<key>.mp3 and its .json map: { lines:
// { line id: [byte offset, byte length] }, keys: { line id: clip key } }. Returns the lines.
export function buildSprite(sp, clipDir, dir) {
  const parts = [], lines = {}, keys = {};
  let at = 0;
  for (const c of sp.clips) {
    const b = readFileSync(join(clipDir, c.key + ".mp3"));
    lines[c.id] = [at, b.length];
    keys[c.id] = c.key;
    parts.push(b);
    at += b.length;
  }
  mkdirSync(join(dir, "s"), { recursive: true });
  writeFileSync(join(dir, "s", sp.key + ".mp3"), Buffer.concat(parts));
  writeFileSync(join(dir, "s", sp.key + ".json"), JSON.stringify({ lines, keys }));
  return lines;
}
// Cloudflare Pages serves files up to 25 MiB.
export const MAX_FILE = 25 * 1024 * 1024;

// Whether the single clips are deployed too (_audio/a/<key>.mp3, and audio.json's `base`). They
// aren't: the game plays every line from its sprite, a line whose sprite isn't loaded fetched on
// its own with a Range request (js/ranges.js), which keeps the audio host far under Cloudflare
// Pages' 20,000 files a deploy. The way back, if a device can't do ranged fetches: set this to
// true and merge. The next build sees the clips missing from the host, deploys them, and lists
// `base`, and speech.js plays a line's clip whenever its sprite can't.
export const DEPLOY_CLIPS = false;

// The clips in a live sprite, from its map ({ lines: { id: [off, len] }, keys: { id: key } }):
// [{ key, off, len }]. A sprite built before "keys" was written has only "lines": then a line's
// clip is the one keyFor gives today, if that key is live (index.json). A deploy builds every
// sprite from the clips of its own plan, one key per line, so a live key for a line is the clip
// that's in the live sprite (a key hashes the kind and text, so it can't be another line's).
export function clipsIn(map, live) {
  const out = [];
  for (const [id, [off, len]] of Object.entries(map.lines || {})) {
    const i = id.indexOf(":"), key = (map.keys && map.keys[id]) || keyFor(id.slice(0, i), id.slice(i + 1));
    if (live.has(key)) out.push({ key, off, len });
  }
  return out;
}

// The audio host's _headers: immutable caching, and CORS for the game's origin. The game fetches a
// line out of a sprite with a Range request, which the Fetch standard lets go without a preflight
// (one closed range); a browser that sends one anyway gets a 405 from Pages, which doesn't answer
// OPTIONS, and speech.js then fetches the whole sprite instead. Allow-Headers is there for any
// host or proxy that does answer it, and Content-Range is exposed for a player that checks it.
export function headers(withClips) {
  const cors = ["  Access-Control-Allow-Origin: https://tools.tuley.name", "  Access-Control-Allow-Headers: Range", "  Access-Control-Expose-Headers: Content-Range, Content-Length, Accept-Ranges"];
  return [
    ...(withClips ? ["/a/*", "  Cache-Control: public, max-age=31536000, immutable", ...cors] : []),
    "/s/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    ...cors,
    "/index.json",
    "  Cache-Control: no-store",
    "",
  ].join("\n");
}

function output(name, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

async function main() {
  const plan = planClips();
  const sprites = planSprites(plan);
  if (process.argv.includes("--plan")) {
    console.log(JSON.stringify({ clips: plan, sprites: sprites.map((s) => ({ name: s.name, key: s.key, lines: s.clips.length })) }, null, 2));
    return;
  }
  const base = process.env.ASSET_BASE;
  if (!base || !base.endsWith("/")) throw new Error("set ASSET_BASE to the audio site URL, ending in /");
  const generate = process.env.GENERATE !== "false";

  // Clips already live. The very first deploy has no index.json yet.
  let live = new Set();
  try {
    const res = await fetch(base + "index.json", { cache: "no-store" });
    if (res.ok) live = new Set(await res.json());
  } catch (e) { /* treat as empty */ }
  const missing = plan.filter((c) => !live.has(c.key));
  const spritesMissing = sprites.filter((s) => !live.has("s-" + s.key));
  console.log(`${plan.length} clips: ${plan.length - missing.length} live, ${missing.length} missing; ${sprites.length} sprites, ${spritesMissing.length} missing`);
  // Whether the host's single clips match DEPLOY_CLIPS: a deploy with them still there (the first
  // build after they were turned off) or without them (after turning them back on) is redone.
  const sample = plan.find((c) => live.has(c.key));
  let clipsLive = null;
  if (sample) try { clipsLive = (await fetch(`${base}a/${sample.key}.mp3`, { method: "HEAD", cache: "no-store" })).ok; } catch (e) { /* unknown: leave it */ }
  const redeploy = clipsLive !== null && clipsLive !== DEPLOY_CLIPS;
  if (redeploy) console.log(DEPLOY_CLIPS ? "the single clips aren't deployed: deploying them again" : "the single clips are still deployed: deploying the sprites without them");

  // spriteMaps: { key: { line id: [byte offset, byte length] } } for the sprites shipped; the game
  // plays every line from its sprite (loaded, saved, or the line's range fetched on its own).
  const done = (clipsInJson, deploy, spriteMaps) => {
    const listed = new Set(clipsInJson.map((c) => c.id));
    const spritesInJson = sprites.filter((s) => spriteMaps[s.key] && s.clips.every((c) => listed.has(c.id)))
      .map((s) => ({ name: s.name, url: base + "s/" + s.key + ".mp3", lines: spriteMaps[s.key] }));
    // A line is listed only when its sprite is: without the single clips deployed, a line can
    // only be played from its sprite.
    const inSprite = new Set(spritesInJson.flatMap((s) => Object.keys(s.lines)));
    const playable = DEPLOY_CLIPS ? clipsInJson : clipsInJson.filter((c) => inSprite.has(c.id));
    writeFileSync(join(root, "audio.json"), JSON.stringify({ ...(DEPLOY_CLIPS ? { base: base + "a/" } : {}), voice: VOICE, clips: Object.fromEntries(playable.map((c) => [c.id, c.key])), sprites: spritesInJson }));
    output("deploy", deploy ? "true" : "false");
    console.log(`✓ audio.json lists ${clipsInJson.length} of ${plan.length} lines and ${spritesInJson.length} sprites${deploy ? "; _audio/ ready to deploy" : ""}`);
  };
  // The maps of sprites already live.
  async function liveMaps() {
    const maps = {};
    await Promise.all(sprites.filter((s) => live.has("s-" + s.key)).map(async (s) => {
      try { const r = await fetch(base + "s/" + s.key + ".json"); if (r.ok) maps[s.key] = (await r.json()).lines; } catch (e) { /* no sprite then */ }
    }));
    return maps;
  }

  // Everything is live: nothing to record or upload, just the map for the game.
  if (!missing.length && !spritesMissing.length && !redeploy) return done(plan, false, await liveMaps());
  // Missing clips but no way to upload them: ship what's live.
  if (!generate) {
    console.log("GENERATE=false: not recording; the missing lines use the device voice");
    return done(plan.filter((c) => live.has(c.key)), false, await liveMaps());
  }

  // A Pages deploy replaces the whole site, so every sprite is rebuilt from all its clips: the
  // live ones are cut back out of the live sprites (Cloudflare bandwidth is free) and only the
  // missing ones are recorded.
  // Clips already in _clips from an earlier local build are kept (a key never changes its sound),
  // and any not in the plan are pruned; the sprites are always made fresh.
  const out = join(root, "_audio"), clipDir = join(root, "_clips");
  rmSync(join(out, "s"), { recursive: true, force: true });
  if (!existsSync(clipDir) && existsSync(join(out, "a"))) renameSync(join(out, "a"), clipDir); // where an older build kept them
  rmSync(join(out, "a"), { recursive: true, force: true });
  mkdirSync(clipDir, { recursive: true });
  mkdirSync(out, { recursive: true });
  const keys = new Set(plan.map((c) => c.key));
  for (const f of readdirSync(clipDir)) if (!keys.has(f.replace(/\.mp3$/, ""))) rmSync(join(clipDir, f));
  const wanted = new Set(plan.filter((c) => live.has(c.key) && !existsSync(join(clipDir, c.key + ".mp3"))).map((c) => c.key));
  // Each live sprite (index.json's "s-" keys, the old ones of a group that changed too) holding a
  // wanted clip: fetched once, its clips cut out.
  const queue = [...live].filter((k) => k.startsWith("s-")).map((k) => k.slice(2));
  async function worker() {
    for (let k; (k = queue.shift()); ) {
      try {
        const r = await fetch(`${base}s/${k}.json`);
        if (!r.ok) continue;
        const inIt = clipsIn(await r.json(), live).filter((c) => wanted.has(c.key));
        if (!inIt.length) continue;
        const res = await fetch(`${base}s/${k}.mp3`);
        if (!res.ok) continue;
        const bytes = Buffer.from(await res.arrayBuffer());
        for (const c of inIt) {
          if (!wanted.has(c.key) || c.off + c.len > bytes.length) continue;
          writeFileSync(join(clipDir, c.key + ".mp3"), bytes.subarray(c.off, c.off + c.len));
          wanted.delete(c.key);
        }
      } catch (e) { /* its clips: from the single clips below, or recorded */ }
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));
  // Any still wanted: a single clip, while those are on the host (older deploys), else recorded.
  const rest = [...wanted];
  async function clipWorker() {
    for (let k; (k = rest.shift()); ) {
      try {
        const res = await fetch(`${base}a/${k}.mp3`);
        if (res.ok) { writeFileSync(join(clipDir, k + ".mp3"), Buffer.from(await res.arrayBuffer())); wanted.delete(k); }
      } catch (e) { /* recorded below */ }
    }
  }
  await Promise.all(Array.from({ length: 16 }, clipWorker));
  for (const c of plan) if (wanted.has(c.key)) missing.push(c);
  console.log(`${keys.size - missing.length} clips here (cut from the live sprites, or kept from before), ${missing.length} to record`);

  const missingPath = join(out, "missing.json");
  const record = missing.filter((c) => !existsSync(join(clipDir, c.key + ".mp3")));
  writeFileSync(missingPath, JSON.stringify(record));
  if (!record.length) { /* only sprites to make */ } else if (process.env.KOKORO === "container") {
    const dir = process.env.KOKORO_DIR;
    if (!dir) throw new Error("set KOKORO_DIR to a folder for the model files and venv");
    execFileSync("container", ["run", "--rm", "--memory", "4G",
      "--mount", `type=virtiofs,source=${join(root, "scripts/audio")},target=/a`,
      "--mount", `type=virtiofs,source=${dir},target=/k`,
      "--mount", `type=virtiofs,source=${out},target=/o`,
      "--mount", `type=virtiofs,source=${clipDir},target=/c`,
      "--env", "KOKORO_DIR=/k",
      "docker.io/library/python:3.12-slim", "sh", "/a/kokoro.sh", "/o/missing.json", "/c"], { stdio: "inherit" });
  } else {
    execFileSync("sh", [join(root, "scripts/audio/kokoro.sh"), missingPath, clipDir], { stdio: "inherit" });
  }
  rmSync(missingPath);
  for (const c of plan) if (!existsSync(join(clipDir, c.key + ".mp3"))) throw new Error(`clip not produced: ${c.id}`);
  // Every sprite is rebuilt from the clips (quick, and the same every time): all the clips are
  // here, the live ones fetched above and the new ones just recorded.
  const maps = {};
  let biggest = { size: 0 };
  for (const sp of sprites) {
    maps[sp.key] = buildSprite(sp, clipDir, out);
    const size = Object.values(maps[sp.key]).reduce((a, l) => a + l[1], 0);
    if (size > MAX_FILE) throw new Error(`sprite ${sp.name} is ${size} bytes, over Cloudflare's 25 MiB`);
    if (size > biggest.size) biggest = { size, name: sp.name };
  }
  console.log(`${sprites.length} sprites; the biggest, ${biggest.name}, is ${(biggest.size / 1e6).toFixed(2)} MB`);

  writeFileSync(join(out, "index.json"), JSON.stringify(plan.map((c) => c.key).concat(sprites.filter((s) => maps[s.key]).map((s) => "s-" + s.key))));
  if (DEPLOY_CLIPS) {
    mkdirSync(join(out, "a"), { recursive: true });
    for (const c of plan) copyFileSync(join(clipDir, c.key + ".mp3"), join(out, "a", c.key + ".mp3"));
  }
  writeFileSync(join(out, "_headers"), headers(DEPLOY_CLIPS));
  done(plan, true, maps);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
