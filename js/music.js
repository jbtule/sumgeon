// Background music: a quiet, generative ambience for each stratum, synthesized with Web Audio
// (no files, no samples), like sfx.js. Not in the game yet: review/music/ auditions it first.
//
// Each stratum is a soft bed that never stops (a drone, air, a hum, wind) under sparse events
// on a slow random schedule (a drip, a music-box note, a chord, a chime, a bell), drawn from a
// seeded RNG, so the same seed always plays the same piece and a review is repeatable. Nothing
// loops: the events and the bed's slow drifts keep coming from the RNG for as long as it plays.
//
//   plan(id, seed, seconds)  the events, in time order (pure: no audio; scripts/music.test.mjs)
//   start(ctx, id, dest, { seed, level, fadeIn, onEvent })  plays it into dest (an AudioNode);
//     returns { stop(fadeMs), setLevel(v), duck(on), id, seed }. On an OfflineAudioContext
//     every event for its length is scheduled at once (for measuring); on a live one a timer
//     schedules a few seconds ahead.
//
// The level is 0–1 (DEFAULT_LEVEL is the one proposed for the game); each stratum has its own
// trim so they come out about as loud as each other: at DEFAULT_LEVEL, peaks under −12 dBFS
// and RMS around −30 dBFS (measured by scripts/music-browser.mjs). duck(true) drops it about
// 10 dB, for the voice.

export const DEFAULT_LEVEL = 0.5;
export const DUCK = 0.32; // about −10 dB under a voice
export const IDS = ["cellar", "hall", "mines", "tower"];

