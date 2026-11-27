// Sound effects, synthesized with Web Audio (no files to load), patterned on
// sound-box-crosswords' chime.js. iOS only allows audio that starts from a tap, so the
// context is created on the first tap and woken on later taps if iOS paused it.

var ctx = null, out = null, on = true, noiseBuf = null, lastError = "", played = 0, gestures = 0, stuckSince = 0, remade = 0;
// For telling a dead context that says "running" (below): when the page was last hidden, and the
// context's clock at the last tap.
var hiddenAt = 0, lastTick = null;

// Safari can leave a context "suspended" or "interrupted" (macOS Safari after the tab was in the
// background or another app took the audio), and only resumes it inside a tap or click, so every
// gesture wakes it from anything but "running". A "closed" one is replaced.
//
// Sometimes Safari won't wake it (seen in the Home Screen app: the effects stopped partway and
// stayed silent). So if a tap finds it still not running a second after an earlier tap tried to
// wake it, the context is thrown away and a fresh one made, inside this tap (remade counts them).
//
// And sometimes a context comes back from the background saying "running" but is silent: the
// Home Screen app played 100 effects into it with nothing heard ("Played" kept counting). Nothing
// can listen to the output, so a tap remakes it when the page has been hidden since the last tap,
// or when its clock hasn't moved since the last tap more than half a second ago (a running
// context's currentTime always advances).
function stale() {
  if (!ctx || ctx.state !== "running") return "";
  if (hiddenAt) return "remade after the background";
  var now = performance.now();
  if (lastTick && now - lastTick.at > 500 && ctx.currentTime === lastTick.t) return "remade: its clock stopped";
  return "";
}
function remake(why) {
  lastError = why; remade++;
  try { ctx.close(); } catch (e) { /* already gone */ }
  ctx = null; stuckSince = 0;
}
function unlock() {
  gestures++;
  if (ctx && ctx.state === "closed") ctx = null;
  var why = stale();
  hiddenAt = 0;
  if (why) remake(why);
  if (ctx) lastTick = { at: performance.now(), t: ctx.currentTime };
  if (ctx && ctx.state === "running") { stuckSince = 0; return; }
  if (ctx && stuckSince && performance.now() - stuckSince > 1000) remake("remade after " + ctx.state);
  if (ctx) {
    if (!stuckSince) stuckSince = performance.now();
    try { ctx.resume().then(function () { if (ctx && ctx.state === "running") stuckSince = 0; }, function (e) { lastError = "resume: " + e.message; }); } catch (e) { lastError = "resume: " + e.message; }
    return;
  }
  try {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { lastError = "no Web Audio"; return; }
    // iOS mutes Web Audio when the phone is on silent (the ring switch or Action button), and
    // the voice plays on this context too, so the game went quiet with the phone on silent.
    // "playback" plays like a video does (Safari 16.4+); the volume keys still set how loud.
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) { /* older Safari */ }
    ctx = new AC();
    if (ctx.state !== "running") ctx.resume().catch(function (e) { lastError = "resume: " + e.message; });
    // A moment of silence, played inside the gesture: Safari starts the context's output on it.
    var kick = ctx.createBufferSource();
    kick.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    kick.connect(ctx.destination); kick.start(0);
    out = ctx.createGain();
    out.gain.value = 0.8;
    out.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { ctx = null; lastError = "create: " + e.message; }
}
// Every tap, not just the first: it also wakes audio iOS paused in the background. Safari counts
// some of these as a gesture that may start audio and not others, so listen to all of them.
["pointerdown", "pointerup", "click", "touchend", "keydown"].forEach(function (ev) { document.addEventListener(ev, unlock, true); });
document.addEventListener("visibilitychange", function () { if (document.hidden) hiddenAt = performance.now(); });
window.addEventListener("pagehide", function () { hiddenAt = performance.now(); });

// Settings → Game → Test sound: always starts from a fresh context, inside that tap, so a silent
// one can be fixed by hand. Then plays the test sound (fn) on it.
export function restart(fn) {
  if (ctx) remake("remade by Test sound");
  unlock();
  if (fn) fn();
}

// The one Web Audio context, shared with the voice (speech.js plays its sprites on it): Safari
// handles one context far more reliably than two. null until the first tap.
export function audioContext() { return ctx; }

// For the ?audio readout.
export function status() {
  return { state: ctx ? ctx.state : "not created", rate: ctx ? ctx.sampleRate : 0, on: on, played: played, gestures: gestures, error: lastError, remade: remade };
}

