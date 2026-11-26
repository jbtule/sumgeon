// Builds the recorded voice (Kokoro "af_heart", and "af_bella" for the heroes' quips: VOICE_FOR)
// for every line in js/lines.js, patterned on sound-box-crosswords' scripts/audio/build.mjs, and
// lays out the Cloudflare Pages project sumgeon-audio:
//   ASSET_BASE=https://sumgeon.asset-data.stream/ node scripts/audio/build.mjs
//
// Writes:
//   _audio/a/<key>.mp3  one clip each; <key> hashes everything that affects the sound (model,
//                       voice, speed, method, text), so a clip never changes once made
//   _audio/s/<key>.mp3  an audio sprite: a small group of lines (lines.js `file`, from
//                       spriteFor: every line is in one), their clips' bytes one after another, and
//   _audio/s/<key>.json where each line's clip starts in it and how long it is, in bytes. <key>
//                       hashes the clips in it.
//   _audio/index.json   every clip key (and "s-" + sprite key) in this deploy; the next build
//                       reads it from the live site to know what already exists
//   _audio/_headers     long-lived caching for clips
//   audio.json          { base, voice, clips: { "q:seven plus eight": key, ... }, sprites: [{ name,
//                       url, lines: { "q:seven plus eight": [offset, length] } }] }, shipped with
//                       the game (scripts/stamp.mjs copies it when it's there)
//
// Only missing clips are recorded. With GENERATE=false (CI without the Cloudflare token, which
// couldn't upload new clips anyway) nothing is recorded and audio.json lists only the lines
// already live: the rest use the device voice, line by line.
//   --plan    print the plan and stop (used by the check)
// The step that runs Kokoro is kokoro.sh (Linux). On a Mac, KOKORO=container runs it in
// Apple's `container`, reusing KOKORO_DIR (the model files and a venv) between runs.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, appendFileSync, readdirSync } from "node:fs";
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
// Joins a sprite's clips (already in dir/a) into dir/s/<key>.mp3 and its .json map: { line id:
// [byte offset, byte length] }.
export function buildSprite(sp, dir) {
  const parts = [], lines = {};
  let at = 0;
  for (const c of sp.clips) {
    const b = readFileSync(join(dir, "a", c.key + ".mp3"));
    lines[c.id] = [at, b.length];
    parts.push(b);
    at += b.length;
  }
  mkdirSync(join(dir, "s"), { recursive: true });
  writeFileSync(join(dir, "s", sp.key + ".mp3"), Buffer.concat(parts));
  writeFileSync(join(dir, "s", sp.key + ".json"), JSON.stringify({ lines }));
  return lines;
}
// Cloudflare Pages serves files up to 25 MiB.
export const MAX_FILE = 25 * 1024 * 1024;

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

  // spriteMaps: { key: { line id: [byte offset, byte length] } } for the sprites shipped; the game
  // plays a line from its single clip until its sprite has loaded, or when it isn't in one.
  const done = (clipsInJson, deploy, spriteMaps) => {
    const listed = new Set(clipsInJson.map((c) => c.id));
    const spritesInJson = sprites.filter((s) => spriteMaps[s.key] && s.clips.every((c) => listed.has(c.id)))
      .map((s) => ({ name: s.name, url: base + "s/" + s.key + ".mp3", lines: spriteMaps[s.key] }));
    writeFileSync(join(root, "audio.json"), JSON.stringify({ base: base + "a/", voice: VOICE, clips: Object.fromEntries(clipsInJson.map((c) => [c.id, c.key])), sprites: spritesInJson }));
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
  if (!missing.length && !spritesMissing.length) return done(plan, false, await liveMaps());
  // Missing clips but no way to upload them: ship what's live.
  if (!generate) {
    console.log("GENERATE=false: not recording; the missing lines use the device voice");
    return done(plan.filter((c) => live.has(c.key)), false, await liveMaps());
  }

  // A Pages deploy replaces the whole site, so the live clips come along (Cloudflare bandwidth
  // is free) and only the missing ones are recorded.
  // Clips already in _audio/a from an earlier local build are kept (a key never changes its
  // sound), and any not in the plan are pruned; the sprites are always made fresh.
  const out = join(root, "_audio");
  rmSync(join(out, "s"), { recursive: true, force: true });
  mkdirSync(join(out, "a"), { recursive: true });
  const keys = new Set(plan.map((c) => c.key));
  for (const f of readdirSync(join(out, "a"))) if (!keys.has(f.replace(/\.mp3$/, ""))) rmSync(join(out, "a", f));
  const queue = plan.filter((c) => live.has(c.key) && !existsSync(join(out, "a", c.key + ".mp3")));
  async function worker() {
    for (let c; (c = queue.shift()); ) {
      try {
        const res = await fetch(`${base}a/${c.key}.mp3`);
        if (res.ok) { writeFileSync(join(out, "a", c.key + ".mp3"), Buffer.from(await res.arrayBuffer())); continue; }
      } catch (e) { /* record it below */ }
      missing.push(c);
    }
  }
  await Promise.all(Array.from({ length: 16 }, worker));

  const missingPath = join(out, "missing.json");
  const record = missing.filter((c) => !existsSync(join(out, "a", c.key + ".mp3")));
  writeFileSync(missingPath, JSON.stringify(record));
  if (!record.length) { /* only sprites to make */ } else if (process.env.KOKORO === "container") {
    const dir = process.env.KOKORO_DIR;
    if (!dir) throw new Error("set KOKORO_DIR to a folder for the model files and venv");
    execFileSync("container", ["run", "--rm", "--memory", "4G",
      "--mount", `type=virtiofs,source=${join(root, "scripts/audio")},target=/a`,
      "--mount", `type=virtiofs,source=${dir},target=/k`,
      "--mount", `type=virtiofs,source=${out},target=/o`,
      "--env", "KOKORO_DIR=/k",
      "docker.io/library/python:3.12-slim", "sh", "/a/kokoro.sh", "/o/missing.json", "/o/a"], { stdio: "inherit" });
  } else {
    execFileSync("sh", [join(root, "scripts/audio/kokoro.sh"), missingPath, join(out, "a")], { stdio: "inherit" });
  }
  rmSync(missingPath);
  for (const c of plan) if (!existsSync(join(out, "a", c.key + ".mp3"))) throw new Error(`clip not produced: ${c.id}`);
  // Every sprite is rebuilt from the clips (quick, and the same every time): all the clips are
  // here, the live ones fetched above and the new ones just recorded.
  const maps = {};
  let biggest = { size: 0 };
  for (const sp of sprites) {
    maps[sp.key] = buildSprite(sp, out);
    const size = Object.values(maps[sp.key]).reduce((a, l) => a + l[1], 0);
    if (size > MAX_FILE) throw new Error(`sprite ${sp.name} is ${size} bytes, over Cloudflare's 25 MiB`);
    if (size > biggest.size) biggest = { size, name: sp.name };
  }
  console.log(`${sprites.length} sprites; the biggest, ${biggest.name}, is ${(biggest.size / 1e6).toFixed(2)} MB`);

  writeFileSync(join(out, "index.json"), JSON.stringify(plan.map((c) => c.key).concat(sprites.filter((s) => maps[s.key]).map((s) => "s-" + s.key))));
  writeFileSync(join(out, "_headers"), [
    "/a/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "  Access-Control-Allow-Origin: https://tools.tuley.name",
    "/s/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "  Access-Control-Allow-Origin: https://tools.tuley.name",
    "/index.json",
    "  Cache-Control: no-store",
    "",
  ].join("\n"));
  done(plan, true, maps);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