// A small seeded RNG (mulberry32): r() is in [0, 1).
export function rng(seed) {
  var a = (seed >>> 0) || 1;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
var between = function (r, a, b) { return a + (b - a) * r(); };
var pick = function (r, list) { return list[Math.floor(r() * list.length)]; };
export function hz(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

// Notes (MIDI). D major pentatonic for the Cellar's music box, E Lydian-ish high for the Mines'
// crystals; the Hall's chords are in F, voiced low and close.
var BOX = [74, 76, 78, 81, 83, 86];
var CRYSTAL = [88, 90, 92, 95, 97, 100];
var HALL_CHORDS = { I: [53, 60, 65, 69], ii: [55, 62, 65, 67], IV: [53, 58, 62, 65], V: [55, 60, 62, 67], vi: [50, 57, 62, 65] };
var PROGRESSIONS = [["I", "IV", "I"], ["I", "vi", "IV", "V", "I"], ["I", "IV", "V", "I"], ["vi", "IV", "V", "I"], ["I", "ii", "V", "I"]];
var HALL_ECHO = [72, 74, 77, 79, 81];

// What each stratum is: its events (streams, each with its own RNG, so a new stream doesn't
// reshuffle the others), how long its reverb rings, and its trim. `first` is when a stream's
// first event comes, `gap` the seconds to the next (a range, or a function of the event).
export const MUSIC = {
  cellar: {
    name: "The Counting Cellar", trim: 0.95, verb: 2.4,
    about: "A warm low drone (D and A, a slowly breathing filter), a soft water drip now and then, and a rare music-box phrase of one to three notes (D major pentatonic).",
    streams: [
      { kind: "drift", first: [0, 0], gap: [8, 16], make: function (r) { return { cut: between(r, 380, 720) }; } },
      { kind: "drip", first: [2, 6], gap: [3.5, 11], make: function (r) { return { f: between(r, 1100, 2100), double: r() < 0.25, pan: between(r, -0.6, 0.6), level: between(r, 0.5, 1) }; } },
      { kind: "box", first: [7, 13], gap: [13, 28], make: function (r) {
        var n = 1 + Math.floor(r() * 3), i = Math.floor(r() * BOX.length), notes = [];
        for (var k = 0; k < n; k++) { notes.push(BOX[i]); i = Math.max(0, Math.min(BOX.length - 1, i + pick(r, [-2, -1, 1, 2]))); }
        return { notes: notes, step: between(r, 0.45, 0.8), pan: between(r, -0.4, 0.4), level: between(r, 0.7, 1) };
      } }
    ]
  },
  hall: {
    name: "The Balance Hall", trim: 1.6, verb: 4,
    about: "Airy: a soft warm pad that swells and dims, and slow consonant chords in F that walk away and come home (I–IV–V–I and friends), through a long echo and a big room, with a rest between phrases. Now and then one high note echoes away.",
    streams: [
      { kind: "air", first: [0, 0], gap: [10, 18], make: function (r) { return { cut: between(r, 900, 2200), level: between(r, 0.6, 1) }; } },
      { kind: "chord", first: [0.5, 1.5], gap: function (r, ev) { return ev.dur * 0.85 + (ev.last ? between(r, 6, 12) : 0); }, state: function () { return { prog: null, i: 0 }; },
        make: function (r, s) {
          if (!s.prog || s.i >= s.prog.length) { s.prog = pick(r, PROGRESSIONS); s.i = 0; }
          var name = s.prog[s.i++];
          return { chord: name, notes: HALL_CHORDS[name], dur: between(r, 7, 10), last: s.i >= s.prog.length, level: between(r, 0.8, 1) };
        } },
      { kind: "echo", first: [10, 18], gap: [12, 24], make: function (r) { return { note: pick(r, HALL_ECHO), pan: between(r, -0.5, 0.5), level: between(r, 0.6, 1) }; } }
    ]
  },
  mines: {
    name: "The Crystal Mines", trim: 0.7, verb: 5,
    about: "A deep hum (A, with a slow beat in it), a faint high shimmer that comes and goes, and sparse crystal chimes, one to four glassy notes, high, ringing a long time in a big cave.",
    streams: [
      { kind: "hum", first: [0, 0], gap: [12, 20], make: function (r) { return { cut: between(r, 320, 620) }; } },
      { kind: "shimmer", first: [0, 0], gap: [6, 14], make: function (r) { return { level: between(r, 0, 1) }; } },
      { kind: "chime", first: [3, 7], gap: [5, 13], make: function (r) {
        var n = 1 + Math.floor(r() * r() * 4), notes = [];
        for (var k = 0; k < n; k++) notes.push(pick(r, CRYSTAL));
        return { notes: notes, step: between(r, 0.12, 0.35), pan: between(r, -0.7, 0.7), level: between(r, 0.5, 1) };
      } }
    ]
  },
  tower: {
    name: "The Tables Tower", trim: 3.4, verb: 3.5,
    about: "Stone and wind: a hollow low tone that rises and falls in slow gusts, a low hum, a calm steady low pulse (about 25 a minute, E with a lower B every eighth), and a slow distant bell now and then.",
    streams: [
      { kind: "gust", first: [0, 0], gap: [5, 12], make: function (r) { return { cut: between(r, 300, 1100), level: between(r, 0.35, 1), q: between(r, 0.6, 1.4), pan: between(r, -0.5, 0.5) }; } },
      { kind: "pulse", first: [1, 1], gap: [2.4, 2.4], state: function () { return { n: 0 }; }, make: function (r, s) { return { low: s.n++ % 8 === 7, level: between(r, 0.85, 1) }; } },
      { kind: "bell", first: [8, 14], gap: [22, 40], make: function (r) { return { note: pick(r, [55, 50, 52]), level: between(r, 0.7, 1), pan: between(r, -0.3, 0.3) }; } }
    ]
  }
};

// The streams of a stratum, ready to step: each { def, r, s, next }.
// Accents only (the user's pick, 2026-11-27): the little sounds, drips, music-box notes, crystal
// chimes, bells, with no drone, pad, wind, pulse or chords under them. Each stratum's accent kinds,
// with a closer gap where they'd otherwise be too sparse alone.
export var ACCENTS = {
  cellar: { drip: null, box: [9, 18] },
  hall: { echo: [5, 11] },
  mines: { chime: null },
  tower: { bell: [9, 17] }
};
function streamsOf(id, seed, accents) {
  var m = MUSIC[id], acc = accents ? ACCENTS[id] : null;
  if (!m) throw new Error("music: no stratum " + id);
  return m.streams.map(function (def, i) {
    var r = rng(((seed >>> 0) * 7919 + (i + 1) * 104729 + IDS.indexOf(id) * 15485863) >>> 0);
    if (acc && acc[def.kind]) def = Object.assign({}, def, { gap: acc[def.kind] });
    return { def: def, r: r, s: def.state ? def.state() : null, next: between(r, def.first[0], def.first[1]) };
  }).filter(function (st) { return !acc || st.def.kind in acc; });
}
// The next event of a stream, and moves it on.
function step(st) {
  var ev = st.def.make(st.r, st.s);
  ev.kind = st.def.kind; ev.t = st.next;
  var g = st.def.gap;
  st.next += typeof g === "function" ? g(st.r, ev) : between(st.r, g[0], g[1]);
  return ev;
}

// Every event in the first `seconds`, in time order (no audio).
export function plan(id, seed, seconds, accents) {
  var out = [];
  streamsOf(id, seed == null ? 1 : seed, accents).forEach(function (st) { while (st.next < seconds) out.push(step(st)); });
  return out.sort(function (a, b) { return a.t - b.t; });
}

/* ---------- sound ---------- */

// Seeded noise, looped for beds and wind; slightly darkened (a one-pole lowpass).
function noiseBuffer(ctx, r, seconds, dark) {
  var n = Math.floor(ctx.sampleRate * seconds), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0), y = 0;
  for (var i = 0; i < n; i++) { y += (r() * 2 - 1 - y) * (1 - dark); d[i] = y; }
  var peak = 0;
  for (i = 0; i < n; i++) peak = Math.max(peak, Math.abs(d[i]));
  for (i = 0; i < n; i++) d[i] /= peak || 1;
  return b;
}
// A room: a stereo impulse of decaying, darkening noise (the ConvolverNode normalizes it).
function impulse(ctx, r, seconds) {
  var n = Math.floor(ctx.sampleRate * seconds), b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (var c = 0; c < 2; c++) {
    var d = b.getChannelData(c), y = 0;
    for (var i = 0; i < n; i++) {
      var k = i / n, dark = 0.2 + 0.75 * k; // the tail loses its highs
      y += (r() * 2 - 1 - y) * (1 - dark);
      d[i] = y * Math.pow(1 - k, 2.2) * (i < ctx.sampleRate * 0.012 ? i / (ctx.sampleRate * 0.012) : 1);
    }
  }
  return b;
}
// A panned input into the dry bus, with `send` of it to the reverb.
function panIn(ctx, bus, pan, send) {
  var p = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain(), s = ctx.createGain();
  if (p.pan) p.pan.value = pan || 0;
  s.gain.value = send;
  p.connect(bus.dry); p.connect(s); s.connect(bus.send);
  return p;
}
// One partial: an oscillator with a quick attack and a decay to silence over `decay` seconds.
function partial(ctx, dest, t, f, level, attack, decay, type) {
  var o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type || "sine"; o.frequency.value = f;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(level, t + attack);
  g.gain.setTargetAtTime(0, t + attack, decay / 6.9);
  o.connect(g); g.connect(dest);
  o.start(t); o.stop(t + attack + decay + 0.1);
  return o;
}
// A struck note made of partials: [[ratio, amp, decay multiplier]].
function struck(ctx, dest, t, f, level, decay, parts) {
  parts.forEach(function (p) { if (f * p[0] < ctx.sampleRate / 2.2) partial(ctx, dest, t, f * p[0], level * p[1], 0.004, decay * p[2]); });
}
// A continuous voice of the bed: kept to stop later.
function osc(ctx, bed, type, f, dest, detune) {
  var o = ctx.createOscillator();
  o.type = type; o.frequency.value = f; if (detune) o.detune.value = detune;
  o.connect(dest); o.start(); bed.push(o);
  return o;
}
function loop(ctx, bed, buf, dest) {
  var s = ctx.createBufferSource();
  s.buffer = buf; s.loop = true; s.connect(dest); s.start(); bed.push(s);
  return s;
}
function lowpass(ctx, f, q) { var b = ctx.createBiquadFilter(); b.type = "lowpass"; b.frequency.value = f; b.Q.value = q || 0.5; return b; }

// Each stratum's bed (built once) and its events (played at time t).
var SOUND = {
  cellar: function (ctx, bus, r, bed) {
    var f = lowpass(ctx, 520, 0.6), g = ctx.createGain();
    g.gain.value = 0.09;
    osc(ctx, bed, "sawtooth", hz(38), f); osc(ctx, bed, "sawtooth", hz(38), f, 7); osc(ctx, bed, "sawtooth", hz(45), f, -4);
    osc(ctx, bed, "sine", hz(50), f);
    f.connect(g); g.connect(panIn(ctx, bus, 0, 0.25));
    return {
      drift: function (ev, t) { f.frequency.setTargetAtTime(ev.cut, t, 3); },
      drip: function (ev, t) {
        var p = panIn(ctx, bus, ev.pan, 1.4), lv = 0.11 * ev.level;
        [[0, ev.f, lv], ev.double ? [0.11, ev.f * 1.25, lv * 0.55] : null].forEach(function (d) {
          if (!d) return;
          var o = ctx.createOscillator(), e = ctx.createGain(), at = t + d[0];
          o.frequency.setValueAtTime(d[1], at); o.frequency.exponentialRampToValueAtTime(d[1] * 1.9, at + 0.05);
          e.gain.setValueAtTime(0, at); e.gain.linearRampToValueAtTime(d[2], at + 0.003); e.gain.setTargetAtTime(0, at + 0.003, 0.025);
          o.connect(e); e.connect(p); o.start(at); o.stop(at + 0.3);
        });
      },
      box: function (ev, t) {
        var p = panIn(ctx, bus, ev.pan, 0.9);
        ev.notes.forEach(function (n, i) { struck(ctx, p, t + i * ev.step, hz(n), 0.05 * ev.level, 1.9, [[1, 1, 1], [3, 0.16, 0.35], [5.4, 0.05, 0.2]]); });
      }
    };
  },
  hall: function (ctx, bus, r, bed) {
    // A long, soft echo (a feedback delay, darkened each time round) in front of the reverb.
    var dl = ctx.createDelay(2), fb = ctx.createGain(), tone = lowpass(ctx, 2400), wet = ctx.createGain();
    dl.delayTime.value = 0.48; fb.gain.value = 0.38; wet.gain.value = 0.5;
    dl.connect(tone); tone.connect(fb); fb.connect(dl); tone.connect(wet); wet.connect(bus.send); wet.connect(bus.dry);
    var echoIn = function (pan, amt) { var p = panIn(ctx, bus, pan, 0.8), s = ctx.createGain(); s.gain.value = amt; p.connect(s); s.connect(dl); return p; };
    // The air: a soft pad, F and C, low and warm, that swells and dims (it was filtered noise, which
    // the kids heard as rain).
    var bp = lowpass(ctx, 700, 0.3), ag = ctx.createGain();
    ag.gain.value = 0.02;
    osc(ctx, bed, "triangle", hz(41), bp); osc(ctx, bed, "sine", hz(48), bp, 4); osc(ctx, bed, "sine", hz(53), bp, -5);
    bp.connect(ag); ag.connect(panIn(ctx, bus, 0, 0.5));
    return {
      air: function (ev, t) { bp.frequency.setTargetAtTime(ev.cut * 0.45, t, 4); ag.gain.setTargetAtTime(0.02 * ev.level, t, 4); },
      chord: function (ev, t) {
        var p = echoIn(0, 0.35), f = lowpass(ctx, 1300, 0.4), g = ctx.createGain(), lv = 0.022 * ev.level, att = ev.dur * 0.35, rel = 3.5;
        f.connect(g); g.connect(p);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lv, t + att);
        g.gain.setValueAtTime(lv, t + ev.dur - 0.01); g.gain.setTargetAtTime(0, t + ev.dur, rel / 5);
        ev.notes.forEach(function (n, i) {
          [["triangle", 0], ["sine", 5]].forEach(function (v) {
            var o = ctx.createOscillator();
            o.type = v[0]; o.frequency.value = hz(n); o.detune.value = v[1] * (i % 2 ? 1 : -1);
            o.connect(f); o.start(t); o.stop(t + ev.dur + rel + 0.5);
          });
        });
      },
      echo: function (ev, t) {
        var p = echoIn(ev.pan, 0.9);
        struck(ctx, p, t, hz(ev.note), 0.03 * ev.level, 2.6, [[1, 1, 1], [2, 0.2, 0.5], [3, 0.06, 0.3]]);
      }
    };
  },
  mines: function (ctx, bus, r, bed) {
    var f = lowpass(ctx, 420, 0.7), g = ctx.createGain();
    g.gain.value = 0.08;
    osc(ctx, bed, "sine", hz(33), f); osc(ctx, bed, "triangle", hz(45), f); osc(ctx, bed, "triangle", hz(45) + 0.35, f); osc(ctx, bed, "sine", hz(52), f);
    f.connect(g); g.connect(panIn(ctx, bus, 0, 0.2));
    // The shimmer: two high sines a little apart (a slow beat), under a slow swell.
    var sh = ctx.createGain(), sp = panIn(ctx, bus, 0, 1.2);
    sh.gain.value = 0;
    osc(ctx, bed, "sine", hz(88), sh); osc(ctx, bed, "sine", hz(88) * 1.0015, sh); osc(ctx, bed, "sine", hz(95), sh, 3);
    sh.connect(sp);
    return {
      hum: function (ev, t) { f.frequency.setTargetAtTime(ev.cut, t, 4); },
      shimmer: function (ev, t) { sh.gain.setTargetAtTime(0.006 * ev.level, t, 2.5); },
      chime: function (ev, t) {
        var p = panIn(ctx, bus, ev.pan, 1.3);
        ev.notes.forEach(function (n, i) { struck(ctx, p, t + i * ev.step, hz(n), 0.04 * ev.level, 3.4, [[1, 1, 1], [2.76, 0.45, 0.6], [5.4, 0.2, 0.35], [8.93, 0.08, 0.2]]); });
      }
    };
  },
  tower: function (ctx, bus, r, bed) {
    // The wind: a hollow tone (E and B, slightly apart so it breathes) that rises and falls and drifts
    // side to side in gusts. It was filtered noise, which the kids heard as rain.
    var bp = lowpass(ctx, 600, 0.7), wg = ctx.createGain(), wp = panIn(ctx, bus, 0, 0.6);
    wg.gain.value = 0.01;
    osc(ctx, bed, "sine", hz(52), bp); osc(ctx, bed, "sine", hz(59), bp, 6); osc(ctx, bed, "triangle", hz(64), bp, -7);
    bp.connect(wg); wg.connect(wp);
    // Stone: a very low hum under the wind.
    var lp = lowpass(ctx, 140, 0.5), rg = ctx.createGain();
    rg.gain.value = 0.016;
    osc(ctx, bed, "sine", hz(28), lp); osc(ctx, bed, "sine", hz(40), lp, 3);
    lp.connect(rg); rg.connect(panIn(ctx, bus, 0, 0.1));
    var pulseIn = panIn(ctx, bus, 0, 0.3);
    return {
      gust: function (ev, t) {
        bp.frequency.setTargetAtTime(ev.cut, t, 2.5); bp.Q.setTargetAtTime(ev.q, t, 3);
        wg.gain.setTargetAtTime(0.01 * ev.level, t, 2.2);
        if (wp.pan) wp.pan.setTargetAtTime(ev.pan, t, 4);
      },
      pulse: function (ev, t) {
        var f = hz(ev.low ? 35 : 40), lp2 = lowpass(ctx, 420, 0.4);
        lp2.connect(pulseIn);
        var o = ctx.createOscillator(), g = ctx.createGain(), lv = 0.13 * ev.level;
        o.type = "triangle"; o.frequency.setValueAtTime(f * 1.04, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.12);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lv, t + 0.04); g.gain.setTargetAtTime(0, t + 0.04, 0.16);
        o.connect(g); g.connect(lp2); o.start(t); o.stop(t + 1.4);
      },
      bell: function (ev, t) {
        var far = lowpass(ctx, 1700, 0.5); // far away: its highs gone
        far.connect(panIn(ctx, bus, ev.pan, 2.2));
        struck(ctx, far, t, hz(ev.note), 0.03 * ev.level, 7, [[0.5, 0.5, 1.2], [1, 0.9, 1], [1.19, 0.45, 0.7], [1.5, 0.3, 0.6], [2, 0.5, 0.5], [2.5, 0.18, 0.35], [3, 0.12, 0.3]]);
      }
    };
  }
};