export function setSfx(enabled) { on = !!enabled; }

function play(fn) {
  if (!on || !ctx) return;
  function go() { try { fn(ctx.currentTime + 0.02); played++; } catch (e) { lastError = "play: " + e.message; } }
  // A paused context (Safari: "suspended" or "interrupted"): wake it, then play, so the sound
  // isn't scheduled on a stopped clock.
  if (ctx.state !== "running") { ctx.resume().then(go, function (e) { lastError = "resume: " + e.message; }); return; }
  go();
}
function hz(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

// A tone that glides from f1 to f2 over dur seconds.
function tone(type, f1, f2, t, dur, level) {
  var o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f1, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(level, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out);
  o.start(t); o.stop(t + dur + 0.05);
}
// A burst of filtered noise: chalk scratches, thuds and cracks.
function noise(t, dur, level, filter, freq) {
  var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf;
  f.type = filter; f.frequency.value = freq;
  g.gain.setValueAtTime(level, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(out);
  s.start(t); s.stop(t + dur + 0.05);
}
// A mallet note (MIDI number), for the jingles.
function mallet(midi, t, level, dur) {
  tone("triangle", hz(midi), hz(midi), t, dur, level);
  tone("sine", hz(midi) * 4, hz(midi) * 4, t, dur * 0.3, level * 0.06);
}

// A number-pad key: a soft chalk tick.
export function tick() { play(function (t) { noise(t, 0.03, 0.18, "highpass", 3000); }); }

// The answer leaves the pad: a whoosh that climbs higher as the streak grows.
export function launch(streak) {
  var lift = Math.min(streak, 8) * 1.5;
  play(function (t) {
    tone("sine", hz(67 + lift), hz(79 + lift), t, 0.22, 0.12);
    noise(t, 0.2, 0.08, "bandpass", 1800);
  });
}

// The number lands. A crit adds a crunch and a bright ring.
export function impact(crit) {
  play(function (t) {
    tone("sine", 160, 45, t, 0.18, 0.5);
    noise(t, 0.08, 0.3, "lowpass", 900);
    if (crit) {
      noise(t, 0.22, 0.35, "bandpass", 2500);
      mallet(91, t + 0.02, 0.18, 0.4);
    }
  });
}

// A wrong answer: a low wobble.
export function miss() {
  play(function (t) {
    tone("triangle", 330, 240, t, 0.16, 0.25);
    tone("triangle", 260, 170, t + 0.15, 0.25, 0.25);
  });
}

// A heart breaking off.
export function crack() { play(function (t) { noise(t, 0.12, 0.3, "highpass", 1400); tone("square", 900, 300, t, 0.1, 0.05); }); }

// A monster arrives: a quick pop. Bosses get a low, ominous pair of notes.
export function appear(boss) {
  play(function (t) {
    if (boss) { mallet(43, t, 0.35, 0.6); mallet(42, t + 0.35, 0.35, 0.9); }
    else tone("sine", 300, 900, t, 0.1, 0.18);
  });
}

// A boss's roar, every so often during the fight: a low, wobbling growl over a rumble, with a
// little snarl on top. Spooky, not frightening.
export function roar() {
  play(function (t) {
    var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter(), lfo = ctx.createOscillator(), depth = ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(95, t); o.frequency.linearRampToValueAtTime(70, t + 0.35); o.frequency.exponentialRampToValueAtTime(48, t + 1.1);
    lfo.frequency.value = 11; depth.gain.value = 0.45; lfo.connect(depth).connect(g.gain); // the growl's wobble
    f.type = "lowpass"; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(260, t + 1.1);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o.connect(f).connect(g).connect(out);
    o.start(t); lfo.start(t); o.stop(t + 1.25); lfo.stop(t + 1.25);
    noise(t, 0.9, 0.22, "lowpass", 220);
    noise(t + 0.05, 0.35, 0.1, "bandpass", 1400);
  });
}

/* ---------- the descent (descent.js): falling down through the strata ---------- */
// The fall: a deep rumble that swells, and wind rushing past, rising in pitch as you speed up,
// for dur seconds. stopFall() cuts it short when the descent is skipped.
var falling = null;
export function fall(dur) {
  var d = dur || 1.2;
  play(function (t) {
    var g = ctx.createGain();
    g.gain.value = 1; g.connect(out);
    // The rumble: low noise under a sub tone that sinks.
    var r = ctx.createBufferSource(), rf = ctx.createBiquadFilter(), rg = ctx.createGain();
    r.buffer = noiseBuf; r.loop = true;
    rf.type = "lowpass"; rf.frequency.setValueAtTime(110, t); rf.frequency.linearRampToValueAtTime(220, t + d);
    rg.gain.setValueAtTime(0.0001, t); rg.gain.exponentialRampToValueAtTime(0.5, t + d * 0.6); rg.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.25);
    r.connect(rf).connect(rg).connect(g);
    var o = ctx.createOscillator(), og = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(58, t); o.frequency.exponentialRampToValueAtTime(34, t + d);
    og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.28, t + d * 0.5); og.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.2);
    o.connect(og).connect(g);
    // The wind: band-passed noise sweeping up, with a slow flutter.
    var w = ctx.createBufferSource(), wf = ctx.createBiquadFilter(), wg = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    w.buffer = noiseBuf; w.loop = true;
    wf.type = "bandpass"; wf.Q.value = 1.4; wf.frequency.setValueAtTime(380, t); wf.frequency.exponentialRampToValueAtTime(1500, t + d);
    lfo.frequency.value = 5.5; lg.gain.value = 220; lfo.connect(lg).connect(wf.frequency);
    wg.gain.setValueAtTime(0.0001, t); wg.gain.exponentialRampToValueAtTime(0.22, t + d * 0.8); wg.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.15);
    w.connect(wf).connect(wg).connect(g);
    var end = t + d + 0.3;
    [r, o, w, lfo].forEach(function (n) { n.start(t); n.stop(end); });
    falling = { g: g, end: end };
  });
}
export function stopFall() {
  if (!ctx || !falling) return;
  var f = falling, t = ctx.currentTime;
  falling = null;
  if (t >= f.end) return;
  f.g.gain.cancelScheduledValues(t); f.g.gain.setValueAtTime(f.g.gain.value, t); f.g.gain.linearRampToValueAtTime(0, t + 0.12);
}
// The landing: a low, soft whoomp, a sinking thud with a puff of air.
export function whoomp() {
  play(function (t) {
    tone("sine", 120, 30, t, 0.5, 0.75);
    tone("triangle", 80, 40, t, 0.3, 0.2);
    noise(t, 0.35, 0.35, "lowpass", 260);
    noise(t, 0.12, 0.08, "bandpass", 900);
  });
}

