// Builds the recorded voice (Kokoro "af_heart") for every line in js/lines.js, patterned on
// sound-box-crosswords' scripts/audio/build.mjs, and lays out the Cloudflare Pages project
// sumgeon-audio:
//   ASSET_BASE=https://sumgeon.asset-data.stream/ node scripts/audio/build.mjs
//
// Writes:
//   _audio/a/<key>.mp3  one clip each; <key> hashes everything that affects the sound (model,
//                       voice, speed, method, text), so a clip never changes once made
//   _audio/s/<key>.mp3  an audio sprite: one group of lines (lines.js `sprite`, today "names":
//                       the monster and hero lines) joined with short silences, and
//   _audio/s/<key>.json where each line starts and how long it is. <key> hashes the clips in it.
//   _audio/index.json   every clip key (and "s-" + sprite key) in this deploy; the next build
//                       reads it from the live site to know what already exists
//   _audio/_headers     long-lived caching for clips
//   audio.json          { base, voice, clips: { "q:seven plus eight": key, ... } }, shipped with
//                       the game (scripts/stamp.mjs copies it when it's there)
//
// Only missing clips are recorded. With GENERATE=false (CI without the Cloudflare token, which
// couldn't upload new clips anyway) nothing is recorded and audio.json lists only the lines
// already live: the rest use the device voice, line by line.
//   --plan    print the plan and stop (used by the check)
// The step that runs Kokoro is kokoro.sh (Linux). On a Mac, KOKORO=container runs it in
// Apple's `container`, reusing KOKORO_DIR (the model files and a venv) between runs.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, appendFileSync } from "node:fs";
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
export const SPEED = { p: 0.95, m: 0.95, q: 0.95 };
export const METHOD = "text-v1";
const ENCODING = "mp3-64k";

const root = fileURLToPath(new URL("../..", import.meta.url));

export function keyFor(kind, text) {
  return createHash("sha256").update(JSON.stringify([MODEL, VOICE, ENCODING, METHOD, SPEED[kind], kind, text])).digest("hex").slice(0, 20);
}

// { id: "kind:text", key, kind, text, voice, speed, sprite } for every line.
export function planClips() {
  return spokenLines().map(({ kind, text, sprite }) => ({ id: kind + ":" + text, key: keyFor(kind, text), kind, text, voice: VOICE, speed: SPEED[kind], sprite }));
}

// Audio sprites: { name, key, clips } for each group of lines marked with a `sprite`. The key
// hashes how sprites are made and the clips in it, so a sprite never changes once made either.
export const SPRITE_METHOD = "sprite-v1: pcm 24k mono, 0.3 s gaps, mp3 64k";
export function planSprites(plan) {
  const groups = {};
  for (const c of plan) if (c.sprite) (groups[c.sprite] = groups[c.sprite] || []).push(c);
  return Object.entries(groups).map(([name, clips]) => ({ name, clips,
    key: createHash("sha256").update(JSON.stringify([SPRITE_METHOD, clips.map((c) => c.key)])).digest("hex").slice(0, 20) }));
}
// Joins a sprite's clips (already in dir/a) into dir/s/<key>.mp3 and its .json map, with ffmpeg.
// Each line's span gets a little extra on both sides, which the gaps cover, since browsers differ
// in whether they skip the MP3 encoder's start-up delay.
const SR = 24000, GAP = 0.3, LEAD = 0.08, TAIL = 0.15;
export function buildSprite(sp, dir) {
  const pcm = [], lines = {};
  let at = 0;
  const silence = Buffer.alloc(Math.round(GAP * SR) * 2);
  for (const c of sp.clips) {
    const raw = execFileSync("ffmpeg", ["-v", "error", "-i", join(dir, "a", c.key + ".mp3"), "-f", "s16le", "-ac", "1", "-ar", String(SR), "-"], { maxBuffer: 64 << 20 });
    pcm.push(silence, raw);
    at += silence.length / 2;
    lines[c.id] = [+(Math.max(0, at / SR - LEAD)).toFixed(3), +(raw.length / 2 / SR + LEAD + TAIL).toFixed(3)];
    at += raw.length / 2;
  }
  pcm.push(silence);
  mkdirSync(join(dir, "s"), { recursive: true });
  execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "s16le", "-ar", String(SR), "-ac", "1", "-i", "-", "-codec:a", "libmp3lame", "-b:a", "64k", join(dir, "s", sp.key + ".mp3")], { input: Buffer.concat(pcm), maxBuffer: 64 << 20 });
  writeFileSync(join(dir, "s", sp.key + ".json"), JSON.stringify({ lines }));
  return lines;
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

  // spriteMaps: { key: { line id: [start, length] } } for the sprites shipped; the game falls back
  // to single clips for any line not in one.
  const done = (clipsInJson, deploy, spriteMaps) => {
    const listed = new Set(clipsInJson.map((c) => c.id));
    const spritesInJson = sprites.filter((s) => spriteMaps[s.key] && s.clips.every((c) => listed.has(c.id)))
      .map((s) => ({ url: base + "s/" + s.key + ".mp3", lines: spriteMaps[s.key] }));
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
  const out = join(root, "_audio");
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, "a"), { recursive: true });
  const queue = plan.filter((c) => live.has(c.key));
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
  writeFileSync(missingPath, JSON.stringify(missing));
  if (!missing.length) { /* only sprites to make */ } else if (process.env.KOKORO === "container") {
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
  // Every sprite is rebuilt from the clips (quick, and the same every time). Without ffmpeg
  // there are no sprites, and their lines play as single clips.
  const maps = {};
  let hasFfmpeg = true;
  try { execFileSync("ffmpeg", ["-version"], { stdio: "ignore" }); } catch (e) { hasFfmpeg = false; console.log("no ffmpeg: skipping the audio sprites"); }
  if (hasFfmpeg) for (const sp of sprites) { maps[sp.key] = buildSprite(sp, out); console.log(`sprite ${sp.name}: ${sp.clips.length} lines`); }

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
