import { audioContext } from "./sfx.js";

// Speech, patterned on sound-box-crosswords' speech.js. say(kind, text) plays a recorded clip
// when audio.json has one (Kokoro, recorded by scripts/audio/build.mjs), or falls back to the
// device voice: lines without a clip, local dev, or a clip that fails to load. On iOS speech
// only works after a tap; everything fails quietly.
//
// Kinds: "p" phrase (UI and instructions), "m" monster or hero line, "n" number, "q" problem.

var synth = window.speechSynthesis, voice = null, on = true;

export var hasSpeech = !!synth;
export function setVoice(enabled) { on = !!enabled; if (!on) stopSpeech(); }

// Novelty and old robotic voices that ship with Apple devices. Never picked.
var NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Junior|Ralph|Fred|Kathy|Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley)\b/i;
// Clear, natural voices to prefer at the same quality level.
var FAVORED = /\b(Ava|Zoe|Samantha|Allison|Susan|Evan|Nathan|Tom|Google US English|Aria|Jenny|Guy)\b/i;

// Higher is better; 0 means not usable. Downloaded Premium/Enhanced voices win, so
// installing one on the device upgrades the game with no setting to change.
function score(v) {
  if (!/^en/i.test(v.lang) || NOVELTY.test(v.name) || /eloquence/i.test(v.voiceURI)) return 0;
  var id = v.name + " " + v.voiceURI, s = 1;
  if (/^en[-_]US/i.test(v.lang)) s += 4;
  if (/premium/i.test(id)) s += 30;
  else if (/enhanced|natural|neural/i.test(id)) s += 20;
  if (FAVORED.test(v.name)) s += 2;
  return s;
}
function pickVoice() {
  try {
    var vs = synth.getVoices();
    voice = vs.filter(function (v) { return score(v) > 0; })
      .sort(function (a, b) { return score(b) - score(a) || a.name.localeCompare(b.name); })[0]
      || vs.find(function (v) { return /^en/i.test(v.lang); }) || null;
  } catch (e) {}
}
if (synth) { pickVoice(); try { synth.addEventListener("voiceschanged", pickVoice); } catch (e) {} }

// Device voice. Resolves when speech ends, or after a timeout scaled to the text, since
// onend doesn't always fire.
function speak(text, rate) {
  return new Promise(function (resolve) {
    if (!synth) { setTimeout(resolve, 300); return; }
    try {
      var u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = "en-US"; u.rate = rate || 0.95;
      var t = setTimeout(resolve, 1500 + text.length * 120);
      u.onend = function () { clearTimeout(t); resolve(); };
      u.onerror = function () { clearTimeout(t); resolve(); };
      synth.speak(u);
    } catch (e) { resolve(); }
  });
}

/* ---------- recorded clips ----------
   audio.json maps "kind:text" to a clip on the audio host (sumgeon.asset-data.stream). The
   deploy ships it; locally it's missing and the device voice speaks. */
var clips = {}, clipBase = "", player = null, finishClip = null;
// Audio sprites (audio.json "sprites"): one file holding a group of lines (the monster and hero
// names), decoded with Web Audio after the first tap. spriteOf["kind:text"] = { s, start, len }.
var sprites = [], spriteOf = {}, source = null;
// The sound effects' Web Audio context (sfx.js), shared: one context is what Safari handles well.
function ac() { return audioContext(); }
var queue = Promise.resolve(), epoch = 0;
// The device-voice rate each kind is spoken at.
var RATE = { p: 0.95, m: 0.95, n: 0.95, q: 0.85 };

(function loadClips() {
  try {
    var url = new URL("../audio.json", import.meta.url);
    url.search = new URL(import.meta.url).search; // the same ?v= stamp
    fetch(url).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (m) {
        if (!m || !m.clips) return;
        clips = m.clips; clipBase = m.base;
        sprites = (m.sprites || []).map(function (s) { return { url: s.url, lines: s.lines, buf: null, loading: false }; });
        sprites.forEach(function (s) { Object.keys(s.lines).forEach(function (id) { spriteOf[id] = { s: s, start: s.lines[id][0], len: s.lines[id][1] }; }); });
        loadSprites();
      })
      .catch(function () {});
  } catch (e) {}
})();