// A floor cleared: a rising mallet jingle.
export function cleared() {
  play(function (t) { [72, 76, 79, 84].forEach(function (m, i) { mallet(m, t + i * 0.09, 0.3, 0.35); }); });
}

/* ---------- Hero Moments (DESIGN.md §8.4, slowmo.js) ---------- */
// Time drags: a tape slowing down, a sweep that drops in pitch through a closing filter.
export function tapeStop(dur) {
  var d = dur || 0.5;
  play(function (t) {
    [0, 7].forEach(function (cents, i) {
      var o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "sawtooth"; o.detune.value = cents;
      o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(55, t + d);
      f.type = "lowpass"; f.Q.value = 4; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(220, t + d);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(i ? 0.08 : 0.14, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.08);
      o.connect(f).connect(g).connect(out);
      o.start(t); o.stop(t + d + 0.1);
    });
    noise(t, d * 0.6, 0.06, "lowpass", 900);
  });
}
// The freeze: a slow double heartbeat, lub-dub.
export function heartbeat() {
  play(function (t) {
    tone("sine", 70, 38, t, 0.16, 0.55);
    tone("sine", 62, 34, t + 0.24, 0.2, 0.42);
    noise(t, 0.05, 0.08, "lowpass", 180);
  });
}
// Into the snap: a reverse cymbal, noise that swells and cuts off.
export function swell(dur) {
  var d = dur || 0.4;
  play(function (t) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true;
    f.type = "highpass"; f.frequency.setValueAtTime(2500, t); f.frequency.exponentialRampToValueAtTime(6000, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + d); g.gain.linearRampToValueAtTime(0, t + d + 0.02);
    s.connect(f).connect(g).connect(out);
    s.start(t); s.stop(t + d + 0.05);
  });
}
// The hero whips into the monster: a fast whoosh.
export function whip() {
  play(function (t) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = "bandpass"; f.Q.value = 2; f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(4500, t + 0.18);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.45, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    s.connect(f).connect(g).connect(out);
    s.start(t); s.stop(t + 0.3);
    tone("sine", hz(72), hz(91), t, 0.18, 0.08);
  });
}
// The landing: a bigger impact than a crit's, a deep thud, a crunch and a ring. big (a team-up's
// landing): a lower, longer thud under it and a fuller ring.
export function slam(big) {
  play(function (t) {
    tone("sine", 190, 32, t, 0.42, 0.7);
    noise(t, 0.16, 0.4, "lowpass", 700);
    noise(t, 0.3, 0.32, "bandpass", 2200);
    mallet(86, t + 0.02, 0.16, 0.6);
    mallet(93, t + 0.04, 0.12, 0.5);
    if (big) {
      tone("sine", 120, 24, t + 0.01, 0.4, 1.1);
      noise(t + 0.03, 0.45, 0.22, "lowpass", 420);
      mallet(81, t + 0.06, 0.12, 0.8);
      mallet(98, t + 0.08, 0.08, 0.6);
    }
  });
}

