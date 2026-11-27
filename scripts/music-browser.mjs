// The strata's background music (js/music.js), measured in a real browser (Chromium, muted), run
// by hand: Node has no Web Audio, so it isn't part of the check.
//   NODE_PATH=<a node_modules with playwright> node scripts/music-browser.mjs [port] [--seconds 30] [--seeds 1,2,3]
// Renders each stratum offline (an OfflineAudioContext, nothing is heard) at DEFAULT_LEVEL and
// checks it: not silent, the peak under −12 dBFS, the RMS near −30 dBFS (−36 to −26), no DC, no
// runaway (the last third no louder than the middle by more than 6 dB), and ducked about 10 dB.
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const { chromium } = createRequire(import.meta.url)("playwright");
const root = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2), opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const port = Number(args.find((a, i) => /^\d+$/.test(a) && !/^--/.test(args[i - 1] || ""))) || 8969;
const seconds = +opt("--seconds", 30), seeds = opt("--seeds", "1,2,3").split(",").map(Number);
const child = spawn(process.execPath, [join(root, "scripts/dev-server.mjs"), String(port)], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 700));
const browser = await chromium.launch({ args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"] });
let failed = false;
try {
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/review/index.html`);
  const db = (x) => (x > 0 ? 20 * Math.log10(x) : -Infinity);
  console.log(`${seconds} s each, at the default level, seeds ${seeds.join(", ")}`);
  for (const id of ["cellar", "hall", "mines", "tower"]) {
    for (const seed of seeds) {
      const m = await page.evaluate(async ({ id, seed, seconds }) => {
        const music = await import("/js/music.js");
        const rate = 44100, render = async (duckAt) => {
          const ctx = new OfflineAudioContext(2, rate * seconds, rate);
          const h = music.start(ctx, id, ctx.destination, { seed });
          if (duckAt != null) { ctx.suspend(duckAt).then(() => { h.duck(true); ctx.resume(); }); }
          const buf = await ctx.startRendering();
          return [buf.getChannelData(0), buf.getChannelData(1)];
        };
        const [L, R] = await render(null);
        const stats = (a, b, from, to) => {
          let sum = 0, peak = 0, dc = 0;
          for (let i = from; i < to; i++) { sum += a[i] * a[i] + b[i] * b[i]; peak = Math.max(peak, Math.abs(a[i]), Math.abs(b[i])); dc += a[i] + b[i]; }
          const n = (to - from) * 2;
          return { rms: Math.sqrt(sum / n), peak, dc: dc / n };
        };
        const n = L.length, s3 = Math.floor(n / 3);
        const all = stats(L, R, rate * 3, n), mid = stats(L, R, s3, 2 * s3), end = stats(L, R, 2 * s3, n);
        // The loudest second, after the fade in.
        let loud = 0;
        for (let i = rate * 3; i + rate <= n; i += rate / 2) loud = Math.max(loud, stats(L, R, i, i + rate).rms);
        // What a phone's small speaker plays: above about 200 Hz (two one-pole highpasses).
        const hi = (a) => { const o = new Float32Array(a.length), k = Math.exp(-2 * Math.PI * 200 / rate); let x1 = 0, y1 = 0, y2 = 0, z1 = 0; for (let i = 0; i < a.length; i++) { y1 = k * (y1 + a[i] - x1); x1 = a[i]; const y = k * (y2 + y1 - z1); z1 = y1; y2 = y; o[i] = y; } return o; };
        const phone = stats(hi(L), hi(R), rate * 3, n).rms;
        const [dL, dR] = await render(seconds / 2);
        const ducked = stats(dL, dR, Math.floor(n / 2) + rate, n).rms, before = stats(L, R, Math.floor(n / 2) + rate, n).rms;
        const events = music.plan(id, seed, seconds).length;
        return { phone, rms: all.rms, peak: all.peak, dc: all.dc, mid: mid.rms, end: end.rms, loud, duck: ducked / before, events };
      }, { id, seed, seconds });
      const line = `${id.padEnd(6)} seed ${seed}: peak ${db(m.peak).toFixed(1)} dBFS, RMS ${db(m.rms).toFixed(1)} dBFS (loudest second ${db(m.loud).toFixed(1)}, above 200 Hz ${db(m.phone).toFixed(1)}), DC ${m.dc.toExponential(1)}, last third ${(db(m.end) - db(m.mid)).toFixed(1)} dB vs the middle, ducked ${db(m.duck).toFixed(1)} dB, ${m.events} events`;
      const bad = [];
      if (!(m.rms > 0.003)) bad.push("silent");
      if (db(m.peak) > -12) bad.push("peak over −12 dBFS");
      if (db(m.rms) < -36 || db(m.rms) > -26) bad.push("RMS not near −30 dBFS");
      if (Math.abs(m.dc) > 1e-3) bad.push("DC");
      if (db(m.end) - db(m.mid) > 6) bad.push("getting louder (runaway?)");
      if (db(m.duck) > -7) bad.push("duck too shallow");
      console.log((bad.length ? "✗ " : "✓ ") + line + (bad.length ? "  ← " + bad.join(", ") : ""));
      if (bad.length) failed = true;
    }
  }
} finally {
  await browser.close();
  child.kill();
}
if (failed) process.exit(1);