// One shared <audio> element, unlocked on the first tap with a moment of silence, since iOS
// only lets audio start inside a tap and clips start later.
function getPlayer() { if (!player) { player = new Audio(); player.preload = "auto"; } return player; }
var SILENCE = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";
function unlock() {
  document.removeEventListener("pointerdown", unlock, true);
  document.removeEventListener("keydown", unlock, true);
  // sfx.js made the shared context on this same tap (its listener runs first).
  setTimeout(loadSprites, 0);
  var a = getPlayer();
  if (a.src) return;
  a.src = SILENCE;
  var p = a.play();
  if (p && p.catch) p.catch(function () {});
}
document.addEventListener("pointerdown", unlock, true);
document.addEventListener("keydown", unlock, true);

// Downloads and decodes the sprites in the background, once there's an audio context (after the
// first tap) and audio.json has arrived. Until a sprite is ready, its lines play as single clips.
function loadSprites() {
  var c = ac();
  if (!c) return;
  sprites.forEach(function (s) {
    if (s.buf || s.loading) return;
    s.loading = true;
    fetch(s.url).then(function (r) { return r.ok ? r.arrayBuffer() : Promise.reject(); })
      .then(function (data) { return new Promise(function (ok, no) { c.decodeAudioData(data, ok, no); }); })
      .then(function (buf) { s.buf = buf; })
      .catch(function () { s.loading = false; });
  });
}
// Plays one line out of a decoded sprite. Resolves true when it ends.
function playSprite(hit) {
  return new Promise(function (resolve) {
    try {
      var c = ac();
      if (c.state !== "running") c.resume();
      var src = c.createBufferSource(), done = false;
      src.buffer = hit.s.buf;
      src.connect(c.destination);
      function end() { if (done) return; done = true; if (source === src) { source = null; finishClip = null; } resolve(true); }
      src.onended = end;
      source = src; finishClip = function () { try { src.stop(); } catch (e) {} end(); };
      src.start(0, hit.start, hit.len);
    } catch (e) { resolve(false); }
  });
}

// Resolves true when the clip ends, false if it fails (the caller then uses the device voice).
// Safari's <audio> asks for byte ranges, which the audio host's custom domain answers.
function playClip(url) {
  return new Promise(function (resolve) {
    var a = getPlayer(), done = false;
    function end(ok) {
      if (done) return;
      done = true; finishClip = null; clearTimeout(t);
      a.onended = a.onerror = null;
      resolve(ok);
    }
    var t = setTimeout(function () { end(true); }, 15000);
    finishClip = end;
    a.onended = function () { end(true); };
    a.onerror = function () { end(false); };
    a.src = url;
    var p = a.play();
    if (p && p.catch) p.catch(function () { end(false); });
  });
}

// Plays (or speaks) one item after anything already queued; `cancel` clears the queue first.
// Returns a promise for when this item is done. Does nothing with the voice switched off.
export function say(kind, text, cancel) {
  if (!on) return Promise.resolve();
  if (cancel) stopSpeech();
  var my = epoch;
  queue = queue.then(function () {
    if (my !== epoch) return;
    var key = clips[kind + ":" + text], hit = spriteOf[kind + ":" + text];
    if (!key) return speak(text, RATE[kind]);
    if (hit && hit.s.buf && ac()) return playSprite(hit).then(function (ok) {
      if (!ok && my === epoch) return playClip(clipBase + key + ".mp3");
    });
    return playClip(clipBase + key + ".mp3").then(function (ok) {
      if (!ok && my === epoch) return speak(text, RATE[kind]);
    });
  });
  return queue;
}

// Stops the clip or speech in progress and drops anything queued.
export function stopSpeech() {
  epoch++;
  queue = Promise.resolve();
  if (finishClip) finishClip(true);
  if (player) { try { player.pause(); } catch (e) {} }
  try { if (synth) synth.cancel(); } catch (e) {}
}