// How long after the voice is told to stop the record scratch starts (seconds), so it lands as
// the voice actually falls silent (speech.js cutWith). ?scratch=<ms> tries another value.
var scratchQ = (typeof location !== "undefined") && new URLSearchParams(location.search).get("scratch");
export var SCRATCH_AT = scratchQ != null && scratchQ !== "" && !isNaN(+scratchQ) ? +scratchQ / 1000 : 0.12;
// A record scratch: a Hero Moment cutting off the voice mid-line (app.js, the moments page). It
// lasts about SCRATCH seconds.
export var SCRATCH = 0.24;
export function scratch() {
  play(function (t) {
    [[0, 900, 2600, 0.09], [0.09, 2600, 700, 0.11], [0.2, 800, 2200, 0.07]].forEach(function (s) {
      var n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      n.buffer = noiseBuf;
      f.type = "bandpass"; f.Q.value = 6; f.frequency.setValueAtTime(s[1], t + s[0]); f.frequency.exponentialRampToValueAtTime(s[2], t + s[0] + s[3]);
      g.gain.setValueAtTime(0.0001, t + s[0]); g.gain.linearRampToValueAtTime(1.1, t + s[0] + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + s[0] + s[3]);
      n.connect(f).connect(g).connect(out);
      n.start(t + s[0]); n.stop(t + s[0] + s[3] + 0.02);
    });
    tone("sawtooth", 180, 520, t, 0.09, 0.22);
    tone("sawtooth", 520, 140, t + 0.09, 0.11, 0.22);
    tone("square", 260, 90, t + 0.2, 0.08, 0.18); // the needle lifting off
  });
}

// Minustaur's Charge (traits.js): a charged problem crackles as it appears, and a miss on it is
// a thunder strike (it costs 2 hearts) instead of the plain miss.
export function charge() {
  play(function (t) {
    for (var i = 0; i < 5; i++) noise(t + i * 0.045 + Math.random() * 0.02, 0.03, 0.22, "highpass", 3500 + Math.random() * 3000);
    tone("sawtooth", 120, 118, t, 0.35, 0.05);
    tone("square", 1800, 2600, t + 0.05, 0.08, 0.03);
  });
}
// A charged problem answered right: the lightning thrown back, a bright crackle rising into a zap.
export function zap() {
  play(function (t) {
    for (var i = 0; i < 4; i++) noise(t + i * 0.03, 0.03, 0.25, "highpass", 4000 + i * 900);
    tone("sawtooth", 300, 2400, t, 0.14, 0.12);
    tone("square", 2400, 1200, t + 0.12, 0.1, 0.06);
  });
}
export function thunder() {
  play(function (t) {
    noise(t, 0.08, 0.6, "highpass", 2500);
    noise(t + 0.01, 0.12, 0.45, "bandpass", 1200);
    tone("sawtooth", 90, 40, t + 0.05, 0.5, 0.35);
    noise(t + 0.08, 1.1, 0.4, "lowpass", 160);
    tone("triangle", 330, 240, t + 0.2, 0.16, 0.15);
  });
}

