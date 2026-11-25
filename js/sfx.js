// Sound effects, synthesized with Web Audio (no files to load), patterned on
// sound-box-crosswords' chime.js. iOS only allows audio that starts from a tap, so the
// context is created on the first tap and woken on later taps if iOS paused it.

var ctx = null, out = null, on = true, noiseBuf = null, lastError = "", played = 0, gestures = 0;

// Safari can leave a context "suspended" or "interrupted" (macOS Safari after the tab was in the
// background or another app took the audio), and only resumes it inside a tap or click, so every
// gesture wakes it from anything but "running". A "closed" one is replaced.
function unlock() {
  gestures++;
  if (ctx && ctx.state === "closed") ctx = null;
  if (ctx) { if (ctx.state !== "running") { try { ctx.resume().catch(function (e) { lastError = "resume: " + e.message; }); } catch (e) { lastError = "resume: " + e.message; } } return; }
  try {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { lastError = "no Web Audio"; return; }
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

// The one Web Audio context, shared with the voice (speech.js plays its sprites on it): Safari
// handles one context far more reliably than two. null until the first tap.
export function audioContext() { return ctx; }

// For the ?audio readout.
export function status() {
  return { state: ctx ? ctx.state : "not created", rate: ctx ? ctx.sampleRate : 0, on: on, played: played, gestures: gestures, error: lastError };
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

// A floor cleared: a rising mallet jingle.
export function cleared() {
  play(function (t) { [72, 76, 79, 84].forEach(function (m, i) { mallet(m, t + i * 0.09, 0.3, 0.35); }); });
}

// The Sumgeon cleared: a short fanfare.
export function victory() {
  play(function (t) {
    [[72, 0], [76, 0.12], [79, 0.24], [84, 0.36], [79, 0.6], [84, 0.72]].forEach(function (n) { mallet(n[0], t + n[1], 0.3, 0.45); });
    [72, 76, 79, 84].forEach(function (m) { mallet(m, t + 0.9, 0.16, 1.2); });
  });
}