// Plays a stratum's ambience into dest. opts: seed (1), level (DEFAULT_LEVEL), fadeIn (ms,
// 2500), onEvent(ev, t) as each event is scheduled (the review page shows them).
export function start(ctx, id, dest, opts) {
  opts = opts || {};
  var m = MUSIC[id], seed = opts.seed == null ? 1 : opts.seed;
  if (!m) throw new Error("music: no stratum " + id);
  var r = rng(seed * 31 + 7), now = ctx.currentTime;
  var levelG = ctx.createGain(), duckG = ctx.createGain(), fadeG = ctx.createGain(), hp = ctx.createBiquadFilter();
  // A gentle highpass at the end: nothing under 30 Hz (no DC, no rumble a speaker can't play).
  hp.type = "highpass"; hp.frequency.value = 30; hp.Q.value = 0.5;
  levelG.gain.value = (opts.level == null ? DEFAULT_LEVEL : opts.level) * m.trim;
  duckG.gain.value = 1;
  fadeG.gain.setValueAtTime(0, now);
  fadeG.gain.linearRampToValueAtTime(1, now + (opts.fadeIn == null ? 2500 : opts.fadeIn) / 1000);
  levelG.connect(duckG); duckG.connect(fadeG); fadeG.connect(hp); hp.connect(dest || ctx.destination);
  var verb = ctx.createConvolver(), vg = ctx.createGain();
  verb.buffer = impulse(ctx, r, m.verb); vg.gain.value = 0.5;
  var bus = { dry: ctx.createGain(), send: ctx.createGain() };
  bus.dry.connect(levelG); bus.send.connect(verb); verb.connect(vg); vg.connect(levelG);
  var bed = [], sound = SOUND[id](ctx, bus, r, bed);
  // Accents only: the always-on bed (drones, pad, wind, hum) is silenced at once.
  if (opts.accents) bed.forEach(function (n) { try { n.stop(); } catch (e) { /* already */ } });
  var streams = streamsOf(id, seed, !!opts.accents), t0 = now + 0.05, timer = null, stopped = false;
  function pump(until) {
    var late = ctx.currentTime - t0;
    streams.forEach(function (st) {
      while (st.next < until) {
        var ev = step(st);
        if (ev.t < late - 0.05) continue; // fell behind (a throttled timer): skip, don't pile up
        sound[ev.kind](ev, t0 + Math.max(ev.t, late));
        if (opts.onEvent) opts.onEvent(ev, t0 + ev.t);
      }
    });
  }
  var offline = typeof ctx.length === "number"; // an OfflineAudioContext: all of it at once
  if (offline) pump(ctx.length / ctx.sampleRate);
  else { pump(6); timer = setInterval(function () { if (!stopped) pump(ctx.currentTime - t0 + 6); }, 1000); }
  return {
    id: id, seed: seed,
    setLevel: function (v) { levelG.gain.setTargetAtTime(Math.max(0, v) * m.trim, ctx.currentTime, 0.08); },
    duck: function (on) { duckG.gain.setTargetAtTime(on ? DUCK : 1, ctx.currentTime, on ? 0.08 : 0.35); },
    stop: function (fadeMs) {
      if (stopped) return Promise.resolve();
      stopped = true; clearInterval(timer);
      var t = ctx.currentTime, s = (fadeMs == null ? 1500 : fadeMs) / 1000;
      fadeG.gain.cancelScheduledValues(t); fadeG.gain.setValueAtTime(fadeG.gain.value, t); fadeG.gain.linearRampToValueAtTime(0, t + s);
      return new Promise(function (done) {
        setTimeout(function () {
          bed.forEach(function (n) { try { n.stop(); } catch (e) { /* already stopped */ } });
          try { hp.disconnect(); } catch (e) { /* gone */ }
          done();
        }, s * 1000 + 100);
      });
    }
  };
}