// Each hero's own move, at a Hero Moment's hit (heroes.js move; slowmo.js). d: the hero's digit.
var MOVE = {
  // Zeroic, fist-first: a rising whoosh into a punchy pow.
  0: function (t) { noise(t, 0.12, 0.3, "bandpass", 1800); tone("square", 160, 60, t + 0.08, 0.16, 0.35); noise(t + 0.08, 0.08, 0.4, "lowpass", 1200); },
  // Onesie, pillow bonk: a soft fwump and a puff.
  1: function (t) { tone("sine", 140, 70, t, 0.22, 0.45); noise(t, 0.3, 0.12, "lowpass", 600); noise(t + 0.05, 0.25, 0.06, "highpass", 2500); },
  // Twodini, out of a top hat: a sparkle run up, then a pop.
  2: function (t) { [79, 83, 86, 91].forEach(function (m, i) { mallet(m, t + i * 0.05, 0.12, 0.25); }); tone("sine", 900, 300, t + 0.22, 0.06, 0.4); },
  // Threasure Hunter, lantern flash: a bright shimmer.
  3: function (t) { noise(t, 0.35, 0.16, "highpass", 6000); [88, 95].forEach(function (m) { tone("sine", hz(m), hz(m) * 1.01, t, 0.4, 0.07); }); },
  // Sir Fourtress, shield bash: a metal clang.
  4: function (t) { [523, 1187, 1720, 2340].forEach(function (f, i) { tone("square", f, f * 0.99, t, 0.5 - i * 0.08, 0.06); }); noise(t, 0.05, 0.4, "bandpass", 3000); },
  // High Five, a giant high five: a hand-clap smack.
  5: function (t) { noise(t, 0.06, 0.6, "bandpass", 1500); noise(t + 0.012, 0.09, 0.35, "highpass", 2500); },
  // Sixlock Holmes, spots the weak point: a glint, ding!
  6: function (t) { mallet(96, t, 0.25, 0.6); tone("sine", hz(103), hz(103), t + 0.04, 0.3, 0.05); },
  // Sevenstein, big stomp: a deep boom and a rumble.
  7: function (t) { tone("sine", 80, 30, t, 0.6, 0.8); noise(t, 0.5, 0.3, "lowpass", 220); },
  // Chef Eight, a sizzling platter: a sizzle and a plate clink.
  8: function (t) { noise(t, 0.55, 0.14, "highpass", 4500); noise(t + 0.1, 0.4, 0.08, "bandpass", 7000); mallet(91, t, 0.14, 0.3); },
  // Nine-ja, vanish then strike from behind: a smoke poof, then a quick slash.
  9: function (t) { noise(t, 0.2, 0.2, "lowpass", 900); tone("sawtooth", 3000, 600, t + 0.14, 0.08, 0.12); noise(t + 0.14, 0.07, 0.3, "highpass", 4000); }
};
export function move(d) { var f = MOVE[d]; if (f) play(f); }

// The Sumgeon cleared: a short fanfare.
export function victory() {
  play(function (t) {
    [[72, 0], [76, 0.12], [79, 0.24], [84, 0.36], [79, 0.6], [84, 0.72]].forEach(function (n) { mallet(n[0], t + n[1], 0.3, 0.45); });
    [72, 76, 79, 84].forEach(function (m) { mallet(m, t + 0.9, 0.16, 1.2); });
  });
}

// A Legend beaten (DESIGN.md §14.2): a bigger fanfare. A brassy call rising to a held chord,
// a drum roll under it, and a shimmer of sparkles on top, about 3 seconds.
export function legend() {
  play(function (t) {
    for (var i = 0; i < 10; i++) noise(t + i * 0.05, 0.08, 0.12 + i * 0.02, "lowpass", 500); // the drum roll
    noise(t + 0.5, 0.5, 0.5, "lowpass", 220); // the big drum
    [[67, 0.5], [72, 0.62], [76, 0.74], [79, 0.86], [76, 1.04], [79, 1.16], [84, 1.3]].forEach(function (n) {
      tone("sawtooth", hz(n[0]), hz(n[0]), t + n[1], 0.32, 0.05); // brass
      mallet(n[0] + 12, t + n[1], 0.18, 0.4);
    });
    [72, 76, 79, 84, 88].forEach(function (m) { tone("sawtooth", hz(m), hz(m), t + 1.5, 1.6, 0.035); mallet(m, t + 1.5, 0.14, 1.8); });
    noise(t + 1.5, 0.6, 0.45, "lowpass", 200);
    [96, 100, 103, 108, 103, 108].forEach(function (m, i) { mallet(m, t + 1.6 + i * 0.11, 0.08, 0.5); }); // sparkles
    noise(t + 1.6, 1.4, 0.07, "highpass", 7000);
  });
}

