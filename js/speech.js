import { audioContext } from "./sfx.js";
import { saveOrder, VOICE_CACHE } from "./offline.js";

// Speech, patterned on sound-box-crosswords' speech.js. say(kind, text) plays a recorded clip
// when audio.json has one (Kokoro, recorded by scripts/audio/build.mjs), or falls back to the
// device voice: lines without a clip, local dev, or a clip that fails to load. On iOS speech
// only works after a tap; everything fails quietly.
//
// Kinds: "p" phrase (UI and instructions), "m" monster or hero line, "n" number, "q" problem,
// "h" a hero's quip (Hero Moments), recorded in a second voice (af_bella). With the device voice,
// a quip is said a little higher, so it still doesn't sound like an instruction.

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
function speak(text, rate, pitch) {
  return new Promise(function (resolve) {
    if (!synth) { setTimeout(resolve, 300); return; }
    try {
      var u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = "en-US"; u.rate = rate || 0.95; u.pitch = pitch || 1;
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
// Audio sprites (audio.json "sprites", built by scripts/audio/build.mjs; lines.js spriteFor): every
// line is in one, a small file of related lines (a stratum's sums, a monster's lines), their clips'
// bytes one after another. A sprite is downloaded (after the first tap) only while the game needs
// it (needSprites), and kept as those compressed bytes, about 8 KB a second of speech; a line is
// decoded from its own bytes when it's said, which is exactly its clip, so it sounds the same.
// Decoding whole sprites would hold 96 KB a second of speech (over 100 MB a stratum).
// spriteOf["kind:text"] = { s, off, len }.
var sprites = [], spriteOf = {}, source = null, need = {};
// The last few lines decoded, for a line said again ("Oops!", a problem asked then answered).
var decoded = [], DECODED_MAX = 24;
// The sound effects' Web Audio context (sfx.js), shared: one context is what Safari handles well.
function ac() { return audioContext(); }
var queue = Promise.resolve(), epoch = 0, pending = 0;
// The device-voice rate each kind is spoken at.
var RATE = { p: 0.95, m: 0.95, n: 0.95, q: 0.85, h: 1 }, PITCH = { h: 1.3 };

(function loadClips() {
  try {
    var url = new URL("../audio.json", import.meta.url);
    url.search = new URL(import.meta.url).search; // the same ?v= stamp
    fetch(url).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (m) {
        if (!m || !m.clips) return;
        clips = m.clips; clipBase = m.base;
        sprites = (m.sprites || []).map(function (s) { return { name: s.name || "", fam: (s.name || "").replace(/\.\d+$/, ""), url: s.url, lines: s.lines, bytes: null, loading: false, size: 0 }; });
        sprites.forEach(function (s) { Object.keys(s.lines).forEach(function (id) { s.size += s.lines[id][1]; spriteOf[id] = { s: s, id: id, off: s.lines[id][0], len: s.lines[id][1] }; }); });
        loadSprites();
        saveSome();
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
  unlocked = true; setTimeout(saveSome, 1500); // the voice's saving starts a moment after the game's own
  var a = getPlayer();
  if (a.src) return;
  a.src = SILENCE;
  var p = a.play();
  if (p && p.catch) p.catch(function () {});
}
document.addEventListener("pointerdown", unlock, true);
document.addEventListener("keydown", unlock, true);

// The sprite families the game needs now (lines.js ALWAYS, and runSprites for the stratum of the
// run), from app.js. Sprites not in them are let go, so only what this stratum can say is held;
// the others' lines play as single clips if they come up.
export function needSprites(families) {
  need = {};
  (families || []).forEach(function (f) { need[f] = true; });
  loadSprites();
}
// Downloads the sprites needed, a few at a time, once there's an audio context (after the first
// tap) and audio.json has arrived, and drops the ones not needed. Until a sprite is in, its lines
// play as single clips.
var fetching = 0, FETCH_AT_ONCE = 3;
function loadSprites() {
  var c = ac();
  sprites.forEach(function (s) {
    if (!need[s.fam] && s.bytes) {
      s.bytes = null;
      decoded = decoded.filter(function (d) { return d.s !== s; });
    }
  });
  if (!c) return;
  sprites.forEach(function (s) {
    if (!need[s.fam] || s.bytes || s.loading || fetching >= FETCH_AT_ONCE) return;
    s.loading = true; fetching++;
    fetch(s.url).then(function (r) { return r.ok ? r.arrayBuffer() : Promise.reject(); })
      .then(function (data) { if (need[s.fam]) s.bytes = new Uint8Array(data); })
      .catch(function () { /* its lines stay single clips */ })
      .then(function () { s.loading = false; fetching--; loadSprites(); saveSome(); });
  });
}

/* ---------- saving the voice for offline play ----------
   Every sprite is saved in the Cache API (offline.js VOICE_CACHE), in the order app.js gives
   (saveVoice: the sprites every stratum needs, this stratum's lowest level first, the other open
   strata's, then the rest, offline.js saveOrder), a couple at a time in the background after the
   first tap, and never while the game is fetching a sprite it needs now (needSprites). With the
   service worker in charge (sw.js), fetching a sprite is what saves it: the worker keeps it
   cache-first before answering. Sprites an update dropped from audio.json are deleted. */
var unlocked = false, plan = [], saved = null, saveQueue = null, saving = 0, SAVE_AT_ONCE = 2, saveFailed = false, asked = false;
var canCache = typeof caches !== "undefined";
export function saveVoice(families) { plan = families || []; saveQueue = null; saveSome(); }
function busy() { return sprites.some(function (s) { return need[s.fam] && s.loading; }); }
function saveSome() {
  if (!canCache || !unlocked || !sprites.length) return;
  if (!saved) { scanSaved(); return; }
  if (!saveQueue) { saveFailed = false; saveQueue = saveOrder(plan, sprites).filter(function (u) { return !saved[u]; }); }
  while (saving < SAVE_AT_ONCE && saveQueue.length && !busy()) saveOne(saveQueue.shift());
}
// What's in the cache already, once; sprites no longer in audio.json are let go.
var scanning = false;
function scanSaved() {
  if (scanning) return;
  scanning = true;
  var listed = {};
  sprites.forEach(function (s) { listed[new URL(s.url, location.href).href] = s.url; });
  caches.open(VOICE_CACHE).then(function (c) {
    return c.keys().then(function (keys) {
      var have = {};
      return Promise.all(keys.map(function (k) {
        if (listed[k.url]) { have[listed[k.url]] = true; return null; }
        return c.delete(k);
      })).then(function () { saved = have; });
    });
  }).catch(function () { saved = {}; })
    .then(function () { scanning = false; keepStorage(); saveSome(); });
}
// Asks once, quietly, for the saved files to be kept even when the device is short of space.
function keepStorage() {
  if (asked) return;
  asked = true;
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(function (p) { if (!p) return navigator.storage.persist(); }).catch(function () {});
  } catch (e) { /* not offered */ }
}
function saveOne(url) {
  saving++;
  // Through the service worker, which keeps it; without one (before it takes over), kept here.
  var worker = navigator.serviceWorker && navigator.serviceWorker.controller;
  fetch(url).then(function (r) {
    if (!r.ok) throw new Error(r.status);
    if (worker) return r.arrayBuffer();
    return caches.open(VOICE_CACHE).then(function (c) { return c.put(url, r); });
  }).then(function () { saved[url] = true; })
    .catch(function () { saveFailed = true; if (saveQueue) saveQueue.length = 0; /* offline or the host is down: again on the next plan */ })
    .then(function () { saving--; saveSome(); });
}
if (typeof addEventListener === "function") addEventListener("online", function () { saveQueue = null; saveSome(); });
// For Settings → Game: how much of the voice is saved (offline.js offlineLine).
export function offlineStatus() {
  var total = 0, totalBytes = 0, n = 0, bytes = 0;
  sprites.forEach(function (s) { total++; totalBytes += s.size; if (saved && saved[s.url]) { n++; bytes += s.size; } });
  return {
    supported: canCache && typeof navigator !== "undefined" && "serviceWorker" in navigator,
    ready: !!(navigator.serviceWorker && navigator.serviceWorker.controller),
    total: total, saved: n, bytes: bytes, totalBytes: totalBytes,
    saving: saving > 0 || !!(saveQueue && saveQueue.length) || busy(), failed: saveFailed,
    online: navigator.onLine
  };
}
// A line out of a loaded sprite, decoded: its bytes are its whole clip. A promise of an AudioBuffer.
function lineBuffer(hit) {
  for (var i = 0; i < decoded.length; i++) if (decoded[i].id === hit.id) { var d = decoded.splice(i, 1)[0]; decoded.push(d); return d.buf; }
  var c = ac(), bytes = hit.s.bytes.slice(hit.off, hit.off + hit.len).buffer; // a copy: decoding takes it
  var buf = new Promise(function (ok, no) { c.decodeAudioData(bytes, ok, no); });
  var entry = { id: hit.id, s: hit.s, buf: buf, b: null };
  buf.then(function (b) { entry.b = b; }, function () { decoded = decoded.filter(function (d) { return d !== entry; }); });
  decoded.push(entry);
  if (decoded.length > DECODED_MAX) decoded.shift();
  return buf;
}
// Plays one line out of a sprite. Resolves true when it ends, false if it can't be decoded (the
// caller then plays its clip).
function playSprite(hit) {
  var my = epoch;
  return lineBuffer(hit).then(function (buf) {
    if (my !== epoch) return true;
    return new Promise(function (resolve) {
      var c = ac();
      if (c.state !== "running") c.resume();
      var src = c.createBufferSource(), done = false;
      src.buffer = buf;
      src.connect(c.destination);
      // A safety net, as playClip has: if Safari pauses the context mid-line (say, while an
      // <audio> clip starts), onended never comes and every line queued after this one would
      // wait forever. So the line counts as done a moment after its length either way.
      var t = setTimeout(function () { end(); }, (buf.duration + 1.5) * 1000);
      function end() { if (done) return; done = true; clearTimeout(t); if (source === src) { source = null; finishClip = null; } resolve(true); }
      src.onended = end;
      source = src; finishClip = function () { try { src.stop(); } catch (e) {} end(); };
      src.start();
    });
  }).catch(function () { return false; });
}
// What's loaded, for Settings → Game → Sound check: sprites in and listed, the compressed bytes
// held, and the lines decoded (their AudioBuffers: length × 4 bytes × channels).
export function spriteStatus() {
  var held = sprites.filter(function (s) { return s.bytes; });
  return {
    listed: sprites.length, loaded: held.length, wanted: sprites.filter(function (s) { return need[s.fam]; }).length,
    bytes: held.reduce(function (a, s) { return a + s.bytes.length; }, 0),
    decodedLines: decoded.filter(function (d) { return d.b; }).length,
    decodedBytes: decoded.reduce(function (a, d) { return a + (d.b ? d.b.length * 4 * d.b.numberOfChannels : 0); }, 0)
  };
}

// A Hero Moment's quip (kind "h"), played through Web Audio with a hero's treatment: louder
// (HERO_GAIN, then a limiter, past what an <audio> element can do: iOS caps it at full volume),
// and a short arena echo, so it rings out over the moment's sounds. Resolves true when it
// ends, false if it can't (the caller then uses the plain clip). ?herogain=<n> tries another
// gain, ?heroecho=<0..1> another echo level.
var heroQ = (typeof location !== "undefined") ? new URLSearchParams(location.search) : null;
var HERO_GAIN = heroQ && heroQ.get("herogain") ? +heroQ.get("herogain") : 1.5;
var HERO_ECHO = heroQ && heroQ.get("heroecho") ? +heroQ.get("heroecho") : 0.1;
var heroBufs = {};
// fx (optional): { gain, echo, delay } instead of the quip's defaults: say()'s fifth argument.
// hit (optional): the line in a loaded sprite (spriteOf), decoded from there instead of
// fetching the clip ("Depth two!" with the entrance's echo, a quip, a cursed hero's arrival).
function playHero(url, fx, hit) {
  fx = fx || {};
  var G = fx.gain != null ? fx.gain : HERO_GAIN, E = fx.echo != null ? fx.echo : HERO_ECHO, D = fx.delay || 0.13;
  var c = ac();
  if (!c) return Promise.resolve(false);
  var my = epoch;
  var load = hit ? lineBuffer(hit) : heroBufs[url] || (heroBufs[url] = fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then(function (b) { return new Promise(function (ok, no) { c.decodeAudioData(b, ok, no); }); }));
  return load.then(function (buf) {
    if (my !== epoch) return true;
    return new Promise(function (resolve) {
      if (c.state !== "running") c.resume();
      var src = c.createBufferSource(), gain = c.createGain(), lim = c.createDynamicsCompressor();
      var delay = c.createDelay(1), fb = c.createGain(), wet = c.createGain(), tone = c.createBiquadFilter(), done = false;
      src.buffer = buf;
      gain.gain.value = G;
      lim.threshold.value = -10; lim.knee.value = 6; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.15;
      delay.delayTime.value = D; fb.gain.value = 0.32; wet.gain.value = E;
      tone.type = "lowpass"; tone.frequency.value = 3500;
      src.connect(gain); gain.connect(lim);
      gain.connect(delay); delay.connect(tone); tone.connect(fb); fb.connect(delay); tone.connect(wet); wet.connect(lim);
      lim.connect(c.destination);
      var t = setTimeout(function () { end(); }, (buf.duration + 1.5) * 1000);
      function end() { if (done) return; done = true; clearTimeout(t); if (source === src) { source = null; finishClip = null; } setTimeout(function () { try { lim.disconnect(); } catch (e) {} }, 900); resolve(true); }
      src.onended = end;
      source = src; finishClip = function () { try { src.stop(); } catch (e) {} end(); };
      src.start();
    });
  }).catch(function () { if (!hit) delete heroBufs[url]; return false; });
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
// `live`, if given, is asked when the item's turn comes: false skips it, so a line about a
// problem that's already been answered doesn't pile up behind the others.
// Returns a promise for when this item is done. Does nothing with the voice switched off.
// fx, if given ({ gain, echo, delay }), plays the clip with that treatment (playHero), whatever
// its kind: "Now entering the Sumgeon!" echoes like a cavern.
export function say(kind, text, cancel, live, fx) {
  if (!on) return Promise.resolve();
  if (cancel) stopSpeech();
  var my = epoch;
  pending++;
  var done = function () { if (my === epoch) pending = Math.max(0, pending - 1); };
  queue = queue.then(function () {
    if (my !== epoch || (live && !live())) return;
    var key = clips[kind + ":" + text], hit = spriteOf[kind + ":" + text];
    if (!key) return speak(text, RATE[kind], PITCH[kind]);
    var url = clipBase + key + ".mp3", c = ac(), ready = hit && hit.s.bytes && c ? hit : null;
    // The line's single clip, then the device voice: while its sprite loads, or if it fails.
    var fallback = function (ok) {
      if (ok || my !== epoch) return;
      return playClip(url).then(function (ok2) { if (!ok2 && my === epoch) return speak(text, RATE[kind], PITCH[kind]); });
    };
    // A quip, or a line with a treatment (fx), through Web Audio: from its sprite when it's in.
    if (c && (fx || kind === "h")) return playHero(url, fx, ready).then(fallback);
    if (ready) return playSprite(ready).then(fallback);
    return fallback(false);
  });
  queue = queue.then(done, done);
  return queue;
}

// Whether the voice is saying something, or has lines waiting: a Hero Moment that has to cut it
// off plays a record scratch (sfx.scratch).
export function speaking() {
  try { if (synth && synth.speaking) return true; } catch (e) { /* no speech */ }
  return pending > 0;
}

// Cuts off whatever is being said with a sound (a Hero Moment's record scratch, before the
// moment starts). The voice is told to stop now, but an <audio> clip keeps sounding for a moment
// after it's paused (longer on a phone than a Web Audio sound takes to start), so the sound
// starts playAt seconds later, to land as the voice falls silent. Resolves afterS seconds after
// that, when the sound is over.
export function cutOff(play, playAt, afterS) {
  stopSpeech();
  return new Promise(function (r) { setTimeout(r, playAt * 1000); })
    .then(function () { play(); return new Promise(function (r) { setTimeout(r, afterS * 1000); }); });
}

// Stops the clip or speech in progress and drops anything queued.
export function stopSpeech() {
  epoch++; pending = 0;
  queue = Promise.resolve();
  if (finishClip) finishClip(true);
  if (player) { try { player.pause(); } catch (e) {} }
  try { if (synth) synth.cancel(); } catch (e) {}
}
