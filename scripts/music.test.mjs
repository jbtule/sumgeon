// The strata's background music (js/music.js): its plan (seeded, sparse, slowly varying, in key)
// and, on a stand-in AudioContext that records what's asked of it, that every event plays with
// sane values. How it sounds and how loud it is need a real browser: scripts/music-browser.mjs.
import assert from "node:assert/strict";
import { MUSIC, IDS, plan, start, rng, hz, DEFAULT_LEVEL, DUCK } from "../js/music.js";

assert.deepEqual(Object.keys(MUSIC), IDS, "one ambience per stratum");
assert.ok(DEFAULT_LEVEL > 0 && DEFAULT_LEVEL <= 1 && DUCK > 0 && DUCK < 0.5);

// The RNG: repeatable, and spread over [0, 1).
const a = rng(5), b = rng(5), xs = Array.from({ length: 2000 }, a);
assert.deepEqual(xs.slice(0, 20), Array.from({ length: 20 }, b));
assert.ok(xs.every((x) => x >= 0 && x < 1) && Math.abs(xs.reduce((s, x) => s + x, 0) / xs.length - 0.5) < 0.03);

const MIN = 600; // ten minutes
// Foreground events (heard as a sound of their own), and the most a minute each may have.
const BUSY = { drip: 18, box: 6, chord: 10, echo: 6, chime: 12, bell: 3, pulse: 26 };
for (const id of IDS) {
  const p = plan(id, 1, MIN);
  // Seeded: the same seed plays the same piece, another seed another.
  assert.deepEqual(p, plan(id, 1, MIN), `${id}: repeatable`);
  assert.notDeepEqual(p.map((e) => e.t), plan(id, 2, MIN).map((e) => e.t), `${id}: another seed varies`);
  assert.ok(p.every((e, i) => i === 0 || e.t >= p[i - 1].t), `${id}: in time order`);
  // Every kind of event in the stratum comes up, and keeps coming (nothing runs dry).
  for (const s of MUSIC[id].streams) {
    const ts = p.filter((e) => e.kind === s.kind).map((e) => e.t);
    assert.ok(ts.length >= 5, `${id}: ${s.kind} comes up`);
    assert.ok(ts[ts.length - 1] > MIN - 90, `${id}: ${s.kind} keeps coming`);
    const perMin = ts.length / (MIN / 60);
    if (BUSY[s.kind]) assert.ok(perMin <= BUSY[s.kind], `${id}: ${s.kind} ${perMin.toFixed(1)} a minute is too busy`);
  }
  // Calm: never more than a few foreground sounds starting within any 3 seconds.
  const fg = p.filter((e) => BUSY[e.kind] && e.kind !== "pulse").map((e) => e.t);
  for (let i = 0; i < fg.length; i++) assert.ok(fg.filter((t) => t >= fg[i] && t < fg[i] + 3).length <= 2, `${id}: too many sounds at ${fg[i].toFixed(1)} s`);
}
// In key: the music box in D major pentatonic, the crystals high, the chords' notes in F major.
const pc = (n) => ((n % 12) + 12) % 12;
const notes = (id, kind) => plan(id, 3, MIN).filter((e) => e.kind === kind).flatMap((e) => e.notes || [e.note]);
assert.ok(notes("cellar", "box").every((n) => [2, 4, 6, 9, 11].includes(pc(n))), "the music box is D pentatonic");
assert.ok(notes("hall", "chord").concat(notes("hall", "echo")).every((n) => [5, 7, 9, 10, 0, 2, 4].includes(pc(n))), "the Hall is in F");
assert.ok(notes("mines", "chime").every((n) => hz(n) > 1000), "crystal chimes are high");
// The Hall's chords come home: every phrase ends on I.
const chords = plan("hall", 4, MIN).filter((e) => e.kind === "chord");
assert.ok(chords.filter((c) => c.last).every((c) => c.chord === "I"));
// The Tower's pulse is steady.
const pulses = plan("tower", 1, 120).filter((e) => e.kind === "pulse").map((e) => e.t);
assert.ok(pulses.slice(1).every((t, i) => Math.abs(t - pulses[i] - 2.4) < 1e-9));

/* ---------- on a stand-in AudioContext ---------- */
function fakeContext(seconds) {
  const sampleRate = 44100, nodes = [], problems = [];
  const check = (what, v) => { if (!Number.isFinite(v)) problems.push(`${what} = ${v}`); };
  const param = (name) => ({
    value: 0,
    setValueAtTime(v, t) { check(name, v); check(name + " time", t); },
    linearRampToValueAtTime(v, t) { check(name, v); check(name + " time", t); },
    exponentialRampToValueAtTime(v, t) { check(name, v); if (!(v > 0)) problems.push(`${name} exponential to ${v}`); },
    setTargetAtTime(v, t, tau) { check(name, v); if (!(tau > 0)) problems.push(`${name} time constant ${tau}`); },
    cancelScheduledValues() {}
  });
  const node = (kind, params, extra) => {
    const n = Object.assign({ kind, connect: (d) => d, disconnect() {} }, extra);
    for (const p of params) n[p] = param(kind + "." + p);
    nodes.push(n);
    return n;
  };
  const source = (kind, params) => node(kind, params, {
    start(t) { this.started = t || 0; check(kind + " start", this.started); },
    stop(t) { this.stopped = t == null ? Infinity : t; if (t != null && t < this.started) problems.push(`${kind} stops before it starts`); }
  });
  return {
    sampleRate, currentTime: 0, length: sampleRate * seconds, destination: node("destination", []), nodes, problems,
    createOscillator: () => source("osc", ["frequency", "detune"]),
    createBufferSource: () => source("buffer", ["playbackRate"]),
    createGain: () => node("gain", ["gain"]),
    createBiquadFilter: () => node("filter", ["frequency", "Q", "gain"]),
    createDelay: () => node("delay", ["delayTime"]),
    createStereoPanner: () => node("pan", ["pan"]),
    createConvolver: () => node("convolver", []),
    createBuffer: (ch, n, sr) => { const d = Array.from({ length: ch }, () => new Float32Array(n)); return { numberOfChannels: ch, length: n, sampleRate: sr, getChannelData: (c) => d[c] }; }
  };
}
for (const id of IDS) {
  const seen = [], ctx = fakeContext(120);
  const h = start(ctx, id, ctx.destination, { seed: 1, onEvent: (ev) => seen.push(ev.kind) });
  assert.deepEqual(ctx.problems, [], `${id}: bad values`);
  assert.deepEqual([...new Set(seen)].sort(), MUSIC[id].streams.map((s) => s.kind).sort(), `${id}: every kind of event plays`);
  assert.equal(seen.length, plan(id, 1, 120).length, `${id}: the whole plan is scheduled offline`);
  const oscs = ctx.nodes.filter((n) => n.kind === "osc");
  assert.ok(oscs.every((o) => o.frequency.value < ctx.sampleRate / 2), `${id}: under Nyquist`);
  // Events' sounds end; only the bed runs on (until stop).
  const open = ctx.nodes.filter((n) => (n.kind === "osc" || n.kind === "buffer") && n.started != null && n.stopped == null);
  assert.ok(open.length <= 8, `${id}: ${open.length} sounds left running`);
  assert.equal(typeof h.stop, "function"); assert.equal(typeof h.duck, "function"); assert.equal(typeof h.setLevel, "function");
  h.setLevel(0.3); h.duck(true); h.duck(false);
  assert.deepEqual(ctx.problems, [], `${id}: bad values after level and duck`);
}
assert.throws(() => plan("attic", 1, 10));

console.log("✓ music: plans seeded, sparse and in key; every event plays");