/* ---------- chests and items (DESIGN.md §6.3) ---------- */
// A chest's lock pops and the lid creaks open, into a bright treasure fanfare.
export function chestOpen() {
  play(function (t) {
    noise(t, 0.05, 0.5, "bandpass", 2600); // the shackle snaps up
    tone("square", 1300, 1700, t, 0.06, 0.08);
    tone("sawtooth", 180, 260, t + 0.1, 0.35, 0.05); // the lid's creak
    noise(t + 0.1, 0.3, 0.06, "bandpass", 900);
    [[79, 0.45], [83, 0.55], [86, 0.65], [91, 0.75]].forEach(function (n) { mallet(n[0], t + n[1], 0.32, 0.5); });
    [79, 83, 86, 91].forEach(function (m) { mallet(m, t + 0.95, 0.14, 1.3); });
    noise(t + 0.95, 0.8, 0.08, "highpass", 7000); // a sparkle over it
  });
}
// A lock that jams: a dull metal clunk and a rattle.
export function clunk() {
  play(function (t) {
    tone("square", 140, 90, t, 0.16, 0.22);
    noise(t, 0.1, 0.45, "lowpass", 700);
    noise(t + 0.12, 0.06, 0.2, "bandpass", 1800);
    noise(t + 0.2, 0.05, 0.15, "bandpass", 1600);
  });
}
// Coins dropping into your purse: a few bright clinks (n: how many, up to 6).
export function coins(n) {
  play(function (t) {
    for (var i = 0; i < Math.min(6, Math.max(1, n || 3)); i++) {
      var at = t + i * 0.07 + Math.random() * 0.02;
      tone("sine", 2600 + Math.random() * 900, 2500, at, 0.14, 0.1);
      tone("sine", 4100 + Math.random() * 600, 4000, at, 0.08, 0.04);
    }
  });
}
// Chompers' jaws (🐊 Big Bite), on a right comparison: two quick snaps with a crunch, the bigger
// number eaten. happy: a right "=", a light snap of the shut mouth and a little rising chirp.
export function chomp(happy) {
  play(function (t) {
    if (happy) {
      noise(t, 0.04, 0.3, "bandpass", 2200);
      tone("sine", 520, 780, t + 0.05, 0.12, 0.12);
      tone("sine", 780, 1170, t + 0.16, 0.14, 0.1);
      return;
    }
    [0, 0.11].forEach(function (d) {
      noise(t + d, 0.05, 0.4, "bandpass", 2400); // the teeth meeting
      tone("square", 220, 90, t + d, 0.07, 0.08);
    });
    noise(t + 0.13, 0.16, 0.35, "lowpass", 1400); // the crunch
    noise(t + 0.16, 0.1, 0.2, "bandpass", 3200);
  });
}
// Chompers' sad empty-jaw clack, on a wrong comparison: a hollow wooden clack, then a droop.
export function clack() {
  play(function (t) {
    noise(t, 0.035, 0.35, "bandpass", 1100);
    tone("triangle", 700, 500, t, 0.05, 0.12);
    noise(t + 0.12, 0.035, 0.25, "bandpass", 1000);
    tone("triangle", 600, 420, t + 0.12, 0.05, 0.1);
    tone("sine", 392, 262, t + 0.2, 0.28, 0.1);
  });
}
// Polly-Gon's squawk (🦜 Squawk Back), as its body flashes the shape: two quick, raspy parrot
// screeches, a wobbling saw tone through a nasal band, the second higher, and a flutter of wings.
export function squawk() {
  play(function (t) {
    [[0, 1400, 2300, 1100], [0.17, 1700, 2700, 1300]].forEach(function (s) {
      var at = t + s[0], o = ctx.createOscillator(), lfo = ctx.createOscillator(), dep = ctx.createGain(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(s[1], at);
      o.frequency.linearRampToValueAtTime(s[2], at + 0.05);
      o.frequency.exponentialRampToValueAtTime(s[3], at + 0.14);
      lfo.frequency.value = 55; dep.gain.value = 120; lfo.connect(dep).connect(o.frequency);
      f.type = "bandpass"; f.frequency.value = 2200; f.Q.value = 2.5;
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.22, at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.15);
      o.connect(f).connect(g).connect(out);
      o.start(at); lfo.start(at); o.stop(at + 0.2); lfo.stop(at + 0.2);
      noise(at, 0.06, 0.12, "highpass", 4000);
    });
    [0.32, 0.38, 0.44].forEach(function (d) { noise(t + d, 0.04, 0.1, "bandpass", 900); });
  });
}
// The Shield blocking a miss: Sir Fourtress's metal clang.
export function clang() { play(MOVE[4]); }
// An item used: a quick rising shimmer.
export function powerUp() {
  play(function (t) { [72, 76, 79, 84].forEach(function (m, i) { mallet(m, t + i * 0.05, 0.18, 0.3); }); noise(t, 0.3, 0.05, "highpass", 6000); });
}
